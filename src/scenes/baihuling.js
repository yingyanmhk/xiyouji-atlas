// 白虎岭 — a bone-white ridge in cold mist, its spurs like the ribs of a great carcass. Along the
// path the Bone Demon (白骨精) comes three times: as a girl with a basket of food, as the girl's old
// mother leaning on a stick, as the old father telling his beads. Each time Wukong sees through her
// and strikes; each time she slips away by 解尸法 and leaves a corpse — the third time a heap of
// white bones. Tang Seng, believing his disciple a murderer, turns his back. Loop of 36 s.
import { THREE, Builder, M, C, terrain, peak, rock, bareTree, figure, horse, staff, fbm, noise2, hash2, smooth, clamp, lerp, ramp, setInst, softPuffs } from '../kit.js';
import { nightDim } from './_c_util.js';
import { mortal, skeleton, birdGeo, pathLUT } from './_b_kit.js';

const CYCLE = 36;
// the ridge spine runs from front-right up to the back-left
const SP0 = [6.5, 5.5], SP1 = [-5.5, -5.5];
function spineDist(x, z) {
  const vx = SP1[0] - SP0[0], vz = SP1[1] - SP0[1], L2 = vx * vx + vz * vz;
  const t = clamp(((x - SP0[0]) * vx + (z - SP0[1]) * vz) / L2);
  return [Math.hypot(x - SP0[0] - vx * t, z - SP0[1] - vz * t), t, ((x - SP0[0]) * vz - (z - SP0[1]) * vx) / Math.sqrt(L2)];
}

function bone(hmax, { base = 0 } = {}) {
  const stops = [[0, '#6f7378'], [0.35, '#9a9c98'], [0.7, '#c9c6bb'], [1, '#e6e2d6']];
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const s = noise2((x + z) * 1.3, y * 0.4) - 0.5;
    ramp(stops, t + s * 0.15 + (hash2(x * 11, z * 7 + y) - 0.5) * 0.04, out);
    if (ny > 0.6) out.lerp(tmp.set('#e9e6dc'), smooth(0.6, 0.9, ny) * 0.7);
    if (ny < 0.2) out.lerp(tmp.set('#7d8a98'), 0.35);         // cold blue shade
    return out;
  };
}

