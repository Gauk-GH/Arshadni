// Browser checks for the REAL transcript reader on screen 1 with the 4 fixture files (scripts/fixtures/).
// Run from the repo root with the dev server running; pick the file with ?fixture=:
//   SHOT_LOG=1 SHOT_JS="$(cat web/scripts/checks/transcript-ui.js)" node web/scripts/shot.mjs "http://localhost:5173/?fixture=transcript-ar-en.pdf#/input" /tmp/tr 390 844 0
// fixture: transcript-ar-en.pdf | not-transcript.pdf | scan.pdf | not-a-pdf.txt
// Add &stop=card to stop at the card (for screenshots) instead of finishing the import.
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

await waitFor(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('ارفق سجلك')), 'start screen with upload card');
check(!pdfLoaded(), 'pdf.js not downloaded before a file is picked');

const blob = await (await fetch(`/scripts/fixtures/${name}`)).blob();
const file = new File([blob], name, { type: name.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
const input = document.querySelector('input[type=file]');
check(input.getAttribute('accept') === 'application/pdf', 'file input accepts application/pdf only');
const dt = new DataTransfer();
dt.items.add(file);
input.files = dt.files;
input.dispatchEvent(new Event('change', { bubbles: true }));
const t0 = performance.now();
const card = await waitFor(() => document.querySelector('.upload--failed, .upload--done'), 'card finished');
log.push(`INFO read in ${Math.round(performance.now() - t0)} ms; pdf.js downloaded: ${pdfLoaded()}`);
log.push('INFO card: ' + plain(card.innerText).replace(/\n/g, ' / '));

if (name === 'transcript-ar-en.pdf') {
  const codes = [...card.querySelectorAll('.course-row__code')].map((e) => plain(e.textContent));
  check(plain(card.querySelector('.upload__title').textContent) === 'لقينا ٢٨ مقرر خلصتها', 'title «لقينا ٢٨ مقرر خلصتها»');
  check(codes.length === 28, `28 rows listed (got ${codes.length})`);
  check(!codes.includes('CS 210') && !codes.includes('CS 250'), 'CS 210 (F) and CS 250 (W) not listed');
  if (params.get('stop') !== 'card') {
    [...card.querySelectorAll('button')].find((b) => b.textContent.includes('أضف'))?.click();
    await waitFor(() => document.querySelector('.upload-line'), '«سجلك مرفق» line');
    log.push('INFO line: ' + plain(document.querySelector('.upload-line').innerText));
    location.hash = '#/done';
    await waitFor(() => document.querySelector('input[type=checkbox]'), 'screen 2');
    const boxes = [...document.querySelectorAll('input[type=checkbox]')];
    const saved = JSON.parse(localStorage.getItem('arshadni') ?? 'null')?.studyPlan?.courses ?? [];
    check(saved.length === 28 && saved.every((c) => c.completed), `saved plan: 28 courses, all completed (got ${saved.length}, ${saved.filter((c) => c.completed).length} completed)`);
    check(!saved.some((c) => ['CS 210', 'CS 250'].includes(c.code)), 'saved plan has no CS 210 / CS 250');
    log.push(`INFO screen 2: ${boxes.filter((b) => b.checked).length} of ${boxes.length} visible boxes ticked`);
  }
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
