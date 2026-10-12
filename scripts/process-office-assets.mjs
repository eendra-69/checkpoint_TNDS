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

const MAGENTA = { r: 255, g: 0, b: 255 };
const TOL = 95; // JPEG bleed around key color

function isMagenta(r, g, b) {
  // Catch pure and JPEG-smeared magenta / hot pink key
  if (r > 140 && b > 140 && g < 160 && r + b - 2 * g > 80) return true;
  if (r > 200 && b > 180 && g < 180) return true;
  const dr = Math.abs(r - MAGENTA.r);
  const dg = Math.abs(g - MAGENTA.g);
  const db = Math.abs(b - MAGENTA.b);
  if (dr < TOL && dg < TOL && db < TOL) return true;
  return false;
}

async function keyMagentaBuffer(inputPath) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isMagenta(r, g, b)) {
      data[i + 3] = 0;
    }
  }
  const pngBuf = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  return { pngBuf, width: info.width, height: info.height };
}

async function sliceGrid(pngBuf, width, height, cols, rows, frameW, frameH) {
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const frames = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const buf = await sharp(pngBuf)
        .extract({
          left: col * cellW,
          top: row * cellH,
          width: cellW,
          height: cellH,
        })
        .resize(frameW, frameH, { kernel: sharp.kernel.nearest, fit: "fill" })
        .png()
        .toBuffer();
      frames.push(buf);
    }
  }
  return frames;
}

async function buildAtlas(frames, cols, frameW, frameH, outPath) {
  const rows = Math.ceil(frames.length / cols);
  const composites = frames.map((input, i) => ({
    input,
    left: (i % cols) * frameW,
    top: Math.floor(i / cols) * frameH,
  }));
  await sharp({
    create: {
      width: cols * frameW,
      height: rows * frameH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
  return { width: cols * frameW, height: rows * frameH, cols, rows, frameW, frameH };
}

async function processCharacter(name, rawFile) {
  const { pngBuf, width, height } = await keyMagentaBuffer(
    path.join(RAW, rawFile),
  );
  const frames = await sliceGrid(pngBuf, width, height, 3, 4, 32, 48);
  const atlas = await buildAtlas(
    frames,
    3,
    32,
    48,
    path.join(OUT, `${name}.png`),
  );
  return { name, type: "character", ...atlas, frames: frames.length };
}

async function processTileset() {
  const { pngBuf, width, height } = await keyMagentaBuffer(
    path.join(RAW, "tileset.jpg"),
  );
  const frames = await sliceGrid(pngBuf, width, height, 4, 4, 32, 32);
  const atlas = await buildAtlas(frames, 4, 32, 32, path.join(OUT, "tileset.png"));
  return { name: "tileset", type: "tileset", ...atlas, frames: frames.length };
}

async function processProps() {
  const { pngBuf, width, height } = await keyMagentaBuffer(
    path.join(RAW, "props-sheet.jpg"),
  );
  const frames = await sliceGrid(pngBuf, width, height, 4, 2, 64, 64);
  const atlas = await buildAtlas(frames, 4, 64, 64, path.join(OUT, "props.png"));
  return {
    name: "props",
    type: "props",
    ...atlas,
    frames: frames.length,
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
  const { pngBuf } = await keyMagentaBuffer(path.join(RAW, rawFile));
  const out = path.join(OUT, `${name}.png`);
  await sharp(pngBuf)
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

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log("done →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
