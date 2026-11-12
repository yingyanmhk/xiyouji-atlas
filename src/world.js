// The stage: a silk-and-cloud ground inside the Buddha's palm, five flesh-pink pillars at the
// world's end (the "fingers" Wukong could not fly past), layered far ridges, porcelain basins
// for the dioramas, and the golden road of 108,000 li.
import * as THREE from 'three';
import { Builder, M, C, rng, cloud, noise2, softPuffs } from './kit.js';

export const HORIZON = new THREE.Color('#e4d6b6');
export const ZENITH = new THREE.Color('#9fb7bf');

export function createStage(scene) {
  scene.fog = new THREE.Fog(HORIZON.clone(), 260, 1500);

  // sky: an equirect gradient as scene.background (kept out of the AO pass); redrawn for day/night
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4; skyCanvas.height = 256;
  const sky = new THREE.CanvasTexture(skyCanvas);
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;

  // silk ground
  const tex = silkTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3500, 64),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, color: '#f4ecdc' }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // far ridges, three layers dissolving into the silk (远山)
  const ridgeGroup = new THREE.Group();
  const ridgeMats = [];
  [[1100, 60, 0.55, 0], [1500, 110, 0.7, 1], [2100, 190, 0.82, 2]].forEach(([R, H, fade, k]) => {
    const col = new THREE.Color('#7f9796').lerp(HORIZON, fade);
    const segs = 360, pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const n = noise2(i * 0.07 + k * 40, k) * 0.6 + noise2(i * 0.23 + k * 9, 3) * 0.3 + noise2(i * 0.7, k + 7) * 0.1;
      const hh = H * (0.25 + n * 1.1);
      pos.push(Math.cos(a) * R, -5, Math.sin(a) * R, Math.cos(a) * R, hh, Math.sin(a) * R);
      if (i < segs) { const j = i * 2; idx.push(j, j + 2, j + 1, j + 1, j + 2, j + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const rm = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, fog: false });
    rm.userData.fade = fade;
    ridgeMats.push(rm);
    ridgeGroup.add(new THREE.Mesh(g, rm));
  });
  scene.add(ridgeGroup);

  // lights: morning sun, hemisphere fill
  const hemi = new THREE.HemisphereLight('#e9eef0', '#a8916a', 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const SUN_DIR = new THREE.Vector3(0.55, 0.75, 0.45).normalize();
  const aimSun = (p) => { sun.target.position.copy(p); sun.position.copy(p).addScaledVector(SUN_DIR, 120); };
  aimSun(new THREE.Vector3());

  // the moon, far up in the sky; only at night
  const moon = new THREE.Mesh(new THREE.CircleGeometry(38, 48), new THREE.MeshBasicMaterial({ color: '#f4ecd2', fog: false, transparent: true, opacity: 0, depthWrite: false }));
  moon.position.set(-700, 520, -1500);
  moon.lookAt(0, 0, 0);
  scene.add(moon);

  /** k = 0 day … 1 night */
  const setNight = (k) => {
    const c = (key) => mixHex(DAY[key], NIGHT[key], k);
    const g = skyCanvas.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#' + c('zen').getHexString(THREE.SRGBColorSpace));
    gr.addColorStop(0.3, '#' + c('mid').getHexString(THREE.SRGBColorSpace));
    gr.addColorStop(0.5, '#' + c('hor').getHexString(THREE.SRGBColorSpace));
    gr.addColorStop(1, '#' + c('hor').getHexString(THREE.SRGBColorSpace));
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    sky.needsUpdate = true;
    const hor = c('hor');
    scene.fog.color.copy(hor);
    ground.material.color.copy(c('ground'));
    for (const rm of ridgeMats) rm.color.copy(c('ridge')).lerp(hor, rm.userData.fade);
    hemi.color.copy(c('hemiSky')); hemi.groundColor.copy(c('hemiGnd'));
    hemi.intensity = DAY.hemiI + (NIGHT.hemiI - DAY.hemiI) * k;
    sun.color.copy(c('sun')); sun.intensity = DAY.sunI + (NIGHT.sunI - DAY.sunI) * k;
    moon.material.opacity = Math.max(0, k * 1.2 - 0.2);
    moon.visible = k > 0.02;
  };
  setNight(0);
  return { sky, ground, hemi, sun, aimSun, setNight };
}

