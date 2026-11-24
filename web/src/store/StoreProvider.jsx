// StoreProvider.jsx: the ONE shared state for all four screens (a React "Context").
// Any screen calls useStore() and gets the same courses, so ticking a course on
// screen 2 changes the number on screen 3.
//
// Flow: on open, restore from localStorage (HANDOFF rule 14); if nothing valid is saved,
// start from mock.json (decision 10). Every change to the courses is saved again.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import mock from '../data/mock.json';
import { codeKey } from '../lib/courses.js';
import { loadData, saveData, SCHEMA_VERSION } from '../lib/storage.js';
import { applyDevState, devState } from '../lib/devState.js';

const StoreContext = createContext(null);

function fromMock() {
  return {
    major: mock.studyPlan.major,
    courses: mock.studyPlan.courses.map((c) => ({ ...c, addedAt: 0 })),
    settings: { ...mock.settings },
    savedPath: null,
  };
}

const initialState = {
  status: 'loading', // 'loading' while restoring, then 'ready'
  persist: true,     // false while a dev state is shown, so real data is never overwritten
  major: '',
  courses: [],
  settings: { maxCoursesPerTerm: 6 },
  savedPath: null,
  draft: null,       // { code } or { name } handed from screen 2 to screen 1's form. Never saved.
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
    case 'draft':
      return { ...state, draft: action.draft };
    case 'savedPath':
      return { ...state, savedPath: action.savedPath };
    default:
      return state;
  }
}

function toStored(state, savedPath = state.savedPath) {
  return {
    schemaVersion: SCHEMA_VERSION,
    studyPlan: { major: state.major, courses: state.courses },
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
    const saved = loadData();
    const data = saved
      ? { major: saved.studyPlan.major ?? '', courses: saved.studyPlan.courses, settings: saved.settings, savedPath: saved.savedPath ?? null }
      : fromMock();
    dispatch({ type: 'restored', data, persist: true });
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
      setDraft: (draft) => dispatch({ type: 'draft', draft }),
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
