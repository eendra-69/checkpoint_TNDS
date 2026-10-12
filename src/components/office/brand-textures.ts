import * as THREE from "three";

export const TASCO_3D = {
  deep: "#00103e",
  navy: "#213368",
  sky: "#3da1ca",
  pale: "#eaf3f8",
  floor: "#e8eef6",
  vetc: "#25a55e",
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

export function createTascoBannerTexture() {
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
  ctx.fillStyle = TASCO_3D.sky;
  ctx.font = "bold 10px monospace";
  ctx.fillText("VIRTUAL OFFICE", 50, 46);
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
