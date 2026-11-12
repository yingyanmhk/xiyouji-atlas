// 花果山·水帘洞 — an island of blue-green needle peaks in the eastern sea. On the summit the
// immortal stone has split and leaks gold; below, a waterfall curtains the cave, and the Monkey
// King stands on the lip shading his eyes. Monkeys tumble among the peach trees.
import { THREE, Builder, M, C, peak, terrain, peachTree, pine, rock, cloud, figure, qinglv, fbm, smooth, setInst, softPuffs } from '../kit.js';

const SEA = 0.42;

function land(x, z) {
  const d = Math.hypot(x * 0.95, (z + 0.6) * 1.05);
  const n = fbm(x * 0.32 + 5, z * 0.32 + 2, 4);
  const edge = 8.2 + (n - 0.5) * 2.2;
  let h = smooth(edge, edge - 3.4, d) * (1.1 + 2.3 * n);
  h += smooth(1, -5, z) * smooth(edge, 2, d) * 2.0;                       // rises toward the back
  const cove = Math.exp(-((x * 0.8) ** 2 + ((z - 3.6) * 0.6) ** 2) / 2.2);  // pool below the falls
  const channel = Math.exp(-(x * x) / 0.9) * smooth(2.5, 5, z);            // stream out to sea
  h *= (1 - 0.95 * cove) * (1 - 0.85 * channel);
  return Math.max(0.05, h);
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  /* sea floor + island */
  b.cyl(10.9, 10.9, 0.04, { color: '#1f4a5a', seg: 64 });
  terrain(b, { R: 10.5, rings: 44, segs: 140, fn: land, palette: qinglv(5.5, { wet: 1 }) });

  /* the cliff of the falls: a broad flat-topped mesa */
  b.push({ x: 0, z: 0.2, sx: 1.15, sz: 0.7 });
  peak(b, { r: 2.5, h: 7.2, taper: 0.3, lean: 0, rand: rng, flatTop: 1, steps: 3, seg: 16, palette: qinglv(9) });
  b.pop();
  const CLIFF_TOP = 7.25;

  /* the needle peaks — silhouette of the island */
  const peaks = [
    [0.9, -2.4, 1.5, 13.2, 0.05],  // summit with the immortal stone
    [-3.2, -3.2, 1.25, 12, 0.1],
    [3.8, -3.0, 1.15, 10.5, 0.12],
    [-2.9, 0.1, 1.2, 9.2, 0.06],   // gorge walls flanking the falls
    [2.9, -0.2, 1.1, 8.4, 0.07],
    [-5.7, -1.3, 1.0, 7.4, 0.15],
    [5.8, -0.8, 0.95, 6.6, 0.16],
    [-1.4, -5.6, 1.0, 9, 0.1],
    [2.8, -5.7, 0.9, 7.8, 0.12],
    [-5.0, 2.6, 0.7, 3.8, 0.2],
    [4.9, 2.8, 0.65, 3.3, 0.22],
    [-6.8, 4.0, 0.5, 2.2, 0.2],
  ];
  const tops = peaks.map(([x, z, r, h, lean]) => peak(b, { x, y: land(x, z) - 0.3, z, r, h, lean, rand: rng, palette: qinglv(h * 0.95, { base: land(x, z) }) }));

  /* pines on the shoulders of peaks, and a few on the ridge */
  for (const i of [1, 2, 3, 6, 7]) { const [x, y, z] = tops[i]; pine(b, { x, y: y - 0.25, z, h: 1.4 + rng() * 0.5, r: rng, lean: 0.35 }); }
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.1 + rng() * 0.8), d = 3 + rng() * 3.5, x = Math.cos(a) * d, z = Math.sin(a) * d - 1;
    pine(b, { x, y: land(x, z) - 0.05, z, h: 1.5 + rng(), r: rng });
  }

  /* peach groves on the lower slopes */
  const peachSpots = [];
  for (let i = 0, tries = 0; i < 14 && tries < 400; tries++) {
    const a = rng() * Math.PI * 2, d = 3.2 + rng() * 3.8, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const y = land(x, z);
    if (y < SEA + 0.25 || Math.abs(x) < 2.2 && z > 0.5 || peachSpots.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.5)) continue;
    peachSpots.push([x, z]);
    peachTree(b, { x, y: y - 0.05, z, h: 1.1 + rng() * 0.5, r: rng, fruit: 6 });
    i++;
  }

  /* shore rocks */
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2, d = 7.6 + rng() * 2.2, x = Math.cos(a) * d, z = Math.sin(a) * d;
    rock(b, { x, y: 0.1, z, r: 0.35 + rng() * 0.5, h: 0.6 + rng() * 0.8, rand: rng, palette: qinglv(1.6, { wet: 1 }) });
  }

  /* the immortal stone, split open, on the summit */
  const [sx, sy, sz] = tops[0];
  for (const side of [-1, 1]) {
    // phi ∈ [π/2, 3π/2] is the +x half, [3π/2, 5π/2] the −x half; each half tilts outward
    b.geo(new THREE.SphereGeometry(0.9, 14, 10, side > 0 ? Math.PI / 2 : Math.PI * 1.5, Math.PI), {
      x: sx + side * 0.38, y: sy + 0.8, z: sz, sy: 1.2, rz: -side * 0.5, color: '#c9c2b0', mat: M.flat, flatNormals: true,
    });
  }
  b.sphere(0.5, { x: sx, y: sy + 0.85, z: sz, sy: 1.25, color: C.fireCore, mat: M.glow, glow: 3.2 });

  /* the cave mouth behind the curtain */
  b.box(1.5, 2.3, 0.1, { x: 0, y: 0.9, z: 2.0, color: '#ffb766', mat: M.glow, glow: 0.7 });
  b.box(1.8, 2.6, 0.2, { x: 0, y: 0.7, z: 1.92, color: C.ink, mat: M.stone });
  // stone lip where the stream leaves the cliff top
  b.box(1.5, 0.08, 1.9, { x: 0, y: CLIFF_TOP - 0.02, z: 1.35, color: '#9cc7d0', mat: M.water });

  /* bamboo raft on which the stone monkey will one day sail away to seek the Way */
  b.push({ x: -4.4, y: SEA + 0.02, z: 7.6, ry: 0.6 });
  for (let i = 0; i < 7; i++) b.cyl(0.06, 0.06, 1.5, { x: -0.36 + i * 0.12, rx: Math.PI / 2, z: -0.75, color: '#bfa36a', mat: M.wood, seg: 6 });
  b.cyl(0.02, 0.02, 1.8, { x: 0.25, y: 0.05, rz: 0.35, color: C.wood, mat: M.wood, seg: 4 });
  b.pop();

  object.add(b.build());

  /* ------------------------------------------------- animated parts --- */
  // sea
  const sea = new THREE.Mesh(new THREE.CircleGeometry(10.95, 72), new THREE.MeshStandardMaterial({ color: '#3f7f8f', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = SEA;
  object.add(sea);

  // foam along the shore
  const foamPts = [];
  for (let j = 0; j < 140; j++) {
    const a = (j / 140) * Math.PI * 2;
    for (let r = 10.4; r > 1; r -= 0.08) {
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (land(x, z) > SEA) { foamPts.push([x, z, a]); break; }
    }
  }
  const foam = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 4), new THREE.MeshStandardMaterial({ color: '#f2f6f4', roughness: 1 }), foamPts.length);
  object.add(foam);

  // waterfall curtain
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uK: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uK; varying vec2 vUv;
      float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
      void main(){
        float col = floor(vUv.x * 46.0);
        float speed = 0.6 + h(col) * 0.5;
        float s = fract(vUv.y * (3.0 + h(col + 3.0) * 3.0) + uTime * speed + h(col + 7.0));
        float streak = smoothstep(0.0, 0.5, s) * (1.0 - smoothstep(0.5, 1.0, s));
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float a = (0.28 + 0.6 * streak) * edge * (0.85 + 0.15 * vUv.y);
        vec3 c = mix(vec3(0.62, 0.8, 0.86), vec3(0.97, 0.99, 1.0), streak);
        gl_FragColor = vec4(c * 1.05 * uK, a);
      }`,
  });
  const fallGeo = new THREE.PlaneGeometry(2.3, CLIFF_TOP - SEA, 1, 12);
  { // bow it slightly outward
    const P = fallGeo.attributes.position;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), t = 0.5 - y / (CLIFF_TOP - SEA); P.setZ(i, 0.35 * t * t); }
  }
  const fall = new THREE.Mesh(fallGeo, fallMat);
  fall.position.set(0, (CLIFF_TOP + SEA) / 2, 2.33);
  object.add(fall);

  // spray at the foot of the falls
  const SPRAY = 14;
  const spray = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.35, depthWrite: false }), SPRAY);
  object.add(spray);

  // golden motes rising from the split stone (目运两道金光，射冲斗府)
  const MOTES = 26;
  const motes = softPuffs(MOTES, { color: '#ffc861', opacity: 0.9 });
  object.add(motes.points);

  // the Monkey King on the lip of the falls, and his court
  const kb = new Builder();
  figure(kb, 'wukong', { pose: 'gaze', s: 1.15 });
  const king = kb.build();
  king.position.set(0.55, CLIFF_TOP + 0.02, 1.45);
  king.rotation.y = 0.25;
  object.add(king);

  const mb = new Builder();
  figure(mb, 'monkey', {});
  const NM = 34;
  const monkeys = new THREE.InstancedMesh(mb.merged(), M.smooth, NM);
  monkeys.castShadow = true;
  object.add(monkeys);
  const homes = [];
  for (let i = 0; i < NM; i++) {
    let x, z, y, tries = 0;
    do {
      if (i < 6) { x = -1.2 + rng() * 2.6; z = 0.3 + rng() * 1.6; y = CLIFF_TOP; }   // on the cliff top with the king
      else { const a = rng() * Math.PI * 2, d = 2.6 + rng() * 4.6; x = Math.cos(a) * d; z = Math.sin(a) * d; y = land(x, z); }
      tries++;
    } while (i >= 6 && (y < SEA + 0.2 || (Math.abs(x) < 2.6 && z > -0.2 && z < 2.6)) && tries < 50);
    if (i < 6 && Math.hypot(x - 0.55, z - 1.45) < 0.4) x -= 0.7;
    homes.push({ x, y, z, ph: rng() * 10, f: 0.6 + rng() * 0.9, ry: rng() * 6.28, hop: rng() < 0.6 });
  }

  // drifting auspicious clouds
  const clouds = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const cb = new Builder();
    cloud(cb, { s: 0.9 + rng() * 0.4, rand: rng });
    const g = cb.build({ shadows: false });
    g.userData = { a: (i / 3) * Math.PI * 2 + 0.6, r: 7.5 + i * 0.8, y: 9.5 + i * 1.6 };
    clouds.add(g);
  }
  object.add(clouds);

  function update(t, dt, env) {
    fallMat.uniforms.uTime.value = t;
    fallMat.uniforms.uK.value = 1 - 0.5 * (env?.night ?? 0);   // the unlit curtain would glare at night
    for (let i = 0; i < foamPts.length; i++) {
      const [x, z, a] = foamPts[i];
      const k = 0.5 + 0.5 * Math.sin(t * 1.2 + a * 7);
      setInst(foam, i, x * (1 + 0.012 * k), SEA, z * (1 + 0.012 * k), a, [0.22 + 0.12 * k, 0.05, 0.3]);
    }
    foam.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < SPRAY; i++) {
      const p = ((t * 0.5 + i / SPRAY) % 1);
      const a = i * 2.4;
      setInst(spray, i, Math.cos(a) * 1.0 * p, SEA + 0.1 + p * 0.9, 2.6 + Math.abs(Math.sin(a)) * 0.9 * p, 0, 0.1 + p * 0.28);
    }
    spray.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < MOTES; i++) {
      const p = (t * 0.08 + i / MOTES) % 1, a = i * 2.4 + t * 0.2;
      motes.set(i, sx + Math.cos(a) * 0.3 * p, sy + 1.4 + p * 7, sz + Math.sin(a) * 0.3 * p, 0.12 + 0.25 * (1 - p), Math.sin(Math.PI * p));
    }
    motes.commit();
    king.position.y = CLIFF_TOP + 0.02;
    for (let i = 0; i < NM; i++) {
      const m = homes[i];
      const s = (Math.sin(t * m.f * 2.4 + m.ph) + 1) / 2;
      const hop = m.hop ? Math.max(0, Math.sin(t * m.f * 3 + m.ph)) * 0.32 : 0;
      setInst(monkeys, i, m.x + Math.sin(t * m.f * 0.5 + m.ph) * 0.25 * (m.hop ? 1 : 0), m.y + hop, m.z, m.ry + Math.sin(t * 0.3 + m.ph) * 0.8, 1 + s * 0.04);
    }
    monkeys.instanceMatrix.needsUpdate = true;
    clouds.children.forEach((g) => {
      const u = g.userData, a = u.a + t * 0.02;
      g.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.25 + u.a) * 0.3, Math.sin(a) * u.r);
      g.rotation.y = -a + Math.PI / 2;
    });
  }
  update(0);
  return { object, update };
}
