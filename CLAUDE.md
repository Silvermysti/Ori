# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ori is a single-page prototype of a pixel-art iOS task + scheduler app whose core idea is
**urgency = temperature**: every task has a "heat" 0–4 (CHILL / EASY / SOON / URGENT / NOW!)
that maps to a warm-earthy color. It is a design/prototype artifact, not a production app.

## No build step — in-browser Babel

There is **no bundler, no npm, no package.json**. `Ori.html` loads React 18.3.1 (UMD) and
`@babel/standalone` from a CDN, then loads every `.jsx` file with
`<script type="text/babel" src="...">`. Babel transpiles them in the browser at page load.

Consequences that matter:

- **Must be served over HTTP**, not opened as `file://` (the browser blocks loading the
  `text/babel` scripts otherwise). Run it with:
  ```bash
  python3 -m http.server 7821      # then open http://localhost:7821/Ori.html
  ```
- **No `import`/`export`.** Every file ends with `Object.assign(window, { ... })` to publish
  its components/helpers, and other files read them off `window` (e.g. `window.computeHeat`,
  `window.TaskRow`). When you add a component, export it the same way.
- **Load order is a hand-maintained dependency order** in `Ori.html` (lines ~32–43):
  frames → pixel-icons → model → ui → screens → app. A file must be listed *after* anything
  it depends on at module-eval time.
- **One syntax error blanks the whole app.** Babel compiles all `text/babel` scripts together,
  so a single bad file takes everything down to a white screen. When debugging a blank screen,
  suspect (a) a syntax error in *any* `.jsx`, or (b) a stale browser cache (hard-refresh with
  Ctrl+Shift+R after edits — the dev CDN files and `.jsx` are aggressively cached).

## Verifying changes

Two checks are used in this repo instead of a test suite:

1. **Compile-check a file** with standalone Babel (catches the syntax errors that would blank
   the app) — fetch `babel.min.js` once, then:
   ```bash
   node -e 'const b=require("./babel.min.js"); const fs=require("fs");
     b.transform(fs.readFileSync("screens/today.jsx","utf8"),{presets:["react"]}); console.log("ok")'
   ```
2. **Headless screenshot** to confirm it actually renders (use a long virtual-time budget so
   the CDN + Babel pass finishes before capture):
   ```bash
   google-chrome --headless --disable-gpu --no-sandbox --window-size=1400,900 \
     --screenshot=/tmp/shot.png --virtual-time-budget=18000 http://localhost:7821/Ori.html
   ```
   Then Read `/tmp/shot.png`.

## CDN scripts use SRI integrity hashes

The three CDN `<script>` tags in `Ori.html` carry `integrity="sha384-..."` hashes. If you ever
bump a library version or URL, the hash must be regenerated or the script silently fails to load
(`openssl dgst -sha384 -binary file.js | openssl base64 -A`). Don't change the version without
updating the hash.

## Architecture

- **`data/model.jsx`** — the brain. Holds the mock `SEED` data and *all* domain logic:
  `computeHeat`, `countdown`, `dueBucket`, `dayLoadMins`, plus date/format helpers. Crucially it
  pins a **fixed deterministic "now"**: `NOW = Fri 5 Jun 2026, 2:23pm` (`TODAY` is that date).
  Countdowns and heat are computed against this constant, so the UI is reproducible and most
  screens are hardcoded to "Friday / June 5". If you change time-dependent behavior, change it
  here.
- **Two task types** drive everything:
  - `daily` — recurs every day, resets at midnight; heat rises through the day from `NOW_MIN`
    (and jumps to 4 if a target time `by` is passed).
  - `once` — has a `deadline`; heat is derived from hours remaining. May have a `planDate`
    (scheduled day) or none ("Anytime").
- **`app.jsx`** — the shell: holds `tasks` state and all mutations (toggle/save/del/add/movePlan),
  switches between the four screens by `tab`, and renders the detail push + add sheet. Wraps
  everything in `IOSDevice` (bezel) and a `.ori-root` themed container.
- **`components/ui.jsx`** — shared widgets (`TaskRow`, `Check`, `HeatTag`, `Countdown`,
  `TabBar`, `TopChrome`, `Sheet`, etc.).
- **`components/pixel-icons.jsx`** — icons are ASCII grids of `#`/`.` cells rendered as squares
  (`PixelIcon name=...`), not SVG paths. Add new icons to the `PX_ICONS` map.
- **`screens/`** — `today`, `calendar` (month grid + per-day load vs. `DAILY_CAP`), `deadlines`
  (one-time tasks bucketed by due date), `detail` (editor), `addtask` (quick-add sheet), `you`.
- **`frames/`** — `ios-frame.jsx` (the iOS device chrome) and `tweaks-panel.jsx` (the live
  theme/layout controls). These are vendored "omelette starter" scaffolds marked
  `@ds-adherence-ignore`; treat them as third-party and avoid rewriting them.

## Theming

All color/spacing/typography is CSS custom properties in `styles/ori.css`, switched by
`data-theme` (light/dark), `data-density`, and `data-font` attributes on `.ori-root` (set from
the Tweaks panel via `useTweaks`). Heat colors are `--heat-0`..`--heat-4` (+ `--heat-N-bg`).
Never hardcode hex/oklch in components — reference the vars.

## Design constraints (do not violate)

- **Hot/urgent items must be visually STATIC** — heat is communicated by **color alone**.
  No glow, no pulse, no attention-grabbing animation on high-heat tasks.
- Animations elsewhere should be subtle and quick (tap feedback, screen-enter, bar fill).
  Gate motion behind `@media (prefers-reduced-motion: no-preference)`.
- The week bar chart on the Today screen renders **hollow, filling bottom→top** as a day's
  tasks are ticked; bar color is the day's *intrinsic* max heat (computed with `done:false`) so
  it stays stable while the fill rises.
