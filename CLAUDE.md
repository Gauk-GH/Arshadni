# Arshadni

## Overview
Students waste time on slow university sites working out which courses remain before graduation; Arshadni shows what's left and suggested routes to graduate. User: a second-year student on a phone, the night before registration. See PRD.md for scope, HANDOFF.md for screens, states, rules and texts.

## MVP scope
Must stories (demo = story 3):
1. Enter completed courses and degree requirements to find what's still needed.
2. See a clear list of remaining required courses.
3. See a simple suggested order for the remaining courses (never claim it is the shortest path, never show a date).

Screens (HANDOFF.md §2): 1 أدخل خطتك → 2 علّم اللي خلصته → 3 المتبقي → 4 خطة التخرج.
Transcript upload card: build its states, but simulate the reading from mock.json. No real PDF parsing.
Out of scope: every university's catalog, real transcript parsing, connecting to university systems, login/accounts/cloud profiles, guaranteed shortest path or graduation dates, course availability/seats/registration, paste-list screen, English UI, AI features.
Build nothing that is not in HANDOFF.md. If I ask for something out of scope, say so before building it.

## Design
- Read DESIGN.md before any UI work. Use only its tokens, fonts and components.
- Arabic only, `<html lang="ar" dir="rtl">`. CSS logical properties only. No letter-spacing on Arabic.
- Arabic-Indic digits in the UI; course codes stay Latin in `dir="ltr"`.
- All UI text comes from `web/src/lib/strings.js`, copied word for word from HANDOFF.md §8. No hard-coded strings in components. No emoji.
- Tone: friendly Saudi/Gulf dialect, clear, reassuring (as written in HANDOFF.md).

## Stack
| Tech | Why | Version (verified 2026-11-24) |
|---|---|---|
| JavaScript + React | starter; agents know it best | react / react-dom 19.3.1 |
| Vite + @vitejs/plugin-react | starter dev server and build | vite 8.3.8, plugin 6.3.0 |
| Plain CSS, tokens in `web/src/tokens.css` only | no framework to learn | — |
| React Context (one shared store) | one course list shared by 4 screens | built in |
| `localStorage` via `lib/storage.js` | courses stay on the device, no backend | built in |
| Hash routing (`#/input`, `#/done`, `#/remaining`, `#/plan`) | 4 screens, zero packages | built in |
| npm | starter uses it | 11.20.0 (local Node 26.13.1) |

Pin exact versions. If it grows: accounts or cross-device sync, add Supabase. More screens, add React Router. Logic bugs, add Vitest for `lib/`. English, add i18next. AI, a Vercel Function so the key stays off the browser.

## Commands
Run from `web/`:
- Install: `npm install`
- Dev: `npm run dev`
- Dev on phone (same Wi-Fi): `npm run phone`
- Build: `npm run build`
- Preview build: `npm run preview`
- Test / lint: none yet
- Dev-only states: `?state=empty|loading|duplicate|circular|zero|full|firstyear`, `?upload=error|partial` (not in the production build)

## Architecture
Single-page app, no backend: one shared store (Context + localStorage), pure logic in `lib/`, screens in feature folders built from shared components.

## Project structure
```
Arshadni/
├── CLAUDE.md            # this file: rules for AI agents
├── PRD.md               # product scope
├── DESIGN.md            # tokens, fonts, components (source of truth for looks)
├── HANDOFF.md           # screens, states, rules, texts (source of truth for behaviour)
├── mock.json            # sample data from the design
├── design/              # refs/, wireframes.md, mockups/, shots/ (screenshots)
├── example/             # camp example project, read-only reference
├── plain/               # camp plain HTML starter, not used by the app
└── web/                 # the app (Vercel root directory)
    ├── index.html       # <html lang="ar" dir="rtl">, fonts
    └── src/
        ├── components/      # Button, Input, Checkbox, ListItem, Badge, Card, TickBar, Toast...
        ├── features/
        │   ├── input/       # screen 1: enter plan + transcript upload card
        │   ├── done/        # screen 2: mark completed
        │   ├── remaining/   # screen 3: remaining (main screen)
        │   └── plan/        # screen 4: graduation plan
        ├── store/           # shared state (Context) + restore/save
        ├── lib/             # format.js, courses.js, plan.js, storage.js, strings.js, devState.js
        ├── data/            # mock.json (copy of the root one)
        ├── tokens.css       # design tokens, nowhere else
        ├── base.css         # reset + base styles using tokens
        ├── App.jsx          # hash routing
        └── main.jsx         # entry point
```

## Build order
1. Screens on mock data, one at a time, happy-path order; each screen with its HANDOFF states.
2. Logic one feature at a time (available/locked, cycles, paths, save).
3. Simulated transcript upload last, after the manual flow works.

## Deployment
Vercel (Hobby), root directory `web/`. No self-managed servers.

## Working rules for AI agents
- Ask before assuming. Any rule marked [?] in HANDOFF.md: ask me, don't guess. For anything that touches more than a couple of files, plan first and wait for my OK.
- One screen per task. Explain non-obvious decisions in plain words: I am a beginner, name the concept.
- Match existing patterns. Reuse components before making new ones. Clean up what you touch.
- After each screen: screenshot at 390px and 375px, compare with the design, list every difference, fix what you can, then wait for my OK.
- Never install a package version published in the last 7 days.

## Secrets
- No secrets yet. When there are: environment variables only, never with a `VITE_` prefix if secret.
- Never commit .env or .env.local. Keep `.env.example` with names only. Validate env at startup.
- Keep .gitignore thorough and check it before every push.

## Input rules
- `localStorage` data is untrusted: check `schemaVersion` and shape on read; if broken, start fresh.
- Validate every course on add (HANDOFF rules 1–3). Render all text as React text, never `dangerouslySetInnerHTML`.
- Upload accepts PDF only (`accept="application/pdf"`); the file is never kept.
- Prerequisite loops are caught and shown (rule 5), never an endless loop.

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
