// 观音禅院 — night. The old abbot, coveting Tang Seng's brocade kasaya, has his monks pile firewood
// round the meditation hall and set it alight. Wukong has borrowed the fire-shield (辟火罩) from
// Virupaksa: the hall where his master sleeps stands untouched under a pale golden dome, while he
// sits on the abbot's roof and blows a wind that drives the fire through all the back courts.
// Up the path on 黑风山 behind, the Black Bear Spirit — come "to help put out the fire" — carries
// off the glowing kasaya. Loop of 30 s: the fire catches, roars, and burns down to embers.
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, pagoda, pavilion, roof, figure, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { nightRock, flameGeo, shellMat, mortal, pathLUT } from './_b_kit.js';

const CYCLE = 30;
const TERR = 0.7;              // temple terrace level

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.35 + 3, z * 0.35 + 9, 4);
  const terrace = Math.abs(x) < 5.6 && z > -5.0 && z < 5.6 ? 1 : 0;
  let h = 0.2 + (0.5 + 1.4 * smooth(5.5, 8.5, Math.abs(x)) * smooth(-2, 3, z)) * n * smooth(10.4, 7.8, r) * (Math.abs(x) < 1.2 && z > 5 ? 0.3 : 1);
  // 黑风山 rising behind the temple
  const m = smooth(-4.2, -8.2, z + 0.12 * x) * (4.5 + 3.5 * n) * smooth(10.6, 7.6, r * 0.97);
  h += m;
  if (terrace) h = Math.max(TERR, Math.min(h, TERR + 0.0001) + Math.max(0, m - 0.8) * smooth(-4.2, -5, z));
  return h;
}
// the bear's path up the mountain to 黑风洞
const PATH = [[-3.3, -3.9], [-4.6, -5.0], [-3.4, -5.9], [-4.4, -6.8], [-3.2, -7.6]];

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const night = nightRock(8);
  const pave = new THREE.Color('#5d5a5a'), path = new THREE.Color('#5a5650');
  const pathD = (x, z) => { let d = 1e9; for (let i = 0; i < PATH.length - 1; i++) { const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1]; const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; };
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (Math.abs(y - TERR) < 0.02 && ny > 0.95) return pave;
    if (pathD(x, z) < 0.28 || (Math.abs(x) < 0.55 && z > 5.6)) return path;
    return night(x, y, z, nx, ny, nz);
  } });
  // terrace retaining wall and steps
  b.box(11.4, 0.08, 10.8, { y: TERR - 0.06, z: 0.3, color: '#4c4848', mat: M.stone });
  for (let i = 0; i < 4; i++) b.box(1.6, TERR * (1 - i / 4), 0.3, { y: 0, z: 5.75 + i * 0.3, color: '#5a5654' });

  // 黑风山: dark peaks
  const peaks = [[-2.6, -8.0, 1.6, 7.5], [0.8, -8.6, 1.3, 6], [3.6, -7.4, 1.5, 5.2], [-5.6, -6.2, 1.2, 4.2], [6.2, -5.4, 1.0, 3.2]];
  const tops = peaks.map(([x, z, r, h]) => { const y = ground(x, z) - 0.5; return peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, palette: nightRock(h + y * 0.6, { base: 0 }) }); });
  for (const t of tops) pine(b, { x: t[0], y: t[1] - 0.3, z: t[2], h: 1.0 + rng() * 0.4, r: rng, color: '#1f3a33' });
  for (let i = 0, k = 0; i < 14 && k < 400; k++) {
    const x = rng.range(-8, 8), z = rng.range(-9, -5);
    if (Math.hypot(x, z) > 9.4 || pathD(x, z) < 0.6) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.0 + rng() * 0.9, r: rng, color: '#1f3a33', lean: 0.2 }); i++;
  }
  // the cave mouth of 黑风洞, faintly lit
  const CAVE = [-3.0, ground(-3.2, -7.8) + 0.05, -7.75];
  b.sphere(0.75, { x: CAVE[0], y: CAVE[1], z: CAVE[2] - 0.1, sx: 1.0, sy: 1.1, sz: 0.4, color: '#120e0c', mat: M.stone });
  b.sphere(0.5, { x: CAVE[0], y: CAVE[1], z: CAVE[2] + 0.04, sx: 1.0, sy: 1.0, sz: 0.2, color: '#ff8a3a', mat: M.glow, glow: 0.45 });

  /* -------------------------------------------- the temple compound --- */
  const y0 = TERR;
  const dark = { wall: '#5d5550', roofColor: '#2c3238', beam: '#2c4652', pillar: '#7a2c22' };
  // 山门 with lanterns
  hall(b, { x: 0, y: y0, z: 4.6, w: 2.4, d: 1.2, h: 1.0, ...dark, lit: 0.6, r: rng });
  for (const sx of [-1, 1]) b.sphere(0.12, { x: sx * 0.8, y: y0 + 0.75, z: 5.35, sy: 1.3, color: C.lamp, mat: M.glow, glow: 1.6 });
  // bell and drum towers
  for (const sx of [-1, 1]) pavilion(b, { x: sx * 3.6, y: y0, z: 3.4, w: 1.1, h: 1.2, roofColor: '#2c3238', pillar: '#7a2c22' });
  // 大雄宝殿
  hall(b, { x: 3.1, y: y0, z: 1.2, ry: -Math.PI / 2, w: 3.0, d: 1.9, h: 1.3, tiers: 2, ...dark, lit: 0.5, r: rng });
  // a small pagoda to the right
  pagoda(b, { x: -3.9, y: y0, z: 1.2, levels: 5, w: 0.9, h: 0.6, wall: '#5d5550', roofColor: '#2c3238', lit: 0.4, r: rng });
  // 方丈 (left back) — Wukong sits on its ridge
  const FZ = [-3.4, -2.6];
  hall(b, { x: FZ[0], y: y0, z: FZ[1], w: 2.4, d: 1.6, h: 1.0, ...dark, lit: 0.8, r: rng });
  // 禅堂 where Tang Seng sleeps, under the fire-shield
  const CT = [0.0, -1.5];
  hall(b, { x: CT[0], y: y0, z: CT[1], w: 2.2, d: 1.5, h: 0.95, wall: C.wall, roofColor: C.tile, beam: C.shiqing, lit: 0.9, r: rng });
  b.box(0.3, 0.2, 0.24, { x: CT[0] + 1.35, y: y0, z: CT[1] + 1.05, color: '#7a6a4a', mat: M.cloth });            // the luggage
  // the burning back courts: charred halls
  const burnt = { wall: '#3a2a24', roofColor: '#2a2422', beam: '#3a2420', pillar: '#4a1c14' };
  const BURN = [[3.4, -2.2, 2.2, 1.5, 0.2], [0.2, -4.4, 3.6, 1.4, 0], [-2.8, -4.6, 1.8, 1.2, 0.05], [3.6, -4.4, 1.6, 1.1, -0.1]];
  for (const [x, z, w, d, ry] of BURN) hall(b, { x, y: y0, z, ry, w, d, h: 0.9, ...burnt, lit: 0.9, r: rng, steps: false });
  // the compound wall (院墙): ochre-red with a tiled coping, gate gap at the front
  const wallSeg = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
    b.box(0.22, 0.62, L, { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, ry, color: '#6a3026' });
    roof(b, { x: (x0 + x1) / 2, y: y0 + 0.62, z: (z0 + z1) / 2, ry, w: 0.22, d: L, h: 0.16, over: 0.1, lift: 0.02, flare: 0.01, color: '#2c3238' });
  };
  wallSeg(-5.75, 5.55, -1.4, 5.55); wallSeg(1.4, 5.55, 5.75, 5.55);
  wallSeg(-5.75, 5.55, -5.75, -4.6); wallSeg(5.75, 5.55, 5.75, -4.6);
  // stone lanterns along the approach
  for (const z of [6.6, 7.8]) for (const sx of [-1, 1]) {
    b.box(0.22, 0.4, 0.22, { x: sx * 0.95, y: ground(sx * 0.95, z) - 0.02, z, color: '#5a5654' });
    b.box(0.16, 0.14, 0.16, { x: sx * 0.95, y: ground(sx * 0.95, z) + 0.38, z, color: C.lamp, mat: M.glow, glow: 1.4 });
    b.cone(0.2, 0.14, { x: sx * 0.95, y: ground(sx * 0.95, z) + 0.52, z, color: '#4a4644', seg: 4 });
  }
  // pines and bamboo outside the walls
  for (let i = 0, k = 0; i < 12 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.6, 6.2);
    if (z < -3.5 || (Math.abs(x) < 6.2 && z < 6.0) || Math.abs(x) < 1.6) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.1 + rng() * 0.9, r: rng, color: '#1f3a33', lean: 0.25 }); i++;
  }
  // side corridors (廊) linking the courts
  for (const sx of [-1, 1]) {
    b.box(0.6, 0.5, 5.0, { x: sx * 5.0, y: y0, z: 0.6, color: '#4e4844' });
    roof(b, { x: sx * 5.0, y: y0 + 0.5, z: 0.6, w: 0.6, d: 5.0, h: 0.3, color: '#2c3238' });
  }
  // pines in the courtyard
  for (const [x, z] of [[-2.0, 2.6], [1.8, 3.0], [-4.6, -0.6], [1.6, 0.6]]) pine(b, { x, y: y0, z, h: 1.3 + rng() * 0.5, r: rng, color: '#1f3a33', lean: 0.2 });
  // incense burner before the main hall
  b.cyl(0.18, 0.22, 0.3, { x: 0, y: y0, z: 2.95, color: '#3a3430', mat: M.metal, seg: 10 });
  b.sphere(0.07, { x: 0, y: y0 + 0.32, z: 2.95, color: '#ff9a4a', mat: M.glow, glow: 1.2 });
  // monks with torches, carrying firewood toward the hall
  for (const [x, z, ry] of [[1.9, 0.0, 2.6], [-1.7, 0.3, 3.6], [1.0, 1.8, 3.0], [-0.7, 1.4, 2.9]]) {
    mortal(b, 'bonze', { x, y: y0, z, ry, s: 1.0 });
    b.cyl(0.012, 0.012, 0.35, { x: x + Math.cos(ry) * 0.12, y: y0 + 0.32, z: z - Math.sin(ry) * 0.12, color: C.woodD, mat: M.wood, seg: 4 });
    b.sphere(0.05, { x: x + Math.cos(ry) * 0.12, y: y0 + 0.7, z: z - Math.sin(ry) * 0.12, color: C.fireCore, mat: M.glow, glow: 2 });
  }
  // the old abbot 金池长老 on his staff, watching
  mortal(b, 'oldman', { x: -1.0, y: y0, z: 2.6, ry: 2.6, s: 1.1, robe: '#8a3a2a' });
  // the moon over the dark hills
  b.sphere(0.6, { x: 5.8, y: 14.6, z: -9.5, color: '#e8e4d4', mat: M.glow, glow: 1.0 });
  // rocks
  for (let i = 0; i < 10; i++) {
    const [x, z] = rng.inDisc(10, 7.2);
    if (z < -3) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.4 + rng() * 0.6, rand: rng, palette: nightRock(1.5, { base: ground(x, z) }) });
  }
  object.add(b.build());

  /* ---------------------------------------------- Wukong on the roof --- */
  const wk = new Builder();
  figure(wk, 'wukong', { pose: 'none', s: 1.6 });
  // arms raised to his mouth: blowing the wind
  for (const sx of [-1, 1]) wk.cyl(0.035, 0.04, 0.3, { x: sx * 0.12, y: 0.68, z: 0.02, rz: sx * 2.3, rx: -0.5, color: C.fur, mat: M.smooth, seg: 6 });
  const wukong = wk.build();
  wukong.position.set(FZ[0] + 0.2, y0 + 0.35 + 1.0 + 0.62, FZ[1]);
  wukong.rotation.y = 1.25;
  object.add(wukong);

  /* ---------------------------------------------------- the dome --- */
  const domeMat = shellMat('#ffe6a8', { base: 0.14, rim: 1.4, power: 1.6 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.set(CT[0], y0, CT[1]);
  dome.scale.set(1.0, 1.05, 0.85);
  object.add(dome);

  /* --------------------------------------------------------- fire --- */
  const fg = flameGeo(0.1);
  const flames = [];
  for (const [x, z, w, d, ry] of BURN) {
    const n = Math.round(w * d * 4.5);
    for (let i = 0; i < n; i++) {
      const fx = rng.range(-w / 2 - 0.3, w / 2 + 0.3), fz = rng.range(-d / 2 - 0.3, d / 2 + 0.3);
      const c = Math.cos(ry), s = Math.sin(ry);
      const px = x + fx * c + fz * s, pz = z - fx * s + fz * c;
      const inside = Math.abs(fx) < w / 2 && Math.abs(fz) < d / 2;
      flames.push({ x: px, y: y0 + (inside ? 0.9 + 0.5 * (1 - Math.abs(fz) / (d / 2)) * (d * 0.32) : 0.05), z: pz, s: inside ? 0.55 + rng() * 0.5 : 0.3 + rng() * 0.3, ph: rng() * 20, f: 4 + rng() * 4, lag: rng() * 0.08 });
    }
  }
  // firewood piled round the dome burns too
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rng() * 0.2;
    const x = CT[0] + Math.cos(a) * 2.45, z = CT[1] + Math.sin(a) * 2.1;
    if (z > CT[1] + 1.2) continue;
    flames.push({ x, y: y0 + 0.05, z, s: 0.32 + rng() * 0.22, ph: rng() * 20, f: 5 + rng() * 3, lag: 0.04 + rng() * 0.05 });
  }
  const flameMesh = new THREE.InstancedMesh(fg, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true }), flames.length);
  object.add(flameMesh);
  const heat = softPuffs(flames.length, { color: '#ff6a22', opacity: 0.3, additive: true });
  object.add(heat.points);
  const SMOKE = 46, EMB = 60;
  const smoke = softPuffs(SMOKE, { color: '#2a2422', opacity: 0.45 });
  const embers = softPuffs(EMB, { color: '#ffb050', opacity: 1, additive: true });
  object.add(smoke.points, embers.points);
  const smokeSrc = flames.filter((_, i) => i % 3 === 0);
  // a fire-lit wash on the ground round the burning courts
  const wash = softPuffs(8, { color: '#ff7a30', opacity: 0.35, additive: true });
  object.add(wash.points);

  // the wind he blows: pale streamers from the roof toward the fire
  const gust = new THREE.Group();
  {
    const gb = new Builder();
    for (let i = 0; i < 4; i++) {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([t * 5.2, Math.sin(t * Math.PI) * 0.3 + (i - 1.5) * 0.25, Math.sin(t * Math.PI * 2 + i) * 0.35 + (i - 1.5) * 0.4]); }
      gb.tube(pts, (t) => 0.04 * Math.sin(t * Math.PI), { color: '#d8d4cc', mat: M.cloud, radial: 4, segs: 24 });
    }
    gust.add(gb.build({ shadows: false }));
  }
  gust.position.set(FZ[0] + 0.8, y0 + 2.4, FZ[1] - 0.2);
  gust.rotation.y = -0.28;
  object.add(gust);

  /* ------------------------------------------- the black bear spirit --- */
  const bear = new THREE.Group();
  {
    const bb = new Builder();
    const K = '#0f0d0e';
    bb.sphere(0.32, { y: 0.62, sy: 1.25, color: K, mat: M.smooth });
    bb.sphere(0.24, { y: 0.98, z: 0.05, color: K, mat: M.smooth });
    bb.sphere(0.17, { y: 1.22, z: 0.12, color: K, mat: M.smooth });
    bb.sphere(0.08, { y: 1.18, z: 0.28, sz: 1.2, color: K, mat: M.smooth });
    for (const sx of [-1, 1]) {
      bb.sphere(0.06, { x: sx * 0.12, y: 1.36, z: 0.08, color: K, mat: M.smooth });
      bb.cyl(0.08, 0.1, 0.42, { x: sx * 0.14, y: 0.0, z: sx * 0.08, rx: sx * 0.35, color: K, mat: M.smooth, seg: 8 });  // striding legs
    }
    bb.sphere(0.03, { x: 0.07, y: 1.26, z: 0.25, color: '#ffcf6a', mat: M.glow, glow: 2.2 });
    bb.sphere(0.03, { x: -0.07, y: 1.26, z: 0.25, color: '#ffcf6a', mat: M.glow, glow: 2.2 });
    // arm over the shoulder holding the bundled kasaya
    bb.cyl(0.07, 0.08, 0.45, { x: 0.26, y: 0.95, rz: -2.6, color: K, mat: M.smooth, seg: 8 });
    bb.cyl(0.07, 0.08, 0.4, { x: -0.26, y: 0.9, rz: 0.4, rx: 0.4, color: K, mat: M.smooth, seg: 8 });
    // 锦襕袈裟: a glowing gold-and-crimson bundle with a trailing corner
    bb.sphere(0.24, { x: 0.3, y: 1.3, z: -0.12, sx: 1.2, sy: 0.75, color: '#ffc04a', mat: M.glow, glow: 1.9 });
    bb.box(0.36, 0.03, 0.34, { x: 0.38, y: 1.08, z: -0.28, rx: 0.9, rz: -0.3, color: '#e0503a', mat: M.glow, glow: 1.4 });
    bb.box(0.37, 0.012, 0.35, { x: 0.38, y: 1.1, z: -0.27, rx: 0.9, rz: -0.3, color: '#ffd76a', mat: M.glow, glow: 1.6 });
    bear.add(bb.build());
  }
  bear.scale.setScalar(1.8);
  object.add(bear);
  const bearLUT = pathLUT(PATH.map(([x, z]) => [x, ground(x, z), z]), 200);
  const halo = softPuffs(10, { color: '#ffc860', opacity: 0.55, additive: true });
  object.add(halo.points);

  /* ------------------------------------------------------- update --- */
  const bp = [0, 0, 0], bq = [0, 0, 0];
  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const F = smooth(0.02, 0.2, u) * (1 - smooth(0.82, 0.98, u)) * 0.92 + 0.08;   // embers never quite die
    const wind = smooth(0.15, 0.25, u) * (1 - smooth(0.6, 0.72, u));
    for (let i = 0; i < flames.length; i++) {
      const fl = flames[i];
      const k = clamp((F - fl.lag * 4) / (1 - fl.lag * 4));
      const fk = 1 + 0.25 * Math.sin(t * fl.f + fl.ph) + 0.12 * Math.sin(t * fl.f * 2.3 + fl.ph * 3);
      const s = fl.s * k * (1 + wind * 0.35);
      setInst(flameMesh, i, fl.x, fl.y, fl.z, fl.ph, s < 0.01 ? 0.0001 : [s, s * fk, s], -wind * 0.35, Math.sin(t * 2 + fl.ph) * 0.15 - wind * 0.3);
      heat.set(i, fl.x, fl.y + 0.6 * s, fl.z, 2.4 * s * fk, k);
    }
    flameMesh.instanceMatrix.needsUpdate = true;
    heat.commit();
    for (let i = 0; i < SMOKE; i++) {
      const src = smokeSrc[i % smokeSrc.length], p = (t * 0.07 + i / SMOKE) % 1;
      smoke.set(i, src.x + p * (1.5 + wind * 2), src.y + 1 + p * 8, src.z - p * 2.2, 1.0 + p * 3.4, F * Math.sin(Math.PI * p) * 0.9);
    }
    smoke.commit();
    for (let i = 0; i < EMB; i++) {
      const src = flames[(i * 7) % flames.length], p = (t * 0.22 + i / EMB) % 1;
      embers.set(i, src.x + Math.sin(i * 3 + t) * 0.6 * p + p * wind * 1.5, src.y + 0.4 + p * 5.5, src.z + Math.cos(i * 5 + t * 0.7) * 0.5 * p, 0.06 + 0.05 * (1 - p), F * (1 - p));
    }
    embers.commit();
    for (let i = 0; i < BURN.length; i++) { const [x, z] = BURN[i]; wash.set(i, x, y0 + 0.8, z, 5.5, F * 0.8); }
    for (let i = BURN.length; i < 8; i++) wash.set(i, 0, -50, 0, 0.1, 0);
    wash.commit();
    domeMat.uniforms.uTime.value = t;
    domeMat.uniforms.uK.value = 0.55 + 0.45 * F;
    gust.visible = wind > 0.02;
    gust.scale.set(Math.max(0.001, wind) * (0.9 + 0.1 * Math.sin(t * 3)), 1, 1);
    // Wukong: a little breathing bob while he blows
    wukong.position.y = y0 + 0.35 + 1.0 + 0.62 + Math.sin(t * 2.2) * 0.02;
    // the bear climbs with his prize (u 0.35 → 0.85)
    const q = clamp((u - 0.35) / 0.48);
    const bk = smooth(0.0, 0.06, q) * (1 - smooth(0.92, 1, q));
    bear.visible = bk > 0.01;
    const d = q * bearLUT.length;
    bearLUT.sample(d, bp); bearLUT.sample(d + 0.2, bq);
    bear.position.set(bp[0], bp[1] + Math.abs(Math.sin(t * 5)) * 0.06, bp[2]);
    bear.rotation.y = Math.atan2(bq[0] - bp[0], bq[2] - bp[2]);
    bear.scale.setScalar(1.8 * Math.max(0.001, bk));
    for (let i = 0; i < 10; i++) halo.set(i, bp[0] + Math.sin(i * 2.4 + t) * 0.2, bp[1] + 2.2 + Math.cos(i * 1.7 + t * 1.3) * 0.2, bp[2], 1.0 + (i % 3) * 0.4, bk * 0.8);
    halo.commit();
  }
  update(0);
  return { object, update };
}
