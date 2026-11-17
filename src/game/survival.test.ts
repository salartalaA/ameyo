import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SURVIVAL_TARGET_SCORE,
  createSurvivalState,
  trySurvivalShot,
  updateSurvival,
} from './survival';
import { WEAPONS, weaponForScore } from './weapons';
import type {
  MotorcycleState,
  PlayerState,
  SurvivalState,
  ZombieState,
} from './types';

const WORLD_W = 4800;
const WORLD_H = 3600;

function makePlayer(x = 1000, y = 1000, mounted = false): PlayerState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 10,
    facing: 'right',
    action: 'idle',
    gaitPhase: 0,
    idleTimer: 0,
    interactTimer: 0,
    sittingTargetId: null,
    seatPos: null,
    seatFacing: 'down',
    mounted,
    mountCooldown: 0,
  };
}

function makeMoto(x = 1170, y = 1088): MotorcycleState {
  return {
    x,
    y,
    angle: 0,
    speed: 0,
    steerInput: 0,
    throttle: 0,
    braking: false,
    headlightOn: false,
    radius: 16,
    wheelPhase: 0,
  };
}

function makeZombie(x: number, y: number, overrides: Partial<ZombieState> = {}): ZombieState {
  return {
    id: Math.floor(Math.random() * 100000),
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 9,
    hp: 1,
    maxHp: 1,
    speed: 70,
    damage: 10,
    attackRange: 27,
    attackCooldown: 0,
    attackAnim: 0,
    hitFlash: 0,
    walkPhase: 0,
    facing: 'left',
    armed: false,
    ...overrides,
  };
}

function run(state: SurvivalState, player: PlayerState, moto: MotorcycleState, seconds: number, dt = 0.05) {
  const events = [];
  for (let t = 0; t < seconds; t += dt) {
    events.push(...updateSurvival(state, player, moto, dt, [], WORLD_W, WORLD_H));
  }
  return events;
}

test('survival state starts clean with target score 260', () => {
  const s = createSurvivalState();
  assert.equal(s.score, 0);
  assert.equal(s.health, s.maxHealth);
  assert.equal(s.outcome, null);
  assert.equal(SURVIVAL_TARGET_SCORE, 260);
});

test('zombies spawn continuously from multiple directions over time', () => {
  const s = createSurvivalState();
  const p = makePlayer();
  const m = makeMoto();
  run(s, p, m, 6);
  assert.ok(s.zombies.length > 0, 'expected zombies to spawn');
  assert.ok(s.spawnCount >= s.zombies.length);
  const angles = new Set(s.zombies.map((z) => Math.sign(z.x - p.x) + ',' + Math.sign(z.y - p.y)));
  assert.ok(angles.size >= 2, 'spawns should come from multiple directions');
});

test('zombies chase the player and damage on contact', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1040, 1000, { attackRange: 30 }));
  const before = Math.hypot(s.zombies[0].x - p.x, s.zombies[0].y - p.y);
  run(s, p, m, 0.6);
  const after = Math.hypot(s.zombies[0].x - p.x, s.zombies[0].y - p.y);
  assert.ok(after < before, 'zombie should close distance');
  assert.ok(s.health < s.maxHealth, 'zombie should deal damage');
});

test('zombies chase the motorcycle while mounted', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1200, 1100, true);
  const m = makeMoto(1200, 1100);
  s.zombies.push(makeZombie(1260, 1100));
  run(s, p, m, 0.8);
  const z = s.zombies[0];
  assert.ok(Math.hypot(z.x - m.x, z.y - m.y) < 70, 'zombie should close on the bike');
});

test('gunshot kills a zombie and awards exactly 1 point', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1060, 1000, { hp: 1 }));
  const shot = trySurvivalShot(s, p, m, 1120, 1000, [], WORLD_W, WORLD_H);
  assert.equal(shot.fired, true);
  assert.equal(shot.hitZombie, true);
  assert.equal(shot.killedZombie, true);
  assert.equal(s.score, 1);
  assert.equal(s.zombies.length, 0);
});

test('shooting works while mounted using the motorcycle as origin', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1200, 1100, true);
  const m = makeMoto(1200, 1100);
  s.zombies.push(makeZombie(1260, 1100, { hp: 1 }));
  const shot = trySurvivalShot(s, p, m, 1320, 1100, [], WORLD_W, WORLD_H);
  assert.equal(shot.fired, true);
  assert.equal(shot.killedZombie, true);
  assert.equal(s.score, 1);
});

test('walls block shots before zombies behind them', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  const wall = { x: 1030, y: 980, w: 20, h: 40 };
  s.zombies.push(makeZombie(1120, 1000, { hp: 1 }));
  const shot = trySurvivalShot(s, p, m, 1200, 1000, [wall], WORLD_W, WORLD_H);
  assert.equal(shot.fired, true);
  assert.equal(shot.hitZombie, false);
  assert.equal(s.score, 0);
});

