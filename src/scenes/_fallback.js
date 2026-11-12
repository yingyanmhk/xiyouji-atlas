// Placeholder for scenes not yet built: a pale mound, a scholar rock and a pine.
import { THREE, Builder, M, C, rock, pine, terrain, fbm, smooth } from '../kit.js';

export function fallback({ rng }) {
  const b = new Builder();
  const k = rng() * 10;
  terrain(b, { R: 10.6, rings: 18, segs: 64, fn: (x, z) => 0.15 + smooth(9, 2, Math.hypot(x, z)) * (0.6 + fbm(x * 0.3 + k, z * 0.3) * 1.4),
    palette: (x, y) => (y > 0.9 ? '#cfc5ad' : '#d8cfb9') });
  rock(b, { x: -1.5, y: 0.6, z: -0.5, r: 1.4, h: 3.2, color: '#b9b2a2', rand: rng });
  pine(b, { x: 1.6, y: 1.0, z: 0.6, h: 2.6, r: rng, color: '#9aa596' });
  const object = new THREE.Group();
  object.add(b.build());
  return { object, update() {} };
}
