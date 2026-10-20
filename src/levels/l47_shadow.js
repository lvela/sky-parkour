// LEVEL 47 — Shadow Labyrinth: a gloomy maze of floating stone in endless dusk. New: PHANTOM PLATFORMS that only
// appear when you're close, and squeeze walls that slam shut across the path.
const SHADOW_STONE = { soil: 0x1e1a28, rockA: 0x2a2436, rockB: 0x3a3248, dark: 0x120e18, grassA: 0x2a2a3a, grassB: 0x3a2a4a };

export default {
  id: 'shadow',
  name: 'Shadow Labyrinth',
  tagline: 'Platforms that only appear when you get close, and walls that slam shut. Trust the shimmer.',
  exposure: 0.95,
  sky: {
    mode: 'gradient', light: { elev: 20, az: -120 },
    zen: [0.004, 0.002, 0.012], hor: [0.04, 0.02, 0.07], glow: [0.2, 0.08, 0.3], glowPow: 4, glowAmt: 0.4,
    cov: 1.0, cloudBright: 0.15, cloudShade: 0.5, cirrus: 0.3, stars: 0.6,
    moon: { elev: 18, az: -120, size: 7, bright: 0.6 },
  },
  light: { color: 0x9a8aff, intensity: 1.4 }, envIntensity: 1.2, fog: 0.004,
  hemi: { sky: 0x3a2a6a, ground: 0x0a0812, intensity: 0.6 },
  theme: {
    top: { p: 'cracks', a: '#2a2436', b: ['#322a40', '#221c2c'], line: '#b48cff', glow: true, seed: 471 }, side: 'stone',
    stone: { p: 'tiles', a: '#1e1a28', b: ['#2a2436', '#16121e'], line: '#b48cff', n: 3, seed: 472 }, palette: SHADOW_STONE, accent: '#b48cff',
  },
  scenery: {
    islands: { palette: SHADOW_STONE, trees: false, crystals: true, count: 22, seed: 471 }, sea: {}, clouds: { count: 30 },
    drift: [{ count: 500, color: 0x6a4aaa, size: 0.1, fall: -0.2, sway: 1, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'SHADOW LABYRINTH', 'Phantom platforms appear when you get near. Look for the faint shimmer!', 0, '#b48cff');

    // PHANTOM PATH
    [[-1.5, 0, -12], [1.5, 0, -17.5], [-1, 0.8, -23], [1.5, 1.6, -28.5], [0, 2.4, -34]].forEach(([x, y, z]) => b.phantom({ x, y, z }));
    b.plat({ x: 0, y: 2.4, z: -42, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2.4, -42);

    // SQUEEZE CORRIDOR
    b.sign(3.5, 2.4, -40, 'SQUEEZE', 'The walls rumble, then slam shut. Dash through while they\'re open!', 0, '#ff4a3a');
    b.plat({ x: 0, y: 2.4, z: -58, w: 4, d: 24, style: 'trim' });
    b.squeeze({ y: 2.4, z: -51, period: 3 });
    b.squeeze({ y: 2.4, z: -57, period: 2.6, phase: 1 });
    b.squeeze({ y: 2.4, z: -63, period: 3.2, phase: 2 });
    b.plat({ x: 0, y: 2.4, z: -77, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2.4, -77);

    // PHANTOM STAIRS
    b.sign(-3.5, 2.4, -75, 'PHANTOM STAIRS', 'Up into the dark.', 0, '#b48cff');
    [[0, 3.4, -84.5], [2, 4.4, -89.5], [-1, 5.4, -94.5], [1.5, 6.4, -99.5], [0, 7.4, -104.5]].forEach(([x, y, z]) => b.phantom({ x, y, z }));
    b.plat({ x: 0, y: 7.4, z: -112, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 7.4, -112);

    // THE MAZE'S END
    b.sign(3.5, 7.4, -110, 'THE LAST CORRIDOR', 'Walls and phantoms together.', 0, '#ff4a3a');
    b.plat({ x: 0, y: 7.4, z: -121, w: 4, d: 10, style: 'trim' });
    b.squeeze({ y: 7.4, z: -121, period: 2.6 });
    b.phantom({ x: 0, y: 7.4, z: -129.5 });
    b.phantom({ x: 0, y: 7.4, z: -135 });
    b.plat({ x: 0, y: 7.4, z: -146, w: 4, d: 16, style: 'trim' });
    b.squeeze({ y: 7.4, z: -145, period: 2.4, phase: 0.6 });
    b.squeeze({ y: 7.4, z: -150.5, period: 2.8, phase: 1.7 });
    b.finish(0, 7.4, -160, 12, 12, 16);
  },
};
