// Checks for the card's study doodles (lib/doodles.js, DESIGN.md §11): same layout every time, sizes,
// rotation, overlap rule, no repeats, and text contrast on top of the doodles at their opacity.
// Run from the repo root: node web/scripts/checks/doodles.mjs web
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const web = process.argv[2] ?? 'web';
const { layoutDoodles, DOODLE_PATHS, DOODLE_COUNT, DOODLE_SEED } = await import(pathToFileURL(`${web}/src/lib/doodles.js`));
let fails = 0;
const ok = (cond, msg) => { if (!cond) fails++; console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); };

ok(DOODLE_PATHS.length === 12 && DOODLE_COUNT === 110 && DOODLE_SEED === 7, '12 icons, count 110, seed 7');
for (const [W, H] of [[375, 812], [461, 752], [480, 1032]]) {
  const a = layoutDoodles(W, H);
  ok(JSON.stringify(a) === JSON.stringify(layoutDoodles(W, H)), `${W}×${H}: same layout every time (${a.length} icons placed, max ${DOODLE_COUNT})`);
  ok(a.length > 0 && a.length <= DOODLE_COUNT, `${W}×${H}: count is a maximum`);
  ok(a.every((i) => i.size >= 40 && i.size <= 230), `${W}×${H}: sizes 40–230px`);
  ok(a.every((i, n) => n === 0 || a[n - 1].size >= i.size), `${W}×${H}: largest first`);
  ok(a.every((i) => Math.abs(i.rotate) <= (i.size > 120 ? 15 : 28)), `${W}×${H}: rotation ±15° over 120px, else ±28°`);
  ok(a.every((i, n) => n === 0 || a[n - 1].d !== i.d), `${W}×${H}: never the same icon twice in a row`);
  // Overlap rule on the centres (positions are rounded, so allow 1px).
  const c = a.map((i) => ({ x: i.x + i.size / 2, y: i.y + i.size / 2, r: i.size * 0.42 }));
  let clash = 0;
  for (let i = 0; i < c.length; i++) for (let j = 0; j < i; j++) if (Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y) < (c[i].r + c[j].r) * 0.82 - 1) clash++;
  ok(clash === 0, `${W}×${H}: light overlap only (centres ≥ 0.82 × sum of radii)`);
  ok(a.every((i) => i.x >= -i.size * 0.7 && i.y >= -i.size * 0.7 && i.x + i.size <= W + i.size * 0.7 && i.y + i.size <= H + i.size * 0.7), `${W}×${H}: only a little past the edges`);
}

// Contrast: the worst spot is text right on a stroke: paper mixed with pencil at the doodle opacity.
const tokens = readFileSync(`${web}/src/tokens.css`, 'utf8');
const hex = (name) => tokens.match(new RegExp(`--color-${name}: (#[0-9A-Fa-f]{6})`))[1];
const opacity = Number(tokens.match(/--doodle-opacity: ([\d.]+)/)[1]);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const paper = rgb(hex('paper')), pencil = rgb(hex('pencil'));
const under = paper.map((v, i) => v * (1 - opacity) + pencil[i] * opacity);
ok(opacity === 0.07, 'opacity 0.07');
for (const [name, min] of [['ink', 4.5], ['pencil', 4.5], ['error-ink', 4.5], ['red-pen', 3]]) {
  const r = ratio(rgb(hex(name)), under);
  ok(r >= min, `${name} text on a doodle stroke: ${r.toFixed(2)}:1 (needs ${min}:1${min === 3 ? ', large text only' : ''})`);
}
process.exit(fails ? 1 : 0);
