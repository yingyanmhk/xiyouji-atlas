// 隐雾山 — a monochrome mist painting. Ink-grey peaks stand in a sea of fog that thickens and thins
// in a 30 s loop, hiding and revealing the stone gate of the 南山大王's lair, the leopard demon himself
// crouched on the rock above it, and old plum trees in pink blossom — the "split plum-blossom" trick
// (分瓣梅花计) by which his decoys drew the three disciples apart while he seized Tang Seng.
// The demons first threw out a willow root carved to look like his master's head; Wukong smashed it at
// once, and its pieces lie discarded by the path. The second head was a real one, and before the gate
// Bajie weeps over the grave he has heaped for it. Wukong, drawn large, scans the fog from a ledge.
import { THREE, Builder, M, C, terrain, peak, rock, pine, figure, fbm, noise2, smooth, clamp, lerp, softPuffs } from '../kit.js';
import { inkRock } from './_e_kit.js';

const CYCLE = 30;

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.25 + 1.6 * smooth(9, 2, Math.hypot(x * 0.8, z + 2.5)) + 0.8 * (fbm(x * 0.35 + 3, z * 0.35, 4) - 0.3);
  h += 1.4 * Math.exp(-((x + 4) ** 2 + (z - 2.6) ** 2) / 2.2);                  // Wukong's ledge, front-left
  h -= 0.9 * Math.exp(-((x - 1.4) ** 2 + (z - 3.0) ** 2) / 6);                   // the hollow before the gate
  return Math.max(0.12, h * smooth(10.4, 8.8, r) + 0.12);
}

