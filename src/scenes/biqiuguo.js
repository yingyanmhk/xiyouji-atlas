// 比丘国 · 小儿城 — a muted city street at night. Before every door a goose-cage (鹅笼) holds a
// child: 1,111 of them, waiting to have their hearts cut out for the false 国丈's elixir. Wukong,
// drawn large on his cloud, has summoned the city gods; in a 32 s loop a dark wind (阴风) runs down
// the street, whirls the cages up into the clouds and hides them, and at dawn sets them down again.
// In the corner the Old Man of the South Pole (寿星) has come on his cloud to lead home his white
// deer — the "国丈" was his runaway mount.
import { THREE, Builder, M, C, terrain, house, hall, pagoda, bareTree, cloud, figure, fbm, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { person, shouxing, deer, cityWall, gateTower, tileWall, paving, lantern, instanced, nightTint } from './_e_kit.js';

const CYCLE = 32;
const SR = -0.38;              // the street runs diagonally away from the viewer
const STREET_W = 1.45;         // half width of the paved street
const HZ = [-4.9, -2.6, -0.3, 2.0, 4.3, 6.5];
const OZ = 1.0;                // the city is shifted toward the viewer   // house positions along the street

function ground(x, z) {
  const r = Math.hypot(x, z);
  return 0.18 + 0.12 * fbm(x * 0.4 + 3, z * 0.4, 3) * smooth(4, 9, r) - 0.08 * smooth(9.6, 10.5, r);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const city = new THREE.Group();
  city.rotation.y = SR;
  city.position.z = OZ;
  object.add(city);
  const cs = Math.cos(SR), sn = Math.sin(SR);
  // world → street-local (for painting the ground)
  const toLocal = (x, z) => [x * cs - z * sn, x * sn + z * cs];

  const pave = paving('#9d978b', '#837e75', 0.7);
  const earth = new THREE.Color();
  terrain(b, {
    R: 10.5, rings: 30, segs: 110, fn: ground,
    palette: (x, y, z) => {
      const [lx, lz] = toLocal(x, z - OZ);
      if (Math.abs(lx) < STREET_W && lz > -8.2) return pave(lx, y, lz);
      return earth.set('#8f8169').lerp(new THREE.Color('#6f6c5c'), fbm(x * 0.5, z * 0.5, 2) * 0.6);
    },
  });

  const cb = new Builder();   // city builder (in street-local coordinates)
  const Y = 0.18;
  // the city wall across the far end, with the gate tower over the street
  cityWall(cb, -7.2, -8.0, -1.9, -8.0, { y: Y - 0.05, h: 1.5, t: 0.75 });
  cityWall(cb, 1.9, -8.0, 6.6, -8.0, { y: Y - 0.05, h: 1.5, t: 0.75 });
  gateTower(cb, { z: -8.0, y: Y - 0.05, w: 3.8, d: 1.3, h: 1.9, roofColor: '#4b5257', wall: '#9a4a3a', r: rng });
  // houses and two-storey shops along both sides of the street, courtyard walls and trees behind
  const roofs = ['#4b5257', '#565c60', '#3f474d'];
  const walls = ['#d9cfbc', '#cfc4ae', '#d4cab5'];
  const doors = [];
  HZ.forEach((z, i) => {
    for (const side of [-1, 1]) {
      if (side > 0 && i === 2) continue;   // the inn (驿馆) stands here instead
      const shop = (i + (side > 0 ? 1 : 0)) % 2 === 0;
      if (shop) hall(cb, { x: side * 2.75, y: Y, z, ry: -side * Math.PI / 2, w: 1.9, d: 1.5, h: 0.95, base: 0.12, tiers: 2, roofColor: roofs[i % 3], wall: walls[(i + 1) % 3], pillar: '#6a3a2a', beam: '#4c5a5e', lit: 0.3, r: rng, steps: false });
      else house(cb, { x: side * 2.6, y: Y, z, ry: -side * Math.PI / 2, w: 1.9, d: 1.4, h: 1.0 + rng() * 0.2, wall: walls[i % 3], roofColor: roofs[(i + side + 3) % 3], lit: 0.25, r: rng });
      doors.push([side, z]);
    }
  });
  for (const side of [-1, 1]) {
    tileWall(cb, side * 3.9, -6.4, side * 3.9, 7.4, { y: Y, h: 0.7, color: '#cbbfa8', cap: '#4b5257' });
    for (let k = 0; k < 5; k++) {
      const z = -5.4 + k * 2.8 + rng() * 0.8, x = side * (5.2 + rng() * 1.2);
      if (Math.hypot(x, z + OZ) < 8.8) bareTree(cb, { x, y: Y, z, h: 1.6 + rng() * 0.6, r: rng, color: '#4a3d33' });
    }
    house(cb, { x: side * 5.6, y: Y, z: -1.2 + side * 1.4, ry: side * 0.2, w: 1.8, d: 1.3, h: 0.9, wall: walls[1], roofColor: roofs[2], lit: 0.2, r: rng });
  }
  // a temple pagoda over the roofs — this is 比丘国, 'the kingdom of monks'
  pagoda(cb, { x: 5.2, y: Y, z: -5.6, levels: 7, w: 1.3, h: 0.72, wall: '#d8cdb8', roofColor: '#4b5257', r: rng });
  for (const [x, z, ry] of [[-6.2, 3.2, 1.2], [-5.0, 5.6, 0.9], [5.6, 4.2, -1.1]]) if (Math.hypot(x, z + OZ) < 9) house(cb, { x, y: Y, z, ry, w: 1.6, d: 1.2, h: 0.85, wall: walls[2], roofColor: roofs[1], lit: 0.2, r: rng });
  // the palace roofs beyond the wall, where the false 国丈 brews his elixir
  hall(cb, { x: 0.3, y: Y + 0.5, z: -9.6, w: 5.2, d: 1.3, h: 1.4, base: 0.5, tiers: 2, roofColor: C.tileGold, wall: '#a8402f', beam: C.shiqing, r: rng, steps: false });
  // the inn where the pilgrims lodge: a little hall with lit doors
  hall(cb, { x: 2.85, y: Y, z: HZ[2], ry: -Math.PI / 2, w: 2.2, d: 1.6, h: 1.05, base: 0.2, roofColor: '#4b5257', wall: '#cdbf9f', beam: '#3f5e6a', lit: 0.8, r: rng, steps: false });
  // willows by the wall
  for (const [x, z] of [[-2.4, -6.9], [2.6, -6.9]]) bareTree(cb, { x, y: Y, z, h: 1.5 + rng() * 0.4, r: rng, color: '#4a3d33' });

  // the cage stands: a post and an arm before every door; the cage hangs from the arm
  const cages = [];
  for (const [side, z] of doors) {
    for (const dz of [-0.5, 0.5]) {
      const px = side * 1.62, pz = z + dz;
      cb.cyl(0.025, 0.03, 1.15, { x: px, y: Y, z: pz, color: C.woodD, mat: M.wood, seg: 5 });
      cb.box(0.32, 0.03, 0.03, { x: px - side * 0.14, y: Y + 1.12, z: pz, color: C.woodD, mat: M.wood });
      cb.cyl(0.003, 0.003, 0.16, { x: px - side * 0.27, y: Y + 0.96, z: pz, color: C.ink, seg: 3 });
      cages.push({ x: px - side * 0.27, y: Y + 0.5, z: pz, ry: rng() * 6.28, ph: rng() });
    }
  }
  // paper lanterns at the inn
  for (const dz of [-0.85, 0.85]) lantern(cb, { x: 1.68, y: Y + 1.25, z: HZ[2] + dz, s: 1.1, glow: 1.5 });
  // the pilgrims at the inn door; townsfolk
  figure(cb, 'monk', { x: 1.25, y: Y, z: HZ[2] + 0.2, ry: -Math.PI / 2, s: 1.2 });
  figure(cb, 'bajie', { x: 1.1, y: Y, z: HZ[2] - 0.6, ry: -Math.PI / 2 - 0.3, s: 1.2 });
  figure(cb, 'sha', { x: 1.35, y: Y, z: HZ[2] + 0.9, ry: -Math.PI / 2 + 0.3, s: 1.2 });
  person(cb, { x: -0.7, y: Y, z: -1.0, ry: 0.6, robe: '#6a5f55', head: 'bun', pose: 'pray' });       // a weeping mother
  person(cb, { x: -0.4, y: Y, z: -1.3, ry: 0.3, robe: '#5a6470', head: 'hat', pose: 'stand' });
  person(cb, { x: -1.0, y: Y, z: 3.4, ry: 1.2, robe: '#665b4e', head: 'bun', pose: 'kneel' });
  person(cb, { x: -0.75, y: Y, z: 3.0, ry: 1.0, robe: '#4f5a63', head: 'hat', pose: 'pray' });
  person(cb, { x: 0.5, y: Y, z: 5.6, ry: -2.6, robe: '#6b6150', head: 'hat', pose: 'stand' });
  person(cb, { x: 0.8, y: Y, z: -3.6, ry: -1.9, robe: '#5d554e', head: 'bun', pose: 'kneel' });
  // a watchman's cart left in the street
  cb.box(0.7, 0.08, 0.45, { x: -0.4, y: Y + 0.25, z: 1.2, ry: 0.2, color: C.wood, mat: M.wood });
  for (const sz of [-1, 1]) cb.cyl(0.2, 0.2, 0.04, { x: -0.4 + sz * 0.05, y: Y + 0.2, z: 1.2 + sz * 0.25, rx: Math.PI / 2, ry: 0.2, color: C.woodD, mat: M.wood, seg: 10 });
  city.add(cb.build());
  object.add(b.build());

  /* the Old Man of the South Pole with his white deer, on a cloud in the corner */
  const sx = new Builder();
  cloud(sx, { s: 0.75, y: -0.1, rand: rng, color: '#f4efe4' });
  shouxing(sx, { x: -0.45, s: 1.25, ry: 0.5 });
  deer(sx, { x: 0.55, z: 0.05, ry: -0.9, s: 1.1 });
  sx.tube([[-0.25, 0.45, 0.1], [0.05, 0.38, 0.2], [0.42, 0.62, 0.25]], 0.006, { color: C.cinnabar, mat: M.cloth, radial: 3 });   // the lead
  const shou = sx.build();
  shou.position.set(-6.6, 3.6, 4.4);
  shou.rotation.y = 0.9;
  object.add(shou);

  /* Wukong on his cloud, arm raised, summoning the gods of the city */
  const wk = new Builder();
  cloud(wk, { s: 0.55, y: -0.06, rand: rng });
  figure(wk, 'wukong', { pose: 'fan', s: 1.7 });
  const wukong = wk.build();
  const WK = [-0.4, 3.4, 4.9];
  wukong.position.set(...WK);
  wukong.rotation.y = 0.5;
  object.add(wukong);

  /* goose-cages, each holding a child */
  const cageMesh = instanced((ib) => {
    ib.cyl(0.19, 0.19, 0.035, { color: '#a88a55', mat: M.wood, seg: 12 });
    const bars = 10;
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      ib.tube([[c * 0.18, 0.03, s * 0.18], [c * 0.19, 0.2, s * 0.19], [c * 0.13, 0.36, s * 0.13], [c * 0.02, 0.42, s * 0.02]], 0.009, { color: '#b99a5e', mat: M.wood, radial: 3, segs: 6 });
    }
    ib.torus(0.18, 0.012, { y: 0.2, rx: Math.PI / 2, color: '#9c7d48', mat: M.wood, ts: 14, rs: 3 });
    ib.torus(0.01, 0.006, { y: 0.44, color: C.ink, ts: 6, rs: 3 });
    person(ib, { y: 0.035, s: 0.5, robe: C.vermilion, robe2: '#d9644a', head: 'child', pose: 'kneel' });
  }, cages.length, M.wood);
  city.add(cageMesh);

  /* the dark wind and the cloud that hides the cages */
  const CLOUD_C = [0.2, 9.6, -2.2];
  const WIND = 150, wind = softPuffs(WIND, { color: '#34333a', opacity: 0.42 });
  const HIDE = 120, hide = softPuffs(HIDE, { color: '#6f6e76', opacity: 0.38 });
  const MOTE = 40, motes = softPuffs(MOTE, { color: '#ffd89a', opacity: 0.8, additive: true });
  city.add(wind.points, hide.points, motes.points);
  const wd = Array.from({ length: WIND }, () => ({ z: rng.range(-8, 7.5), y: rng(), ph: rng() * 6.28, r: 0.3 + rng() * 1.3, s: 0.8 + rng() * 1.6 }));
  const hd = Array.from({ length: HIDE }, () => ({ x: rng.gauss() * 2.2, y: rng.gauss() * 0.45, z: rng.gauss() * 1.4, s: 0.9 + rng() * 2.0, ph: rng() * 6.28 }));
  const md = Array.from({ length: MOTE }, () => ({ x: rng.range(-2.5, 2.5), z: rng.range(-7, 7), ph: rng() }));

  // dawn: a pale low sun rising behind the gate
  const sunB = new Builder();
  sunB.sphere(0.55, { color: '#ffc49a', mat: M.glow, glow: 1.35, ws: 20, hs: 14 });
  const sun = sunB.build({ shadows: false });
  city.add(sun);

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(hide, nk);
    nightTint(wind, nk, 0.5);
    const u = (t % CYCLE) / CYCLE;
    const lift = smooth(0.2, 0.42, u), back = smooth(0.7, 0.9, u);   // cages up / back down
    const gone = lift * (1 - back);
    for (let i = 0; i < cages.length; i++) {
      const c = cages[i];
      // each cage leaves a little after the wind passes its door (the wind runs from the gate forward)
      const d = (c.z + 8) / 16;
      const up = ease(clamp((lift - d * 0.35) / 0.65)) * (1 - ease(clamp((back - (1 - d) * 0.35) / 0.65)));
      const sw = Math.sin(Math.PI * up);
      const a = c.ph * 6.28 + up * 5;
      const x = lerp(c.x, CLOUD_C[0] + Math.cos(c.ph * 40 + t * 0.12) * (1.2 + c.ph * 1.6), up) + Math.cos(a) * sw * 1.4;
      const z = lerp(c.z, CLOUD_C[2] + Math.sin(c.ph * 40 + t * 0.12) * (0.8 + c.ph), up) + Math.sin(a) * sw * 1.4;
      const y = lerp(c.y, CLOUD_C[1] + (c.ph - 0.5) * 0.6, up * up) + Math.sin(t * 1.3 + c.ph * 9) * 0.015 * (1 - up);
      setInst(cageMesh, i, x, y, z, c.ry + up * 4 + Math.sin(t * 0.9 + c.ph * 7) * 0.08 * (1 - up), 1.25, sw * 0.4, 0);
    }
    cageMesh.instanceMatrix.needsUpdate = true;
    // wind: a column whirling down the street, then up into the cloud
    const wk = smooth(0.16, 0.24, u) * (1 - smooth(0.42, 0.5, u)) + 0.85 * smooth(0.68, 0.74, u) * (1 - smooth(0.88, 0.94, u));
    const front = lerp(-8.5, 8, clamp((u - 0.16) / 0.22));
    for (let i = 0; i < WIND; i++) {
      const w = wd[i];
      const p = (w.y + t * 0.07) % 1;
      const a = w.ph + t * 1.6 + p * 6;
      const near = clamp(1 - Math.abs(w.z - Math.min(front, w.z)) * 0.2) * (w.z < front + 1.5 ? 1 : 0);
      const yy = p * CLOUD_C[1];
      const rr = w.r * (0.6 + p * 1.8);
      const ox = lerp(0, CLOUD_C[0], p), oz = lerp(w.z, CLOUD_C[2], p * p);
      wind.set(i, ox + Math.cos(a) * rr, yy + 0.3, oz + Math.sin(a) * rr, w.s * (0.7 + p), wk * Math.sin(Math.PI * p) * (u > 0.6 ? 1 : near));
    }
    wind.commit();
    const hk = 0.25 + 0.75 * smooth(0.25, 0.42, u) * (1 - smooth(0.82, 0.95, u));
    for (let i = 0; i < HIDE; i++) {
      const h = hd[i];
      hide.set(i, CLOUD_C[0] + h.x + Math.sin(t * 0.15 + h.ph) * 0.4, CLOUD_C[1] + h.y, CLOUD_C[2] + h.z, h.s * (0.6 + 0.4 * hk), hk);
    }
    hide.commit();
    // dawn
    const dawn = smooth(0.66, 0.86, u) * (1 - smooth(0.96, 1, u));
    sun.position.set(-4.6, lerp(-0.6, 2.8, dawn), -9.6);
    sun.visible = dawn > 0.01;
    for (let i = 0; i < MOTE; i++) {
      const m = md[i], p = (m.ph + t * 0.05) % 1;
      motes.set(i, m.x + Math.sin(t * 0.4 + i) * 0.3, 0.4 + p * 3.5, m.z, 0.12 + 0.1 * Math.sin(i), dawn * Math.sin(Math.PI * p));
    }
    motes.commit();
    // Wukong bobs; the old man's cloud drifts
    wukong.position.y = WK[1] + Math.sin(t * 0.8) * 0.15;
    shou.position.y = 3.6 + Math.sin(t * 0.6 + 1) * 0.12;
  }
  update(0);
  return { object, update };
}
