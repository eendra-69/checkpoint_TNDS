"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { SpriteCharacter } from "@/components/office/sprites/SpriteCharacter";
import {
  isWalkable,
  nearestInteractable,
  worldToTile,
  type InteractableDef,
  type WorldMap,
} from "./world-map";
import {
  consumeInteractPress,
  getControls,
} from "@/components/office/controls/useControls";
import type { Facing } from "@/lib/types";

const SPEED = 3.2;
const RADIUS = 0.22;

/** Hoisted so the sprite's `position` prop keeps a stable identity. */
const ORIGIN: [number, number, number] = [0, 0, 0];

/**
 * Movement + follow camera, shared by every world scene. Reports position to
 * the presence hook each frame; the hook throttles network sends.
 */
export function WorldPlayer({
  world,
  locked,
  playerSheet = "/office/player.png",
  scale = 1.2,
  onNear,
  onInteract,
  onMove,
}: {
  world: WorldMap;
  locked: boolean;
  playerSheet?: string;
  scale?: number;
  onNear?: (it: InteractableDef | null) => void;
  onInteract?: (it: InteractableDef) => void;
  onMove?: (x: number, z: number, facing: Facing) => void;
}) {
  const tile = world.tileSize ?? 1;
  const sim = useRef({ x: world.spawn.x, z: world.spawn.z });
  const [facing, setFacing] = useState<Facing>("up");
  const [walking, setWalking] = useState(false);
  const nearRef = useRef<InteractableDef | null>(null);
  const walkLatch = useRef(false);
  const facingLatch = useRef<Facing>("up");
  const moveLatch = useRef(0);
  const { camera } = useThree();
  const camReady = useRef(false);
  const root = useRef<THREE.Group>(null);
  const camTarget = useRef(new THREE.Vector3());

  function canMoveTo(x: number, z: number) {
    const samples: [number, number][] = [
      [x - RADIUS, z - RADIUS],
      [x + RADIUS, z - RADIUS],
      [x - RADIUS, z + RADIUS],
      [x + RADIUS, z + RADIUS],
    ];
    return samples.every(([sx, sz]) => {
      const { tx, ty } = worldToTile(sx, sz, tile);
      return isWalkable(world, tx, ty);
    });
  }

  useFrame((_, dt) => {
    const c = getControls();
    let moved = false;

    if (!locked) {
      const mx = c.x * SPEED * dt;
      const mz = c.y * SPEED * dt;

      if (mx !== 0 || mz !== 0) {
        moved = true;
        const nextX = sim.current.x + mx;
        const nextZ = sim.current.z + mz;
        if (canMoveTo(nextX, sim.current.z)) sim.current.x = nextX;
        if (canMoveTo(sim.current.x, nextZ)) sim.current.z = nextZ;

        let nextFacing = facingLatch.current;
        if (Math.abs(c.x) > Math.abs(c.y)) {
          nextFacing = c.x < 0 ? "left" : "right";
        } else if (c.y !== 0) {
          nextFacing = c.y < 0 ? "up" : "down";
        }
        if (nextFacing !== facingLatch.current) {
          facingLatch.current = nextFacing;
          setFacing(nextFacing);
        }
      }

      if (consumeInteractPress() && nearRef.current) {
        onInteract?.(nearRef.current);
      }
    }

    if (moved !== walkLatch.current) {
      walkLatch.current = moved;
      setWalking(moved && !locked);
    }

    // Written straight to the scene graph. Routing this through React state
    // re-rendered the entire Canvas subtree 20x a second to move one group.
    if (root.current) root.current.position.set(sim.current.x, 0, sim.current.z);

    // Presence broadcast — every frame is fine, the hook throttles the fetch.
    moveLatch.current += dt;
    if (moveLatch.current > 0.1) {
      moveLatch.current = 0;
      onMove?.(sim.current.x, sim.current.z, facingLatch.current);
    }

    const near = nearestInteractable(world, sim.current.x, sim.current.z);
    if (near?.id !== nearRef.current?.id) {
      nearRef.current = near;
      onNear?.(near);
    }

    const target = camTarget.current.set(sim.current.x, 6.2, sim.current.z + 7.2);
    if (!camReady.current) {
      camera.position.copy(target);
      camReady.current = true;
    } else {
      camera.position.lerp(target, 1 - Math.pow(0.0008, dt));
    }
    camera.lookAt(sim.current.x, 0.6, sim.current.z - 0.5);
  });

  return (
    <group ref={root} position={[world.spawn.x, 0, world.spawn.z]}>
      <SpriteCharacter
        url={playerSheet}
        facing={facing}
        walking={walking && !locked}
        position={ORIGIN}
        scale={scale}
      />
    </group>
  );
}
