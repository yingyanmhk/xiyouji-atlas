// 火焰山 — a jagged red range burning along its whole crest. The pilgrims have halted on the road
// across the scorched plain; Wukong (drawn large, 主大从小) rides a cloud and swings the plantain fan.
// One loop of 24 s: the fire burns; three strokes of the fan drive a quenching front across the
// range (一扇息火), a gust follows (二扇生风), then rain (三扇下雨) and steam — and the fire creeps back.
import { THREE, Builder, M, C, terrain, peak, rock, bareTree, cloud, figure, horse, fireRock, fbm, noise2, smooth, clamp, setInst, lerp, softPuffs } from '../kit.js';
import { nightTint } from './_e_kit.js';

const CYCLE = 24;
const crestZ = (x) => -3.4 + Math.sin(x * 0.42 + 0.8) * 0.9;

function ground(x, z) {
  const r = Math.hypot(x, z);
  const fade = smooth(10.3, 8.8, r);
  const zc = crestZ(x);
  const w = 1.5 + fbm(x * 0.25 + 3, 1.7) * 1.1;
  const n = fbm(x * 0.55 + 11, z * 0.5, 4);
  const ridged = 1 - Math.abs(2 * noise2(x * 1.15 + 4, z * 0.7) - 1);
  const H = (2.4 + 3.8 * n + 2.6 * ridged * ridged) * smooth(9.8, 6.2, Math.abs(x));
  let h = H * Math.exp(-((z - zc) ** 2) / (w * w));
  h += smooth(zc + 0.5, zc - 2.5, z) * (2.2 + 1.5 * n) * smooth(9.8, 6, Math.abs(x)); // the range continues behind
  h += 0.18 + 0.3 * fbm(x * 0.4, z * 0.4 + 7);
  h += smooth(3.2, 0, Math.hypot(x + 6.2, z - 2.8)) * 0.9;                          // a low hill, front-left
  return Math.max(0.12, h * fade + 0.12 * (1 - fade));
}

