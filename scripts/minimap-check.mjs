// Verifies the survival minimap renders a white player marker and red zombie
// dots by sampling the display canvas pixels in the minimap region.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.GAME_URL || 'http://localhost:3000';
const PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await res.json()).find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(200);
  }
  throw new Error('no target');
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ameyo-mm-'))}`,
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

let msgId = 0;
const pending = new Map();
let ws;
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++msgId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 500));
  return res.result?.value;
};

// Counts near-white and near-red pixels inside the bottom-right minimap panel.
const SAMPLE = `(() => {
  const e = window.__ameyoEngine;
  const c = e.canvas;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  // minimap: mapW = min(220, w*0.24), anchored bottom-right with 14px pad
  const mapW = Math.min(220, Math.floor(w * 0.24));
  const mapH = Math.round((mapW * 3600) / 4800);
  const x0 = w - mapW - 14 - 4, y0 = h - mapH - 14 - 4;
  const data = ctx.getImageData(x0, y0, mapW + 8, mapH + 8).data;
  let white = 0, red = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 200 && g > 200 && b > 200) white++;
    if (r > 180 && g < 90 && b < 90) red++;
  }
  return { white, red, mapW, mapH, w, h };
})()`;

try {
  const target = await getTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${BASE}/?autostart=1&mode=survival` });
  await sleep(2500);

  // Clear zombies -> only the white player marker should be present.
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    e.survival.zombies.length = 0;
    e.survival.spawnTimer = 9999;
    e.player.mounted = false;
    e.player.x = 1050; e.player.y = 1082;
    e.camX = 1050; e.camY = 1082;
  })()`);
  await sleep(600);
  const noZombies = await evaluate(SAMPLE);
  console.log('minimap without zombies:', noZombies);

  // Add zombies at known offsets -> red dots must appear.
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63;
      e.survival.zombies.push({
        id: 700000 + i, x: e.player.x + Math.cos(a) * 400, y: e.player.y + Math.sin(a) * 400,
        vx: 0, vy: 0, radius: 9, hp: 50, maxHp: 50, speed: 0, damage: 0,
        attackRange: 0, attackCooldown: 99, attackAnim: 0, hitFlash: 0,
        walkPhase: 0, facing: 'left',
      });
    }
  })()`);
  await sleep(600);
  const withZombies = await evaluate(SAMPLE);
  console.log('minimap with zombies:', withZombies);

  // Teleport player -> white marker must move to a different pixel.
  const whitePos1 = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const c = e.canvas, ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const mapW = Math.min(220, Math.floor(w * 0.24));
    const mapH = Math.round((mapW * 3600) / 4800);
    const x0 = w - mapW - 14 - 4, y0 = h - mapH - 14 - 4;
    const d = ctx.getImageData(x0, y0, mapW + 8, mapH + 8).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 200 && d[i+1] > 200 && d[i+2] > 200) return { x: (i/4) % (mapW+8), y: Math.floor((i/4)/(mapW+8)) };
    }
    return null;
  })()`);
  await evaluate(`(() => {
    const e = window.__ameyoEngine;
    e.player.x = 3000; e.player.y = 2000;
    e.camX = 3000; e.camY = 2000;
  })()`);
  await sleep(600);
  const whitePos2 = await evaluate(`(() => {
    const e = window.__ameyoEngine;
    const c = e.canvas, ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const mapW = Math.min(220, Math.floor(w * 0.24));
    const mapH = Math.round((mapW * 3600) / 4800);
    const x0 = w - mapW - 14 - 4, y0 = h - mapH - 14 - 4;
    const d = ctx.getImageData(x0, y0, mapW + 8, mapH + 8).data;
    let best = null, bestScore = -1;
    for (let i = 0; i < d.length; i += 4) {
      const r=d[i],g=d[i+1],b=d[i+2];
      if (r>200&&g>200&&b>200) {
        const x=(i/4)%(mapW+8), y=Math.floor((i/4)/(mapW+8));
        const s = x*x+y*y; // not meaningful; just take centroid later
        if (!best) best = { sx: x, sy: y, n: 1 }; else { best.sx+=x; best.sy+=y; best.n++; }
      }
    }
    return best ? { x: best.sx/best.n, y: best.sy/best.n } : null;
  })()`);
  console.log('white marker pos before/after teleport:', whitePos1, whitePos2);

  const pass =
    noZombies.white >= 3 && noZombies.red === 0 &&
    withZombies.red >= 5 && withZombies.white >= 3 &&
    whitePos1 && whitePos2 && (Math.abs(whitePos1.x - whitePos2.x) > 20 || Math.abs(whitePos1.y - whitePos2.y) > 20);
  console.log(pass ? 'MINIMAP CHECK PASSED' : 'MINIMAP CHECK FAILED');
  if (!pass) process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
