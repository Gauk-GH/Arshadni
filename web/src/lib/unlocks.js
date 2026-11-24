// unlocks.js: «يفتح لك» logic for screen 3 (HANDOFF rules 20–23). Pure, no React.
//
// Only REMAINING courses matter. A prerequisite that is completed, or not in the plan, is already
// satisfied (decision 4), so it is not a link in any chain here.
// Call only when findCycle() found no loop (screen 3 shows the loop alert instead of these lists).
import { codeKey } from './courses.js';

export function analyzeUnlocks(courses) {
  const remaining = courses.filter((c) => !c.completed);
  const byKey = new Map(remaining.map((c) => [codeKey(c.code), c]));
  const order = new Map(remaining.map((c, i) => [codeKey(c.code), i]));

  // Each remaining course's prerequisites that are themselves remaining (keeps the student's order).
  const pre = new Map(remaining.map((c) => [
    codeKey(c.code),
    c.prerequisites.map(codeKey).filter((k) => byKey.has(k)),
  ]));

  // Rule 20: what a course unlocks DIRECTLY = remaining courses that list it as a prerequisite.
  const dependents = new Map(remaining.map((c) => [codeKey(c.code), []]));
  for (const c of remaining) for (const p of pre.get(codeKey(c.code))) dependents.get(p).push(c);

  const direct = (code) => dependents.get(codeKey(code)) ?? [];

  // Rule 21: unlocked LATER = everything further down the chain, without the direct ones, no repeats,
  // in the student's list order.
  function later(code) {
    const key = codeKey(code);
    const directKeys = new Set(direct(code).map((c) => codeKey(c.code)));
    const seen = new Set([key]);
    const queue = [...direct(code)];
    const found = [];
    while (queue.length) {
      const c = queue.shift();
      const k = codeKey(c.code);
      if (seen.has(k)) continue;
      seen.add(k);
      if (!directKeys.has(k)) found.push(c);
      queue.push(...dependents.get(k));
    }
    return found.sort((a, b) => order.get(codeKey(a.code)) - order.get(codeKey(b.code)));
  }

  // Rule 20: available courses sorted by how many they unlock directly; ties keep the list order.
  // (Array.prototype.sort is stable, so equal counts stay in their original order.)
  const sortAvailable = (available) => [...available].sort((a, b) => direct(b.code).length - direct(a.code).length);

  // Depth = length of the longest chain of remaining prerequisites above a course (0 = available now).
  const depthMemo = new Map();
  function depth(key) {
    if (!depthMemo.has(key)) {
      depthMemo.set(key, 0); // guard; there are no loops here
      depthMemo.set(key, Math.max(0, ...pre.get(key).map((p) => 1 + depth(p))));
    }
    return depthMemo.get(key);
  }

  // Rule 22: the path to a locked course, from an available course to the course itself.
  // At each step follow the prerequisite with the LONGEST chain (it decides the earliest term);
  // ties go to the first prerequisite in the student's order.
  function chainTo(code) {
    const path = [];
    let key = codeKey(code);
    while (key) {
      path.unshift(byKey.get(key));
      const options = pre.get(key);
      if (options.length === 0) break;
      key = options.reduce((best, p) => (depth(p) > depth(best) ? p : best), options[0]);
    }
    return path;
  }

  return { direct, later, sortAvailable, chainTo };
}
