// 兜率宫·八卦炉 — Laozi's palace on a terrace of white jade above the clouds. At its centre the great
// octagonal bronze furnace, eight trigrams on its faces, fire glowing through its vents; two furnace
// boys fan the coals while the Old Lord sits by. After forty-nine days the lid is lifted — the
// Monkey King bursts out (eyes smoked red-gold: 火眼金睛), kicks the furnace over, and burning bricks
// tumble off the edge of heaven into the clouds. They will fall to earth as the Flaming Mountains.
import { THREE, Builder, M, C, hall, roof, pine, cloud, fbm, noise2, hash2, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { monkeyKing, daoist, sage, crane, softField } from './_a_figs.js';

const CYCLE = 20;
const TOP = 2.2;                 // terrace height
const F = [0.3, TOP, 0.6];       // furnace centre (base)
const FR = 1.5, FH = 2.9;       // furnace radius / body height

const TRIGRAMS = ['111', '011', '101', '001', '110', '010', '100', '000'];   // 乾兑离震巽坎艮坤 (先天), lines bottom→top

// cauliflower billows: round bumps on a jittered grid
function clouds(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.35;
  const gx = Math.floor(x / 1.6), gz = Math.floor(z / 1.6);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const cx = (gx + i + 0.5 + (hash2(gx + i, gz + j) - 0.5) * 0.8) * 1.6, cz = (gz + j + 0.5 + (hash2(gz + j + 7, gx + i) - 0.5) * 0.8) * 1.6;
    const rr = 0.8 + 0.6 * hash2(gx + i + 3, gz + j + 5), d2 = (x - cx) ** 2 + (z - cz) ** 2;
    if (d2 < rr * rr) h = Math.max(h, 0.35 + Math.sqrt(rr * rr - d2) * (0.6 + 0.5 * hash2(gx + i + 11, gz + j)));
  }
  return Math.max(0.1, h * smooth(10.7, 9.4, r) + 0.12);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* cloud sea, bluish and cool beneath the terrace */
  const cl = new THREE.Color(), cLo = new THREE.Color('#9fb0c8'), cHi = new THREE.Color('#f4f2ee');
  softField(b, { R: 10.5, rings: 64, segs: 200, fn: clouds, colorFn: (x, y, z, nx, ny) => cl.copy(cLo).lerp(cHi, smooth(0.5, 0.95, ny) * smooth(0.3, 1.3, y)) });

  /* the white-jade terrace: three receding tiers with balustrades */
  const tiers = [[7.0, 0.0, 1.0], [6.6, 1.0, 0.7], [6.2, 1.7, 0.5]];
  for (const [r, y, h] of tiers) {
    b.cyl(r, r + 0.15, h, { y, seg: 12, color: '#e8e6dc', mat: M.stone });
    b.cyl(r + 0.02, r + 0.02, 0.06, { y: y + h - 0.12, seg: 12, color: '#b9b4a2', mat: M.stone });
  }
  // balustrade posts on the top edge, open toward the front-right where the bricks go over
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (a > 0.15 && a < 1.25) continue;
    const x = Math.cos(a) * 6.05, z = Math.sin(a) * 6.05;
    b.box(0.12, 0.42, 0.12, { x, y: TOP, z, ry: -a, color: '#f0eee6' });
    b.box(0.08, 0.06, 0.8, { x, y: TOP + 0.3, z, ry: -a, color: '#f0eee6' });
  }
  // a stair down the front
  for (let i = 0; i < 6; i++) b.box(1.8, 0.37, 0.4, { x: -2.8, y: TOP - 0.37 * (i + 1), z: 6.25 + i * 0.4, ry: 0.42, color: '#e8e6dc' });
  // paving and the bagua inlaid round the furnace
  b.cyl(5.9, 5.9, 0.03, { y: TOP, seg: 12, color: '#d8d4c4' });
  b.cyl(2.3, 2.3, 0.04, { x: F[0], y: TOP + 0.01, z: F[2], seg: 8, color: '#3c4a5a', mat: M.smooth });
  b.cyl(2.1, 2.1, 0.045, { x: F[0], y: TOP + 0.012, z: F[2], seg: 8, color: '#d8d4c4' });

  /* the hall behind (兜率宫), blue-tiled, and two side pavilions */
  hall(b, { x: 0, y: TOP, z: -3.8, w: 4.6, d: 2.2, h: 1.6, tiers: 2, roofColor: '#3d5f80', wall: '#efe9dc', pillar: C.cinnabar, beam: '#2f5d7c', lit: 0.4, r: rng });
  for (const sx of [-1, 1]) {
    b.box(0.6, 1.8, 0.6, { x: sx * 4.1, y: TOP, z: -2.4, color: '#efe9dc' });
    roof(b, { x: sx * 4.1, y: TOP + 1.8, z: -2.4, w: 0.7, d: 0.7, h: 0.5, color: '#3d5f80', finial: C.gold });
  }
  pine(b, { x: -4.6, y: TOP, z: 1.2, h: 2.6, r: rng, lean: 0.35 });
  pine(b, { x: 4.4, y: TOP, z: -0.6, h: 2.3, r: rng, lean: 0.3 });
  crane(b, { x: -3.6, y: TOP, z: 2.8, ry: 0.6, s: 1.5 });
  crane(b, { x: 3.6, y: TOP, z: -1.8, ry: -2.2, s: 1.4 });

  /* the Old Lord, the two furnace boys with fans */
  sage(b, { x: -3.0, y: TOP + 0.02, z: -0.9, ry: 0.75, s: 1.6, color: '#e6d9b8', trim: '#3d5f80', cushion: '#2f5d7c' });
  object.add(b.build());

  const boys = [];
  for (const [x, z, ry] of [[-1.5, 2.4, 2.4], [2.3, 2.2, -2.4]]) {
    const g = new THREE.Group();
    const bb = new Builder();
    daoist(bb, { kneel: true, color: '#3f7f8a', sash: C.cinnabar });
    g.add(bb.build());
    const fan = new THREE.Group();
    const fb = new Builder();
    fb.cyl(0.006, 0.006, 0.14, { color: C.woodD, mat: M.wood, seg: 4 });
    fb.cyl(0.12, 0.12, 0.012, { y: 0.2, rx: Math.PI / 2, seg: 10, color: '#d9c48a', mat: M.cloth });
    fan.add(fb.build());
    fan.position.set(0.1, 0.34, 0.12);
    g.add(fan);
    g.position.set(x, TOP, z); g.rotation.y = ry; g.scale.setScalar(1.25);
    g.userData.fan = fan;
    object.add(g);
    boys.push(g);
  }

  /* the furnace: pivots on its front-right base edge so it can be kicked over */
  const TIP = new THREE.Vector3(0.75, 0, 0.66).normalize();       // direction it falls (toward the open balustrade)
  const pivot = new THREE.Group();
  pivot.position.set(F[0] + TIP.x * FR, TOP, F[2] + TIP.z * FR);
  object.add(pivot);
  const furnace = new THREE.Group();
  furnace.position.set(-TIP.x * FR, 0, -TIP.z * FR);
  pivot.add(furnace);
  const bronze = '#8a6a3a', bronzeD = '#5a4224';
  {
    const fb = new Builder();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; fb.cyl(0.12, 0.2, 0.62, { x: Math.cos(a) * FR * 0.82, z: Math.sin(a) * FR * 0.82, color: bronzeD, mat: M.metal, seg: 6 }); fb.sphere(0.2, { x: Math.cos(a) * FR * 0.84, y: 0.05, z: Math.sin(a) * FR * 0.84, sy: 0.5, color: bronzeD, mat: M.metal, ws: 8, hs: 4 }); }
    fb.cyl(FR, FR * 0.9, 0.25, { y: 0.4, seg: 8, ry: Math.PI / 8, color: bronzeD, mat: M.metal });
    fb.cyl(FR * 0.96, FR, FH, { y: 0.62, seg: 8, ry: Math.PI / 8, color: bronze, mat: M.metal });
    fb.cyl(FR * 1.04, FR * 1.04, 0.12, { y: 0.62 + FH * 0.47, seg: 8, ry: Math.PI / 8, color: bronzeD, mat: M.metal });
    fb.cyl(FR * 1.1, FR * 1.1, 0.16, { y: 0.62 + FH - 0.08, seg: 8, ry: Math.PI / 8, color: bronzeD, mat: M.metal });
    // trigrams and vents on the eight faces
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const ap = FR * Math.cos(Math.PI / 8) * 0.99;
      fb.push({ x: Math.sin(a) * ap, y: 0.62, z: Math.cos(a) * ap, ry: a });
      TRIGRAMS[i].split('').forEach((bit, k) => {
        const yy = FH * 0.6 + k * 0.24;
        if (bit === '1') fb.box(0.78, 0.13, 0.05, { y: yy, color: '#f0c45a', mat: M.lacquer });
        else for (const sx of [-1, 1]) fb.box(0.32, 0.13, 0.05, { x: sx * 0.23, y: yy, color: '#f0c45a', mat: M.lacquer });
      });
      for (let v = 0; v < 3; v++) if (i !== 0 || v !== 1) fb.box(0.1, 0.42, 0.04, { x: (v - 1) * 0.26, y: FH * 0.18, color: '#ff8a2a', mat: M.glow, glow: 2.2 });
      fb.pop();
    }
    // the fire door on the front face
    const ap = FR * Math.cos(Math.PI / 8) * 0.995;
    fb.box(0.36, 0.5, 0.03, { y: 0.62 + FH * 0.12, z: ap, color: '#ffb04a', mat: M.glow, glow: 2.6 });
    // the open mouth (seen once the lid is gone)
    fb.cyl(FR * 0.85, FR * 0.85, 0.02, { y: 0.62 + FH + 0.08, seg: 8, ry: Math.PI / 8, color: '#ffa040', mat: M.glow, glow: 2.4 });
    furnace.add(fb.build());
  }
  const lid = new THREE.Group();
  {
    const lb = new Builder();
    lb.cyl(FR * 0.7, FR * 1.08, 0.5, { seg: 8, ry: Math.PI / 8, color: bronze, mat: M.metal });
    lb.cyl(FR * 0.72, FR * 0.72, 0.08, { y: 0.5, seg: 8, ry: Math.PI / 8, color: bronzeD, mat: M.metal });
    lb.cyl(0.25, FR * 0.6, 0.55, { y: 0.58, seg: 8, ry: Math.PI / 8, color: bronze, mat: M.metal });
    lb.cyl(0.12, 0.2, 0.3, { y: 1.12, seg: 8, color: bronzeD, mat: M.metal });
    lb.sphere(0.26, { y: 1.55, sy: 1.15, color: '#e0b04e', mat: M.lacquer });
    lid.add(lb.build());
  }
  const LID0 = new THREE.Vector3(F[0], TOP + 0.62 + FH + 0.08, F[2]);
  object.add(lid);

  /* bricks that spill and tumble off the edge */
  const NB = 18;
  const brickMat = new THREE.MeshStandardMaterial({ color: '#7a3a22', emissive: '#ff5a1a', emissiveIntensity: 1.6, roughness: 0.8 });
  const bricks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.28, 0.36), brickMat, NB);
  bricks.frustumCulled = false;
  object.add(bricks);
  const bd = Array.from({ length: NB }, (_, i) => ({ d: 0.022 * i + rng() * 0.02, spread: (rng() - 0.5) * 0.9, sp: 0.8 + rng() * 0.5, spin: [rng() * 6, rng() * 6] }));
  const smoke = softPuffs(NB * 3, { color: '#6a5048', opacity: 0.5 });
  const flame = softPuffs(30, { color: '#ff8a2a', opacity: 0.5, additive: true });
  const ventSmoke = softPuffs(16, { color: '#d8d2c8', opacity: 0.45 });
  object.add(smoke.points, flame.points, ventSmoke.points);

  /* Wukong: tucked for the leap, standing when he lands; eyes 火眼金睛 */
  const WS = 1.8;
  const mk = (legs, arms) => {
    const kb = new Builder();
    monkeyKing(kb, { legs, arms });
    for (const sx of [-1, 1]) kb.sphere(0.012, { x: sx * 0.022, y: 0.565, z: 0.09, color: '#ffcf4a', mat: M.glow, glow: 3, ws: 5, hs: 4 });
    const g = kb.build(); g.scale.setScalar(WS); object.add(g); return g;
  };
  const wkLeap = mk('tuck', [[0.6, 0], [-0.6, 0]]);
  const wkLand = mk('stride', [[Math.PI - 0.5, 0.2], [-0.9, 0.3]]);
  const LAND = [-1.4, TOP, 3.9];

  const tmpV = new THREE.Vector3(), tmpA = new THREE.Vector3();
  const AX = new THREE.Vector3(TIP.z, 0, -TIP.x);
  const mouthWorld = (out, tilt) => out.set(-TIP.x * FR, 0.62 + FH, -TIP.z * FR).applyAxisAngle(AX, tilt).add(pivot.position);

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    // shudder before the burst
    const sh = smooth(0.22, 0.4, u) * (1 - smooth(0.4, 0.42, u));
    const kick = smooth(0.5, 0.56, u) * (1 - smooth(0.86, 0.97, u));
    const tilt = kick * 0.42;
    // tilt the pivot about the axis perpendicular to TIP (in the ground plane)
    pivot.rotation.set(0, 0, 0);
    pivot.rotateOnWorldAxis(tmpA.set(TIP.z, 0, -TIP.x), tilt);
    furnace.position.set(-TIP.x * FR + Math.sin(t * 47) * 0.03 * sh, Math.abs(Math.sin(t * 31)) * 0.04 * sh, -TIP.z * FR + Math.cos(t * 53) * 0.03 * sh);
    // lid: rattles, bursts up spinning, lands on the terrace to the left, glides back at the reset
    const burst = clamp((u - 0.4) / 0.14);
    if (u < 0.4) {
      lid.position.set(LID0.x + Math.sin(t * 40) * 0.02 * sh, LID0.y + Math.abs(Math.sin(t * 37)) * 0.12 * sh, LID0.z);
      lid.rotation.set(Math.sin(t * 29) * 0.05 * sh, 0, 0);
    } else if (u < 0.88) {
      const p = burst, x = lerp(LID0.x, -3.2, p), z = lerp(LID0.z, 0.9, p);
      lid.position.set(x, LID0.y + Math.sin(Math.PI * p) * 4.5 - (LID0.y - TOP) * p, z);
      lid.rotation.set(p * 5.2, p * 3, p * 1.2 + (p >= 1 ? 0 : 0));
      if (p >= 1) lid.rotation.set(Math.PI * 0.5, 0.4, 0.2);
    } else {
      const p = ease(clamp((u - 0.88) / 0.1));
      lid.position.set(lerp(-3.2, LID0.x, p), lerp(TOP + 0.6, LID0.y, p) + Math.sin(Math.PI * p) * 1.0, lerp(0.9, LID0.z, p));
      lid.rotation.set(lerp(Math.PI * 0.5, 0, p), lerp(0.4, 0, p), lerp(0.2, 0, p));
    }
    // Wukong: leap 0.42→0.53, stands until 0.88, then fades away
    const lp = clamp((u - 0.42) / 0.11);
    const out = u > 0.42 && u < 0.97;
    wkLeap.visible = out && lp < 1;
    wkLand.visible = out && lp >= 1;
    if (wkLeap.visible) {
      wkLeap.position.set(lerp(F[0], LAND[0], lp), lerp(LID0.y - 0.6, LAND[1], lp) + Math.sin(Math.PI * lp) * 4.2, lerp(F[2], LAND[2], lp));
      wkLeap.rotation.set(-lp * Math.PI * 2, -0.5, 0);
    }
    if (wkLand.visible) {
      const fade = 1 - smooth(0.88, 0.96, u);
      wkLand.position.set(LAND[0], LAND[1], LAND[2]);
      wkLand.rotation.set(0, -0.35, 0);
      wkLand.scale.setScalar(WS * Math.max(0.001, fade));
    }
    // bricks: spill from the mouth as it tips, bounce once on the terrace, go over the edge, sink into cloud
    mouthWorld(tmpV, tilt);
    const mx = tmpV.x, my = tmpV.y, mz = tmpV.z;
    for (let i = 0; i < NB; i++) {
      const d = bd[i], p = clamp((u - 0.53 - d.d) / (0.3 * d.sp));
      if (p <= 0 || p >= 1) { setInst(bricks, i, 0, -50, 0, 0, 0.0001); smoke.set(i * 3, 0, -50, 0, 0, 0); smoke.set(i * 3 + 1, 0, -50, 0, 0, 0); smoke.set(i * 3 + 2, 0, -50, 0, 0, 0); continue; }
      const dirx = TIP.x + d.spread * TIP.z, dirz = TIP.z - d.spread * TIP.x;
      const dist = p * 9.5;
      const x = mx + dirx * dist, z = mz + dirz * dist;
      const r = Math.hypot(x, z);
      let y;
      if (r < 6.2) { const q = clamp(dist / 4.5); y = lerp(my, TOP + 0.12, q) + Math.sin(Math.PI * q) * 0.9 + (q >= 1 ? Math.abs(Math.sin((dist - 4.5) * 1.6)) * 0.35 : 0); }
      else { const fall = (r - 6.2); y = TOP + 0.12 - fall * fall * 0.45; }
      y = Math.max(y, clouds(x, z) - 0.25);
      const vis = 1 - smooth(0.8, 1, p);
      setInst(bricks, i, x, y, z, d.spin[0] + p * 6, Math.max(0.0001, vis), d.spin[1] + p * 9, p * 4);
      for (let k = 0; k < 3; k++) smoke.set(i * 3 + k, x - dirx * k * 0.35, y + 0.2 + k * 0.25, z - dirz * k * 0.35, 0.4 + k * 0.3, vis * (1 - k * 0.3));
    }
    bricks.instanceMatrix.needsUpdate = true;
    smoke.commit();
    // flames from the mouth once the lid is off
    const fireK = smooth(0.4, 0.44, u) * (1 - smooth(0.86, 0.95, u));
    for (let i = 0; i < 30; i++) {
      const p = (t * 0.6 + i / 30) % 1, a = i * 2.4;
      flame.set(i, mx + Math.cos(a) * 0.5 * (1 - p) + TIP.x * p * kick * 1.5, my + p * 2.2 * (1 - kick * 0.5), mz + Math.sin(a) * 0.5 * (1 - p) + TIP.z * p * kick * 1.5, 0.9 * (1 - p) + 0.3, fireK * Math.sin(Math.PI * p));
    }
    flame.commit();
    for (let i = 0; i < 16; i++) {
      const p = (t * 0.08 + i / 16) % 1, a = (i / 16) * Math.PI * 2;
      ventSmoke.set(i, F[0] + Math.cos(a) * 0.3 * p + p * 0.8, LID0.y + 1.6 + p * 5, F[2] + Math.sin(a) * 0.3 * p - p * 0.4, 0.3 + p * 1.6, (1 - fireK) * Math.sin(Math.PI * p) * 0.7);
    }
    ventSmoke.commit();
    // the boys fan; they stop and cower once the lid flies
    const scare = smooth(0.4, 0.45, u) * (1 - smooth(0.9, 0.98, u));
    boys.forEach((g, i) => { g.userData.fan.rotation.set(0, 0, (1 - scare) * Math.sin(t * 6 + i * 1.7) * 0.6); g.rotation.x = -scare * 0.25; });
    brickMat.emissiveIntensity = 1.4 + 0.3 * Math.sin(t * 9);
  }
  update(0);
  return { object, update };
}
