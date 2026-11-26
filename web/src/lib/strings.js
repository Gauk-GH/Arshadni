// strings.js: every UI text, copied word for word from HANDOFF.md §8.
// Components never hard-code Arabic text: they call t('key', { vars }).
//
// How {vars} are filled:
// - numbers go through fmtNumber, so they show as Arabic-Indic digits (١٤).
// - course codes and search text ({code}, {query}, {a}, {b}) are wrapped in invisible
//   Unicode "left-to-right isolate" marks, so "CS 210" never flips inside Arabic text.
// - names ({name}) and group prefixes ({prefix}) may be Arabic or English, so they get a
//   "first-strong isolate".
import { fmtNumber } from './format.js';
import { countOf, pluralForm } from './plural.js';

const LRI = '⁦'; // left-to-right isolate
const FSI = '⁨'; // first-strong isolate (direction taken from the text itself)
const PDI = '⁩'; // end of isolate

const LATIN_VARS = new Set(['code', 'query', 'a', 'b']);

const STRINGS = {
  'input.add': 'أضف المقرر',
  'input.next': 'التالي: علّم اللي خلصته',
  // Screen 1 redesign (design NewInput: start · list · add sheet).
  'input.start.title': 'كيف تبي تبدأ؟',
  'input.start.body': 'نحتاج مقررات خطتك عشان نحسب لك وش باقي.',
  'input.start.fastest': 'الأسرع',
  'input.start.manual': 'أدخل مقرراتك بنفسك',
  'input.start.manual.sub': 'انسخها من خطة قسمك، مقرر مقرر',
  'input.start.local': 'كل شي ينحفظ في جهازك بس',
  'input.list.title': 'مقررات خطتك',
  'input.list.count': 'أضفت {n|course}، الأحدث فوق',
  'input.upload.attached': 'سجلك مرفق، لقينا {n|course} خلصتها',
  'input.upload.changeShort': 'غيّر',
  'input.upload.added': 'أضفنا {n|course} خلصتها من سجلك. الحين أضف المقررات اللي باقية عليك من خطة قسمك',
  'input.addOne': 'أضف مقرر',
  'input.sheet.title': 'أضف مقرر',
  'input.sheet.close': 'سكّر',
  'input.success.next': 'انضاف {code} {name}. أضف اللي بعده',
  'input.reset.confirm': 'تمسح كل الـ {n} مقرر؟',
  'input.reset.confirm.one': 'تمسح المقرر الوحيد؟',
  'input.reset.confirm.two': 'تمسح المقررين؟',
  'input.reset.yes': 'امسح',
  'input.reset.no': 'لا',
  'input.reset.done': 'انمسحت كل الـ {n} مقرر',
  'input.reset.done.one': 'انمسح المقرر',
  'input.reset.done.two': 'انمسح المقررين',
  'input.upload': 'ارفق سجلك الأكاديمي',
  'input.upload.sub': 'ملف PDF من موقع الجامعة، ونعلّم لك اللي خلصته',
  'input.upload.reading': 'نقرأ سجلك الأكاديمي…',
  'input.upload.done': 'لقينا {n|course} خلصتها',
  'input.upload.error.title': 'ما قدرنا نقرأ سجلك',
  'input.upload.error.scan': 'الملف صورة ممسوحة، مو PDF فيه نص. نزّل السجل من بوابة الجامعة كـ PDF وارفقه مرة ثانية، أو أدخل مقرراتك يدويًا تحت.',
  'input.upload.error.retry': 'ارفق ملف ثاني',
  'input.upload.error.notTranscript': 'هذا الملف ما يبان إنه سجل أكاديمي. نزّل السجل من بوابة جامعتك',
  'input.upload.error.notPdf': 'هذا الملف مو PDF. ارفق سجلك الأكاديمي كملف PDF، أو أدخل مقرراتك يدويًا.',
  'input.upload.error.tooBig': 'الملف أكبر من {mb} ميقا. ارفق سجلك الأكاديمي من بوابة جامعتك، أو أدخل مقرراتك يدويًا.',
  'input.upload.error.timeout': 'قراءة الملف طوّلت وما كملت. جرّب مرة ثانية، أو أدخل مقرراتك يدويًا.',
  'input.upload.error.generic': 'ما قدرنا نفتح الملف. ارفق ملف ثاني، أو أدخل مقرراتك يدويًا.',
  'input.upload.partial.sub': '{matched} منها في خطتك، و{unmatched} مو موجودة فيها',
  'input.upload.partial.add': 'أضف الـ {n} لخطتك',
  'input.upload.partial.add.one': 'أضفه لخطتك',
  'input.upload.partial.add.two': 'أضف الاثنين لخطتك',
  'input.upload.partial.ignore': 'تجاهلها، مو من متطلبات تخصصي',
  'input.loading': 'نرجّع مقرراتك المحفوظة…',
  'input.error.bothEmpty': 'اكتب رمز المقرر واسمه من خطة قسمك، وبعدها اضغط «أضف المقرر».',
  'input.error.noCode': 'ناقص رمز المقرر، مثل CS 310.',
  'input.error.noName': 'ناقص اسم المقرر. انسخه من خطة قسمك.',
  'input.error.duplicate': '{code} مضاف قبل باسم «{name}». عدّله من القائمة تحت، أو اكتب رمز ثاني.',
  'common.undo': 'تراجع',
  // Labels shown in the design (HiInput, StatesInput) but not in HANDOFF §8, copied word for word.
  'input.field.code': 'رمز المقرر',
  'input.field.pre': 'المتطلب السابق',
  'input.field.name': 'اسم المقرر',
  'input.placeholder.pre': 'اختياري',
  'input.placeholder.name': 'مثال: الخوارزميات',
  'input.row.needs': 'يحتاج {code}',
  'input.row.delete': 'احذف {code}',
  'input.search': 'ابحث في {n|course}',
  // Added on the user's request (not in the design): university picker, sample data, reset.
  'input.university.label': 'جامعتك',
  'input.university.placeholder': 'اختر جامعتك',
  'input.university.other': 'جامعة ثانية',
  'input.university.required': 'اختر جامعتك أول عشان تبدأ',
  'input.sample': 'جرّب ببيانات تجريبية',
  'input.reset': 'امسح كل المقررات وابدأ من جديد',
  // From the design (StepIndicator, DESIGN.md §6), not in HANDOFF §8.
  'common.step': 'الخطوة {n} من {total}',

  // Design-only labels for screen 2 (HiDone, StatesDone), copied word for word.
  'done.back': 'رجوع لإدخال الخطة',
  'done.search.label': 'ابحث في مقرراتك',
  'done.longHint': 'ابحث بدل ما تمرّر',
  'done.next.loading': 'اعرض المتبقي',
  'done.title': 'علّم المقررات اللي خلصتها',
  'done.count': 'علّمت {n} من {total|course}',
  'done.search': 'ابحث بالرمز أو الاسم',
  'done.next': 'اعرض المتبقي ({n|course})',
  'done.empty.title': 'ما فيه مقررات تعلّمها للحين',
  'done.empty.body': 'أضف مقررات خطتك أول، وبعدها ارجع هنا وعلّم اللي خلصته.',
  'done.empty.button': 'أضف مقررات خطتك',
  'done.loading': 'نجهّز {n|course}…',
  'done.error.title': 'ما لقينا «{query}» في خطتك',
  'done.error.body': 'تأكد من الرمز. وإذا المقرر ناقص من خطتك، أضفه وارجع علّمه.',
  'done.error.button': 'أضف {query} لخطتك',
  'done.success.title': 'علّمت كل خطتك',
  'done.success.body': 'حسب اللي أدخلته ما باقي عليك شي. تأكد من القسم إن ما فيه مقررات ناقصة من خطتك.',
  // Groups by code prefix (design DoneGroups, HANDOFF rules 26–31).
  'done.groupedHint': 'مجمّعة حسب الرمز',
  'done.group.count': '{done} من {total}',
  'done.group.full': '{n} من {n}، كلها مخلّصة',
  'done.group.others': 'مقررات ثانية',
  'done.group.markAll': 'علّم الكل',
  'done.group.unmarkAll': 'شيل الكل',
  'done.group.markAll.label': 'علّم كل مقررات {prefix}',
  'done.group.unmarkAll.label': 'شيل العلامة عن كل مقررات {prefix}',
  'done.group.marked': 'علّمت {n|course} في {prefix}',
  'done.group.unmarked': 'شلت العلامة عن {n|course} في {prefix}',
  'done.search.results': '{n|result}',
  'done.group.results': '{n|result} في {prefix}',

  // Design-only labels for screen 3 (HiRemaining, StatesRemaining), copied word for word.
  // The list titles are split from their count because the design styles «(٦)» lighter.
  'remaining.back': 'رجوع لتعليم المقررات',
  'remaining.summary': 'ملخص التقدم',
  'remaining.ticks.label': 'خلصت {done} من {total|course}',
  'remaining.available.title': 'تقدر تسجّلها الترم الجاي',
  'remaining.locked.title': 'تحتاج متطلب قبلها',
  'common.count': '({n})',
  // «يفتح لك» (design Unlocks: list · open · chain).
  'remaining.available.sorted': 'مرتبة حسب كم مقرر تفتح لك',
  'remaining.unlocks': 'يفتح {n}',
  'remaining.unlocks.most': 'يفتح أكثر شي',
  'remaining.unlocks.title': 'إذا خلصته، تقدر تسجّل الترم اللي بعده:',
  'remaining.unlocks.later': 'و{n} ثانية بعدها: {codes}',
  'remaining.chain.title': 'الطريق له:',
  'remaining.chain.now': 'متاح الحين',
  'remaining.chain.next': 'الترم اللي بعده',
  'remaining.chain.after': 'أقرب وقت: بعد {n|term}',
  'remaining.label': 'باقي لك',
  'remaining.unit': '{n|courseWord}',
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
  'remaining.transcriptOnly.done': 'خلصت {n|course}',
  'remaining.transcriptOnly.title': 'أضف المقررات اللي باقية عليك عشان نحسب لك',
  'remaining.transcriptOnly.button': 'أضف المقررات الباقية',
  'remaining.loading': 'نحسب اللي باقي لك…',
  'remaining.error.title': 'ما نقدر نرتّب خطتك',
  'remaining.error.body': '{a} يحتاج {b}، و {b} يحتاج {a}. واحد منهم مكتوب غلط، صحّحه من مقرراتك.',
  'remaining.error.bodyLong': 'هذي المقررات تحتاج بعض في دايرة: {chain}. واحد من متطلباتها مكتوب غلط، صحّحه من مقرراتك.',
  'remaining.firstYearHint': 'الخطة تقسمها لك على أترام',
  'remaining.error.badge': 'متعارض',
  'remaining.error.button': 'صحّح المتطلب السابق',
  'remaining.success': 'تحدّث المتبقي: صار {new} بدل {old}',
  'dev.state': 'وضع تجربة، ما ينحفظ شي', // dev only, shown while ?state= is in the address
  'remaining.storage.broken.title': 'ما قدرنا نقرأ مقرراتك المحفوظة',
  'remaining.storage.broken.body': 'فيه خلل في البيانات المحفوظة بجهازك. أضف مقرراتك من جديد، وبياناتك القديمة محفوظة كنسخة احتياطية.',
  'remaining.storage.blocked.title': 'المتصفح ما يسمح لنا نحفظ مقرراتك',
  'remaining.storage.blocked.body': 'ممكن لأنك في وضع التصفح الخاص. افتح أرشدني في نافذة عادية عشان ما تضيع مقرراتك لما تقفل الصفحة.',

  // Design-only labels for screen 4 (HiPlan, StatesPlan), copied word for word.
  'plan.back': 'رجوع للمتبقي',
  'plan.header': 'خطة التخرج',
  'plan.pick': 'اختر مسار',
  // Middle terms in long plans (design: «الترم الثالث»، «الترم الرابع»).
  'plan.term.3': 'الترم الثالث',
  'plan.term.4': 'الترم الرابع',
  'plan.term.5': 'الترم الخامس',
  'plan.term.6': 'الترم السادس',
  'plan.term.7': 'الترم السابع',
  'plan.term.8': 'الترم الثامن',
  'plan.term.9': 'الترم التاسع',
  'plan.term.10': 'الترم العاشر',
  'plan.term.n': 'الترم {n}',
  'plan.term.count': '{n|course}',
  // Course names + copy (design PlanNames).
  'plan.shape.balanced': 'متوازن: {counts}',
  'plan.shape.heavy': 'أول ترم أثقل ({first})، وآخر ترم أخف ({last})',
  'plan.shape.light': 'تبدأ خفيف ({first}) وتزيد بعدين',
  'plan.copy': 'انسخ رموز الترم الجاي ({n})',
  'plan.copy.done': 'انسخت {n|code}',
  'plan.copy.hint': 'الصقها في نظام التسجيل حق جامعتك',
  'plan.copy.failed': 'ما قدرنا ننسخ. اضغط مطوّل على الرموز وانسخها',
  'plan.title': 'تخلّص تقريبًا في {n|term}',
  'plan.sub': 'حسب اللي أدخلته، حد أقصى {max|course} بالترم',
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
  'plan.loading': 'جاري ترتيب {n|course}…',
  'plan.loading.sub': 'نحسب المتطلبات السابقة وحد {max|course} بالترم',
  'plan.saving': 'جاري الحفظ…',
  'plan.saved': 'انحفظ المسار {letter} في جهازك',
  'plan.saved.sub': 'ترجع له متى ما فتحت أرشدني من نفس المتصفح',
  'plan.empty.title': 'نحتاج المتطلبات السابقة عشان نرتّب',
  'plan.empty.body': 'ما أدخلت أي متطلب سابق، فنعتبر كل الـ {n} مقرر متاحة الحين. أضف المتطلبات من خطة قسمك والترتيب يطلع أدق.',
  'plan.empty.body.one': 'ما أدخلت أي متطلب سابق، فنعتبر المقرر الوحيد متاح الحين. أضف المتطلبات من خطة قسمك والترتيب يطلع أدق.',
  'plan.empty.body.two': 'ما أدخلت أي متطلب سابق، فنعتبر المقررين متاحين الحين. أضف المتطلبات من خطة قسمك والترتيب يطلع أدق.',
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
  // {n|course}: a count with the right Arabic noun form (lib/plural.js).
  return text.replace(/\{(\w+)\|(\w+)\}/g, (match, name, noun) => (name in vars ? countOf(vars[name], noun) : match))
    .replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in vars)) return match;
    const value = vars[name];
    if (typeof value === 'number') return fmtNumber(value);
    // A list of course codes: each code isolated; {chain} joined with « ← », {codes} with «، ».
    if (Array.isArray(value)) return value.map((code) => LRI + code + PDI).join(name === 'chain' ? ' ← ' : '، ');
    if (LATIN_VARS.has(name)) return LRI + value + PDI;
    // {prefix} is Latin («CS») or Arabic («مقررات ثانية»), so it also takes its direction from itself.
    if (name === 'name' || name === 'prefix') return FSI + value + PDI;
    return String(value);
  });
}

// tn(): like t(), for sentences whose wording changes with a count («كل الـ {n} مقرر»).
// Uses key.one for 1 and key.two for 2 when they exist (HANDOFF rule 25); {n} is always filled.
export function tn(key, n, vars = {}) {
  const form = pluralForm(n);
  const variant = form === 0 ? `${key}.one` : form === 1 ? `${key}.two` : null;
  return t(variant && variant in STRINGS ? variant : key, { n, ...vars });
}
