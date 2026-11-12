// 荆棘岭 (ch.64) — eight hundred li of thorns fill the basin to the brim: a dark, tangled mass of
// vines, spines and leaves. From the stele at the front-left (荆棘蓬攀八百里) a fresh tunnel has
// been cut, and at its head Bajie — grown huge, rising out of the thicket — swings his rake;
// Wukong, Sha and the horse follow in the cut. Deep inside, at the far end the tunnel points to,
// lies the lamplit clearing of 木仙庵 where the tree spirits (pine, cypress, juniper, bamboo, and the
// apricot fairy) sit with Tang Seng reciting poems — their own trees stand round the clearing.
import { THREE, Builder, M, C, terrain, pine, rock, stele, figure, horse, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { polyDist, polyAt } from './_d_util.js';

const TUN = [[-6.6, 8.3], [-5.4, 6.0], [-4.0, 4.0], [-2.4, 2.9], [-0.6, 2.5]];
const CLR = [3.7, -3.0], CLR_R = 2.4;

function ground(x, z) {
  const r = Math.hypot(x, z);
  return 0.15 + smooth(4, -9, z) * 0.6 + 0.25 * fbm(x * 0.4 + 2, z * 0.4, 3) - smooth(CLR_R + 0.4, 0, Math.hypot(x - CLR[0], z - CLR[1])) * 0.0 + 0 * r;
}
const carve = (x, z) => Math.min(polyDist(TUN, x, z) - 1.1, Math.hypot(x - CLR[0], z - CLR[1]) - CLR_R);
function thicket(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.45 + 9, z * 0.45 + 3, 3);
  const back = smooth(-0.5, -8, z) * 2.8 * (1 - 0.75 * Math.exp(-((x - CLR[0]) ** 2) / 5) * smooth(-6.5, -3, z));
  return (1.1 + 0.9 * n + back) * smooth(10.2, 8.8, r) * smooth(-0.1, 0.7, carve(x, z));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const earth = new THREE.Color('#5a4a34'), cut = new THREE.Color('#8a7350'), warm = new THREE.Color('#b08a56'), moss = new THREE.Color('#2e3f2a');
  terrain(b, { R: 10.5, rings: 44, segs: 150, fn: ground, palette: (x, y, z) => {
    const dc = Math.hypot(x - CLR[0], z - CLR[1]);
    if (dc < CLR_R) return warm.clone().lerp(earth, smooth(CLR_R * 0.4, CLR_R, dc) * 0.7);
    if (polyDist(TUN, x, z) < 0.9) return cut;
    return moss.clone().lerp(earth, 0.3 * noise2(x * 2, z * 2));
  } });

  /* the tangle: vines in random arcs, kept out of the tunnel and the clearing */
  const vineCols = ['#4a3a28', '#5a4630', '#3e3a24', '#4a4a2c', '#634c34'];
  const thornPts = [];
  let made = 0;
  for (let tries = 0; made < 420 && tries < 6000; tries++) {
    let [x, z] = rng.inDisc(9.6);
    const H = thicket(x, z);
    if (H < 0.6) continue;
    let a = rng() * Math.PI * 2;
    const pts = [];
    const big = rng() < 0.08, n = 6 + Math.floor(rng() * 3), peakAt = 0.4 + rng() * 0.4, hh = H * (0.7 + rng() * 0.6) * (big ? 1.7 : 1);
    let ok = true;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1);
      const y = ground(x, z) - 0.05 + hh * Math.sin(Math.PI * Math.pow(t, peakAt * 1.6));
      if (k > 0 && (carve(x, z) < 0.05 || Math.hypot(x, z) > 9.7)) { ok = k > 2; break; }
      pts.push([x, big ? y : Math.min(y, thicket(x, z) + 0.45), z]);
      const L = 0.45 + rng() * 0.5;
      x += Math.cos(a) * L; z += Math.sin(a) * L; a += (rng() - 0.5) * 1.4;
    }
    if (!ok || pts.length < 3) continue;
    const rad = big ? 0.09 : 0.045 + rng() * 0.05;
    b.tube(pts, (t) => rad * (1 - 0.5 * t), { color: rng.pick(vineCols), mat: M.wood, radial: 4, segs: pts.length * 2 });
    for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 2; j++) {
      const f = rng(), p = pts[k], q = pts[k + 1];
      thornPts.push([lerp(p[0], q[0], f), lerp(p[1], q[1], f), lerp(p[2], q[2], f), rad]);
    }
    made++;
  }
  /* bramble clumps over the tangle: small, dark, sharply faceted, kept off the cuts */
  const leafCols = ['#1d3424', '#24402a', '#2d4a2c', '#33502c', '#1a2e22', '#3a4a26'];
  for (let i = 0, k = 0; i < 640 && k < 6000; k++) {
    const [x, z] = rng.inDisc(9.7);
    const H = thicket(x, z), r = 0.22 + rng() * 0.32;
    if (H < 0.5 || carve(x, z) < r + 0.15) continue;
    b.ico(r, { x, y: ground(x, z) + H * (0.45 + rng() * 0.5), z, sy: 0.7, ry: rng() * 3, rx: rng(), color: rng.pick(leafCols), mat: M.flat, detail: 0 });
    i++;
  }
  // a few pale thorn-blossoms
  for (let i = 0; i < 60; i++) {
    const [x, z] = rng.inDisc(9.4);
    const H = thicket(x, z);
    if (H < 0.6) continue;
    b.sphere(0.06, { x, y: ground(x, z) + H * (0.8 + rng() * 0.3), z, color: rng() < 0.5 ? '#e8e0d0' : '#d8b0b8', mat: M.smooth, ws: 5, hs: 4 });
  }
  // cut vines heaped along the tunnel
  for (let i = 0; i < 40; i++) {
    const [px, pz, ang] = polyAt(TUN, rng() * 0.95);
    const side = rng() < 0.5 ? -1 : 1, off = 0.85 + rng() * 0.2;
    const x = px + Math.cos(ang) * side * off, z = pz - Math.sin(ang) * side * off, y = ground(x, z) + 0.05;
    const a = ang + (rng() - 0.5) * 1.2, L = 0.4 + rng() * 0.5;
    b.tube([[x, y, z], [x + Math.sin(a) * L * 0.5, y + 0.06, z + Math.cos(a) * L * 0.5], [x + Math.sin(a) * L, y + 0.02, z + Math.cos(a) * L]], 0.035, { color: rng.pick(vineCols), mat: M.wood, radial: 4, segs: 4 });
  }
  // the stele at the mouth: 荆棘蓬攀八百里，古来有路少人行
  stele(b, { x: -7.4, y: ground(-7.4, 8.0), z: 8.0, ry: 0.6, h: 1.2, w: 0.55, turtle: false, color: '#6e6a5c' });
  for (let i = 0; i < 4; i++) rock(b, { x: -8.2 + i * 0.4, y: ground(-8.2, 8.6), z: 8.7 - i * 0.3, r: 0.25 + rng() * 0.2, h: 0.3, rand: rng, color: '#5c5a50' });

  /* 木仙庵: the clearing, its stone house, table and lamps, the spirits' own trees */
  const [cx, cz] = CLR, cy = ground(cx, cz);
  {
    // 石屋
    b.push({ x: cx + 0.6, y: cy, z: cz - 1.6, ry: -0.5 });
    b.box(1.6, 0.85, 1.0, { color: '#8c8270', mat: M.flat });
    b.box(1.8, 0.14, 1.2, { y: 0.85, color: '#6c6658', mat: M.flat });
    b.box(1.4, 0.14, 0.9, { y: 0.99, color: '#7a7262', mat: M.flat });
    b.box(0.36, 0.55, 0.03, { y: 0.0, z: 0.51, color: C.lamp, mat: M.glow, glow: 1.2 });
    b.pop();
    // stone table and stools
    b.cyl(0.42, 0.3, 0.45, { x: cx, y: cy, z: cz, color: '#9a927e', seg: 9 });
    b.cyl(0.5, 0.5, 0.06, { x: cx, y: cy + 0.45, z: cz, color: '#aaa28c', seg: 12 });
    b.cyl(0.04, 0.05, 0.12, { x: cx + 0.15, y: cy + 0.51, z: cz, color: '#5a4a3a', mat: M.smooth, seg: 6 });         // tea
    // lanterns on posts
    for (const [dx, dz] of [[-1.1, 0.7], [1.2, 0.6]]) {
      b.cyl(0.025, 0.025, 1.0, { x: cx + dx, y: cy, z: cz + dz, color: C.woodD, mat: M.wood, seg: 4 });
      b.cyl(0.09, 0.09, 0.2, { x: cx + dx, y: cy + 1.0, z: cz + dz, color: C.lamp, mat: M.glow, glow: 1.8, seg: 8 });
      b.cone(0.13, 0.08, { x: cx + dx, y: cy + 1.2, z: cz + dz, color: C.woodD, mat: M.wood, seg: 8 });
    }
    // the spirits' trees around the rim of the clearing
    pine(b, { x: cx - 1.9, y: cy, z: cz - 1.6, h: 4.6, r: rng, lean: 0.2 });                                  // 十八公 pine
    b.push({ x: cx + 2.4, y: cy, z: cz - 0.4 });                                                               // 孤直公 cypress
    b.cyl(0.1, 0.16, 1.3, { color: C.bark, mat: M.wood, seg: 6 });
    for (let k = 0; k < 5; k++) b.ico(0.55 - k * 0.07, { y: 1.3 + k * 0.55, sy: 1.1, color: k % 2 ? '#2e4a36' : '#264030', mat: M.flat });
    b.pop();
    b.push({ x: cx + 0.2, y: cy, z: cz - 2.6 });                                                               // 凌空子 juniper
    b.tube([[0, 0, 0], [0.3, 1.2, 0.1], [-0.1, 2.3, 0], [0.2, 3.2, -0.1]], (t) => 0.14 * (1 - t * 0.6), { color: '#6a4a36', mat: M.wood, radial: 6 });
    for (let k = 0; k < 6; k++) b.cone(0.45 - k * 0.04, 0.8, { x: Math.sin(k * 2.1) * 0.35, y: 1.3 + k * 0.38, z: Math.cos(k * 2.1) * 0.25, color: '#2a4636', mat: M.flat, seg: 6 });
    b.pop();
    for (let k = 0; k < 7; k++) {                                                                               // 拂云叟 bamboo
      const x = cx + 2.2 + Math.sin(k * 2.4) * 0.4, z = cz + 1.5 + Math.cos(k * 2.4) * 0.3, h = 2.6 + (k % 3) * 0.5;
      b.cyl(0.035, 0.045, h, { x, y: cy, z, rz: Math.sin(k) * 0.08, color: '#6f9a58', mat: M.smooth, seg: 5 });
      for (let j = 0; j < 3; j++) b.box(0.05, 0.02, 0.5, { x: x + 0.15, y: cy + h * (0.6 + j * 0.15), z, ry: k + j * 2, rz: 0.4, color: '#4f7a46', mat: M.cloth });
    }
    b.push({ x: cx - 2.3, y: cy, z: cz + 0.8 });                                                               // 杏仙 apricot
    b.tube([[0, 0, 0], [0.2, 0.7, 0], [0.05, 1.3, 0.1]], (t) => 0.1 * (1 - t * 0.5), { color: C.bark, mat: M.wood, radial: 5 });
    for (let k = 0; k < 6; k++) b.ico(0.42, { x: Math.cos(k) * 0.5, y: 1.4 + Math.sin(k * 1.7) * 0.25, z: Math.sin(k) * 0.45, sy: 0.75, color: k % 2 ? '#f2c4c4' : '#e8a8ac', mat: M.flat });
    b.pop();
    b.push({ x: cx - 0.6, y: cy, z: cz + 2.4 });                                                               // 丹桂 / 腊梅 / 赤身鬼 maple
    b.tube([[0, 0, 0], [-0.1, 0.8, 0], [0.1, 1.5, 0]], (t) => 0.09 * (1 - t * 0.5), { color: C.bark, mat: M.wood, radial: 5 });
    for (let k = 0; k < 5; k++) b.ico(0.38, { x: Math.cos(k * 1.3) * 0.4, y: 1.6 + Math.sin(k) * 0.2, z: Math.sin(k * 1.3) * 0.35, sy: 0.7, color: k % 2 ? '#b8442c' : '#a03424', mat: M.flat });
    b.pop();
  }
  object.add(b.build());

  /* thorns: one instanced cone mesh */
  const thornGeo = new THREE.ConeGeometry(0.04, 0.26, 4);
  thornGeo.translate(0, 0.13, 0);
  const thorns = new THREE.InstancedMesh(thornGeo, new THREE.MeshStandardMaterial({ color: '#8a6a3e', roughness: 0.8 }), thornPts.length);
  thornPts.forEach(([x, y, z, r], i) => setInst(thorns, i, x, y, z, rng() * 6.28, 0.7 + r * 6, (rng() - 0.5) * 3, (rng() - 0.5) * 3));
  thorns.castShadow = true;
  object.add(thorns);

  /* the tree spirits and Tang Seng, seated round the table */
  const sb = new Builder();
  {
    const kinds = [
      { robe: '#2f4a36', hat: (sb) => sb.ico(0.15, { y: 0.74, sy: 0.4, color: '#24402c', mat: M.flat }) },                              // pine
      { robe: '#5a6a5a', hat: (sb) => sb.cone(0.08, 0.28, { y: 0.66, color: '#2e4a36', mat: M.flat, seg: 6 }) },                          // cypress
      { robe: '#3a5a5a', hat: (sb) => { for (let k = 0; k < 5; k++) sb.cone(0.03, 0.18, { y: 0.66, rz: (k - 2) * 0.35, color: '#2a4636', mat: M.flat, seg: 4 }); } },   // juniper
      { robe: '#7a9a6a', hat: (sb) => { for (let k = 0; k < 4; k++) sb.box(0.03, 0.01, 0.22, { y: 0.69, ry: k * 0.8, rx: 0.4, color: '#4f7a46', mat: M.cloth }); } }, // bamboo
    ];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3, x = cx + Math.cos(a) * 0.85, z = cz + Math.sin(a) * 0.85;
      sb.push({ x, y: cy, z, ry: Math.atan2(cx - x, cz - z), s: i === 5 ? 1.25 : 1.1 });
      if (i < 4) {
        figure(sb, 'villager', { robe: kinds[i].robe, hat: '#d8d0c0' });
        sb.sphere(0.06, { y: 0.55, z: 0.05, sy: 1.6, color: '#e8e4dc', mat: M.smooth, ws: 6, hs: 5 });     // white beards
        kinds[i].hat(sb);
      } else if (i === 4) {
        figure(sb, 'woman', { robe: '#e3a0a6' });
        for (let k = 0; k < 5; k++) sb.sphere(0.03, { x: Math.cos(k * 1.26) * 0.06, y: 0.7, z: Math.sin(k * 1.26) * 0.05 - 0.02, color: '#f6d0d4', mat: M.smooth, ws: 5, hs: 4 });
      } else {
        figure(sb, 'monk', { pose: 'none' });
      }
      sb.pop();
    }
  }
  object.add(sb.build());

  /* Bajie, grown huge, swinging the rake at the head of the tunnel */
  const BJ = polyAt(TUN, 1);
  const bajie = new THREE.Group();
  const rake = new THREE.Group();
  {
    const kb = new Builder();
    figure(kb, 'bajie', { pose: 'none' });
    for (const sx of [-1, 1]) kb.cyl(0.04, 0.045, 0.24, { x: sx * 0.15, y: 0.46, z: 0.04, rx: 1.2, rz: sx * 0.15, color: '#3a3a3e', mat: M.smooth, seg: 6 });
    for (const sx of [-1, 1]) kb.sphere(0.018, { x: sx * 0.055, y: 0.6, z: 0.1, color: '#f0e8d8', mat: M.smooth, ws: 6, hs: 4 });
    bajie.add(kb.build());
    const rb = new Builder();
    rb.cyl(0.014, 0.014, 1.2, { y: -0.1, color: C.wood, mat: M.wood, seg: 5 });
    rb.box(0.26, 0.05, 0.05, { y: 1.08, color: '#9aa0a6', mat: M.metal });
    for (let i = 0; i < 9; i++) rb.cyl(0.008, 0.004, 0.16, { x: -0.12 + i * 0.03, y: 1.1, z: 0.0, rx: Math.PI / 2, color: '#9aa0a6', mat: M.metal, seg: 4 });
    rake.add(rb.build());
    rake.position.set(0, 0.46, 0.25);
    bajie.add(rake);
  }
  bajie.position.set(BJ[0], ground(BJ[0], BJ[1]), BJ[1]);
  bajie.rotation.y = BJ[2] - 0.85;
  bajie.scale.setScalar(5.2);
  object.add(bajie);

  /* the rest of the party in the cut */
  const party = new Builder();
  for (const [u, kind, s] of [[0.72, 'wukong', 1.3], [0.56, 'sha', 1.2]]) {
    const [x, z, a] = polyAt(TUN, u);
    figure(party, kind, { x, y: ground(x, z), z, ry: a, s, pose: kind === 'wukong' ? 'staff' : 'stand' });
  }
  { const [x, z, a] = polyAt(TUN, 0.42); horse(party, { x, y: ground(x, z), z, ry: a, s: 1.05 }); }
  object.add(party.build());

  /* flying chips of thorn, fireflies over the clearing, lamp warmth */
  const CH = 24;
  const chips = softPuffs(CH, { color: '#3a2e1e', opacity: 0.9 });
  const FF = 30;
  const flies = softPuffs(FF, { color: '#ffd27a', opacity: 0.9, additive: true });
  const warmth = softPuffs(4, { color: '#ffb35a', opacity: 0.35, additive: true });
  object.add(chips.points, flies.points, warmth.points);
  const fd = Array.from({ length: FF }, () => ({ a: rng() * 6.28, r: 0.6 + rng() * 2.2, y: 0.5 + rng() * 1.8, f: 0.3 + rng() * 0.5, ph: rng() * 10 }));
  const cd = Array.from({ length: CH }, () => ({ ph: rng(), a: (rng() - 0.5) * 2.4, v: 1 + rng() }));
  const head = new THREE.Vector3();

  function update(t, dt, env) {
    const nk = env ? env.night : 0;   // fireflies and lamplight carry the thicket at night
    const sw = Math.sin(t * 1.6);
    const hit = Math.max(0, -sw);
    rake.rotation.x = 0.5 + 1.25 * (0.5 + 0.5 * sw);
    bajie.rotation.x = 0.06 * hit;
    head.set(0, 0.25, 1.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bajie.rotation.y).multiplyScalar(5.2).add(bajie.position);
    for (let i = 0; i < CH; i++) {
      const c = cd[i], p = (t * 0.25 + c.ph) % 1;
      const ang = bajie.rotation.y + c.a;
      chips.set(i, head.x + Math.sin(ang) * p * 2.2 * c.v, head.y + 2.6 * p * (1 - p) * c.v + 0.2, head.z + Math.cos(ang) * p * 2.2 * c.v, 0.12, Math.sin(Math.PI * p));
    }
    chips.commit();
    for (let i = 0; i < FF; i++) {
      const f = fd[i], a = f.a + t * f.f * 0.3;
      flies.set(i, cx + Math.cos(a) * f.r, cy + f.y + 0.3 * Math.sin(t * f.f * 2 + f.ph), cz + Math.sin(a) * f.r * 0.8, 0.07 * (1 + 0.7 * nk), (0.5 + 0.5 * Math.sin(t * 3 * f.f + f.ph)) * (1 + 0.4 * nk));
    }
    flies.commit();
    warmth.set(0, cx - 1.1, cy + 1.1, cz + 0.7, 1.4 + 0.1 * Math.sin(t * 7), 0.9);
    warmth.set(1, cx + 1.2, cy + 1.1, cz + 0.6, 1.4 + 0.1 * Math.sin(t * 6 + 1), 0.9);
    warmth.set(2, cx, cy + 0.6, cz, 3.6 + 1.6 * nk, 0.4 + 0.15 * nk);
    warmth.set(3, cx + 0.6, cy + 0.4, cz - 1.0, 1.4, 0.4);
    warmth.commit();
    void clamp;
  }
  update(0);
  return { object, update };
}
