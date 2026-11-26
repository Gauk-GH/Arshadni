// doodles.js: the card's decorative background (DESIGN.md §11), copied from the Claude Design artboard
// «اقتراح · خلفية اللابتوب برسومات دراسية خفيفة» (DeskPattern.dc.html). Pure: no React, no DOM.
// The only change from the artboard: the card's width and height come from the real card instead of
// the artboard's fixed 461 × 752, so every screen size gets its own layout, the same on every visit.

export const DOODLE_COUNT = 110; // a MAXIMUM: an icon that finds no free spot in 60 tries is skipped
export const DOODLE_SEED = 7;

// 12 outline icons on a 24 × 24 grid: book, laptop, pencil, graduation cap, phone, calculator,
// ruler, open book, backpack, flask, clock, monitor.
export const DOODLE_PATHS = [
  'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z M5 18a2 2 0 0 1 2-2h11 M9 8h6',
  'M4 5h16v10H4z M2 19h20 M9 17h6',
  'M16 3l5 5L9 20H4v-5z M14 5l5 5',
  'M2 9l10-5 10 5-10 5z M6 11v5c3 2.5 9 2.5 12 0v-5 M22 9v6',
  'M6 2h12a1.5 1.5 0 0 1 1.5 1.5v17a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-17A1.5 1.5 0 0 1 6 2z M11 19h2',
  'M6 2h12v20H6z M8.5 5h7v4h-7z M9 13h.01 M12 13h.01 M15 13h.01 M9 17h.01 M12 17h.01 M15 17h.01',
  'M3 15L15 3l6 6L9 21z M7 11l2 2 M10 8l2 2 M13 5l2 2',
  'M2 6c3.5-1 6.5-.5 10 1.5 3.5-2 6.5-2.5 10-1.5v13c-3.5-1-6.5-.5-10 1.5-3.5-2-6.5-2.5-10-1.5z M12 7.5v13',
  'M6 8a6 6 0 0 1 12 0v12H6z M9 4V2.5h6V4 M9 14h6v4H9z',
  'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3',
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  'M4 4h16v13H4z M8 21h8 M12 17v4',
];

// Returns [{ d, x, y, size, rotate }] for a W × H card: x, y = the icon's top-left corner in px
// from the card's top-left (the layer is laid out left to right, like the artboard).
export function layoutDoodles(W, H, { count = DOODLE_COUNT, seed = DOODLE_SEED } = {}) {
  const P = DOODLE_PATHS;
  // Seeded random numbers (Park–Miller): the same seed always gives the same layout.
  let s = seed * 9973;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  // Sizes 40–230px, mostly small and medium, a few large. Largest first; smaller ones fill the gaps.
  const sizes = [];
  for (let i = 0; i < count; i++) sizes.push(Math.round(40 + Math.pow(rnd(), 2.2) * 190));
  sizes.sort((a, b) => b - a);
  const placed = [];
  const icons = [];
  let lastKind = -1;
  for (const size of sizes) {
    const rad = size * 0.42;
    let ok = null;
    // Light overlap only: two centres closer than 0.82 × the sum of the radii clash. Up to 60 tries.
    for (let tries = 0; tries < 60 && !ok; tries++) {
      const cx = -size * 0.2 + rnd() * (W + size * 0.4); // may spill a little past the edges
      const cy = -size * 0.2 + rnd() * (H + size * 0.4);
      const clash = placed.some((p) => {
        const dx = p.cx - cx, dy = p.cy - cy;
        return Math.sqrt(dx * dx + dy * dy) < (p.rad + rad) * 0.82;
      });
      if (!clash) ok = { cx, cy };
    }
    if (!ok) continue;
    placed.push({ cx: ok.cx, cy: ok.cy, rad });
    // Never the same icon twice in a row.
    let kind = Math.floor(rnd() * P.length);
    if (kind === lastKind) kind = (kind + 1 + Math.floor(rnd() * (P.length - 1))) % P.length;
    lastKind = kind;
    // Large icons (over 120px) turn up to ±15°, smaller ones up to ±28°.
    const rotate = Math.round((rnd() - 0.5) * (size > 120 ? 30 : 56));
    icons.push({ d: P[kind], x: Math.round(ok.cx - size / 2), y: Math.round(ok.cy - size / 2), size, rotate });
  }
  return icons;
}
