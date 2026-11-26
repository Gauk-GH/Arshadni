// Browser checks for the REAL transcript reader on screen 1 with the 4 fixture files (scripts/fixtures/).
// Run from the repo root with the dev server running; pick the file with ?fixture=:
//   SHOT_LOG=1 SHOT_JS="$(cat web/scripts/checks/transcript-ui.js)" node web/scripts/shot.mjs "http://localhost:5173/?fixture=transcript-ar-en.pdf#/input" /tmp/tr 390 844 0
// fixture: transcript-ar-en.pdf | not-transcript.pdf | scan.pdf | not-a-pdf.txt
// Add &stop=card to stop at the card (for screenshots) instead of going on to screen 3.
// Add &plan=sample to load the sample plan first (the plan already has courses: done / partial states;
// with ?upload=partial the dev-only 3 extra courses make the partial card).
const waitFor = async (test, what, ms = 20000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 100))) {
    const v = test(); if (v) return v;
  }
  throw new Error('not ready after ' + ms / 1000 + 's: ' + what);
};
const log = (window.__log = []);
const plain = (x) => (x ?? '').replace(/[⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
const check = (ok, msg) => log.push((ok ? 'OK   ' : 'FAIL ') + msg);
const params = new URLSearchParams(location.search);
const name = params.get('fixture');
const pdfLoaded = () => performance.getEntriesByType('resource').some((e) => !e.name.includes('/fixtures/') && /pdfjs-dist|pdf\.worker|\/pdf-\w+\.js/.test(e.name));

const uploadCard = await waitFor(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('ارفق سجلك')), 'start screen with upload card');
check(!pdfLoaded(), 'pdf.js not downloaded before a file is picked');
// Decision 34 + rule 16d: no university yet, so the upload card is disabled like the manual card.
check(uploadCard.disabled && uploadCard.getAttribute('aria-describedby') === 'university-hint', 'upload card disabled until a university is chosen');
const select = document.querySelector('select');
Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, select.options[1].value);
select.dispatchEvent(new Event('change', { bubbles: true }));
await waitFor(() => !uploadCard.disabled, 'upload card enabled after choosing a university');
check(true, 'upload card enabled after choosing a university');
const withSample = params.get('plan') === 'sample';
if (withSample) {
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('جرّب ببيانات')).click();
  await waitFor(() => document.querySelector('.list-courses li'), 'sample list');
}

const blob = await (await fetch(`/scripts/fixtures/${name}`)).blob();
const file = new File([blob], name, { type: name.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
const input = document.querySelector('input[type=file]');
check(input.getAttribute('accept') === 'application/pdf', 'file input accepts application/pdf only');
const dt = new DataTransfer();
dt.items.add(file);
input.files = dt.files;
input.dispatchEvent(new Event('change', { bubbles: true }));
const t0 = performance.now();
const card = await waitFor(() => document.querySelector('.upload--failed, .upload--done, .upload-line'), 'card finished');
log.push(`INFO read in ${Math.round(performance.now() - t0)} ms; pdf.js downloaded: ${pdfLoaded()}`);
log.push('INFO card: ' + plain(card.innerText).replace(/\n/g, ' / '));

const saved = () => JSON.parse(localStorage.getItem('arshadni') ?? 'null')?.studyPlan?.courses ?? [];
if (name === 'transcript-ar-en.pdf' && !withSample) {
  // Empty plan (rule 17a): no partial card; all passed courses go in, completed, and the list asks for the rest.
  check(!document.querySelector('.upload--done'), 'no partial card on an empty plan');
  check(plain(card.textContent) === 'أضفنا ٢٨ مقرر خلصتها من سجلك. الحين أضف المقررات اللي باقية عليك من خطة قسمك', 'message: ' + plain(card.textContent));
  const footer = [...document.querySelectorAll('.footer button, footer button')];
  check(footer[0]?.classList.contains('btn-primary') && plain(footer[0].textContent) === 'أضف مقرر', '«+ أضف مقرر» is the primary (next) step');
  const s28 = saved();
  check(s28.length === 28 && s28.every((c) => c.completed && c.source === 'transcript'), `saved: 28 courses, all completed, from the transcript (got ${s28.length})`);
  check(!s28.some((c) => ['CS 210', 'CS 250'].includes(c.code)), 'no CS 210 (F) / CS 250 (W)');
  if (params.get('stop') !== 'card') {
    location.hash = '#/remaining';
    await waitFor(() => document.querySelector('.remaining-message'), 'screen 3');
    const h = plain(document.querySelector('.remaining-message h2').textContent);
    check(h === 'أضف المقررات اللي باقية عليك عشان نحسب لك', 'screen 3: ' + h);
    check(!plain(document.body.textContent).includes('خلصت خطتك كلها'), 'screen 3 does not say «خلصت خطتك كلها»');
    const done = document.querySelector('.remaining-number--done');
    check(plain(done?.textContent) === 'خلصت ٢٨ مقرر' && !document.querySelector('.remaining-number__value'), 'screen 3 top: «خلصت ٢٨ مقرر», no «باقي لك ٠» number');
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim();
    log.push(`INFO «خلصت» colour ${getComputedStyle(done).color}, ink token ${ink}`);
    const btn = document.querySelector('.btn-primary');
    log.push('INFO screen 3 button: ' + plain(btn.textContent));
    btn.click();
    await waitFor(() => location.hash === '#/input', 'back on screen 1');
    check(true, 'button goes to screen 1');
  }
} else if (name === 'transcript-ar-en.pdf') {
  // The plan already had courses (the sample): matched courses get ticked; partial only if some are not in the plan.
  const partial = new URLSearchParams(location.search).get('upload') === 'partial';
  if (partial) {
    check(card.classList.contains('upload--done') && card.querySelectorAll('.course-row').length === 3, 'partial card with the 3 courses not in the plan');
  } else {
    check(card.classList.contains('upload-line') && plain(card.textContent).includes('لقينا ٢٨ مقرر خلصتها'), 'all in the plan: «سجلك مرفق، لقينا ٢٨ مقرر خلصتها» line');
  }
  const s42 = saved();
  check(s42.length === 42 && !s42.some((c) => c.source), `plan unchanged: 42 courses, none marked from the transcript (got ${s42.length})`);
} else {
  const want = {
    'not-transcript.pdf': 'هذا الملف ما يبان إنه سجل أكاديمي. نزّل السجل من بوابة جامعتك',
    'scan.pdf': 'الملف صورة ممسوحة، مو PDF فيه نص. نزّل السجل من بوابة الجامعة كـ PDF وارفقه مرة ثانية، أو أدخل مقرراتك يدويًا تحت.',
    'not-a-pdf.txt': 'هذا الملف مو PDF. ارفق سجلك الأكاديمي كملف PDF، أو أدخل مقرراتك يدويًا.',
  }[name];
  check(card.classList.contains('upload--failed'), 'error card shown');
  check(plain(card.querySelector('.upload__error')?.textContent) === want, 'error text: ' + plain(card.querySelector('.upload__error')?.textContent));
  check(JSON.parse(localStorage.getItem('arshadni') ?? 'null')?.studyPlan?.courses?.length ? false : true, 'nothing was added');
}
