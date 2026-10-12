"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Avatar } from "./Avatar";
import { Room } from "./Room";
import { Stations, type OfficeStation } from "./Stations";

function ParallaxRig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.2, -1));
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      offset.current.x = (e.clientX / window.innerWidth - 0.5) * 0.7;
      offset.current.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(() => {
    const desired = new THREE.Vector3(
      offset.current.x,
      5.1 - offset.current.y * 0.35,
      8.4,
    );
    camera.position.lerp(desired, 0.06);
    camera.lookAt(target.current);
  });

  return (
    <PerspectiveCamera makeDefault position={[0, 5.1, 8.4]} fov={42} />
  );
}

export function OfficeScene({
  active,
  onSelect,
}: {
  active: OfficeStation | null;
  onSelect: (id: OfficeStation) => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      className="h-full w-full touch-none"
      onCreated={({ gl }) => {
        gl.setClearColor("#0a1630");
      }}
    >
      <Suspense fallback={null}>
        <ParallaxRig />
        <Room />
        <Stations onSelect={onSelect} />
        <Avatar target={active || "spawn"} />
        <hemisphereLight args={["#eaf3f8", "#00103e", 0.45]} />
      </Suspense>
    </Canvas>
  );
}
