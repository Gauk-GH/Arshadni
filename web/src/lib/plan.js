// plan.js: builds the graduation paths (HANDOFF rules 6–9). Pure logic, no React.
//
// How it works, in plain words:
// 1. Take the remaining courses. A prerequisite only matters if it is also remaining
//    (completed ones and ones not in the plan count as done, decision 4).
// 2. "Height" of a course = how long the chain of courses waiting on it is (itself included).
//    CS 210 → CS 310 → CS 410 gives CS 210 a height of 3. Courses with taller chains go first,
//    otherwise the plan needs extra terms at the end (this is called critical-path scheduling).
// 3. Fill term by term: only courses whose prerequisites sit in an earlier term (rule 8),
//    at most `cap` per term (rule 7), tallest chain first, then the student's own list order.
// 4. The three strategies only differ in the cap of each term:
//    B heavy-first: every term full (max). Its term count is the minimum we can reach.
//    A balanced:    courses spread evenly over that many terms, bigger terms first (5, 5, 4).
//    C light-first: the same spread, smaller terms first (4, 5, 5).
// 5. Rule 9: only paths that finish in the minimum number of terms are shown.
import { codeKey } from './courses.js';

export const STRATEGIES = [
  { id: 'A', strategy: 'balanced' },
  { id: 'B', strategy: 'heavy-first' },
  { id: 'C', strategy: 'light-first' },
];

// Remaining courses with their in-plan, still-remaining prerequisites, list order and height.
function buildGraph(courses, ignorePrerequisites) {
  const remaining = courses.filter((c) => !c.completed);
  const keys = new Set(remaining.map((c) => codeKey(c.code)));
  const nodes = remaining.map((c, index) => ({
    code: c.code,
    key: codeKey(c.code),
    index,
    pre: ignorePrerequisites ? [] : c.prerequisites.map(codeKey).filter((k) => keys.has(k)),
  }));
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const dependents = new Map(nodes.map((n) => [n.key, []]));
  for (const n of nodes) for (const p of n.pre) dependents.get(p).push(n);

  const height = new Map();
  const heightOf = (n) => {
    if (!height.has(n.key)) height.set(n.key, 1 + Math.max(0, ...dependents.get(n.key).map(heightOf)));
    return height.get(n.key);
  };
  nodes.forEach(heightOf);
  return { nodes, byKey, height };
}

// Fill terms with the given caps (caps[i] for term i; the last cap repeats).
// Returns an array of terms (arrays of codes), or null if a term ends up empty (stuck).
function schedule(graph, caps) {
  const { nodes, height } = graph;
  const termOf = new Map();
  const terms = [];
  while (termOf.size < nodes.length) {
    const t = terms.length;
    const cap = caps[Math.min(t, caps.length - 1)];
    const ready = nodes
      .filter((n) => !termOf.has(n.key) && n.pre.every((p) => termOf.has(p) && termOf.get(p) < t))
      .sort((a, b) => height.get(b.key) - height.get(a.key) || a.index - b.index);
    const picked = ready.slice(0, cap);
    if (picked.length === 0) return null; // a loop: never happens after findCycle() says no
    picked.forEach((n) => termOf.set(n.key, t));
    // Show each term in the student's own list order.
    terms.push(picked.sort((a, b) => a.index - b.index).map((n) => n.code));
  }
  return terms;
}

// Spread n courses over `count` terms as evenly as possible: e.g. 14 over 3 → [5, 5, 4].
function evenCaps(n, count, biggerFirst) {
  const base = Math.floor(n / count);
  const extra = n % count;
  const caps = Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
  return biggerFirst ? caps : caps.reverse();
}

const sameTerms = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Does the student's plan have any prerequisite at all? (rule 6)
export function hasAnyPrerequisite(courses) {
  return courses.some((c) => c.prerequisites.length > 0);
}

// Returns { termCount, paths: [{ id, strategy, terms }] }.
// Paths that would need more terms than the minimum are dropped (rule 9).
// A path identical to an earlier one is dropped too, so the student never sees two same options.
export function generatePaths(courses, maxPerTerm, { ignorePrerequisites = false } = {}) {
  const graph = buildGraph(courses, ignorePrerequisites);
  const n = graph.nodes.length;
  if (n === 0) return { termCount: 0, paths: [] };

  const heavy = schedule(graph, [maxPerTerm]);
  const termCount = heavy.length;
  const candidates = {
    A: schedule(graph, evenCaps(n, termCount, true)),
    B: heavy,
    C: schedule(graph, evenCaps(n, termCount, false)),
  };

  const paths = [];
  for (const { id, strategy } of STRATEGIES) {
    const terms = candidates[id];
    if (!terms || terms.length !== termCount) continue; // rule 9
    if (terms.some((t) => t.length > maxPerTerm)) continue; // rule 7
    if (paths.some((p) => sameTerms(p.terms, terms))) continue;
    paths.push({ id, strategy, terms });
  }
  return { termCount, paths };
}
