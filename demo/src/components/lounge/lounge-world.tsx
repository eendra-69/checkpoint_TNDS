"use client";

import { buildWorldMap, type InteractableDef, type WorldMap } from "@/components/world/world-map";
import { PropLayer, type PropPlacement } from "@/components/world/prop-sprite";
import { TiledFloor, TiledPanel, TILESET } from "@/components/world/tiled-floor";
import { TASCO_3D } from "@/components/office/brand-textures";
import type { PersonaId } from "@/lib/types";

export const TILE = 1;
export const MAP_W = 18;
export const MAP_H = 12;

/**
 * Floor indices are tileset cell numbers directly — the grid handed to
 * `TiledFloor` is the collision grid, so these double as walkable flags.
 */
const FLOOR = {
  // `pale`, not `marble`: `TILESET.marble` is tileset cell 0, and 0 is also
  // the collision grid's "solid" sentinel. Using it here walled off the whole
  // threshold ring — including the spawn row — so the player could never leave
  // its spawn tile. `pale` is a flat stone slab that takes the same warm tint
  // and stays walkable.
  threshold: TILESET.pale,
  oak: TILESET.wood,
  rug: TILESET.rug,
} as const;

/** Tints push the shared tileset toward the lounge's warmer palette. */
const FLOOR_TINTS: Record<number, string> = {
  [FLOOR.threshold]: "#e8e3cf",
  [FLOOR.oak]: "#f0d6ad",
  [FLOOR.rug]: "#cfe0a8",
  // Cells outside the room stay 0 and are never walked on; tint them like the
  // threshold so nothing renders untextured under the walls.
  0: "#e8e3cf",
};

/** Cells in `/lounge/props.png`, row-major 4x2. */
const PROP = {
  sofa: 0,
  armchair: 1,
  table: 2,
  bar: 3,
  palm: 4,
  lamp: 5,
  rug: 6,
  bookshelf: 7,
} as const;

/**
 * Warm timber floor with a pale stone threshold hugging the walls and a
 * patterned rug under the seating field. `buildWorldMap` keeps the outermost
 * row and column solid, so this only needs to cover the room interior.
 */
function floorAt(x: number, y: number): number {
  if (x === 1 || y === 1 || x === MAP_W - 2 || y === MAP_H - 2) return FLOOR.threshold;
  if (x >= 5 && x <= 12 && y >= 4 && y <= 7) return FLOOR.rug;
  return FLOOR.oak;
}

/**
 * Furniture footprints. Kept as tile coordinates so the placement table below
 * and the collision grid can never drift apart.
 */
const SOLID: [number, number][] = [
  // Sofa along the back wall (faces south).
  [7, 2], [8, 2], [9, 2], [10, 2],
  // Armchairs flanking the west and east walls.
  [2, 5], [2, 6], [2, 7],
  [15, 5], [15, 6], [15, 7],
  // Bar counter along the south-east.
  [13, 8], [14, 8], [15, 8], [16, 8],
  // Bookshelf in the west corner, planters in the remaining corners.
  [2, 2], [15, 2], [1, 10], [16, 10],
];

/** The lounge has exactly one station: the shared chat wall. */
export const LOUNGE_INTERACTABLES: InteractableDef[] = [
  {
    id: "chat",
    x: 9,
    z: 5.8,
    radius: 1.7,
    npc: { sheet: "/office/npc-cs.png", facing: "down" },
    // Stand the host sprite behind the marker so it doesn't cover it.
    npcOffset: { z: -1.5 },
  },
];

export const LOUNGE_MAP: WorldMap = buildWorldMap({
  width: MAP_W,
  height: MAP_H,
  floor: floorAt,
  solid: SOLID,
  // South edge, a clear sightline north to the chat wall.
  spawn: { x: 9.5, z: 10.5 },
  interactables: LOUNGE_INTERACTABLES,
});

/**
 * Sprite sheets for remote lounge visitors, keyed by persona. These must be
 * 3x4 sheets — the office's `portrait-*.png` files are single stills.
 */
export const LOUNGE_PRESENCE_SHEETS: Partial<Record<PersonaId, string>> = {
  customer: "/office/player.png",
  telesales: "/office/npc-cs.png",
  campaign_manager: "/office/npc-cs.png",
  compliance: "/office/npc-claims.png",
  executive: "/office/npc-reception.png",
  admin: "/office/npc-reception.png",
};

/** World-space centre of a tile, matching the office convention. */
function tileCenter(tx: number, ty: number): [number, number] {
  return [tx * TILE + TILE / 2, ty * TILE + TILE / 2];
}

