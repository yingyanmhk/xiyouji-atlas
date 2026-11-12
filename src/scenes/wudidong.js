// 无底洞 · 陷空山 — the mountain sliced open like a geologist's section. A crack no wider than a
// water-jar's mouth (缸口大) opens on the summit, where Wukong peers in; the shaft winds down through
// banded strata to a lamp-lit palace at the very bottom — the lair of the golden-nosed white mouse
// (地涌夫人), who holds Tang Seng for her wedding. In a 24 s loop a golden fly (Wukong) drops down
// the shaft into her garden and becomes the red peach on the tree that she will swallow.
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, peachTree, figure, qinglv, fbm, noise2, hash2, smooth, clamp, lerp, mix, softPuffs } from '../kit.js';
import { person, lantern } from './_e_kit.js';

const CYCLE = 24;
const ZC = 1.0;            // the plane of the cut, facing the viewer (+z)
const DX = 0.2;            // shared x step of face and summit grids
const FLOOR = 0.5;         // floor of the cavern

function H(x, z) {
  const r = Math.hypot(x, z);
  let h = 7.2 * smooth(10.2, 6.6, r);
  const bump = (bx, bz, s, a) => a * Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (s * s));
  h += bump(-3.4, -2.6, 2.4, 3.2) + bump(3.2, -3.8, 2.2, 2.4) + bump(0.4, -0.4, 1.8, 1.4) + bump(-6.4, -1.5, 1.6, 0.9);
  h += (fbm(x * 0.35 + 4, z * 0.35 - 2, 4) - 0.5) * 2.2 * smooth(10.2, 7, r);
  return Math.max(0.05, h * smooth(10.35, 9.6, r));
}
const TOP = (x) => H(x, ZC);
const MOUTH_X = -2.0;
const shaftX = (y, top) => MOUTH_X + 1.25 * Math.sin((top - y) * 0.62) + 0.5 * Math.sin((top - y) * 1.5);

function depth(x, y) {
  const top = TOP(MOUTH_X);
  let d = 0;
  if (y > 2.8 && y < top + 0.6) {
    const w = lerp(0.58, 0.3, smooth(top - 1.6, top, y)) * (0.85 + 0.3 * noise2(y * 2.1, 3));
    const dx = x - shaftX(y, top);
    if (Math.abs(dx) < w) d = 0.85 * Math.sqrt(1 - (dx / w) ** 2);
  }
  if (y > FLOOR - 0.1) {
    const n = (noise2(x * 0.9 + 7, y * 0.9) - 0.5) * 0.3;
    const e = ((x - 0.5) / 4.9) ** 4 + ((y - 2.15) / 1.85) ** 4 + n;
    if (e < 1) d = Math.max(d, 3.4 * Math.sqrt(1 - e));
  }
  return d;
}

