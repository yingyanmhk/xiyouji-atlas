// 高老庄 — a prosperous farm manor in the harvest month. Terraced fields climb the hill behind in
// gold; on the threshing floor the sheaves are stacked. 八戒, still the Gao family's son-in-law and
// the hardest worker they ever had ("耕田耙地，不用牛具"), rakes a harvested terrace with his
// nine-toothed rake. In the walled manor the daughter's back chamber is locked — and inside,
// Wukong waits disguised as her, while a little whirl of wind and cloud turns round the eaves.
import { THREE, Builder, M, C, terrain, peak, qinglv, rock, house, hall, roof, pine, figure, horse, fbm, noise2, hash2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { mortal } from './_b_kit.js';
import { nightLamps, houseLamps, hallLamps, nightDim } from './_c_util.js';

const HILL = [-2.4, -4.6];
const STEP = 0.5, NT = 7;
const terraceR = (k, a) => (7.4 - k * 1.0) * (1 + 0.1 * Math.sin(a * 3 + k * 0.7) + 0.06 * Math.sin(a * 5 - k));

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 1, z * 0.3 + 4, 3);
  return 0.22 + 0.25 * n + smooth(8.5, 10.4, r) * -0.05;
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* ground: meadow, the road to the gate, the stream */
  const roadCol = new THREE.Color('#c8ae7c'), meadow = new THREE.Color(), tmp = new THREE.Color();
  const road = (x, z) => Math.abs(x - (2.4 + 0.6 * Math.sin(z * 0.5))) < 0.42 && z > 3.6;
  terrain(b, { R: 10.5, rings: 34, segs: 120, fn: ground, palette: (x, y, z) => {
    if (road(x, z)) return roadCol;
    const n = noise2(x * 0.9, z * 0.9);
    return meadow.set('#8fa65a').lerp(tmp.set('#b9b064'), n * 0.8);
  } });

  /* the terraces: stacked contour slabs, gold on top, earth on the risers */
  const harvested = new Set([1, 4]);
  for (let k = 0; k < NT; k++) {
    const sh = new THREE.Shape();
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      let px = HILL[0] + Math.cos(a) * terraceR(k, a) * 1.15, pz = HILL[1] + Math.sin(a) * terraceR(k, a) * 0.8;
      const rr = Math.hypot(px, pz);
      if (rr > 10.2) { px *= 10.2 / rr; pz *= 10.2 / rr; }
      i === 0 ? sh.moveTo(px, -pz) : sh.lineTo(px, -pz);
    }
    const top = 0.2 + (k + 1) * STEP;
    const isH = harvested.has(k);
    b.extrude(sh, top, { rx: -Math.PI / 2, y: top / 2, curveSegments: 2, mat: M.flat, faceColor: (cx, cy, cz, nx, ny) => {
      if (ny > 0.9) {
        const j = hash2(cx * 7, cz * 7) * 0.08;
        return isH ? tmp.set('#a8884e').offsetHSL(0, 0, j - 0.04) : tmp.set(k % 2 ? '#d9b04a' : '#e2bd57').offsetHSL(0, 0, j - 0.04);
      }
      return cy > top - 0.08 ? tmp.set('#7d9a4c') : tmp.set('#a88a5c').offsetHSL(0, 0, (hash2(cx * 3, cy * 9) - 0.5) * 0.06);
    } });
  }
  // blue-green mountains behind the farm
  for (const [x, z, r, h] of [[-5.8, -7.6, 1.5, 6.5], [-2.0, -9.0, 1.3, 7.8], [1.6, -8.6, 1.2, 5.6], [4.6, -7.4, 1.0, 4.2], [-8.2, -4.6, 0.9, 3.6]]) {
    const tp = peak(b, { x, y: 0, z, r, h, lean: 0.12, rand: rng, palette: qinglv(h) });
    pine(b, { x: tp[0], y: tp[1] - 0.25, z: tp[2], h: 0.9 + rng() * 0.4, r: rng, lean: 0.4 });
  }
  // a little shrine and a pine on the hilltop
  const crest = 0.2 + NT * STEP;
  pine(b, { x: HILL[0] + 0.3, y: crest, z: HILL[1] - 0.2, h: 2.2, r: rng, lean: 0.3 });
  b.box(0.5, 0.45, 0.4, { x: HILL[0] - 0.6, y: crest, z: HILL[1] + 0.2, color: C.wall });
  roof(b, { x: HILL[0] - 0.6, y: crest + 0.45, z: HILL[1] + 0.2, w: 0.5, d: 0.4, color: C.tile });

  /* the manor 高家庄院 */
  const MX = 2.6, MZ = 1.0, y0 = 0.3;
  b.box(6.6, 0.12, 5.6, { x: MX, y: y0 - 0.1, z: MZ, color: '#cdbf9e' });
  const wallSeg = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
    b.box(0.2, 0.62, L, { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, ry, color: '#e8dcc2' });
    roof(b, { x: (x0 + x1) / 2, y: y0 + 0.62, z: (z0 + z1) / 2, ry, w: 0.2, d: L, h: 0.14, over: 0.1, lift: 0.02, flare: 0.01, color: C.tile });
  };
  wallSeg(MX - 3.2, MZ + 2.7, MX - 0.6, MZ + 2.7); wallSeg(MX + 0.6, MZ + 2.7, MX + 3.2, MZ + 2.7);
  wallSeg(MX - 3.2, MZ + 2.7, MX - 3.2, MZ - 2.7); wallSeg(MX + 3.2, MZ + 2.7, MX + 3.2, MZ - 2.7); wallSeg(MX - 3.2, MZ - 2.7, MX + 3.2, MZ - 2.7);
  // gate house
  b.box(1.3, 0.85, 0.5, { x: MX, y: y0, z: MZ + 2.7, color: '#e8dcc2' });
  b.box(0.6, 0.6, 0.04, { x: MX, y: y0, z: MZ + 2.96, color: C.cinnabar, mat: M.lacquer });
  roof(b, { x: MX, y: y0 + 0.85, z: MZ + 2.7, w: 1.3, d: 0.5, h: 0.32, color: C.tile });
  const lamps = nightLamps(), lanterns = nightLamps({ day: 0.6, night: 1.5 }), lb = new Builder();   // lit at night
  for (const sx of [-1, 1]) lb.sphere(0.08, { x: MX + sx * 0.45, y: y0 + 0.62, z: MZ + 3.0, sy: 1.3, color: '#e0503a', mat: lanterns.mat });
  // main hall, wings, kitchen
  hall(b, { x: MX, y: y0, z: MZ + 0.2, w: 2.6, d: 1.3, h: 0.95, base: 0.2, roofColor: C.tile, lit: 0.2, r: rng });
  hallLamps(lb, lamps.mat, { x: MX, y: y0, z: MZ + 0.2, w: 2.6, d: 1.3, h: 0.95, base: 0.2 });
  houseLamps(lb, lamps.mat, { x: MX - 2.3, y: y0, z: MZ + 0.9, ry: Math.PI / 2, w: 1.8, d: 0.9, h: 0.75 });
  houseLamps(lb, lamps.mat, { x: MX + 2.3, y: y0, z: MZ + 0.9, ry: -Math.PI / 2, w: 1.8, d: 0.9, h: 0.75 });
  house(b, { x: MX - 2.3, y: y0, z: MZ + 0.9, ry: Math.PI / 2, w: 1.8, d: 0.9, h: 0.75, lit: 0, r: rng });
  house(b, { x: MX + 2.3, y: y0, z: MZ + 0.9, ry: -Math.PI / 2, w: 1.8, d: 0.9, h: 0.75, lit: 0, r: rng });
  const KITCHEN = [MX + 2.25, MZ - 1.6];
  house(b, { x: KITCHEN[0], y: y0, z: KITCHEN[1], ry: -Math.PI / 2, w: 1.2, d: 0.9, h: 0.7, lit: 0, r: rng });
  b.box(0.16, 0.5, 0.16, { x: KITCHEN[0] + 0.2, y: y0 + 0.9, z: KITCHEN[1] + 0.2, color: '#9a8a78' });
  // the daughter's back chamber (绣楼): two storeys, its door locked
  const CH = [MX - 0.4, MZ - 1.9];
  b.box(1.6, 0.8, 1.0, { x: CH[0], y: y0, z: CH[1], color: '#efe4cc' });
  b.box(0.36, 0.55, 0.03, { x: CH[0], y: y0, z: CH[1] + 0.51, color: C.woodD, mat: M.wood });
  b.box(0.12, 0.08, 0.05, { x: CH[0], y: y0 + 0.32, z: CH[1] + 0.54, color: C.gold, mat: M.metal });             // the lock
  roof(b, { x: CH[0], y: y0 + 0.8, z: CH[1], w: 1.7, d: 1.1, h: 0.25, top: 0.45, color: C.tile });
  b.box(1.25, 0.65, 0.8, { x: CH[0], y: y0 + 0.86, z: CH[1], color: '#efe4cc' });
  b.box(1.4, 0.06, 0.95, { x: CH[0], y: y0 + 0.84, z: CH[1], color: C.cinnabar, mat: M.lacquer });             // balcony rail
  b.box(0.42, 0.3, 0.03, { x: CH[0], y: y0 + 1.05, z: CH[1] + 0.41, color: C.lamp, mat: M.glow, glow: 1.3 });  // a lit lattice window
  roof(b, { x: CH[0], y: y0 + 1.51, z: CH[1], w: 1.25, d: 0.8, h: 0.42, color: C.tile });
  // courtyard: a well, a tree, grain jars
  b.cyl(0.2, 0.22, 0.25, { x: MX + 1.0, y: y0, z: MZ + 1.6, color: C.rock, seg: 10 });
  for (let i = 0; i < 4; i++) b.lathe([[0, 0], [0.12, 0], [0.16, 0.12], [0.1, 0.26], [0.08, 0.28], [0, 0.28]], { x: MX - 1.7 + i * 0.3, y: y0, z: MZ - 0.9, color: '#6a4a32', mat: M.porcelain, seg: 10 });

  /* threshing floor 打谷场 */
  const TF = [-3.6, 4.4];
  b.cyl(2.3, 2.35, 0.08, { x: TF[0], y: ground(...TF) - 0.02, z: TF[1], color: '#d6c39a', seg: 36 });
  const ty = ground(...TF) + 0.06;
  for (const [dx, dz, s] of [[-1.3, -0.8, 1], [0.9, -1.2, 0.85], [-1.6, 0.6, 0.75]]) {   // stacks of sheaves
    b.lathe([[0, 0], [0.55, 0], [0.62, 0.35], [0.5, 0.8], [0.25, 1.08], [0, 1.2]].map(([r, y]) => [r * s, y * s]), { x: TF[0] + dx, y: ty, z: TF[1] + dz, color: '#d9ac48', mat: M.cloth, seg: 14 });
    b.cone(0.18 * s, 0.25 * s, { x: TF[0] + dx, y: ty + 1.15 * s, z: TF[1] + dz, color: '#b98a3a', mat: M.cloth, seg: 8 });
  }
  // a heap of threshed grain and the stone roller
  b.sphere(0.6, { x: TF[0] + 0.5, y: ty, z: TF[1] + 0.4, sy: 0.35, color: '#e8c25a', mat: M.cloth });
  b.cyl(0.18, 0.18, 0.55, { x: TF[0] + 1.3, y: ty + 0.18, z: TF[1] + 0.9, rz: Math.PI / 2, color: '#8d8a80', seg: 10 });
  for (let i = 0; i < 9; i++) {   // standing sheaves
    const a = rng() * Math.PI * 2, d = 1.9 + rng() * 0.6;
    b.cone(0.1, 0.42, { x: TF[0] + Math.cos(a) * d, y: ty, z: TF[1] + Math.sin(a) * d, color: '#d4a444', mat: M.cloth, seg: 6 });
  }
  // villagers winnowing and carrying
  mortal(b, 'girl', { x: TF[0] + 0.2, y: ty, z: TF[1] + 1.2, ry: 0.4, s: 1.0, robe: '#6a8aa0' });
  figure(b, 'villager', { x: TF[0] - 0.4, y: ty, z: TF[1] - 0.2, ry: 1.8, robe: '#5a7a6a' });
  figure(b, 'villager', { x: TF[0] + 1.6, y: ty, z: TF[1] - 0.4, ry: -0.6, robe: '#7a6a5a' });

  /* at the gate: 高太公 bowing to Tang Seng, the horse tied up */
  const gz = MZ + 3.6;
  mortal(b, 'oldman', { x: MX + 0.45, y: ground(MX + 0.45, gz), z: gz, ry: Math.PI + 0.4, s: 1.15, robe: '#7a5a3a' });
  figure(b, 'monk', { x: MX - 0.2, y: ground(MX - 0.2, gz + 0.5), z: gz + 0.5, ry: 0.3, s: 1.25 });
  horse(b, { x: MX - 1.4, y: ground(MX - 1.4, gz + 0.6), z: gz + 0.6, ry: 1.2, s: 1.15 });

  /* persimmon and willow trees round the farm */
  const tree = (x, z, h, fruit) => {
    const y = ground(x, z);
    const pts = [[x, y, z], [x + 0.1, y + h * 0.4, z + 0.05], [x - 0.05, y + h * 0.7, z - 0.05]];
    b.tube(pts, (t) => h * 0.05 * (1 - t * 0.5), { color: C.bark, mat: M.wood, radial: 6 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rng(), d = h * (0.18 + rng() * 0.18);
      b.ico(h * (0.2 + rng() * 0.08), { x: x + Math.cos(a) * d, y: y + h * (0.72 + rng() * 0.25), z: z + Math.sin(a) * d, sy: 0.75, color: rng.pick(fruit ? ['#c98a3a', '#b8762e', '#d9a441', '#9a8a3a'] : ['#8fa04a', '#a8a84a', '#7d9a46']), mat: M.flat });
    }
    if (fruit) for (let i = 0; i < 10; i++) {
      const a = rng() * Math.PI * 2, d = h * (0.3 + rng() * 0.12);
      b.sphere(h * 0.04, { x: x + Math.cos(a) * d, y: y + h * (0.65 + rng() * 0.3), z: z + Math.sin(a) * d, color: '#e2622a', mat: M.smooth, ws: 8, hs: 6 });
    }
  };
  for (const [x, z, h, f] of [[MX - 1.4, MZ + 1.6, 1.5, true], [6.6, -1.2, 1.9, true], [6.9, 3.8, 1.6, false], [-0.3, 6.6, 1.7, true], [-6.6, 2.2, 1.8, false], [0.4, 3.0, 1.4, false], [5.4, 6.0, 1.5, true], [-7.2, 5.6, 1.4, true]]) tree(x, z, h, f);
  // vegetable plots with their rows, and a bamboo fence
  for (const [px, pz, w, d, ry] of [[6.4, 1.8, 2.0, 1.4, 0.1], [-6.6, -0.4, 1.6, 2.2, -0.3], [-0.6, 7.6, 1.8, 1.1, 0.2]]) {
    const py = ground(px, pz);
    b.box(w, 0.06, d, { x: px, y: py - 0.02, z: pz, ry, color: '#7a6040' });
    for (let i = 0; i < 6; i++) b.box(w * 0.9, 0.08, 0.08, { x: px - Math.sin(ry) * (-d / 2 + (i + 0.5) * d / 6), y: py + 0.02, z: pz - Math.cos(ry) * (d / 2 - (i + 0.5) * d / 6), ry, color: i % 2 ? '#5e8f4f' : '#6f9a50', mat: M.flat });
  }
  for (let i = 0; i < 26; i++) {
    const a = -0.4 + i * 0.07, x = 3.0 + Math.cos(a) * 6.3, z = 1.0 + Math.sin(a) * 6.3;
    if (Math.hypot(x, z) > 10) continue;
    b.cyl(0.02, 0.02, 0.4, { x, y: ground(x, z) - 0.02, z, color: '#b8a46a', mat: M.wood, seg: 4 });
  }
  // a few boulders at the field edges
  for (let i = 0; i < 8; i++) {
    const [x, z] = rng.inDisc(10, 8.5);
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.3, h: 0.3 + rng() * 0.4, rand: rng, color: '#a59a80' });
  }
  object.add(b.build(), lb.build());

  /* ------------------------------------------- standing grain (instanced) --- */
  const sb = new Builder();
  for (let i = 0; i < 4; i++) {
    const a = i * 1.57 + 0.3, d = 0.055, hh = 0.26 + (i % 3) * 0.04;
    sb.cone(0.012, hh, { x: Math.cos(a) * d, z: Math.sin(a) * d, rz: Math.cos(a) * 0.15, rx: Math.sin(a) * 0.15, color: '#c9a443', mat: M.cloth, seg: 3, open: true });
    sb.cone(0.03, 0.1, { x: Math.cos(a) * (d + 0.03), y: hh - 0.03, z: Math.sin(a) * (d + 0.03), rx: Math.PI + 0.5, color: i % 2 ? '#e6c25a' : '#d8b04a', mat: M.cloth, seg: 3, open: true });
  }
  const stalkGeo = sb.merged();
  const stalks = [];
  for (let k = 0; k < NT - 1; k++) {
    if (harvested.has(k)) continue;
    const top = 0.2 + (k + 1) * STEP;
    for (let i = 0; i < 300; i++) {
      const a = rng() * Math.PI * 2;
      const r0 = terraceR(k + 1, a) + 0.12, r1 = terraceR(k, a) - 0.08;
      if (r1 <= r0) continue;
      const rr = lerp(r0, r1, rng());
      const x = HILL[0] + Math.cos(a) * rr * 1.15, z = HILL[1] + Math.sin(a) * rr * 0.8;
      if (Math.hypot(x, z) > 10.0) continue;
      stalks.push({ x, y: top, z, ry: rng() * 6.28, s: 0.9 + rng() * 0.5 });
    }
  }
  const grain = new THREE.InstancedMesh(stalkGeo, M.cloth, stalks.length);
  grain.castShadow = false; grain.receiveShadow = true;
  object.add(grain);

  /* --------------------------------------------- 八戒 raking a terrace --- */
  const BK = 1;   // harvested terrace he works
  const bajie = new THREE.Group();
  {
    const bb = new Builder();
    figure(bb, 'bajie', { pose: 'none', s: 1.9 });
    bajie.add(bb.build());
  }
  const rake = new THREE.Group();   // pivot at his hands
  {
    const rb = new Builder();
    rb.cyl(0.024, 0.024, 1.1, { rx: Math.PI / 2, z: 0.55, y: 0, color: C.wood, mat: M.wood, seg: 5 });
    rb.box(0.34, 0.07, 0.07, { z: 1.1, y: -0.02, color: '#9aa0a6', mat: M.metal });
    for (let i = 0; i < 9; i++) rb.cyl(0.011, 0.006, 0.16, { x: -0.15 + i * 0.0375, y: -0.12, z: 1.1, color: '#9aa0a6', mat: M.metal, seg: 4 });
    for (const sx of [-1, 1]) rb.cyl(0.03, 0.035, 0.3, { x: sx * 0.1, y: 0.05, z: -0.12, rx: 1.2, color: '#3d3c40', mat: M.smooth, seg: 6 });   // arms
    rake.add(rb.build());
  }
  rake.position.set(0, 0.62, 0.15);
  rake.scale.setScalar(1.2);
  rake.position.multiplyScalar(1.9 / 1.75);
  bajie.add(rake);
  object.add(bajie);
  const furrow = softPuffs(14, { color: '#9a7a52', opacity: 0.5 });
  object.add(furrow.points);

  /* the whirl of wind and cloud round the chamber */
  const WH = 40;
  const whirl = softPuffs(WH, { color: '#fbf8f0', opacity: 0.9 });
  object.add(whirl.points);
  const SMK = 16;
  const smoke = softPuffs(SMK, { color: '#e2ddd2', opacity: 0.45 });
  object.add(smoke.points);
  // sparrows over the stubble
  const birdB = new Builder();
  birdB.sphere(0.035, { sz: 1.6, color: '#5a4636', mat: M.smooth, ws: 6, hs: 4 });
  for (const sx of [-1, 1]) birdB.box(0.09, 0.006, 0.04, { x: sx * 0.05, rz: sx * 0.3, color: '#5a4636', mat: M.smooth });
  const NB = 9;
  const birds = new THREE.InstancedMesh(birdB.merged(), M.smooth, NB);
  object.add(birds);

  const dimPuffs = nightDim([whirl, smoke], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    lamps.update(env?.night ?? 0); lanterns.update(env?.night ?? 0);
    // grain sways in a travelling breeze
    for (let i = 0; i < stalks.length; i++) {
      const s = stalks[i];
      const w = Math.sin(t * 1.3 - s.x * 0.6 - s.z * 0.35) * 0.18 + Math.sin(t * 2.7 + s.ry) * 0.04;
      setInst(grain, i, s.x, s.y, s.z, s.ry, s.s, w, w * 0.4);
    }
    grain.instanceMatrix.needsUpdate = true;
    // Bajie works along the terrace and back (24 s), raking with a steady stroke
    const p = (t / 24) % 1, q = p < 0.5 ? p * 2 : 2 - p * 2;      // 0→1→0
    const a = lerp(1.25, 2.55, q * q * (3 - 2 * q));
    const rr = (terraceR(BK + 1, a) + terraceR(BK, a)) / 2;
    const top = 0.2 + (BK + 1) * STEP;
    const x = HILL[0] + Math.cos(a) * rr * 1.15, z = HILL[1] + Math.sin(a) * rr * 0.8;
    const dir = p < 0.5 ? 1 : -1;
    // face along the contour, rake reaching to the outer edge
    const tx = -Math.sin(a) * 1.15 * dir, tz = Math.cos(a) * 0.8 * dir;
    bajie.position.set(x, top, z);
    bajie.rotation.y = Math.atan2(tx, tz) + dir * 0.35;   // along the contour, turned a little toward the open edge
    const stroke = Math.sin(t * 2.4);
    rake.rotation.set(0.47 + stroke * 0.05, 0, 0);
    rake.position.z = 0.16 + stroke * 0.12;
    bajie.position.y = top + Math.abs(stroke) * 0.015;
    for (let i = 0; i < 14; i++) {
      const pp = (t * 0.5 + i / 14) % 1;
      furrow.set(i, x + Math.sin(i * 2.1) * 0.3 + tx * 0.6, top + 0.05 + pp * 0.4, z + Math.cos(i * 1.7) * 0.3 + tz * 0.6, 0.25 + pp * 0.4, 0.5 * (1 - pp) * Math.abs(stroke));
    }
    furrow.commit();
    // the whirl
    for (let i = 0; i < WH; i++) {
      const f = i / WH, ang = t * (0.8 + f * 0.4) + f * Math.PI * 6;
      const R = 1.1 + 0.25 * Math.sin(t * 0.7 + f * 9);
      whirl.set(i, CH[0] + Math.cos(ang) * R, y0 + 1.0 + f * 1.4 + Math.sin(t + f * 7) * 0.12, CH[1] + Math.sin(ang) * R * 0.8, 0.35 + 0.35 * Math.sin(Math.PI * f), 0.55 + 0.3 * Math.sin(t * 1.1 + f * 5));
    }
    whirl.commit();
    for (let i = 0; i < SMK; i++) {
      const pp = (t * 0.09 + i / SMK) % 1;
      smoke.set(i, KITCHEN[0] + 0.2 + pp * 0.7, y0 + 1.4 + pp * 2.6, KITCHEN[1] + 0.2 - pp * 0.3, 0.3 + pp * 0.9, Math.sin(Math.PI * pp));
    }
    smoke.commit();
    for (let i = 0; i < NB; i++) {
      const ph = (t * 0.07 + i * 0.11) % 1, ang = i * 0.7 + t * 0.25;
      const hop = Math.sin(ph * Math.PI);
      setInst(birds, i, HILL[0] + 2.5 + Math.cos(ang) * (2.2 + i * 0.15), 3.6 + hop * 1.2 + i * 0.08, HILL[1] + 3.2 + Math.sin(ang) * 1.5, -ang, 1.2, 0, Math.sin(t * 9 + i) * 0.3);
    }
    birds.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { object, update };
}
