# Arshadni (أرشدني) — HANDOFF.md

Design canvas: https://claude.ai/artifact/2pQ2DVCz1ibym3ch2q6Bau (private until shared)
Visual rules: see `DESIGN.md`. Sample data: see `mock.json`.
Anything marked **[?]** is my assumption and needs a decision.

---

## 1. Persona and core task

- **Persona:** A second-year university student, any university and major, at home the night before course registration opens. Their department's study plan PDF is open in one tab and their transcript in another. About 15 minutes. Uses a phone.
- **Core task:** Find out which required courses are still remaining, so they can choose what to register next term.
- **Second task:** See 2–3 suggested routes that all finish in the same number of terms.
- **Feel:** clear, reassuring, organized. **Not:** governmental, cluttered.

## 2. Screens

| # | Screen | Prototype file | Purpose |
|---|---|---|---|
| 1 | أدخل خطتك الدراسية (Enter your plan) | `HiInput.dc.html` | Add required courses: code, name, optional prerequisite. Optional: attach the academic record (transcript PDF) to pre-mark completed courses |
| 2 | علّم المقررات اللي خلصتها (Mark completed) | `HiDone.dc.html` | Tick completed courses from the same list |
| 3 | المتبقي عليك (Remaining) — main screen | `HiRemaining.dc.html` | Big remaining count, tick bar, available vs locked lists |
| 4 | خطة التخرج (Graduation plan) | `HiPlan.dc.html` | 3 paths (A balanced, B heavy first, C light first), each split into terms |

States for each screen: `StatesInput`, `StatesDone`, `StatesRemaining`, `StatesPlan` (empty, loading, error, success, full). Transcript upload states: `StatesUpload` (loading, error, success, full).

> ⚠️ **Scope change:** the PRD's MVP cut "PDF/image transcript reading". The transcript upload was added on the user's request after Phase 8. It is optional: manual entry still works without it. Build it after the manual flow works.

## 3. Happy path (3 navigation taps + data entry)

1. Screen 1: add courses → tap **«التالي: علّم اللي خلصته»**
2. Screen 2: tick completed courses → tap **«اعرض المتبقي (١٤ مقرر)»**
3. Screen 3: read "باقي لك ١٤ مقرر" → tap **«رتّب لي خطة التخرج»**
4. Screen 4: loading → pick path A/B/C → tap **«احفظ المسار أ»** → «انحفظ المسار أ في جهازك»

Back: the right-pointing arrow on screens 2–4 goes one step back. «عدّل مقرراتي» on screen 3 goes to screen 1.

## 4. Unhappy paths