function ground(x, z) {
  const r = Math.hypot(x, z);
  const [d, t, side] = spineDist(x, z);
  const n = fbm(x * 0.35 + 3, z * 0.35 + 6, 4);
  const H = lerp(1.4, 5.8, t) * (0.85 + 0.3 * n);
  // rib-like spurs running off the spine
  const ribs = 0.5 + 0.5 * Math.cos(t * 26 + side * 0.25);
  let h = 0.25 + H * Math.exp(-(d * d) / (2.2 + ribs * 2.2)) * smooth(10.6, 7.5, r * 0.98);
  h += 0.3 * n * smooth(10.4, 6, r);
  void side;
  return lerp(h, Math.min(h, 0.45), smooth(9.6, 10.4, r));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const pal = bone(5.6);
  const pathCol = new THREE.Color('#d9d4c4');
  // the path follows the crest a little to one side
  const pathPts = [];
  for (let i = 0; i <= 14; i++) {
    const t = 0.05 + i * 0.062, x = lerp(SP0[0], SP1[0], t) - 0.75 + Math.sin(t * 9) * 0.3, z = lerp(SP0[1], SP1[1], t) + 0.85 + Math.cos(t * 7) * 0.25;
    pathPts.push([x, ground(x, z) + 0.02, z]);
  }
  const onPath = (x, z) => { let d = 1e9; for (const [px, , pz] of pathPts) d = Math.min(d, Math.hypot(px - x, pz - z)); return d < 0.38; };
  const low = new THREE.Color(), lowT = new THREE.Color();
  terrain(b, { R: 10.5, rings: 50, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (onPath(x, z) && ny > 0.6) return pathCol;
    if (y < 0.9) {   // ash-grey moor with pale dead grass, blue in the hollows
      const n = noise2(x * 0.7, z * 0.7), m = noise2(x * 2.1 + 5, z * 2.1);
      return low.set('#8d949a').lerp(lowT.set('#b3b0a2'), smooth(0.35, 0.75, n)).lerp(lowT.set('#cfcbbd'), smooth(0.6, 0.9, m) * 0.5);
    }
    return pal(x, y, z, nx, ny, nz);
  } });

  // pale crags along the ridge: the "tiger's" vertebrae
  for (let i = 0; i < 9; i++) {
    const t = 0.15 + i * 0.1 + rng() * 0.04, side = i % 2 ? 1 : -1;
    const x = lerp(SP0[0], SP1[0], t) + side * (1.4 + rng() * 0.8), z = lerp(SP0[1], SP1[1], t) - side * (0.9 + rng() * 0.6);
    const y = ground(x, z) - 0.4, h = 1.6 + t * 4.5 + rng() * 1.2;
    peak(b, { x, y, z, r: 0.6 + t * 0.6, h, lean: 0.18, taper: 0.8, rand: rng, palette: bone(h + y, { base: 0 }) });
  }
  peak(b, { x: SP1[0] + 0.6, y: ground(SP1[0] + 0.6, SP1[1] + 0.6) - 0.5, z: SP1[1] + 0.6, r: 1.4, h: 7.6, lean: 0.12, taper: 0.75, rand: rng, palette: bone(12, { base: 0 }) });
  // dead trees, bones in the grass, scattered stones
  for (let i = 0, k = 0; i < 12 && k < 400; k++) {
    const [x, z] = rng.inDisc(9.4, 2);
    if (onPath(x, z) || spineDist(x, z)[0] < 1.0) continue;
    bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.2 + rng() * 1.0, r: rng, color: '#5a5650' }); i++;
  }
  for (let i = 0; i < 16; i++) {
    const [x, z] = rng.inDisc(9.8, 2);
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.2 + rng() * 0.4, h: 0.3 + rng() * 0.5, rand: rng, palette: bone(1.2, { base: ground(x, z) - 0.4 }) });
  }
  for (let i = 0; i < 10; i++) {
    const [x, z] = rng.inDisc(9.2, 3);
    if (onPath(x, z)) continue;
    const y = ground(x, z);
    b.cyl(0.025, 0.025, 0.3, { x, y: y + 0.02, z, rz: Math.PI / 2, ry: rng() * 3, color: '#ece8dc', mat: M.smooth, seg: 5 });
    if (i % 3 === 0) b.sphere(0.07, { x: x + 0.2, y: y + 0.05, z, color: '#ece8dc', mat: M.smooth });
  }

  // three stations along the path where she appears
  const ST = [pathPts[3], pathPts[7], pathPts[11]];
  const dirAt = (i) => Math.atan2(pathPts[i + 1][0] - pathPts[i - 1][0], pathPts[i + 1][2] - pathPts[i - 1][2]);
  // Tang Seng on the path below, with Bajie at his ear and Sha with the load, the horse
  const TS = pathPts[1];
  const tsRy0 = dirAt(1);
  horse(b, { x: TS[0] + 0.9, y: ground(TS[0] + 0.9, TS[2] + 0.5), z: TS[2] + 0.5, ry: tsRy0 + 0.4, s: 1.15 });
  figure(b, 'bajie', { x: TS[0] - 0.55, y: ground(TS[0] - 0.55, TS[2] + 0.3), z: TS[2] + 0.3, ry: tsRy0 + 0.9, s: 1.25 });
  figure(b, 'sha', { x: TS[0] + 0.2, y: ground(TS[0] + 0.2, TS[2] + 1.0), z: TS[2] + 1.0, ry: tsRy0, s: 1.2 });
  object.add(b.build());

  const mk = (fn) => { const pb = new Builder(); fn(pb); const g = pb.build(); object.add(g); return g; };
  const monk = mk((pb) => figure(pb, 'monk', { s: 1.3 }));
  monk.position.set(TS[0], TS[1], TS[2]);
  const disguises = [
    mk((pb) => mortal(pb, 'girl', { s: 1.2, robe: '#c9a0a8' })),
    mk((pb) => mortal(pb, 'oldwoman', { s: 1.2, robe: '#8a8a86' })),
    mk((pb) => mortal(pb, 'oldman', { s: 1.2, robe: '#9a9a94' })),
  ];
  const corpses = [
    mk((pb) => { skeleton(pb, { s: 1.5 }); }),
    mk((pb) => { skeleton(pb, { s: 1.5 }); }),
    mk((pb) => { skeleton(pb, { s: 1.9 }); }),
  ];
  disguises.forEach((g, i) => { g.position.set(ST[i][0], ST[i][1], ST[i][2]); g.rotation.y = dirAt([3, 7, 11][i]) + Math.PI; });
  corpses.forEach((g, i) => { g.position.set(ST[i][0] + 0.15, ST[i][1], ST[i][2]); g.rotation.y = dirAt([3, 7, 11][i]) + 1.4; });

  // Wukong with a swinging staff
  const wk = new THREE.Group();
  wk.add(mk((pb) => figure(pb, 'wukong', { pose: 'none', s: 1.7 })));
  const swing = new THREE.Group();
  swing.position.set(0, 0.74, 0);
  {
    const sb = new Builder();
    sb.cyl(0.035, 0.04, 0.32, { x: 0.12, rz: -0.4, color: C.fur, mat: M.smooth, seg: 6 });
    sb.cyl(0.035, 0.04, 0.32, { x: -0.12, rz: 0.4, color: C.fur, mat: M.smooth, seg: 6 });
    staff(sb, { y: 0.32, z: 0.0, rx: 0, len: 1.9, center: false, r: 0.024 });
    swing.add(sb.build());
  }
  wk.add(swing);
  object.add(wk);
  const lut = pathLUT(pathPts, 300);

  // cold mist, the demon's escaping wisps, crows
  const MIST = 80;
  const mist = softPuffs(MIST, { color: '#dfe6ec', opacity: 0.38 });
  const wisp = softPuffs(36, { color: '#4a4e58', opacity: 0.6 });
  const flash = softPuffs(12, { color: '#ffe6a0', opacity: 0.9, additive: true });
  object.add(mist.points, wisp.points, flash.points);
  const mp = Array.from({ length: MIST }, () => { const [x, z] = rng.inDisc(10.4); return { x, z, y: 0.5 + rng() * 2.2, s: 1.8 + rng() * 2.2, ph: rng() }; });
  const NC = 6;
  const crows = new THREE.InstancedMesh(birdGeo('#1e1c1e'), M.smooth, NC);
  object.add(crows);

  const P = [0, 0, 0];
  const stIdx = [3, 7, 11].map((i) => (i / (pathPts.length - 1)) * lut.length);
  const dimPuffs = nightDim([mist], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    const seg = Math.min(2, Math.floor(u * 3)), f = u * 3 - seg;       // three strikes, 12 s each
    // Wukong walks up toward the station, leaps, strikes
    const from = seg === 0 ? stIdx[0] - 2.4 : stIdx[seg - 1] + 0.3, to = stIdx[seg] - 0.85;
    const walk = smooth(0.0, 0.45, f);
    lut.sample(lerp(from, to, walk), P);
    const leap = Math.sin(Math.PI * smooth(0.3, 0.45, f)) * 0.9;
    wk.position.set(P[0], P[1] + leap, P[2]);
    const tgt = ST[seg];
    wk.rotation.y = Math.atan2(tgt[0] - P[0], tgt[2] - P[2]);
    const strike = smooth(0.45, 0.52, f) * (1 - smooth(0.58, 0.75, f));
    swing.rotation.set(-0.4 + strike * 2.2 - (f > 0.35 && f < 0.45 ? smooth(0.35, 0.45, f) * 1.6 : 0) * (1 - strike), 0, 0);
    // the disguises appear, fall at the blow; the corpses remain until the loop restarts
    for (let i = 0; i < 3; i++) {
      const show = i === seg ? smooth(0.0, 0.08, f) * (1 - smooth(0.5, 0.56, f)) : 0;
      const g = disguises[i];
      g.visible = show > 0.01;
      g.scale.setScalar(Math.max(0.001, show));
      const cK = i < seg ? 1 : i === seg ? smooth(0.52, 0.6, f) : 0;
      const end = 1 - smooth(0.97, 1.0, u);
      corpses[i].visible = cK * end > 0.01;
      corpses[i].scale.setScalar(Math.max(0.001, cK * end));
    }
    // the escaping spirit: a dark wisp spiralling up from the struck body
    const wkK = smooth(0.5, 0.54, f) * (1 - smooth(0.62, 0.85, f));
    for (let i = 0; i < 36; i++) {
      const p = clamp((f - 0.5) * 3 - i / 72), a = i * 0.6 + p * 8;
      wisp.set(i, tgt[0] + Math.cos(a) * 0.4 * (1 + p), tgt[1] + 0.5 + p * 6, tgt[2] + Math.sin(a) * 0.4 * (1 + p), 0.5 + p * 1.6, wkK * (1 - p));
    }
    wisp.commit();
    const fk = smooth(0.49, 0.51, f) * (1 - smooth(0.53, 0.6, f));
    for (let i = 0; i < 12; i++) flash.set(i, tgt[0] + Math.cos(i * 0.52) * 0.5, tgt[1] + 0.7 + Math.sin(i * 0.52) * 0.5, tgt[2], 0.5, fk);
    flash.commit();
    // Tang Seng: faces the scene; after each blow he turns a little further away, at the end his back
    const turned = (seg + smooth(0.55, 0.8, f)) / 3;
    monk.rotation.y = tsRy0 + turned * Math.PI;
    // mist and crows
    for (let i = 0; i < MIST; i++) {
      const m = mp[i];
      mist.set(i, m.x + Math.sin(t * 0.1 + m.ph * 6) * 0.8, m.y + Math.sin(t * 0.25 + i) * 0.2, m.z + Math.cos(t * 0.08 + m.ph * 4) * 0.6, m.s, 0.4 + 0.3 * Math.sin(t * 0.2 + m.ph * 9));
    }
    mist.commit();
    for (let i = 0; i < NC; i++) {
      const a = t * (0.15 + i * 0.02) + i * 1.1, R = 2.5 + i * 0.6;
      setInst(crows, i, -2 + Math.cos(a) * R, 9.5 + (i % 3) * 0.6 + Math.sin(t * 0.6 + i) * 0.3, -2 + Math.sin(a) * R * 0.7, -a, 1.1, 0, 0.25);
    }
    crows.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { object, update };
}
