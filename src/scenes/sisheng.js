// 四圣试禅心 — at dusk, alone in the wilderness, an opulent manor with green-glazed roofs and every
// hall lit; at its gate a widow and her three daughters, who offer the pilgrims the house, the land
// and themselves in marriage. Only Bajie is tempted. Loop of 36 s: dusk, the lamps burn; then
// morning comes and the manor melts into mist — the four women rise as 黎山老母, 观音, 普贤 and
// 文殊 — and a pine wood stands where it stood, Bajie trussed up hanging from a pine, the others
// waking on the grass beneath. Then dusk falls again and the house returns.
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, roof, pavilion, figure, horse, qinglv, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { nightDim } from './_c_util.js';
import { mortal, bodhisattva } from './_b_kit.js';

const CYCLE = 36;
const MC = [0, -0.6];         // manor centre

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 8, z * 0.3 + 3, 4);
  const flat = smooth(5.4, 3.6, Math.hypot((x - MC[0]) * 0.8, z - MC[1]));
  let h = 0.3 + (0.35 + 1.4 * n) * smooth(4.5, 8.5, r) * (1 - flat);
  h += smooth(1, -6, z) * smooth(6, 8.5, Math.hypot(x * 0.8, z)) * 2.0 * n;
  return lerp(h, Math.min(h, 0.5), smooth(9.6, 10.4, r));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const tmp = new THREE.Color(), out = new THREE.Color();
  const hillPal = qinglv(4.5);
  terrain(b, { R: 10.5, rings: 42, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (y < 0.75) { const n = noise2(x * 0.7, z * 0.7); return out.set('#8fa676').lerp(tmp.set('#a9ae82'), n * 0.7); }
    return hillPal(x, y, z, nx, ny, nz);
  } });
  // the wild hills round about
  for (const [x, z, r, h] of [[-6.2, -5.4, 1.3, 6.2], [-3.0, -7.8, 1.5, 7.8], [1.4, -8.4, 1.2, 5.8], [4.8, -6.6, 1.3, 6.6], [7.4, -2.8, 0.9, 3.6], [-8.0, -1.6, 0.9, 3.2]]) {
    const y = ground(x, z) - 0.4;
    const tp = peak(b, { x, y, z, r, h, lean: 0.13, rand: rng, palette: qinglv(h, { base: y }) });
    pine(b, { x: tp[0], y: tp[1] - 0.25, z: tp[2], h: 0.9 + rng() * 0.5, r: rng, lean: 0.4 });
  }
  for (let i = 0, k = 0; i < 14 && k < 400; k++) {
    const [x, z] = rng.inDisc(9.6, 6.2);
    if (z > 4 && Math.abs(x) < 3) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.2 + rng() * 1.2, r: rng, lean: 0.25 }); i++;
  }
  for (let i = 0; i < 10; i++) {
    const [x, z] = rng.inDisc(9.8, 6.5);
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.4, h: 0.3 + rng() * 0.6, rand: rng, palette: qinglv(1.5, { base: ground(x, z) - 0.4 }) });
  }
  // the path through the wild to where the gate stands
  for (let i = 0; i < 14; i++) {
    const z = 3.4 + i * 0.5, x = Math.sin(z * 0.5) * 0.6;
    b.box(0.55, 0.04, 0.38, { x, y: ground(x, z) - 0.01, z, ry: rng() * 0.3, color: '#c9bfa2' });
  }
  object.add(b.build());

  /* ------------------------------------------------- the manor (illusion) --- */
  const manor = new THREE.Group();
  {
    const mb = new Builder();
    const y0 = 0.3, X = MC[0], Z = MC[1];
    const rich = { roofColor: C.tileGreen, pillar: C.cinnabar, beam: C.shiqing, wall: '#efe4ce' };
    mb.box(7.4, 0.12, 6.6, { x: X, y: y0 - 0.1, z: Z, color: '#d8ccb0' });
    // high white walls with green coping
    const wallSeg = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      mb.box(0.22, 0.8, L, { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, ry, color: '#f2ead8' });
      roof(mb, { x: (x0 + x1) / 2, y: y0 + 0.8, z: (z0 + z1) / 2, ry, w: 0.22, d: L, h: 0.16, over: 0.1, lift: 0.02, flare: 0.01, color: C.tileGreen });
    };
    wallSeg(X - 3.6, Z + 3.2, X - 0.9, Z + 3.2); wallSeg(X + 0.9, Z + 3.2, X + 3.6, Z + 3.2);
    wallSeg(X - 3.6, Z + 3.2, X - 3.6, Z - 3.2); wallSeg(X + 3.6, Z + 3.2, X + 3.6, Z - 3.2); wallSeg(X - 3.6, Z - 3.2, X + 3.6, Z - 3.2);
    // gate tower with lanterns
    hall(mb, { x: X, y: y0, z: Z + 3.2, w: 1.9, d: 0.9, h: 1.0, ...rich, lit: 1, r: rng, steps: true });
    for (const sx of [-1, 1]) {
      mb.sphere(0.13, { x: X + sx * 0.75, y: y0 + 1.15, z: Z + 3.85, sy: 1.25, color: '#ff8a4a', mat: M.glow, glow: 1.8 });
      mb.cyl(0.004, 0.004, 0.2, { x: X + sx * 0.75, y: y0 + 1.27, z: Z + 3.85, color: C.ink, seg: 3 });
    }
    // halls: main hall (two tiers), side halls, back pavilion-tower
    hall(mb, { x: X, y: y0, z: Z + 0.2, w: 3.6, d: 2.0, h: 1.4, tiers: 2, ...rich, lit: 0.9, r: rng });
    hall(mb, { x: X - 2.5, y: y0, z: Z + 0.9, ry: Math.PI / 2, w: 2.2, d: 1.1, h: 0.95, ...rich, lit: 0.8, r: rng, steps: false });
    hall(mb, { x: X + 2.5, y: y0, z: Z + 0.9, ry: -Math.PI / 2, w: 2.2, d: 1.1, h: 0.95, ...rich, lit: 0.8, r: rng, steps: false });
    hall(mb, { x: X - 1.4, y: y0, z: Z - 2.3, w: 2.2, d: 1.1, h: 1.0, ...rich, lit: 0.9, r: rng, steps: false });
    hall(mb, { x: X + 1.7, y: y0, z: Z - 2.3, w: 2.0, d: 1.1, h: 1.6, tiers: 2, ...rich, lit: 0.9, r: rng, steps: false });
    pavilion(mb, { x: X + 2.6, y: y0, z: Z + 2.3, w: 0.8, h: 0.9, roofColor: C.tileGreen });
    // courtyard: flower beds, a rockery
    for (const sx of [-1, 1]) {
      mb.box(0.9, 0.18, 0.6, { x: X + sx * 1.3, y: y0, z: Z + 2.1, color: '#b8ac90' });
      for (let i = 0; i < 4; i++) mb.ico(0.14, { x: X + sx * 1.3 + (i - 1.5) * 0.2, y: y0 + 0.28, z: Z + 2.1, color: i % 2 ? '#e48f99' : '#f2b9bd', mat: M.flat });
    }
    // the widow and her three daughters at the gate
    const GZ = Z + 4.25;
    mortal(mb, 'girl', { x: X - 0.95, y: ground(X - 0.95, GZ), z: GZ, ry: 0.15, s: 1.1, robe: '#6a4a6a' });
    figure(mb, 'woman', { x: X - 0.35, y: ground(X - 0.35, GZ + 0.15), z: GZ + 0.15, ry: 0.05, s: 1.05, robe: '#d9707a' });
    figure(mb, 'woman', { x: X + 0.35, y: ground(X + 0.35, GZ + 0.15), z: GZ + 0.15, ry: -0.05, s: 1.05, robe: '#e0a85a' });
    figure(mb, 'woman', { x: X + 0.95, y: ground(X + 0.95, GZ), z: GZ, ry: -0.15, s: 1.05, robe: '#7aa2b8' });
    // the pilgrims arriving (inside the illusion's hour)
    figure(mb, 'monk', { x: X - 0.2, y: ground(X - 0.2, GZ + 1.4), z: GZ + 1.4, ry: Math.PI, s: 1.25 });
    figure(mb, 'bajie', { x: X + 0.75, y: ground(X + 0.75, GZ + 1.3), z: GZ + 1.3, ry: Math.PI - 0.3, s: 1.7 });
    figure(mb, 'wukong', { x: X - 1.0, y: ground(X - 1.0, GZ + 1.6), z: GZ + 1.6, ry: Math.PI + 0.3, s: 1.25 });
    figure(mb, 'sha', { x: X - 1.7, y: ground(X - 1.7, GZ + 1.9), z: GZ + 1.9, ry: Math.PI + 0.2, s: 1.2 });
    manor.add(mb.build());
  }
  object.add(manor);

  /* ------------------------------------------------------- the pine wood --- */
  const wood = new THREE.Group();
  const HANG = [2.3, 2.7];
  {
    const wb = new Builder();
    const spots = [];
    for (let i = 0, k = 0; i < 13 && k < 500; k++) {
      const x = MC[0] + rng.range(-3.6, 3.6), z = MC[1] + rng.range(-3.0, 2.6);
      if (spots.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.3) || Math.hypot(x - HANG[0], z - HANG[1]) < 2.0 || (Math.abs(x) < 3 && z > 1.0)) continue;
      spots.push([x, z]);
      pine(wb, { x, y: ground(x, z) - 0.05, z, h: 2.0 + rng() * 1.6, r: rng, lean: 0.2 }); i++;
    }
    // the great pine from which Bajie hangs: a level bough
    const hx = HANG[0], hz = HANG[1], hy = ground(hx, hz);
    wb.tube([[hx - 1.0, hy, hz - 0.2], [hx - 0.95, hy + 1.6, hz - 0.1], [hx - 1.05, hy + 3.4, hz], [hx - 0.9, hy + 4.4, hz + 0.1]], (t) => 0.16 * (1 - t * 0.6), { color: C.bark, mat: M.wood, radial: 7, segs: 16 });
    wb.tube([[hx - 1.0, hy + 2.7, hz], [hx - 0.3, hy + 2.85, hz + 0.05], [hx + 0.6, hy + 2.8, hz]], (t) => 0.07 * (1 - t * 0.5), { color: C.bark, mat: M.wood, radial: 5, segs: 8 });
    for (const [dx, dy, r] of [[0.5, 3.0, 0.6], [-1.0, 4.6, 0.8], [-1.6, 3.6, 0.6], [-0.3, 3.9, 0.55]]) wb.ico(r, { x: hx + dx, y: hy + dy, z: hz, sy: 0.32, color: dx > 0 ? C.pine : C.pineD, mat: M.flat });
    // the others, waking on the grass under the trees
    figure(wb, 'monk', { x: -0.7, y: ground(-0.7, 2.6), z: 2.6, ry: 0.9, s: 1.25 });
    figure(wb, 'wukong', { x: 0.5, y: ground(0.5, 3.0), z: 3.0, ry: 1.3, pose: 'gaze', s: 1.3 });
    figure(wb, 'sha', { x: -1.6, y: ground(-1.6, 2.2), z: 2.2, ry: 0.7, s: 1.2 });
    horse(wb, { x: -2.7, y: ground(-2.7, 3.0), z: 3.0, ry: 1.2, s: 1.15 });
    // the luggage on the ground
    wb.box(0.3, 0.2, 0.24, { x: -1.2, y: ground(-1.2, 3.2), z: 3.2, color: '#7a6a4a', mat: M.cloth });
    wood.add(wb.build());
  }
  object.add(wood);
  // Bajie, trussed and hanging (rope from the bough)
  const hanging = new THREE.Group();
  {
    const hb = new Builder();
    hb.cyl(0.008, 0.008, 1.05, { y: 0.62, color: '#c8b07a', mat: M.cloth, seg: 3 });
    hb.push({ rz: 0.15 });
    figure(hb, 'bajie', { pose: 'none', s: 1.7, y: -0.6 });
    for (let i = 0; i < 4; i++) hb.torus(0.29 - Math.abs(i - 1.5) * 0.04, 0.018, { y: -0.6 + 0.2 + i * 0.13, rx: Math.PI / 2 + (i % 2 ? 0.15 : -0.15), color: '#c8b07a', mat: M.cloth, ts: 16 });
    hb.pop();
    hanging.add(hb.build());
  }
  object.add(hanging);
  const HY = ground(HANG[0], HANG[1]) + 2.75;

  /* ------------------------------------------- the four true forms rising --- */
  const saints = new THREE.Group();
  {
    const sb = new Builder();
    const forms = [['#efe4d0', '#8a5a6a'], [C.white, '#e7d7b0'], ['#e8dcc8', '#7aa0c0'], ['#f0e2c4', '#c9a24a']];
    forms.forEach(([robe, inner], i) => {
      const x = (i - 1.5) * 1.9;
      bodhisattva(sb, { x, y: 0, z: 0, s: 1.8, robe, inner, vase: i === 1, hood: i === 1 });
      sb.push({ x, y: -0.06, s: 0.5 });
      for (let k = 0; k < 5; k++) sb.sphere(0.6, { x: (k - 2) * 0.6, sy: 0.4, sx: 1.2, color: C.white, mat: M.cloud, ws: 10, hs: 6 });
      sb.pop();
    });
    saints.add(sb.build());
  }
  object.add(saints);

  /* ----------------------------------------- dusk sun / morning sun, mist --- */
  const sunMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 12), sunMat);
  object.add(sun);
  const MIST = 70;
  const mist = softPuffs(MIST, { color: '#fbf7ee', opacity: 0.85 });
  const glow = softPuffs(12, { color: '#ffae6a', opacity: 0.35, additive: true });
  object.add(mist.points, glow.points);
  const mp = Array.from({ length: MIST }, () => { const x = rng.range(-3.8, 3.8), z = MC[1] + rng.range(-3.2, 3.6); return { x, z, y: rng.range(0.3, 2.6), s: 1.2 + rng() * 1.6, ph: rng() }; });
  const lampPts = [[MC[0], 1.6, MC[1] + 3.8], [MC[0], 2.2, MC[1] + 0.8], [MC[0] - 2.5, 1.2, MC[1] + 1.2], [MC[0] + 2.5, 1.2, MC[1] + 1.2], [MC[0] + 1.7, 2.0, MC[1] - 1.8], [MC[0] - 1.4, 1.3, MC[1] - 1.8]];
  const duskC = new THREE.Color('#ff8a4a').multiplyScalar(1.6), dawnC = new THREE.Color('#fff2c8').multiplyScalar(1.4);

  const dimPuffs = nightDim([mist], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    const M0 = smooth(0.42, 0.56, u) * (1 - smooth(0.92, 1.0, u));   // 0 manor … 1 wood
    const manorK = 1 - M0;
    manor.visible = manorK > 0.01;
    manor.scale.set(1 + M0 * 0.08, Math.max(0.001, manorK), 1 + M0 * 0.08);
    const woodK = smooth(0.5, 0.64, u) * (1 - smooth(0.9, 0.97, u));
    wood.visible = woodK > 0.01;
    wood.scale.set(1, Math.max(0.001, woodK), 1);
    hanging.visible = woodK > 0.5;
    const sw = Math.sin(t * 1.1) * 0.12;
    hanging.position.set(HANG[0] + 0.15, HY - 0.0 + (1 - woodK) * 2, HANG[1]);
    hanging.rotation.set(0, 0.6, sw);
    // the saints rise as the house melts
    const sk = smooth(0.46, 0.54, u) * (1 - smooth(0.66, 0.76, u));
    saints.visible = sk > 0.01;
    saints.position.set(MC[0], 2.5 + smooth(0.46, 0.76, u) * 9, MC[1] + 1.0);
    saints.scale.setScalar(Math.max(0.001, sk));
    // sun: low orange in the west at dusk, pale in the east at morning
    const dawn = smooth(0.48, 0.62, u) * (1 - smooth(0.9, 0.98, u));
    sun.position.set(lerp(-8.5, 8.5, dawn), lerp(7.5, 9.5, dawn) + Math.sin(u * 6.28) * 0.2, -9.6);
    sunMat.color.copy(duskC).lerp(dawnC, dawn);
    // mist swallows the house at the turn, and hangs low in the morning wood
    const mk = smooth(0.4, 0.5, u) * (1 - smooth(0.58, 0.75, u)) + 0.1 * woodK + smooth(0.9, 0.97, u) * (1 - smooth(0.97, 1, u)) * 0.9;
    for (let i = 0; i < MIST; i++) {
      const m = mp[i], dx = Math.sin(t * 0.15 + m.ph * 6) * 0.6;
      mist.set(i, m.x + dx, m.y + Math.sin(t * 0.3 + i) * 0.15, m.z, m.s, mk * (0.5 + 0.5 * Math.sin(m.ph * 9 + t * 0.2)));
    }
    mist.commit();
    for (let i = 0; i < 12; i++) {
      const p = lampPts[i % lampPts.length];
      glow.set(i, p[0], p[1], p[2], i < 6 ? 2.6 : 0.01, manorK * (1 - dawn) * (0.85 + 0.15 * Math.sin(t * 3 + i)));
    }
    glow.commit();
  }
  update(0);
  return { object, update };
}
