// 五行山 — the Buddha turned his palm over and pressed the Monkey King under it; the five fingers became
// five linked mountains. Here the mountain is still plainly a hand: the arm comes down out of cloud at the
// back-right, the back of the hand (with the gold six-syllable slip) is a pine-grown dome, four fingers
// splay to the left with knuckles, creases and pale nails, their tips pressed into the ground, and the
// thumb reaches toward the viewer. In the web of the thumb, from a hollow under the edge of the palm,
// the Monkey King's head and one arm stick out — grass at his temples, moss on his chin. The five hundred
// years pass as seasons: green, summer, autumn, snow, and green again — and at the end of the loop a monk
// leading a horse comes up the path to him.
import { THREE, Builder, Lines, M, C, terrain, cloud, pine, peachTree, rock, figure, horse, qinglv, fbm, smooth, clamp, lerp, ease, softPuffs } from '../kit.js';
import { rockTube, monkeyArm } from './_a_figs.js';

const CYCLE = 36;

// the hand: palm-down, fingers splayed toward the viewer, the wrist rising behind into cloud
const PALM = { x: 0.1, y: -0.2, z: -2.2, sx: 3.7, sy: 4.4, sz: 3.4 };
const palmTop = (x, z) => { const q = 1 - ((x - PALM.x) / PALM.sx) ** 2 - ((z - PALM.z) / PALM.sz) ** 2; return q > 0 ? PALM.y + PALM.sy * Math.sqrt(q) : 0; };
// [knuckle angle on the palm rim, finger direction, length, base radius]  (angles from +z toward +x)
const FINGERS = [[-0.98, -1.22, 4.4, 0.78], [-0.46, -0.6, 5.3, 0.88], [0.04, -0.04, 5.8, 0.92], [0.54, 0.46, 5.4, 0.88]];
// the whole hand is turned so the thumb points at the viewer, the fingers fan out to the left and the arm comes down from the back-right
const HR = -1.15, HC = Math.cos(HR), HS = Math.sin(HR), OX = -1.1, OZ = 0.3, HK = 1.1;
const rot = (x, z) => [(x * HC + z * HS) * HK + OX, (-x * HS + z * HC) * HK + OZ];
function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 2, z * 0.3 + 6, 4);
  let h = 0.3 + 0.45 * n;
  h += smooth(5, 9.5, r) * (0.4 + 1.6 * n) * smooth(1.5, -4, z);                   // the range behind
  return Math.max(0.1, h * smooth(10.7, 9.6, r) + 0.1 * (1 - smooth(10.7, 9.6, r)));
}
const PATH = [[1.9, 9.7], [1.6, 8.2], [1.3, 6.8], [1.0, 5.5], [0.7, 4.6]];
const pathAt = (t) => { const f = t * (PATH.length - 1), i = Math.min(PATH.length - 2, Math.floor(f)), k = f - i; return [lerp(PATH[i][0], PATH[i + 1][0], k), lerp(PATH[i][1], PATH[i + 1][1], k)]; };
function pathDist(x, z) { let d = 1e9; for (let i = 0; i < 40; i++) { const [px, pz] = pathAt(i / 39); d = Math.min(d, Math.hypot(x - px, z - pz)); } return d; }

// season keyframes: [u, colour, amount, snow]
const SEASONS = [[0, '#a8c87a', 0.42, 0], [0.14, '#a8c87a', 0.42, 0], [0.26, '#4f9a62', 0.5, 0], [0.36, '#4f9a62', 0.5, 0], [0.46, '#c98a3c', 0.6, 0], [0.55, '#c98a3c', 0.6, 0], [0.63, '#f2f5f7', 0.95, 1], [0.8, '#f2f5f7', 0.95, 1], [0.9, '#a8c87a', 0.42, 0], [1, '#a8c87a', 0.42, 0]];

