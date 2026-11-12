// 蟠桃园 — the Queen Mother's peach orchard, growing straight out of a sea of cloud. Three ranks
// of trees as the Earth God described them: small trees in front (ripe every 3000 years), larger in
// the middle (6000), and the enormous old trees at the back whose fruit has purple veins (9000).
// The Great Sage, keeper of the orchard, has eaten his fill and sleeps stretched along a branch;
// below, the seven fairies in their seven colours have come with baskets for the Peach Banquet —
// one pulls down the branch, and the sleeper stirs.
import { THREE, Builder, M, C, roof, cloud, fbm, noise2, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { nightDim } from './_c_util.js';
import { monkeyKing, fairy, softField, bigPeach } from './_a_figs.js';

const CYCLE = 22;

function cloudGround(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.32 + 4, z * 0.32 - 3, 4);
  const billow = Math.pow(1 - Math.abs(2 * noise2(x * 0.55 + 2, z * 0.55 + 7) - 1), 2);
  let h = 0.6 + 0.6 * n + 0.8 * billow;
  h += smooth(1.5, -6.5, z) * 1.5;                                    // the cloud banks rise toward the back
  return Math.max(0.1, h * smooth(10.7, 9.3, r) + 0.12 * (1 - smooth(10.7, 9.3, r)));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const cw = new THREE.Color(), cpink = new THREE.Color('#eec4cc'), cwhite = new THREE.Color('#fbf7f2'), cgold = new THREE.Color('#f4e2bc');
  softField(b, {
    R: 10.5, rings: 46, segs: 150, fn: cloudGround,
    colorFn: (x, y, z, nx, ny) => {
      const k = smooth(0.6, 0.97, ny) * smooth(0.4, 1.6, y);
      cw.copy(cpink).lerp(cwhite, k);
      return cw.lerp(cgold, 0.25 * smooth(0.3, 0.9, noise2(x * 0.4, z * 0.4)));
    },
  });

  /* three ranks of peach trees */
  const fruit = [];
  const purple = [];
  const ranks = [
    { n: 6, h: [1.9, 2.4], zr: [3.0, 6.2], xr: 6.5, fr: 7 },
    { n: 5, h: [3.4, 4.2], zr: [-0.2, 2.2], xr: 7.0, fr: 9 },
    { n: 0, h: [6, 7], zr: [0, 0], xr: 0, fr: 12 },
  ];
  const spots = [[-2.2, -2.2], [0.15, -0.95]];   // the hero tree is placed by hand
  ranks.forEach((rk, ri) => {
    for (let i = 0, k = 0; i < rk.n && k < 300; k++) {
      const x = rng.range(-rk.xr, rk.xr), z = rng.range(rk.zr[0], rk.zr[1]);
      if (Math.hypot(x, z) > (ri === 2 ? 5.6 : 8.6) || spots.some(([px, pz]) => Math.hypot(px - x, pz - z) < (ri === 2 ? 3.6 : 2.2))) continue;
      if (ri < 2 && x > -0.5 && x < 3.5 && z > 0.8 && z < 4.2) continue;   // clearing for the fairies
      if (ri === 1 && x > -4.2 && x < 2.8) continue;                         // keep the sleeper's limb in view   // clearing for the fairies
      spots.push([x, z]);
      const before = fruit.length;
      bigPeach(b, { x, y: cloudGround(x, z) - 0.15, z, h: rng.range(rk.h[0], rk.h[1]), r: rng, fruitN: rk.fr, fruit, lean: 0.15 + rng() * 0.2 });
      if (ri === 2) for (let f = before; f < fruit.length; f++) purple.push(f);
      i++;
    }
  });

  // the hero tree, with a long low limb reaching over the clearing
  // the enormous old trees at the back (purple-veined fruit), placed by hand
  for (const [x, z, h] of [[-4.0, -4.2, 6.2], [0.9, -5.2, 7.0], [3.9, -3.7, 6.0]]) {
    const before = fruit.length;
    bigPeach(b, { x, y: cloudGround(x, z) - 0.15, z, h, r: rng, fruitN: 12, fruit, lean: 0.12, blossom: ['#e8b4c8', '#dca0bc', '#f2d0dc'] });
    for (let f = before; f < fruit.length; f++) purple.push(f);
  }
  const HX = -2.2, HZ = -2.2, HH = 5.4;
  bigPeach(b, { x: HX, y: cloudGround(HX, HZ) - 0.15, z: HZ, h: HH, r: rng, fruitN: 12, fruit, lean: 0.12 });
  const LB = [HX + 0.15, cloudGround(HX, HZ) + 2.1, HZ + 0.1];          // where the limb leaves the trunk

  // a gold-roofed pavilion on a cloud bank (the Great Sage's lodge by the orchard)
  {
    const px = 6.0, pz = -3.0, py = cloudGround(px, pz) - 0.05;
    b.cyl(1.25, 1.35, 0.25, { x: px, y: py, z: pz, seg: 8, color: '#efe9dc' });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; b.cyl(0.05, 0.05, 1.3, { x: px + Math.cos(a) * 0.95, y: py + 0.25, z: pz + Math.sin(a) * 0.95, color: C.cinnabar, mat: M.lacquer, seg: 6 }); }
    b.cyl(1.05, 1.05, 0.12, { x: px, y: py + 1.45, z: pz, seg: 8, color: '#4f86a3', mat: M.smooth });
    roof(b, { x: px, y: py + 1.55, z: pz, w: 1.9, d: 1.9, h: 1.0, color: C.tileGold, finial: C.gold });
  }
  // scroll clouds (祥云) banked around the rim of the cloud sea
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3, r = 8.7;
    cloud(b, { x: Math.cos(a) * r, y: 0.55 + (i % 3) * 0.25, z: Math.sin(a) * r, ry: -a + Math.PI / 2 + (rng() - 0.5) * 0.4, s: 0.75 + rng() * 0.25, rand: rng, color: i % 2 ? '#fbf3ee' : '#f6e2e2' });
  }
  object.add(b.build());

  /* the limb Wukong sleeps on, as its own pivoting group */
  const limb = new THREE.Group();
  limb.position.set(...LB);
  {
    const lb = new Builder();
    const L = 3.4;
    lb.tube([[0, 0, 0], [L * 0.35, 0.25, 0.25], [L * 0.7, 0.35, 0.5], [L, 0.65, 0.65]], (t) => 0.2 * (1 - t * 0.6), { color: '#5a4236', mat: M.wood, radial: 7, segs: 16 });
    for (const [t, br] of [[1.02, 0.6], [0.92, 0.42]]) lb.ico(br, { x: L * t, y: 0.75 + t * 0.3, z: 0.62 * t + 0.1, sy: 0.65, color: t > 0.8 ? '#f4c4c8' : '#7fae6a', mat: M.flat, detail: 1 });
    for (let i = 0; i < 4; i++) lb.sphere(0.09, { x: L * (0.8 + i * 0.06), y: 0.42 + (i % 2) * 0.1, z: 0.55 + i * 0.06, sy: 1.1, color: '#f59a7a', mat: M.smooth, ws: 8, hs: 6 });
    limb.add(lb.build());
    // the sleeper, stretched along the limb, head toward the tip, one arm under his head
    const kb = new Builder();
    monkeyKing(kb, { x: L * 0.42, y: 0.54, z: 0.37, rx: -Math.PI / 2 + 0.1, ry: -Math.PI / 2 - 0.3, s: 1.9, legs: 'stand', cap: true, tunic: '#e3b64e', arms: [[Math.PI - 0.2, 0], [Math.PI * 0.85, -0.6]] });
    const sleeper = kb.build();
    limb.add(sleeper);
    limb.userData.sleeper = sleeper;
  }
  object.add(limb);

  /* the peaches: instanced, warm and faintly glowing; the oldest trees' fruit purple-veined */
  const pb = new Builder();
  pb.sphere(1, { sy: 1.05, faceColor: (x, y) => (y > 0.1 ? '#ff8a7a' : y > -0.4 ? '#f8b08a' : '#f6d9a0'), mat: M.smooth, ws: 10, hs: 8 });
  pb.cone(0.25, 0.4, { y: 0.85, color: '#ff7a6a', mat: M.smooth, seg: 6 });
  pb.sphere(0.35, { x: 0.35, y: 0.95, sx: 1.4, sy: 0.25, sz: 0.6, color: '#6f9f4f', mat: M.smooth, ws: 6, hs: 4 });
  const peachMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: '#ff8a60', emissiveIntensity: 0.55 });
  const peaches = new THREE.InstancedMesh(pb.merged(), peachMat, fruit.length);
  const tint = new THREE.Color();
  const pset = new Set(purple);
  fruit.forEach(([x, y, z, r], i) => {
    setInst(peaches, i, x, y, z, rng() * 6, r, (rng() - 0.5) * 0.4, (rng() - 0.5) * 0.4);
    peaches.setColorAt(i, pset.has(i) ? tint.set('#d6a0e0') : tint.set('#ffffff'));
  });
  peaches.castShadow = true;
  object.add(peaches);

  /* the seven fairies: 红 青 素 皂 紫 黄 绿 */
  const FC = ['#c8483a', '#3f7f8a', '#efe9dc', '#2e2a2c', '#8a5aa0', '#e0b04a', '#5f9a5a'];
  const fpos = [[0.15, -0.95, 0.3], [1.3, 1.6, 2.9], [2.3, 2.2, -2.8], [3.0, 3.0, -2.5], [-0.2, 3.3, 2.2], [1.6, 3.9, 3.2], [2.8, 3.8, -2.2]];
  const fairies = [];
  const fbAll = new Builder();
  FC.forEach((c, i) => {
    const reach = i === 0;
    const [x, z, ry] = fpos[i];
    const fb = reach ? new Builder() : fbAll;
    const o = reach ? {} : { x, y: cloudGround(x, z) - 0.05, z, ry, s: 1.25 };
    fairy(fb, { ...o, color: c, under: i === 3 ? '#6a6064' : '#f6efe4', ribbon: i === 2 ? '#e8a6b0' : '#f2e2b0', basket: !reach });
    if (reach) {
      fb.cyl(0.02, 0.024, 0.32, { x: 0.08, y: 0.48, rz: -0.25, rx: -0.15, color: c, mat: M.cloth, seg: 6 }); fb.cyl(0.02, 0.024, 0.3, { x: -0.08, y: 0.48, rz: 0.3, rx: -0.15, color: c, mat: M.cloth, seg: 6 });
      const g = fb.build();
      g.position.set(x, cloudGround(x, z) - 0.05, z); g.rotation.y = ry; g.scale.setScalar(1.25);
      g.userData = { x, z, ry };
      object.add(g); fairies.push(g);
    }
  });
  object.add(fbAll.build());
  // a basket set down, heaped with peaches
  {
    const bb = new Builder(), x = 1.0, z = 3.6, y = cloudGround(x, z) - 0.05;
    bb.lathe([[0.1, 0], [0.24, 0.04], [0.27, 0.2], [0.26, 0.21]], { x, y, z, color: '#b48a52', mat: M.wood, seg: 12 });
    bb.torus(0.2, 0.012, { x, y: y + 0.3, z, ry: 0.4, color: '#8a6534', mat: M.wood, ts: 12, arc: Math.PI });
    for (let i = 0; i < 6; i++) bb.sphere(0.075, { x: x + Math.cos(i) * 0.12 * (i % 3 ? 1 : 0), y: y + 0.22 + (i > 3 ? 0.06 : 0), z: z + Math.sin(i) * 0.12 * (i % 3 ? 1 : 0), color: '#f59a7a', mat: M.smooth, ws: 8, hs: 6 });
    object.add(bb.build());
  }

  /* drifting cloud, rolling mist below the orchard, falling petals, golden motes */
  const clouds = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const cb = new Builder(); cloud(cb, { s: 0.7 + rng() * 0.4, rand: rng, color: '#fbf3ee' });
    const g = cb.build({ shadows: false }); g.userData = { a: (i / 3) * Math.PI * 2, r: 6.6 + i * 0.4, y: 7.5 + i * 1.8 }; clouds.add(g);
  }
  object.add(clouds);
  const MIST = 40, PET = 70, MOTE = 18;
  const mist = softPuffs(MIST, { color: '#fff6f2', opacity: 0.6 });
  const petals = softPuffs(PET, { color: '#f6b8c0', opacity: 0.95 });
  const motes = softPuffs(MOTE, { color: '#ffd98a', opacity: 0.6, additive: true });
  object.add(mist.points, petals.points, motes.points);
  const md = Array.from({ length: MIST }, (_, i) => ({ a: (i / MIST) * Math.PI * 2 + rng() * 0.2, r: 9.2 + rng() * 1.5, y: 0.4 + rng() * 1.2, s: 2 + rng() * 2, ph: rng() * 9 }));
  const pd = Array.from({ length: PET }, () => { const [x, z] = rng.inDisc(8); return { x, z, ph: rng(), sp: 0.04 + rng() * 0.04, top: 3 + rng() * 5 }; });
  const sleeper = limb.userData.sleeper;

  const dimPuffs = nightDim([mist], 0.55);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    // the fairy pulls the limb down twice; it springs back; the sleeper stirs
    const pull = smooth(0.45, 0.52, u) * (1 - smooth(0.6, 0.66, u));
    const spring = u > 0.6 ? Math.exp(-(u - 0.6) * 30) * Math.sin((u - 0.6) * 90) * 0.5 : 0;
    limb.rotation.set(0, 0, -0.07 * pull + 0.03 * spring + Math.sin(t * 0.5) * 0.008);
    sleeper.position.y = Math.sin(t * 1.4) * 0.012 + 0.08 * smooth(0.5, 0.56, u) * (1 - smooth(0.7, 0.8, u));
    sleeper.rotation.x = 0.12 * smooth(0.52, 0.58, u) * (1 - smooth(0.72, 0.82, u));
    { const g = fairies[0], d = g.userData; g.rotation.x = -0.12 * pull; g.position.y = cloudGround(d.x, d.z) - 0.05 + 0.06 * pull; }
    peachMat.emissiveIntensity = 0.5 + 0.12 * Math.sin(t * 0.9);
    for (let i = 0; i < MIST; i++) {
      const m = md[i], a = m.a + t * 0.01;
      mist.set(i, Math.cos(a) * m.r, m.y + Math.sin(t * 0.3 + m.ph) * 0.2, Math.sin(a) * m.r, m.s, 0.6 + 0.4 * Math.sin(t * 0.25 + m.ph));
    }
    mist.commit();
    for (let i = 0; i < PET; i++) {
      const p = pd[i], k = (t * p.sp + p.ph) % 1, y = p.top * (1 - k) + 0.6;
      petals.set(i, p.x + Math.sin(t * 0.7 + p.ph * 20) * 0.5 + k * 1.5, y, p.z + Math.cos(t * 0.5 + p.ph * 13) * 0.4, 0.07, smooth(0, 0.08, k) * (1 - smooth(0.85, 1, k)));
    }
    petals.commit();
    for (let i = 0; i < MOTE; i++) {
      const f = fruit[(i * 37) % fruit.length], k = (t * 0.1 + i / MOTE) % 1;
      motes.set(i, f[0], f[1] + k * 1.2, f[2], 0.18 * (1 - k), Math.sin(Math.PI * k));
    }
    motes.commit();
    clouds.children.forEach((g) => { const d = g.userData, a = d.a + t * 0.012; g.position.set(Math.cos(a) * d.r, d.y, Math.sin(a) * d.r); g.rotation.y = -a + Math.PI / 2; });
  }
  update(0);
  return { object, update };
}
