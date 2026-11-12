// 盘丝洞 (ch.72–73) — a stone house of warm ochre stone roofed by a vast tent of spider silk: ropes
// run from a point high above it down to the rocks and trees around, laced with sagging rings,
// and glints of light slide along them. Beside it steams the hot spring 濯垢泉 where the seven
// spider women bathe; their seven gowns hang on a lacquered clothes-rack (彩漆的衣架) in a little
// pavilion by the pool, and a hawk — Wukong — circles over them
// (he will carry every gown away). In the pool Bajie, turned catfish, weaves between the bathers.
// Loop 24 s.
import { THREE, Builder, M, C, terrain, peak, rock, pine, pavilion, figure, fbm, smooth, lerp, clamp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { stonePal } from './_d_util.js';

const CYCLE = 24;
const HOUSE = [-2.2, -1.4];
const APEX = [-1.4, 9.4, -1.2];
const POOL = [3.6, 2.6], POOL_R = 2.3;

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.25 + 0.45 * fbm(x * 0.35 + 6, z * 0.35, 3);
  h += smooth(-1, -8, z) * smooth(10.4, 6, r) * (0.8 + 1.4 * fbm(x * 0.3, z * 0.3 + 2, 3));
  h -= smooth(POOL_R + 0.3, POOL_R - 0.5, Math.hypot(x - POOL[0], (z - POOL[1]) * 1.2)) * 0.6;
  return Math.max(0.08, h * smooth(10.6, 9.6, r) + 0.08);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const cliff = [[0, '#9a6a48'], [0.35, '#b88a5c'], [0.7, '#c9a27a'], [1, '#a88a6e']];
  const ledge = [[0, '#a8ac74'], [0.4, '#8aa068'], [1, '#5f8a5c']];
  const pal = stonePal(4, { cliff, ledge, ledgeAt: 0.62 });
  const bed = new THREE.Color('#6a5a48');
  terrain(b, { R: 10.5, rings: 44, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (Math.hypot(x - POOL[0], (z - POOL[1]) * 1.2) < POOL_R ? bed : pal(x, y, z, nx, ny, nz)) });

  /* the stone house */
  const hy = ground(...HOUSE) - 0.05;
  b.push({ x: HOUSE[0], y: hy, z: HOUSE[1], ry: 0.25 });
  for (let row = 0; row < 6; row++) for (let i = 0; i < 7; i++) {
    const off = row % 2 ? 0.2 : 0;
    const w = 0.46 + (i * 7 + row) % 3 * 0.04;
    for (const [sx, sz, ry] of [[0, 1, 0], [0, -1, 0]]) b.box(w, 0.32, 0.4, { x: -1.5 + off + i * 0.47, y: row * 0.33, z: sz * 1.0, ry, color: ['#c49a6c', '#b38a5e', '#d0a878'][(i + row) % 3], mat: M.flat });
    for (const sx of [-1, 1]) if (i < 5) b.box(0.4, 0.32, w, { x: sx * 1.6, y: row * 0.33, z: -0.95 + off + i * 0.42, color: ['#b88e60', '#c8a070', '#a8825a'][(i + row) % 3], mat: M.flat });
  }
  b.box(0.7, 1.3, 0.05, { y: 0, z: 1.21, color: '#2a1e18', mat: M.stone });
  b.box(0.42, 0.3, 0.05, { x: 0.95, y: 1.0, z: 1.21, color: '#d89a5a', mat: M.glow, glow: 0.8 });
  b.box(3.6, 0.22, 2.6, { y: 1.98, color: '#9a7a58', mat: M.flat });
  b.box(3.0, 0.22, 2.0, { y: 2.2, color: '#a8865e', mat: M.flat });
  b.box(2.2, 0.3, 1.4, { y: 2.42, color: '#b8946a', mat: M.flat });
  b.pop();

  /* anchors for the silk: rocks and trees round the house */
  const anchors = [];
  const NA = 15;
  for (let i = 0; i < NA; i++) {
    const a = (i / NA) * Math.PI * 2 + 0.2, d = 6.3 + 1.2 * Math.sin(i * 2.7) + (i % 2) * 0.4;
    let x = APEX[0] + Math.cos(a) * d, z = APEX[2] + Math.sin(a) * d * 0.9;
    if (Math.hypot(x - POOL[0], z - POOL[1]) < POOL_R + 0.6) { x += 1.5; z -= 1.2; }
    const r = Math.hypot(x, z);
    if (r > 9.6) { x *= 9.6 / r; z *= 9.6 / r; }
    const y = ground(x, z);
    if (i % 4 === 1 && z < 1) {                 // tall crags hold the canopy high
      const h = 3.2 + rng() * 1.6;
      const tp = peak(b, { x, y: y - 0.3, z, r: 0.6, h, lean: 0.12, rand: rng, taper: 0.8, palette: stonePal(h, { base: y, cliff, ledge, ledgeAt: 0.62 }) });
      anchors.push([tp[0], tp[1] - 0.4, tp[2]]);
    } else {
      const h = 0.9 + rng() * 1.2;
      rock(b, { x, y: y - 0.2, z, r: 0.45 + rng() * 0.3, h, rand: rng, palette: stonePal(h + 0.5, { base: y - 0.3, cliff, ledge, ledgeAt: 0.62 }) });
      anchors.push([x, y + h * 0.8, z]);
    }
  }
  for (const [x, z, h] of [[-7.6, 2.6, 2.4], [6.6, -3.8, 2.6], [-5.2, -6.4, 2.8], [1.6, -7.0, 2.4], [-7.0, -3.0, 2.0]]) pine(b, { x, y: ground(x, z) - 0.05, z, h, r: rng, lean: 0.25 });

  /* pool rim stones */
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2, x = POOL[0] + Math.cos(a) * (POOL_R + 0.15), z = POOL[1] + Math.sin(a) * (POOL_R + 0.15) / 1.2;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.28 + rng() * 0.18, h: 0.25 + rng() * 0.2, rand: rng, palette: stonePal(0.6, { base: ground(x, z) - 0.2, cliff, ledge }) });
  }
  /* the pavilion by the pool, and in it the lacquered clothes-rack with the seven gowns */
  const PV = [POOL[0] + 3.1, POOL[1] - 1.5], PW = 1.9;
  let py = -1;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) py = Math.max(py, ground(PV[0] + dx * PW * 0.6, PV[1] + dz * PW * 0.6));
  b.box(PW + 0.5, py, PW + 0.5, { x: PV[0], y: 0, z: PV[1], color: '#b8946a', mat: M.flat });          // stone plinth to level ground
  pavilion(b, { x: PV[0], y: py, z: PV[1], w: PW, h: 2.05, roofColor: '#2f6a55', pillar: C.cinnabar });
  b.push({ x: PV[0], y: py + 0.2, z: PV[1] - 0.1 });
  {
    const RW = 1.55, RH = 1.28, lac = '#a8302a';
    for (const sx of [-1, 1]) {
      b.box(0.08, 0.06, 0.42, { x: sx * RW / 2, color: '#3a1a14', mat: M.lacquer });                        // feet
      b.cyl(0.03, 0.035, RH, { x: sx * RW / 2, color: lac, mat: M.lacquer, seg: 8 });
      b.box(0.04, 0.12, 0.04, { x: sx * (RW / 2 + 0.04), y: RH - 0.06, rz: sx * 0.6, color: C.gold, mat: M.smooth });
    }
    b.box(RW + 0.22, 0.05, 0.05, { y: RH, color: lac, mat: M.lacquer });                                    // top rail with gilded ends
    for (const sx of [-1, 1]) b.box(0.08, 0.06, 0.07, { x: sx * (RW / 2 + 0.13), y: RH + 0.02, rz: -sx * 0.35, color: C.gold, mat: M.smooth });
    b.box(RW, 0.035, 0.035, { y: 0.32, color: lac, mat: M.lacquer });                                       // lower stretcher
    b.box(RW * 0.6, 0.12, 0.02, { y: RH - 0.18, color: '#d6a94a', mat: M.smooth });                        // painted panel
  }
  const gowns = ['#d84a5a', '#e8a040', '#e8d860', '#5aa86a', '#4a8ac8', '#6a5ab0', '#c86ab0'];
  for (let k = 0; k < 7; k++) {
    b.push({ x: -0.63 + k * 0.21, y: 1.3, z: (k % 2 ? 0.03 : -0.03), ry: (k - 3) * 0.06, s: 1.05 });
    b.box(0.36, 0.05, 0.06, { y: -0.04, color: gowns[k], mat: M.cloth });
    b.lathe([[0.16, -0.7], [0.12, -0.35], [0.08, -0.04], [0.001, -0.02]], { color: gowns[k], mat: M.cloth, seg: 8, sz: 0.35 });
    b.cyl(0.02, 0.02, 0.36, { x: 0, y: -0.06, rz: Math.PI / 2, color: gowns[(k + 3) % 7], mat: M.cloth, seg: 5 });   // sleeves over the rail
    b.pop();
  }
  b.pop();
  object.add(b.build());

  /* the silk canopy: radials from the apex, sagging rings, a few loose strands */
  const silk = new Builder();
  const sc = '#f4f2ee';
  const AP = new THREE.Vector3(...APEX);
  const radial = (a, t) => { const p = new THREE.Vector3(...a); return AP.clone().lerp(p, t).add(new THREE.Vector3(0, -Math.sin(Math.PI * t) * 1.5 * (1 - 0.4 * t), 0)); };
  for (const a of anchors) {
    const pts = [];
    for (let k = 0; k <= 8; k++) { const v = radial(a, k / 8); pts.push([v.x, v.y, v.z]); }
    silk.tube(pts, 0.05, { color: sc, mat: M.smooth, radial: 5, segs: 18 });
  }
  for (const t of [0.18, 0.32, 0.47, 0.62, 0.77, 0.9]) for (let i = 0; i < NA; i++) {
    const p = radial(anchors[i], t), q = radial(anchors[(i + 1) % NA], t);
    const m = p.clone().lerp(q, 0.5); m.y -= 0.25 * t + 0.05;
    silk.tube([[p.x, p.y, p.z], [m.x, m.y, m.z], [q.x, q.y, q.z]], 0.018, { color: sc, mat: M.smooth, radial: 3, segs: 5 });
  }
  for (let i = 0; i < 9; i++) {             // loose hanging strands
    const p = radial(anchors[(i * 5) % NA], 0.3 + (i % 4) * 0.15);
    silk.tube([[p.x, p.y, p.z], [p.x + 0.05, p.y - 0.8, p.z], [p.x, p.y - 1.4 - (i % 3) * 0.4, p.z + 0.05]], 0.01, { color: sc, mat: M.smooth, radial: 3, segs: 4 });
  }
  silk.sphere(0.18, { x: APEX[0], y: APEX[1], z: APEX[2], color: sc, mat: M.smooth });
  const silkG = silk.build({ shadows: true });
  silkG.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.3, emissive: '#9aa0a8', emissiveIntensity: 0.35 }); } });
  object.add(silkG);

  /* water + bathers + catfish */
  const WY = ground(...POOL) + 0.42;
  const water = new THREE.Mesh(new THREE.CircleGeometry(POOL_R + 0.1, 40), new THREE.MeshStandardMaterial({ color: '#7fb8b4', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.78 }));
  water.rotation.x = -Math.PI / 2; water.scale.set(1, 1 / 1.2, 1); water.position.set(POOL[0], WY, POOL[1]);
  object.add(water);
  {
    const wb = new Builder();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4, r = 1.2 + (i % 2) * 0.5;
      figure(wb, 'woman', { x: POOL[0] + Math.cos(a) * r, y: WY - 0.5, z: POOL[1] + Math.sin(a) * r / 1.2, ry: Math.atan2(-Math.cos(a), -Math.sin(a)) + 0.3, robe: '#e6c3a2', s: 1.05 });
    }
    object.add(wb.build());
  }
  const fish = new THREE.Group();
  {
    const fb = new Builder(), sk = '#4a4a52';
    fb.sphere(0.25, { sx: 0.8, sy: 0.55, sz: 2.2, color: sk, mat: M.smooth });
    fb.sphere(0.2, { z: 0.45, sx: 1.2, sy: 0.6, color: '#55555c', mat: M.smooth });
    fb.sphere(0.25, { z: -0.6, sx: 0.12, sy: 0.6, sz: 0.8, color: '#3a3a42', mat: M.smooth });
    for (const sx of [-1, 1]) fb.tube([[sx * 0.15, -0.02, 0.62], [sx * 0.4, -0.04, 0.8], [sx * 0.55, -0.1, 0.65]], 0.012, { color: '#2a2a2e', mat: M.smooth, radial: 3 });
    fish.add(fb.build());
  }
  object.add(fish);

  /* the hawk */
  const hawk = new THREE.Group();
  const wings = [];
  {
    const hb = new Builder(), brown = '#5a4632';
    hb.sphere(0.2, { sx: 0.8, sy: 0.7, sz: 1.8, color: brown, mat: M.smooth });
    hb.sphere(0.12, { z: 0.36, y: 0.04, color: '#6a5440', mat: M.smooth });
    hb.cone(0.04, 0.12, { z: 0.5, y: 0.02, rx: Math.PI / 2 + 0.5, color: '#d9b04a', mat: M.smooth, seg: 5 });
    hb.box(0.3, 0.02, 0.35, { z: -0.45, color: brown, mat: M.cloth });
    hawk.add(hb.build());
    for (const sx of [-1, 1]) {
      const wb = new Builder();
      wb.sphere(0.5, { x: sx * 0.5, sx: 1.0, sy: 0.05, sz: 0.36, color: brown, mat: M.cloth });
      wb.sphere(0.3, { x: sx * 0.95, z: -0.08, sx: 0.8, sy: 0.04, sz: 0.3, ry: sx * 0.3, color: '#3e3022', mat: M.cloth });
      const g = wb.build(); hawk.add(g); wings.push([g, sx]);
    }
  }
  hawk.scale.setScalar(1.3);
  object.add(hawk);

  /* steam from the spring, glints sliding down the silk */
  const ST = 44;
  const steam = softPuffs(ST, { color: '#ffffff', opacity: 0.32 });
  const GL = anchors.length;
  const glints = softPuffs(GL, { color: '#ffffff', opacity: 0.9, additive: true });
  object.add(steam.points, glints.points);
  const sd = Array.from({ length: ST }, () => { const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * POOL_R; return { x: POOL[0] + Math.cos(a) * r, z: POOL[1] + Math.sin(a) * r / 1.2, ph: rng(), s: 0.8 + rng() * 1.2 }; });

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(steam, nk);
    const u = (t % CYCLE) / CYCLE;
    // catfish weaving between the bathers (a figure-eight)
    const a = u * Math.PI * 2 * 2;
    const fx = POOL[0] + Math.sin(a) * 1.5, fz = POOL[1] + Math.sin(a * 2) * 0.55;
    const dx = Math.cos(a) * 1.5, dz = Math.cos(a * 2) * 1.1;
    fish.position.set(fx, WY - 0.12, fz);
    fish.rotation.y = Math.atan2(dx, dz);
    fish.rotation.z = Math.sin(t * 6) * 0.1;
    // hawk circles above the gowns
    const ha = t * 0.35;
    const cx = POOL[0] + 0.6, cz = POOL[1] - 0.8;
    hawk.position.set(cx + Math.cos(ha) * 2.6, 6.4 + Math.sin(t * 0.7) * 0.4, cz + Math.sin(ha) * 2.0);
    hawk.rotation.set(0, -ha + Math.PI, 0.35);
    for (const [g, sx] of wings) g.rotation.z = sx * (0.12 + 0.18 * Math.sin(t * 2.5) ** 2);
    for (let i = 0; i < ST; i++) {
      const s = sd[i], p = (t * 0.1 + s.ph) % 1;
      steam.set(i, s.x + Math.sin(p * 5 + i) * 0.3, WY + 0.1 + p * 3.2, s.z, s.s * (0.6 + p), Math.sin(Math.PI * p) * 0.75);
    }
    steam.commit();
    for (let i = 0; i < GL; i++) {
      const p = (t * 0.06 + i * 0.37) % 1;
      const v = radial(anchors[i], p);
      glints.set(i, v.x, v.y + 0.03, v.z, 0.18, Math.sin(Math.PI * p) * 0.9);
    }
    glints.commit();
    void clamp;
  }
  update(0);
  return { object, update };
}
