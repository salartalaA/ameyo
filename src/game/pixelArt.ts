import type {
  Building,
  Crosswalk,
  Direction,
  MotorcycleState,
  PlayerState,
  Puddle,
  Rect,
  RoadSegment,
  WorldProp,
  ZombieState,
} from './types';
import {
  CANAL_BRIDGES,
  CANAL_RECT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './worldData';
import type { WeaponKind } from './weapons';
import { getBuildingSprite, getPropSprite, linePx } from './pixelDetail';

// ---------------------------------------------------------------------------
// Pixel-art helper utilities
// ---------------------------------------------------------------------------

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ---------------------------------------------------------------------------
// Protagonist Sprite Renderer (matching reference image:
// dark hair, white headphones, white cropped jacket + black vest + amber stripe,
// dark pants, holding smartphone in phone_idle)
// ---------------------------------------------------------------------------

// Draws a weapon model pointing +X in the current transform.
function drawWeaponModel(
  ctx: CanvasRenderingContext2D,
  kind: WeaponKind,
  flash: boolean
): void {
  const metal = '#1f2937';
  const metalHi = '#475569';
  const dark = '#0b0f17';
  const grip = '#7c4a21';

  if (kind === 'pistol') {
    px(ctx, -1, -2, 7, 4, metal);
    px(ctx, 1, -3, 4, 2, metalHi);
    px(ctx, 5, -1, 2, 2, dark);
    px(ctx, 0, 2, 2, 3, grip);
    if (flash) {
      px(ctx, 7, -2, 4, 4, '#fde68a');
      px(ctx, 9, -1, 3, 2, '#fef3c7');
      px(ctx, 7, 1, 2, 2, '#fb923c');
    }
    return;
  }

  if (kind === 'ak47') {
    // Long rifle: receiver, handguard, curved magazine, stock, front post
    px(ctx, -5, -2, 16, 4, metal);
    px(ctx, 8, -1, 8, 3, metalHi);
    px(ctx, -4, 2, 3, 4, grip);
    px(ctx, 2, 2, 3, 5, '#b45309'); // curved mag hint
    px(ctx, -7, -1, 3, 3, '#374151'); // stock
    px(ctx, 14, -2, 1, 2, dark); // front sight
    px(ctx, 5, -3, 3, 1, '#fbbf24'); // accent stripe
    if (flash) {
      px(ctx, 16, -2, 5, 4, '#fdba74');
      px(ctx, 18, -1, 3, 2, '#fef3c7');
      px(ctx, 16, 1, 2, 2, '#fb923c');
    }
    return;
  }

  if (kind === 'minigun') {
    // Rotary cannon: cluster of barrels, ammo drum, bipod legs
    px(ctx, -5, -3, 13, 7, metal);
    px(ctx, 6, -1, 11, 3, metalHi);
    // Three barrel bores
    px(ctx, 14, -3, 5, 2, dark);
    px(ctx, 14, -1, 5, 2, dark);
    px(ctx, 14, 1, 5, 2, dark);
    // Ammo drum under receiver
    px(ctx, 0, 4, 6, 4, '#7c2d12');
    px(ctx, 1, 5, 4, 2, '#9a3412');
    // Bipod
    px(ctx, 8, 3, 1, 4, '#374151');
    px(ctx, 12, 3, 1, 4, '#374151');
    px(ctx, -6, 0, 2, 3, grip);
    px(ctx, 3, -4, 5, 1, '#fde047'); // caution stripe
    if (flash) {
      px(ctx, 17, -3, 6, 7, '#fdba74');
      px(ctx, 19, -2, 4, 5, '#fef3c7');
      px(ctx, 17, 2, 3, 2, '#fb923c');
    }
    return;
  }

  // bomber: bomb-rack launcher tube with ordnance slung underneath
  px(ctx, -6, -3, 18, 6, '#334155');
  px(ctx, 8, -3, 6, 6, metalHi);
  px(ctx, 12, -4, 2, 8, '#0b0f17'); // muzzle ring
  // Slung bomb under the tube
  px(ctx, 2, 4, 6, 4, '#1f2937');
  px(ctx, 3, 5, 4, 2, '#475569');
  px(ctx, 7, 5, 1, 1, '#f87171'); // fuse spark tip
  px(ctx, -2, 3, 3, 4, grip);
  px(ctx, -6, -4, 4, 2, '#1f2937'); // shoulder rest
  px(ctx, 4, -4, 6, 1, '#f87171'); // hazard stripe
  if (flash) {
    px(ctx, 14, -4, 6, 8, '#fdba74');
    px(ctx, 16, -3, 4, 6, '#fef3c7');
    px(ctx, 14, 3, 3, 2, '#fb923c');
  }
}


function drawAimHandgun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  kind: WeaponKind,
  flash: boolean
): void {
  const gx = Math.round(x + Math.cos(angle) * 10);
  const gy = Math.round(y + Math.sin(angle) * 10 - 8);
  const ex = Math.round(x + Math.cos(angle) * 4);
  const ey = Math.round(y + Math.sin(angle) * 4 - 8);
  linePx(ctx, ex, ey, gx, gy, '#eef2f6', 2);
  px(ctx, gx - 1, gy - 1, 2, 2, '#f4c5ae');
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(angle);
  drawWeaponModel(ctx, kind, flash);
  ctx.restore();
}

