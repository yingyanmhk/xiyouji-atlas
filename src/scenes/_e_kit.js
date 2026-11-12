// Private helpers for builder E's scenes (比丘国 … 铜台府): generic townsfolk with hats / bald
// heads / kneeling poses, city walls and gate towers, courtyard walls, lanterns, paving palettes,
// and an InstancedMesh crowd helper. Built only from kit primitives.
import { THREE, Builder, M, C, roof, hall, noise2, hash2, mix, clamp } from '../kit.js';

/**
 * person — a townsman/official/child, ~0.7 tall at s = 1, facing +z.
 * head: 'bald' | 'hat' | 'bun' | 'futou' (official's cap) | 'crown' | 'child' | 'hood' | 'none'
 * pose: 'stand' | 'kneel' | 'bow' | 'pray' | 'up' (arms raised) | 'hammer' | 'carry' | 'none'
 */
export function person(b, o = {}) {
  const { robe = '#5a6a7a', robe2 = null, skin = C.skin, head = 'hat', hatColor = '#b59a64', pose = 'stand', s = 1, wide = 1, headMat = M.smooth } = o;
  b.push({ x: o.x, y: o.y, z: o.z, ry: o.ry, s });
  const kneel = pose === 'kneel';
  const H = kneel ? 0.26 : 0.44;
  const rb = (kneel ? 0.17 : 0.13) * wide;
  b.lathe([[0, 0], [rb, 0], [rb * 0.93, H * 0.3], [0.085 * wide, H], [0, H]], { color: robe, mat: M.cloth, seg: 10 });
  if (kneel) b.push({ y: H, rx: 0.45 }); else if (pose === 'bow') b.push({ y: H, rx: 0.6 }); else b.push({ y: H });
  b.cyl(0.072 * wide, 0.085 * wide, 0.13, { y: -0.02, color: robe2 || robe, mat: M.cloth, seg: 8 });
  const hy = 0.17;
  b.sphere(0.065, { y: hy, color: skin, mat: head === 'bald' ? headMat : M.smooth, ws: 12, hs: 9 });
  if (head === 'hat') b.cone(0.13, 0.08, { y: hy + 0.03, color: hatColor, mat: M.cloth, seg: 10 });
  else if (head === 'bun') { b.sphere(0.058, { y: hy + 0.02, z: -0.015, color: C.ink, mat: M.smooth, ws: 8, hs: 6 }); b.sphere(0.03, { y: hy + 0.075, z: -0.02, color: C.ink, mat: M.smooth, ws: 6, hs: 5 }); }
  else if (head === 'futou') { b.cyl(0.05, 0.058, 0.07, { y: hy + 0.02, color: C.ink, mat: M.cloth, seg: 8 }); b.box(0.26, 0.012, 0.018, { y: hy + 0.06, z: -0.03, color: C.ink, mat: M.cloth }); }
  else if (head === 'crown') { b.cyl(0.05, 0.045, 0.06, { y: hy + 0.03, color: C.gold, mat: M.metal, seg: 8 }); b.box(0.14, 0.012, 0.09, { y: hy + 0.09, color: C.ink, mat: M.cloth }); }
  else if (head === 'child') { for (const sx of [-1, 1]) b.sphere(0.022, { x: sx * 0.04, y: hy + 0.055, color: C.ink, mat: M.smooth, ws: 6, hs: 4 }); }
  else if (head === 'hood') b.sphere(0.075, { y: hy + 0.01, z: -0.01, sy: 1.1, color: hatColor, mat: M.cloth, ws: 8, hs: 6 });
  // arms
  const arm = (sx, rz, rx = 0, len = 0.18) => b.cyl(0.02, 0.024, len, { x: sx * 0.08, y: 0.05, rz, rx, color: robe2 || robe, mat: M.cloth, seg: 5 });
  if (pose === 'stand') { arm(-1, Math.PI + 0.25); arm(1, Math.PI - 0.25); }
  else if (pose === 'kneel' || pose === 'pray' || pose === 'bow') { arm(-1, Math.PI - 0.4, -0.9, 0.16); arm(1, Math.PI + 0.4, -0.9, 0.16); }
  else if (pose === 'up') { arm(-1, 0.5, 0, 0.2); arm(1, -0.5, 0, 0.2); }
  else if (pose === 'carry') { arm(-1, Math.PI - 0.2, -1.3); arm(1, Math.PI + 0.2, -1.3); }
  b.pop();
  b.pop();
}

