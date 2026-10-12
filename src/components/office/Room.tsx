"use client";

import { useMemo } from "react";
import {
  createFloorTexture,
  createTascoBannerTexture,
  TASCO_3D,
} from "./brand-textures";

export function Room() {
  const floorTex = useMemo(() => createFloorTexture(), []);
  const bannerTex = useMemo(() => createTascoBannerTexture(), []);

  return (
    <group>
      <ambientLight intensity={0.55} color="#dbe7f5" />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.15}
        color="#fff4e5"
        castShadow
      />
      <pointLight position={[-4, 3, 2]} intensity={0.55} color={TASCO_3D.sky} />
      <pointLight position={[3, 2.5, -3]} intensity={0.35} color="#213368" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial map={floorTex} color="#ffffff" roughness={0.85} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.4, -5.5]} receiveShadow>
        <boxGeometry args={[16, 4.8, 0.25]} />
        <meshStandardMaterial color={TASCO_3D.deep} roughness={0.9} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-7.9, 2.4, 0]} receiveShadow>
        <boxGeometry args={[0.25, 4.8, 12]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>
      <mesh position={[7.9, 2.4, 0]} receiveShadow>
        <boxGeometry args={[0.25, 4.8, 12]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>

      {/* Ceiling strip */}
      <mesh position={[0, 4.7, 0]}>
        <boxGeometry args={[16, 0.15, 12]} />
        <meshStandardMaterial color="#d7e3ef" roughness={1} />
      </mesh>

      {/* TASCO banner */}
      <mesh position={[0, 3.35, -5.35]}>
        <planeGeometry args={[7.2, 1.6]} />
        <meshStandardMaterial map={bannerTex} roughness={0.55} />
      </mesh>

      {/* Reception desk base */}
      <mesh position={[0, 0.55, 3.2]} castShadow>
        <boxGeometry args={[3.2, 1.1, 1.1]} />
        <meshStandardMaterial color="#f2f6fb" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.15, 3.2]} castShadow>
        <boxGeometry args={[3.4, 0.12, 1.25]} />
        <meshStandardMaterial color={TASCO_3D.sky} roughness={0.4} />
      </mesh>

      {/* Logo block on reception */}
      <mesh position={[-1.1, 1.45, 3.2]} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.12]} />
        <meshStandardMaterial color={TASCO_3D.deep} />
      </mesh>
      <mesh position={[-1.1, 1.45, 3.28]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.2]}>
        <planeGeometry args={[5.5, 3.2]} />
        <meshStandardMaterial color="#c5d5e8" roughness={1} />
      </mesh>

      {/* Window glow on left */}
      <mesh position={[-7.75, 2.6, -1]}>
        <planeGeometry args={[0.05, 2.2]} />
        <meshBasicMaterial color={TASCO_3D.sky} />
      </mesh>
      <mesh position={[-7.75, 2.6, 1.6]}>
        <planeGeometry args={[0.05, 2.2]} />
        <meshBasicMaterial color={TASCO_3D.sky} />
      </mesh>
    </group>
  );
}
