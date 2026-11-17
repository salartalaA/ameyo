import type { Building, WorldProp } from './types';

// ---------------------------------------------------------------------------
// Deterministic pixel-art sprite baker
// Buildings and street props are rendered once into world-resolution canvases,
// then composited by the engine. Every surface gets seams, wear, signage,
// hardware, and small storytelling details instead of flat color blocks.
// ---------------------------------------------------------------------------

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function ri(rng: () => number, min: number, max: number): number {
  return Math.floor(rr(rng, min, max + 1));
}

function pick<T>(rng: () => number, values: T[]): T {
  return values[Math.floor(rng() * values.length) % values.length];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function hline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
  px(ctx, x, y, w, 1, color);
}

function vline(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string): void {
  px(ctx, x, y, 1, h, color);
}

function rectBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, thickness = 1): void {
  px(ctx, x, y, w, thickness, color);
  px(ctx, x, y + h - thickness, w, thickness, color);
  px(ctx, x, y, thickness, h, color);
  px(ctx, x + w - thickness, y, thickness, h, color);
}

export function linePx(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  thickness = 1
): void {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x1 + ((x2 - x1) * i) / steps);
    const y = Math.round(y1 + ((y2 - y1) * i) / steps);
    px(ctx, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
  }
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [80, 90, 110];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t
  );
}

function shade(hex: string, amount: number): string {
  return mixHex(hex, amount >= 0 ? '#ffffff' : '#000000', Math.abs(amount));
}

function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
  count: number,
  rng: () => number
): void {
  for (let i = 0; i < count; i++) {
    px(
      ctx,
      Math.round(x + rng() * w),
      Math.round(y + rng() * h),
      rng() < 0.82 ? 1 : 2,
      rng() < 0.82 ? 1 : 2,
      pick(rng, colors)
    );
  }
}

function ditherRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  a: string,
  b: string,
  rng: () => number,
  density = 0.28
): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (rng() < density) px(ctx, xx, yy, 1, 1, rng() < 0.5 ? a : b);
    }
  }
}

function grimeStreaks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: () => number,
  count = 10
): void {
  for (let i = 0; i < count; i++) {
    const sx = Math.round(x + rng() * w);
    const sy = Math.round(y + rng() * Math.max(4, h * 0.55));
    const len = ri(rng, 5, Math.max(8, h * 0.65));
    const shadeA = rng() < 0.7 ? 'rgba(5, 9, 18, 0.18)' : 'rgba(148, 163, 184, 0.08)';
    vline(ctx, sx, sy, len, shadeA);
    if (rng() < 0.35) vline(ctx, sx + 1, sy, Math.max(3, len * 0.55), 'rgba(5, 9, 18, 0.12)');
  }
}

function drawACUnit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tint = '#8fa0b5'
): void {
  px(ctx, x + 1, y + 2, w, h, 'rgba(4, 7, 15, 0.45)');
  px(ctx, x, y, w, h, shade(tint, -0.34));
  px(ctx, x + 1, y + 1, w - 2, 2, shade(tint, 0.08));
  px(ctx, x + 2, y + 3, w - 4, h - 5, tint);
  const fanX = x + Math.floor(w / 2) - 3;
  const fanY = y + Math.floor(h / 2) - 3;
  px(ctx, fanX - 1, fanY - 1, 8, 8, '#18202d');
  px(ctx, fanX, fanY, 6, 6, '#0b111b');
  px(ctx, fanX + 1, fanY + 1, 4, 1, '#334155');
  px(ctx, fanX + 1, fanY + 4, 4, 1, '#334155');
  vline(ctx, x + 2, y + h - 2, 2, '#0f172a');
  vline(ctx, x + w - 3, y + h - 2, 2, '#0f172a');
}

function drawWindowPane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  litColor: string | null,
  frameColor: string,
  rng: () => number,
  detail: 'flat' | 'mullion' | 'storefront' = 'mullion'
): void {
  px(ctx, x - 1, y - 1, w + 2, h + 2, frameColor);
  px(ctx, x, y, w, h, '#0a1120');
  if (litColor) {
    px(ctx, x + 1, y + 1, w - 2, h - 2, litColor);
    px(ctx, x + 1, y + 1, w - 2, 2, shade(litColor, 0.28));
    px(ctx, x + 1, y + h - 3, w - 2, 2, shade(litColor, -0.24));
    if (detail !== 'flat') {
      const cols = Math.max(1, Math.floor(w / 9));
      const rows = Math.max(1, Math.floor(h / 10));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = x + 2 + c * Math.floor((w - 4) / cols);
          const wy = y + 2 + r * Math.floor((h - 4) / rows);
          const ww = Math.max(2, Math.floor((w - 4) / cols) - 2);
          const wh = Math.max(2, Math.floor((h - 4) / rows) - 2);
          px(ctx, wx, wy, ww, wh, shade(litColor, rng() < 0.72 ? -0.08 : 0.18));
        }
      }
    }
  } else {
    px(ctx, x + 1, y + 1, w - 2, Math.floor(h * 0.52), '#16233a');
    px(ctx, x + 1, y + Math.floor(h * 0.55), w - 2, h - Math.floor(h * 0.55) - 1, '#0d1524');
  }

  if (detail !== 'flat') {
    vline(ctx, x + Math.floor(w / 2), y + 1, h - 2, frameColor);
    hline(ctx, x + 1, y + Math.floor(h / 2), w - 2, frameColor);
  }

  // Glass reflection pixels
  const refl = litColor ? 'rgba(255,255,255,0.22)' : 'rgba(147,197,253,0.16)';
  linePx(ctx, x + 2, y + h - 2, x + Math.floor(w * 0.55), y + 2, refl, 1);
  if (w > 18) linePx(ctx, x + 4, y + h - 2, x + Math.floor(w * 0.48), y + 2, 'rgba(255,255,255,0.10)', 1);

  // sill and lintel
  px(ctx, x - 2, y + h, w + 4, 2, shade(frameColor, -0.1));
  px(ctx, x - 1, y - 3, w + 2, 2, shade(frameColor, 0.08));
}

function drawBalcony(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string
): void {
  px(ctx, x - 3, y, w + 6, 3, shade(color, -0.28));
  px(ctx, x - 2, y + 3, w + 4, 5, shade(color, -0.12));
  for (let bx = x; bx <= x + w; bx += 5) vline(ctx, bx, y + 3, 5, shade(color, 0.18));
  px(ctx, x - 1, y + 8, w + 2, 2, shade(color, -0.34));
}

function drawLouverVent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(ctx, x, y, w, h, '#263246');
  rectBorder(ctx, x, y, w, h, '#111827', 1);
  for (let yy = y + 2; yy < y + h - 1; yy += 2) hline(ctx, x + 1, yy, w - 2, '#3b4a61');
}

function drawPipeRun(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color = '#5b6b80'): void {
  vline(ctx, x, y, h, shade(color, -0.35));
  vline(ctx, x + 1, y, h, color);
  vline(ctx, x + 3, y, h, shade(color, -0.2));
  for (let yy = y + 5; yy < y + h; yy += 18) px(ctx, x - 1, yy, 6, 2, '#2c3648');
}

function drawWallPoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: string[],
  rng: () => number,
  vertical = false
): void {
  px(ctx, x - 1, y - 1, w + 2, h + 2, '#d7dee8');
  px(ctx, x, y, w, h, pick(rng, ['#e8edf4', '#f3ead9', '#dbeafe', '#fee2e2', '#dcfce7']));
  const ink = pick(rng, ['#172033', '#7f1d1d', '#075985', '#14532d']);
  if (vertical) {
    for (let i = 0; i < Math.min(5, Math.floor(h / 9)); i++) {
      const len = ri(rng, 3, Math.max(4, w - 4));
      hline(ctx, x + 2, y + 3 + i * 8, len, ink);
    }
  } else {
    px(ctx, x + 2, y + 2, Math.max(3, w - 4), 3, ink);
    for (let i = 0; i < Math.min(5, Math.floor((h - 8) / 7)); i++) {
      hline(ctx, x + 2, y + 8 + i * 7, Math.max(4, w - 4 - ri(rng, 0, 8)), palette[i % palette.length]);
    }
  }
  px(ctx, x + Math.floor(w / 2) - 1, y - 1, 2, 3, '#ef4444');
}

function drawUtilityBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tint: string): void {
  px(ctx, x + 1, y + 1, w, h, 'rgba(4, 7, 15, 0.4)');
  px(ctx, x, y, w, h, shade(tint, -0.32));
  px(ctx, x + 1, y + 1, w - 2, h - 2, tint);
  rectBorder(ctx, x, y, w, h, shade(tint, -0.48), 1);
  px(ctx, x + 3, y + 3, w - 6, 2, shade(tint, 0.2));
  px(ctx, x + w - 5, y + h / 2 - 1, 2, 3, '#111827');
}

// ---------------------------------------------------------------------------
// Building sprite
// ---------------------------------------------------------------------------

function renderRoof(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const w = b.w;
  const rh = b.roofHeight;
  px(ctx, 0, 0, w, rh, b.roofColor);

  // Membrane seams and gravel patches
  const seamGap = ri(rng, 18, 28);
  for (let x = seamGap; x < w - 4; x += seamGap + ri(rng, -4, 8)) {
    vline(ctx, x, 3, rh - 6, alpha('#0b1120', 0.34));
    vline(ctx, x + 1, 3, rh - 6, alpha('#ffffff', 0.045));
  }
  for (let y = ri(rng, 12, 18); y < rh - 8; y += ri(rng, 18, 30)) {
    hline(ctx, 3, y, w - 6, alpha('#0b1120', 0.22));
  }
  speckle(ctx, 4, 4, w - 8, rh - 8, [shade(b.roofColor, -0.18), shade(b.roofColor, 0.1), '#0d1420'], Math.floor(w * rh * 0.018), rng);

  // Roof edge light and drip shadow
  hline(ctx, 0, 0, w, shade(b.roofColor, 0.12));
  hline(ctx, 0, rh - 1, w, shade(b.roofColor, -0.32));
  px(ctx, 0, rh - 3, w, 3, alpha('#000000', 0.2));

  // Roof clutter: vents, AC condensers, hatch, antenna
  const clutterCount = Math.max(1, Math.floor(w / 130));
  for (let i = 0; i < clutterCount; i++) {
    const vx = ri(rng, 18, Math.max(20, w - 54));
    const vy = ri(rng, 10, Math.max(12, rh - 24));
    if (rng() < 0.58) {
      drawLouverVent(ctx, vx, vy, ri(rng, 16, 24), ri(rng, 8, 12));
    } else {
      drawACUnit(ctx, vx, vy, ri(rng, 18, 28), ri(rng, 10, 14), pick(rng, ['#9aa9bd', '#8494aa', '#b8c2cf']));
    }
  }

  if (b.kind === 'apartment' || b.kind === 'house') {
    const tx = Math.floor(w * 0.68);
    px(ctx, tx, 12, 26, 22, '#243247');
    rectBorder(ctx, tx, 12, 26, 22, '#101827', 1);
    px(ctx, tx + 4, 16, 18, 14, '#0b1220');
    for (let y = 17; y < 29; y += 3) hline(ctx, tx + 5, y, 16, '#29405c');
    vline(ctx, tx + 12, 10, 28, '#64748b');
  }

  if (b.kind === 'arcade' || b.kind === 'karaoke' || b.id.includes('hotel')) {
    const ax = Math.floor(w * 0.22);
    vline(ctx, ax, 4, rh - 8, '#475569');
    vline(ctx, ax + 1, 4, rh - 8, '#94a3b8');
    px(ctx, ax - 3, 4, 8, 3, b.accentColor);
    px(ctx, ax - 5, rh - 8, 12, 3, '#334155');
  }
}

function renderFacadeBase(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;
  const wallH = Math.max(20, wallBottom - wallTop);

  px(ctx, 0, rh, b.w, 5, b.trimColor);
  px(ctx, 0, rh + 4, b.w, 1, shade(b.trimColor, -0.35));
  px(ctx, 0, wallTop, b.w, wallH, b.wallColor);

  // Wall panel seams and floor lines
  const seamGap = ri(rng, 15, 24);
  for (let x = seamGap; x < b.w - 5; x += seamGap + ri(rng, -4, 7)) {
    vline(ctx, x, wallTop, wallH, alpha('#0a0f1c', 0.16));
    vline(ctx, x + 1, wallTop, wallH, alpha('#ffffff', 0.035));
  }
  for (let y = wallTop + ri(rng, 22, 34); y < wallBottom - 8; y += ri(rng, 28, 46)) {
    hline(ctx, 2, y, b.w - 4, alpha('#0a0f1c', 0.13));
  }

  // Pilasters and corner shadow
  px(ctx, 0, wallTop, 4, wallH, shade(b.wallColor, -0.22));
  px(ctx, b.w - 4, wallTop, 4, wallH, shade(b.wallColor, -0.22));
  px(ctx, 4, wallTop, 1, wallH, alpha('#ffffff', 0.06));
  px(ctx, b.w - 5, wallTop, 1, wallH, alpha('#000000', 0.12));

  // Weathering: bottom grime and rain streaks
  for (let i = 0; i < 5; i++) {
    const gh = ri(rng, 8, Math.max(10, wallH * 0.3));
    px(ctx, ri(rng, 4, Math.max(5, b.w - 20)), wallBottom - gh, ri(rng, 8, 24), gh, alpha('#05080f', 0.12));
  }
  grimeStreaks(ctx, 5, wallTop + 4, b.w - 10, wallH - 8, rng, Math.floor(b.w / 42));

  // Plinth and ground-contact AO
  px(ctx, 0, b.h - 9, b.w, 9, '#101622');
  hline(ctx, 0, b.h - 9, b.w, shade(b.trimColor, -0.1));
  px(ctx, 2, b.h - 4, b.w - 4, 4, alpha('#000000', 0.34));
}