export function drawProtagonist(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  aimAngle?: number,
  muzzleFlash = false,
  weaponKind: WeaponKind = 'pistol'
): void {
  if (player.mounted) return;

  const drawX = Math.round(player.x);
  const drawY = Math.round(player.y);

  // Soft wet contact shadow
  ctx.fillStyle = 'rgba(4, 7, 16, 0.55)';
  ctx.beginPath();
  ctx.ellipse(drawX, drawY + 2, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const isMoving = player.action === 'walk' || player.action === 'run';
  const isRunning = player.action === 'run';
  const stride = isMoving ? Math.sin(player.gaitPhase) : 0;
  const bob = isMoving ? Math.abs(Math.cos(player.gaitPhase)) * (isRunning ? 2 : 1) : 0;
  const idleBreath = !isMoving && player.action !== 'sit' ? Math.sin(time * 2.1) * 0.5 : 0;

  const ox = drawX - 10;
  const oy = Math.round(drawY - 26 - bob + (player.action === 'sit' ? 4 : 0) + idleBreath);

  const dir = player.facing;
  const hair = '#161922';
  const hairHi = '#2c3347';
  const skin = '#f4c5ae';
  const skinShade = '#d99e85';
  const phone = '#f2f5f9';
  const phoneShade = '#94a3b8';
  const jacket = '#eef2f6';
  const jacketShade = '#cbd5e1';
  const vest = '#181c24';
  const amber = '#e59a24';
  const pants = '#1b1f29';
  const pantsShade = '#11141c';
  const shoe = '#d8dee9';

  // Outline silhouette base
  if (player.action === 'sit') {
    // Seated pose on bench
    // Legs forward/down
    px(ctx, ox + 6, oy + 18, 3, 6, pants);
    px(ctx, ox + 11, oy + 18, 3, 6, pants);
    px(ctx, ox + 6, oy + 23, 3, 2, shoe);
    px(ctx, ox + 11, oy + 23, 3, 2, shoe);
    // Torso
    px(ctx, ox + 5, oy + 11, 10, 8, jacket);
    px(ctx, ox + 8, oy + 11, 4, 7, vest);
    px(ctx, ox + 9, oy + 12, 1, 6, '#0f172a');
    px(ctx, ox + 5, oy + 15, 3, 2, jacketShade);
    px(ctx, ox + 12, oy + 15, 3, 2, jacketShade);
    // Head + hair
    px(ctx, ox + 5, oy + 2, 10, 9, hair);
    if (dir !== 'up') {
      px(ctx, ox + 6, oy + 4, 8, 6, skin);
      px(ctx, ox + 6, oy + 3, 8, 2, hair);
      px(ctx, ox + 7, oy + 7, 1, 2, '#11131a');
      px(ctx, ox + 12, oy + 7, 1, 2, '#11131a');
    }
    // White headphones
    px(ctx, ox + 6, oy + 1, 8, 2, phone);
    px(ctx, ox + 4, oy + 4, 2, 4, phone);
    px(ctx, ox + 14, oy + 4, 2, 4, phone);
    if (aimAngle !== undefined) drawAimHandgun(ctx, drawX, drawY, aimAngle, weaponKind, muzzleFlash);
    return;
  }

  // Legs & Stride
  const leftLegOff = isMoving ? Math.round(stride * (isRunning ? 3 : 2)) : 0;
  const rightLegOff = -leftLegOff;

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1;
    // Back leg
    px(ctx, ox + 8 - leftLegOff * 0.5, oy + 19, 3, 6, pantsShade);
    px(ctx, ox + 8 - leftLegOff * 0.5, oy + 24, 3, 2, shoe);
    // Front leg
    px(ctx, ox + 9 + rightLegOff * 0.6, oy + 19, 3, 6, pants);
    px(ctx, ox + 9 + rightLegOff * 0.6, oy + 24, 3, 2, shoe);

    // Torso side profile
    px(ctx, ox + 6, oy + 11, 8, 8, jacket);
    px(ctx, ox + 6, oy + 12, 8, 7, jacketShade);
    // Black vest edge and zipper
    px(ctx, ox + (flip > 0 ? 11 : 6), oy + 11, 3, 8, vest);
    px(ctx, ox + (flip > 0 ? 9 : 8), oy + 12, 1, 6, '#0f172a');
    // Arm + amber sleeve stripe
    const armSwing = isMoving ? Math.round(stride * 2) : 0;
    px(ctx, ox + 8 + armSwing, oy + 12, 3, 6, jacket);
    px(ctx, ox + 8 + armSwing, oy + 14, 3, 1, amber);
    px(ctx, ox + 8 + armSwing, oy + 18, 2, 2, skin);

    // Long dark hair flowing back
    px(ctx, ox + (flip > 0 ? 4 : 7), oy + 3, 9, 13, hair);
    px(ctx, ox + (flip > 0 ? 5 : 10), oy + 4, 3, 6, hairHi);
    // Face
    px(ctx, ox + (flip > 0 ? 9 : 6), oy + 4, 5, 6, skin);
    px(ctx, ox + (flip > 0 ? 12 : 7), oy + 6, 1, 2, '#11131a'); // eye
    // White headphones side cup + band
    px(ctx, ox + 7, oy + 1, 6, 2, phone);
    px(ctx, ox + 8, oy + 4, 3, 4, phone);
    px(ctx, ox + 9, oy + 5, 1, 2, phoneShade);

    // Smartphone if phone_idle
    if (player.action === 'phone_idle') {
      const pxPos = flip > 0 ? ox + 13 : ox + 4;
      px(ctx, pxPos, oy + 11, 2, 3, '#1e293b');
      px(ctx, pxPos, oy + 11, 2, 2, '#38bdf8');
    }
    if (aimAngle !== undefined) drawAimHandgun(ctx, drawX, drawY, aimAngle, weaponKind, muzzleFlash);
    return;
  }

  // Front ('down') or Back ('up')
  // Legs
  px(ctx, ox + 6, oy + 19 + Math.max(0, leftLegOff), 3, 6, pants);
  px(ctx, ox + 6, oy + 24 + Math.max(0, leftLegOff), 3, 2, shoe);
  px(ctx, ox + 11, oy + 19 + Math.max(0, rightLegOff), 3, 6, pants);
  px(ctx, ox + 11, oy + 24 + Math.max(0, rightLegOff), 3, 2, shoe);

  // Arms
  const armL = isMoving ? Math.round(stride * 2) : 0;
  const armR = -armL;
  px(ctx, ox + 3, oy + 12 + armL, 2, 6, jacketShade);
  px(ctx, ox + 3, oy + 14 + armL, 2, 1, amber);
  px(ctx, ox + 15, oy + 12 + armR, 2, 6, jacket);
  px(ctx, ox + 15, oy + 14 + armR, 2, 1, amber);

  if (player.action === 'phone_idle' && dir === 'down') {
    // Raised forearm holding glowing phone
    px(ctx, ox + 14, oy + 10, 3, 4, jacket);
    px(ctx, ox + 13, oy + 8, 2, 3, '#1e293b');
    px(ctx, ox + 13, oy + 8, 2, 2, '#38bdf8');
  } else if (player.action === 'interact') {
    px(ctx, ox + 15, oy + 10, 3, 3, jacket);
    px(ctx, ox + 17, oy + 10, 2, 2, skin);
  }

  // Torso (white riding jacket + black center vest)
  px(ctx, ox + 5, oy + 11, 10, 8, jacket);
  px(ctx, ox + 5, oy + 17, 10, 2, jacketShade);
  px(ctx, ox + 8, oy + 11, 4, 8, vest);
  px(ctx, ox + 9, oy + 12, 1, 6, '#0f172a');
  px(ctx, ox + 5, oy + 15, 3, 2, jacketShade);
  px(ctx, ox + 12, oy + 15, 3, 2, jacketShade);

  if (dir === 'up') {
    // Back of long dark hair covering upper back
    px(ctx, ox + 5, oy + 2, 10, 14, hair);
    px(ctx, ox + 7, oy + 4, 2, 9, hairHi);
    px(ctx, ox + 11, oy + 4, 2, 8, hairHi);
    // White headphones band & cups visible from back
    px(ctx, ox + 6, oy + 1, 8, 2, phone);
    px(ctx, ox + 4, oy + 4, 2, 4, phone);
    px(ctx, ox + 14, oy + 4, 2, 4, phone);
  } else {
    // Back hair framing shoulders
    px(ctx, ox + 4, oy + 3, 12, 11, hair);
    // Face
    px(ctx, ox + 6, oy + 4, 8, 6, skin);
    px(ctx, ox + 6, oy + 9, 8, 1, skinShade);
    // Bangs
    px(ctx, ox + 6, oy + 3, 8, 2, hair);
    px(ctx, ox + 7, oy + 5, 2, 1, hair);
    px(ctx, ox + 11, oy + 5, 2, 1, hair);
    // Eyes
    px(ctx, ox + 7, oy + 6, 1, 2, '#11131a');
    px(ctx, ox + 12, oy + 6, 1, 2, '#11131a');
    // Subtle phone glow on face during phone_idle
    if (player.action === 'phone_idle') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(ox + 6, oy + 5, 8, 5);
    }
    // White headphones
    px(ctx, ox + 6, oy + 1, 8, 2, phone);
    px(ctx, ox + 4, oy + 4, 2, 4, phone);
    px(ctx, ox + 14, oy + 4, 2, 4, phone);
    px(ctx, ox + 4, oy + 5, 1, 2, phoneShade);
    px(ctx, ox + 15, oy + 5, 1, 2, phoneShade);
  }
  if (aimAngle !== undefined) drawAimHandgun(ctx, drawX, drawY, aimAngle, weaponKind, muzzleFlash);
}

// ---------------------------------------------------------------------------
// Lime-Green Sportbike Sprite Renderer (matching reference image!)
// ---------------------------------------------------------------------------

