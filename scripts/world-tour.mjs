// Teleport the player to key locations in the expanded world and capture
// screenshots for visual verification (exploration + survival minimap).
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.GAME_URL || 'http://localhost:3000';
const OUT = join(process.cwd(), '.screenshots');
mkdirSync(OUT, { recursive: true });
const PORT = 9334;
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

const userDataDir = mkdtempSync(join(tmpdir(), 'ameyo-tour-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1280,720', 'about:blank',
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
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error('eval: ' + JSON.stringify(res.exceptionDetails).slice(0, 500));
  return res.result?.value;
}
async function shot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, name), Buffer.from(res.data, 'base64'));
  console.log('saved', name);
}

const STOPS = [
  ['spawn', 1050, 1082, 'exploration'],
  ['market', 3900, 800, 'exploration'],
  ['market2', 4400, 1500, 'exploration'],
  ['hills', 2200, 3000, 'exploration'],
  ['hills2', 800, 3300, 'exploration'],
  ['eastbridge', 3400, 2050, 'exploration'],
];

try {
  const target = await getTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

  for (const [name, x, y, mode] of STOPS) {
    await send('Page.navigate', { url: `${BASE}/?autostart=1&mode=${mode}` });
    await sleep(2200);
    await evaluate(`(() => {
      const e = window.__ameyoEngine;
      e.player.mounted = false;
      e.player.x = ${x}; e.player.y = ${y};
      e.camX = ${x}; e.camY = ${y};
    })()`);
    await sleep(1200);
    const info = await evaluate(`(() => {
      const e = window.__ameyoEngine;
      return { district: e.player ? undefined : 0, x: e.player.x, y: e.player.y };
    })()`);
    console.log(name, info);
    await shot(`world-${name}.png`);
  }

  // Survival view with zombies + minimap in the new market district.
  await send('Page.navigate', { url: `${BASE}/?autostart=1&mode=survival` });
  await sleep(2500);
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    e.player.mounted = false;
    e.player.x = 3900; e.player.y = 800;
    e.camX = 3900; e.camY = 800;
    e.survival.zombies.length = 0;
    for (let i = 0; i < 12; i++) {
      const a = i * 0.7;
      e.survival.zombies.push({
        id: 800000 + i, x: 3900 + Math.cos(a) * 220, y: 800 + Math.sin(a) * 220,
        vx: 0, vy: 0, radius: 9, hp: 30, maxHp: 30, speed: 0, damage: 0,
        attackRange: 0, attackCooldown: 99, attackAnim: 0, hitFlash: 0,
        walkPhase: 0, facing: 'left',
      });
    }
    e.survival.score = 120; // RPG tier for visual variety
  })()`);
  await sleep(800);
  await shot('survival-market-minimap.png');
  console.log('TOUR DONE');
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