function renderUpperFloor(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const wallTop = b.roofHeight + 4;
  const wallH = b.h - 9 - wallTop;
  if (wallH < 42) return;

  const commercial = ['konbini', 'ramen', 'cafe', 'arcade', 'karaoke', 'izakaya', 'gas_station'].includes(b.kind);
  const upperBottom = commercial ? wallTop + Math.min(62, Math.max(34, wallH * 0.48)) : wallTop + wallH;
  const cols = Math.max(1, Math.floor((b.w - 34) / (commercial ? 72 : 58)));
  const rows = Math.max(1, Math.floor((upperBottom - wallTop - 18) / 48));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = 18 + c * Math.floor((b.w - 36) / cols) + ri(rng, -2, 2);
      const wy = wallTop + 10 + r * 48 + ri(rng, -1, 1);
      const ww = commercial ? 38 : 32;
      const wh = commercial ? 28 : 24;
      const litRoll = rng();
      const litColor = litRoll < 0.48 ? pick(rng, ['#fde68a', '#fef3c7', '#bae6fd', '#fecaca']) : null;
      drawWindowPane(ctx, wx, wy, ww, wh, litColor, '#263247', rng);

      if (b.kind === 'apartment') {
        drawBalcony(ctx, wx - 4, wy + wh + 2, ww + 8, b.trimColor);
        if (rng() < 0.55) drawACUnit(ctx, wx + ww - 2, wy + wh + 5, 14, 9, '#9aa9bd');
      } else if (rng() < 0.42 && commercial) {
        drawACUnit(ctx, wx + ww - 3, wy + wh + 2, 15, 10, pick(rng, ['#9aa9bd', '#8494aa']));
      }
    }
  }

  // Small wall-mounted signage/pipes between upper windows
  if (rng() < 0.75) {
    const pxPos = ri(rng, 18, Math.max(20, b.w - 60));
    drawUtilityBox(ctx, pxPos, wallTop + 6, ri(rng, 14, 22), ri(rng, 18, 26), pick(rng, ['#52647c', '#6b5b3f', '#44536a']));
  }
  if (b.w > 170 && rng() < 0.6) {
    drawPipeRun(ctx, b.w - 12, wallTop + 5, Math.min(90, wallH - 12));
  }
}

function renderKonbini(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;
  const wallH = wallBottom - wallTop;

  // Fascia panel reserved for dynamic neon sign
  px(ctx, 8, wallTop + 3, b.w - 16, 23, '#0d1728');
  rectBorder(ctx, 8, wallTop + 3, b.w - 16, 23, b.accentColor, 2);
  px(ctx, 10, wallTop + 5, b.w - 20, 2, alpha('#ffffff', 0.18));
  speckle(ctx, 12, wallTop + 7, b.w - 24, 16, [b.accentColor, '#ffffff', '#0f172a'], 42, rng);

  // Upper transom windows
  for (let x = 20; x < b.w - 48; x += 54) {
    drawWindowPane(ctx, x, wallTop + 31, 42, 18, '#fef9c3', '#263247', rng, 'flat');
  }

  // Storefront glass and interior
  const gx = 14;
  const gy = wallTop + 55;
  const gw = b.w - 28;
  const gh = wallBottom - gy - 8;
  px(ctx, gx - 2, gy - 2, gw + 4, gh + 4, '#9fb4c8');
  px(ctx, gx, gy, gw, gh, '#dbeafe');
  px(ctx, gx + 2, gy + 2, gw - 4, gh - 4, '#fff7d6');

  // Rear shelving / coolers
  px(ctx, gx + 8, gy + 7, 92, 18, '#67e8f9');
  px(ctx, gx + 10, gy + 9, 14, 14, '#0284c7');
  px(ctx, gx + 28, gy + 9, 14, 14, '#16a34a');
  px(ctx, gx + 46, gy + 9, 14, 14, '#ea580c');
  px(ctx, gx + 64, gy + 9, 14, 14, '#db2777');
  px(ctx, gx + 82, gy + 9, 12, 14, '#eab308');
  px(ctx, gx + 8, gy + 28, 92, 8, '#475569');
  for (let i = 0; i < 8; i++) px(ctx, gx + 12 + i * 11, gy + 30, 7, 5, pick(rng, ['#f87171', '#facc15', '#60a5fa', '#34d399', '#f472b6']));

  // Magazine and snack racks
  px(ctx, gx + 110, gy + 8, 62, 20, '#64748b');
  for (let i = 0; i < 6; i++) px(ctx, gx + 114 + i * 9, gy + 10, 6, 14, pick(rng, ['#ef4444', '#3b82f6', '#facc15', '#22c55e']));
  px(ctx, gx + 180, gy + 8, 58, 24, '#94a3b8');
  px(ctx, gx + 184, gy + 12, 24, 16, '#fbbf24');
  px(ctx, gx + 214, gy + 12, 20, 16, '#e2e8f0');

  // Checkout counter and warm clerk silhouette
  px(ctx, gx + gw - 76, gy + gh - 34, 66, 22, '#92400e');
  px(ctx, gx + gw - 72, gy + gh - 30, 58, 10, '#b45309');
  px(ctx, gx + gw - 42, gy + gh - 42, 10, 10, '#1f2937');
  px(ctx, gx + gw - 40, gy + gh - 40, 6, 5, '#f4c5ae');

  // Sliding door tracks and glass reflections
  const doorX = gx + Math.floor(gw * 0.52);
  px(ctx, doorX, gy, 3, gh, '#1e3a8a');
  px(ctx, doorX + 34, gy, 3, gh, '#1e3a8a');
  px(ctx, doorX - 2, gy + gh - 3, 42, 3, '#64748b');
  linePx(ctx, gx + 8, gy + gh - 3, gx + gw - 10, gy + 5, 'rgba(255,255,255,0.28)', 2);
  linePx(ctx, gx + 20, gy + gh - 3, gx + gw - 24, gy + 5, 'rgba(255,255,255,0.14)', 1);

  // Exterior details: umbrella stand, mat, posters, crate stack
  px(ctx, gx - 16, gy + gh - 18, 10, 18, '#0369a1');
  linePx(ctx, gx - 14, gy + gh - 18, gx - 10, gy + gh - 34, '#64748b', 1);
  linePx(ctx, gx - 11, gy + gh - 18, gx - 7, gy + gh - 32, '#f97316', 1);
  drawWallPoster(ctx, gx - 34, wallTop + 36, 18, 24, [b.accentColor, '#fbbf24'], rng, true);
  px(ctx, gx + gw + 8, gy + gh - 14, 18, 10, '#78350f');
  speckle(ctx, gx + gw + 9, gy + gh - 13, 16, 8, ['#fef3c7', '#38bdf8', '#f87171'], 12, rng);
}

