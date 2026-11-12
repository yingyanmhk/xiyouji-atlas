// 平顶山·莲花洞 — a flat-topped 青绿 mesa; at its foot the 莲花洞, its mouth framed by petals of
// stone. On the table of the summit stand 金角 and 银角, the two furnace boys of 太上老君, and above
// them hangs their treasure, the 紫金红葫芦, tilted with its open mouth toward the plain. Loop (20 s):
// 银角 calls the name, Wukong answers — a spiral of wind draws the small Monkey King into the gourd and
// the stopper with its talisman drops into the mouth. Inside he plays at melting away (ch. 34); the demon
// lifts the stopper to look — and out slips a tiny insect, a wisp of gold, back to the cloud, where Wukong
// stands again.
import { THREE, Builder, M, C, terrain, peak, pine, rock, cloud, figure, horse, qinglv, fbm, noise2, smooth, clamp, lerp, ease, softPuffs } from '../kit.js';
import { pathDist, group } from './_c_util.js';

const CYCLE = 20;
const MESA = [-0.6, -2.4];
const PATH = [[0.4, 1.6], [1.6, 3.4], [1.0, 5.4], [2.6, 7.4], [3.0, 9.6]];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.28 + 9, z * 0.28 + 3, 4);
  let h = 0.25 + 0.9 * n * n + smooth(2, -6, z) * 1.2 * n;
  h += smooth(5.5, 2.5, Math.hypot(x - MESA[0], (z - MESA[1]) * 1.2)) * 1.2;
  h *= 1 - 0.7 * smooth(1.1, 0.2, pathDist(PATH, x, z));
  return h * smooth(10.6, 9.2, r) + 0.12;
}

// the purple-gold red gourd: lathe along +y from the base (y=0) to the mouth (y=L)
function gourd(b, L = 4) {
  const prof = [[0, 0], [0.55, 0.03], [0.95, 0.18], [1.12, 0.42], [1.1, 0.7], [0.92, 0.98], [0.55, 1.2], [0.42, 1.3],
    [0.5, 1.42], [0.72, 1.62], [0.78, 1.82], [0.68, 2.02], [0.42, 2.2], [0.24, 2.36], [0.2, 2.6], [0.24, 2.72], [0.2, 2.74]];
  const k = L / 2.74;
  const pal = (x, y, z) => {
    const t = y / L;
    const c = new THREE.Color().lerpColors(new THREE.Color('#4e1e4e'), new THREE.Color('#b0303c'), clamp(t * 1.3));
    const sheen = noise2(Math.atan2(z, x) * 2, y * 1.5);
    return c.multiplyScalar(0.85 + sheen * 0.35);
  };
  b.lathe(prof.map(([r, y]) => [r * k, y * k]), { mat: M.lacquer, faceColor: pal, seg: 28 });
  // gold bands: the waist, the neck, the lip
  b.torus(0.44 * k, 0.05 * k, { y: 1.3 * k, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 28 });
  b.torus(0.23 * k, 0.035 * k, { y: 2.42 * k, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 20 });
  b.torus(0.22 * k, 0.04 * k, { y: 2.72 * k, rx: Math.PI / 2, color: C.gold, mat: M.metal, ts: 20 });
  // dark throat
  b.cyl(0.17 * k, 0.17 * k, 0.05, { y: 2.68 * k, color: '#1a0a12', mat: M.stone, seg: 16 });
  // red cord and tassel tied round the waist
  b.tube([[0.45 * k, 1.3 * k, 0], [0.6 * k, 1.05 * k, 0.1 * k], [0.62 * k, 0.75 * k, 0.05 * k]], 0.025 * k, { color: C.cinnabar, mat: M.cloth });
  b.cone(0.09 * k, 0.32 * k, { x: 0.62 * k, y: 0.45 * k, z: 0.05 * k, rx: Math.PI, color: C.cinnabar, mat: M.cloth, seg: 8 });
  // gilt cloud-scroll pattern on the lower bulb
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.torus(0.12 * k, 0.018 * k, { x: Math.cos(a) * 1.08 * k, y: 0.6 * k, z: Math.sin(a) * 1.08 * k, ry: -a + Math.PI / 2, arc: Math.PI * 1.4, color: C.gold, mat: M.metal, ts: 10 });
  }
}

