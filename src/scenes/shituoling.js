// 狮驼岭·狮驼国 (ch.74–77) — the most menacing station. A walled city whose people were all eaten
// five hundred years ago, now held by demons: soot-dark walls, black banners, heaps of bones at
// the foot of the walls. Behind it, perched on a crag, the Great Roc 大鹏金翅雕 spreads his vast
// wings forward around the city like a mantle. At the gate sit the blue lion and the white
// elephant (mounts of Manjusri and Samantabhadra). The pilgrims come up the road, small. Loop 20 s:
// the roc's wings breathe, his head turns, the banners stream, smoke rises.
import { THREE, Builder, M, C, terrain, peak, rock, house, hall, roof, bareTree, figure, horse, fbm, noise2, smooth, lerp, clamp, setInst, softPuffs } from '../kit.js';
import { stonePal, polyDist } from './_d_util.js';

const CYCLE = 20;
const WX = 4.6, WZ0 = -3.6, WZ1 = 3.4, WH = 1.5;          // city wall
const ROC = new THREE.Vector3(0, 0, -6.4);
const ROAD = [[1.8, 10.2], [1.2, 7.8], [0.2, 5.6], [0, 3.6]];

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.2 + 0.3 * fbm(x * 0.4 + 3, z * 0.4 + 9, 3);
  h += smooth(-4.5, -8.5, z) * smooth(10.4, 5, r) * (1.4 + 1.6 * fbm(x * 0.35, z * 0.35, 3));
  if (Math.abs(x) < WX + 0.3 && z > WZ0 - 0.3 && z < WZ1 + 0.3) h = 0.35;
  h *= 1 - 0.6 * smooth(1.2, 0.2, polyDist(ROAD, x, z));
  return Math.max(0.1, h * smooth(10.6, 9.6, r) + 0.1);
}

