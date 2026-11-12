// 天竺国 — the crossroads before the palace, where the "princess" has had a silk-hung tower (彩楼)
// raised to throw her embroidered ball and choose a husband. She is the Jade Hare of the moon in
// disguise; she throws the ball herself from the tower window, and it arcs over the crowd of suitors
// onto Tang Seng's head. Above, a pale
// full moon: in a 36 s loop the Star Lord of the Moon (太阴星君) and the fairies of 广寒宫 come down on
// clouds to reclaim her — the princess vanishes, a white hare rises, and they return to the moon.
import { THREE, Builder, M, C, terrain, house, hall, roof, cloud, figure, peachTree, fbm, hash2, smooth, clamp, lerp, mix, ease, softPuffs } from '../kit.js';
import { person, paving, lantern } from './_e_kit.js';

const CYCLE = 36;
const Y = 0.2;
const TW = [0, Y, -1.4];          // the tower
const FLOOR2 = 3.2;               // its balcony
const TS = 1.22;                  // tower scale
const MOON = [-1.2, 12.4, -7.2];
const SILK = ['#d8506a', '#e8a33a', '#3f9a7a', '#4a7ac0', '#e07aa0', '#f0d060'];

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pave = paving('#cdbfa6', '#b6a78c', 0.8);
  terrain(b, { R: 10.5, rings: 26, segs: 100, fn: (x, z) => Y - 0.12 * smooth(9.6, 10.5, Math.hypot(x, z)), palette: (x, y, z) => pave(x, y, z) });

  /* the 彩楼: a two-storey tower of red posts, silk swags and streamers, gilded roof */
  b.push({ x: TW[0], y: TW[1], z: TW[2], s: TS });
  b.box(3.2, 0.4, 3.2, { color: '#e6dcc8', mat: M.stone });
  for (let i = 0; i < 4; i++) b.box(1.2, 0.4 * (1 - i / 4), 0.24, { z: 1.72 + i * 0.24, color: '#e6dcc8', mat: M.stone });
  const post = (x, z, y0, h) => b.cyl(0.07, 0.08, h, { x, y: y0, z, color: C.cinnabar, mat: M.lacquer, seg: 8 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { post(sx * 1.25, sz * 1.25, 0.4, FLOOR2 - 0.4); post(sx * 1.0, sz * 1.0, FLOOR2, 1.6); }
  b.box(2.9, 0.16, 2.9, { y: FLOOR2, color: '#8a3a2a', mat: M.lacquer });                             // balcony floor
  b.box(3.0, 0.06, 3.0, { y: FLOOR2 - 0.06, color: C.gold, mat: M.smooth });
  for (const [dx, dz, ry] of [[0, 1.42, 0], [0, -1.42, 0], [1.42, 0, Math.PI / 2], [-1.42, 0, Math.PI / 2]]) {
    b.box(2.8, 0.05, 0.05, { x: dx, y: FLOOR2 + 0.42, z: dz, ry, color: C.cinnabar, mat: M.lacquer });
    for (let i = -6; i <= 6; i++) b.box(0.03, 0.42, 0.03, { x: dx + Math.cos(ry) * i * 0.22, y: FLOOR2 + 0.02, z: dz - Math.sin(ry) * i * 0.22, color: '#c04a3a', mat: M.lacquer });
  }
  roof(b, { y: FLOOR2 - 0.2, w: 2.9, d: 2.9, h: 0.6, top: 0.4, color: '#2f7a5a' });
  b.box(2.2, 0.2, 2.2, { y: FLOOR2 + 1.6, color: C.shiqing, mat: M.smooth });
  roof(b, { y: FLOOR2 + 1.8, w: 2.2, d: 2.2, h: 1.2, color: C.tileGold, finial: C.gold });
  // silk swags between the posts (both storeys) and long streamers
  let ci = 0;
  for (const [y, R] of [[FLOOR2 - 0.25, 1.25], [FLOOR2 + 1.45, 1.0]]) {
    const corners = [[-R, R], [R, R], [R, -R], [-R, -R]];
    for (let k = 0; k < 4; k++) {
      const [x0, z0] = corners[k], [x1, z1] = corners[(k + 1) % 4];
      for (let j = 0; j < 2; j++) {
        const a0 = j / 2, a1 = (j + 1) / 2;
        const p0 = [lerp(x0, x1, a0), y, lerp(z0, z1, a0)], p1 = [lerp(x0, x1, a1), y, lerp(z0, z1, a1)];
        const m = [(p0[0] + p1[0]) / 2 * 1.04, y - 0.32, (p0[2] + p1[2]) / 2 * 1.04];
        b.tube([p0, m, p1], 0.05, { color: SILK[ci++ % SILK.length], mat: M.cloth, radial: 5, segs: 10 });
      }
      b.sphere(0.09, { x: x0 * 1.02, y: y - 0.05, z: z0 * 1.02, color: SILK[(ci + 2) % SILK.length], mat: M.cloth, ws: 8, hs: 6 });   // silk rosettes
    }
  }
  for (let i = 0; i < 16; i++) {
    const side = i % 4, f = (Math.floor(i / 4) + 0.5) / 4 - 0.5;
    const [x, z] = [[f * 2.5, 1.28], [1.28, f * 2.5], [f * 2.5, -1.28], [-1.28, f * 2.5]][side];
    b.box(side % 2 ? 0.015 : 0.12, 1.4 + (i % 3) * 0.3, side % 2 ? 0.12 : 0.015, { x, y: FLOOR2 - 1.6 - (i % 3) * 0.3, z, rz: (rng() - 0.5) * 0.08, color: SILK[i % SILK.length], mat: M.cloth });
  }
  // the upper storey is closed with lacquered lattice screens; the princess leans out of its front window
  const SC = '#b8402e', WY0 = FLOOR2 + 0.62, WY1 = FLOOR2 + 1.26;
  b.box(1.96, 1.46, 0.05, { y: FLOOR2 + 0.16, z: -0.98, color: SC, mat: M.wood });
  for (const sx of [-1, 1]) b.box(0.05, 1.46, 1.96, { x: sx * 0.98, y: FLOOR2 + 0.16, color: SC, mat: M.wood });
  for (const sx of [-1, 1]) b.box(0.5, 1.46, 0.05, { x: sx * 0.73, y: FLOOR2 + 0.16, z: 0.98, color: SC, mat: M.wood });
  b.box(0.96, WY0 - FLOOR2 - 0.16, 0.05, { y: FLOOR2 + 0.16, z: 0.98, color: SC, mat: M.wood });           // sill wall
  b.box(0.96, FLOOR2 + 1.62 - WY1, 0.05, { y: WY1, z: 0.98, color: SC, mat: M.wood });                       // over the window
  for (const sx of [-1, 1]) for (let i = 1; i < 4; i++) b.box(0.015, 1.3, 0.02, { x: sx * (0.48 + i * 0.12), y: FLOOR2 + 0.18, z: 1.01, color: C.gold, mat: M.smooth });
  // gilded window frame and sill, silk curtains tied back at the sides
  b.box(1.02, 0.06, 0.16, { y: WY0 - 0.03, z: 1.03, color: C.gold, mat: M.smooth });
  b.box(1.02, 0.06, 0.08, { y: WY1, z: 1.02, color: C.gold, mat: M.smooth });
  for (const sx of [-1, 1]) {
    b.box(0.06, WY1 - WY0 + 0.06, 0.08, { x: sx * 0.49, y: WY0 - 0.03, z: 1.02, color: C.gold, mat: M.smooth });
    b.tube([[sx * 0.44, WY1 - 0.02, 1.06], [sx * 0.3, WY1 - 0.25, 1.08], [sx * 0.4, WY0 + 0.15, 1.07], [sx * 0.42, WY0 + 0.02, 1.06]], (q) => 0.05 + 0.03 * Math.sin(Math.PI * q), { color: '#e07aa0', mat: M.cloth, radial: 5, segs: 10 });
  }
  b.box(0.8, 0.5, 0.02, { y: WY0 + 0.05, z: -0.94, color: '#ffd9a0', mat: M.glow, glow: 0.9 });           // lamplight inside
  for (const [x, z] of [[-1.25, 1.25], [1.25, 1.25]]) lantern(b, { x, y: FLOOR2 - 0.12, z: z + 0.05, s: 1.4, glow: 1.3, color: '#ff6a5a' });
  b.pop();

  /* the street: palace gate behind, shops and banners, flowering trees */
  hall(b, { x: 0, y: Y, z: -7.6, w: 6.0, d: 1.4, h: 1.3, base: 0.3, tiers: 2, roofColor: C.tileGold, wall: '#c45a48', beam: '#2f6a8a', r: rng, steps: false });
  for (const [x, z, ry] of [[-5.2, -3.6, 0.9], [-6.4, 0.2, 1.3], [-5.8, 3.8, 1.9], [5.4, -3.4, -0.9], [6.5, 0.4, -1.4], [5.6, 4.2, -1.9]]) {
    house(b, { x, y: Y, z, ry, w: 1.9, d: 1.3, h: 1.05, wall: '#ecdcc4', roofColor: '#3f6a62', lit: 0.2, r: rng });
    const c = Math.cos(ry), s = Math.sin(ry);
    b.cyl(0.025, 0.03, 2.2, { x: x + s * 1.0 + c * 0.8, y: Y, z: z + c * 1.0 - s * 0.8, color: C.woodD, mat: M.wood, seg: 5 });
    b.box(0.03, 0.9, 0.34, { x: x + s * 1.0 + c * 0.8, y: Y + 1.15, z: z + c * 1.0 - s * 0.8 + 0.18, ry, color: SILK[Math.floor(rng() * SILK.length)], mat: M.cloth });
  }
  for (const [x, z] of [[-3.2, -5.6], [3.4, -5.4], [-7.6, -2.6], [7.4, -2.4]]) peachTree(b, { x, y: Y, z, h: 1.6, r: rng, fruit: 0 });

  /* the suitors' crowd, Tang Seng in its midst with Wukong at his side */
  const MONK = [0.5, Y, 3.4];
  const robes = ['#4a6aa0', '#a04a5a', '#5a8a6a', '#c08a3a', '#7a5a9a', '#3a7a8a', '#b86a4a'];
  for (let i = 0, k = 0; i < 46 && k < 600; k++) {
    const [x, z] = rng.inDisc(7.4, 1.6);
    if (z < 0.9 || Math.hypot(x - MONK[0], z - MONK[2]) < 0.75 || Math.hypot(x, z) > 7.6) continue;
    if (Math.abs(x) < 0.7 && z < 2.4) continue;
    const ry = Math.atan2(TW[0] - x, TW[2] - z) + (rng() - 0.5) * 0.5;
    person(b, { x, y: Y, z, ry, s: 1.05, robe: rng.pick(robes), robe2: '#e8dcc8', head: rng() < 0.6 ? 'futou' : 'hat', hatColor: '#2a2a2a', pose: rng() < 0.4 ? 'up' : 'stand' });
    i++;
  }
  figure(b, 'wukong', { x: MONK[0] + 0.75, y: Y, z: MONK[2] + 0.2, ry: Math.PI - 0.3, pose: 'gaze', s: 1.7 });
  object.add(b.build());

  const mb = new Builder();
  figure(mb, 'monk', { s: 1.35 });
  const monk = mb.build();
  monk.position.set(...MONK);
  monk.rotation.y = Math.PI;
  object.add(monk);

  /* the princess on the balcony (the hare in disguise), and the hare herself */
  const pb = new Builder();
  person(pb, { s: 1.3, robe: '#e8a0b8', robe2: '#f6e6d6', head: 'crown', pose: 'up', skin: '#f1dccb' });
  const princess = pb.build();
  const PR = [TW[0] + 0.05, TW[1] + (FLOOR2 + 0.16) * TS, TW[2] + 0.84 * TS];
  princess.position.set(...PR);
  object.add(princess);
  const rb = new Builder();
  rb.sphere(0.2, { y: 0.2, sz: 1.3, color: '#f8f6f0', mat: M.smooth });
  rb.sphere(0.13, { y: 0.36, z: 0.2, color: '#fbf9f4', mat: M.smooth });
  for (const sx of [-1, 1]) rb.sphere(0.05, { x: sx * 0.05, y: 0.58, z: 0.16, sx: 0.6, sy: 3, sz: 0.5, rx: -0.2, color: '#f6e8e8', mat: M.smooth, ws: 8, hs: 6 });
  rb.sphere(0.06, { y: 0.18, z: -0.26, color: '#ffffff', mat: M.smooth });
  const hare = rb.build({ shadows: false });
  hare.scale.setScalar(1.4);
  object.add(hare);

  /* the embroidered ball (绣球) */
  const bb = new Builder();
  bb.ico(0.17, { color: '#d8304a', mat: M.flat, detail: 1 });
  for (let i = 0; i < 3; i++) bb.torus(0.172, 0.018, { rx: i * 1.05, ry: i * 0.7, color: C.gold, mat: M.metal, ts: 16, rs: 4 });
  bb.tube([[0, -0.15, 0], [0.05, -0.35, 0.02], [-0.03, -0.55, 0]], 0.012, { color: '#e8a33a', mat: M.cloth, radial: 3 });
  const ball = bb.build({ shadows: false });
  object.add(ball);
  const TRAIL = 16, trail = softPuffs(TRAIL, { color: '#ffd0c0', opacity: 0.6 });
  object.add(trail.points);
  const HAND = [PR[0], PR[1] + 0.98, PR[2] + 0.3], HEAD = [MONK[0], MONK[1] + 1.0, MONK[2]];
  const ballAt = (q, o) => { o[0] = lerp(HAND[0], HEAD[0], q); o[2] = lerp(HAND[2], HEAD[2], q); o[1] = lerp(HAND[1], HEAD[1], q) + Math.sin(Math.PI * q) * 2.2; return o; };

  /* the moon, with its osmanthus, and the fairies who come down from it */
  const moonMat = new THREE.MeshStandardMaterial({ color: '#f4f1e8', emissive: '#e8e2d0', emissiveIntensity: 0.55, roughness: 1 });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.9, 48), moonMat);
  moon.position.set(...MOON);
  moon.scale.setScalar(1);
  moon.lookAt(MOON[0], MOON[1] - 3, 40);
  object.add(moon);
  {
    const ob = new Builder();
    for (let i = 0; i < 7; i++) ob.sphere(0.2 + rng() * 0.14, { x: -0.45 + rng() * 0.9, y: 0.1 + rng() * 0.55, z: 0.02, sz: 0.05, color: '#e4e0d4', mat: M.cloud, ws: 10, hs: 6 });
    ob.box(0.07, 0.7, 0.02, { x: 0, y: -0.55, color: '#e0dccf', mat: M.cloud });
    const tree = ob.build({ shadows: false });
    tree.scale.setScalar(1.25);
    moon.add(tree);
  }
  const halo = softPuffs(4, { color: '#f6f2e6', opacity: 0.35 });
  object.add(halo.points);
  const fairies = [];
  for (let i = 0; i < 5; i++) {
    const fb = new Builder();
    cloud(fb, { s: 0.38, y: -0.05, rand: rng, puffs: 5 });
    person(fb, { s: i === 0 ? 1.35 : 1.15, robe: i === 0 ? '#f4f0f8' : rng.pick(['#e6eef8', '#f6e6ee', '#e8f4ec']), robe2: '#ffffff', head: 'bun', pose: i === 0 ? 'pray' : 'stand', skin: '#f3e2d2' });
    fb.tube([[-0.12, 0.5, 0], [-0.4, 0.35, -0.1], [-0.5, 0.05, -0.25], [-0.75, -0.1, -0.3]], 0.015, { color: SILK[(i + 1) % SILK.length], mat: M.cloth, radial: 3, segs: 12 });   // flying ribbons
    fb.tube([[0.12, 0.5, 0], [0.35, 0.3, -0.15], [0.55, 0.12, -0.2], [0.7, -0.05, -0.35]], 0.015, { color: SILK[(i + 3) % SILK.length], mat: M.cloth, radial: 3, segs: 12 });
    const g = fb.build({ shadows: false });
    object.add(g);
    fairies.push({ g, ox: (i - 2) * 1.0 + (i === 0 ? 0 : 0), oz: i === 0 ? 0.4 : -Math.abs(i - 2) * 0.3, ph: rng() * 6.28 });
  }
  const PETAL = 40, petals = softPuffs(PETAL, { color: '#f0a0b0', opacity: 0.85 });
  object.add(petals.points);
  const pd = Array.from({ length: PETAL }, () => ({ x: rng.range(-1.6, 1.6), z: rng.range(-1, 2.5), ph: rng() }));
  const P = [0, 0, 0];

  function update(t) {
    const u = (t % CYCLE) / CYCLE;
    // the ball arcs down onto Tang Seng's head and stays a moment
    const q = ease(clamp((u - 0.08) / 0.18));
    ballAt(q, P);
    ball.position.set(P[0], P[1], P[2]);
    ball.rotation.set(t * 3 * (1 - q), t * 2 * (1 - q), 0);
    ball.visible = u < 0.42;
    for (let i = 0; i < TRAIL; i++) { ballAt(clamp(q - i * 0.02), P); trail.set(i, P[0], P[1], P[2], 0.16 - i * 0.008, q < 1 && q > 0 ? (1 - i / TRAIL) * 0.8 : 0); }
    trail.commit();
    monk.rotation.x = q >= 1 ? Math.sin(Math.min(1, (u - 0.26) * 20) * Math.PI) * -0.12 : 0;
    // petals scattered over the crowd when the ball lands
    const pk = smooth(0.24, 0.3, u) * (1 - smooth(0.4, 0.5, u));
    for (let i = 0; i < PETAL; i++) {
      const p = pd[i], f = (p.ph + t * 0.1) % 1;
      petals.set(i, MONK[0] + p.x + Math.sin(t + i) * 0.2, MONK[1] + 3.2 - f * 3, MONK[2] + p.z - 1, 0.07, pk * Math.sin(Math.PI * f));
    }
    petals.commit();
    // the moon-fairies come down, the princess becomes the hare, they go back up
    const down = ease(clamp((u - 0.45) / 0.15)), up = ease(clamp((u - 0.72) / 0.18));
    const k = down * (1 - up);
    const show = smooth(0.43, 0.47, u) * (1 - smooth(0.9, 0.94, u));
    fairies.forEach((f, i) => {
      const tx = TW[0] + f.ox * 1.3, ty = TW[1] + (FLOOR2 + 3.4) * TS + (i === 0 ? 0.4 : 0) - Math.abs(i - 2) * 0.25, tz = TW[2] + 2.2 + f.oz;
      f.g.position.set(lerp(MOON[0] + f.ox * 0.6, tx, k), lerp(MOON[1] - 1, ty, k) + Math.sin(t * 0.9 + f.ph) * 0.12, lerp(MOON[2] + 0.5, tz, k));
      f.g.rotation.y = Math.sin(t * 0.3 + f.ph) * 0.2;
      f.g.scale.setScalar(Math.max(0.001, show * (0.55 + 0.45 * k)));
      f.g.visible = show > 0.01;
    });
    const turned = smooth(0.6, 0.64, u) * (1 - smooth(0.96, 1, u));
    princess.visible = turned < 0.5;
    princess.scale.setScalar(Math.max(0.001, 1 - turned * 0.8));
    hare.visible = turned > 0.02 && u < 0.93;
    const hk = ease(clamp((u - 0.72) / 0.18));
    hare.position.set(lerp(PR[0], MOON[0], hk), lerp(PR[1] + 0.05, MOON[1] - 0.6, hk) + Math.sin(Math.PI * hk) * 1.0, lerp(PR[2], MOON[2] + 0.6, hk));
    hare.rotation.y = 0.4 + hk * 3;
    hare.scale.setScalar(1.4 * Math.max(0.001, smooth(0.6, 0.66, u)) * (1 - 0.5 * hk));
    for (let i = 0; i < 4; i++) halo.set(i, MOON[0], MOON[1], MOON[2] - 0.2, 5.4 + i * 1.6, 0.5 - i * 0.1);
    halo.commit();
  }
  update(0);
  return { object, update };
}
