// universities.js: the universities offered in the «جامعتك» picker on screen 1 (Riyadh).
// `id` is what we save; `name` is what the student sees. Add a line to add a university.
export const UNIVERSITIES = [
  { id: 'ksu', name: 'جامعة الملك سعود' },
  { id: 'imamu', name: 'جامعة الإمام محمد بن سعود الإسلامية' },
  { id: 'pnu', name: 'جامعة الأميرة نورة بنت عبدالرحمن' },
  { id: 'ksau-hs', name: 'جامعة الملك سعود بن عبدالعزيز للعلوم الصحية' },
  { id: 'seu', name: 'الجامعة السعودية الإلكترونية' },
  { id: 'psu', name: 'جامعة الأمير سلطان' },
  { id: 'alfaisal', name: 'جامعة الفيصل' },
  { id: 'yu', name: 'جامعة اليمامة' },
  { id: 'dau', name: 'جامعة دار العلوم' },
  { id: 'riyadh-elm', name: 'جامعة رياض العلم' },
  { id: 'um', name: 'جامعة المعرفة' },
  { id: 'aou', name: 'الجامعة العربية المفتوحة' },
];

export const OTHER_UNIVERSITY = 'other';

export const isKnownUniversity = (id) => id === OTHER_UNIVERSITY || UNIVERSITIES.some((u) => u.id === id);
