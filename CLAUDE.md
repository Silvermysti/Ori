# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ori is a single-page prototype of a pixel-art iOS task + scheduler app whose core idea is
**urgency = temperature**: every task has a "heat" 0–4 (CHILL / EASY / SOON / URGENT / NOW!)
that maps to a warm-earthy color. It is a design/prototype artifact, not a production app.

## Build — Vite (as of Phase 1 of the Android conversion)

This project is being converted into an installable Android app (Vite build → Capacitor
package → Android Studio). **Phase 1 is done:** the old in-browser Babel setup (`Ori.html` +
`@babel/standalone` from a CDN) has been replaced by a real **Vite** build. `Ori.html` is now
legacy and superseded; the live entry point is `index.html` + `main.jsx`.

```bash
npm install        # once, to get dependencies into node_modules/
npm run dev        # dev server with hot reload (prints a localhost URL)
npm run build      # production bundle into dist/
npm run preview    # serve the built dist/ to verify a production build
```

Things that still matter:

- **The `window` registry pattern is KEPT.** Every file still ends with
  `Object.assign(window, { ... })` to publish its components/helpers, and other files read
  them off `window` (e.g. `window.computeHeat`, `window.TaskRow`). When you add a component,
  export it the same way. We did *not* convert these to ES `import`/`export` — only what
  broke under modules was fixed.
- **What Phase 1 changed in each file:** every `.jsx` that uses JSX now starts with
  `import React from "react";` (and `app.jsx` also imports `react-dom/client`). The single
  cross-file *bare* reference, `PixelIcon`, became `window.PixelIcon` in its 7 consumers so
  module scope resolves it via the registry. `data/model.jsx` has no React import (pure logic).
- **Load order lives in `main.jsx`**, not in HTML script tags. It imports the CSS first, then
  every `.jsx` in dependency order: frames → pixel-icons → model → ui → screens → app. A file
  must be imported *after* anything it depends on at module-eval time. `app.jsx` mounts the
  React app at the bottom, so it is imported last.
- **`vite.config.js` sets `base: "./"`** (relative asset paths). This is required so the
  built `dist/` works inside Capacitor's `file://` WebView later. Don't change it to an
  absolute base.

## Verifying changes

Two checks are used in this repo instead of a test suite:

1. **Build it** — Vite will fail loudly on a syntax/import error that the old Babel setup
   would have hidden behind a blank screen:
   ```bash
   npm run build
   ```
2. **Headless screenshot** to confirm it actually renders. Start the preview server, then
   capture it (a long virtual-time budget gives the bundle time to render before capture):
   ```bash
   npm run preview        # serves dist/ at http://localhost:4173/
   google-chrome --headless --disable-gpu --no-sandbox --window-size=1400,900 \
     --screenshot=/tmp/shot.png --virtual-time-budget=18000 http://localhost:4173/
   ```
   Then Read `/tmp/shot.png`.

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
