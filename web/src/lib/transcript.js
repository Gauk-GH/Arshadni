// transcript.js: REAL transcript reading, on the device (HANDOFF decision 35, rules 16–18).
// pdfText.js turns the PDF into lines; this file decides which lines are courses and which passed.
// The parser is generic (not tied to one university): a line is a course if it has a course code AND
// a grade. The parsing functions are pure (no browser), so scripts/checks/transcript.mjs tests them in Node.
import { codeKey, normalizeCode } from './courses.js';

export const MAX_BYTES = 10 * 1024 * 1024; // HANDOFF rule 16a: 10 MB
export const MAX_MB = 10;
const MIN_TEXT_CHARS = 20; // less text than this: a scanned image (rule 16)
const MIN_COURSE_LINES = 3; // rule 16b

// Dev-only (?upload=partial): courses not in the plan, added on top of a real read (design's "partial" state).
// import.meta.env.DEV is false in the production build, so this list is not shipped.
const EXTRA_FOR_PARTIAL = !import.meta.env?.DEV ? [] : [
  { code: 'PREP 101', name: 'السنة التحضيرية: مهارات التعلم' },
  { code: 'ENGL 100', name: 'Intensive English' },
  { code: 'CS 199', name: 'مقرر اختياري: تصميم الألعاب' },
];

