// Private helpers for builder D's scenes (pipadong … shituoling).
import { THREE, M, C, noise2, hash2, clamp, smooth, ramp } from '../kit.js';

/**
 * loft: a faceted solid swept along a centre-line in the y–z plane (x stays the side axis).
 * path(s) → [x,y,z]; rx(s) half-width; rf(s) front depth (+z side), rb(s) back depth; s in 0..1.
 * front: 0..1 how flat the front face is (1 = flat soundboard). Returns nothing; adds to b.
 */
export function loft(b, { path, rx, rf, rb, rings = 40, seg = 20, front = 0.7, noise = 0.08, ph = 0, palette, mat = M.flat, capTop = true }) {
  const pos = [], idx = [];
  const T = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Vector3();
  for (let k = 0; k <= rings; k++) {
    const s = k / rings;
    P.fromArray(path(s));
    Q.fromArray(path(Math.min(1, s + 0.01))).sub(P.fromArray(path(Math.max(0, s - 0.01))));
    T.copy(Q).normalize();
    P.fromArray(path(s));
    Z.crossVectors(X, T).normalize();
    const w = rx(s), f = rf(s), bk = rb(s);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const n = 1 + noise * (2 * noise2(ca * 1.8 + ph, sa * 1.8 + s * 6 + ph) - 1) + (hash2(k * 7 + ph, i * 13) - 0.5) * noise * 0.4;
      const zz = sa > 0 ? f * Math.pow(sa, 1 - front * 0.8) : bk * sa;
      const xx = w * Math.sign(ca) * Math.pow(Math.abs(ca), sa > 0 ? 0.8 : 1);
      pos.push(P.x + xx * n, P.y + Z.y * zz * n, P.z + Z.z * zz * n);
    }
  }
  for (let k = 0; k < rings; k++) for (let i = 0; i < seg; i++) {
    const a = k * seg + i, bb = k * seg + ((i + 1) % seg), c = (k + 1) * seg + ((i + 1) % seg), d = (k + 1) * seg + i;
    idx.push(a, d, c, a, c, bb);
  }
  if (capTop) {
    const tl = rings * seg, ci = pos.length / 3;
    const e = path(1), t2 = path(0.99);
    pos.push(e[0] + (e[0] - t2[0]) * 3, e[1] + (e[1] - t2[1]) * 3, e[2] + (e[2] - t2[2]) * 3);
    for (let i = 0; i < seg; i++) idx.push(tl + i, tl + ((i + 1) % seg), ci);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return b.geo(g, { mat, flatNormals: true, faceColor: palette });
}

/** generic rock palette: cliff ramp by height, ledge colour on sky-facing faces, vertical streaks */
export function stonePal(hmax, { base = 0, cliff, ledge, ledgeAt = 0.55, shade = 0.84 }) {
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const streak = noise2((x + z) * 1.7, y * 0.25) - 0.5;
    const j = (hash2(x * 13.1, z * 11.7 + y * 3) - 0.5) * 0.04;
    ramp(cliff, t + streak * 0.15 + j, out);
    out.multiplyScalar(0.92 + streak * 0.22);
    if (ledge) {
      const up = smooth(ledgeAt - 0.15, ledgeAt + 0.2, ny + streak * 0.1);
      if (up > 0) out.lerp(ramp(ledge, t + j, tmp), up);
    }
    if (ny < 0.1) out.multiplyScalar(shade);
    return out;
  };
}

/** distance from (x,z) to a polyline [[x,z],...] */
export function polyDist(path, x, z) {
  let d = 1e9;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
/** point at parameter u (0..1, by segment count) along a polyline; returns [x,z,angle] */
export function polyAt(path, u) {
  const f = clamp(u) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), k = f - i;
  const [ax, az] = path[i], [bx, bz] = path[i + 1];
  return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)];
}

/** smooth pulse: 0 outside [a,d], 1 in [b,c] */
export const pulse = (a, b, c, d, x) => smooth(a, b, x) * (1 - smooth(c, d, x));

/** a kneeling / standing shaven monk (no hat), optional cangue 枷 */
export function plainMonk(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, robe = '#7a6a58', kneel = false, cangue = false }) {
  b.push({ x, y, z, ry, s });
  const h = kneel ? 0.26 : 0.42;
  b.lathe([[0, 0], [0.15, 0], [0.14, h * 0.4], [0.085, h], [0, h]], { color: robe, mat: M.cloth, seg: 10 });
  b.cyl(0.075, 0.09, 0.1, { y: h - 0.02, color: robe, mat: M.cloth, seg: 8 });
  b.sphere(0.068, { y: h + 0.14, color: C.skin, mat: M.smooth, ws: 10, hs: 8 });
  if (cangue) {
    b.box(0.34, 0.03, 0.26, { y: h + 0.07, color: '#5a3d26', mat: M.wood });
    b.tube([[-0.12, h + 0.07, 0.1], [-0.08, h - 0.12, 0.17], [0.0, h - 0.2, 0.18], [0.08, h - 0.12, 0.17], [0.12, h + 0.07, 0.1]], 0.008, { color: '#6c6e70', mat: M.metal, radial: 3 });
  }
  b.pop();
}
