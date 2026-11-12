// 乌鸡国 — the imperial garden at the third watch. Under the 芭蕉 (plantain) tree that the demon planted
// over it, the octagonal well; the slab is pushed aside, the tree half torn up by Bajie's rake, and
// from the shaft a faint jade light rises — the drowned king has lain three years below, kept
// fresh by the dragon king's 定颜珠. Wukong hauls on the rope; Bajie climbs out with the king on his
// back and lays him on the flagstones. Beyond the garden wall, in the open hall, the false king sits
// on the throne — and on the wall behind him falls the shadow of a lion: 文殊's blue-maned mount.
// Loop (26 s).
import { THREE, Builder, M, C, terrain, rock, pine, hall, roof, pavilion, figure, fbm, noise2, smooth, clamp, lerp, softPuffs, Lines } from '../kit.js';
import { pathDist, courtier, wall, group, nightLamps, hallLamps } from './_c_util.js';

const CYCLE = 26;
const WELL = [0.2, 1.8];
const WS = 1.45;                   // well scale
const FLOOR = 0.32;
const POND = [-5.2, 3.0];
const PATH = [[-0.6, 3.2], [0.4, 5.0], [-0.4, 7.2], [0.6, 9.6]];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.35 + 1, z * 0.35 + 6, 3);
  let h = FLOOR + 0.2 * n * smooth(-1.4, 0, z);
  const pd = Math.hypot((x - POND[0]) * 0.8, z - POND[1]);
  h -= smooth(2.6, 1.6, pd) * 0.2;
  h += smooth(0.2, -1.6, z) * 0.5;                // the hall terrace behind the wall
  return h * smooth(10.6, 9.4, r) + 0.12 * (1 - smooth(10.6, 9.4, r));
}

// a lion seated in profile, facing +x: the shadow on the wall
function lionShape() {
  const s = new THREE.Shape();
  const P = [[-0.95, 0], [-0.9, 0.35], [-1.05, 0.55], [-1.25, 0.62], [-1.3, 0.8], [-1.1, 0.78], [-0.95, 0.7], [-0.75, 0.95], [-0.55, 1.3],
    [-0.42, 1.62], [-0.5, 1.8], [-0.36, 1.88], [-0.3, 2.06], [-0.12, 2.04], [-0.04, 2.2], [0.14, 2.12], [0.24, 2.16], [0.3, 2.0],
    [0.5, 1.92], [0.56, 1.78], [0.46, 1.7], [0.52, 1.6], [0.36, 1.55], [0.3, 1.42], [0.38, 1.25], [0.28, 1.08], [0.3, 0.6],
    [0.34, 0.12], [0.5, 0.05], [0.5, 0], [0.12, 0], [0.1, 0.5], [-0.05, 0.5], [-0.2, 0.15], [-0.05, 0.05], [-0.05, 0]];
  P.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return s;
}

