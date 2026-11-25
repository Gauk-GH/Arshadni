# Arshadni (أرشدني) — DESIGN.md

Direction: **Ink & Paper (حبر وورق)**. Like an academic advisor's notebook: quiet paper, navy ink, one red-pen mark on the thing that matters.
Device: mobile, 390 × 844 px frame. Language: Arabic, `dir="rtl"`, `lang="ar"`.
Boldness is spent in **one place**: the "remaining" number and the 42-tick bar on the Remaining screen. Everything else is calm.

---

## 1. Color tokens

| Token | Hex | Allowed on | Contrast on `paper` |
|---|---|---|---|
| `ink` | `#1F2A44` | Primary text, primary button fill, filled ticks, icons, checked checkbox, selected segment, toast background, badge "متاح" border | 13.1:1 |
| `ink-pressed` | `#121A2E` | Primary button **pressed** only | — |
| `red-pen` | `#D9481F` | The "باقي لك" number (112px) **only**. Never on text under 24px | 3.9:1 (large text only) |
| `paper` | `#F7F5F0` | Background of every screen; text on `ink` | — |
| `surface` | `#FFFFFF` | Inside inputs, cards, segmented control, alert card | — |
| `pencil` | `#5B6170` | Secondary text, captions, input borders (1px), unchecked checkbox border, locked badge (dashed) | 5.7:1 |
| `rule` | `#DDD8CC` | 1px dividers, empty ticks, disabled button fill, card borders. Never on text | — |
| `error-ink` | `#A8361A` | Error text, error input border (2px), alert card border (2px), "متعارض" badge | 6.0:1 |

Derived surfaces (not for text):

| Name | Hex | Used for |
|---|---|---|
| `wash-pressed` | `#EFECE4` | Secondary button pressed, list row pressed, duplicate/new row highlight |
| `wash-new` | `#E9E4D8` | Start color of the "new row" fade (1.2s → transparent) |
| `skeleton` | `#E5E0D3` | Loading skeleton blocks |
| `scrim` | `#1F2A44` at 40% (`rgba(31, 42, 68, .4)`) | **Only** behind the bottom sheet. The one allowed transparency |

No gradients. No shadows. No transparency effects (except `scrim` behind the bottom sheet).

---

## 2. Typography

Fonts (Google Fonts): **Readex Pro** (500, 600) for display and titles, **IBM Plex Sans Arabic** (400, 500, 600) for everything else.

| Role | Font | Size | Weight | Line height | Used for |
|---|---|---|---|---|---|
| Display | Readex Pro | 112px | 600 | 1 | Remaining number only (`red-pen`) |
| Title | Readex Pro | 24px | 600 | 1.4 | Screen titles, the unit word "مقرر" next to the number |
| Body | IBM Plex Sans Arabic | 16px | 400 (600 for buttons, section headings, header title) | 1.5 | Course names, paragraphs, buttons, inputs |
| Caption | IBM Plex Sans Arabic | 13px | 500 (600 for course codes, chips) | 1.5 | Labels, counters, badges, helper and error text |

Rules:
- Only these four sizes.
- `letter-spacing: 0` on all Arabic.
- Course codes are Latin with Latin digits and set `dir="ltr"` (`CS 210`). All other numbers use Arabic-Indic digits (١٢٣).

---

## 3. Spacing (8px grid)

Scale: `8, 16, 24, 32, 48`.

| Where | Value |
|---|---|
| Screen side padding | 24px |
| Header row (back button row) | padding 8px top, 16px sides |
| Between sections | 32px |
| Inside a component | 8px or 16px |
| Gap between list rows | 0 (rows separated by 1px `rule`) |
| Footer | padding 16px top, 24px sides, 32px bottom; 1px `rule` top border |
| Frame gap for tick bar | 3px (large), 2px (small), 16px between term groups |

Touch targets: minimum 48 × 48px. List rows minimum 56px tall.

---

## 4. Radius

| Value | Used on |
|---|---|
| 8px | Buttons, inputs, cards, toast, alert card, segmented control container |
| 4px | Badges, chips, checkbox, segmented control items, highlighted row |
| 2px | Step progress bar |
| 1px | Ticks |
| 50% | **Chain step dots only** (squares would look like checkboxes). Nowhere else |

## 5. Shadows

None. Separation is by 1px `rule` borders only.

---

## 6. Components and their states

