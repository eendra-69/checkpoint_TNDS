"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { SpriteCharacter } from "@/components/office/sprites/SpriteCharacter";
import type { PersonaId, PresenceUser } from "@/lib/types";

/** Cap on simultaneously rendered remote avatars — keeps drei <Html> cheap. */
const MAX_RENDERED = 12;

/** Hoisted so every avatar's `position` prop keeps a stable identity. */
const ORIGIN: [number, number, number] = [0, 0, 0];

/**
 * Rings and accent materials are pooled by their defining values instead of
 * built per avatar: at the twelve-avatar cap that was twelve ring geometries
 * and up to twelve materials for one ring size and six persona colours. R3F
 * only disposes objects it created itself, so these are handed over as
 * `geometry=` / `material=` props and outlive a remount.
 */
const ringGeometries = new Map<string, THREE.RingGeometry>();

function ringGeometry(inner: number, outer: number, segments: number) {
  const key = `${inner}|${outer}|${segments}`;
  let geometry = ringGeometries.get(key);
  if (!geometry) {
    geometry = new THREE.RingGeometry(inner, outer, segments);
    ringGeometries.set(key, geometry);
  }
  return geometry;
}

const accentMaterials = new Map<string, THREE.MeshBasicMaterial>();

function accentMaterial(color: string) {
  let material = accentMaterials.get(color);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });
    accentMaterials.set(color, material);
  }
  return material;
}

export const PERSONA_ACCENT: Record<PersonaId, string> = {
  customer: "#00a758",
  telesales: "#0068ff",
  campaign_manager: "#a3e635",
  compliance: "#7c3aed",
  executive: "#f59e0b",
  admin: "#ec4899",
};

/**
 * Remote players. Reuses the same billboarded sprite sheets as the local
 * player so everyone looks like they belongs in the scene, plus a persona
 * accent ring and a nameplate showing their custom name.
 */
export function PresenceSprites({
  users,
  sheets = "/office/player.png",
  scale = 1.2,
}: {
  users: PresenceUser[];
  sheets?: Partial<Record<PersonaId, string>> | string;
  scale?: number;
}) {
  const visible = users.slice(0, MAX_RENDERED);
  const overflow = users.length - visible.length;

  const ring = useMemo(
    () => ringGeometry(0.3 * scale, 0.36 * scale, 20),
    [scale],
  );

  return (
    <group>
      {visible.map((u) => {
        const accent = PERSONA_ACCENT[u.persona] ?? "#a3e635";
        const sheet = typeof sheets === "string" ? sheets : sheets[u.persona];
        if (!sheet) return null;
        return (
          <group key={u.id} position={[u.x, 0, u.z]}>
            {/* Persona accent ring on the floor. */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.03, 0.04]}
              geometry={ring}
              material={accentMaterial(accent)}
            />
            <SpriteCharacter
              url={sheet}
              facing={u.facing}
              walking={false}
              position={ORIGIN}
              scale={scale}
            />
            <Html position={[0, 1.45 * scale, 0]} center zIndexRange={[20, 10]}>
              <span className="presence-tag" data-self="false">
                {u.name}
              </span>
            </Html>
          </group>
        );
      })}

      {overflow > 0 && (
        <Html position={[0, 2.2, 0]} center zIndexRange={[20, 10]}>
          <span className="presence-tag">+{overflow} more online</span>
        </Html>
      )}
    </group>
  );
}
