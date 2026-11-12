// 五庄观 — the Daoist house of 镇元大仙 on 万寿山, cream walls and jade-green roofs, cranes in the
// court. In its garden stands the colossal 人参果树, which flowers once in three thousand years,
// fruits once in three thousand and ripens in three thousand more — thirty fruit, each like a
// new-born child. Loop of 40 s: Wukong sits in the canopy knocking fruit down with the golden
// striker (and the fruit, touching earth, sinks into it); then, scolded, he pushes the tree over
// by the roots; it lies across the court; Guanyin comes on her cloud and pours the sweet water of
// her vase, and the tree rises green again.
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, roof, pavilion, figure, cloud, qinglv, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { mortal, bodhisattvaOnCloud } from './_b_kit.js';

const CYCLE = 40;
const TREE = [-1.6, -1.4];
const FALL_DIR = new THREE.Vector3(-1, 0.2, 0.22).normalize();   // it falls to the left, across the garden wall

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 2, z * 0.3 + 8, 4);
  let h = 0.3 + 0.15 * n;
  h += smooth(0, -7, z) * smooth(5.5, 9, r) * (1.5 + 3.2 * n);      // 万寿山 behind
  h += smooth(6.5, 9, r) * smooth(-1, 4, z) * 0.6 * n;
  return lerp(h, Math.min(h, 0.5), smooth(9.6, 10.4, r));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const tmp = new THREE.Color(), out = new THREE.Color();
  const hillPal = qinglv(5);
  terrain(b, { R: 10.5, rings: 44, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (y < 0.55) { const n = noise2(x * 0.8, z * 0.8); return out.set('#9fbf98').lerp(tmp.set('#b8c9a0'), n * 0.6); }
    return hillPal(x, y, z, nx, ny, nz);
  } });
  for (const [x, z, r, h] of [[-5.6, -6.6, 1.3, 6.4], [-2.4, -8.4, 1.5, 7.6], [2.0, -8.2, 1.2, 6.0], [5.4, -6.4, 1.2, 5.0], [7.6, -3.4, 0.9, 3.4], [-7.8, -3.6, 0.9, 3.6]]) {
    const y = ground(x, z) - 0.4;
    const tp = peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, palette: qinglv(h, { base: y }) });
    pine(b, { x: tp[0], y: tp[1] - 0.25, z: tp[2], h: 0.9 + rng() * 0.5, r: rng, lean: 0.4 });
  }
  for (let i = 0, k = 0; i < 12 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.6, 7);
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.1 + rng() * 0.9, r: rng, lean: 0.25 }); i++;
  }

  /* ----------------------------------------------------- the 观 --- */
  const y0 = 0.3;
  const jade = { roofColor: '#3f7a66', wall: '#f1e8d4', pillar: '#7a3a2a', beam: '#5f9a88' };
  b.box(12.4, 0.1, 10.2, { x: 0.6, y: y0 - 0.08, z: 0.6, color: '#e2d9c2' });
  const wallSeg = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
    b.box(0.22, 0.7, L, { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, ry, color: '#efe6d0' });
    roof(b, { x: (x0 + x1) / 2, y: y0 + 0.7, z: (z0 + z1) / 2, ry, w: 0.22, d: L, h: 0.15, over: 0.1, lift: 0.02, flare: 0.01, color: '#3f7a66' });
  };
  wallSeg(-5.6, 5.6, 0.9, 5.6); wallSeg(3.3, 5.6, 6.8, 5.6);
  wallSeg(-5.6, 5.6, -5.6, -4.4); wallSeg(6.8, 5.6, 6.8, -4.4); wallSeg(-5.6, -4.4, 6.8, -4.4);
  // the inner wall dividing the 人参园 (left) from the halls (right)
  wallSeg(1.4, -4.4, 1.4, 1.2);
  // gate with 牌楼
  hall(b, { x: 2.1, y: y0, z: 5.6, w: 2.0, d: 0.9, h: 0.95, ...jade, lit: 0, r: rng });
  // the main hall 正殿 (two tiers) and side halls
  hall(b, { x: 4.2, y: y0, z: -2.6, w: 3.6, d: 2.1, h: 1.5, tiers: 2, ...jade, lit: 0.2, r: rng });
  hall(b, { x: 5.5, y: y0, z: 1.6, ry: -Math.PI / 2, w: 2.4, d: 1.2, h: 1.0, ...jade, lit: 0, r: rng, steps: false });
  pavilion(b, { x: 2.8, y: y0, z: 2.4, w: 1.0, h: 1.1, roofColor: '#3f7a66', pillar: '#7a3a2a' });
  // bronze censer (鼎) and two cranes in the court
  b.lathe([[0, 0], [0.32, 0], [0.36, 0.3], [0.3, 0.5], [0.34, 0.56], [0, 0.56]], { x: 4.0, y: y0, z: 0.6, color: '#6a5a3a', mat: M.metal, seg: 14 });
  for (const sx of [-1, 1]) b.cyl(0.02, 0.02, 0.18, { x: 4.0 + sx * 0.3, y: y0 + 0.56, z: 0.6, color: '#6a5a3a', mat: M.metal, seg: 4 });
  const crane = (x, z, ry, s) => {
    b.push({ x, y: y0, z, ry, s });
    b.cyl(0.008, 0.008, 0.36, { x: 0.03, color: C.ink, seg: 3 }); b.cyl(0.008, 0.008, 0.36, { x: -0.03, color: C.ink, seg: 3 });
    b.sphere(0.12, { y: 0.44, sz: 1.6, color: C.white, mat: M.smooth });
    b.sphere(0.07, { y: 0.44, z: -0.2, sz: 1.4, sy: 0.6, color: C.ink, mat: M.smooth });
    b.tube([[0, 0.48, 0.12], [0, 0.66, 0.2], [0, 0.82, 0.16]], 0.018, { color: C.white, mat: M.smooth, radial: 4 });
    b.sphere(0.03, { y: 0.84, z: 0.17, color: C.cinnabar, mat: M.smooth, ws: 5, hs: 4 });
    b.cone(0.012, 0.1, { y: 0.83, z: 0.2, rx: Math.PI / 2, color: '#6a6a5a', seg: 4 });
    b.pop();
  };
  crane(3.2, 1.0, 0.6, 1.3); crane(4.8, -0.2, -2.4, 1.3);
  // 清风 and 明月, the two acolytes, by the garden gate
  mortal(b, 'daoist', { x: 1.0, y: y0, z: 1.8, ry: -2.2, s: 1.05 });
  mortal(b, 'daoist', { x: 1.6, y: y0, z: 2.1, ry: -2.6, s: 1.05, robe: '#7a8a6a' });
  // Tang Seng, Bajie and Sha in the court
  figure(b, 'monk', { x: 3.2, y: y0, z: -0.6, ry: -0.4, s: 1.25 });
  figure(b, 'bajie', { x: 2.0, y: y0, z: -0.2, ry: -1.3, s: 1.25 });
  figure(b, 'sha', { x: 2.6, y: y0, z: 0.2, ry: -1.0, s: 1.2 });
  // garden rocks and flowers
  for (let i = 0; i < 7; i++) {
    const x = rng.range(-5, 0.8), z = rng.range(-3.8, 5);
    if (Math.hypot(x - TREE[0], z - TREE[1]) < 2.0 || Math.abs(z - TREE[1]) < 1.6) continue;
    rock(b, { x, y: y0 - 0.05, z, r: 0.25 + rng() * 0.3, h: 0.5 + rng() * 0.6, rand: rng, palette: qinglv(1.2, { base: y0 - 0.2 }) });
  }
  object.add(b.build());

  /* ------------------------------------------------ the 人参果树 --- */
  const tree = new THREE.Group();          // pivot at the base
  tree.position.set(TREE[0], y0, TREE[1]);
  const FRUIT = 30;
  const fruitSpots = [];
  const canopy = new THREE.Group();
  let frontPad = null;
  {
    const tb = new Builder();
    // gnarled trunk splitting into four great limbs
    tb.tube([[0, -0.1, 0], [0.15, 1.2, 0.05], [-0.1, 2.6, 0.0], [0.05, 3.8, -0.05]], (t) => 0.75 * (1 - t * 0.45), { color: '#6a5038', mat: M.wood, radial: 10, segs: 18 });
    const limbs = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4, L = 2.6 + rng() * 0.8;
      const e = [Math.cos(a) * L, 5.6 + rng() * 1.6, Math.sin(a) * L * 0.85];
      tb.tube([[0.05, 3.5, -0.05], [e[0] * 0.4, 4.6, e[2] * 0.4], e], (t) => 0.38 * (1 - t * 0.65), { color: '#6a5038', mat: M.wood, radial: 8, segs: 12 });
      limbs.push(e);
    }
    // roots flaring at the foot (seen when he tips it over)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      tb.tube([[0, 0.3, 0], [Math.cos(a) * 0.8, 0.05, Math.sin(a) * 0.8], [Math.cos(a) * 1.4, -0.25, Math.sin(a) * 1.4]], (t) => 0.22 * (1 - t * 0.8), { color: '#5a4030', mat: M.wood, radial: 6, segs: 8 });
    }
    tb.sphere(0.85, { y: -0.15, sy: 0.45, color: '#6a5a40', mat: M.flat });
    tree.add(tb.build());
    // canopy: broad jade clouds of leaves (scaled when it withers)
    const cb = new Builder();
    const pads = [[0, 8.0, 0, 2.4], ...limbs.map((e) => [e[0], e[1] + 0.5, e[2], 1.9 + rng() * 0.4]), ...limbs.map((e) => [e[0] * 0.55, e[1] + 1.6, e[2] * 0.55, 1.6])];
    frontPad = pads.slice(1, 6).reduce((a, p) => (p[2] + p[0] * 0.3 > a[2] + a[0] * 0.3 ? p : a));
    for (let i = 0; i < 10; i++) { const p = pads[1 + (i % 5)], a = rng() * 6.28; pads.push([p[0] + Math.cos(a) * p[3] * 0.8, p[1] + rng() * 0.5 - 0.1, p[2] + Math.sin(a) * p[3] * 0.8, 1.0 + rng() * 0.4]); }
    pads.forEach(([x, y, z, r], i) => cb.ico(r, { x, y, z, sy: 0.42, color: ['#4f9a74', '#6fb08a', '#3f8a68', '#8fc4a0', '#5aa27e'][i % 5], mat: M.flat, detail: 1, ry: rng() * 3 }));
    canopy.add(cb.build());
    tree.add(canopy);
    for (let i = 0; i < FRUIT; i++) {
      const p = pads[1 + (i % 10)];
      const a = rng() * Math.PI * 2, d = p[3] * (0.5 + rng() * 0.4);
      fruitSpots.push([p[0] + Math.cos(a) * d, p[1] - p[3] * 0.42 - 0.3, p[2] + Math.sin(a) * d]);
    }
  }
  object.add(tree);
  // the fruit: each like a child "三朝未满", hung by a stalk
  const fb = new Builder();
  fb.cyl(0.006, 0.006, 0.12, { y: 0.24, color: '#5a7a4a', seg: 3 });
  fb.sphere(0.075, { y: 0.17, color: '#f2dcb8', mat: M.smooth, ws: 10, hs: 8 });          // head
  fb.sphere(0.08, { y: 0.04, sy: 1.15, color: '#f0d4aa', mat: M.smooth, ws: 10, hs: 8 });  // body
  for (const sx of [-1, 1]) {
    fb.cyl(0.02, 0.024, 0.09, { x: sx * 0.07, y: 0.06, rz: sx * 0.9, color: '#f0d4aa', mat: M.smooth, seg: 5 });
    fb.cyl(0.022, 0.026, 0.1, { x: sx * 0.04, y: -0.08, color: '#f0d4aa', mat: M.smooth, seg: 5 });
  }
  for (let i = 0; i < 3; i++) fb.sphere(0.05, { x: (i - 1) * 0.05, y: 0.26, sx: 0.5, sy: 0.25, color: '#6fae6a', mat: M.smooth, ws: 6, hs: 3 });
  const fruit = new THREE.InstancedMesh(fb.merged(), M.smooth, FRUIT + 1);
  fruit.castShadow = true;
  object.add(fruit);

  // Wukong on a limb with the golden striker (金击子)
  const wk = new THREE.Group();
  {
    const wb = new Builder();
    figure(wb, 'wukong', { pose: 'none', s: 1.6 });
    wb.cyl(0.035, 0.04, 0.3, { x: -0.15, y: 0.69, rz: Math.PI + 0.3, color: C.fur, mat: M.smooth, seg: 6 });
    wk.add(wb.build());
  }
  const arm = new THREE.Group();
  {
    const ab = new Builder();
    ab.cyl(0.035, 0.04, 0.3, { color: C.fur, mat: M.smooth, seg: 6 });
    ab.cyl(0.018, 0.018, 0.55, { y: 0.28, color: C.gold, mat: M.metal, seg: 6 });
    arm.add(ab.build());
  }
  arm.position.set(0.15, 0.69, 0);
  wk.add(arm);
  const WKP = fruitSpots[3];
  tree.add(wk);
  wk.position.set(frontPad[0], frontPad[1] + frontPad[3] * 0.38, frontPad[2]);
  wk.rotation.y = Math.atan2(frontPad[0], frontPad[2]) + 0.6;

  // Guanyin and her water
  const guanyin = bodhisattvaOnCloud(rng, { s: 1.7, cloud: 0.6 });
  guanyin.rotation.y = 0.5;
  object.add(guanyin);
  const GY = [-4.6, 7.2, 2.4];
  const water = softPuffs(50, { color: '#d8f4ff', opacity: 0.85, additive: true });
  const dust = softPuffs(40, { color: '#c8b896', opacity: 0.6 });
  const sparkle = softPuffs(30, { color: '#bff0c8', opacity: 0.7, additive: true });
  object.add(water.points, dust.points, sparkle.points);

  const _v = new THREE.Vector3();
  const qFall = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), FALL_DIR);
  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const fallK = smooth(0.32, 0.4, u) * (1 - smooth(0.68, 0.8, u));         // 0 standing … 1 lying
    tree.quaternion.identity().slerp(qFall, fallK * fallK);
    tree.position.y = y0 + fallK * 0.5;
    const wither = smooth(0.4, 0.5, u) * (1 - smooth(0.7, 0.8, u));
    canopy.scale.set(1 - wither * 0.35, 1 - wither * 0.55, 1 - wither * 0.35);
    // Wukong: in the canopy before the fall, knocking; gone while the tree lies
    const wkK = 1 - smooth(0.28, 0.32, u) + smooth(0.9, 0.97, u);
    wk.visible = wkK > 0.01;
    wk.scale.setScalar(Math.max(0.001, Math.min(1, wkK)));
    const strike = Math.max(0, Math.sin(t * 3.1)) ** 3;
    arm.rotation.set(-0.6 - strike * 1.1, 0, -0.5);
    // fruit: grown fruit (hidden for the ones he has knocked, until the tree is restored)
    tree.updateMatrixWorld();
    const regrow = smooth(0.78, 0.86, u);
    const knocked = Math.floor(clamp(u / 0.28) * 3);
    for (let i = 0; i < FRUIT; i++) {
      const p = fruitSpots[i];
      _v.set(p[0], p[1], p[2]).applyMatrix4(tree.matrix);
      let s = 2.0 * (1 - wither);
      if (i < 3 && i < knocked && regrow < 0.5) s = 0.0001;
      if (i < 3 && regrow >= 0.5) s *= regrow;
      setInst(fruit, i, _v.x, _v.y, _v.z, i * 1.7 + Math.sin(t + i) * 0.2, Math.max(0.0001, s));
    }
    // the falling fruit: drops from the striker, touches the earth and sinks into it
    const fp = (u / 0.28) * 3 % 1, on = u < 0.28;
    if (on) {
      const k = Math.floor((u / 0.28) * 3), p = fruitSpots[k];
      _v.set(p[0], p[1], p[2]).applyMatrix4(tree.matrix);
      const fy = lerp(_v.y, y0 + 0.1, smooth(0.15, 0.7, fp)) - smooth(0.72, 0.95, fp) * 0.3;
      setInst(fruit, FRUIT, _v.x, fy, _v.z, t * 2, Math.max(0.0001, 2.0 * (fp < 0.15 ? 0.0001 : 1 - smooth(0.8, 0.98, fp))), t * 3);
    } else setInst(fruit, FRUIT, 0, -10, 0, 0, 0.0001);
    fruit.instanceMatrix.needsUpdate = true;
    // dust as it crashes
    const dk = smooth(0.37, 0.4, u) * (1 - smooth(0.42, 0.52, u));
    for (let i = 0; i < 40; i++) {
      const p = (i / 40), dd = 1 + p * 8;
      dust.set(i, TREE[0] + FALL_DIR.x * dd + Math.sin(i * 7) * 0.8, y0 + 0.4 + (i % 4) * 0.3, TREE[1] + FALL_DIR.z * dd + Math.cos(i * 5) * 0.8, 1.2 + (i % 3) * 0.5, dk);
    }
    dust.commit();
    // Guanyin comes, the sweet water falls on the roots, the tree lifts
    const gk = smooth(0.56, 0.64, u) * (1 - smooth(0.86, 0.94, u));
    guanyin.visible = gk > 0.01;
    guanyin.scale.setScalar(Math.max(0.001, gk));
    guanyin.position.set(GY[0], GY[1] + (1 - gk) * 2 + Math.sin(t * 0.7) * 0.12, GY[2]);
    const wkk = smooth(0.62, 0.66, u) * (1 - smooth(0.76, 0.8, u));
    for (let i = 0; i < 50; i++) {
      const p = (t * 0.5 + i / 50) % 1;
      const sx = GY[0] + 0.3, sy = GY[1] + 0.4, sz = GY[2] + 0.3, ex = TREE[0], ey = y0 + 0.6, ez = TREE[1];
      water.set(i, lerp(sx, ex, p) + Math.sin(i * 3) * 0.2, lerp(sy, ey, p) + Math.sin(p * Math.PI) * 1.8, lerp(sz, ez, p) + Math.cos(i * 5) * 0.2, 0.12 + 0.12 * Math.sin(i), wkk);
    }
    water.commit();
    const sk = smooth(0.66, 0.72, u) * (1 - smooth(0.84, 0.92, u));
    for (let i = 0; i < 30; i++) {
      const p = (t * 0.15 + i / 30) % 1, a = i * 2.4;
      sparkle.set(i, TREE[0] + Math.cos(a) * (1 + p * 3), y0 + 1 + p * 8, TREE[1] + Math.sin(a) * (1 + p * 3), 0.25, sk * Math.sin(Math.PI * p));
    }
    sparkle.commit();
    void WKP;
  }
  update(0);
  return { object, update };
}
