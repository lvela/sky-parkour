// Procedural soundtrack (WebAudio, no audio files). A cheerful parkour track while you run —
// each level gets its own key, tempo and melody from its seed — and a driving minor-key track
// for boss fights. Notes are scheduled slightly ahead on the audio clock so timing stays tight.
// M toggles the music. Slow-mo halves the tempo and muffles it.

const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];

function rng(seed) {
  let s = (seed * 2654435761) % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// scale degree (can be negative / above 7) → semitones
const deg = (scale, d) => Math.floor(d / 7) * 12 + scale[((d % 7) + 7) % 7];

// A song is 8 bars of 16 steps. Each generator returns { bpm, step(i, time, out) }.
function happySong(seed, bpm) {
  const r = rng(seed + 11);
  const root = 48 + [0, 2, 4, 5, 7, -3][seed % 6];
  const progs = [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 5], [0, 3, 4, 4], [5, 3, 0, 4]];
  const prog = progs[Math.floor(r() * progs.length)];
  const rhythms = [
    [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
    [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1],
  ];
  // melody: phrase A for bars 0–3, repeated with a new ending for bars 4–7
  const melody = [];
  let d = 7 + prog[0] + 2;
  const phrase = [];
  for (let bar = 0; bar < 4; bar++) {
    const rh = rhythms[Math.floor(r() * rhythms.length)];
    const ch = prog[bar];
    const notes = [];
    for (let s = 0; s < 16; s++) {
      if (!rh[s]) { notes.push(null); continue; }
      if (s % 4 === 0) { const tones = [ch, ch + 2, ch + 4].map((x) => x + 7); d = tones.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a)); if (r() < 0.3) d = tones[Math.floor(r() * 3)]; }
      else d += [-2, -1, -1, 1, 1, 2][Math.floor(r() * 6)];
      d = Math.max(5, Math.min(16, d));
      notes.push(d);
    }
    phrase.push(notes);
  }
  for (let bar = 0; bar < 8; bar++) {
    if (bar < 7) melody.push(phrase[bar % 4]);
    else { const end = phrase[3].slice(); for (let s = 8; s < 16; s++) end[s] = s === 8 ? 7 + prog[3] : null; end[12] = 7; melody.push(end); }
  }
  const leadType = ['square', 'triangle', 'sawtooth'][seed % 3];
  return {
    bpm,
    step(i, t, o) {
      const bar = Math.floor(i / 16) % 8, s = i % 16, ch = prog[bar % 4];
      const big = Math.floor(i / 128) % 2 === 1; // every other loop adds a sparkly arpeggio
      if (s % 4 === 0) o.kick(t, 0.9);
      if (s === 4 || s === 12) o.clap(t, 0.35);
      if (s % 2 === 0) o.hat(t, s % 4 === 2 ? 0.12 : 0.06);
      if (s === 14 && bar % 2) o.hat(t, 0.1, 0.18);
      // bouncy bass: root / octave
      if ([0, 3, 6, 8, 10, 11, 14].includes(s)) o.tone('triangle', midi(root - 12 + deg(MAJOR, ch) + (s === 6 || s === 14 ? 12 : 0)), t, 0.16, 0.32, 900);
      // off-beat chord stabs
      if (s % 4 === 2) for (const k of [0, 2, 4]) o.tone('square', midi(root + 12 + deg(MAJOR, ch + k)), t, 0.1, 0.035, 2400);
      const m = melody[bar][s];
      if (m !== null) { o.tone(leadType, midi(root + 12 + deg(MAJOR, m)), t, 0.2, leadType === 'sawtooth' ? 0.05 : 0.07, 3200); o.tone('triangle', midi(root + 24 + deg(MAJOR, m)), t, 0.18, 0.03); }
      if (big) o.tone('triangle', midi(root + 24 + deg(MAJOR, ch + [0, 2, 4, 7][s % 4])), t, 0.08, 0.025);
      if (bar === 7 && s >= 12) o.tom(t, 0.3, 160 - (s - 12) * 20);
    },
  };
}

function bossSong(seed, bpm) {
  const r = rng(seed + 99);
  const root = 45 + [0, -2, 2, -4, 5][seed % 5];
  const progs = [[0, 5, 6, 0], [0, 3, 5, 4], [0, 6, 5, 4], [0, 0, 5, 6]];
  const prog = progs[Math.floor(r() * progs.length)];
  // a stern melody in long notes
  const lead = [];
  for (let bar = 0; bar < 8; bar++) {
    const ch = prog[bar % 4], notes = new Array(16).fill(null);
    const pat = bar % 4 === 3 ? [0, 3, 6, 8, 10, 12, 14] : [0, 6, 8, 12];
    let d = 7 + ch;
    for (const s of pat) { notes[s] = d; d += [-1, 1, 2, -2, 0, 4][Math.floor(r() * 6)]; d = Math.max(4, Math.min(14, d)); }
    lead.push(notes);
  }
  return {
    bpm,
    step(i, t, o) {
      const bar = Math.floor(i / 16) % 8, s = i % 16, ch = prog[bar % 4];
      if (s % 4 === 0 || s === 10 || (s === 14 && bar % 2)) o.kick(t, 1);
      if (s === 4 || s === 12) o.snare(t, 0.45);
      o.hat(t, s % 2 ? 0.05 : 0.09);
      // galloping 16th bass
      o.tone('sawtooth', midi(root - 12 + deg(MINOR, ch) + (s % 8 === 6 ? 12 : 0)), t, 0.1, 0.1, 700 + 300 * (s % 4 === 0));
      if (s === 0) for (const k of [0, 2, 4]) o.tone('sawtooth', midi(root + deg(MINOR, ch + k)), t, 1.6, 0.03, 1400); // brass pad
      if (s === 0 || s === 8) o.tone('square', midi(root + 12 + deg(MINOR, ch)), t, 0.08, 0.05, 2000); // stab
      const m = lead[bar][s];
      if (m !== null) { o.tone('sawtooth', midi(root + 12 + deg(MINOR, m)), t, 0.4, 0.06, 2600); o.tone('square', midi(root + deg(MINOR, m)), t, 0.4, 0.03, 1200); }
      if (bar === 7 && s >= 8 && s % 2 === 0) o.tom(t, 0.4, 200 - (s - 8) * 15);
    },
  };
}

