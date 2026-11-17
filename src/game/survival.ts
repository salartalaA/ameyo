import { resolveCircleAabbCollisions } from './physics';
import {
  SURVIVAL_TARGET_SCORE,
  weaponForScore,
  type WeaponDef,
} from './weapons';
import type {
  MotorcycleState,
  PlayerState,
  Rect,
  SurvivalProjectile,
  SurvivalState,
  ZombieState,
} from './types';

export { SURVIVAL_TARGET_SCORE };
export const SURVIVAL_MAX_ZOMBIES = 56;

export type SurvivalEvent =
  | { type: 'playerHit'; damage: number }
  | { type: 'explosion'; x: number; y: number }
  | { type: 'victory' }
  | { type: 'defeat' };

export interface SurvivalShotResult {
  fired: boolean;
  hitZombie: boolean;
  killedZombie: boolean;
  weapon: WeaponDef['kind'] | null;
  endX: number;
  endY: number;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pointInsideColliders(x: number, y: number, colliders: Rect[]): boolean {
  for (const r of colliders) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

function difficultyFor(time: number, score: number) {
  const targetZombies = Math.min(
    SURVIVAL_MAX_ZOMBIES,
    4 + Math.floor(time) + Math.floor(score / 25)
  );
  const spawnInterval = Math.max(
    0.3,
    1.5 - time * 0.016 - score * 0.0012
  );
  const hp = 1 + Math.floor((time * 0.4 + score * 0.1) / 45);
  const speed = Math.min(120, 55 + time * 0.4 + score * 0.04);
  const damage = Math.min(20, 10 + Math.floor(time / 30));
  return { targetZombies, spawnInterval, hp, speed, damage };
}

export function createSurvivalState(): SurvivalState {
  return {
    time: 0,
    score: 0,
    health: 500,
    maxHealth: 500,
    spawnTimer: 0.15,
    spawnCount: 0,
    shootCooldown: 0,
    hurtFlash: 0,
    aimAngle: 0,
    muzzleTimer: 0,
    tracers: [],
    projectiles: [],
    particles: [],
    zombies: [],
    outcome: null,
  };
}

function spawnZombie(
  state: SurvivalState,
  player: PlayerState,
  colliders: Rect[],
  worldW: number,
  worldH: number
): void {
  const diff = difficultyFor(state.time, state.score);
  const baseAngle = state.spawnCount * 2.399963 + rand(-0.45, 0.45);

  for (let attempt = 0; attempt < 14; attempt++) {
    const angle = baseAngle + attempt * 0.72;
    const radius = rand(500, 780);
    const rawX = player.x + Math.cos(angle) * radius;
    const rawY = player.y + Math.sin(angle) * radius;
    const resolved = resolveCircleAabbCollisions(
      { x: rawX, y: rawY },
      9,
      colliders,
      worldW,
      worldH
    );
    if (pointInsideColliders(resolved.x, resolved.y, colliders)) continue;
    if (Math.hypot(resolved.x - player.x, resolved.y - player.y) < 380) continue;

    const hp = Math.min(5, diff.hp + (Math.random() < 0.18 ? 1 : 0));
    // Armed zombies only appear from 200 kills onward, then become more common.
    const armedChance = state.score < 200
      ? 0
      : Math.min(0.4, 0.05 + state.time * 0.003 + (state.score - 200) * 0.0007);
    const armed = Math.random() < armedChance;
    const zombie: ZombieState = {
      id: state.spawnCount + 1,
      x: resolved.x,
      y: resolved.y,
      vx: 0,
      vy: 0,
      radius: 9,
      hp,
      maxHp: hp,
      speed: diff.speed * rand(0.88, 1.14),
      damage: diff.damage,
      attackRange: player.mounted ? 34 : 27,
      attackCooldown: armed ? rand(0.8, 1.8) : rand(0, 0.7),
      attackAnim: 0,
      hitFlash: 0,
      walkPhase: rand(0, Math.PI * 2),
      facing: angle > Math.PI / 2 ? 'down' : 'up',
      armed,
    };
    state.zombies.push(zombie);
    state.spawnCount++;
    return;
  }
}

function burstParticles(
  state: SurvivalState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 90
): void {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const v = rand(speed * 0.35, speed);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 0,
      maxLife: rand(0.22, 0.48),
      color,
      size: rand(1, 3),
    });
  }
}

