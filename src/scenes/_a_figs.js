// Private helpers for builder A: extra figures and small props not in the kit.
// All figures follow the kit's scale (~0.7 tall standing at s = 1, base at y = 0, facing +z).
import { THREE, M, C, staff, ramp, noise2, hash2, smooth, clamp } from '../kit.js';

const robe = (b, color, h, rb, rt, y = 0) => b.lathe([[0, y], [rb, y], [rb * 0.92, y + h * 0.3], [rt * 1.05, y + h], [0, y + h]], { color, mat: M.cloth, seg: 12 });

/**
 * The Monkey King before the pilgrimage (no golden fillet unless band:true).
 * arms: [[rz, rx], [rz, rx]] for left/right (kit convention: total rotation of a +y cylinder at the shoulder).
 * legs: 'stand' | 'sit' (cross-legged) | 'stride' | 'tuck' (leaping). staffLen > 0 puts a staff in the right hand.
 */
export function monkeyKing(b, o = {}) {
  const { s = 1, band = false, legs = 'stand', arms = [[Math.PI - 0.3, 0], [Math.PI + 0.3, 0]], tunic = '#d9b04a', cap = false, noArms = false } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, rx: o.rx, rz: o.rz, s });
  if (legs === 'stand') {
    for (const sx of [-1, 1]) b.cyl(0.04, 0.045, 0.22, { x: sx * 0.05, color: C.furD, mat: M.smooth, seg: 6 });
  } else if (legs === 'stride') {
    for (const sx of [-1, 1]) b.cyl(0.04, 0.045, 0.24, { x: sx * 0.05, y: 0.21, rx: Math.PI + sx * 0.45, color: C.furD, mat: M.smooth, seg: 6 });
  } else if (legs === 'tuck') {
    for (const sx of [-1, 1]) b.cyl(0.04, 0.045, 0.2, { x: sx * 0.06, y: 0.2, rx: Math.PI - 1.2, color: C.furD, mat: M.smooth, seg: 6 });
  } else if (legs === 'sit') {
    b.sphere(0.13, { y: 0.0, sx: 1.25, sy: 0.38, sz: 0.85, z: 0.04, color: C.furD, mat: M.smooth, ws: 10, hs: 6 });
  }
  const y0 = legs === 'sit' ? -0.14 : 0;
  b.push({ y: y0 });
  for (let i = 0; i < 4; i++) b.cyl(0.11 - i * 0.008, 0.12 - i * 0.008, 0.035, { y: 0.16 + i * 0.035, color: i % 2 ? '#3a2412' : '#e09a3a', mat: M.cloth, seg: 10 });
  b.cyl(0.08, 0.095, 0.17, { y: 0.3, color: tunic, mat: M.cloth, seg: 10 });
  b.cyl(0.1, 0.1, 0.03, { y: 0.31, color: C.cinnabar, mat: M.cloth, seg: 10 });
  b.sphere(0.075, { y: 0.55, color: C.fur, mat: M.smooth });
  b.sphere(0.05, { y: 0.54, z: 0.045, sx: 1.05, sy: 0.9, sz: 0.6, color: '#e7a98a', mat: M.smooth });
  for (const sx of [-1, 1]) b.sphere(0.022, { x: sx * 0.075, y: 0.56, sz: 0.5, color: '#e7a98a', mat: M.smooth, ws: 6, hs: 4 });
  if (band) b.torus(0.072, 0.012, { y: 0.585, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 16 });
  if (cap) { // 紫金冠 with pheasant plumes (heavenly office)
    b.cyl(0.045, 0.06, 0.05, { y: 0.61, color: C.gold, mat: M.metal, seg: 8 });
    for (const sx of [-1, 1]) b.tube([[sx * 0.03, 0.64, 0], [sx * 0.12, 0.8, -0.04], [sx * 0.22, 0.86, -0.12], [sx * 0.3, 0.8, -0.2]], 0.006, { color: C.cinnabar, mat: M.cloth, radial: 3 });
  }
  b.tube([[0, 0.2, -0.08], [0, 0.12, -0.2], [0, 0.25, -0.3], [0, 0.4, -0.26]], 0.014, { color: C.fur, mat: M.smooth });
  if (!noArms) arms.forEach(([rz, rx], i) => b.cyl(0.022, 0.026, 0.2, { x: (i ? 1 : -1) * 0.09, y: 0.43, rz, rx, color: C.fur, mat: M.smooth, seg: 6 }));
  if (o.staffLen) staff(b, { x: 0.15, y: legs === 'sit' ? 0.14 : 0, z: 0.05, len: o.staffLen });
  b.pop();
  b.pop();
}
/** one monkey arm (for animated arms in a separate group); pivot at the shoulder */
export function monkeyArm(b, o = {}) { b.cyl(0.022, 0.026, 0.2, { color: C.fur, mat: M.smooth, seg: 6, ...o }); }