### Primary button (one per screen, in the footer)
- Size: height 56px, full width (342px), radius 8px.
- Text: 16px / 600, color `paper`.
- **Default**: background `ink`.
- **Pressed**: background `ink-pressed`, `transform: scale(.98)`, 120ms ease.
- **Loading**: background `ink`, 20px spinner (stroke 2.5px, 0.9s linear rotate) at the start side + text in present progressive ("جاري الحفظ…").
- **Done**: background `ink`, 20px check icon at start side + past tense text ("انحفظ المسار أ في جهازك").
- **Disabled**: background `rule`, text `pencil`. The label says what is missing ("أضف مقرر واحد على الأقل").
- Label always says what will happen: "رتّب لي خطة التخرج", "اعرض المتبقي (١٤ مقرر)", "احفظ المسار أ".

### Upload card (attach academic record)
- Full width (342px), min height 64px, radius 8px, padding 8px 16px, gap 16px, 24px file icon at start.
- Title 16px / 600, sub-line 13px / 500 `pencil`.
- **Idle**: background `surface`, border 1.5px **dashed** `ink`. Whole card is one button. Pressed like a secondary button.
- **Reading**: border 1px `rule`, 24px spinner, «نقرأ سجلك الأكاديمي…» + file name (`dir="ltr"`), `role="status"`.
- **Done**: border 1px `ink`, 24px check, «لقينا {n} مقرر خلصتها» + «غيّر الملف» link at end.
- **Error**: border 2px `error-ink`, title in `error-ink`, body 13px `error-ink`, secondary button «ارفق ملف ثاني», `role="alert"`.
- **Partial**: done style + list of unmatched course rows + secondary «أضف الـ {n} لخطتك» + text link to ignore.

### Choice card (screen 1 start)
- Full width (342px), padding 24px 16px, gap 16px, radius 8px. Whole card is one button.
- Start: 48 × 48px icon tile (radius 8px, background `paper`, 24px icon in `ink`). Middle: optional tag, title 16px / 600, sub 13px / 500 (line height 1.5), 4px apart. End: 20px chevron pointing **left** (forward in RTL).
- **Filled** (recommended choice): background `ink`, text `paper` (title and sub; hierarchy by size and weight, never `rule` on text). Tag: background `paper`, text `ink`, 13px / 600, padding 0 8px, radius 4px. Pressed: `ink-pressed`, `scale(.98)`.
- **Outlined**: background `surface`, border 1.5px `ink`, sub in `pencil`, icon tile with 1px `rule` border. Pressed: `wash-pressed`, `scale(.98)`.
- **Disabled** (HANDOFF decision 34): like a disabled button: background `rule`, title, sub and icon in `pencil`, no press effect.

### Bottom sheet
- Behind: `scrim` over the whole screen; tapping it closes the sheet.
- Sheet: full width (max 390px), background `paper`, radius 8px on the top corners only, padding 8px 24px 32px, gap 16px, max height 90% of the screen (scrolls inside).
- Handle: 40 × 4px, `rule`, radius 2px, centred. Header: title 24px Readex Pro 600 at start, 48px close ✕ (24px icon) at end.
- A toast inside the sheet sits under the header (not floating).
- `role="dialog"`, `aria-modal="true"`; focus moves to the first field, Tab is trapped, Escape / ✕ / scrim close it, focus returns to the button that opened it; the page behind is `inert`.

### Unlock pill («يفتح {n}»)
- A real `<button>` with `aria-expanded` and `aria-controls`. Visible pill 32px tall inside a 48px tap area.
- Pill: 13px / 600, padding 0 8px, gap 4px, radius 4px, border 1px `ink`, 16px chevron down at the end.
- **Open**: background `ink`, text `paper`, chevron up. **Pressed**: `wash-pressed`.

### Expand card (open row)
- The row becomes a card: background `surface`, border 1px `ink`, radius 8px, padding 0 8px 16px, pulled out 8px on both sides, 8px above and below.
- Title line 13px / 600 `ink`. Sub rows: min 48px, code (72px column) + name 16px, 1px `rule` line on top.
- Opens and closes with height + opacity, 200ms; none with reduced motion. Only one card open at a time.
- An opened card scrolls itself into view above the sticky footer.

### Mini ticks
- One tick per course: 20 × 16px, radius 1px, gap 3px, wrapping to the card width.
- **Solid** (`ink`) = unlocked directly. **Dashed** (1.5px dashed `pencil`) = unlocked later.

