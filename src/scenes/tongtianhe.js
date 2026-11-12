// 通天河 — the river eight hundred li wide, frozen overnight by the demon's snow. On the near bank
// the lamps of Chen Village and the demon's temple; the stele with its ten characters stands on a
// stone tortoise. The pilgrims walk out onto the ice heading west, toward a black crack; beneath
// the ice a great golden carp — the Great King of Miracles, once a goldfish in Guanyin's pond —
// circles slowly under them. Snow falls.
import { THREE, Builder, M, C, terrain, peak, pine, bareTree, house, hall, stele, rock, figure, horse, snowRock, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs, Lines } from '../kit.js';
import { nightTint } from './_e_kit.js';

const ICE = 0.9;
const riverZ = (x) => 0.2 + 0.35 * Math.sin(x * 0.28 + 0.5);

function ground(x, z) {
  const rim = smooth(9.4, 10.5, Math.hypot(x, z));       // slope down to the basin rim
  return lerp(ground0(x, z), Math.min(ICE - 0.1, ground0(x, z)), rim);
}
function ground0(x, z) {
  const d = z - riverZ(x);
  const n = fbm(x * 0.35 + 2, z * 0.35, 4);
  if (d > 0) {                                           // near (east) bank
    return lerp(0.12, 1.1 + 0.25 * n, smooth(3.2, 4.0, d)) + smooth(5, 9, d) * 0.25;
  }
  const back = -d;                                        // far (west) bank rising into hills
  return lerp(0.12, 1.3 + 0.5 * n, smooth(3.4, 4.6, back)) + Math.max(0, back - 4.6) * (0.6 + 0.8 * n) * smooth(10.6, 7, Math.hypot(x, z) * 0.9 + 1.5);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const snow = snowRock(6, { snowline: 0.42 });
  const bed = new THREE.Color('#203f4c');
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < ICE - 0.02 ? bed : snow(x, y, z, nx, ny, nz)) });

  // far bank: dark snowy peaks (雪景寒林)
  for (const [x, z, r, h] of [[-4.2, -6.6, 1.5, 7.5], [-1.2, -7.6, 1.8, 9.5], [2.3, -7.2, 1.4, 7], [5.2, -5.8, 1.2, 5.6], [-6.6, -4.4, 1.0, 4.4]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean: 0.08, rand: rng, taper: 0.7, palette: snowRock(h, { base: y, snowline: 0.32 }) });
  }
  // far bank: snowy pines on the hills
  for (let i = 0, k = 0; i < 16 && k < 400; k++) {
    const x = rng.range(-9, 9), z = rng.range(-9.5, -4.6);
    if (Math.hypot(x, z) > 9.8) continue;
    const y = ground(x, z);
    pine(b, { x, y: y - 0.05, z, h: 1.4 + rng() * 1.2, r: rng, snow: true, lean: 0.15 }); i++;
  }
  for (let i = 0; i < 6; i++) {
    const x = rng.range(-8, 8), z = rng.range(-9, -6.5);
    if (Math.hypot(x, z) > 9.6) continue;
    rock(b, { x, y: ground(x, z) - 0.2, z, r: 0.6 + rng() * 0.6, h: 1 + rng(), rand: rng, palette: snowRock(2, { base: ground(x, z) }) });
  }

  // near bank: Chen Village, the demon's temple, snowy trees
  const village = [[4.8, 6.4, -0.3], [6.6, 5.3, -0.7], [3.2, 7.8, 0.15], [5.8, 7.9, -0.2], [7.8, 6.9, -1.0]];
  for (const [x, z, ry] of village) house(b, { x, y: ground(x, z) - 0.05, z, ry, w: 1.5 + rng() * 0.5, d: 1.05, h: 0.8, snow: true, lit: 0.8, r: rng });
  hall(b, { x: 1.9, y: ground(1.9, 6.0) - 0.05, z: 6.0, ry: -0.15, w: 2.4, d: 1.7, h: 1.1, wall: C.wallRed, roofColor: C.snow, lit: 0.7, r: rng, beam: '#3b5f6e' });
  for (let i = 0; i < 7; i++) {
    const x = rng.range(0, 8.5), z = rng.range(4.4, 8.8);
    if (Math.hypot(x, z) > 9.6 || village.some(([vx, vz]) => Math.hypot(vx - x, vz - z) < 1.3) || Math.hypot(x - 1.9, z - 6.0) < 1.8) continue;
    bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.2 + rng() * 0.8, r: rng, snow: true, color: '#3a2c24' });
  }
  // the stele: 径过八百里，亘古少人行
  stele(b, { x: -5.2, y: ground(-5.2, 5.0) - 0.05, z: 5.0, ry: 0.35, h: 1.5, w: 0.7, color: '#6b6e70', turtle: false });   // the text mentions only a stone stele

  // the open crack ahead of the pilgrims: black water and tilted shards
  const HOLE = [-0.2, -0.9];
  {
    const sh = new THREE.Shape();
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = (0.55 + 0.35 * noise2(i * 0.9, 3)) * (i % 2 ? 1 : 0.8);
      const px = Math.cos(a) * r * 1.6, pz = Math.sin(a) * r;
      i === 0 ? sh.moveTo(px, pz) : sh.lineTo(px, pz);
    }
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
    b.geo(g, { x: HOLE[0], y: ICE + 0.012, z: HOLE[1], ry: 0.3, color: '#0d2430', mat: M.smooth });
    for (let i = 0; i < 9; i++) {
      const a = rng() * Math.PI * 2, r = 0.9 + rng() * 0.5;
      b.box(0.3 + rng() * 0.35, 0.05, 0.22 + rng() * 0.2, { x: HOLE[0] + Math.cos(a) * r * 1.3, y: ICE, z: HOLE[1] + Math.sin(a) * r * 0.8, ry: a, rx: (rng() - 0.5) * 0.6, rz: (rng() - 0.5) * 0.6, color: '#e9f3f7', mat: M.smooth });
    }
  }
  // drifts of snow lying on the ice
  for (let i = 0; i < 22; i++) {
    const x = rng.range(-9, 9), z = riverZ(x) + rng.range(-3, 2.6);
    if (Math.hypot(x, z) > 10 || Math.hypot(x - HOLE[0], z - HOLE[1]) < 1.8) continue;
    b.sphere(0.5 + rng() * 0.9, { x, y: ICE - 0.02, z, sx: 1.6, sy: 0.04, sz: 0.6, ry: rng() * 0.6 - 0.3, color: '#f2f6f8', mat: M.snow, ws: 10, hs: 4 });
  }
  object.add(b.build());

  /* ice sheet + cracks */
  const ice = new THREE.Mesh(new THREE.CircleGeometry(10.95, 72), new THREE.MeshStandardMaterial({ color: '#cfe4ee', roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.5 }));
  ice.rotation.x = -Math.PI / 2; ice.position.y = ICE; ice.receiveShadow = true;
  object.add(ice);
  const cracks = new Lines();
  const crack = (x, z, a, n, depth) => {
    const pts = [[x, ICE + 0.006, z]];
    for (let k = 0; k < n; k++) {
      const L = 0.3 + rng() * 0.5;
      x += Math.cos(a) * L; z += Math.sin(a) * L; a += (rng() - 0.5) * 0.9;
      pts.push([x, ICE + 0.006, z]);
      if (depth > 0 && rng() < 0.3) crack(x, z, a + (rng() < 0.5 ? 1 : -1) * 0.9, Math.floor(n / 2), depth - 1);
    }
    cracks.add(pts, '#5f7f8f');
  };
  for (let i = 0; i < 10; i++) crack(HOLE[0], HOLE[1], (i / 10) * Math.PI * 2 + rng() * 0.4, 6 + Math.floor(rng() * 6), 2);
  for (let i = 0; i < 8; i++) { const x = rng.range(-8, 8); crack(x, riverZ(x) + rng.range(-2.5, 2), rng() * 6.28, 5, 1); }
  object.add(cracks.build({ opacity: 0.8 }));

  /* the golden carp beneath the ice */
  const fish = new THREE.Group();
  {
    const fb = new Builder();
    fb.sphere(0.5, { sx: 0.55, sy: 0.6, sz: 1.6, color: '#e39a3a', mat: M.smooth });
    fb.sphere(0.32, { z: 0.7, sx: 0.65, sy: 0.7, color: '#eaa74a', mat: M.smooth });
    for (const sx of [-1, 1]) fb.sphere(0.45, { z: -0.95, x: sx * 0.12, sx: 0.08, sy: 0.55, sz: 0.9, ry: sx * 0.35, color: '#f4bd62', mat: M.smooth });  // forked tail
    fb.sphere(0.3, { y: 0.28, z: -0.1, sx: 0.06, sy: 0.6, sz: 1.1, color: '#f0b058', mat: M.smooth });                                     // dorsal fin
    const g = fb.build({ shadows: false });
    const fm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: '#d4741e', emissiveIntensity: 0.7 });
    g.traverse((o) => { if (o.isMesh) o.material = fm; });
    fish.add(g);
  }
  fish.scale.setScalar(1.2);
  object.add(fish);

  /* the pilgrims, walking west across the ice */
  const party = new THREE.Group();
  const members = [];
  {
    const mk = (fn) => { const pb = new Builder(); fn(pb); const g = pb.build(); party.add(g); members.push(g); return g; };
    mk((pb) => figure(pb, 'wukong', { pose: 'staff', s: 1.25 }));
    mk((pb) => horse(pb, { rider: 'monk', s: 1.2 }));
    mk((pb) => figure(pb, 'bajie', { s: 1.25 }));
    mk((pb) => figure(pb, 'sha', { s: 1.25 }));
  }
  object.add(party);
  const PATH0 = [-3.6, 5.6], PATH1 = [-0.7, 0.2];

  /* falling snow and chimney smoke */
  const FLAKES = 420;
  const flakes = softPuffs(FLAKES, { color: '#ffffff', opacity: 0.95 });
  object.add(flakes.points);
  const fd = Array.from({ length: FLAKES }, () => { const [x, z] = rng.inDisc(10.4); return { x, z, ph: rng(), sp: 0.05 + rng() * 0.04, s: 0.07 + rng() * 0.08 }; });
  const SMK = 30;
  const smoke = softPuffs(SMK, { color: '#d9dde0', opacity: 0.5 });
  object.add(smoke.points);

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(smoke, nk);
    nightTint(flakes, nk, 0.5);
    // carp circles under the procession
    const a = t * 0.12;
    fish.position.set(-0.8 + Math.cos(a) * 2.6, ICE - 0.5, 0.2 + Math.sin(a) * 1.3);
    fish.rotation.y = -a + Math.PI;
    fish.rotation.z = Math.sin(t * 1.4) * 0.08;
    // the party walks a 40 s loop, fading in/out at the ends
    const p = (t / 40) % 1, fadeK = smooth(0, 0.04, p) * (1 - smooth(0.94, 1, p));
    members.forEach((g, i) => {
      const q = clamp(p * 1.2 - i * 0.13);
      const x = lerp(PATH0[0], PATH1[0], q), z = lerp(PATH0[1], PATH1[1], q);
      const side = i === 1 ? 0 : (i % 2 ? 0.15 : -0.15);
      g.position.set(x + side, Math.max(ICE, ground(x, z)) + Math.abs(Math.sin(t * 3.2 + i)) * 0.03, z);
      g.rotation.y = Math.atan2(PATH1[0] - PATH0[0], PATH1[1] - PATH0[1]);
      g.scale.setScalar(Math.max(0.001, fadeK));
    });
    for (let i = 0; i < FLAKES; i++) {
      const f = fd[i], y = 14 - ((t * f.sp + f.ph) % 1) * 14;
      flakes.set(i, f.x + Math.sin(t * 0.5 + f.ph * 9) * 0.3, y, f.z, f.s, smooth(0, 0.6, y));
    }
    flakes.commit();
    for (let i = 0; i < SMK; i++) {
      const h = village[i % village.length], pp = (t * 0.08 + i / SMK) % 1;
      smoke.set(i, h[0] + pp * 0.8, ground(h[0], h[1]) + 1.5 + pp * 3, h[1] - 0.1, 0.4 + pp * 1.2, Math.sin(Math.PI * pp));
    }
    smoke.commit();
  }
  update(0);
  return { object, update };
}
