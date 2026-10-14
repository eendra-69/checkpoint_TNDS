"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { atlasCell } from "./atlas";

/**
 * Shared tileset floors and wall panels.
 *
 * All three rooms draw from the same 4x4 office tileset (`office/tileset.png`),
 * so the marble lobby, the garage's brick and vent slabs and the lounge's
 * timber all come from one art source. The office previously resolved its floor
 * types to flat colours while this atlas sat unused; wiring it up here is what
 * makes the three rooms look like one product instead of three demos.
 */

/** Cell index into the 4x4 tileset. Row-major, top-left is 0. */
export const TILESET = {
  marble: 0,
  navyCarpet: 1,
  wood: 2,
  stone: 11,
  panel: 4,
  shutter: 5,
  window: 6,
  carpetTrim: 7,
  checkered: 8,
  woodDark: 9,
  woodDeep: 10,
  pale: 3,
  rug: 12,
  brick: 13,
  vent: 14,
  ventFrame: 15,
} as const;

export const TILESET_URL = "/office/tileset.png";
const COLS = 4;
const ROWS = 4;

type TileMaterials = Record<number, THREE.MeshStandardMaterial>;

/**
 * One material per distinct tile index, shared by every tile that uses it.
 * A 20x14 floor is 280 tiles; giving each its own material would mean 280
 * shader programs for what is really a dozen distinct looks.
 *
 * `tints` must be a module-level constant so the identity is stable across
 * renders and the materials are not rebuilt every frame.
 */
function useTileMaterials(atlas: THREE.Texture, tints: Record<number, string>) {
  const materials = useMemo(() => {
    const out: TileMaterials = {};
    for (const [index, tint] of Object.entries(tints)) {
      const i = Number(index);
      out[i] = new THREE.MeshStandardMaterial({
        map: atlasCell(atlas, COLS, ROWS, i, { mipmaps: true }),
        color: tint,
        roughness: 0.95,
      });
    }
    return out;
  }, [atlas, tints]);

  // `useMemo` has no teardown of its own, so without this every room remount
  // would leave a material and an atlas clone behind on the GPU. The atlas
  // cells share one decoded image, so this only drops this component's
  // reference to it — the base texture is drei's to dispose.
  useEffect(() => {
    return () => {
      for (const material of Object.values(materials)) {
        material.map?.dispose();
        material.dispose();
      }
    };
  }, [materials]);

  return materials;
}

/**
 * One merged `BufferGeometry` per distinct tile index, so a room draws one
 * floor mesh per look instead of one per cell.
 *
 * Every tile keeps its exact vertex data — the merge only concatenates the
 * per-tile geometries, and the old per-mesh rotation is baked in with
 * `rotateX(-Math.PI / 2)`, which puts each vertex in the same world place the
 * mesh transform did. Quads stay full `tileSize` wide: they are coplanar, so
 * insetting them leaves gaps that read as a grid across the whole floor.
 */
function useFloorLayers(
  cells: number[][],
  width: number,
  height: number,
  tileSize: number,
  y: number,
) {
  const layers = useMemo(() => {
    const byIndex = new Map<number, THREE.BufferGeometry[]>();

    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const index = cells[ty]?.[tx] ?? 0;
        const tile = new THREE.PlaneGeometry(tileSize, tileSize);
        // Rotation then translation, matching the mesh transform it replaces.
        tile.rotateX(-Math.PI / 2);
        tile.translate(tx * tileSize + tileSize / 2, y, ty * tileSize + tileSize / 2);
        const group = byIndex.get(index);
        if (group) group.push(tile);
        else byIndex.set(index, [tile]);
      }
    }

    return [...byIndex].map(([index, tiles]) => {
      const geometry = mergeGeometries(tiles, false);
      for (const tile of tiles) tile.dispose();
      geometry.name = `floor-tile-${index}`;
      // Merging leaves the bounds unset; frustum culling needs them up front.
      geometry.computeBoundingSphere();
      return { index, geometry };
    });
  }, [cells, width, height, tileSize, y]);

  useEffect(() => {
    return () => {
      for (const layer of layers) layer.geometry.dispose();
    };
  }, [layers]);

  return layers;
}

export function TiledFloor({
  cells,
  width,
  height,
  tints,
  tileSize = 1,
  y = 0,
}: {
  /** Row-major tile indices, one per grid cell. */
  cells: number[][];
  width: number;
  height: number;
  /** `tile index -> colour multiplier`. Unlisted indices fall back to white. */
  tints: Record<number, string>;
  tileSize?: number;
  y?: number;
}) {
  const atlas = useTexture(TILESET_URL);
  const materials = useTileMaterials(atlas, tints);
  const layers = useFloorLayers(cells, width, height, tileSize, y);

  return (
    <group>
      {layers.map(({ index, geometry }) => (
        // `materials[index]` is deliberately passed through undefined for an
        // untinted cell: R3F skips undefined props, so the mesh keeps the
        // default white material it has always fallen back to.
        <mesh key={index} geometry={geometry} material={materials[index]} receiveShadow />
      ))}
    </group>
  );
}

/**
 * A wall panel textured from the tileset, tiled across its face.
 *
 * Kept flat against the wall rather than extruded so it can never occlude the
 * floor from the follow camera.
 */
export function TiledPanel({
  tile,
  width,
  height,
  position,
  rotation,
  tint = "#ffffff",
  repeat = 1,
}: {
  tile: number;
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  tint?: string;
  /** How many times the cell repeats along the panel's width. */
  repeat?: number;
}) {
  const atlas = useTexture(TILESET_URL);
  const material = useMemo(() => {
    const map = atlasCell(atlas, COLS, ROWS, tile, { mipmaps: true });
    map.repeat.set(repeat, 1);
    return new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.92 });
  }, [atlas, tile, tint, repeat]);

  useEffect(() => {
    return () => {
      material.map?.dispose();
      material.dispose();
    };
  }, [material]);

  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}