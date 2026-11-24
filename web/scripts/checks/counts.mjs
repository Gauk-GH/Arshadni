// Arabic count wording (lib/plural.js + tn() in lib/strings.js): every one/two/many form, for n = 1, 2, 3 (+ 11).
// Run from the repo root: node web/scripts/checks/counts.mjs web
import { pathToFileURL } from 'node:url';
const web = process.argv[2] ?? 'web';
const { tn, t } = await import(pathToFileURL(`${web}/src/lib/strings.js`));
const { countOf } = await import(pathToFileURL(`${web}/src/lib/plural.js`));
let fails = 0;
const eq = (got, want, msg) => { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}: «${got}»${ok ? '' : `  want «${want}»`}`); };
const TAIL = ' أضف المتطلبات من خطة قسمك والترتيب يطلع أدق.';
const cases = {
  'input.reset.confirm': ['تمسح المقرر الوحيد؟', 'تمسح المقررين؟', 'تمسح كل الـ ٣ مقرر؟'],
  'input.reset.done': ['انمسح المقرر', 'انمسح المقررين', 'انمسحت كل الـ ٣ مقرر'],
  'input.upload.partial.add': ['أضفه لخطتك', 'أضف الاثنين لخطتك', 'أضف الـ ٣ لخطتك'],
  'plan.empty.body': [
    'ما أدخلت أي متطلب سابق، فنعتبر المقرر الوحيد متاح الحين.' + TAIL,
    'ما أدخلت أي متطلب سابق، فنعتبر المقررين متاحين الحين.' + TAIL,
    'ما أدخلت أي متطلب سابق، فنعتبر كل الـ ٣ مقرر متاحة الحين.' + TAIL,
  ],
};
for (const [key, [one, two, three]] of Object.entries(cases)) {
  eq(tn(key, 1), one, `${key} n=1`);
  eq(tn(key, 2), two, `${key} n=2`);
  eq(tn(key, 3), three, `${key} n=3`);
}
eq(tn('input.reset.confirm', 11), 'تمسح كل الـ ١١ مقرر؟', 'input.reset.confirm n=11');
for (const [noun, forms] of Object.entries({
  course: ['مقرر واحد', 'مقررين', '٣ مقررات', '١١ مقرر'],
  code: ['رمز واحد', 'رمزين', '٣ رموز', '١١ رمز'],
  term: ['ترم واحد', 'ترمين', '٣ أترام', '١١ ترم'],
})) [1, 2, 3, 11].forEach((n, i) => eq(countOf(n, noun), forms[i], `${noun} n=${n}`));
eq(t('plan.copy.done', { n: 1 }), 'انسخت رمز واحد', 'plan.copy.done n=1');
eq(t('plan.copy.done', { n: 2 }), 'انسخت رمزين', 'plan.copy.done n=2');
eq(t('plan.title', { n: 2 }), 'تخلّص تقريبًا في ترمين', 'plan.title n=2');
process.exit(fails ? 1 : 0);
