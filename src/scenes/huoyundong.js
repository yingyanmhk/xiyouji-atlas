// 火云洞 — not the fire, but Guanyin's answer to it. She has emptied her vase over 号山 and the
// mountain stands in a dark sea; on the water floats the lotus throne she made from the thirty-six
// 天罡刀 — a lotus whose petals are blades. 红孩儿, mocking her, has climbed up to sit on it; the
// blades close round him and turn to barbed hooks. Across the water his 三昧真火, a purple-red
// smoke-fire, rolls back into the 火云洞 on its crag. Guanyin stands on her lotus, Wukong at her side.
// Around them the drowned crags of 号山 with dead trees, white-capped crests and spray on a moving dark sea,
// low mist. Loop (24 s): the throne opens — the boy sits — the blades close — they open on an empty seat,
// and a thread of gold carries him to Guanyin's side as 善财童子, palms joined — then the loop begins again.
import { THREE, Builder, M, C, terrain, peak, rock, cloud, figure, bareTree, fbm, noise2, smooth, clamp, lerp, ramp, setInst, softPuffs } from '../kit.js';
import { flowWater } from './_b_kit.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { guanyin, lotusSeat, group } from './_c_util.js';

const CYCLE = 24;
const SEA = 0.75;
const LOTUS = [0.6, 1.4];
const CRAG = [-5.0, -3.6];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 2, z * 0.3 + 8, 4);
  let h = 0.1 + 0.45 * n;
  h += smooth(4.5, 0.8, Math.hypot(x - CRAG[0], z - CRAG[1])) * (2.5 + 2 * n);   // the crag's foot
  h += smooth(3, 0.5, Math.hypot(x - 5.8, z + 3.8)) * 1.6;
  return h * smooth(10.6, 9.6, r) + 0.12;
}
// basalt of 号山: violet-grey, crimson where the fire has scorched it
function basalt(hmax, base = 0) {
  const stops = [[0, '#2a2430'], [0.4, '#3d3344'], [0.75, '#4f4458'], [1, '#62566a']];
  const out = new THREE.Color(), scorch = new THREE.Color('#6a2a30'), moss = new THREE.Color('#3f5a58');
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax), st = noise2((x + z) * 1.8, y * 0.3) - 0.5;
    ramp(stops, t + st * 0.2, out).multiplyScalar(0.9 + st * 0.3);
    out.lerp(moss, 0.4 * smooth(0.55, 0.85, ny));
    if (y < SEA + 0.5) out.lerp(scorch, 0.0);
    return out;
  };
}

// 红孩儿 seated cross-legged: red bib, bare arms, three tufts of hair. ~0.5 tall at s=1. Faces +z.
function redBoy(b, { s = 1 } = {}) {
  b.push({ s });
  for (const sx of [-1, 1]) b.cyl(0.045, 0.05, 0.26, { x: sx * 0.07, y: 0.05, z: 0.04, rz: Math.PI / 2 + sx * 0.25, ry: sx * 0.5, color: '#e9c09a', mat: M.smooth, seg: 6 });
  b.cyl(0.09, 0.11, 0.08, { y: 0.0, color: '#6a5a8a', mat: M.cloth, seg: 10 });            // short trousers / skirt
  b.cyl(0.08, 0.095, 0.2, { y: 0.07, color: '#e9c09a', mat: M.smooth, seg: 10 });
  b.box(0.15, 0.17, 0.02, { y: 0.09, z: 0.085, rx: -0.08, color: '#d83a2c', mat: M.cloth });   // 红肚兜
  b.sphere(0.08, { y: 0.36, color: '#ecc6a0', mat: M.smooth, ws: 10, hs: 8 });
  for (const [hx, hz] of [[0, -0.02], [-0.06, 0.0], [0.06, 0.0]]) b.sphere(0.03, { x: hx, y: 0.44, z: hz, color: C.ink, mat: M.smooth, ws: 6, hs: 4 });
  for (const sx of [-1, 1]) b.cyl(0.022, 0.026, 0.17, { x: sx * 0.09, y: 0.22, rz: sx * 2.3, rx: 0.6, color: '#e9c09a', mat: M.smooth, seg: 6 });  // hands raised, mocking
  b.pop();
}

