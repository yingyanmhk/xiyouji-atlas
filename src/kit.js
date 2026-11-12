// Shared builder kit for the Xiyou atlas: seeded RNG, noise, palette, materials,
// a merging geometry Builder, and Chinese-miniature parts (roofs, halls, pagodas,
// pines, scholar rocks, 青绿 peaks, clouds, the pilgrims).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export { THREE };

/* ------------------------------------------------------------------ rng -- */
export function rng(seed = 1) {
  if (typeof seed === 'string') {
    let h = 2166136261;
    for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    seed = h >>> 0;
  }
  let s = (seed >>> 0) || 1;
  const r = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  r.inDisc = (R, minR = 0) => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r.range((minR / R) ** 2, 1)) * R;
    return [Math.cos(a) * d, Math.sin(a) * d];
  };
  r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return r;
}

/* ---------------------------------------------------------------- noise -- */
export function hash2(x, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, oct = 4) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f + i * 17.3, z * f - i * 9.1); n += a; f *= 2.03; a *= 0.5; }
  return s / n;
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;

/* -------------------------------------------------------------- palette -- */
// Mineral pigments of 青绿山水 plus the props of the story.
export const C = {
  silk: '#e6d8b8', paper: '#efe6d2', ink: '#2b2622', inkSoft: '#4a423b',
  zheshi: '#9a6a45', zheshiL: '#c49a6a',        // 赭石 ochre
  shiqing: '#2f5d7c', shiqingL: '#4f86a3',      // 石青 azurite
  shilv: '#3f8a68', shilvL: '#79b08a',          // 石绿 malachite
  cinnabar: '#b23a2c', vermilion: '#cc4a32', gold: '#d6a94a', goldD: '#a67a2c',
  jade: '#8fbfa6', celadon: '#9fc4b2', ivory: '#efe7d6', white: '#f4f1ea',
  snow: '#f1f4f6', ice: '#c4dde8', water: '#3d7088', sea: '#2d6176',
  pine: '#2e5a3f', pineD: '#22432f', bark: '#5a4433', leaf: '#5e8f4f',
  blossom: '#f2b9bd', blossomD: '#e48f99', peach: '#f08868',
  tile: '#46525a', tileGreen: '#2f6a55', tileGold: '#cf9f3c',
  wall: '#ece2cf', wallRed: '#a8402f', wood: '#7a4a2e', woodD: '#4a2e1e',
  lamp: '#ffcf7a', fire: '#ff7a2a', fireCore: '#ffd36a', ember: '#ff4a1a',
  rock: '#8d8a80', rockD: '#5c5a55', sand: '#d9c9a3', soil: '#8a7458',
  skin: '#e6c39c', fur: '#b98546', furD: '#8a5a32',
};
const _ca = new THREE.Color(), _cb = new THREE.Color();
/** mix two hex colours into a THREE.Color (returned object is shared — copy if kept) */
export function mix(a, b, t, out = new THREE.Color()) {
  _ca.set(a); _cb.set(b);
  return out.copy(_ca).lerp(_cb, clamp(t));
}
/** piecewise colour ramp: stops = [[t, hex], ...] sorted by t */
export function ramp(stops, t, out = new THREE.Color()) {
  if (t <= stops[0][0]) return out.set(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]), out);
  }
  return out.set(stops[stops.length - 1][1]);
}

/* ------------------------------------------------------------ materials -- */
const std = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, ...o });
export const M = {
  stone: std({ roughness: 0.92 }),
  smooth: std({ roughness: 0.55 }),
  flat: std({ roughness: 0.9, flatShading: true }),
  wood: std({ roughness: 0.75 }),
  lacquer: std({ roughness: 0.32 }),
  tile: std({ roughness: 0.62, side: THREE.DoubleSide }),
  cloth: std({ roughness: 0.85, side: THREE.DoubleSide }),
  metal: std({ roughness: 0.3, metalness: 0.85 }),
  porcelain: std({ roughness: 0.2 }),
  snow: std({ roughness: 0.95 }),
  cloud: std({ roughness: 1 }),
  water: std({ roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.86 }),
  ice: std({ roughness: 0.1, metalness: 0.05, transparent: true, opacity: 0.8 }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
};
const NO_SHADOW = new Set([M.glow, M.water, M.ice]);
export function solid(color = C.ivory, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
}
export function glowMat(color = C.lamp, intensity = 2, o = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), ...o });
}

/* -------------------------------------------------------------- Builder -- */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Color();
function placement(o = {}) {
  _p.set(o.x || 0, o.y || 0, o.z || 0);
  _e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ');
  _q.setFromEuler(_e);
  const s = o.s ?? 1;
  _s.set(o.sx ?? s, o.sy ?? s, o.sz ?? s);
  return _m.compose(_p, _q, _s);
}

/**
 * Builder collects geometry per material and merges it on build() → few draw calls.
 * Placement options for every primitive: x y z rx ry rz s sx sy sz, color, mat,
 * glow (for M.glow), faceColor(cx,cy,cz,nx,ny,nz) → hex|Color (per-triangle colour).
 */
export class Builder {
  constructor() { this.parts = new Map(); this.stack = []; }
  push(o) {
    const m = placement(o).clone();
    const top = this.stack[this.stack.length - 1];
    this.stack.push(top ? top.clone().multiply(m) : m);
    return this;
  }
  pop() { this.stack.pop(); return this; }