/** one finger: from inside the palm over the knuckle, down two joints to the tip pressed into the ground */
function finger(b, lines, { kx, kz, ky, dir, len, r0, joints = 2, rng, pal, nails }) {
  const dx = Math.sin(dir), dz = Math.cos(dir);
  const at = (s, y) => [kx + dx * s * len, y, kz + dz * s * len];
  const pts = joints === 2
    ? [at(-0.2, ky - 0.4), at(0, ky + 0.1), at(0.3, ky + 0.05), at(0.56, ky * 0.66), at(0.82, ky * 0.3 + 0.2), at(1, 0.55)]
    : [at(-0.25, ky - 0.3), at(0, ky + 0.1), at(0.45, ky * 0.7), at(0.8, ky * 0.32 + 0.2), at(1, 0.55)];
  const bumps = joints === 2 ? [[0.17, 0.2], [0.42, 0.12], [0.7, 0.1]] : [[0.22, 0.16], [0.6, 0.12]];
  const rad = (t) => {
    let k = 1 - 0.36 * t;
    for (const [c, a] of bumps) k += a * Math.exp(-(((t - c) / 0.055) ** 2));
    return r0 * k;
  };
  b.tube(pts, rad, { segs: 44, radial: 12, mat: M.flat, faceColor: pal });
  const tip = pts[pts.length - 1];
  b.ico(r0 * 0.66, { x: tip[0], y: tip[1], z: tip[2], sy: 0.8, faceColor: pal, mat: M.flat, detail: 1 });
  // the nail: a pale plate on top of the last joint, tipped down toward the ground
  nails.sphere(r0 * 0.58, { x: tip[0] - dx * r0 * 0.3, y: tip[1] + r0 * 0.66, z: tip[2] - dz * r0 * 0.3, ry: dir, rx: 0.35, sx: 0.85, sy: 0.3, sz: 1.2, color: '#e6dac2', mat: M.stone, ws: 12, hs: 6 });
  // creases across the knuckles (ink, like 皴 lines)
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const px = Math.cos(dir), pz = -Math.sin(dir);
  for (const [c] of bumps.slice(1)) for (const off of [-0.035, 0, 0.035]) {
    const t = c + off, p = curve.getPointAt(t), r = rad(t) * 0.98, line = [];
    for (let j = -4; j <= 4; j++) { const a = j * 0.26; line.push([p.x + px * r * Math.sin(a), p.y + r * Math.cos(a) * 0.95 + 0.02, p.z + pz * r * Math.sin(a)]); }
    lines.add(line.map(([x, y, z]) => { const [rx, rz] = rot(x, z); return [rx, y, rz]; }), '#3b4034');
  }
  // a pine on the big knuckle, sometimes on the middle joint
  const k1 = curve.getPointAt(0.17);
  pine(b, { x: k1.x + px * 0.15, y: k1.y + rad(0.17) * 0.8, z: k1.z, h: 0.9 + rng() * 0.6, r: rng, lean: 0.3 });
  if (rng() < 0.5) { const k2 = curve.getPointAt(0.45); pine(b, { x: k2.x, y: k2.y + rad(0.45) * 0.75, z: k2.z, h: 0.6 + rng() * 0.3, r: rng, lean: 0.4 }); }
  return pts;
}