test('reaching 260 points triggers immediate victory', () => {
  const s = createSurvivalState();
  s.score = SURVIVAL_TARGET_SCORE - 1;
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1060, 1000, { hp: 1 }));
  // At 259 kills the equipped weapon is the Bomber — bombs take time to land.
  const events = [];
  for (let i = 0; i < 200 && s.score < SURVIVAL_TARGET_SCORE; i++) {
    trySurvivalShot(s, p, m, 1120, 1000, [], WORLD_W, WORLD_H);
    events.push(...updateSurvival(s, p, m, 0.05, [], WORLD_W, WORLD_H));
  }
  assert.equal(s.score, SURVIVAL_TARGET_SCORE);
  events.push(...run(s, p, m, 0.1));
  assert.equal(s.outcome, 'victory');
  assert.ok(events.some((e) => e.type === 'victory'));
});

test('health reaching zero triggers defeat', () => {
  const s = createSurvivalState();
  s.health = 5;
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1015, 1000, { damage: 10, attackRange: 30 }));
  const events = run(s, p, m, 0.2);
  assert.equal(s.health, 0);
  assert.equal(s.outcome, 'defeat');
  assert.ok(events.some((e) => e.type === 'defeat'));
});

test('difficulty ramps spawn rate and zombie count over time', () => {
  const s = createSurvivalState();
  s.health = 100000; // keep the run alive while observing escalation
  const p = makePlayer();
  const m = makeMoto();
  run(s, p, m, 10);
  const earlyCount = s.zombies.length;
  const earlyTime = s.time;
  run(s, p, m, 10);
  assert.ok(s.time > earlyTime + 9);
  assert.ok(s.spawnCount > earlyCount);
  // The active cap grows with time, so after ~20s the horde is larger than the opening.
  assert.ok(s.zombies.length > earlyCount, `expected horde to grow (${earlyCount} -> ${s.zombies.length})`);
});

test('weapon progression matches the exact kill milestones', () => {
  const expected: Array<[number, string]> = [
    [0, 'pistol'],
    [49, 'pistol'],
    [50, 'ak47'],
    [99, 'ak47'],
    [100, 'minigun'],
    [199, 'minigun'],
    [200, 'bomber'],
    [259, 'bomber'],
  ];
  for (const [score, kind] of expected) {
    assert.equal(weaponForScore(score).kind, kind, `score ${score} should use ${kind}`);
  }
  assert.equal(WEAPONS.length, 4);
});

test('every weapon fires when its milestone is reached', () => {
  for (const w of WEAPONS) {
    const s = createSurvivalState();
    s.score = w.minScore;
    s.spawnTimer = 9999;
    const p = makePlayer(1000, 1000);
    const m = makeMoto();
    s.zombies.push(makeZombie(1100, 1000, { hp: 99 }));
    const shot = trySurvivalShot(s, p, m, 1200, 1000, [], WORLD_W, WORLD_H);
    assert.equal(shot.fired, true, `${w.name} should fire`);
    assert.equal(shot.weapon, w.kind);
  }
});

test('distinct weapons have distinct fire rates and damage profiles', () => {
  const pistol = weaponForScore(0);
  const ak = weaponForScore(50);
  const mg = weaponForScore(100);
  const bomber = weaponForScore(200);
  assert.ok(ak.fireInterval < pistol.fireInterval, 'AK should fire faster than pistol');
  assert.ok(mg.fireInterval < ak.fireInterval, 'Minigun should fire fastest');
  assert.ok(bomber.fireInterval > pistol.fireInterval * 5, 'Bomber should be slow');
  assert.equal(bomber.projectile, 'bomb');
  assert.ok((bomber.bombCount ?? 0) > 1, 'Bomber should launch a volley');
  assert.ok((bomber.bombRadius ?? 0) > 80, 'Bomber blasts should be wide');
});

test('Bomber launches a bomb volley that explodes and kills zombies in radius', () => {
  const s = createSurvivalState();
  s.score = 200;
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1060, 1000, { hp: 3 }));
  const shot = trySurvivalShot(s, p, m, 1120, 1000, [], WORLD_W, WORLD_H);
  assert.equal(shot.fired, true);
  assert.equal(shot.weapon, 'bomber');
  assert.equal(s.projectiles.length, 3, 'Bomber should launch a 3-bomb volley');
  const events = run(s, p, m, 2.5);
  assert.equal(s.projectiles.length, 0, 'all bombs should have detonated');
  assert.ok(events.some((e) => e.type === 'explosion'), 'explosion event expected');
  assert.ok(s.score >= 1, 'blast should have killed the zombie');
});