### Chain steps («الطريق له:»)
- Numbered list. Start: a 24px rail with a 24px **circle** dot (13px / 600 number) and a 2px `rule` line to the next step.
- Step 1 (available now): dot filled `ink`, number `paper`. Middle steps: dot outlined 1.5px `ink`. Last step (the course itself): dot dashed 1.5px `pencil`, number `pencil`, course name 600.
- Text: code 13px / 600 + name 16px, then a 13px caption (when).

### Group header (screen 2, design DoneGroups)
- Group: bottom border 1px `rule`. Header row min 64px, gap 16px.
- Toggle: one `<button aria-expanded aria-controls>` holding prefix (16px / 600, `dir="ltr"`, min 48px column; «مقررات ثانية» is Arabic, no `ltr`), caption «{done} من {total}» (13px / 500 `pencil`) over a 4px bar (track `rule`, fill `ink`, radius 2px, max 120px, fills from the right), and a 20px chevron at the end (down closed, up open).
- Full group: caption «{n} من {n}، كلها مخلّصة» in `ink` 600 with a 16px check icon at the start.
- «علّم الكل» / «شيل الكل»: separate button, visible box 32px (13px / 600, border 1px `ink`, radius 4px, padding 0 8px) inside a 48px tap area. Pressed: `wash-pressed`. Hidden while searching.
- Rows: course rows inside the group, 1px `rule` line on top, indented 16px at the start. Opens and closes like the Expand card (height + opacity, 200ms; none with reduced motion).

### Secondary button (outlined)
- Height 48px, border 1.5px `ink`, background `surface` (or transparent in footer), text 16px / 600 `ink`, radius 8px.
- Optional 20px icon on the start side (e.g. "+" in "أضف المقرر").
- **Pressed**: background `wash-pressed`, `scale(.98)`, 120ms.

### Text link
- 16px / 600 (13px / 500 inside lists), `ink`, underline, `text-underline-offset: 4px`, padding 12px 0 (keeps 44px+ tap height).

### Input
- Height 48px, background `surface`, border 1px `pencil`, radius 8px, padding 0 16px, text 16px `ink`, placeholder `pencil`.
- Label above: 13px / 500, gap 8px.
- **Focus**: border 2px `ink`, no outline.
- **Error**: border 2px `error-ink`, `aria-invalid="true"`, error text below (13px / 500 `error-ink`, 16px alert-circle icon at start side, `role="alert"`).
- Course code inputs: `dir="ltr"`, `text-align: right`.

### Checkbox
- 24 × 24px, radius 4px, `appearance: none`.
- **Unchecked**: border 1.5px `pencil`, background `surface`.
- **Checked**: background and border `ink`, check mark in `paper` (stroke 2.5px).
- **Focus-visible**: outline 2px `ink`, offset 2px.
- Whole row is the label (56px tall).

### List item (course row)
- Min height 56px, gap 16px, bottom border 1px `rule`.
- Order from the start (right): [checkbox] → code (72px column, 13px / 600, `dir="ltr"`) → name (16px, flex 1) → trailing badge or 48px delete button.
- **Pressed** (tappable rows): background `wash-pressed`.
- **New**: background fades from `wash-new` to transparent over 1.2s.
- **Highlighted** (duplicate target): background `wash-pressed`, radius 4px.

### Badge
- 13px / 500, padding 0 8px, radius 4px.
- **متاح**: border 1px `ink`, text `ink`.
- **بعد CS 210** (locked): border 1px dashed `pencil`, text `pencil`.
- **متعارض** (conflict): border 1px `error-ink`, text `error-ink`.

### Chip (course code in a term)
- 13px / 600, padding 4px 8px, background `paper`, border 1px `rule`, radius 4px, `dir="ltr"`.
- Chips wrap in an RTL row; first course is at the right.

### Card (term card)
- On the plan, a term card lists its courses as **rows**, not chips: min height 40px, code (72px column, 13px / 600, `dir="ltr"`) then name 16px, 1px `rule` line on top of each row. Card padding 8px 16px 16px; header row padding 8px 0.
- **Copy («انسخ رموز الترم الجاي ({n})»), first card only:** secondary button (outlined, 48px, 20px copy icon), 8px above.
  - **Done:** the button shows a check + «انسخت {n|code}» and stays tappable (copies again); below it an LTR box with the copied text (background `paper`, border 1px `rule`, radius 4px, padding 8px 16px, 13px / 600, left-aligned, line height 1.6, each code kept on one line), then the caption «الصقها في نظام التسجيل حق جامعتك».
  - **Failed:** the same box with the text selected, and «ما قدرنا ننسخ. اضغط مطوّل على الرموز وانسخها» (13px / 500 `ink`).
  - A new path resets it. The result scrolls into view above the sticky footer.