function renderNorenShop(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const isRamen = b.kind === 'ramen';
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;
  const wallH = wallBottom - wallTop;
  const wood = isRamen ? '#5b3226' : '#4a2c20';
  const woodDark = shade(wood, -0.24);

  px(ctx, 0, wallTop, b.w, wallH, wood);
  for (let x = 8; x < b.w - 4; x += 13) {
    vline(ctx, x, wallTop, wallH, woodDark);
    vline(ctx, x + 1, wallTop, wallH, alpha('#ffffff', 0.05));
  }
  grimeStreaks(ctx, 8, wallTop + 4, b.w - 16, wallH - 10, rng, Math.floor(b.w / 34));

  // Facade sign board area (dynamic neon renders over it)
  px(ctx, 14, wallTop + 5, b.w - 28, 24, '#140d0a');
  rectBorder(ctx, 14, wallTop + 5, b.w - 28, 24, b.accentColor, 2);

  // Menu boards and small windows
  const menuX = isRamen ? 24 : b.w - 88;
  px(ctx, menuX, wallTop + 36, 58, 34, '#1c1712');
  rectBorder(ctx, menuX, wallTop + 36, 58, 34, '#cbd5e1', 1);
  for (let i = 0; i < 4; i++) hline(ctx, menuX + 5, wallTop + 41 + i * 7, 48 - (i % 2) * 10, pick(rng, ['#fef3c7', '#fdba74', '#93c5fd']));

  drawWindowPane(ctx, isRamen ? 96 : 24, wallTop + 42, isRamen ? 76 : 88, Math.max(30, wallH - 62), isRamen ? '#fef3c7' : '#fecaca', '#3f2d20', rng, 'storefront');

  // Entrance + noren
  const doorX = isRamen ? 118 : b.w - 72;
  const doorW = 48;
  px(ctx, doorX - 3, wallTop + 40, doorW + 6, wallH - 48, '#2b1b14');
  px(ctx, doorX, wallTop + 44, doorW, wallH - 52, '#120c08');
  const curtain = isRamen ? '#b91c1c' : '#1e3a8a';
  for (let i = 0; i < 4; i++) {
    px(ctx, doorX + i * 12, wallTop + 42, 10, 20, curtain);
    px(ctx, doorX + i * 12, wallTop + 50, 10, 2, shade(curtain, 0.24));
    px(ctx, doorX + i * 12 + 4, wallTop + 56, 2, 6, '#f8fafc');
  }
  hline(ctx, doorX - 2, wallTop + 42, doorW + 4, '#78350f');

  // Lantern mounts and warm door spill pixels
  const swayX = Math.sin(b.id.length * 1.7) * 0; // static bake; runtime sign layer supplies life
  px(ctx, 18 + swayX, wallTop + 42, 10, 13, '#dc2626');
  px(ctx, 20 + swayX, wallTop + 45, 6, 7, '#fecaca');
  px(ctx, b.w - 30 + swayX, wallTop + 42, 10, 13, '#dc2626');
  px(ctx, b.w - 28 + swayX, wallTop + 45, 6, 7, '#fecaca');
  px(ctx, doorX + 4, wallTop + wallH - 18, doorW - 8, 8, '#fbbf24');
}

function renderCafe(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;
  const wallH = wallBottom - wallTop;

  px(ctx, 0, wallTop, b.w, wallH, b.wallColor);
  for (let x = 10; x < b.w - 4; x += 18) vline(ctx, x, wallTop, wallH, alpha('#000000', 0.13));
  grimeStreaks(ctx, 8, wallTop + 5, b.w - 16, wallH - 8, rng, Math.floor(b.w / 48));

  px(ctx, 12, wallTop + 4, b.w - 24, 22, '#0f172a');
  rectBorder(ctx, 12, wallTop + 4, b.w - 24, 22, b.accentColor, 2);

  const windowW = Math.max(70, b.w - 116);
  drawWindowPane(ctx, 20, wallTop + 34, windowW, Math.max(42, wallH - 74), '#fbbf24', '#3f2d20', rng, 'storefront');

  // Interior silhouettes: counter, cups, hanging lamps
  px(ctx, 26, wallTop + wallH - 30, windowW - 12, 14, '#451a03');
  for (let i = 0; i < Math.floor(windowW / 18); i++) {
    px(ctx, 32 + i * 18, wallTop + wallH - 28, 5, 5, '#1f2937');
    px(ctx, 33 + i * 18, wallTop + wallH - 27, 3, 2, '#fef3c7');
  }
  for (let i = 0; i < 3; i++) {
    const lx = 38 + i * Math.floor(windowW / 3);
    vline(ctx, lx, wallTop + 42, 10, '#1f2937');
    px(ctx, lx - 2, wallTop + 52, 5, 3, '#fbbf24');
  }

  const doorX = b.w - 68;
  px(ctx, doorX - 3, wallTop + 38, 54, wallH - 46, '#2a1a10');
  px(ctx, doorX, wallTop + 42, 48, wallH - 50, '#120b06');
  px(ctx, doorX + 4, wallTop + 48, 40, wallH - 62, '#fbbf24');
  vline(ctx, doorX + 24, wallTop + 48, wallH - 62, '#3f2d20');
  drawWallPoster(ctx, doorX + 8, wallTop + 78, 18, 26, ['#fbbf24', '#38bdf8'], rng, true);
}

function renderResidential(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const wallTop = b.roofHeight + 4;
  const wallBottom = b.h - 9;
  const wallH = wallBottom - wallTop;
  px(ctx, 0, wallTop, b.w, wallH, b.wallColor);
  for (let x = 9; x < b.w - 4; x += 17) vline(ctx, x, wallTop, wallH, alpha('#000000', 0.11));

  const cols = Math.max(2, Math.floor((b.w - 34) / 56));
  const rows = Math.max(1, Math.floor((wallH - 20) / 56));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = 18 + c * Math.floor((b.w - 36) / cols);
      const wy = wallTop + 10 + r * 52;
      const lit = ((c * 5 + r * 3 + hashString(b.id)) % 4) !== 0;
      drawWindowPane(ctx, wx, wy, 34, 25, lit ? pick(rng, ['#fde68a', '#fef3c7', '#bfdbfe']) : null, '#263247', rng);
      if (b.kind === 'apartment') {
        drawBalcony(ctx, wx - 4, wy + 28, 42, b.trimColor);
        if (rng() < 0.5) drawACUnit(ctx, wx + 18, wy + 33, 15, 10, '#9aa9bd');
        if (rng() < 0.22) {
          hline(ctx, wx - 5, wy + 20, 44, '#64748b');
          px(ctx, wx + 2, wy + 18, 4, 5, pick(rng, ['#f87171', '#60a5fa', '#e2e8f0']));
          px(ctx, wx + 12, wy + 19, 4, 5, pick(rng, ['#facc15', '#34d399', '#f8fafc']));
        }
      }
    }
  }

  // Entrance and house details
  const doorX = Math.floor(b.w / 2) - (b.kind === 'house' ? 16 : 20);
  px(ctx, doorX - 3, wallBottom - 42, b.kind === 'house' ? 38 : 46, 42, '#101827');
  px(ctx, doorX, wallBottom - 38, b.kind === 'house' ? 32 : 40, 38, b.kind === 'house' ? '#3f2d20' : '#1e293b');
  px(ctx, doorX + 5, wallBottom - 32, b.kind === 'house' ? 22 : 30, 24, b.kind === 'house' ? '#fbbf24' : '#fde68a');
  vline(ctx, doorX + (b.kind === 'house' ? 15 : 19), wallBottom - 32, 24, '#111827');
  px(ctx, doorX + 3, wallBottom - 6, b.kind === 'house' ? 26 : 34, 6, '#475569');

  if (b.kind === 'house') {
    px(ctx, doorX - 8, wallBottom - 48, 48, 5, '#7c4a21');
    for (let x = doorX - 6; x < doorX + 38; x += 8) vline(ctx, x, wallBottom - 47, 4, '#5b3217');
    drawWallPoster(ctx, 18, wallTop + 16, 20, 24, ['#fbbf24'], rng, true);
  } else {
    drawUtilityBox(ctx, 14, wallBottom - 48, 18, 24, '#52647c');
    drawUtilityBox(ctx, b.w - 34, wallBottom - 42, 18, 20, '#6b5b3f');
  }
}

