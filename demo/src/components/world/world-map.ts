import type { Facing } from "@/lib/types";

/**
 * Contract every 3D scene implements. The office, workshop and lounge each
 * supply their own collision grid and interactables, and share the player,
 * camera, presence renderer and controls.
 */

export type InteractableDef = {
  id: string;
  x: number;
  z: number;
  radius: number;
  npc?: { sheet: string; facing?: Facing };
  /** Optional sprite offset so an NPC can stand slightly behind its marker. */
  npcOffset?: { x?: number; z?: number };
};

export type WorldMap = {
  MAP_W: number;
  MAP_H: number;
  /** 0 = solid, 1+ = walkable. */
  collision: number[][];
  spawn: { x: number; z: number };
  interactables: InteractableDef[];
  tileSize?: number;
};

export function worldToTile(x: number, z: number, tile = 1) {
  return { tx: Math.floor(x / tile), ty: Math.floor(z / tile) };
}

export function isWalkable(world: WorldMap, tx: number, ty: number) {
  if (tx < 0 || ty < 0 || tx >= world.MAP_W || ty >= world.MAP_H) return false;
  return world.collision[ty]?.[tx] !== 0;
}

export function nearestInteractable(
  world: WorldMap,
  x: number,
  z: number,
): InteractableDef | null {
  let best: InteractableDef | null = null;
  let bestD = Infinity;
  for (const it of world.interactables) {
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
 * Convenience builder: start from an open room and carve out solid furniture
 * footprints. Keeps the workshop/lounge maps readable without hand-typing
 * 2D arrays.
 */
export function buildWorldMap(input: {
  width: number;
  height: number;
  solid?: [number, number][];
  floor?: (x: number, y: number) => number;
  spawn: { x: number; z: number };
  interactables: InteractableDef[];
}): WorldMap {
  const { width, height, solid = [], floor, spawn, interactables } = input;
  const collision: number[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0),
  );

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      collision[y][x] = floor ? floor(x, y) : 1;
    }
  }

  // The collision grid does double duty: it feeds `TiledFloor` as a tileset
  // index *and* `isWalkable` as a 0-means-solid flag. Tileset cell 0 is a real
  // tile (marble), so a floor built straight from tileset indices can quietly
  // wall off cells it meant to leave walkable — which reads as "the player is
  // stuck" with nothing in the console. Catch it at build time instead.
  if (process.env.NODE_ENV !== "production" && floor) {
    let offender = "";
    for (let y = 1; y < height - 1 && !offender; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (floor(x, y) === 0) {
          offender = `${x},${y}`;
          break;
        }
      }
    }
    if (offender) {
      console.warn(
        `[buildWorldMap] floor(${offender}) returned 0, which the collision grid ` +
          `reads as solid. If this floor uses tileset indices, use a non-zero ` +
          `cell (TILESET.pale rather than TILESET.marble).`,
      );
    }
  }

  for (const [x, y] of solid) {
    if (y >= 0 && y < height && x >= 0 && x < width) collision[y][x] = 0;
  }

  return { MAP_W: width, MAP_H: height, collision, spawn, interactables, tileSize: 1 };
}
