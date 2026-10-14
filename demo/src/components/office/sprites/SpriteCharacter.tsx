"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, useTexture } from "@react-three/drei";
import type { Facing } from "../world/map";

const FACING_ROW: Record<Facing, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

const COLS = 3;
const ROWS = 4;

/** Seconds per walk-cycle frame, unchanged. */
const FRAME_TIME = 0.14;
/** Bob divisors in milliseconds, so `elapsed / DIVISOR` keeps the old period. */
const WALK_BOB_MS = 90;
const IDLE_BOB_MS = 500;

/**
 * Geometry and cell-texture pools, keyed by the values that define them.
 *
 * Two characters with the same scale are byte-identical in all three meshes, so
 * the old code uploaded three VBOs per character for no reason. R3F only
 * disposes objects it created itself, so entries passed in as `geometry=` /
 * `material=` props outlive a remount and the next room re-uses them instead of
 * re-uploading. The pools are bounded by the distinct scales and the 3x4 cells
 * a sheet actually addresses, not by how many avatars are on screen.
 */
const planeGeometries = new Map<string, THREE.PlaneGeometry>();

function planeGeometry(w: number, h: number) {
  const key = `${w}|${h}`;
  let geometry = planeGeometries.get(key);
  if (!geometry) {
    geometry = new THREE.PlaneGeometry(w, h);
    planeGeometries.set(key, geometry);
  }
  return geometry;
}

const circleGeometries = new Map<string, THREE.CircleGeometry>();

function circleGeometry(radius: number, segments: number) {
  const key = `${radius}|${segments}`;
  let geometry = circleGeometries.get(key);
  if (!geometry) {
    geometry = new THREE.CircleGeometry(radius, segments);
    circleGeometries.set(key, geometry);
  }
  return geometry;
}

/** Same shadow for every character at every scale, bar the radius. */
const SHADOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#0b1f12",
  transparent: true,
  opacity: 0.28,
});

/** The alert pip is always this square. */
const ALERT_GEOMETRY = new THREE.PlaneGeometry(0.32, 0.32);
const ALERT_MATERIAL = new THREE.MeshBasicMaterial({ color: "#ffd24a" });

/**
 * One cell texture per (sheet, frame, facing row) instead of one clone per
 * character. Held off the sheet texture in a `WeakMap`, and the offset is
 * written once at creation: swapping `material.map` to a different cell is
 * consumed by the same `refreshUniformsCommon` call that used to read the
 * mutated `offset`, so the visible result is the same with no per-frame
 * texture writes at all.
 */
const cellCache = new WeakMap<THREE.Texture, Map<number, THREE.Texture>>();

function characterCell(atlas: THREE.Texture, frame: number, row: number) {
  let byKey = cellCache.get(atlas);
  if (!byKey) {
    byKey = new Map();
    cellCache.set(atlas, byKey);
  }
  const key = frame * ROWS + row;
  let cell = byKey.get(key);
  if (!cell) {
    cell = atlas.clone();
    cell.repeat.set(1 / COLS, 1 / ROWS);
    cell.offset.set(frame / COLS, 1 - (row + 1) / ROWS);
    cell.magFilter = THREE.NearestFilter;
    cell.minFilter = THREE.NearestFilter;
    cell.generateMipmaps = false;
    // Set explicitly rather than inherited: the clone is created lazily, and
    // the sheet's colour space is assigned during render.
    cell.colorSpace = THREE.SRGBColorSpace;
    cell.needsUpdate = true;
    byKey.set(key, cell);
  }
  return cell;
}

export function SpriteCharacter({
  url,
  facing = "down",
  walking = false,
  position,
  scale = 1.15,
  showAlert = false,
}: {
  url: string;
  facing?: Facing;
  walking?: boolean;
  position: [number, number, number];
  scale?: number;
  showAlert?: boolean;
}) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;

  const w = 0.72 * scale;
  const h = 1.08 * scale;

  /**
   * Any cell will do as the starting map: `useFrame` rebinds the right one
   * before the first draw, and all the material needs here is a non-null map so
   * `USE_MAP` is compiled into the program.
   */
  const initialCell = characterCell(tex, 1, FACING_ROW.down);

  /**
   * The body material stays per-character and stays a JSX child, so R3F owns
   * its lifetime as before. It cannot be pooled: every avatar shows a different
   * cell at any moment, and three only re-uploads material uniforms when the
   * bound material id changes, so a shared material would pin one avatar's cell
   * to whoever drew after it. The pooled cell textures behind it are shared.
   */
  const body = useRef<THREE.MeshBasicMaterial>(null);

  const frame = useRef(1);
  const accum = useRef(0);
  const bobY = useRef(0);
  const elapsed = useRef(0);
  const root = useRef<THREE.Group>(null);
  const cellKey = useRef(-1);
  const cell = useRef<THREE.Texture>(initialCell);
  const facingRef = useRef(facing);
  const walkingRef = useRef(walking);
  facingRef.current = facing;
  walkingRef.current = walking;

  useFrame((_, dt) => {
    // Accumulated rather than read from the clock: the old code called
    // `performance.now()` every frame per character just to phase a sine wave,
    // and every character got a different phase. One add keeps the period.
    const ms = (elapsed.current += dt * 1000);

    if (walkingRef.current) {
      accum.current += dt;
      if (accum.current > FRAME_TIME) {
        accum.current = 0;
        frame.current = (frame.current + 1) % COLS;
      }
      bobY.current = Math.sin(ms / WALK_BOB_MS) * 0.03;
    } else {
      frame.current = 1;
      bobY.current = Math.sin(ms / IDLE_BOB_MS) * 0.015;
    }

    const row = FACING_ROW[facingRef.current];
    const key = frame.current * ROWS + row;
    // Idle characters used to rewrite this offset 60 times a second to write
    // the same two numbers, so the cell is only looked up when it changes.
    if (key !== cellKey.current) {
      cellKey.current = key;
      cell.current = characterCell(tex, frame.current, row);
    }
    // Identity check rather than trusting the bookkeeping above: a React
    // re-render re-applies the `map` prop, which would otherwise leave a
    // walking character stuck on the idle cell until its next step.
    if (body.current && body.current.map !== cell.current) {
      body.current.map = cell.current;
    }
    if (root.current) root.current.position.y = bobY.current;
  });

  return (
    <group position={position}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0.04]}
        geometry={circleGeometry(0.28 * scale, 16)}
        material={SHADOW_MATERIAL}
      />
      <group ref={root}>
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, h / 2, 0]} geometry={planeGeometry(w, h)}>
            <meshBasicMaterial
              ref={body}
              map={initialCell}
              transparent
              alphaTest={0.45}
            />
          </mesh>
          {showAlert && (
            <mesh
              position={[0.15, h + 0.2, 0.05]}
              geometry={ALERT_GEOMETRY}
              material={ALERT_MATERIAL}
            />
          )}
        </Billboard>
      </group>
    </group>
  );
}