/** 寿星 the Old Man of the South Pole: tall domed brow, white beard, crooked staff with a gourd */
export function shouxing(b, { x = 0, y = 0, z = 0, ry = 0, s = 1 } = {}) {
  b.push({ x, y, z, ry, s });
  b.lathe([[0, 0], [0.15, 0], [0.14, 0.15], [0.09, 0.44], [0, 0.44]], { color: '#c8b07a', mat: M.cloth, seg: 12 });
  b.cyl(0.08, 0.095, 0.12, { y: 0.42, color: '#a34a36', mat: M.cloth, seg: 10 });
  b.sphere(0.065, { y: 0.6, color: C.skin, mat: M.smooth });
  b.sphere(0.07, { y: 0.69, z: -0.01, sy: 1.5, color: '#efcfb0', mat: M.smooth });     // the great brow
  b.cone(0.05, 0.16, { y: 0.44, z: 0.05, rx: Math.PI, color: C.white, mat: M.cloth, seg: 8 }); // beard (inverted cone)
  b.tube([[0.16, 0, 0.04], [0.17, 0.4, 0.04], [0.15, 0.78, 0.06], [0.1, 0.86, 0.08]], 0.012, { color: C.woodD, mat: M.wood });
  b.sphere(0.04, { x: 0.13, y: 0.76, z: 0.1, color: C.gold, mat: M.smooth });
  b.sphere(0.03, { x: 0.13, y: 0.82, z: 0.1, color: C.gold, mat: M.smooth });
  b.pop();
}

/** simple deer: body, legs, neck, head, small antlers */
export function deer(b, { x = 0, y = 0, z = 0, ry = 0, s = 1, color = '#efe9dc', antler = '#c9b48a' } = {}) {
  b.push({ x, y, z, ry, s });
  b.sphere(0.2, { y: 0.42, sx: 0.75, sy: 0.7, sz: 1.4, color, mat: M.smooth });
  for (const [lx, lz] of [[-0.08, 0.17], [0.08, 0.17], [-0.08, -0.17], [0.08, -0.17]]) b.cyl(0.022, 0.028, 0.34, { x: lx, z: lz, color, mat: M.smooth, seg: 5 });
  b.cyl(0.05, 0.07, 0.28, { y: 0.5, z: 0.22, rx: 0.4, color, mat: M.smooth, seg: 7 });
  b.sphere(0.07, { y: 0.78, z: 0.32, sz: 1.4, color, mat: M.smooth });
  for (const sx of [-1, 1]) {
    b.tube([[sx * 0.03, 0.83, 0.3], [sx * 0.08, 0.95, 0.28], [sx * 0.1, 1.04, 0.24]], 0.01, { color: antler, mat: M.wood, radial: 4 });
    b.tube([[sx * 0.075, 0.93, 0.28], [sx * 0.04, 1.0, 0.33]], 0.008, { color: antler, mat: M.wood, radial: 4 });
  }
  b.pop();
}

/** city wall segment from (x0,z0) to (x1,z1) with crenellations; faces whichever way */
export function cityWall(b, x0, z0, x1, z1, { y = 0, h = 1.4, t = 0.7, color = '#8e8a80', cap = '#6f6c66', merlon = 0.45 } = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  b.push({ x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, ry });
  b.box(t * 1.12, h * 0.25, L, { color: mix(color, '#000', 0.12).getHex() });
  b.box(t, h, L, { color });
  b.box(t + 0.06, 0.08, L, { y: h, color: cap });
  const n = Math.max(2, Math.floor(L / merlon));
  for (let i = 0; i < n; i += 2) {
    const zz = -L / 2 + (i + 0.5) * (L / n);
    for (const sx of [-1, 1]) b.box(0.14, 0.2, L / n * 0.9, { x: sx * (t / 2 - 0.05), y: h + 0.08, z: zz, color });
  }
  b.pop();
}

