// 东海龙宫 — the crystal palace on the floor of the Eastern Sea, seen through the water as in a
// glass tray. In the sea-treasury stands the 定海神针: black iron between two gold hoops (中间乃一段
// 乌铁), glowing with rosy light, so tall it pierces the surface. Wukong at its foot asks it to be
// "a little shorter, a little thinner" — and it shrinks to a staff in his hand, then towers again.
// Fish shoals circle, kelp sways, the Dragon King looks on.
import { THREE, Builder, M, C, terrain, rock, hall, roof, bareTree, fbm, noise2, smooth, clamp, lerp, ease, setInst, softPuffs } from '../kit.js';
import { monkeyKing, daoist, fish, tinted } from './_a_figs.js';

const SEA = 4.5;
const CYCLE = 26;
const P = [2.3, 0, -0.1];          // the pillar
const TALL = 14.6, PR = 0.42;     // pillar height / radius when it is the 定海神针

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.35 + 7, z * 0.35 - 2, 4);
  let h = 0.25 + 0.5 * n;
  h += smooth(6.5, 10, r) * (0.8 + 2.6 * n);                                    // reef wall around the basin
  h += 0.55 * Math.exp(-((x / 4.8) ** 4 + ((z + 3.2) / 3) ** 4));                // terrace of the palace
  return Math.max(0.1, h * smooth(10.7, 9.8, r) + 0.15);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const reef = tinted(3.5, { cliff: [[0, '#5f7f84'], [0.4, '#3f6a78'], [1, '#2a4f66']], ledge: [[0, '#8fa49a'], [0.3, '#5f8f8a'], [1, '#3f7a7a']] });
  terrain(b, { R: 10.5, rings: 40, segs: 130, fn: ground, palette: reef });
  // reef rocks and pillars of coral-rock along the rim
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2, d = 7.4 + rng() * 2.4, x = Math.cos(a) * d, z = Math.sin(a) * d;
    rock(b, { x, y: ground(x, z) - 0.2, z, r: 0.5 + rng() * 0.7, h: 1.2 + rng() * 2.2, rand: rng, palette: tinted(3, { base: ground(x, z), cliff: [[0, '#4f6f7a'], [1, '#2f4f66']], ledge: [[0, '#7fa08a'], [1, '#4f8a7a']] }) });
  }
  // corals: branching fans in red, coral and pale pink
  for (let i = 0, k = 0; i < 18 && k < 300; k++) {
    const [x, z] = rng.inDisc(9.4, 3.2);
    if (Math.hypot(x - P[0], z - P[2]) < 2.4 || (Math.abs(x) < 4.6 && z < 0.5 && z > -6.5)) continue;
    bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 0.7 + rng() * 0.8, r: rng, color: rng.pick(['#d0573f', '#e07b62', '#e8a3a0', '#c9443a']) }); i++;
  }

  /* the crystal palace (its walls swapped for glassy crystal below) */
  const pb = new Builder();
  const TY = ground(0, -3.2);
  pb.box(9.4, 0.3, 5.6, { x: 0, y: TY - 0.2, z: -3.4, color: '#e6ece6' });
  pb.box(9.0, 0.06, 5.2, { x: 0, y: TY + 0.1, z: -3.4, color: '#bfd6d4' });
  hall(pb, { x: 0, y: TY + 0.1, z: -4.6, w: 3.6, d: 2.2, h: 1.5, tiers: 2, wall: '#cfe9ee', roofColor: '#7fb4bc', pillar: '#eef6f4', beam: '#4f8fa8', lit: 0.6, r: rng });
  for (const sx of [-1, 1]) {
    hall(pb, { x: sx * 3.4, y: TY + 0.1, z: -3.9, ry: -sx * 0.25, w: 2.2, d: 1.5, h: 1.15, wall: '#d8eef0', roofColor: '#8fc0c4', pillar: '#eef6f4', beam: '#4f8fa8', lit: 0.5, r: rng });
    // gate towers 阙
    pb.box(0.7, 1.6, 0.7, { x: sx * 1.6, y: TY + 0.1, z: -1.4, color: '#d8eef0' });
    roof(pb, { x: sx * 1.6, y: TY + 1.7, z: -1.4, w: 0.7, d: 0.7, color: '#7fb4bc' });
  }
  pb.box(2.4, 0.1, 0.2, { x: 0, y: TY + 1.2, z: -1.4, color: '#4f8fa8', mat: M.smooth });
  // treasury floor: a round white-jade platform around the pillar
  pb.cyl(1.9, 2.1, 0.3, { x: P[0], y: ground(P[0], P[2]) - 0.1, z: P[2], seg: 24, color: '#e6ece6' });
  pb.cyl(1.5, 1.5, 0.05, { x: P[0], y: ground(P[0], P[2]) + 0.2, z: P[2], seg: 24, color: '#9fc4c4', mat: M.smooth });
  const palace = pb.build();
  const crystal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.72, emissive: '#3f8fa0', emissiveIntensity: 0.25 });
  palace.traverse((o) => { if (o.isMesh && o.material === M.stone) o.material = crystal; });
  object.add(palace);
  const FLOOR = ground(P[0], P[2]) + 0.25;

  /* the Dragon King and two attendants, astonished */
  daoist(b, { x: -0.6, y: FLOOR - 0.2, z: 2.8, ry: 0.9, s: 1.3, color: '#2f6a5a', sash: C.gold, beard: true, hat: 'crown' });
  b.cone(0.03, 0.14, { x: -0.62, y: FLOOR - 0.2 + 0.86 * 1.3, z: 2.75, rz: 0.4, color: '#e9dcae', mat: M.smooth, seg: 5 });
  b.cone(0.03, 0.14, { x: -0.5, y: FLOOR - 0.2 + 0.86 * 1.3, z: 2.85, rz: -0.4, color: '#e9dcae', mat: M.smooth, seg: 5 });
  daoist(b, { x: -1.4, y: ground(-1.4, 3.6), z: 3.6, ry: 0.7, s: 1.05, color: '#b0563f', hat: 'official' });
  daoist(b, { x: -1.0, y: ground(-1.0, 4.4), z: 4.4, ry: 0.5, s: 1.05, color: '#8a6a3a', hat: 'official' });
  object.add(b.build());

  /* sea: transparent wall + rippling surface */
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(10.45, 10.45, SEA, 72, 1, true), new THREE.MeshStandardMaterial({ color: '#2f7690', roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false }));
  wall.position.y = SEA / 2;
  object.add(wall);
  const RINGS = 26, SEGS = 96;
  const sp = new Float32Array((1 + RINGS * SEGS) * 3), sidx = [];
  const at = (i, j) => (i === 0 ? 0 : 1 + (i - 1) * SEGS + (j % SEGS));
  for (let i = 1; i <= RINGS; i++) for (let j = 0; j < SEGS; j++) { const r = (i / RINGS) * 10.45, a = (j / SEGS) * Math.PI * 2; sp.set([Math.cos(a) * r, 0, Math.sin(a) * r], at(i, j) * 3); }
  for (let j = 0; j < SEGS; j++) sidx.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < RINGS; i++) for (let j = 0; j < SEGS; j++) sidx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i + 1, j));
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setIndex(sidx); sg.computeVertexNormals();
  const surf = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#5fa8bc', roughness: 0.05, metalness: 0.25, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
  surf.position.y = SEA;
  object.add(surf);
  { const lb = new Builder(); lb.torus(10.42, 0.05, { y: SEA, rx: Math.PI / 2, color: '#eef6f6', mat: M.smooth, ts: 96, rs: 4 }); object.add(lb.build({ shadows: false })); }

  /* the pillar / staff */
  const pillar = new THREE.Group();
  {
    const qb = new Builder();
    qb.cyl(1, 1, 1, { seg: 14, color: '#2e2d31', mat: M.lacquer });
    for (const e of [0, 0.925]) qb.cyl(1.14, 1.14, 0.075, { y: e, seg: 14, color: '#f0c45a', mat: M.lacquer });
    for (const e of [0.075, 0.9]) qb.cyl(1.16, 1.16, 0.006, { y: e + (e > 0.5 ? 0.025 : 0), seg: 14, color: '#ffd77a', mat: M.glow, glow: 1.6 });
    qb.box(0.16, 0.13, 0.04, { y: 0.78, z: 0.99, color: '#f0c45a', mat: M.lacquer });   // the engraved line (镌成的一行字), no characters
    pillar.add(qb.build());
  }
  object.add(pillar);
  const aura = softPuffs(26, { color: '#ffb890', opacity: 0.32, additive: true });
  object.add(aura.points);
  const ripple = softPuffs(12, { color: '#ffffff', opacity: 0.7 });
  object.add(ripple.points);

  /* Wukong at its foot */
  const WS = 1.7;
  const wk = new THREE.Group();
  { const kb = new Builder(); monkeyKing(kb, { arms: [[Math.PI - 0.3, 0], [Math.PI / 2 + 0.2, -0.9]] }); wk.add(kb.build()); }
  wk.scale.setScalar(WS);
  wk.rotation.y = -0.5;
  // his right hand sits ~0.2 to his right and a little forward; place him so the hand meets the pillar
  const hand = new THREE.Vector3(0.2 * WS, 0, 0.12 * WS).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.5);
  const W = [P[0] - 0.9, P[2] + 0.55];   // where he stands; the pillar's axis slides from beside him into his hand
  wk.position.set(W[0], FLOOR, W[1]);
  const H = [W[0] + hand.x, W[1] + hand.z], dl = Math.hypot(hand.x, hand.z), DIR = [hand.x / dl, hand.z / dl];
  object.add(wk);

  /* fish shoals and kelp */
  const fb = new Builder(); fish(fb, { color: '#e2884a', fin: '#f2b874' });
  const fb2 = new Builder(); fish(fb2, { color: '#d8dcd6', fin: '#a8c4c8' });
  const NF = 54, NF2 = 40;
  const fishA = new THREE.InstancedMesh(fb.merged(), M.smooth, NF), fishB = new THREE.InstancedMesh(fb2.merged(), M.smooth, NF2);
  fishA.frustumCulled = fishB.frustumCulled = false;
  object.add(fishA, fishB);
  const fd = Array.from({ length: NF + NF2 }, (_, i) => ({ sh: i < NF ? i % 3 : 3 + (i % 2), dx: rng.gauss() * 0.4, dy: rng.gauss() * 0.22, dz: rng.gauss() * 0.4, ph: rng() * 0.5, s: 0.65 + rng() * 0.4 }));
  const shoals = [[6.4, 2.8, 0.11, 0], [5.2, 3.7, -0.09, 2], [7.4, 1.9, 0.07, 4], [4.6, 3.2, 0.13, 1], [6.8, 3.9, -0.06, 3]];
  const kb2 = new Builder();
  const kp = [];
  for (let k = 0; k <= 8; k++) kp.push([Math.sin(k * 0.9) * 0.14, k * 0.22, Math.cos(k * 0.7) * 0.1]);
  kb2.tube(kp, (t) => 0.035 * (1 - t * 0.7), { color: '#5f8a3a', mat: M.smooth, radial: 4, segs: 20 });
  for (let k = 1; k <= 8; k++) kb2.sphere(0.2, { x: kp[k][0] + 0.12 * (k % 2 ? 1 : -1), y: kp[k][1] - 0.02, z: kp[k][2], sx: 1.3, sy: 0.12, sz: 0.45, ry: k * 1.9, rz: (k % 2 ? -1 : 1) * 0.6, color: k % 2 ? '#6f9a3f' : '#4f7f3a', mat: M.smooth, ws: 6, hs: 4 });
  const kelpSpots = [];
  for (let k = 0; kelpSpots.length < 34 && k < 600; k++) {
    const [x, z] = rng.inDisc(9.6, 4.5);
    if (Math.hypot(x - P[0], z - P[2]) < 2.6 || (Math.abs(x) < 5 && z < 0 && z > -6.8)) continue;
    kelpSpots.push({ x, z, y: ground(x, z) - 0.1, s: 0.8 + rng() * 0.7, ph: rng() * 6, ry: rng() * 6 });
  }
  const kelp = new THREE.InstancedMesh(kb2.merged(), M.smooth, kelpSpots.length);
  kelp.castShadow = true;
  object.add(kelp);
  const BUB = 40;
  const bubbles = softPuffs(BUB, { color: '#e8f6fa', opacity: 0.8 });
  object.add(bubbles.points);
  const bd = Array.from({ length: BUB }, () => { const [x, z] = rng.inDisc(9); return { x, z, ph: rng(), sp: 0.08 + rng() * 0.08 }; });

  function update(t) {
    // pillar: tall → shrinks to a staff in his hand → grows back
    const u = (t % CYCLE) / CYCLE;
    const k = u < 0.3 ? 0 : u < 0.46 ? ease((u - 0.3) / 0.16) : u < 0.78 ? 1 : u < 0.94 ? 1 - ease((u - 0.78) / 0.16) : 0;
    const len = Math.exp(lerp(Math.log(TALL), Math.log(1.05 * WS), k));
    const rad = Math.exp(lerp(Math.log(PR), Math.log(0.016 * WS), k));
    const off = (rad + 0.12) * (1 - k);
    const px = H[0] + DIR[0] * off, pz = H[1] + DIR[1] * off;
    pillar.position.set(px, FLOOR - 0.02 + k * 0.05, pz);
    pillar.scale.set(rad, len, rad);
    for (let i = 0; i < 26; i++) {
      const p = (i / 26 + t * 0.02) % 1, a = i * 2.4 + t * 0.3;
      aura.set(i, px + Math.cos(a) * (rad + 0.3 + p * 0.8), FLOOR + 0.2 + p * Math.min(len, 5), pz + Math.sin(a) * (rad + 0.3 + p * 0.8), 0.6 + p * 1.6, Math.sin(Math.PI * p) * (1 - k * 0.8));
    }
    aura.commit();
    const above = smooth(SEA - 0.3, SEA + 0.6, FLOOR + len);
    for (let i = 0; i < 12; i++) {
      const p = (t * 0.25 + i / 12) % 1, a = i * 0.52;
      ripple.set(i, px + Math.cos(a) * (rad + p * 1.6), SEA + 0.03, pz + Math.sin(a) * (rad + p * 1.6), 0.3 + p * 0.5, above * (1 - p));
    }
    ripple.commit();
    // sea surface
    for (let i = 1, n = 1 + RINGS * SEGS; i < n; i++) {
      const x = sp[i * 3], z = sp[i * 3 + 2], d = Math.hypot(x - H[0], z - H[1]);
      sp[i * 3 + 1] = 0.05 * Math.sin(x * 0.9 + t * 0.9) * Math.cos(z * 0.8 - t * 0.7) + above * 0.06 * Math.sin(d * 3 - t * 3) * Math.exp(-d * 0.4);
    }
    sg.attributes.position.needsUpdate = true;
    sg.computeVertexNormals();
    // fish
    for (let i = 0; i < NF + NF2; i++) {
      const f = fd[i], [R, Y, w, ph0] = shoals[f.sh], a = t * w + ph0 + f.ph * Math.sign(w);
      const x = Math.cos(a) * R + f.dx, z = Math.sin(a) * R * 0.85 + f.dz, y = Y + f.dy + Math.sin(t * 0.7 + f.ph * 10) * 0.12;
      const ry = Math.atan2(-Math.sin(a) * Math.sign(w), Math.cos(a) * Math.sign(w) * 0.85);
      const m = i < NF ? fishA : fishB;
      setInst(m, i < NF ? i : i - NF, x, y, z, ry, f.s, 0, Math.sin(t * 6 + i) * 0.15);
    }
    fishA.instanceMatrix.needsUpdate = true; fishB.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < kelpSpots.length; i++) {
      const kk = kelpSpots[i];
      setInst(kelp, i, kk.x, kk.y, kk.z, kk.ry, kk.s, Math.sin(t * 0.8 + kk.ph) * 0.18, Math.cos(t * 0.6 + kk.ph) * 0.18);
    }
    kelp.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < BUB; i++) {
      const d = bd[i], p = (t * d.sp + d.ph) % 1;
      bubbles.set(i, d.x + Math.sin(t + i) * 0.1, 0.4 + p * (SEA - 0.4), d.z, 0.06 + p * 0.06, smooth(0, 0.1, p) * (1 - smooth(0.9, 1, p)));
    }
    bubbles.commit();
  }
  update(0);
  return { object, update };
}