export function drawMotorcycle(
  ctx: CanvasRenderingContext2D,
  moto: MotorcycleState,
  mounted: boolean,
  time: number,
  aimAngle?: number,
  muzzleFlash = false,
  weaponKind: WeaponKind = 'pistol'
): void {
  const cx = Math.round(moto.x);
  const cy = Math.round(moto.y);

  // Quantize rotation to 16 crisp pixel-art angles so pixels stay sharp
  const step = (Math.PI * 2) / 16;
  const qAngle = Math.round(moto.angle / step) * step;

  ctx.save();
  ctx.translate(cx, cy);

  // Ground wet contact shadow
  ctx.fillStyle = 'rgba(4, 7, 16, 0.62)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 20, 9, qAngle, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(qAngle);

  // Tires (front right, rear left) with hubs and tread blocks
  px(ctx, -18, -4, 9, 8, '#10131a');
  px(ctx, 10, -4, 9, 8, '#10131a');
  px(ctx, -17, -2, 3, 4, '#3b465c');
  px(ctx, 12, -2, 3, 4, '#3b465c');
  // Subtle wheel tread shimmer when rolling
  if (Math.abs(moto.speed) > 8) {
    const tread = Math.floor(moto.wheelPhase) % 2 === 0 ? '#272f40' : '#1b212e';
    px(ctx, -16, -3, 3, 6, tread);
    px(ctx, 13, -3, 3, 6, tread);
    px(ctx, -15, 0, 2, 1, '#11151f');
    px(ctx, 15, 0, 2, 1, '#11151f');
  }

  // Chassis, engine, exhaust pipe, fork, and brake disc
  px(ctx, -14, -5, 26, 10, '#161b24');
  px(ctx, -10, -2, 10, 7, '#263247');
  px(ctx, -7, -1, 4, 4, '#0f172a');
  px(ctx, -15, 3, 12, 3, '#64748b'); // exhaust muffler
  px(ctx, -15, 4, 10, 1, '#334155');
  px(ctx, 11, -1, 3, 8, '#475569'); // front fork
  px(ctx, 10, 3, 5, 2, '#64748b'); // brake disc
  px(ctx, -9, 2, 8, 2, '#1f2937'); // swingarm

  // Signature Lime-Green Kawasaki-style Fairing
  px(ctx, -12, -6, 10, 12, '#4eb632'); // tail fairing
  px(ctx, -11, -5, 8, 3, '#7ae854');  // tail highlight
  px(ctx, 1, -6, 13, 12, '#5dc23e');  // front cowling & tank
  px(ctx, 3, -5, 9, 4, '#86ef5a');    // top tank highlight
  px(ctx, 11, -4, 4, 8, '#3b8e24');   // nose shade
  // Fairing panel gaps, vents, and shadow seams
  px(ctx, -2, -6, 1, 12, '#2f7a1b');
  px(ctx, 6, -5, 1, 10, '#2f7a1b');
  px(ctx, 12, -3, 2, 7, '#2f7a1b');
  px(ctx, -8, -4, 4, 1, '#83e85f');
  px(ctx, 2, 4, 8, 1, '#2f7a1b');
  px(ctx, -12, 5, 9, 1, '#256b17');

  // Windscreen & Mirrors
  px(ctx, 8, -5, 4, 10, '#94a3b8');
  px(ctx, 9, -4, 2, 8, '#bae6fd');
  px(ctx, 9, -8, 3, 2, '#cbd5e1');
  px(ctx, 9, 6, 3, 2, '#cbd5e1');
  px(ctx, 7, -8, 1, 2, '#e2e8f0');
  px(ctx, 12, 6, 1, 2, '#e2e8f0');

  // Seat with stitching and pillion pad
  px(ctx, -6, -4, 8, 8, '#1a1f29');
  px(ctx, -5, -3, 6, 1, '#334155');
  px(ctx, -5, 3, 6, 1, '#334155');
  px(ctx, -8, 0, 2, 4, '#11151f');

  // Red Taillight
  const tailColor = moto.braking ? '#ff3b3b' : '#dc2626';
  px(ctx, -14, -3, 2, 6, tailColor);
  px(ctx, -15, -2, 1, 4, moto.braking ? '#fecaca' : '#7f1d1d');

  // Twin Headlights
  const headColor = moto.headlightOn ? '#fef08a' : '#94a3b8';
  px(ctx, 14, -4, 2, 3, headColor);
  px(ctx, 14, 1, 2, 3, headColor);
  px(ctx, 15, -3, 1, 1, '#fff7cc');
  px(ctx, 15, 2, 1, 1, '#fff7cc');

  if (!mounted) {
    // Matte black helmet resting on rear pillion seat (exact detail from reference image!)
    px(ctx, -10, -4, 7, 8, '#1e2430');
    px(ctx, -9, -3, 5, 3, '#334155');
    px(ctx, -5, -3, 2, 6, '#0f172a'); // dark visor
    px(ctx, -9, -2, 2, 1, '#64748b'); // helmet vent highlight
    px(ctx, -8, 2, 3, 1, '#0f172a'); // chin vent shadow
  } else {
    // Rider astride in white jacket + amber stripe + matte black helmet!
    const lean = Math.round(moto.steerInput * 1.5);
    // Rider boots/legs tucked with knee and sole separation
    px(ctx, -4, -7 + lean, 8, 3, '#1a1e28');
    px(ctx, -4, 4 + lean, 8, 3, '#1a1e28');
    px(ctx, -3, -6 + lean, 3, 1, '#e5e7eb');
    px(ctx, -3, 5 + lean, 3, 1, '#e5e7eb');
    // White jacket torso leaning slightly forward
    px(ctx, -4, -5 + lean, 10, 10, '#eef2f6');
    px(ctx, -2, -3 + lean, 6, 6, '#181c24');
    px(ctx, -3, -5 + lean, 8, 1, '#f8fafc');
    px(ctx, -3, 4 + lean, 8, 1, '#cbd5e1');
    px(ctx, -2, -2 + lean, 1, 5, '#0f172a'); // zipper
    // Arms reaching handlebars with amber sleeve stripes
    px(ctx, 4, -6 + lean, 6, 3, '#eef2f6');
    px(ctx, 4, 3 + lean, 6, 3, '#eef2f6');
    px(ctx, 6, -6 + lean, 1, 3, '#e59a24');
    px(ctx, 6, 3 + lean, 1, 3, '#e59a24');
    px(ctx, 8, -6 + lean, 2, 2, '#f4c5ae');
    px(ctx, 8, 3 + lean, 2, 2, '#f4c5ae');
    // Black riding helmet + visor + highlight
    px(ctx, -1, -4 + lean, 8, 8, '#191e29');
    px(ctx, 1, -3 + lean, 4, 2, '#475569');
    px(ctx, 5, -3 + lean, 2, 6, '#0b0f17');
    px(ctx, 0, -4 + lean, 3, 1, '#475569');
    px(ctx, 2, -2 + lean, 1, 2, '#94a3b8'); // visor glare

    if (aimAngle !== undefined) {
      const rel = aimAngle - qAngle;
      const ax = Math.cos(rel);
      const ay = Math.sin(rel);
      const sx = 4;
      const sy = -3;
      const ex = Math.round(sx + ax * 11);
      const ey = Math.round(sy + ay * 11);
      linePx(ctx, sx, sy, ex, ey, '#eef2f6', 2);
      px(ctx, ex - 1, ey - 1, 2, 2, '#f4c5ae');
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(rel);
      drawWeaponModel(ctx, weaponKind, muzzleFlash);
      ctx.restore();
    }
  }

  ctx.restore();

  // Idle parking indicator shimmer under lamp if unmounted
  if (!mounted && Math.sin(time * 2) > 0.7) {
    ctx.fillStyle = 'rgba(134, 239, 90, 0.2)';
    ctx.fillRect(cx - 2, cy - 10, 2, 2);
  }
}

// ---------------------------------------------------------------------------
// Zombie Sprite Renderer
// ---------------------------------------------------------------------------

