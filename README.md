# 西游图志 · 十万八千里

A three.js atlas of *Journey to the West* (《西游记》, 百回本): **45 procedurally generated dioramas** in porcelain
盆景 basins, laid along a meandering road on silk from 花果山 to 灵山, with the Buddha's five fingers standing at the
world's end. Art direction: 青绿山水 × 盆景 — mineral blues and greens, faceted stone, figures drawn by
hierarchical scale (主大从小). Technique after
[stared/invisible-cities-opus-5.5](https://github.com/stared/invisible-cities-opus-5.5).

**Live:** <https://yingyanmhk.github.io/xiyouji-atlas/>

```sh
pnpm install
pnpm dev        # http://127.0.0.1:5199
pnpm build      # static site in dist/ (relative base, deployable under any path)
```

## What is in it
- **45 stations** in the order of the book: 7 of the prologue (大闹天宫), 长安, 36 stations of the road, 灵山.
  Each diorama is built in code from a shared kit (`src/kit.js`) and animated in a calm loop that stages the
  episode's turn (the three strokes of the plantain fan, the ice cracking on 通天河, the gourd that sucks Wukong in…).
- **Seven kinds**, colour-coded on each basin: 前传 · 收徒 · 有来头的（天上下来的妖）· 野妖精 · 人间国 · 仙佛试炼 · 灵山.
- **Side panel** per station: the chapter's 回目, a verified quotation from the original, a note, and the 难 that
  happen there.
- **导览 (tour):** station by station, with a 过场 narration between stations and a slow orbit.
- **九九八十一难:** the 81 tribulations of ch.99 as a 9×9 sheet; click one to fly to its station.
- **昼夜:** a night mode — dusk sky, moon, lit windows and lamps, a darker drone.
- **声:** a generative soundscape — drone, wind and Karplus–Strong plucked strings in the D 五声 pentatonic, with a
  stone chime at night.
- Tilt-shift, bloom, ambient occlusion, a silk-weave grade.

Keys: `←/→` previous/next station · `T` tour · `C` 81 难 · `N` day/night · `M` sound · `H` hide text · `Esc` overview.
Deep link: `/#huoyanshan`. Solo render of one diorama: `/?solo=tongtianhe&view=close&t=12&night=1`.

## Layout
- `src/kit.js` — RNG, noise, palettes (`qinglv`, `fireRock`, `snowRock`), merging `Builder`, roofs/halls/pagodas,
  needle peaks, terrain, pines, clouds, figures (the pilgrims, the horse), soft particles
- `src/world.js` — stage, basins, layout, the golden road, mist, day/night
- `src/post.js` — post-processing; `src/audio.js` — soundscape; `src/ui.js` — overlay
- `src/scenes/<id>.js` — one file per station; `src/data.js` — the stations
- `docs/texts/*.json` — titles, quotes, notes, `nan81.json`, `tour.json`
- `docs/scene-brief.md` — how scenes are built and verified; `docs/HANDOFF.md` — deployment hand-off
- `scripts/shot.mjs`, `scripts/perf.mjs`, `scripts/check-all.mjs` — headless screenshot / FPS / all-scene error check
  (Windows Chrome path; override `CHROME=`)

## A note on the texts
Quotations are from the 百回本 original (public domain) and were checked verbatim against the ctext.org text;
the notes and tour narration are written for this atlas. ch.99 names only eighty 难 — the label of the
eighty-first is marked as ours.

## Known limitations
- Lighting is global: story-night scenes (观音禅院, 金平府, 祭赛国 …) fake darkness with dark materials in day mode.
- 祭赛国's climbing lamp is faked with glow halos rather than a real light (a point light would enter every shader
  in the atlas), so up close its warm spill on neighbouring walls is weak.
- A few dark-by-nature scenes (荆棘岭, 比丘国, 狮驼岭) are dim at night; their silhouettes still read.
- A few compositions take liberties to tell an episode in one picture (异时同图), e.g. the 金毛犼 on the palace
  ridge in 朱紫国, Tang Seng in two moments at 荆棘岭, the goose-cages lifted into the clouds at 比丘国.
- Figures are deliberately simple at close range; the dioramas are designed for the 25–150 unit viewing range.