/** Euler (YXZ) that turns +y onto d */
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _Y = new THREE.Vector3(0, 1, 0);
function eulerTo(d) { _q.setFromUnitVectors(_Y, d.clone().normalize()); _e.setFromQuaternion(_q, 'YXZ'); return { rx: _e.x, ry: _e.y, rz: _e.z }; }

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const cliff = [[0, '#3e3834'], [0.3, '#524a44'], [0.7, '#5e5a5a'], [1, '#46484e']];
  const ledge = [[0, '#6a6450'], [0.5, '#5e6450'], [1, '#4a5446']];
  const soot = stonePal(5, { cliff, ledge, ledgeAt: 0.6 });
  const roadC = new THREE.Color('#8a7a62'), yard = new THREE.Color('#544c44');
  terrain(b, { R: 10.5, rings: 44, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (polyDist(ROAD, x, z) < 0.45 + 0.1 * noise2(x * 3, z * 3)) return roadC;
    if (Math.abs(x) < WX && z > WZ0 && z < WZ1) return yard;
    return soot(x, y, z, nx, ny, nz);
  } });

  /* the crag the roc perches on, and the ridge behind */
  const crag = peak(b, { x: ROC.x, y: ground(0, -6.4) - 0.3, z: ROC.z, r: 1.7, h: 3.2, lean: 0, taper: 0.45, flatTop: 1, steps: 2, rand: rng, palette: stonePal(5, { base: 0, cliff, ledge }) });
  for (const [x, z, r, h] of [[-6.0, -6.4, 1.1, 5.5], [6.2, -6.0, 1.0, 4.8], [-8.2, -2.6, 0.8, 3.2], [8.0, -2.2, 0.7, 3.0], [-3.4, -8.2, 0.9, 3.8], [3.6, -8.0, 0.9, 4.2]]) {
    const y = ground(x, z) - 0.3;
    peak(b, { x, y, z, r, h, lean: 0.18, rand: rng, taper: 0.88, steps: 2, palette: stonePal(h, { base: y, cliff, ledge }) });
  }
  for (const [x, z, h] of [[-7.4, 2.4, 1.8], [7.2, 3.0, 1.6], [-6.4, 6.0, 1.4], [5.8, 6.6, 1.5], [-8.6, -0.4, 1.6]]) bareTree(b, { x, y: ground(x, z) - 0.05, z, h, r: rng, color: '#2a2422' });

  /* the city wall with crenellations, corner towers, a gate tower */
  const wallC = '#5c544c', capC = '#3e3a36';
  const seg = (x0, z0, x1, z1, gap = 0) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
    const n = Math.floor(L / 0.45);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t);
      if (gap && Math.abs(x) < gap && Math.abs(z - WZ1) < 0.1) continue;
      b.box(L / n + 0.01, WH, 0.55, { x, y: 0.3, z, ry, color: (i % 3) ? wallC : '#544c46' });
      if (i % 2 === 0) b.box(0.24, 0.26, 0.6, { x, y: 0.3 + WH, z, ry, color: capC });
    }
  };
  seg(-WX, WZ0, WX, WZ0); seg(-WX, WZ1, WX, WZ1, 1.3); seg(-WX, WZ0, -WX, WZ1); seg(WX, WZ0, WX, WZ1);
  for (const sx of [-1, 1]) for (const z of [WZ0, WZ1]) {
    b.box(1.2, WH + 0.6, 1.2, { x: sx * WX, y: 0.3, z, color: '#4e4842' });
    roof(b, { x: sx * WX, y: 0.3 + WH + 0.6, z, w: 1.2, d: 1.2, h: 0.6, color: '#26262a', finial: false });
  }
  // gate tower over a dark arch
  b.box(2.6, WH + 0.2, 0.9, { x: 0, y: 0.3, z: WZ1, color: '#4e4842' });
  b.box(1.1, 1.1, 0.95, { x: 0, y: 0.3, z: WZ1, color: '#120e0e' });
  b.box(2.2, 0.8, 0.8, { x: 0, y: 0.3 + WH + 0.2, z: WZ1, color: '#5a3a30' });
  roof(b, { x: 0, y: 0.3 + WH + 1.0, z: WZ1, w: 2.4, d: 1.0, h: 0.55, color: '#26262a' });
  // inside: dark roofs, a palace hall, ember-lit windows
  hall(b, { x: 0, y: 0.35, z: -2.0, w: 3.4, d: 1.6, h: 1.1, tiers: 2, wall: '#4a3a34', pillar: '#4a2a22', beam: '#2a2a32', roofColor: '#222226', lit: 0.4, r: rng });
  for (const [x, z, ry] of [[-3.2, -1.8, 0], [3.2, -1.6, 0], [-3.1, 0.6, 0.1], [3.0, 0.8, -0.1], [-1.6, 1.8, 0], [1.8, 1.9, 0], [-3.4, 2.5, 0], [3.3, 2.6, 0]]) {
    house(b, { x, y: 0.35, z, ry, w: 1.3, d: 0.9, h: 0.65, wall: '#5a504a', roofColor: '#26262a', lit: 0.35, r: rng });
  }
  // banner poles (the cloth is animated)
  const banners = [];
  for (const [x, z] of [[-WX, WZ1], [WX, WZ1], [-WX, WZ0], [WX, WZ0], [-1.1, WZ1], [1.1, WZ1], [0, -2.0]]) {
    const y = z === -2.0 ? 3.3 : 0.3 + WH + 0.9;
    b.cyl(0.03, 0.035, 1.8, { x, y, z, color: '#2a2220', mat: M.wood, seg: 5 });
    banners.push([x, y + 1.75, z]);
  }

  /* the blue lion and the white elephant at the gate */
  {
    const L = new THREE.Vector3(-1.9, 0.35, WZ1 + 1.4);
    b.push({ x: L.x, y: ground(L.x, L.z), z: L.z, ry: 0.15, s: 1.25 });
    const blue = '#3e5a78', blueD = '#2a3e58';
    b.sphere(0.5, { y: 0.55, z: -0.2, sx: 0.8, sy: 0.75, sz: 1.1, color: blue, mat: M.smooth });
    b.sphere(0.42, { y: 0.95, z: 0.25, color: blue, mat: M.smooth });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; b.ico(0.17, { x: Math.cos(a) * 0.42, y: 1.0 + Math.sin(a) * 0.42, z: 0.18, color: blueD, mat: M.flat, detail: 0 }); }
    b.box(0.34, 0.24, 0.3, { y: 0.88, z: 0.6, color: '#4a6a88', mat: M.smooth });
    for (const sx of [-1, 1]) {
      b.sphere(0.06, { x: sx * 0.15, y: 1.06, z: 0.6, color: '#e8c050', mat: M.glow, glow: 1.3, ws: 6, hs: 4 });
      b.cyl(0.11, 0.13, 0.6, { x: sx * 0.24, y: 0, z: 0.4, color: blue, mat: M.smooth, seg: 7 });
      b.sphere(0.2, { x: sx * 0.32, y: 0.2, z: -0.45, sy: 0.7, color: blue, mat: M.smooth });
    }
    b.tube([[0, 0.5, -0.7], [0.2, 0.3, -1.0], [0.45, 0.4, -0.95]], 0.05, { color: blue, mat: M.smooth, radial: 5 });
    b.ico(0.12, { x: 0.48, y: 0.45, z: -0.92, color: blueD, mat: M.flat, detail: 0 });
    b.pop();
    const E = new THREE.Vector3(1.9, 0.35, WZ1 + 1.4);
    b.push({ x: E.x, y: ground(E.x, E.z), z: E.z, ry: -0.15, s: 1.25 });
    const ivory = '#e6e2d8', grey = '#cfcac0';
    b.sphere(0.62, { y: 0.95, z: -0.1, sx: 0.95, sy: 0.8, sz: 1.25, color: ivory, mat: M.smooth });
    for (const [lx, lz] of [[-0.32, 0.35], [0.32, 0.35], [-0.32, -0.5], [0.32, -0.5]]) b.cyl(0.17, 0.19, 0.6, { x: lx, y: 0, z: lz, color: grey, mat: M.smooth, seg: 8 });
    b.sphere(0.4, { y: 1.2, z: 0.62, color: ivory, mat: M.smooth });
    for (const sx of [-1, 1]) {
      b.sphere(0.36, { x: sx * 0.38, y: 1.2, z: 0.5, sx: 0.2, sy: 1.0, sz: 0.85, ry: sx * 0.4, color: grey, mat: M.smooth });   // ears
      b.cone(0.05, 0.45, { x: sx * 0.16, y: 0.88, z: 0.85, rx: 1.0, color: '#f6f0e0', mat: M.smooth, seg: 6 });               // tusks
      b.sphere(0.04, { x: sx * 0.18, y: 1.3, z: 0.92, color: '#1a1a1a', mat: M.lacquer, ws: 6, hs: 4 });
    }
    b.tube([[0, 1.1, 0.95], [0, 0.75, 1.1], [0, 0.35, 1.1], [0, 0.15, 1.25]], (t) => 0.13 * (1 - t * 0.55), { color: ivory, mat: M.smooth, radial: 7 });
    b.box(0.9, 0.06, 1.0, { y: 1.62, z: -0.1, color: '#5a2a2a', mat: M.cloth });
    b.pop();
  }

  /* the pilgrims on the road */
  {
    const at = (u) => { const f = u * (ROAD.length - 1), i = Math.min(ROAD.length - 2, Math.floor(f)), k = f - i; const x = lerp(ROAD[i][0], ROAD[i + 1][0], k), z = lerp(ROAD[i][1], ROAD[i + 1][1], k); return [x, ground(x, z), z]; };
    const face = Math.atan2(-1.2, -4.6) + 0.1;
    let [x, y, z] = at(0.42); figure(b, 'wukong', { x, y, z, ry: face, pose: 'staff', s: 1.5 });
    [x, y, z] = at(0.22); horse(b, { x, y, z, ry: face, rider: 'monk', s: 1.15 });
    [x, y, z] = at(0.1); figure(b, 'bajie', { x: x - 0.5, y, z, ry: face, s: 1.2 });
    [x, y, z] = at(0.06); figure(b, 'sha', { x: x + 0.4, y, z: z - 0.2, ry: face, s: 1.15 });
  }
  object.add(b.build());

  /* bones: heaps at the foot of the walls and scattered on the slopes */
  const BONES = 520;
  const bgeo = new THREE.CapsuleGeometry(0.035, 0.26, 2, 5);
  const bones = new THREE.InstancedMesh(bgeo, new THREE.MeshStandardMaterial({ color: '#e2dccb', roughness: 0.7 }), BONES);
  const SK = 60;
  const skulls = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshStandardMaterial({ color: '#ddd5c0', roughness: 0.6, flatShading: true }), SK);
  const heaps = [[-3.4, 4.6], [3.6, 4.4], [-5.6, 1.0], [5.7, -0.6], [-5.4, -2.6], [5.0, 3.6], [-2.4, 6.6], [3.0, 6.9], [0.6, -4.6], [-6.4, 4.2]];
  for (let i = 0; i < BONES; i++) {
    const [hx, hz] = heaps[i % heaps.length], rr = Math.sqrt(rng()) * 0.9, a = rng() * 6.28;
    const x = hx + Math.cos(a) * rr, z = hz + Math.sin(a) * rr;
    setInst(bones, i, x, ground(x, z) + 0.04 + (0.9 - rr) * 0.45 * rng(), z, rng() * 6.28, 1, Math.PI / 2 + (rng() - 0.5) * 0.8, (rng() - 0.5) * 0.8);
  }
  for (let i = 0; i < SK; i++) {
    const [hx, hz] = heaps[i % heaps.length], rr = Math.sqrt(rng()) * 0.7, a = rng() * 6.28;
    const x = hx + Math.cos(a) * rr, z = hz + Math.sin(a) * rr;
    setInst(skulls, i, x, ground(x, z) + 0.1 + (0.7 - rr) * 0.45, z, rng() * 6.28, [1, 0.9, 1.15]);
  }
  bones.castShadow = skulls.castShadow = true;
  object.add(bones, skulls);

  /* the Great Roc */
  const roc = new THREE.Group();
  const head = new THREE.Group();
  const wingL = new THREE.Group(), wingR = new THREE.Group();
  const top = crag[1];
  {
    const rb = new Builder();
    const bronze = '#5e4630', bronzeD = '#3e2e22', bronzeL = '#8a6a44', gold = '#c9973a';
    rb.sphere(1.25, { y: 2.3, sx: 1.0, sy: 1.6, sz: 0.95, color: bronzeD, mat: M.smooth });
    rb.sphere(0.95, { y: 2.6, z: 0.5, sx: 0.95, sy: 1.35, sz: 0.8, color: bronze, mat: M.smooth });
    rb.sphere(0.8, { y: 2.9, z: 0.72, sx: 0.85, sy: 1.15, sz: 0.55, color: '#7a5e3c', mat: M.smooth });       // paler breast
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; rb.cone(0.22, 0.9, { x: Math.cos(a) * 0.55, y: 3.85, z: 0.25 + Math.sin(a) * 0.45, rx: Math.PI + Math.sin(a) * 0.5, rz: Math.cos(a) * 0.6, color: i % 2 ? bronzeL : bronze, mat: M.flat, seg: 4 }); }   // neck ruff
    for (const sx of [-1, 1]) {                                        // legs and talons gripping the crag
      rb.cyl(0.16, 0.2, 1.0, { x: sx * 0.55, y: 0.2, z: 0.25, color: gold, mat: M.smooth, seg: 7 });
      for (const a of [-0.5, 0, 0.5]) rb.cone(0.07, 0.5, { x: sx * 0.55 + Math.sin(a) * 0.25, y: 0.12, z: 0.45, rx: 2.0, ry: a, color: '#2a2018', mat: M.smooth, seg: 5 });
    }
    for (let i = 0; i < 7; i++) {                                       // tail fan behind
      const a = (i - 3) * 0.22;
      rb.sphere(0.9, { x: Math.sin(a) * 0.9, y: 0.6, z: -0.9 - Math.cos(a) * 0.4, sx: 0.28, sy: 1.6, sz: 0.08, rz: -a, rx: 0.5, color: i % 2 ? bronze : bronzeD, mat: M.smooth, ws: 8, hs: 6 });
    }
    roc.add(rb.build());
    const hb = new Builder();
    hb.cyl(0.42, 0.65, 1.2, { y: -0.9, color: bronze, mat: M.smooth, seg: 10 });
    hb.sphere(0.55, { sz: 1.15, color: bronzeD, mat: M.smooth });
    hb.cone(0.24, 0.9, { y: -0.1, z: 0.75, rx: Math.PI / 2 + 0.35, color: gold, mat: M.metal, seg: 8 });                // hooked beak
    hb.cone(0.12, 0.32, { y: -0.42, z: 1.05, rx: Math.PI, color: gold, mat: M.metal, seg: 6 });
    for (const sx of [-1, 1]) {
      hb.sphere(0.09, { x: sx * 0.3, y: 0.12, z: 0.42, color: '#ffcc55', mat: M.glow, glow: 1.6, ws: 8, hs: 6 });   // eyes
      hb.box(0.28, 0.06, 0.08, { x: sx * 0.26, y: 0.24, z: 0.42, rz: sx * 0.35, color: '#1a1410', mat: M.smooth });
    }
    for (let i = 0; i < 5; i++) hb.cone(0.1, 0.8, { y: 0.4, z: -0.2 - i * 0.12, rx: -0.9 - i * 0.15, color: i % 2 ? gold : bronzeL, mat: M.smooth, seg: 4 });   // crest
    head.add(hb.build());
    head.position.set(0, 4.7, 0.45);
    roc.add(head);
    // wings: a bone line from the shoulder sweeping up and forward, feathers hanging off it
    for (const [g, sx] of [[wingL, -1], [wingR, 1]]) {
      const wb = new Builder();
      const bone = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(3.0, 2.0, 0.6), new THREE.Vector3(5.8, 3.9, 2.0), new THREE.Vector3(8.0, 5.6, 4.2)];
      const curve = new THREE.CatmullRomCurve3(bone);
      wb.tube(bone.map((v) => [v.x * sx, v.y, v.z]), (t) => 0.32 * (1 - t * 0.7), { color: bronzeD, mat: M.smooth, radial: 6, segs: 20 });
      const rows = [
        { n: 34, L: (t) => 2.4 + 3.6 * t * t, w: 0.5, col: [bronzeD, '#4a3626'], off: 0 },     // flight feathers
        { n: 26, L: (t) => 1.6 + 1.6 * t, w: 0.48, col: [bronze, '#6a5034'], off: 0.08 },        // coverts
        { n: 20, L: () => 0.9, w: 0.4, col: [bronzeL, '#7a5e3c'], off: 0.16 },                  // lesser coverts, light edge
      ];
      for (const row of rows) for (let i = 0; i < row.n; i++) {
        const t = (i + 0.5) / row.n;
        const P = curve.getPointAt(t);
        const T = curve.getTangentAt(t);
        // feathers hang down and fan out toward the tip
        const D = new THREE.Vector3(0, -1, 0).lerp(T.clone().multiplyScalar(1), 0.15 + 0.6 * t * t).normalize();
        D.z -= 0.15;
        const L = row.L(t);
        const C0 = P.clone().addScaledVector(D, L / 2);
        const e = eulerTo(new THREE.Vector3(D.x * sx, D.y, D.z));
        wb.sphere(1, { x: C0.x * sx, y: C0.y, z: C0.z + row.off, sx: row.w, sy: L / 2, sz: 0.05, ...e, color: row.col[i % 2], mat: M.smooth, ws: 8, hs: 6 });
      }
      g.add(wb.build());
      g.position.set(sx * 0.9, 3.6, 0.1);
      roc.add(g);
    }
  }
  roc.position.set(ROC.x, top - 0.05, ROC.z);
  roc.scale.setScalar(1.08);
  object.add(roc);

  /* black banners, smoke, drifting ash */
  const bannerGeo = new THREE.PlaneGeometry(0.9, 0.45, 8, 1);
  bannerGeo.translate(0.45, -0.22, 0);
  const bannerBase = bannerGeo.attributes.position.array.slice();
  const bannerMat = new THREE.MeshStandardMaterial({ color: '#1a1818', roughness: 0.9, side: THREE.DoubleSide });
  const flags = banners.map(([x, y, z]) => { const m = new THREE.Mesh(bannerGeo.clone(), bannerMat); m.position.set(x, y, z); m.castShadow = true; object.add(m); return m; });
  const SM = 40;
  const smoke = softPuffs(SM, { color: '#3a3430', opacity: 0.42 });
  object.add(smoke.points);
  const srcs = [[-3.2, -1.8], [3.0, 0.8], [0, -2.0], [-1.6, 1.8], [3.3, 2.6]];

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const br = Math.sin(u * Math.PI * 2);
    wingL.rotation.set(0.04 * br, 0, -0.07 * br);
    wingR.rotation.set(0.04 * br, 0, 0.07 * br);
    head.rotation.y = 0.45 * Math.sin(u * Math.PI * 2 + 1.2);
    head.rotation.x = 0.1 + 0.08 * Math.sin(t * 0.5);
    roc.position.y = top - 0.05 + 0.06 * br;
    flags.forEach((m, j) => {
      const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) {
        const x = bannerBase[i * 3];
        P.setZ(i, Math.sin(x * 5 - t * 4 + j) * 0.08 * x);
        P.setY(i, bannerBase[i * 3 + 1] - x * x * 0.06);
      }
      P.needsUpdate = true;
      m.rotation.y = -0.6 + 0.15 * Math.sin(t * 0.7 + j);
    });
    for (let i = 0; i < SM; i++) {
      const s = srcs[i % srcs.length], p = (t * 0.05 + i / SM) % 1;
      smoke.set(i, s[0] + p * 2.2 + Math.sin(p * 5 + i) * 0.3, 1.4 + p * 7, s[1] - p * 1.0, 0.6 + p * 2.6, Math.sin(Math.PI * p) * 0.8);
    }
    smoke.commit();
    void clamp;
  }
  update(0);
  return { object, update };
}