| Screen | Situation | What the user sees | Way out |
|---|---|---|---|
| 1 | First visit, no courses | Empty state, primary disabled «أضف مقرر واحد على الأقل» | Type a course, or paste link |
| 1 | Returning after closing the page | «نرجّع مقرراتك المحفوظة…» + skeleton rows | Automatic |
| 1 | Tap «أضف المقرر» with empty fields | Error under the fields, red borders on the missing field(s) | Fill the field |
| 1 | Code already exists (`CS210` vs `CS 210`) | «CS 210 مضاف قبل باسم «هياكل البيانات». عدّله من القائمة تحت، أو اكتب رمز ثاني.» + existing row highlighted | Edit existing or change code |
| 1 | Very long plan (64 courses) | Search field appears above the list | Search |
| 1 | Transcript is being read | «نقرأ سجلك الأكاديمي…» + file name, primary disabled | Automatic |
| 1 | Transcript is a scanned image | «ما قدرنا نقرأ سجلك» + «الملف صورة ممسوحة، مو PDF فيه نص. نزّل السجل من بوابة الجامعة كـ PDF وارفقه مرة ثانية، أو أدخل مقرراتك يدويًا تحت.» | «ارفق ملف ثاني» or type manually |
| 1 | Transcript read | «لقينا ٢٨ مقرر خلصتها · بتلقاها معلّمة في الخطوة الجاية» | «غيّر الملف» or continue |
| 1 | Transcript has courses not in the plan | «لقينا ٣١ مقرر خلصتها · ٢٨ منها في خطتك، و٣ مو موجودة فيها» + list | «أضف الـ ٣ لخطتك» or «تجاهلها، مو من متطلبات تخصصي» |
| 2 | Arrived with no courses | «ما فيه مقررات تعلّمها للحين» + primary «أضف مقررات خطتك» | Go to screen 1 |
| 2 | Search finds nothing | «ما لقينا «CS 501» في خطتك» + secondary «أضف CS 501 لخطتك» | Add it or fix the search |
| 2 | Everything ticked | «علّمت كل خطتك» note + «اعرض المتبقي (٠ مقرر)» | Continue |
| 2 | 72 courses | Dense tick bar (gap 1px), search «ابحث في ٧٢ مقرر» | Search |
| 3 | 0 remaining | Number «٠», «حسب اللي أدخلته، خلصت خطتك كلها» + advice to confirm with the department | «راجع مقرراتي» |
| 3 | Circular prerequisites | Alert «ما نقدر نرتّب خطتك» naming both courses, «متعارض» badges | «صحّح المتطلب السابق» → screen 1 |
| 3 | Back after editing | Toast «تحدّث المتبقي: صار ١٢ بدل ١٤» | — |
| 3 | First-year student (38 remaining) | Number «٣٨», long lists | Continue to plan |
| 4 | No prerequisites entered at all | «نحتاج المتطلبات السابقة عشان نرتّب» | «أضف المتطلبات السابقة» or «رتّبها بدونها، ٦ بالترم» |
| 4 | Save fails (private browsing / storage blocked) | «ما انحفظ المسار لأن المتصفح في وضع التصفح الخاص…» | «جرّب تحفظ المسار أ مرة ثانية» |
| 4 | Many remaining (38) | «تخلّص تقريبًا في ٧ أترام», 7 tick groups, scrolling term cards | Continue |

## 5. Data (nouns)

| Noun | Fields | Notes |
|---|---|---|
| `Course` | `code` (string, e.g. "CS 210"), `name` (string, Arabic or English), `prerequisites` (array of codes), `completed` (boolean), `addedAt` (timestamp) | One list holds both required and completed courses |
| `StudyPlan` | `major` (string) [?], `courses` (Course[]) | `major` is shown as the header on screen 3 ("علوم الحاسب") but there is no field to enter it yet [?] |
| `Settings` | `maxCoursesPerTerm` (number, default 6) | Editable [?] — no UI for it in this round |
| `Summary` (derived) | `total`, `completed`, `remaining`, `available[]`, `locked[]` | Computed, not stored |
| `GraduationPath` (derived) | `id` (A/B/C), `label`, `strategy` (balanced / heavy-first / light-first), `terms` (array of arrays of codes) | All paths have the same number of terms |
| `SavedPath` | `pathId`, `terms`, `savedAt` | Stored on the device only |
| `TranscriptImport` | `fileName`, `status` (reading / done / failed), `foundCodes[]`, `matchedCodes[]`, `unmatchedCourses[]` ({code, name}), `error` | File itself is not kept after reading [?] |

Storage: device only (browser local storage), no account, no server. Key name and versioning [?].

## 6. Actions (verbs)

| Verb | Where | Input → result |
|---|---|---|
| `addCourse` | Screen 1 | code, name, prerequisite? → new course on top of the list, toast with «تراجع» |
| `undoAdd` | Screen 1 toast | removes the course just added |
| `removeCourse` | Screen 1 (✕ on row) | removes a course |
| `pasteCourseList` [?] | Screen 1 link «عندك القائمة كاملة؟ الصقها مرة وحدة» | Deferred to next round. Format not defined |
| `importTranscript` | Screen 1 card «ارفق سجلك الأكاديمي» | PDF → TranscriptImport; matched courses get `completed: true` |
| `addUnmatchedCourses` / `ignoreUnmatched` | Screen 1 after import | adds the unmatched courses to the plan (completed), or drops them |
| `toggleCompleted` | Screen 2 | flips `completed`, updates tick bar and button count |
| `searchCourses` | Screen 2 (and screen 1 when the list is long) | filters by code or name |
| `computeRemaining` | Screen 3 | builds Summary |
| `generatePaths` | Screen 4 on open | builds 3 GraduationPaths |
| `selectPath` | Screen 4 | switches displayed path |
| `savePath` | Screen 4 | stores SavedPath, shows done state |
| `restoreSession` | App open | loads saved courses and path |