  geo(geometry, o = {}) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (o.flatNormals || !g.attributes.normal) { g.deleteAttribute('normal'); g.computeVertexNormals(); }
    const m = placement(o).clone();
    if (this.stack.length) m.premultiply(this.stack[this.stack.length - 1]);
    g.applyMatrix4(m);
    const mat = o.mat || M.stone;
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    if (o.faceColor) {
      const P = g.attributes.position.array;
      const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), N = new THREE.Vector3();
      for (let i = 0; i < n; i += 3) {
        A.fromArray(P, i * 3); B.fromArray(P, i * 3 + 3); Cc.fromArray(P, i * 3 + 6);
        N.subVectors(Cc, B).cross(_p.subVectors(A, B)).normalize();
        const cx = (A.x + B.x + Cc.x) / 3, cy = (A.y + B.y + Cc.y) / 3, cz = (A.z + B.z + Cc.z) / 3;
        _c.set(o.faceColor(cx, cy, cz, N.x, N.y, N.z));
        if (mat === M.glow) _c.multiplyScalar(o.glow ?? 2);
        for (let k = 0; k < 3; k++) { col[(i + k) * 3] = _c.r; col[(i + k) * 3 + 1] = _c.g; col[(i + k) * 3 + 2] = _c.b; }
      }
    } else {
      _c.set(o.color ?? C.ivory);
      if (mat === M.glow) _c.multiplyScalar(o.glow ?? 2);
      for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g);
    return this;
  }

  /** box with its base at y */
  box(w, h, d, o = {}) { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return this.geo(g, o); }
  /** cylinder, base at y; rt top radius, rb bottom radius */
  cyl(rt, rb, h, o = {}) {
    const g = new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 12, o.hseg ?? 1, o.open ?? false);
    g.translate(0, h / 2, 0); return this.geo(g, o);
  }
  cone(r, h, o = {}) { return this.cyl(0.0001, r, h, o); }
  /** sphere centred at (x,y,z) */
  sphere(r, o = {}) { return this.geo(new THREE.SphereGeometry(r, o.ws ?? 14, o.hs ?? 10), o); }
  /** faceted icosphere centred at (x,y,z) */
  ico(r, o = {}) { return this.geo(new THREE.IcosahedronGeometry(r, o.detail ?? 1), { flatNormals: true, ...o }); }
  /** lathe of [[r,y],...] around y */
  lathe(pts, o = {}) {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), o.seg ?? 24);
    return this.geo(g, o);
  }
  torus(R, r, o = {}) { return this.geo(new THREE.TorusGeometry(R, r, o.rs ?? 6, o.ts ?? 24, o.arc ?? Math.PI * 2), o); }
  /** tube through [[x,y,z],...]; radius may be a number or fn(t) */
  tube(pts, radius, o = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const segs = o.segs ?? Math.max(6, pts.length * 4), rad = o.radial ?? 6;
    if (typeof radius === 'number') return this.geo(new THREE.TubeGeometry(curve, segs, radius, rad, false), o);
    const g = new THREE.TubeGeometry(curve, segs, 1, rad, false);
    const P = g.attributes.position;
    const frames = curve.computeFrenetFrames(segs, false);
    for (let i = 0; i <= segs; i++) {
      const c = curve.getPointAt(i / segs), r = radius(i / segs);
      for (let j = 0; j <= rad; j++) {
        const k = i * (rad + 1) + j;
        _p.fromBufferAttribute(P, k).sub(c).multiplyScalar(r).add(c);
        P.setXYZ(k, _p.x, _p.y, _p.z);
      }
    }
    void frames;
    g.computeVertexNormals();
    return this.geo(g, o);
  }
  extrude(shape, depth, o = {}) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: o.curveSegments ?? 8 });
    g.translate(0, 0, -depth / 2);
    return this.geo(g, o);
  }
  plane(w, h, o = {}) { const g = new THREE.PlaneGeometry(w, h, o.ws ?? 1, o.hs ?? 1); g.rotateX(-Math.PI / 2); return this.geo(g, o); }

  /** merge into a Group with one mesh per material */
  build({ shadows = true } = {}) {
    const group = new THREE.Group();
    for (const [mat, list] of this.parts) {
      const g = mergeGeometries(list, false);
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = shadows && !NO_SHADOW.has(mat);
      mesh.receiveShadow = mat !== M.glow;
      group.add(mesh);
    }
    return group;
  }
  /** one merged geometry of all parts (ignores materials) — for InstancedMesh */
  merged() {
    const all = [];
    for (const list of this.parts.values()) all.push(...list);
    return mergeGeometries(all, false);
  }
}

/** thin lines (ropes, cracks, rain) in one draw call */
export class Lines {
  constructor() { this.pos = []; this.col = []; }
  add(pts, color = C.ink) {
    _c.set(color);
    for (let i = 0; i < pts.length - 1; i++) {
      this.pos.push(...pts[i], ...pts[i + 1]);
      this.col.push(_c.r, _c.g, _c.b, _c.r, _c.g, _c.b);
    }
    return this;
  }
  build({ opacity = 1 } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: opacity < 1, opacity }));
  }
}

/** InstancedMesh helper: per-instance matrix from position/rotation/scale */
const _o = new THREE.Object3D();
export function setInst(mesh, i, x, y, z, ry = 0, s = 1, rx = 0, rz = 0) {
  _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz, 'YXZ');
  if (typeof s === 'number') _o.scale.setScalar(s); else _o.scale.set(s[0], s[1], s[2]);
  _o.updateMatrix(); mesh.setMatrixAt(i, _o.matrix);
}

/* ------------------------------------------------------- architecture -- */
/**
 * Curved hip roof (庑殿 / 攒尖 when w == d) with upturned corners.
 * Returns { geo, hips: [[x,y,z]...][4], rx, rz }.  top < 1 cuts it into a skirt (pagoda eaves).
 */
