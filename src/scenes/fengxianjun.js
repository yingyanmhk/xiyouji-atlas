// 凤仙郡 — three years without rain. Below: cracked ochre fields of withered stalks, the little
// prefecture, and its marquis on his knees before an incense table with the townsfolk. Above, on a
// cloud terrace in heaven by the 披香殿, Wukong has found the Jade Emperor's three omens: a hill of
// rice pecked by a fist-sized chick, a hill of flour licked by a golden lapdog, and a golden lock
// whose bar a small lamp-flame is slowly burning through. Rain may fall only when all three are gone.
// 36 s loop: the hills dwindle, the bar burns through, rain clouds gather, rain, the fields green.
import { THREE, Builder, M, C, terrain, hall, house, cloud, figure, bareTree, fbm, noise2, hash2, smooth, clamp, lerp, mix, setInst, softPuffs, Lines } from '../kit.js';
import { person, tileWall, instanced, nightTint } from './_e_kit.js';

const CYCLE = 36;
const SKY = [-0.6, 7.0, -1.6];     // the heavenly terrace
const HS = 1.45;                   // its scale

function ground(x, z) {
  const r = Math.hypot(x, z);
  return 0.2 + 0.35 * fbm(x * 0.25 + 2, z * 0.25, 3) * smooth(3, 9, r) - 0.1 * smooth(9.6, 10.5, r);
}
// paddy plots: [cx, cz, w, d, ry] — irregular, following the land
const PLOTS = [[-6.4, 0.6, 3.2, 2.6, 0.25], [-2.6, 0.9, 3.0, 2.2, 0.1], [2.2, 2.4, 3.0, 2.4, -0.2], [6.2, 1.4, 2.6, 3.4, -0.35], [-4.6, 4.4, 3.4, 2.2, 0.4], [-0.8, 4.4, 2.0, 2.4, 0.05], [3.2, 6.4, 2.6, 1.8, -0.3],
  [-0.4, -4.6, 4.0, 2.2, -0.1], [4.6, -3.4, 3.0, 2.6, -0.5], [-5.2, -3.6, 3.6, 2.4, 0.5], [0.6, -1.6, 2.2, 1.6, 0.2], [-8.0, -2.4, 1.6, 2.2, 0.9]];