export function drawZombie(ctx: CanvasRenderingContext2D, z: ZombieState, time: number): void {
  const x = Math.round(z.x);
  const y = Math.round(z.y);
  const walk = Math.sin(z.walkPhase);
  const lunge = z.attackAnim > 0 ? Math.round((z.attackAnim / 0.28) * 3) : 0;
  const skin = z.hitFlash > 0 ? '#e5f7d8' : '#8fae62';
  const skinShade = z.hitFlash > 0 ? '#c8e6b0' : '#647a45';
  const shirt = z.hitFlash > 0 ? '#cbd5e1' : '#3f4a3d';
  const shirtShade = z.hitFlash > 0 ? '#94a3b8' : '#2c352b';
  const pants = '#27313a';
  const eye = z.hitFlash > 0 ? '#ffffff' : '#d9f99d';

  ctx.fillStyle = 'rgba(4, 7, 16, 0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const ox = x - 8;
  const oy = Math.round(y - 25 + Math.abs(walk) * 1.4);
  const reach = z.facing === 'left' ? -lunge : z.facing === 'right' ? lunge : 0;

  // Legs
  const legA = Math.round(walk * 2);
  px(ctx, ox + 4, oy + 19 + Math.max(0, legA), 3, 6, pants);
  px(ctx, ox + 4, oy + 24 + Math.max(0, legA), 3, 2, '#151c22');
  px(ctx, ox + 9, oy + 19 + Math.max(0, -legA), 3, 6, pants);
  px(ctx, ox + 9, oy + 24 + Math.max(0, -legA), 3, 2, '#151c22');

  // Torso: tattered jacket with torn hem
  px(ctx, ox + 4, oy + 11, 9, 8, shirt);
  px(ctx, ox + 4, oy + 17, 9, 2, shirtShade);
  px(ctx, ox + 7, oy + 11, 1, 8, shirtShade);
  px(ctx, ox + 5, oy + 19, 2, 1, skinShade);
  px(ctx, ox + 10, oy + 19, 2, 1, skinShade);

  // Arms reaching toward the target
  const armY = z.facing === 'up' ? oy + 10 : oy + 12;
  const armX = z.facing === 'left' ? ox + 1 - reach : z.facing === 'right' ? ox + 13 + reach : ox + 3;
  const armW = z.facing === 'left' || z.facing === 'right' ? 5 : 2;
  const armH = z.facing === 'up' ? 5 : 6;
  px(ctx, armX, armY, armW, armH, shirtShade);
  px(ctx, armX + (z.facing === 'left' ? -1 : armW - 1), armY + armH - 2, 2, 2, skin);

  if (z.facing === 'left' || z.facing === 'right') {
    // Side profile: face and glowing eyes
    px(ctx, ox + (z.facing === 'right' ? 8 : 3), oy + 3, 6, 7, skin);
    px(ctx, ox + (z.facing === 'right' ? 8 : 3), oy + 2, 6, 2, '#26301f');
    px(ctx, ox + (z.facing === 'right' ? 11 : 5), oy + 6, 1, 2, eye);
    px(ctx, ox + (z.facing === 'right' ? 11 : 5), oy + 7, 1, 1, '#3f6212');
    // Jaw and neck wound
    px(ctx, ox + (z.facing === 'right' ? 8 : 4), oy + 9, 4, 1, skinShade);
    px(ctx, ox + (z.facing === 'right' ? 9 : 6), oy + 12, 1, 2, '#7f1d1d');
  } else {
    // Front/back head
    px(ctx, ox + 4, oy + 1, 9, 10, z.facing === 'up' ? '#26301f' : skin);
    if (z.facing !== 'up') {
      px(ctx, ox + 4, oy + 2, 9, 2, '#26301f');
      px(ctx, ox + 5, oy + 5, 2, 2, eye);
      px(ctx, ox + 10, oy + 5, 2, 2, eye);
      px(ctx, ox + 6, oy + 9, 4, 1, skinShade);
      px(ctx, ox + 7, oy + 12, 1, 2, '#7f1d1d');
    } else {
      px(ctx, ox + 6, oy + 3, 1, 6, '#10160f');
      px(ctx, ox + 10, oy + 3, 1, 6, '#10160f');
    }
  }

  if (z.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, z.hitFlash * 2)})`;
    ctx.fillRect(ox + 3, oy, 10, 20);
  }

  // Armed zombie: rifle in hands + purple headband (matches minimap purple)
  if (z.armed) {
    const gunX = z.facing === 'left' ? ox + 2 : z.facing === 'right' ? ox + 9 : ox + 5;
    const gunY = oy + 13;
    px(ctx, gunX, gunY, 6, 2, '#111827');
    px(ctx, gunX + (z.facing === 'left' ? -1 : 5), gunY, 2, 2, '#334155');
    // Purple bandana stripe across the forehead
    px(ctx, ox + 4, oy + 3, 9, 1, '#a855f7');
    px(ctx, ox + 5, oy + 4, 7, 1, '#7c3aed');
  }
}

// ---------------------------------------------------------------------------
// Pre-baked Static City Ground Layer (Sidewalks, Wet Asphalt, Canal, Bridge)
// ---------------------------------------------------------------------------

export function buildStaticCityGroundCanvas(
  roads: RoadSegment[],
  sidewalks: Rect[],
  crosswalks: Crosswalk[]
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(WORLD_WIDTH, WORLD_HEIGHT);
  const groundHash = (x: number, y: number, salt = 0): number => {
    let h = (x * 374761393 + y * 668265263 + salt * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const groundSpeckle = (
    x: number,
    y: number,
    w: number,
    h: number,
    colors: string[],
    count: number,
    salt = 0
  ): void => {
    for (let i = 0; i < count; i++) {
      const pxPos = Math.round(x + groundHash(i, salt, 11) * Math.max(1, w - 2));
      const pyPos = Math.round(y + groundHash(i, salt, 29) * Math.max(1, h - 2));
      ctx.fillStyle = colors[Math.floor(groundHash(i, salt, 47) * colors.length) % colors.length];
      ctx.fillRect(pxPos, pyPos, groundHash(i, salt, 71) < 0.78 ? 1 : 2, groundHash(i, salt, 83) < 0.78 ? 1 : 2);
    }
  };

  // 1. Base midnight city earth / courtyard tile
  ctx.fillStyle = '#111724';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Subtle courtyard tile grid across city blocks
  ctx.fillStyle = '#151d2e';
  for (let x = 0; x < WORLD_WIDTH; x += 32) {
    ctx.fillRect(x, 0, 1, WORLD_HEIGHT);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 32) {
    ctx.fillRect(0, y, WORLD_WIDTH, 1);
  }

  // Courtyard wear: damp patches, expansion joints, weeds, and litter pixels
  for (let y = 24; y < WORLD_HEIGHT; y += 96) {
    for (let x = 24; x < WORLD_WIDTH; x += 128) {
      if (groundHash(x, y, 3) < 0.34) {
        ctx.fillStyle = 'rgba(7, 12, 24, 0.20)';
        ctx.fillRect(x, y, 34 + Math.floor(groundHash(x, y, 5) * 34), 18 + Math.floor(groundHash(x, y, 7) * 14));
      }
      if (groundHash(x, y, 9) < 0.18) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.055)';
        ctx.fillRect(x + 8, y + 6, 42, 2);
      }
    }
  }
  groundSpeckle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, ['#0e1524', '#1a2438', '#26334d', '#0a0f1a'], 5200, 17);
  for (let i = 0; i < 90; i++) {
    const wx = Math.floor(groundHash(i, 0, 101) * WORLD_WIDTH);
    const wy = Math.floor(groundHash(i, 0, 103) * WORLD_HEIGHT);
    ctx.fillStyle = groundHash(i, 0, 107) < 0.5 ? 'rgba(20, 83, 45, 0.35)' : 'rgba(120, 113, 108, 0.22)';
    ctx.fillRect(wx, wy, 3, 1);
    ctx.fillRect(wx + 1, wy - 1, 1, 3);
  }

  // Park grass patches in Quiet District
  ctx.fillStyle = '#142628';
  ctx.fillRect(1180, 2136, 720, 230);
  ctx.fillStyle = '#193132';
  for (let gx = 1196; gx < 1890; gx += 48) {
    for (let gy = 2150; gy < 2350; gy += 48) {
      ctx.fillRect(gx, gy, 18, 12);
    }
  }
  // Stone park walkways
  ctx.fillStyle = '#252f42';
  ctx.fillRect(1280, 2150, 520, 48);
  ctx.fillRect(1280, 2280, 520, 36);

  // 2. Sidewalks with slab joints, damp patches, drains, and raised curb edge
  for (const s of sidewalks) {
    ctx.fillStyle = '#26314a';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    groundSpeckle(s.x, s.y, s.w, s.h, ['#2d3a55', '#1f2940', '#354263', '#182136'], Math.floor((s.w * s.h) / 260), s.x + s.y);

    // Large paving slabs with staggered joints
    ctx.fillStyle = '#31405c';
    for (let tx = s.x + 8; tx < s.x + s.w; tx += 32) {
      ctx.fillRect(tx, s.y, 1, s.h);
    }
    for (let ty = s.y + 8; ty < s.y + s.h; ty += 32) {
      ctx.fillRect(s.x, ty, s.w, 1);
    }
    // Damp blotches and gum/wear pixels
    for (let i = 0; i < Math.floor((s.w * s.h) / 5200); i++) {
      const dx = Math.round(s.x + groundHash(i, s.x, 211) * (s.w - 18));
      const dy = Math.round(s.y + groundHash(i, s.y, 223) * (s.h - 10));
      ctx.fillStyle = groundHash(i, s.x + s.y, 227) < 0.62 ? 'rgba(8, 14, 28, 0.22)' : 'rgba(148, 163, 184, 0.07)';
      ctx.fillRect(dx, dy, 8 + Math.floor(groundHash(i, 3, 229) * 14), 3 + Math.floor(groundHash(i, 5, 231) * 5));
    }
    // Storm-drain grates near curbside edges
    if (s.h >= 36 || s.w >= 36) {
      const horizontal = s.w > s.h;
      for (let d = 0; d < Math.floor((horizontal ? s.w : s.h) / 180); d++) {
        const gx = horizontal ? s.x + 70 + d * 180 + Math.floor(groundHash(d, s.x, 233) * 36) : s.x + 4;
        const gy = horizontal ? s.y + (s.h > 44 ? 6 : Math.floor(s.h / 2) - 3) : s.y + 70 + d * 180;
        px(ctx, gx, gy, horizontal ? 18 : 8, horizontal ? 5 : 18, '#101725');
        for (let slot = 0; slot < 4; slot++) {
          if (horizontal) px(ctx, gx + 2 + slot * 4, gy + 1, 2, 3, '#3b4a63');
          else px(ctx, gx + 1, gy + 2 + slot * 4, 6, 2, '#3b4a63');
        }
      }
    }

    // Curb highlight and shadow seams
    ctx.strokeStyle = '#435272';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    ctx.strokeStyle = 'rgba(4, 8, 16, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
  }

  // Konbini parking bay lines
  ctx.fillStyle = '#1a2232';
  ctx.fillRect(852, 992, 396, 120);
  ctx.fillStyle = '#64748b';
  for (let bx = 890; bx <= 1210; bx += 64) {
    ctx.fillRect(bx, 1004, 3, 52);
  }
  // Tire tracks, oil stains, and a drain grate in the apron
  ctx.fillStyle = 'rgba(5, 9, 18, 0.24)';
  ctx.fillRect(870, 1032, 360, 8);
  ctx.fillRect(900, 1052, 330, 5);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.fillRect(872, 1034, 356, 2);
  ctx.fillStyle = '#0d1420';
  ctx.fillRect(1190, 1094, 24, 10);
  for (let i = 0; i < 5; i++) ctx.fillRect(1194 + i * 4, 1096, 2, 6);
  groundSpeckle(852, 992, 396, 120, ['#232f47', '#1a2438', '#2d3b57'], 260, 91);
  // Moto bay highlight box
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1144, 1068, 52, 36);

  // 3. Wet Asphalt Roads
  for (const r of roads) {
    ctx.fillStyle = '#181e2c';
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // Subtle asphalt specular grain (deterministic)
    ctx.fillStyle = '#1f2738';
    for (let ax = r.x + 8; ax < r.x + r.w - 8; ax += 24) {
      for (let ay = r.y + 8; ay < r.y + r.h - 8; ay += 24) {
        if (((ax * 7 + ay * 13) % 11) < 4) {
          ctx.fillRect(ax, ay, 4, 2);
        }
      }
    }

    // Asphalt repairs, cracks, tire polish, and oil accumulation
    for (let i = 0; i < Math.floor((r.w * r.h) / 18000); i++) {
      const rx = Math.round(r.x + 12 + groundHash(i, r.x, 301) * (r.w - 30));
      const ry = Math.round(r.y + 12 + groundHash(i, r.y, 307) * (r.h - 30));
      const rw = 8 + Math.floor(groundHash(i, r.x + r.y, 311) * 24);
      const rh2 = 3 + Math.floor(groundHash(i, r.x + r.y, 313) * 8);
      ctx.fillStyle = groundHash(i, r.x, 317) < 0.55 ? 'rgba(10, 15, 28, 0.24)' : 'rgba(52, 66, 92, 0.16)';
      ctx.fillRect(rx, ry, rw, rh2);
    }
    for (let i = 0; i < Math.floor((r.w * r.h) / 26000); i++) {
      const cx = Math.round(r.x + 20 + groundHash(i, r.y, 331) * (r.w - 50));
      const cy = Math.round(r.y + 20 + groundHash(i, r.x, 337) * (r.h - 50));
      linePx(ctx, cx, cy, cx + (groundHash(i, 1, 339) < 0.5 ? 12 : -10), cy + (groundHash(i, 2, 341) < 0.5 ? 6 : -5), 'rgba(6, 10, 20, 0.35)', 1);
    }
    for (let i = 0; i < Math.floor((r.w * r.h) / 34000); i++) {
      const ox = Math.round(r.x + 30 + groundHash(i, r.x + 7, 347) * (r.w - 70));
      const oy = Math.round(r.y + r.h / 2 - 12 + groundHash(i, r.y + 11, 349) * 24);
      ctx.fillStyle = 'rgba(8, 12, 24, 0.30)';
      ctx.beginPath();
      ctx.ellipse(ox, oy, 8 + groundHash(i, 3, 351) * 10, 3 + groundHash(i, 5, 353) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Curbside storm-drain gutter lines
    ctx.fillStyle = '#111622';
    if (r.axis === 'h') {
      ctx.fillRect(r.x, r.y, r.w, 4);
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
      // Dashed yellow/white center lane line
      ctx.fillStyle = '#cbd5e1';
      for (let lx = r.x + 16; lx < r.x + r.w; lx += 44) {
        ctx.fillRect(lx, r.y + Math.floor(r.h / 2) - 2, 24, 4);
      }
    } else if (r.axis === 'v') {
      ctx.fillRect(r.x, r.y, 4, r.h);
      ctx.fillRect(r.x + r.w - 4, r.y, 4, r.h);
      ctx.fillStyle = '#cbd5e1';
      for (let ly = r.y + 16; ly < r.y + r.h; ly += 44) {
        ctx.fillRect(r.x + Math.floor(r.w / 2) - 2, ly, 4, 24);
      }
    }
  }

  // Clean intersection boxes (clear center dashed lines inside junctions)
  const junctions: Rect[] = [
    { x: 560, y: 440, w: 120, h: 120 },
    { x: 1460, y: 440, w: 144, h: 120 },
    { x: 2360, y: 440, w: 128, h: 120 },
    { x: 560, y: 1120, w: 120, h: 144 },
    { x: 1460, y: 1120, w: 144, h: 144 },
    { x: 2360, y: 1120, w: 128, h: 144 },
    { x: 560, y: 1760, w: 120, h: 112 },
    { x: 1460, y: 1760, w: 144, h: 112 },
    { x: 2360, y: 1760, w: 128, h: 112 },
    // Minato Market verticals crossing the northern avenues
    { x: 3560, y: 440, w: 110, h: 120 },
    { x: 4380, y: 440, w: 110, h: 120 },
    { x: 3560, y: 1120, w: 110, h: 144 },
    { x: 4380, y: 1120, w: 110, h: 144 },
    { x: 3560, y: 1440, w: 110, h: 120 },
    { x: 4380, y: 1440, w: 110, h: 120 },
    { x: 3560, y: 1760, w: 110, h: 112 },
    { x: 4380, y: 1760, w: 110, h: 112 },
    // East bridge approach junction with Riverside Road
    { x: 3360, y: 1760, w: 120, h: 112 },
    // Hill Road crossings south of the canal
    { x: 1460, y: 2900, w: 144, h: 110 },
    { x: 2360, y: 2900, w: 128, h: 110 },
    { x: 3360, y: 2900, w: 120, h: 110 },
  ];
  for (const j of junctions) {
    ctx.fillStyle = '#181e2c';
    ctx.fillRect(j.x + 4, j.y + 4, j.w - 8, j.h - 8);
  }

  // 4. Zebra Crosswalks with worn paint and rain-polished gaps
  ctx.fillStyle = '#cbd5e1';
  for (const cw of crosswalks) {
    if (cw.orientation === 'h') {
      for (let sx = cw.x; sx < cw.x + cw.w - 6; sx += 14) {
        ctx.fillRect(sx, cw.y, 8, cw.h);
        groundSpeckle(sx, cw.y, 8, cw.h, ['#181e2c', '#334155'], 5, sx + cw.y);
      }
    } else {
      for (let sy = cw.y; sy < cw.y + cw.h - 6; sy += 14) {
        ctx.fillRect(cw.x, sy, cw.w, 8);
        groundSpeckle(cw.x, sy, cw.w, 8, ['#181e2c', '#334155'], 5, cw.x + sy);
      }
    }
  }

  // 5. Canal Embankment & Bridge base
  ctx.fillStyle = '#0d1e30';
  ctx.fillRect(CANAL_RECT.x, CANAL_RECT.y, CANAL_RECT.w, CANAL_RECT.h);
  // Concrete stone canal walls
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, CANAL_RECT.y - 8, WORLD_WIDTH, 10);
  ctx.fillRect(0, CANAL_RECT.y + CANAL_RECT.h - 2, WORLD_WIDTH, 10);
  // Metal guardrail along embankment (excluding bridge decks)
  ctx.fillStyle = '#64748b';
  for (let rx = 0; rx < WORLD_WIDTH; rx += 24) {
    const onBridge = CANAL_BRIDGES.some(
      (b) => rx >= b.x - 8 && rx <= b.x + b.w + 8
    );
    if (onBridge) continue;
    ctx.fillRect(rx, CANAL_RECT.y - 11, 3, 5);
    ctx.fillRect(rx, CANAL_RECT.y + CANAL_RECT.h + 4, 3, 5);
  }
  const sortedBridges = [...CANAL_BRIDGES].sort((a, b) => a.x - b.x);
  let railCursor = 0;
  for (const b of sortedBridges) {
    if (b.x > railCursor) {
      ctx.fillRect(railCursor, CANAL_RECT.y - 10, b.x - railCursor, 2);
    }
    railCursor = Math.max(railCursor, b.x + b.w);
  }
  if (railCursor < WORLD_WIDTH) {
    ctx.fillRect(railCursor, CANAL_RECT.y - 10, WORLD_WIDTH - railCursor, 2);
  }

  // Bridge decks
  for (const BRIDGE_RECT of sortedBridges) {
    ctx.fillStyle = '#252f42';
    ctx.fillRect(BRIDGE_RECT.x, BRIDGE_RECT.y, BRIDGE_RECT.w, BRIDGE_RECT.h);
    ctx.fillStyle = '#1b2232';
    ctx.fillRect(BRIDGE_RECT.x + 16, BRIDGE_RECT.y, BRIDGE_RECT.w - 32, BRIDGE_RECT.h);
    // Bridge stone parapets
    ctx.fillStyle = '#475569';
    ctx.fillRect(BRIDGE_RECT.x, BRIDGE_RECT.y, 12, BRIDGE_RECT.h);
    ctx.fillRect(BRIDGE_RECT.x + BRIDGE_RECT.w - 12, BRIDGE_RECT.y, 12, BRIDGE_RECT.h);
    // Center dashed line over bridge
    ctx.fillStyle = '#cbd5e1';
    for (let by = BRIDGE_RECT.y + 10; by < BRIDGE_RECT.y + BRIDGE_RECT.h - 10; by += 32) {
      ctx.fillRect(BRIDGE_RECT.x + Math.floor(BRIDGE_RECT.w / 2) - 2, by, 4, 18);
    }
  }

  return canvas;
}

// ---------------------------------------------------------------------------
// Dynamic Canal Water & Puddles
// ---------------------------------------------------------------------------

export function drawWaterAndPuddles(
  ctx: CanvasRenderingContext2D,
  puddles: Puddle[],
  time: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): void {
  // Animated canal ripples if canal is visible
  if (camY + viewH >= CANAL_RECT.y && camY <= CANAL_RECT.y + CANAL_RECT.h) {
    const startX = Math.max(0, Math.floor(camX / 32) * 32);
    const endX = Math.min(WORLD_WIDTH, camX + viewW + 32);
    for (let x = startX; x < endX; x += 36) {
      const onBridge = CANAL_BRIDGES.some(
        (b) => x > b.x && x < b.x + b.w
      );
      if (onBridge) continue;
      for (let row = 0; row < 4; row++) {
        const wy = CANAL_RECT.y + 22 + row * 32;
        const shift = Math.sin(time * 1.4 + x * 0.03 + row) * 6;
        ctx.fillStyle = row % 2 === 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(251, 191, 36, 0.12)';
        ctx.fillRect(Math.round(x + shift), wy, 18, 2);
      }
    }
  }

  // Wet ground puddles with reflective tint & concentric raindrop ripples
  for (let i = 0; i < puddles.length; i++) {
    const p = puddles[i];
    if (
      p.x + p.rx < camX ||
      p.x - p.rx > camX + viewW ||
      p.y + p.ry < camY ||
      p.y - p.ry > camY + viewH
    ) {
      continue;
    }

    ctx.fillStyle = 'rgba(10, 18, 34, 0.65)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neon shimmer reflection inside puddle
    const pulse = 0.16 + 0.08 * Math.sin(time * 2.4 + i * 1.7);
    ctx.fillStyle = p.tint;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx * 0.72, p.ry * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Animated raindrop ring ripple on puddle
    const ringCycle = (time * 1.15 + i * 0.43) % 1;
    const ringR = ringCycle * p.rx * 0.65;
    ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - ringCycle) * 0.35})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, Math.max(2, ringR), Math.max(1, ringR * 0.48), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Cached handcrafted building sprites + dynamic neon overlay
// ---------------------------------------------------------------------------

function drawNeonSign(
  ctx: CanvasRenderingContext2D,
  b: Building,
  s: Building['signs'][number],
  time: number,
  index: number
): void {
  let on = true;
  if (s.flicker) {
    const f = Math.sin(time * 13 + index * 2) * Math.sin(time * 3.7 + index);
    on = f > -0.82;
  }
  const sx = Math.round(b.x + s.offsetX);
  const sy = Math.round(b.y + s.offsetY);
  const sw = Math.round(s.w);
  const sh = Math.round(s.h);
  const core = on ? s.color : '#263247';
  const dim = on ? '#0b1020' : '#111827';

  // Mounting rail and sign cabinet
  px(ctx, sx - 2, sy - 2, sw + 4, sh + 4, 'rgba(3, 7, 15, 0.55)');
  px(ctx, sx, sy, sw, sh, dim);
  px(ctx, sx + 1, sy + 1, sw - 2, sh - 2, on ? '#101a2c' : '#0b0f18');
  ctx.strokeStyle = on ? core : '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
  ctx.strokeStyle = on ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 3, sy + 3, sw - 6, sh - 6);

  // Pixel text with a hard offset shadow for readability in the rain
  ctx.fillStyle = on ? '#05070d' : '#1e293b';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const drawLabel = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    if (s.vertical) {
      const chars = s.text.split('');
      chars.forEach((ch, idx) => {
        ctx.fillText(ch, sx + sw / 2 + dx, sy + 10 + idx * Math.max(12, (sh - 14) / Math.max(1, chars.length - 1)) + dy);
      });
    } else {
      ctx.fillText(s.text, sx + sw / 2 + dx, sy + sh / 2 + 1 + dy);
    }
  };
  drawLabel(1, 1, ctx.fillStyle as string);
  drawLabel(0, 0, core);

  // Small neon end caps / hanging bracket
  px(ctx, sx + 2, sy + sh - 3, 3, 2, core);
  px(ctx, sx + sw - 5, sy + sh - 3, 3, 2, core);
  px(ctx, sx + sw / 2 - 1, sy + sh, 2, 3, '#475569');
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  b: Building,
  time: number
): void {
  const x = Math.round(b.x);
  const y = Math.round(b.y);

  // Layered contact shadow: wide soft pool + tight facade shadow
  ctx.fillStyle = 'rgba(3, 6, 14, 0.34)';
  ctx.fillRect(x + 3, y + b.h + 2, b.w - 2, 9);
  ctx.fillStyle = 'rgba(3, 6, 14, 0.48)';
  ctx.fillRect(x + 6, y + b.h, b.w - 8, 5);

  ctx.drawImage(getBuildingSprite(b), x, y);

  for (let i = 0; i < b.signs.length; i++) {
    drawNeonSign(ctx, b, b.signs[i], time, i);
  }
}

// ---------------------------------------------------------------------------
// 3/4 Top-Down Pixel-Art Buildings
// ---------------------------------------------------------------------------

function drawBuildingProcedural(
  ctx: CanvasRenderingContext2D,
  b: Building,
  time: number
): void {
  const x = Math.round(b.x);
  const y = Math.round(b.y);
  const w = Math.round(b.w);
  const h = Math.round(b.h);
  const rh = Math.round(b.roofHeight);

  // Drop shadow on wet ground
  ctx.fillStyle = 'rgba(4, 7, 15, 0.55)';
  ctx.fillRect(x + 6, y + h, w - 4, 8);

  if (b.kind === 'gas_station') {
    // Open-air 24H Gas Station Canopy + back kiosk
    // Back kiosk building
    px(ctx, x + 30, y, w - 60, 76, b.roofColor);
    px(ctx, x + 30, y + 36, w - 60, 40, b.wallColor);
    px(ctx, x + 70, y + 44, 140, 26, '#fde68a'); // warm interior window
    px(ctx, x + 74, y + 48, 132, 18, '#fef3c7');
    // Illuminated station forecourt concrete
    px(ctx, x + 12, y + 92, w - 24, h - 92, '#283449');
    // Overhead glowing canopy
    px(ctx, x, y + 84, w, 34, b.roofColor);
    px(ctx, x, y + 114, w, 6, b.accentColor);
    px(ctx, x + 4, y + 88, w - 8, 22, '#223047');
    // Canopy support pillars
    px(ctx, x + 18, y + 120, 10, 82, '#94a3b8');
    px(ctx, x + w - 28, y + 120, 10, 82, '#94a3b8');
  } else if (b.kind === 'shrine') {
    // Traditional Shrine pavilion + Crimson Torii gate in front
    px(ctx, x + 28, y + 8, w - 56, 70, '#2a1d24'); // tiled roof
    px(ctx, x + 36, y + 20, w - 72, 46, '#38252d');
    px(ctx, x + 40, y + 78, w - 80, 46, '#4a2e2b');
    px(ctx, x + 82, y + 86, 46, 34, '#fbbf24'); // warm inner altar glow
    // Torii gate at front courtyard
    px(ctx, x + 38, y + h - 54, w - 76, 8, '#dc2626');
    px(ctx, x + 46, y + h - 42, w - 92, 5, '#b91c1c');
    px(ctx, x + 56, y + h - 46, 10, 46, '#dc2626');
    px(ctx, x + w - 66, y + h - 46, 10, 46, '#dc2626');
    return;
  } else {
    // Standard 3/4 top-down building: roof + front wall facade
    // Roof block
    px(ctx, x, y, w, rh, b.roofColor);
    // Roof parapet trim
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, rh - 4);
    // Rooftop details (AC fans, vents, water tank)
    px(ctx, x + 18, y + 12, 22, 16, '#28354a');
    px(ctx, x + 22, y + 15, 10, 10, '#121926');
    px(ctx, x + w - 46, y + 10, 26, 20, '#253247');
    px(ctx, x + w - 42, y + 14, 18, 12, '#364661');

    // Front Facade
    px(ctx, x, y + rh, w, h - rh, b.wallColor);
    // Horizontal ledge / cornice
    px(ctx, x, y + rh, w, 4, b.trimColor);
    // Base plinth
    px(ctx, x, y + h - 8, w, 8, '#141a26');
  }

  // Kind-specific facade details
  const wallTop = y + rh + 6;
  const wallH = h - rh - 14;

  if (b.kind === 'konbini') {
    // Bright welcoming Konbini glass storefront with rich interior pixel art!
    px(ctx, x + 14, wallTop + 24, w - 28, wallH - 24, '#cbd5e1');
    px(ctx, x + 18, wallTop + 28, w - 36, wallH - 30, '#fef3c7');
    // Rear glowing drink coolers & bento shelves
    px(ctx, x + 24, wallTop + 32, 72, 16, '#bae6fd');
    px(ctx, x + 26, wallTop + 34, 14, 12, '#38bdf8');
    px(ctx, x + 44, wallTop + 34, 14, 12, '#34d399');
    px(ctx, x + 62, wallTop + 34, 14, 12, '#fb923c');
    px(ctx, x + 80, wallTop + 34, 12, 12, '#f472b6');
    // Magazine rack & warm checkout counter
    px(ctx, x + 28, wallTop + 58, 60, 12, '#64748b');
    px(ctx, x + 32, wallTop + 60, 12, 8, '#f87171');
    px(ctx, x + 48, wallTop + 60, 12, 8, '#facc15');
    px(ctx, x + 64, wallTop + 60, 14, 8, '#60a5fa');
    // Right-side oden / hot snack counter
    px(ctx, x + 186, wallTop + 34, 70, 22, '#94a3b8');
    px(ctx, x + 190, wallTop + 38, 28, 14, '#fbbf24');
    px(ctx, x + 224, wallTop + 38, 26, 14, '#e2e8f0');
    px(ctx, x + 190, wallTop + 62, 62, 10, '#475569');
    // Automatic sliding glass doors
    px(ctx, x + 106, wallTop + 30, 58, wallH - 30, '#93c5fd');
    px(ctx, x + 110, wallTop + 34, 24, wallH - 34, '#e0f2fe');
    px(ctx, x + 136, wallTop + 34, 24, wallH - 34, '#e0f2fe');
    px(ctx, x + 134, wallTop + 30, 2, wallH - 30, '#1e3a8a');
    // Classic 3-stripe konbini fascia (cyan, emerald, amber)
    px(ctx, x + 6, wallTop + 4, w - 12, 6, '#22d3ee');
    px(ctx, x + 6, wallTop + 10, w - 12, 5, '#34d399');
    px(ctx, x + 6, wallTop + 15, w - 12, 5, '#fb923c');
  } else if (b.kind === 'ramen' || b.kind === 'izakaya') {
    // Striped fabric awning + warm glowing doorway + red paper lanterns (chochin)
    px(ctx, x + 14, wallTop + 24, w - 28, 16, b.kind === 'ramen' ? '#991b1b' : '#7c2d12');
    for (let sx = x + 18; sx < x + w - 22; sx += 16) {
      px(ctx, sx, wallTop + 24, 6, 16, '#ea580c');
    }
    // Warm lit window & noren entrance
    px(ctx, x + 26, wallTop + 44, 78, wallH - 44, '#fde68a');
    px(ctx, x + 118, wallTop + 44, 64, wallH - 44, '#78350f');
    // Noren curtains
    for (let nx = x + 120; nx < x + 180; nx += 16) {
      px(ctx, nx, wallTop + 44, 13, 18, b.kind === 'ramen' ? '#dc2626' : '#1e3a8a');
    }
    // Swaying red lanterns
    const sway = Math.round(Math.sin(time * 2.2) * 1.5);
    px(ctx, x + 22 + sway, wallTop + 44, 10, 14, '#ef4444');
    px(ctx, x + 24 + sway, wallTop + 47, 6, 8, '#fca5a5');
    px(ctx, x + w - 34 + sway, wallTop + 44, 10, 14, '#ef4444');
    px(ctx, x + w - 32 + sway, wallTop + 47, 6, 8, '#fca5a5');
  } else if (b.kind === 'cafe') {
    // Warm amber kissaten windows + wooden door
    px(ctx, x + 22, wallTop + 34, w - 104, wallH - 42, '#fcd34d');
    px(ctx, x + 26, wallTop + 38, w - 112, wallH - 50, '#fef3c7');
    px(ctx, x + w - 66, wallTop + 34, 42, wallH - 34, '#451a03');
    px(ctx, x + w - 58, wallTop + 42, 26, 28, '#fde68a');
  } else if (b.kind === 'apartment' || b.kind === 'house') {
    // Residential windows (mix of warm lit late-night study windows and dark windows) + balconies
    const cols = Math.floor((w - 32) / 56);
    const rows = wallH > 96 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 24 + c * 56;
        const wy = wallTop + 14 + r * 52;
        const isLit = ((c * 3 + r * 5 + x) % 3) !== 0;
        px(ctx, wx, wy, 34, 26, '#0f172a');
        px(ctx, wx + 2, wy + 2, 30, 22, isLit ? '#fde68a' : '#1e293b');
        px(ctx, wx + 16, wy + 2, 2, 22, '#0f172a');
        if (b.kind === 'apartment') {
          // Balcony railing & AC unit
          px(ctx, wx - 4, wy + 24, 42, 10, '#334155');
          px(ctx, wx - 2, wy + 26, 38, 2, '#64748b');
        }
      }
    }
    // Apartment front entrance vestibule
    px(ctx, x + Math.floor(w / 2) - 18, y + h - 38, 36, 30, '#1e293b');
    px(ctx, x + Math.floor(w / 2) - 12, y + h - 32, 24, 24, '#fde68a');
  } else if (b.kind === 'arcade' || b.kind === 'karaoke') {
    // Vibrant neon glass facade & glowing arcade strip
    px(ctx, x + 22, wallTop + 38, w - 44, wallH - 38, '#13162b');
    px(ctx, x + 30, wallTop + 46, 62, wallH - 52, '#ec4899');
    px(ctx, x + w - 92, wallTop + 46, 62, wallH - 52, '#22d3ee');
    px(ctx, x + Math.floor(w / 2) - 24, wallTop + 42, 48, wallH - 42, '#38bdf8');
  }

  // Neon signs attached to building
  for (let i = 0; i < b.signs.length; i++) {
    const s = b.signs[i];
    let on = true;
    if (s.flicker) {
      const f = Math.sin(time * 13 + i * 2) * Math.sin(time * 3.7);
      on = f > -0.82;
    }
    const sx = x + s.offsetX;
    const sy = y + s.offsetY;
    px(ctx, sx, sy, s.w, s.h, '#0b1020');
    ctx.strokeStyle = on ? s.color : '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 1, sy + 1, s.w - 2, s.h - 2);
    ctx.fillStyle = on ? s.color : '#475569';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (s.vertical) {
      const chars = s.text.split('');
      chars.forEach((ch, idx) => {
        ctx.fillText(ch, sx + s.w / 2, sy + 18 + idx * 18);
      });
    } else {
      ctx.fillText(s.text, sx + s.w / 2, sy + s.h / 2 + 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Environmental Props
// ---------------------------------------------------------------------------

export function drawProp(
  ctx: CanvasRenderingContext2D,
  p: WorldProp,
  time: number
): void {
  const sprite = getPropSprite(p);
  if (sprite) {
    ctx.drawImage(sprite, Math.round(p.x), Math.round(p.y));
    return;
  }
  drawPropProcedural(ctx, p, time);
}

function drawPropProcedural(
  ctx: CanvasRenderingContext2D,
  p: WorldProp,
  time: number
): void {
  const x = Math.round(p.x);
  const y = Math.round(p.y);

  switch (p.kind) {
    case 'lamp': {
      ctx.fillStyle = 'rgba(4, 7, 15, 0.5)';
      ctx.fillRect(x + 4, y + 36, 10, 6);
      px(ctx, x + 6, y + 10, 4, 30, '#334155');
      px(ctx, x + 3, y + 36, 10, 4, '#1e293b');
      px(ctx, x + 2, y + 2, 12, 8, '#1e293b');
      px(ctx, x + 4, y + 4, 8, 5, p.lightColor || '#fbbf24');
      break;
    }
    case 'vending': {
      ctx.fillStyle = 'rgba(4, 7, 15, 0.5)';
      ctx.fillRect(x + 2, y + 40, 28, 6);
      px(ctx, x, y, 32, 42, '#1e293b');
      px(ctx, x + 2, y + 2, 28, 38, '#e2e8f0');
      // Glowing drink display window
      px(ctx, x + 4, y + 5, 24, 20, '#bae6fd');
      // Tiny colorful drink rows
      px(ctx, x + 6, y + 8, 4, 5, '#ef4444');
      px(ctx, x + 12, y + 8, 4, 5, '#22c55e');
      px(ctx, x + 18, y + 8, 4, 5, '#3b82f6');
      px(ctx, x + 23, y + 8, 4, 5, '#f59e0b');
      px(ctx, x + 6, y + 16, 4, 5, '#ec4899');
      px(ctx, x + 12, y + 16, 4, 5, '#06b6d4');
      px(ctx, x + 18, y + 16, 4, 5, '#eab308');
      // Pickup tray
      px(ctx, x + 5, y + 31, 16, 6, '#0f172a');
      px(ctx, x + 23, y + 27, 4, 6, '#38bdf8');
      break;
    }
    case 'bench': {
      ctx.fillStyle = 'rgba(4, 7, 15, 0.45)';
      ctx.fillRect(x + 2, y + 18, p.w - 4, 6);
      px(ctx, x + 4, y + 14, 6, 8, '#1e293b');
      px(ctx, x + p.w - 10, y + 14, 6, 8, '#1e293b');
      px(ctx, x, y + 6, p.w, 10, '#78350f');
      px(ctx, x + 2, y + 7, p.w - 4, 3, '#b45309');
      px(ctx, x + 2, y + 12, p.w - 4, 3, '#92400e');
      px(ctx, x, y, p.w, 5, '#57280a');
      break;
    }
    case 'traffic_light': {
      px(ctx, x + 7, y + 12, 4, 30, '#334155');
      px(ctx, x + 2, y, 14, 24, '#0f172a');
      const phase = Math.floor(time / 6) % 3;
      px(ctx, x + 6, y + 3, 6, 5, phase === 0 ? '#ef4444' : '#450a0a');
      px(ctx, x + 6, y + 10, 6, 5, phase === 1 ? '#f59e0b' : '#451a03');
      px(ctx, x + 6, y + 17, 6, 5, phase === 2 ? '#22c55e' : '#052e16');
      break;
    }
    case 'manhole': {
      px(ctx, x, y, 28, 20, '#1e293b');
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 14, y + 10, 12, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      px(ctx, x + 9, y + 9, 10, 2, '#475569');
      break;
    }
    case 'bicycle': {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 7, y + 13, 5, 0, Math.PI * 2);
      ctx.arc(x + 26, y + 13, 5, 0, Math.PI * 2);
      ctx.stroke();
      px(ctx, x + 8, y + 7, 16, 3, '#cbd5e1');
      px(ctx, x + 21, y + 3, 4, 8, '#64748b');
      break;
    }
    case 'phone_booth': {
      px(ctx, x, y, 34, 44, '#065f46');
      px(ctx, x + 4, y + 6, 26, 32, '#a7f3d0');
      px(ctx, x + 10, y + 14, 14, 16, '#047857');
      px(ctx, x + 12, y + 16, 10, 8, '#ecfdf5');
      break;
    }
    case 'gas_pump': {
      px(ctx, x, y, 28, 36, '#e2e8f0');
      px(ctx, x + 3, y + 4, 22, 12, '#0f172a');
      px(ctx, x + 5, y + 6, 18, 8, '#34d399');
      px(ctx, x + 4, y + 20, 20, 14, '#10b981');
      break;
    }
    case 'shrine_lantern': {
      px(ctx, x + 3, y + 26, 16, 8, '#475569');
      px(ctx, x + 7, y + 14, 8, 12, '#64748b');
      px(ctx, x + 4, y + 5, 14, 10, '#fb923c');
      px(ctx, x + 1, y, 20, 6, '#334155');
      break;
    }
    case 'tree': {
      ctx.fillStyle = 'rgba(4, 7, 15, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + 24, y + 50, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Trunk
      px(ctx, x + 20, y + 30, 8, 22, '#3b2820');
      // Rain-slicked deep teal-emerald canopy
      const sway = Math.round(Math.sin(time * 1.4 + x * 0.05) * 1);
      px(ctx, x + 6 + sway, y + 6, 36, 28, '#133836');
      px(ctx, x + 10 + sway, y + 2, 28, 24, '#1b4d49');
      px(ctx, x + 14 + sway, y + 5, 18, 12, '#24665f');
      break;
    }
    case 'utility_pole': {
      px(ctx, x + 4, y + 6, 6, 46, '#2e2623');
      px(ctx, x - 4, y + 10, 22, 3, '#475569');
      px(ctx, x + 2, y + 16, 10, 6, '#1e293b');
      break;
    }
  }
}