const DAY = { zen: '#9fb7bf', mid: '#c3c9bd', hor: '#e4d6b6', ground: '#f4ecdc', hemiSky: '#e9eef0', hemiGnd: '#a8916a', hemiI: 1.25, sun: '#fff0d8', sunI: 2.4, ridge: '#7f9796' };
const NIGHT = { zen: '#0d1424', mid: '#1c263a', hor: '#323c55', ground: '#5d6478', hemiSky: '#7084ad', hemiGnd: '#2a2a35', hemiI: 0.55, sun: '#a9bfe6', sunI: 0.8, ridge: '#121a2a' };
const _m0 = new THREE.Color(), _m1 = new THREE.Color();
function mixHex(a, b, k) { return _m0.set(a).lerp(_m1.set(b), k).clone(); }

function silkTexture() {
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#e8dbbd'; g.fillRect(0, 0, S, S);
  const r = rng(7);
  for (let i = 0; i < 2200; i++) {
    const y = r() * S, x = r() * S, l = 6 + r() * 30, horiz = r() < 0.5;
    g.strokeStyle = `rgba(${r() < 0.5 ? '120,95,60' : '255,250,235'},${0.03 + r() * 0.05})`;
    g.lineWidth = 0.6 + r();
    g.beginPath(); g.moveTo(x, y); horiz ? g.lineTo(x + l, y) : g.lineTo(x, y + l); g.stroke();
  }
  return new THREE.CanvasTexture(cv);
}

/** five flesh-pink pillars "holding up a breath of blue vapour" at the end of the world */
export function fivePillars(scene, { z = -330, spread = 34 } = {}) {
  const b = new Builder();
  const hs = [46, 57, 63, 58, 42];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * spread + (i - 2) * Math.abs(i - 2) * 3, zz = z + Math.abs(i - 2) ** 1.6 * 10, h = hs[i];
    b.lathe([[0, 0], [7.5, 0], [7, h * 0.3], [6.4, h * 0.8], [5.2, h * 0.97], [3.2, h], [0, h + 1]], { x, z: zz, ry: i, rz: (i - 2) * 0.04, color: '#d9a28f', mat: M.smooth, seg: 28 });
  }
  const r = rng(55);
  for (let i = 0; i < 18; i++) cloud(b, { x: r.range(-110, 110), y: r.range(2, 12), z: z + r.range(-10, 30), s: r.range(5, 9), ry: r.range(-0.3, 0.3), rand: r, color: '#f4efe4' });
  const g = b.build({ shadows: false });
  // a breath of blue vapour above
  const vapour = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color: '#9fc0c4', transparent: true, opacity: 0.35, depthWrite: false }));
  vapour.scale.set(110, 14, 30); vapour.position.set(0, 80, z);
  g.add(vapour);
  g.userData.setNight = (k) => { vapour.material.opacity = 0.35 * (1 - k); vapour.visible = k < 0.98; };
  scene.add(g);
  return g;
}

/** porcelain basin on a rosewood stand; the diorama sits at y = 0 (basin interior) */
export const BASIN_LIFT = 3.0;
const _basinCache = new Map();
export function basin(accent = '#d9a441', scale = 1) {
  const key = accent + scale;
  if (!_basinCache.has(key)) {
    const b = new Builder();
    // the profile runs outward then down the outside, so the lathe's faces point inward on the outer wall:
    // render the porcelain double-sided (back faces get flipped normals, so lighting stays right)
    const glaze = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, side: THREE.DoubleSide });
    b.lathe([[0, -0.03], [10.95, -0.03], [11.02, 0.2], [11.4, 0.3], [11.62, 0.2], [11.5, -0.5], [11.0, -1.3], [10.3, -1.6], [9.7, -1.66], [9.7, -1.9], [0, -1.9]], { color: C.celadon, mat: glaze, seg: 96 });
    b.torus(11.48, 0.06, { y: -0.35, rx: Math.PI / 2, color: accent, mat: glaze, ts: 96 });
    // rosewood stand
    b.cyl(10.2, 10.2, 0.3, { y: -2.24, color: '#3a1f17', mat: M.lacquer, seg: 64 });   // top at -1.94, clear of the basin bottom
    b.torus(10.2, 0.08, { y: -1.98, rx: Math.PI / 2, color: '#4a2a1d', mat: M.lacquer, ts: 64 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.box(1.2, 0.8, 0.9, { x: Math.cos(a) * 9.1, y: -BASIN_LIFT, z: Math.sin(a) * 9.1, ry: -a, color: '#33190f', mat: M.lacquer });
    }
    _basinCache.set(key, b.build());
  }
  const g = _basinCache.get(key).clone();
  g.scale.setScalar(scale);
  return g;
}

