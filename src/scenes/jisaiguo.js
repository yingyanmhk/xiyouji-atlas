// 祭赛国·金光寺 (ch.62–63) — night. The thirteen-storey pagoda of Golden Light Temple has lost its
// glow since the relic was stolen; the monks, blamed for the theft, kneel in cangues and chains at
// its foot. Tang Seng sweeps the lowest storey; Wukong carries the lamp and broom up, storey by
// storey. Loop 40 s: the single warm light climbs level by level; at the thirteenth (where two
// fish demons sit drinking) the relic's light returns and the whole pagoda glows, then dims.
import { THREE, Builder, M, C, terrain, pagoda, hall, house, roof, pine, figure, fbm, smooth, clamp, setInst, softPuffs } from '../kit.js';
import { stonePal, plainMonk, pulse } from './_d_util.js';

const CYCLE = 40;
const LEVELS = 13, PW = 2.3, PH = 0.85, SHR = 0.045;
const PER = 2.5;                   // seconds per storey
const CLIMB = LEVELS * PER;        // 32.5

// replicate the kit pagoda's storey layout so the lamp can find each gallery
const LV = [];
{
  let yy = 0.3;
  for (let i = 0; i < LEVELS; i++) {
    const wi = PW * (1 - i * SHR), hi = PH * (i === 0 ? 1.5 : 1) * (1 - i * 0.03);
    LV.push({ y: yy, w: wi, h: hi });
    yy += hi + wi * 0.36 * Math.pow(0.4, 1.7);
  }
}

