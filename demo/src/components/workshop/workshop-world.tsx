"use client";

import { TASCO_3D } from "@/components/office/brand-textures";
import { buildWorldMap, type WorldMap } from "@/components/world/world-map";
import { PropLayer, type PropPlacement } from "@/components/world/prop-sprite";
import { TiledFloor, TiledPanel, TILESET } from "@/components/world/tiled-floor";

/**
 * Virtual Workshop — a service garage.
 *
 * Furniture comes from the same kind of magenta-keyed sprite atlas the office
 * uses (`/workshop/props.png` and `/workshop/vehicles.png`, both generated and
 * keyed by `scripts/process-office-assets.mjs`), and the floor and walls are
 * drawn from the shared office tileset. That is what makes this room read as
 * the same product as the office rather than a low-poly placeholder.
 */

const W = 18;
const H = 12;

/**
 * Floor indices are tileset cell numbers directly — the grid handed to
 * `TiledFloor` is the collision grid, so these double as walkable flags.
 */
const FLOOR = {
  concrete: TILESET.brick,
  bay: TILESET.vent,
  walkway: TILESET.checkered,
} as const;

/** Tints pull the grey tileset's stone and metal toward the garage palette. */
const FLOOR_TINTS: Record<number, string> = {
  [FLOOR.concrete]: "#b9c4b0",
  [FLOOR.bay]: "#8f9a86",
  [FLOOR.walkway]: "#cfd8c6",
  0: "#b9c4b0",
};

/** Cells in `/workshop/props.png`, row-major 4x2. */
const PROP = {
  lift: 0,
  cart: 1,
  tyres: 2,
  drum: 3,
  bench: 4,
  hoist: 5,
  shelf: 6,
  cabinet: 7,
} as const;

/** Cells in `/workshop/vehicles.png`, row-major 4x2 at 96px. */
const VEHICLE = {
  sedan: 0,
  pickup: 1,
  welder: 2,
  engine: 3,
  aligner: 4,
  compressor: 5,
  trolley: 6,
  workLamp: 7,
} as const;

/** Cars sit in the two service bays; only the west one is on the lift. */
const BAY_A = { x: 4.5, z: 3.5 };
const BAY_B = { x: 12.5, z: 3.5 };

export const WORKSHOP_MAP: WorldMap = buildWorldMap({
  width: W,
  height: H,
  spawn: { x: 9, z: 10 },
  floor: (x, y) => {
    // Two recessed service bays at the back.
    const inBayA = x >= 3 && x <= 6 && y >= 2 && y <= 5;
    const inBayB = x >= 11 && x <= 14 && y >= 2 && y <= 5;
    if (inBayA || inBayB) return FLOOR.bay;
    // Walkway down the middle to the stations.
    if (y >= 8) return FLOOR.walkway;
    return FLOOR.concrete;
  },
  solid: [
    // Bay footprints.
    ...[3, 4, 5, 6].flatMap((x) => [2, 3, 4, 5].map((z) => [x, z] as [number, number])),
    ...[11, 12, 13, 14].flatMap((x) =>
      [2, 3, 4, 5].map((z) => [x, z] as [number, number]),
    ),
    // Workbench along the left wall.
    [1, 5], [2, 5], [1, 6], [2, 6],
    // Tire stacks.
    [16, 7], [16, 8],
    // Oil drums.
    [16, 3], [16, 4],
    // Parts shelving against the east wall.
    [17, 6], [17, 7],
    // Tool cabinet beside the claims desk.
    [11, 9],
    // Claims desk.
    [12, 9], [13, 9], [14, 9],
  ],
  interactables: [
    {
      id: "advisor",
      x: 8.5,
      z: 8.4,
      radius: 1.6,
      npc: { sheet: "/workshop/npc-mechanic.png", facing: "down" },
    },
    {
      id: "claims",
      x: 13,
      z: 10.2,
      radius: 1.6,
      npc: { sheet: "/office/npc-claims.png", facing: "down" },
    },
    {
      id: "inspect",
      x: 4.5,
      z: 8.4,
      radius: 1.7,
      npc: { sheet: "/workshop/npc-mechanic.png", facing: "down" },
      npcOffset: { x: -1.6 },
    },
  ],
});

