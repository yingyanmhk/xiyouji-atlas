// 女儿国 — 西梁女国, the kingdom of women. The 子母河 curls past willows across the front of the tray;
// whoever drinks from it conceives. On the near bank Bajie, thirsty after the crossing, has scooped up
// a bowlful — and his belly swells while Tang Seng clutches his own. Across the water the queen's
// palace in pinks and gold, women officials lining the way and the queen herself on the steps.
// Back left, on 解阳山, the 落胎泉 in its grotto: the only cure, guarded by 如意真仙. Petals drift.
// Loop (24 s): drink — swell — the spring water — and the belly goes down again.
import { THREE, Builder, M, C, terrain, rock, hall, pavilion, roof, pagoda, peachTree, pine, figure, qinglv, fbm, noise2, smooth, clamp, lerp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { pathDist, courtier, wall, group } from './_c_util.js';

const CYCLE = 24;
const WATER = 0.45;
const RIVER = [[-10, 4.6], [-6.5, 5.2], [-3.4, 3.4], [-0.6, 2.4], [2.4, 3.4], [5.4, 5.6], [8.0, 5.2], [10.5, 3.6]];
const SPRING = [-5.2, -4.2];
const PALACE = [3.0, -3.0];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 4, z * 0.3 + 9, 4);
  let h = 0.85 + 0.25 * n;
  const d = pathDist(RIVER, x, z);
  h = lerp(0.12, h, smooth(0.9, 1.9, d));
  h += smooth(4.2, 1.2, Math.hypot(x - SPRING[0], z - SPRING[1])) * (2.6 + n);          // 解阳山
  h += smooth(1, -6, z) * 0.6 * smooth(-2, 2, x);                                      // palace terrace rises
  return h * smooth(10.6, 9.4, r) + 0.12 * (1 - smooth(10.6, 9.4, r));
}

