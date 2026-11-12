// 玉华州 — the prince's forge yard. The three disciples have lent their weapons — the golden-banded
// staff, the nine-tooth rake and Sha Wujing's 降妖宝杖 — so the smiths can copy them for the three
// young princes. Laid on their rack the weapons glow with a rosy light through the night; the anvils
// ring and sparks fly. In a 32 s loop a dark wind comes down from 豹头山 behind the city, where the
// yellow lion spirit squats at his Tiger-Mouth Cave: the three weapons lift and are carried away
// into the dark (and later fetched back, as they were at the 钉钯宴).
import { THREE, Builder, M, C, terrain, peak, pine, roof, house, figure, staff, qinglv, fbm, smooth, clamp, lerp, ease, softPuffs } from '../kit.js';
import { person, tileWall, paving, lantern } from './_e_kit.js';

const CYCLE = 32;
const Y = 0.2;
const SHED = [0.2, -0.6];
const LION = [-4.6, 0, -5.6];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const hill = 2.2 * Math.exp(-((x - LION[0]) ** 2 + (z - LION[2]) ** 2) / 9);
  return Y + hill + 0.3 * fbm(x * 0.3, z * 0.3 + 4, 3) * smooth(6, 10, r) - 0.1 * smooth(9.6, 10.5, r);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pave = paving('#9a8466', '#7e6a52', 0.75);
  const green = qinglv(4);
  terrain(b, { R: 10.5, rings: 36, segs: 120, fn: ground, palette: (x, y, z, nx, ny, nz) => (y > Y + 0.35 ? green(x, y, z, nx, ny, nz) : pave(x, y, z)) });

  /* 豹头山 behind the city wall, with the lion squatting before his cave */
  const top = peak(b, { x: LION[0], y: ground(LION[0], LION[2]) - 0.5, z: LION[2], r: 1.9, h: 6.4, lean: 0.06, rand: rng, taper: 0.55, flatTop: 1, palette: qinglv(8, { base: 1 }) });
  peak(b, { x: -1.4, y: ground(-1.4, -8.0) - 0.3, z: -8.0, r: 1.2, h: 5.2, lean: 0.12, rand: rng });
  peak(b, { x: -7.4, y: ground(-7.4, -3.6) - 0.3, z: -3.6, r: 0.9, h: 3.6, lean: 0.15, rand: rng });
  for (const [x, z] of [[-2.6, -6.2], [-6.6, -5.8], [-3.0, -8.4]]) pine(b, { x, y: ground(x, z) - 0.1, z, h: 1.5 + rng() * 0.5, r: rng });
  // the city wall between the yard and the mountain
  tileWall(b, -8.4, -3.4, 6.6, -3.4, { y: Y, h: 1.0, t: 0.3, color: '#c6b089', cap: '#5b4a3e' });
  tileWall(b, 6.6, -3.4, 8.2, 3.0, { y: Y, h: 1.0, t: 0.3, color: '#c6b089', cap: '#5b4a3e' });
  tileWall(b, -8.4, -3.4, -8.6, 2.0, { y: Y, h: 1.0, t: 0.3, color: '#c6b089', cap: '#5b4a3e' });
  house(b, { x: 5.8, y: Y, z: 4.6, ry: -1.2, w: 2.0, d: 1.3, h: 0.95, wall: '#d8c8a6', roofColor: '#5b4a3e', lit: 1, r: rng });
  house(b, { x: -6.4, y: Y, z: 4.2, ry: 1.0, w: 1.8, d: 1.2, h: 0.9, wall: '#d8c8a6', roofColor: '#5b4a3e', lit: 1, r: rng });

  /* the forge shed: open in front, a high roof on red-brown posts */
  const [sx0, sz0] = SHED, SW = 6.4, SD = 3.4, SH = 2.7;
  b.box(SW + 0.4, 0.14, SD + 0.4, { x: sx0, y: Y, z: sz0, color: '#8a7358', mat: M.stone });
  for (let i = 0; i <= 4; i++) for (const zz of [-1, 1]) b.cyl(0.08, 0.09, SH, { x: sx0 - SW / 2 + (SW * i) / 4, y: Y + 0.14, z: sz0 + zz * SD / 2, color: '#6e3a26', mat: M.lacquer, seg: 8 });
  b.box(SW + 0.2, 0.18, 0.14, { x: sx0, y: Y + SH, z: sz0 + SD / 2, color: '#4c5f5a', mat: M.smooth });
  b.box(SW, SH * 0.82, 0.1, { x: sx0, y: Y + 0.14, z: sz0 - SD / 2 + 0.02, color: '#b49a74', mat: M.wood });      // back wall planks
  roof(b, { x: sx0, y: Y + SH + 0.12, z: sz0, w: SW, d: SD, h: 1.1, color: '#4f5e57' });
  // the weapon rack (兵器架) standing in the open yard, where the glow can rise to the sky
  const RK = [0.3, Y, 3.2];
  b.box(2.6, 0.12, 0.5, { x: RK[0], y: RK[1], z: RK[2], color: '#5a3a26', mat: M.wood });
  for (const dx of [-1.2, 1.2]) b.box(0.1, 2.3, 0.1, { x: RK[0] + dx, y: RK[1], z: RK[2] - 0.12, color: C.woodD, mat: M.wood });
  b.box(2.7, 0.08, 0.12, { x: RK[0], y: RK[1] + 2.25, z: RK[2] - 0.12, color: '#6e3a26', mat: M.lacquer });
  b.box(2.5, 0.06, 0.1, { x: RK[0], y: RK[1] + 1.5, z: RK[2] - 0.12, color: '#5a3a26', mat: M.wood });
  roof(b, { x: RK[0], y: RK[1] + 2.33, z: RK[2] - 0.12, w: 2.6, d: 0.2, h: 0.18, over: 0.18, lift: 0.08, color: '#5b4a3e' });
  // the furnace, its chimney and bellows (right end of the shed)
  const FX = sx0 + 2.3, FZ = sz0 - 0.4;
  b.box(1.3, 1.0, 1.1, { x: FX, y: Y + 0.14, z: FZ, color: '#8a5a44', mat: M.stone });
  b.box(1.4, 0.1, 1.2, { x: FX, y: Y + 1.14, z: FZ, color: '#6a4434', mat: M.stone });
  b.cyl(0.22, 0.28, 2.4, { x: FX + 0.25, y: Y + 1.2, z: FZ - 0.25, color: '#7a4e3a', mat: M.stone, seg: 8 });
  b.box(0.5, 0.36, 0.04, { x: FX, y: Y + 0.4, z: FZ + 0.56, color: C.fire, mat: M.glow, glow: 2.4 });
  b.box(0.5, 0.3, 0.6, { x: FX - 0.95, y: Y + 0.14, z: FZ + 0.1, color: C.woodD, mat: M.wood });
  // anvils with hot copies glowing on them, quench trough, charcoal
  const ANV = [[-2.6, 1.8], [-1.2, 0.6], [2.8, 1.6]];
  for (const [ax, az] of ANV) {
    b.cyl(0.18, 0.22, 0.38, { x: ax, y: Y, z: az, color: '#4a3a2e', mat: M.wood, seg: 8 });
    b.box(0.5, 0.14, 0.22, { x: ax, y: Y + 0.38, z: az, color: '#3a3d42', mat: M.metal });
    b.box(0.5, 0.025, 0.04, { x: ax + 0.05, y: Y + 0.52, z: az, ry: 0.2, color: '#ff8a3a', mat: M.glow, glow: 2 });
  }
  b.box(1.2, 0.3, 0.45, { x: -3.4, y: Y, z: 1.0, color: '#5a4434', mat: M.wood });
  b.box(1.1, 0.02, 0.36, { x: -3.4, y: Y + 0.27, z: 1.0, color: '#3d6a7c', mat: M.water });
  for (let i = 0; i < 10; i++) b.ico(0.12 + rng() * 0.1, { x: 3.4 + rng() * 0.8, y: Y + 0.05, z: 0.9 + rng() * 0.6, color: '#2a2624', mat: M.flat });
  // iron stock, a cart of charcoal, a well and a locust tree in the yard
  for (let i = 0; i < 6; i++) b.box(1.0, 0.06, 0.08, { x: -4.8 + rng() * 0.2, y: Y + 0.06 * i, z: 2.6 + i * 0.03, ry: 0.3 + rng() * 0.1, color: '#4a4c50', mat: M.metal });
  b.push({ x: 4.6, y: Y, z: 2.4, ry: -0.6 });
  b.box(1.0, 0.3, 0.6, { y: 0.3, color: C.wood, mat: M.wood });
  for (const sz of [-1, 1]) b.cyl(0.28, 0.28, 0.05, { y: 0.28, z: sz * 0.33, rx: Math.PI / 2, color: C.woodD, mat: M.wood, seg: 12 });
  for (let i = 0; i < 6; i++) b.ico(0.12, { x: (rng() - 0.5) * 0.7, y: 0.65, z: (rng() - 0.5) * 0.4, color: '#262220', mat: M.flat });
  b.pop();
  b.lathe([[0.32, 0], [0.34, 0.36], [0.28, 0.38], [0.27, 0.02]], { x: -5.4, y: Y, z: 0.4, color: '#8d867a', mat: M.stone, seg: 14 });
  pine(b, { x: 6.4, y: Y, z: -1.6, h: 2.6, r: rng, lean: 0.3 });
  for (const x of [-2.6, 0.2, 2.9]) lantern(b, { x, y: Y + SH - 0.05, z: sz0 + SD / 2 - 0.1, s: 1.3, glow: 1.5 });

  /* the disciples watching their weapons copied, the young princes */
  figure(b, 'wukong', { x: -1.4, y: Y, z: 5.5, ry: Math.PI + 0.2, pose: 'none', s: 1.7 });
  for (const sx of [-1, 1]) b.cyl(0.022 * 1.7, 0.026 * 1.7, 0.2 * 1.7, { x: -1.4 + sx * 0.09 * 1.7 * Math.cos(0.2), y: Y + 0.43 * 1.7, z: 5.5, rz: Math.PI - sx * 0.6, color: C.fur, mat: M.smooth, seg: 6 });
  figure(b, 'bajie', { x: 0.9, y: Y, z: 5.8, ry: Math.PI - 0.2, pose: 'none', s: 1.25 });
  figure(b, 'sha', { x: 2.0, y: Y, z: 5.3, ry: Math.PI - 0.5, pose: 'none', s: 1.25 });
  person(b, { x: -3.0, y: Y, z: 6.0, ry: 2.6, s: 1.0, robe: '#c9a040', robe2: '#e2c06a', head: 'crown', pose: 'stand' });
  person(b, { x: -3.6, y: Y, z: 5.4, ry: 2.3, s: 0.9, robe: '#4a7a6a', robe2: '#6a9a8a', head: 'crown', pose: 'stand' });
  person(b, { x: 3.2, y: Y, z: 6.2, ry: -2.6, s: 0.85, robe: '#9a4a5a', robe2: '#c07080', head: 'crown', pose: 'stand' });
  object.add(b.build());

  /* the smiths: bodies static, hammer arms swinging */
  const smiths = [];
  const sb = new Builder();
  ANV.forEach(([ax, az], i) => {
    sb.push({ x: ax - 0.05, y: Y, z: az - 0.5 });
    person(sb, { s: 1.15, robe: '#5a4636', robe2: '#c49a74', head: 'hood', hatColor: '#3a2e26', pose: 'none' });
    sb.box(0.2, 0.26, 0.02, { y: 0.24, z: 0.12, color: '#6a4a30', mat: M.cloth });       // leather apron
    sb.pop();
    const arm = new THREE.Group();
    arm.position.set(ax - 0.05 + 0.1 * 1.15, Y + 0.5 * 1.15, az - 0.5);
    const ab = new Builder();
    ab.cyl(0.026, 0.03, 0.24, { color: '#c49a74', mat: M.smooth, seg: 5 });
    ab.cyl(0.012, 0.012, 0.3, { y: 0.22, rx: Math.PI / 2, z: -0.05, color: C.woodD, mat: M.smooth, seg: 4 });
    ab.box(0.08, 0.08, 0.14, { y: 0.24, z: 0.12, color: '#3a3d42', mat: M.smooth });
    arm.add(ab.build());
    object.add(arm);
    smiths.push({ arm, ph: i * 0.37, x: ax, z: az });
  });
  object.add(sb.build());

  /* the three weapons on their rack, glowing (霞光万道) */
  const mk = (fn) => { const wb = new Builder(); fn(wb); const g = wb.build({ shadows: false }); object.add(g); return g; };
  const wStaff = mk((wb) => { staff(wb, { y: -0.95, len: 1.9, r: 0.035 }); wb.cyl(0.07, 0.07, 1.9, { y: -0.95, color: '#ffb46a', mat: M.glow, glow: 0.45, seg: 8 }); });
  const wRake = mk((wb) => {
    wb.cyl(0.025, 0.025, 1.7, { y: -0.85, color: C.wood, mat: M.wood, seg: 6 });
    wb.box(0.42, 0.08, 0.06, { y: 0.88, color: '#b8c0c6', mat: M.metal });
    for (let i = 0; i < 9; i++) wb.cone(0.016, 0.2, { x: -0.19 + i * 0.0475, y: 0.92, color: '#d0d6da', mat: M.metal, seg: 4 });
    wb.box(0.5, 0.36, 0.1, { y: 0.8, color: '#ff9a7a', mat: M.glow, glow: 0.35 });
  });
  const wStick = mk((wb) => {
    wb.cyl(0.03, 0.03, 1.8, { y: -0.9, color: '#e8dcc0', mat: M.smooth, seg: 8 });
    for (let i = 0; i < 12; i++) { const a = i * 1.1; wb.sphere(0.03, { x: Math.cos(a) * 0.035, y: -0.8 + i * 0.14, z: Math.sin(a) * 0.035, color: C.gold, mat: M.metal, ws: 6, hs: 4 }); }
    wb.cyl(0.07, 0.07, 1.8, { y: -0.9, color: '#ffd28a', mat: M.glow, glow: 0.4, seg: 8 });
  });
  const weapons = [
    { g: wStaff, home: [RK[0] - 0.75, RK[1] + 1.08, RK[2]], rot: [-0.08, 0, 0.04] },
    { g: wRake, home: [RK[0], RK[1] + 0.98, RK[2]], rot: [-0.08, 0, 0] },
    { g: wStick, home: [RK[0] + 0.75, RK[1] + 1.03, RK[2]], rot: [-0.08, 0, -0.04] },
  ];
  for (const w of weapons) w.g.scale.setScalar(1.3);
  const RAY = 50, ray = softPuffs(RAY, { color: '#ff8f6a', opacity: 0.55 });   // 霞光 rising to the sky
  object.add(ray.points);
  const rd = Array.from({ length: RAY }, () => ({ p: rng(), x: rng.range(-0.9, 0.9), z: rng.range(-0.15, 0.15), s: 0.05 + rng() * 0.1 }));
  const HALO = 6, halo = softPuffs(HALO, { color: '#ff9a6a', opacity: 0.45, additive: true });
  const SPARK = 60, sparks = softPuffs(SPARK, { color: '#ffb050', opacity: 1, additive: true });
  const FIRE = 8, fire = softPuffs(FIRE, { color: '#ff7a2a', opacity: 0.5, additive: true });
  const SMOKE = 18, smoke = softPuffs(SMOKE, { color: '#6a625c', opacity: 0.35 });
  const GUST = 110, gust = softPuffs(GUST, { color: '#2f2a2a', opacity: 0.38 });
  object.add(halo.points, sparks.points, fire.points, smoke.points, gust.points);
  const sd = Array.from({ length: SPARK }, () => ({ a: rng() * 6.28, v: 0.6 + rng() * 0.9, up: 0.6 + rng() * 0.8, k: Math.floor(rng() * 3) }));
  const gd = Array.from({ length: GUST }, () => ({ p: rng(), r: rng() * 1.2, a: rng() * 6.28, s: 1 + rng() * 1.6 }));

  /* the yellow lion: a dark shape squatting on the mountain, eyes alight */
  const lb = new Builder();
  const LC = '#3a2c20', MANE = '#5a4226';
  lb.sphere(0.5, { y: 0.45, z: -0.3, sx: 0.75, sy: 0.7, sz: 1.25, color: LC, mat: M.smooth });             // crouching body
  lb.sphere(0.36, { y: 0.62, z: 0.3, sx: 0.95, sy: 1.0, color: LC, mat: M.smooth });                      // chest
  for (let i = 0; i < 14; i++) {                                                                       // mane ring
    const a = (i / 14) * Math.PI * 2;
    lb.sphere(0.17, { x: Math.cos(a) * 0.34, y: 1.0 + Math.sin(a) * 0.34, z: 0.42, sz: 0.7, color: i % 2 ? MANE : '#4a3420', mat: M.smooth, ws: 8, hs: 6 });
  }
  lb.sphere(0.26, { y: 1.0, z: 0.55, sz: 0.85, color: LC, mat: M.smooth });                               // face
  lb.sphere(0.12, { y: 0.9, z: 0.76, sx: 1.2, sy: 0.8, color: '#2c2118', mat: M.smooth });                // muzzle
  for (const sx of [-1, 1]) {
    lb.cyl(0.09, 0.11, 0.55, { x: sx * 0.2, z: 0.45, color: LC, mat: M.smooth, seg: 6 });                  // forelegs
    lb.sphere(0.12, { x: sx * 0.2, y: 0.06, z: 0.55, sz: 1.4, sy: 0.6, color: LC, mat: M.smooth, ws: 8, hs: 5 });
    lb.sphere(0.2, { x: sx * 0.32, y: 0.3, z: -0.55, sz: 1.4, sy: 0.9, color: LC, mat: M.smooth, ws: 8, hs: 6 });   // haunches
    lb.sphere(0.045, { x: sx * 0.1, y: 1.08, z: 0.76, color: '#ffd04a', mat: M.glow, glow: 2.2, ws: 6, hs: 4 });
  }
  lb.tube([[0, 0.35, -0.85], [0.4, 0.15, -1.05], [0.7, 0.3, -0.9], [0.8, 0.55, -0.7]], (t) => 0.05 + 0.04 * smooth(0.8, 1, t), { color: LC, mat: M.smooth, segs: 16 });
  const lion = lb.build();
  lion.scale.setScalar(1.25);
  lion.position.set(top[0], top[1] - 0.05, top[2] + 0.2);
  lion.rotation.y = 0.35;
  object.add(lion);
  const LH = [top[0], top[1] + 1.2, top[2] + 0.6];

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const work = 1 - smooth(0.52, 0.56, u) * (1 - smooth(0.9, 0.95, u));
    // hammers
    for (let i = 0; i < smiths.length; i++) {
      const s = smiths[i];
      const c = ((t * 0.9 + s.ph) % 1);
      const hit = c < 0.7 ? ease(c / 0.7) : 1 - ease((c - 0.7) / 0.3);
      s.arm.rotation.x = lerp(0.3, -2.4, hit * work);
    }
    for (let i = 0; i < SPARK; i++) {
      const d = sd[i], s = smiths[d.k];
      const c = ((t * 0.9 + s.ph) % 1), p = c > 0.7 ? (c - 0.7) / 0.3 : 1;
      const x = s.x + Math.cos(d.a) * d.v * p * 0.6, z = s.z + Math.sin(d.a) * d.v * p * 0.6, y = Y + 0.55 + d.up * p * 0.8 - p * p * 0.9;
      sparks.set(i, x, y, z, 0.05 + 0.04 * (1 - p), (p < 1 ? 1 - p : 0) * work);
    }
    sparks.commit();
    for (let i = 0; i < FIRE; i++) fire.set(i, FX + (i % 3 - 1) * 0.15, Y + 0.5 + (i % 2) * 0.1, FZ + 0.7, 0.6 + 0.2 * Math.sin(t * 7 + i * 2), 0.8);
    fire.commit();
    for (let i = 0; i < SMOKE; i++) { const p = (t * 0.07 + i / SMOKE) % 1; smoke.set(i, FX + 0.25 + p * 1.2, Y + 3.6 + p * 4, FZ - 0.25 - p * 0.6, 0.5 + p * 1.6, Math.sin(Math.PI * p)); }
    smoke.commit();
    // the dark wind and the theft
    const gk = smooth(0.5, 0.56, u) * (1 - smooth(0.7, 0.76, u));
    for (let i = 0; i < GUST; i++) {
      const g = gd[i], p = (g.p + t * 0.12) % 1;
      const x = lerp(LH[0], SHED[0], 1 - p), y = lerp(LH[1], Y + 1.4, 1 - p) + Math.sin(p * Math.PI) * 1.5, z = lerp(LH[2], SHED[1] - 1, 1 - p);
      gust.set(i, x + Math.cos(g.a + t) * g.r * (1 + p), y + Math.sin(g.a + t * 1.3) * g.r * 0.6, z + Math.sin(g.a + t) * g.r, g.s * (0.8 + p), gk * Math.sin(Math.PI * p));
    }
    gust.commit();
    const away = ease(clamp((u - 0.56) / 0.12)), back = ease(clamp((u - 0.86) / 0.1));
    const k = away * (1 - back);
    weapons.forEach((w, i) => {
      const [hx, hy, hz] = w.home;
      const q = clamp(k * 1.15 - i * 0.07);
      const lift = Math.sin(Math.PI * q);
      w.g.position.set(lerp(hx, LH[0] + (i - 1) * 0.5, q) + Math.sin(t * 2 + i) * 0.1 * lift, lerp(hy, LH[1] + 0.8, q) + lift * 2.2, lerp(hz, LH[2], q));
      w.g.rotation.set(w.rot[0] + lift * 1.5, t * 0.5 * lift, w.rot[2] + lift * 2 * (i - 1));
      const sc = 1.3 * (1 - smooth(0.85, 1, q) * 0.9);
      w.g.scale.setScalar(sc);
      w.g.visible = q < 0.995;
      halo.set(i, w.g.position.x, w.g.position.y, w.g.position.z + 0.1, 1.2 * sc, (0.8 + 0.2 * Math.sin(t * 2 + i * 2)) * (q < 0.995 ? 1 : 0));
      halo.set(i + 3, w.g.position.x, w.g.position.y + 0.6, w.g.position.z + 0.1, 0.7 * sc, 0.5 * (q < 0.995 ? 1 : 0));
    });
    halo.commit();
    const rk = 1 - smooth(0.0, 0.25, k);
    for (let i = 0; i < RAY; i++) {
      const r = rd[i], p = (r.p + t * 0.05) % 1;
      ray.set(i, RK[0] + r.x * (1 - p * 0.5) + Math.sin(t * 0.5 + i) * 0.1 * p, RK[1] + 2.2 + p * 6.5, RK[2] + r.z, r.s * (1 + p), rk * Math.sin(Math.PI * p));
    }
    ray.commit();
    lion.rotation.y = 0.35 + Math.sin(t * 0.3) * 0.15;
  }
  update(0);
  return { object, update };
}