const _grey = new THREE.Color('#9a8f7c');
// banded strata of the cut face (赭 · 青 · 绿 layers, gently folded)
const BANDS = ['#c9a477', '#a6764c', '#8b6c52', '#5b7a6c', '#3d6884', '#6d8f74', '#b18a5e', '#40607a', '#7a6a58'];
function strata(x, y) {
  const v = y * 1.25 + 1.1 * Math.sin(x * 0.28 + 1) + 0.8 * (noise2(x * 0.4, y * 0.3) - 0.5);
  const i = Math.floor(v), f = v - i;
  const c = mix(BANDS[((i % BANDS.length) + BANDS.length) % BANDS.length], BANDS[(((i + 1) % BANDS.length) + BANDS.length) % BANDS.length], smooth(0.55, 1, f));
  return c.lerp(_grey, 0.18).multiplyScalar(0.9 + 0.12 * hash2(x * 31, y * 29));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  // base ground in front: the black pine wood (黑松林)
  terrain(b, { R: 10.5, rings: 20, segs: 90, fn: (x, z) => 0.12 + 0.12 * fbm(x * 0.5, z * 0.5, 3), palette: (x, y, z) => mix('#5f6b4c', '#7c7a58', fbm(x * 0.6, z * 0.6, 2)) });

  /* the summit: a heightfield behind the cut, with a hole at the mouth */
  {
    const xs = [], zs = [];
    for (let x = -10.4; x <= 10.4 + 1e-6; x += DX) xs.push(+x.toFixed(3));
    for (let z = -10.4; z < ZC - 1e-6; z += 0.3) zs.push(z);
    zs.push(ZC);
    const pos = [], idx = [];
    for (const z of zs) for (const x of xs) pos.push(x, H(x, z), z);
    const W = xs.length;
    for (let k = 0; k < zs.length - 1; k++) for (let i = 0; i < W - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[k] + zs[k + 1]) / 2;
      if (Math.hypot(cx, cz) > 10.35) continue;
      const a = k * W + i, bb = a + 1, c = a + W + 1, d = a + W;
      idx.push(a, c, bb, a, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    b.geo(g, { mat: M.flat, flatNormals: true, faceColor: qinglv(11) });
  }

  /* the cut face, carved with the shaft and the cavern */
  {
    const xs = [];
    for (let x = -10.4; x <= 10.4 + 1e-6; x += DX) if (Math.hypot(x, ZC) < 10.36) xs.push(+x.toFixed(3));
    const NY = 70, W = xs.length;
    const pos = [];
    for (let j = 0; j <= NY; j++) for (const x of xs) {
      const top = TOP(x), y = (top * j) / NY;
      const d = depth(x, y);
      const jit = j > 0 && j < NY ? (noise2(x * 2.3, y * 2.3) - 0.5) * 0.08 : 0;
      pos.push(x, y, ZC - d + jit * (d > 0 ? 2 : 1));
    }
    const idx = [];
    for (let j = 0; j < NY; j++) for (let i = 0; i < W - 1; i++) {
      const a = j * W + i, bb = a + 1, c = a + W + 1, d = a + W;
      idx.push(a, bb, c, a, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const cav = new THREE.Color();
    b.geo(g, {
      mat: M.flat, flatNormals: true,
      faceColor: (x, y, z, nx, ny, nz) => {
        const d = ZC - z;
        if (d < 0.06) return strata(x, y);
        // inside: ink-blue shaft walls, warming toward the lamp-lit palace below
        const warm = smooth(4.6, 0.6, y) * smooth(5.5, 1, Math.abs(x - 0.5));
        cav.set('#1f2a36').lerp(new THREE.Color('#8a5a34'), warm * 0.85);
        return cav.multiplyScalar(0.85 + 0.3 * hash2(x * 17, y * 13) + (ny > 0.5 ? 0.2 : 0));
      },
    });
  }


  /* the cavern floor and the palace at the bottom */
  b.box(9.6, FLOOR, 3.4, { x: 0.5, y: 0, z: ZC - 1.7, color: '#7a6450', mat: M.stone });
  b.box(9.0, 0.03, 2.6, { x: 0.6, y: FLOOR, z: ZC - 1.4, color: '#9a8466', mat: M.stone });
  hall(b, { x: 1.4, y: FLOOR, z: ZC - 2.05, w: 2.6, d: 1.05, h: 0.9, base: 0.14, tiers: 2, roofColor: '#5b3f53', wall: '#c9b79a', pillar: C.cinnabar, beam: '#4a5f6b', lit: 1, r: rng, steps: false });
  // red carpet and a wedding table set with cups
  b.box(0.7, 0.012, 1.3, { x: 1.4, y: FLOOR + 0.03, z: ZC - 0.85, color: C.cinnabar, mat: M.cloth });
  b.box(0.8, 0.28, 0.4, { x: -0.6, y: FLOOR + 0.03, z: ZC - 1.0, color: C.woodD, mat: M.lacquer });
  for (let i = 0; i < 4; i++) b.cyl(0.03, 0.025, 0.05, { x: -0.9 + i * 0.2, y: FLOOR + 0.31, z: ZC - 1.0, color: C.gold, mat: M.metal, seg: 8 });
  // the garden where the red peach hangs
  peachTree(b, { x: -2.7, y: FLOOR, z: ZC - 1.6, h: 1.25, r: rng, fruit: 3 });
  for (let i = 0; i < 9; i++) b.ico(0.1 + rng() * 0.08, { x: -4 + rng() * 2.2, y: FLOOR + 0.06, z: ZC - 0.6 - rng() * 1.2, sy: 0.6, color: rng() < 0.5 ? '#c86a7a' : '#e6c05a', mat: M.flat });
  for (const [x, z] of [[3.9, -0.8], [-4.2, -0.9]]) rock(b, { x, y: FLOOR, z: ZC + z, r: 0.35, h: 0.8, rand: rng, color: '#6e6a62' });
  // lamps hanging from the cavern roof
  for (const [x, y] of [[-1.8, 3.6], [0.2, 3.85], [2.8, 3.7], [4.3, 3.3]]) {
    b.cyl(0.004, 0.004, 0.8, { x, y: y - 0.3, z: ZC - 1.2, color: C.ink, seg: 3 });
    lantern(b, { x, y: y - 0.3, z: ZC - 1.2, s: 1.1, glow: 1.5, color: '#ffb065' });
  }
  // the bride and her captive: the mouse spirit in white, Tang Seng reaching for the peach
  person(b, { x: -1.9, y: FLOOR + 0.03, z: ZC - 0.9, ry: -0.7, robe: '#f1ece2', robe2: '#e8dccb', head: 'bun', s: 1.2, pose: 'pray', skin: '#efd6bf' });
  figure(b, 'monk', { x: -2.25, y: FLOOR + 0.03, z: ZC - 0.55, ry: -2.2, s: 1.2, pose: 'none' });
  // mouse ears peeping from her hair (金鼻白毛老鼠精)
  for (const sx of [-1, 1]) b.sphere(0.035, { x: -1.9 + sx * 0.05, y: FLOOR + 0.84, z: ZC - 0.92, sz: 0.4, color: '#e8b8b0', mat: M.smooth, ws: 8, hs: 6 });

  /* on the summit: Wukong peering into the hole, with Bajie and Sha */
  const ty = TOP(MOUTH_X - 0.8);
  figure(b, 'wukong', { x: MOUTH_X - 0.75, y: H(MOUTH_X - 0.75, ZC - 0.5) - 0.05, z: ZC - 0.5, ry: 1.2, pose: 'gaze', s: 1.65 });
  figure(b, 'bajie', { x: MOUTH_X + 0.85, y: H(MOUTH_X + 0.85, ZC - 0.9) - 0.05, z: ZC - 0.9, ry: -1.1, s: 1.2 });
  figure(b, 'sha', { x: MOUTH_X + 1.6, y: H(MOUTH_X + 1.6, ZC - 1.6) - 0.05, z: ZC - 1.6, ry: -1.4, s: 1.2 });
  void ty;
  // a boulder beside the mouth, as in the text, and pines on the shoulders
  rock(b, { x: MOUTH_X + 0.15, y: H(MOUTH_X, ZC - 1.4) - 0.2, z: ZC - 1.45, r: 0.55, h: 0.8, rand: rng, palette: qinglv(2, { base: TOP(MOUTH_X) - 1 }) });
  for (const [x, z] of [[-5.2, -1.2], [4.6, -1.6], [1.4, -3.4], [-3.6, -5.6], [6.4, -3.8]]) pine(b, { x, y: H(x, z) - 0.1, z, h: 1.5 + rng() * 0.6, r: rng, lean: 0.3 });

  /* needle peaks behind the cut, the silhouette of 陷空山 */
  for (const [x, z, r, h] of [[-3.6, -3.4, 1.3, 5.2], [3.0, -4.6, 1.1, 4.6], [-6.6, -2.8, 0.8, 3.0], [0.6, -6.2, 1.0, 3.6]]) {
    const y = H(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, palette: qinglv(h, { base: y }) });
  }

  /* the black pine wood in front, a path to the foot of the mountain */
  for (let i = 0, k = 0; i < 12 && k < 300; k++) {
    const x = rng.range(-9, 9), z = rng.range(ZC + 1.2, 9.5);
    if (Math.hypot(x, z) > 9.6 || Math.abs(x - 0.4) < 2.6) continue;
    pine(b, { x, y: 0.15, z, h: 1.6 + rng() * 1.2, r: rng, color: '#24382c', lean: 0.15 }); i++;
  }
  for (let i = 0; i < 8; i++) { const x = rng.range(-8, 8), z = rng.range(ZC + 0.6, 8.5); if (Math.hypot(x, z) < 9.4) rock(b, { x, y: 0.1, z, r: 0.25 + rng() * 0.35, h: 0.4, rand: rng, palette: qinglv(1.2) }); }

  object.add(b.build());

  /* ------------------------------------------- the fly and the peach --- */
  const fb = new Builder();
  fb.sphere(0.07, { color: '#ffd36a', mat: M.glow, glow: 2.4, ws: 10, hs: 8 });
  for (const sx of [-1, 1]) fb.sphere(0.06, { x: sx * 0.06, y: 0.03, sx: 1, sy: 0.25, sz: 0.6, color: '#fff6d8', mat: M.glow, glow: 1.4, ws: 8, hs: 4 });
  const fly = fb.build({ shadows: false });
  object.add(fly);
  const pb = new Builder();
  pb.sphere(0.16, { sy: 1.1, color: '#e8483a', mat: M.smooth, ws: 12, hs: 10 });
  pb.cone(0.07, 0.08, { y: 0.15, color: '#f07a5a', mat: M.smooth, seg: 6 });
  pb.sphere(0.19, { color: '#ff6a4a', mat: M.glow, glow: 0.5, ws: 10, hs: 8 });
  const peach = pb.build({ shadows: false });
  object.add(peach);
  const PEACH = [-2.4, FLOOR + 0.98, ZC - 0.95];
  const TRAIL = 22, trail = softPuffs(TRAIL, { color: '#ffd27a', opacity: 0.8, additive: true });
  const GLOW = 10, glow = softPuffs(GLOW, { color: '#ffb466', opacity: 0.35, additive: true });
  object.add(trail.points, glow.points);
  const lampsAt = [[-1.8, 3.1], [0.2, 3.35], [2.8, 3.2], [4.3, 2.8], [1.4, 1.2], [0.6, 1.2], [2.2, 1.2], [-0.6, 0.9], [3.4, 1.0], [-3.2, 1.0]];
  const top = TOP(MOUTH_X);
  const path = (p, out) => {   // fly path: from above the mouth, down the shaft, into the garden
    if (p < 0.82) {
      const q = p / 0.82, y = lerp(top + 1.2, 3.2, q);
      out[0] = y > top ? MOUTH_X : shaftX(y, top); out[1] = y; out[2] = ZC - 0.38 + Math.sin(q * 40) * 0.05;
    } else {
      const q = (p - 0.82) / 0.18;
      out[0] = lerp(shaftX(3.2, top), PEACH[0], q); out[1] = lerp(3.2, PEACH[1], q) + Math.sin(q * Math.PI) * 0.4; out[2] = lerp(ZC - 0.38, PEACH[2], q);
    }
    return out;
  };
  const P = [0, 0, 0];

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const fp = clamp(u / 0.6);
    path(fp, P);
    const flyOn = u < 0.6;
    fly.visible = flyOn;
    fly.position.set(P[0] + Math.sin(t * 9) * 0.03, P[1] + Math.sin(t * 13) * 0.03, P[2]);
    fly.rotation.y = t * 3;
    for (let i = 0; i < TRAIL; i++) {
      const q = clamp(fp - i * 0.008);
      path(q, P);
      trail.set(i, P[0], P[1], P[2], 0.18 - i * 0.006, flyOn ? (1 - i / TRAIL) * 0.8 : 0);
    }
    trail.commit();
    const pk = smooth(0.58, 0.66, u) * (1 - smooth(0.94, 0.995, u));
    peach.visible = pk > 0.01;
    peach.position.set(PEACH[0], PEACH[1] - 0.05 * (1 - pk), PEACH[2]);
    peach.scale.setScalar(Math.max(0.001, pk * (1 + 0.04 * Math.sin(t * 3))));
    for (let i = 0; i < GLOW; i++) {
      const [x, y] = lampsAt[i];
      glow.set(i, x, y, ZC - (i < 4 ? 1.2 : 1.45), 0.9 + 0.12 * Math.sin(t * 2.3 + i * 1.7), 0.8);
    }
    glow.commit();
  }
  update(0);
  return { object, update };
}
