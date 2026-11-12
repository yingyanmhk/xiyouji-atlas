// 灭法国 — the morning after. The king who vowed to kill ten thousand monks wakes to find that he,
// his queen and every official at court has been shaved bald in the night: the officials kneel in
// rows in the blue-grey dawn, their heads gleaming. In the middle of the courtyard stands the big
// wooden chest in which the pilgrims hid at the inn (it was stolen by thieves and then seized by the
// guard). In a 28 s loop Wukong's clone-monkeys finish their barbering, hop back into the chest as
// hairs, the lid creaks open and Wukong himself pops up with his staff.
import { THREE, Builder, M, C, terrain, hall, figure, staff, cloud, fbm, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { person, tileWall, paving, instanced, nightTint } from './_e_kit.js';

const CYCLE = 28;
const Y = 0.2;
const PLAT = 0.95;          // height of the palace terrace
const CHEST = [0, Y, 2.3];
const FS = 1.3;             // officials' scale

const shiny = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.1 });

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pave = paving('#86919a', '#6f7a84', 0.8);
  const path = new THREE.Color('#bfc3c2');
  terrain(b, {
    R: 10.5, rings: 26, segs: 100, fn: (x, z) => Y - 0.12 * smooth(9.6, 10.5, Math.hypot(x, z)),
    palette: (x, y, z) => (Math.abs(x) < 0.9 && z > -3.6 ? path.set('#a3abb0').multiplyScalar(0.96 + 0.06 * fbm(x * 3, z * 3, 2)) : pave(x, y, z)),
  });

  /* the palace terrace with its balustrade and steps */
  b.box(11, PLAT, 4.4, { x: 0, y: Y - 0.02, z: -6.0, color: '#aab1b5', mat: M.stone });
  b.box(11.2, 0.08, 4.6, { x: 0, y: Y + PLAT - 0.06, z: -6.0, color: '#b2b8b8', mat: M.stone });
  for (let i = 0; i < 6; i++) b.box(2.2, PLAT * (1 - i / 6), 0.26, { x: 0, y: Y - 0.02, z: -3.67 + i * 0.26, color: '#c9ccc8', mat: M.stone });
  for (let i = -10; i <= 10; i++) {
    if (Math.abs(i) < 3) continue;
    b.box(0.08, 0.3, 0.08, { x: i * 0.5, y: Y + PLAT, z: -3.85, color: '#e3e4df', mat: M.stone });
  }
  for (const sx of [-1, 1]) b.box(3.9, 0.06, 0.06, { x: sx * 3.5, y: Y + PLAT + 0.24, z: -3.85, color: '#e3e4df', mat: M.stone });
  /* the throne hall and the side galleries */
  hall(b, { x: 0, y: Y + PLAT, z: -6.4, w: 7.0, d: 2.6, h: 1.9, base: 0.3, tiers: 2, roofColor: '#46566a', wall: '#c4c2bb', pillar: '#8e4a40', beam: '#3c5d74', lit: 0.35, r: rng });
  for (const sx of [-1, 1]) {
    hall(b, { x: sx * 7.0, y: Y, z: -0.2, ry: -sx * Math.PI / 2, w: 6.4, d: 1.6, h: 1.15, base: 0.2, roofColor: '#4d5c6c', wall: '#c4c2bb', pillar: '#8e4a40', beam: '#3c5d74', lit: 0.2, r: rng, steps: false });
    // bronze cauldron (鼎) and a stone lantern
    b.push({ x: sx * 4.6, y: Y, z: -3.0 });
    b.lathe([[0, 0.25], [0.32, 0.28], [0.38, 0.5], [0.34, 0.68], [0, 0.68]], { color: '#5b6b62', mat: M.metal });
    for (let k = 0; k < 3; k++) { const a = k * 2.094; b.cyl(0.04, 0.05, 0.3, { x: Math.cos(a) * 0.22, z: Math.sin(a) * 0.22, color: '#4a5a52', mat: M.metal, seg: 6 }); }
    for (const e of [-1, 1]) b.torus(0.08, 0.02, { x: e * 0.3, y: 0.76, ry: Math.PI / 2, color: '#5b6b62', mat: M.metal, ts: 10 });
    b.pop();
  }
  // front wall with its gate opening, and two 华表 columns
  for (const sx of [-1, 1]) tileWall(b, sx * 1.4, 8.2, sx * 5.6, 8.2, { y: Y, h: 0.65, color: '#b9877a', cap: '#46566a' });
  for (const sx of [-1, 1]) {
    b.cyl(0.13, 0.15, 2.6, { x: sx * 1.8, y: Y, z: 7.4, color: '#e6e6e0', mat: M.stone, seg: 8 });
    b.box(0.7, 0.08, 0.16, { x: sx * 1.8, y: Y + 2.1, z: 7.4, color: '#e6e6e0', mat: M.stone });
    b.cyl(0.22, 0.2, 0.12, { x: sx * 1.8, y: Y + 2.6, z: 7.4, color: '#d8d8d2', mat: M.stone, seg: 10 });
  }
  // willows behind the galleries (the morning is grey and still)
  object.add(b.build());

  /* the court, all bald: king and queen on the terrace, officials kneeling in rows */
  const pb = new Builder();
  const heads = [];
  const P = (o, hy) => { person(pb, { ...o, headMat: shiny }); heads.push([o.x, o.y + hy * (o.s || 1), o.z]); };
  P({ x: -0.5, y: Y + PLAT, z: -4.4, s: 1.35, robe: '#d6a94a', robe2: '#c48f2e', head: 'bald', pose: 'stand' }, 0.62);
  P({ x: 0.55, y: Y + PLAT, z: -4.45, s: 1.25, robe: '#c2566a', robe2: '#e7b8b0', head: 'bald', pose: 'pray' }, 0.62);
  for (let i = 0; i < 4; i++) P({ x: -2.6 + i * 1.7 + (i > 1 ? 0.9 : 0) - 0.4, y: Y + PLAT, z: -5.0, s: 1.0, robe: '#9a7a8a', head: 'bald', pose: 'stand' }, 0.62);
  const robes = ['#8e3b34', '#3e5a6a', '#6a4b6e', '#3f6a58'];
  for (const sx of [-1, 1]) {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      const x = sx * (1.75 + c * 0.95) + (rng() - 0.5) * 0.1, z = -2.0 + r * 1.25 + (rng() - 0.5) * 0.1;
      if (r === 3 && c === 0) continue;
      P({ x, y: Y, z, ry: Math.PI - sx * 0.45 + (rng() - 0.5) * 0.3 + (r === 4 && c === 2 ? 2.4 : 0), s: FS, robe: robes[(r + (sx > 0 ? 2 : 0)) % 4], robe2: '#d8d0c0', head: 'bald', pose: r % 2 ? 'kneel' : 'bow' }, r % 2 ? 0.45 : 0.56);
      // a cap fallen on the flags beside every few officials
      if (rng() < 0.3) { pb.cyl(0.065, 0.075, 0.09, { x: x + 0.3, y: Y, z: z + 0.1, color: C.ink, mat: M.cloth, seg: 8 }); pb.box(0.32, 0.016, 0.024, { x: x + 0.3, y: Y + 0.05, z: z + 0.07, ry: rng() * 3, color: C.ink, mat: M.cloth }); }
    }
  }
  object.add(pb.build());

  /* the chest, the pilgrims beside it, and its lid */
  const cb = new Builder();
  cb.box(1.7, 0.85, 1.0, { color: '#7a4f2e', mat: M.wood });
  for (const y of [0.1, 0.72]) cb.box(1.74, 0.06, 1.04, { y, color: '#3b2a1e', mat: M.wood });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cb.box(0.12, 0.86, 0.12, { x: sx * 0.82, z: sz * 0.47, color: C.goldD, mat: M.metal });
  cb.box(0.16, 0.18, 0.04, { y: 0.55, z: 0.51, color: C.gold, mat: M.metal });
  cb.box(1.6, 0.02, 0.9, { y: 0.84, color: '#2a1d14', mat: M.wood });                // the dark inside
  const chest = cb.build();
  chest.position.set(...CHEST);
  chest.scale.setScalar(1.25);
  object.add(chest);
  const lid = new THREE.Group();
  {
    const lb = new Builder();
    lb.box(1.76, 0.14, 1.06, { z: 0.53, color: '#835632', mat: M.wood });
    lb.box(1.8, 0.04, 1.1, { y: 0.12, z: 0.53, color: '#3b2a1e', mat: M.wood });
    for (const sx of [-1, 1]) lb.box(0.12, 0.16, 1.08, { x: sx * 0.82, z: 0.53, color: C.goldD, mat: M.metal });
    lid.add(lb.build());
  }
  lid.position.set(CHEST[0], CHEST[1] + 0.85 * 1.25, CHEST[2] - 0.53 * 1.25);
  lid.scale.setScalar(1.25);
  object.add(lid);
  // Bajie and Sha wait by the chest; Wukong and Tang Seng will pop out of it at dawn
  const fb = new Builder();
  figure(fb, 'bajie', { x: 1.6, y: Y, z: CHEST[2] + 0.5, ry: -0.5, s: 1.25 });
  figure(fb, 'sha', { x: -1.55, y: Y, z: CHEST[2] + 0.55, ry: 0.5, s: 1.25 });
  object.add(fb.build());
  const pop = new THREE.Group();
  {
    const wk = new Builder();
    figure(wk, 'wukong', { pose: 'none', x: 0.32, s: 1.6 });
    for (const sx of [-1, 1]) wk.cyl(0.022 * 1.6, 0.026 * 1.6, 0.2 * 1.6, { x: 0.32 + sx * 0.09 * 1.6, y: 0.43 * 1.6, rz: -sx * (sx > 0 ? 1.3 : 2.5), color: C.fur, mat: M.smooth, seg: 6 });
    staff(wk, { x: 0.32 + 0.3 * 1.6, y: 0.2, z: 0.02, len: 1.6 });
    figure(wk, 'monk', { x: -0.38, z: -0.05, s: 1.25, pose: 'none' });
    pop.add(wk.build());
  }
  pop.position.set(CHEST[0], CHEST[1], CHEST[2]);
  object.add(pop);

  /* night: Wukong on a cloud over the palace blows a handful of hairs — a cascade of little
     monkeys with razors pours down onto the court; at the end of the night they fly back to him */
  const sky = new THREE.Group();
  {
    const kb = new Builder();
    cloud(kb, { s: 0.7, y: -0.1, rand: rng });
    figure(kb, 'wukong', { pose: 'fan', s: 1.8 });
    sky.add(kb.build());
  }
  const SKY = [-1.2, 8.6, -1.0];
  sky.position.set(...SKY);
  sky.rotation.y = 0.35;
  object.add(sky);
  const HAND = [SKY[0] + 0.35, SKY[1] + 1.15, SKY[2] + 0.2];
  const NM = 40;
  const monkeys = instanced((ib) => { figure(ib, 'monkey', { s: 1.25 }); ib.box(0.014, 0.014, 0.14, { x: 0.1, y: 0.22, z: 0.1, color: '#e6edf0', mat: M.metal }); }, NM, M.smooth);
  object.add(monkeys);
  const md = Array.from({ length: NM }, (_, i) => ({ h: heads[(i * 7 + 3) % heads.length], ph: rng(), sp: rng() * 6.28, d: i / NM }));
  const PUFF = NM, puffs = softPuffs(PUFF, { color: '#f4f2ee', opacity: 0.8 });
  const GLINT = heads.length, glints = softPuffs(GLINT, { color: '#fffaf0', opacity: 1, additive: true });
  const MIST = 60, mist = softPuffs(MIST, { color: '#53627e', opacity: 0.3 });
  const BUG = 50, bugs = softPuffs(BUG, { color: '#bfd6ff', opacity: 0.8, additive: true });   // 瞌睡虫, the sleep-bugs
  object.add(puffs.points, glints.points, mist.points, bugs.points);
  const mistD = Array.from({ length: MIST }, () => ({ x: rng.range(-9, 9), y: rng.range(0.3, 3.5), z: rng.range(-8, 8), s: 2.5 + rng() * 3, ph: rng() * 6.28 }));
  const bugD = Array.from({ length: BUG }, () => ({ h: heads[Math.floor(rng() * heads.length)], ph: rng() }));
  const gd = heads.map(() => ({ ph: rng() * 6.28, f: 0.5 + rng() * 0.9 }));

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(puffs, nk);
    nightTint(mist, nk);
    const u = (t % CYCLE) / CYCLE;
    const night = 1 - smooth(0.5, 0.62, u);
    // Wukong's cloud: present through the night, then away
    const sk = smooth(0, 0.05, u) * (1 - smooth(0.5, 0.58, u));
    sky.visible = sk > 0.01;
    sky.scale.setScalar(Math.max(0.001, sk));
    sky.position.y = SKY[1] + Math.sin(t * 0.8) * 0.15 + (1 - sk) * 2;
    for (let i = 0; i < NM; i++) {
      const m = md[i], h = m.h;
      const go = ease(clamp((u - 0.05 - m.d * 0.14) / 0.12));          // pour down
      const back = ease(clamp((u - 0.4 - m.d * 0.06) / 0.08));          // fly home
      const k = go * (1 - back);
      const a = m.sp + k * 4;
      const sw = Math.sin(Math.PI * k) * 1.4;
      const x = lerp(HAND[0], h[0], k) + Math.cos(a) * sw;
      const z = lerp(HAND[2], h[2], k) + Math.sin(a) * sw;
      const shave = k > 0.98 ? Math.abs(Math.sin(t * 9 + m.ph * 20)) * 0.05 : 0;
      const y = lerp(HAND[1], h[1] + 0.06, k) + shave;
      const s = smooth(0.0, 0.25, go) * (1 - back * 0.85) * sk;
      setInst(monkeys, i, x, y, z, a + t * (k < 0.98 ? 2 : 0.3), s < 0.01 ? 0.0001 : s);
      const pk = Math.sin(Math.PI * clamp((back - 0.85) / 0.15));
      puffs.set(i, x, y + 0.2, z, 0.35, pk * sk);
    }
    monkeys.instanceMatrix.needsUpdate = true;
    puffs.commit();
    for (let i = 0; i < BUG; i++) {
      const g = bugD[i], p = (g.ph + t * 0.06) % 1;
      bugs.set(i, lerp(HAND[0] - 0.4, g.h[0], p), lerp(HAND[1], g.h[1] + 0.2, p) + Math.sin(p * 9) * 0.3, lerp(HAND[2], g.h[2], p), 0.06, sk * smooth(0.05, 0.15, u) * Math.sin(Math.PI * p));
    }
    bugs.commit();
    // dawn: the lid creaks open, Wukong and Tang Seng pop up
    const open = smooth(0.6, 0.66, u) * (1 - smooth(0.92, 0.97, u));
    lid.rotation.x = -open * 1.9;
    const rise = smooth(0.64, 0.72, u) * (1 - smooth(0.88, 0.93, u));
    pop.visible = rise > 0.01;
    pop.position.y = CHEST[1] + lerp(-0.9, 0.95, rise) + Math.abs(Math.sin(t * 2.4)) * 0.05 * rise;
    pop.rotation.y = Math.sin(t * 0.7) * 0.3;
    // gleaming heads catch the first light
    const dawn = 1 - night;
    for (let i = 0; i < GLINT; i++) {
      const g = gd[i], h = heads[i];
      const tw = Math.max(0, Math.sin(t * g.f * 1.6 + g.ph)) ** 6;
      glints.set(i, h[0] + 0.02, h[1] + 0.08, h[2] + 0.02, 0.08 + 0.22 * tw, (0.05 + 0.95 * dawn) * (0.55 + 0.45 * tw));
    }
    glints.commit();
    for (let i = 0; i < MIST; i++) {
      const m = mistD[i];
      mist.set(i, m.x + Math.sin(t * 0.05 + m.ph) * 0.8, m.y, m.z, m.s, 0.25 + 0.75 * night);
    }
    mist.commit();
  }
  update(0);
  return { object, update };
}
