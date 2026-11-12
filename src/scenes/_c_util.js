// Private helpers for builder C's scenes (宝象国 … 女儿国).
import { THREE, Builder, M, C, clamp, lerp, roof } from '../kit.js';

/** distance from (x,z) to a polyline [[x,z],...] */
export function pathDist(path, x, z) {
  let d = 1e9;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
/** point at parameter t (0..1, by segment count) on a polyline */
export function pathAt(path, t) {
  const f = clamp(t) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), k = f - i;
  return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)];
}

/** build a small Builder into a Group */
export function group(fn, opts) { const b = new Builder(); fn(b); return b.build(opts); }

/** striped tiger, faces +z, ~0.75 tall at the shoulder at s=1, body length ~1.5 */
export function tiger(b, { x = 0, y = 0, z = 0, ry = 0, s = 1 } = {}) {
  const orange = new THREE.Color('#d98a32'), dark = new THREE.Color('#2a1b12'), belly = new THREE.Color('#f1e6cf');
  const pal = (cx, cy, cz, nx, ny) => {
    if (ny < -0.35) return belly;
    const band = Math.sin(cz * 26 / s + Math.sin(cy * 9 / s) * 1.4);
    return band > 0.55 ? dark : orange;
  };
  b.push({ x, y, z, ry, s });
  b.sphere(0.32, { y: 0.5, sx: 0.85, sy: 0.82, sz: 2.0, mat: M.flat, faceColor: pal, ws: 12, hs: 8, flatNormals: true });
  b.sphere(0.25, { y: 0.56, z: 0.66, sx: 1.05, sy: 0.95, sz: 0.95, mat: M.flat, faceColor: pal, ws: 10, hs: 8, flatNormals: true });
  b.sphere(0.13, { y: 0.5, z: 0.86, sx: 1.2, sy: 0.75, color: belly, mat: M.smooth, ws: 8, hs: 6 });       // muzzle
  b.sphere(0.03, { y: 0.53, z: 0.98, color: C.ink, mat: M.smooth, ws: 6, hs: 4 });
  for (const sx of [-1, 1]) {
    b.cone(0.07, 0.1, { x: sx * 0.15, y: 0.76, z: 0.6, rz: -sx * 0.3, color: '#c27a2c', mat: M.smooth, seg: 5 });
    b.sphere(0.028, { x: sx * 0.1, y: 0.63, z: 0.88, color: '#f2d24a', mat: M.glow, glow: 1.3, ws: 6, hs: 4 });
  }
  for (const [lx, lz] of [[-0.15, 0.4], [0.15, 0.4], [-0.15, -0.42], [0.15, -0.42]]) {
    b.cyl(0.07, 0.06, 0.42, { x: lx, y: 0, z: lz, mat: M.flat, faceColor: pal, seg: 7 });
    b.sphere(0.075, { x: lx, y: 0.03, z: lz + 0.04, sy: 0.55, color: belly, mat: M.smooth, ws: 6, hs: 4 });
  }
  b.tube([[0, 0.58, -0.6], [0, 0.45, -0.85], [0, 0.5, -1.05], [0, 0.78, -1.12]], (t) => 0.045 - t * 0.015, { mat: M.flat, faceColor: pal, radial: 5, segs: 14 });
  b.pop();
}