export default function build({ rng }) {
  const object = new THREE.Group();
  const b = new Builder();      // everything that takes the season (rock, pines, trees)
  const nails = new Builder();
  const lines = new Lines();

  const pal = qinglv(7.5);
  const pathC = new THREE.Color('#b9a57e');
  terrain(b, { R: 10.5, rings: 50, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => (pathDist(x, z) < 0.38 ? pathC : pal(x, y, z, nx, ny, nz)) });

  /* the back of the hand, tilted so it rises toward the wrist */
  b.push({ x: OX, z: OZ, ry: HR, s: HK }); nails.push({ x: OX, z: OZ, ry: HR, s: HK });
  b.sphere(1, { x: PALM.x, y: PALM.y, z: PALM.z, sx: PALM.sx, sy: PALM.sy, sz: PALM.sz, rx: 0.12, ws: 28, hs: 16, faceColor: pal, mat: M.flat });
  // the wrist and forearm, rising behind into a bank of cloud
  b.tube([[0.1, 2.4, -3.8], [0.05, 3.9, -5.9], [0, 5.6, -7.4], [-0.1, 7.4, -8.6]], (t) => 2.3 - 0.35 * t + 0.25 * Math.exp(-(((t - 0.12) / 0.12) ** 2)), { segs: 30, radial: 16, mat: M.flat, faceColor: pal });
  // tendons fanning over the back of the hand to the knuckles
  const fingerPts = [];
  FINGERS.forEach(([ka, dir, len, r0]) => {
    const kx = PALM.x + Math.sin(ka) * PALM.sx * 0.78, kz = PALM.z + Math.cos(ka) * PALM.sz * 0.8;
    const ky = palmTop(kx, kz) * 0.95 + 0.1;
    b.tube([[PALM.x + Math.sin(ka) * 0.6, palmTop(PALM.x, PALM.z - 1.2) + 0.05, PALM.z - 1.4], [(kx + PALM.x) / 2, palmTop((kx + PALM.x) / 2, (kz + PALM.z) / 2) + 0.12, (kz + PALM.z) / 2], [kx, ky + 0.2, kz]], 0.32, { segs: 12, radial: 7, mat: M.flat, faceColor: pal });
    b.ico(r0 * 1.12, { x: kx, y: ky + 0.05, z: kz, sz: 0.85, faceColor: pal, mat: M.flat, detail: 1 });
    fingerPts.push([finger(b, lines, { kx, kz, ky, dir, len, r0, rng, pal, nails }), r0]);
  });
  // the thumb, splayed out to the right, lower on the side of the hand
  fingerPts.push([finger(b, lines, { kx: 3.1, kz: -2.8, ky: 2.3, dir: 1.28, len: 4.4, r0: 1.0, joints: 1, rng, pal, nails }), 1.0]);
  fingerPts.push([[[PALM.x, 0, PALM.z + 1], [0, 0, -8.6]], 2.6]);
  // distance (world xz) from the hand, to keep rocks off it
  const segs = fingerPts.map(([pts, r]) => { const a = rot(pts[0][0], pts[0][2]), c = rot(pts[pts.length - 1][0], pts[pts.length - 1][2]); return [a, c, r]; });
  const nearHand = (x, z) => {
    let d = Math.hypot(...((p) => [x - p[0], z - p[1]])(rot(PALM.x, PALM.z))) - 3.8;
    for (const [[ax, az], [cx, cz], r] of segs) { const vx = cx - ax, vz = cz - az, k = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - vx * k, z - az - vz * k) - r); }
    return d;
  };

  // pines on the back of the hand
  for (const [x, z] of [[-1.3, -2.4], [1.5, -1.5], [-0.4, -0.6], [1.2, -3.2], [-2.0, -1.4]]) pine(b, { x, y: palmTop(x, z) - 0.15, z, h: 1.2 + rng() * 0.8, r: rng, lean: 0.3 });
  b.pop(); nails.pop();
  // peach trees and rocks at its foot
  for (const [x, z] of [[-5.6, 6.6], [-7.2, -4.6], [-2.2, 8.4], [6.0, 6.6], [8.3, 2.4], [6.2, 8.4]]) peachTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.1 + rng() * 0.4, r: rng, fruit: 0 });
  for (let i = 0; i < 9; i++) {
    const [x, z] = rng.inDisc(9.6, 6.4);
    if (pathDist(x, z) < 1 || nearHand(x, z) < 0.8) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.4 + rng() * 0.5, rand: rng, palette: qinglv(1.5, { base: ground(x, z) }) });
  }
  const sb = b.build();
  const seasonMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const uS = { uSeasonCol: { value: new THREE.Color('#9cc46f') }, uSeasonAmt: { value: 0.5 }, uSnow: { value: 0 } };
  seasonMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uS);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vUp;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  vUp = normalize(mat3(modelMatrix) * objectNormal).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vUp; uniform vec3 uSeasonCol; uniform float uSeasonAmt; uniform float uSnow;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float upk = smoothstep(0.5 - uSnow * 0.32, 0.82 - uSnow * 0.3, vUp);\n  diffuseColor.rgb = mix(diffuseColor.rgb, uSeasonCol, upk * uSeasonAmt);');
  };
  sb.traverse((o) => { if (o.isMesh && o.material === M.flat) o.material = seasonMat; });
  object.add(sb);

  /* nails, creases, the seal on the back of the hand, the cloud the arm comes down from */
  object.add(nails.build(), lines.build({ opacity: 0.55 }));
  const sb2 = new Builder();
  const sealY = palmTop(0.3, -2.9) * HK + 0.3;
  const [sx0, sz0] = rot(0.3, -2.9);
  sb2.box(0.95, 0.05, 0.36, { x: sx0, y: sealY, z: sz0, ry: 0.25 + HR, rx: -0.2, color: '#ffd77a', mat: M.glow, glow: 1.5 });
  for (const [x, y, z, s, ry] of [[0.3, 7.6, -6.9, 1.9, 0.1], [-2.0, 6.8, -7.6, 1.5, 0.5], [2.3, 6.6, -7.5, 1.55, -0.4], [0.2, 8.7, -8.3, 1.7, 2.9], [-1.0, 5.9, -8.6, 1.4, 0.2], [1.8, 8.2, -7.9, 1.2, 0.3]]) { const [cx, cz] = rot(x, z); cloud(sb2, { x: cx, y, z: cz, s, ry: ry + HR, rand: rng, puffs: 7 }); }
  object.add(sb2.build());
  // Wukong's head and one arm out from under the edge of the palm, in the web of the thumb
  const [WX, WZ] = rot(3.4, 0.1), WY = ground(WX, WZ);
  const WS = 3.4;
  {
    // the dark hollow under the edge of the palm he looks out of, and a lip of fallen stone
    const gb = new Builder();
    gb.sphere(0.62, { x: WX, y: WY + 0.05, z: WZ - 0.3, sx: 1.25, sy: 0.75, sz: 0.5, color: '#2a2722', mat: M.stone, ws: 14, hs: 8 });
    for (const [dx, dz, r] of [[-0.75, 0.1, 0.22], [0.8, 0.0, 0.18], [-0.4, 0.42, 0.13]]) rock(gb, { x: WX + dx, y: WY - 0.05, z: WZ + dz, r, h: r * 1.2, rand: rng, color: '#8d8a80' });
    object.add(gb.build());
  }
  const head = new THREE.Group();
  {
    const hb = new Builder();
    hb.sphere(0.075, { y: 0, color: C.fur, mat: M.smooth });
    hb.sphere(0.05, { y: -0.01, z: 0.045, sx: 1.05, sy: 0.9, sz: 0.6, color: '#e7a98a', mat: M.smooth });
    for (const sx of [-1, 1]) hb.sphere(0.022, { x: sx * 0.075, y: 0.01, sz: 0.5, color: '#e7a98a', mat: M.smooth, ws: 6, hs: 4 });
    for (const sx of [-1, 1]) hb.cone(0.025, 0.05, { x: sx * 0.06, y: 0.03, z: -0.01, rz: -sx * 0.7, color: '#6f9a4a', mat: M.smooth, seg: 4 });     // 鬓边少发多青草
    hb.sphere(0.03, { y: -0.055, z: 0.04, sx: 1.4, sy: 0.6, color: '#5f8a4a', mat: M.smooth, ws: 6, hs: 4 });                                    // 颔下无须有绿莎
    head.add(hb.build());
  }
  head.scale.setScalar(WS);
  head.position.set(WX, WY + 0.1, WZ);
  head.rotation.order = 'YXZ';
  object.add(head);
  const arm = new THREE.Group();
  { const ab = new Builder(); monkeyArm(ab, { len: 0.2 }); arm.add(ab.build()); }
  arm.scale.setScalar(WS);
  arm.position.set(WX + 0.4, WY + 0.02, WZ + 0.02);
  object.add(arm);

  /* the monk leading his horse up the path (end of the loop) */
  const party = new THREE.Group();
  const pb = new Builder();
  figure(pb, 'monk', { s: 1.25 });
  const monk = pb.build();
  const hb2 = new Builder();
  horse(hb2, { s: 1.05, color: '#c8b89a', saddle: '#7a4a2e' });
  const steed = hb2.build();
  party.add(monk, steed);
  object.add(party);

  /* drifting season particles: petals / nothing / leaves / snow */
  const NP = 140;
  const parts = softPuffs(NP, { color: '#f6b8c0', opacity: 0.9 });
  object.add(parts.points);
  const pd = Array.from({ length: NP }, () => { const [x, z] = rng.inDisc(10); return { x, z, ph: rng(), sp: 0.04 + rng() * 0.04, s: 0.06 + rng() * 0.06 }; });
  const col = new THREE.Color(), c2 = new THREE.Color();

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    let k = 1;
    while (k < SEASONS.length - 1 && SEASONS[k][0] < u) k++;
    const [u0, cA, aA, sA] = SEASONS[k - 1], [u1, cB, aB, sB] = SEASONS[k];
    const f = ease(clamp((u - u0) / Math.max(1e-4, u1 - u0)));
    uS.uSeasonCol.value.set(cA).lerp(c2.set(cB), f);
    uS.uSeasonAmt.value = lerp(aA, aB, f);
    uS.uSnow.value = lerp(sA, sB, f);
    // particles: spring petals, autumn leaves, winter snow
    const spring = 1 - smooth(0.12, 0.2, u) + smooth(0.88, 0.95, u);
    const autumn = smooth(0.42, 0.48, u) * (1 - smooth(0.56, 0.62, u));
    const winter = smooth(0.58, 0.64, u) * (1 - smooth(0.82, 0.88, u));
    col.set('#f6b8c0').multiplyScalar(spring).add(c2.set('#c8763a').multiplyScalar(autumn)).add(c2.set('#ffffff').multiplyScalar(winter));
    parts.mat.uniforms.uColor.value.copy(col);
    const amt = Math.min(1, spring * 0.5 + autumn * 0.8 + winter);
    for (let i = 0; i < NP; i++) {
      const p = pd[i], y = 12 - ((t * p.sp + p.ph) % 1) * 12;
      parts.set(i, p.x + Math.sin(t * 0.6 + p.ph * 20) * 0.4, y, p.z, p.s * (winter > 0.5 ? 1.2 : 1), amt * smooth(0, 0.8, y) * (i % 3 === 0 || winter > 0.3 ? 1 : 0.4));
    }
    parts.commit();
    // the monk comes up the path at the end
    const q = clamp((u - 0.84) / 0.13);
    const vis = smooth(0.84, 0.86, u) * (1 - smooth(0.985, 1, u));
    party.visible = vis > 0.01;
    if (party.visible) {
      const [mx, mz] = pathAt(Math.min(1, q * 0.98)), [nx, nz] = pathAt(Math.min(1, q * 0.98 + 0.02));
      const ry = Math.atan2(nx - mx, nz - mz);
      monk.position.set(mx, ground(mx, mz) + Math.abs(Math.sin(t * 3.5)) * 0.02 * (q < 1 ? 1 : 0), mz);
      monk.rotation.y = ry;
      const [hx, hz] = pathAt(Math.max(0, q * 0.98 - 0.12));
      steed.position.set(hx, ground(hx, hz), hz);
      steed.rotation.y = ry;
      monk.scale.setScalar(vis); steed.scale.setScalar(vis);
    }
    // the arm beckons (乱招手) when the monk is near; otherwise rests
    const beckon = smooth(0.86, 0.92, u);
    arm.rotation.set(-0.4 - beckon * 0.6, 0, lerp(-1.3, -0.4 + Math.sin(t * 5) * 0.4, beckon));
    head.rotation.set(0, 0.25 + lerp(0, 0.5, beckon) + Math.sin(t * 0.2) * 0.1, 0);
  }
  update(0);
  return { object, update };
}
