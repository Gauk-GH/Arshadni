// courses.js: pure logic about courses. No React, no storage: easy to reason about and test.

// HANDOFF rule 2: "cs210", "CS210" and "CS 210" are the same course.
export function codeKey(code) {
  return String(code).replace(/\s+/g, '').toUpperCase();
}

// HANDOFF rule 3 (decision 8): display as LETTERS + one space + DIGITS ("CS 210").
// Anything that doesn't fit that shape is kept, uppercased, with single spaces.
export function normalizeCode(code) {
  const key = codeKey(code);
  const match = key.match(/^([A-Z]+)(\d+[A-Z]?)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return String(code).trim().replace(/\s+/g, ' ').toUpperCase();
}

// Does this text look like a course code ("cs501", "CS 501")? Used to decide how to show a search.
export function looksLikeCode(text) {
  return /^[A-Za-z]+\s*\d+[A-Za-z]?$/.test(String(text).trim());
}

export function findByCode(courses, code) {
  const key = codeKey(code);
  return courses.find((c) => codeKey(c.code) === key);
}

// HANDOFF rules 1 and 2. Returns null when the course can be added.
// Otherwise { kind: 'bothEmpty' | 'noCode' | 'noName' | 'duplicate', existing? }.
export function validateNewCourse(courses, { code, name }) {
  const hasCode = String(code ?? '').trim() !== '';
  const hasName = String(name ?? '').trim() !== '';
  if (!hasCode && !hasName) return { kind: 'bothEmpty' };
  if (!hasCode) return { kind: 'noCode' };
  if (!hasName) return { kind: 'noName' };
  const existing = findByCode(courses, code);
  if (existing) return { kind: 'duplicate', existing };
  return null;
}

export function makeCourse({ code, name, prerequisite }) {
  const pre = String(prerequisite ?? '').trim();
  return {
    code: normalizeCode(code),
    name: String(name).trim(),
    prerequisites: pre ? [normalizeCode(pre)] : [],
    completed: false,
    addedAt: Date.now(),
  };
}

// Is this prerequisite satisfied?
// Decision 4 (rule 15): a prerequisite that is not in the plan counts as completed.
function isSatisfied(byKey, preCode) {
  const pre = byKey.get(codeKey(preCode));
  return !pre || pre.completed;
}

// HANDOFF rule 4 + §5 Summary. Derived, never stored.
export function summarize(courses) {
  const byKey = new Map(courses.map((c) => [codeKey(c.code), c]));
  const remainingCourses = courses.filter((c) => !c.completed);
  const available = [];
  const locked = [];
  for (const course of remainingCourses) {
    const waitingFor = course.prerequisites.find((p) => !isSatisfied(byKey, p));
    if (waitingFor) locked.push({ course, waitingFor: normalizeCode(waitingFor) });
    else available.push(course);
  }
  return {
    total: courses.length,
    completed: courses.length - remainingCourses.length,
    remaining: remainingCourses.length,
    available,
    locked,
  };
}

// HANDOFF rule 5: find a prerequisite loop among the remaining courses.
// Returns the codes in the loop (e.g. ["CS 310", "CS 360"]) or null.
// Uses depth-first search: walk each course's prerequisites; meeting a course that
// is still "on the path" means we went in a circle.
export function findCycle(courses) {
  const byKey = new Map(courses.map((c) => [codeKey(c.code), c]));
  const state = new Map(); // key -> 'visiting' | 'done'
  const path = [];

  function visit(course) {
    const key = codeKey(course.code);
    if (state.get(key) === 'done') return null;
    if (state.get(key) === 'visiting') {
      const start = path.findIndex((c) => codeKey(c.code) === key);
      return path.slice(start).map((c) => c.code);
    }
    state.set(key, 'visiting');
    path.push(course);
    for (const pre of course.prerequisites) {
      const preCourse = byKey.get(codeKey(pre));
      if (!preCourse || preCourse.completed) continue;
      const loop = visit(preCourse);
      if (loop) return loop;
    }
    path.pop();
    state.set(key, 'done');
    return null;
  }

  for (const course of courses) {
    if (course.completed) continue;
    const loop = visit(course);
    if (loop) return loop;
  }
  return null;
}

// Search by code or name (HANDOFF searchCourses). Code matching ignores spaces and case.
export function searchCourses(courses, query) {
  const q = String(query).trim();
  if (!q) return courses;
  const qKey = codeKey(q);
  const qLower = q.toLowerCase();
  return courses.filter(
    (c) => codeKey(c.code).includes(qKey) || c.name.toLowerCase().includes(qLower),
  );
}
