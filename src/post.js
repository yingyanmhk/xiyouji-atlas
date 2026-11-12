// Post: GTAO → bloom → tone map → grade (tilt-shift, silk ground, warm vignette, fibre grain).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uTilt: { value: 0.6 },
    uFocusY: { value: 0.5 },
    uVignette: { value: 0.9 },
    uGrain: { value: 0.035 },
    uFade: { value: 1 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uTilt, uFocusY, uVignette, uGrain, uFade;
    uniform vec2 uRes;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){
      // tilt-shift: blur grows away from the focus band
      float d = abs(vUv.y - uFocusY);
      float amt = smoothstep(0.12, 0.55, d) * uTilt;
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      if (amt > 0.001) {
        vec3 acc = col; float wsum = 1.0;
        vec2 px = 1.0 / uRes * amt * 9.0;
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 2.39996;
          float r = sqrt(float(i) + 0.5) / 3.5;
          vec2 o = vec2(cos(a), sin(a)) * r * px;
          acc += texture2D(tDiffuse, vUv + o).rgb; wsum += 1.0;
        }
        col = acc / wsum;
      }
      // warm, slightly desaturated grade toward silk
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, 0.92);
      col *= vec3(1.02, 1.0, 0.95);
      // silk: woven fibres + slow blotches
      vec2 fp = vUv * uRes;
      float weave = (n(fp * vec2(0.9, 0.06)) + n(fp * vec2(0.06, 0.9))) * 0.5;
      float blot = n(vUv * 6.0) * 0.6 + n(vUv * 23.0) * 0.4;
      col *= 0.965 + 0.05 * weave;
      col = mix(col, col * vec3(0.95, 0.9, 0.82), (blot - 0.5) * 0.18 + 0.04);
      // vignette toward old-silk brown
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      float v = smoothstep(0.35, 1.05, length(q)) * uVignette;
      col = mix(col, col * vec3(0.62, 0.52, 0.4), v * 0.75);
      col += (h(fp + fract(uTime) * 91.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
};

export function createPost(renderer, scene, camera, { ao = true } = {}) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let aoPass = null;
  if (ao) {
    aoPass = new GTAOPass(scene, camera, size.x, size.y);
    aoPass.output = GTAOPass.OUTPUT.Default;
    aoPass.blendIntensity = 0.85;
    aoPass.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1 });
    // only the dioramas get AO — not the far ridges, pillars or sky
    aoPass.setSceneClipBox(new THREE.Box3(new THREE.Vector3(-260, -5, -260), new THREE.Vector3(260, 90, 160)));
    composer.addPass(aoPass);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.45, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  const resize = (w, h) => {
    composer.setSize(w, h);
    const pr = renderer.getPixelRatio();
    grade.uniforms.uRes.value.set(w * pr, h * pr);
  };
  resize(window.innerWidth, window.innerHeight);
  return { composer, bloom, grade, ao: aoPass, resize };
}
