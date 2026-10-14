import * as THREE from "three";

/**
 * Sub-texture for one cell of a sprite/tileset atlas.
 *
 * Clones share the underlying `Source`, so the decoded image is uploaded to the
 * GPU once no matter how many cells are addressed — only the sampler transform
 * differs per cell.
 */
export function atlasCell(
  atlas: THREE.Texture,
  cols: number,
  rows: number,
  index: number,
  opts: { mipmaps?: boolean } = {},
) {
  const t = atlas.clone();
  t.repeat.set(1 / cols, 1 / rows);
  const col = index % cols;
  const row = Math.floor(index / cols);
  // Texture V runs bottom-up, so the bottom row of the sheet is offset first.
  t.offset.set(col / cols, 1 - (row + 1) / rows);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts.mipmaps) {
    // Floors are seen at a glancing angle across many tiles; mips stop the
    // nearest-neighbour shimmer without giving up crisp texels up close.
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = true;
  } else {
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  }
  t.needsUpdate = true;
  return t;
}