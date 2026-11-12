// 小雷音寺 (ch.65–66) — the false Thunderclap Monastery of the Yellow-Browed King. Centre stage
// the giant golden cymbals (金铙) stand clamped shut on the terrace with Wukong trapped inside; light
// leaks from the seam. The dragon star 亢金龙 has coiled down from the clouds and driven his single
// horn through the rim — Wukong will drill a hole in its tip and ride it out. Behind, the fake
// Buddha sits in a gold-roofed hall over the kneeling Tang Seng. Loop 16 s: the cymbals shudder,
// the seam brightens, the horn works in.
import { THREE, Builder, M, C, terrain, peak, hall, roof, pine, cloud, figure, fbm, smooth, clamp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { stonePal, pulse } from './_d_util.js';

const CYCLE = 16;
const CR = 3.3;                         // cymbal radius
const CC = new THREE.Vector3(0.3, CR + 0.85, 1.4);
const CRY = -0.85;

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.2 + 0.25 * fbm(x * 0.4, z * 0.4 + 3, 3);
  h += smooth(-2.5, -7, z) * smooth(10.4, 6, r) * (1.2 + 2.2 * fbm(x * 0.3 + 5, z * 0.3, 3));
  if (Math.abs(x) < 5.4 && z > -3.6 && z < 6.4) h = Math.min(h, 0.3);
  return Math.max(0.1, h * smooth(10.6, 9.6, r) + 0.1);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const cliff = [[0, '#6b5e52'], [0.3, '#7a6a5c'], [0.6, '#56566a'], [1, '#3e4258']];
  const ledge = [[0, '#a89a6a'], [0.5, '#8a9468'], [1, '#5f7a62']];
  const pal = stonePal(6, { cliff, ledge, ledgeAt: 0.6 });
  const pave = new THREE.Color('#c9b48c'), paveD = new THREE.Color('#b39c74');
  terrain(b, { R: 10.5, rings: 44, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (Math.abs(x) < 5.4 && z > -3.6 && z < 6.4 && ny > 0.97) return (Math.floor(x * 0.9) + Math.floor(z * 0.9)) & 1 ? pave : paveD;
    return pal(x, y, z, nx, ny, nz);
  } });

  /* mountains behind, misty */
  for (const [x, z, r, h] of [[-5.4, -6.2, 1.5, 10], [-2.0, -7.8, 1.3, 8], [4.6, -6.8, 1.6, 11], [7.2, -3.8, 1.0, 6], [-7.6, -2.8, 1.0, 5.5]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, taper: 0.75, palette: stonePal(h, { base: y, cliff, ledge, ledgeAt: 0.6 }) });
  }
  for (const [x, z] of [[-6.4, 1.6], [6.6, 1.0], [-7.0, -0.8], [6.4, -2.2], [-3.6, -5.4], [2.8, -5.6]]) pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.8 + rng() * 0.8, r: rng, lean: 0.25 });

  /* the false temple: main hall with the fake Buddha, red walls, a gate */
  hall(b, { x: 0, y: 0.3, z: -4.6, w: 5.0, d: 2.2, h: 1.8, tiers: 2, roofColor: C.tileGold, wall: '#a8402f', pillar: C.cinnabar, beam: '#3a4a6a', lit: 0.5, r: rng });
  b.push({ x: 0, y: 0.65, z: -3.42 });
  b.box(1.5, 1.35, 0.05, { y: 0.0, color: '#2a1a14', mat: M.stone });
  b.lathe([[0.32, 0], [0.34, 0.25], [0.24, 0.6], [0.12, 0.78], [0, 0.8]], { y: 0.05, z: 0.08, color: '#d8a845', mat: M.metal, seg: 12 });
  b.sphere(0.12, { y: 0.93, z: 0.08, color: '#d8a845', mat: M.metal });
  b.pop();
  for (const sx of [-1, 1]) {
    b.box(5.6, 1.0, 0.3, { x: sx * 5.5, y: 0.25, z: -2.6, ry: sx * Math.PI / 2, color: '#a8402f' });
    b.box(5.8, 0.12, 0.5, { x: sx * 5.5, y: 1.25, z: -2.6, ry: sx * Math.PI / 2, color: '#6a4a2a' });
    b.box(3.3, 1.0, 0.3, { x: sx * 3.75, y: 0.25, z: 6.3, color: '#a8402f' });
    b.box(3.5, 0.12, 0.5, { x: sx * 3.75, y: 1.25, z: 6.3, color: '#6a4a2a' });
    // false arhats in a row before the hall
    for (let i = 0; i < 3; i++) figure(b, 'villager', { x: sx * (2.4 + i * 0.7), y: 0.3, z: -2.7 + i * 0.25, ry: -sx * 0.3, robe: '#7a4a6a', hat: '#d8a845', s: 1.05 });
  }
  b.box(2.2, 1.6, 0.6, { x: 0, y: 0.25, z: 6.3, color: '#a8402f' });
  b.box(1.0, 1.2, 0.62, { x: 0, y: 0.25, z: 6.3, color: '#1a1210' });
  roof(b, { x: 0, y: 1.85, z: 6.3, w: 2.4, d: 0.8, h: 0.5, color: C.tileGold });
  // Tang Seng kneels to the false Buddha
  b.push({ x: -0.5, y: 0.3, z: -2.2, ry: Math.PI, sy: 0.72 });
  figure(b, 'monk', { pose: 'none', s: 1.25 });
  b.pop();
  figure(b, 'bajie', { x: 3.6, y: 0.3, z: 4.4, ry: -2.4, s: 1.15 });
  figure(b, 'sha', { x: 4.4, y: 0.3, z: 3.6, ry: -2.2, s: 1.1 });

  /* the terrace and cradle for the cymbals */
  b.cyl(2.4, 2.7, 0.35, { x: CC.x, y: 0.3, z: CC.z, color: '#d9cfb8', seg: 8 });
  b.cyl(2.0, 2.2, 0.2, { x: CC.x, y: 0.65, z: CC.z, color: '#e6dcc4', seg: 8 });
  object.add(b.build());

  /* the cymbals: one lens of gold standing on edge */
  const cym = new THREE.Group();
  {
    const cb = new Builder();
    const prof = [[0.001, -0.78], [0.38, -0.72], [0.62, -0.46], [0.74, -0.38], [2.0, -0.13], [CR - 0.05, -0.04], [CR + 0.06, 0], [CR - 0.05, 0.04], [2.0, 0.13], [0.74, 0.38], [0.62, 0.46], [0.38, 0.72], [0.001, 0.78]];
    cb.lathe(prof, { color: '#d8a640', mat: M.lacquer, seg: 56 });
    for (const sy of [-1, 1]) {
      cb.torus(1.55, 0.03, { y: sy * 0.27, rx: Math.PI / 2, color: '#a67a2c', mat: M.metal, ts: 48 });
      cb.torus(0.7, 0.04, { y: sy * 0.39, rx: Math.PI / 2, color: '#b78a34', mat: M.metal, ts: 28 });
      cb.torus(0.14, 0.035, { y: sy * 0.8, rx: Math.PI / 2, color: '#8a2a20', mat: M.cloth, ts: 12 });       // tassel loop
    }
    cym.add(cb.build());
  }
  const seam = new THREE.Mesh(new THREE.TorusGeometry(CR + 0.03, 0.025, 4, 96), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  seam.rotation.x = Math.PI / 2;
  cym.add(seam);
  cym.position.copy(CC);
  cym.rotation.set(Math.PI / 2, 0, 0, 'YXZ');
  cym.rotation.y = CRY;
  object.add(cym);
  // wooden cradle
  {
    const wb = new Builder();
    for (const sx of [-1, 1]) {
      wb.box(0.28, 1.4, 0.28, { x: sx * 1.6, y: 0, color: C.cinnabar, mat: M.lacquer });
      wb.box(0.42, 0.14, 0.42, { x: sx * 1.6, y: 1.4, color: C.gold, mat: M.metal });
    }
    wb.box(3.5, 0.22, 0.5, { y: 0.0, color: '#6a2a20', mat: M.lacquer });
    const g = wb.build();
    g.position.set(CC.x, 0.85, CC.z);
    g.rotation.y = CRY;
    object.add(g);
  }

  /* 亢金龙: coils down from a cloud and drives his horn into the seam */
  const rimA = Math.PI * 0.62;
  const e1 = new THREE.Vector3(Math.cos(CRY), 0, -Math.sin(CRY));
  const rimP = CC.clone().addScaledVector(e1, Math.cos(rimA) * (CR + 0.05)).add(new THREE.Vector3(0, Math.sin(rimA) * (CR + 0.05), 0));
  const inward = CC.clone().sub(rimP).normalize();
  const dragon = new THREE.Group();
  const dhead = new THREE.Group();
  {
    const db = new Builder();
    const pts = [];
    const H0 = rimP.clone().addScaledVector(inward, -1.1);
    for (let k = 0; k <= 26; k++) {
      const t = k / 26;
      const a = t * Math.PI * 3.2 + 0.4;
      pts.push([H0.x - t * 3.8 + Math.cos(a) * 1.3 * t, H0.y + 0.2 + t * 6.5 + Math.sin(a) * 0.9, H0.z - 1.0 * t + Math.sin(a) * 1.4 * (0.3 + t)]);
    }
    pts.unshift([H0.x, H0.y, H0.z]);
    const loc = pts.map(([x, y, z]) => [x - H0.x, y - H0.y, z - H0.z]);
    db.tube(loc, (t) => 0.26 * (1 - 0.7 * t * t), { color: '#2f7a6a', mat: M.smooth, radial: 8, segs: 110 });
    db.tube(loc.map(([x, y, z]) => [x, y - 0.12, z + 0.02]), (t) => 0.2 * (1 - 0.7 * t * t), { color: '#d9b45a', mat: M.smooth, radial: 6, segs: 90 });   // golden belly
    for (let k = 1; k < loc.length - 2; k++) {
      const [x, y, z] = loc[k];
      db.cone(0.08 * (1 - k / loc.length) + 0.03, 0.3, { x, y: y + 0.2 * (1 - k / loc.length) + 0.1, z, color: '#c9502e', mat: M.smooth, seg: 4 });
    }
    for (const k of [6, 13]) for (const sx of [-1, 1]) {        // claws
      const [x, y, z] = loc[k];
      db.tube([[x, y, z], [x + sx * 0.3, y - 0.3, z + 0.2], [x + sx * 0.35, y - 0.5, z + 0.35]], 0.05, { color: '#2f7a6a', mat: M.smooth, radial: 4 });
    }
    // a cloud where the tail vanishes
    const tl = loc[loc.length - 1];
    cloud(db, { x: tl[0] - 0.3, y: tl[1] - 0.2, z: tl[2], s: 0.9, rand: rng, ry: 0.3 });
    dragon.add(db.build({ shadows: true }));
    const hb = new Builder();
    hb.sphere(0.36, { sx: 0.9, sy: 0.8, sz: 1.1, color: '#2f7a6a', mat: M.smooth });
    hb.box(0.36, 0.22, 0.55, { y: -0.1, z: 0.35, color: '#3a8a76', mat: M.smooth });        // snout
    hb.box(0.34, 0.08, 0.5, { y: -0.27, z: 0.32, rx: 0.2, color: '#d9b45a', mat: M.smooth });  // jaw
    for (const sx of [-1, 1]) {
      hb.sphere(0.07, { x: sx * 0.2, y: 0.12, z: 0.24, color: '#f2d27a', mat: M.smooth, ws: 6, hs: 5 });
      hb.tube([[sx * 0.16, -0.1, 0.58], [sx * 0.5, -0.05, 0.8], [sx * 0.7, -0.3, 0.7]], 0.018, { color: '#e8d8a8', mat: M.smooth, radial: 3 });      // whiskers
      for (let i = 0; i < 3; i++) hb.cone(0.06, 0.35, { x: sx * 0.24, y: 0.05 - i * 0.12, z: -0.3, rx: -1.9, rz: sx * 0.6, color: '#c9502e', mat: M.smooth, seg: 4 });  // mane
    }
    // the single horn, reaching forward into the seam
    hb.cyl(0.012, 0.075, 1.1, { y: 0.15, z: 0.25, rx: Math.PI / 2 - 0.12, color: '#efe2b8', mat: M.smooth, seg: 7 });
    dhead.add(hb.build());
  }
  dragon.add(dhead);
  const H0 = rimP.clone().addScaledVector(inward, -1.1);
  dragon.position.copy(H0);
  // orient head toward the cymbal centre (horn points along local +z after lookAt)
  dhead.rotation.copy(new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), inward.clone().negate(), new THREE.Vector3(0, 1, 0))));
  object.add(dragon);

  /* leaking light: sparks at the seam, incense haze */
  const SP = 30;
  const sparks = softPuffs(SP, { color: '#ffd889', opacity: 0.8, additive: true });
  const HZ = 30;
  const haze = softPuffs(HZ, { color: '#e9dcc0', opacity: 0.45 });
  object.add(sparks.points, haze.points);
  const sd = Array.from({ length: SP }, () => ({ a: rng() * Math.PI * 2, ph: rng(), v: 0.5 + rng() }));
  const hd = Array.from({ length: HZ }, () => ({ x: (rng() - 0.5) * 16, z: -7 + rng() * 5, y: 1 + rng() * 3, s: 2 + rng() * 2.5, ph: rng() * 10 }));
  const _p = new THREE.Vector3();

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(haze, nk);
    haze.mat.uniforms.uOpacity.value = 0.45 * (1 - 0.45 * nk);
    const u = t % CYCLE;
    // Wukong struggles: three heaves per cycle
    let heave = 0;
    for (const c of [2.5, 7.0, 11.5]) heave = Math.max(heave, pulse(c - 0.3, c, c + 0.4, c + 1.4, u));
    const tremble = heave * Math.sin(t * 38) * 0.012;
    cym.rotation.z = tremble;
    cym.scale.set(1, 1 + heave * 0.05, 1);
    const k = 0.9 + 1.5 * heave + 0.2 * Math.sin(t * 3.1);
    seam.material.color.set('#ffcf73').multiplyScalar(k);
    // the horn works in and out
    const push = 0.18 * Math.sin(t * 0.9) ** 2 + 0.05 * heave;
    dhead.position.copy(inward).multiplyScalar(push);
    dragon.rotation.y = 0.02 * Math.sin(t * 0.4);
    for (let i = 0; i < SP; i++) {
      const s = sd[i], p = (t * 0.35 * s.v + s.ph) % 1;
      _p.set(Math.cos(s.a) * (CR + 0.1 + p * 0.8), 0, Math.sin(s.a) * (CR + 0.1 + p * 0.8)).applyEuler(cym.rotation).add(CC);
      sparks.set(i, _p.x, _p.y, _p.z, 0.12 + 0.1 * heave, (0.4 + heave) * Math.sin(Math.PI * p));
    }
    sparks.commit();
    for (let i = 0; i < HZ; i++) {
      const h = hd[i];
      haze.set(i, h.x + Math.sin(t * 0.1 + h.ph) * 0.8, h.y, h.z, h.s, 0.5 + 0.3 * Math.sin(t * 0.2 + h.ph));
    }
    haze.commit();
    void clamp;
  }
  update(0);
  return { object, update };
}
