"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useCallback, type ReactNode } from "react";
import { WorldPlayer } from "./world-player";
import { PresenceSprites } from "./presence-sprites";
import { Npc } from "@/components/office/Npc";
import { Effects } from "@/components/office/Effects";
import { useKeyboardControls } from "@/components/office/controls/useControls";
import type { InteractableDef, WorldMap } from "./world-map";
import type { Facing, PersonaId, PresenceUser } from "@/lib/types";

/**
 * Canvas shell shared by the office, workshop and lounge.
 *
 * Each scene supplies only its map data and world geometry (`worldNodes`);
 * camera, player, controls, post-processing and remote-player rendering are
 * identical everywhere, which is what makes presence work the same way in all
 * three rooms.
 *
 * `showEffects` is a real, wired opt-out: it gates the whole EffectComposer,
 * so passing `false` drops the extra full-screen pass and the bloom mip chain
 * entirely. None of the three rooms currently pass it — they all take the
 * `true` default — so keep that default unless a room genuinely needs the
 * cheap path.
 */
export function WorldScene({
  world,
  worldNodes,
  locked,
  nearId,
  onNear,
  onInteract,
  others = [],
  playerSheet = "/office/player.png",
  presenceSheets,
  playerScale = 1.2,
  onMove,
  clearColor = "#0b1f12",
  showEffects = true,
}: {
  world: WorldMap;
  worldNodes: ReactNode;
  locked: boolean;
  nearId: string | null;
  onNear: (it: InteractableDef | null) => void;
  onInteract: (it: InteractableDef) => void;
  others?: PresenceUser[];
  playerSheet?: string;
  presenceSheets?: Partial<Record<PersonaId, string>> | string;
  playerScale?: number;
  onMove?: (x: number, z: number, facing: Facing) => void;
  clearColor?: string;
  showEffects?: boolean;
}) {
  useKeyboardControls(!locked);

  const handleNear = useCallback((it: InteractableDef | null) => onNear(it), [onNear]);
  const handleInteract = useCallback(
    (it: InteractableDef) => onInteract(it),
    [onInteract],
  );

  return (
    <Canvas
      // Capped at 1.25 rather than 1.5. Every room fills the viewport, so DPR
      // is the one knob that scales all of the per-frame fragment work at once:
      // the scene pass, the EffectComposer's input buffer and mip chain, and
      // the final effect pass. 1.5 -> 1.25 is a 30% cut across all of them.
      // It stays above CSS pixel density, so nearest-filtered sprites and tiles
      // are still supersampled rather than visibly chunkier, and the glow that
      // dominates the look is unchanged. Standard (non-retina) displays still
      // land on 1.0 and see no change at all.
      dpr={[1, 1.25]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      className="h-full w-full touch-none"
      onCreated={({ gl }) => {
        gl.setClearColor(clearColor);
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
        {worldNodes}
        {world.interactables.map((it) =>
          it.npc ? (
            <RemoteNpc key={it.id} data={it} alert={nearId === it.id && !locked} />
          ) : null,
        )}
        <PresenceSprites users={others} sheets={presenceSheets} scale={playerScale} />
        <WorldPlayer
          world={world}
          locked={locked}
          playerSheet={playerSheet}
          scale={playerScale}
          onNear={handleNear}
          onInteract={handleInteract}
          onMove={onMove}
        />
        {showEffects && <Effects />}
      </Suspense>
    </Canvas>
  );
}

function RemoteNpc({
  data,
  alert,
}: {
  data: InteractableDef;
  alert: boolean;
}) {
  return (
    <Npc data={data} alert={alert} />
  );
}