export function roofGeo({ w = 4, d = 3, h = 1.4, over = 0.5, lift = 0.35, flare = 0.2, seg = 10, rings = 8, power = 1.7, top = 1 }) {
  const W = w / 2 + over, D = d / 2 + over;
  const rx = Math.max(0, (w - d) / 2), rz = Math.max(0, (d - w) / 2);
  const per = seg * 4;
  const pos = [], idx = [];
  const hips = [[], [], [], []];
  const ring = (s, dy) => {
    const hx = W + (rx - W) * s, hz = D + (rz - D) * s;
    const y = h * Math.pow(s, power) + dy;
    const e = Math.pow(1 - s, 2.2);
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < seg; i++) {
        const u = -1 + (2 * i) / seg;
        let x, z;
        if (side === 0) { x = u * hx; z = hz; } else if (side === 1) { x = hx; z = -u * hz; } else if (side === 2) { x = -u * hx; z = -hz; } else { x = -hx; z = u * hz; }
        const cw = Math.abs(u) ** 3;
        const fl = flare * e * cw;
        x += Math.sign(x) * fl; z += Math.sign(z) * fl;
        const yy = y + lift * e * cw;
        pos.push(x, yy, z);
        if (i === 0 && dy === 0) hips[side].push([x, yy + 0.04, z]);
      }
    }
  };
  ring(0, -Math.max(0.06, h * 0.06)); // fascia (eave board)
  const R = Math.max(1, Math.round(rings * top));
  for (let k = 0; k <= R; k++) ring((k / rings), 0);
  for (let k = 0; k < R + 1; k++) {
    for (let i = 0; i < per; i++) {
      const a = k * per + i, b = k * per + ((i + 1) % per), c = (k + 1) * per + ((i + 1) % per), d2 = (k + 1) * per + i;
      idx.push(a, b, c, a, c, d2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, hips, rx, rz, h, topY: h * Math.pow(R / rings, power) };
}

/** a roof with hip ridges, main ridge, ridge-end ornaments and an optional finial */
export function roof(b, { x = 0, y = 0, z = 0, ry = 0, w = 4, d = 3, h, over, lift, flare, color = C.tile, ridge = C.inkSoft, finial = null, top = 1, power }) {
  h = h ?? Math.min(w, d) * 0.42;
  over = over ?? Math.min(w, d) * 0.16;
  lift = lift ?? h * 0.3;
  flare = flare ?? over * 0.4;
  const r = roofGeo({ w, d, h, over, lift, flare, top, power });
  b.push({ x, y, z, ry });
  b.geo(r.geo, { color, mat: M.tile });
  const t = Math.max(0.035, Math.min(w, d) * 0.018);
  for (const hp of r.hips) if (hp.length > 1) b.tube(hp, t, { color: ridge, mat: M.smooth, radial: 5 });
  if (top >= 1) {
    if (r.rx > 0.01 || r.rz > 0.01) {
      const L = 2 * Math.max(r.rx, r.rz) + t * 4;
      b.box(r.rx > 0 ? L : t * 3, t * 3.2, r.rz > 0 ? L : t * 3, { y: h - t, color: ridge, mat: M.smooth });
      // 鸱吻 ridge-end ornaments
      for (const sgn of [-1, 1]) {
        const ox = r.rx > 0 ? sgn * (L / 2) : 0, oz = r.rz > 0 ? sgn * (L / 2) : 0;
        b.box(t * 3, t * 7, t * 3, { x: ox, y: h - t, z: oz, color: ridge, mat: M.smooth, rz: r.rx > 0 ? -sgn * 0.25 : 0, rx: r.rz > 0 ? sgn * 0.25 : 0 });
      }
    } else if (finial !== false) {
      // 宝顶
      b.cyl(t * 1.2, t * 2.4, t * 3, { y: h - t, color: finial || C.gold, mat: M.metal });
      b.sphere(t * 2, { y: h + t * 2.6, color: finial || C.gold, mat: M.metal });
    }
  }
  b.pop();
  return r;
}

/** hall 殿: stone platform, red columns, painted beams, lattice front, curved roof (1 or 2 tiers) */
export function hall(b, { x = 0, y = 0, z = 0, ry = 0, w = 4, d = 3, h = 1.6, base = 0.35, roofColor = C.tile, wall = C.wall, pillar = C.cinnabar, beam = C.shiqing, tiers = 1, lit = 0, r = Math.random, steps = true }) {
  b.push({ x, y, z, ry });
  b.box(w + 0.7, base, d + 0.7, { color: C.ivory, mat: M.stone });
  if (steps) for (let i = 0; i < 3; i++) b.box(Math.min(1.4, w * 0.4), base * (1 - i / 3), 0.22, { z: (d + 0.7) / 2 + 0.11 + i * 0.22, color: C.ivory });
  const y0 = base;
  b.box(w - 0.4, h * 0.94, d - 0.4, { y: y0, color: wall });
  // columns
  const nx = Math.max(2, Math.round(w / 1.0) + 1), nz = Math.max(2, Math.round(d / 1.0) + 1);
  const cr = Math.max(0.06, Math.min(w, d) * 0.03);
  for (let i = 0; i < nx; i++) for (const sz of [-1, 1]) b.cyl(cr, cr, h, { x: -w / 2 + (w * i) / (nx - 1), y: y0, z: sz * (d / 2), color: pillar, mat: M.lacquer, seg: 8 });
  for (let j = 1; j < nz - 1; j++) for (const sx of [-1, 1]) b.cyl(cr, cr, h, { x: sx * (w / 2), y: y0, z: -d / 2 + (d * j) / (nz - 1), color: pillar, mat: M.lacquer, seg: 8 });
  // lattice doors on the front
  for (let i = 0; i < nx - 1; i++) {
    const cx = -w / 2 + (w * (i + 0.5)) / (nx - 1), pw = w / (nx - 1) - cr * 2.4;
    const glow = lit > 0 && r() < lit;
    b.box(pw, h * 0.72, 0.03, { x: cx, y: y0 + 0.02, z: (d - 0.4) / 2 + 0.015, color: glow ? C.lamp : C.woodD, mat: glow ? M.glow : M.wood, glow: 1.4 });
    b.box(pw, 0.05, 0.05, { x: cx, y: y0 + h * 0.74, z: (d - 0.4) / 2 + 0.03, color: C.cinnabar, mat: M.lacquer });
  }
  // painted beam band (额枋彩画)
  b.box(w + cr * 2, h * 0.12, d + cr * 2, { y: y0 + h * 0.88, color: beam, mat: M.smooth });
  b.box(w + cr * 2.4, h * 0.04, d + cr * 2.4, { y: y0 + h * 0.86, color: C.gold, mat: M.smooth });
  let top = y0 + h;
  if (tiers === 2) {
    roof(b, { y: top - 0.05, w: w + 0.3, d: d + 0.3, h: Math.min(w, d) * 0.18, top: 0.42, color: roofColor });
    const w2 = w * 0.72, d2 = d * 0.72, h2 = h * 0.42;
    top += Math.min(w, d) * 0.06;
    b.box(w2, h2, d2, { y: top, color: wall });
    b.box(w2 + 0.08, h2 * 0.25, d2 + 0.08, { y: top + h2 * 0.75, color: beam, mat: M.smooth });
    roof(b, { y: top + h2, w: w2, d: d2, color: roofColor });
  } else {
    roof(b, { y: top, w, d, color: roofColor });
  }
  b.pop();
}

/** pagoda 塔: stacked storeys with eave skirts and a gilded spire */
export function pagoda(b, { x = 0, y = 0, z = 0, ry = 0, levels = 7, w = 1.6, h = 0.9, wall = C.wall, roofColor = C.tile, shrink = 0.075, lit = 0, r = Math.random }) {
  b.push({ x, y, z, ry });
  b.box(w * 1.5, 0.3, w * 1.5, { color: C.ivory });
  let yy = 0.3;
  for (let i = 0; i < levels; i++) {
    const wi = w * (1 - i * shrink), hi = h * (i === 0 ? 1.5 : 1) * (1 - i * 0.03);
    b.box(wi, hi, wi, { y: yy, color: wall });
    if (lit && r() < lit) b.box(wi * 0.22, hi * 0.4, 0.02, { y: yy + hi * 0.25, z: wi / 2 + 0.01, color: C.lamp, mat: M.glow, glow: 1.6 });
    else b.box(wi * 0.22, hi * 0.45, 0.02, { y: yy + hi * 0.22, z: wi / 2 + 0.01, color: C.woodD, mat: M.wood });
    b.box(wi + 0.05, hi * 0.1, wi + 0.05, { y: yy + hi * 0.9, color: C.cinnabar, mat: M.smooth });
    yy += hi;
    roof(b, { y: yy - 0.02, w: wi, d: wi, h: wi * 0.36, over: wi * 0.22, lift: wi * 0.12, top: i === levels - 1 ? 1 : 0.4, color: roofColor, finial: false });
    yy += wi * 0.36 * Math.pow(0.4, 1.7);
  }
  // 塔刹 spire
  const top = yy + w * (1 - levels * shrink) * 0.25;
  b.cyl(0.04, 0.05, w * 1.1, { y: top - 0.1, color: C.gold, mat: M.metal, seg: 6 });
  for (let k = 0; k < 5; k++) b.torus(0.12 - k * 0.012, 0.025, { y: top + 0.15 + k * 0.14, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 14 });
  b.sphere(0.08, { y: top + w * 1.05, color: C.gold, mat: M.metal });
  b.pop();
  return top + w * 1.1;
}

/** pavilion 亭: four columns, low railing, pyramidal roof */
export function pavilion(b, { x = 0, y = 0, z = 0, ry = 0, w = 1.6, h = 1.3, roofColor = C.tileGreen, pillar = C.cinnabar }) {
  b.push({ x, y, z, ry });
  b.box(w + 0.3, 0.2, w + 0.3, { color: C.ivory });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.06, 0.06, h, { x: sx * w / 2, y: 0.2, z: sz * w / 2, color: pillar, mat: M.lacquer, seg: 8 });
  b.box(w + 0.1, 0.1, w + 0.1, { y: 0.2 + h * 0.9, color: C.shiqing, mat: M.smooth });
  for (const [sx, sz, rr] of [[0, 1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) b.box(w, 0.05, 0.05, { x: sx * w / 2, y: 0.55, z: sz * w / 2, ry: rr, color: C.cinnabar, mat: M.lacquer });
  roof(b, { y: 0.2 + h, w, d: w, color: roofColor });
  b.pop();
}

/** folk house 民居: whitewashed walls, grey (or snowy) roof, a door and windows */
export function house(b, { x = 0, y = 0, z = 0, ry = 0, w = 1.6, d = 1.1, h = 0.9, wall = C.wall, roofColor = C.tile, lit = 0.4, r = Math.random, snow = false }) {
  b.push({ x, y, z, ry });
  b.box(w + 0.1, 0.1, d + 0.1, { color: C.rock });
  b.box(w, h, d, { y: 0.1, color: wall });
  b.box(0.3, h * 0.6, 0.03, { y: 0.1, z: d / 2 + 0.01, color: C.woodD, mat: M.wood });
  for (const sx of [-1, 1]) {
    const on = r() < lit;
    b.box(0.26, 0.2, 0.03, { x: sx * w * 0.3, y: 0.1 + h * 0.45, z: d / 2 + 0.01, color: on ? C.lamp : C.woodD, mat: on ? M.glow : M.wood, glow: 1.5 });
  }
  roof(b, { y: 0.1 + h, w, d, h: d * 0.38, over: 0.16, lift: 0.05, flare: 0.02, color: snow ? C.snow : roofColor, ridge: snow ? '#dfe6ea' : C.inkSoft });
  b.pop();
}

/** stele 碑, optionally on a stone tortoise 赑屃 */
export function stele(b, { x = 0, y = 0, z = 0, ry = 0, h = 1.6, w = 0.7, turtle = true, color = C.rockD }) {
  b.push({ x, y, z, ry });
  let y0 = 0;
  if (turtle) {
    b.sphere(0.55, { sx: 0.9, sy: 0.42, sz: 1.2, y: 0.12, color, mat: M.smooth });
    b.sphere(0.2, { z: 0.72, y: 0.22, sy: 0.8, color, mat: M.smooth });
    y0 = 0.35;
  } else b.box(w * 1.4, 0.25, w * 0.8, { color });
  b.box(w, h, w * 0.28, { y: y0, color });
  b.cyl(w / 2, w / 2, w * 0.28, { y: y0 + h, z: -w * 0.14, rx: Math.PI / 2, color, seg: 16 });
  b.pop();
}

/** arched stone bridge between two points (y = deck base) */
export function archBridge(b, { from, to, w = 0.9, rise = 0.8, color = C.ivory, segments = 12 }) {
  const [x0, y0, z0] = from, [x1, y1, z1] = to;
  const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments, t1 = (i + 1) / segments, tm = (t0 + t1) / 2;
    const ya = lerp(y0, y1, t0) + rise * Math.sin(Math.PI * t0), yb = lerp(y0, y1, t1) + rise * Math.sin(Math.PI * t1);
    const ym = (ya + yb) / 2;
    const seglen = Math.hypot(L / segments, yb - ya);
    b.box(w, 0.16, seglen + 0.02, { x: lerp(x0, x1, tm), y: ym - 0.08, z: lerp(z0, z1, tm), ry, rx: -Math.atan2(yb - ya, L / segments), color });
    for (const sx of [-1, 1]) b.box(0.07, 0.22, seglen, { x: lerp(x0, x1, tm) + Math.cos(ry) * sx * w / 2, y: ym, z: lerp(z0, z1, tm) - Math.sin(ry) * sx * w / 2, ry, rx: -Math.atan2(yb - ya, L / segments), color });
  }
}

/* ---------------------------------------------------------------- trees -- */
/** pine 松: crooked trunk with flat cloud-like needle pads (the painters' pine) */
export function pine(b, { x = 0, y = 0, z = 0, h = 2.4, r = Math.random, lean = 0.25, snow = false, color = C.pine }) {
  const la = r() * Math.PI * 2, lx = Math.cos(la) * lean * h, lz = Math.sin(la) * lean * h;
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    pts.push([x + lx * t * t + (r() - 0.5) * 0.12 * h * t, y + h * t, z + lz * t * t + (r() - 0.5) * 0.12 * h * t]);
  }
  b.tube(pts, (t) => h * 0.045 * (1 - t * 0.65), { color: C.bark, mat: M.wood, radial: 6, segs: 14 });
  const tiers = 3 + Math.floor(r() * 3);
  for (let k = 0; k < tiers; k++) {
    const t = 0.45 + (k / (tiers - 1 || 1)) * 0.55;
    const i = Math.min(4, Math.floor(t * 5)), f = t * 5 - i;
    const p = pts[i].map((v, j) => lerp(v, pts[i + 1][j], f));
    const a = r() * Math.PI * 2, L = h * (0.38 - 0.18 * t) * (0.7 + r() * 0.6);
    const ex = p[0] + Math.cos(a) * L, ez = p[2] + Math.sin(a) * L, ey = p[1] + h * 0.04;
    b.tube([p, [(p[0] + ex) / 2, p[1] + h * 0.03, (p[2] + ez) / 2], [ex, ey, ez]], h * 0.018, { color: C.bark, mat: M.wood, radial: 4, segs: 4 });
    const pr = h * (0.26 - 0.08 * t) * (0.8 + r() * 0.4);
    b.ico(pr, { x: ex, y: ey + pr * 0.15, z: ez, sy: 0.32, ry: r() * 3, color: k % 2 ? color : C.pineD, mat: M.flat, detail: 1 });
    if (snow) b.ico(pr * 0.92, { x: ex, y: ey + pr * 0.27, z: ez, sy: 0.2, ry: r() * 3, color: C.snow, mat: M.snow, detail: 1 });
  }
  const tp = pts[5], tr = h * 0.2;
  b.ico(tr, { x: tp[0], y: tp[1] + tr * 0.1, z: tp[2], sy: 0.36, color, mat: M.flat });
  if (snow) b.ico(tr * 0.9, { x: tp[0], y: tp[1] + tr * 0.22, z: tp[2], sy: 0.22, color: C.snow, mat: M.snow });
}

