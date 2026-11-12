// 车迟国 — the kingdom where Daoists rule and Buddhists are slaves. On the left, a file of thin monks
// drags a cart of bricks up the steep road to the gate (the carts are slow: 车迟). On the plaza stand
// the altars of the contest with the three immortals: the rain altar under its black cloud, the
// cauldron of boiling oil in which Wukong takes his bath, and — the silhouette — the 云梯显圣:
// fifty tables stacked into a tower, Tang Seng sitting in meditation on the top. A second tower
// beside it holds 虎力大仙, who sways as an insect bites him. Loop (30 s).
import { THREE, Builder, M, C, terrain, rock, hall, roof, pine, figure, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { pathDist, pathAt, courtier, wall, group, nightDim } from './_c_util.js';

const CYCLE = 30;
const ROAD = [[-8.6, 4.8], [-7.0, 3.0], [-6.2, 0.8], [-5.8, -1.6], [-5.0, -3.8]];
const TOWER = [0.6, -0.6];
const TABLE_H = 0.22;

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 7, z * 0.3 + 3, 4);
  let h = 0.22 + 0.2 * n;
  // the ridge with the city gate rising to the left-back
  h += smooth(-1, -7.5, x * 0.8 + z * 0.55) * 2.6 * (0.8 + 0.4 * n);
  h += smooth(-2.0, -7.5, z) * 1.0 * smooth(-3, 3, x);
  return h * smooth(10.6, 9.4, r) + 0.12 * (1 - smooth(10.6, 9.4, r));
}

