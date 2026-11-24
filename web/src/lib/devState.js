// devState.js: DEV ONLY (decision 10). Lets us open any HANDOFF state with a URL param,
// e.g. http://localhost:5173/?state=empty#/input or ?upload=error.
// In the production build import.meta.env.DEV is false, so none of this runs.
// While a dev state is active, nothing is saved, so your real saved courses stay untouched.
import { fmtNumber } from './format.js';

export const DEV_STATES = ['empty', 'loading', 'duplicate', 'circular', 'zero', 'full', 'firstyear'];
export const DEV_UPLOADS = ['error', 'partial'];

function readParam(name, allowed) {
  if (!import.meta.env.DEV) return null;
  const value = new URLSearchParams(window.location.search).get(name);
  return allowed.includes(value) ? value : null;
}

export const devState = () => readParam('state', DEV_STATES);
export const devUpload = () => readParam('upload', DEV_UPLOADS);

// Changes the starting courses to show a state. Returns a new array.
export function applyDevState(state, courses) {
  const copy = courses.map((c) => ({ ...c, prerequisites: [...c.prerequisites] }));
  switch (state) {
    case 'empty':
      return [];
    case 'zero':
      return copy.map((c) => ({ ...c, completed: true }));
    case 'firstyear': {
      // mock.json examples.firstYearStudent: 4 completed, 38 remaining.
      let kept = 0;
      return copy.map((c) => {
        const completed = c.completed && kept < 4;
        if (completed) kept += 1;
        return { ...c, completed };
      });
    }
    case 'circular':
      // mock.json examples.circularPrerequisite: CS 310 ↔ CS 360.
      return copy.map((c) => {
        if (c.code === 'CS 310') return { ...c, prerequisites: ['CS 360'] };
        if (c.code === 'CS 360') return { ...c, prerequisites: ['CS 310'] };
        return c;
      });
    case 'full': {
      // mock.json examples.longPlan: 72 courses, 50 completed.
      const extra = Array.from({ length: 30 }, (_, i) => ({
        code: `ELEC ${301 + i}`,
        name: `مقرر اختياري ${fmtNumber(i + 1)}`,
        prerequisites: [],
        completed: i < 22,
        addedAt: 0,
      }));
      return [...copy, ...extra];
    }
    default:
      return copy;
  }
}