// ---------- Text clean-up ----------
// NFKC turns Arabic "presentation forms" (how some PDFs store shaped letters) into normal letters.
// Arabic-Indic digits become 0-9, and the tatweel «ـ» (a stretching line, not a letter) is removed.
// Some fonts map Arabic letters to their Persian look-alikes (ی ے ک ھ ہ ە): those become ي ك ه.
export function normalizeText(s) {
  return String(s)
    .normalize('NFKC')
    .replace(/\u0640/g, '')
    .replace(/[\u06CC\u06D2]/g, '\u064A')
    .replace(/\u06A9/g, '\u0643')
    .replace(/[\u06BE\u06C1\u06D5]/g, '\u0647')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Grades (rule 18) ----------
const PASSED = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P', 'TR', 'أ+', 'أ', 'ب+', 'ب', 'ج+', 'ج', 'د+', 'د', 'ناجح', 'معادل'];
const NOT_PASSED = ['F', 'W', 'WF', 'I', 'IP', 'NP', 'ه', 'ح', 'منسحب', 'غير مكتمل']; // «هـ» is «ه» once the tatweel is gone
const GRADES = new Map([...PASSED.map((g) => [g, true]), ...NOT_PASSED.map((g) => [g, false])]);

// "+أ" (the plus can come out first in right-to-left text) is read as "أ+".
function gradeKey(text) {
  const s = normalizeText(text);
  const flipped = s.match(/^\+\s?(\S+)$/);
  return flipped ? `${flipped[1]}+` : s.replace(/\s\+$/, '+');
}

// true = passed, false = not passed, null = not a grade.
export function gradeOf(text) {
  const passed = GRADES.get(gradeKey(text));
  return passed === undefined ? null : passed;
}

// Finds the grade in a line: first a cell that is ONLY a grade; otherwise a standalone word.
// If several, the one nearest the end wins. Returns { passed, cell } or null.
function findGrade(cells) {
  for (let i = cells.length - 1; i >= 0; i--) {
    const passed = gradeOf(cells[i]);
    if (passed !== null) return { passed, cell: i };
  }
  const words = normalizeText(cells.join(' ')).split(' ');
  for (let i = words.length - 1; i >= 0; i--) {
    const two = i > 0 ? gradeOf(`${words[i - 1]} ${words[i]}`) : null; // «غير مكتمل»
    if (two !== null) return { passed: two, cell: null, word: `${words[i - 1]} ${words[i]}` };
    const one = gradeOf(words[i]);
    if (one !== null) return { passed: one, cell: null, word: words[i] };
  }
  return null;
}

// ---------- Course codes (rule 16c) ----------
const AR = '\\u0621-\\u064A';
const CODE_PATTERNS = [
  new RegExp('(?<![A-Za-z0-9])([A-Za-z]{2,5}) ?(\\d{3,4})(?!\\d)', 'g'), // CS 210, CS210
  new RegExp(`(?<![${AR}0-9])([${AR}]{2,5}) ?(\\d{3,4})(?!\\d)`, 'g'), // عال 101
  new RegExp(`(?<!\\d)(\\d{3,4}) ?([${AR}]{2,5})(?![${AR}])`, 'g'), // 101 عال (right-to-left text read backwards)
];
// Words that look like a code next to a year or a number but are not one ("Fall 2024", "Total 120").
const NOT_CODES = new Set([
  'FALL', 'TERM', 'YEAR', 'TOTAL', 'PAGE', 'SEM', 'AY', 'ID', 'NO', 'CLASS', 'LEVEL',
  'فصل', 'الفصل', 'عام', 'العام', 'سنة', 'السنة', 'صفحة', 'مجموع', 'الأول', 'ثاني', 'صيفي',
]);

// All course codes in a text, in the shape the app shows ("CS 210", "عال 101"), first found first.
export function codesIn(text) {
  const s = normalizeText(text);
  const found = [];
  CODE_PATTERNS.forEach((re, i) => {
    for (const m of s.matchAll(re)) {
      const [letters, digits] = i === 2 ? [m[2], m[1]] : [m[1], m[2]];
      if (NOT_CODES.has(letters.toUpperCase())) continue;
      found.push({ code: normalizeCode(`${letters} ${digits}`), raw: m[0], at: i * 10000 + m.index });
    }
  });
  return found.sort((a, b) => a.at - b.at);
}

// ---------- Lines → courses ----------
const MARKERS = [/السجل الأكاديمي/, /academic record/i, /transcript/i, /\bGPA\b/i, /المعدل/];
const isNumber = (s) => /^[\d.,/%-]+$/.test(s);

// One line → { code, name, passed } or null. `line` is { cells: string[] } (or a plain string).
export function parseLine(line) {
  const cells = (typeof line === 'string' ? [line] : line.cells).map(normalizeText).filter(Boolean);
  const code = codesIn(cells.join(' '))[0];
  if (!code) return null;
  const grade = findGrade(cells);
  if (!grade) return null;
  // A table row: drop the cells that are only a number (credits, points). One long string: drop number words.
  const oneString = cells.length === 1;
  let name = cells
    .filter((_, i) => i !== grade.cell)
    .map((c) => {
      let rest = c.replace(code.raw, ' ');
      if (grade.word) rest = rest.replace(new RegExp(`(^|\\s)${grade.word.replace(/[+]/g, '\\+')}(?=\\s|$)`), ' ');
      rest = rest.trim();
      if (!oneString) return isNumber(rest) ? '' : rest;
      return rest.split(' ').filter((w) => w && !isNumber(w)).join(' ');
    })
    .filter(Boolean)
    .join(' ')
    .trim();
  // Arabic names keep Arabic-Indic digits like the rest of the UI («فيزياء عامة ١»).
  if (new RegExp(`[${AR}]`).test(name)) name = name.replace(/[0-9]/g, (d) => String.fromCharCode(0x660 + Number(d)));
  return { code: code.code, name: name || code.code, passed: grade.passed };
}

// lines: [{ cells }] in page order. Returns { reason } when it is not a usable transcript, else
// { courses: [{ code, name }] }: only PASSED courses, one per code.
// Repeats (rule 18a): a course counts if any attempt passed; the latest passing attempt gives the name.
export function parseTranscriptLines(lines) {
  const all = lines.map((l) => (typeof l === 'string' ? l : l.cells.join(' '))).join('\n');
  if (normalizeText(all).replace(/\s/g, '').length < MIN_TEXT_CHARS) return { reason: 'scan' };
  const attempts = lines.map(parseLine).filter(Boolean);
  const hasMarker = MARKERS.some((re) => re.test(normalizeText(all)));
  if (!hasMarker || attempts.length < MIN_COURSE_LINES) return { reason: 'notTranscript' };
  const passed = new Map();
  for (const a of attempts) {
    if (a.passed) passed.set(codeKey(a.code), { code: a.code, name: a.name }); // later passes overwrite
  }
  return { courses: [...passed.values()] };
}

const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

// mode: null (normal) | 'error' | 'partial' (dev-only switches, see devState.js)
// Resolves to { status: 'failed', reason } or
// { status: 'done', foundCodes, matchedCodes, unmatchedCourses: [{ code, name }] }
// reason: 'notPdf' | 'tooBig' | 'generic' | 'timeout' | 'scan' | 'notTranscript' (input.upload.error.<reason>)
// HANDOFF rule 17: matched by the same normalization as rule 2; unmatched are never added silently.
export async function readTranscript(file, planCourses, mode = null) {
  if (mode === 'error') return { status: 'failed', reason: 'scan' };
  if (!isPdf(file)) return { status: 'failed', reason: 'notPdf' };
  if (file.size > MAX_BYTES) return { status: 'failed', reason: 'tooBig' };
  let lines;
  try {
    const { readPdfLines } = await import('./pdfText.js'); // lazy: pdf.js loads only now
    lines = await readPdfLines(file);
  } catch (err) {
    return { status: 'failed', reason: err?.reason ?? 'generic' };
  }
  const parsed = parseTranscriptLines(lines);
  if (parsed.reason) return { status: 'failed', reason: parsed.reason };
  return matchToPlan(parsed.courses.concat(mode === 'partial' ? EXTRA_FOR_PARTIAL : []), planCourses);
}

export function matchToPlan(found, planCourses) {
  const inPlan = new Set(planCourses.map((c) => codeKey(c.code)));
  return {
    status: 'done',
    foundCodes: found.map((c) => c.code),
    matchedCodes: found.filter((c) => inPlan.has(codeKey(c.code))).map((c) => c.code),
    unmatchedCourses: found.filter((c) => !inPlan.has(codeKey(c.code))),
  };
}