function table(b, { x, y, z, ry, s = 1, top = '#8a3a28' }) {
  b.push({ x, y, z, ry, s });
  b.box(0.95, 0.05, 0.62, { y: TABLE_H - 0.05, color: top, mat: M.lacquer });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.05, TABLE_H - 0.05, 0.05, { x: sx * 0.42, z: sz * 0.26, color: '#5a2a1e', mat: M.wood });
  b.pop();
}
function sitter(b, { x, y, z, ry = 0, s = 1, robe = C.cinnabar, daoist = false }) {
  b.push({ x, y, z, ry, s });
  b.cyl(0.2, 0.22, 0.1, { color: robe, mat: M.cloth, seg: 12 });                         // crossed legs
  b.lathe([[0, 0.05], [0.15, 0.05], [0.12, 0.25], [0.08, 0.38], [0, 0.38]], { color: robe, mat: M.cloth, seg: 12 });
  b.box(0.03, 0.18, 0.18, { x: 0.05, y: 0.18, z: 0.05, rz: 0.5, color: C.gold, mat: M.cloth });
  b.sphere(0.07, { y: 0.46, color: C.skin, mat: M.smooth });
  if (daoist) { b.box(0.07, 0.07, 0.07, { y: 0.52, color: C.ink, mat: M.cloth }); b.sphere(0.04, { y: 0.4, z: 0.06, sy: 1.6, color: '#e8e4dc', mat: M.smooth }); }
  else { b.cyl(0.055, 0.075, 0.07, { y: 0.49, color: C.gold, mat: M.cloth, seg: 5 }); b.cone(0.03, 0.06, { y: 0.56, color: C.gold, mat: M.cloth }); }
  b.sphere(0.05, { y: 0.24, z: 0.12, color: C.skin, mat: M.smooth });                   // folded hands
  b.pop();
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* ground: rammed-earth plaza, the brick road up the ridge */
  const earth = new THREE.Color('#c8a873'), earthD = new THREE.Color('#a98a5c'), plaza = new THREE.Color('#d7c39a'), road = new THREE.Color('#8f7a62'), grass = new THREE.Color('#8a9a5a');
  const tmp = new THREE.Color();
  terrain(b, {
    R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny) => {
      if (pathDist(ROAD, x, z) < 0.55) return road;
      const pk = smooth(5.9, 5.0, Math.hypot(x - 0.8, z - 0.6) + noise2(x, z) * 0.8) * smooth(0.9, 0.5, y);
      tmp.copy(earth).lerp(earthD, noise2(x * 1.2, z * 1.2) + (1 - ny) * 0.8);
      if (ny > 0.9 && y > 1.2) tmp.lerp(grass, 0.4);
      return tmp.lerp(plaza, pk);
    },
  });

  /* the city wall along the ridge, with its gate at the top of the road */
  const gy = ground(-5.0, -3.8);
  wall(b, -9.4, -1.0, -6.0, -4.2, { y: ground(-7.7, -2.6) - 0.3, h: 1.6, t: 0.5, color: '#b59a6e', tile: '#5a5048' });
  wall(b, -4.2, -4.6, 0.6, -8.6, { y: ground(-1.8, -6.6) - 0.3, h: 1.6, t: 0.5, color: '#b59a6e', tile: '#5a5048' });
  b.push({ x: -5.1, y: gy - 0.1, z: -4.4, ry: 0.85 });
  for (const sx of [-1, 1]) b.box(0.7, 1.9, 0.9, { x: sx * 0.8, color: '#a88c62' });
  b.box(2.4, 0.5, 0.9, { y: 1.5, color: '#a88c62' });
  hall(b, { y: 2.0, w: 2.0, d: 0.9, h: 0.7, base: 0.05, steps: false, wall: C.wallRed, roofColor: '#4a4642', r: rng });
  b.pop();
  // the Daoist temple 三清观 behind the plaza
  hall(b, { x: 3.2, y: ground(3.2, -6.0) - 0.05, z: -6.0, ry: -0.25, w: 3.8, d: 2.0, h: 1.4, tiers: 2, wall: '#e6d6a8', roofColor: '#3d4a52', beam: '#2b2622', r: rng, lit: 0.4 });
  // banners: yellow, with the black-white sign of the Dao
  for (const [x, z] of [[-2.2, -3.0], [4.6, -3.2], [6.4, 0.6]]) {
    const y = ground(x, z) - 0.05;
    b.cyl(0.03, 0.04, 3.0, { x, y, z, color: C.woodD, mat: M.wood, seg: 5 });
    b.box(0.5, 1.5, 0.02, { x: x + 0.27, y: y + 1.3, z, color: '#d9b440', mat: M.cloth });
    b.cyl(0.13, 0.13, 0.03, { x: x + 0.27, y: y + 2.3, z: z + 0.01, rx: Math.PI / 2, color: C.ink, mat: M.cloth, seg: 14 });
    b.cyl(0.13, 0.13, 0.03, { x: x + 0.27, y: y + 2.3, z: z + 0.02, rx: Math.PI / 2, sx: 0.5, color: C.white, mat: M.cloth, seg: 14 });
  }

  /* 云梯显圣: two towers of fifty tables */
  const towers = [[TOWER[0], TOWER[1], 50, 1.0], [TOWER[0] + 2.4, TOWER[1] - 1.3, 50, 0.9]];
  const tops = towers.map(([x, z, n, s]) => {
    const y0 = ground(x, z) - 0.02;
    b.box(1.5 * s, 0.25, 1.1 * s, { x, y: y0, z, color: '#c9b48a', mat: M.stone });
    let y = y0 + 0.25;
    for (let i = 0; i < n; i++) {
      const sway = Math.sin(i * 0.17 + s * 5) * 0.06 + rng.range(-0.03, 0.03);
      table(b, { x: x + sway, y, z: z + rng.range(-0.03, 0.03), ry: Math.sin(i * 0.9 + s * 3) * 0.3 + rng.range(-0.12, 0.12), s, top: i % 7 === 3 ? '#c9a03a' : (i % 2 ? '#8a3a28' : '#7a3324') });
      y += TABLE_H * s;
    }
    return [x + Math.sin(n * 0.17 + s * 5) * 0.06, y, z];
  });
  sitter(b, { x: tops[0][0], y: tops[0][1], z: tops[0][2], ry: 0.15, s: 1.7 });
  // ladders of cloud were not needed — 虎力 rose on a cloud; the crowd watches below
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (0.15 + i * 0.07), d = 3.2 + (i % 3) * 0.45;
    const x = TOWER[0] + 1.2 + Math.cos(a) * d, z = TOWER[1] + Math.sin(a) * d * 0.8 + 0.8;
    courtier(b, i % 4 === 0 ? 'official' : 'guard', { x, y: ground(x, z), z, ry: Math.atan2(TOWER[0] - x, TOWER[1] - z), s: 0.9, robe: i % 4 === 0 ? '#3d6a7a' : '#7a5a3a' });
  }
  // the king of 车迟 under a canopy
  b.box(1.4, 0.2, 1.0, { x: 4.0, y: ground(4.0, 3.2), z: 3.2, color: C.ivory });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.04, 0.04, 1.3, { x: 4.0 + sx * 0.6, y: ground(4.0, 3.2) + 0.2, z: 3.2 + sz * 0.42, color: C.cinnabar, mat: M.lacquer, seg: 6 });
  roof(b, { x: 4.0, y: ground(4.0, 3.2) + 1.5, z: 3.2, w: 1.2, d: 0.85, color: '#d9b440' });
  courtier(b, 'king', { x: 4.0, y: ground(4.0, 3.2) + 0.2, z: 3.2, ry: -2.3, s: 1.2 });

  /* the rain altar: a tall terrace with flags, a black cloud above */
  const RA = [-2.4, -1.2];
  const ry0 = ground(...RA);
  for (let i = 0; i < 3; i++) b.box(2.2 - i * 0.55, 0.6, 2.2 - i * 0.55, { x: RA[0], y: ry0 - 0.05 + i * 0.6, z: RA[1], color: i % 2 ? '#c9b48a' : '#b59a6e', mat: M.stone });
  b.box(0.7, 0.4, 0.4, { x: RA[0], y: ry0 + 1.75, z: RA[1], color: '#7a3324', mat: M.lacquer });       // altar table
  b.cyl(0.07, 0.1, 0.16, { x: RA[0], y: ry0 + 2.15, z: RA[1], color: '#5f6a50', mat: M.metal, seg: 8 });  // censer
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    b.cyl(0.02, 0.025, 1.8, { x: RA[0] + dx, y: ry0 + 0.55, z: RA[1] + dz, color: C.woodD, mat: M.wood, seg: 4 });
    b.box(0.03, 0.5, 0.25, { x: RA[0] + dx, y: ry0 + 1.85, z: RA[1] + dz + 0.13, color: dx * dz > 0 ? '#2b2622' : '#d9b440', mat: M.cloth });
  }
  courtier(b, 'daoist', { x: RA[0], y: ry0 + 1.75, z: RA[1] + 0.45, s: 1.1, robe: '#6a5a3a' });            // 虎力 with his sword and tablets

  /* the cauldron of oil, on a fire */
  const OC = [3.6, 0.8];
  const oy = ground(...OC);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; rock(b, { x: OC[0] + Math.cos(a) * 1.05, y: oy - 0.05, z: OC[1] + Math.sin(a) * 1.05, r: 0.22, h: 0.3, rand: rng, color: '#6a5a4a' }); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.cyl(0.05, 0.05, 0.9, { x: OC[0] + Math.cos(a) * 0.4, y: oy + 0.1, z: OC[1] + Math.sin(a) * 0.4, rz: Math.PI / 2 - 0.3, ry: -a, color: C.woodD, mat: M.wood, seg: 5 }); }
  b.lathe([[0.2, 0], [0.62, 0.08], [0.9, 0.35], [1.0, 0.72], [1.04, 0.95], [1.12, 1.0], [1.12, 1.06]], { x: OC[0], y: oy + 0.3, z: OC[1], color: '#4a4436', mat: M.metal, seg: 24 });
  b.cyl(1.04, 1.04, 0.02, { x: OC[0], y: oy + 1.26, z: OC[1], color: '#c98a2a', mat: M.smooth, seg: 24 });   // the oil
  for (const sx of [-1, 1]) b.torus(0.18, 0.04, { x: OC[0] + sx * 1.12, y: oy + 1.25, z: OC[1], ry: Math.PI / 2, color: '#4a4436', mat: M.metal, ts: 12 });
  b.sphere(0.35, { x: OC[0], y: oy + 0.35, z: OC[1], sy: 0.5, color: C.fireCore, mat: M.glow, glow: 1.6 });
  // a few pines and boulders on the ridge
  for (let i = 0, k = 0; i < 9 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.4, 4);
    if (ground(x, z) < 1.5 || pathDist(ROAD, x, z) < 1.0) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.3 + rng() * 0.8, r: rng }); i++;
  }
  for (let i = 0; i < 10; i++) {
    const [x, z] = rng.inDisc(9.6, 6);
    if (pathDist(ROAD, x, z) < 0.8) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.3 + rng() * 0.5, rand: rng, color: '#a08a68' });
  }
  object.add(b.build());

  /* --------------------------------------------- animated parts --- */
  // 虎力大仙 on the second tower, swaying as Wukong (a centipede) bites his nose
  const dao = group((db) => sitter(db, { x: 0, y: 0, z: 0, s: 1.5, robe: '#c9a03a', daoist: true }));
  dao.position.set(...tops[1]);
  object.add(dao);
  // Wukong in the oil
  const wk = group((wb) => figure(wb, 'wukong', { pose: 'none', s: 1.35 }));
  object.add(wk);
  // the cart and the monks hauling it
  const cart = group((cb) => {
    cb.box(0.8, 0.35, 1.2, { y: 0.3, color: '#6a4a2e', mat: M.wood });
    for (let i = 0; i < 6; i++) cb.box(0.22, 0.12, 0.3, { x: -0.25 + (i % 3) * 0.25, y: 0.65 + Math.floor(i / 3) * 0.12, z: -0.3 + (i % 2) * 0.45, color: '#a8553a', mat: M.stone });
    for (const sx of [-1, 1]) cb.cyl(0.3, 0.3, 0.06, { x: sx * 0.45, y: 0.3, rz: Math.PI / 2, color: C.woodD, mat: M.wood, seg: 12 });
    cb.cyl(0.02, 0.02, 0.9, { y: 0.35, z: 0.95, rx: Math.PI / 2, color: C.woodD, mat: M.wood, seg: 4 });
  });
  object.add(cart);
  const NM = 5;
  const monkGeo = (() => {
    const mb = new Builder();
    mb.lathe([[0, 0], [0.13, 0], [0.12, 0.14], [0.08, 0.44], [0, 0.44]], { color: '#8a8478', mat: M.cloth, seg: 10 });
    mb.cyl(0.07, 0.08, 0.1, { y: 0.4, color: '#8a8478', mat: M.cloth, seg: 8 });
    mb.sphere(0.065, { y: 0.57, color: C.skin, mat: M.smooth });
    for (const sx of [-1, 1]) mb.cyl(0.02, 0.022, 0.2, { x: sx * 0.08, y: 0.42, rx: 1.2, color: '#8a8478', mat: M.cloth, seg: 5 });
    return mb.merged();
  })();
  const monks = new THREE.InstancedMesh(monkGeo, M.cloth, NM);
  monks.castShadow = true;
  object.add(monks);
  const ropeG = new THREE.BufferGeometry(); const ropeP = new Float32Array(NM * 6); ropeG.setAttribute('position', new THREE.BufferAttribute(ropeP, 3));
  const rope = new THREE.LineSegments(ropeG, new THREE.LineBasicMaterial({ color: '#5a4a38' })); rope.frustumCulled = false;
  object.add(rope);

  // the black rain cloud, rain, lightning
  const RC = 110;
  const rc = softPuffs(RC, { color: '#45464e', opacity: 0.55 });
  object.add(rc.points);
  const rcd = Array.from({ length: RC }, () => { const [dx, dz] = rng.inDisc(2.8); return { x: RA[0] - 0.6 + dx * 1.2, y: 8.0 + rng.range(-0.4, 0.7) + (1 - Math.hypot(dx, dz) / 2.8) * 0.6, z: RA[1] + dz * 0.8, s: 0.9 + rng() * 1.3, ph: rng() * 9 }; });
  const DROPS = 160;
  const rainP = new Float32Array(DROPS * 6);
  const rainG = new THREE.BufferGeometry(); rainG.setAttribute('position', new THREE.BufferAttribute(rainP, 3));
  const rainM = new THREE.LineBasicMaterial({ color: '#c8d0d8', transparent: true, opacity: 0.6 });
  const rain = new THREE.LineSegments(rainG, rainM); rain.frustumCulled = false;
  object.add(rain);
  const dd = Array.from({ length: DROPS }, () => ({ x: RA[0] + rng.range(-2.4, 2.4), z: RA[1] + rng.range(-1.6, 1.6), ph: rng() }));
  const bolt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 8, 0], [0.4, 6.6, 0.1], [-0.2, 5.4, 0], [0.3, 4.2, 0.1], [0, 3.4, 0]].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0), 24, 0.04, 4, false), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8f0ff').multiplyScalar(2) }));
  bolt.position.set(RA[0] + 1.2, 0, RA[1] - 0.6);
  object.add(bolt);
  // steam and bubbles from the cauldron, smoke from the fire
  const ST = 30;
  const steam = softPuffs(ST, { color: '#f3eee4', opacity: 0.6 });
  object.add(steam.points);
  const BUB = 14;
  const bub = softPuffs(BUB, { color: '#ffe0a0', opacity: 0.9 });
  object.add(bub.points);

  const _v = [0, 0];
  const dimPuffs = nightDim([steam], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    // the hauling: the cart creeps up the road (one trip per cycle), monks ahead of it on the rope
    const q = smooth(0, 1, u) * 0.92 + 0.04;
    const fade = smooth(0, 0.04, u) * (1 - smooth(0.95, 1, u));
    const at = (k) => { const [x, z] = pathAt(ROAD, k); _v[0] = x; _v[1] = z; return _v; };
    const step = Math.sin(t * 2.2) * 0.003;
    at(q); const cx = _v[0], cz = _v[1];
    at(q + 0.02); const dx = _v[0] - cx, dz = _v[1] - cz;
    cart.position.set(cx, ground(cx, cz), cz);
    cart.rotation.set(-Math.atan2(ground(cx + dx, cz + dz) - ground(cx, cz), Math.hypot(dx, dz)) * 0.8, Math.atan2(dx, dz), 0);
    cart.scale.setScalar(Math.max(0.001, fade));
    for (let i = 0; i < NM; i++) {
      at(q + 0.07 + i * 0.045 + step);
      const mx = _v[0] + (i % 2 ? 0.25 : -0.25), mz = _v[1];
      const y = ground(mx, mz);
      setInst(monks, i, mx, y, mz, Math.atan2(dx, dz), Math.max(0.001, fade * 1.1), 0.45, 0);
      ropeP.set([cx, cart.position.y + 0.35, cz, mx, y + 0.4, mz], i * 6);
    }
    monks.instanceMatrix.needsUpdate = true;
    ropeG.attributes.position.needsUpdate = true;
    rope.visible = fade > 0.5;
    // the Daoist sways, slowly at first, then jerks
    const bite = Math.max(0, Math.sin(t * 0.5)) ** 3;
    dao.rotation.set(Math.sin(t * 7) * 0.08 * bite, 0, Math.sin(t * 1.3) * 0.05 + Math.sin(t * 9) * 0.1 * bite);
    // Wukong bobs and splashes in the oil
    wk.position.set(OC[0] + Math.sin(t * 0.7) * 0.25, oy + 0.85 + Math.sin(t * 1.6) * 0.1, OC[1] + Math.cos(t * 0.7) * 0.2);
    wk.rotation.y = t * 0.5;
    // rain comes in pulses
    const rk = smooth(0.1, 0.25, (u * 2) % 1) * (1 - smooth(0.7, 0.9, (u * 2) % 1));
    for (let i = 0; i < RC; i++) { const c = rcd[i]; rc.set(i, c.x + Math.sin(t * 0.2 + c.ph) * 0.3, c.y, c.z, c.s * (0.8 + 0.2 * rk), 0.6 + 0.4 * rk); }
    rc.commit();
    rainM.opacity = 0.55 * rk;
    for (let i = 0; i < DROPS; i++) { const d = dd[i], y = 7.8 - ((t * 0.9 + d.ph) % 1) * (7.8 - ry0 - 0.3); rainP.set([d.x, y, d.z, d.x - 0.02, y - 0.4, d.z], i * 6); }
    rainG.attributes.position.needsUpdate = true;
    const fl = (t * 0.37) % 1;
    bolt.visible = rk > 0.5 && (fl < 0.03 || (fl > 0.06 && fl < 0.08));
    for (let i = 0; i < ST; i++) {
      const p = (t * 0.12 + i / ST) % 1, a = i * 2.4;
      steam.set(i, OC[0] + Math.cos(a) * 0.6 + p * 0.5, oy + 1.4 + p * 3.0, OC[1] + Math.sin(a) * 0.6, 0.4 + p * 1.4, Math.sin(Math.PI * p) * 0.8);
    }
    steam.commit();
    for (let i = 0; i < BUB; i++) {
      const p = (t * 0.9 + i / BUB) % 1, a = i * 1.7;
      bub.set(i, OC[0] + Math.cos(a) * 0.75 * ((i * 0.37) % 1), oy + 1.3 + p * 0.1, OC[1] + Math.sin(a) * 0.75 * ((i * 0.61) % 1), 0.1 * Math.sin(Math.PI * p), 0.8);
    }
    bub.commit();
  }
  update(0);
  return { object, update };
}