/** iron cage, centred, base at y; w (x) by d (z) by h */
export function cage(b, { x = 0, y = 0, z = 0, ry = 0, w = 2, d = 1.2, h = 1.4, bar = 0.16, color = '#2f3134' } = {}) {
  b.push({ x, y, z, ry });
  const nx = Math.round(w / bar), nz = Math.round(d / bar);
  b.box(w + 0.16, 0.14, d + 0.16, { color, mat: M.metal });
  const frame = (yy, t) => {
    for (const sz of [-1, 1]) b.box(w + t, t, t, { y: yy, z: sz * d / 2, color, mat: M.metal });
    for (const sx of [-1, 1]) b.box(t, t, d + t, { x: sx * w / 2, y: yy, color, mat: M.metal });
  };
  frame(h, 0.1); frame(h * 0.5, 0.05);
  for (let i = 1; i < nx; i += 2) b.box(0.03, 0.03, d, { x: -w / 2 + (w * i) / nx, y: h + 0.1, color, mat: M.metal });
  for (let i = 0; i <= nx; i++) for (const sz of [-1, 1]) b.cyl(0.018, 0.018, h, { x: -w / 2 + (w * i) / nx, y: 0.1, z: sz * d / 2, color, mat: M.metal, seg: 5 });
  for (let j = 1; j < nz; j++) for (const sx of [-1, 1]) b.cyl(0.018, 0.018, h, { x: sx * w / 2, y: 0.1, z: -d / 2 + (d * j) / nz, color, mat: M.metal, seg: 5 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sphere(0.06, { x: sx * w / 2, y: h + 0.12, z: sz * d / 2, color: C.gold, mat: M.metal, ws: 8, hs: 6 });
  b.pop();
}

/** a court figure: robe + hat. kind: 'official' | 'king' | 'queen' | 'princess' | 'guard' | 'daoist' */
export function courtier(b, kind, { x = 0, y = 0, z = 0, ry = 0, s = 1, robe, kneel = false } = {}) {
  b.push({ x, y, z, ry, s, sy: kneel ? s * 0.62 : s });
  const R = robe || { official: '#3d6a7a', king: '#d9a13a', queen: '#d9707a', princess: '#e7a1b0', guard: '#7a3a2c', daoist: '#4a5560' }[kind];
  b.lathe([[0, 0], [0.16, 0], [0.15, 0.14], [0.09, 0.46], [0, 0.46]], { color: R, mat: M.cloth, seg: 12 });
  b.cyl(0.08, 0.095, 0.12, { y: 0.42, color: R, mat: M.cloth, seg: 8 });
  b.cyl(0.11, 0.11, 0.025, { y: 0.3, color: kind === 'king' || kind === 'queen' ? C.cinnabar : C.gold, mat: M.cloth, seg: 10 });
  b.sphere(0.065, { y: 0.6, color: C.skin, mat: M.smooth, ws: 10, hs: 8 });
  if (kind === 'official') { b.box(0.13, 0.07, 0.11, { y: 0.64, color: C.ink, mat: M.cloth }); b.box(0.34, 0.012, 0.03, { y: 0.67, z: -0.03, color: C.ink, mat: M.cloth }); }
  else if (kind === 'king') { b.cyl(0.07, 0.06, 0.08, { y: 0.64, color: C.gold, mat: M.metal, seg: 8 }); b.box(0.2, 0.012, 0.16, { y: 0.72, color: C.ink, mat: M.cloth }); b.sphere(0.03, { y: 0.48, z: 0.07, sy: 1.6, color: C.inkSoft, mat: M.smooth, ws: 6, hs: 4 }); }
  else if (kind === 'queen' || kind === 'princess') { b.sphere(0.058, { y: 0.66, z: -0.03, color: C.ink, mat: M.smooth, ws: 8, hs: 6 }); b.cone(0.05, 0.12, { y: 0.67, z: -0.04, color: C.gold, mat: M.metal, seg: 6 }); for (const sx of [-1, 1]) b.cyl(0.005, 0.005, 0.12, { x: sx * 0.05, y: 0.68, z: -0.04, rz: sx * 1.0, color: C.gold, mat: M.metal, seg: 3 }); }
  else if (kind === 'guard') { b.cone(0.08, 0.12, { y: 0.63, color: '#5a5f66', mat: M.metal, seg: 8 }); b.cyl(0.008, 0.008, 1.0, { x: 0.15, color: C.wood, mat: M.wood, seg: 4 }); b.cone(0.025, 0.1, { x: 0.15, y: 1.0, color: '#b9bec4', mat: M.metal, seg: 4 }); }
  else if (kind === 'daoist') { b.box(0.06, 0.08, 0.06, { y: 0.66, color: C.ink, mat: M.cloth }); b.cyl(0.004, 0.004, 0.08, { y: 0.69, rx: Math.PI / 2, color: C.gold, seg: 3 }); b.sphere(0.035, { y: 0.52, z: 0.06, sy: 1.8, color: '#d8d4cc', mat: M.smooth, ws: 6, hs: 4 }); }
  b.pop();
}

/** palace wall segment from a to b (x,z), base at y, with a tiled coping */
export function wall(b, ax, az, bx, bz, { y = 0, h = 0.9, t = 0.22, color = C.wallRed, tile = C.tile } = {}) {
  const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
  b.box(t, h, L, { x: (ax + bx) / 2, y, z: (az + bz) / 2, ry, color, mat: M.stone });
  b.box(t + 0.16, 0.08, L + 0.1, { x: (ax + bx) / 2, y: y + h, z: (az + bz) / 2, ry, color: tile, mat: M.tile });
  b.box(0.05, 0.07, L + 0.1, { x: (ax + bx) / 2, y: y + h + 0.08, z: (az + bz) / 2, ry, color: C.inkSoft, mat: M.smooth });
}

/** open hall: platform, columns, roof, no front wall (interior visible) */
export function openHall(b, { x = 0, y = 0, z = 0, ry = 0, w = 4, d = 3, h = 1.6, base = 0.3, roofColor = C.tile, pillar = C.cinnabar, beam = C.shiqing, back = C.wallRed }) {
  b.push({ x, y, z, ry });
  b.box(w + 0.7, base, d + 0.7, { color: C.ivory });
  b.box(w, h * 0.94, 0.12, { y: base, z: -d / 2 + 0.1, color: back });
  const nx = Math.max(2, Math.round(w) + 1);
  for (let i = 0; i < nx; i++) for (const sz of [-1, 1]) b.cyl(0.07, 0.07, h, { x: -w / 2 + (w * i) / (nx - 1), y: base, z: sz * d / 2, color: pillar, mat: M.lacquer, seg: 8 });
  b.box(w + 0.15, h * 0.12, d + 0.15, { y: base + h * 0.88, color: beam, mat: M.smooth });
  b.box(w + 0.2, h * 0.04, d + 0.2, { y: base + h * 0.86, color: C.gold, mat: M.smooth });
  roof(b, { y: base + h, w, d, color: roofColor });
  b.pop();
}

/** 观音: white hooded robe, halo, the 净瓶 with a willow sprig. ~0.8 tall at s=1. Faces +z. */
export function guanyin(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, halo = true } = {}) {
  b.push({ x, y, z, ry, s });
  b.lathe([[0, 0], [0.2, 0], [0.19, 0.08], [0.13, 0.3], [0.1, 0.5], [0, 0.5]], { color: '#f4f1ea', mat: M.cloth, seg: 14 });
  b.cyl(0.08, 0.1, 0.12, { y: 0.47, color: '#f4f1ea', mat: M.cloth, seg: 10 });
  b.cyl(0.11, 0.11, 0.02, { y: 0.36, color: '#7fb6a8', mat: M.cloth, seg: 12 });           // sash
  b.sphere(0.065, { y: 0.66, color: '#f0d8bc', mat: M.smooth, ws: 10, hs: 8 });
  b.lathe([[0.09, 0.56], [0.1, 0.64], [0.08, 0.72], [0.04, 0.77], [0, 0.78]], { z: -0.012, color: '#f8f6f0', mat: M.cloth, seg: 12 });   // hood
  b.sphere(0.022, { y: 0.74, z: 0.05, color: '#d6a94a', mat: M.metal, ws: 6, hs: 4 });
  for (let i = 0; i < 5; i++) b.sphere(0.012, { x: -0.06 + i * 0.03, y: 0.52, z: 0.085, color: '#e8c070', mat: M.metal, ws: 5, hs: 4 });   // necklace
  // arms: right raised in blessing, left holding the vase
  b.cyl(0.026, 0.03, 0.2, { x: 0.1, y: 0.44, rz: -2.4, rx: 0.4, color: '#f4f1ea', mat: M.cloth, seg: 6 });
  b.cyl(0.026, 0.03, 0.2, { x: -0.1, y: 0.44, rz: 2.6, rx: 0.9, color: '#f4f1ea', mat: M.cloth, seg: 6 });
  b.lathe([[0, 0], [0.025, 0.005], [0.035, 0.03], [0.02, 0.06], [0.01, 0.09], [0.015, 0.1], [0, 0.1]], { x: -0.16, y: 0.33, z: 0.1, color: '#f6f6f2', mat: M.porcelain, seg: 10 });
  b.tube([[-0.16, 0.42, 0.1], [-0.18, 0.5, 0.12], [-0.22, 0.54, 0.14]], 0.004, { color: '#5e8f4f', mat: M.smooth, radial: 3 });
  if (halo) b.torus(0.15, 0.008, { y: 0.68, z: -0.08, color: '#ffd98a', mat: M.glow, glow: 1.2, ts: 32 });
  b.pop();
}

/** a lotus pedestal (petals in two rings), base at y, radius r */
export function lotusSeat(b, { x = 0, y = 0, z = 0, r = 0.3, color = '#f2c9cf', inner = '#f8e6e8' } = {}) {
  b.push({ x, y, z });
  for (let ring = 0; ring < 2; ring++) {
    const n = 10 - ring * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.3;
      b.sphere(r * 0.45, { x: Math.cos(a) * r * (0.75 - ring * 0.3), y: r * (0.18 + ring * 0.12), z: Math.sin(a) * r * (0.75 - ring * 0.3), ry: Math.PI / 2 - a, rx: -0.5 - ring * 0.4, sx: 0.55, sy: 0.25, sz: 1, color: ring ? inner : color, mat: M.smooth, ws: 8, hs: 6 });
    }
  }
  b.cyl(r * 0.5, r * 0.4, r * 0.3, { y: r * 0.15, color: C.gold, mat: M.smooth, seg: 12 });
  b.pop();
}

