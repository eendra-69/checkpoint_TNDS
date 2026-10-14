"use client";

import { useMemo } from "react";
import { createTascoBannerTexture } from "@/components/office/brand-textures";

/**
 * The TASCO wall sign, shared by all three worlds.
 *
 * Only the office had one — workshop and lounge were borrowing the brand
 * palette but carried no mark of their own, so the rooms read as unrelated
 * demos. Every world now hangs the same sign with its own subtitle.
 *
 * The texture is drawn to a canvas in the browser, which is why this cannot be
 * a server component even though it only contributes one quad.
 *
 * `position` is the world-space centre. Walls are ~0.4 deep in these rooms and
 * the sign sits just in front of them, facing the follow camera on +z.
 */
export function TascoBanner({
  subtitle,
  position,
  width = 6.4,
  height = 1.6,
}: {
  subtitle: string;
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const banner = useMemo(() => createTascoBannerTexture(subtitle), [subtitle]);

  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={banner} roughness={0.5} />
    </mesh>
  );
}

/**
 * The same mark, laid flat on the floor as a welcome mat.
 *
 * The back wall is the natural home for a sign, but the follow camera looks
 * down at ~36 degrees from behind the player, which puts the far wall right
 * behind the HUD strip at spawn — the wall sign is only legible once you walk
 * toward it. The mat sits in the floor the player is standing on, so the brand
 * reads immediately on arrival.
 *
 * Laid at y=0.02 to stay clear of the ring markers these rooms already draw at
 * y=0.04.
 */
export function TascoFloorMat({
  subtitle,
  position,
  width = 3.2,
  depth = 0.8,
}: {
  subtitle: string;
  position: [number, number, number];
  width?: number;
  depth?: number;
}) {
  const banner = useMemo(() => createTascoBannerTexture(subtitle), [subtitle]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={banner} roughness={0.8} />
    </mesh>
  );
}