function killZombie(state: SurvivalState, z: ZombieState): void {
  state.zombies = state.zombies.filter((item) => item.id !== z.id);
  state.score += 1;
  burstParticles(state, z.x, z.y - 6, '#4d7c0f', 12, 120);
  burstParticles(state, z.x, z.y - 6, '#365314', 7, 75);
}

function explodeProjectile(
  state: SurvivalState,
  projectile: SurvivalProjectile,
  x: number,
  y: number
): SurvivalEvent[] {
  const events: SurvivalEvent[] = [];
  const radius = projectile.radius;
  const damage = projectile.damage;
  burstParticles(state, x, y - 6, '#fb923c', 22, 190);
  burstParticles(state, x, y - 6, '#f87171', 16, 150);
  burstParticles(state, x, y - 6, '#475569', 14, 90);
  burstParticles(state, x, y - 6, '#fde68a', 10, 230);
  for (const z of [...state.zombies]) {
    if (Math.hypot(z.x - x, z.y - y) <= radius + z.radius) {
      z.hp -= damage;
      z.hitFlash = 0.2;
      if (z.hp <= 0) killZombie(state, z);
    }
  }
  events.push({ type: 'explosion', x, y });
  return events;
}

export function updateSurvival(
  state: SurvivalState,
  player: PlayerState,
  moto: MotorcycleState,
  dt: number,
  colliders: Rect[],
  worldW: number,
  worldH: number
): SurvivalEvent[] {
  const events: SurvivalEvent[] = [];

  // Cosmetic timers stay alive after the run ends so the end screen has motion.
  for (const tr of state.tracers) tr.life += dt;
  state.tracers = state.tracers.filter((tr) => tr.life < tr.maxLife);
  for (const p of state.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - Math.min(0.9, dt * 5);
    p.vy *= 1 - Math.min(0.9, dt * 5);
  }
  state.particles = state.particles.filter((p) => p.life < p.maxLife);
  state.shootCooldown = Math.max(0, state.shootCooldown - dt);
  state.muzzleTimer = Math.max(0, state.muzzleTimer - dt);
  state.hurtFlash = Math.max(0, state.hurtFlash - dt);

  // Bombs: fly straight, explode on wall/zombie contact or at max range.
  for (const r of [...state.projectiles]) {
    r.life += dt;
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    let boom = r.life >= r.maxLife;
    if (!boom && pointInsideColliders(r.x, r.y, colliders)) boom = true;
    if (!boom) {
      for (const z of state.zombies) {
        if (Math.hypot(z.x - r.x, z.y - r.y) < z.radius + 7) {
          boom = true;
          break;
        }
      }
    }
    if (boom) {
      state.projectiles = state.projectiles.filter((item) => item !== r);
      events.push(...explodeProjectile(state, r, r.x, r.y));
    }
  }

  if (state.outcome) {
    // Victory/defeat already decided — keep simulating projectiles but stop AI.
    if (state.score >= SURVIVAL_TARGET_SCORE) state.outcome = 'victory';
    if (state.health <= 0) state.outcome = 'defeat';
    return events;
  }

  state.time += dt;
  const diff = difficultyFor(state.time, state.score);

  // Continuous pressure: spawn from rotating directions until the active cap rises.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.zombies.length < diff.targetZombies) {
      spawnZombie(state, player, colliders, worldW, worldH);
      state.spawnTimer = diff.spawnInterval * rand(0.75, 1.15);
    } else {
      state.spawnTimer = 0.18;
    }
  }

  const targetX = player.mounted ? moto.x : player.x;
  const targetY = player.mounted ? moto.y : player.y;

  for (const z of state.zombies) {
    z.attackCooldown = Math.max(0, z.attackCooldown - dt);
    z.attackAnim = Math.max(0, z.attackAnim - dt);
    z.hitFlash = Math.max(0, z.hitFlash - dt);

    const dx = targetX - z.x;
    const dy = targetY - z.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const ux = dx / dist;
    const uy = dy / dist;

    // Slight speed penalty while the player is moving fast on the motorcycle.
    const riderSpeedPenalty = player.mounted ? Math.min(0.22, Math.abs(moto.speed) / 1400) : 0;
    const moveSpeed = z.speed * (1 - riderSpeedPenalty);
    if (z.armed) {
      // Armed zombies hold a firing band: close in, back off, or strafe.
      const band = 300;
      if (dist > band + 70) {
        z.vx = ux * moveSpeed * 0.9;
        z.vy = uy * moveSpeed * 0.9;
      } else if (dist < band - 90) {
        z.vx = -ux * moveSpeed * 0.55;
        z.vy = -uy * moveSpeed * 0.55;
      } else {
        const strafe = (z.id % 2 === 0 ? 1 : -1) * (Math.sin(z.walkPhase * 0.35) >= 0 ? 1 : -1);
        z.vx = -uy * moveSpeed * 0.7 * strafe;
        z.vy = ux * moveSpeed * 0.7 * strafe;
      }
    } else {
      z.vx = ux * moveSpeed;
      z.vy = uy * moveSpeed;
    }
    z.walkPhase += moveSpeed * dt * 0.11;
    z.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';

    const next = resolveCircleAabbCollisions(
      { x: z.x + z.vx * dt, y: z.y + z.vy * dt },
      z.radius,
      colliders,
      worldW,
      worldH
    );
    z.x = next.x;
    z.y = next.y;

    if (dist < z.attackRange + (player.mounted ? 10 : 4) && z.attackCooldown <= 0) {
      z.attackCooldown = 0.95;
      z.attackAnim = 0.28;
      state.health = Math.max(0, state.health - z.damage);
      state.hurtFlash = 0.38;
      burstParticles(state, targetX, targetY - 8, '#86efac', 7, 70);
      events.push({ type: 'playerHit', damage: z.damage });
    }

    // Armed zombies shoot the player from range (walls still block bullets).
    if (z.armed && dist > z.attackRange + 6 && dist < 720 && z.attackCooldown <= 0) {
      z.attackCooldown = rand(1.2, 2.1);
      const shotAngle = Math.atan2(dy, dx) + rand(-0.1, 0.1);
      const bdx = Math.cos(shotAngle);
      const bdy = Math.sin(shotAngle);
      const muzzleX = z.x + bdx * 14;
      const muzzleY = z.y + bdy * 14 - 6;
      // March the bullet path to find the first wall.
      let wallDist = dist + 30;
      for (let t = 12; t < dist + 30; t += 10) {
        if (pointInsideColliders(z.x + bdx * t, z.y + bdy * t, colliders)) {
          wallDist = t;
          break;
        }
      }
      const tProj = (targetX - z.x) * bdx + (targetY - z.y) * bdy;
      const perp = Math.abs((targetX - z.x) * bdy - (targetY - z.y) * bdx);
      const willHit = tProj > 0 && tProj <= wallDist && perp < player.radius + 4;
      state.tracers.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: willHit ? targetX : z.x + bdx * wallDist,
        y2: willHit ? targetY : z.y + bdy * wallDist,
        life: 0,
        maxLife: 0.12,
        color: '#f87171',
        width: 1,
      });
      if (willHit) {
        const dmg = z.damage + 6;
        state.health = Math.max(0, state.health - dmg);
        state.hurtFlash = 0.38;
        burstParticles(state, targetX, targetY - 8, '#fca5a5', 6, 70);
        events.push({ type: 'playerHit', damage: dmg });
      }
    }
  }

  // Simple separation keeps hordes readable instead of collapsing into one pixel.
  const zombies = state.zombies;
  for (let i = 0; i < zombies.length; i++) {
    for (let j = i + 1; j < zombies.length; j++) {
      const a = zombies[i];
      const b = zombies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.radius + b.radius + 2;
      if (distSq > 0.01 && distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const push = ((minDist - dist) / dist) * 0.5;
        const px = dx * push;
        const py = dy * push;
        a.x -= px;
        a.y -= py;
        b.x += px;
        b.y += py;
      }
    }
  }

  // Reaching 200 kills refills health once; damage still applies afterwards.
  if (!state.finalHealUsed && state.score >= 200) {
    state.finalHealUsed = true;
    state.health = state.maxHealth;
    state.hurtFlash = 0;
  }

  if (state.score >= SURVIVAL_TARGET_SCORE) {
    state.outcome = 'victory';
    events.push({ type: 'victory' });
  } else if (state.health <= 0) {
    state.outcome = 'defeat';
    events.push({ type: 'defeat' });
  }

  return events;
}

