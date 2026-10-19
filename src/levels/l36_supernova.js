// LEVEL 36 — Supernova: the edge of an exploding star. New: chain-collapse paths that fall apart behind you.
export default {
  id: 'supernova',
  name: 'Supernova',
  tagline: 'The star is collapsing and so is the path behind you. Outrun it through shockwaves and falling debris.',
  exposure: 0.6,
  sky: {
    mode: 'gradient', light: { elev: 15, az: 0 },
    zen: [0.15, 0.05, 0.2], hor: [1.2, 0.5, 0.2], glow: [3, 1.5, 0.5], glowPow: 6, glowAmt: 1.5,
    cov: 2, cirrus: 0, nebula: 1.5, stars: 0.3, space: true,
  },
  light: { color: 0xffd0a0, intensity: 3.0 }, envIntensity: 1.2, fog: 0.0006,
  hemi: { sky: 0xff8040, ground: 0x401060, intensity: 0.8 },
  theme: {
    top: { p: 'hex', a: '#2a1020', b: ['#3a1428', '#1e0a16'], line: '#ff8a3a', glow: true, size: 28, seed: 361 }, side: 'panel',
    stone: { p: 'cracks', a: '#1a0a14', b: ['#2a1020'], line: '#ff5a2a', glow: true, seed: 362 },
    palette: 'space', neon: 0xff8a3a, accent: '#ff8a3a',
  },
  scenery: { islands: { palette: 'space', trees: false, crystals: true, count: 28, seed: 361 }, sea: false, clouds: false, embers: true },
  killY: -60,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'SUPERNOVA', 'Step on an orange-edged path and it starts collapsing behind you. Don\'t stop running!', 0, '#ff8a3a');

    // CHAIN COLLAPSE
    b.collapse({ x: 0, y: 0, z0: -9.3, n: 10, w: 2.8, d: 2.6 });
    b.plat({ x: 0, y: 0, z: -41.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -41.5);

    // STELLAR WAVES — shockwaves and falling debris
    b.sign(3, 0, -39.5, 'STELLAR WAVES', 'Jump the shockwave rings and dodge the debris.', 0, '#ffa040');
    b.plat({ x: 0, y: 0, z: -57.5, w: 12, d: 24, style: 'top' });
    b.pulseEmitter({ x: -3, y: 0, z: -51.5, period: 2.2, maxR: 8 });
    b.pulseEmitter({ x: 3, y: 0, z: -62.5, period: 2.0, phase: 1, maxR: 8 });
    b.rockfall({ x0: -6, x1: 6, z0: -46, z1: -69, y: 0, period: 1.1, aim: 0.4 });
    b.plat({ x: 0, y: 0, z: -73.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -73.5);

    // COLLAPSING CLIMB — a weaving, rising path that falls apart
    b.sign(-3, 0, -71.5, 'COLLAPSING CLIMB', 'Up and around… and it\'s falling apart behind you.', 0, '#ff8a3a');
    b.collapse({ x: 0, y: 0, z0: -78.8, n: 10, xs: [0, 1.2, 0, -1.2], ys: Array.from({ length: 10 }, (_, i) => i * 0.4), interval: 0.45, lead: 0.8 });
    b.plat({ x: 0, y: 3.6, z: -111.1, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 3.6, -111.1);

    // GRAVITY STORM — a collapsing bridge crossed by shockwaves
    b.sign(3, 3.6, -109.1, 'GRAVITY STORM', 'A collapsing bridge with shockwaves crossing it. Run AND jump!', 0, '#ffa040');
    b.collapse({ x: 0, y: 3.6, z0: -116.4, n: 8, w: 3, d: 2.6, interval: 0.45 });
    for (const [x, z, ph] of [[4.5, -122, 0], [-4.5, -132, 1.1]]) {
      b.plat({ x, y: 3.6, z, w: 2, d: 2, style: 'trim' });
      b.pulseEmitter({ x, y: 3.6, z, period: 2.2, phase: ph, maxR: 9, speed: 7 });
    }
    b.plat({ x: 0, y: 3.6, z: -142.7, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 3.6, -142.7);

    // NOVA — the final collapse, under a hail of debris
    b.sign(-3, 3.6, -140.7, 'NOVA', 'The final collapse. Debris everywhere. GO!', 0, '#ff5a2a');
    b.collapse({ x: 0, y: 3.6, z0: -148, n: 10, w: 2.8, d: 2.6, interval: 0.4, lead: 0.7 });
    b.rockfall({ x0: -1.5, x1: 1.5, z0: -147, z1: -176, y: 3.6, period: 0.9, aim: 0.5 });
    b.finish(0, 3.6, -182.3, 12, 12, 16);
  },
};