/** peach tree 桃: short crooked trunk, blossom clouds, a few fruit */
export function peachTree(b, { x = 0, y = 0, z = 0, h = 1.6, r = Math.random, fruit = 8 }) {
  const pts = [[x, y, z]];
  let px = x, pz = z;
  for (let i = 1; i <= 3; i++) { px += (r() - 0.5) * 0.3 * h; pz += (r() - 0.5) * 0.3 * h; pts.push([px, y + h * 0.22 * i, pz]); }
  b.tube(pts, (t) => h * 0.06 * (1 - t * 0.5), { color: C.bark, mat: M.wood, radial: 6 });
  const top = pts[3];
  const blobs = 5 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + r(), d = h * (0.18 + r() * 0.22);
    const bx = top[0] + Math.cos(a) * d, bz = top[2] + Math.sin(a) * d, by = top[1] + h * (0.05 + r() * 0.25);
    const br = h * (0.2 + r() * 0.1);
    b.ico(br, { x: bx, y: by, z: bz, sy: 0.75, color: r() < 0.65 ? C.blossom : (r() < 0.5 ? C.blossomD : C.leaf), mat: M.flat });
  }
  for (let i = 0; i < fruit; i++) {
    const a = r() * Math.PI * 2, d = h * (0.3 + r() * 0.15);
    b.sphere(h * 0.05, { x: top[0] + Math.cos(a) * d, y: top[1] + h * (r() * 0.2 - 0.05), z: top[2] + Math.sin(a) * d, color: C.peach, mat: M.smooth, ws: 8, hs: 6 });
  }
}

