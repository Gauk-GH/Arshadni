// storage.js: the only file that touches localStorage (decision 6).
// Data in localStorage is untrusted: someone (or an old version of the app) may have
// left anything there. We check its shape and start fresh if it's broken.

export const STORAGE_KEY = 'arshadni';
export const SCHEMA_VERSION = 1;

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

// Returns the saved data, or null when there is nothing valid saved.
export function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return isValid(data) ? data : null;
  } catch {
    return null; // storage blocked or JSON broken: start fresh
  }
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
