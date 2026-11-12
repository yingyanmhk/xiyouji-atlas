import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/ma-shan-zheng/400.css';
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStage, basin, journeyLayout, routeThread, fivePillars, mistField, BASIN_LIFT } from './world.js';
import { createPost } from './post.js';
import { SCENES, SCENE, CAT, CATEGORIES } from './data.js';
import { loadBuilder, hasBuilder } from './scenes/index.js';
import { rng, ease } from './kit.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';

// optional text data written by the text editor (docs/texts/nan81.json, tour.json)
const extra = import.meta.glob('../docs/texts/{nan81,tour}.json', { eager: true, import: 'default' });
const NAN81 = Object.entries(extra).find(([k]) => k.includes('nan81'))?.[1] || [];
const TOUR = Object.entries(extra).find(([k]) => k.includes('tour'))?.[1] || {};

const params = new URLSearchParams(location.search);
const SOLO = params.get('solo');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!SOLO });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = params.get('shadows') !== '0';
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 9000);
const stage = createStage(scene);
const post = createPost(renderer, scene, camera, { ao: params.get('ao') !== '0' });
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = 1.48;
controls.minDistance = 6;
controls.maxDistance = 900;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  post.resize(window.innerWidth, window.innerHeight);
});

/* ---- day / night: k eases toward the target; scenes receive env.night ---- */
const env = { night: 0 };
let nightTarget = 0;
function applyNight(k) {
  env.night = k;
  stage.setNight(k);
  post.bloom.strength = 0.45 + 0.4 * k;
  post.bloom.threshold = 0.9 - 0.25 * k;
  renderer.toneMappingExposure = 1.05 + 0.2 * k;
  mistRef?.setNight(k);
  pillarsRef?.userData.setNight(k);
  if (threadRef) threadRef.mat.uniforms.uNight.value = k;
}
let mistRef = null, pillarsRef = null, threadRef = null;
function stepNight(dt) {
  if (Math.abs(env.night - nightTarget) < 0.001) return;
  const k = env.night + Math.sign(nightTarget - env.night) * Math.min(Math.abs(nightTarget - env.night), dt / 2.5);
  applyNight(k);
}
window.__setNight = (on) => { nightTarget = on ? 1 : 0; };

function setShadowSpan(half) {
  const sc = stage.sun.shadow.camera;
  if (Math.abs(sc.right - half) < 0.5) return;
  sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half;
  sc.far = 120 + half * 2;
  sc.updateProjectionMatrix();
}

/* ============================================================ solo ===== */
const VIEWS = {
  front: [[0, 18, 46], [0, 7.5, 0]],
  side: [[44, 15, 6], [0, 6.5, 0]],
  back: [[0, 16, -44], [0, 6.5, 0]],
  top: [[0, 62, 0.01], [0, 0, 0]],
  close: [[8, 8.5, 15], [0, 5, 1]],
  low: [[3, 2.6, 25], [0, 6.5, 0]],
  far: [[0, 60, 150], [0, 4, 0]],
  rim: [[4, 1.5, 26], [0, -1.2, 0]],
};

