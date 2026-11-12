// 铜台府 · 地灵县 — the household of the good 寇员外, who vowed to feed ten thousand monks. His house
// stands on two raised stone terraces: a gate tower at the head of a flight of steps, the front
// courtyard set with tables of bowls where the monks sit in rows, and up a second flight the main
// hall, where the four pilgrims at the head table make up the last of the count. A tall banner pole
// carries the long red banner of the vow; an old locust tree leans over the wall. In a 36 s loop the
// feast goes on, then night falls: bandits climb the wall with torches to rob the house (and the old
// man is killed). Under the east courtyard the terrace is cut away to show the way down to the
// underworld: Wukong drops through the rift, walks into the cold tunnel, and comes back leading the
// old man's soul home.
import { THREE, Builder, M, C, terrain, hall, house, roof, figure, pine, fbm, smooth, clamp, lerp, ease, hash2, setInst, softPuffs } from '../kit.js';
import { person, tileWall, paving, lantern, instanced } from './_e_kit.js';

const CYCLE = 36;
const G = 0.2;                       // ground
const YA = 1.5, YB = 3.1;            // front / rear terrace tops
const WX = 6.6, ZB = -6.6, ZM = -1.4, ZF = 5.8;
const CH = { x0: 2.2, x1: 5.6, z0: 3.6, zc: 4.75 };   // the cut-away chamber under the east front courtyard
const RIFT = [3.9, YA, 4.15];