/** Daoist / scholar / attendant. kneel: kneeling (shorter). bun: topknot. beard: white beard. */
export function daoist(b, o = {}) {
  const { s = 1, color = '#5d6f7a', sash = C.ivory, kneel = false, beard = false, hair = C.ink, hat = null, sleeves = true } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s });
  const h = kneel ? 0.3 : 0.44;
  robe(b, color, h, kneel ? 0.16 : 0.14, 0.085);
  b.cyl(0.075, 0.09, 0.12, { y: h - 0.02, color, mat: M.cloth, seg: 10 });
  b.cyl(0.092, 0.092, 0.025, { y: h * 0.62, color: sash, mat: M.cloth, seg: 10 });
  if (sleeves) b.sphere(0.07, { y: h * 0.62 + 0.03, z: 0.08, sx: 1.6, sy: 0.7, sz: 0.8, color, mat: M.cloth, ws: 8, hs: 6 }); // hands folded in sleeves
  const hy = h + 0.16;
  b.sphere(0.065, { y: hy, color: C.skin, mat: M.smooth, ws: 10, hs: 8 });
  if (beard) b.cone(0.04, 0.15, { y: hy - 0.03, z: 0.05, rx: Math.PI, color: '#f2efe6', mat: M.smooth, seg: 6 });
  if (hat === 'official') { // 乌纱帽 with wings
    b.cyl(0.06, 0.065, 0.07, { y: hy + 0.02, color: '#1d1b1c', mat: M.smooth, seg: 10 });
    b.box(0.32, 0.018, 0.03, { y: hy + 0.05, z: -0.04, color: '#1d1b1c', mat: M.smooth });
  } else if (hat === 'crown') {
    b.cyl(0.07, 0.06, 0.06, { y: hy + 0.03, color: '#1d1b1c', mat: M.smooth, seg: 10 });
    b.box(0.2, 0.012, 0.22, { y: hy + 0.1, color: '#1d1b1c', mat: M.smooth });       // 冕板
    for (const sz of [-1, 1]) for (let i = -2; i <= 2; i++) b.cyl(0.004, 0.004, 0.07, { x: i * 0.04, y: hy + 0.035, z: sz * 0.1, color: C.gold, mat: M.metal, seg: 3 });
  } else if (hat !== 'none') {
    b.sphere(0.035, { y: hy + 0.075, color: hair, mat: M.smooth, ws: 8, hs: 6 });  // topknot
    b.sphere(0.066, { y: hy + 0.012, sy: 0.8, z: -0.008, color: hair, mat: M.smooth, ws: 10, hs: 6 });
  }
  b.pop();
}