// 金角 / 银角: horned demon-boys in armoured robes
function hornBoy(b, { x, y, z, ry = 0, s = 1, horn }) {
  b.push({ x, y, z, ry, s });
  b.lathe([[0, 0], [0.17, 0], [0.16, 0.16], [0.1, 0.46], [0, 0.46]], { color: horn === 'gold' ? '#5a3a6a' : '#3b4f6a', mat: M.cloth, seg: 12 });
  b.cyl(0.1, 0.12, 0.14, { y: 0.4, color: '#7a6a5a', mat: M.metal, seg: 8 });                     // breastplate
  b.cyl(0.13, 0.13, 0.03, { y: 0.32, color: C.gold, mat: M.metal, seg: 10 });
  b.sphere(0.075, { y: 0.62, color: '#9fb2a0', mat: M.smooth });
  b.sphere(0.06, { y: 0.67, z: -0.03, color: C.ink, mat: M.smooth });
  b.cone(0.03, 0.14, { y: 0.68, z: 0.01, rx: -0.2, color: horn === 'gold' ? C.gold : '#d9dde2', mat: M.metal, seg: 6 });  // the single horn
  for (const sx of [-1, 1]) b.box(0.07, 0.04, 0.1, { x: sx * 0.12, y: 0.5, color: '#7a6a5a', mat: M.metal });          // pauldrons
  b.pop();
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pal = qinglv(3.2);
  const road = new THREE.Color('#cbb68c');
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (pathDist(PATH, x, z) < 0.3 + 0.06 * noise2(x * 4, z * 4) ? road : pal(x, y, z, nx, ny, nz)) });

  /* the flat-topped mountain: a broad table of terraced cliffs */
  const my = ground(...MESA) - 0.4;
  b.push({ x: MESA[0], z: MESA[1], sx: 1.25, sz: 0.85 });
  peak(b, { y: my, r: 3.1, h: 5.4, taper: 0.18, lean: 0, rand: rng, flatTop: 1, steps: 3, seg: 18, palette: qinglv(7, { base: my }) });
  b.pop();
  const TOP = my + 5.42;
  // a lid of malachite turf on the table
  b.cyl(2.8, 2.9, 0.06, { x: MESA[0], y: TOP - 0.05, z: MESA[1], sx: 1.25, sz: 0.85, color: C.shilv, seg: 24 });
  b.push({ x: MESA[0], z: MESA[1], sx: 1.25, sz: 0.85 }); b.cyl(2.75, 2.85, 0.06, { y: TOP - 0.03, color: C.shilvL, seg: 24 }); b.pop();
  // lesser buttes, also flat-topped
  for (const [x, z, r, h] of [[-5.6, -4.2, 1.5, 3.2], [4.4, -4.6, 1.3, 3.8], [-6.8, 0.4, 0.9, 2.0], [6.6, -1.4, 0.8, 2.4], [-3.4, -7.0, 1.0, 4.6], [2.0, -7.4, 0.9, 3.4]]) {
    const y = ground(x, z) - 0.3;
    peak(b, { x, y, z, r, h, taper: 0.25, lean: 0.03, rand: rng, flatTop: 1, steps: 2, seg: 13, palette: qinglv(h * 1.2, { base: y }) });
    pine(b, { x: x + 0.2, y: y + h - 0.05, z: z + 0.2, h: 0.9 + rng() * 0.5, r: rng, lean: 0.3 });
  }

  /* 莲花洞: a cave mouth ringed by stone lotus petals, at the foot of the mesa */
  const CV = [MESA[0] + 0.6, 0, MESA[1] + 2.75];
  CV[1] = ground(CV[0], CV[2]) - 0.05;
  rock(b, { x: CV[0], y: CV[1] - 0.3, z: CV[2] - 1.0, r: 1.5, h: 2.6, rand: rng, palette: qinglv(3, { base: CV[1] }) });
  b.push({ x: CV[0], y: CV[1], z: CV[2] + 0.55, ry: 0.15 });
  { const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(-0.5, 0.7); sh.absarc(0, 0.7, 0.5, Math.PI, 0, true); sh.lineTo(0.5, 0); sh.lineTo(-0.5, 0);
    b.extrude(sh, 0.5, { color: '#1c1410', mat: M.stone }); }
  const petal = (a, R, s, tilt, col) => {
    b.sphere(0.5, { x: Math.cos(a) * R, y: 0.7 + Math.sin(a) * R, z: 0.2, rz: a - Math.PI / 2, rx: tilt, sx: 0.42 * s, sy: 1.0 * s, sz: 0.16 * s, color: col, mat: M.smooth, ws: 12, hs: 8 });
  };
  for (let i = 0; i <= 8; i++) { const a = -0.25 + (i / 8) * (Math.PI + 0.5); petal(a, 1.15, 1.0, -0.4, i % 2 ? '#efd6d2' : '#e3b3b3'); }
  for (let i = 0; i <= 7; i++) { const a = -0.1 + ((i + 0.5) / 8) * (Math.PI + 0.2); petal(a, 1.55, 0.85, -0.7, '#d39aa0'); }
  b.box(1.7, 0.16, 0.9, { y: -0.08, z: 0.55, color: '#bfb8a6', mat: M.stone });
  for (const sx of [-1, 1]) b.sphere(0.32, { x: sx * 1.05, y: 0.05, z: 0.75, sy: 0.35, color: C.shilv, mat: M.flat, ws: 10, hs: 6 });   // lotus pads
  b.pop();
  // little demons guarding the gate (精细鬼、伶俐虫 and company)
  for (const [dx, dz, ry] of [[-1.05, 1.5, 0.3], [1.15, 1.4, -0.3]]) {
    b.push({ x: CV[0] + dx, y: CV[1], z: CV[2] + dz, ry, s: 0.95 });
    b.lathe([[0, 0], [0.13, 0], [0.11, 0.3], [0.07, 0.4], [0, 0.4]], { color: '#5a4a6a', mat: M.cloth, seg: 10 });
    b.sphere(0.07, { y: 0.48, color: '#8fa6a0', mat: M.smooth });
    b.cone(0.03, 0.08, { y: 0.53, color: '#d9dde2', seg: 5 });
    b.cyl(0.008, 0.008, 0.9, { x: 0.12, color: C.wood, mat: M.wood, seg: 4 });
    b.box(0.12, 0.18, 0.01, { x: 0.18, y: 0.7, color: '#c9a03a', mat: M.cloth });
    b.pop();
  }

  /* pines on the mesa rim and around the plain */
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.9 + i * 0.32), x = MESA[0] + Math.cos(a) * 3.1, z = MESA[1] + Math.sin(a) * 2.1;
    pine(b, { x, y: TOP - 0.05, z, h: 1.0 + rng() * 0.6, r: rng, lean: 0.35 });
  }
  for (let i = 0, k = 0; i < 12 && k < 400; k++) {
    const [x, z] = rng.inDisc(9.3, 3);
    if (pathDist(PATH, x, z) < 0.9 || Math.hypot(x - MESA[0], (z - MESA[1]) * 1.2) < 4.6 || (x > 2 && z > 1.5 && x < 6.5 && z < 7)) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.3 + rng() * 0.9, r: rng }); i++;
  }
  for (let i = 0; i < 9; i++) {
    const [x, z] = rng.inDisc(9.6, 4);
    if (pathDist(PATH, x, z) < 0.7) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.4, h: 0.3 + rng() * 0.6, rand: rng, palette: qinglv(1.4, { base: ground(x, z) }) });
  }
  // the pilgrims wait on the road below: Tang Seng on the horse, Sha with the load
  // (Bajie has already been carried into the cave)
  figure(b, 'sha', { x: 1.9, y: ground(1.9, 6.0), z: 6.0, ry: 0.4, s: 1.15 });
  horse(b, { x: 1.1, y: ground(1.1, 6.7), z: 6.7, ry: 0.5, rider: 'monk', s: 1.15 });

  /* the demons on the table, the elder (金角) seated, the younger (银角) raising the gourd */
  const G0 = [MESA[0] + 1.1, TOP, MESA[1] + 0.6];
  hornBoy(b, { x: MESA[0] - 0.9, y: TOP, z: MESA[1] + 0.2, ry: 0.6, s: 1.5, horn: 'gold' });
  hornBoy(b, { x: G0[0], y: G0[1], z: G0[2], ry: 0.55, s: 1.6, horn: 'silver' });
  // 七星剑 stuck in the turf beside 金角, 芭蕉扇 at his feet (two of their five treasures)
  b.cyl(0.015, 0.025, 1.0, { x: MESA[0] - 1.5, y: TOP - 0.1, z: MESA[1] + 0.6, rz: 0.15, color: '#c9d0d6', mat: M.metal, seg: 4 });
  b.box(0.24, 0.04, 0.05, { x: MESA[0] - 1.47, y: TOP + 0.7, z: MESA[1] + 0.6, rz: 0.15, color: C.gold, mat: M.metal });
  object.add(b.build());

  /* ------------------------------------------------- the gourd --- */
  const GL = 4.2;
  const gourdG = new THREE.Group();
  const gInner = group((gb) => gourd(gb, GL));
  gourdG.add(gInner);
  // tilt: mouth toward the plain (front-right, below)
  const PIV = new THREE.Vector3(G0[0] + 0.4, TOP + 3.2, G0[2] + 0.3);
  const dir = new THREE.Vector3(1.0, -0.55, 1.15).normalize();
  gourdG.position.copy(PIV).addScaledVector(dir, -GL * 0.45);
  gourdG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  object.add(gourdG);
  const MOUTH = PIV.clone().addScaledVector(dir, GL * 0.55 + 0.1);
  // glow inside the mouth
  const throat = new THREE.Mesh(new THREE.CircleGeometry(0.19 * GL / 2.74, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf7a').multiplyScalar(1.6), transparent: true, opacity: 0 }));
  throat.position.copy(MOUTH).addScaledVector(dir, -0.04);
  throat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  object.add(throat);
  // 银角's arm raised toward his treasure, and a thread of golden motes binding it to him
  const arm = group((ab) => ab.cyl(0.03, 0.035, 0.32, { color: '#3b4f6a', mat: M.cloth, seg: 6 }));
  arm.position.set(G0[0] + 0.15, TOP + 0.7, G0[2] + 0.05); arm.rotation.set(0.35, 0, -0.5);
  object.add(arm);
  const HAND = new THREE.Vector3(G0[0] + 0.32, TOP + 1.0, G0[2] + 0.15);
  const GRIP = gourdG.position.clone().addScaledVector(dir, 0.3);
  const TH = 16;
  const thread = softPuffs(TH, { color: '#ffd27a', opacity: 0.9, additive: true });
  object.add(thread.points);

  /* Wukong on his cloud, and the spiral wind */
  const START = new THREE.Vector3(5.0, 3.0, 4.6);
  const wk = new THREE.Group();
  wk.add(group((wb) => { cloud(wb, { s: 0.42, y: -0.06, rand: rng, puffs: 5 }); figure(wb, 'wukong', { pose: 'stand', s: 1.35 }); }));
  object.add(wk);
  const axis = MOUTH.clone().sub(START), AL = axis.length(); axis.normalize();
  const U = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize(), V = new THREE.Vector3().crossVectors(U, axis);
  const WIND = 150;
  const wind = softPuffs(WIND, { color: '#efe4f2', opacity: 0.55 });
  object.add(wind.points);
  const BURST = 30;
  const burst = softPuffs(BURST, { color: '#ffd37a', opacity: 0.95, additive: true });
  object.add(burst.points);
  // the stopper, with its yellow talisman (太上老君急急如律令), tied to the neck by a red cord
  const KG = GL / 2.74;
  const stopper = group((sb) => {
    sb.cyl(0.25 * KG, 0.2 * KG, 0.22 * KG, { y: -0.16 * KG, color: '#7a2a2a', mat: M.lacquer, seg: 14 });
    sb.cyl(0.3 * KG, 0.3 * KG, 0.06 * KG, { y: 0.04 * KG, color: C.gold, mat: M.metal, seg: 16 });
    sb.sphere(0.1 * KG, { y: 0.16 * KG, color: C.gold, mat: M.metal, ws: 10, hs: 8 });
    sb.box(0.12 * KG, 0.5 * KG, 0.012, { x: 0.31 * KG, y: -0.42 * KG, rz: 0.05, color: '#f2d24a', mat: M.cloth });
    sb.box(0.05 * KG, 0.3 * KG, 0.004, { x: 0.31 * KG, y: -0.36 * KG, z: 0.01, color: '#b2283a', mat: M.cloth });
  });
  object.add(stopper);
  const S_ON = MOUTH.clone().addScaledVector(dir, 0.02), Q_ON = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const S_UP = MOUTH.clone().addScaledVector(dir, 1.1);
  const NECK = PIV.clone().addScaledVector(dir, GL * 0.4);
  const S_OFF = NECK.clone().addScaledVector(U, 0.35).add(new THREE.Vector3(0, -1.45, 0));
  const Q_OFF = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.15, 1, 0.1).normalize());
  const cordGeo = new THREE.BufferGeometry();
  cordGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const cord = new THREE.Line(cordGeo, new THREE.LineBasicMaterial({ color: C.cinnabar }));
  cord.frustumCulled = false;
  object.add(cord);
  // the tiny insect he turns into (a 焦蟭虫), with a faint gold wake
  const bug = group((bb) => {
    bb.sphere(0.07, { sz: 1.6, color: '#2a2018', mat: M.smooth, ws: 8, hs: 6 });
    for (const sx of [-1, 1]) bb.box(0.16, 0.006, 0.08, { x: sx * 0.09, y: 0.04, color: '#e8e2d0', mat: M.cloth });
  });
  object.add(bug);
  const bugGlow = softPuffs(1, { color: '#ffe2a0', opacity: 0.8, additive: true });
  object.add(bugGlow.points);
  const _w = new THREE.Vector3();
  const bugAt = (q, out) => {
    out.lerpVectors(MOUTH, START, ease(q)).addScaledVector(U, Math.sin(q * 15) * 0.45 * (1 - q)).addScaledVector(V, Math.cos(q * 11) * 0.3 * (1 - q));
    out.y += Math.sin(Math.PI * q) * 1.4;
    return out;
  };
  const _p = new THREE.Vector3();
  // three helical streamers of wind, spun about the axis
  const helix = new THREE.Group();
  const windMat = new THREE.MeshBasicMaterial({ color: '#f6f0f8', transparent: true, opacity: 0, depthWrite: false });
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const p = i / 60, th = p * 13 + k * 2.094, rad = 1.5 * Math.pow(1 - p, 1.3) + 0.08; pts.push(new THREE.Vector3(Math.cos(th) * rad, p * AL, Math.sin(th) * rad)); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.024, 5, false);
    helix.add(new THREE.Mesh(g, windMat));
  }
  helix.position.copy(START);
  helix.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
  const spin = new THREE.Group(); spin.add(...helix.children.splice(0)); helix.add(spin);
  object.add(helix);
  const spiral = (p, th, out) => {
    const rad = 1.5 * Math.pow(1 - p, 1.3) + 0.08;
    return out.copy(START).addScaledVector(axis, AL * p).addScaledVector(U, Math.cos(th) * rad).addScaledVector(V, Math.sin(th) * rad);
  };

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    // wind strength
    const wk01 = smooth(0.08, 0.16, u) * (1 - smooth(0.46, 0.56, u));
    for (let i = 0; i < WIND; i++) {
      const p = (i / WIND + t * 0.22) % 1, th = p * 15 + i * 0.7 - t * 2.5;
      spiral(p, th, _p);
      wind.set(i, _p.x, _p.y, _p.z, 0.05 + 0.16 * (1 - p), wk01 * Math.sin(Math.PI * Math.min(1, p * 1.2)) * (0.6 + 0.4 * Math.sin(i)));
    }
    wind.commit();
    windMat.opacity = wk01 * 0.45;
    spin.rotation.y = -t * 2.2;
    helix.visible = wk01 > 0.01;
    for (let i = 0; i < TH; i++) {
      const p = (i / TH + t * 0.15) % 1;
      _p.lerpVectors(HAND, GRIP, p);
      thread.set(i, _p.x, _p.y + Math.sin(p * 9 + t * 2) * 0.05, _p.z, 0.08, 0.7 * Math.sin(Math.PI * p));
    }
    thread.commit();
    // Wukong: stands (0..0.15), is drawn in (0.15..0.47), sealed inside (..0.68), slips out as an insect (0.7..0.86), stands again (0.86..)
    let s = 1, vis = true;
    if (u < 0.15 || u >= 0.86) {
      wk.position.copy(START); wk.rotation.set(0, -2.4, 0); wk.position.y += Math.sin(t * 1.5) * 0.06;
      s = u >= 0.86 ? 0.001 + smooth(0.86, 0.91, u) : 1;
    } else if (u < 0.47) {
      const q = (u - 0.15) / 0.32, p = q * q;
      spiral(p, p * 15 - t * 0.5, wk.position);
      wk.rotation.set(Math.sin(q * 20) * 0.4 * q, -2.4 - q * 16, q * 1.2);
      s = 1 - 0.85 * smooth(0.5, 1, q);
    } else vis = false;
    wk.visible = vis;
    wk.scale.setScalar(s);
    // the stopper: drops in as he vanishes (0.42..0.51), is lifted by the curious demon (0.64..0.78) and hangs by its cord
    if (u >= 0.51 && u < 0.64) { stopper.position.copy(S_ON); stopper.quaternion.copy(Q_ON); }
    else if (u >= 0.64 && u < 0.8) {
      const a1 = smooth(0.64, 0.68, u), a2 = smooth(0.7, 0.78, u);
      stopper.position.lerpVectors(S_ON, S_UP, a1).lerp(S_OFF, a2);
      stopper.quaternion.copy(Q_ON).slerp(Q_OFF, a2);
    } else {
      const uc = u < 0.6 ? u : 0;   // after the lifting it simply hangs until the next capping
      stopper.position.lerpVectors(S_OFF, S_UP, smooth(0.42, 0.47, uc)).lerp(S_ON, smooth(0.47, 0.51, uc));
      stopper.quaternion.copy(Q_OFF).slerp(Q_ON, smooth(0.43, 0.49, uc));
    }
    _w.set(0, 0.16 * KG, 0).applyQuaternion(stopper.quaternion).add(stopper.position);
    const cp = cordGeo.attributes.position;
    cp.setXYZ(0, NECK.x, NECK.y, NECK.z); cp.setXYZ(1, (NECK.x + _w.x) / 2 + 0.05, Math.min(NECK.y, _w.y) - 0.25, (NECK.z + _w.z) / 2); cp.setXYZ(2, _w.x, _w.y, _w.z);
    cp.needsUpdate = true;
    // the gourd: gentle sway, a tremble while he is sealed inside
    const inside = smooth(0.49, 0.52, u) * (1 - smooth(0.66, 0.7, u));
    gInner.rotation.set(Math.sin(t * 13) * 0.02 * inside, 0, Math.sin(t * 0.6) * 0.03 + Math.sin(t * 17) * 0.025 * inside);
    // a light in the throat only once the stopper is off
    throat.material.opacity = clamp(smooth(0.67, 0.7, u) * (1 - smooth(0.76, 0.84, u)) * (0.7 + 0.3 * Math.sin(t * 6)));
    // the insect
    const bq = clamp((u - 0.7) / 0.16);
    bug.visible = u > 0.7 && u < 0.87;
    if (bug.visible) {
      bugAt(bq, bug.position);
      bugAt(Math.min(1, bq + 0.02), _w);
      bug.lookAt(_w);
      bug.scale.setScalar(1.2 + Math.abs(Math.sin(t * 40)) * 0.15);
    }
    bugGlow.set(0, bug.position.x, bug.position.y, bug.position.z, 0.6, bug.visible ? 0.8 * (1 - smooth(0.84, 0.87, u)) : 0);
    bugGlow.commit();
    // a wake of gold behind the insect, then a small bloom where he takes his own shape again
    const reform = smooth(0.85, 0.87, u) * (1 - smooth(0.9, 0.96, u));
    for (let i = 0; i < BURST; i++) {
      if (i < 18) {
        const qq = bq - i * 0.012;
        bugAt(clamp(qq), _p);
        burst.set(i, _p.x, _p.y, _p.z, 0.1 * (1 - i / 18), bug.visible && qq > 0 ? 0.6 * (1 - i / 18) : 0);
      } else {
        const a = i * 2.39996, r = 0.3 + smooth(0.85, 0.95, u) * (0.5 + (i % 4) * 0.15);
        burst.set(i, START.x + Math.cos(a) * r, START.y + 0.4 + Math.sin(a * 1.3) * r * 0.6, START.z + Math.sin(a) * r, 0.35, reform);
      }
    }
    burst.commit();
  }
  update(0);
  return { object, update };
}