/**
 * Journey layout: 44 basins snake in 4 rows of 11 (east → west, near → far),
 * Vulture Peak alone beyond the last row.
 */
export function journeyLayout(n) {
  const COLS = 11, DX = 30, DZ = 38, pts = [];
  for (let i = 0; i < n - 1; i++) {
    const row = Math.floor(i / COLS), col = i % COLS;
    const c = row % 2 === 0 ? col : COLS - 1 - col;
    // a meandering road rather than a grid
    pts.push(new THREE.Vector3((COLS - 1) / 2 * DX - c * DX + Math.sin(i * 1.7) * 3, 0, 60 - row * DZ + Math.sin(c * 0.9 + row * 1.3) * 7));
  }
  pts.push(new THREE.Vector3(0, 0, 60 - 4 * DZ - 40));
  return pts;
}

/** golden road through the basins with a pulse travelling west */
export function routeThread(points) {
  const pts = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    pts.push(new THREE.Vector3(p.x, 0.25, p.z));
    const q = points[i + 1];
    if (q && Math.abs(q.z - p.z) > 1 && i < points.length - 2) {
      // row turn: swing outside the row end
      const sx = Math.sign(p.x) || 1;
      pts.push(new THREE.Vector3(p.x + sx * 16, 0.25, (p.z + q.z) / 2));
    }
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, pts.length * 24, 0.55, 6, false);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, fogColor: { value: HORIZON }, fogNear: { value: 260 }, fogFar: { value: 1500 } },
    fog: true,
    vertexShader: `varying vec2 vUv; varying float vD;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv;
      #include <fog_vertex>
      }`.replace('#include <fog_vertex>', 'vFogDepth = -mv.z;'),
    fragmentShader: `uniform float uTime; uniform float uNight; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main(){
        float p = fract(vUv.x * 6.0 - uTime * 0.05);
        float pulse = smoothstep(0.0, 0.02, p) * (1.0 - smoothstep(0.02, 0.12, p));
        vec3 base = vec3(0.78, 0.58, 0.24);
        // at night bloom is stronger and its threshold lower: keep the road under it, let only the pulse glow
        vec3 col = base * (1.0 - 0.55 * uNight) + vec3(1.6, 1.2, 0.5) * pulse * (1.0 - 0.3 * uNight);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  return { mesh: new THREE.Mesh(geo, mat), mat, curve };
}

/** low drifting mist between the basins (云海), as soft particles */
export function mistField(scene, points) {
  const r = rng(3);
  const N = 420;
  const puffs = softPuffs(N, { color: '#f7f2e8', opacity: 0.4, nearFade: [25, 90] });
  const data = [];
  for (let i = 0; i < N; i++) {
    const base = points[Math.floor(r() * points.length)];
    const a = r() * Math.PI * 2, d = 15 + r() * 22;
    const x = base.x + Math.cos(a) * d, z = base.z + Math.sin(a) * d;
    if (points.some((p) => Math.hypot(p.x - x, p.z - z) < 14)) { i--; continue; }   // keep clear of the basins
    data.push({ x, z, y: 0.3 + r() * 1.2, s: 8 + r() * 12, ph: r() * 10 });
  }
  const update = (t) => {
    for (let i = 0; i < N; i++) {
      const m = data[i];
      puffs.set(i, m.x + Math.sin(t * 0.03 + m.ph) * 4, m.y, m.z + Math.cos(t * 0.025 + m.ph) * 3, m.s, 0.6 + 0.4 * Math.sin(t * 0.1 + m.ph));
    }
    puffs.commit();
  };
  update(0);
  scene.add(puffs.points);
  const DAYC = new THREE.Color('#f7f2e8'), NIGHTC = new THREE.Color('#465069');
  const setNight = (k) => { puffs.mat.uniforms.uColor.value.copy(DAYC).lerp(NIGHTC, k); puffs.mat.uniforms.uOpacity.value = 0.4 - 0.12 * k; };
  return { update, setNight };
}
