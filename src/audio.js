// Synthesised sound effects + wind ambience (WebAudio, no audio files).
export class SFX {
  constructor() { this.ctx = null; }

  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // wind: looping noise through a moving band-pass
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'bandpass'; this.windFilter.frequency.value = 400; this.windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.05;
    src.connect(this.windFilter).connect(this.windGain).connect(this.master);
    src.start();
    // slow gusts
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(this.windGain.gain); lfo.start();
    // slide hiss
    const s2 = ctx.createBufferSource(); s2.buffer = this.noiseBuf; s2.loop = true;
    const f2 = ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 2500;
    this.slideGain = ctx.createGain(); this.slideGain.gain.value = 0;
    s2.connect(f2).connect(this.slideGain).connect(this.master); s2.start();
  }

  setWind(speed, sliding = false) {
    if (!this.ctx) return;
    const k = Math.min(1, speed / 35), t = this.ctx.currentTime;
    if (this.slideGain) this.slideGain.gain.setTargetAtTime(sliding ? 0.04 + Math.min(1, speed / 26) * 0.12 : 0, t, 0.08);
    this.windGain.gain.setTargetAtTime(0.05 + k * k * 0.55, t, 0.15);
    this.windFilter.frequency.setTargetAtTime(350 + k * 1600, t, 0.15);
  }

  tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur, type, f0, f1, vol = 0.2, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  jump() { this.tone(240, 480, 0.14, 'triangle', 0.15); this.noise(0.1, 'highpass', 1500, 3000, 0.05); }
  land(k) { this.tone(140, 45, 0.18, 'sine', 0.15 + 0.3 * k); this.noise(0.16, 'lowpass', 900, 150, 0.08 + 0.25 * k); }
  bounce() { this.tone(160, 700, 0.35, 'sine', 0.28); this.tone(80, 350, 0.3, 'triangle', 0.12); }
  wallJump() { this.noise(0.09, 'bandpass', 1400, 700, 0.3); this.tone(380, 620, 0.1, 'square', 0.05); }
  grab() { this.tone(1100, 850, 0.06, 'square', 0.04); this.tone(520, 420, 0.09, 'triangle', 0.14); }
  whoosh() { this.noise(0.45, 'bandpass', 350, 1900, 0.22); }
  zip() { this.noise(1.8, 'bandpass', 2400, 900, 0.08); this.tone(900, 600, 1.8, 'sawtooth', 0.015); }
  crack() { this.noise(0.12, 'bandpass', 2600, 1400, 0.18); }
  crumble() { this.noise(0.7, 'lowpass', 700, 90, 0.35); }
  checkpoint() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.3, 'triangle', 0.14, i * 0.09)); }
  death() { this.tone(420, 55, 1.4, 'sawtooth', 0.08); this.noise(1.6, 'lowpass', 500, 60, 0.3); }
  knock() { this.tone(180, 60, 0.25, 'square', 0.12); this.noise(0.25, 'lowpass', 1800, 200, 0.4); this.tone(900, 300, 0.12, 'triangle', 0.08); }
  wallSlide() { this.noise(0.5, 'bandpass', 3000, 1800, 0.08); }
  hurt() { this.tone(520, 180, 0.3, 'sawtooth', 0.1); }
  roar() { this.tone(110, 55, 1.6, 'sawtooth', 0.16); this.tone(165, 70, 1.5, 'square', 0.06); this.noise(1.6, 'lowpass', 900, 120, 0.3); }
  slam() { this.tone(90, 30, 0.6, 'sine', 0.5); this.noise(0.7, 'lowpass', 600, 60, 0.5); }
  throwRock() { this.noise(0.5, 'bandpass', 300, 900, 0.2); }
  boulder() { this.tone(120, 40, 0.4, 'sine', 0.4); this.noise(0.5, 'lowpass', 1200, 100, 0.4); }
  bossHit() { [880, 660, 440].forEach((f, i) => this.tone(f, f * 0.7, 0.3, 'square', 0.08, i * 0.08)); this.noise(0.6, 'highpass', 4000, 1500, 0.25); this.roar(); }
  explode() { this.tone(70, 20, 2.2, 'sine', 0.6); this.noise(2.5, 'lowpass', 2000, 50, 0.6); }
  firework() { this.noise(0.12, 'highpass', 3000, 6000, 0.12); this.noise(1.2, 'lowpass', 1500, 100, 0.18, 0.05); }
  thunder(delay = 0) { this.noise(3.2, 'lowpass', 600, 40, 0.55, delay); this.tone(60, 30, 2.5, 'sine', 0.25, delay); }
  cannon() { this.tone(150, 50, 0.3, 'sine', 0.3); this.noise(0.35, 'lowpass', 1500, 200, 0.3); }
  fireHit() { this.noise(0.5, 'bandpass', 900, 200, 0.4); this.tone(300, 80, 0.3, 'sawtooth', 0.08); }
  zap() { this.noise(0.25, 'highpass', 5000, 2000, 0.3); this.tone(1800, 200, 0.25, 'square', 0.06); this.noise(1.2, 'lowpass', 500, 50, 0.4, 0.05); }
  swat() { this.noise(0.4, 'bandpass', 250, 1200, 0.3); }
  warp() { this.tone(200, 1400, 0.35, 'sine', 0.12); this.tone(1400, 300, 0.3, 'triangle', 0.06, 0.15); }
  pop() { this.tone(900, 1800, 0.08, 'sine', 0.1); }
  heal() { [300, 400, 520].forEach((f, i) => this.tone(f, f * 1.5, 0.4, 'sine', 0.12, i * 0.1)); }
  win() {
    const seq = [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]];
    seq.forEach(([f, d]) => { this.tone(f, f, 0.35, 'triangle', 0.16, d); this.tone(f / 2, f / 2, 0.35, 'sine', 0.1, d); });
    [1047, 1319, 1568].forEach((f) => this.tone(f, f, 1.2, 'triangle', 0.08, 0.8));
  }
}
