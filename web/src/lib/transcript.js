// transcript.js: SIMULATED transcript reading (decision 11). Real PDF parsing is out of MVP scope.
// The "transcript" is always mock.json's completed courses; the chosen file is never opened or kept.
// Swap readTranscript() for a real reader later; the screen only needs the result shape below.
import mock from '../data/mock.json';
import { codeKey } from './courses.js';

const READ_TIME_MS = 1500;

// Dev-only (?upload=partial): courses in the transcript that are not in the plan (design's "partial" state).
// import.meta.env.DEV is false in the production build, so this list is not shipped.
const EXTRA_FOR_PARTIAL = !import.meta.env.DEV ? [] : [
  { code: 'PREP 101', name: 'السنة التحضيرية: مهارات التعلم' },
  { code: 'ENGL 100', name: 'Intensive English' },
  { code: 'CS 199', name: 'مقرر اختياري: تصميم الألعاب' },
];

const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

// mode: null (normal) | 'error' | 'partial' (dev-only switches, see devState.js)
// Resolves to { status: 'failed' } or
// { status: 'done', foundCodes, matchedCodes, unmatchedCourses: [{ code, name }] }
// HANDOFF rule 17: matched by the same normalization as rule 2; unmatched are never added silently.
export function readTranscript(file, planCourses, mode = null) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mode === 'error' || !isPdf(file)) {
        resolve({ status: 'failed' });
        return;
      }
      const found = mock.studyPlan.courses
        .filter((c) => c.completed)
        .map(({ code, name }) => ({ code, name }))
        .concat(mode === 'partial' ? EXTRA_FOR_PARTIAL : []);
      const inPlan = new Set(planCourses.map((c) => codeKey(c.code)));
      resolve({
        status: 'done',
        foundCodes: found.map((c) => c.code),
        matchedCodes: found.filter((c) => inPlan.has(codeKey(c.code))).map((c) => c.code),
        unmatchedCourses: found.filter((c) => !inPlan.has(codeKey(c.code))),
      });
    }, READ_TIME_MS);
  });
}