/* ------------------------------------------------------------ night lamps -- */
/**
 * Windows / lanterns that look like dark lattice by day and glow as env.night rises.
 * Returns { mat, update(night) }; give boxes { mat, color: C.lamp } in any Builder (own material, so
 * nothing shared with other scenes changes).
 */
export function nightLamps({ day = 0.08, night = 1.3 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
  mat.color.setScalar(day);
  return { mat, update(k) { mat.color.setScalar(day + (night - day) * k); } };
}
/** lamp panes over the two windows of a kit house() with the same placement */
export function houseLamps(b, mat, { x = 0, y = 0, z = 0, ry = 0, w = 1.6, d = 1.1, h = 0.9, color = C.lamp } = {}) {
  b.push({ x, y, z, ry });
  for (const sx of [-1, 1]) b.box(0.24, 0.18, 0.02, { x: sx * w * 0.3, y: 0.11 + h * 0.45, z: d / 2 + 0.045, color, mat });
  b.pop();
}
/** lamp panes over (some of) the front lattice doors of a kit hall() with the same placement */
export function hallLamps(b, mat, { x = 0, y = 0, z = 0, ry = 0, w = 4, d = 3, h = 1.6, base = 0.35, every = 1, color = C.lamp } = {}) {
  b.push({ x, y, z, ry });
  const nx = Math.max(2, Math.round(w / 1.0) + 1), cr = Math.max(0.06, Math.min(w, d) * 0.03);
  for (let i = 0; i < nx - 1; i += every) {
    const cx = -w / 2 + (w * (i + 0.5)) / (nx - 1), pw = w / (nx - 1) - cr * 2.4;
    b.box(pw * 0.5, h * 0.42, 0.02, { x: cx, y: base + 0.12, z: (d - 0.4) / 2 + 0.045, color, mat });
  }
  b.pop();
}

/**
 * softPuffs are unlit, so pale mist and steam would glow against the night. nightDim(puffs, amount)
 * remembers their colours and returns f(night) that darkens them by up to `amount`.
 */
export function nightDim(puffs, amount = 0.6) {
  const base = puffs.map((p) => p.mat.uniforms.uColor.value.clone());
  return (k) => { for (let i = 0; i < puffs.length; i++) puffs[i].mat.uniforms.uColor.value.copy(base[i]).multiplyScalar(1 - amount * k); };
}
