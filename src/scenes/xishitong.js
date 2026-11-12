// 稀柿衕 (七绝山, ch.67) — a ravine eight hundred li long choked with rotten persimmons that fell
// for generations from the trees on the slopes; the stench is unbearable and flies hang over it.
// Bajie, turned into a gigantic black boar, roots a clean channel through the orange muck, the
// others following behind with the villagers of 驼罗庄 bringing food. Loop 12 s: he roots and heaves,
// rotten fruit flies off his snout, flies buzz.
import { THREE, Builder, M, C, terrain, peak, rock, bareTree, figure, horse, fbm, noise2, hash2, smooth, clamp, setInst, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { stonePal } from './_d_util.js';

const CYCLE = 12;
const PIG = [-1.6, 0.6];          // where the boar's snout is working
const floorZ = (x) => 0.6 + 0.5 * Math.sin(x * 0.25);

function base(x, z) {
  const r = Math.hypot(x, z);
  const d = z - floorZ(x);
  const n = fbm(x * 0.3 + 3, z * 0.3 + 8, 4);
  let h = 0.2;
  const ridged = 1 - Math.abs(2 * noise2(x * 0.8 + 4, z * 0.5) - 1);
  if (d < -2.0) h += Math.min(6.5, (-d - 2.0) * 2.4) * (0.7 + 0.5 * n + 0.25 * ridged) * smooth(10.6, 7.5, r);   // the steep back wall
  if (d > 2.6) h += Math.min(0.55, (d - 2.6) * 0.5) * (0.7 + 0.6 * n);        // the low front bank
  return h;
}
// the muck: deep ahead of the boar, a clean channel with heaped sides behind him
function muck(x, z) {
  const d = Math.abs(z - floorZ(x));
  const n = fbm(x * 0.9 + 1, z * 0.9, 3);
  const deep = (0.75 + 0.55 * n) * smooth(2.3, 1.1, d);
  const ahead = smooth(PIG[0] + 0.6, PIG[0] - 0.4, x);
  const side = smooth(0.7, 1.5, d) * (1 - smooth(1.9, 2.5, d));
  const behind = (1 - ahead) * (0.02 * deep + 0.9 * side * (0.6 + 0.5 * n));
  return (ahead * deep + behind) * smooth(10.2, 8.8, Math.hypot(x, z));
}
const ground = (x, z) => base(x, z) + muck(x, z);

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const slope = stonePal(7, { cliff: [[0, '#6e4a30'], [0.3, '#8c5e3a'], [0.6, '#a87a4a'], [0.85, '#c0956a'], [1, '#9a7a58']], ledge: [[0, '#b39462'], [0.5, '#9c8a58'], [1, '#7c7a4a']], ledgeAt: 0.6 });
  const rot = [new THREE.Color('#d0661e'), new THREE.Color('#b84c18'), new THREE.Color('#8a3a1a'), new THREE.Color('#6a3a22'), new THREE.Color('#8a7a4a')];
  const wet = new THREE.Color('#4a3424');
  const tmp = new THREE.Color();
  terrain(b, { R: 10.5, rings: 48, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    const m = muck(x, z);
    if (m > 0.12) {
      const k = hash2(Math.floor(x * 5), Math.floor(z * 5));
      return tmp.copy(rot[Math.floor(k * 4.99)]).lerp(rot[3], 0.25 * noise2(x * 2, z * 2));
    }
    if (Math.abs(z - floorZ(x)) < 1.2 && x > PIG[0]) return wet;
    return slope(x, y, z, nx, ny, nz);
  } });

  /* crags on the rim of the back wall */
  for (const [x, z, r, h] of [[-4.6, -6.6, 1.2, 4.2], [1.0, -8.0, 1.4, 4.8], [5.4, -6.2, 1.0, 3.4], [-7.8, -2.8, 0.9, 2.6]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean: 0.15, rand: rng, taper: 0.8, palette: stonePal(h, { base: y, cliff: [[0, '#7a5232'], [0.5, '#9a6c42'], [1, '#6a5a4a']], ledge: [[0, '#a89260'], [1, '#7c7a4a']], ledgeAt: 0.6 }) });
  }
  /* boulders on the slopes, persimmon trees heavy with fruit */
  for (let i = 0; i < 14; i++) {
    const [x, z] = rng.inDisc(9.6, 2);
    if (Math.abs(z - floorZ(x)) < 3) continue;
    rock(b, { x, y: ground(x, z) - 0.15, z, r: 0.4 + rng() * 0.7, h: 0.5 + rng() * 0.9, rand: rng, palette: stonePal(2, { base: ground(x, z) - 0.5, cliff: [[0, '#6e4c30'], [1, '#a07a50']], ledge: [[0, '#8a8a52'], [1, '#6f7a48']] }) });
  }
  const fruitPts = [];
  const trees = [[-6.0, -3.6, 2.4], [-3.4, -4.6, 2.8], [0.6, -4.4, 2.6], [3.8, -4.6, 3.0], [6.2, -3.0, 2.4], [-1.6, -7.0, 2.4], [2.4, -7.2, 2.6], [-6.8, 4.6, 2.0], [5.4, 5.0, 2.2], [0.8, 6.4, 1.8], [-3.0, 5.6, 1.7]];
  for (const [x, z, h] of trees) {
    const y = ground(x, z) - 0.05;
    bareTree(b, { x, y, z, h, r: rng, color: '#3a2a1e' });
    for (let k = 0; k < 7; k++) {
      const a = rng() * Math.PI * 2, d = h * (0.15 + rng() * 0.35);
      b.ico(h * (0.13 + rng() * 0.08), { x: x + Math.cos(a) * d, y: y + h * (0.75 + rng() * 0.35), z: z + Math.sin(a) * d, sy: 0.6, color: rng.pick(['#c0562a', '#a8442a', '#8a6a2a', '#6f7a3a']), mat: M.flat, detail: 0 });
    }
    for (let k = 0; k < 14; k++) {
      const a = rng() * Math.PI * 2, d = h * (0.1 + rng() * 0.4);
      fruitPts.push([x + Math.cos(a) * d, y + h * (0.6 + rng() * 0.45), z + Math.sin(a) * d, 0.09 + rng() * 0.04, 0]);
    }
  }

  /* the party behind the boar in the clean channel, and the villagers with food */
  const along = (x) => [x, ground(x, floorZ(x)), floorZ(x)];
  { const [x, y, z] = along(3.7); figure(b, 'wukong', { x, y, z: z + 0.2, ry: -Math.PI / 2, pose: 'staff', s: 1.3 }); }
  { const [x, y, z] = along(5.0); horse(b, { x, y, z, ry: -Math.PI / 2, rider: 'monk', s: 1.15 }); }
  { const [x, y, z] = along(6.2); figure(b, 'sha', { x, y, z: z - 0.15, ry: -Math.PI / 2, s: 1.2 }); }
  for (const [dx, dz] of [[7.3, 0.3], [8.0, -0.25]]) {
    const [x, y, z] = along(dx);
    figure(b, 'villager', { x, y, z: z + dz, ry: -Math.PI / 2, s: 1.0, robe: '#6a5a4a' });
    b.cyl(0.18, 0.13, 0.18, { x, y: y + 0.66, z: z + dz, color: '#b59a5a', mat: M.wood, seg: 8 });          // basket of steamed buns on the head
    for (let k = 0; k < 3; k++) b.sphere(0.07, { x: x + (k - 1) * 0.08, y: y + 0.86, z: z + dz, color: C.ivory, mat: M.smooth, ws: 6, hs: 4 });
  }
  object.add(b.build());

  /* rotten persimmons: mounds of faceted fruit over the muck, and fruit on the trees */
  const fruit = [];
  for (let tries = 0; fruit.length < 1700 && tries < 20000; tries++) {
    const [x, z] = rng.inDisc(9.8);
    const m = muck(x, z);
    if (m < 0.18) continue;
    fruit.push([x, base(x, z) + m - 0.02, z, 0.1 + rng() * 0.09, 1]);
  }
  const all = fruit.concat(fruitPts);
  const fGeo = new THREE.IcosahedronGeometry(1, 0);
  const fMesh = new THREE.InstancedMesh(fGeo, new THREE.MeshStandardMaterial({ roughness: 0.55, flatShading: true }), all.length);
  const fc = new THREE.Color();
  all.forEach(([x, y, z, r, rotten], i) => {
    setInst(fMesh, i, x, y, z, rng() * 6, [r, r * (rotten ? 0.55 + rng() * 0.3 : 0.85), r], rng(), rng());
    if (!rotten) fc.set(rng() < 0.6 ? '#e8782a' : '#d4601e');
    else { const q = rng(); fc.set(q < 0.35 ? '#e0742a' : q < 0.6 ? '#c45620' : q < 0.8 ? '#8e3c1a' : q < 0.92 ? '#5e3420' : '#9a9068'); }
    fMesh.setColorAt(i, fc);
  });
  fMesh.castShadow = true; fMesh.receiveShadow = true;
  object.add(fMesh);

  /* the boar */
  const boar = new THREE.Group();
  const head = new THREE.Group();
  {
    const pb = new Builder();
    const hide = '#2c2a2e', hideL = '#45424a', pink = '#b07a76';
    pb.sphere(1.0, { y: 1.35, sx: 1.0, sy: 0.95, sz: 1.75, color: hide, mat: M.smooth, ws: 18, hs: 12 });
    pb.sphere(0.85, { y: 1.45, z: 0.9, sx: 1.05, sy: 1.0, sz: 0.9, color: hideL, mat: M.smooth });      // shoulders
    for (const [lx, lz] of [[-0.5, 0.95], [0.5, 0.95], [-0.5, -1.05], [0.5, -1.05]]) {
      pb.cyl(0.2, 0.26, 0.85, { x: lx, y: 0.05, z: lz, color: hide, mat: M.smooth, seg: 8 });
      pb.cyl(0.21, 0.21, 0.12, { x: lx, y: 0.0, z: lz + 0.04, color: '#1a1818', mat: M.smooth, seg: 8 });
    }
    for (let i = 0; i < 16; i++) pb.cone(0.07, 0.32, { x: 0, y: 2.25 - Math.abs(i - 6) * 0.03, z: 1.2 - i * 0.16, rx: -0.3, color: '#1c1a1c', mat: M.flat, seg: 4 });   // bristle crest
    pb.tube([[0, 1.5, -1.7], [0, 1.7, -1.95], [0.15, 1.85, -1.85], [0.1, 1.75, -1.7]], 0.05, { color: hide, mat: M.smooth, radial: 5 });  // curly tail
    boar.add(pb.build());
    const hb = new Builder();
    hb.sphere(0.62, { sz: 1.1, color: hideL, mat: M.smooth });
    hb.cyl(0.32, 0.45, 0.85, { z: 0.35, rx: Math.PI / 2, color: hideL, mat: M.smooth, seg: 12 });       // snout
    hb.cyl(0.33, 0.33, 0.06, { z: 1.2, rx: Math.PI / 2, color: pink, mat: M.smooth, seg: 12 });
    for (const sx of [-1, 1]) {
      hb.sphere(0.05, { x: sx * 0.12, z: 1.27, color: '#3a2422', mat: M.smooth, ws: 6, hs: 4 });
      hb.sphere(0.07, { x: sx * 0.33, y: 0.3, z: 0.38, color: '#141010', mat: M.lacquer, ws: 6, hs: 5 });
      hb.sphere(0.4, { x: sx * 0.52, y: 0.5, z: -0.05, sx: 0.25, sy: 1.0, sz: 0.8, rz: sx * 0.7, rx: 0.4, color: hide, mat: M.smooth });   // great ears
      hb.cone(0.05, 0.3, { x: sx * 0.32, y: -0.2, z: 0.95, rx: -0.5, color: C.ivory, mat: M.smooth, seg: 5 });  // tusks
    }
    head.add(hb.build());
    head.position.set(0, 1.25, 1.9);
    boar.add(head);
  }
  const BX = PIG[0] + 2.4;
  boar.position.set(BX, base(BX, floorZ(BX)) + 0.02, floorZ(BX));
  boar.rotation.y = -Math.PI / 2 - 0.12;
  boar.scale.setScalar(1.15);
  object.add(boar);

  /* flung fruit, flies, stench */
  const FL = 16;
  const flung = new THREE.InstancedMesh(fGeo, new THREE.MeshStandardMaterial({ color: '#c8581e', roughness: 0.6, flatShading: true }), FL);
  object.add(flung);
  const fd = Array.from({ length: FL }, () => ({ ph: rng(), a: (rng() - 0.5) * 2.6, v: 0.8 + rng() * 0.8, r: 0.1 + rng() * 0.06 }));
  const NF = 90;
  const flies = softPuffs(NF, { color: '#1c1a16', opacity: 0.85 });
  const STK = 26;
  const stink = softPuffs(STK, { color: '#b8a860', opacity: 0.14 });
  object.add(flies.points, stink.points);
  const swarm = Array.from({ length: NF }, () => { const x = -9 + rng() * 8, z = floorZ(x) + (rng() - 0.5) * 4; return { x, z, y: ground(x, z) + 0.3 + rng() * 1.2, r: 0.2 + rng() * 0.5, f: 2 + rng() * 3, ph: rng() * 6 }; });
  const sk = Array.from({ length: STK }, () => { const x = -9.2 + rng() * 6, z = floorZ(x) + (rng() - 0.5) * 4; return { x, z, s: 1.6 + rng() * 2.2, ph: rng() * 10 }; });
  const snout = new THREE.Vector3();

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(stink, nk);
    const u = (t % CYCLE) / CYCLE;
    const root = Math.sin(t * 2.2);
    const heave = Math.max(0, Math.sin(u * Math.PI * 2 * 3)) ** 2;
    head.rotation.x = 0.35 + 0.25 * root;
    head.rotation.y = 0.15 * Math.sin(t * 0.7);
    boar.position.x = BX - 0.18 * heave;
    boar.rotation.z = 0.03 * Math.sin(t * 1.1);
    snout.set(BX - 2.9, base(PIG[0], floorZ(PIG[0])) + 0.6, floorZ(PIG[0]));
    for (let i = 0; i < FL; i++) {
      const f = fd[i], p = (t * 0.55 + f.ph) % 1;
      const ang = Math.PI + f.a;
      setInst(flung, i, snout.x + Math.cos(ang) * p * 2.6 * f.v * 0.4 + 0.6 * p, snout.y + 3.2 * p * (1 - p) * f.v, snout.z + Math.sin(ang) * p * 2.6 * f.v, p * 9, p > 0.97 ? 0.0001 : f.r * (0.6 + 0.4 * heave + 0.3));
    }
    flung.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < NF; i++) {
      const s = swarm[i];
      flies.set(i, s.x + Math.cos(t * s.f + s.ph) * s.r, s.y + 0.25 * Math.sin(t * s.f * 1.7 + s.ph), s.z + Math.sin(t * s.f * 1.3 + s.ph) * s.r, 0.05, 0.9);
    }
    flies.commit();
    for (let i = 0; i < STK; i++) {
      const s = sk[i];
      stink.set(i, s.x + Math.sin(t * 0.15 + s.ph) * 0.6, ground(s.x, s.z) + 0.6 + 0.3 * Math.sin(t * 0.3 + s.ph), s.z, s.s, 0.6 + 0.3 * Math.sin(t * 0.25 + s.ph));
    }
    stink.commit();
    void clamp;
  }
  update(0);
  return { object, update };
}
