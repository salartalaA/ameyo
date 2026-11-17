// CDP-driven survival smoke test: launches headless Chrome, plays the survival
// loop through the real engine, and captures screenshots + state assertions.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.GAME_URL || 'http://localhost:3001';
const OUT = join(process.cwd(), '.screenshots');
mkdirSync(OUT, { recursive: true });
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(200);
  }
  throw new Error('no CDP page target');
}

const userDataDir = mkdtempSync(join(tmpdir(), 'ameyo-cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1280,720',
  'about:blank',
], { stdio: 'ignore' });

let msgId = 0;
const pending = new Map();
let ws;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('evaluate failed: ' + JSON.stringify(res.exceptionDetails).slice(0, 800));
  }
  return res.result?.value;
}

async function shot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(OUT, name), Buffer.from(res.data, 'base64'));
  console.log('saved', name);
}

try {
  const target = await getTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: `${BASE}/?autostart=1&mode=survival` });
  await sleep(2500);

  // Survival should be running with zombies spawning.
  let state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return {
      mode: e.mode,
      variant: e.variant,
      score: e.survival.score,
      health: e.survival.health,
      zombies: e.survival.zombies.length,
      outcome: e.survival.outcome,
    };
  })()`);
  console.log('after start:', state);
  if (state.variant !== 'survival') throw new Error('survival variant not active');
  await sleep(2500);
  state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return { zombies: e.survival.zombies.length, score: e.survival.score, health: Math.round(e.survival.health) };
  })()`);
  console.log('after 5s:', state);
  if (state.zombies < 1) throw new Error('no zombies spawned');
  await shot('survival-horde.png');

  // On-foot kill: park a dummy zombie in front of the player and hold fire.
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const p = e.player;
    p.mounted = false;
    p.facing = 'right';
    e.mouseInside = false;
    e.fireHeld = true;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 999; // freeze ambient spawns for deterministic checks
    e.survival.zombies.push({
      id: 900001, x: p.x + 90, y: p.y, vx: 0, vy: 0, radius: 9, hp: 1, maxHp: 1,
      speed: 0, damage: 0, attackRange: 0, attackCooldown: 99, attackAnim: 0,
      hitFlash: 0, walkPhase: 0, facing: 'left',
    });
  })()`);
  await sleep(900);
  state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return { score: e.survival.score, zombies: e.survival.zombies.length, tracers: e.survival.tracers.length };
  })()`);
  console.log('after foot shot:', state);
  if (state.score !== 1) throw new Error('on-foot shot did not score');
  await shot('survival-foot-shot.png');

  // Mounted kill: teleport onto the bike and shoot forward.
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const p = e.player;
    const m = e.moto;
    p.mounted = true;
    p.x = m.x; p.y = m.y;
    m.angle = 0;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 999;
    e.survival.zombies.push({
      id: 900002, x: m.x + 110, y: m.y, vx: 0, vy: 0, radius: 9, hp: 1, maxHp: 1,
      speed: 0, damage: 0, attackRange: 0, attackCooldown: 99, attackAnim: 0,
      hitFlash: 0, walkPhase: 0, facing: 'left',
    });
  })()`);
  await sleep(900);
  state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return { score: e.survival.score, mounted: e.player.mounted };
  })()`);
  console.log('after mounted shot:', state);
  if (state.score !== 2) throw new Error('mounted shot did not score');
  await shot('survival-mounted-shot.png');

  // Weapon progression: verify each milestone weapon actually fires and scores
  // a kill — Pistol foot+mounted done above; AK-47 & Minigun on foot,
  // Minigun mounted, Bomber mounted (aerial bombs).
  const weaponChecks = [
    { score: 50, mounted: false, name: 'AK-47' },
    { score: 100, mounted: false, name: 'Minigun' },
    { score: 100, mounted: true, name: 'Minigun (mounted)' },
    { score: 200, mounted: true, name: 'Bomber' },
  ];
  for (const wc of weaponChecks) {
    await evaluate(`(() => {
      const e = window.__ameyoEngine;
      const p = e.player; const m = e.moto;
      p.mounted = ${wc.mounted};
      if (p.mounted) { p.x = m.x; p.y = m.y; m.angle = 0; }
      else { p.facing = 'right'; }
      e.survival.score = ${wc.score};
      e.survival.shootCooldown = 0;
      e.survival.projectiles.length = 0;
      e.survival.zombies.length = 0;
      e.survival.spawnTimer = 999;
      const ox = p.mounted ? m.x : p.x;
      const oy = p.mounted ? m.y : p.y;
      e.survival.zombies.push({
        id: 910000 + ${wc.score}, x: ox + 90, y: oy, vx: 0, vy: 0, radius: 9, hp: 1, maxHp: 1,
        speed: 0, damage: 0, attackRange: 0, attackCooldown: 99, attackAnim: 0,
        hitFlash: 0, walkPhase: 0, facing: 'left',
      });
    })()`);
    let scored = false;
    let sawProjectile = false;
    for (let i = 0; i < 45; i++) {
      await sleep(100);
      const probe = await evaluate(`(() => {
        const e = window.__ameyoEngine;
        return { score: e.survival.score, projectiles: e.survival.projectiles.length };
      })()`);
      if (probe.projectiles > 0) sawProjectile = true;
      if (probe.score >= wc.score + 1) { scored = true; break; }
    }
    if (wc.name.startsWith('Bomber') && !sawProjectile) {
      throw new Error('Bomber did not launch any bombs');
    }
    const extra = await evaluate(`(() => {
      const e = window.__ameyoEngine;
      return {
        score: e.survival.score,
        mounted: e.player.mounted,
        projectiles: e.survival.projectiles.length,
        tracers: e.survival.tracers.length,
        tier: e.lastWeaponTier,
      };
    })()`);
    console.log(`weapon ${wc.name}:`, extra);
    if (!scored) throw new Error(`${wc.name} did not score a kill`);
    if (extra.mounted !== wc.mounted) {
      throw new Error(`${wc.name} changed mounted state to ${extra.mounted}`);
    }
  }
  await shot('survival-weapons.png');

  // Minimap sanity: white player, red ordinary zombie, purple armed zombie —
  // verified by sampling the actual canvas pixels in the minimap panel.
  const minimap = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 999;
    const px = e.player.x, py = e.player.y;
    e.survival.zombies.push({
      id: 920001, x: px + 200, y: py, vx: 0, vy: 0, radius: 9,
      hp: 50, maxHp: 50, speed: 0, damage: 0, attackRange: 0, attackCooldown: 99,
      attackAnim: 0, hitFlash: 0, walkPhase: 0, facing: 'left', armed: false,
    });
    e.survival.zombies.push({
      id: 920002, x: px - 200, y: py + 120, vx: 0, vy: 0, radius: 9,
      hp: 50, maxHp: 50, speed: 0, damage: 0, attackRange: 0, attackCooldown: 99,
      attackAnim: 0, hitFlash: 0, walkPhase: 0, facing: 'left', armed: true,
    });
    return { hasMinimap: typeof e.drawMinimap === 'function', zombies: e.survival.zombies.length };
  })()`);
  console.log('minimap state:', minimap);
  if (!minimap.hasMinimap || minimap.zombies !== 2) {
    throw new Error('minimap/zombie state check failed');
  }
  await sleep(300); // let a frame render the dots
  const mmPixels = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const c = e.canvas;
    const viewW = c.width, viewH = c.height;
    const mapW = Math.min(220, Math.floor(viewW * 0.24));
    const mapH = Math.round((mapW * 3600) / 4800);
    const mx = viewW - mapW - 14, my = viewH - mapH - 14;
    const ctx2 = c.getContext('2d');
    const data = ctx2.getImageData(mx - 4, my - 4, mapW + 8, mapH + 8).data;
    let red = 0, purple = 0, white = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Markers are drawn at globalAlpha 0.92 over a dark panel, so classify
      // by hue dominance rather than absolute values.
      if (r > 140 && r > g + 50 && r > b + 50) red++;
      else if (b > 140 && b > g + 40 && r > g + 20) purple++;
      else if (r > 200 && g > 200 && b > 200) white++;
    }
    return { red, purple, white, mapW, mapH };
  })()`);
  console.log('minimap pixels:', mmPixels);
  if (mmPixels.red < 2 || mmPixels.purple < 2 || mmPixels.white < 4) {
    throw new Error('minimap markers missing: ' + JSON.stringify(mmPixels));
  }
  await shot('survival-minimap.png');

  // Victory: score 259 -> Bomber volley -> 260.
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const p = e.player;
    p.mounted = false;
    p.facing = 'right';
    e.mouseInside = false;
    e.fireHeld = true;
    e.survival.score = 259;
    e.survival.shootCooldown = 0;
    e.survival.projectiles.length = 0;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 999;
    e.survival.zombies.push({
      id: 900003, x: p.x + 80, y: p.y, vx: 0, vy: 0, radius: 9, hp: 1, maxHp: 1,
      speed: 0, damage: 0, attackRange: 0, attackCooldown: 99, attackAnim: 0,
      hitFlash: 0, walkPhase: 0, facing: 'left', armed: false,
    });
  })()`);
  await sleep(3500);
  state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return { score: e.survival.score, outcome: e.survival.outcome, mode: e.mode };
  })()`);
  console.log('after victory shot:', state);
  if (state.score !== 260 || state.outcome !== 'victory') {
    throw new Error('victory condition failed: ' + JSON.stringify(state));
  }
  await sleep(400);
  await shot('survival-victory.png');

  // Restart then force defeat.
  await evaluate(`window.__ameyoEngine.restartSurvival()`);
  await sleep(400);
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const p = e.player;
    p.mounted = false;
    e.survival.health = 8;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 999;
    e.survival.zombies.push({
      id: 900004, x: p.x + 18, y: p.y, vx: 0, vy: 0, radius: 9, hp: 99, maxHp: 99,
      speed: 0, damage: 50, attackRange: 40, attackCooldown: 0, attackAnim: 0,
      hitFlash: 0, walkPhase: 0, facing: 'left',
    });
  })()`);
  await sleep(1200);
  state = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    return { health: e.survival.health, score: e.survival.score, outcome: e.survival.outcome };
  })()`);
  console.log('after defeat:', state);
  if (state.outcome !== 'defeat') throw new Error('defeat condition failed');
  await sleep(400);
  await shot('survival-defeat.png');

  console.log('SURVIVAL CDP TEST PASSED');
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
