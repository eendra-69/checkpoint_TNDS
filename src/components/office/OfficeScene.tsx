"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useCallback } from "react";
import { TileWorld } from "./world/TileWorld";
import { OfficeProps } from "./world/Props";
import { Player } from "./Player";
import { Npc } from "./Npc";
import { Effects } from "./Effects";
import { INTERACTABLES, type Interactable } from "./world/map";
import { useKeyboardControls } from "./controls/useControls";

export function OfficeScene({
  locked,
  nearId,
  onNear,
  onInteract,
}: {
  locked: boolean;
  nearId: string | null;
  onNear: (it: Interactable | null) => void;
  onInteract: (it: Interactable) => void;
}) {
  useKeyboardControls(!locked);

  const handleNear = useCallback(
    (it: Interactable | null) => onNear(it),
    [onNear],
  );
  const handleInteract = useCallback(
    (it: Interactable) => onInteract(it),
    [onInteract],
  );

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      className="h-full w-full touch-none"
      onCreated={({ gl }) => {
        gl.setClearColor("#0a1630");
      }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera
          makeDefault
          position={[10, 6.2, 18]}
          fov={38}
          near={0.1}
          far={80}
        />
        <TileWorld />
        <OfficeProps />
        {INTERACTABLES.map((it) => (
          <Npc key={it.id} data={it} alert={nearId === it.id && !locked} />
        ))}
        <Player locked={locked} onNear={handleNear} onInteract={handleInteract} />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