function fireHitscan(
  state: SurvivalState,
  weapon: WeaponDef,
  originX: number,
  originY: number,
  baseAngle: number,
  colliders: Rect[],
  worldW: number,
  worldH: number
): { hitZombie: boolean; killedZombie: boolean; endX: number; endY: number } {
  let hitZombie = false;
  let killedZombie = false;
  let endX = originX + Math.cos(baseAngle) * weapon.range;
  let endY = originY + Math.sin(baseAngle) * weapon.range;

  for (let pellet = 0; pellet < weapon.pellets; pellet++) {
    const spread = weapon.spread * (Math.random() * 2 - 1);
    const dirX = Math.cos(baseAngle + spread);
    const dirY = Math.sin(baseAngle + spread);

    // Walls block shots before zombies behind them can be hit.
    let wallDist = weapon.range;
    for (let t = 14; t < weapon.range; t += 8) {
      const sx = originX + dirX * t;
      const sy = originY + dirY * t;
      if (pointInsideColliders(sx, sy, colliders)) {
        wallDist = t;
        break;
      }
    }

    let best: { zombie: ZombieState; t: number } | null = null;
    for (const z of state.zombies) {
      const rx = z.x - originX;
      const ry = z.y - originY;
      const t = rx * dirX + ry * dirY;
      if (t < 8 || t > wallDist + z.radius) continue;
      const perp = Math.abs(rx * dirY - ry * dirX);
      if (perp < z.radius + 5 && (!best || t < best.t)) {
        best = { zombie: z, t };
      }
    }

    let px2 = originX + dirX * wallDist;
    let py2 = originY + dirY * wallDist;
    if (best && best.t <= wallDist) {
      hitZombie = true;
      const z = best.zombie;
      px2 = z.x;
      py2 = z.y;
      z.hp -= weapon.damage;
      z.hitFlash = 0.16;
      burstParticles(state, z.x, z.y - 5, '#a3e635', 6, 85);
      if (z.hp <= 0) {
        killZombie(state, z);
        killedZombie = true;
        burstParticles(state, z.x, z.y - 6, '#fb923c', 8, 130);
      }
    }

    state.tracers.push({
      x1: originX + dirX * 15,
      y1: originY + dirY * 15 - 7,
      x2: px2,
      y2: py2,
      life: 0,
      maxLife: 0.085,
      color: weapon.tracerColor,
      width: weapon.tracerWidth,
    });
    endX = px2;
    endY = py2;
  }

  void worldW;
  void worldH;
  return { hitZombie, killedZombie, endX, endY };
}

