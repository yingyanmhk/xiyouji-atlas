// Generative soundscape: a low drone, wind, and plucked guqin-like strings (Karplus–Strong) in the
// D 五声 pentatonic (宫商角徵羽 = D E F# A B), through a synthetic hall reverb. At night the plucks
// thin out, the drone darkens and a stone chime (磬) sounds now and then.
const PENTA = [0, 2, 4, 7, 9];          // semitones above 宫
const ROOT = 146.83;                     // D3

export function createAudio() {
  let ctx = null, master = null, on = false, night = 0, timer = null;
  let droneFilter = null, windFilter = null, windGain = null;
  const plucks = new Map();

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    // hall reverb from decaying noise
    const verb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    verb.connect(wet).connect(master);
    ctx._verb = verb;

    // drone: D2 + A2, slightly detuned, through a slow lowpass
    droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass'; droneFilter.frequency.value = 420; droneFilter.Q.value = 0.6;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.07;
    droneFilter.connect(droneGain).connect(master);
    for (const [f, type] of [[73.42, 'triangle'], [73.7, 'sine'], [110.0, 'sine']]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = type === 'triangle' ? 0.6 : 0.4;
      o.connect(g).connect(droneFilter); o.start();
    }
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain(); lfoG.gain.value = 140;
    lfo.connect(lfoG).connect(droneFilter.frequency); lfo.start();

    // wind: filtered noise with a wandering band
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 500; windFilter.Q.value = 0.8;
    windGain = ctx.createGain(); windGain.gain.value = 0.035;
    noise.connect(windFilter).connect(windGain).connect(master);
    windGain.connect(verb);
    noise.start();
    const wl = ctx.createOscillator(); wl.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 260;
    wl.connect(wlg).connect(windFilter.frequency); wl.start();
    return true;
  }

  // Karplus–Strong, rendered once per pitch and cached
  function pluckBuffer(freq) {
    const key = freq.toFixed(2);
    if (plucks.has(key)) return plucks.get(key);
    const sr = ctx.sampleRate, N = Math.round(sr / freq), len = Math.round(sr * 3.5);
    const buf = ctx.createBuffer(1, len, sr), out = buf.getChannelData(0);
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin((i / N) * Math.PI));
    let p = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[p];
      const nxt = 0.5 * (cur + ring[(p + 1) % N]) * 0.9965;
      out[i] = cur * 0.6 + last * 0.4; last = cur;
      ring[p] = nxt;
      p = (p + 1) % N;
    }
    plucks.set(key, buf);
    return buf;
  }

  function pluck(freq, when, vel = 0.5, bend = 0) {
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(freq);
    if (bend) {   // 吟猱: a slight slide after the attack, like a guqin finger sliding
      src.playbackRate.setValueAtTime(1, when + 0.25);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, bend / 12), when + 0.7);
    }
    const g = ctx.createGain(); g.gain.value = vel * 0.32;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600 - night * 1300;
    src.connect(lp).connect(g);
    g.connect(master); g.connect(ctx._verb);
    src.start(when);
  }

  function chime(when) {   // 磬: inharmonic partials, long decay
    for (const [ratio, amp] of [[1, 0.5], [2.76, 0.25], [5.4, 0.12], [8.93, 0.06]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 392 * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 0.12, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 5 / ratio + 1);
      o.connect(g); g.connect(master); g.connect(ctx._verb);
      o.start(when); o.stop(when + 7);
    }
  }

  const note = (deg, oct = 0) => {
    const d = ((deg % 5) + 5) % 5, o = Math.floor(deg / 5) + oct;
    return ROOT * Math.pow(2, (PENTA[d] + 12 * o) / 12);
  };

  // a phrase: a short stepwise walk in the pentatonic, sometimes with a harmonic octave
  function phrase() {
    if (!on) return;
    const t0 = ctx.currentTime + 0.05;
    let deg = Math.floor(Math.random() * 7);
    const n = 2 + Math.floor(Math.random() * (night > 0.5 ? 2 : 4));
    let t = t0;
    for (let i = 0; i < n; i++) {
      pluck(note(deg), t, 0.35 + Math.random() * 0.35, Math.random() < 0.25 ? (Math.random() < 0.5 ? 1 : -1) : 0);
      if (Math.random() < 0.18) pluck(note(deg, 1), t + 0.01, 0.2);
      deg += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      deg = Math.max(-2, Math.min(9, deg));
      t += 0.35 + Math.random() * 0.7;
    }
    if (night > 0.5 && Math.random() < 0.35) chime(t + 1.5);
    timer = setTimeout(phrase, (t - t0) * 1000 + (night > 0.5 ? 5000 : 2500) + Math.random() * 5000);
  }

  return {
    toggle(force) {
      const want = force ?? !on;
      if (want && !ctx && !init()) return false;
      if (!ctx) return false;
      on = want;
      if (on) {
        ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
        clearTimeout(timer); timer = setTimeout(phrase, 1200);
      } else {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        clearTimeout(timer);
      }
      return on;
    },
    get on() { return on; },
    setNight(k) {
      night = k;
      if (!ctx) return;
      droneFilter.frequency.setTargetAtTime(420 - 180 * k, ctx.currentTime, 1);
      windGain.gain.setTargetAtTime(0.035 + 0.02 * k, ctx.currentTime, 1);
    },
  };
}
