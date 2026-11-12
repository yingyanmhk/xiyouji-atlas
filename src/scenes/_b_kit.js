// Private helpers for builder B's scenes: an animated tube (dragon bodies), basis-placed instances,
// a bodhisattva figure, extra mortal figures, a skeleton, simple birds and a streaky water shader.
import { THREE, Builder, M, C, figure, cloud, lerp } from '../kit.js';

/* ------------------------------------------------------------ dynamic tube -- */
// N rings × R sides; call ring(i, x, y, z, r) for every ring, then commit(). Frames use the
// projection of world-up onto each ring's plane, so angle 0 is the dorsal side, angle π the belly.
export function dynTube(N, R, { material, color = (i, j) => C.white } = {}) {
  const V = N * (R + 1);
  const pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), col = new Float32Array(V * 3);
  const idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < R; j++) {
    const a = i * (R + 1) + j, b = a + 1, c = a + R + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) for (let j = 0; j <= R; j++) {
    tmp.set(color(i / (N - 1), j / R));
    col.set([tmp.r, tmp.g, tmp.b], (i * (R + 1) + j) * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, material || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1 }));
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  const cx = new Float32Array(N), cy = new Float32Array(N), cz = new Float32Array(N), rr = new Float32Array(N);
  // per-ring frame (exposed): T tangent (toward ring 0 = head), U dorsal, S side
  const T = new Float32Array(N * 3), U = new Float32Array(N * 3), S = new Float32Array(N * 3);
  const cosA = new Float32Array(R + 1), sinA = new Float32Array(R + 1);
  for (let j = 0; j <= R; j++) { cosA[j] = Math.cos((j / R) * Math.PI * 2); sinA[j] = Math.sin((j / R) * Math.PI * 2); }
  return {
    mesh, N, R, cx, cy, cz, rr, T, U, S,
    ring(i, x, y, z, r) { cx[i] = x; cy[i] = y; cz[i] = z; rr[i] = r; },
    commit() {
      let pux = 0, puy = 1, puz = 0;
      for (let i = 0; i < N; i++) {
        const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
        let tx = cx[a] - cx[b], ty = cy[a] - cy[b], tz = cz[a] - cz[b];
        let l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
        // up projected onto the plane; blend with previous to stay stable near vertical
        let ux = pux, uy = puy + 0.6, uz = puz;
        const d = ux * tx + uy * ty + uz * tz;
        ux -= d * tx; uy -= d * ty; uz -= d * tz;
        l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l;
        pux = ux; puy = uy; puz = uz;
        const sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux;
        T[i * 3] = tx; T[i * 3 + 1] = ty; T[i * 3 + 2] = tz;
        U[i * 3] = ux; U[i * 3 + 1] = uy; U[i * 3 + 2] = uz;
        S[i * 3] = sx; S[i * 3 + 1] = sy; S[i * 3 + 2] = sz;
        for (let j = 0; j <= R; j++) {
          const nx = cosA[j] * ux + sinA[j] * sx, ny = cosA[j] * uy + sinA[j] * sy, nz = cosA[j] * uz + sinA[j] * sz;
          const k = (i * (R + 1) + j) * 3;
          pos[k] = cx[i] + nx * rr[i]; pos[k + 1] = cy[i] + ny * rr[i]; pos[k + 2] = cz[i] + nz * rr[i];
          nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
    },
  };
}

/* ----------------------------------------------- basis-placed transforms -- */
const _bm = new THREE.Matrix4(), _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
/** matrix whose local +z = fwd, +y = up (both unit, roughly orthogonal), at p, uniform scale s */
export function basisMatrix(out, px, py, pz, fx, fy, fz, ux, uy, uz, s = 1, sy = s, sz = s) {
  _bz.set(fx, fy, fz).normalize();
  _by.set(ux, uy, uz);
  _bx.crossVectors(_by, _bz).normalize();
  _by.crossVectors(_bz, _bx);
  out.makeBasis(_bx.multiplyScalar(s), _by.multiplyScalar(sy), _bz.multiplyScalar(sz));
  out.setPosition(px, py, pz);
  return out;
}
export function placeObj(obj, px, py, pz, fx, fy, fz, ux, uy, uz, s = 1) {
  basisMatrix(_bm, px, py, pz, fx, fy, fz, ux, uy, uz, 1);
  obj.quaternion.setFromRotationMatrix(_bm);
  obj.position.set(px, py, pz);
  obj.scale.setScalar(s);
}
export function instBasis(mesh, i, px, py, pz, fx, fy, fz, ux, uy, uz, s = 1, sy = s, sz = s) {
  mesh.setMatrixAt(i, basisMatrix(_bm, px, py, pz, fx, fy, fz, ux, uy, uz, s, sy, sz));
}

/* ------------------------------------------------------------ path LUT -- */
/** arc-length lookup table along a CatmullRom through pts; sample(d, out) for distance d (clamped) */
export function pathLUT(pts, n = 400, tension = 0.5) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tension);
  const L = curve.getLength();
  const P = new Float32Array((n + 1) * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { curve.getPointAt(i / n, v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
  return {
    length: L,
    sample(d, out) {
      const f = Math.min(n, Math.max(0, (d / L) * n)), i = Math.min(n - 1, Math.floor(f)), k = f - i;
      out[0] = lerp(P[i * 3], P[i * 3 + 3], k); out[1] = lerp(P[i * 3 + 1], P[i * 3 + 4], k); out[2] = lerp(P[i * 3 + 2], P[i * 3 + 5], k);
      // extrapolate linearly before the start / after the end
      if (d < 0) { const dx = P[3] - P[0], dy = P[4] - P[1], dz = P[5] - P[2], sl = L / n; out[0] += dx * d / sl; out[1] += dy * d / sl; out[2] += dz * d / sl; }
      return out;
    },
  };
}

/* ------------------------------------------------------------- figures -- */
/** 菩萨: long white robe, hood, gold necklace, halo; vase in the left hand, willow sprig in the right. ~0.82 tall at s=1 */
export function bodhisattva(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, robe = C.white, inner = '#e7d7b0', halo = true, vase = true, staff = false, hood = true } = {}) {
  b.push({ x, y, z, ry, s });
  b.lathe([[0, 0], [0.19, 0], [0.2, 0.04], [0.15, 0.2], [0.11, 0.42], [0.09, 0.52], [0, 0.53]], { color: robe, mat: M.cloth, seg: 16 });
  b.lathe([[0, 0.05], [0.13, 0.05], [0.1, 0.3], [0.085, 0.5], [0, 0.5]], { z: 0.035, sz: 0.8, color: inner, mat: M.cloth, seg: 12 });
  b.cyl(0.09, 0.12, 0.12, { y: 0.47, color: robe, mat: M.cloth, seg: 12 });               // shoulders / cape
  b.torus(0.085, 0.01, { y: 0.56, rx: Math.PI / 2 + 0.35, z: 0.02, color: C.gold, mat: M.metal, ts: 14 }); // 璎珞
  b.sphere(0.065, { y: 0.66, color: '#f0d6b6', mat: M.smooth });
  if (hood) {
    b.sphere(0.085, { y: 0.69, z: -0.015, sx: 1.0, sy: 1.15, color: robe, mat: M.cloth, ws: 12, hs: 8 });
    b.sphere(0.06, { y: 0.66, z: 0.03, sx: 0.95, sy: 1.0, sz: 0.7, color: '#f0d6b6', mat: M.smooth });
  }
  b.cone(0.045, 0.1, { y: 0.74, color: hood ? robe : C.ink, mat: M.cloth, seg: 8 });  // top-knot
  b.sphere(0.012, { y: 0.69, z: 0.085, color: C.cinnabar, mat: M.smooth, ws: 5, hs: 4 }); // 白毫
  // sleeves
  for (const sx of [-1, 1]) b.cyl(0.03, 0.055, 0.22, { x: sx * 0.11, y: 0.3, z: 0.06, rx: -0.9, rz: sx * 0.15, color: robe, mat: M.cloth, seg: 8 });
  if (vase) {
    b.lathe([[0, 0], [0.025, 0], [0.035, 0.03], [0.02, 0.07], [0.008, 0.1], [0.012, 0.12], [0, 0.12]], { x: -0.11, y: 0.3, z: 0.2, color: C.white, mat: M.porcelain, seg: 10 });
    b.tube([[0.11, 0.3, 0.2], [0.13, 0.42, 0.23], [0.12, 0.5, 0.26], [0.15, 0.55, 0.28]], 0.005, { color: C.leaf, mat: M.smooth, radial: 3 });
    for (let i = 0; i < 5; i++) b.sphere(0.02, { x: 0.12 + i * 0.006, y: 0.4 + i * 0.03, z: 0.22 + i * 0.012, sx: 0.4, sy: 1.6, sz: 0.4, rz: 0.6, color: '#6aa86a', mat: M.smooth, ws: 5, hs: 4 });
  }
  if (staff) { // 飞龙宝杖 / 禅杖
    b.cyl(0.008, 0.008, 1.0, { x: 0.15, y: 0.02, z: 0.12, color: C.gold, mat: M.metal, seg: 5 });
    b.torus(0.05, 0.01, { x: 0.15, y: 1.04, z: 0.12, color: C.gold, mat: M.metal, ts: 12 });
  }
  if (halo) b.torus(0.12, 0.008, { y: 0.68, z: -0.07, color: '#ffd98a', mat: M.glow, glow: 1.6, ts: 28 });
  b.pop();
}

/** a bodhisattva standing on a 祥云 — returns a Group */
export function bodhisattvaOnCloud(rand, opts = {}) {
  const b = new Builder();
  cloud(b, { s: opts.cloud ?? 0.42, y: -0.06, rand, puffs: 6, color: opts.cloudColor || C.white });
  bodhisattva(b, opts);
  return b.build();
}

/** mortal figures: 'girl' (with basket), 'oldwoman' (bent, stick), 'oldman' (white beard, beads) */
export function mortal(b, kind, { x = 0, y = 0, z = 0, ry = 0, s = 1, robe } = {}) {
  b.push({ x, y, z, ry, s });
  if (kind === 'girl') {
    figure(b, 'woman', { robe: robe || '#d9a0a6' });
    b.cyl(0.07, 0.05, 0.08, { x: 0.13, y: 0.24, z: 0.04, color: '#b89a5e', mat: M.wood, seg: 10, open: true });
    b.torus(0.06, 0.006, { x: 0.13, y: 0.34, z: 0.04, ry: Math.PI / 2, arc: Math.PI, color: '#8a6a3a', mat: M.wood, ts: 8 });
    for (let i = 0; i < 4; i++) b.sphere(0.022, { x: 0.12 + (i % 2) * 0.03, y: 0.32, z: 0.02 + (i >> 1) * 0.03, color: i % 2 ? '#e0d4a8' : '#c9b37a', mat: M.smooth, ws: 6, hs: 4 });
  } else if (kind === 'oldwoman') {
    b.push({ rx: 0.28 });
    figure(b, 'woman', { robe: robe || '#7d7a72' });
    b.sphere(0.056, { y: 0.66, z: -0.03, color: '#d8d8d4', mat: M.smooth }); // grey bun
    b.pop();
    b.cyl(0.008, 0.008, 0.62, { x: 0.13, z: 0.16, rz: -0.08, color: C.woodD, mat: M.wood, seg: 4 });
    b.sphere(0.02, { x: 0.1, y: 0.62, z: 0.16, color: C.woodD, mat: M.wood, ws: 5, hs: 4 });
  } else if (kind === 'bonze') {   // a temple monk: grey robe, shaven head
    const r2 = robe || '#6a655c';
    b.lathe([[0, 0], [0.13, 0], [0.12, 0.13], [0.08, 0.44], [0, 0.44]], { color: r2, mat: M.cloth, seg: 10 });
    b.cyl(0.075, 0.085, 0.12, { y: 0.42, color: r2, mat: M.cloth, seg: 8 });
    b.sphere(0.065, { y: 0.6, color: C.skin, mat: M.smooth });
  } else if (kind === 'daoist') {  // a young Daoist acolyte: blue-grey robe, hair in a top-knot
    const r2 = robe || '#5d7a86';
    b.lathe([[0, 0], [0.12, 0], [0.11, 0.12], [0.075, 0.4], [0, 0.4]], { color: r2, mat: M.cloth, seg: 10 });
    b.cyl(0.07, 0.08, 0.1, { y: 0.39, color: r2, mat: M.cloth, seg: 8 });
    b.sphere(0.06, { y: 0.55, color: C.skin, mat: M.smooth });
    b.sphere(0.035, { y: 0.62, color: C.ink, mat: M.smooth, ws: 6, hs: 4 });
    b.cyl(0.01, 0.01, 0.06, { y: 0.62, rz: Math.PI / 2, color: C.gold, mat: M.metal, seg: 4 });
  } else if (kind === 'oldman') {
    figure(b, 'villager', { robe: robe || '#8a8f8a', hat: '#e7e2d6' });
    b.cone(0.05, 0.16, { y: 0.5, z: 0.055, rx: Math.PI, color: '#f2efe6', mat: M.smooth, seg: 6 }); // white beard
    b.cyl(0.008, 0.008, 0.78, { x: 0.13, z: 0.1, color: C.woodD, mat: M.wood, seg: 4 });
    b.torus(0.06, 0.008, { y: 0.48, z: 0.07, rx: Math.PI / 2 - 0.4, color: '#5a3a24', mat: M.smooth, ts: 12 }); // beads
  }
  b.pop();
}

/** a white skeleton lying on its back along +z (~0.75 long at s=1) */
export function skeleton(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, color = '#efeae0' } = {}) {
  b.push({ x, y, z, ry, s });
  const m = { color, mat: M.smooth };
  b.sphere(0.07, { ...m, y: 0.06, z: 0.36, sz: 1.15 });
  b.box(0.06, 0.03, 0.05, { ...m, y: 0.02, z: 0.43 });
  for (let i = 0; i < 9; i++) b.sphere(0.018, { ...m, y: 0.035, z: 0.28 - i * 0.04, ws: 6, hs: 4 }); // spine
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) b.torus(0.07 - i * 0.006, 0.008, { ...m, x: sx * 0.035, y: 0.04, z: 0.25 - i * 0.035, ry: Math.PI / 2, arc: Math.PI * 0.85, rz: sx > 0 ? 0 : Math.PI, ts: 8, rs: 4 });
  b.sphere(0.06, { ...m, y: 0.03, z: -0.08, sx: 1.4, sy: 0.6, sz: 0.8 }); // pelvis
  for (const sx of [-1, 1]) {
    b.cyl(0.012, 0.012, 0.32, { ...m, x: sx * 0.05, y: 0.025, z: -0.12, rx: -Math.PI / 2 + 0.05, rz: sx * 0.08, seg: 5 });
    b.cyl(0.011, 0.011, 0.24, { ...m, x: sx * 0.12, y: 0.025, z: 0.24, rx: -Math.PI / 2 - 0.2, rz: sx * 0.35, seg: 5 });
  }
  b.pop();
}