async function solo(id) {
  document.body.classList.add('solo');
  const s = SCENE[id] || { id, cat: 'origin' };
  const accent = CAT[s.cat].color;
  const holder = new THREE.Group();
  holder.position.y = BASIN_LIFT;
  scene.add(holder);
  holder.add(basin(accent));
  const build = await loadBuilder(id);
  const res = build({ rng: rng(id), accent, scene: s });
  holder.add(res.object);
  unCullInstances(res.object);
  const [p, tg] = VIEWS[params.get('view') || 'front'] || VIEWS.front;
  camera.position.set(p[0], p[1] + BASIN_LIFT, p[2]);
  controls.target.set(tg[0], tg[1] + BASIN_LIFT, tg[2]);
  controls.update();
  stage.aimSun(controls.target);
  post.grade.uniforms.uTilt.value = +(params.get('tilt') ?? 0.35);
  if (params.get('night') === '1') { nightTarget = 1; applyNight(1); }
  const fixedT = params.has('t') ? +params.get('t') : null;
  const clock = makeClock();
  let frames = 0;
  const loop = () => {
    const t = fixedT ?? clock.getElapsedTime();
    res.update?.(t, 1 / 60, env);
    controls.update();
    post.grade.uniforms.uTime.value = fixedT ?? t;
    post.composer.render();
    if (++frames === 4) window.__ready = true;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ============================================================= app ===== */
async function app() {
  const pts = journeyLayout(SCENES.length);
  const entries = SCENES.map((s, i) => {
    const scale = s.id === 'lingshan' ? 1.6 : 1;
    const holder = new THREE.Group();
    holder.position.set(pts[i].x, BASIN_LIFT * scale, pts[i].z);
    holder.add(basin(CAT[s.cat].color, scale));
    const stage3 = new THREE.Group();
    stage3.scale.setScalar(scale);
    holder.add(stage3);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(12 * scale, 12 * scale, 22 * scale, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 6 * scale;
    hit.userData.index = i;
    holder.add(hit);
    scene.add(holder);
    return { s, i, holder, stage: stage3, hit, scale, update: null, built: hasBuilder(s.id),
      sphere: new THREE.Sphere(new THREE.Vector3(pts[i].x, 6, pts[i].z), 16 * scale) };
  });
  const thread = routeThread(pts);
  threadRef = thread;
  scene.add(thread.mesh);
  pillarsRef = fivePillars(scene);
  const mist = mistField(scene, pts);
  mistRef = mist;

  const audio = createAudio();
  const toggleNight = () => { nightTarget = nightTarget ? 0 : 1; ui.setNight(!!nightTarget); audio.setNight(nightTarget); };
  const toggleSound = () => ui.setSound(audio.toggle());
  const toggleNan = () => ui.nanOpen(!ui.nanIsOpen, current >= 0 ? entries[current].s.id : null);
  const ui = createUI({
    categories: CATEGORIES,
    onPrev: () => go(-1), onNext: () => go(1), onHome: () => home(),
    onTour: () => (tour ? stopTour() : startTour()), onNan: toggleNan, onNight: toggleNight, onSound: toggleSound,
  });
  const nansOf = (id) => NAN81.filter((x) => x.scene === id);
  ui.buildNan(NAN81, (id) => SCENE[id], (s) => CAT[s.cat].color, (i) => { ui.nanOpen(false); stopTour(); focus(i); });

  // load every scene (P0: three real ones, the rest placeholders)
  let loaded = 0;
  for (const e of entries) {
    const build = await loadBuilder(e.s.id);
    const res = build({ rng: rng(e.s.id), accent: CAT[e.s.cat].color, scene: e.s });
    e.stage.add(res.object);
    unCullInstances(res.object);
    e.update = res.update;
    ui.progress(++loaded / entries.length);
  }

  /* camera flights */
  const OVER = { pos: new THREE.Vector3(0, 185, 420), tgt: new THREE.Vector3(0, 0, -30) };
  camera.position.set(0, 520, 900);
  controls.target.copy(OVER.tgt);
  let flight = null, current = -1;
  const fly = (pos, tgt, dur = 2.2) => {
    flight = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), start: performance.now(), dur: dur * 1000 };
  };
  const focus = (i) => {
    current = (i + entries.length) % entries.length;
    const e = entries[current], k = e.scale;
    // aim to the right of the basin so it sits left of the side panel
    const tgt = e.holder.position.clone().add(new THREE.Vector3(5.5 * k, 5.5 * k, 0));
    const pos = tgt.clone().add(new THREE.Vector3(4 * k, 10 * k, 38 * k));
    fly(pos, tgt);
    ui.show(e.s, CAT[e.s.cat], e.built, nansOf(e.s.id));
    history.replaceState(null, '', '#' + e.s.id);
  };
  /* tour: station by station in the order of the book, with a 过场 caption between stations */
  let tour = null;
  const TOUR_DWELL = 15000;
  const tourStep = () => {
    if (!tour) return;
    const i = tour.i;
    if (i >= entries.length) { stopTour(); home(); return; }
    const e = entries[i];
    ui.hide();
    ui.caption(`第 ${i + 1} 站 · ${e.s.name}`, TOUR[e.s.id] || '', 5200);
    ui.touring(true, i, entries.length, e.s.name);
    focus(i);
    ui.hide();
    tour.t1 = setTimeout(() => { if (tour) ui.show(e.s, CAT[e.s.cat], e.built, nansOf(e.s.id)); }, 5000);
    tour.t2 = setTimeout(() => { if (tour) { tour.i++; tourStep(); } }, TOUR_DWELL);
  };
  const startTour = (from = Math.max(0, current)) => {
    stopTour();
    tour = { i: from };
    controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
    tourStep();
  };
  function stopTour() {
    if (!tour) return;
    clearTimeout(tour.t1); clearTimeout(tour.t2);
    tour = null;
    controls.autoRotate = false;
    ui.touring(false);
  }
  const home = () => { current = -1; fly(OVER.pos, OVER.tgt); ui.hide(); history.replaceState(null, '', location.pathname + location.search); };
  const go = (d) => { stopTour(); focus(current < 0 ? (d > 0 ? 0 : entries.length - 1) : current + d); };

  ui.onEnter(() => {
    const id = location.hash.slice(1);
    const idx = entries.findIndex((e) => e.s.id === id);
    if (idx >= 0) focus(idx); else fly(OVER.pos, OVER.tgt, 3.2);
    if (params.get('mute') !== '1') ui.setSound(audio.toggle(true));   // the click on 展卷 unlocks audio
  });

  /* picking */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const hits = entries.map((e) => e.hit);
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
  renderer.domElement.addEventListener('pointermove', (ev) => {
    mouse.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects(hits, false)[0];
    if (h) { const e = entries[h.object.userData.index]; ui.tip(`${e.s.name}<small>第${e.s.hui}回</small>`, ev.clientX, ev.clientY); document.body.style.cursor = 'pointer'; }
    else { ui.tip(null); document.body.style.cursor = ''; }
  });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 5) return;
    mouse.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects(hits, false)[0];
    if (h) { stopTour(); focus(h.object.userData.index); }
  });
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') go(1);
    else if (ev.key === 'ArrowLeft') go(-1);
    else if (ev.key === 'Escape') { if (ui.nanIsOpen) ui.nanOpen(false); else { stopTour(); home(); } }
    else if (ev.key === 'h' || ev.key === 'H') document.body.classList.toggle('bare');
    else if (ev.key === 'n' || ev.key === 'N') toggleNight();
    else if (ev.key === 'm' || ev.key === 'M') toggleSound();
    else if (ev.key === 't' || ev.key === 'T') (tour ? stopTour() : startTour());
    else if (ev.key === 'c' || ev.key === 'C') toggleNan();
  });

  /* loop */
  const clock = makeClock();
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    stepNight(dt);
    if (flight) {
      const k = Math.min(1, (performance.now() - flight.start) / flight.dur), e = ease(ease(k));
      camera.position.lerpVectors(flight.p0, flight.p1, e);
      // arc the flight upward between two close shots
      const lift = Math.sin(Math.PI * k) * flight.p0.distanceTo(flight.p1) * 0.18;
      camera.position.y += lift;
      controls.target.lerpVectors(flight.t0, flight.t1, e);
      if (k >= 1) flight = null;
    }
    controls.update();
    const dist = camera.position.distanceTo(controls.target);
    stage.aimSun(controls.target);
    setShadowSpan(THREE.MathUtils.clamp(dist * 0.45, 24, 190));
    // level of detail for the whole frame: AO and per-frame shadows only matter up close
    const far = dist > 170 && !flight;
    if (post.ao) post.ao.enabled = dist < 170;
    renderer.shadowMap.autoUpdate = !far;
    if (far && (frameN++ % 20 === 0)) renderer.shadowMap.needsUpdate = true;
    post.grade.uniforms.uTilt.value = THREE.MathUtils.clamp(0.25 + dist / 500, 0.3, 0.85);
    post.grade.uniforms.uTime.value = t;
    thread.mat.uniforms.uTime.value = t;
    mist.update(t);
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(pv);
    for (const e of entries) {
      if (e.update && frustum.intersectsSphere(e.sphere) && camera.position.distanceTo(e.sphere.center) < 320) e.update(t, dt, env);
    }
    post.composer.render();
    fpsN++; if (t - fpsT > 1) { window.__fps = fpsN / (t - fpsT); fpsN = 0; fpsT = t; }
    requestAnimationFrame(loop);
  };
  let fpsN = 0, fpsT = 0, frameN = 0;
  loop();
  window.__app = { focus, home, entries, startTour, stopTour, toggleNight, toggleNan };
}

if (SOLO) solo(SOLO); else app();

function makeClock() {
  const t0 = performance.now();
  let last = t0;
  return {
    elapsedTime: 0,
    getElapsedTime() { return (performance.now() - t0) / 1000; },
    getDelta() { const n = performance.now(), d = (n - last) / 1000; last = n; this.elapsedTime = (n - t0) / 1000; return d; },
  };
}

// InstancedMesh bounding spheres are computed once from the first frame's matrices; scenes that start with
// hidden (scale-0) instances would then be culled for good. They live inside a basin, so never cull them.
function unCullInstances(root) {
  root.traverse((o) => { if (o.isInstancedMesh) o.frustumCulled = false; });
}
