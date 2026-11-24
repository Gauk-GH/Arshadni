# Arshadni

## Overview
Students waste time on slow university sites working out which courses remain before graduation; Arshadni shows what's left and a suggested order. User: a university student on iPad or laptop at home. See PRD.md for scope.

## MVP scope
Must stories (demo = story 3):
1. Enter completed courses and degree requirements to find what's still needed.
2. See a clear list of remaining required courses.
3. See a simple suggested order for the remaining courses (only when prerequisites are given; never claim it is the shortest path).

Out of scope: every university's catalog, PDF/image transcript parsing, connecting to university systems, login/accounts/cloud profiles, guaranteed shortest path or graduation dates, course availability/seats/registration.
If I ask for something out of scope, say so before building it.

## Design
- Read DESIGN.md before any UI work (written on day 2). Until it exists, build plain unstyled structure.
- Arabic-first, `dir="rtl"`. English switch from day 1: the switch sets `<html lang dir>` (ar/rtl, en/ltr) in one place (`lib/i18n.js`).
- CSS logical properties only. No letter-spacing on Arabic.
- All UI text lives in `web/src/locales/ar.json` and `en.json`. No hard-coded strings in components.
- Tone: funny, encouraging coach in Saudi/Gulf dialect with light slang ("باقي لك ٤ مواد وتتخرج يا بطل 🎓"). Never mocking, never pushy. Error messages stay clear first, funny second. English copy: same spirit, casual.