/** bare winter tree / willow skeleton */
export function bareTree(b, { x = 0, y = 0, z = 0, h = 1.8, r = Math.random, snow = false, color = C.bark }) {
  const grow = (p, dir, len, rad, depth) => {
    const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    const m = [(p[0] + e[0]) / 2 + (r() - 0.5) * len * 0.2, (p[1] + e[1]) / 2, (p[2] + e[2]) / 2 + (r() - 0.5) * len * 0.2];
    b.tube([p, m, e], (t) => rad * (1 - t * 0.6), { color, mat: M.wood, radial: 4, segs: 5 });
    if (snow && depth <= 1) b.sphere(rad * 2.2, { x: e[0], y: e[1] + rad, z: e[2], sy: 0.5, color: C.snow, mat: M.snow, ws: 6, hs: 4 });
    if (depth <= 0) return;
    const n = 2 + (r() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, up = 0.5 + r() * 0.4;
      const d = [dir[0] * 0.5 + Math.cos(a) * (1 - up), up, dir[2] * 0.5 + Math.sin(a) * (1 - up)];
      const l = Math.hypot(...d);
      grow(e, d.map((v) => v / l), len * (0.6 + r() * 0.15), rad * 0.62, depth - 1);
    }
  };
  grow([x, y, z], [0, 1, 0], h * 0.45, h * 0.05, 3);
}

/* ---------------------------------------------------------------- rocks -- */
/** 青绿 palette by relative height t (0..1) and face normal y */
// 千里江山图 logic: cliffs are ochre at the foot rising into azurite; every surface that faces
// the sky (ledges, shoulders, slopes) is laid with malachite. Streaks run vertically (披麻皴).
export function qinglv(hmax, { base = 0, wet = 0 } = {}) {
  const cliff = [[0, C.zheshiL], [0.16, C.zheshi], [0.42, '#4f7468'], [0.7, C.shiqing], [1, '#20465f']];
  const ledge = [[0, '#a7a66a'], [0.25, C.shilvL], [0.6, C.shilv], [1, '#2f7660']];
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const streak = noise2((x + z) * 1.7, y * 0.22) - 0.5;          // vertical striation
    const j = (hash2(x * 13.1, z * 11.7 + y * 3) - 0.5) * 0.035;
    ramp(cliff, t + streak * 0.16 + j, out);
    out.multiplyScalar(0.92 + streak * 0.22);
    const up = smooth(0.42, 0.78, ny + streak * 0.1);
    if (up > 0) out.lerp(ramp(ledge, t + j, tmp), up);
    if (ny < 0.12) out.multiplyScalar(0.84);                         // overhangs in shade
    if (wet && y - base < 0.5) out.lerp(_cb.set('#6f6a5a'), 0.35);
    return out;
  };
}
export function fireRock(hmax, { base = 0 } = {}) {
  const stops = [[0, '#5a2116'], [0.3, '#8a2f1c'], [0.62, '#b4472a'], [0.85, '#cf6a38'], [1, '#e08a4a']];
  const out = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    ramp(stops, t + (hash2(x * 5.1, z * 6.3) - 0.5) * 0.14, out);
    if (ny > 0.8) out.lerp(_cb.set('#6b3b2b'), 0.5);
    else if (ny < 0.3) out.multiplyScalar(0.75);
    return out;
  };
}
export function snowRock(hmax, { base = 0, snowline = 0.62 } = {}) {
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const n = noise2(x * 1.1 + 3, z * 1.1 + y * 0.6) - 0.5;
    const k = smooth(snowline - 0.18, snowline + 0.08, ny + n * 0.22 + t * 0.08);
    ramp([[0, '#59616a'], [0.6, '#737c86'], [1, '#8e979f']], t + n * 0.2, out).multiplyScalar(0.92 + n * 0.25);
    return out.lerp(tmp.set(C.snow), k);
  };
}

/** scholar rock / boulder: displaced icosphere, faceted */
export function rock(b, { x = 0, y = 0, z = 0, r = 1, h = 1, color = C.rock, rand = Math.random, detail = 1, palette = null, ry = 0 }) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const P = g.attributes.position;
  const ph = rand() * 100;
  for (let i = 0; i < P.count; i++) {
    _p.fromBufferAttribute(P, i);
    const k = 0.75 + 0.5 * noise2(_p.x * 1.7 + ph, _p.z * 1.7 + _p.y * 1.3);
    P.setXYZ(i, _p.x * r * k, Math.max(-0.2, _p.y) * h * k, _p.z * r * k);
  }
  return b.geo(g, { x, y, z, ry, color, mat: M.flat, flatNormals: true, faceColor: palette });
}

/**
 * needle peak 石笋: a leaning, knobbly column — the signature of 青绿 mountains.
 * palette(x,y,z,nx,ny,nz) colours per face; defaults to qinglv over the peak height.
 */
