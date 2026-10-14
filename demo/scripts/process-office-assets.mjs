#!/usr/bin/env node
/**
 * Key magenta, slice sprite grids, nearest-neighbor downscale, write atlases.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "public/office/raw");
const OUT = path.join(ROOT, "public/office");
// Workshop + Lounge sheets live separately: they are AI-generated source art
// (see public/worlds/raw) rather than the hand-made office sheets.
const RAW2 = path.join(ROOT, "public/worlds/raw");
const OUT_WORKSHOP = path.join(ROOT, "public/workshop");
const OUT_LOUNGE = path.join(ROOT, "public/lounge");

/**
 * True for pixels belonging to the key background.
 *
 * The sheets are not all keyed with the same colour: the office tileset uses a
 * hot pink around rgb(203,17,114) while the generated sheets use #FF00FF. Match
 * the whole magenta/pink hue band instead of one exact value, and keep saturated
 * reds out of it — a red tool cart or a rust-red pickup is red with blue near
 * zero, whereas anything on the key side has blue lifting along with red.
 */
function isMagenta(r, g, b) {
  // Broad test for the key family: #FF00FF on the generated sheets, and the
  // office sheets' hot pink around rgb(203,17,114). Saturated reds stay out
  // because their blue channel is low.
  if (g < 115 && r >= 110 && b >= 80 && Math.min(r - g, (b - g) * 1.6) > 60) {
    return true;
  }
  // Bright key bleed. A glow or highlight blended over the key lifts green into
  // red and blue by the same amount — white over magenta gives rgb(255,128,255)
  // — which the broad test misses because green is no longer low. Those pixels
  // are still key, and leaving them paints a magenta halo around any lit prop.
  return Math.abs(r - b) < 45 && g < 170 && r - g > 55 && b - g > 55;
}

async function keyMagentaBuffer(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (isMagenta(data[i], data[i + 1], data[i + 2])) {
      data[i + 3] = 0;
    }
  }
  return { data, info };
}

/**
 * Nearest-neighbour downscale of an RGBA buffer.
 *
 * The atlases are tiny (32-96px cells) so doing this in JS costs nothing, and
 * it keeps the whole pipeline on one code path: sharp's extract/resize/compose
 * round-trips on keyed alpha come back flagged `premultiplied` and quietly
 * punch holes in cell edges, which shows up as seams when tiles butt together.
 */
function resizeNearest(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor(((y + 0.5) * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor(((x + 0.5) * sw) / dw));
      const si = (sy * sw + sx) * 4;
      const di = (y * dw + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return out;
}

/**
 * Spread opaque texels into transparent neighbours.
 *
 * Only floor tiles get this. A tile's trimmed box can still contain a keyed
 * magenta gap — the sheet has a dark base line a few pixels below the tile
 * itself — and a floor tile has to cover its cell completely or the gap shows
 * through as a seam where tiles meet. Sprites keep their transparency.
 */
function fillAlphaGaps(frame, w, h) {
  const NEIGHBOURS = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    const snapshot = Buffer.from(frame);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (snapshot[i + 3] > 250) continue;
        for (const [dx, dy] of NEIGHBOURS) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = (ny * w + nx) * 4;
          if (snapshot[j + 3] > 250) {
            frame[i] = snapshot[j];
            frame[i + 1] = snapshot[j + 1];
            frame[i + 2] = snapshot[j + 2];
            frame[i + 3] = 255;
            changed = true;
            break;
          }
        }
      }
    }
    if (!changed) break;
  }
}

/**
 * Slice a keyed sheet into an atlas.
 *
 * `trim` drops the magenta gutters the generator leaves between cells — the
 * office tileset needs it or the floor renders bright magenta grid lines.
 * `anchor` then decides where the trimmed content sits inside its frame:
 * - "center" (untrimmed) reproduces the plain cell-fit used for characters;
 * - "bottom" puts a prop's base on the frame's bottom edge, so `y: 0` in the
 *   scene means standing on the floor;
 * - "fill" stretches the tile to cover its cell completely so floors butt
 *   against their neighbours without seams.
 *
 * `srcCols`/`srcRows` describe the sheet; `cols`/`rows` how much of it to keep,
 * which is how a 4x4 generated sheet is cropped down to the 3x4 walk cycle.
 */