## 7. Rules (from every error, empty and full state)

1. A course needs both `code` and `name`. Prerequisite is optional.
2. Duplicate detection: compare codes after removing spaces and uppercasing (`cs210` = `CS 210`). On duplicate, do not add; show the existing course's name.
3. Store codes normalized for display as uppercase with one space between letters and digits (`CS 210`) [?].
4. A remaining course is **available** if all its prerequisites are completed; otherwise **locked**, showing its first missing prerequisite («بعد CS 210»).
5. If prerequisites form a cycle, stop and show both course codes. Do not generate a plan.
6. If no course has any prerequisite, show the plan empty state; the user may still choose to order with no prerequisites.
7. Each term holds at most `maxCoursesPerTerm` (default 6).
8. A course can only be placed in a term after all its prerequisites' terms.
9. All shown paths must finish in the same number of terms (the minimum possible). If a strategy can't, don't show it [?].
10. Never show a graduation date. Always show «ترتيب مقترح، مو ضمان. راجعه مع مرشدك الأكاديمي.»
11. If remaining = 0, hide «رتّب لي خطة التخرج» and suggest confirming with the department.
12. Show a search field when the list has more than 20 courses [?].
13. If saving to device storage fails, keep the plan on screen and show the save error.
14. Restore saved courses automatically on open.
15. A prerequisite code that is not in the plan (e.g. `ARAB 101`) is treated as… [?] (completed? missing? warn?).
16. Transcript import accepts PDF with a text layer only [?]. A scanned image fails with the scan error; manual entry stays available.
17. Transcript courses are matched to plan courses with the same normalization as rule 2. Matched → `completed: true`. Unmatched → listed for the user to add or ignore; never added silently.
18. Only passed courses in the transcript count as completed [?] (how to read grades like F, W, IP is open).

## 8. State texts

