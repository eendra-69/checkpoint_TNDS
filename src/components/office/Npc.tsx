"use client";

import { SpriteCharacter } from "./sprites/SpriteCharacter";
import type { Facing, Interactable } from "./world/map";

export function Npc({
  data,
  alert,
}: {
  data: Interactable;
  alert: boolean;
}) {
  if (!data.npc) return null;
  return (
    <SpriteCharacter
      url={data.npc.sheet}
      facing={(data.npc.facing as Facing) || "down"}
      walking={false}
      position={[data.x, 0, data.z]}
      scale={1.15}
      showAlert={alert}
    />
  );
}
