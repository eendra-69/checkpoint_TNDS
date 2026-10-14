"use client";

import { useCallback } from "react";
import { WorldScene } from "@/components/world/WorldScene";
import { TileWorld } from "./world/TileWorld";
import { OfficeProps } from "./world/Props";
import { OFFICE_WORLD } from "./world/map";
import type { InteractableDef } from "@/components/world/world-map";
import type { Facing, PersonaId, PresenceUser } from "@/lib/types";

export function OfficeScene({
  locked,
  nearId,
  onNear,
  onInteract,
  others,
  onMove,
}: {
  locked: boolean;
  nearId: string | null;
  onNear: (it: InteractableDef | null) => void;
  onInteract: (it: InteractableDef) => void;
  others?: PresenceUser[];
  onMove?: (x: number, z: number, facing: Facing) => void;
}) {
  const handleNear = useCallback(
    (it: InteractableDef | null) => onNear(it),
    [onNear],
  );
  const handleInteract = useCallback(
    (it: InteractableDef) => onInteract(it),
    [onInteract],
  );

  return (
    <WorldScene
      world={OFFICE_WORLD}
      locked={locked}
      nearId={nearId}
      onNear={handleNear}
      onInteract={handleInteract}
      others={others}
      onMove={onMove}
      playerSheet="/office/player.png"
      presenceSheets={PRESENCE_SHEETS}
      worldNodes={
        <>
          <TileWorld />
          <OfficeProps />
        </>
      }
    />
  );
}

/**
 * Sheet used for remote players, keyed by persona.
 * These must be 3x4 *sprite sheets* (the layout SpriteCharacter expects) —
 * the `portrait-*.png` files are single stills and would render as noise.
 */
export const PRESENCE_SHEETS: Partial<Record<PersonaId, string>> = {
  customer: "/office/player.png",
  telesales: "/office/npc-cs.png",
  campaign_manager: "/office/npc-cs.png",
  compliance: "/office/npc-claims.png",
  executive: "/office/npc-reception.png",
  admin: "/office/npc-reception.png",
};