/** seated sage on a cushion (菩提祖师 / 太上老君): cross-legged, broad sleeves, long white beard */
export function sage(b, o = {}) {
  const { s = 1, color = '#e9e2cf', trim = C.shiqing, beard = '#f4f1ea', hat = 'daoist' } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s });
  b.cyl(0.24, 0.26, 0.06, { color: o.cushion || '#6b3a2a', mat: M.cloth, seg: 14 });
  b.sphere(0.2, { y: 0.1, sx: 1.2, sy: 0.4, sz: 0.85, z: 0.03, color, mat: M.cloth, ws: 12, hs: 6 });
  robe(b, color, 0.34, 0.17, 0.09, 0.06);
  b.cyl(0.155, 0.155, 0.03, { y: 0.06, color: trim, mat: M.cloth, seg: 12 });
  for (const sx of [-1, 1]) b.sphere(0.09, { x: sx * 0.11, y: 0.22, z: 0.07, sx: 0.8, sy: 1.2, sz: 0.9, color, mat: M.cloth, ws: 8, hs: 6 }); // sleeves
  b.sphere(0.075, { y: 0.5, color: C.skin, mat: M.smooth });
  b.cone(0.055, 0.24, { y: 0.47, z: 0.055, rx: Math.PI, color: beard, mat: M.smooth, seg: 7 });
  for (const sx of [-1, 1]) b.sphere(0.022, { x: sx * 0.035, y: 0.53, z: 0.06, sx: 1.6, sy: 0.6, color: beard, mat: M.smooth, ws: 6, hs: 4 }); // brows
  if (hat === 'daoist') {
    b.sphere(0.07, { y: 0.525, sy: 0.75, z: -0.03, color: '#d8d6d0', mat: M.smooth, ws: 10, hs: 6 });
    b.box(0.065, 0.045, 0.065, { y: 0.56, z: -0.01, color: C.ink, mat: M.smooth });   // 道冠
    b.cyl(0.005, 0.005, 0.13, { y: 0.585, z: -0.01, rz: Math.PI / 2, x: -0.065, color: C.gold, mat: M.metal, seg: 3 });
  }
  b.pop();
}

/** fairy 仙女: high double bun, long skirt, sleeve ribbon (披帛). basket: carries a basket in front. */
export function fairy(b, o = {}) {
  const { s = 1, color = '#e8a6b0', under = '#f4ead8', ribbon = '#9fc4b2', basket = false } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s });
  b.lathe([[0, 0], [0.17, 0], [0.15, 0.1], [0.09, 0.42], [0, 0.42]], { color: under, mat: M.cloth, seg: 12 });
  b.lathe([[0, 0.12], [0.15, 0.12], [0.12, 0.2], [0.085, 0.46], [0, 0.46]], { color, mat: M.cloth, seg: 12 });
  b.cyl(0.07, 0.08, 0.1, { y: 0.44, color, mat: M.cloth, seg: 8 });
  b.sphere(0.06, { y: 0.6, color: C.skin, mat: M.smooth, ws: 10, hs: 8 });
  b.sphere(0.058, { y: 0.62, z: -0.02, color: C.ink, mat: M.smooth, ws: 8, hs: 6 });
  for (const sx of [-1, 1]) b.sphere(0.035, { x: sx * 0.04, y: 0.7, z: -0.01, color: C.ink, mat: M.smooth, ws: 8, hs: 6 });
  b.tube([[-0.14, 0.08, 0.02], [-0.16, 0.3, 0.04], [-0.08, 0.5, -0.04], [0.08, 0.5, -0.04], [0.16, 0.3, 0.04], [0.18, 0.1, 0.06]], 0.012, { color: ribbon, mat: M.cloth, radial: 4, segs: 20 });
  if (basket) {
    b.lathe([[0.04, 0], [0.09, 0.02], [0.1, 0.08], [0.095, 0.085]], { y: 0.26, z: 0.15, color: '#b48a52', mat: M.wood, seg: 10 });
    b.torus(0.07, 0.006, { y: 0.34, z: 0.15, color: '#8a6534', mat: M.wood, ts: 10 });
  }
  b.pop();
}

/** a simple standing crane 仙鹤 */
export function crane(b, o = {}) {
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s: o.s ?? 1 });
  for (const sx of [-1, 1]) b.cyl(0.006, 0.006, 0.25, { x: sx * 0.03, color: C.inkSoft, mat: M.smooth, seg: 3 });
  b.sphere(0.09, { y: 0.3, sx: 0.8, sz: 1.4, color: C.white, mat: M.smooth, ws: 10, hs: 6 });
  b.sphere(0.06, { y: 0.31, z: -0.12, sx: 0.7, sy: 0.6, sz: 1.2, color: C.ink, mat: M.smooth, ws: 8, hs: 5 });
  b.tube([[0, 0.33, 0.08], [0, 0.45, 0.13], [0, 0.55, 0.12]], 0.014, { color: C.white, mat: M.smooth, radial: 4 });
  b.sphere(0.025, { y: 0.56, z: 0.13, color: C.white, mat: M.smooth, ws: 6, hs: 4 });
  b.sphere(0.012, { y: 0.585, z: 0.13, color: C.cinnabar, mat: M.smooth, ws: 5, hs: 3 });
  b.cone(0.008, 0.07, { y: 0.56, z: 0.15, rx: Math.PI / 2, color: '#7a6a4a', mat: M.smooth, seg: 4 });
  b.pop();
}