| Key | Arabic text |
|---|---|
| input.title | أدخل خطتك الدراسية |
| input.subtitle | انسخ المقررات من خطة قسمك. المتطلب السابق اختياري، بس يخلّي ترتيب الخطة أدق. |
| input.pasteLink | عندك القائمة كاملة؟ الصقها مرة وحدة |
| input.add | أضف المقرر |
| input.count | أضفت {n} مقرر |
| input.saved | محفوظة في جهازك. لو قفلت الصفحة ترجع لك |
| input.next | التالي: علّم اللي خلصته |
| input.upload | ارفق سجلك الأكاديمي |
| input.upload.sub | ملف PDF من موقع الجامعة، ونعلّم لك اللي خلصته |
| input.upload.reading | نقرأ سجلك الأكاديمي… |
| input.upload.done | لقينا {n} مقرر خلصتها |
| input.upload.done.sub | بتلقاها معلّمة في الخطوة الجاية |
| input.upload.change | غيّر الملف |
| input.upload.error.title | ما قدرنا نقرأ سجلك |
| input.upload.error.scan | الملف صورة ممسوحة، مو PDF فيه نص. نزّل السجل من بوابة الجامعة كـ PDF وارفقه مرة ثانية، أو أدخل مقرراتك يدويًا تحت. |
| input.upload.error.retry | ارفق ملف ثاني |
| input.upload.partial.sub | {matched} منها في خطتك، و{unmatched} مو موجودة فيها |
| input.upload.partial.add | أضف الـ {unmatched} لخطتك |
| input.upload.partial.ignore | تجاهلها، مو من متطلبات تخصصي |
| input.empty.title | ابدأ بأول مقرر من خطة قسمك |
| input.empty.body | افتح خطتك الدراسية من موقع القسم، وانسخ رمز كل مقرر واسمه هنا. أو الصق القائمة كلها من الرابط فوق. |
| input.empty.button | أضف مقرر واحد على الأقل |
| input.loading | نرجّع مقرراتك المحفوظة… |
| input.error.bothEmpty | اكتب رمز المقرر واسمه من خطة قسمك، وبعدها اضغط «أضف المقرر». |
| input.error.noCode | ناقص رمز المقرر، مثل CS 310. |
| input.error.noName | ناقص اسم المقرر. انسخه من خطة قسمك. |
| input.error.duplicate | {code} مضاف قبل باسم «{name}». عدّله من القائمة تحت، أو اكتب رمز ثاني. |
| input.success | انضاف {code} {name} · تراجع |
| done.title | علّم المقررات اللي خلصتها |
| done.count | علّمت {n} من {total} مقرر |
| done.search | ابحث بالرمز أو الاسم |
| done.next | اعرض المتبقي ({n} مقرر) |
| done.empty.title | ما فيه مقررات تعلّمها للحين |
| done.empty.body | أضف مقررات خطتك أول، وبعدها ارجع هنا وعلّم اللي خلصته. |
| done.empty.button | أضف مقررات خطتك |
| done.loading | نجهّز {n} مقرر… |
| done.error.title | ما لقينا «{query}» في خطتك |
| done.error.body | تأكد من الرمز. وإذا المقرر ناقص من خطتك، أضفه وارجع علّمه. |
| done.error.button | أضف {query} لخطتك |
| done.success.title | علّمت كل خطتك |
| done.success.body | حسب اللي أدخلته ما باقي عليك شي. تأكد من القسم إن ما فيه مقررات ناقصة من خطتك. |
| remaining.label | باقي لك |
| remaining.unit | مقرر |
| remaining.ticks | كل شرطة مقرر · خلصت {done} من {total} |
| remaining.available | تقدر تسجّلها الترم الجاي ({n}) |
| remaining.locked | تحتاج متطلب قبلها ({n}) |
| remaining.badge.available | متاح |
| remaining.badge.locked | بعد {code} |
| remaining.plan | رتّب لي خطة التخرج |
| remaining.edit | عدّل مقرراتي |
| remaining.empty.title | حسب اللي أدخلته، خلصت خطتك كلها |
| remaining.empty.body | قبل ما تقدّم على التخرج، تأكد من القسم إن خطتك ما ينقصها مقرر وإن ساعاتك مكتملة. |
| remaining.empty.button | راجع مقرراتي |
| remaining.loading | نحسب اللي باقي لك… |
| remaining.error.title | ما نقدر نرتّب خطتك |
| remaining.error.body | {a} يحتاج {b}، و {b} يحتاج {a}. واحد منهم مكتوب غلط، صحّحه من مقرراتك. |
| remaining.error.badge | متعارض |
| remaining.error.button | صحّح المتطلب السابق |
| remaining.success | تحدّث المتبقي: صار {new} بدل {old} |
| plan.title | تخلّص تقريبًا في {n} أترام |
| plan.sub | حسب اللي أدخلته · حد أقصى {max} مقررات بالترم |
| plan.paths | المسار أ · متوازن / المسار ب · الثقيل أول / المسار ج · الخفيف أول |
| plan.terms | الترم الجاي / الترم اللي بعده / ترم التخرج |
| plan.disclaimer | ترتيب مقترح، مو ضمان. راجعه مع مرشدك الأكاديمي. |
| plan.save | احفظ المسار {letter} |
| plan.loading | جاري ترتيب {n} مقرر… |
| plan.loading.sub | نحسب المتطلبات السابقة وحد {max} مقررات بالترم |
| plan.saving | جاري الحفظ… |
| plan.saved | انحفظ المسار {letter} في جهازك |
| plan.saved.sub | ترجع له متى ما فتحت أرشدني من نفس المتصفح |
| plan.empty.title | نحتاج المتطلبات السابقة عشان نرتّب |
| plan.empty.body | ما أدخلت أي متطلب سابق، فنعتبر كل الـ {n} مقرر متاحة الحين. أضف المتطلبات من خطة قسمك والترتيب يطلع أدق. |
| plan.empty.primary | أضف المتطلبات السابقة |
| plan.empty.secondary | رتّبها بدونها، {max} بالترم |
| plan.error.save | ما انحفظ المسار لأن المتصفح في وضع التصفح الخاص. افتح أرشدني في نافذة عادية واحفظ مرة ثانية. |
| plan.error.retry | جرّب تحفظ المسار {letter} مرة ثانية |