/** gate tower 城门楼: a massive gate block with a dark arch, crowned by a two-eaved tower */
export function gateTower(b, { x = 0, y = 0, z = 0, ry = 0, w = 3.6, d = 1.6, h = 1.9, color = '#8e8a80', roofColor = C.tile, wall = C.wallRed, r, lit = 0 } = {}) {
  b.push({ x, y, z, ry });
  b.box(w, h, d, { color });
  b.box(w + 0.1, 0.08, d + 0.1, { y: h, color: '#6f6c66' });
  // arch: dark recess
  const sh = new THREE.Shape();
  sh.moveTo(-0.45, 0); sh.lineTo(-0.45, 0.85); sh.absarc(0, 0.85, 0.45, Math.PI, 0, true); sh.lineTo(0.45, 0); sh.lineTo(-0.45, 0);
  b.extrude(sh, d + 0.04, { color: '#1e1c1b', mat: M.stone });
  hall(b, { y: h, w: w * 0.72, d: d * 0.8, h: 0.95, base: 0.12, tiers: 2, roofColor, wall, steps: false, r, lit });
  b.pop();
}

/** whitewashed courtyard wall with a little grey tile cap */
export function tileWall(b, x0, z0, x1, z1, { y = 0, h = 0.75, t = 0.16, color = C.wall, cap = C.tile } = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  b.push({ x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, ry });
  b.box(t, h, L, { color });
  b.box(t * 1.05, 0.06, L, { color: '#8d8a80' });
  b.pop();
  roof(b, { x: (x0 + x1) / 2, y: y + h, z: (z0 + z1) / 2, ry: ry + Math.PI / 2, w: L, d: t * 0.6, h: 0.12, over: 0.1, lift: 0.01, flare: 0, color: cap });
}

/** red paper lantern (hanging from y) — glow body, dark caps */
export function lantern(b, { x = 0, y = 0, z = 0, s = 1, color = '#ff8a4a', glow = 1.6, string = true } = {}) {
  b.push({ x, y, z, s });
  if (string) b.cyl(0.004, 0.004, 0.12, { y: -0.12, color: C.ink, seg: 3 });
  b.sphere(0.075, { y: -0.2, sy: 1.2, color, mat: M.glow, glow, ws: 10, hs: 8 });
  for (const yy of [-0.12, -0.29]) b.cyl(0.035, 0.035, 0.02, { y: yy - 0.01, color: C.ink, mat: M.smooth, seg: 8 });
  b.cyl(0.004, 0.006, 0.07, { y: -0.36, color: '#c23a2a', seg: 3 });
  b.pop();
}

/** paving palette: stone flags with joints + per-flag tone noise, optional mask function → other colour */
export function paving(a = '#a9a397', bb = '#8f8a80', cell = 0.9) {
  const out = new THREE.Color();
  return (x, y, z) => {
    const i = Math.floor(x / cell), j = Math.floor((z + (i % 2) * cell * 0.5) / cell);
    const f = hash2(i * 3 + 11, j * 7 + 5);
    return mix(a, bb, f * 0.7 + 0.15 * noise2(x * 0.3, z * 0.3), out);
  };
}

/** InstancedMesh from a builder function (single material) */
export function instanced(fn, count, mat = M.smooth) {
  const ib = new Builder();
  fn(ib);
  const mesh = new THREE.InstancedMesh(ib.merged(), mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** a ring of rough grey ink-wash colour for 'monochrome' scenes */
export function inkRock(hmax, { base = 0, moss = '#7f9a86' } = {}) {
  const out = new THREE.Color(), tmp = new THREE.Color();
  return (x, y, z, nx, ny) => {
    const t = clamp((y - base) / hmax);
    const st = noise2((x + z) * 1.5, y * 0.25) - 0.5;
    mix('#9a9a94', '#3d3f42', t * 0.9 + st * 0.25, out).multiplyScalar(0.94 + st * 0.2);
    const up = clamp((ny - 0.55) * 3 + st * 0.3);
    if (up > 0) out.lerp(tmp.set(moss), up * 0.75);
    return out;
  };
}

export { clamp };

/** night tint for unlit soft puffs (mist, steam, smoke, dust): eases their colour toward a moonlit
 *  grey-blue as k (env.night) → 1, so they do not glow against the dark. amount scales the effect. */
const _nt = new THREE.Color(), _NTM = new THREE.Color(0.34, 0.39, 0.52);
export function nightTint(puffs, k, amount = 1) {
  const c = puffs.mat.uniforms.uColor.value;
  const d = puffs.mat.userData.day || (puffs.mat.userData.day = c.clone());
  c.copy(d).lerp(_nt.copy(d).multiply(_NTM), k * amount);
}