function sliceAtlas(data, info, srcCols, srcRows, cols, rows, frameW, frameH, opts = {}) {
  const { trim = false, anchor = "center" } = opts;
  const cellW = Math.floor(info.width / srcCols);
  const cellH = Math.floor(info.height / srcRows);
  const atlasW = cols * frameW;
  const atlasH = rows * frameH;
  const atlas = Buffer.alloc(atlasW * atlasH * 4);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = col * cellW;
      const top = row * cellH;

      let sx = 0;
      let sy = 0;
      let sw = cellW;
      let sh = cellH;
      if (trim) {
        const b = contentBounds(data, info, left, top, cellW, cellH);
        if (!b) continue;
        sx = b.x0;
        sy = b.y0;
        sw = b.width;
        sh = b.height;
      }

      const region = Buffer.alloc(sw * sh * 4);
      for (let y = 0; y < sh; y++) {
        const from = ((top + sy + y) * info.width + (left + sx)) * info.channels;
        data.copy(region, y * sw * 4, from, from + sw * info.channels);
      }

      let dw = frameW;
      let dh = frameH;
      if (trim && anchor !== "fill") {
        const k = Math.min(frameW / sw, frameH / sh);
        dw = Math.max(1, Math.round(sw * k));
        dh = Math.max(1, Math.round(sh * k));
      }

      const scaled = resizeNearest(region, sw, sh, dw, dh);
      if (anchor === "fill") fillAlphaGaps(scaled, dw, dh);
      const dx = Math.floor((frameW - dw) / 2);
      const dy =
        anchor === "bottom" ? frameH - dh : Math.floor((frameH - dh) / 2);

      const ox = col * frameW + dx;
      const oy = row * frameH + dy;
      for (let y = 0; y < dh; y++) {
        const so = y * dw * 4;
        const to = ((oy + y) * atlasW + ox) * 4;
        scaled.copy(atlas, to, so, so + dw * 4);
      }
    }
  }
  return { atlas, width: atlasW, height: atlasH };
}