/** Placements drawn from `/workshop/props.png`. */
const PROP_SPRITES: PropPlacement[] = [
  // Bay A: lift under a sedan, lifted clear of the slab.
  { index: PROP.lift, x: BAY_A.x, z: BAY_A.z, scale: 1.9 },
  // Workbench run along the west wall.
  { index: PROP.bench, x: 1.6, z: 5.5, scale: 1.8 },
  { index: PROP.cabinet, x: 1.6, z: 7.6, scale: 1.35 },
  // Engine hoist beside the empty work bay.
  { index: PROP.hoist, x: 8.5, z: 2.6, scale: 1.5 },
  // Tyres and drums stacked in the east corner.
  { index: PROP.tyres, x: 16.5, z: 7.5, scale: 1.15 },
  { index: PROP.tyres, x: 16.5, z: 8.5, scale: 1.15 },
  { index: PROP.drum, x: 16.5, z: 3.5, scale: 1.2 },
  { index: PROP.drum, x: 16.5, z: 4.5, scale: 1.2 },
  // Parts shelving on the east wall.
  { index: PROP.shelf, x: 17.1, z: 6.5, scale: 1.5 },
  // Tool cart and the claims desk cabinet.
  { index: PROP.cart, x: 11.4, z: 9.5, scale: 1.25 },
  { index: PROP.cabinet, x: 13, z: 9.5, scale: 1.5 },
];

/** Placements drawn from `/workshop/vehicles.png`. */
const VEHICLE_SPRITES: PropPlacement[] = [
  // Bay A: sedan up on the lift.
  { index: VEHICLE.sedan, x: BAY_A.x, z: BAY_A.z, scale: 2.1, y: 1.05 },
  // Bay B: pickup parked on the slab.
  { index: VEHICLE.pickup, x: BAY_B.x, z: BAY_B.z, scale: 2.1 },
  // Equipment around the inspection pad. These frames are almost entirely
  // filled by the object, so they read much larger than the sparse prop sheet
  // entries at the same nominal scale — keep them near player height.
  { index: VEHICLE.aligner, x: 6.6, z: 9.6, scale: 1.15 },
  { index: VEHICLE.welder, x: 2.4, z: 9.7, scale: 1.1 },
  { index: VEHICLE.engine, x: 9.6, z: 6.4, scale: 1.05 },
  { index: VEHICLE.compressor, x: 15.4, z: 10.6, scale: 1.05 },
  { index: VEHICLE.workLamp, x: 7.8, z: 7.4, scale: 1.15 },
];

export function WorkshopWorldNodes() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#dcecd0" />
      <directionalLight position={[8, 14, 6]} intensity={0.85} color="#fff4dc" />
      {/* Bay lights over the two lifts. */}
      <pointLight position={[5, 3.2, 3]} intensity={1.1} distance={9} color="#eaf7d8" />
      <pointLight position={[13, 3.2, 3]} intensity={1.1} distance={9} color="#eaf7d8" />
      <pointLight position={[9, 2.6, 9]} intensity={0.5} distance={8} color={TASCO_3D.sky} />

      <TiledFloor
        cells={WORKSHOP_MAP.collision}
        width={W}
        height={H}
        tints={FLOOR_TINTS}
      />

      {/* Walls — back and sides only; the near wall stays out of the camera. */}
      <mesh position={[W / 2, 1.4, 0.2]}>
        <boxGeometry args={[W, 2.8, 0.35]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 1.4, H / 2]}>
        <boxGeometry args={[0.35, 2.8, H]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.9} />
      </mesh>
      <mesh position={[W - 0.2, 1.4, H / 2]}>
        <boxGeometry args={[0.35, 2.8, H]} />
        <meshStandardMaterial color={TASCO_3D.deep} roughness={0.9} />
      </mesh>

      {/* Roller shutters on the back wall, tiled from the shared tileset so the
          garage's metalwork matches the office's art rather than flat grey. */}
      {[4.5, 9, 13.5].map((sx) => (
        <TiledPanel
          key={sx}
          tile={TILESET.shutter}
          width={3.6}
          height={2.4}
          position={[sx, 1.5, 0.4]}
          repeat={2}
          tint="#93a08e"
        />
      ))}

      <PropLayer src="/workshop/props.png" props={PROP_SPRITES} />
      <PropLayer src="/workshop/vehicles.png" props={VEHICLE_SPRITES} />

      {/* Inspection pad marker. */}
      <mesh position={[4.5, 0.02, 8.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 28]} />
        <meshBasicMaterial color={TASCO_3D.sky} transparent opacity={0.75} />
      </mesh>

      {/* Wall-top trim only — never a full-width beam over the play area. */}
      {[
        { w: W, x: W / 2, z: 0.42, rot: 0 },
        { w: H, x: 0.42, z: H / 2, rot: Math.PI / 2 },
        { w: H, x: W - 0.42, z: H / 2, rot: Math.PI / 2 },
      ].map((t, i) => (
        <mesh key={i} position={[t.x, 2.82, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[t.w, 0.16, 0.3]} />
          <meshStandardMaterial color={TASCO_3D.lime} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}