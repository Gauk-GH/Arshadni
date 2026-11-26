// Browser run of the full DEMO flow: university → sample → add CS 170 → tick it → remaining → plan (3 paths) → save.
// It logs what each screen shows, so two runs (e.g. main and a branch) can be compared line by line.
// Run from the repo root with the dev server running:
//   SHOT_LOG=1 SHOT_JS="$(cat web/scripts/checks/demo-flow-ui.js)" node web/scripts/shot.mjs "http://localhost:5173/#/input" /tmp/demo 390 844 0
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (test, what, ms = 15000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 100))) {
    const v = test(); if (v) return v;
  }
  throw new Error('not ready after ' + ms / 1000 + 's: ' + what);
};
const log = (window.__log = []);
const plain = (x) => (x ?? '').replace(/[⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
const button = (text) => [...document.querySelectorAll('button')].find((b) => plain(b.textContent).includes(text));
const setValue = (el, value) => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
const step = (name) => log.push(`[${name}] h1=«${plain(document.querySelector('h1')?.textContent)}» captions=${[...document.querySelectorAll('.caption')].map((c) => '«' + plain(c.textContent) + '»').join(' ')}`);

// 1. University (required before manual entry)
const select = await waitFor(() => document.querySelector('select'), 'university picker');
step('start');
setValue(select, select.options[1].value);
await w(200);
log.push('university: ' + plain(select.selectedOptions[0].textContent));

// 2. Sample data
button('جرّب ببيانات')?.click();
await waitFor(() => document.querySelector('.list-courses li'), 'sample list');
step('list after sample');

// 3. Add CS 170
button('أضف مقرر').click();
const sheet = await waitFor(() => document.querySelector('.sheet-form'), 'add sheet');
const [code, , name] = sheet.querySelectorAll('input');
setValue(code, 'CS 170');
setValue(name, 'مقدمة في الذكاء الاصطناعي');
await w(100);
sheet.querySelector('button[type=submit]').click();
await waitFor(() => plain(document.querySelector('.sheet .toast, .toast')?.textContent).includes('CS 170'), 'added toast');
log.push('toast: ' + plain(document.querySelector('.toast').textContent));
document.querySelector('.sheet__close, [aria-label="' + plain(document.querySelector('.sheet__close')?.getAttribute('aria-label')) + '"]')?.click();
await w(400);
step('list after add');

// 4. Screen 2: tick CS 170
button('التالي: علّم')?.click();
await waitFor(() => document.querySelector('input[type=checkbox]'), 'screen 2');
await w(300);
for (const b of document.querySelectorAll('button[aria-expanded="false"]')) if (!plain(document.body.textContent).includes('CS 170')) b.click();
const row = await waitFor(() => [...document.querySelectorAll('label')].find((l) => plain(l.textContent).includes('CS 170')), 'CS 170 row');
row.querySelector('input[type=checkbox]').click();
await w(200);
log.push('CS 170 ticked: ' + row.querySelector('input').checked);
step('done');
log.push('done button: ' + plain(button('اعرض المتبقي')?.textContent));

// 5. Screen 3: remaining
button('اعرض المتبقي').click();
await waitFor(() => document.querySelector('.remaining-list'), 'screen 3');
await w(500);
step('remaining');
log.push('remaining codes: ' + [...document.querySelectorAll('.course-row__code')].map((e) => plain(e.textContent)).join(', '));

// 6. Screen 4: plan with 3 paths
button('رتّب لي خطة').click();
const group = await waitFor(() => document.querySelector('[role=radiogroup]'), 'paths');
await w(1500);
const paths = [...group.querySelectorAll('[role=radio]')];
log.push(`paths: ${paths.length} → ${paths.map((p) => plain(p.textContent)).join(' | ')}`);
step('plan');

// 7. Save
const save = button('احفظ المسار');
log.push('save button: ' + plain(save.textContent));
save.click();
await waitFor(() => JSON.parse(localStorage.getItem('arshadni') ?? '{}').savedPath && !plain(save.textContent).includes('جاري'), 'saved');
log.push('after save: ' + plain(document.querySelector('footer, .footer')?.textContent));
const stored = JSON.parse(localStorage.getItem('arshadni'));
log.push(`stored: ${stored.studyPlan.courses.length} courses, ${stored.studyPlan.courses.filter((c) => c.completed).length} completed, savedPath=${stored.savedPath?.pathId}, terms=${stored.savedPath?.terms?.length}`);