export function peak(b, { x = 0, y = 0, z = 0, r = 1.2, h = 8, lean = 0.15, rand = Math.random, palette = null, seg = 11, rings, taper = 0.75, flatTop = 0, steps, leanDir }) {
  const la = leanDir ?? rand() * Math.PI * 2;
  const ph = rand() * 100;
  rings = rings ?? Math.max(12, Math.round(h * 2.2));
  steps = steps ?? Math.max(2, Math.round(h / 2.6));
  const pos = [], idx = [];
  for (let k = 0; k <= rings; k++) {
    const t = k / rings;
    // terraces: each step bulges at its top into a shelf, then recedes (ledges facing the sky)
    const st = (t * steps + ph * 0.37) % 1;
    const shelf = 1 + 0.2 * smooth(0.55, 0.92, st) - 0.06 * smooth(0, 0.25, st);
    const crown = 1 + 0.18 * smooth(0.7, 0.95, t) * (1 - smooth(0.95, 1, t));   // knobbly crown
    const rr = r * (1 - Math.pow(t, 1.15) * taper) * shelf * crown;
    // S-shaped lean
    const L = lean * h * (t * t * 1.2 - 0.25 * Math.sin(t * Math.PI) * t);
    const ox = Math.cos(la) * L, oz = Math.sin(la) * L;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      // vertical ribs: angular noise that changes slowly with height
      const n = 0.72 + 0.56 * noise2(Math.cos(a) * 1.6 + ph, Math.sin(a) * 1.6 + t * 1.3);
      pos.push(x + ox + Math.cos(a) * rr * n, y + h * t + (k > 0 && k < rings ? (rand() - 0.5) * h * 0.012 : 0), z + oz + Math.sin(a) * rr * n);
    }
  }
  for (let k = 0; k < rings; k++) for (let i = 0; i < seg; i++) {
    const a = k * seg + i, bb = k * seg + ((i + 1) % seg), c = (k + 1) * seg + ((i + 1) % seg), d = (k + 1) * seg + i;
    idx.push(a, d, c, a, c, bb);
  }
  // cap
  const ci = pos.length / 3;
  const tl = rings * seg;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < seg; i++) { cx += pos[(tl + i) * 3]; cy += pos[(tl + i) * 3 + 1]; cz += pos[(tl + i) * 3 + 2]; }
  pos.push(cx / seg, cy / seg + r * (flatTop ? 0.02 : 0.25), cz / seg);
  for (let i = 0; i < seg; i++) idx.push(tl + i, ci, tl + ((i + 1) % seg));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  b.geo(g, { mat: M.flat, flatNormals: true, faceColor: palette || qinglv(h, { base: y }) });
  const L = lean * h * 1.2;
  return [x + Math.cos(la) * L, y + h + r * (flatTop ? 0.02 : 0.2), z + Math.sin(la) * L];
}

/**
 * polar heightfield terrain (radius R), coloured per face by palette.
 * fn(x,z) → height (≥0). Skirts down to y=0 at the rim.
 */