const plotLocal = ([cx, cz, w, d, ry], x, z) => { const dx = x - cx, dz = z - cz, c = Math.cos(ry), s = Math.sin(ry); return [dx * c - dz * s, dx * s + dz * c, w, d]; };
const inPlot = (x, z) => PLOTS.some((p) => { const [lx, lz, w, d] = plotLocal(p, x, z); return Math.abs(lx) < w / 2 && Math.abs(lz) < d / 2; });
// a dry river bed winding across
const bedX = (z) => -1.5 + 2.4 * Math.sin(z * 0.32 + 0.6);
const inBed = (x, z) => Math.abs(x - bedX(z)) < 0.55 + 0.2 * Math.sin(z * 1.3);

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const out = new THREE.Color();
  terrain(b, {
    R: 10.5, rings: 44, segs: 140, fn: ground,
    palette: (x, y, z) => {
      const n = fbm(x * 0.8, z * 0.8, 3);
      if (inBed(x, z)) return mix('#d8c49a', '#bfa77a', hash2(x * 7, z * 7), out);
      if (inPlot(x, z)) return mix('#a98455', '#8e6c45', n, out).multiplyScalar(0.94 + 0.1 * hash2(x * 9, z * 9));
      return mix('#c9ab78', '#b2915e', n, out);
    },
  });
  // ridges (田埂) around each plot
  for (const [cx, cz, w, d, ry] of PLOTS) {
    b.push({ x: cx, y: 0, z: cz, ry: -ry });
    const co = Math.cos(-ry), si = Math.sin(-ry);
    for (const [x, z, sx, sz] of [[0, -d / 2, w, 0.12], [0, d / 2, w, 0.12], [-w / 2, 0, 0.12, d], [w / 2, 0, 0.12, d]]) {
      const wx = cx + x * co + z * si, wz = cz - x * si + z * co;
      b.box(sx, 0.32, sz, { x, y: ground(wx, wz) - 0.22, z, color: '#b49663', mat: M.flat });
    }
    b.pop();
  }
  // stones in the dry bed, a stranded boat
  for (let i = 0; i < 16; i++) { const z = rng.range(-9, 9), x = bedX(z) + rng.range(-0.4, 0.4); if (Math.hypot(x, z) < 9.6 && !inPlot(x, z)) b.ico(0.08 + rng() * 0.12, { x, y: ground(x, z), z, sy: 0.6, color: '#a39a88', mat: M.flat }); }
  { const z = -6.6, x = bedX(z); b.push({ x, y: ground(x, z) + 0.05, z, ry: 0.4, rz: 0.15 }); b.box(0.4, 0.14, 1.3, { color: '#6a5038', mat: M.wood }); b.box(0.32, 0.04, 1.2, { y: 0.12, color: '#4a3424', mat: M.wood }); b.pop(); }

  /* the prefecture: a walled yamen and houses, front-right */
  const TX = 5.0, TZ = 6.8;
  hall(b, { x: TX, y: ground(TX, TZ) - 0.05, z: TZ - 0.4, ry: -0.5, w: 2.2, d: 1.4, h: 0.95, base: 0.2, roofColor: '#5a5f60', wall: '#d4c3a0', beam: '#5b6a62', r: rng, steps: false });
  for (const [x, z, ry] of [[3.0, 8.4, -0.3], [6.9, 5.2, -0.9], [2.4, 6.4, 0.1]]) house(b, { x, y: ground(x, z) - 0.05, z, ry, w: 1.4, d: 1.0, h: 0.75, wall: '#d6c7a6', roofColor: '#62645f', lit: 0, r: rng });
  tileWall(b, 3.6, 5.2, 6.6, 3.8, { y: 0.25, h: 0.5, color: '#cdb994', cap: '#5a5f60' });
  for (const [x, z] of [[-8.0, 4.2], [7.8, -3.6], [-3.4, -7.2], [8.6, 1.0], [-1.0, 8.0]]) bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.4 + rng() * 0.6, r: rng, color: '#5a4636' });

  /* the altar of prayer, the marquis and his people kneeling */
  const AX = 1.2, AZ = 6.2, AY = ground(AX, AZ);
  b.box(1.1, 0.42, 0.55, { x: AX, y: AY - 0.02, z: AZ - 0.6, color: C.cinnabar, mat: M.lacquer });
  b.box(1.2, 0.04, 0.62, { x: AX, y: AY + 0.4, z: AZ - 0.6, color: C.goldD, mat: M.smooth });
  b.lathe([[0, 0], [0.14, 0.02], [0.16, 0.12], [0.1, 0.16], [0, 0.16]], { x: AX, y: AY + 0.44, z: AZ - 0.6, color: '#7a6a4a', mat: M.metal });
  person(b, { x: AX, y: AY, z: AZ + 0.15, ry: Math.PI, s: 1.3, robe: '#9a3a2e', robe2: '#b8574a', head: 'futou', pose: 'kneel' });   // 上官郡侯
  for (let i = 0; i < 14; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    const x = AX - 1.8 + col * 0.9 + (row % 2) * 0.4 + (rng() - 0.5) * 0.15, z = AZ + 0.9 + row * 0.75;
    if (Math.hypot(x, z) > 9.6) continue;
    person(b, { x, y: ground(x, z) - 0.02, z, ry: Math.PI + (rng() - 0.5) * 0.4, s: 1.05, robe: rng.pick(['#7c6a58', '#6a7468', '#8a7262', '#5d6670']), head: rng() < 0.5 ? 'hat' : 'bun', hatColor: '#c9b07a', pose: 'kneel' });
  }
  figure(b, 'monk', { x: AX + 1.5, y: ground(AX + 1.5, AZ - 0.2), z: AZ - 0.2, ry: -2.4, s: 1.2 });
  figure(b, 'bajie', { x: AX + 2.3, y: ground(AX + 2.3, AZ + 0.4), z: AZ + 0.4, ry: -2.2, s: 1.2 });
  figure(b, 'sha', { x: AX + 2.1, y: ground(AX + 2.1, AZ - 0.7), z: AZ - 0.7, ry: -2.6, s: 1.2 });
  // a dry well
  b.lathe([[0.3, 0], [0.32, 0.3], [0.26, 0.32], [0.25, 0.02]], { x: -1.6, y: ground(-1.6, 7.2) - 0.02, z: 7.2, color: '#9a9488', mat: M.stone, seg: 14 });
  object.add(b.build());

  /* cracks in the dry earth */
  const cracks = new Lines();
  for (let i = 0; i < 46; i++) {
    let [x, z] = rng.inDisc(9.6, 0.5), a = rng() * Math.PI * 2;
    const pts = [];
    for (let k = 0; k < 6; k++) { pts.push([x, ground(x, z) + 0.02, z]); const L = 0.25 + rng() * 0.4; x += Math.cos(a) * L; z += Math.sin(a) * L; a += (rng() - 0.5) * 1.6; }
    cracks.add(pts, '#4a3624');
  }
  const crackLines = cracks.build({ opacity: 0.85 });
  object.add(crackLines);

  /* withered stalks, and the green that comes with the rain */
  const stalks = [];
  for (const [cx, cz, w, d, ry] of PLOTS) for (let a = -w / 2 + 0.25; a < w / 2 - 0.1; a += 0.4) for (let c = -d / 2 + 0.25; c < d / 2 - 0.1; c += 0.4) {
    const co = Math.cos(-ry), si = Math.sin(-ry);
    const px = cx + a * co + c * si + (rng() - 0.5) * 0.1, pz = cz - a * si + c * co + (rng() - 0.5) * 0.1;
    if (Math.hypot(px, pz) < 9.8) stalks.push([px, ground(px, pz), pz, rng() * 6.28, rng()]);
  }
  const dry = instanced((ib) => {
    ib.cyl(0.006, 0.014, 0.32, { color: '#9c7c4c', mat: M.flat, seg: 4, rz: 0.25 });
    ib.box(0.1, 0.008, 0.02, { x: 0.05, y: 0.2, rz: -0.8, color: '#a88a58', mat: M.flat });
  }, stalks.length, M.flat);
  const green = instanced((ib) => {
    for (let k = 0; k < 4; k++) ib.cone(0.02, 0.3, { x: Math.cos(k * 1.6) * 0.03, z: Math.sin(k * 1.6) * 0.03, rz: Math.cos(k * 1.6) * 0.25, rx: Math.sin(k * 1.6) * 0.25, color: k % 2 ? '#6aa35a' : '#4f8a4a', mat: M.flat, seg: 4 });
  }, stalks.length, M.flat);
  object.add(dry, green);

  /* heaven: the cloud terrace, the 披香殿 and the three omens */
  const heaven = new THREE.Group();
  heaven.position.set(...SKY);
  heaven.scale.setScalar(HS);
  object.add(heaven);
  const hb = new Builder();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = i % 2 ? 2.6 : 1.4;
    cloud(hb, { x: Math.cos(a) * r, y: -0.25 + (rng() - 0.5) * 0.1, z: Math.sin(a) * r * 0.7, s: 1.0 + rng() * 0.25, ry: a + 1.2, rand: rng, color: '#f6f2ea', curl: i % 3 === 0 });
  }
  hb.cyl(3.4, 3.0, 0.3, { y: -0.38, sz: 0.72, color: '#f4efe6', mat: M.cloud, seg: 28 });
  hall(hb, { x: 0.2, z: -1.6, w: 2.6, d: 0.9, h: 0.9, base: 0.15, roofColor: C.tileGold, wall: '#c84a3a', beam: C.shiqing, r: rng, steps: false });
  // the iron frame of the golden lock
  const LK = [2.0, 0, 0.2];
  for (const sx of [-1, 1]) hb.cyl(0.04, 0.05, 1.6, { x: LK[0] + sx * 0.45, z: LK[2], color: '#3c3b3d', mat: M.metal, seg: 6 });
  hb.box(1.05, 0.06, 0.06, { x: LK[0], y: 1.58, z: LK[2], color: '#3c3b3d', mat: M.metal });
  hb.lathe([[0, 0], [0.12, 0], [0.1, 0.06], [0.03, 0.08], [0.02, 0.12], [0, 0.12]], { x: LK[0], y: 0, z: LK[2], color: C.goldD, mat: M.metal });    // the lamp
  figure(hb, 'wukong', { x: -0.5, z: 1.1, ry: 0.2, pose: 'gaze', s: 1.7 });
  heaven.add(hb.build({ shadows: false }));

  const omen = (fn) => { const ob = new Builder(); fn(ob); const g = ob.build({ shadows: false }); heaven.add(g); return g; };
  const facet = (base, h, col) => (ob) => {
    const g = new THREE.ConeGeometry(base, h, 16, 6);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); const k = 1 + (noise2(P.getX(i) * 3, P.getZ(i) * 3 + y) - 0.5) * 0.25 * (y < h / 2 - 0.01 ? 1 : 0); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
    g.translate(0, h / 2, 0);
    ob.geo(g, { mat: M.flat, flatNormals: true, faceColor: (x, y, z) => mix(col[0], col[1], hash2(x * 40, z * 40 + y * 30)) });
  };
  const rice = omen(facet(0.95, 1.9, ['#efe2bf', '#d9c592']));
  rice.position.set(-1.7, 0, -0.2);
  const flour = omen(facet(1.0, 2.3, ['#fbf8f0', '#e8e2d6']));
  flour.position.set(0.15, 0, 0.2);
  const chick = omen((ob) => { ob.sphere(0.12, { y: 0.12, color: '#f2c94a', mat: M.smooth }); ob.sphere(0.08, { y: 0.26, z: 0.06, color: '#f5d260', mat: M.smooth }); ob.cone(0.025, 0.06, { y: 0.26, z: 0.15, rx: Math.PI / 2, color: '#e07a2a', mat: M.smooth, seg: 5 }); });
  const dog = omen((ob) => {
    ob.sphere(0.2, { y: 0.24, sz: 1.5, color: '#d9a44a', mat: M.smooth });
    ob.sphere(0.14, { y: 0.36, z: 0.3, color: '#e0ae55', mat: M.smooth });
    for (const sx of [-1, 1]) ob.sphere(0.07, { x: sx * 0.12, y: 0.34, z: 0.27, sy: 1.5, sx: 0.5, color: '#b8823a', mat: M.smooth });
    for (const [lx, lz] of [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]]) ob.cyl(0.035, 0.04, 0.12, { x: lx, z: lz, color: '#d9a44a', mat: M.smooth, seg: 5 });
    ob.tube([[0, 0.3, -0.28], [0, 0.45, -0.38], [0.05, 0.5, -0.3]], 0.03, { color: '#e0ae55', mat: M.smooth });
  });
  const lock = omen((ob) => {
    ob.torus(0.13, 0.025, { y: 0.32, arc: Math.PI, color: '#e2b24a', mat: M.metal, ts: 12 });           // the bar (锁梃)
    ob.box(0.36, 0.3, 0.1, { y: 0.02, color: C.gold, mat: M.metal });
    ob.box(0.16, 0.06, 0.11, { y: 0.14, color: C.goldD, mat: M.metal });
  });
  const flame = omen((ob) => { ob.sphere(0.06, { y: 0.07, sy: 1.8, color: C.fireCore, mat: M.glow, glow: 2.4, ws: 8, hs: 6 }); });
  flame.position.set(LK[0], 0.12, LK[2]);
  const flameGlow = softPuffs(3, { color: '#ffb050', opacity: 0.5, additive: true });
  heaven.add(flameGlow.points);

  /* rain clouds, rain */
  const RC = 80, rainCloud = softPuffs(RC, { color: '#6d7276', opacity: 0.6 });
  object.add(rainCloud.points);
  const rcp = Array.from({ length: RC }, () => { const [x, z] = rng.inDisc(8.5); return { x, z, y: 5.4 + rng.range(-0.5, 0.6), s: 2 + rng() * 2.4, ph: rng() * 6.28 }; });
  const DROPS = 360, rainPos = new Float32Array(DROPS * 6);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0 });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  object.add(rain);
  const drops = Array.from({ length: DROPS }, () => { const [x, z] = rng.inDisc(9.2); return { x, z, ph: rng() }; });
  const DUST = 40, dust = softPuffs(DUST, { color: '#d8bf8e', opacity: 0.35 });
  object.add(dust.points);
  const dd = Array.from({ length: DUST }, () => { const [x, z] = rng.inDisc(9.5); return { x, z, ph: rng() }; });
  const crackMat = crackLines.material;

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(dust, nk);
    nightTint(rainCloud, nk, 0.8);
    const u = (t % CYCLE) / CYCLE;
    const fade = smooth(0.12, 0.5, u), back = smooth(0.93, 1.0, u);
    const left = Math.max(1 - fade, back);                     // how much of the omens remains
    rice.scale.set(Math.max(0.02, Math.sqrt(left)), Math.max(0.02, left), Math.max(0.02, Math.sqrt(left)));
    flour.scale.copy(rice.scale);
    // the chick pecks, the dog licks, at the dwindling foot of each hill
    const peck = Math.max(0, Math.sin(t * 7)) ** 3;
    chick.position.set(-1.7 + 0.95 * Math.sqrt(left) + 0.15, 0, 0.35);
    chick.rotation.set(peck * 0.6, -1.9, 0);
    dog.position.set(0.15 + 1.0 * Math.sqrt(left) + 0.3, 0, 0.55);
    dog.rotation.set(Math.sin(t * 5) * 0.08, -2.0, 0);
    // the lock hangs on its bar until the flame burns it through, then it drops
    const burnt = smooth(0.42, 0.48, u) * (1 - back);
    lock.position.set(LK[0], lerp(1.18, 0.05, burnt), LK[2]);
    lock.rotation.z = burnt * 0.5;
    const fl = 1 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 21);
    flame.scale.set(1, fl * (1 + 2.6 * (1 - burnt)) * 0.5 + 0.5, 1);
    flameGlow.set(0, LK[0], 0.4 + 0.3 * (1 - burnt), LK[2], 0.6 * fl, 0.9);
    flameGlow.set(1, LK[0], 0.85 * (1 - burnt) + 0.2, LK[2], 0.35 * fl, 0.7 * (1 - burnt));
    flameGlow.set(2, LK[0], 0.2, LK[2], 0.4, 0.3);
    flameGlow.commit();
    // rain
    const rk = smooth(0.5, 0.58, u) * (1 - smooth(0.82, 0.9, u));
    for (let i = 0; i < RC; i++) { const c = rcp[i]; rainCloud.set(i, c.x + Math.sin(t * 0.15 + c.ph) * 0.4, c.y, c.z, c.s * (0.5 + 0.5 * rk), rk); }
    rainCloud.commit();
    rainMat.opacity = rk * 0.75;
    rain.visible = rk > 0.01;
    if (rain.visible) {
      for (let i = 0; i < DROPS; i++) {
        const d = drops[i], y = 5.2 - ((t * 0.9 + d.ph) % 1) * 5.2;
        rainPos.set([d.x + y * 0.04, y, d.z, d.x + y * 0.04 - 0.02, y - 0.4, d.z], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    // the fields: dry stalks droop, green shoots after the rain
    const grow = smooth(0.58, 0.8, u) * (1 - back);
    for (let i = 0; i < stalks.length; i++) {
      const [x, y, z, ry, ph] = stalks[i];
      const g = clamp(grow * 1.3 - ph * 0.3);
      setInst(dry, i, x, y, z, ry, 1 - g * 0.9 + 0.0001);
      setInst(green, i, x + 0.05, y - 0.02, z + 0.05, ry, g < 0.01 ? 0.0001 : g * (1.6 + 0.6 * ph));
    }
    dry.instanceMatrix.needsUpdate = true;
    green.instanceMatrix.needsUpdate = true;
    crackMat.opacity = 0.85 * (1 - 0.8 * smooth(0.55, 0.7, u) * (1 - back));
    const dk = 1 - smooth(0.45, 0.55, u) * (1 - back);
    for (let i = 0; i < DUST; i++) {
      const d = dd[i], p = (d.ph + t * 0.03) % 1;
      dust.set(i, d.x + p * 2, 0.35 + p * 0.6, d.z, 0.8 + p, dk * Math.sin(Math.PI * p));
    }
    dust.commit();
    heaven.position.y = SKY[1] + Math.sin(t * 0.35) * 0.12;
  }
  update(0);
  return { object, update };
}