/** an old plum: crooked dark trunk, few angular branches, pink blossom dotted along them */
function plum(b, { x, y, z, h = 1.5, r }) {
  const branch = (p, dir, len, rad, depth) => {
    const pts = [p];
    let q = p.slice();
    for (let k = 1; k <= 3; k++) {
      q = [q[0] + dir[0] * len / 3 + (r() - 0.5) * len * 0.25, q[1] + dir[1] * len / 3, q[2] + dir[2] * len / 3 + (r() - 0.5) * len * 0.25];
      pts.push(q);
    }
    b.tube(pts, (t) => rad * (1 - t * 0.55), { color: '#2e2a28', mat: M.wood, radial: 5, segs: 8 });
    // blossom along the branch
    for (let k = 0; k < 7 + depth * 3; k++) {
      const t = 0.3 + r() * 0.7, i = Math.min(2, Math.floor(t * 3)), f = t * 3 - i;
      const bp = pts[i].map((v, j) => lerp(v, pts[i + 1][j], f));
      b.ico(0.07 + r() * 0.07, { x: bp[0] + (r() - 0.5) * 0.12, y: bp[1] + (r() - 0.5) * 0.1, z: bp[2] + (r() - 0.5) * 0.12, color: r() < 0.6 ? '#f0b7c0' : (r() < 0.6 ? '#e48f9e' : '#fbeef0'), mat: M.flat, detail: 0 });
    }
    if (depth <= 0) return;
    for (let k = 0; k < 2; k++) {
      const a = r() * Math.PI * 2, up = 0.35 + r() * 0.5;
      const d = [Math.cos(a) * (1 - up) + dir[0] * 0.4, up, Math.sin(a) * (1 - up) + dir[2] * 0.4];
      const l = Math.hypot(...d);
      branch(q, d.map((v) => v / l), len * 0.7, rad * 0.6, depth - 1);
    }
  };
  branch([x, y, z], [0.3, 0.9, 0.1], h * 0.6, h * 0.06, 2);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  terrain(b, { R: 10.5, rings: 40, segs: 130, fn: ground, palette: inkRock(2.4, { moss: '#7f937f' }) });

  /* the peaks — tall, layered ink silhouettes */
  const peaks = [
    [0.4, -3.0, 2.3, 12.5, 0.08], [-3.0, -4.2, 1.6, 10, 0.14], [3.6, -4.0, 1.5, 9.2, 0.12],
    [-5.6, -1.8, 1.1, 6.4, 0.18], [5.8, -1.2, 1.0, 5.6, 0.16], [-1.6, -6.6, 1.3, 8.4, 0.1], [2.2, -6.8, 1.1, 7.2, 0.12],
    [6.6, 2.6, 0.7, 3.4, 0.2],
  ];
  const tops = peaks.map(([x, z, r, h, lean]) => {
    const y = ground(x, z) - 0.4;
    return peak(b, { x, y, z, r, h, lean, rand: rng, taper: 0.72, palette: inkRock(h, { base: y }) });
  });
  for (const i of [0, 1, 2, 5]) { const [x, y, z] = tops[i]; pine(b, { x, y: y - 0.2, z, h: 1.1 + rng() * 0.4, r: rng, color: '#3b4a42', lean: 0.4 }); }

  /* the lair: a stone gate in the foot of the great peak, roofed by a leaning slab */
  const GX = 0.3, GZ = 0.2, GY = ground(GX, GZ) - 0.05;
  b.push({ x: GX, y: GY, z: GZ });
  b.box(2.6, 2.2, 0.6, { y: -0.3, z: -0.55, color: '#141414', mat: M.stone });            // the dark mouth
  for (const sx of [-1, 1]) {
    b.box(0.32, 2.0, 0.42, { x: sx * 0.95, color: '#6f6f6a', mat: M.flat });
    b.box(0.6, 0.12, 0.08, { x: sx * 0.42, y: 0.0, z: -0.25, color: '#55534f' });          // the two stone leaves, ajar
    b.box(0.62, 1.7, 0.08, { x: sx * 0.62, z: -0.3, ry: sx * 0.7, color: '#5f5e59', mat: M.flat });
  }
  b.box(2.5, 0.32, 0.5, { y: 2.0, color: '#7a7a74', mat: M.flat });                         // lintel
  for (let i = 0; i < 3; i++) b.box(2.0 - i * 0.2, 0.12, 0.35, { y: -0.08 + i * 0.0, z: 0.4 + i * 0.32, color: '#8b8a84', mat: M.stone });
  b.pop();
  for (const [dx, dz, r, h] of [[-1.9, -0.3, 1.1, 2.4], [2.0, -0.4, 1.2, 2.2], [-0.2, -2.2, 1.9, 1.8], [0, -0.3, 1.6, 0.8]]) {
    const yy = dz === -0.3 && r === 1.6 ? GY + 2.15 : GY - 0.2;
    rock(b, { x: GX + dx, y: yy, z: GZ + dz, r, h, rand: rng, palette: inkRock(3, { base: GY - 0.5 }) });
  }
  // Tang Seng bound to a post just inside the mouth
  b.cyl(0.04, 0.04, 1.3, { x: GX + 0.35, y: GY, z: GZ - 0.45, color: C.woodD, mat: M.wood, seg: 6 });
  figure(b, 'monk', { x: GX + 0.35, y: GY, z: GZ - 0.32, s: 1.15, pose: 'none' });
  for (const yy of [0.25, 0.42]) b.torus(0.12, 0.012, { x: GX + 0.35, y: GY + yy, z: GZ - 0.38, rx: Math.PI / 2, color: '#c9b38a', mat: M.cloth, ts: 12 });

  /* the grave mound for the real head, Bajie weeping, Sha beside him */
  const MX = 2.2, MZ = 3.2, MY = ground(MX, MZ);
  b.sphere(0.6, { x: MX, y: MY - 0.05, z: MZ, sy: 0.5, color: '#6a6157', mat: M.flat, ws: 10, hs: 6 });
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; b.ico(0.07, { x: MX + Math.cos(a) * 0.62, y: MY - 0.02, z: MZ + Math.sin(a) * 0.62, color: '#8b8a84', mat: M.flat, detail: 0 }); }
  // the willow root, smashed by Wukong's staff: two split halves and splinters, tossed aside
  {
    const RX = MX - 1.55, RZ = MZ - 0.35, RY = ground(RX, RZ) - 0.03;
    b.sphere(0.2, { x: RX, y: RY + 0.08, z: RZ, sy: 0.55, sx: 1.1, rz: 0.4, color: '#b8956a', mat: M.flat, ws: 8, hs: 4 });
    b.sphere(0.17, { x: RX + 0.42, y: RY + 0.07, z: RZ + 0.14, sy: 0.5, rz: -0.6, ry: 1.2, color: '#a8845c', mat: M.flat, ws: 8, hs: 4 });
    for (const [dx, dz, a] of [[-0.1, 0.1, 0.4], [0.05, -0.12, 2.2], [0.35, 0.0, 4.0], [0.22, 0.28, 5.2]]) {
      b.tube([[RX + dx, RY + 0.05, RZ + dz], [RX + dx + Math.cos(a) * 0.15, RY + 0.03, RZ + dz + Math.sin(a) * 0.15], [RX + dx + Math.cos(a + 0.4) * 0.4, RY + 0.01, RZ + dz + Math.sin(a + 0.4) * 0.4]], 0.02, { color: '#7a5a3a', mat: M.wood, radial: 4 });
    }
    for (let i = 0; i < 5; i++) b.box(0.025, 0.02, 0.12 + rng() * 0.08, { x: RX + 0.15 + (rng() - 0.5) * 0.5, y: RY + 0.01, z: RZ + (rng() - 0.5) * 0.4, ry: rng() * 3, color: '#c9a77a', mat: M.wood });
  }
  b.box(0.06, 0.5, 0.03, { x: MX + 0.45, y: MY - 0.05, z: MZ - 0.25, color: '#b8ad98', mat: M.wood });    // a marker stick
  b.push({ x: MX - 0.5, y: MY - 0.05, z: MZ + 0.75, ry: 2.6, rx: 0.35 });
  figure(b, 'bajie', { s: 1.25, pose: 'none' });
  b.pop();
  figure(b, 'sha', { x: MX + 0.75, y: ground(MX + 0.75, MZ + 0.7) - 0.05, z: MZ + 0.7, ry: -2.4, s: 1.25 });
  // Wukong on his ledge, scanning the fog
  figure(b, 'wukong', { x: -4.0, y: ground(-4, 2.6) - 0.05, z: 2.6, ry: 0.7, pose: 'gaze', s: 1.7 });

  /* old plum trees on the slopes */
  for (const [x, z, h] of [[-2.3, 1.4, 2.6], [3.6, 1.4, 2.3], [-6.2, 2.0, 2.2], [4.8, 4.8, 2.0], [-1.2, 5.6, 1.8], [6.2, -3.4, 2.2], [-4.8, -3.6, 2.3], [-7.4, -0.6, 1.8]]) plum(b, { x, y: ground(x, z) - 0.05, z, h, r: rng });
  for (let i = 0; i < 14; i++) {
    const [x, z] = rng.inDisc(9.4, 3);
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.4, h: 0.35 + rng() * 0.4, rand: rng, palette: inkRock(1.2, { base: ground(x, z) - 0.2 }) });
  }
  object.add(b.build());

  /* the leopard demon (艾叶花皮豹子精), crouched on the rock above his gate */
  const lb = new Builder();
  const LC = '#3a3632';
  lb.sphere(0.32, { y: 0.32, sx: 0.65, sy: 0.55, sz: 1.35, color: LC, mat: M.smooth });
  lb.sphere(0.17, { y: 0.48, z: 0.48, sx: 1.05, sy: 0.9, color: LC, mat: M.smooth });
  for (const sx of [-1, 1]) lb.cone(0.05, 0.08, { x: sx * 0.1, y: 0.6, z: 0.46, color: LC, mat: M.smooth, seg: 5 });
  for (const [lx, lz] of [[-0.12, 0.3], [0.12, 0.3], [-0.13, -0.28], [0.13, -0.28]]) lb.cyl(0.045, 0.055, 0.22, { x: lx, z: lz, color: LC, mat: M.smooth, seg: 6 });
  lb.tube([[0, 0.38, -0.42], [0.15, 0.25, -0.75], [0.35, 0.35, -0.95], [0.4, 0.6, -0.9]], (t) => 0.05 - t * 0.025, { color: LC, mat: M.smooth, segs: 16 });
  for (let i = 0; i < 16; i++) { const a = rng() * Math.PI * 2, zz = rng.range(-0.35, 0.35); lb.sphere(0.04, { x: Math.cos(a) * 0.2, y: 0.33 + Math.sin(a) * 0.17, z: zz, sy: 0.4, sz: 0.4, ry: a, color: '#8a7f6e', mat: M.smooth, ws: 6, hs: 4 }); }
  for (const sx of [-1, 1]) lb.sphere(0.022, { x: sx * 0.07, y: 0.52, z: 0.63, color: '#e8c060', mat: M.glow, glow: 1.6, ws: 6, hs: 4 });
  const leopard = lb.build();
  leopard.scale.set(1.6, 1.5, 1.9);
  leopard.position.set(GX + 0.1, GY + 2.75, GZ - 0.2);
  leopard.rotation.y = 0.25;
  object.add(leopard);

  /* the fog: three layered bands of soft puffs, breathing in and out */
  const BANDS = [[0.9, 150, 10, 1.8], [2.8, 130, 9.4, 1.8], [5.0, 110, 8.4, 1.7], [7.7, 70, 6.6, 1.5], [10.3, 30, 4.6, 1.4]];
  const BAND_A = [1, 0.8, 0.62, 0.5, 0.42];
  const N = BANDS.reduce((s, x) => s + x[1], 0);
  const fog = softPuffs(N, { color: '#f1efe9', opacity: 0.8, nearFade: [7, 15] });
  const fogLo = softPuffs(60, { color: '#d7d6d0', opacity: 0.45, nearFade: [7, 15] });
  object.add(fogLo.points, fog.points);
  const fd = [];
  BANDS.forEach(([y, n, R, s], k) => { for (let i = 0; i < n; i++) { const [x, z] = rng.inDisc(R); fd.push({ x, z, y: y + rng.range(-0.3, 0.3), s: s * (0.6 + rng() * 0.8), ph: rng() * 6.28, k, sp: 0.05 + rng() * 0.06 }); } });
  const ld = Array.from({ length: 60 }, () => { const [x, z] = rng.inDisc(10); return { x, z, s: 2 + rng() * 2, ph: rng() * 6.28 }; });

  const fogDay = new THREE.Color('#f1efe9'), fogNight = new THREE.Color('#717a8e');
  const loDay = new THREE.Color('#d7d6d0'), loNight = new THREE.Color('#5d6578');
  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    // the fog is unlit: dim it with the moonlight so it does not glow at night
    fog.mat.uniforms.uColor.value.copy(fogDay).lerp(fogNight, nk);
    fogLo.mat.uniforms.uColor.value.copy(loDay).lerp(loNight, nk);
    const u = (t % CYCLE) / CYCLE;
    // thick → thin → thick; the higher bands clear first and return last
    const thin = smooth(0.15, 0.4, u) * (1 - smooth(0.7, 0.95, u));
    for (let i = 0; i < N; i++) {
      const f = fd[i];
      const lag = f.k * 0.05;
      const k = smooth(0.15 - lag, 0.4 - lag, u) * (1 - smooth(0.7 + lag, 0.95 + lag * 0.5, u));
      const drift = Math.sin(t * f.sp + f.ph) * 1.2;
      const x = f.x + drift, z = f.z + Math.cos(t * f.sp * 0.7 + f.ph) * 0.6;
      // keep the fog off the ground right in front of the lair when it thins (the reveal)
      const hole = smooth(5.5, 2, Math.hypot(x - 0.6, z - 2.2)) * k;
      const a = (0.8 - 0.6 * k) * BAND_A[f.k] * (1 - hole * 0.6) * smooth(10.6, 8.5, Math.hypot(x, z));
      fog.set(i, x, f.y + Math.sin(t * 0.2 + f.ph) * 0.2, z, f.s * (1 + 0.25 * (1 - k)), a);
    }
    fog.commit();
    for (let i = 0; i < 60; i++) {
      const l = ld[i];
      fogLo.set(i, l.x + Math.sin(t * 0.04 + l.ph), 0.5, l.z, l.s, 0.4 + 0.5 * (1 - thin));
    }
    fogLo.commit();
    leopard.position.y = GY + 2.75 + Math.sin(t * 0.5) * 0.02;
    leopard.rotation.y = 0.25 + Math.sin(t * 0.21) * 0.25;
  }
  update(0);
  return { object, update };
}
