// Browser checks for «يفتح لك» on screen 3 (sort, pills, card, later line, chain, aria, one open at a time).
// Run from the repo root with the dev server on :5173:
//   SHOT_LOG=1 SHOT_JS="$(cat web/scripts/checks/unlocks-ui.js)" node web/scripts/shot.mjs "http://localhost:5173/#/input" /tmp/unlocks 390 844 0
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
(await waitFor(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('جرّب ببيانات')), 'start screen')).click();
await waitFor(() => document.querySelector('.list-courses'), 'sample courses loaded');
location.hash = '#/remaining';
await waitFor(() => document.querySelector('.remaining-list .unlock-item'), 'remaining lists');
const items = [...document.querySelectorAll('.remaining-list > ul')[0].children];
const codes = items.map((li) => plain(li.querySelector('.course-row__code').textContent));
check(codes.join(',') === 'CS 210,CS 250,CS 330,STAT 201,ISLM 102,ENGL 102', 'sort: ' + codes.join(', '));
check(plain(document.querySelector('.unlock-sorted')?.textContent) === 'مرتبة حسب كم مقرر تفتح لك', 'caption «مرتبة حسب كم مقرر تفتح لك»');
const pills = items.map((li) => plain(li.querySelector('.pill')?.textContent ?? '-'));
check(pills.join('|') === 'يفتح ٣|يفتح ٢|-|-|-|-', 'pills: ' + pills.join(' | '));
check(items[0].querySelector('.unlock-most')?.textContent === 'يفتح أكثر شي' && document.querySelectorAll('.unlock-most').length === 1, '«يفتح أكثر شي» only on CS 210');
check(!document.querySelector('.remaining-list > ul')?.querySelector('.badge--available'), 'no «متاح» badges in the available list');
const pill = items[0].querySelector('.pill-btn');
check(pill.tagName === 'BUTTON' && pill.getAttribute('aria-expanded') === 'false' && !!document.getElementById(pill.getAttribute('aria-controls')), 'pill: <button>, aria-expanded=false, aria-controls points to a real element');
pill.click(); await w(300);
check(pill.getAttribute('aria-expanded') === 'true', 'pill: aria-expanded=true after tap');
const panel = document.getElementById(pill.getAttribute('aria-controls'));
const direct = [...panel.querySelectorAll('.unlock-card__row .course-row__code')].map((e) => plain(e.textContent));
check(direct.join(',') === 'CS 310,CS 320,CS 360', 'CS 210 opens: ' + direct.join(', '));
check(plain(panel.querySelector('.unlock-card__title')?.textContent) === 'إذا خلصته، تقدر تسجّل الترم اللي بعده:', 'card title');
check(plain(panel.querySelector('.unlock-card__later .caption')?.textContent) === 'و٣ ثانية بعدها: CS 410، CS 498، CS 499', 'later line «و٣ ثانية بعدها: CS 410، CS 498، CS 499»');
check(panel.querySelectorAll('.mini-ticks__solid').length === 3 && panel.querySelectorAll('.mini-ticks__dashed').length === 3, 'mini ticks: 3 solid, 3 dashed');
// CS 250: no later line
items[1].querySelector('.pill-btn').click(); await w(300);
check(document.querySelectorAll('.unlock-item.is-open').length === 1 && pill.getAttribute('aria-expanded') === 'false', 'one card at a time (CS 210 closed when CS 250 opened)');
const p2 = document.getElementById(items[1].querySelector('.pill-btn').getAttribute('aria-controls'));
check([...p2.querySelectorAll('.unlock-card__row .course-row__code')].map((e) => plain(e.textContent)).join(',') === 'CS 340,CS 370' && !p2.querySelector('.unlock-card__later .caption'), 'CS 250 opens CS 340, CS 370; no «ثانية بعدها» line');
// chain
const row410 = [...document.querySelectorAll('.unlock-item__toggle')].find((b) => b.textContent.includes('CS 410'));
check(row410.tagName === 'BUTTON' && row410.getAttribute('aria-expanded') === 'false', 'locked row: <button>, aria-expanded=false');
row410.click(); await w(300);
check(row410.getAttribute('aria-expanded') === 'true' && document.querySelectorAll('.unlock-item.is-open').length === 1, 'locked row opens; still one card open');
const steps = [...document.querySelectorAll('.unlock-item.is-open .chain__step')].map((s) => plain(s.querySelector('.chain__code').textContent) + ' / ' + plain(s.querySelector('.caption').textContent));
check(steps.join(' → ') === 'CS 210 / متاح الحين → CS 310 / الترم اللي بعده → CS 410 / أقرب وقت: بعد ترمين', 'CS 410 chain: ' + steps.join(' → '));
check(getComputedStyle(document.querySelector('.chain__dot')).borderRadius === '50%', 'step dots are circles (the one 50% exception)');
row410.click(); await w(300);
check(document.querySelectorAll('.unlock-item.is-open').length === 0 && row410.getAttribute('aria-expanded') === 'false', 'tap again closes');
