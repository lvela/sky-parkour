// LEVEL 32 — Digital Grid: inside a glowing computer world. New: glitch blocks that teleport between spots.
const VOID = { soil: 0x050808, rockA: 0x0a1014, rockB: 0x10181e, dark: 0x020404, grassA: 0x0a2a2a, grassB: 0x0a3a3a };

export default {
  id: 'grid',
  name: 'Digital Grid',
  tagline: 'Glitch blocks teleport between spots, firewalls flicker and data streams lift you up.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 40, az: 0 },
    zen: [0, 0, 0.005], hor: [0, 0.02, 0.03], glow: [0, 0.3, 0.3], glowPow: 6, glowAmt: 0.4,
    cov: 2, cirrus: 0, stars: 0.4, tint: [0.6, 1.1, 1.1],
  },
  light: { color: 0x4dfff0, intensity: 1.6 }, envIntensity: 1.4, fog: 0.0012,
  hemi: { sky: 0x0a4a4a, ground: 0x000a0a, intensity: 0.6 },
  theme: {
    top: { p: 'grid', a: '#020608', b: ['#041014', '#02080a'], line: '#4dfff0', n: 8, seed: 321 },
    side: { p: 'grid', a: '#020608', b: ['#041014'], line: '#2a8a90', n: 4, seed: 322 },
    stone: { p: 'grid', a: '#020608', b: ['#041014'], line: '#4dfff0', n: 4, seed: 323 },
    palette: VOID, neon: 0x4dfff0, accent: '#4dfff0',
  },
  scenery: {
    islands: { palette: VOID, trees: false, crystals: true, count: 30, seed: 321 }, sea: false, clouds: false,
    drift: [{ count: 900, color: 0x4dfff0, size: 0.08, fall: -2, sway: 0.3, additive: true }],
  },
  killY: -50,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'DIGITAL GRID', 'Glitch blocks jump between two spots. The ghost outline shows where they\'ll go next.', 0, '#4dfff0');

    // GLITCH HOPS
    for (let i = 0; i < 4; i++) {
      const s = i % 2 ? 1 : -1;
      b.glitch({ x: s * 2, y: 0, z: -12.5 - i * 6, alt: { x: -s * 2, y: 0, z: -12.5 - i * 6 }, period: 3 });
    }
    b.plat({ x: 0, y: 0, z: -39, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -39);

    // FIREWALL — blinking platforms with laser tripwires
    b.sign(3, 0, -37, 'FIREWALL', 'Blinking platforms with laser tripwires. Hop the beams!', 0, '#ff2a4a');
    [-47.5, -54, -60.5].forEach((z, i) => {
      b.blink({ x: 0, y: 0, z, w: 4, d: 4, period: 3, on: 0.65, phase: i * 0.9 });
      b.laser({ x: 0, y: 0, z, w: 4, low: true, period: 1.5, on: 0.5, phase: i * 0.5 });
    });
    b.plat({ x: 0, y: 0, z: -69, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -69);

    // DATA STREAM — blocks that glitch up and down
    b.sign(-3, 0, -67, 'DATA STREAM', 'These glitch up and down. Hop across when they line up.', 0, '#4dfff0');
    [[0.8, -76.5], [2.8, -82.5], [4.8, -88.5]].forEach(([y, z], i) => b.glitch({ x: 0, y, z, alt: { x: 0, y: y + 2, z }, period: 3, phase: i % 2 ? 1.5 : 0 }));
    b.plat({ x: 0, y: 6.8, z: -96, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6.8, -96);

    // CORRUPTION — blocks that glitch back and forth
    b.sign(3, 6.8, -94, 'CORRUPTION', 'The path rearranges itself. Wait for the gaps to close.', 0, '#ff4dff');
    b.glitch({ x: 0, y: 6.8, z: -103.5, alt: { x: 0, y: 6.8, z: -107.5 }, period: 3, color: 0xff4dff });
    b.glitch({ x: 0, y: 6.8, z: -112, alt: { x: 0, y: 6.8, z: -116 }, period: 3, phase: 1.5, color: 0xff4dff });
    b.plat({ x: 0, y: 6.8, z: -122, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6.8, -122);

    // SYSTEM CRASH
    b.sign(-3, 6.8, -120, 'SYSTEM CRASH', 'Firewalls, then blinking blocks to the exit.', 0, '#ff2a4a');
    b.plat({ x: 0, y: 6.8, z: -134, w: 3, d: 16, style: 'panel' });
    b.laser({ x: 0, y: 6.8, z: -130, w: 3, period: 1.8, on: 0.45 });
    b.laser({ x: 0, y: 6.8, z: -136, w: 3, period: 1.8, on: 0.45, phase: -0.6 });
    b.blink({ x: 0, y: 6.8, z: -146, w: 4, d: 4, period: 2.6, on: 0.6 });
    b.blink({ x: 0, y: 6.8, z: -152.5, w: 4, d: 4, period: 2.6, on: 0.6, phase: 1.3 });
    b.finish(0, 6.8, -162, 12, 12, 16);
  },
};