// the road: from the front-right rim toward the foot of the range
const ROAD = [[8.6, 4.6], [6.6, 5.0], [4.6, 4.4], [2.8, 3.2], [1.4, 1.6], [0.6, 0.1]];
function roadDist(x, z) {
  let d = 1e9;
  for (let i = 0; i < ROAD.length - 1; i++) {
    const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1];
    const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
const roadAt = (t) => {
  const f = t * (ROAD.length - 1), i = Math.min(ROAD.length - 2, Math.floor(f)), k = f - i;
  const x = lerp(ROAD[i][0], ROAD[i + 1][0], k), z = lerp(ROAD[i][1], ROAD[i + 1][1], k);
  return [x, ground(x, z), z];
};

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const rockPal = fireRock(9);
  const roadCol = new THREE.Color('#b9946c');
  terrain(b, { R: 10.5, rings: 50, segs: 160, fn: ground, palette: (x, y, z, nx, ny, nz) => (roadDist(x, z) < 0.42 + 0.08 * noise2(x * 3, z * 3) ? roadCol : rockPal(x, y, z, nx, ny, nz)) });

  // jagged spires along the crest
  for (const [x, r, h] of [[-5.4, 0.8, 3.6], [-2.6, 1.0, 4.6], [0.2, 0.85, 3.8], [2.8, 1.0, 5.0], [5.4, 0.75, 3.4], [-0.9, 0.7, 3.0]]) {
    const z = crestZ(x) - 0.3, y = ground(x, z) - 0.6;
    peak(b, { x, y, z, r, h, lean: 0.1, rand: rng, taper: 0.92, steps: 2, palette: fireRock(h + 3, { base: y - 3 }) });
  }

  // the pilgrims, halted on the road
  {
    const [hx, hy, hz] = roadAt(0.5);
    horse(b, { x: hx, y: hy, z: hz, ry: -2.2, rider: 'monk', s: 1.25 });
    const [px, py, pz] = roadAt(0.36);
    figure(b, 'bajie', { x: px + 0.2, y: py, z: pz + 0.5, ry: -2.5, s: 1.25 });
    const [sx, sy, sz] = roadAt(0.25);
    figure(b, 'sha', { x: sx, y: sy, z: sz + 0.1, ry: -2.0, s: 1.25 });
  }

  // scorched trees and boulders on the plain
  for (let i = 0, k = 0; i < 6 && k < 200; k++) {
    const [x, z] = rng.inDisc(9, 2.5);
    if (z < 0 || roadDist(x, z) < 1) continue;
    bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.1 + rng() * 0.8, r: rng, color: '#2e1d16' }); i++;
  }
  for (let i = 0; i < 14; i++) {
    const [x, z] = rng.inDisc(9.6, 2);
    if (roadDist(x, z) < 0.8) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.45, h: 0.3 + rng() * 0.5, rand: rng, palette: fireRock(1.5, { base: ground(x, z) - 1 }) });
  }
  // glowing cracks in the plain
  for (let i = 0; i < 7; i++) {
    let x = rng.range(-7, 7), z = rng.range(0.5, 7.5), a = rng() * Math.PI * 2;
    const pts = [];
    for (let k = 0; k < 7; k++) {
      pts.push([x, ground(x, z) + 0.015, z]);
      const L = 0.25 + rng() * 0.35;
      x += Math.sin(a) * L; z += Math.cos(a) * L; a += (rng() - 0.5) * 1.3;
    }
    if (pts.some(([px, , pz]) => roadDist(px, pz) < 0.6)) continue;
    b.tube(pts, (t) => 0.03 * Math.sin(Math.PI * (0.1 + 0.8 * t)), { color: C.ember, mat: M.glow, glow: 1.6, radial: 4, segs: 18 });
  }
  object.add(b.build());

  /* ------------------------------------------------------- flames --- */
  const fg = new THREE.LatheGeometry([[0, 0], [0.3, 0.08], [0.34, 0.28], [0.24, 0.62], [0.13, 0.95], [0.05, 1.28], [0, 1.55]].map(([r, y]) => new THREE.Vector2(r, y)), 6);
  {
    const Pp = fg.attributes.position, col = new Float32Array(Pp.count * 3);
    const stops = [new THREE.Color(1.55, 0.78, 0.18), new THREE.Color(1.25, 0.32, 0.06), new THREE.Color(0.62, 0.1, 0.035)];
    const c = new THREE.Color();
    for (let i = 0; i < Pp.count; i++) {
      const y = Pp.getY(i), t = clamp(y / 1.5);
      // twist the tongue so it licks sideways
      Pp.setX(i, Pp.getX(i) + Math.sin(y * 3.2) * 0.09 * y);
      if (t < 0.5) c.copy(stops[0]).lerp(stops[1], t * 2); else c.copy(stops[1]).lerp(stops[2], (t - 0.5) * 2);
      col.set([c.r, c.g, c.b], i * 3);
    }
    fg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    fg.computeVertexNormals();
  }
  const flames = [];
  for (let tries = 0; flames.length < 230 && tries < 9000; tries++) {
    const x = rng.range(-9.3, 9.3), z = rng.range(-8.5, 0.5), h = ground(x, z);
    if (h < 2.4 || Math.hypot(x, z) > 9.6) continue;
    if (rng() > ((h - 2) / 5.5) ** 1.3) continue;
    flames.push({ x, y: h - 0.2, z, s: (0.5 + rng() * 0.6) * (0.6 + clamp((h - 2) / 6)), ph: rng() * 20, f: 4 + rng() * 4 });
  }
  const flameMesh = new THREE.InstancedMesh(fg, new THREE.MeshBasicMaterial({ vertexColors: true }), flames.length);
  object.add(flameMesh);
  const heat = softPuffs(flames.length, { color: '#ff6a22', opacity: 0.22, additive: true });
  object.add(heat.points);

  // smoke and steam (soft particles)
  const SMOKE = 40, STEAM = 50;
  const smoke = softPuffs(SMOKE, { color: '#5a4038', opacity: 0.32 });
  const steam = softPuffs(STEAM, { color: '#f6f3ee', opacity: 0.75 });
  object.add(smoke.points, steam.points);
  const smokeSrc = flames.filter((_, i) => i % 5 === 0).slice(0, SMOKE);
  const steamSrc = flames.filter((_, i) => i % 4 === 1).slice(0, STEAM);

  /* ------------------------------------------- Wukong with the fan --- */
  const WS = 1.8;
  const rider = new THREE.Group();
  {
    const kb = new Builder();
    cloud(kb, { s: 0.5, y: -0.08, color: C.white, rand: rng, puffs: 6 });
    figure(kb, 'wukong', { pose: 'fan', s: WS });
    rider.add(kb.build());
  }
  const fanPivot = new THREE.Group();
  fanPivot.position.set(0.177 * WS, 0.602 * WS, 0.053 * WS);
  {
    const fb = new Builder();
    const leaf = new THREE.Shape();
    leaf.moveTo(0, 0);
    leaf.bezierCurveTo(0.55, 0.15, 0.62, 0.95, 0, 1.25);
    leaf.bezierCurveTo(-0.62, 0.95, -0.55, 0.15, 0, 0);
    fb.extrude(leaf, 0.03, { y: 0.35, color: '#c2ad48', mat: M.cloth });
    fb.cyl(0.02, 0.025, 0.42, { color: C.woodD, mat: M.wood, seg: 6 });
    for (let i = -3; i <= 3; i++) fb.box(0.014, 0.95 - Math.abs(i) * 0.1, 0.045, { y: 0.42, x: i * 0.06, rz: -i * 0.12, color: '#857024', mat: M.cloth });
    const fan = fb.build();
    fan.scale.setScalar(1.25);
    fanPivot.add(fan);
  }
  rider.add(fanPivot);
  const RIDER = [-4.6, 4.4, 2.6];
  rider.position.set(...RIDER);
  rider.rotation.y = 2.1;
  object.add(rider);

  // gust (二扇生风): white streamers travelling from the fan to the range
  const gust = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const gb = new Builder();
    const pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([Math.sin(t * Math.PI * 1.8 + i) * 0.45, Math.sin(t * Math.PI) * 0.35, -t * 4.5]); }
    gb.tube(pts, (t) => 0.06 * Math.sin(t * Math.PI), { color: '#fbf8f2', mat: M.cloud, radial: 5, segs: 24 });
    const g = gb.build({ shadows: false });
    g.position.set((i - 2) * 1.3, (i % 3) * 0.6, i * 0.3);
    gust.add(g);
  }
  object.add(gust);

  // rain cloud (三扇下雨): soft dark mass + rain lines
  const RC = 120;
  const rainCloud = softPuffs(RC, { color: '#8e959c', opacity: 0.8 });
  object.add(rainCloud.points);
  const rcp = Array.from({ length: RC }, () => ({ x: rng.range(-7.5, 7.5), y: 11 + rng.range(-0.9, 1.2) * rng(), z: rng.range(-6, 0), s: 1.2 + rng() * 2.6 }));
  const DROPS = 300;
  const rainPos = new Float32Array(DROPS * 6);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#dde8ee', transparent: true, opacity: 0 });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  object.add(rain);
  const drops = Array.from({ length: DROPS }, () => ({ x: rng.range(-7.5, 7.5), z: rng.range(-6.5, 0.5), ph: rng() }));

  /* ------------------------------------------------------- update --- */
  function strength(z, u) {
    if (u < 0.7) return 1 - clamp((z - lerp(4, -10, clamp((u - 0.28) / 0.14))) / 1.6);
    return clamp((lerp(-11, 4, clamp((u - 0.72) / 0.26)) - z) / 1.6);
  }

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    nightTint(steam, nk);
    nightTint(rainCloud, nk);
    const u = (t % CYCLE) / CYCLE;
    for (let i = 0; i < flames.length; i++) {
      const fl = flames[i];
      const k = strength(fl.z, u);
      const fk = 1 + 0.25 * Math.sin(t * fl.f + fl.ph) + 0.12 * Math.sin(t * fl.f * 2.3 + fl.ph * 3);
      const s = fl.s * k;
      setInst(flameMesh, i, fl.x, fl.y, fl.z, fl.ph + t * 0.3, s < 0.01 ? 0.0001 : [s, s * fk, s], 0, Math.sin(t * 2 + fl.ph) * 0.15);
      heat.set(i, fl.x, fl.y + 0.7 * s, fl.z, 2.2 * s * fk, k);
    }
    flameMesh.instanceMatrix.needsUpdate = true;
    heat.commit();
    for (let i = 0; i < SMOKE; i++) {
      const src = smokeSrc[i], p = (t * 0.06 + i / SMOKE) % 1, k = strength(src.z, u);
      smoke.set(i, src.x + p * 2.2, src.y + 1.2 + p * 7, src.z - p * 1.5, 1.2 + p * 3.5, k * Math.sin(Math.PI * p));
    }
    smoke.commit();
    const steamK = smooth(0.3, 0.4, u) * (1 - smooth(0.6, 0.74, u));
    for (let i = 0; i < STEAM; i++) {
      const src = steamSrc[i], p = (t * 0.1 + i / STEAM) % 1;
      steam.set(i, src.x + p * 0.6, src.y + 0.4 + p * 4.5, src.z, 0.9 + p * 2.6, steamK * Math.sin(Math.PI * p));
    }
    steam.commit();
    // Wukong bobs; three strokes of the fan
    rider.position.y = RIDER[1] + Math.sin(t * 0.8) * 0.15;
    const fanning = u > 0.25 && u < 0.42;
    const stroke = fanning ? Math.sin(((u - 0.25) / 0.17) * Math.PI * 3) : 0;
    fanPivot.rotation.set(-0.2 + stroke * 0.95, 0, -0.45 + stroke * 0.3);
    const gk = smooth(0.29, 0.33, u) * (1 - smooth(0.44, 0.5, u));
    gust.visible = gk > 0.01;
    const gp = clamp((u - 0.29) / 0.2);
    gust.position.set(RIDER[0] + 1 + gp * 4, 3.6 + gp * 0.8, RIDER[2] - 0.5 - gp * 7);
    gust.rotation.y = 0.5;
    gust.scale.setScalar(Math.max(0.001, gk));
    // rain
    const rk = smooth(0.36, 0.45, u) * (1 - smooth(0.62, 0.7, u));
    for (let i = 0; i < RC; i++) { const c = rcp[i]; rainCloud.set(i, c.x + Math.sin(t * 0.2 + i) * 0.3, c.y, c.z, c.s * (0.6 + 0.4 * rk), rk); }
    rainCloud.commit();
    rainMat.opacity = rk * 0.7;
    rain.visible = rk > 0.01;
    if (rain.visible) {
      for (let i = 0; i < DROPS; i++) {
        const d = drops[i], y = 10.5 - ((t * 0.8 + d.ph) % 1) * 10.5;
        rainPos.set([d.x + y * 0.05, y, d.z, d.x + y * 0.05 - 0.03, y - 0.45, d.z], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
  }
  update(0);
  return { object, update };
}
