# HANDOFF — 西游图志: the last step (git + deployment)

You are taking over a finished project for **one remaining step: put it under git and publish it on GitHub
Pages.** Everything else (P0 framework, P1 45 scenes, P2 tour / 81 难 / night / sound / text verification /
scene polish) is done and verified. Please do not refactor or "improve" scenes as part of this step.

## 1. What this is
A static three.js site (Vite 8 + three r187, vanilla JS, no framework, no textures or models — all geometry is
procedural): 45 porcelain-basin dioramas of *Journey to the West* along a meandering road on silk, from
花果山 to 灵山, with a guided tour, a 9×9 sheet of the 81 难, day/night, and a generative guqin soundscape.

```sh
pnpm install            # pnpm 10 (pinned via "packageManager" in package.json), Node ≥ 20 (CI uses 24)
pnpm dev                # http://127.0.0.1:5199  (port is strict)
pnpm build              # → dist/   (base: './', so it works under any sub-path, e.g. /<repo>/)
pnpm preview
```

## 2. The remaining step, concretely
1. **Initialise git** in the project root (`C:\Files\Work\LLM\cc\atlas_3d`). It is *not* a repository yet.
   - Check `.gitignore` first: it excludes `node_modules`, `dist`, `_shots` (≈400 MB of verification
     screenshots — must never be committed) and `*.log`.
   - Commit everything else. Expected tracked content: `index.html`, `package.json`, `pnpm-lock.yaml`,
     `vite.config.js`, `src/**`, `scripts/**`, `docs/**`, `README.md`, `.github/workflows/deploy.yml`, `.gitignore`.
     A quick sanity check: the commit should be a few MB at most; if it is hundreds of MB, `_shots` slipped in.
   - Use branch `main` (the workflow deploys on pushes to `main`).
2. **Create the GitHub repository** (owner/name and public/private: ask the user) and push `main`.
3. **Enable Pages:** repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
   The workflow `.github/workflows/deploy.yml` then builds with `pnpm install --frozen-lockfile && pnpm build`
   and publishes `dist/`. (Both commands were verified locally to pass.)
4. **Verify the live site:** open `https://<owner>.github.io/<repo>/`, wait for 「展 卷」 to enable, click it.
   Check: overview shows 45 basins; `→` flies to 花果山 and the side panel shows title/quote/note;
   `T` starts the tour; `C` opens 九九八十一难; `N` toggles night; `M` toggles sound; `/#huoyanshan` deep-links.
   Fonts are split into unicode-range subsets (dist is ~24 MB but a page load fetches only what it shows).
5. Optionally add the live URL to `README.md` and commit.

Commit messages / PR texts: follow whatever attribution rules the user gives you.

## 3. Where things are (in case the deploy surfaces a problem)
| Path | Role |
|---|---|
| `src/main.js` | renderer, camera, solo-render mode (`?solo=<id>&view=…&t=…&night=1`), atlas app, tour, input, LOD |
| `src/world.js` | stage: silk ground, sky/fog, far ridges, five pillars, basins, layout, golden road, mist, day/night |
| `src/post.js` | GTAO → bloom → tone mapping → grade (tilt-shift, silk weave, vignette) |
| `src/kit.js` | shared builder kit used by every scene (frozen API — scenes depend on it) |
| `src/scenes/<id>.js` | one diorama per station; `_x_*.js` are per-builder helpers; `index.js` lazy registry |
| `src/data.js` | the 45 stations (order, category, chapter range); merges texts from `docs/texts/*.json` |
| `src/ui.js`, `src/style.css`, `index.html` | DOM overlay: opening scroll, panel, toolbar, tour caption, 81 难 sheet |
| `src/audio.js` | Web Audio soundscape (starts on the 展卷 click; `?mute=1` disables) |
| `docs/texts/*.json` | verified texts: `a…e.json`, `pilots.json` (title/quote/note), `nan81.json`, `tour.json` |
| `docs/scene-brief.md` | the contract scene builders worked to (useful if anyone adds scenes later) |
| `scripts/shot.mjs` | headless-Chrome screenshots (`node scripts/shot.mjs <id> <view> <out.png> [t]`, or `app`) |
| `scripts/perf.mjs` | FPS probe of the running dev server (overview / focused) |
| `scripts/check-all.mjs` | loads all 45 scenes solo, day and night, and reports console errors (last run: 0 errors) |

The screenshot scripts hard-code the Windows Chrome path `C:/Program Files/Google/Chrome/Application/chrome.exe`
(override with `CHROME=…`); they are dev tools only and are not used by the build.

## 4. Facts worth knowing
- **Texts:** every 回目 and every quote was checked as an exact substring of the 百回本 (ctext text); notes are
  original prose. The 81st 难 is unnamed in ch.99's list — its label is marked with `*` and a tooltip.
- **Performance:** 60 fps overview and focused at 1600×900 on an Adreno X1-85 (vsync-capped). AO is disabled and
  shadows refresh every 20 frames when the camera is far (`main.js`, "level of detail").
- **Known limitations (accepted, not part of this step):** listed in `README.md` → "Known limitations".
- The reference text used for verification lived outside the project (`../_ref/xyj`); it is not needed to build.
  Likewise `../_p1tools/` (backup copies a polish agent kept) is outside the project and can be ignored.
- **Dev-server caveat:** Vite occasionally served a stale module for a while after a save; `touch <file>` forces a
  reload. Screenshots taken right after an edit may show the old version.
- **Last full verification (before hand-off):** `node scripts/check-all.mjs` → 45 scenes × day/night, 0 errors;
  `node scripts/perf.mjs` → 60 fps overview and focused, day and night; tour advances station by station;
  `pnpm install --frozen-lockfile && pnpm build` passes.
