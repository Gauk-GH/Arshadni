// features.js: on/off switches for whole features. Change a value here, nowhere else.
//
// FEATURE_TRANSCRIPT: the transcript upload on screen 1 («ارفق سجلك الأكاديمي») and the «سجلك مرفق» line.
// On (HANDOFF decision 35): the PDF is really read, on the device, with pdf.js (lib/transcript.js, lib/pdfText.js).
// Off: the upload card is hidden and manual entry is the only way in (the demo layout of decision 33).
export const FEATURE_TRANSCRIPT = true;
