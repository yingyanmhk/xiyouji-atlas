// 黑水河 — painted in ink alone. A river "黑似墨" crosses the tray between paper-white banks; on the
// far side, ink peaks with mist at their feet. A small ferry carries Tang Seng and Bajie across —
// but the boatman is the 鼍龙 himself: the water heaves, the dark back of the alligator-dragon
// arches out of the river and the boat goes over. Sha Wujing stands on the near bank with the horse
// and Wukong. At the end of the loop the 西海 prince 摩昂 arrives with his water-soldiers and the
// river draws back, opening a dry road across the bed. Loop (32 s).
import { THREE, Builder, M, C, terrain, peak, rock, bareTree, figure, horse, fbm, noise2, smooth, clamp, lerp, ramp, softPuffs } from '../kit.js';
import { courtier, group } from './_c_util.js';

const CYCLE = 32;
const SEA = 0.62;
const riverZ = (x) => -0.6 + 0.7 * Math.sin(x * 0.22 + 0.4);
const HALF = 2.4;

function ground(x, z) {
  const r = Math.hypot(x, z);
  const d = z - riverZ(x);
  const n = fbm(x * 0.32 + 4, z * 0.32 + 1, 4);
  let h = lerp(0.16, 0.85 + 0.5 * n, smooth(HALF - 0.4, HALF + 0.9, Math.abs(d)));
  if (d > 0) h -= smooth(HALF + 2, 9, d) * 0.35;
  if (d < 0) h += Math.max(0, -d - 3.4) * (0.5 + 0.7 * n) * smooth(10.6, 7.5, r);
  return h * smooth(10.6, 9.6, r) + 0.12 * (1 - smooth(10.6, 9.6, r));
}
// 墨分五色: paper on the flats, ink gathering on steep faces and toward the tops
function ink(hmax, base = 0) {
  const stops = [[0, '#c9c4b8'], [0.3, '#8f8a82'], [0.6, '#56524d'], [0.85, '#33302d'], [1, '#22201e']];
  const out = new THREE.Color(), paper = new THREE.Color('#e9e3d4'), wash = new THREE.Color('#7a756c');
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax), st = noise2((x + z) * 1.5, y * 0.25) - 0.5;
    ramp(stops, t * 0.9 + st * 0.25 + (1 - ny) * 0.25, out);
    out.lerp(paper, smooth(0.75, 0.97, ny) * (1 - t) * 0.8);
    const stroke = smooth(0.58, 0.85, noise2(x * 0.7 + z * 0.35, z * 2.2 - x * 0.2));   // dry-brush wash on the flats
    return out.lerp(wash, stroke * 0.32 * smooth(0.8, 1, ny));
  };
}

