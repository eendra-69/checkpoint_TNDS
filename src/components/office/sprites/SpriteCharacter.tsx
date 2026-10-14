"use client";

import { useMemo, useRef } from "react";
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
  // useTexture returns a cached, shared texture: configure our own clone, never the original.
  const tex = useTexture(url);

  const cols = 3;
  const rows = 4;
  const map = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(1 / cols, 1 / rows);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }, [tex]);

  const frame = useRef(1);
  const accum = useRef(0);
  const bobY = useRef(0);
  const root = useRef<THREE.Group>(null);

  // R3F calls the latest useFrame callback each frame, so props can be read directly.
  useFrame((_, dt) => {
    if (walking) {
      accum.current += dt;
      if (accum.current > 0.14) {
        accum.current = 0;
        frame.current = (frame.current + 1) % cols;
      }
      bobY.current = Math.sin(performance.now() / 90) * 0.03;
    } else {
      frame.current = 1;
      bobY.current = Math.sin(performance.now() / 500) * 0.015;
    }
    const row = FACING_ROW[facing];
    map.offset.set(frame.current / cols, 1 - (row + 1) / rows);
    if (root.current) root.current.position.y = bobY.current;
  });

  const w = 0.72 * scale;
  const h = 1.08 * scale;

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.04]}>
        <circleGeometry args={[0.28 * scale, 16]} />
        <meshBasicMaterial color="#00103e" transparent opacity={0.28} />
      </mesh>
      <group ref={root}>
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, h / 2, 0]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial map={map} transparent alphaTest={0.45} />
          </mesh>
          {showAlert && (
            <mesh position={[0.15, h + 0.2, 0.05]}>
              <planeGeometry args={[0.32, 0.32]} />
              <meshBasicMaterial color="#ffd24a" />
            </mesh>
          )}
        </Billboard>
      </group>
    </group>
  );
}