// 善财童子 — what the boy becomes: standing, palms joined, a green scarf over the red bib, a small halo. Faces +z.
function shancai(b, { s = 1 } = {}) {
  b.push({ s });
  for (const sx of [-1, 1]) b.cyl(0.035, 0.04, 0.2, { x: sx * 0.045, color: '#e9c09a', mat: M.smooth, seg: 6 });
  b.cyl(0.085, 0.1, 0.1, { y: 0.16, color: '#6a5a8a', mat: M.cloth, seg: 10 });
  b.cyl(0.075, 0.09, 0.18, { y: 0.24, color: '#e9c09a', mat: M.smooth, seg: 10 });
  b.box(0.14, 0.15, 0.02, { y: 0.25, z: 0.08, color: '#d83a2c', mat: M.cloth });
  b.tube([[-0.16, 0.2, 0.0], [-0.1, 0.4, 0.03], [0, 0.43, 0.07], [0.1, 0.4, 0.03], [0.16, 0.2, 0.0]], 0.016, { color: '#4f9a7a', mat: M.cloth, radial: 4 });
  for (const sx of [-1, 1]) b.cyl(0.02, 0.024, 0.15, { x: sx * 0.075, y: 0.39, z: 0.02, rz: sx * 2.5, rx: -0.9, color: '#e9c09a', mat: M.smooth, seg: 6 });   // palms joined
  b.sphere(0.075, { y: 0.52, color: '#ecc6a0', mat: M.smooth, ws: 10, hs: 8 });
  for (const [hx, hz] of [[0, -0.02], [-0.055, 0.0], [0.055, 0.0]]) b.sphere(0.027, { x: hx, y: 0.6, z: hz, color: C.ink, mat: M.smooth, ws: 6, hs: 4 });
  b.torus(0.11, 0.006, { y: 0.54, z: -0.06, color: '#ffd98a', mat: M.glow, glow: 1.2, ts: 24 });
  b.pop();
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const caveGlow = new THREE.MeshBasicMaterial({ vertexColors: true });   // own glow, so night can brighten it
  /* sea bed + the drowned mountain */
  const bed = new THREE.Color('#1a2a34');
  const bas = basalt(6);
  terrain(b, { R: 10.5, rings: 40, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < SEA - 0.05 ? bed : bas(x, y, z, nx, ny, nz)) });

  // the crag of 火云洞
  const cy = ground(...CRAG) - 0.4;
  peak(b, { x: CRAG[0], y: cy, z: CRAG[1], r: 1.9, h: 8.4, lean: 0.12, leanDir: 0.5, rand: rng, taper: 0.7, steps: 3, palette: basalt(8.4, cy) });
  peak(b, { x: CRAG[0] - 1.9, y: cy - 0.6, z: CRAG[1] - 0.8, r: 1.1, h: 6.0, lean: 0.1, rand: rng, palette: basalt(6, cy) });
  peak(b, { x: CRAG[0] + 1.6, y: cy - 0.8, z: CRAG[1] - 1.4, r: 1.0, h: 5.2, lean: 0.1, rand: rng, palette: basalt(5, cy) });
  // the cave mouth, facing the lotus
  const CAVE = new THREE.Vector3(CRAG[0] + 1.25, cy + 2.4, CRAG[1] + 1.35);
  b.push({ x: CAVE.x, y: CAVE.y - 0.7, z: CAVE.z, ry: 0.75 });
  { const sh = new THREE.Shape(); sh.moveTo(-0.6, 0); sh.lineTo(-0.6, 0.8); sh.absarc(0, 0.8, 0.6, Math.PI, 0, true); sh.lineTo(0.6, 0); sh.lineTo(-0.6, 0);
    b.extrude(sh, 0.6, { color: '#120a0e', mat: M.stone });
    const sh2 = new THREE.Shape(); sh2.moveTo(-0.45, 0); sh2.lineTo(-0.45, 0.8); sh2.absarc(0, 0.8, 0.45, Math.PI, 0, true); sh2.lineTo(0.45, 0); sh2.lineTo(-0.45, 0);
    b.extrude(sh2, 0.02, { z: 0.31, color: '#b2283a', mat: caveGlow, glow: 0.9 }); }
  b.box(1.8, 0.2, 1.0, { y: -0.18, z: 0.5, color: '#3d3344', mat: M.flat });
  b.pop();
  // other drowned peaks of 号山 standing in the water
  const CRAGS = [[5.8, -3.8, 1.2, 5.2], [3.4, -6.6, 1.0, 6.4], [-1.4, -7.4, 1.2, 7.0], [7.4, -0.6, 0.7, 3.0], [-7.6, 1.6, 0.7, 2.6], [-2.6, -5.0, 0.6, 3.4],
    [-8.0, -2.4, 0.9, 4.4], [-6.4, -6.6, 1.0, 5.8], [0.9, -8.9, 0.9, 5.2], [6.2, -6.6, 0.9, 4.6], [8.5, -3.2, 0.7, 3.6], [1.6, -5.4, 0.55, 2.6],
    [-8.4, 4.4, 0.75, 2.9], [-7.0, 5.6, 0.55, 1.8], [-8.9, 2.0, 0.5, 1.6], [8.8, 3.0, 0.6, 2.1], [-4.8, 7.6, 0.45, 1.2], [7.4, 6.2, 0.6, 1.6], [8.4, 4.8, 0.45, 1.0], [-3.2, 3.8, 0.4, 1.1]];
  for (const [x, z, r, h] of CRAGS) {
    const y = ground(x, z) - 0.4;
    const top = peak(b, { x, y, z, r, h, lean: 0.1 + rng() * 0.1, rand: rng, palette: basalt(h, y) });
    // scorched dead trees clinging to the taller crags
    if (h > 4 && top && rng() < 0.7) bareTree(b, { x: top[0], y: top[1] - 0.15, z: top[2], h: 0.7 + rng() * 0.4, r: rng, color: '#2a1e20' });
  }
  for (let i = 0; i < 12; i++) {
    const [x, z] = rng.inDisc(9.6, 3);
    if (Math.hypot(x - LOTUS[0], z - LOTUS[1]) < 3 || Math.hypot(x - 4.6, z - 4.2) < 2.2) continue;
    rock(b, { x, y: SEA - 0.35, z, r: 0.2 + rng() * 0.4, h: 0.6 + rng() * 0.6, rand: rng, palette: basalt(1.2, SEA - 0.3) });
  }

  /* Guanyin on her lotus over the water, Wukong on a cloud beside her */
  const GY = [4.3, SEA + 0.9, 3.4];
  lotusSeat(b, { x: GY[0], y: GY[1] - 0.25, z: GY[2], r: 0.8 });
  guanyin(b, { x: GY[0], y: GY[1], z: GY[2], ry: -1.75, s: 2.3 });
  cloud(b, { x: GY[0] + 0.9, y: GY[1] - 0.6, z: GY[2] - 1.1, s: 0.5, rand: rng, puffs: 5, ry: 0.7 });
  figure(b, 'wukong', { x: GY[0] + 0.9, y: GY[1] - 0.55, z: GY[2] - 1.1, ry: -2.0, s: 1.45, pose: 'staff' });
  // the base of the throne: a ring of lotus leaves on the water
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    b.cyl(0.55, 0.6, 0.03, { x: LOTUS[0] + Math.cos(a) * 1.9, y: SEA + 0.01, z: LOTUS[1] + Math.sin(a) * 1.9, color: i % 2 ? '#2f5a4e' : '#3a6a58', mat: M.smooth, seg: 14 });
  }
  b.cyl(0.85, 0.7, 0.35, { x: LOTUS[0], y: SEA - 0.05, z: LOTUS[1], color: '#c9cfd4', mat: M.metal, seg: 16 });
  object.add(b.build());

  /* sea surface */
  const seaMat = flowWater({ deep: '#14303e', light: '#2f6274', foam: '#4c8090', dir: [0.35, 1], speed: 0.4, scale: 0.42, opacity: 0.93 });
  const sea = new THREE.Mesh(new THREE.CircleGeometry(10.95, 72), seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = SEA;
  object.add(sea);
  // white-capped crests that rise and sink on the dark water (the sea she poured over the fire)
  const crestG = new THREE.TorusGeometry(0.42, 0.075, 5, 12, Math.PI);
  crestG.scale(1, 0.7, 1.6);
  const NW = 22;
  const crests = new THREE.InstancedMesh(crestG, new THREE.MeshStandardMaterial({ color: '#a9c4ca', roughness: 0.5, emissive: '#2a4a56', emissiveIntensity: 0.25 }), NW);
  object.add(crests);
  const wd = [];
  for (let tries = 0; wd.length < NW && tries < 400; tries++) {
    const [x, z] = rng.inDisc(9.8, 1.5);
    if (Math.hypot(x - LOTUS[0], z - LOTUS[1]) < 3 || Math.hypot(x - 4.3, z - 3.4) < 1.8 || ground(x, z) > SEA - 0.15) continue;
    wd.push({ x, z, ry: 0.35 + rng.range(-0.3, 0.3), ph: rng(), sp: 0.12 + rng() * 0.08, s: 0.7 + rng() * 0.7 });
  }
  // spray where the swell breaks on the drowned peaks, and low mist over the water
  const SPRAY = 48, spray = softPuffs(SPRAY, { color: '#d6e4e8', opacity: 0.38 });
  const spots = CRAGS.filter((c) => Math.hypot(c[0], c[1]) < 9.6).map(([x, z, r]) => [x, z, r]).concat([[CRAG[0], CRAG[1], 2.6]]);
  const sd = Array.from({ length: SPRAY }, (_, i) => { const [x, z, r] = spots[i % spots.length], a = rng() * Math.PI * 2; return { x: x + Math.cos(a) * r * 0.95, z: z + Math.sin(a) * r * 0.95, ph: rng(), s: 0.25 + rng() * 0.35 }; });
  const MISTN = 30, mist = softPuffs(MISTN, { color: '#a49cb0', opacity: 0.42 });
  const md = Array.from({ length: MISTN }, () => { const [x, z] = rng.inDisc(9.2); return { x, z, y: SEA + 0.25 + rng() * 0.9, s: 1.6 + rng() * 2.2, ph: rng() }; });
  object.add(spray.points, mist.points);
  // ripples round the throne
  const RIP = 4;
  const ripMat = new THREE.MeshBasicMaterial({ color: '#a9c9d4', transparent: true, opacity: 0.4, depthWrite: false });
  const ripples = [];
  for (let i = 0; i < RIP; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), ripMat.clone()); m.rotation.x = -Math.PI / 2; m.position.set(LOTUS[0], SEA + 0.01, LOTUS[1]); object.add(m); ripples.push(m); }

  /* the lotus of thirty-six blades */
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.05, 0); bladeShape.lineTo(-0.11, 0.95); bladeShape.lineTo(0, 1.45); bladeShape.lineTo(0.11, 0.95); bladeShape.lineTo(0.05, 0); bladeShape.lineTo(-0.05, 0);
  const bladeG = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 1 });
  bladeG.translate(0, 0.12, -0.02);
  const guard = new THREE.BoxGeometry(0.28, 0.05, 0.08); guard.translate(0, 0.12, 0);
  const grip = new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6); grip.translate(0, 0.04, 0);
  const tint = (g, c) => { const n = g.index ? g.toNonIndexed() : g; const col = new Float32Array(n.attributes.position.count * 3); const cc = new THREE.Color(c); for (let i = 0; i < col.length; i += 3) col.set([cc.r, cc.g, cc.b], i); n.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'color'].includes(k)) n.deleteAttribute(k); return n; };
  const blade = mergeGeometries([tint(bladeG, '#dfe6ec'), tint(guard, '#d6a94a'), tint(grip, '#7a2a2a')], false);
  const bladeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.55, emissive: '#6a7a96', emissiveIntensity: 0.35 });
  const NB = 36;
  const blades = new THREE.InstancedMesh(blade, bladeMat, NB);
  blades.castShadow = true;
  object.add(blades);
  const bd = [];
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 12; i++) bd.push({ ring, a: (i / 12) * Math.PI * 2 + ring * 0.26, s: 2.1 - ring * 0.35 });

  // the boy
  const boy = group((bb) => redBoy(bb, { s: 1.9 }));
  object.add(boy);
  const BOY_Y = SEA + 0.32;
  // what he becomes: 善财童子, on a small lotus at Guanyin's side, palms together
  const SC = [3.3, SEA + 0.45, 4.6];
  const sc = group((bb) => { lotusSeat(bb, { r: 0.32 }); shancai(bb, { s: 1.9 }); });
  sc.position.set(SC[0], SC[1], SC[2]); sc.rotation.y = -0.5;
  object.add(sc);
  const motes = softPuffs(16, { color: '#ffd98a', opacity: 0.9, additive: true });
  object.add(motes.points);

  /* his true fire, rolling back into the cave as smoke and flame */
  const FIRE = 70;
  const fire = softPuffs(FIRE, { color: '#b8283e', opacity: 0.4, additive: true });
  const smoke = softPuffs(FIRE, { color: '#4a2650', opacity: 0.5 });
  object.add(smoke.points, fire.points);
  const src = new THREE.Vector3(LOTUS[0] - 1.2, SEA + 1.6, LOTUS[1] - 0.8);
  const fd = Array.from({ length: FIRE }, () => ({ ph: rng(), off: [rng.range(-1, 1), rng.range(-0.6, 0.8), rng.range(-1, 1)], s: 0.6 + rng() * 1.2 }));
  const _v = new THREE.Vector3();
  // glints on the blades
  const GLINT = 10;
  const glints = softPuffs(GLINT, { color: '#ffffff', opacity: 1, additive: true });
  object.add(glints.points);

  const S_DEEP = seaMat.uniforms.uDeep.value.clone(), S_LIGHT = seaMat.uniforms.uLight.value.clone(), S_FOAM = seaMat.uniforms.uFoam.value.clone();
  const SPRAY_C = spray.mat.uniforms.uColor.value.clone(), MIST_C = mist.mat.uniforms.uColor.value.clone();
  function update(t, dt, env) {
    const night = env?.night ?? 0;
    caveGlow.color.setScalar(1 + night * 0.9);
    seaMat.uniforms.uTime.value = t;
    const sk = 1 - 0.45 * night;   // the unlit sea would glow at night
    seaMat.uniforms.uDeep.value.copy(S_DEEP).multiplyScalar(sk); seaMat.uniforms.uLight.value.copy(S_LIGHT).multiplyScalar(sk); seaMat.uniforms.uFoam.value.copy(S_FOAM).multiplyScalar(sk);
    spray.mat.uniforms.uColor.value.copy(SPRAY_C).multiplyScalar(1 - 0.6 * night); mist.mat.uniforms.uColor.value.copy(MIST_C).multiplyScalar(1 - 0.5 * night);
    const u = (t % CYCLE) / CYCLE;
    // 0..0.2 open and empty; 0.2..0.32 the boy drops onto it; 0.36..0.5 the blades close; hold; 0.82..0.95 open, boy gone
    const close = smooth(0.36, 0.5, u) * (1 - smooth(0.82, 0.92, u));
    for (let i = 0; i < NB; i++) {
      const d = bd[i];
      const open = 1.05 + d.ring * 0.18, shut = 0.12 + d.ring * 0.08;
      const tilt = lerp(open, shut, close) + Math.sin(t * 0.8 + d.a * 3) * 0.02;
      const R = 0.42 + d.ring * 0.3;
      setInst(blades, i, LOTUS[0] + Math.cos(d.a) * R, SEA + 0.2 + d.ring * 0.06, LOTUS[1] + Math.sin(d.a) * R, Math.PI / 2 - d.a, d.s, tilt, 0);
    }
    blades.instanceMatrix.needsUpdate = true;
    const drop = smooth(0.2, 0.32, u), gone = smooth(0.86, 0.95, u);
    boy.visible = u > 0.17 && u < 0.96;
    boy.position.set(LOTUS[0], BOY_Y + (1 - drop) * 2.2 - gone * 0, LOTUS[1]);
    boy.rotation.set(0, -0.4 + (1 - drop) * 1.5, Math.sin(t * 9) * 0.05 * close);
    boy.scale.setScalar(Math.max(0.001, (1 - gone)));
    // ripples spread when he lands and when the blades shut
    for (let i = 0; i < RIP; i++) {
      const p = (t * 0.12 + i / RIP) % 1;
      ripples[i].scale.setScalar(1.6 + p * 3.6);
      ripples[i].material.opacity = 0.18 * (1 - p) * smooth(0, 0.15, p);
    }
    // fire recedes: particles stream from the lotus to the cave mouth, shrinking as they go in
    const fk = 0.4 + 0.6 * (1 - close * 0.5);
    for (let i = 0; i < FIRE; i++) {
      const f = fd[i], p = (t * 0.045 + f.ph) % 1, e = p * p * (3 - 2 * p);
      _v.lerpVectors(src, CAVE, e);
      const spread = Math.sin(Math.PI * p) * 1.0 + (1 - p) * 0.4;
      const x = _v.x + f.off[0] * spread, y = _v.y + f.off[1] * spread + Math.sin(Math.PI * e) * 1.2, z = _v.z + f.off[2] * spread;
      const sz = f.s * (0.35 + 1.1 * (1 - e)) * (0.2 + 0.8 * (1 - smooth(0.85, 1, p)));
      fire.set(i, x, y, z, sz * 0.8, fk * smooth(0, 0.1, p) * (1 - smooth(0.9, 1, p)));
      smoke.set(i, x + 0.3, y + 0.4, z - 0.2, sz * 1.3, fk * 0.8 * smooth(0, 0.15, p) * (1 - smooth(0.85, 1, p)));
    }
    fire.commit(); smoke.commit();
    for (let i = 0; i < GLINT; i++) {
      const d = bd[(i * 7) % NB], k = Math.max(0, Math.sin(t * 1.7 + i * 2.3));
      glints.set(i, LOTUS[0] + Math.cos(d.a) * (0.8 + 1.2 * (1 - close)), SEA + 1.8 + close * 0.7, LOTUS[1] + Math.sin(d.a) * (0.8 + 1.2 * (1 - close)), 0.2 * k, k ** 4);
    }
    glints.commit();
    // crests: each rises, curls and sinks back on its own slow beat
    for (let i = 0; i < wd.length; i++) {
      const w = wd[i], p = (t * w.sp + w.ph) % 1, k = Math.sin(Math.PI * p) ** 2;
      setInst(crests, i, w.x + Math.sin(w.ry) * p * 0.6, SEA - 0.06, w.z + Math.cos(w.ry) * p * 0.6, w.ry + Math.PI / 2, [w.s * (0.4 + 0.6 * k), w.s * k + 0.001, w.s * (0.5 + 0.5 * k)]);
    }
    crests.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < SPRAY; i++) {
      const d = sd[i], p = (t * 0.25 + d.ph) % 1;
      spray.set(i, d.x, SEA + 0.1 + Math.sin(Math.PI * p) * 0.5, d.z, d.s * (0.6 + p), 0.8 * Math.sin(Math.PI * p));
    }
    spray.commit();
    for (let i = 0; i < MISTN; i++) {
      const m = md[i], x = ((m.x + 10 + t * 0.08 + m.ph * 4) % 20) - 10;
      const a = smooth(10, 7.5, Math.hypot(x, m.z));
      mist.set(i, x, m.y + Math.sin(t * 0.2 + i) * 0.1, m.z, m.s, a * (Math.hypot(x - LOTUS[0], m.z - LOTUS[1]) < 2.2 ? 0.3 : 1));
    }
    mist.commit();
    // 善财: appears as the blades open on an empty throne, stays through the turn of the loop, fades before the boy drops again
    const ak = Math.min(1, smooth(0.87, 0.94, u) + (1 - smooth(0.08, 0.14, u)));
    sc.visible = ak > 0.01;
    sc.scale.setScalar(Math.max(0.001, ak));
    sc.position.y = SC[1] + Math.sin(t * 0.9) * 0.05;
    const mk = smooth(0.84, 0.88, u) * (1 - smooth(0.93, 0.97, u));
    for (let i = 0; i < 16; i++) {
      const p = ((u - 0.84) / 0.12 + i / 16 * 0.3) % 1, e = clamp(p);
      motes.set(i, lerp(LOTUS[0], SC[0], e) + Math.sin(i * 2.1 + t * 3) * 0.2, SEA + 0.8 + Math.sin(Math.PI * e) * 1.6 + Math.cos(i * 1.7) * 0.15, lerp(LOTUS[1], SC[2], e), 0.18 + 0.1 * Math.sin(i), mk);
    }
    motes.commit();
  }
  update(0);
  return { object, update };
}
