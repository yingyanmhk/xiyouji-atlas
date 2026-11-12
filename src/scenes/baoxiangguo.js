// 宝象国·波月洞 — two halves of one episode. Back-left, the ink-blue 碗子山 and the mouth of the
// 波月洞, where the princess 百花羞 was held thirteen years by the 黄袍怪. Front-right, the vermilion
// court of 宝象国: on the terrace before the golden hall stands an iron cage, and in it paces a
// striped tiger — Tang Seng, turned into a beast by the demon (奎木狼 in the guise of a handsome
// son-in-law). Loop (30 s): the tiger paces; Wukong, back from 花果山, sprays a mouthful of water
// on it and the monk stands in the cage again — then the spell closes over him once more.
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, roof, figure, horse, fbm, noise2, smooth, clamp, ramp, softPuffs } from '../kit.js';
import { pathDist, tiger, cage, courtier, wall, group, nightLamps, hallLamps, nightDim } from './_c_util.js';

const CYCLE = 30;
const MTN = [-5.6, -4.0];
const COURT = 0.42;                 // courtyard paving height (palace-local)
const PX = 2.3, PZ = 0.7, PS = 1.22; // the palace block is built at origin and placed/scaled here

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 4, z * 0.3 + 1, 4);
  let h = 0.22 + 0.25 * n;
  const dm = Math.hypot((x - MTN[0]) * 0.85, (z - MTN[1]) * 1.0);
  h += smooth(5.6, 1.0, dm) * (2.2 + 2.0 * n);
  // courtyard levelled
  const inCourt = smooth(0.4, -0.4, Math.max(Math.abs(x - PX) - 4.3 * PS, Math.abs(z - PZ) - 4.4 * PS));
  h = h * (1 - inCourt) + 0.3 * inCourt;
  return h * smooth(10.6, 9.4, r) + 0.12 * (1 - smooth(10.6, 9.4, r));
}
const PATH = [[-3.3, -0.4], [-2.6, 1.4], [-3.0, 3.6], [-2.4, 6.2], [-2.2, 9.4]];

