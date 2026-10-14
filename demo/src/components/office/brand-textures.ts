import * as THREE from "three";

/** 3D-scene palette. Mirrors the CSS tokens in globals.css. */
export const TASCO_3D = {
  deep: "#0b1f12", // tasco-ink
  navy: "#16351f", // tasco-forest
  sky: "#a3e635", // tasco-lime-bright
  pale: "#f1f7e6", // tasco-mist
  floor: "#e8f0dd", // tasco-floor
  lime: "#4d7c0f", // tasco-lime (AA-safe as text)
  leaf: "#2f6b1f", // tasco-leaf
  vetc: "#00a758", // VETC brand green — third-party, left alone
  white: "#ffffff",
};

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * `subtitle` is the room name under the wordmark. It stays English even in the
 * VI build because it is diegetic signage inside the scene — the same way a
 * real branch's wall sign is not rewritten per visitor's locale — while the UI
 * labels around it do come from the dictionary.
 */
export function createTascoBannerTexture(subtitle = "VIRTUAL OFFICE") {
  const { canvas, ctx } = makeCanvas(256, 64);
  ctx.fillStyle = TASCO_3D.deep;
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = TASCO_3D.sky;
  ctx.fillRect(0, 56, 256, 8);
  ctx.fillStyle = TASCO_3D.white;
  ctx.fillRect(10, 12, 28, 28);
  ctx.fillStyle = TASCO_3D.deep;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", 24, 27);
  ctx.fillStyle = TASCO_3D.white;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "left";
  ctx.fillText("TASCO", 48, 28);
  ctx.fillStyle = TASCO_3D.white;
  ctx.font = "bold 10px monospace";
  ctx.fillText(subtitle, 50, 46);
  return toTexture(canvas);
}

export function createNameplateTexture(label: string, accent = TASCO_3D.sky) {
  const { canvas, ctx } = makeCanvas(128, 32);
  ctx.fillStyle = TASCO_3D.deep;
  ctx.fillRect(0, 0, 128, 32);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 28);
  ctx.fillStyle = TASCO_3D.white;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 64, 17);
  return toTexture(canvas);
}