/* ---------------------------------------------------------------- birds -- */
/** small gliding bird geometry (wings spread), for InstancedMesh */
export function birdGeo(color = C.ink) {
  const b = new Builder();
  b.sphere(0.06, { sz: 2.4, sx: 0.8, sy: 0.7, color, mat: M.smooth, ws: 8, hs: 5 });
  for (const sx of [-1, 1]) {
    b.box(0.34, 0.012, 0.11, { x: sx * 0.17, y: 0.01, rz: sx * 0.18, ry: sx * 0.15, color, mat: M.smooth });
    b.box(0.22, 0.01, 0.08, { x: sx * 0.42, y: 0.06, z: -0.03, rz: sx * -0.12, ry: sx * 0.35, color, mat: M.smooth });
  }
  b.box(0.1, 0.01, 0.12, { z: -0.17, color, mat: M.smooth });
  return b.merged();
}

/* ----------------------------------------------------- water shaders -- */
/** unlit flowing water; streaks run along +dir in world xz. */
export function flowWater({ deep = '#1d4752', light = '#6fa3a8', foam = '#f2f5f2', dir = [0, 1], speed = 1, opacity = 0.92, scale = 1, sand = 0 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: true,
    uniforms: { uTime: { value: 0 }, uDeep: { value: new THREE.Color(deep) }, uLight: { value: new THREE.Color(light) }, uFoam: { value: new THREE.Color(foam) },
      uDir: { value: new THREE.Vector2(...dir).normalize() }, uSpeed: { value: speed }, uOp: { value: opacity }, uScale: { value: scale }, uSand: { value: sand } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime, uSpeed, uOp, uScale, uSand; uniform vec3 uDeep, uLight, uFoam; uniform vec2 uDir; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz * uScale;
        vec2 d = uDir, q = vec2(dot(p, vec2(-d.y, d.x)), dot(p, d));
        float a = n(vec2(q.x * 2.2, q.y * 0.35 - uTime * uSpeed * 0.9));
        float b = n(vec2(q.x * 5.0 + 3.0, q.y * 0.8 - uTime * uSpeed * 1.6));
        float s = smoothstep(0.62, 0.9, a * 0.6 + b * 0.5);
        vec3 c = mix(uDeep, uLight, a * 0.7);
        float ripple = n(vec2(q.x * 1.3 - uTime * 0.2, q.y * 1.3 + uTime * 0.15));
        c = mix(c, uLight * 1.1, uSand * ripple * 0.5);
        c = mix(c, uFoam, s * (1.0 - uSand * 0.6));
        gl_FragColor = vec4(c, uOp);
      }`,
  });
}

/* ------------------------------------------------------------ palettes -- */
/** night rock: ink-indigo cliffs, dark blue-green on sky-facing faces */
export function nightRock(hmax, { base = 0 } = {}) {
  const cliff = [[0, '#2c2a30'], [0.4, '#2f3644'], [0.8, '#3a4658'], [1, '#46546a']];
  const ledge = [[0, '#2c3a3a'], [0.6, '#304a4a'], [1, '#3c5a5c']];
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = Math.min(1, Math.max(0, (y - base) / hmax));
    const j = (Math.sin(x * 12.9898 + z * 78.233 + y * 3.1) * 43758.5453) % 1 * 0.05;
    ramp4(cliff, t + j, out);
    const up = Math.min(1, Math.max(0, (ny - 0.45) / 0.35));
    if (up > 0) out.lerp(ramp4(ledge, t, tmp), up);
    if (ny < 0.12) out.multiplyScalar(0.8);
    return out;
  };
}
function ramp4(stops, t, out) {
  if (t <= stops[0][0]) return out.set(stops[0][1]);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
    return out.set(stops[i - 1][1]).lerp(new THREE.Color(stops[i][1]), k);
  }
  return out.set(stops[stops.length - 1][1]);
}

/* ---------------------------------------------------------------- flame -- */
/** a licking flame tongue (lathe) with baked hot→cool vertex colours, ~1.5 tall; for M.glow-like basic material */
export function flameGeo(twist = 0.09) {
  const g = new THREE.LatheGeometry([[0, 0], [0.3, 0.08], [0.34, 0.28], [0.24, 0.62], [0.13, 0.95], [0.05, 1.28], [0, 1.55]].map(([r, y]) => new THREE.Vector2(r, y)), 6);
  const P = g.attributes.position, col = new Float32Array(P.count * 3);
  const a = new THREE.Color(1.9, 1.05, 0.3), m = new THREE.Color(1.5, 0.45, 0.08), e = new THREE.Color(0.8, 0.14, 0.04), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i), t = Math.min(1, y / 1.5);
    P.setX(i, P.getX(i) + Math.sin(y * 3.2) * twist * y);
    if (t < 0.5) c.copy(a).lerp(m, t * 2); else c.copy(m).lerp(e, (t - 0.5) * 2);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** translucent fresnel dome / shell (additive) */
export function shellMat(color = '#ffd68a', { base = 0.05, rim = 0.6, power = 2.4 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uBase: { value: base }, uRim: { value: rim }, uPow: { value: power }, uK: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime, uBase, uRim, uPow, uK; uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow);
        float band = 0.5 + 0.5 * sin(vP.y * 9.0 - uTime * 2.0 + sin(atan(vP.z, vP.x) * 6.0) * 1.5);
        float a = (uBase + uRim * f) * (0.75 + 0.25 * band) * uK;
        gl_FragColor = vec4(uColor * a, a); }`,
  });
}
