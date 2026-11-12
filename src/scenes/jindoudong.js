// 金兜洞 — a snowfield under 金兜山. Before going to beg for food Wukong drew a circle round his master
// with the staff: 'stay inside and no demon can touch you.' The ring still glows on the snow — but
// it is empty except for the horse; a line of footprints leads out of it to a fine pavilion that the
// demon conjured, where Tang Seng waits at the door and Bajie and Sha try on the brocade vests that
// will bind them. High above, the 金刚琢 — Laozi's diamond snare, stolen by his blue ox — turns slowly
// and swallows everything thrown at it: the gold-banded staff, Nezha's weapons, the fire of the Fire
// Star. Loop (20 s).
import { THREE, Builder, M, C, terrain, peak, pine, rock, hall, roof, figure, horse, snowRock, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';
import { pathDist, courtier, group } from './_c_util.js';

const CYCLE = 20;
const RING = [-0.8, 3.0];
const PAV = [3.8, -1.2];
const STEPS = [[-0.8, 3.0], [0.6, 2.2], [1.8, 1.0], [2.8, 0.1], [3.6, -0.3]];

// blue-white: slate-blue rock under heavy snow
function blueSnow(hmax, { base = 0, snowline = 0.4 } = {}) {
  const out = new THREE.Color(), tmp = new THREE.Color('#f2f6fa');
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax), n = noise2(x * 1.1 + 3, z * 1.1 + y * 0.6) - 0.5;
    const k = smooth(snowline - 0.2, snowline + 0.06, ny + n * 0.25 + t * 0.1);
    out.set('#3e5878').lerp(tmp.set('#6f8cae'), clamp(t + n * 0.3)).multiplyScalar(0.92 + n * 0.25);
    return out.lerp(tmp.set('#f2f6fa'), k);
  };
}

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.3 + 3, z * 0.3 + 5, 4);
  let h = 0.35 + 0.35 * n;
  h += smooth(-1, -8, z) * (1.6 + 2.6 * n) * smooth(10, 6, Math.abs(x + 1));
  h += smooth(4.5, 1, Math.hypot(x + 6.0, z + 0.5)) * 2.2;
  return h * smooth(10.6, 9.4, r) + 0.12 * (1 - smooth(10.6, 9.4, r));
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const snow = blueSnow(4, { snowline: 0.35 });
  const print = new THREE.Color('#9fb4c8');
  terrain(b, { R: 10.5, rings: 48, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => snow(x, y, z, nx, ny, nz) });

  /* 金兜山: steep blue-grey peaks deep in snow */
  for (const [x, z, r, h, lean] of [[-4.2, -6.4, 1.8, 10.5, 0.1], [-0.8, -7.8, 1.4, 8.0, 0.12], [2.6, -7.0, 1.5, 9.2, 0.08], [5.8, -5.6, 1.1, 6.0, 0.14], [-7.0, -3.4, 1.2, 6.6, 0.12], [-6.2, 0.2, 0.9, 4.0, 0.1]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean, rand: rng, taper: 0.72, palette: blueSnow(h, { base: y, snowline: 0.42 }) });
  }
  // the 金兜洞 cave mouth at the foot of the great peak, and the blue ox's silhouette on the ledge above
  b.push({ x: -3.4, y: ground(-3.4, -4.9) - 0.1, z: -4.9, ry: 0.4 });
  { const sh = new THREE.Shape(); sh.moveTo(-0.55, 0); sh.lineTo(-0.55, 0.6); sh.absarc(0, 0.6, 0.55, Math.PI, 0, true); sh.lineTo(0.55, 0); sh.lineTo(-0.55, 0); b.extrude(sh, 0.5, { color: '#141c26', mat: M.stone }); }
  b.pop();
  for (let i = 0, k = 0; i < 14 && k < 500; k++) {
    const [x, z] = rng.inDisc(9.4, 2);
    if (Math.hypot(x - RING[0], z - RING[1]) < 3.4 || (z > 3 && Math.abs(x - RING[0]) < 2.5) || Math.hypot(x - PAV[0], z - PAV[1]) < 2.8 || pathDist(STEPS, x, z) < 0.9) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 1.3 + rng() * 1.2, r: rng, snow: true, lean: 0.15 }); i++;
  }
  for (let i = 0; i < 8; i++) {
    const [x, z] = rng.inDisc(9.6, 3);
    if (Math.hypot(x - RING[0], z - RING[1]) < 2.4 || pathDist(STEPS, x, z) < 0.8) continue;
    rock(b, { x, y: ground(x, z) - 0.15, z, r: 0.35 + rng() * 0.4, h: 0.4 + rng() * 0.5, rand: rng, palette: blueSnow(1.2, { base: ground(x, z) - 0.2 }) });
  }

  /* the conjured pavilion: a two-storey 楼台 with lit windows, snow on its roofs */
  const py = ground(...PAV) - 0.05;
  hall(b, { x: PAV[0], y: py, z: PAV[1], ry: -0.5, w: 3.0, d: 2.0, h: 1.3, tiers: 2, wall: '#e9dcc4', roofColor: '#e8eef2', beam: '#2f5d7c', lit: 0.9, r: rng });
  for (const sx of [-1, 1]) b.cyl(0.05, 0.06, 1.0, { x: PAV[0] + sx * 1.9 * Math.cos(0.5) + 0.5, y: py, z: PAV[1] + sx * 1.9 * Math.sin(0.5) + 1.1, color: C.cinnabar, mat: M.lacquer, seg: 6 });
  // the pilgrims at the door: Tang Seng waiting, Bajie and Sha with the brocade vests
  const door = [PAV[0] - 0.75, PAV[1] + 1.55];
  figure(b, 'monk', { x: door[0] - 0.55, y: ground(door[0] - 0.55, door[1] + 0.3), z: door[1] + 0.3, ry: 2.6, s: 1.25 });
  figure(b, 'bajie', { x: door[0] + 0.25, y: ground(door[0] + 0.25, door[1]), z: door[1], ry: -0.5, s: 1.2, pose: 'none' });
  b.box(0.36, 0.26, 0.12, { x: door[0] + 0.3, y: ground(door[0] + 0.25, door[1]) + 0.42, z: door[1] + 0.12, ry: -0.5, color: '#c94a5a', mat: M.cloth });   // the vest, on
  figure(b, 'sha', { x: door[0] + 0.85, y: ground(door[0] + 0.85, door[1] - 0.4), z: door[1] - 0.4, ry: -0.9, s: 1.2, pose: 'none' });
  b.box(0.32, 0.24, 0.1, { x: door[0] + 0.88, y: ground(door[0] + 0.85, door[1] - 0.4) + 0.55, z: door[1] - 0.3, ry: -0.9, color: '#3f7a8a', mat: M.cloth });
  // footprints out of the circle
  for (let i = 0; i < 34; i++) {
    const t = 0.04 + i / 34 * 0.92, f = t * (STEPS.length - 1), k = Math.min(STEPS.length - 2, Math.floor(f)), q = f - k;
    const x = lerp(STEPS[k][0], STEPS[k + 1][0], q), z = lerp(STEPS[k][1], STEPS[k + 1][1], q);
    const dx = STEPS[k + 1][0] - STEPS[k][0], dz = STEPS[k + 1][1] - STEPS[k][1], L = Math.hypot(dx, dz);
    const side = i % 2 ? 1 : -1, ox = (-dz / L) * 0.1 * side, oz = (dx / L) * 0.1 * side;
    if (Math.hypot(x - RING[0], z - RING[1]) < 2.1) continue;
    b.sphere(0.06, { x: x + ox, y: ground(x, z) + 0.005, z: z + oz, sx: 0.8, sy: 0.08, sz: 1.5, ry: Math.atan2(dx, dz), color: print, mat: M.snow, ws: 8, hs: 4 });
  }
  // inside the ring: only the white horse and the luggage are left
  horse(b, { x: RING[0] - 0.3, y: ground(RING[0] - 0.3, RING[1]), z: RING[1], ry: 0.9, s: 1.15 });
  b.box(0.4, 0.3, 0.3, { x: RING[0] + 0.6, y: ground(RING[0] + 0.6, RING[1] - 0.5), z: RING[1] - 0.5, color: '#7a6a4a', mat: M.cloth });
  b.box(0.36, 0.26, 0.28, { x: RING[0] + 0.85, y: ground(RING[0] + 0.85, RING[1] - 0.2), z: RING[1] - 0.2, ry: 0.4, color: '#5b6e5a', mat: M.cloth });
  // the circle itself, scratched into the snow with the staff, glowing
  {
    const pts = [];
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, x = RING[0] + Math.cos(a) * 2.0, z = RING[1] + Math.sin(a) * 2.0; pts.push([x, ground(x, z) + 0.03, z]); }
    b.tube(pts, 0.07, { color: '#ffd77a', mat: M.glow, glow: 1.6, radial: 5, segs: 128 });
  }
  object.add(b.build());

  /* --------------------------------------------- animated parts --- */
  // halo of the ring
  const RH = 40;
  const halo = softPuffs(RH, { color: '#ffd77a', opacity: 0.5, additive: true });
  object.add(halo.points);

  // the 金刚琢: a faceted gold ring high above
  const SN = new THREE.Vector3(-0.4, 11.2, -0.6);
  const snare = new THREE.Group();
  snare.add(new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.38, 4, 20), new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.25, metalness: 0.9, flatShading: true, emissive: '#7a5a1a', emissiveIntensity: 0.4 })));
  snare.add(new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2a0').multiplyScalar(1.8) })));
  snare.children[1].position.z = 0.4;
  snare.position.copy(SN);
  object.add(snare);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(1.45, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2c8').multiplyScalar(1.3), transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  snare.add(inner);

  // weapons drawn into it: staffs, spears, swords, a fire-wheel
  const wb = new Builder();
  wb.cyl(0.03, 0.03, 1.1, { y: -0.55, color: '#c9cfd4', mat: M.metal, seg: 5 });
  wb.cone(0.06, 0.22, { y: 0.55, color: '#e6ebef', mat: M.metal, seg: 4 });
  wb.box(0.16, 0.04, 0.04, { y: 0.5, color: C.gold, mat: M.metal });
  const NW = 22;
  const weapons = new THREE.InstancedMesh(wb.merged(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.8 }), NW);
  object.add(weapons);
  const staffG = new Builder(); staffG.cyl(0.035, 0.035, 1.6, { y: -0.8, color: C.cinnabar, mat: M.lacquer, seg: 6 }); for (const e of [-0.8, 0.64]) staffG.cyl(0.045, 0.045, 0.16, { y: e, color: C.gold, mat: M.metal, seg: 6 });
  const staffI = new THREE.InstancedMesh(staffG.merged(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.3 }), 1);
  object.add(staffI);
  const wd = Array.from({ length: NW }, (_, i) => ({ ph: i / NW, a0: rng() * Math.PI * 2, r0: 5 + rng() * 2.5, y0: 3 + rng() * 3, spin: (rng() - 0.5) * 8, s: 0.7 + rng() * 0.5 }));
  const FIRE = 60;
  const fire = softPuffs(FIRE, { color: '#ff7a3a', opacity: 0.85, additive: true });
  object.add(fire.points);
  const fd = Array.from({ length: FIRE }, () => ({ ph: rng(), j: [rng() - 0.5, rng() - 0.5, rng() - 0.5] }));
  // falling snow
  const FL = 260;
  const flakes = softPuffs(FL, { color: '#ffffff', opacity: 0.9 });
  object.add(flakes.points);
  const fl = Array.from({ length: FL }, () => { const [x, z] = rng.inDisc(10.2); return { x, z, ph: rng(), sp: 0.04 + rng() * 0.03, s: 0.06 + rng() * 0.07 }; });

  const _v = new THREE.Vector3();
  // a position on the inward spiral: p 0 → far out, 1 → in the snare's eye
  const spiral = (p, a0, r0, y0, out) => {
    const a = a0 + p * 5.5, r = r0 * Math.pow(1 - p, 1.4);
    return out.set(SN.x + Math.cos(a) * r, lerp(SN.y - y0, SN.y, Math.pow(p, 0.7)), SN.z + Math.sin(a) * r * 0.7);
  };

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(flakes, nk, 0.5);
    const u = (t % CYCLE) / CYCLE;
    snare.rotation.set(0.55 + Math.sin(t * 0.3) * 0.06, 0.15, t * 0.6);
    inner.material.opacity = 0.25 + 0.15 * Math.sin(t * 3);
    for (let i = 0; i < NW; i++) {
      const w = wd[i], p = (t * 0.06 + w.ph) % 1;
      spiral(p, w.a0, w.r0, w.y0, _v);
      const s = w.s * (1 - smooth(0.75, 1, p));
      setInst(weapons, i, _v.x, _v.y, _v.z, t * w.spin * 0.3 + w.a0, Math.max(0.001, s), 0.6 + t * w.spin * 0.2, p * 3);
    }
    weapons.instanceMatrix.needsUpdate = true;
    // the staff goes first, once per loop
    {
      const p = smooth(0.05, 0.45, u);
      spiral(p, 2.2, 6.0, 6.0, _v);
      const s = (1 - smooth(0.8, 1, p)) * smooth(0, 0.05, u + 0.0001);
      setInst(staffI, 0, _v.x, _v.y, _v.z, t * 0.8, Math.max(0.001, p >= 1 ? 0.001 : s), 0.9 + p * 6, 0);
      staffI.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < FIRE; i++) {
      const f = fd[i], p = (t * 0.09 + f.ph) % 1;
      spiral(p, 4.0 + f.j[0] * 0.6, 5.5, 5.0, _v);
      fire.set(i, _v.x + f.j[0] * 0.8 * (1 - p), _v.y + f.j[1] * 0.8 * (1 - p), _v.z + f.j[2] * 0.8 * (1 - p), 0.9 * (1 - p) + 0.1, smooth(0, 0.1, p) * (1 - smooth(0.85, 1, p)) * (0.6 + 0.4 * Math.sin(t * 7 + i)));
    }
    fire.commit();
    for (let i = 0; i < RH; i++) {
      const a = (i / RH) * Math.PI * 2, k = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.7);
      const x = RING[0] + Math.cos(a) * 2.0, z = RING[1] + Math.sin(a) * 2.0;
      halo.set(i, x, ground(x, z) + 0.2 + k * 0.2, z, 0.5 + 0.2 * k, 0.55 * k);
    }
    halo.commit();
    for (let i = 0; i < FL; i++) {
      const f = fl[i], y = 15 - ((t * f.sp + f.ph) % 1) * 15;
      flakes.set(i, f.x + Math.sin(t * 0.4 + f.ph * 9) * 0.3, y, f.z, f.s, smooth(0, 0.8, y));
    }
    flakes.commit();
  }
  update(0);
  return { object, update };
}
