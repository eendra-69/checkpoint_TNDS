"use client";

import { SpriteCharacter } from "./sprites/SpriteCharacter";
import type { Facing } from "@/lib/types";
import type { InteractableDef } from "@/components/world/world-map";

export function Npc({
  data,
  alert,
}: {
  data: InteractableDef;
  alert: boolean;
}) {
  if (!data.npc) return null;
  return (
    <SpriteCharacter
      url={data.npc.sheet}
      facing={(data.npc.facing as Facing) || "down"}
      walking={false}
      position={[
        data.x + (data.npcOffset?.x ?? 0),
        0,
        data.z + (data.npcOffset?.z ?? 0),
      ]}
      scale={1.15}
      showAlert={alert}
    />
  );
}
