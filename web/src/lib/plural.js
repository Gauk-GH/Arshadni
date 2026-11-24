// plural.js: ONE place for Arabic counted nouns (HANDOFF rule 25).
//   1 → «مقرر واحد»   2 → «مقررين»   3–10 → «٥ مقررات»   0 and 11+ → «١٤ مقرر»
// In strings.js write {n|course} (or |code, |term, |courseWord) and t() picks the form.
import { fmtNumber } from './format.js';

// [one, two, few (3–10), other (0, 11+)]. {n} is replaced by the Arabic-Indic number.
const NOUNS = {
  course: ['مقرر واحد', 'مقررين', '{n} مقررات', '{n} مقرر'],
  code: ['رمز واحد', 'رمزين', '{n} رموز', '{n} رمز'],
  term: ['ترم واحد', 'ترمين', '{n} أترام', '{n} ترم'],
  // The word alone, next to a number shown separately (screen 3's big number: «١٤» «مقرر»).
  courseWord: ['مقرر', 'مقرر', 'مقررات', 'مقرر'],
};

export function pluralForm(n) {
  if (n === 1) return 0;
  if (n === 2) return 1;
  if (n >= 3 && n <= 10) return 2;
  return 3;
}

export function countOf(n, noun) {
  const forms = NOUNS[noun];
  if (!forms) throw new Error(`plural.js: unknown noun "${noun}"`);
  return forms[pluralForm(n)].replace('{n}', fmtNumber(n));
}
