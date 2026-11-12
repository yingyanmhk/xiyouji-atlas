// 朱紫国 (ch.68–71) — the palace of the Purple-and-Vermilion kingdom, drawn open like a 界画 cutaway.
// In the bedchamber (right) the ailing king lies behind purple silk curtains; three golden silk
// threads tied at his wrist run out of the chamber, along the covered gallery and into the
// antechamber (left), where Wukong holds them between his fingers and reads the pulse (悬丝诊脉).
// The threads are the image: a bead of light travels each one like a heartbeat. On the ridge of
// the bedchamber crouches the golden-maned 金毛犼 with its three purple-gold bells — the cause of the
// king's grief, who carried off his queen. Loop 9 s (three beats per thread, out of step).
import { THREE, Builder, M, C, terrain, peak, qinglv, archBridge, roof, pavilion, pine, rock, figure, fbm, smooth, lerp, clamp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { stonePal } from './_d_util.js';

const CYCLE = 9;
const TY = 0.75;                                   // terrace top

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.15 + 0.3 * fbm(x * 0.35 + 2, z * 0.35, 3);
  h += smooth(-3, -8, z) * smooth(10.4, 7, r) * (1.0 + 1.8 * fbm(x * 0.3, z * 0.3 + 4, 3));
  return Math.max(0.1, h * smooth(10.6, 9.6, r) + 0.1);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const pal = stonePal(4, { cliff: [[0, '#8a7a6a'], [0.5, '#7a6a76'], [1, '#5a5a74']], ledge: [[0, '#a8a07a'], [0.5, '#7fa07e'], [1, '#4f8a6a']], ledgeAt: 0.6 });
  terrain(b, { R: 10.5, rings: 40, segs: 140, fn: ground, palette: pal });

  /* white-jade terrace with balustrade */
  const TW = 15.2, TD = 7.6, TZ = -0.2;
  b.box(TW + 0.8, 0.35, TD + 0.8, { y: 0.05, z: TZ, color: '#d9d4c6' });
  b.box(TW, TY - 0.35, TD, { y: 0.4, z: TZ, color: '#ece8dc' });
  for (let i = 0; i <= 30; i++) {
    const x = -TW / 2 + (TW * i) / 30;
    if (Math.abs(x) < 1.0) continue;
    b.cyl(0.05, 0.06, 0.38, { x, y: TY, z: TZ + TD / 2 - 0.1, color: C.ivory, seg: 5 });
  }
  for (const sx of [-1, 1]) b.box(TW / 2 - 1.0, 0.06, 0.08, { x: sx * (TW / 4 + 0.5), y: TY + 0.32, z: TZ + TD / 2 - 0.1, color: C.ivory });
  for (let i = 0; i < 4; i++) b.box(2.0, 0.19, 0.3, { y: 0.05 + i * 0.18, z: TZ + TD / 2 + 0.9 - i * 0.3, color: '#e6e1d4' });
  // flagstones
  for (let i = -6; i <= 6; i++) b.box(0.03, 0.005, TD - 0.4, { x: i * 1.1, y: TY, z: TZ, color: '#d5cfc0' });

  /* the bedchamber: open-fronted, purple walls, double gold roof */
  const BC = [3.9, -0.9], BW = 5.2, BD = 3.6, BH = 2.6;
  const purple = '#6a3a6e', purpleD = '#4a2650';
  b.push({ x: BC[0], y: TY, z: BC[1] });
  b.box(BW + 0.4, 0.18, BD + 0.4, { color: '#e2dccd' });
  b.box(BW, BH, 0.18, { y: 0.18, z: -BD / 2, color: purple, mat: M.lacquer });                    // back wall
  b.box(0.18, BH, BD, { x: BW / 2, y: 0.18, color: purple, mat: M.lacquer });                       // right wall
  b.box(0.18, BH, BD * 0.35, { x: -BW / 2, y: 0.18, z: -BD * 0.32, color: purple, mat: M.lacquer }); // left wall, a door for the threads
  b.box(0.18, BH * 0.35, BD * 0.65, { x: -BW / 2, y: 0.18 + BH * 0.65, z: BD * 0.17, color: purple, mat: M.lacquer });
  for (let i = 0; i < 5; i++) b.cyl(0.08, 0.08, BH, { x: -BW / 2 + (BW * i) / 4, y: 0.18, z: BD / 2, color: C.cinnabar, mat: M.lacquer, seg: 8 });
  b.box(BW + 0.2, 0.25, BD + 0.2, { y: 0.18 + BH - 0.25, color: '#2f3f6a', mat: M.smooth });
  b.box(BW + 0.24, 0.07, BD + 0.24, { y: 0.18 + BH - 0.32, color: C.gold, mat: M.smooth });
  // gold floor mat and the canopy bed
  b.box(3.2, 0.03, 2.2, { x: 0.3, y: 0.18, z: -0.3, color: '#b58a3a', mat: M.cloth });
  b.box(2.4, 0.45, 1.3, { x: 0.4, y: 0.18, z: -0.9, color: '#7a2a2a', mat: M.lacquer });
  for (const [dx, dz] of [[-0.8, -0.3], [1.6, -0.3], [-0.8, -1.5], [1.6, -1.5]]) b.cyl(0.05, 0.05, 1.7, { x: dx, y: 0.18, z: dz, color: '#7a2a2a', mat: M.lacquer, seg: 6 });
  b.box(2.6, 0.12, 1.4, { x: 0.4, y: 1.88, z: -0.9, color: '#d9a942', mat: M.smooth });
  // the king lying ill: yellow robe, crown, a pale face
  b.push({ x: 0.5, y: 0.63, z: -0.9, rz: Math.PI / 2, ry: 0 });
  b.lathe([[0, 0], [0.2, 0], [0.18, 0.5], [0.12, 1.0], [0, 1.0]], { color: '#d9b04a', mat: M.cloth, seg: 10 });
  b.pop();
  b.box(1.4, 0.12, 0.9, { x: 0.2, y: 0.66, z: -0.9, color: '#8a3a5a', mat: M.cloth });                // quilt
  b.sphere(0.13, { x: -0.6, y: 0.78, z: -0.9, color: '#e8cdb0', mat: M.smooth });
  b.cyl(0.08, 0.1, 0.12, { x: -0.72, y: 0.78, z: -0.9, rz: Math.PI / 2, color: C.gold, mat: M.metal, seg: 8 });
  b.box(0.3, 0.02, 0.3, { x: -0.6, y: 0.65, z: -0.9, color: C.ivory, mat: M.cloth });
  b.pop();
  roof(b, { x: BC[0], y: TY + 0.18 + BH - 0.05, z: BC[1], w: BW + 0.4, d: BD + 0.4, h: 0.55, top: 0.42, color: C.tileGold });
  b.box(BW * 0.72, 0.8, BD * 0.6, { x: BC[0], y: TY + 0.18 + BH + 0.3, z: BC[1], color: purple, mat: M.lacquer });
  roof(b, { x: BC[0], y: TY + 0.18 + BH + 1.1, z: BC[1], w: BW * 0.72, d: BD * 0.6, h: 1.0, color: C.tileGold });
  const RIDGE_Y = TY + 0.18 + BH + 1.1 + 1.0;

  /* covered gallery (回廊) between the chambers */
  const GZ = 0.75, GX0 = -3.6, GX1 = BC[0] - BW / 2 - 0.1;
  for (let i = 0; i <= 5; i++) for (const dz of [-0.6, 0.6]) b.cyl(0.06, 0.06, 1.7, { x: lerp(GX0, GX1, i / 5), y: TY, z: GZ + dz, color: C.cinnabar, mat: M.lacquer, seg: 6 });
  for (const dz of [-0.6, 0.6]) b.box(GX1 - GX0 + 0.3, 0.14, 0.14, { x: (GX0 + GX1) / 2, y: TY + 1.62, z: GZ + dz, color: '#2f3f6a', mat: M.smooth });
  for (let i = 0; i <= 10; i++) b.box(0.08, 0.08, 1.5, { x: lerp(GX0, GX1, i / 10), y: TY + 1.76, z: GZ, color: C.cinnabar, mat: M.lacquer });   // open trellis
  for (let i = 0; i < 5; i++) b.box(0.04, 0.3, 1.2, { x: lerp(GX0, GX1, (i + 0.5) / 5), y: TY + 0.05, z: GZ, color: C.cinnabar, mat: M.lacquer });  // low railings

  /* the antechamber: an open pavilion where Wukong reads the pulse */
  const AC = [-5.2, 0.9];
  pavilion(b, { x: AC[0], y: TY, z: AC[1], w: 2.6, h: 2.3, roofColor: C.tileGold });
  b.box(0.5, 0.35, 0.5, { x: AC[0] - 0.2, y: TY + 0.2, z: AC[1], color: '#7a2a2a', mat: M.lacquer });   // stool
  // court officials watching, and a eunuch with a tray
  for (const [x, z, ry, robe] of [[-2.6, 2.4, 2.6, '#7a3a6a'], [-1.8, 2.7, 2.9, '#3a4a7a'], [-0.9, 2.5, -2.9, '#7a3a3a'], [0.3, 2.3, -2.6, '#3a5a5a']]) {
    figure(b, 'villager', { x, y: TY, z, ry, robe, hat: '#2a2a2a', s: 1.1 });
  }
  /* the hills behind the palace */
  for (const [x, z, r, h] of [[-6.0, -6.4, 1.4, 7.5], [-2.6, -7.8, 1.2, 6], [1.8, -7.4, 1.5, 8.5], [6.2, -6.0, 1.2, 6.5], [8.4, -2.6, 0.8, 3.6]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean: 0.12, rand: rng, taper: 0.75, palette: stonePal(h, { base: y, cliff: [[0, '#8a6a6a'], [0.35, '#7a5a7a'], [0.7, '#5a4a7a'], [1, '#3e3a62']], ledge: [[0, '#b0a07a'], [0.5, '#8a9a7a'], [1, '#5a7a6a']], ledgeAt: 0.6 }) });
  }
  /* a lotus pond in the front court with a little bridge */
  const PY = ground(-4.4, 6.6) + 0.06;
  b.cyl(2.3, 2.3, 0.3, { x: -4.4, y: PY - 0.3, z: 6.6, sz: 0.6, color: '#cfc8b6', seg: 28 });
  b.cyl(2.0, 2.0, 0.06, { x: -4.4, y: PY - 0.05, z: 6.6, sz: 0.6, color: '#3d6a7a', mat: M.water, seg: 28 });
  for (let i = 0; i < 9; i++) b.cyl(0.18, 0.18, 0.02, { x: -4.4 + Math.cos(i * 2.3) * 1.4, y: PY + 0.02, z: 6.6 + Math.sin(i * 2.3) * 0.7, color: '#4f8a5a', mat: M.smooth, seg: 8 });
  for (let i = 0; i < 3; i++) b.sphere(0.08, { x: -4.4 + Math.cos(i * 2.0 + 1) * 1.1, y: PY + 0.1, z: 6.6 + Math.sin(i * 2.0 + 1) * 0.5, sy: 1.3, color: '#e8a8b8', mat: M.smooth, ws: 6, hs: 5 });
  archBridge(b, { from: [-4.4, PY, 5.2], to: [-4.4, PY, 8.0], w: 0.6, rise: 0.35, segments: 8 });
  /* garden: pines and rocks below the terrace */
  for (const [x, z, h] of [[-7.6, -2.8, 2.4], [7.8, -3.4, 2.2], [-8.4, 3.8, 1.6], [8.2, 3.6, 1.8], [-4.8, -5.8, 2.6], [1.0, -6.6, 2.2]]) pine(b, { x, y: ground(x, z) - 0.05, z, h, r: rng, lean: 0.2 });
  for (let i = 0; i < 6; i++) {
    const [x, z] = rng.inDisc(9.6, 7.8);
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.4 + rng() * 0.4, h: 0.7 + rng() * 0.9, rand: rng, palette: pal });
  }
  object.add(b.build());

  /* Wukong, seated on the stool, holding the three threads */
  const WS = 1.75;
  {
    const wb = new Builder();
    figure(wb, 'wukong', { pose: 'none' });
    wb.cyl(0.022, 0.026, 0.2, { x: -0.09, y: 0.43, rz: Math.PI - 0.3, color: C.fur, mat: M.smooth, seg: 6 });
    wb.cyl(0.022, 0.026, 0.24, { x: 0.09, y: 0.43, rz: -1.35, rx: 0.15, color: C.fur, mat: M.smooth, seg: 6 });   // arm out toward the threads
    const g = wb.build();
    g.position.set(AC[0] - 0.2, TY + 0.36, AC[1]);
    g.rotation.y = Math.PI / 2;
    g.scale.set(WS, WS * 0.86, WS);
    object.add(g);
  }
  const HAND = new THREE.Vector3(AC[0] - 0.2, TY + 0.36 + 0.44 * WS * 0.86, AC[1] - 0.0).add(new THREE.Vector3(0, 0, 0));
  HAND.x += 0.32 * WS; HAND.y += 0.02;
  const WRIST = new THREE.Vector3(BC[0] - 0.5, TY + 0.8, BC[1] - 0.45);

  /* the three golden threads (寸、关、尺) */
  const thrMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd06a').multiplyScalar(2.2) });
  const curves = [];
  for (let k = 0; k < 3; k++) {
    const dz = (k - 1) * 0.07;
    const pts = [
      [HAND.x, HAND.y, HAND.z + dz * 0.3],
      [AC[0] + 1.6, TY + 1.3, GZ + dz],
      [lerp(GX0, GX1, 0.5), TY + 1.18, GZ + dz],
      [GX1 - 0.2, TY + 1.3, GZ + dz],
      [BC[0] - BW / 2 - 0.05, TY + 1.05, 0.2 + dz],
      [BC[0] - 1.4, TY + 0.95, -0.15 + dz],
      [WRIST.x, WRIST.y, WRIST.z + dz * 0.4],
    ].map((p) => new THREE.Vector3(...p));
    const c = new THREE.CatmullRomCurve3(pts);
    curves.push(c);
    object.add(new THREE.Mesh(new THREE.TubeGeometry(c, 90, 0.028, 4, false), thrMat));
  }
  const beads = softPuffs(9, { color: '#ffe2a0', opacity: 0.95, additive: true });
  const sheen = softPuffs(36, { color: '#ffc860', opacity: 0.35, additive: true });
  object.add(sheen.points);
  object.add(beads.points);

  /* silk curtains round the bed (translucent purple), swaying */
  const curtMat = new THREE.MeshStandardMaterial({ color: '#8a4a9a', roughness: 0.8, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
  const curtains = [];
  for (const [x, z, ry, w] of [[BC[0] - 0.4, BC[1] - 0.25, 0, 1.1], [BC[0] + 1.25, BC[1] - 0.25, 0, 1.1], [BC[0] - 0.85, BC[1] - 0.9, Math.PI / 2, 1.2]]) {
    const g = new THREE.PlaneGeometry(w, 1.62, 6, 1);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setZ(i, 0.06 * Math.sin(P.getX(i) * 9));
    g.computeVertexNormals();
    g.translate(0, -0.81, 0);
    const m = new THREE.Mesh(g, curtMat);
    m.position.set(x, TY + 1.86, z);
    m.rotation.y = ry;
    object.add(m); curtains.push(m);
  }

  /* 金毛犼 crouched on the ridge with its three purple-gold bells */
  const beast = new THREE.Group();
  const bells = [];
  {
    const kb = new Builder(), gold = '#c9973a', mane = '#e0b04a';
    kb.sphere(0.45, { y: 0.4, sx: 0.8, sy: 0.6, sz: 1.3, color: gold, mat: M.smooth });
    kb.sphere(0.36, { y: 0.7, z: 0.6, color: gold, mat: M.smooth });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; kb.cone(0.12, 0.55, { x: Math.cos(a) * 0.25, y: 0.7 + Math.sin(a) * 0.25, z: 0.45, rx: -1.2, rz: a, color: mane, mat: M.flat, seg: 4 }); }
    kb.box(0.22, 0.18, 0.28, { y: 0.58, z: 0.82, color: '#a87a2a', mat: M.smooth });
    for (const sx of [-1, 1]) {
      kb.sphere(0.04, { x: sx * 0.12, y: 0.75, z: 0.8, color: '#1a1a14', mat: M.lacquer, ws: 6, hs: 4 });
      kb.cone(0.06, 0.18, { x: sx * 0.15, y: 0.92, z: 0.5, color: gold, mat: M.smooth, seg: 5 });
      for (const fz of [0.45, -0.45]) kb.cyl(0.08, 0.09, 0.3, { x: sx * 0.25, y: 0.0, z: fz, color: gold, mat: M.smooth, seg: 6 });
    }
    kb.tube([[0, 0.45, -0.55], [0.1, 0.7, -0.9], [0.05, 1.05, -0.95], [-0.05, 1.2, -0.8]], (t) => 0.06 + 0.06 * t, { color: mane, mat: M.smooth, radial: 5 });
    beast.add(kb.build());
    for (let i = 0; i < 3; i++) {
      const bb = new Builder();
      bb.cyl(0.006, 0.006, 0.16, { y: -0.16, color: '#7a5a2a', mat: M.metal, seg: 3 });
      bb.lathe([[0.001, -0.36], [0.11, -0.36], [0.09, -0.28], [0.07, -0.18], [0.001, -0.15]], { color: i === 1 ? '#8a5a9a' : '#c9973a', mat: M.metal, seg: 10 });
      const g = bb.build();
      g.position.set((i - 1) * 0.2, 0.5, 0.75 - Math.abs(i - 1) * 0.06);
      beast.add(g); bells.push(g);
    }
  }
  beast.position.set(BC[0] + 1.1, RIDGE_Y - 0.15, BC[1]);
  beast.rotation.y = -Math.PI / 2 + 0.35;
  beast.scale.setScalar(1.15);
  object.add(beast);

  /* incense from a burner in the courtyard */
  const INC = 22;
  const smoke = softPuffs(INC, { color: '#d8cfe0', opacity: 0.45 });
  object.add(smoke.points);
  {
    const ib = new Builder();
    ib.cyl(0.25, 0.18, 0.35, { color: '#7a6a3a', mat: M.metal, seg: 10 });
    for (let i = 0; i < 3; i++) ib.cyl(0.03, 0.03, 0.2, { x: Math.cos(i * 2.1) * 0.18, y: -0.2, z: Math.sin(i * 2.1) * 0.18, color: '#7a6a3a', mat: M.metal, seg: 4 });
    const g = ib.build(); g.position.set(-0.9, TY + 0.2, 2.0); object.add(g);
  }

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(smoke, nk);
    // pulse beads: from wrist to Wukong's fingers, three beats a cycle, each thread out of step
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) {
      const p = ((t / CYCLE) * 3 + j / 3 * 0 + k * 0.12) % 1;
      const q = clamp(p * 1.25);
      const v = curves[k].getPointAt(1 - q);
      beads.set(k * 3 + j, v.x, v.y, v.z, j === 0 ? 0.22 : 0.0001, Math.sin(Math.PI * q) * (q < 1 ? 1 : 0));
    }
    beads.commit();
    for (let i = 0; i < 36; i++) {
      const v = curves[i % 3].getPointAt(((i / 36) + t * 0.01) % 1);
      sheen.set(i, v.x, v.y, v.z, 0.32, 0.5 + 0.3 * Math.sin(t * 2 + i));
    }
    sheen.commit();
    curtains.forEach((m, i) => { m.rotation.x = 0.04 * Math.sin(t * 0.7 + i * 1.7); });
    bells.forEach((g, i) => { g.rotation.z = 0.25 * Math.sin(t * 1.6 + i * 0.9); g.rotation.x = 0.1 * Math.sin(t * 1.1 + i); });
    beast.rotation.y = -Math.PI / 2 + 0.35 + 0.08 * Math.sin(t * 0.3);
    for (let i = 0; i < INC; i++) {
      const p = (t * 0.07 + i / INC) % 1;
      smoke.set(i, -0.9 + Math.sin(p * 6 + t * 0.4) * 0.25 * p, TY + 0.6 + p * 4.2, 2.0 - p * 0.6, 0.25 + p * 1.1, Math.sin(Math.PI * p) * 0.8);
    }
    smoke.commit();
  }
  update(0);
  return { object, update };
}
