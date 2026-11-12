// 斜月三星洞 — 灵台方寸山. Behind a pine courtyard a slanted crescent of rock (斜月) rises from the
// mountain, three star-lamps (三星) above it: hook and three dots, the riddle of the word 心.
// Before the cave gate the Patriarch Subhuti lectures from a terraced dais to rows of disciples;
// the stone monkey sits among them and, when the Way strikes him, cannot help dancing for joy
// (抓耳挠腮，手之舞之，足之蹈之).
import { THREE, Builder, M, C, terrain, peak, pine, rock, stele, cloud, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { nightDim } from './_c_util.js';
import { monkeyKing, monkeyArm, daoist, sage, crane, censer, tinted, rockTube, bamboo } from './_a_figs.js';

const COURT = 0.62;
const CYCLE = 16;

const CLIFF = [[0, '#8a8478'], [0.18, '#5f6a74'], [0.45, '#3c5a76'], [0.75, '#2a4466'], [1, '#1d3150']];
const LEDGE = [[0, '#86a88a'], [0.3, '#6f9f88'], [0.65, '#4f8c78'], [1, '#3a7466']];
const MOON_CLIFF = [[0, '#7f8c8c'], [0.35, '#aab8b2'], [0.75, '#d4dbd0'], [1, '#eef0e4']];
const MOON_LEDGE = [[0, '#9fc4b2'], [0.6, '#b7d6c4'], [1, '#d6e8dc']];
const pal = (h, base = 0) => tinted(h, { base, cliff: CLIFF, ledge: LEDGE });

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 3, z * 0.3 + 8, 4);
  let h = 0.35 + 0.35 * n;
  h += smooth(5.2, 9.2, r) * (1.2 + 3.2 * n) * (0.25 + 0.75 * smooth(3, -4, z));    // ring of hills, higher behind
  h += 3.4 * Math.exp(-((x / 3.4) ** 2 + ((z + 5.4) / 2.0) ** 2));                     // mound under the crescent
  const court = Math.exp(-((x / 4.6) ** 6 + ((z - 0.6) / 3.6) ** 6));                    // flatten the courtyard
  h = lerp(h, COURT - 0.02, court);
  return Math.max(0.08, h * smooth(10.6, 9.4, r) + 0.1 * (1 - smooth(10.6, 9.4, r)));
}
const pathD = (x, z) => (z > 3.6 && Math.abs(x + 0.4 * Math.sin(z * 0.6)) < 0.55 ? 1 : 0);

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const gp = pal(5.5), pathC = new THREE.Color('#c9c2ae');
  terrain(b, { R: 10.5, rings: 44, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => (pathD(x, z) ? pathC : gp(x, y, z, nx, ny, nz)) });

  /* the slanted moon: a crescent of rock standing on the mound */
  const MC = [0, 8.0, -5.4], MR = 4.5, SLANT = -0.3;
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const a = THREE.MathUtils.degToRad(lerp(160, 380, i / 24));
    arc.push([Math.cos(a) * MR, Math.sin(a) * MR, 0]);
  }
  rockTube(b, arc, (t) => 0.05 + 1.15 * Math.pow(Math.sin(Math.PI * t), 1.4), { x: MC[0], y: MC[1], z: MC[2], rz: SLANT, sz: 0.7, segs: 72, radial: 10, rand: rng, palette: tinted(9, { base: 3, cliff: MOON_CLIFF, ledge: MOON_LEDGE, shade: 0.9 }) });
  const horn = (deg) => {
    const a = THREE.MathUtils.degToRad(deg), px = Math.cos(a) * MR, py = Math.sin(a) * MR;
    return [MC[0] + px * Math.cos(SLANT) - py * Math.sin(SLANT), MC[1] + px * Math.sin(SLANT) + py * Math.cos(SLANT), MC[2]];
  };
  // pines clinging to the crescent's back
  for (const d of [212, 250, 300, 334]) {
    const [hx, hy, hz] = horn(d);
    pine(b, { x: hx, y: hy + (d > 240 && d < 310 ? 0.9 : 0.5), z: hz + 0.1, h: 1.0 + rng() * 0.5, r: rng, lean: 0.35, color: '#2c5a48' });
  }

  /* peaks behind and around the hollow */
  const peaks = [[0.2, -8.2, 1.2, 9.6, 0.04], [-4.6, -7.4, 1.3, 7.2, 0.1], [4.8, -7.2, 1.2, 6.6, 0.12], [-7.4, -3.6, 1.1, 5.2, 0.15], [7.3, -3.2, 1.0, 4.6, 0.16], [-7.6, 1.6, 0.8, 3.2, 0.2], [7.4, 2.2, 0.75, 2.8, 0.2]];
  const tops = peaks.map(([x, z, r, h, lean]) => { const y = ground(x, z) - 0.3; return peak(b, { x, y, z, r, h, lean, rand: rng, palette: pal(h, y) }); });
  for (const i of [1, 2, 3, 4]) { const [x, y, z] = tops[i]; pine(b, { x, y: y - 0.2, z, h: 1.1 + rng() * 0.4, r: rng, lean: 0.3, color: '#2c5a48' }); }

  /* the cave: gate in the mound beneath the moon */
  const GZ = -3.4;
  // a cliff face cut into the mound, with an arched cave door glowing within
  rock(b, { x: 0, y: COURT + 0.15, z: GZ - 0.9, r: 2.3, h: 3.2, rand: rng, palette: pal(4, COURT) });
  rock(b, { x: -1.9, y: COURT - 0.3, z: GZ - 0.4, r: 1.1, h: 2.0, rand: rng, palette: pal(3, COURT) });
  rock(b, { x: 2.0, y: COURT - 0.3, z: GZ - 0.5, r: 1.2, h: 1.8, rand: rng, palette: pal(3, COURT) });
  b.box(2.0, 0.08, 1.0, { x: 0, y: COURT, z: GZ + 0.75, color: '#bdb6a2' });
  b.box(1.9, 1.5, 1.4, { x: 0, y: COURT, z: GZ + 0.1, color: '#1c222c', mat: M.stone });
  b.cyl(0.95, 0.95, 1.4, { x: 0, y: COURT + 1.5, z: GZ + 0.8, rx: -Math.PI / 2, color: '#1c222c', seg: 18 });
  b.box(1.1, 1.45, 0.04, { x: 0, y: COURT + 0.02, z: GZ + 0.83, color: '#ffc879', mat: M.glow, glow: 1.0 });
  b.cyl(0.55, 0.55, 0.04, { x: 0, y: COURT + 1.47, z: GZ + 0.81, rx: -Math.PI / 2, color: '#ffc879', mat: M.glow, glow: 1.0, seg: 16 });
  b.torus(0.95, 0.12, { x: 0, y: COURT + 1.5, z: GZ + 0.84, arc: Math.PI, color: '#9fb5aa', mat: M.flat, rs: 5, ts: 14 });
  for (const sx of [-1, 1]) {
    b.box(0.24, 1.5, 0.26, { x: sx * 0.95, y: COURT, z: GZ + 0.84, color: '#9fb5aa', mat: M.flat });
    b.box(0.5, 1.4, 0.06, { x: sx * 0.75, y: COURT, z: GZ + 1.1, ry: sx * 1.2, color: '#5a4a3a', mat: M.wood });   // door leaves open
  }
  // the tall stele beside the gate (崖头立一石碑)
  stele(b, { x: -2.6, y: COURT, z: -2.7, ry: 0.35, h: 2.4, w: 0.7, turtle: false, color: '#7d8383' });

  /* courtyard paving, steps down to the path */
  b.box(9.2, 0.06, 7.0, { x: 0, y: COURT - 0.03, z: 0.4, color: '#c7c3b3', mat: M.stone });
  for (let i = 0; i < 9; i++) b.box(8.9 - (i % 2) * 0.2, 0.012, 0.03, { x: 0, y: COURT + 0.03, z: -2.8 + i * 0.8, color: '#a9a595' });
  for (let i = 0; i < 4; i++) b.box(1.4, 0.16, 0.34, { x: 0, y: COURT - 0.18 - i * 0.12, z: 4.0 + i * 0.34, color: '#bdb6a2' });

  /* the dais 讲坛 */
  const DZ = -1.5;
  const tiers = [[1.7, 0.22, '#d8d2c0'], [1.35, 0.22, '#8fbfa6'], [1.0, 0.24, '#d8d2c0']];
  let dy = COURT;
  for (const [r, h, c] of tiers) { b.cyl(r, r * 1.04, h, { x: 0, y: dy, z: DZ, seg: 8, color: c, mat: M.stone }); b.cyl(r * 1.025, r * 1.025, 0.035, { x: 0, y: dy + h * 0.45, z: DZ, seg: 8, color: '#3c5a76', mat: M.lacquer }); dy += h; }
  for (let i = 0; i < 3; i++) b.box(0.8, 0.22 * (3 - i), 0.24, { x: 0, y: COURT, z: DZ + 1.75 + i * 0.24 - 0.24, color: '#d8d2c0' });
  const SEAT = dy;
  sage(b, { x: 0, y: SEAT, z: DZ - 0.05, s: 1.7, color: '#2f4d6a', trim: '#e8e2cf' });
  censer(b, { x: 0, y: COURT, z: 1.0, s: 1.4 });

  /* the disciples: three rows kneeling before the dais, attendants standing at the sides */
  const db = new Builder();
  daoist(db, { kneel: true, color: '#56687a', sash: '#c9c2ae' });
  const spots = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.95 + (row % 2) * 0.3, z = 1.75 + row * 0.85;
    if (row === 1 && i === 4) continue;                 // Wukong's place
    spots.push([x, COURT, z, Math.PI + (rng() - 0.5) * 0.15, 1.1, row]);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) spots.push([sx * (2.4 + (i % 2) * 0.5), COURT, -1.9 + i * 0.6, sx * -Math.PI / 2 + (rng() - 0.5) * 0.2, 1.15, -1]);
  const kneelGeo = db.merged();
  const sb = new Builder();
  daoist(sb, { color: '#4a5d70', sash: '#9fc4b2' });
  const standGeo = sb.merged();
  const kneelers = spots.filter((p) => p[5] >= 0), standers = spots.filter((p) => p[5] < 0);
  const km = new THREE.InstancedMesh(kneelGeo, M.cloth, kneelers.length);
  const sm = new THREE.InstancedMesh(standGeo, M.cloth, standers.length);
  kneelers.forEach((p, i) => setInst(km, i, p[0], p[1], p[2], p[3], p[4]));
  standers.forEach((p, i) => setInst(sm, i, p[0], p[1], p[2], p[3], p[4]));
  km.castShadow = sm.castShadow = true; km.receiveShadow = sm.receiveShadow = true;
  object.add(km, sm);

  /* pines, bamboo, rocks, cranes around the courtyard */
  for (const [x, z, h] of [[-4.2, -1.8, 2.6], [4.3, -1.2, 2.4], [-4.6, 2.6, 2.2], [4.8, 3.0, 2.5], [-2.0, 5.6, 1.9], [1.8, 6.4, 2.1], [-6.0, 5.0, 1.8], [6.2, 5.6, 1.7]]) {
    pine(b, { x, y: ground(x, z) - 0.05, z, h, r: rng, lean: 0.3, color: '#2e5a46' });
  }
  for (const [x, z] of [[-3.7, -2.9], [3.6, -2.7], [5.6, 0.6], [-5.6, 0.2]]) bamboo(b, { x, y: ground(x, z) - 0.02, z, h: 2.2, n: 6, r: rng });
  for (let i = 0; i < 9; i++) {
    const [x, z] = rng.inDisc(9.2, 5.2);
    if (z < -3 || pathD(x, z) || Math.abs(x) < 1.2) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.5 + rng() * 0.9, rand: rng, palette: pal(1.6, ground(x, z)) });
  }
  // a lotus pool by the path with cranes
  b.cyl(1.3, 1.35, 0.06, { x: 3.4, y: ground(3.4, 5.6) - 0.02, z: 5.6, sx: 1.3, seg: 20, color: '#a9a595' });
  b.cyl(1.15, 1.15, 0.04, { x: 3.4, y: ground(3.4, 5.6) + 0.03, z: 5.6, sx: 1.3, seg: 20, color: '#4f8aa0', mat: M.water });
  for (let i = 0; i < 5; i++) b.cyl(0.14, 0.14, 0.01, { x: 3.4 + (rng() - 0.5) * 2.2, y: ground(3.4, 5.6) + 0.075, z: 5.6 + (rng() - 0.5) * 1.4, seg: 8, color: '#5f9f6a', mat: M.smooth });
  crane(b, { x: 1.9, y: ground(1.9, 4.9), z: 4.9, ry: 0.8, s: 1.4 });
  crane(b, { x: 5.4, y: ground(5.4, 4.6), z: 4.6, ry: -1.9, s: 1.3 });
  object.add(b.build());

  /* the star lamps 三星: on the two horns of the moon and on the high needle behind */
  const [lx, ly, lz] = horn(160), [rx2, ry2, rz2] = horn(380);
  const STARS = [[lx - 0.15, ly + 0.25, lz], [tops[0][0], tops[0][1] + 0.55, tops[0][2]], [rx2 + 0.1, ry2 + 0.25, rz2]];
  const lb = new Builder();
  for (const [x, y, z] of STARS) {
    lb.cyl(0.07, 0.1, 0.35, { x, y: y - 0.55, z, color: '#6d7470', mat: M.smooth, seg: 6 });
    lb.ico(0.3, { x, y, z, detail: 0, color: '#fff0c2', mat: M.glow, glow: 2.6 });
  }
  object.add(lb.build());
  const halo = softPuffs(3, { color: '#ffe6a8', opacity: 0.55, additive: true });
  object.add(halo.points);

  /* Wukong among the disciples; arms separate so he can dance */
  const WS = 1.5, WX = 1.0 + 0.3, WZ = 1.75 + 0.85;
  const wk = new THREE.Group();
  { const kb = new Builder(); monkeyKing(kb, { legs: 'sit', noArms: true, tunic: '#c9a24a' }); wk.add(kb.build()); }
  const arms = [-1, 1].map((sx) => {
    const g = new THREE.Group(); g.position.set(sx * 0.09, 0.29, 0);
    const ab = new Builder(); monkeyArm(ab, {}); g.add(ab.build()); wk.add(g); return g;
  });
  wk.scale.setScalar(WS);
  wk.position.set(WX, COURT + 0.14 * WS, WZ);
  wk.rotation.y = Math.PI;
  object.add(wk);

  /* whisk of the master (麈尾) */
  const whisk = new THREE.Group();
  { const wb = new Builder(); wb.cyl(0.012, 0.012, 0.35, { color: C.woodD, mat: M.wood, seg: 4 }); wb.sphere(0.07, { y: 0.48, sx: 0.8, sy: 2.2, sz: 0.5, color: '#f4f1ea', mat: M.cloth, ws: 8, hs: 8 }); whisk.add(wb.build()); }
  whisk.position.set(0.22 * 1.7, SEAT + 0.3 * 1.7, DZ + 0.1 * 1.7);
  object.add(whisk);

  /* mist in the hollow, incense smoke, slow clouds */
  const MIST = 34, SMK = 16;
  const mist = softPuffs(MIST, { color: '#dfe8ee', opacity: 0.26 });
  const smoke = softPuffs(SMK, { color: '#e8e4da', opacity: 0.5 });
  object.add(mist.points, smoke.points);
  const md = Array.from({ length: MIST }, () => ({ a: rng() * Math.PI * 2, r: 5.5 + rng() * 3.5, y: 2.2 + rng() * 3.2, s: 1.6 + rng() * 1.8, ph: rng() * 9 }));
  const clouds = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const cb = new Builder(); cloud(cb, { s: 0.8 + rng() * 0.3, rand: rng, color: '#eef1f2' });
    const g = cb.build({ shadows: false }); g.userData = { a: i * Math.PI + 0.9, r: 7.8, y: 9.0 + i * 2.2 }; clouds.add(g);
  }
  object.add(clouds);

  const dimPuffs = nightDim([mist, smoke], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = STARS[i], k = 0.75 + 0.25 * Math.sin(t * 0.9 + i * 2.1);
      halo.set(i, x, y, z, 2.4 * k, k);
    }
    halo.commit();
    // the monkey's joy: a little dance in each cycle
    const u = (t % CYCLE) / CYCLE;
    const joy = smooth(0.55, 0.6, u) * (1 - smooth(0.78, 0.84, u));
    const bob = joy * Math.abs(Math.sin(t * 7)) * 0.16;
    wk.position.y = COURT + 0.14 * WS + bob;
    wk.rotation.y = Math.PI + joy * Math.sin(t * 3.5) * 0.35;
    arms[0].rotation.set(0, 0, lerp(Math.PI - 0.25, 0.5 + Math.sin(t * 7) * 0.4, joy));
    arms[1].rotation.set(lerp(0.6, 0, joy), 0, lerp(Math.PI + 0.25, -0.5 - Math.sin(t * 7 + 1) * 0.4, joy));
    whisk.rotation.set(0.25 + Math.sin(t * 0.6) * 0.18, 0, -0.35 + Math.sin(t * 0.45) * 0.12);
    for (let i = 0; i < MIST; i++) {
      const m = md[i], a = m.a + t * 0.012;
      mist.set(i, Math.cos(a) * m.r, m.y + Math.sin(t * 0.3 + m.ph) * 0.25, Math.sin(a) * m.r * 0.85 - 1.5, m.s, 0.5 + 0.5 * Math.sin(t * 0.2 + m.ph));
    }
    mist.commit();
    for (let i = 0; i < SMK; i++) {
      const p = (t * 0.07 + i / SMK) % 1;
      smoke.set(i, Math.sin(p * 7 + t * 0.4) * 0.15 * p, COURT + 0.55 + p * 3.4, 1.0 + p * 0.3, 0.12 + p * 0.7, Math.sin(Math.PI * p) * (1 - p * 0.4));
    }
    smoke.commit();
    clouds.children.forEach((g) => { const d = g.userData, a = d.a + t * 0.015; g.position.set(Math.cos(a) * d.r, d.y, Math.sin(a) * d.r); g.rotation.y = -a + Math.PI / 2; });
  }
  update(0);
  return { object, update };
}
