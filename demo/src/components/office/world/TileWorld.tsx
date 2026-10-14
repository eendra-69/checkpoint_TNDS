"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { COLLISION, FLOOR, MAP_H, MAP_W, TILE } from "./map";
import { TiledPanel, TiledFloor, TILESET } from "@/components/world/tiled-floor";
import { createTascoBannerTexture, TASCO_3D } from "../brand-textures";

/**
 * The office's `FLOOR` values were always the tileset cell indices — the floor
 * just resolved them to flat colours while `office/tileset.png` sat unused.
 * Drawing the real tiles is what lets the workshop and lounge share the same
 * floor art instead of approximating it.
 */
const FLOOR_TINTS: Record<number, string> = {
  [FLOOR.marble]: "#dfe8d8",
  [FLOOR.navyCarpet]: "#9fd3ad",
  [FLOOR.wood]: "#f0d6ad",
  [FLOOR.pale]: "#f2f8ea",
  [FLOOR.checkered]: "#e4eed9",
  [FLOOR.rugRed]: "#cfe0a8",
};

export function TileWorld() {
  const backdrop = useTexture("/office/backdrop-city.png");
  backdrop.colorSpace = THREE.SRGBColorSpace;
  backdrop.magFilter = THREE.NearestFilter;
  backdrop.minFilter = THREE.NearestFilter;

  const banner = useMemo(() => createTascoBannerTexture(), []);

  const cells = useMemo(
    () => COLLISION.map((row) => row.map((t) => (t === 0 ? FLOOR.pale : t))),
    [],
  );

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

      <TiledFloor
        cells={cells}
        width={MAP_W}
        height={MAP_H}
        tints={FLOOR_TINTS}
        tileSize={TILE}
      />

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
            <meshBasicMaterial color="#0b1f12" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* Panelled dado along the back wall, flat against it so it can never
          occlude the floor from the follow camera. */}
      <TiledPanel
        tile={TILESET.panel}
        width={MAP_W - 0.9}
        height={0.9}
        position={[MAP_W / 2, 0.55, 0.39]}
        tint="#243f2c"
        repeat={5}
      />

      <mesh position={[10, 2.3, 0.5]}>
        <planeGeometry args={[6.4, 1.05]} />
        <meshStandardMaterial map={banner} roughness={0.5} />
      </mesh>

      {/* Wall-top trim, deliberately NOT spanning the map.
          The follow camera sits at y=6.2 and looks down at ~36deg, so any
          full-width beam at y=3.1 crosses the play area and reads as a
          ceiling blocking the view. These stubs hug the wall tops instead. */}
      {[
        { w: MAP_W, x: MAP_W / 2, z: 0.42, rot: 0 },
        { w: MAP_W, x: MAP_W / 2, z: MAP_H - 0.42, rot: 0 },
        { w: MAP_H, x: 0.42, z: MAP_H / 2, rot: Math.PI / 2 },
        { w: MAP_H, x: MAP_W - 0.42, z: MAP_H / 2, rot: Math.PI / 2 },
      ].map((t, i) => (
        <mesh key={i} position={[t.x, 2.72, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[t.w, 0.16, 0.3]} />
          <meshStandardMaterial color={TASCO_3D.lime} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
