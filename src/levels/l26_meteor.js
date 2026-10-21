// LEVEL 26 — Meteor Shower: a scorched plateau under a sky full of falling stars. New: meteor strikes and orbiting platforms.
export default {
  id: 'meteor',
  name: 'Meteor Shower',
  tagline: 'Meteors rain down on red-ringed targets while platforms orbit glowing hubs.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 35, az: 160 },
    zen: [0.002, 0.003, 0.012], hor: [0.02, 0.025, 0.06], glow: [0.3, 0.1, 0.05], glowPow: 4, glowAmt: 0.3,
    cov: 0.7, cloudBright: 0.2, cloudShade: 0.3, cirrus: 0.2, stars: 1.4, milky: 1.2,
    moon: { elev: 25, az: 160, size: 3, bright: 0.9 },
  },
  light: { color: 0xa0b0ff, intensity: 1.5 }, envIntensity: 1.3, fog: 0.0008,
  hemi: { sky: 0x303a6a, ground: 0x401a10, intensity: 0.6 },
  theme: {
    top: { p: 'cracks', a: '#2a2626', b: ['#3a3434', '#1e1a1a'], line: '#ff6a2a', glow: true, seed: 261 }, side: 'basalt', stone: 'basalt',
    palette: 'volcano', accent: '#ff6a2a',
  },
  scenery: { islands: { palette: 'volcano', trees: false, count: 20, seed: 261 }, sea: {}, clouds: { count: 30 } },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'METEOR SHOWER', 'Red rings show where meteors will land. Keep moving and dodge!', 0, '#ff6a2a');

    // IMPACT ZONE
    b.plat({ x: 0, y: 0, z: -30, w: 10, d: 40, style: 'top' });
    b.rockfall({ x0: -5, x1: 5, z0: -12, z1: -48, y: 0, period: 0.9, aim: 0.5 });
    b.plat({ x: 0, y: 0, z: -56, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -56);

    // ORBITAL RING
    b.sign(3, 0, -54, 'ORBITAL RING', 'Ride a platform round the hub to the far side.', 0, '#ffe08a');
    b.orbit({ cx: 0, y: 0, cz: -72, R: 7, n: 3, speed: 0.5 });
    b.plat({ x: 0, y: 0, z: -86, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -86);

    // METEOR BRIDGE
    b.sign(-3, 0, -84, 'METEOR BRIDGE', 'A narrow bridge with nowhere to hide. Read the rings!', 0, '#ff6a2a');
    b.plat({ x: 0, y: 0, z: -106, w: 3, d: 30, style: 'top' });
    b.rockfall({ x0: -1.5, x1: 1.5, z0: -92, z1: -120, y: 0, period: 0.8, aim: 0.7 });
    b.plat({ x: 0, y: 0, z: -126, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -126);

    // DOUBLE ORBIT — two rings spinning opposite ways, under fire
    b.sign(3, 0, -124, 'DOUBLE ORBIT', 'Two rings, opposite spins, meteors overhead.', 0, '#ffe08a');
    b.orbit({ cx: 0, y: 0, cz: -140, R: 6, n: 3, speed: 0.6 });
    b.orbit({ cx: 0, y: 0, cz: -156, R: 6, n: 3, speed: -0.6, phase: 0.5 });
    b.rockfall({ x0: -6, x1: 6, z0: -134, z1: -162, y: 0, period: 1.3, aim: 0.4 });
    b.plat({ x: 0, y: 0, z: -168, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -168);

    // SHOOTING STARS — sprint for the finish
    b.sign(-3, 0, -166, 'SHOOTING STARS', 'The heaviest rain yet. Sprint!', 0, '#ff6a2a');
    b.plat({ x: 0, y: 0, z: -184, w: 4, d: 24, style: 'top' });
    b.rockfall({ x0: -2, x1: 2, z0: -173, z1: -195, y: 0, period: 0.6, aim: 0.6 });
    b.bonusFinish('lowGrav', 0, 0, -202, 12, 12, 16);
  },
};
