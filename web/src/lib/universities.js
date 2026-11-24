// universities.js: the universities offered in the «جامعتك» picker on screen 1.
// The biggest universities only (decision 25); everyone else picks «جامعة ثانية».
// `id` is what we save; `name` is what the student sees. Add a line to add a university.
export const UNIVERSITIES = [
  { id: 'ksu', name: 'جامعة الملك سعود' },
  { id: 'imamu', name: 'جامعة الإمام محمد بن سعود الإسلامية' },
  { id: 'pnu', name: 'جامعة الأميرة نورة بنت عبدالرحمن' },
  { id: 'ksau-hs', name: 'جامعة الملك سعود بن عبدالعزيز للعلوم الصحية' },
  { id: 'seu', name: 'الجامعة السعودية الإلكترونية' },
  { id: 'kfupm', name: 'جامعة الملك فهد للبترول والمعادن' }, // in Dhahran; added on request
];

export const OTHER_UNIVERSITY = 'other';

// Ids that were offered before (e.g. 'psu') are no longer known: a saved one falls back to «اختر جامعتك».
export const isKnownUniversity = (id) => id === OTHER_UNIVERSITY || UNIVERSITIES.some((u) => u.id === id);
