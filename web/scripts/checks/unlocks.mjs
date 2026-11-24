// Logic checks for «يفتح لك» (lib/unlocks.js) against mock.json: sort order, counts, later line, chains.
// Run from the repo root: node web/scripts/checks/unlocks.mjs web
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const web = process.argv[2];
const { analyzeUnlocks } = await import(pathToFileURL(web + '/src/lib/unlocks.js'));
const { summarize } = await import(pathToFileURL(web + '/src/lib/courses.js'));
const mock = JSON.parse(readFileSync(web + '/src/data/mock.json', 'utf8'));
const cs = mock.studyPlan.courses;
const u = analyzeUnlocks(cs);
const codes = (l) => l.map((c) => c.code).join(', ');
let fails = 0;
const eq = (got, want, msg) => { const ok = got === want; if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + msg + (ok ? '' : `  got: ${got}`)); };
const sorted = u.sortAvailable(summarize(cs).available);
eq(codes(sorted), 'CS 210, CS 250, CS 330, STAT 201, ISLM 102, ENGL 102', 'sort: CS 210, CS 250, then list order');
eq(sorted.map((c) => u.direct(c.code).length).join(','), '3,2,0,0,0,0', 'direct counts 3,2,0,0,0,0');
eq(codes(u.direct('CS 210')), 'CS 310, CS 320, CS 360', 'CS 210 opens CS 310, CS 320, CS 360');
eq(codes(u.later('CS 210')), 'CS 410, CS 498, CS 499', 'CS 210 later: CS 410, CS 498, CS 499');
eq(codes(u.direct('CS 250')), 'CS 340, CS 370', 'CS 250 opens CS 340, CS 370');
eq(codes(u.later('CS 250')), '', 'CS 250 later: none');
eq(codes(u.chainTo('CS 410')), 'CS 210, CS 310, CS 410', 'CS 410 chain: CS 210 → CS 310 → CS 410');
eq(codes(u.chainTo('CS 498')), 'CS 210, CS 360, CS 498', 'CS 498 chain: CS 210 → CS 360 → CS 498');
eq(codes(u.chainTo('CS 340')), 'CS 250, CS 340', 'CS 340 chain: CS 250 → CS 340');
// longest-chain rule: X needs [CS 330 (available), CS 410 (depth 2)] → follow CS 410
const x = [...cs, { code: 'CS 500', name: 'x', prerequisites: ['CS 330', 'CS 410'], completed: false }];
eq(codes(analyzeUnlocks(x).chainTo('CS 500')), 'CS 210, CS 310, CS 410, CS 500', 'two prerequisites: follows the longest chain (CS 410)');
// tie → first prerequisite
const y = [...cs, { code: 'CS 501', name: 'y', prerequisites: ['CS 340', 'CS 320'], completed: false }];
eq(codes(analyzeUnlocks(y).chainTo('CS 501')), 'CS 250, CS 340, CS 501', 'tie: first prerequisite (CS 340)');
process.exit(fails ? 1 : 0);