function ground(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.18;
  h += smooth(6.8, 9.6, r) * (0.25 + 0.8 * fbm(x * 0.3 + 4, z * 0.3, 3)) * smooth(10.5, 9.6, r);
  return h;
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const ind = '#262c48', indL = '#3a4268';
  const pal = stonePal(2, { cliff: [[0, '#323a5a'], [1, '#48527a']], ledge: [[0, '#3a4a5c'], [1, '#3e5a5e']], ledgeAt: 0.7 });
  const pave = new THREE.Color('#4a5070'), paveD = new THREE.Color('#3c4260');
  terrain(b, { R: 10.5, rings: 40, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => {
    if (Math.abs(x) < 6.2 && Math.abs(z) < 6.2 && ny > 0.95) return (Math.floor(x * 1.2) + Math.floor(z * 1.2)) % 2 ? pave : paveD;
    return pal(x, y, z, nx, ny, nz);
  } });

  /* the pagoda, dark: indigo walls, ink roofs */
  const PZ = -0.6;
  const top = pagoda(b, { x: 0, y: 0.18, z: PZ, levels: LEVELS, w: PW, h: PH, shrink: SHR, wall: '#6c7190', roofColor: '#232838', lit: 0 });
  b.box(PW * 1.9, 0.12, PW * 1.9, { y: 0.06, z: PZ, color: '#555a78' });
  b.box(PW * 1.53, 0.33, PW * 1.53, { y: 0.18, z: PZ, color: '#62667f' });

  /* compound wall with a gate, side halls, a back hall */
  const W = 6.2;
  for (const [x, z, ry, len] of [[0, -W, 0, 2 * W], [-W, 0, Math.PI / 2, 2 * W], [W, 0, Math.PI / 2, 2 * W], [-3.8, W, 0, 4.8], [3.8, W, 0, 4.8]]) {
    b.box(len, 0.9, 0.3, { x, y: 0.12, z, ry, color: '#5a3a3a' });
    b.box(len + 0.2, 0.08, 0.5, { x, y: 1.02, z, ry, color: '#20242f' });
  }
  // gate
  b.box(2.8, 1.4, 0.6, { x: 0, y: 0.12, z: W, color: '#5a3a3a' });
  b.box(1.0, 1.0, 0.62, { x: 0, y: 0.12, z: W, color: '#14161f' });
  roof(b, { x: 0, y: 1.52, z: W, w: 2.9, d: 0.8, h: 0.45, color: '#232838' });
  for (const sx of [-1, 1]) hall(b, { x: sx * 4.3, y: 0.18, z: 0.4, ry: -sx * Math.PI / 2, w: 3.2, d: 1.8, h: 1.1, wall: '#4a3a46', pillar: '#6a3030', beam: '#2e3a52', roofColor: '#232838', lit: 0.25, r: rng, steps: true });
  hall(b, { x: 0, y: 0.18, z: -4.6, w: 4.2, d: 1.9, h: 1.3, tiers: 2, wall: '#4a3a46', pillar: '#6a3030', beam: '#2e3a52', roofColor: '#232838', lit: 0.2, r: rng });
  // the sleeping city of Jisai around the temple
  for (let i = 0, k = 0; i < 14 && k < 300; k++) {
    const a = rng() * Math.PI * 2, d = 7.6 + rng() * 1.6, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 5.5 && Math.abs(x) < 3.5) continue;
    house(b, { x, y: ground(x, z) - 0.05, z, ry: -a + Math.PI / 2 + (rng() - 0.5) * 0.3, w: 1.3 + rng() * 0.5, d: 0.9, h: 0.7, wall: '#4c4e66', roofColor: '#20242f', lit: 0.25, r: rng });
    i++;
  }
  // dark pines in the corners
  for (const [x, z] of [[-5.1, -5.2], [5.2, -5.0], [-5.3, 4.8], [5.0, 5.3], [-8.0, 2.0], [7.8, -2.6], [-2.8, 8.2], [3.4, 8.4]]) pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.6 + rng() * 0.9, r: rng, lean: 0.25, color: '#24413a' });

  /* at the foot: Tang Seng with a broom; the monks in cangues kneeling around him */
  const TS = [0.9, 0.18, PZ + PW * 0.95 + 0.7];
  figure(b, 'monk', { x: TS[0], y: TS[1], z: TS[2], ry: 2.6, pose: 'none', s: 1.25 });
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.18 + i * 0.11), r = 2.9 + (i % 2) * 0.5;
    plainMonk(b, { x: Math.cos(a) * r, y: 0.18, z: PZ + Math.sin(a) * r, ry: Math.atan2(-Math.cos(a), -Math.sin(a)), kneel: true, cangue: true, s: 1.1, robe: i % 3 ? '#5f5446' : '#6e5a3c' });
  }
  // two fish demons drinking on the thirteenth storey
  {
    const L = LV[LEVELS - 1], y = 0.18 + L.y, z = PZ + L.w / 2 + 0.22;
    for (const sx of [-1, 1]) {
      b.push({ x: sx * 0.32, y, z, ry: -sx * 0.6, s: 0.8 });
      b.lathe([[0, 0], [0.13, 0], [0.11, 0.2], [0.07, 0.3], [0, 0.3]], { color: sx > 0 ? '#2e4a48' : '#3a3a28', mat: M.cloth, seg: 8 });
      b.sphere(0.1, { y: 0.38, sz: 1.5, color: sx > 0 ? '#3e5e5a' : '#5a5236', mat: M.smooth, ws: 8, hs: 6 });     // fish heads
      b.cone(0.07, 0.12, { y: 0.38, z: -0.18, rx: -Math.PI / 2, sx: 0.4, color: '#2a3a36', mat: M.smooth, seg: 4 });
      b.pop();
    }
    b.cyl(0.05, 0.06, 0.1, { x: 0, y, z: z + 0.05, color: '#8a6a4a', mat: M.smooth, seg: 6 });
  }
  object.add(b.build());

  /* windows: 4 per storey, one instanced mesh, coloured per frame */
  const NW = LEVELS * 4;
  const win = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), NW);
  const dark = new THREE.Color('#1b1a22'), warm = new THREE.Color(C.lamp), tmpC = new THREE.Color();
  for (let i = 0; i < LEVELS; i++) for (let k = 0; k < 4; k++) {
    const L = LV[i], a = (k * Math.PI) / 2, r = L.w / 2 + 0.025;
    setInst(win, i * 4 + k, Math.sin(a) * r, 0.18 + L.y + L.h * 0.25, PZ + Math.cos(a) * r, a, [L.w * 0.24, L.h * 0.42, 0.03]);
    win.setColorAt(i * 4 + k, dark);
  }
  object.add(win);

  /* the relic jewel on the spire */
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  jewel.position.set(0, 0.18 + top - PW * 0.05, PZ);
  object.add(jewel);
  const aura = softPuffs(24, { color: '#ffc45a', opacity: 0.3, additive: true });
  object.add(aura.points);

  /* Wukong with lamp and broom on the galleries */
  const wk = new THREE.Group();
  {
    const wb = new Builder();
    figure(wb, 'wukong', { pose: 'none' });
    wb.cyl(0.022, 0.026, 0.2, { x: -0.09, y: 0.43, rz: Math.PI - 0.3, color: C.fur, mat: M.smooth, seg: 6 });
    wb.cyl(0.022, 0.026, 0.22, { x: 0.09, y: 0.43, rz: 1.9, rx: 0.4, color: C.fur, mat: M.smooth, seg: 6 });
    // broom over the shoulder
    wb.cyl(0.01, 0.01, 0.7, { x: -0.16, y: 0.05, z: 0.06, rx: 0.5, rz: 0.15, color: C.wood, mat: M.wood, seg: 4 });
    wb.cone(0.07, 0.2, { x: -0.13, y: 0.0, z: -0.06, rx: Math.PI + 0.5, color: '#b59a5a', mat: M.cloth, seg: 6 });
    wk.add(wb.build());
  }
  wk.scale.setScalar(1.15);
  object.add(wk);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lamp).multiplyScalar(3) }));
  object.add(lamp);
  // the lamp's light is faked with additive halos (a PointLight would enter every shader in the atlas)
  const lampHalo = softPuffs(3, { color: '#ffc46a', opacity: 0.55, additive: true });
  object.add(lampHalo.points);
  // …and a warm additive shell over the storey he is on, so its walls read as lamplit
  const wash = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#ffb860', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
  object.add(wash);
  // Tang Seng's broom, sweeping
  const broom = new THREE.Group();
  {
    const bb = new Builder();
    bb.cyl(0.012, 0.012, 1.0, { y: 0.0, color: C.wood, mat: M.wood, seg: 4 });
    bb.cone(0.12, 0.3, { y: 0.0, rx: Math.PI, color: '#b59a5a', mat: M.cloth, seg: 6 });
    broom.add(bb.build());
  }
  broom.position.set(TS[0] + 0.15, TS[1] + 0.3, TS[2] - 0.15);
  object.add(broom);

  /* low night mist */
  const MIST = 34;
  const mist = softPuffs(MIST, { color: '#6c7598', opacity: 0.35 });
  object.add(mist.points);
  const md = Array.from({ length: MIST }, () => ({ a: rng() * Math.PI * 2, d: 2.5 + rng() * 7, y: 0.3 + rng() * 0.6, s: 1.6 + rng() * 2, ph: rng() * 10 }));
  const ad = Array.from({ length: 24 }, () => ({ a: rng() * Math.PI * 2, r: 0.2 + rng() * 0.6, ph: rng() }));

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    const u = t % CYCLE;
    const climbing = u < CLIMB;
    const f = Math.min(u, CLIMB - 0.001) / PER, lvl = Math.min(LEVELS - 1, Math.floor(f)), p = f - lvl;
    const L = LV[lvl];
    // walk round the gallery, then step up
    const a = p * Math.PI * 2 + 0.25;
    const r = L.w / 2 + 0.3;
    const yy = 0.18 + L.y;
    const atTop = !climbing;
    const ang = atTop ? 0.25 : a;
    wk.position.set(Math.sin(ang) * r, yy + Math.abs(Math.sin(t * 7)) * 0.02, PZ + Math.cos(ang) * r);
    wk.rotation.y = ang + Math.PI / 2;
    lamp.position.set(wk.position.x + Math.cos(ang) * 0.18, wk.position.y + 0.55, wk.position.z - Math.sin(ang) * 0.18);
    wash.visible = climbing;
    wash.position.set(0, 0.18 + L.y, PZ);
    wash.scale.set(L.w + 0.06, L.h * 0.92, L.w + 0.06);
    wash.material.opacity = 0.2 + 0.12 * Math.sin(Math.PI * p);
    lampHalo.set(0, lamp.position.x, lamp.position.y, lamp.position.z, 0.9, 0.8);
    lampHalo.set(1, lamp.position.x, lamp.position.y, lamp.position.z, 2.6, 0.6);
    lampHalo.set(2, lamp.position.x, lamp.position.y - 0.3, lamp.position.z, 5.0, 0.3 * (1 - 0.5 * nk));
    lampHalo.commit();
    // the relic returns once the lamp reaches the top
    const glow = smooth(CLIMB, CLIMB + 2.5, u) * (1 - smooth(CYCLE - 2.5, CYCLE, u));
    for (let i = 0; i < LEVELS; i++) {
      const lampK = i === lvl && climbing ? 0.6 + 0.4 * Math.sin(Math.PI * p) : (i < lvl && climbing ? 0.12 : 0);
      const relicK = glow * smooth(0, 1, (u - CLIMB - (LEVELS - 1 - i) * 0.16) / 1.2);
      const k = Math.max(lampK, relicK);
      tmpC.copy(dark).lerp(warm, Math.min(1, k)).multiplyScalar(1 + 0.6 * k);
      for (let s = 0; s < 4; s++) win.setColorAt(i * 4 + s, tmpC);
    }
    win.instanceColor.needsUpdate = true;
    jewel.material.color.set('#7a6a52').lerp(tmpC.set('#ffe7a0'), glow).multiplyScalar(1 + 2.4 * glow);
    for (let i = 0; i < 24; i++) {
      const d = ad[i], q = (t * 0.12 + d.ph) % 1;
      aura.set(i, Math.cos(d.a + t * 0.3) * d.r * (1 + q), jewel.position.y + q * 2.2 - 0.3, PZ + Math.sin(d.a + t * 0.3) * d.r * (1 + q), 0.3 + q * 0.7, glow * Math.sin(Math.PI * q));
    }
    aura.commit();
    broom.rotation.set(0.2, 0, 0.35 + 0.3 * Math.sin(t * 2.2));
    for (let i = 0; i < MIST; i++) {
      const m = md[i], aa = m.a + t * 0.01;
      mist.set(i, Math.cos(aa) * m.d, m.y, Math.sin(aa) * m.d, m.s, 0.6 + 0.3 * Math.sin(t * 0.2 + m.ph));
    }
    mist.commit();
    void pulse; void clamp;
  }
  update(0);
  return { object, update };
}