export function trySurvivalShot(
  state: SurvivalState,
  player: PlayerState,
  moto: MotorcycleState,
  aimX: number,
  aimY: number,
  colliders: Rect[],
  worldW: number,
  worldH: number
): SurvivalShotResult {
  const weapon = weaponForScore(state.score);
  const miss: SurvivalShotResult = {
    fired: false,
    hitZombie: false,
    killedZombie: false,
    weapon: null,
    endX: aimX,
    endY: aimY,
  };
  if (state.outcome || state.shootCooldown > 0) return miss;

  const originX = player.mounted ? moto.x : player.x;
  const originY = player.mounted ? moto.y : player.y;
  let dirX = aimX - originX;
  let dirY = aimY - originY;
  const dirLen = Math.hypot(dirX, dirY);
  if (dirLen < 4) {
    dirX = Math.cos(state.aimAngle);
    dirY = Math.sin(state.aimAngle);
  } else {
    dirX /= dirLen;
    dirY /= dirLen;
  }
  const baseAngle = Math.atan2(dirY, dirX);
  state.aimAngle = baseAngle;
  state.shootCooldown = weapon.fireInterval;
  state.muzzleTimer = 0.075;

  const muzzleX = originX + dirX * 15;
  const muzzleY = originY + dirY * 15 - 7;

  if (weapon.projectile === 'bomb') {
    // Bomber: lobs a fan of aerial bombs, each detonating in a wide blast.
    const speed = weapon.bombSpeed ?? 540;
    const range = weapon.range;
    const count = weapon.bombCount ?? 3;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.14;
      const bombAngle = baseAngle + offset + rand(-weapon.spread, weapon.spread);
      const bomb: SurvivalProjectile = {
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(bombAngle) * speed,
        vy: Math.sin(bombAngle) * speed,
        life: 0,
        maxLife: range / speed,
        damage: weapon.bombDamage ?? 8,
        radius: weapon.bombRadius ?? 110,
      };
      state.projectiles.push(bomb);
    }
    burstParticles(state, muzzleX, muzzleY, '#fdba74', 8, 80);
    return { fired: true, hitZombie: false, killedZombie: false, weapon: weapon.kind, endX: muzzleX, endY: muzzleY };
  }

  const result = fireHitscan(
    state,
    weapon,
    originX,
    originY,
    baseAngle,
    colliders,
    worldW,
    worldH
  );
  return {
    fired: true,
    hitZombie: result.hitZombie,
    killedZombie: result.killedZombie,
    weapon: weapon.kind,
    endX: result.endX,
    endY: result.endY,
  };
}