// 芭蕉: a thick ringed trunk with long arching paddle leaves
function plantain(b, { x, y, z, h = 2.2, lean = 0, leanDir = 0, r, k = 1 }) {
  b.push({ x, y, z, ry: leanDir, rz: lean });
  for (let i = 0; i < 6; i++) b.cyl((0.16 - i * 0.012) * k, (0.18 - i * 0.012) * k, h / 6 + 0.02, { y: (i * h) / 6, color: i % 2 ? '#6f7f4a' : '#5f7040', mat: M.flat, seg: 9 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4, up = 0.1 + r() * 0.6, L = (0.9 + r() * 0.5) * k;
    b.push({ y: h - 0.05, ry: a });
    b.push({ rz: 0, rx: -(Math.PI / 2 - up) });
    b.sphere(0.5, { y: L * 0.55, sx: 0.55 * k, sy: L, sz: 0.04, color: i % 3 ? '#4f8a52' : '#3f7a48', mat: M.cloth, ws: 10, hs: 10 });
    b.cyl(0.015, 0.02, L * 1.05, { color: '#8fae6a', mat: M.smooth, seg: 4 });
    b.pop(); b.pop();
  }
  b.pop();
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* ground: jade flagstones in the garden, mossy beds, a pond */
  const tmpc = new THREE.Color();
  const flag = new THREE.Color('#b9c6b6'), flagD = new THREE.Color('#a3b4a6'), moss = new THREE.Color('#5f8a6a'), mossL = new THREE.Color('#7aa585'), bed = new THREE.Color('#2a4a4a'), terr = new THREE.Color('#cfd2c4');
  terrain(b, {
    R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z) => {
      if (z < -1.2) return tmpc.copy(terr).lerp(flagD, 0.5 * noise2(x * 2.5, z * 2.5));
      if (Math.hypot((x - POND[0]) * 0.8, z - POND[1]) < 1.9) return bed;
      const onPath = pathDist(PATH, x, z) < 0.5 || Math.hypot(x - WELL[0], z - WELL[1]) < 2.6 || pathDist([[-0.6, 2], [3.6, 2.6], [5.6, 4.8]], x, z) < 0.4;
      if (onPath) return tmpc.copy(flag).lerp(flagD, noise2(x * 3, z * 3));
      return tmpc.copy(moss).lerp(mossL, smooth(0.3, 0.7, noise2(x * 0.9, z * 0.9)));
    },
  });

  /* the palace beyond: wall with a moon gate, hall with open front and the false king */
  const WZ = -1.4;
  wall(b, -9.2, WZ, -1.1, WZ, { y: 0.1, h: 1.25, color: '#dfe3d6', tile: C.tileGreen });
  wall(b, 1.1, WZ, 9.2, WZ, { y: 0.1, h: 1.25, color: '#dfe3d6', tile: C.tileGreen });
  // moon gate 月洞门
  { const sh = new THREE.Shape(); sh.moveTo(-1.15, 0); sh.lineTo(1.15, 0); sh.lineTo(1.15, 1.45); sh.lineTo(-1.15, 1.45); sh.lineTo(-1.15, 0);
    const hole = new THREE.Path(); hole.absarc(0, 0.72, 0.62, 0, Math.PI * 2, true); sh.holes.push(hole);
    b.extrude(sh, 0.24, { y: 0.1, z: WZ, color: '#dfe3d6', mat: M.stone, curveSegments: 20 });
    roof(b, { y: 1.55, z: WZ, w: 2.3, d: 0.3, h: 0.22, over: 0.15, color: C.tileGreen }); }
  // the throne hall (open front)
  const HZ = -5.4, HY = ground(0, HZ) - 0.05;
  b.push({ y: HY, z: HZ });
  b.box(6.4, 1.3, 3.8, { color: C.ivory });
  b.box(6.5, 0.1, 3.9, { y: 1.22, color: '#c9cbbd' });
  for (let i = 0; i < 7; i++) b.box(1.8, 1.3 * (1 - i / 7), 0.24, { z: 1.9 + 0.12 + i * 0.24, color: C.ivory });
  for (const sx of [-1, 1]) for (let i = 0; i < 12; i++) b.box(0.06, 0.24, 0.06, { x: sx * (0.95 + i * 0.2), y: 1.3, z: 1.85, color: C.ivory });
  b.push({ y: 0.85 });
  b.box(5.6, 2.6, 0.14, { y: 0.45, z: -1.45, color: '#d2b27a' });
  for (const sx of [-1, 1]) b.box(0.14, 2.6, 2.9, { x: sx * 2.8, y: 0.45, z: 0, color: '#c09a62' });
  for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) b.cyl(0.08, 0.08, 2.7, { x: -2.8 + i * 1.12, y: 0.45, z: sz * 1.5, color: C.cinnabar, mat: M.lacquer, seg: 8 });
  b.box(5.9, 0.24, 3.2, { y: 2.95, color: '#2f6a5a', mat: M.smooth });
  b.box(5.95, 0.07, 3.25, { y: 2.91, color: C.gold, mat: M.smooth });
  roof(b, { y: 3.15, w: 5.6, d: 3.0, h: 1.3, color: C.tileGreen });
  // the dais and throne
  b.box(2.0, 0.22, 1.2, { y: 0.45, z: -0.7, color: '#c99a3e', mat: M.lacquer });
  b.box(1.0, 0.36, 0.6, { y: 0.67, z: -0.8, color: '#b23a2c', mat: M.lacquer });
  b.box(1.1, 0.9, 0.12, { y: 0.67, z: -1.1, color: '#b23a2c', mat: M.lacquer });
  for (const sx of [-1, 1]) b.box(0.1, 0.3, 0.6, { x: sx * 0.5, y: 0.95, z: -0.8, color: C.gold, mat: M.metal });
  // the false king's shadow on the wall behind the throne: not a man's, but a lion's
  b.extrude(lionShape(), 0.02, { x: 0.75, y: 0.5, z: -1.36, s: 1.0, color: '#22406a', mat: M.smooth });
  // incense burner before the hall
  b.lathe([[0, 0], [0.18, 0.02], [0.26, 0.2], [0.24, 0.36], [0, 0.36]], { y: 0.45, z: 1.4, x: 1.8, color: '#5a6a58', mat: M.metal, seg: 10 });
  b.pop(); b.pop();
  courtier(b, 'king', { x: 0, y: HY + 1.03 + 0.85, z: HZ - 0.55, s: 1.35 });
  // side halls on the terrace (their doors, and lanterns in the throne hall, light up at night)
  const lamps = nightLamps(), lanterns = nightLamps({ day: 0.6, night: 1.5 }), lb = new Builder();
  for (const sx of [-1, 1]) hall(b, { x: sx * 5.6, y: ground(sx * 5.6, -4.6) - 0.05, z: -4.6, ry: -sx * 0.4, w: 2.4, d: 1.4, h: 1.0, roofColor: C.tileGreen, wall: '#dfe3d6', beam: '#2f6a5a', r: rng, base: 0.25 });
  for (const sx of [-1, 1]) hallLamps(lb, lamps.mat, { x: sx * 5.6, y: ground(sx * 5.6, -4.6) - 0.05, z: -4.6, ry: -sx * 0.4, w: 2.4, d: 1.4, h: 1.0, base: 0.25 });
  for (const sx of [-1, 1]) { lb.cyl(0.004, 0.004, 0.3, { x: sx * 1.12, y: HY + 0.85 + 2.55, z: HZ + 1.6, color: C.ink, mat: M.smooth, seg: 3 });
    lb.sphere(0.16, { x: sx * 1.12, y: HY + 0.85 + 2.42, z: HZ + 1.6, sy: 1.25, color: '#e0503a', mat: lanterns.mat, ws: 10, hs: 8 }); }

  /* the garden: the octagonal well, the plantain, rockeries, a pavilion, the pond */
  const WY = ground(...WELL);
  b.push({ x: WELL[0], y: WY, z: WELL[1], s: WS });
  b.cyl(1.05, 1.15, 0.18, { color: '#9aa79c', mat: M.flat, seg: 8 });                 // octagonal plinth
  b.cyl(0.66, 0.7, 0.62, { y: 0.18, color: '#c9cfc1', mat: M.flat, seg: 8, open: true });
  b.geo(new THREE.CylinderGeometry(0.56, 0.56, 0.62, 8, 1, true), { y: 0.49, color: '#4a5a54', mat: M.cloth, flatNormals: true });   // inner face (double sided)
  b.geo(new THREE.CylinderGeometry(0.76, 0.76, 0.08, 8, 1, true), { y: 0.84, color: '#e3e6da', mat: M.cloth, flatNormals: true });
  b.geo(new THREE.RingGeometry(0.56, 0.76, 8, 1).rotateX(-Math.PI / 2), { y: 0.88, color: '#e3e6da', mat: M.cloth });
  b.cyl(0.56, 0.56, 0.05, { y: 0.2, color: '#0c1614', mat: M.stone, seg: 8 });       // shaft floor, dark
  // the stone slab pushed aside, leaning on the plinth
  b.box(1.3, 0.12, 1.1, { x: -0.6, y: 0.25, z: -1.25, rx: -0.35, ry: 0.2, color: '#8e988c', mat: M.flat });
  b.pop();
  // the plantain tree, half torn up and leaning away from the well; its roots in the air
  plantain(b, { x: WELL[0] - 2.1, y: WY - 0.05, z: WELL[1] - 0.9, h: 3.4, lean: 0.42, leanDir: 2.7, r: rng, k: 1.6 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.tube([[WELL[0] - 2.1, WY + 0.05, WELL[1] - 0.9], [WELL[0] - 2.1 + Math.cos(a) * 0.35, WY + 0.2, WELL[1] - 0.9 + Math.sin(a) * 0.35], [WELL[0] - 2.1 + Math.cos(a) * 0.55, WY + 0.02, WELL[1] - 0.9 + Math.sin(a) * 0.55]], 0.03, { color: '#5a4433', mat: M.wood, radial: 4 });
  }
  b.sphere(0.6, { x: WELL[0] - 2.5, y: WY, z: WELL[1] - 0.3, sy: 0.25, color: '#6a5a48', mat: M.flat, ws: 8, hs: 5 });   // heaped earth
  // a second plantain, upright, by the wall
  plantain(b, { x: 3.2, y: ground(3.2, -0.4), z: -0.4, h: 2.4, r: rng, k: 1.2 });
  plantain(b, { x: -3.4, y: ground(-3.4, -0.5), z: -0.5, h: 2.2, r: rng, k: 1.1 });
  // rockeries (太湖石): tall, pierced, pale
  for (const [x, z, r, h] of [[-7.0, 1.0, 0.7, 2.4], [-6.2, 0.4, 0.5, 1.6], [3.8, 0.4, 0.55, 2.0], [7.2, 2.2, 0.6, 1.8], [-3.6, 6.4, 0.5, 1.4]]) {
    rock(b, { x, y: ground(x, z) - 0.1, z, r, h, rand: rng, detail: 1, color: '#b8c0b8' });
    rock(b, { x: x + r * 0.6, y: ground(x, z) - 0.1, z: z + 0.3, r: r * 0.6, h: h * 0.55, rand: rng, color: '#a9b3ac' });
  }
  pavilion(b, { x: 5.6, y: ground(5.6, 4.8) - 0.05, z: 4.8, ry: -0.5, w: 1.6, h: 1.25, roofColor: C.tileGreen });
  // pond: stones round the rim, a zigzag bridge
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, x = POND[0] + Math.cos(a) * 2.35, z = POND[1] + Math.sin(a) * 1.9;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.2, h: 0.25 + rng() * 0.2, rand: rng, color: '#9aa69c' });
  }
  for (let i = 0; i < 4; i++) b.box(1.0, 0.08, 0.4, { x: POND[0] - 1.4 + i * 0.8, y: FLOOR + 0.05, z: POND[1] + (i % 2 ? 0.25 : -0.25), ry: i % 2 ? 0.5 : -0.5, color: '#d8d2c0', mat: M.stone });
  for (let i = 0; i < 7; i++) b.cyl(0.3, 0.32, 0.02, { x: POND[0] + rng.range(-1.5, 1.5), y: FLOOR - 0.07, z: POND[1] + rng.range(-1.2, 1.2), color: '#4f8a5a', mat: M.smooth, seg: 10 });   // lily pads
  // peonies in the beds, pines and willows
  for (let i = 0, k = 0; i < 26 && k < 600; k++) {
    const x = rng.range(-9, 9), z = rng.range(-0.8, 9.2);
    if (Math.hypot(x, z) > 9.3 || pathDist(PATH, x, z) < 0.8 || Math.hypot(x - WELL[0], z - WELL[1]) < 2.4 || Math.hypot((x - POND[0]) * 0.8, z - POND[1]) < 2.4 || Math.hypot(x - 5.6, z - 4.8) < 1.6) continue;
    const y = ground(x, z);
    b.sphere(0.2, { x, y: y + 0.1, z, sy: 0.6, color: '#3f6a4a', mat: M.flat, ws: 7, hs: 5 });
    b.sphere(0.07, { x, y: y + 0.24, z, color: rng() < 0.5 ? '#e7b9c4' : '#f1ede4', mat: M.smooth, ws: 6, hs: 4 });
    i++;
  }
  for (const [x, z] of [[-8.0, 4.6], [7.8, 0.6], [3.0, 7.8], [-2.6, 8.6], [-4.2, -8.2], [3.6, -8.4], [-7.4, -5.4], [7.2, -6.0], [0.4, -8.9]]) pine(b, { x, y: ground(x, z) - 0.05, z, h: (z < -5 ? 3.2 : 1.8) + rng(), r: rng, color: '#2f5a4a' });
  object.add(b.build(), lb.build());

  /* --------------------------------------------- animated parts --- */
  // Wukong hauls on the rope, braced at the well's edge
  const WK = [WELL[0] + 1.75, WY, WELL[1] + 1.0];
  const wk = group((wb) => figure(wb, 'wukong', { pose: 'none', s: 1.7 }));
  wk.position.set(...WK); wk.rotation.y = -2.25;
  object.add(wk);
  const arms = group((ab) => {
    for (const sx of [-1, 1]) ab.cyl(0.022 * 1.7, 0.026 * 1.7, 0.22 * 1.7, { x: sx * 0.09 * 1.7, y: 0.43 * 1.7, rx: 1.35, rz: 0, color: C.fur, mat: M.smooth, seg: 6 });
  });
  wk.add(arms);
  // Bajie with the king on his back
  const bj = new THREE.Group();
  const carryKing = group((bb) => { bb.push({ y: 0.62 * 1.3, z: -0.2 * 1.3, rx: -1.35 }); courtier(bb, 'king', { s: 1.25, robe: '#c9a24a' }); bb.pop(); });
  bj.add(group((bb) => figure(bb, 'bajie', { pose: 'none', s: 1.3 })), carryKing);
  object.add(bj);
  // the king laid out on the flagstones (appears when Bajie sets him down)
  const body = group((kb) => { kb.push({ rz: Math.PI / 2 }); courtier(kb, 'king', { s: 1.25, robe: '#c9a24a' }); kb.pop(); });
  body.position.set(WELL[0] + 0.55, WY + 0.2, WELL[1] + 2.0); body.rotation.y = 0.4;
  object.add(body);
  // rope
  const ropePos = new Float32Array(6);
  const ropeGeo = new THREE.BufferGeometry(); ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePos, 3));
  const rope = new THREE.LineSegments(ropeGeo, new THREE.LineBasicMaterial({ color: '#c9b48a' })); rope.frustumCulled = false;
  object.add(rope);
  // the jade glow rising from the shaft, fireflies over the garden
  const GL = 30;
  const glow = softPuffs(GL, { color: '#a8f0d0', opacity: 0.8, additive: true });
  object.add(glow.points);
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.54, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7ee0b8').multiplyScalar(1.1), transparent: true, opacity: 0.8 }));
  glowDisc.rotation.x = -Math.PI / 2; glowDisc.rotation.z = Math.PI / 8; glowDisc.position.set(WELL[0], WY + 0.27 * WS, WELL[1]); glowDisc.scale.setScalar(WS);
  object.add(glowDisc);
  const FF = 26;
  const ffly = softPuffs(FF, { color: '#e8ffb0', opacity: 0.9, additive: true });
  object.add(ffly.points);
  const ffd = Array.from({ length: FF }, () => { const [x, z] = rng.inDisc(8.5, 1); return { x, z: Math.abs(z) * 0.9 + 0.2, ph: rng() * 10 }; });

  const RIM = WY + 0.88 * WS;
  function update(t, dt, env) {
    lamps.update(env?.night ?? 0); lanterns.update(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    // 0..0.42 climbing out; 0.42..0.55 setting down; 0.55..0.9 resting; fade and repeat
    const climb = smooth(0.04, 0.42, u);
    let bx = WELL[0], by = lerp(WY + 0.25 * WS, RIM - 0.15, climb), bz = WELL[1];
    const step = smooth(0.42, 0.55, u);
    bx = lerp(bx, WELL[0] - 0.4, step); bz = lerp(bz, WELL[1] + 1.7, step); by = lerp(by, WY, step) + Math.sin(Math.PI * step) * 0.5;
    const carrying = u < 0.53;
    bj.visible = u > 0.03 && u < 0.96;
    bj.position.set(bx, by + Math.sin(t * 5) * 0.02 * (1 - step), bz);
    bj.rotation.y = 0.15 + step * 0.4;
    bj.scale.setScalar(Math.max(0.001, smooth(0.03, 0.06, u) * (1 - smooth(0.9, 0.96, u))));
    // swap: once set down the body lies on the stones and Bajie stands free
    body.visible = !carrying && u < 0.94;
    carryKing.visible = carrying;
    // Wukong leans back on the rope as it comes in
    const pull = carrying ? Math.sin(t * 2.4) * 0.5 + 0.5 : 0;
    wk.rotation.x = -0.12 - pull * 0.1;
    wk.position.x = WK[0] + pull * 0.05;
    // rope from Wukong's hands to Bajie's shoulders
    ropePos[0] = WK[0] - 0.25; ropePos[1] = WY + 0.75 * 1.7 * 0.62; ropePos[2] = WK[2] - 0.3;
    ropePos[3] = bx; ropePos[4] = by + 0.75; ropePos[5] = bz;
    rope.visible = carrying;
    ropeGeo.attributes.position.needsUpdate = true;
    // glow: steady from the well, brighter while the king rises
    const gk = 0.6 + 0.4 * Math.sin(t * 0.7) + (carrying ? 0.4 : 0);
    glowDisc.material.opacity = clamp(0.35 + 0.25 * Math.sin(t * 0.9));
    for (let i = 0; i < GL; i++) {
      const p = (t * 0.07 + i / GL) % 1, a = i * 2.4 + t * 0.3;
      glow.set(i, WELL[0] + Math.cos(a) * 0.35 * (1 + p), RIM - 0.2 + p * 3.0, WELL[1] + Math.sin(a) * 0.35 * (1 + p), 0.25 + 0.5 * p, Math.sin(Math.PI * p) * 0.5 * gk);
    }
    glow.commit();
    for (let i = 0; i < FF; i++) {
      const f = ffd[i];
      ffly.set(i, f.x + Math.sin(t * 0.3 + f.ph) * 0.6, FLOOR + 0.6 + 0.5 * Math.sin(t * 0.5 + f.ph * 2), f.z + Math.cos(t * 0.25 + f.ph) * 0.6, 0.07, 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.3 + f.ph * 3)));
    }
    ffly.commit();
  }
  update(0);
  return { object, update };
}
