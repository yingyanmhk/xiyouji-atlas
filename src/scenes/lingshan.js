// 灵山·雷音寺 — the end of the road. On Vulture Peak the golden-roofed Thunderclap Monastery climbs
// its terraces to the great hall, one quiet halo behind it, auspicious clouds about the peak.
// Below runs the 凌云渡 with its single-log bridge; the Buddha of the Crossing poles the bottomless
// boat over with the four pilgrims and the horse aboard — and downstream, drifting away on the
// current, floats Tang Seng's own mortal body, cast off at last (脱却胎胞骨肉身).
import { THREE, Builder, M, C, terrain, peak, hall, roof, pagoda, pine, rock, cloud, figure, horse, qinglv, fbm, noise2, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { daoist, tinted } from './_a_figs.js';

const CYCLE = 32;
const WATER = 0.42;
const riverZ = (x) => 3.6 + 0.5 * Math.sin(x * 0.3 + 0.4);

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.32 + 8, z * 0.32 + 1, 4);
  const d = z - riverZ(x);
  let h;
  if (d > 0) h = lerp(0.1, 0.7 + 0.3 * n, smooth(1.2, 2.2, d));               // near bank
  else {
    h = lerp(0.1, 0.9 + 0.4 * n, smooth(1.2, 2.4, -d));
    h += smooth(1.5, -4.5, z) * (2.2 + 1.6 * n) * smooth(9.5, 3.5, Math.abs(x) + 1);   // foothills
  }
  return Math.max(0.08, h * smooth(10.7, 9.7, r) + 0.08);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pal = tinted(7, { cliff: [[0, C.zheshiL], [0.2, '#b08a5a'], [0.5, '#5f8078'], [0.8, C.shiqing], [1, '#2a4f66']], ledge: [[0, '#b9b47a'], [0.3, C.shilvL], [0.7, C.shilv], [1, '#3f7f68']] });
  const bed = new THREE.Color('#2f5560');
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < WATER - 0.02 ? bed : pal(x, y, z, nx, ny, nz)) });

  /* Vulture Peak: a broad terraced massif with three platforms on its face */
  const PZ = -4.6;
  peak(b, { x: 0, y: 1.2, z: PZ - 0.6, r: 3.6, h: 6.2, taper: 0.35, lean: 0.02, flatTop: 1, steps: 3, seg: 18, rand: rng, palette: qinglv(10, { base: 1 }) });
  // the vulture's head: a leaning crag beside the summit
  peak(b, { x: -2.6, y: 6.5, z: PZ - 1.2, r: 0.9, h: 4.2, lean: 0.25, leanDir: Math.PI * 0.9, taper: 0.8, rand: rng, palette: qinglv(11, { base: 1 }) });
  for (const [x, z, r, h] of [[-6.4, -4.0, 1.2, 7.0], [6.2, -4.4, 1.1, 6.4], [-4.8, -6.8, 1.0, 8.2], [4.6, -7.0, 1.0, 7.6], [-7.8, -0.8, 0.8, 4.0], [7.9, -1.2, 0.7, 3.6]]) {
    const y = ground(x, z) - 0.3;
    const tp = peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, palette: qinglv(h, { base: y }) });
    pine(b, { x: tp[0], y: tp[1] - 0.2, z: tp[2], h: 1.1 + rng() * 0.4, r: rng, lean: 0.3 });
  }
  // terraces of white stone with gilded-roof halls, stairs between them
  const T = [[1.9, 2.2, 5.2, 2.0], [0.2, 4.6, 4.2, 1.8], [-2.0, 7.45, 4.8, 2.6]];   // [z, y, w, d]
  T.forEach(([z, y, w, d], i) => {
    b.box(w + 1.2, y - (i ? T[i - 1][1] : 0.6) + 0.3, d + 0.8, { x: 0, y: (i ? T[i - 1][1] : 0.6) - 0.3, z: PZ + z + 2.6, color: '#e3d9c2', mat: M.stone });
    b.box(w + 1.26, 0.1, d + 0.86, { x: 0, y: y - 0.16, z: PZ + z + 2.6, color: '#a8452f', mat: M.lacquer });
    for (let k = 0; k < 10; k++) b.box(0.12, 0.3, 0.12, { x: -(w + 1.2) / 2 + 0.1 + k * ((w + 1.0) / 9), y, z: PZ + z + 2.6 + (d + 0.8) / 2 - 0.08, color: '#f4f0e6' });
  });
  const HW = [2.6, 3.0];
  for (let i = 0; i < T.length; i++) {
    const y0 = i ? T[i - 1][1] : 0.7, y1 = T[i][1], z0 = PZ + T[i][0] + 2.6 + (T[i][3] + 0.8) / 2;
    const n = 8, xs = i === 0 ? [0] : [-(HW[i - 1] / 2 + 0.55), HW[i - 1] / 2 + 0.55];
    for (const sx of xs) for (let k = 0; k < n; k++) b.box(i ? 0.6 : 1.0, (y1 - y0) / n + 0.02, 0.24, { x: sx, y: y0 + ((y1 - y0) * k) / n, z: z0 + (n - k) * 0.2 - 0.1, color: '#d6ccb4' });
  }
  // gate hall, middle hall, great hall; two small pagodas flank the middle terrace
  hall(b, { x: 0, y: T[0][1], z: PZ + T[0][0] + 2.5, w: 2.6, d: 1.2, h: 1.0, base: 0.15, steps: false, roofColor: C.tileGold, wall: '#f2ede0', pillar: '#b8452f', beam: '#2f6a55', r: rng });
  hall(b, { x: 0, y: T[1][1], z: PZ + T[1][0] + 2.5, w: 3.0, d: 1.3, h: 1.1, tiers: 1, base: 0.15, steps: false, roofColor: C.tileGold, wall: '#f2ede0', pillar: '#b8452f', beam: '#2f6a55', r: rng });
  for (const sx of [-1, 1]) pagoda(b, { x: sx * 2.3, y: T[1][1], z: PZ + T[1][0] + 2.5, levels: 5, w: 0.5, h: 0.4, roofColor: C.tileGold, r: rng });
  const MAIN = [0, T[2][1], PZ + T[2][0] + 2.4];
  hall(b, { x: MAIN[0], y: MAIN[1], z: MAIN[2], w: 3.8, d: 1.9, h: 1.4, tiers: 2, base: 0.2, steps: false, roofColor: C.tileGold, wall: '#f4efe2', pillar: '#b8452f', beam: '#2f6a55', lit: 0.5, r: rng });
  // white-blossom 娑罗 trees and pines on the terraces
  for (const [x, z, y] of [[-2.6, PZ + 3.4, T[0][1]], [2.6, PZ + 3.5, T[0][1]], [-2.8, PZ + 0.4, T[2][1]], [2.9, PZ + 0.5, T[2][1]]]) pine(b, { x, y, z, h: 1.3, r: rng, lean: 0.25 });

  /* the single-log bridge (独木桥) and the near-bank landing */
  const LX = -4.2;
  b.tube([[LX - 0.3, ground(LX - 0.3, riverZ(LX) + 2.0) + 0.05, riverZ(LX) + 2.0], [LX, WATER + 0.55, riverZ(LX)], [LX + 0.3, ground(LX + 0.3, riverZ(LX) - 2.2) + 0.05, riverZ(LX) - 2.2]], 0.08, { color: '#6a5038', mat: M.wood, radial: 6, segs: 12 });
  for (let i = 0; i < 10; i++) {
    const x = rng.range(-9, 9), z = riverZ(x) + rng.range(1.3, 2.0) * (rng() < 0.5 ? -1 : 1);
    if (Math.hypot(x, z) > 9.8) continue;
    rock(b, { x, y: WATER - 0.2, z, r: 0.3 + rng() * 0.4, h: 0.5 + rng() * 0.5, rand: rng, palette: qinglv(1.2, { base: 0 }) });
  }
  const statics = b.build();
  // private glow copy: the hall windows ease down a little at night, when the atlas bloom rises
  const winGlow = M.glow.clone();
  statics.traverse((o) => { if (o.isMesh && o.material === M.glow) o.material = winGlow; });
  object.add(statics);

  /* the halo behind the great hall: a thin gold ring and a faint disc */
  const hb = new Builder();
  hb.torus(1.55, 0.05, { x: MAIN[0], y: MAIN[1] + 2.9, z: MAIN[2] - 1.35, color: '#ffdf8a', mat: M.glow, glow: 1.6, ts: 64, rs: 6 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    hb.box(0.03, 0.42, 0.02, { x: MAIN[0] + Math.cos(a) * 1.85, y: MAIN[1] + 2.9 + Math.sin(a) * 1.85, z: MAIN[2] - 1.36, rz: a - Math.PI / 2, color: '#ffe7a8', mat: M.glow, glow: 1.1 });
  }
  object.add(hb.build());
  const haloDisc = softPuffs(1, { color: '#fff1c8', opacity: 0.4, additive: true });
  object.add(haloDisc.points);

  /* the river */
  const river = new THREE.Mesh(new THREE.CircleGeometry(10.45, 80), new THREE.MeshStandardMaterial({ color: '#4f8e9a', roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.82 }));
  river.rotation.x = -Math.PI / 2; river.position.y = WATER;
  object.add(river);

  /* the bottomless boat, its boatman and passengers */
  const boat = new THREE.Group();
  {
    const bb = new Builder();
    // hull as a frame of planks: gunwales, ribs, bow and stern — and no bottom
    for (const sx of [-1, 1]) bb.tube([[sx * 0.15, 0.25, -1.3], [sx * 0.55, 0.12, -0.6], [sx * 0.6, 0.1, 0.4], [sx * 0.2, 0.3, 1.4]], 0.05, { color: '#7a5434', mat: M.wood, radial: 5, segs: 16 });
    for (const sx of [-1, 1]) bb.tube([[sx * 0.12, 0.08, -1.25], [sx * 0.5, -0.05, -0.6], [sx * 0.55, -0.06, 0.4], [sx * 0.18, 0.12, 1.35]], 0.05, { color: '#6a4a2e', mat: M.wood, radial: 5, segs: 16 });
    for (const z of [-0.9, -0.3, 0.3, 0.9]) bb.box(1.1 - Math.abs(z) * 0.5, 0.05, 0.08, { y: 0.12, z, color: '#6a4a2e', mat: M.wood });
    bb.box(0.08, 0.3, 0.1, { y: 0.15, z: 1.4, color: '#7a5434', mat: M.wood });
    bb.box(0.08, 0.3, 0.1, { y: 0.1, z: -1.3, color: '#7a5434', mat: M.wood });
    // the Buddha of the crossing at the stern, poling
    daoist(bb, { y: 0.1, z: -1.0, s: 1.35, color: '#e0a548', sash: '#b8452f', hat: 'none', sleeves: false });
    bb.sphere(0.06, { y: 0.1 + 0.68 * 1.35, z: -1.0, color: '#3a3040', mat: M.smooth });
    bb.sphere(0.03, { y: 0.1 + 0.75 * 1.35, z: -1.0, color: '#3a3040', mat: M.smooth });
    bb.cyl(0.015, 0.015, 2.6, { x: 0.25, y: -0.6, z: -1.2, rx: 0.35, color: '#5a4030', mat: M.wood, seg: 4 });
    // the pilgrims, standing on the ribs
    figure(bb, 'monk', { y: 0.12, z: 0.25, s: 1.5, pose: 'none' });
    figure(bb, 'wukong', { x: 0.28, y: 0.12, z: 0.75, s: 1.3, pose: 'stand' });
    figure(bb, 'bajie', { x: -0.3, y: 0.12, z: -0.35, s: 1.2, pose: 'none' });
    figure(bb, 'sha', { x: 0.32, y: 0.12, z: -0.45, s: 1.2, pose: 'none' });
    boat.add(bb.build());
  }
  object.add(boat);
  // the horse waits on the far bank with the luggage
  { const hb2 = new Builder(); horse(hb2, { x: 1.6, y: ground(1.6, riverZ(1.6) - 2.0), z: riverZ(1.6) - 2.0, ry: 2.6, s: 1.1 }); hb2.box(0.3, 0.25, 0.4, { x: 1.6, y: ground(1.6, riverZ(1.6) - 2.0) + 0.85, z: riverZ(1.6) - 2.0, ry: 2.6, color: '#7a6a4a', mat: M.cloth }); object.add(hb2.build()); }

  /* the mortal body drifting downstream */
  const body = new THREE.Group();
  { const cb = new Builder(); figure(cb, 'monk', { pose: 'none', s: 1.4, rx: 0 }); const g = cb.build(); g.rotation.x = -Math.PI / 2; g.position.y = 0.08; body.add(g); }
  object.add(body);

  /* auspicious clouds, mist round the peak, whitecaps on the river */
  const clouds = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const cb = new Builder(); cloud(cb, { s: 0.75 + rng() * 0.35, rand: rng, color: i % 2 ? '#fbf7ee' : '#f6ecd6' });
    const g = cb.build({ shadows: false }); g.userData = { a: (i / 4) * Math.PI * 2 + 0.5, r: 5.6 + (i % 2) * 2, y: 7.5 + i * 1.3 }; clouds.add(g);
  }
  object.add(clouds);
  const NW = 36, NM = 26;
  const caps = softPuffs(NW, { color: '#ffffff', opacity: 0.75 });
  const mist = softPuffs(NM, { color: '#f6f2e6', opacity: 0.45 });
  object.add(caps.points, mist.points);
  const wd = Array.from({ length: NW }, () => ({ ph: rng(), off: rng.range(-0.8, 0.8), sp: 0.03 + rng() * 0.03 }));
  const md = Array.from({ length: NM }, () => ({ a: rng() * Math.PI * 2, r: 3 + rng() * 3.5, y: 3 + rng() * 3, s: 1.6 + rng() * 1.8, ph: rng() * 9 }));
  const B0 = [-0.6, riverZ(-0.6) + 1.15], B1 = [-0.2, riverZ(-0.2) - 1.1];

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(mist, nk);
    mist.mat.uniforms.uOpacity.value = 0.45 * (1 - 0.35 * nk);
    winGlow.color.setScalar(1 - 0.35 * nk);
    nightTint(caps, nk, 0.6);
    const u = (t % CYCLE) / CYCLE;
    // the boat crosses, pauses at the far bank, then (out of sight of the loop seam) is back at the near bank
    const c = ease(smooth(0.06, 0.7, u));
    const fade = smooth(0, 0.04, u) * (1 - smooth(0.93, 0.99, u));
    const bx = lerp(B0[0], B1[0], c), bz = lerp(B0[1], B1[1], c);
    boat.position.set(bx, WATER - 0.02 + Math.sin(t * 1.3) * 0.03, bz);
    boat.rotation.set(Math.sin(t * 1.1) * 0.03, Math.PI + 0.15, Math.sin(t * 0.9) * 0.03);
    boat.scale.setScalar(Math.max(0.001, fade));
    // the cast-off body appears beside the boat mid-stream and is carried away to the right
    const p = clamp((u - 0.28) / 0.6);
    const bodyVis = smooth(0.28, 0.33, u) * (1 - smooth(0.82, 0.9, u));
    const x0 = lerp(B0[0], B1[0], 0.35) + 0.8, x = x0 + p * 7.5;
    body.position.set(x, WATER - 0.04 + Math.sin(t * 1.5) * 0.015, riverZ(x) + 0.2);
    body.rotation.set(0, Math.PI / 2 + Math.sin(t * 0.4) * 0.2 + p * 0.6, 0);
    body.scale.setScalar(Math.max(0.001, bodyVis));
    // halo breathes very slightly
    haloDisc.set(0, MAIN[0], MAIN[1] + 2.9, MAIN[2] - 1.4, 4.4, (0.75 + 0.15 * Math.sin(t * 0.5)) * (1 - 0.3 * nk));
    haloDisc.commit();
    for (let i = 0; i < NW; i++) {
      const w = wd[i], k = (t * w.sp + w.ph) % 1, xx = -10 + k * 20;
      caps.set(i, xx, WATER + 0.03, riverZ(xx) + w.off, 0.18 + 0.12 * Math.sin(i + t), Math.hypot(xx, riverZ(xx)) < 10 ? smooth(0, 0.1, k) * (1 - smooth(0.9, 1, k)) : 0);
    }
    caps.commit();
    for (let i = 0; i < NM; i++) {
      const m = md[i], a = m.a + t * 0.012;
      mist.set(i, Math.cos(a) * m.r, m.y + Math.sin(t * 0.3 + m.ph) * 0.3, PZ + Math.sin(a) * m.r * 0.6, m.s, 0.5 + 0.5 * Math.sin(t * 0.2 + m.ph));
    }
    mist.commit();
    clouds.children.forEach((g) => { const d = g.userData, a = d.a + t * 0.015; g.position.set(Math.cos(a) * d.r, d.y, PZ + 1 + Math.sin(a) * d.r * 0.7); g.rotation.y = -a + Math.PI / 2; });
  }
  update(0);
  return { object, update };
}
