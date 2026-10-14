"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Billboard, useTexture } from "@react-three/drei";
import { atlasCell } from "./atlas";

/**
 * Billboarded furniture sprites for the workshop and lounge.
 *
 * Same rendering approach as the office's `world/Props.tsx` — a camera-facing
 * plane over an atlas cell with `alphaTest` — because that flat cut-out look is
 * what ties the three rooms together. The only difference is the pipeline
 * now trims each generated prop to its content and anchors it to the bottom of
 * its frame, so `y` here means "ground contact point" and every prop stands on
 * the floor without per-prop fudge factors.
 *
 * Props are static: once mounted, a placement's geometry, cell and material are
 * never touched again. Everything that defines them is therefore pooled below
 * and keyed by the values it was built from, instead of being rebuilt per
 * placement. A room used to allocate 2 geometries + 1 texture clone + 2
 * materials per prop (22 / 42 of those in the lounge / workshop), and each
 * clone's `needsUpdate` re-uploaded the whole atlas to the GPU. Now a room
 * allocates one set per *distinct* size and cell, and nothing at all on a
 * remount.
 */

export type PropPlacement = {
  /** Cell index into the atlas. */
  index: number;
  x: number;
  z: number;
  /** Plane size in world units; the frame is square. */
  scale?: number;
  /** Ground offset. 0 puts the sprite's base on the floor. */
  y?: number;
};

/**
 * Pools below are handed to R3F as `<primitive>`-free props (`geometry=`,
 * `material=`) rather than JSX children. R3F only disposes objects it created
 * itself, so pooled entries are never torn down when a room unmounts — they
 * are reused by the next mount instead. Every key is derived from the geometry
 * args or the cell coordinates the rooms actually use, so the pools are bounded
 * by the content of a room rather than by how often it is visited.
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

/** The contact shadow is identical for every prop in every room. */
const SHADOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#0b1f12",
  transparent: true,
  opacity: 0.26,
  depthWrite: false,
});

type PropCell = {
  map: THREE.Texture;
  material: THREE.MeshBasicMaterial;
};

/**
 * One entry per (atlas, cell, alphaTest). Keyed off the atlas texture itself so
 * a new load cannot read a stale cell, and held in a `WeakMap` so the entries
 * go away with the atlas they were cut from.
 */
const cellCache = new WeakMap<THREE.Texture, Map<string, PropCell>>();

function propCell(
  atlas: THREE.Texture,
  cols: number,
  rows: number,
  index: number,
  alphaTest: number,
): PropCell {
  let byKey = cellCache.get(atlas);
  if (!byKey) {
    byKey = new Map();
    cellCache.set(atlas, byKey);
  }
  const key = `${cols}|${rows}|${index}|${alphaTest}`;
  const hit = byKey.get(key);
  if (hit) return hit;

  const map = atlasCell(atlas, cols, rows, index);
  const cell: PropCell = {
    map,
    // Sharing the material with the texture is safe here: every mesh that uses
    // it wants exactly these uniforms, so three never has to re-upload one
    // draw's values for the next draw's.
    material: new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      alphaTest,
      depthWrite: false,
    }),
  };
  byKey.set(key, cell);
  return cell;
}

function PropSprite({
  atlas,
  cols,
  rows,
  index,
  position,
  size,
  alphaTest = 0.12,
}: {
  atlas: THREE.Texture;
  cols: number;
  rows: number;
  index: number;
  position: [number, number, number];
  size: number;
  alphaTest?: number;
}) {
  const cell = useMemo(
    () => propCell(atlas, cols, rows, index, alphaTest),
    [atlas, cols, rows, index, alphaTest],
  );

  return (
    <Billboard position={[position[0], position[1] + size / 2, position[2]]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -size / 2 + 0.02, 0]}
        geometry={circleGeometry(size * 0.26, 16)}
        material={SHADOW_MATERIAL}
      />
      <mesh
        geometry={planeGeometry(size, size)}
        material={cell.material}
      />
    </Billboard>
  );
}

/**
 * A layer of props sharing one atlas — the texture is fetched once and every
 * placement is a sub-rectangle of it.
 */
export function PropLayer({
  src,
  cols = 4,
  rows = 2,
  props,
  alphaTest,
}: {
  src: string;
  cols?: number;
  rows?: number;
  props: PropPlacement[];
  alphaTest?: number;
}) {
  const atlas = useTexture(src);

  return (
    <group>
      {props.map((p, i) => (
        <PropSprite
          key={`${p.index}-${p.x}-${p.z}-${i}`}
          atlas={atlas}
          cols={cols}
          rows={rows}
          index={p.index}
          position={[p.x, p.y ?? 0, p.z]}
          size={p.scale ?? 1.15}
          alphaTest={alphaTest}
        />
      ))}
    </group>
  );
}