async function writeAtlas({ atlas, width, height }, outPath) {
  await sharp(atlas, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
  return { width, height };
}

/**
 * Bounding box of the surviving (non-keyed) pixels inside one grid cell.
 *
 * The generator leaves a different amount of empty magenta around every prop,
 * so slicing cells verbatim would float some props above the floor and bury
 * others. Trimming to content and re-anchoring at the cell floor is what makes
 * `y: 0` mean "standing on the ground" for every sprite in the atlas.
 */
function contentBounds(data, info, cellLeft, cellTop, cellW, cellH) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < cellH; y++) {
    const rowStart = ((cellTop + y) * info.width + cellLeft) * info.channels;
    for (let x = 0; x < cellW; x++) {
      if (data[rowStart + x * info.channels + 3] < 24) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/**
 * Slice a grid, trimming each cell to its content.
 *
 * The generator leaves magenta gutters between cells. Slicing verbatim keeps
 * those gutters, which is invisible while an atlas is used for isolated sprites
 * but turns into bright magenta grid lines the moment the cells are laid
 * edge-to-edge as floor tiles.
 *
 * `anchor` decides where the trimmed content lands inside the frame:
 * - "bottom" for furniture, so the sprite's base is the frame's bottom edge and
 *   `y: 0` means standing on the ground;
 * - "fill" for floor tiles, which must cover their cell completely to butt
 *   against their neighbours without seams.
 */
async function processCharacter(name, rawFile) {
  const { data, info } = await keyMagentaBuffer(path.join(RAW, rawFile));
  const sliced = sliceAtlas(data, info, 3, 4, 3, 4, 32, 48);
  await writeAtlas(sliced, path.join(OUT, `${name}.png`));
  return { name, type: "character", ...sliced, frames: 12 };
}

/** Character sheet from the AI-generated raws, cropping an oversized grid. */
async function processWorldCharacter(name, rawFile, srcCols, srcRows, outDir) {
  const { data, info } = await keyMagentaBuffer(path.join(RAW2, rawFile));
  const sliced = sliceAtlas(data, info, srcCols, srcRows, 3, 4, 32, 48);
  await writeAtlas(sliced, path.join(outDir, `${name}.png`));
  return {
    name,
    type: "character",
    ...sliced,
    frames: 12,
    sourceGrid: `${srcCols}x${srcRows}`,
  };
}

/** Prop sheet from the AI-generated raws, bottom-anchored. */
async function processWorldProps(name, rawFile, labels, outDir, frame = 64) {
  const { data, info } = await keyMagentaBuffer(path.join(RAW2, rawFile));
  const sliced = sliceAtlas(data, info, 4, 2, 4, 2, frame, frame, {
    trim: true,
    anchor: "bottom",
  });
  await writeAtlas(sliced, path.join(outDir, `${name}.png`));
  return { name, type: "props", ...sliced, frames: 8, labels };
}

async function processTileset() {
  const { data, info } = await keyMagentaBuffer(path.join(RAW, "tileset.jpg"));
  // "fill" trims the magenta gutters out of every cell so the tiles butt
  // against their neighbours without bright seams.
  const sliced = sliceAtlas(data, info, 4, 4, 4, 4, 32, 32, {
    trim: true,
    anchor: "fill",
  });
  await writeAtlas(sliced, path.join(OUT, "tileset.png"));
  return { name: "tileset", type: "tileset", ...sliced, frames: 16 };
}

async function processProps() {
  const { data, info } = await keyMagentaBuffer(
    path.join(RAW, "props-sheet.jpg"),
  );
  const sliced = sliceAtlas(data, info, 4, 2, 4, 2, 64, 64);
  await writeAtlas(sliced, path.join(OUT, "props.png"));
  return {
    name: "props",
    type: "props",
    ...sliced,
    frames: 8,
    labels: [
      "desk",
      "chair",
      "plant",
      "cooler",
      "sofa",
      "lamp",
      "board",
      "vetc",
    ],
  };
}

async function processPortrait(name, rawFile) {
  const { data, info } = await keyMagentaBuffer(path.join(RAW, rawFile));
  const out = path.join(OUT, `${name}.png`);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .resize(96, 96, { kernel: sharp.kernel.nearest, fit: "cover" })
    .png()
    .toFile(out);
  return { name, type: "portrait", width: 96, height: 96 };
}

async function processBackdrop() {
  const out = path.join(OUT, "backdrop-city.png");
  await sharp(path.join(RAW, "backdrop-city.jpg"))
    .resize(512, 288, { kernel: sharp.kernel.nearest, fit: "cover" })
    .png()
    .toFile(out);
  return { name: "backdrop-city", type: "backdrop", width: 512, height: 288 };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    assets: {},
  };

  const chars = [
    ["player", "player-sheet.jpg"],
    ["npc-cs", "npc-cs-sheet.jpg"],
    ["npc-claims", "npc-claims-sheet.jpg"],
    ["npc-reception", "npc-reception-sheet.jpg"],
  ];
  for (const [name, file] of chars) {
    console.log("character", name);
    manifest.assets[name] = await processCharacter(name, file);
  }

  console.log("tileset");
  manifest.assets.tileset = await processTileset();

  console.log("props");
  manifest.assets.props = await processProps();

  for (const [name, file] of [
    ["portrait-cs", "portrait-cs.jpg"],
    ["portrait-claims", "portrait-claims.jpg"],
    ["portrait-reception", "portrait-reception.jpg"],
  ]) {
    console.log("portrait", name);
    manifest.assets[name] = await processPortrait(name, file);
  }

  console.log("backdrop");
  manifest.assets["backdrop-city"] = await processBackdrop();

  // ---- Workshop + Lounge -------------------------------------------------
  fs.mkdirSync(OUT_WORKSHOP, { recursive: true });
  fs.mkdirSync(OUT_LOUNGE, { recursive: true });

  console.log("workshop props");
  manifest.assets["workshop-props"] = await processWorldProps(
    "props",
    "workshop-props.jpg",
    ["lift", "cart", "tyres", "drum", "bench", "hoist", "shelf", "cabinet"],
    OUT_WORKSHOP,
  );

  console.log("workshop mechanic");
  manifest.assets["npc-mechanic"] = await processWorldCharacter(
    "npc-mechanic",
    "npc-mechanic.jpg",
    4,
    4,
    OUT_WORKSHOP,
  );

  console.log("workshop vehicles");
  // Vehicles get a larger frame: a car silhouette collapses into mush at 64px.
  manifest.assets["workshop-vehicles"] = await processWorldProps(
    "vehicles",
    "workshop-vehicles.png",
    ["sedan", "pickup", "welder", "engine", "aligner", "compressor", "trolley", "worklamp"],
    OUT_WORKSHOP,
    96,
  );

  console.log("lounge props");
  manifest.assets["lounge-props"] = await processWorldProps(
    "props",
    "lounge-props.jpg",
    ["sofa", "armchair", "table", "bar", "palm", "lamp", "rug", "bookshelf"],
    OUT_LOUNGE,
  );

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log("done →", OUT, OUT_WORKSHOP, OUT_LOUNGE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