function renderArcadeLike(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;
  const wallH = wallBottom - wallTop;

  px(ctx, 0, wallTop, b.w, wallH, b.wallColor);
  for (let x = 12; x < b.w - 4; x += 24) vline(ctx, x, wallTop, wallH, alpha('#ffffff', 0.04));
  grimeStreaks(ctx, 8, wallTop + 4, b.w - 16, wallH - 8, rng, Math.floor(b.w / 52));

  // Marquee panel reserved for dynamic sign
  px(ctx, 12, wallTop + 4, b.w - 24, 26, '#0a0d1d');
  rectBorder(ctx, 12, wallTop + 4, b.w - 24, 26, b.accentColor, 2);
  speckle(ctx, 16, wallTop + 8, b.w - 32, 18, [b.accentColor, '#22d3ee', '#f472b6', '#ffffff'], 60, rng);

  // Glowing glass bays
  const bays = Math.max(2, Math.floor((b.w - 42) / 72));
  for (let i = 0; i < bays; i++) {
    const bx = 18 + i * Math.floor((b.w - 42) / bays);
    const bw = Math.min(58, Math.floor((b.w - 42) / bays) - 8);
    const lit = i % 2 === 0 ? '#f472b6' : '#22d3ee';
    px(ctx, bx - 1, wallTop + 40, bw + 2, wallH - 52, '#0b1020');
    px(ctx, bx, wallTop + 42, bw, wallH - 56, lit);
    px(ctx, bx + 2, wallTop + 44, bw - 4, wallH - 60, shade(lit, -0.42));
    for (let yy = wallTop + 48; yy < wallBottom - 18; yy += 12) hline(ctx, bx + 3, yy, bw - 6, shade(lit, 0.22));
    vline(ctx, bx + Math.floor(bw / 2), wallTop + 42, wallH - 56, '#0b1020');
  }

  // Entrance
  const doorX = Math.floor(b.w / 2) - 22;
  px(ctx, doorX - 3, wallTop + 42, 52, wallH - 50, '#111827');
  px(ctx, doorX, wallTop + 46, 46, wallH - 54, '#020617');
  px(ctx, doorX + 4, wallTop + 52, 38, wallH - 62, '#67e8f9');
  px(ctx, doorX + 22, wallTop + 52, 3, wallH - 62, '#0b1020');

  // Posters and stickers
  for (let i = 0; i < 3; i++) {
    drawWallPoster(ctx, 16 + i * 28, wallTop + 78 + (i % 2) * 18, 18, 24, [b.accentColor, '#22d3ee', '#f472b6'], rng, i === 1);
  }
  px(ctx, b.w - 34, wallTop + 92, 18, 18, '#facc15');
  px(ctx, b.w - 31, wallTop + 95, 12, 12, '#111827');
}

