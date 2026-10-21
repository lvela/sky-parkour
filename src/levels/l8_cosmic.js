// LEVEL 8 — Cosmic Rift: low gravity in deep space. Moon jumps, phasing platforms, grab bars, a spinner and a sweeper.
export default {
  id: 'cosmic',
  name: 'Cosmic Rift',
  tagline: 'Low gravity in deep space: moon jumps, phasing platforms, grab bars and a cosmic spinner.',
  exposure: 1.0,
  gravity: 0.55,
  sky: {
    mode: 'gradient', light: { elev: 30, az: -60 },
    zen: [0.0005, 0.0008, 0.002], hor: [0.004, 0.005, 0.012], glow: [0, 0, 0], glowAmt: 0,
    cov: 2, cirrus: 0, stars: 1.3, milky: 1.2, nebula: 1, space: true,
    planet: { elev: 16, az: 165, size: 20, bright: 1.0, a: [0.3, 0.55, 0.95], b: [0.12, 0.28, 0.6], tilt: 0.35 },
    moon: { elev: 42, az: -70, size: 2.2, bright: 0.8 },
  },
  light: { color: 0xffffff, intensity: 2.4 }, envIntensity: 1.6, fog: 0.0003,
  hemi: { sky: 0x4050a0, ground: 0x101018, intensity: 0.5 },
  theme: { top: 'panel', side: 'panel', stone: 'panel', palette: 'space', neon: 0xff4dff, accent: '#ff7af0' },
  scenery: { islands: { palette: 'space', trees: false, crystals: true, count: 30, seed: 51 }, sea: false, clouds: false },
  killY: -60,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'COSMIC RIFT', 'Low gravity! You jump higher and float further out here.', 0, '#ff7af0');

    // MOON JUMPS — big gaps
    [[0, 1.5], [2, 3], [-2, 4.5], [0, 6]].forEach(([x, y], i) => b.plat({ x, y, z: -14.5 - i * 10, w: 3, d: 3, h: 0.8, style: 'panel', rock: true, rockDepth: 3 }));
    b.plat({ x: 0, y: 6, z: -54, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -53);

    // PHASING PLATFORMS — spaced for a full low-gravity jump (~10 m)
    b.sign(3, 6, -56, 'PHASE SHIFT', 'These platforms blink in and out. Jump while they\'re solid!', 0, '#ff4dff');
    [-67.5, -80, -92.5].forEach((z, i) => b.blink({ x: 0, y: 6, z, w: 4.5, d: 5, period: 3.2, on: 0.6, phase: (i % 2) * 1.6 }));
    const Z = -5; // everything after the phasing platforms
    b.plat({ x: 0, y: 6, z: -102 + Z, w: 8, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 6, -100 + Z);

    // ZERO-G GRAB BARS
    b.sign(-3, 6, -99 + Z, 'ORBITAL BARS', 'Grab the bars and fling yourself across. You float far here!', 0, '#7af7ff');
    b.bar(0, 9.6, -109 + Z, 3);
    b.bar(0, 9.6, -117 + Z, 3, t0((v, t) => { v.y = Math.sin(t * 1.2) * 1.2; }));
    b.bar(0, 9.6, -125 + Z, 3, t0((v, t) => { v.x = Math.sin(t * 0.9) * 2; }));
    b.bar(0, 9.6, -133 + Z, 3);
    b.plat({ x: 0, y: 7, z: -142 + Z, w: 8, d: 8, style: 'island', rock: true });

    // COSMIC SPINNER
    for (const a of [0, Math.PI / 2]) b.plat({ x: 0, y: 7, z: -154 + Z, w: 12, d: 2.2, h: 0.6, style: 'panel', yaw: a, neon: false, motion: t0((v, t) => { v.yaw = t * 0.6; }) });
    b.plat({ x: 0, y: 7, z: -169 + Z, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 7, -165.2 + Z);
    b.sweeper({ x: 0, y: 7, z: -170.5 + Z, r: 3.5, speed: 1.8 });

    // TRAMPOLINE TO THE FINISH
    b.sign(-3.6, 7, -164.5 + Z, 'STARLAUNCH', 'Jump the sweeper, drop onto the trampoline and float up to the finish.', 0, '#ffd84d');
    b.plat({ x: 0, y: 3, z: -178 + Z, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 14 });
    b.bonusFinish('mines', 0, 10, -190 + Z, 12, 12, 16);
  },
};
