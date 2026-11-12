# Brief for scene builders (P1)

You are building procedural 3D dioramas for 西游图志, a three.js atlas of *Journey to the West*
(Vite + three r187, pnpm). 45 scenes stand in porcelain basins along a meandering road on silk,
ending at Vulture Peak in front of the Buddha's five fingers.

## Ground rules
- The dev server is ALREADY running at http://127.0.0.1:5199 (hot reload). Do not start another; do not install packages.
- Only create/edit `src/scenes/<id>.js` and optional private helpers `src/scenes/_<yourprefix>_*.js`.
  Never edit `src/kit.js`, `src/main.js`, `src/world.js`, `src/data.js`. If the kit lacks something, build it locally and say so in your report.
- Read first: `src/kit.js`, the three pilots `src/scenes/huaguoshan.js`, `huoyanshan.js`, `tongtianhe.js`, and your scene's row in `src/data.js`.

## Contract
```js
import { THREE, Builder, M, C, terrain, peak, qinglv /* … */ } from '../kit.js';
export default function build({ rng, accent, scene }) {
  const b = new Builder();            // static geometry, merged per material
  const object = new THREE.Group();
  object.add(b.build());
  return { object, update(t, dt) {} }; // t in seconds; keep it a pure function of t where possible
}
```
- `rng` is seeded per scene — never use `Math.random`. `accent` is the category colour (use sparingly).
- y = 0 is the basin floor; footprint radius ≤ 10.5. Typical height 4–14, never above ~17. Nothing below y = 0.
- Budget: ≤ 150k triangles, ≤ 40 draw calls. Use InstancedMesh / `softPuffs` for many small moving things.
- `update` runs only while the scene is visible and near; no allocations in the loop.
- **Day / night.** The atlas has a global night mode (key N). `update(t, dt, env)` receives `env.night` ∈ [0, 1]
  (it eases over ~2.5 s). Lamps, windows and fires may brighten with it (e.g. scale a glow material's colour by
  `1 + env.night`); never use it to change the story. Screenshot at night with `EXTRA="&night=1"`.
  Scenes that are night-time in the story fake darkness with dark materials — check they still read in day mode.

## Kit in one breath
- Terrain & rock: `terrain(b,{fn,palette})` polar heightfield; `peak` (terraced, S-leaning needle peak, returns its top);
  `rock`; palettes `qinglv(h)` (ochre → azurite cliffs, malachite on every sky-facing face), `fireRock`, `snowRock`.
  Palettes take `(x,y,z,nx,ny,nz)` — wrap them to paint roads, water beds etc. (see 火焰山's road).
- Architecture: `roof` (curved hip / pyramidal, upturned corners), `hall` (1–2 tiers, lattice doors, painted beams),
  `pagoda`, `pavilion`, `house` (`snow:true`), `stele` (on a tortoise), `archBridge`.
- Plants: `pine` (pads; `snow:true`), `peachTree`, `bareTree`. Clouds: `cloud` (solid 祥云). Soft particles: `softPuffs` (mist, steam, snow, smoke, motes).
- Figures (~0.7 tall at s=1): `figure(b,'monk'|'wukong'|'bajie'|'sha'|'monkey'|'villager'|'woman',{pose,s})`,
  wukong poses `stand|gaze|staff|fan|none`; `horse({rider:'monk'})`; `staff`.
- Materials `M.*` take vertex colour via `color`; `M.glow` (unlit, × `glow`) blooms — use for lamps, fire, magic only.

## Look
- **青绿山水 in a porcelain 盆景 tray.** Mineral palette `C.*`; faceted stone; silk light, low morning sun, fog to silk.
- **One readable idea per scene**, recognisable at overview distance (~60 px wide): a silhouette from the story
  (the burning crest, the split stone on the needle, the frozen river and its crack). Then detail that rewards close-up.
- **The pilgrims are the cast.** Draw by hierarchical scale (主大从小): the hero of the episode at s 1.5–1.9,
  the others at 1.1–1.3. The demon may be a silhouette, a shadow, a hint (the carp under the ice) — not a monster mesh.
- Animation is calm and looping (12–40 s cycles). If the episode has a turn (fan strokes, ice cracking), stage it as a loop.
- `b.lathe` profiles must run bottom → top (increasing y) or the faces point inward and get culled (the surface turns
  see-through). If a profile has to fold back down, give it a `THREE.DoubleSide` material.
- Debugging flicker: render with `EXTRA="&shadows=0"` and `EXTRA="&ao=0"`; if it survives both, it is z-fighting.
- Avoid: text/characters in 3D, grids of identical boxes, unexplained floating objects, z-fighting (offset ≥ 0.01),
  large glowing areas, everything the same hue, solid ball-clouds for smoke/mist (use `softPuffs`).
- Make your scenes differ from each other and from the pilots in silhouette, palette and composition.

## Verify (mandatory)
```
node scripts/shot.mjs <id> <view> _shots/<you>/<file>.png [t]
```
views `front | side | back | top | close | low | far`; `t` = animation time. Read the PNGs and iterate until the scene is
beautiful from `front`, `side`, `close` and readable from `far`. Fix every console error the script prints.
Full app: `KEYS="eval:__app.focus(<index>)|wait:4000" node scripts/shot.mjs app _shots/<you>/app.png`.

## Report
Per scene: 1–2 sentences on the idea and what you built, anything unsure (story details, kit workarounds). No code.
