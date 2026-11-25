// storage.js: the only file that touches localStorage (decision 6). Screens never call it
// directly; they go through the store. To move to a database later, replace this file.
// Data in localStorage is untrusted: someone (or an old version of the app) may have
// left anything there. We check its shape; if it's broken we back it up, then start fresh.

export const STORAGE_KEY = 'arshadni';
export const BACKUP_PREFIX = 'arshadni-backup-'; // + time, e.g. arshadni-backup-1764072000000
export const SCHEMA_VERSION = 1;
const TEST_KEY = 'arshadni-test';

function isCourse(c) {
  return (
    c && typeof c === 'object' &&
    typeof c.code === 'string' && c.code.trim() !== '' &&
    typeof c.name === 'string' &&
    Array.isArray(c.prerequisites) && c.prerequisites.every((p) => typeof p === 'string') &&
    typeof c.completed === 'boolean'
  );
}

function isValid(data) {
  return (
    data && typeof data === 'object' &&
    data.schemaVersion === SCHEMA_VERSION &&
    data.studyPlan && Array.isArray(data.studyPlan.courses) &&
    data.studyPlan.courses.every(isCourse) &&
    data.settings && Number.isInteger(data.settings.maxCoursesPerTerm) &&
    data.settings.maxCoursesPerTerm > 0
  );
}

function parse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Copies the broken text to its own key, so starting fresh never loses what the student typed.
// Each backup gets a new key, so an older backup is never overwritten.
function backup(raw) {
  try {
    window.localStorage.setItem(`${BACKUP_PREFIX}${Date.now()}`, raw);
    return true;
  } catch {
    return false;
  }
}

// Returns one of:
//   { status: 'ok', data }      saved data is fine
//   { status: 'none' }          first visit, nothing saved
//   { status: 'broken', canSave } saved data was broken; it was backed up (canSave = backup worked,
//                               so the app may save over the main key; if false, don't save at all)
//   { status: 'blocked' }       the browser refuses storage (e.g. some private browsing modes)
export function loadData() {
  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    // A tiny test save: some browsers allow reading but refuse writing.
    window.localStorage.setItem(TEST_KEY, '1');
    window.localStorage.removeItem(TEST_KEY);
  } catch {
    return { status: 'blocked' };
  }
  if (!raw) return { status: 'none' };
  const data = parse(raw);
  if (isValid(data)) return { status: 'ok', data };
  return { status: 'broken', canSave: backup(raw) };
}

// Returns true when saved, false when the browser refused (e.g. private browsing, full storage).
export function saveData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
