// strings.js: every UI text, copied word for word from HANDOFF.md §8.
// Components never hard-code Arabic text: they call t('key', { vars }).
//
// How {vars} are filled:
// - numbers go through fmtNumber, so they show as Arabic-Indic digits (١٤).
// - course codes and search text ({code}, {query}, {a}, {b}) are wrapped in invisible
//   Unicode "left-to-right isolate" marks, so "CS 210" never flips inside Arabic text.
// - names ({name}) may be Arabic or English, so they get a "first-strong isolate".
import { fmtNumber } from './format.js';

const LRI = '⁦'; // left-to-right isolate
const FSI = '⁨'; // first-strong isolate (direction taken from the text itself)
const PDI = '⁩'; // end of isolate

const LATIN_VARS = new Set(['code', 'query', 'a', 'b']);

const STRINGS = {
  'input.title': 'أدخل خطتك الدراسية',
  'input.subtitle': 'انسخ المقررات من خطة قسمك. المتطلب السابق اختياري، بس يخلّي ترتيب الخطة أدق.',
  'input.add': 'أضف المقرر',
  'input.count': 'أضفت {n} مقرر',
  'input.saved': 'محفوظة في جهازك. لو قفلت الصفحة ترجع لك',
  'input.next': 'التالي: علّم اللي خلصته',
  'input.upload': 'ارفق سجلك الأكاديمي',
  'input.upload.sub': 'ملف PDF من موقع الجامعة، ونعلّم لك اللي خلصته',
  'input.upload.reading': 'نقرأ سجلك الأكاديمي…',
  'input.upload.done': 'لقينا {n} مقرر خلصتها',
  'input.upload.done.sub': 'بتلقاها معلّمة في الخطوة الجاية',
  'input.upload.change': 'غيّر الملف',
  'input.upload.error.title': 'ما قدرنا نقرأ سجلك',
  'input.upload.error.scan': 'الملف صورة ممسوحة، مو PDF فيه نص. نزّل السجل من بوابة الجامعة كـ PDF وارفقه مرة ثانية، أو أدخل مقرراتك يدويًا تحت.',
  'input.upload.error.retry': 'ارفق ملف ثاني',
  'input.upload.partial.sub': '{matched} منها في خطتك، و{unmatched} مو موجودة فيها',
  'input.upload.partial.add': 'أضف الـ {unmatched} لخطتك',
  'input.upload.partial.ignore': 'تجاهلها، مو من متطلبات تخصصي',
  'input.empty.title': 'ابدأ بأول مقرر من خطة قسمك',
  // Decision 2: the paste link is hidden this round, so the sentence pointing to it is dropped.
  'input.empty.body': 'افتح خطتك الدراسية من موقع القسم، وانسخ رمز كل مقرر واسمه هنا.',
  'input.empty.button': 'أضف مقرر واحد على الأقل',
  'input.loading': 'نرجّع مقرراتك المحفوظة…',
  'input.error.bothEmpty': 'اكتب رمز المقرر واسمه من خطة قسمك، وبعدها اضغط «أضف المقرر».',
  'input.error.noCode': 'ناقص رمز المقرر، مثل CS 310.',
  'input.error.noName': 'ناقص اسم المقرر. انسخه من خطة قسمك.',
  'input.error.duplicate': '{code} مضاف قبل باسم «{name}». عدّله من القائمة تحت، أو اكتب رمز ثاني.',
  // HANDOFF: «انضاف {code} {name}، تراجع». «تراجع» is the toast's link, so it is its own key.
  'input.success': 'انضاف {code} {name}',
  'common.undo': 'تراجع',
  // Labels shown in the design (HiInput, StatesInput) but not in HANDOFF §8, copied word for word.
  'input.field.code': 'رمز المقرر',
  'input.field.pre': 'المتطلب السابق',
  'input.field.name': 'اسم المقرر',
  'input.placeholder.pre': 'اختياري',
  'input.placeholder.name': 'مثال: الخوارزميات',
  'input.row.needs': 'يحتاج {code}',
  'input.row.delete': 'احذف {code}',
  'input.search': 'ابحث في {n} مقرر',
  'input.newestFirst': 'الأحدث فوق',
  // From the design (StepIndicator, DESIGN.md §6), not in HANDOFF §8.
  'common.step': 'الخطوة {n} من {total}',

  // Design-only labels for screen 2 (HiDone, StatesDone), copied word for word.
  'done.back': 'رجوع لإدخال الخطة',
  'done.search.label': 'ابحث في مقرراتك',
  'done.longHint': 'ابحث بدل ما تمرّر',
  'done.next.loading': 'اعرض المتبقي',
  'done.title': 'علّم المقررات اللي خلصتها',
  'done.count': 'علّمت {n} من {total} مقرر',
  'done.search': 'ابحث بالرمز أو الاسم',
  'done.next': 'اعرض المتبقي ({n} مقرر)',
  'done.empty.title': 'ما فيه مقررات تعلّمها للحين',
  'done.empty.body': 'أضف مقررات خطتك أول، وبعدها ارجع هنا وعلّم اللي خلصته.',
  'done.empty.button': 'أضف مقررات خطتك',
  'done.loading': 'نجهّز {n} مقرر…',
  'done.error.title': 'ما لقينا «{query}» في خطتك',
  'done.error.body': 'تأكد من الرمز. وإذا المقرر ناقص من خطتك، أضفه وارجع علّمه.',
  'done.error.button': 'أضف {query} لخطتك',
  'done.success.title': 'علّمت كل خطتك',
  'done.success.body': 'حسب اللي أدخلته ما باقي عليك شي. تأكد من القسم إن ما فيه مقررات ناقصة من خطتك.',

  'remaining.label': 'باقي لك',
  'remaining.unit': 'مقرر',
  'remaining.ticks': 'كل شرطة مقرر، خلصت {done} من {total}',
  'remaining.available': 'تقدر تسجّلها الترم الجاي ({n})',
  'remaining.locked': 'تحتاج متطلب قبلها ({n})',
  'remaining.badge.available': 'متاح',
  'remaining.badge.locked': 'بعد {code}',
  'remaining.plan': 'رتّب لي خطة التخرج',
  'remaining.edit': 'عدّل مقرراتي',
  'remaining.empty.title': 'حسب اللي أدخلته، خلصت خطتك كلها',
  'remaining.empty.body': 'قبل ما تقدّم على التخرج، تأكد من القسم إن خطتك ما ينقصها مقرر وإن ساعاتك مكتملة.',
  'remaining.empty.button': 'راجع مقرراتي',
  'remaining.loading': 'نحسب اللي باقي لك…',
  'remaining.error.title': 'ما نقدر نرتّب خطتك',
  'remaining.error.body': '{a} يحتاج {b}، و {b} يحتاج {a}. واحد منهم مكتوب غلط، صحّحه من مقرراتك.',
  'remaining.error.badge': 'متعارض',
  'remaining.error.button': 'صحّح المتطلب السابق',
  'remaining.success': 'تحدّث المتبقي: صار {new} بدل {old}',

  'plan.title': 'تخلّص تقريبًا في {n} أترام',
  'plan.sub': 'حسب اللي أدخلته، حد أقصى {max} مقررات بالترم',
  // HANDOFF plan.paths, split per path: label + strategy.
  'plan.path.A': 'المسار أ',
  'plan.path.B': 'المسار ب',
  'plan.path.C': 'المسار ج',
  'plan.strategy.balanced': 'متوازن',
  'plan.strategy.heavy-first': 'الثقيل أول',
  'plan.strategy.light-first': 'الخفيف أول',
  // HANDOFF plan.terms: names for the first, second and last term.
  'plan.term.next': 'الترم الجاي',
  'plan.term.after': 'الترم اللي بعده',
  'plan.term.last': 'ترم التخرج',
  'plan.disclaimer': 'ترتيب مقترح، مو ضمان. راجعه مع مرشدك الأكاديمي.',
  'plan.save': 'احفظ المسار {letter}',
  'plan.loading': 'جاري ترتيب {n} مقرر…',
  'plan.loading.sub': 'نحسب المتطلبات السابقة وحد {max} مقررات بالترم',
  'plan.saving': 'جاري الحفظ…',
  'plan.saved': 'انحفظ المسار {letter} في جهازك',
  'plan.saved.sub': 'ترجع له متى ما فتحت أرشدني من نفس المتصفح',
  'plan.empty.title': 'نحتاج المتطلبات السابقة عشان نرتّب',
  'plan.empty.body': 'ما أدخلت أي متطلب سابق، فنعتبر كل الـ {n} مقرر متاحة الحين. أضف المتطلبات من خطة قسمك والترتيب يطلع أدق.',
  'plan.empty.primary': 'أضف المتطلبات السابقة',
  'plan.empty.secondary': 'رتّبها بدونها، {max} بالترم',
  'plan.error.save': 'ما انحفظ المسار لأن المتصفح في وضع التصفح الخاص. افتح أرشدني في نافذة عادية واحفظ مرة ثانية.',
  'plan.error.retry': 'جرّب تحفظ المسار {letter} مرة ثانية',
};

export function t(key, vars = {}) {
  const text = STRINGS[key];
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`strings.js: missing key "${key}"`);
    return key;
  }
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in vars)) return match;
    const value = vars[name];
    if (typeof value === 'number') return fmtNumber(value);
    if (LATIN_VARS.has(name)) return LRI + value + PDI;
    if (name === 'name') return FSI + value + PDI;
    return String(value);
  });
}
