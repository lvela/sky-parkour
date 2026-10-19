// LEVEL 35 — Abyssal Trench: the pitch-black deep, lit only by glowing creatures. New: jellyfish bouncers.
const ABYSS = { soil: 0x101820, rockA: 0x18222c, rockB: 0x202c38, dark: 0x080c10, grassA: 0x0a4a4a, grassB: 0x0a6a5a };

export default {
  id: 'abyss',
  name: 'Abyssal Trench',
  tagline: 'Bounce on glowing jellyfish and dodge sweeping eels in the crushing dark of the deep.',
  exposure: 1.1,
  gravity: 0.85,
  sky: {
    mode: 'gradient', light: { elev: 70, az: 0 },
    zen: [0, 0.003, 0.01], hor: [0, 0.02, 0.05], glow: [0, 0.1, 0.15], glowPow: 3, glowAmt: 0.4,
    cov: 2, cirrus: 0, tint: [0.6, 0.9, 1.2],
  },
  light: { color: 0x6ac8ff, intensity: 1.4 }, envIntensity: 1.3, fog: 0.006,
  hemi: { sky: 0x0a3a5a, ground: 0x000a14, intensity: 0.7 },
  theme: {
    top: { p: 'speckle', a: '#1a2028', b: ['#222a34', '#12181e', '#2a3440'], seed: 351 },
    side: { p: 'speckle', a: '#101820', b: ['#18222c', '#0a1016'], seed: 352 },
    stone: { p: 'hex', a: '#0a1a2a', b: ['#102030'], line: '#2affd0', glow: true, size: 24, seed: 353 },
    palette: ABYSS, neon: 0x2affd0, accent: '#2affd0',
  },
  scenery: {
    islands: { palette: ABYSS, leafHue: 0.5, leafLight: 0.2, crystals: true, count: 26, seed: 351 }, sea: false, clouds: false,
    drift: [{ count: 800, color: 0x4dffd2, size: 0.07, fall: -0.3, sway: 1.2, additive: true }, { count: 200, color: 0xff7af0, size: 0.12, fall: 0.1, sway: 2, additive: true }],
  },
  killY: -40,

  build(b) {
    const bob = (k) => b.mo((v, t) => { v.y = Math.sin(t * 1.5 + k) * 0.25; });
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'ABYSSAL TRENCH', 'Jellyfish are springy. Gravity is a little lighter down here.', 0, '#2affd0');

    // JELLY DRIFT
    [-9.8, -19, -28.2].forEach((z, i) => b.jelly({ x: 0, y: 0.25, z, bounce: 12, color: [0xff7af0, 0x7af7ff, 0xffd84d][i] }));
    b.plat({ x: 0, y: 1, z: -39, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1, -39);

    // EEL LEDGES — every ledge has an eel sweeping round it
    b.sign(3, 1, -37, 'EEL LEDGES', 'Eels sweep each ledge. Jump them as you land!', 0, '#ff5a4a');
    [-47.5, -54, -60.5].forEach((z, i) => {
      b.plat({ x: 0, y: 1, z, w: 4, d: 4, style: 'trim' });
      b.sweeper({ x: 0, y: 1, z, r: 1.8, speed: i % 2 ? -2.2 : 2 });
    });
    b.plat({ x: 0, y: 1, z: -69, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1, -69);

    // BUBBLE COLUMN, then a big jelly bounce
    b.sign(-3, 1, -67, 'BUBBLE COLUMN', 'Ride a bubble up, then bounce off the big jellyfish.', 0, '#7af7ff');
    b.bubble({ x: 0, z: -75.8, y0: 0, y1: 13, speed: 1.5, phase: 0 });
    b.bubble({ x: 0, z: -75.8, y0: 0, y1: 13, speed: 1.5, phase: 6.5 });
    b.plat({ x: 0, y: 10, z: -82, w: 6, d: 6, style: 'trim' });
    b.jelly({ x: 0, y: 10.3, z: -87.5, bounce: 16, motion: bob(2), color: 0xff7af0 });
    b.plat({ x: 0, y: 15, z: -97, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 15, -97);

    // THE DEEP CURRENT — drifting jellies in a current
    b.sign(3, 15, -95, 'DEEP CURRENT', 'The jellies drift side to side in the current.', 0, '#2affd0');
    b.jelly({ x: 0, y: 15.3, z: -101.3, bounce: 12, motion: b.mo((v, t) => { v.x = Math.sin(t * 0.9) * 2.5; }), color: 0x7af7ff });
    b.jelly({ x: 0, y: 15.3, z: -110.5, bounce: 12, motion: b.mo((v, t) => { v.x = Math.sin(t * 0.9 + 1.5) * 2.5; }), color: 0xffd84d });
    b.wind({ x0: -2.5, x1: 2.5, z0: -100, z1: -117, y0: 15, y1: 24, force: 3, period: 5 });
    b.plat({ x: 0, y: 15, z: -121, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 15, -121);

    // ANGLER'S LAIR
    b.sign(-3, 15, -119, 'ANGLER\'S LAIR', 'Twin eels guard the lair. The last jellyfish throws you to the finish.', 0, '#ff7af0');
    b.plat({ x: 0, y: 15, z: -131, w: 10, d: 10, style: 'trim' });
    b.sweeper({ x: 0, y: 15, z: -131, r: 4.5, speed: 1.8, arms: 2 });
    b.jelly({ x: 0, y: 15.3, z: -137.3, bounce: 15, motion: bob(4), color: 0xff7af0 }).push = { x: 0, z: -9 };
    b.finish(0, 15, -153, 12, 12, 16);
  },
};
