import * as THREE from "three";

const COLORS = {
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
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function createTascoBannerTexture() {
  const { canvas, ctx } = makeCanvas(1024, 256);
  const g = ctx.createLinearGradient(0, 0, 1024, 256);
  g.addColorStop(0, COLORS.deep);
  g.addColorStop(0.55, COLORS.navy);
  g.addColorStop(1, "#1a4a7a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.fillStyle = "rgba(61,161,202,0.25)";
  ctx.beginPath();
  ctx.ellipse(180, 40, 220, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  // Logo mark
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.roundRect(72, 72, 88, 88, 18);
  ctx.fill();
  ctx.fillStyle = COLORS.deep;
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", 116, 118);

  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 96px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("TASCO", 200, 118);

  ctx.fillStyle = COLORS.sky;
  ctx.font = "600 28px sans-serif";
  ctx.fillText("BẢO HIỂM  ·  VIRTUAL OFFICE", 206, 178);

  return toTexture(canvas);
}

export function createNameplateTexture(label: string, accent = COLORS.sky) {
  const { canvas, ctx } = makeCanvas(512, 128);
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 64);
  return toTexture(canvas);
}

export function createVetcBadgeTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = COLORS.vetc;
  ctx.beginPath();
  ctx.roundRect(16, 16, 224, 224, 28);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VETC", 128, 118);
  ctx.font = "600 22px sans-serif";
  ctx.fillText("GIA HẠN", 128, 168);
  return toTexture(canvas);
}

export function createAdminBoardTexture() {
  const { canvas, ctx } = makeCanvas(768, 512);
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, 768, 512);
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, 768, 56);
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HỒ SƠ · ADMIN BOARD", 24, 36);

  const pins = [
    { x: 60, y: 120, c: COLORS.sky, t: "TNDS renewal" },
    { x: 280, y: 150, c: "#e8a838", t: "Claims queue" },
    { x: 500, y: 130, c: COLORS.vetc, t: "Consent OK" },
    { x: 140, y: 300, c: COLORS.navy, t: "Documents" },
    { x: 400, y: 320, c: "#c45c4a", t: "Need info?" },
  ];
  for (const p of pins) {
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(p.x, p.y, 160, 100);
    ctx.strokeStyle = "rgba(0,16,62,0.15)";
    ctx.strokeRect(p.x, p.y, 160, 100);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x + 80, p.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.deep;
    ctx.font = "600 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.t, p.x + 80, p.y + 58);
  }
  return toTexture(canvas);
}

export function createFloorTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(33,51,104,0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32, 0);
    ctx.lineTo(i * 32, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 32);
    ctx.lineTo(256, i * 32);
    ctx.stroke();
  }
  const tex = toTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export { COLORS as TASCO_3D };
