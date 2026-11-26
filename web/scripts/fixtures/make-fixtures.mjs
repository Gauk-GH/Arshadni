// make-fixtures.mjs: builds the 4 FAKE test files for the transcript reader (HANDOFF decision 35).
// Uses headless Chrome's "print to PDF" over the DevTools protocol (like shot.mjs), no npm packages.
// Run from the repo root: node web/scripts/fixtures/make-fixtures.mjs
// Writes into web/scripts/fixtures/:
//   transcript-ar-en.pdf  text PDF: mock.json's 28 completed courses passed, plus CS 210 = F and CS 250 = W
//   not-transcript.pdf    a normal Arabic text PDF that is not an academic record
//   scan.pdf              the transcript as one picture (no text layer), like a scan
//   not-a-pdf.txt         a plain text file
// All names and numbers are made up.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mock = JSON.parse(readFileSync(join(here, '../../src/data/mock.json'), 'utf8'));
const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const PORT = 9334;

// ---------- Content ----------
const passed = mock.studyPlan.courses.filter((c) => c.completed);
const GRADES = ['A+', 'أ', 'B+', 'ب+', 'A', 'TR', 'C+', 'ج', 'B', 'P', 'ناجح', 'D+', 'معادل', 'د', 'أ+', 'C', 'ج+', 'D', 'ب', 'د+'];
const rows = passed.map((c, i) => ({ code: c.code, name: c.name, credits: 3, grade: GRADES[i % GRADES.length] }));
// Two attempts that did NOT pass: they must not be marked.
rows.splice(20, 0, { code: 'CS 210', name: 'هياكل البيانات', credits: 3, grade: 'F' });
rows.splice(25, 0, { code: 'CS 250', name: 'تصميم المنطق الرقمي', credits: 3, grade: 'W' });
const TERMS = ['الفصل الأول 2022', 'الفصل الثاني 2023', 'الفصل الأول 2023', 'الفصل الثاني 2024', 'الفصل الأول 2024'];
const perTerm = Math.ceil(rows.length / TERMS.length);

const css = `
  @page { size: A4; margin: 14mm; }
  body { font-family: Arial, 'Segoe UI', sans-serif; font-size: 11pt; color: #111; }
  h1 { font-size: 16pt; margin: 0 0 4pt; } h2 { font-size: 12pt; margin: 12pt 0 4pt; }
  table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid #999; padding: 3pt 6pt; text-align: start; }
  .meta td { border: 0; padding: 1pt 6pt; }`;

const transcriptHtml = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <h1>السجل الأكاديمي <span dir="ltr">(Academic Record)</span></h1>
  <table class="meta">
    <tr><td>الجامعة: جامعة تجريبية</td><td>الاسم: طالب تجريبي</td></tr>
    <tr><td>الرقم الجامعي: 0000000</td><td>التخصص: علوم الحاسب</td></tr>
  </table>
  ${TERMS.map((term, t) => `
    <h2>${term}</h2>
    <table>
      <tr><th>رمز المقرر</th><th>اسم المقرر</th><th>الساعات</th><th>التقدير</th></tr>
      ${rows.slice(t * perTerm, (t + 1) * perTerm).map((r) => `
        <tr><td dir="ltr">${r.code}</td><td>${r.name}</td><td>${r.credits}</td><td>${r.grade}</td></tr>`).join('')}
    </table>
    <p>المعدل الفصلي: 3.40 من 4.00</p>`).join('')}
  <h2>الملخص</h2>
  <p>مجموع الساعات المكتسبة: 84</p>
  <p>المعدل التراكمي <span dir="ltr">(GPA)</span>: 3.52</p>
</body></html>`;

const articleHtml = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <h1>نصائح لأسبوع التسجيل</h1>
  <p>قبل ما يفتح التسجيل بيوم، رتّب جدولك وشوف المقررات اللي تبيها. أغلب الطلاب يسجلون بين الساعة 8 و 10 الصبح.</p>
  <p>مثلًا مقرر CS 101 عادة يمتلي بسرعة، فخلّه أول شي في قائمتك.</p>
  <p>في سنة 2024 سجّل أكثر من 3000 طالب في أول ساعة. خذ نفس، واشرب موية، وجهّز بدائل لكل شعبة.</p>
  <p>آخر شي: احفظ رقم الشعبة 1234 في جوالك عشان ما تدوّر عليه وقت الزحمة.</p>
</body></html>`;

// ---------- Chrome ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'fixtures-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
async function getJson(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}${path}`, { method })).json(); } catch { await sleep(200); }
  }
  throw new Error('Chrome did not start');
}

try {
  const target = await getJson('/json/new?about:blank', 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const myId = ++id;
    pending.set(myId, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  await send('Page.enable');
  // Each page is written to a temp .html file and opened from there.
  const tmp = mkdtempSync(join(tmpdir(), 'fixtures-html-'));
  let n = 0;
  const show = async (html) => {
    const file = join(tmp, `page-${++n}.html`);
    writeFileSync(file, html);
    await send('Page.navigate', { url: pathToFileURL(file).href });
    await sleep(800);
  };
  const pdf = async (name) => {
    const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
    writeFileSync(join(here, name), Buffer.from(data, 'base64'));
    console.log('wrote', name);
  };

  await show(transcriptHtml);
  await pdf('transcript-ar-en.pdf');

  await show(articleHtml);
  await pdf('not-transcript.pdf');

  // Scan: a picture of the transcript's first part, printed as an image only.
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false });
  await show(transcriptHtml);
  const { data: png } = await send('Page.captureScreenshot', { format: 'png' });
  await send('Emulation.clearDeviceMetricsOverride');
  await show(`<!doctype html><html><head><style>@page{size:A4;margin:0}body{margin:0}img{width:100%}</style></head>
    <body><img src="data:image/png;base64,${png}"></body></html>`);
  await pdf('scan.pdf');

  writeFileSync(join(here, 'not-a-pdf.txt'), 'هذا ملف نص عادي، مو PDF.\nCS 210 B+\nCS 250 A\nCS 330 B\n');
  console.log('wrote not-a-pdf.txt');
  ws.close();
} finally {
  chrome.kill();
}
