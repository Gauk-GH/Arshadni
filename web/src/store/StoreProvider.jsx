// StoreProvider.jsx: the ONE shared state for all four screens (a React "Context").
// Any screen calls useStore() and gets the same courses, so ticking a course on
// screen 2 changes the number on screen 3.
//
// Flow: on open, restore from localStorage (HANDOFF rule 14); if nothing valid is saved,
// start EMPTY (decision 22). «جرّب ببيانات تجريبية» loads mock.json's sample plan on request.
// Every change to the courses is saved again.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import mock from '../data/mock.json';
import { codeKey } from '../lib/courses.js';
import { loadData, saveData, SCHEMA_VERSION } from '../lib/storage.js';
import { applyDevState, devState } from '../lib/devState.js';
import { isKnownUniversity } from '../lib/universities.js';

const StoreContext = createContext(null);

// The sample plan (mock.json): used by «جرّب ببيانات تجريبية» and by the dev states.
function fromMock() {
  return {
    major: mock.studyPlan.major,
    courses: mock.studyPlan.courses.map((c) => ({ ...c, addedAt: 0 })),
    settings: { ...mock.settings },
    savedPath: null,
  };
}

const DEFAULT_SETTINGS = { maxCoursesPerTerm: 6 }; // HANDOFF §5

// A first visit: nothing saved yet.
function emptyStart() {
  return { major: '', courses: [], settings: { ...DEFAULT_SETTINGS }, savedPath: null };
}

const initialState = {
  status: 'loading', // 'loading' while restoring, then 'ready'
  persist: true,     // false while a dev state is shown, so real data is never overwritten
  major: '',
  university: '',    // id from lib/universities.js, '' = not chosen
  courses: [],
  settings: { ...DEFAULT_SETTINGS },
  savedPath: null,
  storageError: null, // 'broken' | 'blocked' | null, set once on open. Never saved.
  lastRemaining: null, // remaining count when screen 3 was last shown (for «تحدّث المتبقي»). Never saved.
  draft: null,       // { code } or { name } handed from screen 2 to screen 1's form. Never saved.
  transcript: null,  // { found } after a transcript import, for screen 1's «سجلك مرفق» line. Never saved.
};

function reducer(state, action) {
  switch (action.type) {
    case 'restored':
      return { ...state, ...action.data, status: action.keepLoading ? 'loading' : 'ready', persist: action.persist };
    case 'addCourse':
      return { ...state, courses: [action.course, ...state.courses] };
    case 'addCourses':
      return { ...state, courses: [...action.courses, ...state.courses] };
    case 'removeCourse':
      return { ...state, courses: state.courses.filter((c) => codeKey(c.code) !== codeKey(action.code)) };
    case 'toggleCompleted':
      return {
        ...state,
        courses: state.courses.map((c) =>
          codeKey(c.code) === codeKey(action.code) ? { ...c, completed: !c.completed } : c),
      };
    case 'markCompleted': {
      const keys = new Set(action.codes.map(codeKey));
      return {
        ...state,
        courses: state.courses.map((c) => (keys.has(codeKey(c.code)) ? { ...c, completed: true } : c)),
      };
    }
    case 'setTicks': {
      // [{ code, completed }]: «علّم الكل», «شيل الكل» and their «تراجع» (HANDOFF rule 30).
      const wanted = new Map(action.ticks.map((x) => [codeKey(x.code), x.completed]));
      return {
        ...state,
        courses: state.courses.map((c) => {
          const key = codeKey(c.code);
          return wanted.has(key) && wanted.get(key) !== c.completed ? { ...c, completed: wanted.get(key) } : c;
        }),
      };
    }
    case 'lastRemaining':
      return state.lastRemaining === action.n ? state : { ...state, lastRemaining: action.n };
    case 'draft':
      return { ...state, draft: action.draft };
    case 'loadSample':
      return { ...state, ...fromMock(), lastRemaining: null };
    case 'resetAll':
      // Keeps the chosen university; clears courses, major, the saved path and the import line.
      return { ...state, ...emptyStart(), lastRemaining: null, draft: null, transcript: null };
    case 'restorePlan':
      // «تراجع» after a reset: puts back exactly what resetAll removed.
      return { ...state, ...action.snapshot };
    case 'transcript':
      return { ...state, transcript: action.transcript };
    case 'university':
      return { ...state, university: action.id };
    case 'savedPath':
      return { ...state, savedPath: action.savedPath };
    default:
      return state;
  }
}

