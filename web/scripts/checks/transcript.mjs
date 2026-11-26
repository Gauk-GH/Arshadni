// Logic checks for the real transcript parser (lib/transcript.js): codes, grades, repeats, markers, matching.
// Run from the repo root: node web/scripts/checks/transcript.mjs web
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const web = process.argv[2] ?? 'web';
const { codesIn, gradeOf, parseLine, parseTranscriptLines, matchToPlan } = await import(pathToFileURL(`${web}/src/lib/transcript.js`));
const mock = JSON.parse(readFileSync(`${web}/src/data/mock.json`, 'utf8'));
let fails = 0;
const eq = (got, want, msg) => {
  const g = JSON.stringify(got), w = JSON.stringify(want), ok = g === w;
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}${ok ? '' : `  got ${g}  want ${w}`}`);
};
const first = (s) => codesIn(s)[0]?.code ?? null;

// Codes
eq(first('CS 210 Data Structures'), 'CS 210', 'code "CS 210"');
eq(first('cs210 data'), 'CS 210', 'code "cs210"');
eq(first('ISLM 1010 x'), 'ISLM 1010', 'code with 4 digits');
eq(first('عال 101 مقدمة'), 'عال 101', 'Arabic code "عال 101"');
eq(first('عال١٠١'), 'عال 101', 'Arabic code with Arabic-Indic digits, no space');
eq(first('101 عال'), 'عال 101', 'Arabic code read backwards "101 عال"');
eq(first('Fall 2024'), null, '"Fall 2024" is not a code');
eq(first('Total 120'), null, '"Total 120" is not a code');
eq(first('الفصل 2024'), null, '"الفصل 2024" is not a code');
eq(first('ABCDEF 101'), null, '6 letters is not a code');
eq(first('CS 21'), null, '2 digits is not a code');
eq(first('CS 21045'), null, '5 digits is not a code');

eq(parseLine({ cells: ['B', '3', 'الكائنیة', 'CS 111'] })?.name, 'الكائنية', 'Persian ی becomes Arabic ي');
eq(parseLine({ cells: ['B', '3', 'المھارات', 'ARAB 101'] })?.name, 'المهارات', 'ھ becomes ه');

// Grades
for (const g of ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P', 'TR', 'أ+', 'أ', 'ب+', '+ب', 'ب', 'ج+', 'ج', 'د+', 'د', 'ناجح', 'معادل']) eq(gradeOf(g), true, `grade ${g} passed`);
for (const g of ['F', 'W', 'WF', 'I', 'IP', 'NP', 'هـ', 'ه', 'ح', 'منسحب', 'غير مكتمل']) eq(gradeOf(g), false, `grade ${g} not passed`);
for (const g of ['A-', 'E', 'Z', 'مقبول جدا']) eq(gradeOf(g), null, `"${g}" is not a grade`);

// Lines
eq(parseLine({ cells: ['CS 210', 'هياكل البيانات', '3', 'B+'] }), { code: 'CS 210', name: 'هياكل البيانات', passed: true }, 'line with cells');
eq(parseLine('MATH 101 Calculus I 4 A'), { code: 'MATH 101', name: 'Calculus I', passed: true }, 'one-string line: grade nearest the end');
eq(parseLine('CS 210 Data Structures 3'), null, 'line without a grade is not a course');
eq(parseLine({ cells: ['ب+', '3', 'مقدمة', 'عال ١٠١'] }), { code: 'عال 101', name: 'مقدمة', passed: true }, 'Arabic line, right-to-left cells');
eq(parseLine({ cells: ['CS 250', 'x', 'غير مكتمل'] })?.passed, false, '«غير مكتمل» cell');
eq(parseLine('CS 250 x 3 غير مكتمل')?.passed, false, '«غير مكتمل» in a one-string line');

// Transcript
const L = (s) => ({ cells: s.split('|') });
const base = [L('السجل الأكاديمي'), L('Fall 2024'), L('CS 101|Intro|3|A'), L('CS 102|Prog|3|F'), L('CS 103|Disc|3|W')];
eq(parseTranscriptLines([...base, L('CS 102|Prog|3|B')]).courses?.map((c) => c.code), ['CS 101', 'CS 102'], 'repeat: F then B counts as passed');
eq(parseTranscriptLines([...base, L('CS 101|Intro again|3|W')]).courses?.map((c) => c.name), ['Intro'], 'repeat: B then W stays passed, name from the passing attempt');
eq(parseTranscriptLines([...base, L('CS 102|Prog v2|3|C'), L('CS 102|Prog v3|3|A')]).courses?.find((c) => c.code === 'CS 102').name, 'Prog v3', 'repeat: latest passing attempt gives the name');
eq(parseTranscriptLines(base.slice(1)).reason, 'notTranscript', 'no marker: notTranscript');
eq(parseTranscriptLines([L('GPA 3.5'), L('CS 101|x|3|A'), L('CS 102|y|3|B')]).reason, 'notTranscript', 'only 2 course lines: notTranscript');
eq(parseTranscriptLines([L('Transcript'), L('CS 101|x|3|A'), L('CS 102|y|3|B'), L('CS 103|z|3|C')]).courses?.length, 3, 'marker + 3 lines: a transcript');
eq(parseTranscriptLines([]).reason, 'scan', 'no text: scan');
eq(parseTranscriptLines([L('  '), L('1')]).reason, 'scan', 'almost no text: scan');

// Matching against the plan: every mock course set to not completed, the transcript's passed courses = mock's 28.
const plan = mock.studyPlan.courses.map((c) => ({ ...c, completed: false }));
const done = mock.studyPlan.courses.filter((c) => c.completed);
const lines = [L('Academic Record'), ...done.map((c, i) => L(`${c.code.replace(' ', i % 2 ? '' : ' ')}|${c.name}|3|${['A', 'ب+', 'TR', 'ناجح'][i % 4]}`)), L('CS 210|x|3|F'), L('CS 250|y|3|W')];
const r = matchToPlan(parseTranscriptLines(lines).courses, plan);
eq(r.matchedCodes.slice().sort(), done.map((c) => c.code).sort(), `matches exactly mock's ${done.length} completed courses`);
eq(r.unmatchedCourses, [], 'nothing unmatched');
process.exit(fails ? 1 : 0);