/** bronze incense burner 香炉 on three legs */
export function censer(b, o = {}) {
  const s = o.s ?? 1;
  b.push({ x: o.x, y: o.y, z: o.z, s });
  for (let i = 0; i < 3; i++) { const a = i * 2.094; b.cyl(0.02, 0.025, 0.12, { x: Math.cos(a) * 0.1, z: Math.sin(a) * 0.1, color: o.color || '#5b4a32', mat: M.metal, seg: 5 }); }
  b.lathe([[0.04, 0.1], [0.15, 0.14], [0.16, 0.22], [0.13, 0.28], [0.14, 0.3]], { color: o.color || '#6b5634', mat: M.metal, seg: 14 });
  for (const sx of [-1, 1]) b.torus(0.035, 0.01, { x: sx * 0.15, y: 0.32, ry: Math.PI / 2, color: o.color || '#6b5634', mat: M.metal, ts: 8 });
  b.pop();
}

/** a fish into a Builder; faces +z */
export function fish(b, o = {}) {
  const { color = '#d98c4a', fin = '#e9b070' } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s: o.s ?? 1 });
  b.sphere(1, { sx: 0.05, sy: 0.07, sz: 0.16, color, mat: M.smooth, ws: 8, hs: 6 });
  b.cone(0.07, 0.1, { z: -0.12, rx: -Math.PI / 2, sx: 0.15, color: fin, mat: M.smooth, seg: 4 });
  b.pop();
}

/** qinglv-style palette with custom cliff / ledge ramps (same logic as the kit's qinglv) */
export function tinted(hmax, { base = 0, cliff, ledge, shade = 0.84 } = {}) {
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const streak = noise2((x + z) * 1.7, y * 0.22) - 0.5;
    const j = (hash2(x * 13.1, z * 11.7 + y * 3) - 0.5) * 0.035;
    ramp(cliff, t + streak * 0.16 + j, out);
    out.multiplyScalar(0.92 + streak * 0.22);
    const up = smooth(0.42, 0.78, ny + streak * 0.1);
    if (up > 0) out.lerp(ramp(ledge, t + j, tmp), up);
    if (ny < 0.12) out.multiplyScalar(shade);
    return out;
  };
}

/** rocky arc / crescent: a faceted, tapered tube along pts [[x,y,z]...], radius fn(t), noisy cross-section */
export function rockTube(b, pts, radius, o = {}) {
  const { radial = 9, segs = 48, sz = 1, palette, rand = Math.random, color = C.rock } = o;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const fr = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [], ph = rand() * 50;
  const P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), r = radius(t);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const k = 0.72 + 0.56 * noise2(Math.cos(a) * 1.5 + ph, t * 9 + Math.sin(a) * 1.5);
      P.copy(c).addScaledVector(fr.normals[i], Math.cos(a) * r * k).addScaledVector(fr.binormals[i], Math.sin(a) * r * k);
      pos.push(P.x, P.y, c.z + (P.z - c.z) * sz);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, bb = i * radial + (j + 1) % radial, cc = (i + 1) * radial + (j + 1) % radial, d = (i + 1) * radial + j;
    idx.push(a, bb, cc, a, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  b.geo(g, { mat: M.flat, flatNormals: true, faceColor: palette, color, x: o.x, y: o.y, z: o.z, rz: o.rz, ry: o.ry });
  if (o.cap) for (const [t, p] of [[0, pts[0]], [1, pts[pts.length - 1]]]) b.ico(radius(t) * 1.08, { x: (o.x || 0) + p[0], y: (o.y || 0) + p[1], z: (o.z || 0) + p[2], faceColor: palette, color, mat: M.flat, detail: 1 });
  return b;
}