function toStored(state, savedPath = state.savedPath) {
  return {
    schemaVersion: SCHEMA_VERSION,
    studyPlan: { major: state.major, university: state.university, courses: state.courses },
    settings: state.settings,
    savedPath,
  };
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // restoreSession: runs once when the app opens.
  useEffect(() => {
    // import.meta.env.DEV is replaced by `false` in the production build, so this whole
    // block (and the dev sample data) is removed from what users download.
    const dev = import.meta.env.DEV ? devState() : null;
    if (import.meta.env.DEV && dev) {
      const base = fromMock();
      dispatch({
        type: 'restored',
        data: { ...base, courses: applyDevState(dev, base.courses) },
        persist: false,
        keepLoading: dev === 'loading',
      });
      return;
    }
    const result = loadData();
    const saved = result.status === 'ok' ? result.data : null;
    const data = saved
      ? {
        major: saved.studyPlan.major ?? '',
        university: isKnownUniversity(saved.studyPlan.university) ? saved.studyPlan.university : '',
        courses: saved.studyPlan.courses,
        settings: saved.settings,
        savedPath: saved.savedPath ?? null,
      }
      : emptyStart();
    const storageError = result.status === 'broken' || result.status === 'blocked' ? result.status : null;
    // Broken data whose backup failed is left untouched: we don't save over it this visit.
    const persist = !(result.status === 'broken' && !result.canSave);
    dispatch({ type: 'restored', data: { ...data, storageError }, persist });
  }, []);

  // Save courses after every change (rule 14). Path saving is separate: it can fail visibly (rule 13).
  useEffect(() => {
    if (state.status !== 'ready' || !state.persist) return;
    saveData(toStored(state));
  }, [state]);

  const savePath = useCallback(
    (path) => {
      const savedPath = { pathId: path.id, terms: path.terms, savedAt: new Date().toISOString() };
      const ok = !state.persist || saveData(toStored(state, savedPath));
      if (ok) dispatch({ type: 'savedPath', savedPath });
      return ok;
    },
    [state],
  );

  const value = useMemo(
    () => ({
      ...state,
      addCourse: (course) => dispatch({ type: 'addCourse', course }),
      addCourses: (courses) => dispatch({ type: 'addCourses', courses }),
      removeCourse: (code) => dispatch({ type: 'removeCourse', code }),
      toggleCompleted: (code) => dispatch({ type: 'toggleCompleted', code }),
      markCompleted: (codes) => dispatch({ type: 'markCompleted', codes }),
      setTicks: (ticks) => dispatch({ type: 'setTicks', ticks }),
      setDraft: (draft) => dispatch({ type: 'draft', draft }),
      setLastRemaining: (n) => dispatch({ type: 'lastRemaining', n }),
      loadSample: () => dispatch({ type: 'loadSample' }),
      // Returns a snapshot so the screen can offer «تراجع».
      resetAll: () => {
        const snapshot = { major: state.major, courses: state.courses, savedPath: state.savedPath, transcript: state.transcript };
        dispatch({ type: 'resetAll' });
        return snapshot;
      },
      restorePlan: (snapshot) => dispatch({ type: 'restorePlan', snapshot }),
      setTranscript: (transcript) => dispatch({ type: 'transcript', transcript }),
      setUniversity: (id) => dispatch({ type: 'university', id }),
      savePath,
    }),
    [state, savePath],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