function renderGasStation(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  const wallTop = rh + 4;
  const wallBottom = b.h - 9;

  // Back kiosk
  px(ctx, 28, 0, b.w - 56, 72, b.roofColor);
  rectBorder(ctx, 28, 0, b.w - 56, 72, shade(b.roofColor, -0.25), 2);
  px(ctx, 34, 8, b.w - 68, 54, b.wallColor);
  for (let x = 42; x < b.w - 70; x += 28) vline(ctx, x, 10, 50, alpha('#000000', 0.15));

  // Service window with bright interior
  px(ctx, 72, 34, Math.max(80, b.w - 190), 30, '#111827');
  px(ctx, 76, 38, Math.max(72, b.w - 198), 22, '#fff7cf');
  for (let x = 84; x < b.w - 112; x += 18) {
    px(ctx, x, 42, 8, 14, pick(rng, ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b']));
  }
  px(ctx, 84, 58, Math.max(60, b.w - 210), 4, '#92400e');

  // Forecourt and canopy
  px(ctx, 8, 84, b.w - 16, Math.max(20, wallTop - 78), '#263247');
  speckle(ctx, 12, 88, b.w - 24, Math.max(16, wallTop - 86), ['#31415a', '#1d293b', '#3a4c68'], Math.floor(b.w * 1.2), rng);
  px(ctx, 0, 80, b.w, 38, b.roofColor);
  px(ctx, 0, 112, b.w, 6, b.accentColor);
  px(ctx, 4, 84, b.w - 8, 24, '#202d42');
  rectBorder(ctx, 4, 84, b.w - 8, 24, shade(b.roofColor, -0.2), 1);

  // Canopy light strips and support columns
  for (let x = 28; x < b.w - 30; x += 46) {
    px(ctx, x, 87, 18, 3, '#fff7d6');
    px(ctx, x + 2, 118, 12, 34, '#9aa9bd');
    px(ctx, x, 150, 16, 5, '#334155');
  }

  // Fuel hoses, payment post, trash, safety bollards
  for (let x = 70; x < b.w - 80; x += 110) {
    px(ctx, x, 158, 20, 30, '#e5e7eb');
    px(ctx, x + 3, 162, 14, 12, '#111827');
    px(ctx, x + 5, 164, 10, 8, '#34d399');
    px(ctx, x + 8, 180, 4, 22, '#111827');
    linePx(ctx, x + 10, 202, x + 4, 214, '#334155', 1);
  }
  px(ctx, b.w - 88, 158, 18, 34, '#dc2626');
  px(ctx, b.w - 85, 162, 12, 10, '#fecaca');
  px(ctx, 34, b.h - 18, 34, 12, '#14532d');
  speckle(ctx, 36, b.h - 17, 30, 10, ['#22c55e', '#166534', '#4ade80'], 18, rng);

  // Sign panel reserved for dynamic text
  px(ctx, 38, 88, b.w - 76, 18, '#07101d');
  rectBorder(ctx, 38, 88, b.w - 76, 18, b.accentColor, 2);
}

function renderShrine(ctx: CanvasRenderingContext2D, b: Building, rng: () => number): void {
  const rh = b.roofHeight;
  px(ctx, 0, 0, b.w, b.h, '#1a1712');

  // Gravel/courtyard apron in front
  px(ctx, 16, b.h - 58, b.w - 32, 54, '#3a3530');
  speckle(ctx, 20, b.h - 54, b.w - 40, 48, ['#4a443c', '#2d2924', '#575046'], 120, rng);
  for (let x = 28; x < b.w - 20; x += 22) hline(ctx, x, b.h - 30, 10, alpha('#ffffff', 0.05));

  // Veranda and hall
  px(ctx, 34, b.h - 92, b.w - 68, 38, '#5b3a26');
  for (let x = 40; x < b.w - 70; x += 12) vline(ctx, x, b.h - 90, 34, '#3f2718');
  px(ctx, 48, b.h - 130, b.w - 96, 42, '#4a2e22');
  px(ctx, b.w / 2 - 22, b.h - 112, 44, 28, '#fbbf24');
  px(ctx, b.w / 2 - 18, b.h - 108, 36, 20, '#78350f');
  px(ctx, b.w / 2 - 8, b.h - 104, 16, 12, '#fef3c7');

  // Layered tiled roof
  px(ctx, 20, rh - 14, b.w - 40, 26, '#211a1d');
  px(ctx, 30, rh - 22, b.w - 60, 14, '#2c2228');
  for (let x = 34; x < b.w - 40; x += 12) {
    linePx(ctx, x, rh - 20, x + 8, rh - 8, '#171116', 1);
  }
  hline(ctx, 24, rh - 12, b.w - 48, '#3b2d33');
  hline(ctx, 34, rh - 22, b.w - 68, '#46343c');

  // Ridge ornaments and hanging lantern
  px(ctx, b.w / 2 - 8, rh - 30, 16, 8, '#dc2626');
  px(ctx, b.w / 2 - 2, rh - 34, 4, 6, '#fbbf24');
  px(ctx, b.w / 2 - 18, b.h - 86, 12, 16, '#dc2626');
  px(ctx, b.w / 2 - 15, b.h - 82, 6, 8, '#fecaca');

  // Torii gate in courtyard
  const tx = 30;
  const tw = b.w - 60;
  px(ctx, tx, b.h - 52, tw, 8, '#dc2626');
  px(ctx, tx - 8, b.h - 46, tw + 16, 5, '#991b1b');
  px(ctx, tx + 12, b.h - 42, 10, 42, '#dc2626');
  px(ctx, tx + tw - 22, b.h - 42, 10, 42, '#dc2626');
  px(ctx, tx + 12, b.h - 34, tw - 24, 3, '#7f1d1d');
  px(ctx, tx + 18, b.h - 30, 4, 30, '#b91c1c');
  px(ctx, tx + tw - 24, b.h - 30, 4, 30, '#b91c1c');

  // Offerings and purification basin
  px(ctx, b.w / 2 - 18, b.h - 66, 36, 14, '#6b4f2a');
  px(ctx, b.w / 2 - 12, b.h - 63, 24, 7, '#fbbf24');
  px(ctx, b.w - 54, b.h - 42, 22, 14, '#475569');
  px(ctx, b.w - 51, b.h - 39, 16, 7, '#94a3b8');
}

function renderBuildingSprite(b: Building): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(b.w, b.h);
  const rng = mulberry32(hashString(`building:${b.id}`));

  renderRoof(ctx, b, rng);
  renderFacadeBase(ctx, b, rng);

  if (b.kind === 'konbini') {
    renderKonbini(ctx, b, rng);
  } else if (b.kind === 'ramen' || b.kind === 'izakaya') {
    renderNorenShop(ctx, b, rng);
  } else if (b.kind === 'cafe') {
    renderCafe(ctx, b, rng);
  } else if (b.kind === 'apartment' || b.kind === 'house') {
    renderResidential(ctx, b, rng);
  } else if (b.kind === 'arcade' || b.kind === 'karaoke') {
    renderArcadeLike(ctx, b, rng);
  } else if (b.kind === 'gas_station') {
    renderGasStation(ctx, b, rng);
  } else if (b.kind === 'shrine') {
    renderShrine(ctx, b, rng);
  } else {
    renderUpperFloor(ctx, b, rng);
    renderCafe(ctx, b, rng);
  }

  // Shared facade clutter: posters, meters, pipes, stickers near the base
  const wallTop = b.roofHeight + 4;
  const wallBottom = b.h - 9;
  if (!['gas_station', 'shrine'].includes(b.kind) && b.w > 120) {
    if (rng() < 0.72) drawWallPoster(ctx, ri(rng, 16, Math.max(18, b.w - 70)), ri(rng, wallTop + 30, Math.max(wallTop + 31, wallBottom - 70)), ri(rng, 18, 28), ri(rng, 24, 36), [b.accentColor, '#fbbf24', '#38bdf8'], rng);
    if (rng() < 0.52) drawUtilityBox(ctx, ri(rng, 12, Math.max(14, b.w - 46)), wallBottom - ri(rng, 38, 54), ri(rng, 14, 22), ri(rng, 18, 28), pick(rng, ['#52647c', '#6b5b3f', '#44536a']));
    if (rng() < 0.4) drawPipeRun(ctx, ri(rng, 8, Math.max(10, b.w - 18)), wallTop + 8, Math.min(80, wallBottom - wallTop - 20), '#5b6b80');
  }

  return canvas;
}

const buildingSpriteCache = new Map<string, HTMLCanvasElement>();

export function getBuildingSprite(b: Building): HTMLCanvasElement {
  const key = `${b.id}:${b.w}x${b.h}:${b.roofHeight}`;
  let sprite = buildingSpriteCache.get(key);
  if (!sprite) {
    sprite = renderBuildingSprite(b);
    buildingSpriteCache.set(key, sprite);
  }
  return sprite;
}

// ---------------------------------------------------------------------------
// Prop sprites
// ---------------------------------------------------------------------------

function renderLampSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  const glow = p.lightColor || '#fbbf24';
  px(ctx, p.w / 2 - 2, 8, 4, p.h - 18, '#263246');
  vline(ctx, p.w / 2 - 2, 8, p.h - 18, '#64748b');
  px(ctx, p.w / 2 - 6, p.h - 7, 12, 5, '#111827');
  px(ctx, p.w / 2 - 7, 0, 14, 8, '#1f2937');
  rectBorder(ctx, p.w / 2 - 7, 0, 14, 8, '#0b1220', 1);
  px(ctx, p.w / 2 - 4, 2, 8, 4, glow);
  px(ctx, p.w / 2 - 2, 3, 4, 2, '#fff7d6');
  // curved bracket suggestion
  linePx(ctx, p.w / 2 - 5, 8, p.w / 2 - 7, 2, '#475569', 1);
  return c;
}

function renderVendingSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 1, 2, p.w - 2, p.h - 3, 'rgba(3,7,15,0.55)');
  px(ctx, 0, 0, p.w, p.h, '#17202f');
  px(ctx, 2, 2, p.w - 4, p.h - 4, '#dbe4ee');
  px(ctx, 3, 3, p.w - 6, 3, '#f8fafc');
  px(ctx, 3, p.h - 11, p.w - 6, 8, '#334155');

  // Brand stripe and display
  px(ctx, 3, 4, p.w - 6, 5, p.lightColor || '#38bdf8');
  px(ctx, 4, 10, p.w - 8, 18, '#0f172a');
  px(ctx, 5, 12, p.w - 10, 14, '#bae6fd');
  const cols = 4;
  for (let i = 0; i < cols; i++) {
    for (let r = 0; r < 2; r++) {
      px(ctx, 6 + i * 6, 13 + r * 6, 4, 5, ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#eab308', '#f8fafc'][(i + r * 3) % 8]);
    }
  }
  // buttons, coin slot, pickup bay
  for (let i = 0; i < 3; i++) px(ctx, 7 + i * 7, 30, 4, 3, ['#ef4444', '#22c55e', '#f59e0b'][i]);
  px(ctx, p.w - 9, 29, 3, 8, '#111827');
  px(ctx, 5, p.h - 8, p.w - 10, 5, '#020617');
  px(ctx, 7, p.h - 7, p.w - 14, 2, '#475569');
  return c;
}

function renderBenchSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 4, p.w - 4, 3, 'rgba(3,7,15,0.5)');
  px(ctx, 4, p.h - 10, 5, 8, '#1f2937');
  px(ctx, p.w - 9, p.h - 10, 5, 8, '#1f2937');
  // slatted seat and back
  for (let i = 0; i < 4; i++) {
    const yy = p.h - 16 + i * 3;
    px(ctx, 0, yy, p.w, 3, i % 2 ? '#8a5a2b' : '#a56f36');
    hline(ctx, 1, yy, p.w - 2, '#c98d4b');
  }
  px(ctx, 0, 0, p.w, 5, '#5b3217');
  px(ctx, 2, 1, p.w - 4, 2, '#7c4a21');
  for (let i = 0; i < 4; i++) {
    const yy = 6 + i * 3;
    px(ctx, 0, yy, p.w, 3, i % 2 ? '#7c4a21' : '#96602f');
    hline(ctx, 1, yy, p.w - 2, '#a56f36');
  }
  px(ctx, 4, 6, 3, p.h - 16, '#3f2718');
  px(ctx, p.w - 7, 6, 3, p.h - 16, '#3f2718');
  return c;
}

function renderBicycleSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.45)');
  const wheel = '#263246';
  const rim = '#8ea0b8';
  const frame = p.id.includes('book') ? '#7c3aed' : p.id.includes('res') ? '#0ea5e9' : '#f59e0b';
  ctx.strokeStyle = wheel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(8, p.h - 7, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(26, p.h - 7, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    linePx(ctx, 8 + Math.cos(a) * 5, p.h - 7 + Math.sin(a) * 5, 8 - Math.cos(a) * 5, p.h - 7 - Math.sin(a) * 5, rim, 1);
    linePx(ctx, 26 + Math.cos(a) * 5, p.h - 7 + Math.sin(a) * 5, 26 - Math.cos(a) * 5, p.h - 7 - Math.sin(a) * 5, rim, 1);
  }
  linePx(ctx, 8, p.h - 7, 15, p.h - 13, frame, 2);
  linePx(ctx, 15, p.h - 13, 22, p.h - 7, frame, 2);
  linePx(ctx, 22, p.h - 7, 26, p.h - 7, frame, 2);
  linePx(ctx, 15, p.h - 13, 15, p.h - 17, frame, 2);
  linePx(ctx, 12, p.h - 17, 19, p.h - 17, '#1f2937', 2);
  linePx(ctx, 26, p.h - 7, 28, p.h - 13, '#475569', 1);
  px(ctx, 25, p.h - 14, 5, 4, '#334155');
  return c;
}

function renderPhoneBoothSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.55)');
  px(ctx, 0, 0, p.w, p.h, '#14532d');
  rectBorder(ctx, 0, 0, p.w, p.h, '#052e16', 2);
  px(ctx, 4, 6, p.w - 8, p.h - 10, '#a7f3d0');
  px(ctx, 6, 9, p.w - 12, p.h - 18, '#047857');
  px(ctx, 9, 16, p.w - 18, 16, '#ecfdf5');
  px(ctx, 12, 19, p.w - 24, 4, '#6ee7b7');
  px(ctx, 12, 26, p.w - 30, 3, '#86efac');
  px(ctx, p.w / 2 - 1, 6, 2, p.h - 10, '#052e16');
  px(ctx, 4, 4, p.w - 8, 3, '#166534');
  return c;
}

function renderGasPumpSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.5)');
  px(ctx, 0, 0, p.w, p.h, '#e5e7eb');
  rectBorder(ctx, 0, 0, p.w, p.h, '#9ca3af', 1);
  px(ctx, 3, 4, p.w - 6, 13, '#0f172a');
  px(ctx, 5, 6, p.w - 10, 9, '#34d399');
  px(ctx, 5, 8, p.w - 10, 2, '#a7f3d0');
  px(ctx, 4, 20, p.w - 8, 12, '#10b981');
  px(ctx, 6, 23, p.w - 12, 6, '#d1fae5');
  px(ctx, p.w - 7, 8, 2, 12, '#111827');
  return c;
}

function renderShrineLanternSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 3, p.h - 7, p.w - 6, 5, '#334155');
  px(ctx, 7, p.h - 18, p.w - 14, 12, '#64748b');
  for (let y = p.h - 16; y < p.h - 7; y += 3) hline(ctx, 8, y, p.w - 16, '#475569');
  px(ctx, 4, 5, p.w - 8, 11, '#fb923c');
  px(ctx, 6, 7, p.w - 12, 7, '#fed7aa');
  px(ctx, 1, 0, p.w - 2, 6, '#334155');
  px(ctx, 4, 1, p.w - 8, 2, '#475569');
  return c;
}

function renderUtilityPoleSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 4, 4, 6, p.h - 8, '#2e2623');
  vline(ctx, 5, 4, p.h - 8, '#5b4b3f');
  px(ctx, 0, 10, p.w, 3, '#475569');
  px(ctx, 0, 18, p.w, 3, '#475569');
  px(ctx, 2, 16, 10, 7, '#1e293b');
  px(ctx, p.w - 8, 16, 7, 6, '#1e293b');
  linePx(ctx, 0, 12, p.w, 12, '#334155', 1);
  return c;
}

function renderBollardSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.5)');
  px(ctx, 2, 3, p.w - 4, p.h - 5, '#facc15');
  px(ctx, 3, 4, p.w - 6, 5, '#fef08a');
  px(ctx, 2, p.h - 8, p.w - 4, 3, '#a16207');
  px(ctx, 2, 10, p.w - 4, 2, '#713f12');
  return c;
}

function renderDumpsterSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.5)');
  px(ctx, 0, 3, p.w, p.h - 6, '#14532d');
  px(ctx, 2, 1, p.w - 4, p.h - 9, '#166534');
  rectBorder(ctx, 0, 3, p.w, p.h - 6, '#052e16', 1);
  for (let x = 5; x < p.w - 4; x += 7) vline(ctx, x, 5, p.h - 12, '#14532d');
  px(ctx, p.w - 9, p.h - 12, 5, 5, '#111827');
  return c;
}

function renderPottedPlantSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.45)');
  px(ctx, p.w / 2 - 7, p.h - 12, 14, 9, '#7c2d12');
  px(ctx, p.w / 2 - 5, p.h - 14, 10, 3, '#9a3412');
  px(ctx, p.w / 2 - 5, p.h - 24, 10, 12, '#14532d');
  px(ctx, p.w / 2 - 8, p.h - 22, 16, 9, '#166534');
  px(ctx, p.w / 2 - 2, p.h - 30, 4, 8, '#22c55e');
  px(ctx, p.w / 2 - 8, p.h - 29, 4, 5, '#4ade80');
  return c;
}

function renderCarSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  const body = p.id.includes('taxi') ? '#facc15' : p.id.includes('blue') ? '#2563eb' : '#475569';
  px(ctx, 3, p.h - 3, p.w - 6, 2, 'rgba(3,7,15,0.55)');
  px(ctx, 7, 5, p.w - 14, 8, shade(body, -0.18));
  px(ctx, 10, 2, p.w - 20, 7, body);
  px(ctx, 13, 4, p.w - 26, 4, '#93c5fd');
  px(ctx, p.w - 15, 4, 5, 4, '#fef08a');
  px(ctx, 4, 13, p.w - 8, 5, shade(body, -0.3));
  px(ctx, 4, 18, p.w - 8, p.h - 21, shade(body, -0.12));
  px(ctx, 9, 20, p.w - 18, 3, '#111827');
  for (const wx of [12, p.w - 14]) {
    px(ctx, wx, p.h - 8, 7, 7, '#0b0f17');
    px(ctx, wx + 1, p.h - 7, 5, 5, '#334155');
    px(ctx, wx + 2, p.h - 6, 3, 3, '#64748b');
  }
  return c;
}

function renderConeSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 3, p.h - 2, p.w - 6, 2, 'rgba(3,7,15,0.45)');
  px(ctx, p.w / 2 - 5, 4, 10, p.h - 7, '#f97316');
  px(ctx, p.w / 2 - 3, 7, 6, 3, '#fed7aa');
  px(ctx, p.w / 2 - 7, p.h - 7, 14, 3, '#c2410c');
  px(ctx, p.w / 2 - 4, 2, 8, 3, '#fdba74');
  return c;
}

function renderCrateSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.5)');
  px(ctx, 0, 0, p.w, p.h, '#8a5a2b');
  rectBorder(ctx, 0, 0, p.w, p.h, '#5b3217', 1);
  hline(ctx, 1, Math.floor(p.h / 2), p.w - 2, '#5b3217');
  vline(ctx, Math.floor(p.w / 2), 1, p.h - 2, '#5b3217');
  px(ctx, 2, 2, p.w - 4, 2, '#b87b45');
  speckle(ctx, 3, 3, p.w - 6, p.h - 6, ['#6b4423', '#a06a35'], 14, mulberry32(hashString(p.id)));
  return c;
}

function renderSignPoleSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, p.w / 2 - 2, 8, 4, p.h - 12, '#334155');
  vline(ctx, p.w / 2 - 2, 8, p.h - 12, '#64748b');
  px(ctx, p.w / 2 - 8, p.h - 8, 16, 5, '#1f2937');
  const bannerColor = p.id.includes('neon') ? '#f472b6' : p.id.includes('ramen') ? '#ef4444' : '#38bdf8';
  px(ctx, p.w / 2 - 10, 2, 20, 22, bannerColor);
  rectBorder(ctx, p.w / 2 - 10, 2, 20, 22, '#0b1020', 1);
  px(ctx, p.w / 2 - 5, 7, 10, 2, '#ffffff');
  px(ctx, p.w / 2 - 5, 12, 10, 2, '#e0f2fe');
  px(ctx, p.w / 2 - 5, 17, 7, 2, '#e0f2fe');
  return c;
}

function renderPlanterSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 2, p.h - 3, p.w - 4, 2, 'rgba(3,7,15,0.5)');
  px(ctx, 2, p.h - 10, p.w - 4, 8, '#4b3527');
  px(ctx, 3, p.h - 12, p.w - 6, 3, '#6b4b33');
  px(ctx, 5, p.h - 20, p.w - 10, 10, '#14532d');
  px(ctx, 7, p.h - 26, p.w - 14, 8, '#166534');
  px(ctx, 10, p.h - 31, 4, 7, '#22c55e');
  px(ctx, p.w - 15, p.h - 30, 4, 6, '#4ade80');
  px(ctx, p.w / 2 - 2, p.h - 33, 4, 8, '#16a34a');
  return c;
}

function renderAcUnitSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  drawACUnit(ctx, 0, 0, p.w, p.h, '#9aa9bd');
  return c;
}

function renderVentSprite(p: WorldProp): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(p.w, p.h);
  px(ctx, 1, p.h - 2, p.w - 2, 2, 'rgba(3,7,15,0.45)');
  px(ctx, 0, 0, p.w, p.h, '#475569');
  rectBorder(ctx, 0, 0, p.w, p.h, '#1f2937', 1);
  for (let y = 3; y < p.h - 2; y += 3) hline(ctx, 2, y, p.w - 4, '#64748b');
  px(ctx, 3, 1, p.w - 6, 2, '#94a3b8');
  return c;
}

const propSpriteCache = new Map<string, HTMLCanvasElement>();

export function getPropSprite(p: WorldProp): HTMLCanvasElement | null {
  switch (p.kind) {
    case 'lamp':
    case 'vending':
    case 'bench':
    case 'bicycle':
    case 'phone_booth':
    case 'gas_pump':
    case 'shrine_lantern':
    case 'utility_pole':
    case 'bollard':
    case 'dumpster':
    case 'potted_plant':
    case 'car':
    case 'traffic_cone':
    case 'crate':
    case 'sign_pole':
    case 'planter':
    case 'ac_unit':
    case 'vent':
      break;
    default:
      return null;
  }

  let sprite = propSpriteCache.get(p.id);
  if (!sprite) {
    switch (p.kind) {
      case 'lamp': sprite = renderLampSprite(p); break;
      case 'vending': sprite = renderVendingSprite(p); break;
      case 'bench': sprite = renderBenchSprite(p); break;
      case 'bicycle': sprite = renderBicycleSprite(p); break;
      case 'phone_booth': sprite = renderPhoneBoothSprite(p); break;
      case 'gas_pump': sprite = renderGasPumpSprite(p); break;
      case 'shrine_lantern': sprite = renderShrineLanternSprite(p); break;
      case 'utility_pole': sprite = renderUtilityPoleSprite(p); break;
      case 'bollard': sprite = renderBollardSprite(p); break;
      case 'dumpster': sprite = renderDumpsterSprite(p); break;
      case 'potted_plant': sprite = renderPottedPlantSprite(p); break;
      case 'car': sprite = renderCarSprite(p); break;
      case 'traffic_cone': sprite = renderConeSprite(p); break;
      case 'crate': sprite = renderCrateSprite(p); break;
      case 'sign_pole': sprite = renderSignPoleSprite(p); break;
      case 'planter': sprite = renderPlanterSprite(p); break;
      case 'ac_unit': sprite = renderAcUnitSprite(p); break;
      case 'vent': sprite = renderVentSprite(p); break;
    }
    propSpriteCache.set(p.id, sprite!);
  }
  return sprite;
}