/** bamboo clump 竹 */
export function bamboo(b, { x = 0, y = 0, z = 0, h = 2, n = 5, r = Math.random, color = '#5f9a6a', leaf = '#4f8a5c' } = {}) {
  for (let i = 0; i < n; i++) {
    const ox = x + (r() - 0.5) * 0.5, oz = z + (r() - 0.5) * 0.5, hh = h * (0.7 + r() * 0.4), lx = (r() - 0.5) * 0.4, lz = (r() - 0.5) * 0.4;
    b.tube([[ox, y, oz], [ox + lx * 0.3, y + hh * 0.5, oz + lz * 0.3], [ox + lx, y + hh, oz + lz]], 0.025, { color, mat: M.smooth, radial: 4, segs: 6 });
    for (let k = 0; k < 3; k++) b.ico(0.22 + r() * 0.1, { x: ox + lx * (0.6 + k * 0.2) + (r() - 0.5) * 0.3, y: y + hh * (0.62 + k * 0.17), z: oz + lz * (0.6 + k * 0.2) + (r() - 0.5) * 0.3, sy: 0.45, ry: r() * 3, color: k % 2 ? leaf : color, mat: M.flat, detail: 0 });
  }
}

/** smooth (non-faceted) polar heightfield; colorFn(x,y,z,ny) per vertex-face */
export function softField(b, { R = 10.4, rings = 40, segs = 120, fn, colorFn, mat = M.cloud, y = 0 }) {
  const pos = [], idx = [];
  pos.push(0, y + fn(0, 0), 0);
  for (let i = 1; i <= rings; i++) {
    const rr = (i / rings) * R;
    for (let j = 0; j < segs; j++) { const a = (j / segs) * Math.PI * 2; pos.push(Math.cos(a) * rr, y + fn(Math.cos(a) * rr, Math.sin(a) * rr), Math.sin(a) * rr); }
  }
  const at = (i, j) => (i === 0 ? 0 : 1 + (i - 1) * segs + (j % segs));
  for (let j = 0; j < segs; j++) idx.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) idx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i + 1, j));
  const base = pos.length / 3;
  for (let j = 0; j < segs; j++) { const a = (j / segs) * Math.PI * 2; pos.push(Math.cos(a) * R, y, Math.sin(a) * R); }
  for (let j = 0; j < segs; j++) { const t0 = at(rings, j), t1 = at(rings, j + 1), b0 = base + j, b1 = base + ((j + 1) % segs); idx.push(t0, t1, b1, t0, b1, b0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return b.geo(g, { mat, faceColor: colorFn });
}

/**
 * gnarled old peach tree: twisting trunk, forking limbs, blossom + leaf clouds.
 * Pushes fruit positions into o.fruit (array of [x,y,z,r]). Returns the list of limb tips.
 */
export function bigPeach(b, o = {}) {
  const { x = 0, y = 0, z = 0, h = 4, r = Math.random, fruitN = 10, fruit = [], blossom = ['#f4c4c8', '#eeaab4', '#f8dcd8'], leaf = '#7fae6a', bark = '#5a4236', lean = 0.2 } = o;
  const tips = [];
  const la = r() * Math.PI * 2;
  const trunk = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    trunk.push([x + Math.cos(la) * lean * h * t * t + Math.sin(t * 5 + la) * 0.08 * h, y + h * 0.42 * t, z + Math.sin(la) * lean * h * t * t + Math.cos(t * 4 + la) * 0.08 * h]);
  }
  b.tube(trunk, (t) => h * (0.085 - 0.04 * t) * (1 + 0.25 * Math.max(0, 0.15 - t) * 8), { color: bark, mat: M.wood, radial: 8, segs: 14 });
  // burls on the trunk
  for (let i = 0; i < 3; i++) { const p = trunk[1 + i % 3]; b.ico(h * 0.05, { x: p[0] + (r() - 0.5) * h * 0.08, y: p[1], z: p[2] + (r() - 0.5) * h * 0.08, color: bark, mat: M.flat, detail: 0 }); }
  const limb = (p, dir, len, rad, depth) => {
    const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    const m = [(p[0] + e[0]) / 2 + (r() - 0.5) * len * 0.3, (p[1] + e[1]) / 2 + len * 0.08, (p[2] + e[2]) / 2 + (r() - 0.5) * len * 0.3];
    b.tube([p, m, e], (t) => rad * (1 - t * 0.45), { color: bark, mat: M.wood, radial: 5, segs: 6 });
    if (depth <= 0) { tips.push(e); return; }
    const n = 2 + (r() < 0.35 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, up = 0.25 + r() * 0.45;
      const d = [dir[0] * 0.6 + Math.cos(a) * (1 - up), up, dir[2] * 0.6 + Math.sin(a) * (1 - up)];
      const l = Math.hypot(...d);
      limb(e, d.map((v) => v / l), len * (0.62 + r() * 0.15), rad * 0.62, depth - 1);
    }
  };
  const top = trunk[4];
  const NL = 3 + (r() < 0.5 ? 1 : 0);
  for (let i = 0; i < NL; i++) {
    const a = la + (i / NL) * Math.PI * 2 + r() * 0.6, up = 0.35 + r() * 0.3;
    limb(top, [Math.cos(a) * (1 - up), up, Math.sin(a) * (1 - up)].map((v, _, A) => v / Math.hypot(...A)), h * 0.3, h * 0.05, 2);
  }
  for (const tp of tips) {
    const n = 3;
    for (let k = 0; k < n; k++) {
      const br = h * (0.075 + r() * 0.05);
      const c = r() < 0.72 ? r.pick(blossom) : leaf;
      b.ico(br, { x: tp[0] + (r() - 0.5) * br, y: tp[1] + (r() - 0.3) * br * 0.8, z: tp[2] + (r() - 0.5) * br, sy: 0.7, ry: r() * 3, color: c, mat: M.flat, detail: h > 5 ? 1 : 0 });
    }
  }
  for (let i = 0; i < fruitN; i++) {
    const tp = r.pick(tips), a = r() * Math.PI * 2, d = h * (0.06 + r() * 0.1);
    fruit.push([tp[0] + Math.cos(a) * d, tp[1] - h * (0.06 + r() * 0.08), tp[2] + Math.sin(a) * d, h * 0.02 + 0.075]);
  }
  return tips;
}