Numbers in `{n}` are shown with Arabic-Indic digits. `{code}` stays Latin.

## 9. Open questions for the backend / logic

1. **Major name** [?]: screen 3 shows the major ("علوم الحاسب") but nothing asks for it. Add an optional field on screen 1, or drop the header?
2. **Paste format** [?]: what does a pasted list look like (one course per line? "CODE - Name"? tab-separated from the department PDF)?
3. **Multiple prerequisites** [?]: screen 1 has one prerequisite field. Do we need more than one per course, or co-requisites?
4. **Missing prerequisite in plan** [?]: if a prerequisite code is not in the list, treat it as completed, missing, or warn?
5. **Path strategies** [?]: exact rules for "balanced", "heavy first", "light first" (by count only, or by credit hours?). Credit hours are not collected now.
6. **Equal term count** [?]: if only one strategy reaches the minimum number of terms, show one path or show others with more terms?
7. **Summer terms** [?]: counted as terms or ignored?
8. **Max per term** [?]: 6 is the default; where does the user change it (no UI yet)?
9. **Storage** [?]: local storage key, schema version, and what happens when the schema changes.
10. **Search threshold** [?]: show search after 20 courses?
11. **Code normalization** [?]: always display as "LETTERS space DIGITS"?
12. **Returning user** [?]: on open with saved data, land on screen 3 (Remaining) instead of screen 1?
13. **Transcript reading** [?]: read the PDF on the device (privacy, no server) or send it to a server? The MVP has no backend.
14. **Transcript formats** [?]: which universities' transcript layouts must work first? Each university's PDF looks different.
15. **Grades** [?]: which grades count as completed (D? Pass? transfer credit? in-progress courses this term)?
16. **Scanned transcripts** [?]: support OCR later, or always ask for a text PDF?

## 10. Prototype limits (not product decisions)

- Each prototype screen keeps its own data; ticking courses on screen 2 does not change the number on screen 3.
- The paste link goes nowhere (deferred, decision 16).
- The plan's paths are hard-coded sample data.

## 11. Decisions log

1. Device: mobile 390px (instead of the PRD's iPad/laptop).
2. Persona: second-year student, night before registration, at home, 15 min. General for all universities and majors.
3. Core task: know what's remaining to choose next term's registration.
4. Flow: 4 screens (enter plan, mark completed, remaining, graduation plan).
5. What breaks: wrong or duplicate code; losing data when closing the page.
6. SEE FIRST: "باقي لك ١٤ مقرر" + tick bar. MAIN ACTION: «رتّب لي خطة التخرج».
7. Plan shows 2–3 paths with the same number of terms, no date, no "shortest" claim.
8. Max 6 courses per term by default, user can change [?].
9. FEEL: clear, reassuring, organized. NOT: governmental, cluttered.
10. "Paste full list" link on screen 1.
11. Remaining split into "available" and "needs a prerequisite".
12. "Save path" button on the plan.
13. Direction: Ink & Paper.
14. Extra tokens `ink-pressed` and `surface`.
15. Screen 3 header = major name (source is open question 1).
16. Paste screen deferred to the next round.
17. Wording: plural of ترم is «أترام» (not «ترمات») everywhere.
18. Screen 1 gets an optional "attach academic record" card (transcript PDF). Contradicts the PRD MVP scope; user chose to add it.