export default function build({ rng }) {
  const b = new Builder();
  const object = new THREE.Group();

  const earth = new THREE.Color(), earth2 = new THREE.Color('#6f7a4e');
  const inside = (x, z) => Math.abs(x) < WX + 0.2 && z > ZB - 0.2 && z < ZF + 0.2;
  terrain(b, {
    R: 10.5, rings: 30, segs: 110,
    fn: (x, z) => (inside(x, z) ? 0.15 : G + 0.12 * fbm(x * 0.4, z * 0.4, 3)) - 0.12 * smooth(9.6, 10.5, Math.hypot(x, z)),
    palette: (x, y, z) => {
      if (Math.abs(x) < 1.3 && z > ZF && z < 9.6) return earth.set('#b3a283');          // the road to the gate
      return earth.set('#8a8a5e').lerp(earth2, fbm(x * 0.5, z * 0.5, 2));
    },
  });

  /* the two terraces: ashlar stone with paved tops */
  const pave = paving('#bfae90', '#a39072', 0.7);
  const ash = new THREE.Color();
  const ashlar = (x, y, z, nx, ny, nz) => {
    if (ny > 0.5) return pave(x, y, z);
    const c = Math.floor(y / 0.26), k = Math.floor((Math.abs(nx) > 0.5 ? z : x) / 0.62 + c * 0.5);
    return ash.set('#b2a080').lerp(earth.set('#857559'), 0.25 + 0.5 * hash2(c * 13 + 1, k * 7 + 3));
  };
  const slab = (x0, x1, z0, z1, y0, y1) => b.box(x1 - x0, y1 - y0, z1 - z0, { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2, faceColor: ashlar, mat: M.stone });
  // front terrace (around the chamber)
  slab(-WX, CH.x0, ZM, ZF, 0, YA);
  slab(CH.x0, CH.x1, ZM, CH.z0, 0, YA);
  slab(CH.x1, WX, ZM, ZF, 0, YA);
  slab(CH.x0, CH.x1, CH.z0, CH.zc, YA - 0.2, YA);                 // the courtyard floor over the chamber (cut short)
  // rear terrace
  slab(-WX, WX, ZB, ZM, 0, YB);
  // coping bands
  for (const [w, d, x, z, y] of [[WX + CH.x0 + 0.08, 0.16, (CH.x0 - WX) / 2 - 0.04, ZF, YA], [WX - CH.x1 + 0.08, 0.16, (CH.x1 + WX) / 2 + 0.04, ZF, YA], [0.16, ZF - ZM, -WX, (ZF + ZM) / 2, YA], [0.16, ZF - ZM, WX, (ZF + ZM) / 2, YA],
    [2 * WX + 0.16, 0.16, 0, ZM, YB], [0.16, ZM - ZB, -WX, (ZM + ZB) / 2, YB], [0.16, ZM - ZB, WX, (ZM + ZB) / 2, YB]]) {
    b.box(w, 0.1, d, { x, y: y - 0.06, z, color: '#d2c5a6', mat: M.stone });
  }

  /* the chamber: dark rock lining, stalactites, a glowing tunnel down to the Yellow Springs */
  const rockC = new THREE.Color();
  const darkRock = (x, y, z) => rockC.set('#353b52').lerp(earth.set('#565a70'), hash2(Math.floor(x * 3), Math.floor(y * 3 + z * 3)));
  const cw = CH.x1 - CH.x0, cd = ZF - CH.z0, cx = (CH.x0 + CH.x1) / 2, cz = (CH.z0 + ZF) / 2;
  b.box(cw - 0.04, YA - 0.24, 0.06, { x: cx, y: G - 0.02, z: CH.z0 + 0.03, faceColor: darkRock, mat: M.flat });
  for (const sx of [CH.x0 + 0.03, CH.x1 - 0.03]) b.box(0.06, YA - 0.24, cd, { x: sx, y: G - 0.02, z: cz, faceColor: darkRock, mat: M.flat });
  b.box(cw - 0.04, 0.03, CH.zc - CH.z0, { x: cx, y: YA - 0.23, z: (CH.z0 + CH.zc) / 2, color: '#22232e', mat: M.flat });
  // the broken edge of the courtyard floor
  for (let i = 0; i < 8; i++) b.ico(0.1 + rng() * 0.1, { x: CH.x0 + 0.2 + i * (cw - 0.4) / 7, y: YA - 0.12 + rng() * 0.05, z: CH.zc + 0.02, sy: 0.7, color: i % 2 ? '#a39072' : '#857559', mat: M.flat, detail: 0 });
  b.box(cw, 0.06, cd + 0.02, { x: cx, y: G - 0.04, z: cz, color: '#3a3c4a', mat: M.flat });
  for (let i = 0; i < 9; i++) b.cone(0.05 + rng() * 0.05, 0.18 + rng() * 0.25, { x: CH.x0 + 0.25 + rng() * (cw - 0.5), y: YA - 0.21, z: CH.z0 + 0.2 + rng() * (CH.zc - CH.z0 - 0.4), rx: Math.PI, color: '#3a3a46', mat: M.flat, seg: 5 });
  // broken edge of the cut: rubble along the opening
  for (let i = 0; i < 4; i++) b.ico(0.1 + rng() * 0.1, { x: i < 2 ? CH.x0 + 0.15 + i * 0.25 : CH.x1 - 0.15 - (i - 2) * 0.25, y: G + 0.05, z: ZF - 0.05 + rng() * 0.2, color: i % 2 ? '#8b7b60' : '#6e624f', mat: M.flat, detail: 0 });
  for (const sx of [CH.x0, CH.x1]) for (let k = 0; k < 3; k++) b.ico(0.1 + rng() * 0.08, { x: sx + (rng() - 0.5) * 0.2, y: G + 0.25 + k * 0.33, z: ZF - 0.02, color: '#8b7b60', mat: M.flat, detail: 0 });
  // the tunnel mouth in the back wall and the faint road of cold light leading into it
  const arch = new THREE.Shape();
  arch.moveTo(-0.32, 0); arch.lineTo(-0.32, 0.45); arch.absarc(0, 0.45, 0.32, Math.PI, 0, true); arch.lineTo(0.32, 0); arch.lineTo(-0.32, 0);
  b.extrude(arch, 0.03, { x: RIFT[0], y: G + 0.02, z: CH.z0 + 0.07, color: '#6a8ce0', mat: M.glow, glow: 2.0 });
  b.extrude(arch, 0.03, { x: RIFT[0], y: G + 0.08, z: CH.z0 + 0.09, sx: 0.75, sy: 0.82, color: '#0b0e1a', mat: M.stone });
  // the cold stream of the Yellow Springs crossing the chamber floor
  b.tube([[CH.x0 + 0.1, G - 0.02, ZF - 0.3], [CH.x0 + 1.0, G - 0.02, ZF - 0.7], [CH.x0 + 1.9, G - 0.02, ZF - 0.45], [CH.x1 - 0.1, G - 0.02, ZF - 0.9]], 0.1, { color: '#5f86d8', mat: M.glow, glow: 1.6, radial: 5, segs: 20 });
  for (let i = 0; i < 6; i++) b.box(0.07, 0.012, 0.2, { x: RIFT[0] + Math.sin(i * 1.3) * 0.06, y: G + 0.005, z: CH.z0 + 0.3 + i * 0.3, ry: Math.sin(i) * 0.3, color: '#7a9be0', mat: M.glow, glow: 0.9 });

  /* walls on both terraces; the gate tower over the front steps */
  const WALL = { h: 1.0, t: 0.22, color: '#e6d9bf', cap: '#4f4a46' };
  tileWall(b, -WX, ZM, -WX, ZF, { y: YA, ...WALL });
  tileWall(b, WX, ZM, WX, ZF, { y: YA, ...WALL });
  tileWall(b, -WX, ZF, -1.6, ZF, { y: YA, ...WALL, h: 0.8 });
  tileWall(b, 1.6, ZF, CH.x0, ZF, { y: YA, ...WALL, h: 0.8 });
  tileWall(b, CH.x1, ZF, WX, ZF, { y: YA, ...WALL, h: 0.8 });
  tileWall(b, -WX, ZB, WX, ZB, { y: YB, ...WALL });
  tileWall(b, -WX, ZB, -WX, ZM, { y: YB, ...WALL });
  tileWall(b, WX, ZB, WX, ZM, { y: YB, ...WALL });
  // front flight of steps from the road, and the inner flight up to the hall terrace
  const NS = 6;
  for (let i = 0; i < NS; i++) b.box(2.2, (YA - G) * (1 - i / NS) + 0.01, 0.26, { y: G - 0.01, z: ZF + 0.13 + i * 0.26, color: '#c9bc9e', mat: M.stone });
  for (const sx of [-1, 1]) b.box(0.2, YA - G + 0.1, NS * 0.26, { x: sx * 1.2, y: G - 0.01, z: ZF + NS * 0.13, color: '#a99a7c', mat: M.stone });
  const NI = 7;
  for (let i = 0; i < NI; i++) b.box(1.1, (YB - YA) * (1 - i / NI) + 0.01, 0.24, { y: YA - 0.01, z: ZM + 0.12 + i * 0.24, color: '#c9bc9e', mat: M.stone });
  for (const sx of [-1, 1]) b.tube([[sx * 0.62, YB + 0.12, ZM], [sx * 0.62, YA + 0.12, ZM + NI * 0.24]], 0.035, { color: '#d8ccb0', mat: M.stone, radial: 5, segs: 2 });
  // 门楼 gate tower, two-eaved, with a dark gateway and the gilded plaque
  hall(b, { x: 0, y: YA, z: ZF - 0.55, w: 3.0, d: 1.1, h: 1.35, base: 0.14, tiers: 2, roofColor: '#4f4a46', wall: '#dccaa8', pillar: '#8a3a2a', beam: '#3f5e5a', lit: 0, r: rng, steps: false });
  b.box(0.95, 1.05, 0.06, { y: YA + 0.14, z: ZF - 0.55 + 0.37, color: '#15110e', mat: M.stone });
  b.box(1.0, 0.3, 0.05, { y: YA + 1.98, z: ZF - 0.55 + 0.42, color: C.ink, mat: M.lacquer });          // the plaque (万僧不阻)
  b.box(0.86, 0.2, 0.02, { y: YA + 2.03, z: ZF - 0.55 + 0.45, color: C.gold, mat: M.smooth });

  /* the main hall on the rear terrace, with lower side halls; side rooms on the front court */
  const HALL = { roofColor: '#4f4a46', wall: '#dccaa8', pillar: '#8a3a2a', beam: '#3f5e5a', r: rng };
  hall(b, { x: 0, y: YB, z: -4.75, w: 6.0, d: 2.4, h: 1.95, base: 0.4, tiers: 2, lit: 0.55, ...HALL });
  for (const sx of [-1, 1]) hall(b, { x: sx * 5.05, y: YB, z: -4.1, ry: -sx * Math.PI / 2, w: 2.6, d: 1.3, h: 1.05, base: 0.18, lit: 0.5, steps: false, ...HALL });
  for (const sx of [-1, 1]) hall(b, { x: sx * 5.7, y: YA, z: 1.3, ry: -sx * Math.PI / 2, w: 3.2, d: 1.2, h: 1.0, base: 0.16, lit: 0.5, steps: false, ...HALL });
  for (const x of [-2.4, -0.8, 0.8, 2.4]) lantern(b, { x, y: YB + 2.7, z: -4.75 + 1.55, s: 1.3, glow: 1.5 });
  pine(b, { x: -3.9, y: YB, z: -2.5, h: 2.2, r: rng });
  pine(b, { x: 3.9, y: YB, z: -2.6, h: 2.0, r: rng });
  // the kitchen corner: cauldrons and firewood by the west wall
  for (const [x, z] of [[-5.5, 3.6], [-5.5, 4.7]]) {
    b.box(0.9, 0.45, 0.9, { x, y: YA, z, color: '#8a6a52', mat: M.stone });
    b.lathe([[0, 0.27], [0.34, 0.29], [0.4, 0.45], [0.36, 0.56], [0, 0.56]], { x, y: YA, z, color: '#3a3634', mat: M.metal });
    b.box(0.03, 0.18, 0.28, { x: x + 0.47, y: YA + 0.08, z, color: C.fire, mat: M.glow, glow: 2 });
  }
  for (let i = 0; i < 7; i++) b.cyl(0.05, 0.05, 0.8, { x: -6.15, y: YA + 0.06 + (i % 3) * 0.1, z: 2.5 + i * 0.12, rx: Math.PI / 2, rz: 0.1, color: '#8a6440', mat: M.wood, seg: 5 });
  // the village outside
  for (const [x, z, ry] of [[-8.6, -2.2, 1.4], [8.5, -2.6, -1.5], [8.4, 2.4, -1.7]]) house(b, { x, y: G - 0.05, z, ry, w: 1.5, d: 1.0, h: 0.8, wall: '#e0d2b4', roofColor: '#5a524a', lit: 0.3, r: rng });

  /* 幡杆 the banner pole of the vow, and a tall 天灯 lantern pole */
  const BP = [-1.9, G, 7.0], BH = 8.6;
  b.cyl(0.32, 0.4, 0.3, { x: BP[0], y: G - 0.05, z: BP[2], color: '#a99a7c', mat: M.stone, seg: 8 });
  b.cyl(0.05, 0.08, BH, { x: BP[0], y: G, z: BP[2], color: '#6a2a1e', mat: M.lacquer, seg: 8 });
  b.box(1.1, 0.06, 0.06, { x: BP[0] + 0.45, y: G + BH - 0.5, z: BP[2], color: '#6a2a1e', mat: M.lacquer });
  b.sphere(0.1, { x: BP[0], y: G + BH + 0.05, z: BP[2], color: C.gold, mat: M.metal });
  b.box(0.62, 0.12, 0.08, { x: BP[0] + 0.62, y: G + BH - 0.68, z: BP[2], color: C.gold, mat: M.smooth });       // banner header
  const LP = [1.75, G, 7.3], LH = 7.2;
  b.cyl(0.25, 0.32, 0.25, { x: LP[0], y: G - 0.05, z: LP[2], color: '#a99a7c', mat: M.stone, seg: 8 });
  b.cyl(0.035, 0.06, LH, { x: LP[0], y: G, z: LP[2], color: '#4a2e1e', mat: M.wood, seg: 7 });
  b.box(0.7, 0.04, 0.04, { x: LP[0], y: G + LH - 0.25, z: LP[2], color: '#4a2e1e', mat: M.wood });
  lantern(b, { x: LP[0], y: G + LH + 0.05, z: LP[2], s: 2.6, glow: 1.9, string: false });
  for (const sx of [-1, 1]) lantern(b, { x: LP[0] + sx * 0.32, y: G + LH - 0.25, z: LP[2], s: 1.4, glow: 1.5 });
  // the long banner: its own mesh, rippling in the wind
  const BW = 0.5, BL = 4.6;
  const banGeo = new THREE.PlaneGeometry(BW, BL, 4, 18);
  const banCol = new Float32Array(banGeo.attributes.position.count * 3);
  const COLX = [-BW / 2, -BW / 2 + 0.035, 0, BW / 2 - 0.035, BW / 2];
  for (let i = 0; i < banGeo.attributes.position.count; i++) {
    const ix = i % 5, row = Math.floor(i / 5), tail = row === 18;
    banGeo.attributes.position.setX(i, COLX[ix] * (tail && ix === 2 ? 0 : 1));
    if (tail && ix === 2) banGeo.attributes.position.setY(i, -BL / 2 + 0.3);   // swallow-tail notch
    earth.set(ix === 0 || ix === 4 || row === 0 ? '#d6a94a' : '#b8352a');
    banCol[i * 3] = earth.r; banCol[i * 3 + 1] = earth.g; banCol[i * 3 + 2] = earth.b;
  }
  banGeo.translate(BP[0] + 0.62, G + BH - 0.72 - BL / 2, BP[2]);
  banGeo.setAttribute('color', new THREE.BufferAttribute(banCol, 3));
  const banner = new THREE.Mesh(banGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
  banner.castShadow = true;
  object.add(banner);
  const banBase = Float32Array.from(banGeo.attributes.position.array);

  /* an old locust tree outside the gate, leaning in over the wall */
  {
    const TX = -5.4, TZ = 7.4;
    const pts = [[TX, G - 0.1, TZ], [TX - 0.25, G + 1.6, TZ - 0.1], [TX + 0.1, G + 3.2, TZ - 0.4], [TX - 0.3, G + 4.5, TZ - 0.9], [TX - 0.7, G + 5.4, TZ - 1.4]];
    b.tube(pts, (q) => 0.34 * (1 - q * 0.65), { color: '#4e3b2c', mat: M.wood, radial: 7, segs: 16 });
    b.tube([[TX - 0.05, G + 3.0, TZ - 0.45], [TX - 0.9, G + 3.9, TZ - 0.2], [TX - 1.5, G + 4.4, TZ - 0.6]], (q) => 0.13 * (1 - q * 0.6), { color: '#4e3b2c', mat: M.wood, radial: 6 });
    b.tube([[TX - 0.2, G + 4.2, TZ - 0.8], [TX + 0.6, G + 4.6, TZ - 0.9], [TX + 1.4, G + 4.8, TZ - 1.3]], (q) => 0.11 * (1 - q * 0.6), { color: '#4e3b2c', mat: M.wood, radial: 6 });
    for (const [x, z] of [[-0.25, 0.25], [0.3, -0.2], [0.05, 0.35]]) b.tube([[TX, G + 0.5, TZ], [TX + x * 2, G + 0.05, TZ + z * 2]], 0.08, { color: '#4e3b2c', mat: M.wood, radial: 5 });
    const pads = [[-1.6, 4.6, -0.5, 1.0], [-0.7, 5.6, -1.5, 1.2], [1.4, 4.9, -1.3, 0.8], [-0.2, 5.1, -0.8, 1.0], [0.5, 4.4, -0.3, 0.7], [-1.0, 3.95, 0.1, 0.7], [-1.5, 5.3, -2.0, 0.9]];
    for (const [x, y, z, s] of pads) b.ico(s, { x: TX + x, y: G + y, z: TZ + z, sy: 0.5, color: rng() < 0.5 ? '#5e8f4f' : '#4a7a44', mat: M.flat });
  }

  /* the feast: four long rows of tables down the front court, monks seated on both sides */
  const steamAt = [], seats = [];
  for (const tx of [-3.6, -1.2, 1.2, 3.6]) {
    for (let k = 0; k < 2; k++) {
      const tz = 0.65 + k * 1.75;
      b.box(0.7, 0.05, 1.5, { x: tx, y: YA + 0.32, z: tz, color: '#8a5a36', mat: M.wood });
      for (const [lx, lz] of [[-0.3, -0.68], [0.3, -0.68], [-0.3, 0.68], [0.3, 0.68]]) b.box(0.05, 0.32, 0.05, { x: tx + lx, y: YA, z: tz + lz, color: '#6a4228', mat: M.wood });
      for (const sx of [-1, 1]) {
        b.box(0.22, 0.16, 1.5, { x: tx + sx * 0.62, y: YA, z: tz, color: '#7a4e30', mat: M.wood });
        for (let m = 0; m < 3; m++) {
          const mz = tz - 0.5 + m * 0.5;
          seats.push([tx + sx * 0.62, YA + 0.16, mz, -sx * Math.PI / 2]);
          b.cyl(0.07, 0.045, 0.06, { x: tx + sx * 0.18, y: YA + 0.37, z: mz, color: rng() < 0.5 ? '#f2efe6' : '#cfe0e0', mat: M.porcelain, seg: 10 });
          b.cyl(0.055, 0.055, 0.012, { x: tx + sx * 0.18, y: YA + 0.425, z: mz, color: '#e8dcc0', mat: M.smooth, seg: 10 });
          if (rng() < 0.35) steamAt.push([tx + sx * 0.18, YA + 0.45, mz]);
        }
      }
    }
  }
  const gb = new Builder();
  // the head table at the front of the hall terrace: the pilgrims, Bajie with a tower of empty bowls
  const HT = [0, YB, -2.0];
  b.box(2.8, 0.06, 0.7, { x: HT[0], y: HT[1] + 0.34, z: HT[2], color: C.cinnabar, mat: M.lacquer });
  for (const [lx, lz] of [[-1.3, -0.3], [1.3, -0.3], [-1.3, 0.3], [1.3, 0.3]]) b.box(0.06, 0.34, 0.06, { x: HT[0] + lx, y: HT[1], z: HT[2] + lz, color: '#6a2a1e', mat: M.lacquer });
  figure(gb, 'monk', { x: -0.2, y: YB, z: HT[2] - 0.55, s: 1.3, pose: 'none' });
  figure(gb, 'bajie', { x: 0.8, y: YB, z: HT[2] - 0.55, s: 1.25, pose: 'none' });
  figure(gb, 'sha', { x: -1.15, y: YB, z: HT[2] - 0.5, s: 1.2, pose: 'none' });
  for (let i = 0; i < 9; i++) gb.cyl(0.075, 0.05, 0.06, { x: 1.1, y: HT[1] + 0.4 + i * 0.05, z: HT[2] + 0.05, color: '#f2efe6', mat: M.porcelain, seg: 10 });
  // 寇员外 himself, greeting beside the head table, and his wife
  const kb = new Builder();
  person(kb, { s: 1.3, robe: '#7a3a5a', robe2: '#c8a060', head: 'futou', pose: 'pray' });
  const kou = kb.build();
  const KOU = [2.0, YB, -1.85];
  kou.position.set(KOU[0], KOU[1], KOU[2]);
  object.add(kou);
  person(b, { x: 2.65, y: YB, z: -2.15, ry: -0.2, s: 1.15, robe: '#a05a4a', robe2: '#d8b090', head: 'bun', pose: 'stand' });
  const statics = b.build();
  // a private copy of the glow material so the lamps can be eased down a little at night (bloom rises)
  const glow = M.glow.clone();
  statics.traverse((o) => { if (o.isMesh && o.material === M.glow) o.material = glow; });
  object.add(statics);
  const guests = gb.build();
  object.add(guests);

  // the monks (two robe colours), who go home when night falls
  const monkMeshes = ['#8a6a4a', '#6a6a62'].map((robe) => instanced((ib) => person(ib, { s: 0.95, robe, robe2: '#b8a080', head: 'bald', pose: 'pray' }), Math.ceil(seats.length / 2), M.cloth));
  monkMeshes.forEach((m) => object.add(m));

  /* Wukong — hero of the loop: stands by the rift, drops into the chamber, goes down the tunnel, returns */
  const wb = new Builder();
  figure(wb, 'wukong', { pose: 'staff', s: 1.7 });
  const wukong = wb.build();
  object.add(wukong);
  const WK = [1.75, YA, 4.0];
  const sb = new Builder();
  person(sb, { robe: '#dfe8ff', robe2: '#ffffff', head: 'futou', pose: 'pray', skin: '#f0f4ff' });
  const soul = sb.build({ shadows: false });
  const soulMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#cfe0ff').multiplyScalar(1.3), transparent: true, opacity: 0.8 });
  soul.traverse((o) => { if (o.isMesh) o.material = soulMat; });
  object.add(soul);
  // the rift in the courtyard floor: a dark disc ringed with cold light
  const rb = new Builder();
  rb.cyl(0.62, 0.62, 0.01, { color: '#0e1220', mat: M.stone, seg: 24 });
  rb.torus(0.62, 0.03, { y: 0.02, rx: Math.PI / 2, color: '#9ab8ff', mat: M.glow, glow: 1.6, ts: 32, rs: 4 });
  const rift = rb.build({ shadows: false });
  rift.position.set(RIFT[0], RIFT[1] + 0.012, RIFT[2]);
  object.add(rift);

  /* bandits with torches, climbing up the terrace and over the west wall */
  const NB = 6;
  const bandits = instanced((ib) => {
    person(ib, { s: 1.1, robe: '#2a2826', robe2: '#3a3430', head: 'hood', hatColor: '#1e1c1a', pose: 'carry' });
    ib.cyl(0.012, 0.015, 0.5, { x: 0.12, y: 0.45, z: 0.12, rx: 0.3, color: C.woodD, seg: 4 });
  }, NB, M.cloth);
  object.add(bandits);
  const TORCH = NB * 2, torch = softPuffs(TORCH, { color: '#ff8a3a', opacity: 0.9, additive: true });
  const NIGHT = 70, night = softPuffs(NIGHT, { color: '#1e2238', opacity: 0.42 });
  const STEAM = steamAt.length, steam = softPuffs(STEAM, { color: '#ffffff', opacity: 0.5 });
  const MOTE = 36, motes = softPuffs(MOTE, { color: '#bcd0ff', opacity: 0.8, additive: true });
  object.add(night.points, steam.points, torch.points, motes.points);
  const nd = Array.from({ length: NIGHT }, () => { const [x, z] = rng.inDisc(9.6); return { x, z, y: 1 + rng() * 4, s: 3 + rng() * 3 }; });
  const bd = Array.from({ length: NB }, (_, i) => ({ z: -0.4 + i * 0.95 + rng() * 0.3, d: i * 0.012, tx: -3.0 + rng() * 1.6, tz: -0.9 + rng() * 0.5 }));
  const md = Array.from({ length: MOTE }, () => ({ a: rng() * 6.28, ph: rng(), r: 0.3 + rng() * 0.5 }));
  const steamC = new THREE.Color('#ffffff'), steamN = new THREE.Color('#8a94b0');

  object.rotation.y = 0.28;
  const TOPY = YA + 1.0 + 0.08;          // the wall top the bandits cross

  function update(t, dt, env) {
    const nk = env ? env.night : 0;
    const u = (t % CYCLE) / CYCLE;
    glow.color.setScalar(1 - 0.3 * nk);
    const dark = smooth(0.36, 0.44, u) * (1 - smooth(0.9, 0.98, u));
    const here = 1 - smooth(0.34, 0.4, u) * (1 - smooth(0.94, 0.99, u));
    for (let i = 0; i < seats.length; i++) {
      const [x, y, z, ry] = seats[i];
      setInst(monkMeshes[i % 2], i >> 1, x, y + Math.abs(Math.sin(t * 2 + i)) * 0.015, z, ry + Math.sin(t * 0.7 + i) * 0.1, here < 0.02 ? 0.0001 : here);
    }
    monkMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    guests.visible = here > 0.5;
    const lying = smooth(0.56, 0.6, u) * (1 - smooth(0.93, 0.96, u));
    kou.rotation.set(-lying * 1.45, 0.3 - lying * 0.3, 0, 'YXZ');
    kou.position.y = KOU[1] + lying * 0.08;
    // the banner ripples
    const P = banGeo.attributes.position.array;
    for (let i = 0; i < P.length; i += 3) {
      const y = banBase[i + 1], d = (G + BH - 0.72 - y) / BL;
      P[i + 2] = banBase[i + 2] + Math.sin(t * 1.7 - d * 5 + banBase[i] * 2) * 0.16 * d;
      P[i] = banBase[i] + Math.sin(t * 1.1 - d * 3) * 0.12 * d * d;
    }
    banGeo.attributes.position.needsUpdate = true;
    banGeo.computeVertexNormals();
    for (let i = 0; i < NIGHT; i++) { const n = nd[i]; night.set(i, n.x, n.y, n.z, n.s, dark * (1 - nk * 0.6)); }
    night.commit();
    steam.mat.uniforms.uColor.value.copy(steamC).lerp(steamN, nk);
    for (let i = 0; i < STEAM; i++) {
      const [x, y, z] = steamAt[i], p = (t * 0.25 + i * 0.37) % 1;
      steam.set(i, x + p * 0.1, y + p * 0.6, z, 0.12 + p * 0.25, (1 - dark) * Math.sin(Math.PI * p) * 0.8);
    }
    steam.commit();
    // bandits: up the terrace face and over the west wall, across the yard to the hall steps, then back out
    for (let i = 0; i < NB; i++) {
      const bb = bd[i];
      const go = clamp((u - 0.42 - bb.d) / 0.12), out = clamp((u - 0.6 - bb.d) / 0.1);
      let x, y, z;
      const seg = (k, x0, y0, z0, x1, y1, z1) => [lerp(x0, x1, k), lerp(y0, y1, k), lerp(z0, z1, k)];
      if (out <= 0) {
        if (go < 0.3) [x, y, z] = seg(go / 0.3, -WX - 0.6, G, bb.z, -WX, TOPY, bb.z);
        else if (go < 0.45) [x, y, z] = seg((go - 0.3) / 0.15, -WX, TOPY, bb.z, -WX + 0.6, YA, bb.z);
        else [x, y, z] = seg(ease((go - 0.45) / 0.55), -WX + 0.6, YA, bb.z, bb.tx, YA, bb.tz);
      } else {
        if (out < 0.6) [x, y, z] = seg(ease(out / 0.6), bb.tx, YA, bb.tz, -WX + 0.6, YA, bb.z);
        else if (out < 0.8) [x, y, z] = seg((out - 0.6) / 0.2, -WX + 0.6, YA, bb.z, -WX, TOPY, bb.z);
        else [x, y, z] = seg((out - 0.8) / 0.2, -WX, TOPY, bb.z, -WX - 0.6, G, bb.z);
      }
      const vis = u > 0.42 + bb.d && out < 1;
      const head = out > 0 ? -Math.PI / 2 : Math.PI / 2;
      setInst(bandits, i, x, y + Math.abs(Math.sin(t * 8 + i)) * 0.04, z, head, vis ? 1 : 0.0001);
      const c = Math.cos(head), s = Math.sin(head);
      torch.set(i, x + c * 0.13 + s * 0.13, y + 1.05, z - s * 0.13 + c * 0.13, 0.28 + 0.06 * Math.sin(t * 13 + i), vis ? 1 : 0);
      torch.set(i + NB, x + c * 0.13 + s * 0.13, y + 1.1, z - s * 0.13 + c * 0.13, 0.9, vis ? 0.35 : 0);
    }
    bandits.instanceMatrix.needsUpdate = true;
    torch.commit();
    // the rift opens; Wukong drops into the chamber, walks into the tunnel; returns with the soul
    const open = smooth(0.66, 0.7, u) * (1 - smooth(0.9, 0.94, u));
    rift.scale.set(Math.max(0.001, open), 1, Math.max(0.001, open));
    rift.visible = open > 0.01;
    const toRift = smooth(0.66, 0.7, u) * (1 - smooth(0.9, 0.95, u));
    const drop = ease(clamp((u - 0.7) / 0.03)) * (1 - ease(clamp((u - 0.86) / 0.03)));
    const inT = ease(clamp((u - 0.735) / 0.04)) * (1 - ease(clamp((u - 0.81) / 0.04)));   // walking to / from the tunnel
    const gone = smooth(0.765, 0.775, u) * (1 - smooth(0.795, 0.805, u));
    wukong.position.set(
      lerp(WK[0], RIFT[0], toRift),
      lerp(YA, G + 0.02, drop) + Math.abs(Math.sin(t * 2)) * 0.03 * (1 - toRift),
      lerp(lerp(WK[2], RIFT[2], toRift), CH.z0 + 0.25, inT));
    wukong.scale.setScalar(Math.max(0.001, 1 - gone));
    wukong.visible = gone < 0.99;
    const back = u > 0.79;
    wukong.rotation.y = toRift < 0.02 ? Math.PI + 0.4 : back ? lerp(Math.PI, Math.PI + 0.4, smooth(0.9, 0.95, u)) : lerp(Math.PI + 0.4, 0, toRift);
    // the soul: walks out of the tunnel beside Wukong, rises with him, floats up to the old man
    const sv = smooth(0.795, 0.81, u) * (1 - smooth(0.94, 0.97, u));
    soul.visible = sv > 0.01;
    const sk = ease(clamp((u - 0.89) / 0.05));
    const fx = wukong.position.x + 0.45, fy = wukong.position.y + 0.05, fz = wukong.position.z + 0.1;
    soul.position.set(lerp(fx, KOU[0], sk), lerp(fy, KOU[1] + 0.3, sk) + Math.sin(Math.PI * sk) * 2.2, lerp(fz, KOU[2], sk));
    soul.scale.setScalar(1.3 * Math.max(0.001, sv));
    soul.rotation.y = lerp(Math.PI, 0, sk);
    soulMat.opacity = 0.55 + 0.25 * Math.sin(t * 3) ** 2;
    for (let i = 0; i < MOTE; i++) {
      const m = md[i], p = (m.ph + t * 0.3) % 1;
      const onSoul = sv > 0.01;
      const cx = onSoul ? soul.position.x : RIFT[0], cy = onSoul ? soul.position.y + 0.4 : (i % 2 ? RIFT[1] : G + 0.3), cz = onSoul ? soul.position.z : (i % 2 ? RIFT[2] : CH.z0 + 0.3);
      const a = onSoul ? sv : (i % 2 ? open : 0.45 + 0.4 * open);
      motes.set(i, cx + Math.cos(m.a + t) * m.r * (1 - p), cy + p * 1.0, cz + Math.sin(m.a + t) * m.r * 0.6 * (1 - p), 0.08, a * Math.sin(Math.PI * p));
    }
    motes.commit();
  }
  update(0);
  return { object, update };
}
