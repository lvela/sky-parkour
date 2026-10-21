// LEVEL 37 — Rainbow Gauntlet: a neon rainbow road under the aurora. New: spinning wall-jump shafts, plus a gauntlet of everything.
const RAINBOW = { p: 'tiles', a: '#1a1a24', b: ['#ff4d4d', '#ffb84d', '#ffff4d', '#4dff6a', '#4dd2ff', '#b04dff'], line: 'rgba(255,255,255,0.6)', n: 4, seed: 371 };

export default {
  id: 'rainbow',
  name: 'Rainbow Gauntlet',
  tagline: 'Spinning wall-jump shafts and a greatest-hits gauntlet of every obstacle so far.',
  exposure: 0.95,
  sky: {
    mode: 'gradient', light: { elev: 35, az: 20 },
    zen: [0.004, 0.004, 0.02], hor: [0.05, 0.04, 0.1], glow: [0.2, 0.1, 0.3], glowPow: 4, glowAmt: 0.4,
    cov: 0.7, cloudBright: 0.3, cloudShade: 0.4, cirrus: 0.2, stars: 1.2, milky: 1.0,
  },
  light: { color: 0xd0c0ff, intensity: 1.8 }, envIntensity: 1.4, fog: 0.0008,
  hemi: { sky: 0x5040a0, ground: 0x101020, intensity: 0.6 },
  theme: { top: RAINBOW, side: 'panel', stone: RAINBOW, palette: 'night', neon: 0xff4dd2, accent: '#ff4dd2' },
  scenery: { islands: { palette: 'night', trees: false, crystals: true, count: 28, seed: 371 }, sea: {}, clouds: { count: 40 }, aurora: true },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'RAINBOW GAUNTLET', 'The final run. Everything you\'ve learned, all at once!', 0, '#ff4dd2');

    // SPINNING SHAFT — wall jump while the walls turn, jump out when they open toward the ledge
    b.sign(4.5, 0, -3, 'SPINNING SHAFT', 'Wall jump up between the turning walls. Leap out when the gap faces the ledge.', 0, '#ff8a4a');
    b.plat({ x: 0, y: 0, z: -12, w: 6, d: 8, style: 'trim' });
    b.spinWalls({ x: 0, y: 14, z: -12, h: 14, speed: 0.4 });
    b.plat({ x: 0, y: 12, z: -19.5, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 12, -19.5);

    // GAUNTLET I — backwards belt, laser, crusher
    b.sign(3, 12, -17.5, 'GAUNTLET I', 'Belt, laser, crusher.', 0, '#ff2a4a');
    b.conveyor({ x: 0, y: 12, z: -33, w: 3, d: 20, speed: -3 });
    b.laser({ x: 0, y: 12, z: -28, w: 3, period: 2.0, on: 0.45 });
    b.crusher({ x: 0, y: 12, z: -38, period: 2.4, solidFrame: false });
    b.plat({ x: 0, y: 12, z: -48, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 12, -48);

    // GAUNTLET II — click-clack, glitch, shrinking pad
    b.sign(-3, 12, -46, 'GAUNTLET II', 'Swapping blocks, a glitch block and a shrinking pad.', 0, '#4dfff0');
    b.clickClack({ x: 0, y: 12, z: -56.5, red: false });
    b.clickClack({ x: 0, y: 12, z: -62.5, red: true });
    b.glitch({ x: 0, y: 12, z: -68.5, alt: { x: 3, y: 12, z: -68.5 }, period: 3 });
    b.shrinkPad({ x: 0, y: 12, z: -74.5, period: 3 });
    b.plat({ x: 0, y: 12, z: -82, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 12, -82);

    // GAUNTLET III — launcher cap, bumpers, portal
    b.sign(3, 12, -80, 'GAUNTLET III', 'Launcher, bumpers, portal.', 0, '#ffd84d');
    b.mushroom({ x: 0, y: 12.3, z: -87.4, r: 1.8, bounce: 16, push: { x: 0, z: -9 }, color: 0xff4dd2, stem: 6 });
    b.plat({ x: 0, y: 12, z: -104, w: 8, d: 10, style: 'trim' });
    for (const [x, z, c] of [[-2.5, -102, 0x4dffff], [2.5, -105, 0xffd84d], [-2.5, -107.5, 0xff4dd2]]) b.bumper({ x, y: 12, z, color: c });
    b.portal({ a: { x: 0, y: 12, z: -108 }, b: { x: 0, y: 20, z: -118 } });
    b.plat({ x: 0, y: 20, z: -123, w: 6, d: 12, style: 'island', rock: true });
    b.checkpoint(0, 20, -119);

    // SPINNING SHAFT II — taller and faster, the other way round
    b.sign(-3.5, 20, -118, 'SHAFT II', 'Taller, faster, spinning the other way.', 0, '#ff8a4a');
    b.spinWalls({ x: 0, y: 36, z: -126, h: 16, speed: -0.55 });
    b.plat({ x: 0, y: 34, z: -133.5, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 34, -133.5);

    // RAINBOW ROAD — run with the light to the finish
    b.sign(3, 34, -131.5, 'RAINBOW ROAD', 'Run with the light to the finish!', 0, '#ff4dd2');
    b.pulsePath({ x: 0, y: 34, z0: -137.7, n: 8, speed: 6, period: 3.5, window: 0.38, color: 0xff4dd2 });
    b.bonusFinish('beatBlocks', 0, 34, -165.9, 12, 12, 16);
  },
};
