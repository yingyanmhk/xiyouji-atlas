// 长安 — a corner of the walled Tang capital in autumn: the great gate tower over its arched tunnel,
// the corner tower, rooftops and the 化生寺 hall and pagoda behind the wall, willows by the moat.
// Outside the gate Taizong under his yellow canopy and the court in their ranks see the monk off
// (the emperor's cup of wine with a pinch of home soil in it); Xuanzang rides out with his two
// attendants along the road west, under falling willow leaves.
import { THREE, Builder, M, C, terrain, hall, roof, house, pagoda, figure, horse, rock, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { daoist, willow } from './_a_figs.js';
import { nightLamps, houseLamps, hallLamps } from './_c_util.js';

const CYCLE = 30;
const WZ = -3.6, WX = -6.6, WH = 2.3, WT = 1.5;     // front wall line, side wall line, wall height / thickness
const GX = 0.6;                                       // gate
const MOAT = 0.22;
const moatD = (x, z) => Math.min(Math.abs(z - (WZ + WT / 2 + 1.2)) + (x < WX - 1.2 ? 9 : 0), x < WX + 0.5 ? Math.abs(x - (WX - WT / 2 - 1.2)) + (z > WZ + WT / 2 + 1.9 ? 9 : 0) : 9);
const ROAD = [[GX, -1.2], [GX + 0.4, 0.6], [1.8, 2.4], [3.8, 4.0], [6.0, 5.4], [8.2, 6.0]];
const roadAt = (t) => { const f = clamp(t) * (ROAD.length - 1), i = Math.min(ROAD.length - 2, Math.floor(f)), k = f - i; return [lerp(ROAD[i][0], ROAD[i + 1][0], k), lerp(ROAD[i][1], ROAD[i + 1][1], k)]; };
function roadDist(x, z) {
  let d = 1e9;
  for (let i = 0; i < ROAD.length - 1; i++) {
    const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 1, z * 0.3 + 4, 4);
  let h = 0.45 + 0.25 * n + smooth(7, 10, r) * 0.6 * n;
  h = lerp(0.06, h, smooth(0.55, 0.95, moatD(x, z)));
  return Math.max(0.06, h * smooth(10.7, 9.8, r) + 0.06);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const lamps = nightLamps(), lanterns = nightLamps({ day: 0.6, night: 1.5 }), lb = new Builder();   // windows and lanterns that light up at night

  const loess = new THREE.Color(), road = new THREE.Color('#c9b48a'), bed = new THREE.Color('#4a5a52');
  terrain(b, {
    R: 10.5, rings: 44, segs: 150, fn: ground,
    palette: (x, y, z, nx, ny) => {
      if (y < MOAT + 0.02) return bed;
      if (roadDist(x, z) < 0.45 && z > WZ) return road;
      const n = noise2(x * 0.8, z * 0.8);
      return loess.set('#b9a06a').lerp(road.clone().set('#8f9a5a'), 0.35 * n + (ny > 0.95 ? 0.15 : 0));
    },
  });

  /* the city wall: rammed earth faced with brick, battlements, an L round the corner */
  const wallC = '#a8957a', capC = '#8d7c64';
  const seg = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    b.box(WT, WH, L, { x: cx, y: 0, z: cz, ry, color: wallC, mat: M.flat });
    b.box(WT + 0.1, 0.12, L, { x: cx, y: WH, z: cz, ry, color: capC });
    const n = Math.floor(L / 0.42);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, px = lerp(x0, x1, t), pz = lerp(z0, z1, t);
      const ox = Math.cos(ry) * (WT / 2 - 0.06), oz = -Math.sin(ry) * (WT / 2 - 0.06);
      b.box(0.12, 0.26, 0.24, { x: px + ox, y: WH + 0.12, z: pz + oz, ry, color: capC });
    }
  };
  const wallEnd = Math.sqrt(9.6 ** 2 - WZ ** 2);
  seg(WX, WZ, GX - 2.4, WZ);
  seg(GX + 2.4, WZ, wallEnd - 0.4, WZ);
  seg(WX, WZ, WX, -Math.sqrt(9.4 ** 2 - WX ** 2));
  // gate bastion with the arched tunnel, and the two-storey gate tower on top
  b.box(4.8, WH + 0.1, WT + 0.5, { x: GX, y: 0, z: WZ, color: '#a08c70', mat: M.flat });
  b.box(1.2, 1.25, 0.05, { x: GX, y: 0.3, z: WZ + (WT + 0.5) / 2 + 0.005, color: '#2a2220', mat: M.smooth });
  b.cyl(0.6, 0.6, 0.05, { x: GX, y: 1.55, z: WZ + (WT + 0.5) / 2 + 0.005, rx: Math.PI / 2, color: '#2a2220', mat: M.smooth, seg: 16 });
  b.box(1.0, 1.6, 0.04, { x: GX, y: 0.3, z: WZ + (WT + 0.5) / 2 + 0.03, color: '#7a2a20', mat: M.lacquer });   // open gate leaves seen inside
  hallLamps(lb, lamps.mat, { x: GX, y: WH + 0.1, z: WZ, w: 4.0, d: 1.7, h: 1.2, base: 0.2, every: 2 });
  for (const sx of [-1, 1]) lb.sphere(0.13, { x: GX + sx * 0.85, y: 1.95, z: WZ + (WT + 0.5) / 2 + 0.2, sy: 1.25, color: '#e0503a', mat: lanterns.mat, ws: 10, hs: 8 });   // lanterns at the gate
  hall(b, { x: GX, y: WH + 0.1, z: WZ, w: 4.0, d: 1.7, h: 1.2, tiers: 2, base: 0.2, steps: false, roofColor: '#4f5a5e', wall: '#e8dcc4', pillar: C.cinnabar, beam: '#2f6a55', r: rng });
  // corner tower 角楼
  b.box(2.2, WH + 0.12, 2.2, { x: WX, y: 0, z: WZ, color: '#a08c70', mat: M.flat });
  hall(b, { x: WX, y: WH + 0.12, z: WZ, w: 1.5, d: 1.5, h: 0.9, base: 0.12, steps: false, roofColor: '#4f5a5e', wall: '#e8dcc4', beam: '#2f6a55', r: rng });

  /* inside the walls: rooftops, the 化生寺 hall and its pagoda */
  for (let i = 0, k = 0; i < 12 && k < 300; k++) {
    const x = rng.range(WX + 1.6, 8), z = rng.range(-9.2, WZ - 1.4);
    if (Math.hypot(x, z) > 8.5 || (x > 2.4 && x < 7.4 && z > -8.4 && z < -4.6) || Math.abs(x - GX) < 1.4) continue;
    const ry = rng.pick([0, 0, Math.PI / 2]), w = 1.4 + rng() * 0.6;
    house(b, { x, y: ground(x, z) - 0.05, z, ry, w, d: 1.0, h: 0.8, lit: 0, r: rng, roofColor: '#56606a' });
    houseLamps(lb, lamps.mat, { x, y: ground(x, z) - 0.05, z, ry, w, d: 1.0, h: 0.8 });
    i++;
  }
  hallLamps(lb, lamps.mat, { x: 4.0, y: ground(4.0, -5.9) - 0.05, z: -5.9, w: 3.2, d: 2.0, h: 1.4 });
  hall(b, { x: 4.0, y: ground(4.0, -5.9) - 0.05, z: -5.9, w: 3.2, d: 2.0, h: 1.4, tiers: 2, roofColor: '#3f5f62', wall: '#efe4cc', beam: '#2f6a55', r: rng });
  pagoda(b, { x: 6.5, y: ground(6.5, -4.9) - 0.05, z: -4.9, levels: 7, w: 1.1, h: 0.62, roofColor: '#4f5a5e', r: rng });
  for (const [x, z] of [[2.8, -5.0], [1.2, -7.4], [-3.6, -6.0], [-1.6, -8.0]]) willow(b, { x, y: ground(x, z) - 0.05, z, h: 1.8, r: rng, color: '#c8b45a', color2: '#a99a4a' });

  /* the moat bridge and willows on the bank */
  const BZ0 = WZ + (WT + 0.5) / 2, BZ1 = WZ + WT / 2 + 2.4;
  b.box(1.5, 0.22, BZ1 - BZ0 + 0.3, { x: GX, y: 0.32, z: (BZ0 + BZ1) / 2, color: '#b9b0a0' });
  for (const sx of [-1, 1]) b.box(0.08, 0.3, BZ1 - BZ0 + 0.3, { x: GX + sx * 0.72, y: 0.54, z: (BZ0 + BZ1) / 2, color: '#d8d0bf' });
  for (const [x, z, h] of [[-4.8, -0.4, 2.4], [-2.6, -0.3, 2.2], [3.4, -0.4, 2.3], [5.6, -0.2, 2.5], [-8.6, 1.4, 2.0], [-8.0, -1.6, 2.2]]) willow(b, { x, y: ground(x, z) - 0.05, z, h, r: rng });

  /* the farewell: Taizong under the yellow canopy, the court in ranks, guards with banners */
  const TX = -0.4, TZ = 0.9;
  daoist(b, { x: TX, y: ground(TX, TZ), z: TZ, ry: 0.9, s: 1.35, color: '#e0b04a', sash: C.cinnabar, beard: true, hat: 'crown' });
  b.cyl(0.02, 0.02, 1.7, { x: TX - 0.3, y: ground(TX, TZ), z: TZ - 0.3, color: C.woodD, mat: M.wood, seg: 5 });
  b.cone(0.55, 0.3, { x: TX - 0.3, y: ground(TX, TZ) + 1.62, z: TZ - 0.3, color: '#e7b84a', mat: M.cloth, seg: 12 });
  b.cyl(0.56, 0.56, 0.12, { x: TX - 0.3, y: ground(TX, TZ) + 1.52, z: TZ - 0.3, color: C.cinnabar, mat: M.cloth, seg: 12, open: true });
  // the cup in the emperor's hand
  b.cyl(0.03, 0.02, 0.05, { x: TX + 0.2, y: ground(TX, TZ) + 0.58, z: TZ + 0.12, color: C.gold, mat: M.metal, seg: 8 });
  const ob = new Builder();
  daoist(ob, { hat: 'official', color: '#b0563f', sash: '#e8dcc4' });
  const ob2 = new Builder();
  daoist(ob2, { hat: 'official', color: '#3f6a5a', sash: '#e8dcc4' });
  const offs = [];
  for (let i = 0; i < 6; i++) offs.push([-2.0 - (i % 3) * 0.55, -0.6 + Math.floor(i / 3) * 0.7 + (i % 3) * 0.35, 1.2, i % 2]);
  for (let i = 0; i < 6; i++) offs.push([-1.5 - (i % 3) * 0.55, 1.2 + Math.floor(i / 3) * 0.6 + (i % 3) * 0.35, 1.0, (i + 1) % 2]);
  const om = [new THREE.InstancedMesh(ob.merged(), M.cloth, 12), new THREE.InstancedMesh(ob2.merged(), M.cloth, 12)];
  const cnt = [0, 0];
  for (const [x, z, ry, k] of offs) { setInst(om[k], cnt[k]++, x, ground(x, z), z, ry, 1.1); }
  om.forEach((m, k) => { m.count = cnt[k]; m.castShadow = m.receiveShadow = true; object.add(m); });
  // guards and banners at the bridge
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
    const x = GX + sx * (1.15 + i * 0.45), z = BZ1 + 0.3 + i * 0.3;
    figure(b, 'villager', { x, y: ground(x, z), z, ry: sx * 0.4, s: 1.05, robe: '#7a3a2e', hat: '#3a3030' });
    b.cyl(0.012, 0.012, 2.0, { x: x + 0.15, y: ground(x, z), z, color: C.woodD, mat: M.wood, seg: 4 });
    b.box(0.03, 0.75, 0.42, { x: x + 0.15, y: ground(x, z) + 1.2, z: z + 0.22, color: i ? '#e0b04a' : C.cinnabar, mat: M.cloth });
  }
  // the long pavilion (长亭) by the road where travellers are seen off, autumn fields at the front-left
  {
    const px = 5.6, pz = 3.0, py = ground(px, pz) - 0.04;
    b.box(2.6, 0.18, 1.3, { x: px, y: py, z: pz, ry: -0.6, color: '#d8d0bf' });
    for (const [ox, oz] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5], [0, -0.5], [0, 0.5]]) {
      const c = Math.cos(-0.6), s2 = Math.sin(-0.6);
      b.cyl(0.05, 0.05, 1.15, { x: px + ox * c + oz * s2, y: py + 0.18, z: pz - ox * s2 + oz * c, color: C.cinnabar, mat: M.lacquer, seg: 6 });
    }
    roof(b, { x: px, y: py + 1.33, z: pz, ry: -0.6, w: 2.4, d: 1.1, h: 0.55, color: '#4f5a5e' });
  }
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const x = -6.6 + i * 1.05 + j * 0.3, z = 3.6 + j * 1.15;
    if (Math.hypot(x, z) > 9.3) continue;
    b.box(0.95, 0.06, 1.0, { x, y: ground(x, z) - 0.02, z, ry: 0.15, color: (i + j) % 2 ? '#c9a24a' : '#b8a05a', mat: M.cloth });
    for (let k = 0; k < 4; k++) b.box(0.9, 0.05, 0.05, { x, y: ground(x, z) + 0.04, z: z - 0.36 + k * 0.24, ry: 0.15, color: '#a8883a', mat: M.cloth });
  }
  for (const [x, z] of [[-3.6, 6.6], [-1.4, 7.6], [2.6, 7.4]]) willow(b, { x, y: ground(x, z) - 0.05, z, h: 1.9, r: rng, color: '#c8b45a', color2: '#a99a4a' });
  object.add(b.build(), lb.build());
  const water = new THREE.Mesh(new THREE.CircleGeometry(10.4, 72), new THREE.MeshStandardMaterial({ color: '#5f8a8a', roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.85 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.3;
  object.add(water);

  /* the travellers: the monk on horseback and his two attendants */
  const party = [];
  const mk = (fn) => { const pb = new Builder(); fn(pb); const g = pb.build(); object.add(g); party.push(g); return g; };
  mk((pb) => horse(pb, { rider: 'monk', s: 1.55, color: '#d8ccb4', saddle: C.cinnabar }));
  mk((pb) => { figure(pb, 'villager', { s: 1.15, robe: '#5a6a7a', hat: '#b59a64' }); pb.cyl(0.01, 0.01, 0.9, { y: 0.55, rx: Math.PI / 2, z: -0.45, color: C.wood, mat: M.wood, seg: 4 }); pb.box(0.2, 0.2, 0.18, { y: 0.32, z: 0.42, color: '#8a6a4a', mat: M.cloth }); pb.box(0.2, 0.2, 0.18, { y: 0.32, z: -0.42, color: '#6a7a5a', mat: M.cloth }); });
  mk((pb) => figure(pb, 'villager', { s: 1.15, robe: '#6a5a4a', hat: '#b59a64' }));

  /* falling willow leaves, a little dust behind the horse */
  const NL = 60;
  const leaves = softPuffs(NL, { color: '#d8c060', opacity: 0.9 });
  const dust = softPuffs(12, { color: '#d9c9a3', opacity: 0.4 });
  object.add(leaves.points, dust.points);
  const trees = [[-4.8, -0.4], [-2.6, -0.3], [3.4, -0.4], [5.6, -0.2], [-8.6, 1.4], [-8.0, -1.6]];
  const ld = Array.from({ length: NL }, (_, i) => ({ tr: trees[i % trees.length], a: rng() * 6.28, d: rng() * 1.2, ph: rng(), sp: 0.05 + rng() * 0.05 }));

  function update(t, dt, env) {
    lamps.update(env?.night ?? 0); lanterns.update(env?.night ?? 0);
    const u = (t % CYCLE) / CYCLE;
    // farewell pause at the bridge foot, then the ride out along the road; fade at the rim
    const go = smooth(0.25, 0.95, u);
    const lead = lerp(0.18, 1.0, go);
    const fade = smooth(0, 0.04, u) * (1 - smooth(0.92, 0.99, u));
    party.forEach((g, i) => {
      const q = lead - i * 0.055 - (i === 2 ? 0.0 : 0);
      const [x, z] = roadAt(q), [nx, nz] = roadAt(q + 0.01);
      const side = i === 0 ? 0 : (i === 1 ? 0.35 : -0.35);
      const ry = Math.atan2(nx - x, nz - z);
      g.position.set(x + Math.cos(ry) * side, ground(x, z) + (go > 0 && go < 1 ? Math.abs(Math.sin(t * 3.4 + i)) * 0.025 : 0), z - Math.sin(ry) * side);
      g.rotation.y = ry;
      g.scale.setScalar(Math.max(0.001, fade));
    });
    for (let i = 0; i < 12; i++) {
      const [x, z] = roadAt(lead - 0.03 - (i / 12) * 0.05);
      dust.set(i, x, ground(x, z) + 0.15 + (i / 12) * 0.3, z, 0.3 + i * 0.05, (go > 0.02 && go < 0.98 ? 0.6 : 0) * (1 - i / 12) * fade);
    }
    dust.commit();
    for (let i = 0; i < NL; i++) {
      const l = ld[i], k = (t * l.sp + l.ph) % 1, [tx, tz] = l.tr;
      leaves.set(i, tx + Math.cos(l.a) * l.d + k * 1.4, 2.2 * (1 - k) + 0.3, tz + Math.sin(l.a) * l.d + Math.sin(t + i) * 0.2, 0.06, smooth(0, 0.1, k) * (1 - smooth(0.85, 1, k)));
    }
    leaves.commit();
  }
  update(0);
  return { object, update };
}