/** willow 柳: short stout trunk, a leafy crown and a curtain of long drooping strands */
export function willow(b, { x = 0, y = 0, z = 0, h = 2.2, r = Math.random, color = '#a9b85a', color2 = '#8fa04a', bark = '#5a4a3a', lean = 0.15 } = {}) {
  const la = r() * Math.PI * 2;
  const top = [x + Math.cos(la) * lean * h, y + h * 0.62, z + Math.sin(la) * lean * h];
  b.tube([[x, y, z], [(x + top[0]) / 2 + 0.05, y + h * 0.3, (z + top[2]) / 2], top], (t) => h * 0.055 * (1 - t * 0.45), { color: bark, mat: M.wood, radial: 6, segs: 8 });
  for (let k = 0; k < 4; k++) {
    const a = la + k * 1.6 + r(), d = h * 0.16;
    b.ico(h * (0.17 + r() * 0.05), { x: top[0] + Math.cos(a) * d, y: top[1] + h * (0.1 + r() * 0.1), z: top[2] + Math.sin(a) * d, sy: 0.55, ry: r() * 3, color: k % 2 ? color : color2, mat: M.flat, detail: 1 });
  }
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.3, d = h * (0.22 + r() * 0.16);
    const sx = top[0] + Math.cos(a) * d, sz = top[2] + Math.sin(a) * d, sy = top[1] + h * (0.12 + r() * 0.1);
    const ex = top[0] + Math.cos(a) * d * 1.18, ez = top[2] + Math.sin(a) * d * 1.18, ey = y + h * (0.08 + r() * 0.22);
    b.tube([[sx, sy, sz], [(sx + ex) / 2 + Math.cos(a) * 0.03, (sy + ey) / 2 + h * 0.08, (sz + ez) / 2 + Math.sin(a) * 0.03], [ex, ey, ez]], (t) => h * 0.016 * (1.2 - t * 0.7), { color: i % 3 ? color : color2, mat: M.cloth, radial: 3, segs: 7 });
  }
}
