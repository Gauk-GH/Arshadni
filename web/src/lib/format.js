// format.js: ONE place for numbers shown in the UI. Never build them by hand.
//
// DESIGN.md §9: Arabic-Indic digits (١٢٣) for every number the user reads.
// Course codes are NOT numbers: they stay Latin ("CS 210") and never go through here.
// Never zero-pad (٥ not ٠٥).
export const LOCALE = 'ar-SA-u-nu-arab';

const number = new Intl.NumberFormat(LOCALE, { useGrouping: false });

export const fmtNumber = (n) => number.format(n);
