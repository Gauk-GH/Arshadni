// shot.mjs: screenshot the running dev app at exact mobile widths (Chrome DevTools protocol).
// Usage (from repo root, dev server running): node web/scripts/shot.mjs "<url>" design/shots/<name> [widths=390,375] [height=844] [full=1]
// Writes <outPrefix>-<width>.png. No npm packages: uses Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, outPrefix, widthsArg = '390,375', heightArg = '844', fullArg = '1'] = process.argv.slice(2);
const widths = widthsArg.split(',').map(Number);
const height = Number(heightArg);
const full = fullArg === '1';
const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

const profile = mkdtempSync(join(tmpdir(), 'shot-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}${path}`, { method })).json(); }
    catch { await sleep(200); }
  }
  throw new Error('Chrome did not start');
}

try {
  await getJson('/json/version');
  const target = await getJson('/json/new?about:blank', 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) events.push(msg);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const myId = ++id;
    pending.set(myId, (msg) => (msg.error ? reject(new Error(method + ': ' + msg.error.message)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

  await send('Page.enable');
  await send('Runtime.enable');
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
    const load = async (target) => {
      events.length = 0;
      await send('Page.navigate', { url: target });
      for (let i = 0; i < 100 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
    };
    await load('about:blank'); // so a hash-only URL change still does a full page load
    await load(url);
    for (let attempt = 0; ; attempt++) {
      try { await evaluate('document.fonts.ready.then(() => true)'); break; }
      catch (e) { if (attempt >= 2) throw e; await sleep(1000); } // page reloaded (e.g. Vite HMR): try again
    }
    // Optional: SHOT_JS="<js>" runs in the page first (click, type) to reach interaction states.
    if (process.env.SHOT_JS) await evaluate(`(async () => { ${process.env.SHOT_JS} })()`);
    await sleep(Number(process.env.SHOT_WAIT ?? 1500)); // let entry animations finish
    const info = await evaluate(`JSON.stringify({ vw: innerWidth, h: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight) })`);
    const { h, ...rest } = JSON.parse(info);
    const shotHeight = full ? Math.max(h, height) : height;
    // Full page: make the viewport as tall as the page, so sticky footers sit at the real bottom.
    if (full && shotHeight > height) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: shotHeight, deviceScaleFactor: 2, mobile: true });
      await sleep(300);
    }
    // Optional zoom: SHOT_CLIP="y,h" (CSS px) captures only that band.
    const [clipY, clipH] = (process.env.SHOT_CLIP ?? '').split(',').map(Number);
    const { data } = await send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: full,
      // Viewport shots start where the page is scrolled to (e.g. after scrollIntoView).
      clip: { x: 0, y: clipH ? clipY : (full ? 0 : await evaluate('scrollY')), width, height: clipH || shotHeight, scale: 1 },
    });
    const file = `${outPrefix}-${width}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(file, JSON.stringify({ ...rest, pageHeight: h }));
  }
  ws.close();
} finally {
  chrome.kill();
}