test('Bomber blasts damage multiple zombies inside the radius', () => {
  const s = createSurvivalState();
  s.score = 200;
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  // Cluster just ahead of the player so the volley lands among them.
  s.zombies.push(makeZombie(1070, 985, { hp: 2 }));
  s.zombies.push(makeZombie(1080, 1015, { hp: 2 }));
  trySurvivalShot(s, p, m, 1150, 1000, [], WORLD_W, WORLD_H);
  const events = run(s, p, m, 2.5);
  assert.ok(events.some((e) => e.type === 'explosion'));
  assert.ok(s.score >= 1, 'cluster should take blast damage');
});

test('armed zombies only spawn from 200 kills onward', () => {
  // Below 200 kills no armed zombie may appear even with aged timers.
  const early = createSurvivalState();
  early.time = 400;
  early.score = 199;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  early.spawnTimer = 0;
  run(early, p, m, 4);
  assert.ok(early.zombies.length > 0);
  assert.ok(early.zombies.every((z) => z.armed !== true), 'no armed zombies before 200 kills');

  // At 200+ kills armed zombies begin appearing.
  const s = createSurvivalState();
  s.time = 400;
  s.score = 200;
  s.spawnTimer = 0;
  run(s, p, m, 4);
  assert.ok(s.zombies.length > 0);
  assert.ok(s.zombies.some((z) => z.armed === true), 'expected at least one armed zombie from 200 kills');
});

test('armed zombies shoot the player from a distance', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999; // isolate: no ambient spawns
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  // Two shooters ~260px out — outside melee range, inside firing band.
  s.zombies.push(makeZombie(1260, 1000, { armed: true, attackCooldown: 0.2 }));
  s.zombies.push(makeZombie(740, 1000, { armed: true, attackCooldown: 0.5 }));
  const events = run(s, p, m, 8);
  assert.ok(s.health < s.maxHealth, 'armed zombies should damage the player at range');
  assert.ok(events.some((e) => e.type === 'playerHit'), 'expected playerHit events from gunfire');
});

test('ordinary zombies keep melee-only behavior at range', () => {
  const s = createSurvivalState();
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  s.zombies.push(makeZombie(1300, 1000, { armed: false, attackCooldown: 0 }));
  const events = run(s, p, m, 2.5);
  // At ~300px the zombie closes but cannot melee or shoot yet.
  assert.equal(s.health, s.maxHealth, 'no damage should land while out of melee range');
  assert.ok(!events.some((e) => e.type === 'playerHit'));
});

test('all four weapons work while mounted without dismounting', () => {
  for (const w of WEAPONS) {
    const s = createSurvivalState();
    s.score = w.minScore;
    s.spawnTimer = 9999;
    const p = makePlayer(1200, 1100, true);
    const m = makeMoto(1200, 1100);
    s.zombies.push(makeZombie(1300, 1100, { hp: 99 }));
    const shot = trySurvivalShot(s, p, m, 1400, 1100, [], WORLD_W, WORLD_H);
    assert.equal(shot.fired, true, `${w.name} should fire while mounted`);
    assert.equal(shot.weapon, w.kind);
    if (w.projectile === 'bomb') {
      assert.ok(s.projectiles.length > 0, 'Bomber should launch bombs while mounted');
    }
    assert.equal(p.mounted, true, 'player must stay mounted');
  }
});

test('health refills once when the score reaches 200 kills', () => {
  const s = createSurvivalState();
  s.score = 200;
  s.health = 40;
  s.spawnTimer = 9999;
  const p = makePlayer(1000, 1000);
  const m = makeMoto();
  run(s, p, m, 0.2);
  assert.equal(s.health, s.maxHealth, 'health should be topped up at 200 kills');

  // The refill is one-shot: damage afterwards lowers health again.
  s.zombies.push(makeZombie(1015, 1000, { damage: 30, attackRange: 30 }));
  run(s, p, m, 0.4);
  assert.ok(s.health < s.maxHealth, 'health should drop again after the one-time refill');

  // Below 200 kills damaged health stays damaged.
  const early = createSurvivalState();
  early.score = 199;
  early.health = 40;
  early.spawnTimer = 9999;
  run(early, p, m, 0.2);
  assert.equal(early.health, 40, 'no refill before 200 kills');
});

test('score reset restores the pistol and clears all combat state', () => {
  const s = createSurvivalState();
  s.score = 200;
  s.zombies.push(makeZombie(1100, 1000));
  s.tracers.push({ x1: 0, y1: 0, x2: 1, y2: 1, life: 0, maxLife: 1 });
  s.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#fff', size: 1 });
  const fresh = createSurvivalState();
  assert.equal(fresh.score, 0);
  assert.equal(weaponForScore(fresh.score).kind, 'pistol');
  assert.equal(fresh.zombies.length, 0);
  assert.equal(fresh.tracers.length, 0);
  assert.equal(fresh.particles.length, 0);
  assert.equal(fresh.projectiles.length, 0);
  assert.equal(fresh.outcome, null);
});