/** Furniture drawn from `/lounge/props.png`. */
const LOUNGE_PROPS: PropPlacement[] = [
  // Seating ring around the chat marker.
  { index: PROP.sofa, x: 8.5, z: 2.5, scale: 2.5 },
  { index: PROP.armchair, x: 2.5, z: 6, scale: 1.5 },
  { index: PROP.armchair, x: 15.5, z: 6, scale: 1.5 },
  // Low table in the middle of the ring.
  { index: PROP.table, x: 9, z: 6, scale: 1.4 },
  // Bar counter along the south-east, with the rug rolled beside it.
  { index: PROP.bar, x: 14.5, z: 8.5, scale: 2.4 },
  // Bookshelf in the west corner, planters in the remaining corners.
  { index: PROP.bookshelf, x: 2.5, z: 2.5, scale: 1.5 },
  { index: PROP.palm, x: 15.5, z: 2.5, scale: 1.4 },
  { index: PROP.palm, x: 1.5, z: 10.5, scale: 1.4 },
  { index: PROP.palm, x: 16.5, z: 10.5, scale: 1.4 },
  // Floor lamps flanking the seating area.
  { index: PROP.lamp, x: 6.2, z: 3.2, scale: 1.5 },
  { index: PROP.lamp, x: 11.8, z: 3.2, scale: 1.5 },
];

/**
 * Room geometry for the lounge.
 *
 * Deliberately no roof and no beams over the play area: the shared follow
 * camera sits at y=6.2 and looks down ~36 degrees, so anything spanning the
 * room above the floor reads as a ceiling and hides the players.
 */
export function LoungeWorldNodes() {
  const [westX, westZ] = tileCenter(2, 6);
  const [eastX, eastZ] = tileCenter(15, 6);

  return (
    <group>
      <ambientLight intensity={0.5} color="#f7e6c4" />
      <directionalLight position={[7, 14, 9]} intensity={0.85} color="#fff0d2" />
      <pointLight position={[14.5, 2.4, 8.5]} intensity={0.8} color="#ffd9a0" distance={11} />
      <pointLight position={[5.5, 2.5, 3]} intensity={0.6} color="#ffd9a0" distance={10} />
      <pointLight
        position={[9, 2.8, 5.6]}
        intensity={0.55}
        color={TASCO_3D.sky}
        distance={9}
      />

      <TiledFloor
        cells={LOUNGE_MAP.collision}
        width={MAP_W}
        height={MAP_H}
        tints={FLOOR_TINTS}
        tileSize={TILE}
      />

      {/* Back and side walls. No south wall — that is the camera side. */}
      <mesh position={[MAP_W / 2, 1.35, 0.2]} receiveShadow>
        <boxGeometry args={[MAP_W, 2.7, 0.35]} />
        <meshStandardMaterial color={TASCO_3D.deep} roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 1.35, MAP_H / 2]} receiveShadow>
        <boxGeometry args={[0.35, 2.7, MAP_H]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.95} />
      </mesh>
      <mesh position={[MAP_W - 0.2, 1.35, MAP_H / 2]} receiveShadow>
        <boxGeometry args={[0.35, 2.7, MAP_H]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.95} />
      </mesh>

      {/* Panelled dado + picture rail, both flat against the walls so they can
          never occlude the floor from the follow camera. */}
      <TiledPanel
        tile={TILESET.panel}
        width={MAP_W - 0.9}
        height={1.1}
        position={[MAP_W / 2, 0.62, 0.39]}
        tint="#243f2c"
        repeat={4}
      />
      <TiledPanel
        tile={TILESET.wood}
        width={MAP_W - 0.9}
        height={0.22}
        position={[MAP_W / 2, 1.24, 0.38]}
        tint="#e6cfa8"
        repeat={4}
      />

      {/* Wall art. */}
      {[
        { x: 3.6, tile: TILESET.woodDark, tint: "#c9a877" },
        { x: 14.4, tile: TILESET.marble, tint: TASCO_3D.sky },
      ].map((p) => (
        <TiledPanel
          key={p.x}
          tile={p.tile}
          width={2.2}
          height={1.2}
          position={[p.x, 1.55, 0.4]}
          tint={p.tint}
        />
      ))}

      <PropLayer src="/lounge/props.png" props={LOUNGE_PROPS} />

      {/* Seating-zone marker, the same treatment the office uses for its desks. */}
      <mesh position={[9, 0.04, 5.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1, 28]} />
        <meshBasicMaterial color={TASCO_3D.sky} transparent opacity={0.55} />
      </mesh>

      {/* Seating ring anchors kept as light pads so the props never float. */}
      {[
        { x: westX, z: westZ },
        { x: eastX, z: eastZ },
      ].map((p, i) => (
        <mesh
          key={i}
          position={[p.x, 0.03, p.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[1.1, 20]} />
          <meshBasicMaterial color="#0b1f12" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ))}

      {/* Wall-top trim only — never a beam over the play area. */}
      {[
        { w: MAP_W, x: MAP_W / 2, z: 0.42, rot: 0 },
        { w: MAP_H, x: 0.42, z: MAP_H / 2, rot: Math.PI / 2 },
        { w: MAP_H, x: MAP_W - 0.42, z: MAP_H / 2, rot: Math.PI / 2 },
      ].map((t, i) => (
        <mesh key={i} position={[t.x, 2.72, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[t.w, 0.16, 0.3]} />
          <meshStandardMaterial color={TASCO_3D.lime} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}