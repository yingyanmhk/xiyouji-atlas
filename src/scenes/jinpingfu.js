// 金平府 — Lantern Festival night (元宵) in the snow. On the Golden Lamp Bridge (金灯桥) stand the three
// great lamps, each as big as a water-vat, two storeys of gold filigree and glass, burning fragrant
// oil that costs the town a fortune every year. Crowds throng the frozen canal with hand-lanterns.
// In a 32 s loop the "Buddhas" come down on a wind to take the oil, as the townsfolk believe they
// do every year — but they are three rhinoceros spirits; the lamps gutter, and as they rise again
// they carry off Tang Seng, who had bowed down to them on the bridge.
import { THREE, Builder, M, C, terrain, house, roof, bareTree, figure, fbm, hash2, smooth, clamp, lerp, mix, ease, setInst, softPuffs } from '../kit.js';
import { person, lantern, instanced, nightTint } from './_e_kit.js';

const CYCLE = 32;
const CZ = 0.6, CW = 1.15;        // canal centre line and half width
const DECK = 0.62;                // bridge deck height
const LAMPS = [[-1.9, 0.4], [0, 0.8], [1.9, 0.4]];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const canal = smooth(CW + 0.35, CW, Math.abs(z - CZ));
  return 0.32 + 0.12 * fbm(x * 0.4, z * 0.4, 3) - 0.22 * canal - 0.12 * smooth(9.6, 10.5, r);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const out = new THREE.Color();
  terrain(b, {
    R: 10.5, rings: 40, segs: 130, fn: ground,
    palette: (x, y, z, nx, ny) => {
      if (Math.abs(z - CZ) < CW) return out.set('#9fb3cc');                            // canal ice
      const n = fbm(x * 0.7, z * 0.7, 2);
      const trod = Math.abs(x) < 1.4 && Math.abs(z - CZ) < 5 ? 0.35 : 0;
      return mix('#5c7299', '#43587e', n * 0.6 + trod, out).multiplyScalar(0.95 + 0.1 * hash2(x * 9, z * 9));
    },
  });

  /* the Golden Lamp Bridge: a broad flat deck with stone balustrades */
  b.box(6.8, 0.22, 3.0, { x: 0, y: DECK - 0.22, z: CZ, color: '#8d9bb0', mat: M.stone });
  for (const sx of [-1, 1]) b.box(0.5, DECK, 2.6, { x: sx * 2.4, y: 0, z: CZ, color: '#7c8aa0', mat: M.stone });
  b.box(0.5, DECK, 2.6, { x: 0, y: 0, z: CZ, color: '#7c8aa0', mat: M.stone });
  for (const sz of [-1, 1]) {
    for (let i = -6; i <= 6; i++) b.box(0.08, 0.32, 0.08, { x: i * 0.55, y: DECK, z: CZ + sz * 1.42, color: '#c6cfdb', mat: M.stone });
    b.box(6.7, 0.06, 0.07, { x: 0, y: DECK + 0.28, z: CZ + sz * 1.42, color: '#c6cfdb', mat: M.stone });
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) b.box(1.2, DECK * (1 - i / 4), 0.3, { x: sx * (3.55 + i * 0.3), y: 0.15, z: CZ, ry: Math.PI / 2, color: '#8d9bb0', mat: M.stone });

  /* the three great lamps: a vat of oil, and a two-storey gold-filigree lantern pavilion over it */
  const lampMats = [];
  for (const [lx, lz] of LAMPS) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lamp).multiplyScalar(1.6) });
    lampMats.push(mat);
    b.push({ x: lx, y: DECK, z: lz });
    b.lathe([[0, 0], [0.42, 0], [0.5, 0.2], [0.5, 0.5], [0.44, 0.56], [0, 0.56]], { color: C.goldD, mat: M.metal, seg: 16 });     // the vat
    for (let k = 0; k < 3; k++) {
      const y0 = 0.62 + k * 0.62, w = 0.66 - k * 0.12;
      b.box(w * 0.92, 0.5, w * 0.92, { y: y0, color: '#ffd27a', mat });
      for (const r of [-1, 1]) for (const f of [-0.25, 0, 0.25]) { b.box(0.016, 0.5, 0.016, { x: f * w, z: r * w * 0.47, y: y0, color: C.goldD, mat: M.metal }); b.box(0.016, 0.5, 0.016, { z: f * w, x: r * w * 0.47, y: y0, color: C.goldD, mat: M.metal }); }                                     // glowing glass
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.02, 0.02, 0.5, { x: sx * w / 2, y: y0, z: sz * w / 2, color: C.gold, mat: M.metal, seg: 4 });
      for (const yy of [0, 0.25, 0.5]) b.box(w + 0.04, 0.025, w + 0.04, { y: y0 + yy, color: C.gold, mat: M.metal });
      roof(b, { y: y0 + 0.5, w, d: w, h: 0.16, over: 0.12, lift: 0.08, top: k === 2 ? 1 : 0.5, color: C.gold, ridge: C.goldD, finial: C.gold });
    }
    b.pop();
  }
  // lantern strings across the square
  for (const [x0, z0, x1, z1] of [[-6.5, -2.6, 6.5, -2.6], [-6, 3.8, 6, 3.8], [-4.4, -5.2, 4.4, -5.2]]) {
    const n = Math.floor(Math.hypot(x1 - x0, z1 - z0) / 0.7);
    for (const e of [0, 1]) b.cyl(0.04, 0.05, 2.3, { x: e ? x1 : x0, y: ground(e ? x1 : x0, z0), z: e ? z1 : z0, color: C.woodD, mat: M.wood, seg: 5 });
    for (let i = 1; i < n; i++) {
      const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), y = 2.4 - Math.sin(Math.PI * t) * 0.5;
      lantern(b, { x, y: y + 0.1, z, s: 0.9, glow: 1.6, color: i % 3 ? '#ff7a4a' : '#ffc060', string: false });
    }
  }

  /* the town in the snow, windows lit */
  const wallN = '#8f96a8';
  for (const [x, z, ry, w] of [[-6.6, -4.4, 0.6, 2.0], [-4.0, -6.6, 0.3, 2.2], [-1.2, -7.6, 0, 2.0], [1.8, -7.4, -0.1, 2.2], [4.6, -6.2, -0.4, 2.0], [6.9, -3.8, -0.8, 1.8], [-7.6, 4.2, 2.2, 1.8], [7.4, 4.0, -2.2, 1.8], [-5.4, 6.8, 2.6, 1.8], [5.6, 6.8, -2.6, 1.8]]) {
    house(b, { x, y: ground(x, z) - 0.06, z, ry, w, d: 1.3, h: 1.0, wall: wallN, snow: true, lit: 0.9, r: rng });
  }
  // the lantern hill (鳌山灯): a tiered frame hung with hundreds of little lamps
  {
    const TX = 0.2, TZ = -6.2, TY = ground(TX, TZ) - 0.05;
    let yy = TY, w = 3.2;
    for (let k = 0; k < 6; k++) {
      const h = 1.05 - k * 0.06;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.04, 0.05, h, { x: TX + sx * w / 2, y: yy, z: TZ + sz * w / 2 * 0.6, color: '#5a2a22', mat: M.lacquer, seg: 5 });
      b.box(w + 0.1, 0.07, w * 0.6 + 0.1, { x: TX, y: yy + h, z: TZ, color: '#7a3a2a', mat: M.lacquer });
      roof(b, { x: TX, y: yy + h + 0.05, z: TZ, w, d: w * 0.6, h: 0.22, over: 0.16, lift: 0.1, top: k === 5 ? 1 : 0.35, color: C.snow, ridge: '#c9d2dc' });
      const n = Math.round(w / 0.32);
      for (let i = 0; i <= n; i++) for (const sz of [-1, 1]) lantern(b, { x: TX - w / 2 + (w * i) / n, y: yy + h - 0.02, z: TZ + sz * (w * 0.3 + 0.12), s: 0.55, glow: 1.6, color: (i + k) % 3 ? '#ff7a4a' : '#ffc060', string: false });
      yy += h + 0.1;
      w *= 0.8;
    }
    b.cyl(0.03, 0.04, 0.9, { x: TX, y: yy, z: TZ, color: C.gold, mat: M.metal, seg: 6 });
    b.sphere(0.12, { x: TX, y: yy + 0.95, z: TZ, color: '#ffd27a', mat: M.glow, glow: 1.8 });
  }
  for (const [x, z] of [[-8.4, 0.6], [8.4, -0.6], [-3.6, 7.6], [3.4, 8.2]]) bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.6 + rng() * 0.5, r: rng, snow: true, color: '#2c2a30' });

  /* the crowd on both banks, with hand-lanterns */
  const robes = ['#5a3a48', '#3a4a5e', '#6a4a3a', '#4a5a4a', '#7a3a3a', '#3e3a52'];
  for (let i = 0, k = 0; i < 52 && k < 600; k++) {
    const [x, z] = rng.inDisc(8.2, 1.6);
    if (Math.abs(z - CZ) < CW + 0.4 && Math.abs(x) > 3.2) continue;
    if (Math.abs(z - CZ) < 1.8 && Math.abs(x) < 3.6) continue;
    if (Math.abs(z - CZ) < CW + 0.3) continue;
    if (z < -4.6 || Math.hypot(x, z) > 8.4) continue;
    const ry = Math.atan2(-x, CZ - z) + (rng() - 0.5) * 0.6;
    person(b, { x, y: ground(x, z) - 0.03, z, ry, s: 1.0, robe: rng.pick(robes), robe2: '#b8a890', head: rng() < 0.5 ? 'hat' : (rng() < 0.6 ? 'bun' : 'hood'), hatColor: rng() < 0.5 ? '#2e2a2a' : '#6a5a46', pose: rng() < 0.2 ? 'pray' : 'none' });
    if (rng() < 0.75) {
      const c = Math.cos(ry), s = Math.sin(ry);
      const hx = x + c * 0.14 + s * 0.12, hz = z - s * 0.14 + c * 0.12;
      b.cyl(0.006, 0.006, 0.5, { x: hx, y: ground(x, z) + 0.3, z: hz, rz: 0.3, color: C.woodD, seg: 3 });
      lantern(b, { x: hx + 0.08, y: ground(x, z) + 0.82, z: hz, s: 0.6, glow: 1.7, color: rng.pick(['#ff7a4a', '#ffb050', '#ff5a5a']) });
    }
    i++;
  }
  // the disciples: Wukong (large) on the bridge rail, Bajie and Sha in the crowd
  figure(b, 'wukong', { x: -2.9, y: DECK, z: CZ + 1.15, ry: 0.3, pose: 'gaze', s: 1.7 });
  figure(b, 'bajie', { x: 3.4, y: ground(3.4, 2.7), z: 2.7, ry: -2.4, s: 1.25 });
  figure(b, 'sha', { x: 4.1, y: ground(4.1, 2.4), z: 2.4, ry: -2.2, s: 1.25 });
  object.add(b.build());

  /* Tang Seng, bowing before the lamps — and later carried off */
  const tb = new Builder();
  figure(tb, 'monk', { s: 1.25, pose: 'none' });
  const monk = tb.build();
  const MONK = [0.05, DECK, CZ + 0.95];
  object.add(monk);

  /* the three "Buddhas" (rhinoceros spirits): gilded robes, halos — and a horn on the brow */
  const buddhas = [];
  for (let i = 0; i < 3; i++) {
    const bb = new Builder();
    bb.lathe([[0, 0], [0.22, 0], [0.24, 0.1], [0.16, 0.5], [0.1, 0.62], [0, 0.62]], { color: i === 1 ? '#e0a83a' : '#d29a36', mat: M.cloth, seg: 14 });
    bb.box(0.06, 0.4, 0.26, { x: 0.08, y: 0.22, z: 0.06, rz: 0.4, color: C.cinnabar, mat: M.cloth });
    bb.sphere(0.1, { y: 0.74, color: '#e8c48a', mat: M.smooth });
    bb.sphere(0.06, { y: 0.84, color: '#2a3a5a', mat: M.smooth });                              // 肉髻
    bb.cone(0.022, 0.09, { y: 0.8, z: 0.08, rx: 0.5, color: '#efe6d2', mat: M.smooth, seg: 5 });   // the tell-tale horn
    bb.torus(0.2, 0.012, { y: 0.76, z: -0.08, color: '#ffd27a', mat: M.glow, glow: 1.6, ts: 24, rs: 4 });
    const g = bb.build({ shadows: false });
    g.scale.setScalar(1.8);
    object.add(g);
    buddhas.push(g);
  }
  const WIND = 120, wind = softPuffs(WIND, { color: '#20283a', opacity: 0.45 });
  const FLAKES = 320, flakes = softPuffs(FLAKES, { color: '#ffffff', opacity: 0.9 });
  const GLOW = 9, glow = softPuffs(GLOW, { color: '#ffb84a', opacity: 0.55, additive: true });
  object.add(wind.points, flakes.points, glow.points);
  const wd = Array.from({ length: WIND }, () => ({ ph: rng() * 6.28, r: rng() * 1.6, h: rng(), s: 1 + rng() * 1.8 }));
  const fd = Array.from({ length: FLAKES }, () => { const [x, z] = rng.inDisc(10.2); return { x, z, ph: rng(), sp: 0.04 + rng() * 0.03, s: 0.06 + rng() * 0.07 }; });
  const P0 = [-8.5, 11.5, -5], P1 = [0, 3.4, CZ - 0.6], P2 = [8, 12.5, -6];
  const pos = [0, 0, 0];
  const pathAt = (u) => {
    if (u < 0.45) { const k = ease(clamp((u - 0.28) / 0.17)); for (let j = 0; j < 3; j++) pos[j] = lerp(P0[j], P1[j], k); pos[1] += Math.sin(Math.PI * k) * 1.2; }
    else if (u < 0.6) { for (let j = 0; j < 3; j++) pos[j] = P1[j]; }
    else { const k = ease(clamp((u - 0.6) / 0.16)); for (let j = 0; j < 3; j++) pos[j] = lerp(P1[j], P2[j], k); pos[1] += Math.sin(Math.PI * k) * 1.0; }
    return pos;
  };
  const base = new THREE.Color(C.lamp);

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(flakes, nk, 0.4);
    const u = (t % CYCLE) / CYCLE;
    const here = smooth(0.27, 0.32, u) * (1 - smooth(0.74, 0.78, u));
    const [cx, cy, cz] = pathAt(u);
    for (let i = 0; i < 3; i++) {
      const g = buddhas[i];
      const ox = (i - 1) * 1.9, oz = i === 1 ? 0.4 : 0;
      g.position.set(cx + ox, cy + Math.sin(t * 1.1 + i) * 0.1 + (i === 1 ? 0.25 : 0), cz + oz);
      g.rotation.y = Math.sin(t * 0.4 + i) * 0.15;
      g.visible = here > 0.01;
      g.scale.setScalar(1.8 * Math.max(0.001, here));
    }
    // the dark wind that carries them
    for (let i = 0; i < WIND; i++) {
      const w = wd[i];
      const a = w.ph + t * 1.4;
      wind.set(i, cx + Math.cos(a) * (1.4 + w.r) * 1.6, cy - 0.4 + w.h * 1.4 + Math.sin(a * 0.7) * 0.3, cz + Math.sin(a) * (1 + w.r) * 0.8, w.s, here * (0.55 + 0.45 * Math.sin(w.ph + t)));
    }
    wind.commit();
    // the lamps gutter while the oil is drunk, then are slowly refilled and relit
    const dim = smooth(0.44, 0.56, u) * (1 - smooth(0.8, 0.95, u));
    for (let i = 0; i < 3; i++) {
      const fl = 1 + 0.06 * Math.sin(t * 9 + i * 3);
      lampMats[i].color.copy(base).multiplyScalar((1.6 - 1.3 * dim) * fl);
      const [lx, lz] = LAMPS[i];
      glow.set(i, lx, DECK + 1.0, lz, 2.6 * (1 - 0.7 * dim), 0.75 * fl);
      glow.set(i + 3, lx, DECK + 2.1, lz, 1.4 * (1 - 0.7 * dim), 0.6);
      glow.set(i + 6, lx, DECK + 0.4, lz, 1.6 * (1 - 0.8 * dim), 0.4);
    }
    glow.commit();
    // Tang Seng: bowing, then swept up and away with them
    const seized = u > 0.58 && u < 0.97;
    if (u < 0.6) {
      monk.position.set(MONK[0], MONK[1], MONK[2]);
      monk.rotation.set(Math.max(0, Math.sin(t * 1.3)) * 0.25 * (u > 0.3 ? 1 : 0.4), Math.PI, 0);
      monk.visible = true;
    } else {
      const k = smooth(0.6, 0.64, u);
      monk.position.set(lerp(MONK[0], cx, k), lerp(MONK[1], cy - 0.3, k), lerp(MONK[2], cz + 0.5, k));
      monk.rotation.set(0.6 * k, Math.PI + t * 1.5 * k, 0);
      monk.visible = seized ? here > 0.02 : true;
    }
    if (u > 0.97) { monk.visible = true; monk.position.set(MONK[0], MONK[1], MONK[2]); monk.scale.setScalar(smooth(0.97, 1, u)); } else monk.scale.setScalar(1);
    for (let i = 0; i < FLAKES; i++) {
      const f = fd[i], y = 13 - ((t * f.sp + f.ph) % 1) * 13;
      flakes.set(i, f.x + Math.sin(t * 0.5 + f.ph * 9) * 0.3, y, f.z, f.s, smooth(0, 0.5, y));
    }
    flakes.commit();
  }
  update(0);
  return { object, update };
}