export function terrain(b, { R = 10.4, rings = 40, segs = 120, fn, palette, mat = M.flat, y = 0 }) {
  const pos = [], idx = [];
  pos.push(0, y + fn(0, 0), 0);
  for (let i = 1; i <= rings; i++) {
    const rr = (i / rings) * R;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2, px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
      pos.push(px, y + fn(px, pz), pz);
    }
  }
  const at = (i, j) => (i === 0 ? 0 : 1 + (i - 1) * segs + (j % segs));
  for (let j = 0; j < segs; j++) idx.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    idx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i + 1, j));
  }
  // skirt
  const base = pos.length / 3;
  for (let j = 0; j < segs; j++) {
    const a = (j / segs) * Math.PI * 2;
    pos.push(Math.cos(a) * R, y, Math.sin(a) * R);
  }
  for (let j = 0; j < segs; j++) {
    const t0 = at(rings, j), t1 = at(rings, j + 1), b0 = base + j, b1 = base + ((j + 1) % segs);
    idx.push(t0, t1, b1, t0, b1, b0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return b.geo(g, { mat, flatNormals: true, faceColor: palette });
}

/* --------------------------------------------------------------- clouds -- */
/** 祥云: a flat cluster of puffs with a curled end */
export function cloud(b, { x = 0, y = 0, z = 0, s = 1, ry = 0, color = C.white, rand = Math.random, puffs = 6, curl = true, mat = M.cloud }) {
  b.push({ x, y, z, ry, s });
  for (let i = 0; i < puffs; i++) {
    const t = i / (puffs - 1) - 0.5;
    const pr = 0.55 + rand() * 0.35 - Math.abs(t) * 0.5;
    b.sphere(pr, { x: t * 3.2, y: (rand() - 0.3) * 0.2, z: (rand() - 0.5) * 0.7, sy: 0.42, sx: 1.3, color, mat, ws: 12, hs: 8 });
  }
  if (curl) b.torus(0.3, 0.1, { x: 1.95, y: 0.05, z: 0.1, arc: Math.PI * 1.5, color, mat, ts: 14 });
  b.pop();
}

/* -------------------------------------------------------------- figures -- */
// Figures are ~0.7 tall (stylised; the pilgrims must read at diorama scale).
// figure(b, kind, opts) — kinds: monk, wukong, bajie, sha, monkey, villager, woman.
// poses: wukong 'stand' | 'gaze' (hand shading eyes) | 'staff' (staff on shoulder) | 'fan' | 'none' (no arms; add your own)
const ROBE = (b, color, h = 0.44, rb = 0.15, rt = 0.085) => b.lathe([[0, 0], [rb, 0], [rb * 0.92, h * 0.3], [rt * 1.05, h], [0, h]], { color, mat: M.cloth, seg: 12 });

export function figure(b, kind, o = {}) {
  const { pose = 'stand', s = 1 } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s });
  if (kind === 'monk') {
    ROBE(b, C.cinnabar, 0.46, 0.16, 0.09);
    b.lathe([[0, 0.02], [0.165, 0.02], [0.17, 0.06], [0, 0.06]], { color: C.gold, mat: M.smooth, seg: 12 });
    b.cyl(0.085, 0.1, 0.13, { y: 0.44, color: C.gold, mat: M.cloth });         // shoulders (yellow under-robe)
    b.box(0.03, 0.2, 0.2, { x: 0.06, y: 0.3, z: 0.02, rz: 0.5, color: C.gold, mat: M.cloth }); // kasaya sash
    b.sphere(0.07, { y: 0.63, color: C.skin, mat: M.smooth });
    b.cyl(0.055, 0.075, 0.07, { y: 0.66, color: C.gold, mat: M.cloth, seg: 5 }); // 毗卢帽
    b.cone(0.03, 0.06, { y: 0.73, color: C.gold, mat: M.cloth });
    if (pose !== 'none') {
      b.cyl(0.006, 0.006, 0.9, { x: 0.15, y: 0, z: 0.05, color: C.gold, mat: M.metal, seg: 4 });   // 锡杖
      b.torus(0.04, 0.008, { x: 0.15, y: 0.92, z: 0.05, color: C.gold, mat: M.metal, ts: 10 });
      b.cyl(0.03, 0.03, 0.16, { x: 0.12, y: 0.42, z: 0.05, rz: -0.6, color: C.cinnabar, mat: M.cloth, seg: 6 });
    }
  } else if (kind === 'wukong') {
    b.cyl(0.04, 0.045, 0.22, { x: -0.05, color: C.furD, mat: M.smooth, seg: 6 });
    b.cyl(0.04, 0.045, 0.22, { x: 0.05, color: C.furD, mat: M.smooth, seg: 6 });
    // 虎皮裙 tiger-skin skirt: stripes as rings
    for (let i = 0; i < 4; i++) b.cyl(0.11 - i * 0.008, 0.12 - i * 0.008, 0.035, { y: 0.16 + i * 0.035, color: i % 2 ? '#3a2412' : '#e09a3a', mat: M.cloth, seg: 10 });
    b.cyl(0.08, 0.095, 0.17, { y: 0.3, color: '#d9b04a', mat: M.cloth, seg: 10 });   // yellow tunic
    b.cyl(0.1, 0.1, 0.03, { y: 0.31, color: C.cinnabar, mat: M.cloth, seg: 10 });   // red sash
    b.sphere(0.075, { y: 0.55, color: C.fur, mat: M.smooth });
    b.sphere(0.05, { y: 0.54, z: 0.045, sx: 1.05, sy: 0.9, sz: 0.6, color: '#e7a98a', mat: M.smooth }); // face
    b.torus(0.072, 0.012, { y: 0.585, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 16 });         // 金箍
    b.tube([[0, 0.2, -0.08], [0, 0.12, -0.2], [0, 0.25, -0.3], [0, 0.4, -0.26]], 0.014, { color: C.fur, mat: M.smooth });
    // arm: cylinder from the shoulder; rz/rx are the total rotation of a +y cylinder
    const arm = (sx, rz, rx = 0, len = 0.2) => b.cyl(0.022, 0.026, len, { x: sx * 0.09, y: 0.43, rz, rx, color: C.fur, mat: M.smooth, seg: 6 });
    const hang = (sx) => arm(sx, Math.PI + sx * 0.3);
    if (pose === 'gaze') {            // 手搭凉棚: right hand shading the eyes
      hang(-1); arm(1, 0.2, 0.7, 0.18);
    } else if (pose === 'staff') {    // staff across the shoulders
      arm(-1, 0.775); arm(1, -0.775);
      staff(b, { y: 0.5, z: -0.05, rz: Math.PI / 2, len: 1.0 });
    } else if (pose === 'fan') {      // right arm raised; the scene attaches the fan near (0.15, 0.62, 0.05)
      hang(-1); arm(1, -0.45, 0.3, 0.2);
    } else if (pose === 'stand') {
      hang(-1); hang(1);
      staff(b, { x: 0.15, y: 0, z: 0.05, len: 0.95 });
    }
  } else if (kind === 'bajie') {
    b.cyl(0.05, 0.055, 0.18, { x: -0.07, color: '#2a2a2c', mat: M.smooth, seg: 6 });
    b.cyl(0.05, 0.055, 0.18, { x: 0.07, color: '#2a2a2c', mat: M.smooth, seg: 6 });
    ROBE(b, '#33424e', 0.36, 0.17, 0.13);                        // 青锦直裰
    b.sphere(0.17, { y: 0.34, z: 0.03, sy: 0.95, color: '#3a3a3e', mat: M.smooth });   // belly
    b.sphere(0.115, { y: 0.56, color: '#3d3c40', mat: M.smooth });
    b.cyl(0.05, 0.06, 0.09, { y: 0.54, z: 0.13, rx: Math.PI / 2, color: '#56535a', mat: M.smooth, seg: 10 }); // snout
    for (const sx of [-1, 1]) b.sphere(0.08, { x: sx * 0.11, y: 0.6, z: 0.02, sx: 0.4, sy: 1, sz: 0.9, rz: sx * 0.6, color: '#46444a', mat: M.smooth }); // ears
    if (pose !== 'none') {
      // 九齿钉钯 on the shoulder
      b.push({ x: 0.12, y: 0.5, z: -0.05, rx: -0.9 });
      b.cyl(0.012, 0.012, 1.0, { y: -0.2, color: C.wood, mat: M.wood, seg: 5 });
      b.box(0.22, 0.04, 0.04, { y: 0.8, color: '#9aa0a6', mat: M.metal });
      for (let i = 0; i < 9; i++) b.cyl(0.006, 0.006, 0.09, { x: -0.1 + i * 0.025, y: 0.82, color: '#9aa0a6', mat: M.metal, seg: 4 });
      b.pop();
    }
  } else if (kind === 'sha') {
    ROBE(b, '#2f4e5c', 0.5, 0.15, 0.095);
    b.cyl(0.09, 0.105, 0.14, { y: 0.48, color: '#2f4e5c', mat: M.cloth, seg: 10 });
    for (let i = 0; i < 9; i++) { // 九骷髅 necklace
      const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7;
      b.sphere(0.022, { x: Math.cos(a) * 0.1, y: 0.56 - Math.sin(a) * 0.06, z: Math.sin(a) * 0.08, color: C.ivory, mat: M.smooth, ws: 6, hs: 5 });
    }
    b.sphere(0.075, { y: 0.66, color: '#6e7f78', mat: M.smooth });
    b.sphere(0.05, { y: 0.61, z: 0.04, sy: 1.3, color: C.inkSoft, mat: M.smooth });   // beard
    b.sphere(0.07, { y: 0.71, sy: 0.6, color: '#b8432c', mat: M.smooth });             // red hair
    if (pose !== 'none') {
      // shoulder pole with two bundles of luggage
      b.push({ y: 0.58, ry: Math.PI / 2 });
      b.cyl(0.01, 0.01, 1.0, { rz: Math.PI / 2, x: 0.5, color: C.wood, mat: M.wood, seg: 5 });
      for (const sx of [-1, 1]) {
        b.cyl(0.003, 0.003, 0.22, { x: sx * 0.42, y: -0.22, color: C.inkSoft, seg: 3 });
        b.box(0.2, 0.18, 0.16, { x: sx * 0.42, y: -0.4, color: sx > 0 ? '#7a6a4a' : '#5b6e5a', mat: M.cloth });
      }
      b.pop();
    }
  } else if (kind === 'monkey') {
    b.sphere(0.1, { y: 0.12, sy: 1.15, color: C.furD, mat: M.smooth, ws: 8, hs: 6 });
    b.sphere(0.065, { y: 0.26, z: 0.03, color: C.furD, mat: M.smooth, ws: 8, hs: 6 });
    b.sphere(0.04, { y: 0.255, z: 0.075, sz: 0.6, color: '#d9a080', mat: M.smooth, ws: 8, hs: 6 });
    b.tube([[0, 0.06, -0.08], [0, 0.04, -0.18], [0, 0.14, -0.24], [0, 0.24, -0.2]], 0.012, { color: C.furD, mat: M.smooth, radial: 4 });
  } else if (kind === 'villager' || kind === 'woman') {
    const robe = o.robe || (kind === 'woman' ? '#b86a6a' : '#5a6a7a');
    ROBE(b, robe, 0.44, kind === 'woman' ? 0.15 : 0.12, 0.08);
    b.cyl(0.075, 0.085, 0.12, { y: 0.42, color: robe, mat: M.cloth, seg: 8 });
    b.sphere(0.065, { y: 0.6, color: C.skin, mat: M.smooth });
    if (kind === 'woman') b.sphere(0.055, { y: 0.66, z: -0.03, color: C.ink, mat: M.smooth });
    else b.cone(0.13, 0.08, { y: 0.63, color: o.hat || '#b59a64', mat: M.cloth, seg: 10 });
  }
  b.pop();
}

