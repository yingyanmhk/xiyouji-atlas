// 真假美猴王 (ch.56–58) — a deliberately symmetrical diorama. Two identical Monkey Kings fight on
// clouds above the bronze demon-revealing mirror (照妖镜, which could not tell them apart), their
// staffs crossed on the centre line. In front, the listening beast 谛听 lies on its plinth with one
// ear raised — it knows which is which but will not say. At the back the Buddha sits in his halo:
// only he can name the six-eared macaque. Loop 24 s: they clash, circle each other and swap
// places, twice — at no moment can you tell them apart.
import { THREE, Builder, M, C, terrain, peak, pine, pavilion, cloud, figure, staff, qinglv, fbm, smooth, ease, clamp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { stonePal } from './_d_util.js';

const CYCLE = 24;
const DAIS_Y = 0.95;

function ground(x, z) {
  const r = Math.hypot(x, z * 1.05);
  const ax = Math.abs(x);                      // mirror symmetric in x
  let h = 0.25;
  h += smooth(3.6, 3.3, r) * 0.35 + smooth(2.4, 2.1, r) * 0.35;                    // two round terraces
  const back = smooth(-1.5, -5.5, z);
  h += back * (1.2 + 1.6 * fbm(ax * 0.35 + 3, z * 0.35 + 1, 3)) * smooth(10.4, 6.5, Math.hypot(x, z));
  h += smooth(5, 9, ax) * smooth(2, -3, z) * 0.9 * fbm(ax * 0.5, z * 0.5);
  return Math.max(0.1, h * smooth(10.6, 9.7, Math.hypot(x, z)) + 0.1);
}

/** the Monkey King in a fighting stance, staff gripped two-handed and thrust up toward the foe */
function fighter(b) {
  figure(b, 'wukong', { pose: 'none' });
  const d = new THREE.Vector3(0, 0.62, 1).normalize();
  const hand = new THREE.Vector3(0.02, 0.43, 0.2);
  const ctr = hand.clone().addScaledVector(d, 0.45);
  staff(b, { x: ctr.x + 0.03, y: ctr.y, z: ctr.z, rx: Math.atan2(d.z, d.y), len: 1.75, r: 0.017 });
  const h1 = hand.clone(), h2 = hand.clone().addScaledVector(d, 0.2);
  for (const [sx, h] of [[-1, h1], [1, h2]]) {
    b.tube([[sx * 0.09, 0.44, 0], [sx * 0.07, 0.38, 0.1], [h.x + sx * 0.01, h.y, h.z]], 0.024, { color: C.fur, mat: M.smooth, radial: 5, segs: 6 });
    b.sphere(0.03, { x: h.x + sx * 0.012, y: h.y, z: h.z, color: '#e7a98a', mat: M.smooth, ws: 6, hs: 5 });
  }
  // a cape-like sash streaming back
  b.tube([[0, 0.32, -0.08], [0.05, 0.28, -0.25], [-0.04, 0.2, -0.42]], (t) => 0.035 * (1 - t * 0.6), { color: C.cinnabar, mat: M.cloth, radial: 4, segs: 8 });
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pal = stonePal(5, { cliff: [[0, '#6f8a86'], [0.3, '#56807d'], [0.7, '#3f6a6e'], [1, '#2c5562']], ledge: [[0, '#a9b98f'], [0.4, '#7fae8a'], [1, '#3f8a68']], ledgeAt: 0.7 });
  const pave = new THREE.Color('#d9d6c6'), paveD = new THREE.Color('#bdbcae');
  terrain(b, { R: 10.5, rings: 48, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    const r = Math.hypot(x, z * 1.05);
    if (r < 3.75 && ny > 0.9) return r < 2.25 ? pave : paveD;
    if (Math.abs(x) < 0.75 && z > 3 && z < 9.8 && ny > 0.85) return pave;                  // the axis path
    return pal(x, y, z, nx, ny, nz);
  } });

  /* back: two mirrored needle peaks and two lower ones */
  for (const sx of [-1, 1]) {
    for (const [x, z, r, h] of [[6.4, -4.2, 1.35, 10.5], [4.3, -6.8, 1.1, 8], [8.0, -0.8, 0.8, 4.6]]) {
      const y = ground(x, z) - 0.3;
      peak(b, { x: sx * x, y, z, r, h, lean: 0.1, leanDir: sx > 0 ? 0.3 : Math.PI - 0.3, rand: rng, taper: 0.72, palette: qinglv(h, { base: y }) });
    }
    for (const [x, z, h] of [[3.9, 3.2, 2.2], [5.4, 1.6, 2.6], [2.6, 7.4, 1.6]]) pine(b, { x: sx * x, y: ground(x, z) - 0.05, z, h, r: rng, lean: 0.2 });
    // stone lanterns along the axis
    for (const z of [4.4, 8.2]) {
      const x = sx * 1.25, y = ground(x, z);
      b.box(0.36, 0.12, 0.36, { x, y, z, color: C.ivory });
      b.cyl(0.07, 0.09, 0.55, { x, y: y + 0.12, z, color: C.ivory, seg: 8 });
      b.box(0.3, 0.24, 0.3, { x, y: y + 0.67, z, color: C.ivory });
      b.box(0.16, 0.14, 0.31, { x, y: y + 0.72, z, color: C.lamp, mat: M.glow, glow: 1.3 });
      b.cone(0.28, 0.2, { x, y: y + 0.91, z, color: C.ivory, seg: 4, ry: Math.PI / 4 });
    }
  }

  /* centre: the bronze mirror on its pedestal */
  b.cyl(1.4, 1.65, 0.3, { y: DAIS_Y - 0.05, color: '#ddd8c6', mat: M.stone, seg: 40 });
  b.cyl(1.32, 1.32, 0.08, { y: DAIS_Y + 0.25, color: '#a8874a', mat: M.smooth, seg: 48 });
  b.cyl(1.12, 1.12, 0.02, { y: DAIS_Y + 0.33, color: '#efe2b4', mat: M.porcelain, seg: 48 });
  b.torus(1.32, 0.05, { y: DAIS_Y + 0.31, rx: Math.PI / 2, color: '#8a6a32', mat: M.metal, ts: 48 });
  b.sphere(0.12, { y: DAIS_Y + 0.35, sy: 0.5, color: '#8a6a32', mat: M.metal });

  /* front: the listening beast 谛听 on its plinth */
  const DT = [0, 0, 5.9];
  DT[1] = ground(0, DT[2]);
  b.box(2.2, 0.55, 1.3, { x: 0, y: DT[1], z: DT[2], color: '#cfcbb9', mat: M.stone });
  b.box(2.4, 0.12, 1.5, { x: 0, y: DT[1] + 0.55, z: DT[2], color: '#e6e2d2', mat: M.stone });
  b.box(2.0, 0.24, 0.02, { x: 0, y: DT[1] + 0.18, z: DT[2] + 0.66, color: '#3f6a6e', mat: M.smooth });
  const beastY = DT[1] + 0.67;
  const beast = new THREE.Group();
  const head = new THREE.Group();
  const ear = new THREE.Group();
  {
    const bb = new Builder(), fur = '#efe9dc', mane = '#3c7d78';
    bb.sphere(0.42, { y: 0.28, z: -0.15, sx: 0.85, sy: 0.6, sz: 1.35, color: fur, mat: M.smooth });       // body lying
    bb.sphere(0.3, { x: 0.18, y: 0.22, z: -0.6, sx: 0.9, sy: 0.75, color: fur, mat: M.smooth });         // haunch
    for (const sx of [-1, 1]) bb.cyl(0.07, 0.08, 0.5, { x: sx * 0.2, y: 0.08, z: 0.35, rx: Math.PI / 2, color: fur, mat: M.smooth, seg: 7 });   // forepaws
    for (const sx of [-1, 1]) bb.sphere(0.09, { x: sx * 0.2, y: 0.08, z: 0.62, sy: 0.6, color: fur, mat: M.smooth });
    for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; bb.ico(0.11, { x: Math.cos(a) * 0.3, y: 0.42 + Math.sin(a) * 0.18, z: 0.2, color: mane, mat: M.flat, detail: 0 }); }   // curly mane
    bb.tube([[0, 0.3, -0.9], [0.35, 0.25, -1.05], [0.5, 0.45, -0.85], [0.4, 0.6, -0.7]], (t) => 0.05 + 0.04 * t, { color: fur, mat: M.smooth, radial: 5 });
    for (let i = 0; i < 4; i++) bb.ico(0.09, { x: 0.38 + i * 0.02, y: 0.58 + i * 0.03, z: -0.72 + i * 0.03, color: mane, mat: M.flat, detail: 0 });
    for (let i = 0; i < 5; i++) bb.sphere(0.05, { x: -0.25 + i * 0.12, y: 0.42 + (i % 2) * 0.05, z: -0.3 - i * 0.08, color: '#4a8a84', mat: M.smooth, ws: 6, hs: 4 });   // spots
    beast.add(bb.build());
    const hb = new Builder();
    hb.sphere(0.22, { sz: 1.1, color: fur, mat: M.smooth });
    hb.cyl(0.1, 0.13, 0.2, { y: -0.04, z: 0.16, rx: Math.PI / 2, color: fur, mat: M.smooth, seg: 9 });   // muzzle
    hb.sphere(0.04, { y: 0.0, z: 0.37, color: C.ink, mat: M.lacquer });
    for (const sx of [-1, 1]) hb.sphere(0.03, { x: sx * 0.1, y: 0.07, z: 0.17, color: '#1c2a2a', mat: M.lacquer });
    hb.cone(0.045, 0.28, { y: 0.17, z: 0.02, rx: -0.35, color: '#c9a24a', mat: M.metal, seg: 6 });          // single horn
    for (let i = 0; i < 6; i++) { const a = (i / 5) * Math.PI; hb.ico(0.09, { x: Math.cos(a) * 0.2, y: Math.sin(a) * 0.14, z: -0.14, color: mane, mat: M.flat, detail: 0 }); }
    hb.sphere(0.09, { x: -0.18, y: 0.05, z: -0.03, sx: 0.4, sz: 1.3, ry: 0.4, rz: 1.1, color: '#e4d8c8', mat: M.smooth });   // the lowered ear
    head.add(hb.build());
    const eb = new Builder();
    eb.sphere(0.11, { y: 0.17, sx: 0.4, sy: 1.6, sz: 0.8, color: '#e4d8c8', mat: M.smooth });
    eb.sphere(0.07, { y: 0.17, z: 0.03, sx: 0.25, sy: 1.3, sz: 0.5, color: '#d99a8a', mat: M.smooth });
    ear.add(eb.build());
    ear.position.set(0.15, 0.12, -0.03);
    ear.rotation.z = -0.25;
    head.add(ear);
    head.position.set(0, 0.72, 0.36);
    beast.add(head);
  }
  beast.position.set(0, beastY, DT[2] - 0.05);
  beast.scale.setScalar(1.7);
  object.add(beast);

  /* back: the Buddha in his halo on a lotus, high on a stone altar */
  const BZ = -6.6;
  const BY = peak(b, { x: 0, y: ground(0, BZ) - 0.3, z: BZ, r: 2.0, h: 4.4, lean: 0, taper: 0.25, flatTop: 1, steps: 2, seg: 14, rand: rng, palette: pal })[1];
  {
    b.cyl(1.25, 1.45, 0.35, { y: BY - 0.05, z: BZ, color: '#e3dfd0', seg: 8 });
    const LY = BY + 0.3;
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + ring * 0.22, rr = 0.9 - ring * 0.22;
      b.sphere(0.3 - ring * 0.06, { x: Math.cos(a) * rr, y: LY + 0.18 + ring * 0.16, z: BZ + Math.sin(a) * rr, sx: 0.55, sy: 0.4, sz: 1.0, ry: -a + Math.PI / 2, rx: 0.5, color: ring ? '#f3e3d8' : '#e7b9aa', mat: M.smooth, ws: 8, hs: 6 });
    }
    const g = '#d8b26a', robe = '#b8483a', robe2 = '#d9a24a';
    b.push({ y: LY + 0.3, z: BZ, s: 1.45 });
    b.sphere(0.6, { y: 0.18, sx: 1.2, sy: 0.36, sz: 0.8, color: robe, mat: M.cloth });            // crossed legs
    b.lathe([[0.4, 0.2], [0.42, 0.45], [0.3, 0.85], [0.17, 1.03], [0, 1.06]], { color: robe, mat: M.cloth, seg: 16 });
    b.box(0.08, 0.7, 0.06, { x: 0.12, y: 0.4, z: 0.3, rz: 0.45, color: robe2, mat: M.cloth });   // kasaya band
    b.sphere(0.19, { y: 1.24, color: g, mat: M.smooth });
    b.sphere(0.1, { y: 1.43, color: '#2f3550', mat: M.smooth });                                  // ushnisha
    for (const sx of [-1, 1]) b.sphere(0.05, { x: sx * 0.19, y: 1.18, sy: 1.9, color: g, mat: M.smooth, ws: 6, hs: 5 });
    b.sphere(0.12, { y: 0.42, z: 0.4, sy: 0.5, color: g, mat: M.smooth });                         // hands in dhyana
    b.pop();
    // halo + mandorla: gold rings, a pale disc, flame tips
    const HY = LY + 2.1;
    b.torus(0.62, 0.035, { y: HY, z: BZ - 0.35, color: C.gold, mat: M.metal, ts: 40 });
    b.torus(2.35, 0.06, { y: HY - 0.75, z: BZ - 0.55, color: C.gold, mat: M.metal, ts: 72 });
    b.torus(2.05, 0.03, { y: HY - 0.75, z: BZ - 0.57, color: '#b7853a', mat: M.metal, ts: 72 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      if (Math.sin(a) < -0.45) continue;
      b.cone(0.1, 0.32, { x: Math.cos(a) * 2.5, y: HY - 0.75 + Math.sin(a) * 2.5, z: BZ - 0.55, rz: a - Math.PI / 2, color: '#d8b060', mat: M.smooth, seg: 4 });
    }
    var DISC = [HY - 0.75, BZ - 0.62];
  }
  /* white-jade balustrades round the terraces, mirrored pavilions */
  for (const [rr, n] of [[3.62, 36], [2.18, 22]]) for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (Math.abs(Math.cos(a)) < 0.2 && Math.sin(a) > 0) continue;             // gap on the axis
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr / 1.05;
    b.cyl(0.04, 0.05, 0.32, { x, y: ground(x * 0.97, z * 0.97) - 0.02, z, color: C.ivory, seg: 5 });
    const a2 = ((i + 1) / n) * Math.PI * 2;
    if (Math.abs(Math.cos(a2)) < 0.2 && Math.sin(a2) > 0) continue;
    const x2 = Math.cos(a2) * rr, z2 = Math.sin(a2) * rr / 1.05;
    b.tube([[x, ground(x * 0.97, z * 0.97) + 0.26, z], [x2, ground(x2 * 0.97, z2 * 0.97) + 0.26, z2]], 0.025, { color: C.ivory, mat: M.stone, radial: 4, segs: 2 });
  }
  for (const sx of [-1, 1]) pavilion(b, { x: sx * 5.6, y: ground(5.6, 3.6) - 0.05, z: 3.6, w: 1.3, h: 1.1, ry: sx * 0.5, roofColor: '#2f6a6a' });
  object.add(b.build());
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.05, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe3a6'), transparent: true, opacity: 0.22, depthWrite: false }));
  disc.position.set(0, DISC[0], DISC[1]);
  object.add(disc);

  /* the two kings on their clouds */
  const fb = new Builder();
  fighter(fb);
  const fGeo = fb.build();
  const kings = [];
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    const cb = new Builder();
    cloud(cb, { s: 0.65, y: -0.12, rand: rng, puffs: 6, ry: Math.PI / 2 });
    g.add(cb.build({ shadows: false }));
    const k = fGeo.clone();
    k.scale.setScalar(2.5);
    g.add(k);
    object.add(g);
    kings.push(g);
  }

  /* drifting mist low on the terraces + motes in the halo */
  const MIST = 40;
  const mist = softPuffs(MIST, { color: '#eef2ee', opacity: 0.4 });
  object.add(mist.points);
  const md = Array.from({ length: MIST }, (_, i) => ({ a: rng() * Math.PI * 2, d: 4 + rng() * 4.5, y: 0.4 + rng() * 1.2, s: 1.4 + rng() * 2, ph: rng() * 10, sx: i % 2 ? 1 : -1 }));

  const R = 1.6, H = 3.5;
  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(mist, nk);
    mist.mat.uniforms.uOpacity.value = 0.4 * (1 - 0.35 * nk);
    const u = (t % CYCLE) / CYCLE;
    // two half-turns per cycle; between them the kings clash on the axis
    const turn = (a, bnd) => ease(clamp((u - a) / (bnd - a)));
    const th = Math.PI * (turn(0.32, 0.5) + turn(0.82, 1.0));
    const clash = Math.max(0, Math.sin(t * 5.2)) ** 6 * (1 - smooth(0.3, 0.33, u) * (1 - smooth(0.5, 0.53, u))) * (1 - smooth(0.8, 0.83, u));
    for (let i = 0; i < 2; i++) {
      const a = th + i * Math.PI;
      const g = kings[i];
      const r = R - 0.12 * clash + 0.4 * Math.sin(Math.PI * ((th / Math.PI) % 1));
      const lift = (i ? 1 : -1) * 0.5 * Math.sin(2 * th);       // they loop over and under each other
      g.position.set(-Math.cos(a) * r, DAIS_Y + H + lift + 0.08 * Math.sin(t * 1.3), Math.sin(a) * r);
      g.rotation.set(0, Math.PI / 2 - a, 0);
      g.children[1].rotation.x = -0.12 * clash;
    }
    // 谛听 turns its head from one king to the other, its ear pricked
    head.rotation.y = 0.32 * Math.sin(t * 0.55);
    head.rotation.x = -0.15 + 0.05 * Math.sin(t * 0.8);
    ear.rotation.z = -0.25 + 0.12 * Math.max(0, Math.sin(t * 2.1)) ** 8;
    disc.material.opacity = 0.2 + 0.04 * Math.sin(t * 0.6);
    for (let i = 0; i < MIST; i++) {
      const m = md[i], a = m.a + t * 0.012 * m.sx;
      mist.set(i, Math.cos(a) * m.d, m.y + 0.15 * Math.sin(t * 0.3 + m.ph), Math.sin(a) * m.d, m.s, 0.6 + 0.3 * Math.sin(t * 0.25 + m.ph));
    }
    mist.commit();
  }
  update(0);
  return { object, update };
}