// 柳: a leaning trunk, a few branches arching out, long strands hanging from them
function willow(b, { x, y, z, h = 2.0, r }) {
  const la = r() * Math.PI * 2, lx = Math.cos(la) * 0.25 * h, lz = Math.sin(la) * 0.25 * h;
  const top = [x + lx, y + h * 0.7, z + lz];
  b.tube([[x, y, z], [x + lx * 0.4, y + h * 0.35, z + lz * 0.4], top], (t) => 0.1 * (1 - t * 0.55), { color: '#6a5442', mat: M.wood, radial: 6 });
  const nb = 5;
  for (let k = 0; k < nb; k++) {
    const a = (k / nb) * Math.PI * 2 + r() * 0.6, L = h * (0.35 + r() * 0.2);
    const ex = top[0] + Math.cos(a) * L, ez = top[2] + Math.sin(a) * L, ey = top[1] + h * (0.15 + r() * 0.15);
    const mid = [(top[0] + ex) / 2, ey + h * 0.08, (top[2] + ez) / 2];
    b.tube([top, mid, [ex, ey, ez]], 0.03, { color: '#6a5442', mat: M.wood, radial: 4, segs: 6 });
    b.ico(h * 0.12, { x: mid[0], y: mid[1] + 0.05, z: mid[2], sy: 0.45, color: '#9cc27a', mat: M.flat, detail: 0 });
    for (let j = 0; j < 6; j++) {
      const q = 0.3 + j / 6 * 0.75;
      const sx = lerp(top[0], ex, q) + (r() - 0.5) * 0.1, sz = lerp(top[2], ez, q) + (r() - 0.5) * 0.1, sy0 = lerp(top[1], ey, q) + Math.sin(Math.PI * q) * h * 0.08;
      const Ls = h * (0.35 + r() * 0.45) * (0.6 + q * 0.5);
      b.tube([[sx, sy0, sz], [sx + Math.cos(a) * 0.06, sy0 - Ls * 0.5, sz + Math.sin(a) * 0.06], [sx + Math.cos(a) * 0.1, sy0 - Ls, sz + Math.sin(a) * 0.1]],
        (t) => 0.035 * (1 - t * 0.7), { color: j % 3 ? '#a9cc84' : '#8fba6c', mat: M.cloth, radial: 3, segs: 6 });
    }
  }
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* ground: spring grass and blossom, paths, the river bed */
  const grass = new THREE.Color('#a9c48a'), grassD = new THREE.Color('#8fb07a'), bed = new THREE.Color('#c9a9a0'), path = new THREE.Color('#e8d6bc'), hill = new THREE.Color('#7fa47a');
  const tmp = new THREE.Color();
  const hillPal = qinglv(4.5);
  const PATHS = [[-1.2, 4.6], [0.4, 0.8], [2.4, -0.6], [3.0, -1.6]];
  terrain(b, {
    R: 10.5, rings: 48, segs: 160, fn: ground, palette: (x, y, z, nx, ny) => {
      if (y < WATER + 0.05) return bed;
      if (pathDist(PATHS, x, z) < 0.35) return path;
      tmp.copy(grass).lerp(grassD, noise2(x * 1.1, z * 1.1));
      if (y > 1.3) tmp.lerp(hillPal(x, y, z, nx, ny), smooth(1.3, 2.2, y));
      return tmp;
    },
  });

  /* the queen's palace: pink walls, gold roofs */
  const py = ground(...PALACE) - 0.05;
  hall(b, { x: PALACE[0], y: py, z: PALACE[1], w: 4.2, d: 2.2, h: 1.5, tiers: 2, wall: '#f0c6c4', roofColor: C.tileGold, pillar: '#c94a5a', beam: '#4f86a3', lit: 0.5, r: rng });
  for (const sx of [-1, 1]) hall(b, { x: PALACE[0] + sx * 3.2, y: ground(PALACE[0] + sx * 3.2, PALACE[1] + 0.8) - 0.05, z: PALACE[1] + 0.8, ry: -sx * 0.35, w: 2.0, d: 1.3, h: 1.0, wall: '#f4d6cf', roofColor: C.tileGold, pillar: '#c94a5a', beam: '#4f86a3', r: rng, base: 0.25 });
  pagoda(b, { x: PALACE[0] + 2.2, y: ground(PALACE[0] + 2.2, PALACE[1] - 3.2) - 0.05, z: PALACE[1] - 3.2, levels: 5, w: 1.1, h: 0.75, wall: '#f4dcd4', roofColor: C.tileGold, lit: 0.4, r: rng });
  // the palace wall, low and pink, with a gate on the path
  const WZ = PALACE[1] + 2.6;
  wall(b, PALACE[0] - 5.4, WZ, PALACE[0] - 1.0, WZ, { y: ground(PALACE[0] - 3, WZ) - 0.1, h: 0.7, color: '#eebcb8', tile: C.tileGold });
  wall(b, PALACE[0] + 1.0, WZ, PALACE[0] + 5.6, WZ - 0.4, { y: ground(PALACE[0] + 3, WZ) - 0.1, h: 0.7, color: '#eebcb8', tile: C.tileGold });
  for (const sx of [-1, 1]) b.box(0.3, 1.1, 0.3, { x: PALACE[0] + sx * 0.95, y: ground(PALACE[0], WZ) - 0.1, z: WZ, color: '#c94a5a', mat: M.lacquer });
  roof(b, { x: PALACE[0], y: ground(PALACE[0], WZ) + 1.0, z: WZ, w: 2.2, d: 0.6, h: 0.35, color: C.tileGold });
  // the queen on the steps and her women officials lining the way
  courtier(b, 'queen', { x: PALACE[0], y: py + 0.35, z: PALACE[1] + 1.75, s: 1.45, robe: '#e07a8a' });
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) {
    const x = PALACE[0] + sx * 0.7, z = PALACE[1] + 2.0 + i * 0.6 + (i > 0 ? 0.4 : 0);
    courtier(b, 'princess', { x, y: ground(x, z), z, ry: -sx * Math.PI / 2, s: 1.0, robe: ['#e7a1b0', '#f2c9a0', '#d98aa0', '#f0b8c0'][(i + (sx > 0 ? 1 : 0)) % 4] });
  }
  // pavilions and blossom trees in the gardens
  pavilion(b, { x: -1.6, y: ground(-1.6, -1.2) - 0.05, z: -1.2, w: 1.4, h: 1.2, roofColor: C.tileGold, pillar: '#c94a5a' });
  pavilion(b, { x: 7.4, y: ground(7.4, -1.0) - 0.05, z: -1.0, ry: 0.4, w: 1.2, h: 1.1, roofColor: C.tileGold, pillar: '#c94a5a' });
  for (let i = 0, k = 0; i < 10 && k < 400; k++) {
    const [x, z] = rng.inDisc(9.2, 2);
    if (pathDist(RIVER, x, z) < 2.0 || Math.hypot(x - PALACE[0], z - PALACE[1]) < 3.4 || Math.hypot(x - SPRING[0], z - SPRING[1]) < 3.2 || pathDist(PATHS, x, z) < 0.8 || Math.hypot(x + 1.6, z + 1.2) < 1.4) continue;
    peachTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.2 + rng() * 0.5, r: rng, fruit: 0 }); i++;
  }

  /* 解阳山 with the 落胎泉 grotto */
  const sy = ground(...SPRING);
  rock(b, { x: SPRING[0] - 0.3, y: sy - 0.4, z: SPRING[1] - 0.7, r: 1.6, h: 2.2, rand: rng, palette: qinglv(2.5, { base: sy - 0.4 }) });
  b.push({ x: SPRING[0] + 0.2, y: sy - 0.05, z: SPRING[1] + 0.5, ry: 0.5 });
  { const sh = new THREE.Shape(); sh.moveTo(-0.45, 0); sh.lineTo(-0.45, 0.45); sh.absarc(0, 0.45, 0.45, Math.PI, 0, true); sh.lineTo(0.45, 0); sh.lineTo(-0.45, 0); b.extrude(sh, 0.4, { color: '#3a3430', mat: M.stone }); }
  b.cyl(0.55, 0.6, 0.12, { z: 0.75, color: '#b9b2a2', mat: M.stone, seg: 14 });
  b.cyl(0.46, 0.46, 0.02, { y: 0.11, z: 0.75, color: '#bff0ea', mat: M.glow, glow: 0.9, seg: 14 });   // the spring
  b.pop();
  courtier(b, 'daoist', { x: SPRING[0] + 1.2, y: sy - 0.05, z: SPRING[1] + 0.9, ry: 0.6, s: 1.1, robe: '#5a6a7a' });   // 如意真仙
  for (const [dx, dz] of [[-1.8, 0.6], [1.6, -1.2], [-0.6, -2.0]]) pine(b, { x: SPRING[0] + dx, y: ground(SPRING[0] + dx, SPRING[1] + dz) - 0.05, z: SPRING[1] + dz, h: 1.4 + rng() * 0.6, r: rng });

  /* willows on both banks */
  for (const [x, z] of [[-7.8, 3.6], [-4.8, 6.4], [-2.6, 1.4], [-4.6, 7.6], [4.0, 6.8], [6.6, 3.6], [-8.4, 6.2], [8.4, 6.6]]) {
    if (Math.hypot(x, z) > 9.6) continue;
    willow(b, { x, y: ground(x, z) - 0.05, z, h: 2.0 + rng() * 0.6, r: rng });
  }
  /* the ferry and the ferrywoman, the pilgrims on the near bank */
  b.push({ x: 4.2, y: WATER + 0.02, z: 4.6, ry: 0.9 });
  { const hull = new THREE.Shape(); hull.moveTo(-0.9, 0.2); hull.quadraticCurveTo(-0.7, -0.05, -0.3, -0.06); hull.lineTo(0.4, -0.06); hull.quadraticCurveTo(0.8, -0.05, 1.0, 0.25); hull.lineTo(-0.9, 0.2);
    b.extrude(hull, 0.5, { ry: Math.PI / 2, color: '#8a5a3a', mat: M.wood }); }
  courtier(b, 'princess', { y: 0.12, z: 0.6, s: 0.95, robe: '#c9a07a' });
  b.cyl(0.01, 0.01, 1.4, { y: 0.3, z: 0.8, rx: 0.6, color: C.woodD, mat: M.wood, seg: 4 });
  b.pop();
  const NB = [-0.4, -0.2];
  figure(b, 'wukong', { x: NB[0] - 0.9, y: ground(NB[0] - 0.9, NB[1] + 0.8), z: NB[1] + 0.8, ry: 0.4, s: 1.2, pose: 'staff' });
  figure(b, 'sha', { x: NB[0] + 2.6, y: ground(NB[0] + 2.6, NB[1] + 0.5), z: NB[1] + 0.5, ry: -0.5, s: 1.2 });
  object.add(b.build());

  /* the river: pale jade-pink water */
  const river = new THREE.Mesh(new THREE.CircleGeometry(10.6, 72), new THREE.MeshStandardMaterial({ color: '#6fb0b0', roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.85 }));
  river.rotation.x = -Math.PI / 2; river.position.y = WATER; river.receiveShadow = true;
  object.add(river);

  /* Bajie drinking, his belly swelling; Tang Seng clutching his own */
  const BJ = [-0.1, ground(-0.1, 1.15), 1.15];
  const bajie = new THREE.Group();
  const bjBody = group((bb) => figure(bb, 'bajie', { pose: 'none', s: 1.65 }));
  const belly = group((bb) => bb.sphere(0.17, { color: '#3a3a3e', mat: M.smooth, ws: 16, hs: 12 }));
  belly.position.set(0, 0.34 * 1.65, 0.07 * 1.65);
  const bowl = group((bb) => { bb.lathe([[0, 0], [0.06, 0.005], [0.1, 0.05], [0.11, 0.07]], { color: '#efe7d6', mat: M.porcelain, seg: 12 }); bb.cyl(0.095, 0.095, 0.005, { y: 0.055, color: '#9cc9c4', mat: M.smooth, seg: 12 }); }, { shadows: false });
  bowl.position.set(0, 0.62 * 1.65, 0.3 * 1.65);
  bajie.add(bjBody, belly, bowl);
  bajie.position.set(...BJ); bajie.rotation.y = 0.15;
  object.add(bajie);
  const monk = new THREE.Group();
  monk.add(group((mb) => figure(mb, 'monk', { s: 1.35, pose: 'none' })));
  const mBelly = group((mb) => mb.sphere(0.12, { color: C.cinnabar, mat: M.cloth, ws: 14, hs: 10 }));
  mBelly.position.set(0, 0.26 * 1.35, 0.08 * 1.35);
  monk.add(mBelly);
  monk.position.set(1.2, ground(1.2, 0.9), 0.9); monk.rotation.y = -0.4;
  object.add(monk);

  /* drifting petals, spring mist, sparkles of the 落胎泉 water */
  const PET = 70;
  const pet = softPuffs(PET, { color: '#f6c6cf', opacity: 0.95 });
  object.add(pet.points);
  const pd = Array.from({ length: PET }, () => { const [x, z] = rng.inDisc(9.8); return { x, z, ph: rng(), sp: 0.03 + rng() * 0.03, s: 0.07 + rng() * 0.05 }; });
  const SPK = 20;
  const spk = softPuffs(SPK, { color: '#c8fff4', opacity: 0.9, additive: true });
  object.add(spk.points);
  const MIST = 30;
  const mist = softPuffs(MIST, { color: '#fbeff0', opacity: 0.2 });
  object.add(mist.points);
  const mdd = Array.from({ length: MIST }, (_, i) => { const p = RIVER[i % RIVER.length]; return { x: p[0] * 0.95 + rng.range(-1, 1), z: p[1] + rng.range(-0.6, 0.6), s: 1.4 + rng() * 1.6, ph: rng() * 9 }; });

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(mist, nk);
    nightTint(pet, nk, 0.4);
    const u = (t % CYCLE) / CYCLE;
    // bend to drink (0..0.25), swell (0.2..0.5), the cure (0.72..0.9)
    const drink = smooth(0.02, 0.1, u) * (1 - smooth(0.22, 0.3, u));
    const swell = smooth(0.22, 0.5, u) * (1 - smooth(0.74, 0.9, u));
    bjBody.rotation.x = 0.35 * drink;
    bowl.visible = u < 0.3 || (u > 0.68 && u < 0.78);
    bowl.rotation.x = -0.9 * drink;
    bowl.position.y = (0.62 - 0.1 * drink) * 1.65;
    const bs = 1 + 0.9 * swell + Math.sin(t * 3) * 0.02 * swell;
    belly.scale.set(bs, bs * 0.95, bs * 1.15);
    belly.position.z = (0.07 + 0.08 * swell) * 1.65;
    bajie.position.y = BJ[1] + Math.abs(Math.sin(t * 2.2)) * 0.03 * swell;
    bajie.rotation.z = Math.sin(t * 1.1) * 0.06 * swell;              // waddling
    const ms = 1 + 0.6 * smooth(0.28, 0.55, u) * (1 - smooth(0.76, 0.92, u));
    mBelly.scale.set(ms, ms, ms * 1.2);
    monk.rotation.z = Math.sin(t * 0.9) * 0.04 * (ms - 1);
    for (let i = 0; i < PET; i++) {
      const p = pd[i], y = 9 - ((t * p.sp + p.ph) % 1) * 9;
      pet.set(i, p.x + Math.sin(t * 0.6 + p.ph * 9) * 0.6, y, p.z + Math.cos(t * 0.4 + p.ph * 7) * 0.4, p.s, smooth(0, 0.8, y - WATER));
    }
    pet.commit();
    // the cure: sparkles over the spring and over the bowl
    const cure = smooth(0.66, 0.72, u) * (1 - smooth(0.86, 0.92, u));
    for (let i = 0; i < SPK; i++) {
      const p = (t * 0.4 + i / SPK) % 1, a = i * 2.4;
      const atBowl = i % 2;
      const cx = atBowl ? BJ[0] : SPRING[0] + 0.55, cz = atBowl ? BJ[2] - 0.4 : SPRING[1] + 1.15, cy = atBowl ? BJ[1] + 1.0 : sy + 0.2;
      spk.set(i, cx + Math.cos(a) * 0.3, cy + p * 1.2, cz + Math.sin(a) * 0.3, 0.1 * (1 - p) + 0.03, (atBowl ? cure : 0.6) * Math.sin(Math.PI * p));
    }
    spk.commit();
    for (let i = 0; i < MIST; i++) { const m = mdd[i]; mist.set(i, m.x + Math.sin(t * 0.08 + m.ph) * 0.6, WATER + 0.35, m.z, m.s, 0.5); }
    mist.commit();
  }
  update(0);
  return { object, update };
}
