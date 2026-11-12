// 鹰愁涧 — 蛇盘山 split by a gorge so sheer the eagles despair of it; a torrent pours from a cleft at
// the back and runs out between the walls. The white dragon (小白龙), who has just swallowed the
// horse, rises out of the water in one long sinuous arc over the pilgrims on the ledge. Loop of 36 s:
// he coils up, hangs in the air, sweeps down to the ledge as Guanyin appears on her cloud — and
// dissolves in mist into the white horse standing beside Tang Seng; then the horse fades, the
// water stills, and the dragon rises again.
import { THREE, Builder, M, C, terrain, peak, pine, rock, figure, horse, qinglv, fbm, noise2, smooth, clamp, lerp, setInst, softPuffs } from '../kit.js';
import { nightDim } from './_c_util.js';
import { dynTube, pathLUT, instBasis, placeObj, bodhisattvaOnCloud, birdGeo, flowWater } from './_b_kit.js';

const CYCLE = 36;
const WATER = 0.55;
const gx = (z) => 0.7 * Math.sin(z * 0.33 + 0.4) - 0.2;           // gorge centreline

function ground(x, z) {
  const r = Math.hypot(x, z);
  const d = Math.abs(x - gx(z));
  const n = fbm(x * 0.3 + 7, z * 0.3 - 2, 4);
  const h = smooth(0.8, 2.4, d) * (1.0 + 1.6 * n) * smooth(10.4, 8.2, r) + smooth(0.9, 1.8, d) * 0.6;
  return 0.15 + h;
}
const H_AT = (z) => lerp(9.8, 3.0, smooth(-7, 7.5, z));

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pal = qinglv(3);
  const bed = new THREE.Color('#2a3d40');
  terrain(b, { R: 10.5, rings: 40, segs: 140, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < WATER + 0.05 ? bed : pal(x, y, z, nx, ny, nz)) });

  // the ledge where the pilgrims stand (right wall, near end): a flat-topped buttress
  const LEDGE = [3.05, 5.0], ly = 3.25;
  peak(b, { x: LEDGE[0], y: ground(...LEDGE) - 0.3, z: LEDGE[1], r: 1.55, h: ly - ground(...LEDGE) + 0.3, taper: 0.12, lean: 0, flatTop: 1, steps: 2, rand: rng, palette: qinglv(ly + 1, { base: 0 }) });

  // the gorge walls: ranks of sheer columns, low at the front, towering at the back (蛇盘山)
  const tops = [];
  for (const side of [-1, 1]) for (let row = 0; row < 2; row++) {
    for (let z = -7.6 + row * 0.6; z < 8.4; z += 0.95 + rng() * 0.35) {
      const r = (row ? 1.05 : 0.85) + rng() * 0.4;
      const x = gx(z) + side * (1.15 + r * 0.75 + row * 1.8 + rng() * 0.3);
      if (Math.hypot(x, z) > 9.7 - r * 0.6) continue;
      if (side > 0 && z > 3.4 && z < 6.8 && row === 0) continue;
      if (row === 0 && z > 6.6) continue;                       // open mouth of the gorge
      if (side > 0 && Math.hypot(x - LEDGE[0], z - LEDGE[1]) < 2.4) continue;
      const h = H_AT(z) * (row ? 0.55 + rng() * 0.6 : 0.8 + rng() * 0.35) * smooth(10.6, 7.5, Math.hypot(x, z));
      if (h < 2.6) continue;
      const y = ground(x, z) - 0.4;
      const la = Math.atan2(0, -side);   // lean a little over the water
      tops.push(peak(b, { x, y, z, r, h, lean: 0.05 + rng() * 0.05, leanDir: la + rng.range(-0.6, 0.6), taper: 0.25 + rng() * 0.25, steps: 3, rand: rng, flatTop: rng() < 0.4 ? 1 : 0, palette: qinglv(h + 1.5, { base: y }) }));
    }
  }
  // the cleft of the falls at the back
  const LIPZ = -6.6, LIPY = 8.4;
  peak(b, { x: gx(LIPZ), y: 0, z: LIPZ - 0.4, r: 1.5, h: LIPY, taper: 0.1, lean: 0, flatTop: 1, steps: 3, rand: rng, palette: qinglv(LIPY + 2) });
  for (const [x, z, r, h] of [[-3.9, -6.6, 1.2, 4.8], [3.2, -7.6, 1.3, 5.6], [0.6, -8.6, 1.0, 3.6]]) {
    const y = H_AT(z) * 0.95;
    tops.push(peak(b, { x, y: y - 0.5, z, r, h, lean: 0.14, rand: rng, palette: qinglv(h + y, { base: 0 }) }));
  }
  for (let i = 0; i < tops.length; i++) {
    if (rng() > 0.4) continue;
    const [x, y, z] = tops[i];
    pine(b, { x, y: y - 0.25, z, h: 0.8 + rng() * 0.6, r: rng, lean: 0.45 });
  }
  for (let i = 0; i < 14; i++) {
    const [x, z] = rng.inDisc(9.2, 4);
    if (Math.abs(x - gx(z)) < 2 || Math.hypot(x - 3.05, z - 5) < 1.8) continue;
    pine(b, { x, y: ground(x, z) - 0.05, z, h: 0.9 + rng() * 0.7, r: rng, lean: 0.3 });
  }
  for (let i = 0; i < 16; i++) {
    const [x, z] = rng.inDisc(9.6, 5);
    if (Math.abs(x - gx(z)) < 1.6) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.25 + rng() * 0.4, h: 0.4 + rng() * 0.6, rand: rng, palette: qinglv(1.5, { base: ground(x, z) - 0.3 }) });
  }
  // boulders in the torrent
  for (let i = 0; i < 9; i++) {
    const z = rng.range(-4.5, 9), x = gx(z) + rng.range(-0.8, 0.8);
    rock(b, { x, y: 0.2, z, r: 0.2 + rng() * 0.3, h: 0.6 + rng() * 0.4, rand: rng, palette: qinglv(1.4, { wet: 1 }) });
  }

  figure(b, 'monk', { x: LEDGE[0] + 0.15, y: ly, z: LEDGE[1] + 0.35, ry: -1.9, s: 1.25 });
  figure(b, 'wukong', { x: LEDGE[0] - 0.75, y: ly, z: LEDGE[1] + 0.25, ry: -2.6, pose: 'staff', s: 1.55 });
  // the luggage, set down where the horse was swallowed
  b.box(0.3, 0.22, 0.24, { x: LEDGE[0] + 0.7, y: ly, z: LEDGE[1] + 0.6, ry: 0.4, color: '#7a6a4a', mat: M.cloth });
  b.box(0.26, 0.18, 0.2, { x: LEDGE[0] + 0.9, y: ly, z: LEDGE[1] + 0.25, ry: -0.3, color: '#5b6e5a', mat: M.cloth });
  object.add(b.build());

  /* ------------------------------------------------------ water --- */
  const wmat = flowWater({ deep: '#1f4b55', light: '#4f8890', foam: '#c9dcdc', dir: [0.05, 1], speed: 2.2, scale: 1.1 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(10.4, 72), wmat);
  water.rotation.x = -Math.PI / 2; water.position.y = WATER;
  object.add(water);

  // the falls from the cleft at the back
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uK: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime, uK; varying vec2 vUv; float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
      void main(){ float col = floor(vUv.x * 30.0); float s = fract(vUv.y * (2.0 + h(col) * 2.0) + uTime * (0.8 + h(col + 3.0) * 0.6) + h(col + 7.0));
        float streak = smoothstep(0.0, 0.5, s) * (1.0 - smoothstep(0.5, 1.0, s));
        float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
        gl_FragColor = vec4(mix(vec3(0.55, 0.74, 0.76), vec3(0.96, 0.98, 0.97), streak) * uK, (0.35 + 0.55 * streak) * edge); }`,
  });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.3, LIPY - WATER, 1, 8), fallMat);
  fall.position.set(gx(LIPZ), (LIPY + WATER) / 2, LIPZ + 1.25);
  object.add(fall);

  /* -------------------------------------------------- the dragon --- */
  const PATH = pathLUT([
    [gx(-1.6), 0.0, -1.6], [gx(-0.4), WATER, -0.4], [0.4, 3.0, 0.3], [-0.4, 6.5, 0.8], [-2.3, 9.8, 0.6], [-2.6, 12.4, -0.6],
    [-0.8, 13.8, -1.2], [1.8, 13.6, -0.6], [3.6, 11.8, 0.6], [4.0, 9.0, 2.2], [3.0, 6.6, 3.6], [3.0, ly + 1.4, 3.9], [3.3, ly + 0.8, 4.4],
], 600);
  const BODY = 15, NR = 96, RS = 12;
  const scaleCol = (s, j) => {
    const a = j * Math.PI * 2;
    const belly = smooth(-0.2, -0.75, Math.cos(a));            // underside: pale gold plates
    const plate = (Math.floor(s * 140) % 2) ? 1 : 0.9;
    const scale = ((Math.floor(s * 90) + Math.floor(j * 12)) % 2) ? 1 : 0.88;
    const c = new THREE.Color('#f3f1ea').lerp(new THREE.Color('#c9d6db'), 0.35 * Math.max(0, Math.cos(a)));
    c.multiplyScalar(scale);
    c.lerp(new THREE.Color('#e6cf8e').multiplyScalar(plate), belly);
    return c;
  };
  const body = dynTube(NR, RS, { color: scaleCol, material: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.15, emissive: '#2a3a40', emissiveIntensity: 0.25 }) });
  object.add(body.mesh);
  const radiusAt = (s) => 0.5 * (s < 0.06 ? lerp(0.7, 1, s / 0.06) : Math.pow(1 - (s - 0.06) / 0.94, 0.75)) + 0.02;

  // head (built facing +z, dorsal +y)
  const head = new THREE.Group();
  {
    const hb = new Builder();
    const W = '#f4f2ec', G = '#e3c47a';
    hb.sphere(0.42, { sx: 0.95, sy: 0.75, sz: 1.1, color: W, mat: M.smooth });                 // skull
    hb.box(0.46, 0.26, 0.62, { y: -0.1, z: 0.45, color: W, mat: M.smooth });                    // upper snout
    hb.sphere(0.2, { y: 0.0, z: 0.8, sx: 1.3, sy: 0.8, color: W, mat: M.smooth });              // nose
    hb.box(0.38, 0.1, 0.56, { y: -0.32, z: 0.4, rx: 0.32, color: G, mat: M.smooth });           // lower jaw, open
    for (const sx of [-1, 1]) {
      hb.sphere(0.07, { x: sx * 0.26, y: 0.12, z: 0.25, color: C.fireCore, mat: M.glow, glow: 2.2 });   // eyes
      hb.sphere(0.1, { x: sx * 0.22, y: 0.2, z: 0.22, sx: 1.4, sy: 0.5, color: W, mat: M.smooth });     // brow
      // antler horns
      const h0 = [sx * 0.18, 0.25, -0.1], h1 = [sx * 0.32, 0.6, -0.45], h2 = [sx * 0.38, 0.75, -0.95];
      hb.tube([h0, h1, h2], (t) => 0.06 * (1 - t * 0.75), { color: G, mat: M.smooth, radial: 6, segs: 10 });
      hb.tube([h1, [sx * 0.5, 0.88, -0.45], [sx * 0.55, 1.0, -0.6]], (t) => 0.035 * (1 - t * 0.7), { color: G, mat: M.smooth, radial: 5, segs: 6 });
      // long whiskers
      hb.tube([[sx * 0.18, -0.05, 0.9], [sx * 0.6, 0.0, 0.85], [sx * 1.0, -0.3, 0.4], [sx * 1.15, -0.7, -0.1], [sx * 1.05, -1.0, -0.6]], (t) => 0.025 * (1 - t * 0.8), { color: W, mat: M.smooth, radial: 4, segs: 16 });
      // jowl fins / mane
      for (let k = 0; k < 4; k++) hb.cone(0.08, 0.5 - k * 0.06, { x: sx * 0.33, y: -0.05 + k * 0.08, z: -0.15 - k * 0.08, rx: -1.9 + k * 0.15, rz: sx * (0.9 - k * 0.12), color: k % 2 ? '#dfe7ea' : '#cfdde2', mat: M.smooth, seg: 5 });
      // fangs
      hb.cone(0.03, 0.12, { x: sx * 0.16, y: -0.25, z: 0.68, rx: Math.PI, color: C.white, mat: M.smooth, seg: 5 });
    }
    // flowing beard under the chin
    for (let k = 0; k < 5; k++) hb.cone(0.05, 0.36, { x: (k - 2) * 0.06, y: -0.4, z: 0.15 - k * 0.04, rx: Math.PI - 0.6, color: '#e7ecef', mat: M.smooth, seg: 5 });
    head.add(hb.build());
  }
  object.add(head);

  // dorsal fins and four clawed legs (instanced, placed along the body each frame)
  const NF = 34;
  const finG = new THREE.ConeGeometry(0.12, 0.36, 4); finG.translate(0, 0.18, 0); finG.rotateX(-0.5);
  const fins = new THREE.InstancedMesh(finG, new THREE.MeshStandardMaterial({ color: '#d8e4e8', roughness: 0.45, emissive: '#3a4a50', emissiveIntensity: 0.2 }), NF);
  fins.castShadow = true; fins.frustumCulled = false;
  object.add(fins);
  const legG = (() => {
    const lb = new Builder();
    lb.tube([[0, 0, 0], [0.25, -0.12, 0.08], [0.42, -0.35, 0.2]], (t) => 0.07 * (1 - t * 0.4), { color: '#eef1ee', mat: M.smooth, radial: 6, segs: 8 });
    for (let k = -1; k <= 1; k++) lb.cone(0.025, 0.16, { x: 0.44, y: -0.38, z: 0.22 + k * 0.05, rx: 1.2, rz: k * 0.4, color: C.gold, mat: M.smooth, seg: 4 });
    lb.cone(0.05, 0.22, { x: 0.12, y: 0.02, z: -0.06, rx: -2.2, color: '#d8e4e8', mat: M.smooth, seg: 4 });
    return lb.merged();
  })();
  const legs = new THREE.InstancedMesh(legG, M.smooth, 4);
  legs.castShadow = true; legs.frustumCulled = false;
  object.add(legs);
  // flame-like tail tuft
  const tail = new THREE.Group();
  {
    const tb = new Builder();
    for (let k = 0; k < 5; k++) tb.cone(0.1, 0.7 - Math.abs(k - 2) * 0.12, { rx: -Math.PI / 2, ry: (k - 2) * 0.3, z: -0.05, color: k % 2 ? '#dbe6ea' : '#c4d4da', mat: M.smooth, seg: 5 });
    tail.add(tb.build());
  }
  object.add(tail);
  const LEG_S = [0.16, 0.16, 0.5, 0.5];

  // splash, mist, and the transformation cloud
  const SPL = 40, MIST = 46, POOF = 36;
  const splash = softPuffs(SPL, { color: '#f4f7f6', opacity: 0.85 });
  const mist = softPuffs(MIST, { color: '#e6eeee', opacity: 0.14 });
  const poof = softPuffs(POOF, { color: '#fbfaf5', opacity: 0.95 });
  object.add(splash.points, mist.points, poof.points);
  const mistP = Array.from({ length: MIST }, () => { const z = rng.range(-6, 9); return { z, x: gx(z) + rng.range(-1.2, 1.2), y: rng.range(1.2, 5), s: 1.0 + rng() * 1.6, ph: rng() }; });
  const ENTRY = [gx(-0.4), WATER, -0.4];

  // the white horse that he becomes
  const hb2 = new Builder();
  horse(hb2, { s: 1.3 });
  const steed = hb2.build();
  steed.position.set(LEDGE[0] + 0.3, ly, LEDGE[1] - 0.55);
  steed.rotation.y = -1.2;
  object.add(steed);

  // Guanyin on her cloud, who takes the pearl from his throat and says 变
  const guanyin = bodhisattvaOnCloud(rng, { s: 1.6, cloud: 0.6 });
  const GY = [5.6, 9.2, 3.0];
  guanyin.rotation.y = -1.0;
  object.add(guanyin);

  // eagles wheeling high above, unwilling to cross
  const NE = 5;
  const eagles = new THREE.InstancedMesh(birdGeo('#3a332c'), M.smooth, NE);
  object.add(eagles);

  /* ---------------------------------------------------- update --- */
  const pt = [0, 0, 0];
  const W_DEEP = wmat.uniforms.uDeep.value.clone(), W_LIGHT = wmat.uniforms.uLight.value.clone(), W_FOAM = wmat.uniforms.uFoam.value.clone();
  const dimPuffs = nightDim([splash, mist, poof], 0.55);   // unlit mist must not glow at night
  function update(t, dt, env) {
    dimPuffs(env?.night ?? 0);
    // the unlit torrent and falls would glare at night
    const wk = 1 - 0.5 * (env?.night ?? 0);
    fallMat.uniforms.uK.value = wk;
    wmat.uniforms.uDeep.value.copy(W_DEEP).multiplyScalar(wk); wmat.uniforms.uLight.value.copy(W_LIGHT).multiplyScalar(wk); wmat.uniforms.uFoam.value.copy(W_FOAM).multiplyScalar(wk);
    wmat.uniforms.uTime.value = t;
    fallMat.uniforms.uTime.value = t;
    const u = ((t / CYCLE) + 0.42) % 1;
    // head position along the path
    const L = PATH.length;
    const rise = smooth(0.04, 0.34, u), sweep = smooth(0.56, 0.74, u);
    // the head waits just under the surface, so it breaks the water while the horse is still on the ledge
    const hd = lerp(1.0, L * 0.62, rise) + 3.2 * smooth(0.03, 0.14, u) * (1 - sweep) + (L * 0.38 - 0.3) * sweep + Math.sin(t * 0.4) * 0.3 * (rise - sweep);
    const dissolve = smooth(0.74, 0.84, u);     // tail → head
    const visible = u > 0.03 && u < 0.86;
    body.mesh.visible = head.visible = fins.visible = legs.visible = tail.visible = visible;
    if (visible) {
      for (let i = 0; i < NR; i++) {
        const s = i / (NR - 1);
        PATH.sample(hd - s * BODY, pt);
        // a slow wave travelling down the body
        const w = Math.sin(s * 11 - t * 1.6) * 0.22 * smooth(0, 0.2, s);
        const wy = Math.cos(s * 9 - t * 1.3) * 0.15 * smooth(0, 0.2, s);
        const x = pt[0] + w, y = Math.max(0.12, pt[1] + wy), z = pt[2] - w * 0.4;
        const sub = smooth(WATER - 0.3, WATER + 0.12, y);
        const gone = 1 - smooth(1 - dissolve * 1.25, 1.2 - dissolve * 1.25, s);
        body.ring(i, x, y, z, radiusAt(s) * sub * gone + 0.0001);
      }
      body.commit();
      const T = body.T, U = body.U, S = body.S, cx = body.cx, cy = body.cy, cz = body.cz, rr = body.rr;
      const hs = rr[0] / radiusAt(0);
      placeObj(head, cx[0] + T[0] * 0.2, cy[0] + T[1] * 0.2, cz[0] + T[2] * 0.2, T[0], T[1], T[2], U[0], U[1], U[2], Math.max(0.001, hs));
      for (let f = 0; f < NF; f++) {
        const i = 3 + Math.floor((f / NF) * (NR - 8));
        const k = rr[i] / Math.max(0.02, radiusAt(i / (NR - 1)));
        instBasis(fins, f, cx[i] + U[i * 3] * rr[i] * 0.85, cy[i] + U[i * 3 + 1] * rr[i] * 0.85, cz[i] + U[i * 3 + 2] * rr[i] * 0.85,
          -T[i * 3], -T[i * 3 + 1], -T[i * 3 + 2], U[i * 3], U[i * 3 + 1], U[i * 3 + 2], Math.max(0.001, (0.5 + rr[i] * 1.6) * k));
      }
      fins.instanceMatrix.needsUpdate = true;
      for (let l = 0; l < 4; l++) {
        const i = Math.floor(LEG_S[l] * (NR - 1)), sd = l % 2 ? 1 : -1;
        const k = rr[i] / radiusAt(i / (NR - 1));
        const sw = Math.sin(t * 1.2 + l) * 0.3;
        const px = cx[i] + S[i * 3] * sd * rr[i] * 0.8 - U[i * 3] * rr[i] * 0.4;
        const py = cy[i] + S[i * 3 + 1] * sd * rr[i] * 0.8 - U[i * 3 + 1] * rr[i] * 0.4;
        const pz = cz[i] + S[i * 3 + 2] * sd * rr[i] * 0.8 - U[i * 3 + 2] * rr[i] * 0.4;
        // local +x = U × fwd; choose fwd so it points out toward this side
        const fs = -sd;
        instBasis(legs, l, px, py, pz, fs * T[i * 3] + U[i * 3] * sw, fs * T[i * 3 + 1] + U[i * 3 + 1] * sw, fs * T[i * 3 + 2] + U[i * 3 + 2] * sw, U[i * 3], U[i * 3 + 1], U[i * 3 + 2], 1.6 * k + 0.0001);
      }
      legs.instanceMatrix.needsUpdate = true;
      const e = NR - 1, kt = rr[e - 2] / radiusAt((e - 2) / (NR - 1));
      placeObj(tail, cx[e], cy[e], cz[e], -T[e * 3], -T[e * 3 + 1], -T[e * 3 + 2], U[e * 3], U[e * 3 + 1], U[e * 3 + 2], Math.max(0.001, kt * 1.4));
    }
    // splash where he breaks the surface
    const sk = smooth(0.03, 0.08, u) * (1 - smooth(0.36, 0.48, u));
    for (let i = 0; i < SPL; i++) {
      const p = (t * 0.45 + i / SPL) % 1, a = i * 2.39;
      splash.set(i, ENTRY[0] + Math.cos(a) * (0.3 + p * 1.1), WATER + 0.1 + Math.sin(Math.PI * p) * 1.6 * (0.6 + (i % 3) * 0.3), ENTRY[2] + Math.sin(a) * (0.3 + p * 1.1), 0.25 + p * 0.6, sk * (1 - p));
    }
    splash.commit();
    for (let i = 0; i < MIST; i++) {
      const m = mistP[i], z = ((m.z + 6 + t * 0.12 + m.ph * 3) % 15) - 6;
      mist.set(i, gx(z) + (m.x - gx(m.z)), m.y + Math.sin(t * 0.3 + i) * 0.2, z, m.s, 0.55 * Math.sin(Math.PI * clamp((z + 6) / 15)));
    }
    mist.commit();
    // transformation: a burst of white cloud on the ledge; the horse appears, and later fades back
    // (and again at the start of the loop, when the horse melts back into mist as the dragon rises)
    const pk = smooth(0.72, 0.8, u) * (1 - smooth(0.84, 0.92, u)) + smooth(0.06, 0.11, u) * (1 - smooth(0.17, 0.24, u)) * 0.8;
    for (let i = 0; i < POOF; i++) {
      const a = i * 2.39, p = (i / POOF + t * 0.05) % 1;
      poof.set(i, steed.position.x + Math.cos(a) * (0.3 + p * 1.0), steed.position.y + 0.3 + p * 1.6, steed.position.z + Math.sin(a) * (0.3 + p * 0.8), 0.7 + p * 0.9, pk * (1 - p * 0.6));
    }
    poof.commit();
    const hk = Math.min(1, smooth(0.76, 0.84, u) + (1 - smooth(0.12, 0.19, u)));
    steed.visible = hk > 0.01;
    steed.scale.setScalar(Math.max(0.001, hk));
    const gk = smooth(0.58, 0.66, u) * (1 - smooth(0.9, 0.97, u));
    guanyin.visible = gk > 0.01;
    guanyin.scale.setScalar(Math.max(0.001, gk));
    guanyin.position.set(GY[0], GY[1] + Math.sin(t * 0.7) * 0.15 + (1 - gk) * 1.5, GY[2]);
    // eagles
    for (let i = 0; i < NE; i++) {
      const a = t * (0.12 + i * 0.015) + i * 1.3, R = 3.5 + i * 0.9;
      const x = Math.cos(a) * R, z = Math.sin(a) * R * 0.8 - 2, y = 13.2 + Math.sin(t * 0.5 + i) * 0.4 + (i % 2) * 0.8;
      setInst(eagles, i, x, y, z, -a, 1.5 + (i % 3) * 0.2, 0, Math.sin(t * 0.6 + i) * 0.25 + 0.2);
    }
    eagles.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { object, update };
}
