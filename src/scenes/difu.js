// 幽冥地府·森罗殿 — the dark court of the Ten Kings among black crags, ghost-blue lamps under
// the eaves, judges standing in ranks. Before the hall the Monkey King has the 生死簿 open on a desk
// and with one stroke of the brush strikes out his whole tribe (一概勾之) — the only warm things
// down here are the monkey and his golden line. In front the black river and 奈何桥, where pale
// souls cross in a slow file.
import { THREE, Builder, M, C, terrain, peak, rock, roof, archBridge, bareTree, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { monkeyKing, monkeyArm, daoist, tinted } from './_a_figs.js';

const CYCLE = 14;
const RIVER = 0.32;
const riverZ = (x) => 5.0 + 0.6 * Math.sin(x * 0.35 + 1.2);
const COURT = 0.7;

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.4 + 9, z * 0.4 + 1, 4);
  let h = COURT + 0.15 * (n - 0.5);
  const dr = Math.abs(z - riverZ(x));
  h = lerp(0.08, h, smooth(0.9, 1.9, dr));                                       // river bed
  h += smooth(-2, -7.5, z) * (1.2 + 3 * n) * smooth(1.5, 5.5, Math.abs(x) + (z < -4 ? 3 : 0)); // crags behind
  h += smooth(6.8, 9.8, r) * (0.6 + 1.6 * n) * smooth(6, 3, Math.abs(z - riverZ(x)) * 2);
  return Math.max(0.06, h * smooth(10.7, 9.8, r) + 0.06);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const basalt = tinted(4, { cliff: [[0, '#4a4b50'], [0.5, '#3a3d46'], [1, '#2c2f39']], ledge: [[0, '#5a5c5e'], [0.5, '#4f5558'], [1, '#454c52']], shade: 0.8 });
  const bed = new THREE.Color('#141a20');
  terrain(b, { R: 10.5, rings: 44, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < RIVER + 0.02 ? bed : basalt(x, y, z, nx, ny, nz)) });

  // black crags of the underworld
  const crags = [[-6.0, -5.8, 1.7, 7.4, 0.2, 0.75], [-3.0, -7.9, 1.2, 11.5, 0.08, 0.92], [1.2, -7.6, 1.9, 9.0, 0.05, 0.6], [4.4, -7.2, 1.3, 12.5, 0.14, 0.9], [7.0, -4.8, 1.2, 6.0, 0.25, 0.8], [-8.2, -2.4, 1.0, 3.8, 0.3, 0.7], [8.4, -1.6, 0.8, 3.0, 0.3, 0.7], [-0.8, -6.6, 0.7, 6.0, 0.18, 0.95]];
  for (const [x, z, r, h, lean, taper] of crags) {
    const y = ground(x, z) - 0.3;
    peak(b, { x, y, z, r, h, lean, taper, rand: rng, steps: 4, palette: tinted(h, { base: y, cliff: [[0, '#4a4646'], [0.4, '#3a3a44'], [1, '#262833']], ledge: [[0, '#55595e'], [1, '#3f4650']], shade: 0.78 }) });
  }

  /* 森罗殿: an open hall — platform, columns, back wall, great dark roof */
  const HZ = -3.6, HW = 8.2, HD = 3.4, HB = 0.55, HH = 2.4;
  b.box(HW + 1.0, HB, HD + 1.0, { x: 0, y: COURT - 0.05, z: HZ, color: '#55575a' });
  for (let i = 0; i < 5; i++) b.box(2.2, HB * (1 - i / 5), 0.22, { x: 0, y: COURT - 0.05, z: HZ + (HD + 1) / 2 + 0.11 + i * 0.22, color: '#55575a' });
  const Y0 = COURT - 0.05 + HB;
  b.box(HW, HH, 0.3, { x: 0, y: Y0, z: HZ - HD / 2 + 0.15, color: '#2e3036' });
  for (const sx of [-1, 1]) b.box(0.3, HH, HD, { x: sx * (HW / 2 - 0.15), y: Y0, z: HZ, color: '#2e3036' });
  for (let i = 0; i < 7; i++) b.cyl(0.12, 0.13, HH, { x: -HW / 2 + (HW * i) / 6, y: Y0, z: HZ + HD / 2, color: '#4a2f2c', mat: M.lacquer, seg: 10 });
  b.box(HW + 0.3, 0.28, HD + 0.3, { x: 0, y: Y0 + HH - 0.28, z: HZ, color: '#2f3d48', mat: M.smooth });
  b.box(HW + 0.36, 0.05, HD + 0.36, { x: 0, y: Y0 + HH - 0.3, z: HZ, color: '#6a6248', mat: M.smooth });
  roof(b, { x: 0, y: Y0 + HH, z: HZ, w: HW, d: HD, h: 1.9, color: '#26292f', ridge: '#16181c' });
  // the long bench of the Ten Kings and the kings themselves
  b.box(HW - 1.2, 0.55, 0.7, { x: 0, y: Y0, z: HZ - 0.2, color: '#3b2a26', mat: M.lacquer });
  b.box(HW - 1.1, 0.04, 0.78, { x: 0, y: Y0 + 0.55, z: HZ - 0.2, color: '#5a4a3a', mat: M.lacquer });
  for (let i = 0; i < 10; i++) {
    const x = -HW / 2 + 0.95 + i * ((HW - 1.9) / 9);
    daoist(b, { x, y: Y0 + 0.1, z: HZ - 0.85, s: 1.12, kneel: true, color: rng.pick(['#56606c', '#5e5864', '#52605a']), sash: '#8a8064', beard: true, hat: 'crown' });
    b.cyl(0.03, 0.03, 0.12, { x: x + 0.3, y: Y0 + 0.59, z: HZ + 0.05, color: '#a6e4f2', mat: M.glow, glow: 1.4, seg: 6 });
  }
  b.box(HW - 1.0, 0.9, 0.02, { x: 0, y: Y0 + 0.75, z: HZ - HD / 2 + 0.32, color: '#3f6f80', mat: M.glow, glow: 0.55 });   // cold light behind the kings
  // ledger shelves at the back wall
  for (let i = 0; i < 6; i++) b.box(0.9, 0.7, 0.3, { x: -3.2 + i * 1.28, y: Y0, z: HZ - HD / 2 + 0.5, color: '#2a2422', mat: M.wood });

  /* the courtyard: dark flagstones, two ranks of judges */
  b.box(9.0, 0.05, 4.4, { x: 0, y: COURT - 0.03, z: 0.6, color: '#4a4c50' });
  for (let i = 0; i < 6; i++) b.box(9.0, 0.01, 0.03, { x: 0, y: COURT + 0.025, z: -1.4 + i * 0.8, color: '#3a3c40' });
  // the desk with the ledger before the hall (Wukong stands behind it, facing out)
  const DX = 0.4, DZ = 1.2, DH = 0.42, PZ = DZ - 0.12;
  b.box(1.5, DH, 0.6, { x: DX, y: COURT, z: DZ, color: '#3b2a26', mat: M.lacquer });
  b.box(1.6, 0.04, 0.68, { x: DX, y: COURT + DH, z: DZ, color: '#5a4a3a', mat: M.lacquer });
  for (const sx of [-1, 1]) {
    b.box(0.5, 0.025, 0.36, { x: DX + sx * 0.255, y: COURT + DH + 0.04, z: PZ, rz: -sx * 0.06, color: '#d6ccb2', mat: M.smooth });
    for (let k = 0; k < 6; k++) b.box(0.012, 0.004, 0.34, { x: DX + sx * 0.255 + (k - 2.5) * 0.065, y: COURT + DH + 0.066 + (sx > 0 ? -(k - 2.5) : (k - 2.5)) * 0.004 + 0.012, z: PZ, color: '#5a5450', mat: M.smooth });
  }
  b.box(0.04, 0.03, 0.38, { x: DX, y: COURT + DH + 0.04, z: PZ, color: '#3a2a20', mat: M.smooth });
  b.box(0.12, 0.08, 0.1, { x: DX - 0.6, y: COURT + DH + 0.04, z: DZ + 0.2, color: '#1e1c1c', mat: M.smooth });   // ink stone
  object.add(b.build());

  const jb = new Builder();
  daoist(jb, { color: '#3f4a46', sash: '#6a6248', hat: 'official', beard: true });
  const jPos = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) jPos.push([sx * (3.2 + (i % 2) * 0.55), COURT, -1.2 + i * 0.6, -sx * Math.PI / 2 + sx * 0.25]);
  jPos.push([-1.6, COURT, 2.1, 0.5], [-2.1, COURT, 2.6, 0.7]);   // two judges cowering at the desk
  const judges = new THREE.InstancedMesh(jb.merged(), M.cloth, jPos.length);
  jPos.forEach(([x, y, z, ry], i) => setInst(judges, i, x, y, z, ry, 1.1));
  judges.castShadow = judges.receiveShadow = true;
  object.add(judges);
  // 牛头马面 at the bridge head
  const gb = new Builder();
  daoist(gb, { x: -3.6, y: ground(-3.6, 3.3), z: 3.3, ry: 0.6, s: 1.4, color: '#2a2a2e', sash: '#4a4644', hat: 'none' });
  gb.cone(0.04, 0.16, { x: -3.66, y: ground(-3.6, 3.3) + 0.96, z: 3.3, rz: 0.6, color: '#bdb6a2', mat: M.smooth, seg: 5 });
  gb.cone(0.04, 0.16, { x: -3.48, y: ground(-3.6, 3.3) + 0.96, z: 3.36, rz: -0.6, color: '#bdb6a2', mat: M.smooth, seg: 5 });
  daoist(gb, { x: -1.6, y: ground(-1.6, 3.4), z: 3.4, ry: -0.4, s: 1.4, color: '#2e2a28', sash: '#4a4644', hat: 'none' });
  gb.box(0.07, 0.07, 0.16, { x: -1.6, y: ground(-1.6, 3.4) + 0.84, z: 3.47, color: '#3a3430', mat: M.smooth });       // the long horse face
  for (const [x, z, a] of [[-3.6, 3.3, 0.6], [-1.6, 3.4, -0.4]]) gb.cyl(0.012, 0.012, 1.3, { x: x + Math.cos(a) * 0.22, y: ground(x, z), z: z - Math.sin(a) * 0.22, color: '#3a3a3a', mat: M.metal, seg: 4 });

  /* 奈何桥 over the black river */
  const BX = -2.6;
  archBridge(gb, { from: [BX, COURT - 0.05, riverZ(BX) - 1.9], to: [BX - 0.3, ground(BX - 0.3, riverZ(BX) + 2.1), riverZ(BX) + 2.1], w: 0.8, rise: 0.75, color: '#6a6c6e' });
  // rocks along the far bank
  for (let i = 0; i < 12; i++) {
    const x = rng.range(-9, 9), z = riverZ(x) + rng.range(1.4, 3.6) * (rng() < 0.5 ? -1 : 1);
    if (Math.hypot(x, z) > 9.6 || Math.abs(x - BX) < 1.2 || (Math.abs(x) < 4.6 && z < 3.5)) continue;
    rock(gb, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.4 + rng() * 0.8, rand: rng, palette: tinted(1.4, { base: ground(x, z), cliff: [[0, '#3f4044'], [1, '#2e3038']], ledge: [[0, '#4f5356'], [1, '#454a50']] }) });
  }
  for (const [x, z] of [[5.4, 3.0], [6.8, 6.6], [-6.4, 6.2], [3.0, 7.6], [-7.2, 3.0]]) bareTree(gb, { x, y: ground(x, z) - 0.05, z, h: 1.3 + rng() * 0.8, r: rng, color: '#232326' });
  // ghost lamps: on posts along the court, hanging under the eaves, at the bridge
  const lampPos = [];
  for (let i = 0; i < 6; i++) lampPos.push([-HW / 2 + 0.68 + i * ((HW - 1.36) / 5), Y0 + HH - 0.75, HZ + HD / 2 + 0.05, true]);
  for (const sx of [-1, 1]) for (const z of [-0.6, 1.6]) lampPos.push([sx * 4.4, COURT + 1.25, z, false]);
  lampPos.push([BX - 0.6, ground(BX - 0.6, riverZ(BX) - 1.9) + 1.1, riverZ(BX) - 1.9, false], [BX + 0.5, ground(BX + 0.5, riverZ(BX) - 1.9) + 1.1, riverZ(BX) - 1.9, false]);
  for (const [x, y, z, hang] of lampPos) {
    if (hang) gb.cyl(0.008, 0.008, 0.5, { x, y: y + 0.2, z, color: '#222', mat: M.smooth, seg: 3 });
    else gb.cyl(0.03, 0.04, y - ground(x, z) - 0.15, { x, y: ground(x, z), z, color: '#2a2a2a', mat: M.smooth, seg: 5 });
    gb.cyl(0.11, 0.11, 0.26, { x, y: y - 0.13, z, seg: 8, color: '#a6e4f2', mat: M.glow, glow: 1.6 });
    gb.cyl(0.13, 0.11, 0.04, { x, y: y + 0.12, z, seg: 8, color: '#1e1e1e', mat: M.smooth });
  }
  object.add(gb.build());

  /* the black river */
  const river = new THREE.Mesh(new THREE.CircleGeometry(10.5, 72), new THREE.MeshStandardMaterial({ color: '#1b2630', roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.9 }));
  river.rotation.x = -Math.PI / 2; river.position.y = RIVER;
  object.add(river);

  /* Wukong at the ledger, brush in hand */
  const WS = 1.7;
  const wk = new THREE.Group();
  { const kb = new Builder(); monkeyKing(kb, { noArms: true, staffLen: 0 }); monkeyArm(kb, { x: -0.09, y: 0.43, rx: 1.9 }); wk.add(kb.build()); }
  const arm = new THREE.Group();
  arm.position.set(0.09, 0.43, 0);
  { const ab = new Builder(); monkeyArm(ab, { rx: 1.75 }); ab.cyl(0.006, 0.009, 0.12, { y: -0.13, z: 0.215, rx: -0.3, color: '#2a1e18', mat: M.wood, seg: 4 }); ab.cone(0.012, 0.035, { y: -0.13, z: 0.215, rx: Math.PI - 0.3, color: '#151212', mat: M.smooth, seg: 4 }); arm.add(ab.build()); }
  wk.add(arm);
  wk.scale.setScalar(WS);
  wk.position.set(DX - 0.15, COURT, DZ - 0.5);
  object.add(wk);
  // his staff leaning against the desk
  { const sb = new Builder(); sb.cyl(0.024, 0.024, 1.7, { color: '#2e2d31', mat: M.lacquer, seg: 6 }); for (const e of [0, 1.53]) sb.cyl(0.03, 0.03, 0.17, { y: e, color: '#f0c45a', mat: M.lacquer, seg: 6 }); const st = sb.build(); st.position.set(DX + 0.85, COURT, DZ + 0.2); st.rotation.z = 0.28; object.add(st); }

  /* the golden stroke: dots along the brush-tip path, revealed as he writes */
  const NS = 40;
  const sg = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb83a').multiplyScalar(3.4) }), NS);
  sg.frustumCulled = false;
  object.add(sg);
  const tip = new THREE.Vector3(), base = new THREE.Vector3();
  const _eu = new THREE.Euler();
  const tipAt = (ry, out) => out.set(0, -0.16, 0.24).applyEuler(_eu.set(0, ry, 0)).add(base.set(0.09, 0.43, 0)).multiplyScalar(WS).add(wk.position);
  const strokePts = [];
  for (let i = 0; i < NS; i++) { const p = tipAt(lerp(0.75, -0.75, i / (NS - 1)), new THREE.Vector3()); p.y = COURT + DH + 0.08; strokePts.push(p); }
  const spark = softPuffs(8, { color: '#ffd27a', opacity: 0.8, additive: true });
  object.add(spark.points);

  /* souls crossing the bridge; ghost fires; low murk */
  const NG = 6;
  const ghost = softPuffs(NG * 2, { color: '#cfe4ea', opacity: 0.38 });
  const fires = softPuffs(22, { color: '#8fe0f0', opacity: 0.8, additive: true });
  const murk = softPuffs(30, { color: '#3a4450', opacity: 0.35 });
  object.add(ghost.points, fires.points, murk.points);
  const fd = Array.from({ length: 22 }, () => { const [x, z] = rng.inDisc(9.2, 2); return { x, z, ph: rng() * 9, y: 0.8 + rng() * 2.4 }; });
  const md = Array.from({ length: 30 }, () => { const x = rng.range(-9.5, 9.5); return { x, z: riverZ(x) + rng.range(-1, 1), ph: rng() * 9, s: 1.5 + rng() * 2 }; });
  const B0 = [BX - 0.3, riverZ(BX) + 2.1], B1 = [BX, riverZ(BX) - 1.9];

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    const w = smooth(0.15, 0.55, u);                       // writing progress
    const ry = u < 0.15 ? lerp(-0.75, 0.75, smooth(0, 0.15, u)) : lerp(0.75, -0.75, w);
    arm.rotation.set(0, ry, 0);
    const lift = (u < 0.15 || u > 0.55) ? 0.2 : 0;
    arm.rotation.x = -lift * 0.6;
    const fade = 1 - smooth(0.88, 0.98, u);
    for (let i = 0; i < NS; i++) {
      const on = i / (NS - 1) <= w + 0.001 && u >= 0.15 ? fade : 0;
      const p = strokePts[i], q = strokePts[Math.min(NS - 1, i + 1)];
      setInst(sg, i, p.x, p.y, p.z, Math.atan2(q.x - p.x, q.z - p.z), on > 0 ? [0.035, 0.012, 0.05] : 0.0001);
    }
    sg.instanceMatrix.needsUpdate = true;
    tipAt(ry, tip);
    for (let i = 0; i < 8; i++) {
      const p = ((t * 1.3 + i / 8) % 1);
      spark.set(i, tip.x + Math.sin(i * 2.3) * 0.05 * p, COURT + DH + 0.1 + p * 0.25, tip.z + Math.cos(i * 1.7) * 0.05 * p, 0.06 + 0.1 * (1 - p), (u > 0.15 && u < 0.55 ? 1 : 0.15) * (1 - p));
    }
    spark.commit();
    // souls in a slow file over the bridge (two puffs each: body and head)
    for (let i = 0; i < NG; i++) {
      const p = (t * 0.025 + i / NG) % 1;
      const x = lerp(B0[0], B1[0], p), z = lerp(B0[1], B1[1], p);
      const y = lerp(ground(B0[0], B0[1]), COURT, p) + Math.sin(Math.PI * p) * 0.75 + 0.1;
      const a = smooth(0, 0.1, p) * (1 - smooth(0.9, 1, p));
      ghost.set(i * 2, x, y + 0.25, z, 0.45, a * 0.8);
      ghost.set(i * 2 + 1, x, y + 0.55, z, 0.24, a);
    }
    ghost.commit();
    for (let i = 0; i < 22; i++) { const f = fd[i]; fires.set(i, f.x + Math.sin(t * 0.3 + f.ph) * 0.4, f.y + Math.sin(t * 0.5 + f.ph * 2) * 0.3, f.z + Math.cos(t * 0.27 + f.ph) * 0.4, 0.12 + 0.05 * Math.sin(t * 2 + f.ph), 0.5 + 0.5 * Math.sin(t * 0.8 + f.ph)); }
    fires.commit();
    for (let i = 0; i < 30; i++) { const m = md[i]; murk.set(i, m.x + Math.sin(t * 0.1 + m.ph) * 0.8, RIVER + 0.3, m.z, m.s, 0.6 + 0.4 * Math.sin(t * 0.3 + m.ph)); }
    murk.commit();
  }
  update(0);
  return { object, update };
}
