"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TASCO_3D } from "./brand-textures";
import { STATION_META, type OfficeStation } from "./Stations";

const SPAWN = new THREE.Vector3(0, 0, 2.2);

const TARGETS: Record<OfficeStation | "spawn", [number, number, number]> = {
  spawn: [0, 0, 2.2],
  cs: [2.4, 0, 0.1],
  claims: [-2.6, 0, -0.1],
  admin: [-4.2, 0, -2.8],
  vetc: [5.0, 0, 2.4],
};

export function Avatar({
  target,
}: {
  target: OfficeStation | "spawn" | null;
}) {
  const group = useRef<THREE.Group>(null);
  const goal = useRef(SPAWN.clone());

  useEffect(() => {
    const key = target || "spawn";
    const t = TARGETS[key] || TARGETS.spawn;
    goal.current.set(t[0], t[1], t[2]);
  }, [target]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.lerp(goal.current, Math.min(1, dt * 3.2));
    const dx = goal.current.x - group.current.position.x;
    const dz = goal.current.z - group.current.position.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.05) {
      group.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group ref={group} position={SPAWN.toArray()}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.7, 6, 12]} />
        <meshStandardMaterial color={TASCO_3D.sky} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#f0d2b8" roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial color="#00103e" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export function stationPrompt(id: OfficeStation) {
  return STATION_META[id].prompt;
}
