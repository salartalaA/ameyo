import type { Building, MotorcycleState, PlayerState, WorldProp } from './types';

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  len: number;
  alpha: number;
}

interface Splash {
  active: boolean;
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface SteamPuff {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
}

export class WeatherLightingSystem {
  private raindrops: Raindrop[] = [];
  private splashes: Splash[] = [];
  private splashCursor = 0;
  private steam: SteamPuff[] = [];
  private steamCursor = 0;
  private steamTimer = 0;

  private lightningTimer = 20;
  private lightningFlash = 0;

  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private glowSprites = new Map<string, HTMLCanvasElement>();

  constructor() {
    for (let i = 0; i < 320; i++) {
      this.raindrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        speed: 450 + Math.random() * 170,
        len: 10 + Math.random() * 12,
        alpha: 0.18 + Math.random() * 0.22,
      });
    }
    for (let i = 0; i < 56; i++) {
      this.splashes.push({ active: false, x: 0, y: 0, age: 0, maxAge: 0.35 });
    }
    for (let i = 0; i < 40; i++) {
      this.steam.push({
        active: false,
        x: 0,
        y: 0,
        vy: -16,
        age: 0,
        maxAge: 2.2,
        size: 6,
      });
    }

    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = 360;
    this.lightCanvas.height = 225;
    this.lightCtx = this.lightCanvas.getContext('2d')!;
  }

  private getGlowSprite(color: string): HTMLCanvasElement {
    const existing = this.glowSprites.get(color);
    if (existing) return existing;

    const size = 96;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const gctx = c.getContext('2d')!;
    const g = gctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    g.addColorStop(0, color);
    g.addColorStop(0.45, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, size, size);
    this.glowSprites.set(color, c);
    return c;
  }

  public update(
    dt: number,
    rainIntensity: number,
    viewW: number,
    viewH: number,
    camX: number,
    camY: number,
    manholes: WorldProp[],
    onLightning?: () => void
  ): void {
    const activeCount = Math.floor(
      this.raindrops.length * Math.min(1.2, Math.max(0.3, rainIntensity))
    );
    const wrapW = Math.max(400, viewW + 80);
    const wrapH = Math.max(300, viewH + 60);

    for (let i = 0; i < activeCount; i++) {
      const r = this.raindrops[i];
      r.x -= r.speed * 0.18 * dt;
      r.y += r.speed * dt;
      if (r.y > wrapH) {
        r.y = -16;
        r.x = Math.random() * wrapW;
        if (Math.random() < 0.18) {
          const sp = this.splashes[this.splashCursor];
          this.splashCursor = (this.splashCursor + 1) % this.splashes.length;
          sp.active = true;
          sp.x = camX + Math.random() * viewW;
          sp.y = camY + Math.random() * viewH;
          sp.age = 0;
          sp.maxAge = 0.25 + Math.random() * 0.2;
        }
      }
      if (r.x < -30) {
        r.x = wrapW - 10;
      }
    }

    for (let i = 0; i < this.splashes.length; i++) {
      const sp = this.splashes[i];
      if (!sp.active) continue;
      sp.age += dt;
      if (sp.age >= sp.maxAge) sp.active = false;
    }

    this.steamTimer += dt;
    if (this.steamTimer >= 0.24) {
      this.steamTimer = 0;
      for (const mh of manholes) {
        if (
          mh.x < camX - 60 ||
          mh.x > camX + viewW + 60 ||
          mh.y < camY - 60 ||
          mh.y > camY + viewH + 60
        ) {
          continue;
        }
        const puff = this.steam[this.steamCursor];
        this.steamCursor = (this.steamCursor + 1) % this.steam.length;
        puff.active = true;
        puff.x = mh.x + 14 + (Math.random() - 0.5) * 10;
        puff.y = mh.y + 8;
        puff.vy = -12 - Math.random() * 10;
        puff.age = 0;
        puff.maxAge = 1.6 + Math.random() * 0.9;
        puff.size = 5 + Math.random() * 5;
      }
    }

    for (let i = 0; i < this.steam.length; i++) {
      const st = this.steam[i];
      if (!st.active) continue;
      st.age += dt;
      st.y += st.vy * dt;
      st.x += Math.sin(st.age * 3 + i) * 6 * dt;
      if (st.age >= st.maxAge) st.active = false;
    }

    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 24 + Math.random() * 16;
      this.lightningFlash = 0.38;
      onLightning?.();
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 1.4);
    }
  }

  public drawGroundReflections(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    props: WorldProp[],
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    time: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const b of buildings) {
      if (
        b.x + b.w < camX - 100 ||
        b.x > camX + viewW + 100 ||
        b.y + b.h < camY - 120 ||
        b.y > camY + viewH + 80
      ) {
        continue;
      }
      for (const s of b.signs) {
        const sx = b.x + s.offsetX + s.w / 2;
        const sy = b.y + b.h + 16;
        const shimmer = 0.22 + 0.06 * Math.sin(time * 3.2 + sx * 0.02);
        const sprite = this.getGlowSprite(s.color);
        ctx.globalAlpha = shimmer;
        ctx.drawImage(sprite, sx - s.w * 0.55, sy - 16, s.w * 1.1, 52);

        // Broken vertical neon reflection columns on wet pavement
        const signLeft = b.x + s.offsetX;
        const streakAlpha = 0.10 + 0.045 * Math.sin(time * 4.1 + sx * 0.017);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = streakAlpha;
        for (let k = 0; k < 3; k++) {
          const rx = signLeft + s.w * (0.22 + k * 0.28) + Math.sin(time * 2.7 + k) * 1.5;
          const len = 34 + ((k * 17 + Math.floor(sx)) % 29);
          ctx.fillRect(Math.round(rx), Math.round(b.y + b.h + 4), k === 1 ? 4 : 2, len);
        }
      }

      if (b.warmLights) {
        const doorX = b.doorX ?? b.x + b.w / 2;
        const doorY = b.doorY ?? b.y + b.h;
        const sprite = this.getGlowSprite('rgba(251, 191, 36, 0.45)');
        ctx.globalAlpha = 0.55;
        ctx.drawImage(sprite, doorX - 68, doorY - 18, 136, 76);
        ctx.fillStyle = '#fbbf24';
        ctx.globalAlpha = 0.12 + 0.04 * Math.sin(time * 2.2 + doorX);
        ctx.fillRect(Math.round(doorX - 7), Math.round(doorY + 2), 14, 54);
        ctx.fillRect(Math.round(doorX - 3), Math.round(doorY + 2), 6, 42);
      }
    }

    for (const p of props) {
      if (!p.lightColor || !p.lightRadius) continue;
      if (
        p.x < camX - 200 ||
        p.x > camX + viewW + 200 ||
        p.y < camY - 200 ||
        p.y > camY + viewH + 200
      ) {
        continue;
      }
      const lx = p.x + p.w / 2;
      const ly = p.y + p.h;
      const rad = p.lightRadius * 0.65;
      const sprite = this.getGlowSprite(p.lightColor);
      ctx.globalAlpha = 0.24;
      ctx.drawImage(sprite, lx - rad, ly - rad * 0.45, rad * 2, rad * 1.15);

      // Tall wet-surface streak beneath lamps, machines, and shrine lights
      const streakW = Math.max(5, p.w * 0.72);
      const streakH = Math.min(86, p.lightRadius * 0.72);
      ctx.fillStyle = p.lightColor;
      ctx.globalAlpha = 0.11 + 0.045 * Math.sin(time * 3.4 + lx * 0.03);
      ctx.fillRect(Math.round(lx - streakW / 2), Math.round(ly + 2), Math.round(streakW), streakH);
      ctx.globalAlpha *= 0.55;
      ctx.fillRect(Math.round(lx - 2), Math.round(ly + 2), 4, Math.round(streakH * 0.72));
    }

    ctx.restore();
  }

  public drawSteamAndSplashes(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.splashes.length; i++) {
      const sp = this.splashes[i];
      if (!sp.active) continue;
      const t = sp.age / sp.maxAge;
      const r = 1 + t * 5;
      ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - t) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(Math.round(sp.x), Math.round(sp.y), r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < this.steam.length; i++) {
      const st = this.steam[i];
      if (!st.active) continue;
      const t = st.age / st.maxAge;
      const alpha = Math.sin(t * Math.PI) * 0.18;
      ctx.fillStyle = `rgba(203, 213, 225, ${alpha.toFixed(3)})`;
      const r = st.size + t * 8;
      ctx.beginPath();
      ctx.arc(Math.round(st.x), Math.round(st.y), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  public drawNightLightingOverlay(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    camX: number,
    camY: number,
    scale: number,
    buildings: Building[],
    props: WorldProp[],
    player: PlayerState,
    moto: MotorcycleState
  ): void {
    // 1/4 resolution lightmap for crisp fast compositing
    const lw = Math.max(160, Math.round(canvasW / 4));
    const lh = Math.max(90, Math.round(canvasH / 4));
    if (this.lightCanvas.width !== lw || this.lightCanvas.height !== lh) {
      this.lightCanvas.width = lw;
      this.lightCanvas.height = lh;
    }

    const lctx = this.lightCtx;
    const toLightX = (wx: number) => ((wx - camX) * scale) / 4;
    const toLightY = (wy: number) => ((wy - camY) * scale) / 4;
    const toLightR = (wr: number) => (wr * scale) / 4;

    // Rich midnight indigo ambient (keeps city readable & atmospheric instead of murky black!)
    const lift = Math.round(this.lightningFlash * 95);
    const rAmb = Math.min(240, 102 + lift);
    const gAmb = Math.min(245, 118 + lift);
    const bAmb = Math.min(255, 168 + lift);
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = `rgb(${rAmb}, ${gAmb}, ${bAmb})`;
    lctx.fillRect(0, 0, lw, lh);

    lctx.globalCompositeOperation = 'lighter';

    const stampGlow = (wx: number, wy: number, wr: number, color: string, alpha = 0.72) => {
      const gx = toLightX(wx);
      const gy = toLightY(wy);
      const gr = toLightR(wr);
      if (gx + gr < 0 || gx - gr > lw || gy + gr < 0 || gy - gr > lh) return;
      const sprite = this.getGlowSprite(color);
      lctx.globalAlpha = alpha;
      lctx.drawImage(sprite, gx - gr, gy - gr, gr * 2, gr * 2);
    };

    // Subtle visibility glow around protagonist
    stampGlow(player.x, player.y - 10, 105, 'rgba(180, 210, 255, 0.55)', 0.65);
    if (player.action === 'phone_idle') {
      stampGlow(player.x, player.y - 14, 52, 'rgba(56, 189, 248, 0.6)', 0.7);
    }

    for (const b of buildings) {
      if (b.warmLights) {
        const cx = b.doorX ?? b.x + b.w / 2;
        const cy = b.doorY ?? b.y + b.h;
        stampGlow(cx, cy - 16, 195, 'rgba(253, 224, 130, 0.7)', 0.75);
      }
      if (b.kind === 'apartment' || b.kind === 'house') {
        const wallTop = b.y + b.roofHeight + 4;
        const wallBottom = b.y + b.h - 9;
        const cols = Math.max(2, Math.floor((b.w - 34) / 56));
        const rows = Math.max(1, Math.floor((wallBottom - wallTop - 20) / 52));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (((c * 5 + r * 3) % 4) === 0) continue;
            stampGlow(
              b.x + 18 + c * Math.floor((b.w - 36) / cols) + 17,
              wallTop + 10 + r * 52 + 12,
              44,
              '#fde68a',
              0.16
            );
          }
        }
      }
      for (const s of b.signs) {
        stampGlow(b.x + s.offsetX + s.w / 2, b.y + s.offsetY + s.h / 2, 165, s.color, 0.65);
      }
    }

    for (const p of props) {
      if (!p.lightColor || !p.lightRadius) continue;
      stampGlow(p.x + p.w / 2, p.y + 12, p.lightRadius * 1.15, p.lightColor, 0.78);
    }

    // Motorcycle Headlight Cone + Red Taillight
    if (moto.headlightOn) {
      const mx = toLightX(moto.x);
      const my = toLightY(moto.y);
      const coneLen = toLightR(280);
      lctx.save();
      lctx.globalAlpha = 0.95;
      lctx.translate(mx, my);
      lctx.rotate(moto.angle);
      lctx.fillStyle = 'rgba(254, 249, 195, 0.75)';
      lctx.beginPath();
      lctx.moveTo(6, -3);
      lctx.lineTo(coneLen, -coneLen * 0.36);
      lctx.lineTo(coneLen, coneLen * 0.36);
      lctx.lineTo(6, 3);
      lctx.closePath();
      lctx.fill();
      lctx.restore();

      stampGlow(
        moto.x - Math.cos(moto.angle) * 16,
        moto.y - Math.sin(moto.angle) * 16,
        55,
        'rgba(239, 68, 68, 0.7)',
        0.65
      );
    }

    lctx.globalAlpha = 1;

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.lightCanvas, 0, 0, canvasW, canvasH);
    ctx.restore();

    // Emissive bloom pass over storefronts & neon signs so they glow warmly in the rain!
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of buildings) {
      for (const s of b.signs) {
        const sx = (b.x + s.offsetX + s.w / 2 - camX) * scale;
        const sy = (b.y + s.offsetY + s.h / 2 - camY) * scale;
        const sr = Math.max(s.w, s.h) * 0.7 * scale;
        if (sx + sr < 0 || sx - sr > canvasW || sy + sr < 0 || sy - sr > canvasH) continue;
        const sprite = this.getGlowSprite(s.color);
        ctx.globalAlpha = 0.16;
        ctx.drawImage(sprite, sx - sr, sy - sr * 0.6, sr * 2, sr * 1.2);
      }
    }
    if (moto.headlightOn) {
      const mx = (moto.x + Math.cos(moto.angle) * 16 - camX) * scale;
      const my = (moto.y + Math.sin(moto.angle) * 16 - camY) * scale;
      const sprite = this.getGlowSprite('#fef08a');
      ctx.globalAlpha = 0.22;
      ctx.drawImage(sprite, mx - 36, my - 36, 72, 72);
    }
    ctx.restore();

    if (this.lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(210, 230, 255, ${this.lightningFlash * 0.18})`;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
  }

  public drawRainStreaks(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    rainIntensity: number
  ): void {
    const activeCount = Math.floor(
      this.raindrops.length * Math.min(1.2, Math.max(0.3, rainIntensity))
    );
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(186, 224, 255, 0.26)';
    ctx.beginPath();
    for (let i = 0; i < activeCount; i++) {
      const r = this.raindrops[i];
      if (r.x > canvasW + 20 || r.y > canvasH + 20) continue;
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.len * 0.18, r.y + r.len);
    }
    ctx.stroke();
    ctx.restore();
  }
}
