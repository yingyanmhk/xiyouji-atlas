// 黄风岭 — a barren loess ridge. From the mouth of 黄风洞 the Yellow Wind Demon blows his 三昧神风:
// a yellow vortex that bends every tree, darkens heaven and earth and stings Wukong's fiery eyes
// till they stream (he stands shading them). Loop of 32 s: the storm rages; 灵吉菩萨 comes down
// from 小须弥山 on a cloud and casts his 飞龙宝杖, which turns into a golden eight-clawed dragon that
// coils down the funnel; the wind dies, the demon shows as what he is — a yellow marten — and
// then the sand begins to stir again.
import { THREE, Builder, M, C, terrain, peak, rock, bareTree, figure, staff, fbm, noise2, hash2, smooth, clamp, lerp, ramp, setInst, softPuffs } from '../kit.js';
import { bodhisattvaOnCloud, dynTube, placeObj } from './_b_kit.js';

const CYCLE = 32;
const CAVE = [-0.6, 0, -4.2];     // y filled below

function loess(hmax, { base = 0 } = {}) {
  const cliff = [[0, '#5e3c22'], [0.25, '#80522e'], [0.55, '#a46c3a'], [0.8, '#bf8a4c'], [1, '#d0a060']];
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const band = noise2(x * 0.15 + z * 0.15, y * 2.2) - 0.5;        // horizontal strata of loess
    ramp(cliff, t + band * 0.12 + (hash2(x * 9, z * 9 + y) - 0.5) * 0.04, out);
    out.multiplyScalar(0.93 + band * 0.2);
    const up = smooth(0.5, 0.85, ny);
    if (up > 0) out.lerp(tmp.set('#b89458').offsetHSL(0, 0, band * 0.05), up * 0.75);
    if (ny < 0.15) out.multiplyScalar(0.82);
    return out;
  };
}