// 墨蓝: ink-blue cliffs with dull teal ledges — the cave half
function inkBlue(hmax, base = 0) {
  const cliff = [[0, '#3b4656'], [0.3, '#26364a'], [0.65, '#1f3550'], [1, '#2d4f6e']];
  const ledge = [[0, '#4f6a66'], [0.5, '#3a6266'], [1, '#4e7f86']];
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const st = noise2((x + z) * 1.6, y * 0.25) - 0.5;
    ramp(cliff, t + st * 0.2, out).multiplyScalar(0.9 + st * 0.3);
    const up = smooth(0.45, 0.8, ny + st * 0.1);
    if (up > 0) out.lerp(ramp(ledge, t, tmp), up * 0.85);
    return out;
  };
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* ground: palace side warm earth, mountain side ink-blue */
  const blue = inkBlue(5.5);
  const earth = new THREE.Color('#b9a27a'), earthD = new THREE.Color('#9d8a64'), pave = new THREE.Color('#d9cdb4'), road = new THREE.Color('#c9b48c');
  const tmp = new THREE.Color();
  terrain(b, {
    R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => {
      if (Math.abs(x - PX) < 4.15 * PS && Math.abs(z - PZ) < 4.25 * PS) return pave;
      if (pathDist(PATH, x, z) < 0.32 + 0.06 * noise2(x * 4, z * 4)) return road;
      const m = smooth(0.7, 1.6, y);
      tmp.copy(earth).lerp(earthD, noise2(x * 1.3, z * 1.3));
      return m > 0 ? tmp.lerp(blue(x, y, z, nx, ny, nz), m) : tmp;
    },
  });

  /* 碗子山: a bowl of ink-blue needles around the cave */
  const peaks = [[-6.6, -4.8, 1.5, 8.0, 0.08], [-4.3, -6.3, 1.25, 6.8, 0.1], [-7.6, -2.2, 1.0, 5.2, 0.12], [-2.6, -6.6, 1.0, 5.2, 0.12],
    [-5.6, -2.0, 1.1, 3.4, 0.05], [-3.4, -3.9, 0.9, 4.0, 0.1], [-8.0, -5.6, 0.8, 4.0, 0.14]];
  const tops = peaks.map(([x, z, r, h, lean]) => { const y = ground(x, z) - 0.4; return peak(b, { x, y, z, r, h, lean, rand: rng, palette: inkBlue(h, y) }); });
  // the cave mouth 波月洞 cut in the face of the front peak, facing the court
  const CAVE = [-4.0, ground(-4.0, -1.6) + 0.05, -1.6];
  b.push({ x: CAVE[0], y: CAVE[1], z: CAVE[2], ry: 0.35, s: 1.3 });
  { const sh = new THREE.Shape(); sh.moveTo(-0.55, 0); sh.lineTo(-0.55, 0.7); sh.absarc(0, 0.7, 0.55, Math.PI, 0, true); sh.lineTo(0.55, 0); sh.lineTo(-0.55, 0);
    b.extrude(sh, 0.4, { color: '#0c1420', mat: M.stone });
    const sh2 = new THREE.Shape(); sh2.moveTo(-0.4, 0); sh2.lineTo(-0.4, 0.7); sh2.absarc(0, 0.7, 0.4, Math.PI, 0, true); sh2.lineTo(0.4, 0); sh2.lineTo(-0.4, 0);
    b.extrude(sh2, 0.02, { z: 0.21, color: '#2c4c7a', mat: M.glow, glow: 0.55 }); }
  b.box(1.6, 0.18, 0.8, { y: -0.12, z: 0.35, color: '#4a5866', mat: M.flat });               // threshold ledge
  for (const sx of [-1, 1]) rock(b, { x: sx * 0.85, y: -0.1, z: 0.25, r: 0.35, h: 1.3, rand: rng, palette: inkBlue(2, CAVE[1]) });
  b.pop();
  // the princess at the cave mouth, looking toward her father's kingdom
  courtier(b, 'princess', { x: CAVE[0] + 0.55, y: CAVE[1] + 0.06, z: CAVE[2] + 0.75, ry: 0.9, s: 1.15 });
  // stone steps down from the cave
  for (let i = 0; i < 6; i++) {
    const x = CAVE[0] + 0.5 + i * 0.12, z = CAVE[2] + 1.1 + i * 0.3;
    b.box(0.7, 0.12, 0.3, { x, y: Math.max(ground(x, z), CAVE[1] - 0.05 - i * 0.38) - 0.06, z, ry: 0.5, color: '#55606a', mat: M.flat });
  }
  for (const i of [0, 1, 2, 4]) { const [x, y, z] = tops[i]; pine(b, { x, y: y - 0.25, z, h: 1.3 + rng() * 0.5, r: rng, lean: 0.35, color: '#24433f' }); }
  for (let i = 0, k = 0; i < 8 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.5, 2);
    if (Math.hypot(x - MTN[0], z - MTN[1]) > 5.5 || ground(x, z) < 1.2) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.2 + rng() * 0.8, r: rng, color: '#24433f' }); i++;
  }

  const lamps = nightLamps(), lb = new Builder();
  /* 宝象国: walled court, golden hall, the cage on the terrace */
  b.push({ x: PX, y: 0.3 - (COURT - 0.12) * PS, z: PZ, s: PS });
  {
  const CX = 0, CZ = 0;
  hall(b, { x: CX, y: COURT - 0.12, z: CZ - 3.1, w: 4.2, d: 1.9, h: 1.4, tiers: 2, wall: C.wallRed, roofColor: C.tileGold, beam: '#2f6a6a', r: rng, lit: 0 });
  // the palace doors light up at night (same placement as the halls)
  lb.push({ x: PX, y: 0.3 - (COURT - 0.12) * PS, z: PZ, s: PS });
  hallLamps(lb, lamps.mat, { x: CX, y: COURT - 0.12, z: CZ - 3.1, w: 4.2, d: 1.9, h: 1.4 });
  for (const sx of [-1, 1]) hallLamps(lb, lamps.mat, { x: CX + sx * 3.3, y: COURT - 0.12, z: CZ - 0.6, ry: -sx * Math.PI / 2, w: 2.6, d: 1.0, h: 1.0, base: 0.2, every: 2 });
  lb.pop();
  // side halls (朝房)
  for (const sx of [-1, 1]) hall(b, { x: CX + sx * 3.3, y: COURT - 0.12, z: CZ - 0.6, ry: -sx * Math.PI / 2, w: 2.6, d: 1.0, h: 1.0, base: 0.2, steps: false, wall: C.wallRed, roofColor: C.tileGold, r: rng });
  // red walls with a gate in the front
  const W0 = CX - 4.0, W1 = CX + 4.0, Z0 = CZ - 4.1, Z1 = CZ + 4.1;
  wall(b, W0, Z0, W0, Z1, { y: 0.15, h: 0.75, tile: C.tileGold });
  wall(b, W1, Z0, W1, Z1, { y: 0.15, h: 0.75, tile: C.tileGold });
  wall(b, W0, Z0, W1, Z0, { y: 0.15, h: 0.75, tile: C.tileGold });
  wall(b, W0, Z1, CX - 0.9, Z1, { y: 0.15, h: 0.75, tile: C.tileGold });
  wall(b, CX + 0.9, Z1, W1, Z1, { y: 0.15, h: 0.75, tile: C.tileGold });
  // gate house
  for (const sx of [-1, 1]) b.box(0.4, 1.0, 0.5, { x: CX + sx * 0.9, y: 0.15, z: Z1, color: C.wallRed });
  roof(b, { x: CX, y: 1.15, z: Z1, w: 2.2, d: 0.7, color: C.tileGold });
  // the red terrace (丹墀) with balustrade, where the cage stands
  const TZ = CZ + 1.0;
  b.box(3.8, 0.16, 2.8, { x: CX, y: COURT - 0.12, z: TZ, color: '#b24a34', mat: M.stone });
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) b.box(0.05, 0.22, 0.05, { x: CX + sx * 1.9, y: COURT + 0.04, z: TZ - 1.3 + i * 0.325, color: C.ivory });
  for (const sx of [-1, 1]) b.box(0.05, 0.04, 2.7, { x: CX + sx * 1.9, y: COURT + 0.24, z: TZ, color: C.ivory });
  cage(b, { x: CX, y: COURT + 0.04, z: TZ, w: 2.9, d: 1.7, h: 1.8, bar: 0.29, color: '#565c64' });
  // bronze incense burners (鼎) on either side of the steps
  for (const sx of [-1, 1]) {
    b.lathe([[0, 0], [0.16, 0.02], [0.22, 0.18], [0.2, 0.32], [0, 0.32]], { x: CX + sx * 1.3, y: COURT - 0.12, z: CZ - 1.4, color: '#5f6a50', mat: M.metal, seg: 10 });
    for (let k = 0; k < 3; k++) b.cyl(0.02, 0.02, 0.12, { x: CX + sx * 1.3 + Math.cos(k * 2.1) * 0.13, y: COURT - 0.12, z: CZ - 1.4 + Math.sin(k * 2.1) * 0.13, color: '#5f6a50', mat: M.metal, seg: 4 });
  }
  // the court: the king on the steps, the false son-in-law beside him, officials in two files
  courtier(b, 'king', { x: CX - 0.35, y: COURT + 0.15, z: CZ - 1.8, s: 1.25 });
  courtier(b, 'official', { x: CX + 0.45, y: COURT + 0.15, z: CZ - 1.75, robe: '#e8dcc0', s: 1.2, ry: -0.3 });   // 黄袍怪 as 三驸马
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    courtier(b, i === 3 ? 'guard' : 'official', { x: CX + sx * (2.35 + (i % 2) * 0.05), y: COURT - 0.12, z: CZ - 0.9 + i * 0.85, ry: -sx * Math.PI / 2, robe: i % 2 ? '#3d6a7a' : '#7a3a4a', s: 1.0 });
  }
  // Bajie and Sha behind the cage; the white horse tethered by the west gate
  figure(b, 'bajie', { x: CX - 1.2, y: COURT - 0.12, z: TZ + 2.0, ry: 0.4, s: 1.2 });
  figure(b, 'sha', { x: CX - 1.85, y: COURT - 0.12, z: TZ + 1.6, ry: 0.6, s: 1.2 });
  horse(b, { x: CX + 2.6, y: COURT - 0.12, z: CZ + 3.3, ry: -2.4, s: 1.05 });
  }
  b.pop();
  // 黑松林: the dark pine wood where Tang Seng strayed and found the demon's gleaming pagoda-cave
  for (let i = 0, k = 0; i < 16 && k < 600; k++) {
    const x = rng.range(-9, -3.1), z = rng.range(0.5, 8.5);
    if (Math.hypot(x, z) > 9.3 || pathDist(PATH, x, z) < 0.6 || ground(x, z) > 1.4) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.5 + rng() * 1.1, r: rng, lean: 0.12, color: i % 2 ? '#1f3a33' : '#28463b' }); i++;
  }
  // trees in the court
  for (const [x, z] of [[-2.9, 3.4], [2.9, 2.2], [-2.9, -3.4]]) pine(b, { x: PX + x * PS, y: 0.3, z: PZ + z * PS, h: 1.8, r: rng, lean: 0.2 });
  for (let i = 0, k = 0; i < 9 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.4, 3);
    if (Math.abs(x - PX) < 5.4 && Math.abs(z - PZ) < 5.6 || ground(x, z) > 0.9 || pathDist(PATH, x, z) < 0.8) continue;
    rock(b, { x, y: ground(x, z) - 0.08, z, r: 0.25 + rng() * 0.35, h: 0.3 + rng() * 0.4, rand: rng, palette: inkBlue(1.2, ground(x, z) - 0.2) }); i++;
  }
  object.add(b.build(), lb.build());

  /* ------------------------------------------------- animated parts --- */
  const T_Y = COURT + 0.18;
  const palace = new THREE.Group();
  palace.position.set(PX, 0.3 - (COURT - 0.12) * PS, PZ); palace.scale.setScalar(PS);
  object.add(palace);
  const CX = 0, TZ = 1.0;
  const tigerG = group((tb) => tiger(tb, { s: 1.5 }));
  palace.add(tigerG);
  const monkG = group((mb) => figure(mb, 'monk', { s: 1.75 }));
  monkG.position.set(CX, T_Y, TZ);
  palace.add(monkG);
  // Wukong, back from Flower-Fruit Mountain, at the front of the cage
  const wk = group((wb) => figure(wb, 'wukong', { pose: 'stand', s: 1.55 }));
  wk.position.set(CX + 1.25, COURT - 0.12, TZ + 1.75);
  wk.rotation.y = -2.55;
  palace.add(wk);

  // the water spray (噀一口水) and the sparkle of the spell breaking
  const SPR = 34;
  const spray = softPuffs(SPR, { color: '#e9f4f8', opacity: 0.9 });
  palace.add(spray.points);
  const SPK = 24;
  const spark = softPuffs(SPK, { color: '#ffd98a', opacity: 0.9, additive: true });
  palace.add(spark.points);
  // mist from the cave and drifting across the gulf between the halves (三百里)
  const MIST = 46;
  const mist = softPuffs(MIST, { color: '#dfe6ec', opacity: 0.16 });
  object.add(mist.points);
  const md = Array.from({ length: MIST }, (_, i) => ({ x: -2.6 + rng.range(-2.5, 1.0), z: rng.range(-6, 3), y: 1.2 + rng() * 2.0, s: 1.6 + rng() * 2, ph: rng() * 10, cave: i < 10 }));

  const mouth = [wk.position.x - 0.15, wk.position.y + 0.85, wk.position.z - 0.2];
  const dimPuffs = nightDim([spray, mist], 0.6);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    lamps.update(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    // tiger paces: across the cage and back, turning at the ends
    const pace = (t * 0.11) % 1, dir = pace < 0.5 ? 1 : -1;
    const q = pace < 0.5 ? pace * 2 : (1 - pace) * 2;
    const ex = 0.22 * Math.sin((q - 0.5) * Math.PI);
    const turn = smooth(0.42, 0.5, pace) - smooth(0.92, 1, pace);
    tigerG.position.set(CX + ex, T_Y + Math.abs(Math.sin(t * 4.4)) * 0.015, TZ + 0.05);
    tigerG.rotation.y = Math.PI / 2 + turn * Math.PI + (dir > 0 ? 0 : 0) + Math.sin(t * 0.7) * 0.05;
    // the spell: tiger (0..0.58) → monk (0.62..0.88) → tiger (0.93..)
    const mk = smooth(0.58, 0.63, u) * (1 - smooth(0.88, 0.93, u));
    tigerG.scale.setScalar(Math.max(0.001, 1 - mk));
    monkG.scale.setScalar(Math.max(0.001, mk));
    monkG.rotation.y = Math.PI * 0.15 + Math.sin(t * 0.4) * 0.1;
    const sk = smooth(0.5, 0.54, u) * (1 - smooth(0.6, 0.64, u));
    for (let i = 0; i < SPR; i++) {
      const p = (t * 0.9 + i / SPR) % 1;
      const x = mouth[0] + (CX - mouth[0]) * p + Math.sin(i * 7.1) * 0.25 * p;
      const z = mouth[2] + (TZ - mouth[2]) * p + Math.cos(i * 5.3) * 0.25 * p;
      spray.set(i, x, mouth[1] + Math.sin(Math.PI * p) * 0.5 - p * 0.2, z, 0.06 + p * 0.3, sk * (1 - p * 0.6));
    }
    spray.commit();
    const gk = Math.max(smooth(0.58, 0.61, u) * (1 - smooth(0.63, 0.7, u)), smooth(0.88, 0.9, u) * (1 - smooth(0.92, 0.97, u)));
    for (let i = 0; i < SPK; i++) {
      const p = (t * 0.6 + i / SPK) % 1, a = i * 2.4 + t;
      spark.set(i, CX + Math.cos(a) * 0.5, T_Y + 0.2 + p * 1.4, TZ + Math.sin(a) * 0.35, 0.08 + 0.12 * (1 - p), gk * Math.sin(Math.PI * p));
    }
    spark.commit();
    for (let i = 0; i < MIST; i++) {
      const m = md[i];
      if (m.cave) {
        const p = (t * 0.05 + i / 10) % 1;
        mist.set(i, CAVE[0] - 0.2 + p * 0.6, CAVE[1] + 1.6 + p * 2.2, CAVE[2] + 0.2 + p * 0.3, 0.4 + p * 1.0, 0.6 * Math.sin(Math.PI * p));
      } else mist.set(i, m.x + Math.sin(t * 0.07 + m.ph) * 0.8, m.y + Math.sin(t * 0.2 + m.ph) * 0.15, m.z, m.s, 0.55);
    }
    mist.commit();
  }
  update(0);
  return { object, update };
}
