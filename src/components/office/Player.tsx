"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { SpriteCharacter } from "./sprites/SpriteCharacter";
import {
  SPAWN,
  isWalkable,
  nearestInteractable,
  worldToTile,
  type Facing,
  type Interactable,
} from "./world/map";
import {
  consumeInteractPress,
  getControls,
} from "./controls/useControls";

const SPEED = 3.2;
const RADIUS = 0.22;

function canMoveTo(x: number, z: number) {
  const samples: [number, number][] = [
    [x - RADIUS, z - RADIUS],
    [x + RADIUS, z - RADIUS],
    [x - RADIUS, z + RADIUS],
    [x + RADIUS, z + RADIUS],
  ];
  return samples.every(([sx, sz]) => {
    const { tx, ty } = worldToTile(sx, sz);
    return isWalkable(tx, ty);
  });
}

export function Player({
  locked,
  onNear,
  onInteract,
}: {
  locked: boolean;
  onNear: (it: Interactable | null) => void;
  onInteract: (it: Interactable) => void;
}) {
  const sim = useRef({ x: SPAWN.x, z: SPAWN.z });
  const [pos, setPos] = useState<[number, number, number]>([SPAWN.x, 0, SPAWN.z]);
  const [facing, setFacing] = useState<Facing>("up");
  const [walking, setWalking] = useState(false);
  const nearRef = useRef<Interactable | null>(null);
  const walkLatch = useRef(false);
  const facingLatch = useRef<Facing>("up");
  const sync = useRef(0);
  const { camera } = useThree();
  const camReady = useRef(false);

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
        onInteract(nearRef.current);
      }
    }

    if (moved !== walkLatch.current) {
      walkLatch.current = moved;
      setWalking(moved && !locked);
    }

    sync.current += dt;
    if (sync.current > 0.05) {
      sync.current = 0;
      setPos([sim.current.x, 0, sim.current.z]);
    }

    const near = nearestInteractable(sim.current.x, sim.current.z);
    if (near?.id !== nearRef.current?.id) {
      nearRef.current = near;
      onNear(near);
    }

    const target = new THREE.Vector3(sim.current.x, 6.2, sim.current.z + 7.2);
    if (!camReady.current) {
      camera.position.copy(target);
      camReady.current = true;
    } else {
      camera.position.lerp(target, 1 - Math.pow(0.0008, dt));
    }
    camera.lookAt(sim.current.x, 0.6, sim.current.z - 0.5);
  });

  return (
    <SpriteCharacter
      url="/office/player.png"
      facing={facing}
      walking={walking && !locked}
      position={pos}
      scale={1.2}
    />
  );
}
