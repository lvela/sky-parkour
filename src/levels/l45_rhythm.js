// LEVEL 45 — Neon Rhythm: a synthwave highway into a striped sunset. New: BEAT BLOCKS that swap in time
// with the music, and floor switches that flip green and orange blocks.
const GRID = { p: 'grid', a: '#120a1e', b: ['#1a0e2a', '#0e0818'], line: '#ff4dd2', n: 4, seed: 451 };

export default {
  id: 'rhythm',
  name: 'Neon Rhythm',
  tagline: 'Blue and pink blocks swap on the beat of the music. Hop in rhythm — and flip the switches.',
  exposure: 0.95,
  musicBpm: 120,
  sky: {
    mode: 'gradient', light: { elev: 6, az: 0 },
    zen: [0.01, 0.002, 0.03], hor: [0.5, 0.08, 0.3], glow: [1.2, 0.4, 0.1], glowPow: 2.5, glowAmt: 1.0,
    cov: 0.2, cloudBright: 0.4, cloudShade: 0.4, cirrus: 0.5, stars: 0.8, tint: [1.2, 0.6, 1.0],
  },
  light: { color: 0xff8ad0, intensity: 1.8 }, envIntensity: 1.4, fog: 0.0012,
  hemi: { sky: 0x8a2a8a, ground: 0x100818, intensity: 0.7 },
  theme: { top: GRID, side: 'panel', stone: { p: 'grid', a: '#0e0818', b: ['#120a1e'], line: '#4dd2ff', n: 4, seed: 452 }, palette: 'night', neon: 0xff4dd2, accent: '#ff4dd2' },
  scenery: {
    islands: { palette: 'night', trees: false, crystals: true, count: 24, seed: 451 }, sea: {}, clouds: { count: 30 },
    drift: [{ count: 500, color: 0xff8ae0, size: 0.06, fall: -0.3, sway: 1.5, additive: true }],
  },
  killY: -32,

  build(b) {
    const beat = (x, y, z, group) => b.beatBlocks({ x, y, z, group, beats: 2, bpm: 120 });
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'NEON RHYTHM', 'Blue and pink blocks swap every two beats of the music. Hop on the beat!', 0, '#ff4dd2');

    // BEAT BRIDGE
    for (let i = 0; i < 7; i++) beat(0, 0, -10 - i * 4, i % 2);
    b.plat({ x: 0, y: 0, z: -40, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -40);

    // SWITCHBACK — floor switches
    b.sign(3.5, 0, -38, 'SWITCHBACK', 'Stepping on a switch swaps the green and orange blocks.', 0, '#7dff6a');
    const G = { channel: 'a', color: 0x7dff6a }, O = { channel: 'a', color: 0xffa040, on: false };
    b.switchBlock({ x: 0, y: 0, z: -48, ...G });
    b.switchPad({ x: 0, y: 0, z: -52.5, channel: 'a', color: 0xffd84d });
    b.switchBlock({ x: 0, y: 0, z: -57, ...O });
    b.switchBlock({ x: 0, y: 0, z: -61.5, ...O });
    b.switchBlock({ x: 3.5, y: 0, z: -61.5, ...G }); // a decoy
    b.switchPad({ x: 0, y: 0, z: -66, channel: 'a', color: 0xffd84d });
    b.switchBlock({ x: 0, y: 0, z: -70.5, ...G });
    b.switchBlock({ x: 0, y: 0, z: -75, ...G });
    b.plat({ x: 0, y: 0, z: -82, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -82);

    // BEAT STAIRS
    b.sign(-3.5, 0, -80, 'BEAT STAIRS', 'Now climb in rhythm.', 0, '#4dd2ff');
    for (let i = 0; i < 6; i++) beat(0, 1 + i, -89.5 - i * 4, i % 2);
    b.plat({ x: 0, y: 6, z: -117, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -117);

    // ZIG-ZAG — two lanes, swap every beat
    b.sign(3.5, 6, -115, 'ZIG-ZAG', 'Diagonal hops between two lanes. Feel the beat!', 0, '#ff4dd2');
    for (let i = 0; i < 6; i++) beat(i % 2 ? 2 : -2, 6, -125 - i * 4, i % 2);
    b.finish(0, 6, -156, 12, 12, 16);
  },
};