function ground(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.28 + 5, z * 0.28 + 1, 4);
  const ridged = 1 - Math.abs(2 * noise2(x * 0.45 + 2, z * 0.3 + 6) - 1);
  // the ridge runs across the back; gullies cut the front slope
  let h = smooth(3, -6, z) * (3.0 + 2.8 * n + 0.6 * ridged) * smooth(10.4, 7.6, r);
  h += 0.3 + 0.4 * n;
  const gully = Math.exp(-((x - 1.2 - 0.6 * Math.sin(z * 0.6)) ** 2) / 0.5) * smooth(4, -2, z) * 1.2;
  void gully;
  return Math.max(0.2, h);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();
  const pal = loess(7);
  const pathCol = new THREE.Color('#cfb27a');
  const pathD = (x, z) => Math.abs(x - (2.6 + 1.2 * Math.sin(z * 0.35))) - 0.35;
  terrain(b, { R: 10.5, rings: 48, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (pathD(x, z) < 0 && z > -2 ? pathCol : pal(x, y, z, nx, ny, nz)) });

  // eroded loess buttresses along the ridge
  const cy = ground(CAVE[0], CAVE[2]);
  CAVE[1] = cy;
  const bluffs = [[-3.8, -4.4, 1.5, 3.6], [2.8, -5.2, 1.7, 5.6], [-6.2, -2.8, 1.1, 2.6], [5.8, -3.2, 1.1, 3.0], [0.6, -7.6, 1.5, 7.4], [-2.8, -7.8, 1.3, 4.6], [4.4, -7.2, 1.1, 3.8], [-5.2, -6.0, 1.0, 3.2]];
  for (const [x, z, r, h] of bluffs) {
    const y = ground(x, z) - 0.5;
    peak(b, { x, y, z, r: r * 0.85, h, lean: 0.1, taper: 0.55 + rng() * 0.2, steps: 2, flatTop: rng() < 0.5 ? 1 : 0, rand: rng, palette: loess(h + y, { base: 0 }) });
  }
  // the cliff with the cave mouth 黄风洞
  peak(b, { x: CAVE[0], y: cy - 0.6, z: CAVE[2] - 0.9, r: 2.0, h: 5.2, taper: 0.35, lean: 0.03, steps: 3, flatTop: 1, rand: rng, palette: loess(5.2 + cy, { base: 0 }) });
  b.sphere(1.0, { x: CAVE[0], y: cy + 0.7, z: CAVE[2] + 0.75, sx: 0.85, sy: 1.15, sz: 0.35, color: '#2a1c12', mat: M.stone });
  for (const sx of [-1, 1]) rock(b, { x: CAVE[0] + sx * 1.0, y: cy - 0.1, z: CAVE[2] + 0.9, r: 0.45, h: 0.9, rand: rng, palette: loess(2, { base: cy - 0.5 }) });

  // trees bent away from the vortex (the wind blows toward +x / +z)
  const trees = [[3.4, 1.4], [5.2, -0.2], [-3.4, 1.0], [-5.6, 2.6], [6.4, 3.4], [-1.8, 4.8], [4.4, 5.6], [-6.8, -0.6]];
  for (const [x, z] of trees) {
    const dx = x - CAVE[0], dz = z - CAVE[2], d = Math.hypot(dx, dz);
    const y = ground(x, z) - 0.05;
    b.push({ x, y, z, ry: Math.atan2(dx, dz), rx: 0.5 + 0.2 * rng() });
    bareTree(b, { h: 1.4 + rng() * 0.8, r: rng, color: '#4a3424' });
    b.pop();
    void d;
  }
  // boulders and dry tufts
  for (let i = 0; i < 18; i++) {
    const [x, z] = rng.inDisc(9.8, 2);
    if (pathD(x, z) < 0.3) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.2 + rng() * 0.45, h: 0.3 + rng() * 0.5, rand: rng, palette: loess(1.6, { base: ground(x, z) - 0.6 }) });
  }
  for (let i = 0; i < 26; i++) {
    const [x, z] = rng.inDisc(9.6, 1.5);
    const y = ground(x, z);
    for (let k = 0; k < 4; k++) b.cone(0.03, 0.28, { x: x + (k - 1.5) * 0.05, y, z, rz: -0.5 - k * 0.12, rx: 0.4, color: '#a08a4a', mat: M.cloth, seg: 3 });
  }

  // Wukong on the path, shading his stinging eyes; Bajie hunched behind him
  const WK = [2.0, 0, 3.0]; WK[1] = ground(WK[0], WK[2]);
  figure(b, 'wukong', { x: WK[0], y: WK[1], z: WK[2], ry: -2.6, pose: 'gaze', s: 1.7 });
  staff(b, { x: WK[0] + 0.25, y: WK[1], z: WK[2] - 0.2, rz: 0.25, rx: 0.1, len: 1.7, center: false });
  b.push({ x: WK[0] + 0.9, y: ground(WK[0] + 0.9, WK[2] + 0.9), z: WK[2] + 0.9, ry: -2.4 });
  b.push({ rx: 0.35 });
  figure(b, 'bajie', { s: 1.2 });
  b.pop(); b.pop();
  object.add(b.build());

  /* --------------------------------------------------- the vortex --- */
  const BASE = [CAVE[0], cy + 0.4, CAVE[2] + 1.6];
  const TOPC = [1.8, 13.4, -2.2];
  const axis = (h, out, t) => {
    const k = h * h;
    out[0] = lerp(BASE[0], TOPC[0], k) + Math.sin(h * 4 + t * 0.6) * 0.35 * h;
    out[1] = lerp(BASE[1], TOPC[1], h);
    out[2] = lerp(BASE[2], TOPC[2], k) + Math.cos(h * 3.3 + t * 0.5) * 0.3 * h;
    return out;
  };
  const radius = (h) => 0.45 + 3.9 * Math.pow(h, 1.5);
  // translucent funnel shell with spiral streaks
  const shellG = new THREE.CylinderGeometry(1, 1, 1, 48, 24, true);
  shellG.translate(0, 0.5, 0);
  const shellBase = Float32Array.from(shellG.attributes.position.array);
  const funnelMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uK: { value: 1 }, uDim: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime, uK, uDim; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        float u = vUv.x * 6.0 + vUv.y * 5.0 - uTime * 1.4;
        float s = n(vec2(u * 2.0, vUv.y * 3.0 - uTime * 0.3));
        float streak = smoothstep(0.45, 0.85, s);
        float fade = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
        vec3 c = mix(vec3(0.5, 0.32, 0.12), vec3(0.95, 0.8, 0.48), streak);
        gl_FragColor = vec4(c * uDim, (0.42 + 0.45 * streak) * fade * uK);
      }`,
  });
  const funnel = new THREE.Mesh(shellG, funnelMat);
  funnel.frustumCulled = false;
  object.add(funnel);
  const SAND = 640;
  const sand = softPuffs(SAND, { color: '#9a6428', opacity: 0.55 });
  const crown = softPuffs(60, { color: '#a87a3c', opacity: 0.38 });
  object.add(crown.points);
  const cp = Array.from({ length: 60 }, () => ({ a: rng() * 6.28, r: rng(), s: 1.4 + rng() * 1.4, w: 0.2 + rng() * 0.3 }));
  const dust = softPuffs(70, { color: '#b58a4c', opacity: 0.3 });
  object.add(sand.points, dust.points);
  const sp = Array.from({ length: SAND }, () => ({ h: rng(), a: rng() * Math.PI * 2, w: 1.5 + rng() * 1.5, s: 0.8 + rng() * 1.2, j: rng() }));
  const dp = Array.from({ length: 70 }, () => { const [x, z] = rng.inDisc(10, 1); return { x, z, ph: rng(), s: 1.5 + rng() * 2.5 }; });
  // flying pebbles and leaves
  const NDEB = 40;
  const deb = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: '#6e5032', roughness: 0.9, flatShading: true }), NDEB);
  object.add(deb);
  const dbp = Array.from({ length: NDEB }, () => ({ h: rng(), a: rng() * 6.28, s: 0.6 + rng() * 1.2 }));

  /* ------------------------------------------- 灵吉菩萨 and the dragon --- */
  const lingji = bodhisattvaOnCloud(rng, { s: 1.7, cloud: 0.65, robe: '#f1e6cc', inner: '#c9a24a', vase: false, staff: true, hood: false });
  lingji.rotation.y = 0.6;
  object.add(lingji);
  const LJ = [-4.4, 11.2, -0.6];
  const NR = 60;
  const dragon = dynTube(NR, 8, { color: (s, j) => (Math.cos(j * Math.PI * 2) < -0.3 ? '#f6dc8a' : (Math.floor(s * 60) % 2 ? '#e0a82e' : '#cf9424')),
    material: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.6, emissive: '#7a4a10', emissiveIntensity: 0.6 }) });
  object.add(dragon.mesh);
  const dHead = new THREE.Group();
  {
    const hb = new Builder();
    hb.sphere(0.22, { sz: 1.3, sy: 0.8, color: '#e8b03a', mat: M.metal });
    hb.box(0.24, 0.12, 0.3, { z: 0.25, y: -0.04, color: '#e8b03a', mat: M.metal });
    for (const sx of [-1, 1]) {
      hb.tube([[sx * 0.08, 0.12, -0.05], [sx * 0.18, 0.35, -0.25], [sx * 0.2, 0.42, -0.5]], 0.025, { color: '#f6dc8a', mat: M.metal, radial: 4 });
      hb.tube([[sx * 0.1, -0.02, 0.38], [sx * 0.4, 0.0, 0.3], [sx * 0.6, -0.25, 0.0]], 0.012, { color: '#f6dc8a', mat: M.metal, radial: 3 });
      hb.sphere(0.035, { x: sx * 0.12, y: 0.08, z: 0.15, color: '#ff5a2a', mat: M.glow, glow: 2 });
    }
    dHead.add(hb.build());
  }
  object.add(dHead);
  const marten = new THREE.Group();   // 黄毛貂鼠, the demon in his true shape
  {
    const mb = new Builder();
    mb.sphere(0.16, { sz: 1.9, sy: 0.8, y: 0.12, color: '#c98a3a', mat: M.smooth });
    mb.sphere(0.1, { z: 0.3, y: 0.18, color: '#c98a3a', mat: M.smooth });
    mb.tube([[0, 0.12, -0.28], [0, 0.2, -0.5], [0, 0.35, -0.6]], (t) => 0.06 * (1 - t * 0.5), { color: '#a86a2a', mat: M.smooth, radial: 5 });
    for (const sx of [-1, 1]) mb.sphere(0.03, { x: sx * 0.06, y: 0.27, z: 0.3, color: '#a86a2a', mat: M.smooth });
    marten.add(mb.build());
  }
  marten.position.set(BASE[0] + 0.3, cy + 0.05, BASE[2] + 0.6);
  marten.rotation.y = 0.7;
  marten.scale.setScalar(1.6);
  object.add(marten);
  const gold = softPuffs(30, { color: '#ffd36a', opacity: 0.8, additive: true });
  object.add(gold.points);

  /* ------------------------------------------------------ update --- */
  const P = [0, 0, 0];
  const sandC = sand.mat.uniforms.uColor.value.clone(), crownC = crown.mat.uniforms.uColor.value.clone(), dustC = dust.mat.uniforms.uColor.value.clone();
  function update(t, dt, env) {
    // the unlit sand and funnel would glow at night: dim them with the light
    const nk = 1 - 0.65 * (env?.night ?? 0);
    funnelMat.uniforms.uDim.value = nk;
    sand.mat.uniforms.uColor.value.copy(sandC).multiplyScalar(nk); crown.mat.uniforms.uColor.value.copy(crownC).multiplyScalar(nk); dust.mat.uniforms.uColor.value.copy(dustC).multiplyScalar(nk);
    const u = (t % CYCLE) / CYCLE;
    const W = smooth(0.0, 0.12, u) * (1 - smooth(0.6, 0.72, u)) + smooth(0.95, 1.0, u) * 0.0;   // storm strength
    const Wk = Math.max(W, 0.0001);
    funnelMat.uniforms.uTime.value = t;
    funnelMat.uniforms.uK.value = W;
    funnel.visible = W > 0.01;
    // reshape the funnel shell around the bending axis
    if (funnel.visible) {
      const pos = shellG.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = shellBase[i * 3], by = shellBase[i * 3 + 1], bz = shellBase[i * 3 + 2];
        const hh = by * W;
        axis(by, P, t);
        const r = radius(by) * (0.6 + 0.4 * W);
        pos.setXYZ(i, P[0] + bx * r, lerp(BASE[1], P[1], W), P[2] + bz * r);
        void hh;
      }
      pos.needsUpdate = true;
    }
    for (let i = 0; i < SAND; i++) {
      const s = sp[i];
      const h = (s.h + t * 0.05) % 1;
      const a = s.a + t * s.w * (1.4 - h * 0.6);
      axis(h * W, P, t);
      const r = radius(h) * (0.85 + s.j * 0.3) * (0.4 + 0.6 * W);
      sand.set(i, P[0] + Math.cos(a) * r, P[1], P[2] + Math.sin(a) * r, s.s * (0.45 + h * 0.8), W * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, h * 1.1))) * (1 - 0.5 * h));
    }
    sand.commit();
    for (let i = 0; i < 60; i++) {
      const c = cp[i], a = c.a + t * c.w;
      axis(W, P, t);
      const r = (3.0 + c.r * 1.8) * W;
      crown.set(i, P[0] + Math.cos(a) * r, P[1] - 0.8 + c.r * 1.0, P[2] + Math.sin(a) * r * 0.8, c.s, W * 0.7);
    }
    crown.commit();
    for (let i = 0; i < 70; i++) {
      const d = dp[i], p = (t * 0.06 + d.ph) % 1;
      dust.set(i, d.x + p * 3, ground(d.x, d.z) + 0.5 + p * 2.5, d.z + p * 1.5, d.s, W * Math.sin(Math.PI * p));
    }
    dust.commit();
    for (let i = 0; i < NDEB; i++) {
      const d = dbp[i], h = (d.h + t * 0.08) % 1, a = d.a + t * 3;
      axis(h * W, P, t);
      const r = radius(h) * 1.05;
      setInst(deb, i, P[0] + Math.cos(a) * r, P[1], P[2] + Math.sin(a) * r, t * 4 + i, Math.max(0.0001, d.s * W), t * 3 + i, 0);
    }
    deb.instanceMatrix.needsUpdate = true;
    // 灵吉 descends, hovers, and withdraws
    const lk = smooth(0.36, 0.48, u) * (1 - smooth(0.86, 0.95, u));
    lingji.visible = lk > 0.01;
    lingji.position.set(LJ[0], LJ[1] + (1 - lk) * 4 + Math.sin(t * 0.8) * 0.12, LJ[2]);
    lingji.scale.setScalar(Math.max(0.001, lk));
    // the flying-dragon staff: a golden dragon spiralling down the funnel (u 0.5 → 0.7), then coiled over the marten
    const dk = smooth(0.5, 0.53, u) * (1 - smooth(0.88, 0.94, u));
    dragon.mesh.visible = dHead.visible = dk > 0.01;
    if (dragon.mesh.visible) {
      const prog = smooth(0.5, 0.7, u);
      for (let i = 0; i < NR; i++) {
        const s = i / (NR - 1);
        // head leads along a helix from 灵吉's hand down to the cave mouth; settles into a ring
        const g = clamp(prog * 1.3 - s * 0.3);
        const hh = 1 - g;
        const ang = g * 9 - s * 6.0;
        const R = lerp(1.8, 1.25, g) + 0.25 * Math.sin(s * 8 + t);
        const ax = lerp(LJ[0] + 0.6, BASE[0], smooth(0, 0.6, g)), az = lerp(LJ[2], BASE[2], smooth(0, 0.6, g));
        const ay = lerp(LJ[1] + 0.8, cy + 1.6, g);
        dragon.ring(i, ax + Math.cos(ang) * R * smooth(0, 0.3, g), ay + s * (0.4 * hh + 1.1 * g), az + Math.sin(ang) * R * smooth(0, 0.3, g), (0.25 * (1 - s * 0.8) + 0.03) * dk);
      }
      dragon.commit();
      const T = dragon.T, U = dragon.U;
      placeObj(dHead, dragon.cx[0] + T[0] * 0.1, dragon.cy[0] + T[1] * 0.1, dragon.cz[0] + T[2] * 0.1, T[0], T[1], T[2], U[0], U[1], U[2], Math.max(0.001, dk * 1.8));
    }
    const mk = smooth(0.66, 0.72, u) * (1 - smooth(0.88, 0.93, u));
    marten.visible = mk > 0.01;
    marten.scale.setScalar(1.6 * Math.max(0.001, mk));
    for (let i = 0; i < 30; i++) {
      const p = (t * 0.3 + i / 30) % 1, a = i * 2.4;
      gold.set(i, BASE[0] + Math.cos(a + t) * (0.6 + p), cy + 0.4 + p * 2.2, BASE[2] + Math.sin(a + t) * (0.6 + p), 0.25 + 0.3 * (1 - p), mk * (1 - p));
    }
    gold.commit();
    void Wk;
  }
  update(0);
  return { object, update };
}
