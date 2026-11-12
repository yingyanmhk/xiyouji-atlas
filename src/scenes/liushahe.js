// 流沙河 — eight hundred li of weak water, where "a goose feather will not float and a reed flower
// sinks to the bottom". A grey-gold river of quicksand creeps across the basin between reed beds.
// Loop of 36 s: 沙悟净 rises out of the river, takes the nine skulls from his neck, binds them
// in a nine-square raft with Guanyin's gourd at the centre, and Tang Seng is carried across with
// Bajie and Sha steadying the raft on either side and Wukong leading the horse on a cloud above.
// On the far bank the skulls turn into nine gusts of dark wind and are gone. A feather drifts
// down onto the river, and sinks.
import { THREE, Builder, M, C, terrain, peak, pine, rock, stele, figure, horse, cloud, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { flowWater } from './_b_kit.js';

const CYCLE = 36;
const RIVER = 0.45;
const rz = (x) => 0.3 - 0.42 * x + 0.7 * Math.sin(x * 0.3 + 0.6);      // river centreline z(x), running diagonally
const HALF = 3.0;
const NRM = [0.387, 0.922];                                  // unit normal across the river
const P0 = [0.6, 0.3 - 0.42 * 0.6 + 0.7 * Math.sin(0.78)];
const A = [P0[0] + NRM[0] * (HALF - 0.4), 0.45, P0[1] + NRM[1] * (HALF - 0.4)], B2 = [P0[0] - NRM[0] * (HALF - 0.4), 0.45, P0[1] - NRM[1] * (HALF - 0.4)];

function ground(x, z) {
  const r = Math.hypot(x, z);
  const d = (z - rz(x)) * 0.92;
  const n = fbm(x * 0.3 + 4, z * 0.3 + 1, 4);
  const bank = smooth(HALF - 0.6, HALF + 0.6, Math.abs(d));
  let h = 0.1 + bank * (0.75 + 0.3 * n);
  if (d < 0) h += smooth(HALF + 1.5, HALF + 6, -d) * (1.5 + 3.2 * n) * smooth(10.6, 7.5, r);   // the far bank rises
  else h += smooth(HALF + 2, HALF + 6, d) * 0.4 * n;
  return lerp(h, Math.min(h, 0.5), smooth(9.3, 10.4, r));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  // grey-gold palette for the banks
  const tmp = new THREE.Color(), out = new THREE.Color();
  const bankPal = (x, y, z, nx, ny) => {
    const n = noise2(x * 0.8, z * 0.8);
    if (y < RIVER + 0.05) return out.set('#6f6450');
    out.set('#c4b68e').lerp(tmp.set('#9aa070'), smooth(0.45, 0.8, n) * 0.8);
    if (y > 1.4) out.lerp(tmp.set(ny > 0.75 ? '#8a9a6a' : '#8a7e62'), smooth(1.4, 3.0, y));
    if (ny < 0.6) out.multiplyScalar(0.85);
    return out;
  };
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: bankPal });

  // far bank: weathered grey-gold crags with a few pines
  const rockPal = (h, base) => {
    const o = new THREE.Color(), t2 = new THREE.Color();
    return (x, y, z, nx, ny) => {
      const t = clamp((y - base) / h), s = noise2((x + z) * 1.5, y * 0.3) - 0.5;
      o.set('#66625a').lerp(t2.set('#a49c88'), t + s * 0.3).multiplyScalar(0.92 + s * 0.2);
      if (ny > 0.55) o.lerp(t2.set('#7f9466'), smooth(0.55, 0.85, ny) * 0.8);
      return o;
    };
  };
  for (const [x, z, r, h] of [[-5.4, -3.6, 1.4, 5.6], [-2.6, -6.0, 1.6, 7.6], [-6.4, 0.2, 1.1, 4.0], [0.8, -7.4, 1.3, 5.2], [3.6, -7.6, 1.1, 3.8], [-3.6, -8.4, 1.0, 4.2], [-8.4, -2.8, 0.9, 3.0]]) {
    if ((z - rz(x)) * 0.92 > -HALF - 1.6) continue;
    const y = ground(x, z) - 0.4;
    const tp = peak(b, { x, y, z, r, h, lean: 0.12, taper: 0.6, rand: rng, palette: rockPal(h, y) });
    if (rng() < 0.7) pine(b, { x: tp[0], y: tp[1] - 0.25, z: tp[2], h: 0.9 + rng() * 0.5, r: rng, lean: 0.4 });
  }
  for (let i = 0, k = 0; i < 10 && k < 300; k++) {
    const x = rng.range(-8, 8), z = rng.range(-9, -4.5);
    if (Math.hypot(x, z) > 9.4 || z > rz(x) - HALF - 1) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.0 + rng() * 0.8, r: rng, lean: 0.25 }); i++;
  }
  for (let i = 0; i < 14; i++) {
    const [x, z] = rng.inDisc(9.8, 3);
    if (Math.abs(z - rz(x)) < HALF + 0.3) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.4, h: 0.3 + rng() * 0.5, rand: rng, palette: rockPal(1.2, ground(x, z) - 0.3) });
  }
  // the stone tablet on the near bank: 流沙河 / 八百流沙界，三千弱水深
  const ST = [3.4, rz(3.4) + HALF + 1.4];
  stele(b, { x: ST[0], y: ground(...ST) - 0.05, z: ST[1], ry: 0.3, h: 1.3, w: 0.62, turtle: false, color: '#6d6a62' });
  // the pilgrims' trodden track down to the water
  object.add(b.build());

  /* --------------------------------------------------- the weak water --- */
  const wmat = flowWater({ deep: '#4c4636', light: '#9a8858', foam: '#d8c48a', dir: [1, 0.12], speed: 0.35, scale: 0.9, sand: 1, opacity: 1 });
  const river = new THREE.Mesh(new THREE.CircleGeometry(10.4, 72), wmat);
  river.rotation.x = -Math.PI / 2; river.position.y = RIVER;
  object.add(river);

  /* reeds (芦苇), swaying, in beds along both banks */
  const rb = new Builder();
  rb.cyl(0.008, 0.014, 0.9, { color: '#9a9256', mat: M.cloth, seg: 3 });
  rb.sphere(0.05, { y: 0.95, x: 0.03, sy: 2.4, rz: -0.3, color: '#e8dcc0', mat: M.cloth, ws: 5, hs: 4 });
  rb.box(0.03, 0.006, 0.3, { y: 0.5, z: 0.12, rx: 0.5, color: '#8a8a4a', mat: M.cloth });
  const reeds = [];
  for (let i = 0, k = 0; i < 520 && k < 6000; k++) {
    const x = rng.range(-9.8, 9.8), side = rng() < 0.5 ? -1 : 1;
    const d = side * (HALF - 0.3 + Math.abs(rng.gauss()) * 0.7);
    const z = rz(x) + d;
    if (Math.hypot(x, z) > 9.9) continue;
    if (noise2(x * 0.6 + (side > 0 ? 0 : 9), 2) < 0.38) continue;            // in clumps
    if (Math.hypot(x - A[0], z - A[2]) < 1.6 || Math.hypot(x - B2[0], z - B2[2]) < 1.6) continue;   // the landing places
    reeds.push({ x, y: Math.max(RIVER - 0.05, ground(x, z) - 0.05), z, s: 0.8 + rng() * 0.7, ry: rng() * 6.28, ph: rng() * 6 }); i++;
  }
  const reedMesh = new THREE.InstancedMesh(rb.merged(), M.cloth, reeds.length);
  reedMesh.castShadow = true;
  object.add(reedMesh);

  /* ------------------------------------------------- the skull raft --- */
  const raft = new THREE.Group();
  const skulls = [];
  {
    const SP = 0.42;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) continue;
      const sb = new Builder();
      sb.sphere(0.17, { sy: 0.9, sz: 1.1, color: '#e9e2cf', mat: M.smooth });
      sb.box(0.18, 0.08, 0.16, { y: -0.13, z: 0.06, color: '#ddd4be', mat: M.smooth });
      for (const sx of [-1, 1]) sb.sphere(0.045, { x: sx * 0.065, y: 0.0, z: 0.15, sz: 0.5, color: '#2a2622', mat: M.smooth, ws: 6, hs: 4 });
      const g = sb.build();
      g.position.set((i - 1) * SP, 0.05, (j - 1) * SP);
      g.rotation.y = rng() * 6.28;
      raft.add(g); skulls.push(g);
    }
    const cb = new Builder();
    // straw rope binding (九宫) and the gourd at the centre
    for (let k = 0; k < 4; k++) {
      const o = (k % 2 ? -1 : 1) * SP * 0.5;
      if (k < 2) cb.box(SP * 2.4, 0.03, 0.03, { z: o, y: 0.05, color: '#a68a52', mat: M.cloth });
      else cb.box(0.03, 0.03, SP * 2.4, { x: o, y: 0.05, color: '#a68a52', mat: M.cloth });
    }
    cb.sphere(0.2, { y: 0.1, color: '#c9a04a', mat: M.lacquer });
    cb.sphere(0.13, { y: 0.36, color: '#c9a04a', mat: M.lacquer });
    cb.cyl(0.03, 0.035, 0.08, { y: 0.47, color: '#7a5a2a', mat: M.wood, seg: 6 });
    cb.torus(0.12, 0.012, { y: 0.24, rx: Math.PI / 2, color: C.cinnabar, mat: M.cloth, ts: 14 });
    figure(cb, 'monk', { y: 0.48, s: 1.2, pose: 'none' });
    raft.add(cb.build());
  }
  raft.userData.s = 1.35;
  object.add(raft);
  // Bajie and Sha wading at either side (the weak water swallows them to the waist)
  const mk = (fn) => { const pb = new Builder(); fn(pb); const g = pb.build(); object.add(g); return g; };
  const bajie = mk((pb) => figure(pb, 'bajie', { s: 1.3 }));
  const sha = mk((pb) => figure(pb, 'sha', { s: 1.7, pose: 'none' }));
  // Wukong on a cloud, leading the white horse
  const sky = mk((pb) => {
    cloud(pb, { s: 0.75, y: -0.1, rand: rng, puffs: 7 });
    figure(pb, 'wukong', { x: 0.7, pose: 'staff', s: 1.3 });
    horse(pb, { x: -0.6, ry: 0, s: 1.0 });
  });
  const ripples = softPuffs(30, { color: '#ece2c6', opacity: 0.55 });
  const wind = softPuffs(72, { color: '#3a3430', opacity: 0.45 });
  object.add(ripples.points, wind.points);

  // the feather
  const feather = mk((pb) => {
    pb.sphere(0.14, { sx: 0.35, sy: 0.04, sz: 1.0, color: '#fbfaf6', mat: M.cloth, ws: 8, hs: 4 });
    pb.cyl(0.005, 0.005, 0.32, { rx: Math.PI / 2, z: -0.16, color: '#d8d2c4', mat: M.cloth, seg: 3 });
  });
  feather.castShadow = false;

  // the crossing path

  const W_C = ['uDeep', 'uLight', 'uFoam'].map((k) => wmat.uniforms[k].value.clone());
  function update(t, dt, env) {
    wmat.uniforms.uTime.value = t;
    // the unlit river of sand would glow at night
    const nk = 1 - 0.55 * (env?.night ?? 0);
    wmat.uniforms.uDeep.value.copy(W_C[0]).multiplyScalar(nk); wmat.uniforms.uLight.value.copy(W_C[1]).multiplyScalar(nk); wmat.uniforms.uFoam.value.copy(W_C[2]).multiplyScalar(nk);
    for (let i = 0; i < reeds.length; i++) {
      const r = reeds[i], w = Math.sin(t * 0.9 + r.x * 0.5 + r.ph * 0.3) * 0.12 + Math.sin(t * 2.1 + r.ph) * 0.03;
      setInst(reedMesh, i, r.x, r.y, r.z, r.ry, r.s, w, w * 0.6);
    }
    reedMesh.instanceMatrix.needsUpdate = true;
    const u = (t % CYCLE) / CYCLE;
    // Sha rises out of the river at the near landing (0.02 → 0.14)
    const rise = smooth(0.02, 0.14, u);
    const go = smooth(0.18, 0.72, u);                       // the crossing
    const raftK = smooth(0.13, 0.18, u) * (1 - smooth(0.74, 0.8, u));
    const x = lerp(A[0], B2[0], go), z = lerp(A[2], B2[2], go);
    const dirY = Math.atan2(B2[0] - A[0], B2[2] - A[2]);
    const bob = Math.sin(t * 1.3) * 0.02;
    raft.visible = raftK > 0.01;
    raft.position.set(x, RIVER + 0.02 + bob, z);
    raft.rotation.y = dirY + Math.sin(t * 0.5) * 0.05;
    raft.scale.setScalar(1.35 * Math.max(0.001, raftK));
    // the skulls become nine gusts of dark wind (0.74 → 0.86)
    const wk = smooth(0.72, 0.76, u) * (1 - smooth(0.84, 0.9, u));
    for (let i = 0; i < 72; i++) {
      const s = i % 8, p = (i >> 3) / 9 + ((t * 0.4) % 1) / 9;
      const ang = (s / 8) * Math.PI * 2 + p * 6;
      const R = 0.3 + p * 1.2;
      wind.set(i, B2[0] + Math.cos(ang) * R, RIVER + 0.2 + p * 4.5, B2[2] + Math.sin(ang) * R, 0.5 + p * 1.2, wk * (1 - p));
    }
    wind.commit();
    // Sha: emerges at A, then wades on the near side of the raft; Bajie on the far side
    const ox = Math.cos(dirY), oz = -Math.sin(dirY);
    const shaVis = 1 - smooth(0.8, 0.86, u);
    sha.visible = shaVis > 0.01 && u > 0.015;
    sha.position.set(x + ox * 0.95, RIVER - 0.3 - 0.15 * (1 - rise) + bob, z + oz * 0.95);
    sha.rotation.y = rise < 1 ? dirY + Math.PI : dirY;
    sha.scale.setScalar(Math.max(0.001, shaVis * (0.4 + 0.6 * rise)));
    bajie.visible = raftK > 0.01;
    bajie.position.set(x - ox * 0.9, RIVER - 0.3 + bob, z - oz * 0.9);
    bajie.rotation.y = dirY;
    bajie.scale.setScalar(Math.max(0.001, raftK));
    sky.visible = raftK > 0.01;
    sky.position.set(x + Math.sin(dirY) * 1.2, 4.2 + Math.sin(t * 0.7) * 0.15, z + Math.cos(dirY) * 1.2);
    sky.rotation.y = dirY - Math.PI / 2;
    sky.scale.setScalar(Math.max(0.001, raftK));
    // ripples: round Sha as he surfaces, then a wake behind the raft
    for (let i = 0; i < 30; i++) {
      const p = (t * 0.35 + i / 30) % 1, a = i * 2.4;
      const surf = smooth(0.0, 0.05, u) * (1 - smooth(0.14, 0.2, u));
      const wake = raftK;
      const cx = surf > wake ? sha.position.x : x - Math.sin(dirY) * p * 1.5, cz = surf > wake ? sha.position.z : z - Math.cos(dirY) * p * 1.5;
      ripples.set(i, cx + Math.cos(a) * (0.3 + p * 0.9), RIVER + 0.03, cz + Math.sin(a) * (0.3 + p * 0.9), 0.25 + p * 0.5, Math.max(surf, wake * 0.6) * (1 - p));
    }
    ripples.commit();
    // the feather: drifts down (12 s), touches the sand and slowly sinks
    const fp = (t % 18) / 18;
    const fall = smooth(0, 0.6, fp), sink = smooth(0.62, 0.9, fp);
    const fx = -3.2 + Math.sin(fp * 9) * 0.5, fz = rz(-3.2) + 0.4 + Math.cos(fp * 7) * 0.3;
    feather.position.set(fx, lerp(9, RIVER + 0.02, fall) - sink * 0.25, fz);
    feather.rotation.set(Math.sin(t * 1.7) * 0.4 * (1 - fall * 0.8), t * 0.3, Math.cos(t * 1.3) * 0.4 * (1 - fall * 0.8));
    feather.scale.setScalar(Math.max(0.001, 1.6 * (1 - smooth(0.85, 0.95, fp))));
  }
  update(0);
  return { object, update };
}
