// pdfText.js: turns a PDF File into lines of text, ON THE DEVICE (HANDOFF decision 35).
// This is the only file that touches pdf.js. It is loaded with a dynamic import() ("lazy loading"):
// the browser downloads pdf.js only after the student picks a file, so the first page stays fast.
// Nothing is sent anywhere: the file is read from memory, and pdf.js gets no outside URLs.

const TIMEOUT_MS = 15000; // HANDOFF rule 16a

// Thrown with a reason the upload card turns into a text (input.upload.error.<reason>).
export class ReadError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

async function loadPdfJs() {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'), // legacy build: also runs on older phone browsers
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'), // ?url: Vite gives us the file's address
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

const ARABIC = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const CELL_GAP = 0.5; // a gap wider than half a letter height starts a new cell (table column)
const WORD_GAP = 0.15; // a gap wider than this (but inside a cell) is a space between words

// Many PDFs store Arabic one letter per piece, in visual (left-to-right) order. So:
// 1. pieces at the same height form a line;
// 2. pieces that touch (small gap) form a cell, e.g. one table column;
// 3. a cell with Arabic in it is read right to left (pieces sorted by x, biggest first).
// Returns [{ cells: string[], text: string }], top of the page first.
export function toLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const size = Math.abs(item.transform[3]) || item.height || 10;
    let row = rows.find((r) => Math.abs(r.y - y) <= size / 2);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, end: x + (item.width || 0), size, str: item.str });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    const sorted = r.items.sort((a, b) => a.x - b.x);
    const groups = [];
    for (const it of sorted) {
      const last = groups.at(-1);
      const prev = last?.at(-1);
      if (prev && it.x - prev.end <= it.size * CELL_GAP) last.push(it);
      else groups.push([it]);
    }
    const cells = groups.map((g) => {
      const rtl = g.some((it) => ARABIC.test(it.str));
      const ordered = rtl ? [...g].reverse() : g;
      let text = '';
      ordered.forEach((it, i) => {
        if (i > 0) {
          const before = ordered[i - 1];
          const gap = rtl ? before.x - it.end : it.x - before.end;
          if (gap > it.size * WORD_GAP) text += ' ';
        }
        text += it.str;
      });
      return text.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    return { cells, text: cells.join(' ') };
  });
}

async function extract(pdfjs, data, onTask) {
  const task = pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true, useSystemFonts: false });
  onTask(task);
  let pdf;
  try {
    pdf = await task.promise;
  } catch {
    throw new ReadError('generic'); // damaged, password-protected, or not really a PDF inside
  }
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    lines.push(...toLines(content.items));
    page.cleanup();
  }
  return lines;
}

// Resolves to the PDF's lines; rejects with a ReadError ('generic' | 'timeout').
export async function readPdfLines(file) {
  let task = null;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ReadError('timeout')), TIMEOUT_MS);
  });
  try {
    const work = (async () => {
      const [pdfjs, data] = await Promise.all([loadPdfJs(), file.arrayBuffer()]);
      return extract(pdfjs, new Uint8Array(data), (t) => { task = t; });
    })();
    work.catch(() => {}); // if the timeout wins, a late failure of `work` is expected: ignore it
    return await Promise.race([work, timeout]);
  } catch (err) {
    throw err instanceof ReadError ? err : new ReadError('generic');
  } finally {
    clearTimeout(timer);
    task?.destroy(); // frees the file from memory; also stops a read that ran too long
  }
}
