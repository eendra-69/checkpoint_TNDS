"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Billboard, useTexture } from "@react-three/drei";
import { PROP_INDEX, PROPS } from "./map";
import { createNameplateTexture, TASCO_3D } from "../brand-textures";

function PropSprite({
  atlas,
  index,
  position,
  scale = 1,
}: {
  atlas: THREE.Texture;
  index: number;
  position: [number, number, number];
  scale?: number;
}) {
  const map = useMemo(() => {
    const t = atlas.clone();
    t.repeat.set(1 / 4, 1 / 2);
    const col = index % 4;
    const row = Math.floor(index / 4);
    t.offset.set(col / 4, 1 - (row + 1) / 2);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [atlas, index]);

  const h = scale * 1.15;
  const w = scale * 1.15;

  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.12} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

export function OfficeProps() {
  const atlas = useTexture("/office/props.png");
  atlas.colorSpace = THREE.SRGBColorSpace;

  const csPlate = useMemo(() => createNameplateTexture("Tasco CS", TASCO_3D.sky), []);
  const claimsPlate = useMemo(
    () => createNameplateTexture("Bồi thường", "#e8a838"),
    [],
  );

  return (
    <group>
      {PROPS.map((p, i) => (
        <PropSprite
          key={`${p.kind}-${i}`}
          atlas={atlas}
          index={PROP_INDEX[p.kind]}
          position={[p.x, p.y ?? 0.55, p.z]}
          scale={p.scale ?? 1}
        />
      ))}

      <mesh position={[15, 1.55, 3.4]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial map={csPlate} transparent />
      </mesh>
      <mesh position={[4, 1.55, 3.4]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial map={claimsPlate} transparent />
      </mesh>
    </group>
  );
}