/** 如意金箍棒: red shaft, gold bands at both ends. Along +y from (x,y,z) unless rotated. */
export function staff(b, { x = 0, y = 0, z = 0, rx = 0, rz = 0, ry = 0, len = 1, r = 0.014, center }) {
  center = center ?? !!(rx || rz);   // rotated staffs pivot about their middle
  const y0 = center ? -len / 2 : 0;
  b.push({ x, y, z, rx, ry, rz });
  b.cyl(r, r, len, { y: y0, color: C.cinnabar, mat: M.lacquer, seg: 6 });
  for (const e of [0, 1]) b.cyl(r * 1.25, r * 1.25, len * 0.1, { y: y0 + e * len * 0.9, color: C.gold, mat: M.metal, seg: 6 });
  b.pop();
}

/** 白龙马: white horse with a red saddle. Faces +z. ~0.95 tall at the head. */
export function horse(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, color = C.white, saddle = C.cinnabar, rider = null }) {
  const mane = '#d9d2c6', hoof = '#4a4038';
  b.push({ x, y, z, ry, s });
  // barrel, chest and haunch
  b.sphere(0.22, { y: 0.5, sx: 0.9, sy: 0.85, sz: 1.55, color, mat: M.smooth });
  b.sphere(0.17, { y: 0.52, z: 0.22, sx: 1.0, sy: 1.05, color, mat: M.smooth });
  b.sphere(0.17, { y: 0.53, z: -0.22, sx: 1.05, sy: 1.0, color, mat: M.smooth });
  // legs: thigh + cannon + hoof, slightly splayed, front pair stepping
  for (const [lx, lz, step] of [[-0.1, 0.24, 0.12], [0.1, 0.24, -0.05], [-0.1, -0.24, -0.08], [0.1, -0.24, 0.1]]) {
    b.cyl(0.045, 0.06, 0.2, { x: lx, y: 0.24, z: lz, rx: step, color, mat: M.smooth, seg: 7 });
    b.cyl(0.032, 0.036, 0.24, { x: lx, y: 0.02, z: lz + step * 0.12, rx: step * 0.4, color, mat: M.smooth, seg: 6 });
    b.cyl(0.04, 0.042, 0.04, { x: lx, y: 0, z: lz + step * 0.12, color: hoof, mat: M.smooth, seg: 6 });
  }
  // neck, head, ears, mane
  b.cyl(0.075, 0.12, 0.34, { y: 0.6, z: 0.3, rx: 0.6, color, mat: M.smooth, seg: 9 });
  b.sphere(0.085, { y: 0.88, z: 0.46, sx: 0.85, sy: 0.9, sz: 1.0, color, mat: M.smooth });
  b.cyl(0.045, 0.07, 0.2, { y: 0.86, z: 0.5, rx: 1.95, color, mat: M.smooth, seg: 8 });   // muzzle
  for (const sx of [-1, 1]) b.cone(0.022, 0.07, { x: sx * 0.04, y: 0.95, z: 0.43, rz: -sx * 0.2, color, mat: M.smooth, seg: 5 });
  b.box(0.035, 0.08, 0.3, { y: 0.78, z: 0.32, rx: 0.6, color: mane, mat: M.smooth });
  // tail
  b.tube([[0, 0.6, -0.4], [0, 0.52, -0.5], [0, 0.32, -0.52], [0, 0.18, -0.48]], (t) => 0.04 + 0.03 * t, { color: mane, mat: M.smooth });
  // saddle, saddle-cloth with gold hem, stirrups
  b.box(0.3, 0.06, 0.32, { y: 0.68, color: saddle, mat: M.cloth });
  b.box(0.42, 0.18, 0.36, { y: 0.52, color: saddle, mat: M.cloth });
  b.box(0.43, 0.025, 0.37, { y: 0.52, color: C.gold, mat: M.cloth });
  for (const sx of [-1, 1]) b.torus(0.03, 0.007, { x: sx * 0.22, y: 0.4, color: C.gold, mat: M.metal, ts: 8 });
  b.pop();
  if (rider) {
    b.push({ x, y, z, ry, s });
    figure(b, rider, { y: 0.52, s: 0.85 });
    b.pop();
  }
}

/* ---------------------------------------------------------- soft puffs -- */
// Soft round particles (mist, steam, smoke, snow, spray) as one Points draw call.
// size is in world units; set(i, x, y, z, size, alpha) then commit().
let _puffTex = null;
function puffTexture() {
  if (_puffTex) return _puffTex;
  const S = 64, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  _puffTex = new THREE.CanvasTexture(cv);
  return _puffTex;
}
const _dbs = new THREE.Vector2();
export function softPuffs(count, { color = '#ffffff', opacity = 1, additive = false, nearFade = [0, 0] } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uTex: { value: puffTexture() }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uScale: { value: 400 }, uNear: { value: new THREE.Vector2(...nearFade) } },
    vertexShader: `attribute float size; attribute float alpha; varying float vA; uniform float uScale; uniform vec2 uNear;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = alpha * (uNear.y > 0.0 ? smoothstep(uNear.x, uNear.y, -mv.z) : 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * uScale / max(0.1, -mv.z); }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA * uOpacity; if (a < 0.004) discard; gl_FragColor = vec4(uColor, a); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.onBeforeRender = (renderer, scene, camera) => {
    renderer.getDrawingBufferSize(_dbs);
    const ws = new THREE.Vector3(); points.getWorldScale(ws);
    mat.uniforms.uScale.value = ws.x * _dbs.y / (2 * Math.tan((camera.fov * Math.PI) / 360));
  };
  return {
    points, mat,
    set(i, x, y, z, s, a = 1) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; size[i] = s; alpha[i] = a; },
    commit() { geo.attributes.position.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; },
  };
}