## Stack
| Tech | Why | Version (verified 2026-11-24) |
|---|---|---|
| JavaScript + React | starter; agents know it best | react / react-dom 19.3.1 |
| Vite + @vitejs/plugin-react | starter dev server and build | vite 8.3.8, plugin 6.3.0 |
| Plain CSS, tokens in `web/src/tokens.css` only | no framework to learn | — |
| React `useState` + one Context | one course list shared by 3 screens | built in |
| `localStorage` via `lib/storage.js` | courses stay on the device, no backend | built in |
| Hash routing (starter's switch in App.jsx) | 3 screens, zero packages | built in |
| i18next + react-i18next | Arabic/English switch, plurals, RTL/LTR | 27.1.3 / 18.0.2 |
| Vercel Functions (`web/api/`) | keeps the AI key off the browser | Node 22+ runtime |
| @google/genai (Gemini API, free tier, Flash model) | official SDK, good Arabic, no card | 3.4.0; model name: to confirm in AI Studio |
| zod (server only) | validate AI requests and AI answers | 4.6.7 |
| npm | starter uses it | 11.20.0 (local Node 26.13.1) |

Day-1 task: upgrade the starter from React 18 / Vite 5 to the versions above (Vite 5 no longer gets security fixes).
If it grows: accounts or cross-device sync, add Supabase. More than 5 screens, add React Router. Ordering bugs, add Vitest for `lib/planOrder.js`. AI becomes core, use a paid key or another provider.

## Commands
Run from `web/`:
- Install: `npm install`
- Dev: `npm run dev` (frontend only)
- Dev on phone/iPad (same Wi-Fi): `npm run phone`
- Dev with AI functions: `npx vercel dev` (to confirm)
- Build: `npm run build`
- Preview build: `npm run preview`
- Test / lint: none yet

## Architecture
Single-page app with feature folders; the suggested order is plain code (topological sort), and the AI sits only behind two thin Vercel Functions and is never required for the core flow.

## Project structure
```
Arshadni/
├── CLAUDE.md            # this file: rules for AI agents
├── PRD.md               # product scope
├── DESIGN.md            # design memory (day 2)
├── design/              # refs/, wireframes.md, mockups/, shots/
├── example/             # camp example project, read-only reference
├── plain/               # camp plain HTML starter, not used by the app
└── web/                 # the app (Vercel root directory)
    ├── api/             # Vercel Functions: the ONLY server code
    │   ├── parse-courses.js   # free text -> course list (Gemini)
    │   └── explain-plan.js    # plan -> short explanation (Gemini)
    ├── index.html       # <html lang dir>, set by lib/i18n.js
    ├── .env.example     # env var names only
    └── src/
        ├── features/
        │   ├── courses/     # screen 1: enter courses, prerequisites, AI quick entry
        │   ├── remaining/   # screen 2: completed vs remaining
        │   └── plan/        # screen 3: suggested order + AI explanation
        ├── lib/             # format.js, storage.js, planOrder.js, i18n.js, api.js
        ├── locales/         # ar.json, en.json
        ├── data/            # mock.json
        ├── tokens.css       # design tokens, nowhere else
        ├── base.css         # base styles using tokens
        ├── App.jsx          # hash routing + language switch
        └── main.jsx         # entry point
```
The starter's `src/screens/` moves into `features/` as each screen is built.

## Build order
1. Screens on mock data, one at a time (courses, remaining, plan).
2. Data and logic, one feature at a time: `storage.js`, then `planOrder.js`, then the AI functions (quick entry, then explanation).
3. Connect each screen to real data, one at a time. AI last: if time runs out, drop it without breaking the demo.

## Deployment
Vercel (Hobby), root directory `web/`. No self-managed servers. `GEMINI_API_KEY` is set in Vercel project settings.

## Working rules for AI agents
- Ask before assuming. For anything that touches more than a couple of files, plan first and wait for my OK.
- One task at a time. Explain non-obvious decisions in plain words: I am a beginner, name the concept.
- Match existing patterns. Clean up what you touch. Look at the result (screenshot) before saying a UI change is done.
- Never install a package version published in the last 7 days. Pin exact versions.
- The app must work fully with the AI off or out of quota: show a friendly fallback message, never a crash.

## Secrets
- All secrets in environment variables. The Gemini key lives only in `web/api/` code (`process.env.GEMINI_API_KEY`), never with a `VITE_` prefix, never in `src/`.
- Never commit .env or .env.local. Keep `.env.example` with names only.
- Validate env at startup: each function returns a clear 500 if the key is missing.
- Keep .gitignore thorough and check it before every push.

## Input rules
- `localStorage` data is untrusted: validate its shape on read and reset it if it's broken.
- AI functions: zod-validate every request (cap text length and course count) and every AI answer before returning it. Reject anything else with 400.
- Show AI-parsed courses for the student to review and edit before saving.
- Render all text as React text, never `dangerouslySetInnerHTML`, including AI output.
- Tell students to enter course codes and names only, no personal data (the Gemini free tier may use inputs to improve Google's products).
- Prerequisite loops (A needs B, B needs A) are caught and explained, never an endless loop.

<!--
  الصق هذا القسم في آخر CLAUDE.md حقك (أو AGENTS.md لو أداتك Codex أو Cursor).
  لا تستبدل الملف: ملفك فيه قرارات أمس (الـPRD والـstack). هذا قسم يُضاف تحت.
  ما عندك CLAUDE.md أصلًا (ماشي على مثال كورة الخميس)؟ غيّر اسم هذا الملف إلى CLAUDE.md.
-->

## UI rules (Day 2: design first)

- Read `DESIGN.md` before any UI work. Use only its tokens. If something you need is not in
  DESIGN.md, ask me first. Never invent a colour, a font size or a font.
- The frontend lives in `web/` (Vite + React). Tokens live ONLY in `web/src/tokens.css` and mirror
  DESIGN.md. No hex colours and no px font sizes anywhere else.
- When you fill `web/src/tokens.css` from DESIGN.md, delete the `--starter-banner` line.
- Arabic UI, RTL. `dir="rtl"` is set once on `<html>`. Logical CSS properties only
  (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`); never left/right.
  Do not hand-reverse flex rows. No `letter-spacing` and no uppercase on Arabic text.
- English names go in `<bdi>`. Codes with dashes and long numbers go in `<span dir="ltr">`.
  Inputs that take user text get `dir="auto"`.
- Numbers, prices and dates go only through `web/src/lib/format.js` (Intl). The numeral system is
  written in DESIGN.md (default: Arabic-Indic ١٢٣ in the UI, 0-9 only in code; never zero-pad;
  no middle dot (U+00B7) next to a number, use «،»).
- Mock data only, from `web/src/data/mock.json`, until Day 3. No backend, no real API calls.
  Mock data is Arabic and keeps one very long name, one English name and one number-heavy line.
- One screen per task. Do not touch other screens, routing or tokens unless I ask.
- Design files live in `design/`: `refs/` (references + notes.md), `wireframes.md`, `mockups/`, `shots/`.
- Never tell me a UI task is done without a viewport screenshot at 375px wide (and 1280px when I ask),
  compared with the mockup in `design/mockups/`. Save the screenshots in `design/shots/`.
- If the stack in this file is not Vite + React, keep these rules, port them to that stack,
  and ask me before replacing `web/`.