// the 鼍龙: a scaled dark back in three humps, a long alligator head with a dragon's horns
function tuolong(b) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([-3 + t * 6, Math.max(-0.2, Math.sin(t * Math.PI * 3) * 0.7 - 0.05), Math.sin(t * 5) * 0.3]); }
  const scale = (x, y, z, nx, ny) => (ny > 0.3 ? (noise2(x * 9, z * 9) > 0.5 ? '#2d2b28' : '#3c3935') : '#6a655c');
  b.tube(pts, (t) => 0.32 * Math.sin(Math.PI * (0.05 + 0.9 * t)) + 0.05, { mat: M.flat, faceColor: scale, radial: 8, segs: 72 });
  for (let i = 1; i < 23; i++) {             // dorsal ridge
    const [x, y, z] = pts[i]; if (y < 0.1) continue;
    b.cone(0.07, 0.24, { x, y: y + 0.24, z, rz: -0.3, color: '#1f1d1b', mat: M.flat, seg: 4 });
  }
  b.push({ x: 3.15, y: 0.45, z: 0.1, rz: 0.35 });
  b.box(0.95, 0.24, 0.42, { x: 0.25, color: '#34312d', mat: M.flat });
  b.box(0.8, 0.1, 0.36, { x: 0.35, y: -0.12, rz: -0.25, color: '#55504a', mat: M.flat });   // open jaw
  for (const sz of [-1, 1]) {
    b.sphere(0.05, { x: 0.05, y: 0.22, z: sz * 0.14, color: '#e8e2d2', mat: M.glow, glow: 1.0 });
    b.tube([[-0.05, 0.22, sz * 0.12], [-0.25, 0.42, sz * 0.2], [-0.45, 0.48, sz * 0.18]], 0.025, { color: '#1f1d1b', mat: M.smooth, radial: 4 });
  }
  for (let i = 0; i < 5; i++) b.cone(0.025, 0.08, { x: 0.15 + i * 0.13, y: -0.06, z: 0.15, rx: Math.PI, color: '#efe9da', mat: M.smooth, seg: 4 });
  b.pop();
  for (const sx of [0.8, -0.9]) b.cyl(0.06, 0.08, 0.5, { x: sx, y: -0.1, z: 0.35, rx: 0.9, color: '#3c3935', mat: M.flat, seg: 5 });   // a claw breaking the surface
}

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const pal = ink(4);
  const bed = new THREE.Color('#9a958a');
  terrain(b, { R: 10.5, rings: 46, segs: 150, fn: ground, palette: (x, y, z, nx, ny, nz) => (y < SEA - 0.04 ? bed : pal(x, y, z, nx, ny, nz)) });

  /* ink peaks on the far (west) bank */
  for (const [x, z, r, h, lean, ld] of [[-3.8, -6.6, 2.4, 10.5, 0.16, 0.3], [-6.4, -4.6, 1.3, 5.2, 0.1, 2.6], [-1.0, -8.4, 1.2, 6.4, 0.2, 0.2], [3.6, -7.4, 1.9, 7.6, 0.1, 2.8], [6.4, -5.0, 1.1, 3.8, 0.08, 3.0], [1.2, -5.6, 0.8, 3.2, 0.1, 1.0]]) {
    const y = ground(x, z) - 0.4;
    peak(b, { x, y, z, r, h, lean, leanDir: ld, rand: rng, taper: 0.7, steps: Math.max(2, Math.round(h / 3.5)), palette: ink(h, y) });
  }
  // bare trees in ink, reeds along the banks
  for (let i = 0, k = 0; i < 10 && k < 400; k++) {
    const [x, z] = rng.inDisc(9.3, 1);
    const d = z - riverZ(x);
    if (Math.abs(d) < HALF + 1.0 || (d > 0 && x > -3 && x < 3.5 && d < 5)) continue;
    bareTree(b, { x, y: ground(x, z) - 0.05, z, h: 1.4 + rng() * 1.2, r: rng, color: '#2a2724' }); i++;
  }
  for (let i = 0; i < 70; i++) {
    const x = rng.range(-9, 9), side = rng() < 0.5 ? -1 : 1, z = riverZ(x) + side * (HALF - 0.1 + rng() * 0.6);
    if (Math.hypot(x, z) > 9.8) continue;
    const h = 0.35 + rng() * 0.4, lean = (rng() - 0.5) * 0.5;
    b.cyl(0.006, 0.012, h, { x, y: ground(x, z) - 0.05, z, rz: lean, color: '#3a3733', mat: M.smooth, seg: 3 });
  }
  for (let i = 0; i < 10; i++) {
    const [x, z] = rng.inDisc(9.4, 2);
    if (Math.abs(z - riverZ(x)) < HALF + 0.4) continue;
    rock(b, { x, y: ground(x, z) - 0.1, z, r: 0.3 + rng() * 0.4, h: 0.3 + rng() * 0.5, rand: rng, palette: ink(1.4, ground(x, z) - 0.3) });
  }
  for (const [x, z, r, h] of [[5.6, 4.6, 1.0, 1.6], [6.6, 3.8, 0.6, 1.0], [-6.4, 4.4, 0.9, 1.3], [-5.6, 5.4, 0.5, 0.7]]) rock(b, { x, y: ground(x, z) - 0.15, z, r, h, rand: rng, palette: ink(h + 0.6, ground(x, z) - 0.4) });
  // the ferry landing: a few planks on stakes
  for (let i = 0; i < 5; i++) {
    const x = -1.2, z = riverZ(-1.2) + HALF + 0.4 - i * 0.42;
    b.box(0.9, 0.06, 0.4, { x, y: SEA + 0.12, z, ry: 0.1, color: '#5a554e', mat: M.wood });
    for (const sx of [-1, 1]) b.cyl(0.04, 0.04, 0.6, { x: x + sx * 0.4, y: 0.15, z, color: '#2e2b28', mat: M.wood, seg: 5 });
  }
  /* the near bank: Sha Wujing, Wukong, the horse with the luggage */
  const NB = (x) => riverZ(x) + HALF + 0.7;
  figure(b, 'sha', { x: -0.6, y: ground(-0.6, NB(-0.6)), z: NB(-0.6), ry: Math.PI + 0.2, s: 1.65 });
  figure(b, 'wukong', { x: 0.7, y: ground(0.7, NB(0.7) + 0.4), z: NB(0.7) + 0.4, ry: Math.PI - 0.3, s: 1.25, pose: 'gaze' });
  horse(b, { x: -2.1, y: ground(-2.1, NB(-2.1) + 0.6), z: NB(-2.1) + 0.6, ry: Math.PI * 0.75, s: 1.1 });
  object.add(b.build());

  /* ink water: a shader plane that can part, opening a road across the bed */
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uPart: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uPart; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        float w = uPart * 1.25;
        float edge = abs(vW.x - 0.9) - w;
        if (edge < 0.0) discard;
        if (abs(vW.z - (-0.6 + 0.7 * sin(vW.x * 0.22 + 0.4))) > 3.3) discard;
        float flow = n(vec2(vW.x * 1.4 - uTime * 0.35, vW.z * 5.0)) * 0.6 + n(vec2(vW.x * 3.1 - uTime * 0.6, vW.z * 9.0)) * 0.4;
        vec3 c = mix(vec3(0.05, 0.05, 0.055), vec3(0.17, 0.17, 0.18), smoothstep(0.55, 0.95, flow));
        c = mix(c, vec3(0.85, 0.84, 0.8), smoothstep(0.35, 0.0, edge) * uPart);
        gl_FragColor = vec4(c, 0.96);
      }`,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(10.5, 72).rotateX(-Math.PI / 2), waterMat);
  water.position.set(0, SEA, 0);
  object.add(water);

  /* the ferry */
  const boat = new THREE.Group();
  boat.add(group((bb) => {
    const hull = new THREE.Shape();
    hull.moveTo(-1.1, 0.25); hull.quadraticCurveTo(-0.9, -0.05, -0.4, -0.08); hull.lineTo(0.5, -0.08); hull.quadraticCurveTo(1.0, -0.05, 1.2, 0.3); hull.lineTo(-1.1, 0.25);
    bb.extrude(hull, 0.62, { ry: Math.PI / 2, color: '#4a4540', mat: M.wood });
    bb.box(0.6, 0.04, 2.0, { y: 0.2, color: '#7a746a', mat: M.wood });
    // 篷: a woven awning
    bb.geo(new THREE.CylinderGeometry(0.34, 0.34, 0.7, 10, 1, true, -Math.PI / 2, Math.PI), { y: 0.25, z: -0.3, rz: Math.PI / 2, ry: Math.PI / 2, color: '#2e2b28', mat: M.cloth });
    figure(bb, 'monk', { y: 0.22, z: 0.35, s: 1.15, pose: 'none' });
    figure(bb, 'bajie', { y: 0.22, z: -0.75, s: 1.1, pose: 'none' });
    courtier(bb, 'official', { y: 0.22, z: 0.95, s: 1.0, robe: '#3a3733' });            // the boatman
    bb.cyl(0.01, 0.01, 1.6, { y: 0.4, z: 1.05, rx: 0.7, color: '#2a2724', mat: M.wood, seg: 4 });
  }));
  boat.children[0].scale.setScalar(1.3);
  object.add(boat);
  const BOAT0 = new THREE.Vector3(-1.2, SEA - 0.04, riverZ(-1.2) + 0.6);

  /* the dragon */
  const drag = group((db) => { db.push({ s: 1.35 }); tuolong(db); db.pop(); });
  object.add(drag);

  /* 摩昂 and the 西海 water-soldiers, standing on a white wave */
  const host = new THREE.Group();
  host.add(group((hb) => {
    courtier(hb, 'guard', { s: 1.6, robe: '#d8d4ca' });
    hb.cone(0.05, 0.18, { y: 1.12, x: 0.0, color: '#2a2724', seg: 5 });
    for (let i = 0; i < 6; i++) courtier(hb, 'guard', { x: -0.9 + (i % 3) * 0.55 + (i > 2 ? 0.25 : 0), z: -0.5 - (i > 2 ? 0.5 : 0), s: 1.0, robe: i % 2 ? '#5a5650' : '#3a3733' });
  }));
  object.add(host);
  const HOST = new THREE.Vector3(0.9, SEA - 0.02, riverZ(0.9) - 0.2);

  /* spray, mist, the walls of the parted water */
  const SP = 60;
  const spray = softPuffs(SP, { color: '#f2efe8', opacity: 0.85 });
  object.add(spray.points);
  const MIST = 40;
  const mist = softPuffs(MIST, { color: '#efebe1', opacity: 0.55 });
  object.add(mist.points);
  const md = Array.from({ length: MIST }, () => ({ x: rng.range(-8, 8), z: rng.range(-7, -3.5), y: 1.2 + rng() * 1.5, s: 2 + rng() * 2.5, ph: rng() * 9 }));
  const wallMat = new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.82 });
  const walls = [-1, 1].map((sx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.4, 4.4), wallMat); m.userData.sx = sx; object.add(m); return m; });
  const _v = new THREE.Vector3();

  const mistC = mist.mat.uniforms.uColor.value.clone(), sprayC = spray.mat.uniforms.uColor.value.clone();
  function update(t, dt, env) {
    // unlit mist would glow at night: let it sink into the dark
    const nk = 1 - 0.88 * (env?.night ?? 0);
    mist.mat.uniforms.uColor.value.copy(mistC).multiplyScalar(nk); spray.mat.uniforms.uColor.value.copy(sprayC).multiplyScalar(nk);
    const u = (t % CYCLE) / CYCLE;
    waterMat.uniforms.uTime.value = t;
    // 0..0.18 crossing; 0.18..0.32 the dragon rises, the boat goes over; 0.32..0.5 it sinks
    const rise = smooth(0.16, 0.28, u) * (1 - smooth(0.44, 0.56, u));
    const over = smooth(0.24, 0.34, u);
    const sink = smooth(0.32, 0.46, u);
    const back = smooth(0.92, 0.99, u);
    const cross = clamp(u / 0.24) * 0.9;
    boat.position.set(BOAT0.x + cross * 0.8, BOAT0.y - sink * 0.55 + Math.sin(t * 1.3) * 0.02 + rise * 0.25 * (1 - over), BOAT0.z - cross * 1.3);
    boat.rotation.set(0, 0.35, over * 1.9 + Math.sin(t * 1.1) * 0.03);
    boat.scale.setScalar(Math.max(0.001, (1 - sink) + back));
    boat.visible = sink < 0.99 || back > 0.01;
    if (back > 0.01) { boat.position.copy(BOAT0); boat.rotation.set(0, 0.35, 0); boat.scale.setScalar(back); }
    drag.position.set(0.3, SEA - 0.15 + rise * 0.1, riverZ(0.3) + 0.1);
    drag.rotation.set(0, 0.2 + Math.sin(t * 0.4) * 0.05, 0);
    drag.scale.set(1, Math.max(0.001, rise), 1);
    drag.visible = rise > 0.01;
    // 摩昂 arrives (0.6..), the river parts (0.68..0.88) and closes (0.88..0.95)
    const arrive = smooth(0.58, 0.66, u) * (1 - smooth(0.9, 0.96, u));
    const part = smooth(0.66, 0.78, u) * (1 - smooth(0.86, 0.94, u));
    host.visible = arrive > 0.01;
    host.position.set(HOST.x - 3.6 * (1 - arrive), HOST.y + 0.2 * arrive, HOST.z - 1.2);
    host.rotation.y = Math.PI / 2 + 0.6;
    host.scale.setScalar(Math.max(0.001, arrive));
    waterMat.uniforms.uPart.value = part;
    for (const m of walls) {
      m.visible = part > 0.01;
      m.scale.y = Math.max(0.001, part * 0.9);
      m.position.set(0.9 + m.userData.sx * (part * 1.25 + 0.06), SEA - 0.4 + part * 0.45 + (m.scale.y) * 0.5 - 0.1, riverZ(0.9) - 0.2);
      m.rotation.y = -0.08;
    }
    for (let i = 0; i < SP; i++) {
      const p = (t * 0.7 + i / SP) % 1, a = i * 2.4;
      let x, y, z, s, k;
      if (i < 34) {   // around the dragon and the capsizing boat
        x = 0.3 + Math.cos(a) * (0.6 + p * 2.6); z = riverZ(0.3) + Math.sin(a) * (0.4 + p * 1.2); y = SEA + Math.sin(Math.PI * p) * 0.9; s = 0.2 + p * 0.5; k = rise * (1 - p);
      } else {        // along the crests of the parted water
        const side = i % 2 ? 1 : -1;
        x = 0.9 + side * (part * 1.25 + 0.1); z = riverZ(0.9) - 0.2 + ((i * 0.37) % 1 - 0.5) * 4.0; y = SEA + part * 0.9 + p * 0.3; s = 0.25 + p * 0.3; k = part * Math.sin(Math.PI * p);
      }
      spray.set(i, x, y, z, s, k);
    }
    spray.commit();
    for (let i = 0; i < MIST; i++) { const m = md[i]; mist.set(i, m.x + Math.sin(t * 0.05 + m.ph) * 0.8, m.y, m.z, m.s, 0.6); }
    mist.commit();
    void _v;
  }
  update(0);
  return { object, update };
}
