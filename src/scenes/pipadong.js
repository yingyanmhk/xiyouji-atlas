// 琵琶洞 (毒敌山, ch.55) — the mountain itself is a pipa standing on its base: a pear-shaped
// rose-brown body, frets and four stone strings running up a long neck, a pegbox bent back.
// The scorpion demon's cave opens in its belly under the bridge. At dawn the Pleiades star lord
// (昴日星官) stands on the pegbox as a giant double-combed rooster; two crows (visible rings)
// roll down the strings: at the first the demon shows her true form — a scorpion as big as a
// pipa — at the second she dies. Loop 20 s.
import { THREE, Builder, M, C, terrain, peak, rock, pine, figure, horse, fbm, noise2, smooth, clamp, lerp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { loft, stonePal, polyDist, pulse } from './_d_util.js';

const CYCLE = 20;
const MZ = -1.6;            // the pipa's centre plane (z)
const S0 = 0.84;            // where the neck turns into the pegbox
const Y0 = -0.4, YN = 12.2; // bottom / nut
const HEAD = 2.5, BEND = 1.05;

// piecewise smooth interpolation over [[y, v], ...]
const curve = (stops, y) => {
  if (y <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (y <= stops[i][0]) {
    const [a, va] = stops[i - 1], [b, vb] = stops[i];
    const t = (y - a) / (b - a), e = t * t * (3 - 2 * t);
    return va + (vb - va) * e;
  }
  return stops[stops.length - 1][1];
};
const pathPt = (s) => {
  if (s <= S0) return [0, Y0 + (s / S0) * (YN - Y0), MZ];
  const u = (s - S0) / (1 - S0), L = u * HEAD, k = BEND / HEAD;
  const a = u * BEND;                                     // arc bending backward (−z)
  const y = Math.sin(a) / k, z = -(1 - Math.cos(a)) / k;
  return [0, YN + (L > 0 ? y : 0), MZ + z];
};
const yOf = (s) => (s <= S0 ? Y0 + (s / S0) * (YN - Y0) : YN + 0.1);
const WID = [[-0.4, 2.9], [0.4, 3.35], [2.6, 3.75], [4.8, 3.2], [6.6, 1.9], [7.8, 1.0], [8.4, 0.88], [12.0, 0.78]];
const rx = (s) => (s <= S0 ? curve(WID, yOf(s)) : lerp(0.92, 0.5, Math.pow((s - S0) / (1 - S0), 1.3)));
const rf = (s) => (s <= S0 ? curve([[-0.4, 0.95], [6.5, 0.9], [8, 0.55]], yOf(s)) : 0.5);
const rb = (s) => (s <= S0 ? curve([[-0.4, 2.3], [2.6, 2.6], [5.5, 2.0], [7.6, 0.85], [9, 0.7]], yOf(s)) : lerp(0.7, 0.4, (s - S0) / (1 - S0)));
const FRONT = MZ + 0.92;

const PATH = [[2.2, 9.6], [1.9, 6.6], [0.9, 3.4], [0.1, 0.6]];
function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 7, z * 0.3 + 1, 4);
  let h = 0.2 + 0.5 * n;
  h += smooth(4, -8, z) * smooth(10.4, 5, r) * (1.2 + 2.2 * n);              // foothills behind
  h += smooth(3.5, 0.5, Math.hypot(x + 6.3, z - 2.5)) * 0.9 * n;             // knoll front-left
  h *= 1 - 0.5 * smooth(1.6, 0.3, polyDist(PATH, x, z));
  return Math.max(0.08, h * smooth(10.6, 9.6, r) + 0.08);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const cliff = [[0, '#5a3632'], [0.18, '#7a463d'], [0.45, '#9e6355'], [0.75, '#bf8673'], [1, '#d6a690']];
  const ledge = [[0, '#a48a6a'], [0.4, '#7f8c69'], [1, '#5e8670']];
  const soil = stonePal(3, { cliff: [[0, '#8a5a4a'], [0.5, '#a06b58'], [1, '#7c5a4c']], ledge: [[0, '#b0846c'], [0.6, '#9a8a68'], [1, '#6f8466']], ledgeAt: 0.8 });
  const roadCol = new THREE.Color('#d2ad92');
  terrain(b, { R: 10.5, rings: 42, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => (polyDist(PATH, x, z) < 0.38 + 0.1 * noise2(x * 3, z * 3) ? roadCol : soil(x, y, z, nx, ny, nz)) });

  /* the pipa mountain */
  const pipaPal = stonePal(14.5, { cliff, ledge, ledgeAt: 0.62 });
  loft(b, { path: pathPt, rx, rf, rb, rings: 58, seg: 26, front: 0.85, noise: 0.1, ph: 3, palette: pipaPal });
  // 相 and 品: frets as stone ribs across the soundboard and the neck
  const frets = [5.3, 6.25, 7.15, 8.6, 9.6, 10.5, 11.3];
  for (const fy of frets) {
    const w = Math.min(curve(WID, fy) * 0.62, 1.1);
    b.box(w * 2, 0.16, 0.34, { x: 0, y: fy, z: FRONT + 0.02 + (fy > 7.8 ? -0.36 : 0), color: '#c99e86', mat: M.flat });
  }
  // nut and 覆手 bridge
  b.box(1.5, 0.22, 0.4, { y: YN - 0.15, z: FRONT - 0.32, color: '#e0c0a8', mat: M.flat });
  b.box(2.6, 0.32, 0.5, { y: 2.55, z: FRONT + 0.05, color: '#c28c74', mat: M.flat });
  b.box(2.9, 0.12, 0.6, { y: 2.85, z: FRONT + 0.05, color: '#d8b39a', mat: M.flat });
  // four strings, from the bridge up to the nut
  const STRX = [-0.39, -0.13, 0.13, 0.39];
  for (const sx of STRX) {
    const z0 = FRONT + 0.32, z1 = FRONT - 0.08;
    b.tube([[sx, 2.95, z0], [sx * 0.85, 7.5, lerp(z0, z1, 0.5)], [sx * 0.7, YN - 0.05, z1]], 0.032, { color: '#efe0cc', mat: M.smooth, radial: 5, segs: 10 });
  }
  // pegs: four stone knobs on the pegbox
  for (let i = 0; i < 4; i++) {
    const s = S0 + (0.3 + (i >> 1) * 0.38) * (1 - S0), p = pathPt(s), sd = i % 2 ? 1 : -1;
    b.cyl(0.13, 0.17, 0.75, { x: p[0] + sd * 0.55, y: p[1], z: p[2], rz: -sd * Math.PI / 2, color: '#6e403a', mat: M.flat, seg: 6 });
    b.sphere(0.2, { x: p[0] + sd * 1.3, y: p[1], z: p[2], sx: 0.6, color: '#7e4b42', mat: M.flat, ws: 6, hs: 5 });
  }

  /* the cave in the belly: dark arch with two stone doors ajar */
  {
    const sh = new THREE.Shape();
    sh.moveTo(-0.8, 0); sh.lineTo(-0.8, 1.2); sh.absarc(0, 1.2, 0.8, Math.PI, 0, true); sh.lineTo(0.8, 0); sh.lineTo(-0.8, 0);
    b.extrude(sh, 0.12, { x: 0, y: 0.05, z: FRONT + 0.0, color: '#1b1214', mat: M.stone });
    const fr = new THREE.Shape();
    fr.moveTo(-1.15, 0); fr.lineTo(-1.15, 1.25); fr.absarc(0, 1.25, 1.15, Math.PI, 0, true); fr.lineTo(1.15, 0); fr.lineTo(0.8, 0);
    fr.lineTo(0.8, 1.2); fr.absarc(0, 1.2, 0.8, 0, Math.PI, false); fr.lineTo(-0.8, 0); fr.lineTo(-1.15, 0);
    b.extrude(fr, 0.3, { x: 0, y: 0.05, z: FRONT + 0.05, color: '#7a4a40', mat: M.flat });
    for (const sd of [-1, 1]) b.box(0.72, 1.55, 0.1, { x: sd * 1.05, y: 0.05, z: FRONT + 0.42, ry: sd * -0.9, color: '#6a5550', mat: M.flat });
    b.box(0.5, 0.3, 0.05, { x: 0, y: 0.35, z: FRONT + 0.07, color: '#d58a6a', mat: M.glow, glow: 0.55 });
    for (let i = 0; i < 4; i++) b.box(2.0 - i * 0.25, 0.08, 0.35, { y: 0.0 + i * 0.0, z: FRONT + 0.55 + i * 0.32, color: '#b99079', mat: M.flat, sy: 1 + i * 0.0 });
  }

  /* foothills: low rose spires, boulders, a few pines */
  for (const [x, z, r, h] of [[-6.2, -3.4, 1.1, 4.6], [6.1, -3.8, 1.0, 5.2], [-7.6, 0.4, 0.75, 2.6], [7.4, -0.6, 0.7, 3.1], [-4.4, -6.4, 1.2, 5.6], [4.0, -6.8, 1.1, 4.4]]) {
    const y = ground(x, z) - 0.3;
    peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, taper: 0.8, palette: stonePal(h, { base: y, cliff, ledge, ledgeAt: 0.6 }) });
  }
  for (let i = 0; i < 16; i++) {
    const [x, z] = rng.inDisc(9.4, 3.6);
    if (polyDist(PATH, x, z) < 1 || Math.abs(x) < 4.2 && z < 1 && z > -5) continue;
    const y = ground(x, z);
    rock(b, { x, y: y - 0.1, z, r: 0.3 + rng() * 0.5, h: 0.4 + rng() * 0.6, rand: rng, palette: stonePal(1.4, { base: y - 0.3, cliff, ledge }) });
  }
  for (const [x, z, h] of [[-5.3, 3.2, 1.7], [-7.0, -1.8, 1.9], [6.6, 1.6, 1.5], [-3.6, 6.4, 1.3], [5.2, -5.0, 2.1]]) pine(b, { x, y: ground(x, z) - 0.05, z, h, r: rng, lean: 0.3 });
  // a stunted pine on each shoulder of the body
  pine(b, { x: -2.5, y: 6.0, z: MZ + 0.2, h: 1.0, r: rng, lean: 0.5 });
  pine(b, { x: 2.75, y: 5.2, z: MZ + 0.0, h: 0.9, r: rng, lean: 0.5 });

  /* the pilgrims at the foot: Wukong looks up at the rooster; Bajie (stung on the snout) behind */
  figure(b, 'wukong', { x: 1.9, y: ground(1.9, 4.0), z: 4.0, ry: -0.5, pose: 'gaze', s: 1.55 });
  figure(b, 'bajie', { x: 3.1, y: ground(3.1, 5.1), z: 5.1, ry: -0.7, s: 1.2 });
  figure(b, 'sha', { x: -3.4, y: ground(-3.4, 5.4), z: 5.4, ry: 0.6, s: 1.15 });
  horse(b, { x: -4.4, y: ground(-4.4, 5.9), z: 5.9, ry: 0.9, s: 1.05 });
  object.add(b.build());

  /* ------------------------------------------------ 昴日星官, the rooster --- */
  const ROO = new THREE.Group();
  const neck = new THREE.Group();
  const lower = new THREE.Group();
  {
    const rb2 = new Builder();
    const plume = '#9c3a1e', dark = '#1f3832', gold = '#e0922e', yel = '#e3b23c', red = '#d4281c';
    for (const sx of [-1, 1]) {           // legs and toes
      rb2.cyl(0.05, 0.06, 0.6, { x: sx * 0.16, y: 0, z: 0.02, color: yel, mat: M.smooth, seg: 6 });
      for (const a of [-0.5, 0, 0.5]) rb2.cyl(0.025, 0.03, 0.28, { x: sx * 0.16 + Math.sin(a) * 0.12, y: 0.02, z: 0.12, rx: Math.PI / 2 - 0.1, ry: a, color: yel, mat: M.smooth, seg: 5 });
      rb2.cyl(0.02, 0.025, 0.2, { x: sx * 0.16, y: 0.03, z: -0.06, rx: -Math.PI / 2 + 0.2, color: yel, mat: M.smooth, seg: 5 });
    }
    rb2.sphere(0.58, { y: 0.98, z: -0.05, sx: 0.78, sy: 0.72, sz: 1.08, color: plume, mat: M.smooth });
    rb2.sphere(0.36, { y: 0.95, z: 0.3, sx: 0.9, sy: 0.95, color: '#3b2620', mat: M.lacquer });          // black-green breast
    for (const sx of [-1, 1]) {
      rb2.sphere(0.46, { x: sx * 0.38, y: 1.02, z: -0.08, sx: 0.22, sy: 0.55, sz: 1.0, rx: 0.25, color: '#6a2616', mat: M.smooth });   // wing
      rb2.sphere(0.36, { x: sx * 0.42, y: 0.86, z: -0.28, sx: 0.12, sy: 0.32, sz: 0.9, rx: 0.4, color: gold, mat: M.smooth });         // gold wing bar
    }
    // sickle tail: arching feathers of black-green and bronze
    for (let i = 0; i < 9; i++) {
      const sp = (i - 4) * 0.07, len = 1.05 + (4 - Math.abs(i - 4)) * 0.18, col = i % 3 === 1 ? '#7a5a22' : dark;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, ang = 0.3 + t * 2.5;
        pts.push([sp * (1 + t * 2.5), 1.05 + Math.sin(ang) * len * 0.75, -0.45 - (1 - Math.cos(ang)) * len * 0.42]);
      }
      rb2.tube(pts, (t) => 0.07 * (1 - t * 0.8), { color: col, mat: M.smooth, radial: 5, segs: 14 });
    }
    ROO.add(rb2.build());
    // neck, head, comb, wattles, beak
    const nb = new Builder();
    nb.cyl(0.17, 0.33, 0.62, { y: 0, z: 0, rx: 0.35, color: gold, mat: M.smooth, seg: 10 });               // golden hackles
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; nb.cone(0.07, 0.42, { x: Math.cos(a) * 0.26, y: 0.05, z: Math.sin(a) * 0.26 - 0.05, rx: Math.PI + 0.3 * Math.sin(a), rz: 0.3 * Math.cos(a), color: '#c4701e', mat: M.smooth, seg: 5 }); }
    nb.sphere(0.19, { y: 0.66, z: 0.2, sz: 1.15, color: '#b8401e', mat: M.smooth });
    for (let i = 0; i < 5; i++) for (const sx of [-0.055, 0.055]) nb.sphere(0.07 + (i === 1 || i === 2 ? 0.025 : 0), { x: sx, y: 0.86 + Math.sin((i / 4) * Math.PI) * 0.08, z: 0.34 - i * 0.09, sx: 0.45, color: red, mat: M.smooth, ws: 8, hs: 6 });  // 双冠
    nb.cone(0.055, 0.2, { y: 0.66, z: 0.38, rx: Math.PI / 2 - 0.1, color: yel, mat: M.smooth, seg: 6 });
    for (const sx of [-1, 1]) nb.sphere(0.03, { x: sx * 0.1, y: 0.7, z: 0.3, color: '#1a1a14', mat: M.lacquer, ws: 6, hs: 4 });
    neck.add(nb.build());
    const lb = new Builder();
    lb.cone(0.045, 0.16, { y: 0, z: 0, rx: Math.PI / 2 + 0.15, color: '#c99a30', mat: M.smooth, seg: 6 });
    for (const sx of [-1, 1]) lb.sphere(0.06, { x: sx * 0.04, y: -0.1, z: -0.02, sy: 1.5, sx: 0.6, color: red, mat: M.smooth, ws: 8, hs: 6 });  // wattles
    lower.add(lb.build());
    lower.position.set(0, 0.63, 0.38);
    neck.add(lower);
    neck.position.set(0, 1.25, 0.3);
    ROO.add(neck);
  }
  const pbx = pathPt(S0 + 0.45 * (1 - S0));
  const topZ = (() => { const p = pathPt(S0 + 0.46 * (1 - S0)), q = pathPt(S0 + 0.44 * (1 - S0)); return [p[1] - q[1], p[2] - q[2]]; })();
  const nrm = Math.hypot(...topZ), nY = -topZ[1] / nrm, nZ = topZ[0] / nrm;   // pegbox surface normal (y,z)
  void nY;
  ROO.position.set(0.15, pbx[1] + nZ * 0.47 - 0.05, pbx[2] + 0.55);
  ROO.rotation.y = 0.55;
  ROO.scale.setScalar(1.5);
  object.add(ROO);

  /* the crow: rings rolling from the beak down to the cave */
  const RINGS = 5;
  const ringGeo = new THREE.TorusGeometry(1, 0.035, 6, 48);
  const rings = [];
  for (let i = 0; i < RINGS; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1d6').multiplyScalar(1.15), transparent: true, opacity: 0, depthWrite: false }));
    object.add(m); rings.push(m);
  }
  ROO.updateMatrixWorld(true);
  const beak = new THREE.Vector3(0, 1.9, 0.7).applyMatrix4(ROO.matrix);
  const caveP = new THREE.Vector3(0.2, 1.2, FRONT + 3.2);
  const dir = caveP.clone().sub(beak);
  const _v = new THREE.Vector3(), Z_AX = new THREE.Vector3(0, 0, 1), _n = new THREE.Vector3(dir.x, dir.y * 0.12, dir.z).normalize();

  /* the scorpion, as big as a pipa */
  const scorp = new THREE.Group();
  const tail = new THREE.Group();
  {
    const sb = new Builder(), col = '#3e2232', colL = '#6a3a48';
    for (let i = 0; i < 7; i++) sb.sphere(0.22 - i * 0.012, { z: 0.35 - i * 0.14, y: 0.16, sx: 1.25, sy: 0.4, sz: 0.75, color: i % 2 ? col : colL, mat: M.lacquer, ws: 10, hs: 6 });
    sb.sphere(0.17, { z: 0.55, y: 0.15, sx: 1.1, sy: 0.45, color: col, mat: M.lacquer });
    for (const sx of [-1, 1]) {
      sb.tube([[sx * 0.14, 0.15, 0.6], [sx * 0.32, 0.2, 0.8], [sx * 0.3, 0.2, 1.02]], 0.04, { color: col, mat: M.lacquer, radial: 5 });
      sb.sphere(0.12, { x: sx * 0.3, y: 0.2, z: 1.1, sx: 0.8, sy: 0.5, sz: 1.3, color: colL, mat: M.lacquer });       // pincer
      sb.cone(0.04, 0.2, { x: sx * 0.24, y: 0.2, z: 1.2, rx: Math.PI / 2, ry: -sx * 0.4, color: col, mat: M.lacquer, seg: 5 });
      for (let k = 0; k < 4; k++) {
        const z = 0.35 - k * 0.15;
        sb.tube([[sx * 0.18, 0.16, z], [sx * 0.42, 0.24, z + 0.05 - k * 0.04], [sx * 0.55, 0.0, z - k * 0.06]], 0.022, { color: col, mat: M.lacquer, radial: 4, segs: 6 });
      }
    }
    scorp.add(sb.build());
    const tb = new Builder();
    const tp = [];
    for (let k = 0; k <= 6; k++) { const a = (k / 6) * 2.5; tp.push([0, Math.sin(a) * 0.55, -Math.sin(a * 0.5) * 0.15 - (1 - Math.cos(a)) * -0.28 - k * 0.0]); }
    for (let k = 0; k < 6; k++) tb.sphere(0.1 - k * 0.008, { x: 0, y: tp[k][1], z: -tp[k][2] * 0 - k * 0.07 + Math.sin(k * 0.45) * 0.12, sy: 0.85, color: k % 2 ? col : colL, mat: M.lacquer, ws: 8, hs: 6 });
    tb.cone(0.06, 0.24, { y: 0.55, z: 0.15, rx: 2.4, color: '#c79a3a', mat: M.metal, seg: 6 });  // 倒马毒桩 stinger
    tail.add(tb.build());
    tail.position.set(0, 0.18, -0.55);
    scorp.add(tail);
  }
  scorp.scale.setScalar(1.6);
  object.add(scorp);

  /* dawn mist about the foot of the mountain */
  const MIST = 60;
  const mist = softPuffs(MIST, { color: '#f6cdbd', opacity: 0.62 });
  const halo = softPuffs(3, { color: '#ffb58e', opacity: 0.32, additive: true });
  object.add(mist.points, halo.points);
  const md = Array.from({ length: MIST }, () => { const a = rng() * Math.PI * 2, d = 3.8 + rng() * 5.8; return { a, d, y: 0.3 + rng() * 1.2, s: 1.6 + rng() * 2.4, ph: rng() * 10 }; });

  const crowAt = [3.0, 9.0];
  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(mist, nk);
    const u = t % CYCLE;
    // rooster: neck stretches up and the beak opens on each crow
    let c = 0;
    for (const ct of crowAt) c = Math.max(c, pulse(ct - 0.9, ct - 0.2, ct + 1.6, ct + 2.4, u));
    neck.rotation.x = -0.55 * c + 0.05 * Math.sin(t * 1.3);
    neck.position.y = 1.25 + 0.12 * c;
    lower.rotation.x = 0.5 * c;
    ROO.rotation.y = 0.55 + 0.08 * Math.sin(t * 0.4);
    // rings: each crow sends a train of rings down to the cave
    for (let i = 0; i < RINGS; i++) {
      const m = rings[i];
      let best = -1;
      for (const ct of crowAt) { const p = (u - ct - i * 0.32) / 2.6; if (p >= 0 && p <= 1) best = p; }
      if (best < 0) { m.visible = false; continue; }
      m.visible = true;
      _v.copy(dir).multiplyScalar(best).add(beak);
      m.position.copy(_v);
      m.quaternion.setFromUnitVectors(Z_AX, _n);
      m.scale.setScalar(0.25 + best * 2.4);
      m.material.opacity = 0.85 * Math.sin(Math.PI * Math.sqrt(best)) * (1 - best * 0.35);
    }
    // the scorpion: crawls out at dawn, rears at the first crow, dies at the second, is drawn back
    const out = smooth(0.2, 2.6, u) * (1 - smooth(16.5, 19.4, u));
    const die = smooth(9.8, 11.2, u);
    const rear = smooth(3.2, 4.0, u) * (1 - die);
    scorp.position.set(0.15, 0.05 + Math.max(0, ground(0.15, FRONT + 1.5) - 0.1), lerp(FRONT + 0.6, FRONT + 2.05, out));
    scorp.rotation.set(-0.25 * rear, Math.sin(t * 0.7) * 0.15 * (1 - die), 0.5 * die);
    scorp.scale.setScalar(1.6 * Math.max(0.001, smooth(0, 0.25, out)));
    tail.rotation.x = -0.35 * rear + 1.0 * die + 0.08 * Math.sin(t * 1.7) * (1 - die);
    for (let i = 0; i < MIST; i++) {
      const m = md[i], a = m.a + t * 0.015;
      mist.set(i, Math.cos(a) * m.d, m.y + 0.2 * Math.sin(t * 0.3 + m.ph), Math.sin(a) * m.d * 0.85 - 0.6, m.s, 0.55 + 0.25 * Math.sin(t * 0.2 + m.ph));
    }
    mist.commit();
    for (let i = 0; i < 3; i++) halo.set(i, beak.x - 0.6, beak.y - 0.6 - i * 0.2, beak.z - 1.2, 3.5 + i * 2.2 + 0.4 * Math.sin(t * 0.5 + i), 0.55 - i * 0.15 + 0.3 * c);
    halo.commit();
  }
  update(0);
  void clamp;
  return { object, update };
}
