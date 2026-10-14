export type OfficeStation = "cs" | "claims" | "admin" | "vetc" | "reception";

// Shared with the presence system, which lives outside the 3D layer.
import type { Facing } from "@/lib/types";
import type { InteractableDef, WorldMap } from "@/components/world/world-map";
export type { Facing };
export type { InteractableDef, WorldMap };

export const TILE = 1;
export const MAP_W = 20;
export const MAP_H = 14;

/** Floor tile indices into tileset atlas (4x4). */
export const FLOOR = {
  marble: 0,
  navyCarpet: 1,
  wood: 2,
  pale: 3,
  checkered: 8,
  rugRed: 12,
} as const;

/** 0 = void/wall, 1+ = walkable floor type index */
export const COLLISION: number[][] = (() => {
  const g: number[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => 0),
  );
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      g[y][x] = FLOOR.pale;
    }
  }
  // Lobby carpet near entrance (south)
  for (let y = 9; y < MAP_H - 1; y++) {
    for (let x = 6; x < 14; x++) g[y][x] = FLOOR.checkered;
  }
  // Navy carpet work area
  for (let y = 2; y < 8; y++) {
    for (let x = 2; x < 18; x++) g[y][x] = FLOOR.navyCarpet;
  }
  // Wood reception strip
  for (let x = 7; x < 13; x++) {
    g[8][x] = FLOOR.wood;
    g[9][x] = FLOOR.wood;
  }
  // Red runner to CS
  for (let x = 12; x < 17; x++) g[5][x] = FLOOR.rugRed;
  // Block desks / furniture footprints (solid)
  const blocks: [number, number][] = [
    // reception desk
    [8, 8], [9, 8], [10, 8], [11, 8],
    // CS desk
    [14, 3], [15, 3], [16, 3],
    // claims desk
    [3, 3], [4, 3], [5, 3],
    // admin board wall area
    [2, 1], [3, 1],
    // VETC kiosk
    [17, 8], [17, 9],
    // sofa / plants
    [2, 10], [3, 10], [18, 4], [1, 5],
  ];
  for (const [x, y] of blocks) {
    if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) g[y][x] = 0;
  }
  return g;
})();

export function isWalkable(tx: number, ty: number) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  return COLLISION[ty][tx] !== 0;
}

export function worldToTile(x: number, z: number) {
  return {
    tx: Math.floor(x / TILE),
    ty: Math.floor(z / TILE),
  };
}

export function tileCenter(tx: number, ty: number) {
  return { x: tx * TILE + TILE / 2, z: ty * TILE + TILE / 2 };
}

export const SPAWN = tileCenter(10, 11);

export type PropKind =
  | "desk"
  | "chair"
  | "plant"
  | "cooler"
  | "sofa"
  | "lamp"
  | "board"
  | "vetc";

export const PROP_INDEX: Record<PropKind, number> = {
  desk: 0,
  chair: 1,
  plant: 2,
  cooler: 3,
  sofa: 4,
  lamp: 5,
  board: 6,
  vetc: 7,
};

export type PropPlacement = {
  kind: PropKind;
  x: number;
  z: number;
  scale?: number;
  y?: number;
};

export const PROPS: PropPlacement[] = [
  { kind: "desk", x: 9.5, z: 8.2, scale: 1.4, y: 0.55 },
  { kind: "chair", x: 9.5, z: 9.2, scale: 0.9 },
  { kind: "desk", x: 15, z: 3.2, scale: 1.3, y: 0.55 },
  { kind: "chair", x: 15, z: 4.1, scale: 0.85 },
  { kind: "desk", x: 4, z: 3.2, scale: 1.3, y: 0.55 },
  { kind: "chair", x: 4, z: 4.1, scale: 0.85 },
  { kind: "board", x: 2.5, z: 1.4, scale: 1.2, y: 1.4 },
  { kind: "vetc", x: 17.2, z: 8.5, scale: 1.3, y: 0.9 },
  { kind: "plant", x: 1.6, z: 6, scale: 1 },
  { kind: "plant", x: 18.2, z: 2.5, scale: 1 },
  { kind: "cooler", x: 18.2, z: 11, scale: 1 },
  { kind: "sofa", x: 2.5, z: 11, scale: 1.2 },
  { kind: "lamp", x: 7, z: 2.2, scale: 1.1, y: 0.9 },
  { kind: "lamp", x: 13, z: 2.2, scale: 1.1, y: 0.9 },
];

/**
 * Office interactables keep the narrow station id for type-safe lookups into
 * `officeCopy(...).stations`, while still satisfying the shared scene contract.
 */
export type Interactable = InteractableDef & { id: OfficeStation };

export const INTERACTABLES: Interactable[] = [
  {
    id: "reception",
    x: 9.5,
    z: 7.4,
    radius: 1.35,
    npc: { sheet: "/office/npc-reception.png", facing: "down" },
  },
  {
    id: "cs",
    x: 15,
    z: 2.5,
    radius: 1.4,
    npc: { sheet: "/office/npc-cs.png", facing: "down" },
  },
  {
    id: "claims",
    x: 4,
    z: 2.5,
    radius: 1.4,
    npc: { sheet: "/office/npc-claims.png", facing: "down" },
  },
  {
    id: "admin",
    x: 2.5,
    z: 2.2,
    radius: 1.5,
  },
  {
    id: "vetc",
    x: 17.2,
    z: 7.6,
    radius: 1.35,
  },
];

export function nearestInteractable(x: number, z: number) {
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const it of INTERACTABLES) {
    const dx = it.x - x;
    const dz = it.z - z;
    const d = Math.hypot(dx, dz);
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}

/**
 * The office expressed through the shared scene contract, so the office uses
 * the same player, camera and presence rendering as the workshop and lounge.
 */
export const OFFICE_WORLD: WorldMap = {
  MAP_W,
  MAP_H,
  collision: COLLISION,
  spawn: SPAWN,
  interactables: INTERACTABLES,
  tileSize: TILE,
};
