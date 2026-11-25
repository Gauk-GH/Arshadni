// Browser checks for screen 4 «names + copy» (term rows, shape line per path, copied text, reset on path change).
// Run from the repo root with the dev server on :5173:
//   SHOT_LOG=1 SHOT_JS="$(cat web/scripts/checks/plan-names-ui.js)" node web/scripts/shot.mjs "http://localhost:5173/#/input" /tmp/plan 390 844 0
// For the failed-copy state add ?copy=fail to the URL (dev only); this script checks it when present.
const w = (ms) => new Promise((r) => setTimeout(r, ms));
// Wait until the app is really ready (cold starts after a deploy are slower): poll, don't guess.
const waitFor = async (test, what, ms = 15000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 100))) {
    const v = test(); if (v) return v;
  }
  throw new Error('not ready after ' + ms / 1000 + 's: ' + what);
};
const log = (window.__log = []);
const plain = (x) => (x ?? '').replace(/[⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
const check = (ok, msg) => log.push((ok ? 'OK   ' : 'FAIL ') + msg);
const btn = (txt) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(txt));
const failMode = new URLSearchParams(location.search).get('copy') === 'fail';
(await waitFor(() => btn('جرّب ببيانات'), 'start screen')).click();
await waitFor(() => document.querySelector('.list-courses'), 'sample courses loaded');
location.hash = '#/plan';
await waitFor(() => document.querySelector('.plan-terms .card .term-row') && !document.querySelector('.plan-loading'), 'plan built');
await w(1200); // let the tick drop and card fade-in finish
let copied = null;
if (!failMode) navigator.clipboard.writeText = async (x) => { copied = x; };
const cards = () => [...document.querySelectorAll('.plan-terms .card')];
const rows = (card) => [...card.querySelectorAll('.term-row')].map((r) => plain(r.querySelector('.code').textContent) + ' ' + plain(r.querySelector('.term-row__name').textContent));
// names
check(rows(cards()[0]).join(' | ') === 'CS 210 هياكل البيانات | CS 250 تصميم المنطق الرقمي | CS 330 نظم إدارة قواعد البيانات العلائقية | STAT 201 الإحصاء والاحتمالات | ISLM 102 الثقافة الإسلامية ٢', 'term 1 rows: code + name');
check(cards().every((c) => c.querySelectorAll('.term-row').length > 0) && !document.querySelector('.plan-terms .chip'), 'every term card has rows (no chips)');
check(plain(cards()[0].querySelector('.card__count').textContent) === '٥ مقررات', 'term count «٥ مقررات»');
check([...document.querySelectorAll('.segmented__sub')].map((e) => e.textContent).join('/') === 'متوازن/الثقيل أول/الخفيف أول', 'picker subs «متوازن / الثقيل أول / الخفيف أول»');
// shape line per path
const shape = () => plain(document.querySelector('.plan-shape').textContent);
check(shape() === 'متوازن: ٥ ثم ٥ ثم ٤ مقررات', 'A shape: ' + shape());
// copy
check(document.querySelectorAll('.copy-codes').length === 1 && !!cards()[0].querySelector('.copy-codes'), 'copy button only in the first card');
check(plain(btn('انسخ رموز').textContent) === 'انسخ رموز الترم الجاي (٥)', 'button «انسخ رموز الترم الجاي (٥)»');
btn('انسخ رموز').click(); await w(400);
if (failMode) {
  check(plain(document.querySelector('.copy-codes__failed')?.textContent) === 'ما قدرنا ننسخ. اضغط مطوّل على الرموز وانسخها', 'failed: message');
  check(window.getSelection().toString() === 'CS 210, CS 250, CS 330, STAT 201, ISLM 102', 'failed: codes selected in the box');
} else {
  check(copied === 'CS 210, CS 250, CS 330, STAT 201, ISLM 102', 'copied text: "' + copied + '"');
  check(plain(document.querySelector('.copy-codes .btn-secondary').textContent) === 'انسخت ٥ رموز', 'done label «انسخت ٥ رموز»');
  check(document.querySelector('.copy-codes__box').textContent === copied, 'box shows exactly the copied text');
  check(plain(document.querySelector('.copy-codes [role=status]')?.textContent) === 'الصقها في نظام التسجيل حق جامعتك', 'hint «الصقها في نظام التسجيل حق جامعتك»');
  copied = null; document.querySelector('.copy-codes .btn-secondary').click(); await w(300);
  check(copied === 'CS 210, CS 250, CS 330, STAT 201, ISLM 102', 'button stays tappable (copies again)');
  // path change resets
  document.querySelector('[data-value=B]').click(); await w(400);
  check(shape() === 'أول ترم أثقل (٦)، وآخر ترم أخف (٣)', 'B shape: ' + shape());
  check(!document.querySelector('.copy-codes__box') && plain(btn('انسخ رموز').textContent) === 'انسخ رموز الترم الجاي (٦)', 'path change resets the copy button (B: ٦)');
  btn('انسخ رموز').click(); await w(300);
  check(copied === 'CS 210, CS 250, CS 330, STAT 201, ISLM 102, ENGL 102', 'B copied text: six codes');
  document.querySelector('[data-value=C]').click(); await w(400);
  check(shape() === 'تبدأ خفيف (٤) وتزيد بعدين', 'C shape: ' + shape());
  check(!document.querySelector('.copy-codes__box'), 'path change resets again (C)');
  check(document.querySelectorAll('.footer .btn-primary').length === 1 && plain(document.querySelector('.footer .btn-primary').textContent) === 'احفظ المسار ج', '«احفظ المسار ج» is the only primary button');
}
