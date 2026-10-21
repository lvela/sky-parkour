// LEVEL 30 — Heavy Planet: an alien world with crushing gravity. New: shockwave pylons.
const ALIEN = { soil: 0x3a1a30, rockA: 0x4a2a40, rockB: 0x6a3a58, dark: 0x200e1a, grassA: 0xc04a8a, grassB: 0xe06aa0 };

export default {
  id: 'heavy',
  name: 'Heavy Planet',
  tagline: 'Crushing gravity keeps your jumps short while shockwave pylons ripple across the ground.',
  exposure: 0.7,
  gravity: 1.35,
  sky: {
    mode: 'gradient', light: { elev: 22, az: -40 },
    zen: [0.08, 0.02, 0.06], hor: [0.6, 0.25, 0.15], glow: [0.8, 0.4, 0.1], glowPow: 5, glowAmt: 0.6,
    cov: 0.5, cloudBright: 0.7, cloudShade: 0.6, cirrus: 0.8, tint: [1.2, 0.7, 0.8],
    planet: { elev: 30, az: 40, size: 26, bright: 1.0, a: [0.9, 0.5, 0.3], b: [0.5, 0.2, 0.3], tilt: 0.3 },
  },
  light: { color: 0xffb090, intensity: 2.6 }, envIntensity: 1.0, fog: 0.0015,
  hemi: { sky: 0x804060, ground: 0x301020, intensity: 0.5 },
  theme: {
    top: { p: 'speckle', a: '#6a3a5a', b: ['#7a4a6a', '#5a2a4a', '#8a5a3a'], seed: 301 },
    side: { p: 'speckle', a: '#4a2a40', b: ['#3a1a30', '#5a3a50'], lip: '#c04a8a', seed: 302 },
    stone: { p: 'hex', a: '#4a2a40', b: ['#5a3a50', '#3a1a30'], line: '#ffa040', glow: true, size: 26, seed: 303 },
    palette: ALIEN, accent: '#ffa040',
  },
  scenery: { islands: { palette: ALIEN, leafHue: 0.85, leafSat: 0.6, leafLight: 0.5, count: 24, seed: 301 }, sea: {}, clouds: { count: 60 } },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'HEAVY PLANET', 'Gravity is crushing here: your jumps are short and low. Shockwaves must be jumped!', 0, '#ffa040');

    // HEAVY STEPS
    [-11.5, -16.5, -21.5, -26.5].forEach((z, i) => b.plat({ x: [0, 0.8, -0.8, 0][i], y: 0, z, w: 3, d: 3, h: 1, style: 'trim', rock: true, rockDepth: 3 }));
    b.plat({ x: 0, y: 0, z: -34, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -34);

    // SHOCKWAVES
    b.sign(3, 0, -32, 'SHOCKWAVES', 'The pylons send out rings along the ground. Jump each one as it reaches you.', 0, '#ffa040');
    b.plat({ x: 0, y: 0, z: -52, w: 12, d: 24, style: 'top' });
    b.pulseEmitter({ x: -4, y: 0, z: -46, period: 2.6, maxR: 10 });
    b.pulseEmitter({ x: 4, y: 0, z: -57, period: 2.2, phase: 1, maxR: 10 });
    b.plat({ x: 0, y: 0, z: -70, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -70);

    // GRAVITY WELL — trampolines are the only way up here
    b.sign(-3, 0, -68, 'GRAVITY WELL', 'Trampolines barely lift you here. Bounce up the ledges.', 0, '#4dd2ff');
    b.plat({ x: 0, y: 0, z: -77.5, w: 3, d: 3, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 4, z: -84, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 4, z: -87.5, w: 3, d: 3, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 8, z: -93.5, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 8, z: -101, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 8, -101);

    // PULSE BRIDGE — rings sweep across a narrow bridge
    b.sign(3, 8, -99, 'PULSE BRIDGE', 'Rings cross the bridge from both sides. Hop them!', 0, '#ffa040');
    b.plat({ x: 0, y: 8, z: -117, w: 3, d: 24, style: 'top' });
    b.plat({ x: 5, y: 8, z: -111, w: 2, d: 2, style: 'trim' });
    b.plat({ x: -5, y: 8, z: -121, w: 2, d: 2, style: 'trim' });
    b.pulseEmitter({ x: 5, y: 8, z: -111, period: 2.4, maxR: 11, speed: 7 });
    b.pulseEmitter({ x: -5, y: 8, z: -121, period: 2.0, phase: 0.9, maxR: 11, speed: 7 });
    b.plat({ x: 0, y: 8, z: -135, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 8, -135);

    // DRIFTERS — short hops between sliding platforms
    b.sign(-3, 8, -133, 'DRIFTERS', 'Short hops between the sliding platforms.', 0, '#4dd2ff');
    [-142, -147, -152].forEach((z, i) => b.plat({ x: 0, y: 8, z, w: 3, d: 3, h: 0.6, style: 'trim', motion: b.mo((v, t) => { v.x = Math.sin(t * 1.2 + i * 2.1) * 2.5; }) }));
    b.bonusFinish('squeeze', 0, 8, -161, 12, 12, 16);
  },
};