export class Music {
  constructor(sfx) {
    this.sfx = sfx; this.bus = null; this.muted = false; this.vol = 0.32;
    this.want = null; this.cur = null; this.key = ''; this.i = 0; this.next = 0; this.rate = 1;
    this.fadeUntil = 0;
  }

  setup() {
    const ctx = this.sfx.ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = this.muted ? 0 : this.vol;
    this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 18000;
    this.bus.connect(this.filter).connect(this.sfx.master);
    const out = this.out = {};
    const env = (node, t, dur, vol, attack = 0.005) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      node.connect(g).connect(this.bus);
      return g;
    };
    out.tone = (type, f, t, dur, vol, cutoff) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      let n = o;
      if (cutoff) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff; o.connect(fl); n = fl; }
      env(n, t, dur, vol); o.start(t); o.stop(t + dur + 0.02);
    };
    const noise = (t, dur, vol, type, freq) => {
      const s = ctx.createBufferSource(); s.buffer = this.sfx.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      s.connect(f); env(f, t, dur, vol, 0.002); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
    };
    out.kick = (t, v) => {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      env(o, t, 0.28, 0.55 * v, 0.003); o.start(t); o.stop(t + 0.3);
    };
    out.clap = (t, v) => { noise(t, 0.14, v, 'bandpass', 1500); noise(t + 0.012, 0.1, v * 0.6, 'bandpass', 1100); };
    out.snare = (t, v) => { noise(t, 0.18, v, 'bandpass', 1900); out.tone('triangle', 190, t, 0.1, v * 0.5); };
    out.hat = (t, v, dur = 0.035) => noise(t, dur, v, 'highpass', 7500);
    out.tom = (t, v, f) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.2); env(o, t, 0.25, v, 0.003); o.start(t); o.stop(t + 0.3); };
  }

  // name: 'run' | 'boss' | null (silence). seed varies the tune; bpm overrides the tempo.
  play(name, seed = 0, bpm = 0) {
    const key = name ? `${name}:${seed}:${bpm}` : '';
    if (key === this.key) return;
    this.key = key;
    this.want = name ? (name === 'boss' ? bossSong(seed, bpm || 148) : happySong(seed, bpm || 122 + (seed % 4) * 4)) : null;
    if (!this.bus) { this.cur = this.want; this.i = 0; return; }
    // fade the old tune out, then start the new one from the top
    const t = this.sfx.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setTargetAtTime(0.0001, t, 0.12);
    this.fadeUntil = t + 0.5;
  }

  toggle() {
    this.muted = !this.muted;
    if (this.bus) this.bus.gain.setTargetAtTime(this.muted ? 0.0001 : this.vol, this.sfx.ctx.currentTime, 0.1);
    return !this.muted;
  }

  setSlow(on) {
    const r = on ? 0.5 : 1;
    if (r === this.rate) return;
    this.rate = r;
    if (this.filter) this.filter.frequency.setTargetAtTime(on ? 900 : 18000, this.sfx.ctx.currentTime, 0.15);
  }

  // current position in beats (for blocks that switch in time with the music), or null if silent
  beatNow() {
    const ctx = this.sfx.ctx;
    if (!ctx || !this.cur || !this.bus || ctx.state !== 'running') return null;
    const stepDur = 60 / this.cur.bpm / 4 / this.rate;
    return (this.i - (this.next - ctx.currentTime) / stepDur) / 4;
  }

  // call every frame
  tick() {
    const ctx = this.sfx.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (!this.bus) { this.setup(); this.cur = this.want; this.i = 0; this.next = ctx.currentTime + 0.1; }
    const now = ctx.currentTime;
    if (this.fadeUntil && now >= this.fadeUntil) {
      this.fadeUntil = 0; this.cur = this.want; this.i = 0; this.next = now + 0.05;
      this.bus.gain.cancelScheduledValues(now);
      this.bus.gain.setTargetAtTime(this.muted ? 0.0001 : this.vol, now, 0.05);
    }
    if (this.next < now) this.next = now + 0.03; // recover after the tab was hidden
    while (this.next < now + 0.15) {
      if (this.cur && !this.fadeUntil) this.cur.step(this.i, this.next, this.out);
      this.i++;
      this.next += 60 / (this.cur ? this.cur.bpm : 120) / 4 / this.rate;
    }
  }
}
