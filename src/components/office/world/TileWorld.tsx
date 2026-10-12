"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { COLLISION, FLOOR, MAP_H, MAP_W, TILE } from "./map";
import { createTascoBannerTexture, TASCO_3D } from "../brand-textures";

const TILE_COLOR: Record<number, string> = {
  [FLOOR.marble]: "#c8d0da",
  [FLOOR.navyCarpet]: "#1a2d58",
  [FLOOR.wood]: "#8b6a45",
  [FLOOR.pale]: "#e8eef6",
  [FLOOR.checkered]: "#d9dee8",
  [FLOOR.rugRed]: "#6e2430",
};

export function TileWorld() {
  const backdrop = useTexture("/office/backdrop-city.png");
  backdrop.colorSpace = THREE.SRGBColorSpace;
  backdrop.magFilter = THREE.NearestFilter;
  backdrop.minFilter = THREE.NearestFilter;

  const banner = useMemo(() => createTascoBannerTexture(), []);

  const floors = useMemo(() => {
    const items: { x: number; z: number; color: string; alt?: boolean }[] = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = COLLISION[y][x];
        const tile = t === 0 ? FLOOR.pale : t;
        let color = TILE_COLOR[tile] || TASCO_3D.pale;
        if (tile === FLOOR.checkered && (x + y) % 2 === 0) color = "#b8c0ce";
        items.push({ x, z: y, color });
      }
    }
    return items;
  }, []);

  return (
    <group>
      <ambientLight intensity={0.42} color="#dbe7f5" />
      <directionalLight position={[8, 14, 6]} intensity={0.9} color="#fff1d6" />
      <pointLight
        position={[5, 2.5, 4]}
        intensity={0.85}
        color="#ffd9a0"
        distance={11}
      />
      <pointLight
        position={[15, 2.5, 4]}
        intensity={0.85}
        color="#ffd9a0"
        distance={11}
      />
      <pointLight
        position={[2, 2.2, 8]}
        intensity={0.5}
        color={TASCO_3D.sky}
        distance={9}
      />

      {floors.map(({ x, z, color }) => (
        <mesh
          key={`f-${x}-${z}`}
          position={[x * TILE + TILE / 2, 0, z * TILE + TILE / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[TILE * 0.98, TILE * 0.98]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}

      {/* Walls */}
      <mesh position={[MAP_W / 2, 1.35, 0.2]}>
        <boxGeometry args={[MAP_W, 2.7, 0.35]} />
        <meshStandardMaterial color={TASCO_3D.deep} roughness={0.9} />
      </mesh>
      <mesh position={[MAP_W / 2, 1.35, MAP_H - 0.2]}>
        <boxGeometry args={[MAP_W, 2.7, 0.35]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 1.35, MAP_H / 2]}>
        <boxGeometry args={[0.35, 2.7, MAP_H]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>
      <mesh position={[MAP_W - 0.2, 1.35, MAP_H / 2]}>
        <boxGeometry args={[0.35, 2.7, MAP_H]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>

      {/* Windows + city */}
      {[4.5, 10, 15.5].map((wx) => (
        <group key={wx}>
          <mesh position={[wx, 1.5, 0.42]}>
            <planeGeometry args={[2.6, 1.55]} />
            <meshBasicMaterial map={backdrop} />
          </mesh>
          <mesh position={[wx, 1.5, 0.4]}>
            <planeGeometry args={[2.75, 1.7]} />
            <meshBasicMaterial color="#0a1630" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      <mesh position={[10, 2.3, 0.5]}>
        <planeGeometry args={[6.4, 1.05]} />
        <meshStandardMaterial map={banner} roughness={0.5} />
      </mesh>

      {/* Open roof — only decorative beams so the follow camera can see the floor */}
      {[3, 7, 11].map((bz) => (
        <mesh key={bz} position={[MAP_W / 2, 3.1, bz]}>
          <boxGeometry args={[MAP_W - 0.8, 0.12, 0.22]} />
          <meshStandardMaterial color="#9eb4cc" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