- **Shape line** under the path picker: 16px bar icon + 13px / 500 `ink`, margin 8px 24px 0.

- Background `surface`, border 1px `rule`, radius 8px, padding 16px, gap 8px.
- Header row: term name 16px / 600 at start, count 13px / 500 `pencil` at end.

### Alert card (blocking error)
- Background `surface`, border 2px `error-ink`, radius 8px, padding 16px.
- Title 16px / 600 `error-ink` with 20px icon, body 13px / 500 `ink`.

### Toast (success)
- Height min 48px, background `ink`, text 13px / 500 `paper`, radius 8px, padding 0 16px, positioned above the footer, `role="status"`.
- 16px check icon at start, optional "تراجع" link at end (600, underline).

### Segmented control (path picker)
- Container: `surface`, border 1px `rule`, radius 8px, padding 4px, 3 equal columns, gap 4px.
- Item: min height 48px (the plan screen, design PlanNames), radius 4px, label 16px / 600 + sub-label 13px / 500.
- **Selected**: background `ink`, text `paper`, `aria-checked="true"`.
- **Unselected**: transparent, text `ink`.

### Tick bar (signature)
- One tick per course. Large: height 28px, gap 3px. Small: height 12px, gap 2px.
- Filled = completed (`ink`), empty = remaining (`rule`). Fills from the right.
- Plan version: remaining ticks as outlines (1.5px `ink`), **20px tall** (design PlanNames), grouped per term, 16px between groups.
- Has `role="img"` and an `aria-label` ("خلصت ٢٨ من ٤٢ مقرر").

### Step indicator
- Caption "الخطوة ١ من ٢" + 4px bar (`rule` track, `ink` fill from right), radius 2px.

### Back button
- 48 × 48px, chevron pointing **right**, stroke 1.75px, at the start (right) of the header. `aria-label` says where it goes ("رجوع للمتبقي").

### Skeleton
- Background `skeleton`, radius 4px, opacity pulse .45 → 1, 1.2s ease-in-out infinite.

### Tab bar (defined, not used this round)
- Height 64px, background `surface`, top border 1px `rule`, 3 items (المتبقي، الخطة، مقرراتي), 24px icon above 13px label. Selected: `ink` 600; others `pencil`.

---

## 7. Motion

| What | Spec |
|---|---|
| Press (buttons, rows) | 120ms ease, `scale(.98)` + darker fill |
| New row | background `wash-new` → transparent, 1.2s ease-out |
| Plan loading | 900ms; 14 empty ticks pulse (1s, 60ms stagger) |
| **Signature**: ticks into terms | Each remaining tick drops in (`translateY(-20px)` → 0, opacity 0 → 1), 450ms `cubic-bezier(.2,.8,.2,1)`, 45ms stagger, starting from the right |
| Term cards | fade + `translateY(8px)` → 0, 400ms, delay 300ms + 120ms per card |
| Save | 700ms loading, then done state |
| Expand card | height + opacity, 200ms ease |
| Bottom sheet | slides up from `translateY(100%)`, 250ms `cubic-bezier(.2,.8,.2,1)` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables all animation and transitions |

---

## 8. Icons

Inline stroke SVG, 24px viewBox, `stroke-linecap: round`. Stroke 1.75px (back), 2px (UI), 2.5–3px (check, spinner). Decorative icons `aria-hidden="true"`. No emoji.

---

## 9. Arabic and RTL rules

- `<html lang="ar" dir="rtl">` on every screen.
- Layout starts from the right. Back arrow at the right, pointing right.
- Progress (step bar, tick bar, plan groups) fills from the right.
- Icons sit on the start (right) side of their label. Trailing actions (delete ✕) sit at the end (left).
- No `letter-spacing` on Arabic.
- Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) for all UI numbers: counts, percentages, term counts.
- Course codes stay Latin (`CS 210`) and are wrapped in `dir="ltr"` / `unicode-bidi: isolate`.
- Not mirrored: check marks, spinners, course codes.
- Use Arabic punctuation: « » for quotes, ، for commas.
- Separate facts with «،», never the middle dot «·»: next to Arabic-Indic digits it looks like the zero «٠».
- Use logical CSS properties (`margin-inline-end`, `justify-content: flex-start`) so RTL is the default.
