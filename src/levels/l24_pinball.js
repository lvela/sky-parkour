// LEVEL 24 — Pinball Nebula: a giant neon pinball table drifting through a nebula. New: bumpers and flippers.
export default {
  id: 'pinball',
  name: 'Pinball Nebula',
  tagline: 'You are the ball: dodge bumpers and flippers on a neon pinball table in deep space.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 35, az: 30 },
    zen: [0.003, 0.001, 0.01], hor: [0.04, 0.01, 0.06], glow: [0.2, 0.05, 0.3], glowPow: 3, glowAmt: 0.4,
    cov: 2, cirrus: 0, stars: 1.2, milky: 0.6, nebula: 1.2, space: true,
    planet: { elev: 20, az: -150, size: 14, bright: 0.9, a: [0.9, 0.35, 0.8], b: [0.4, 0.1, 0.5], tilt: 0.6 },
  },
  light: { color: 0xff9aff, intensity: 2.0 }, envIntensity: 1.5, fog: 0.0004,
  hemi: { sky: 0x8040a0, ground: 0x100818, intensity: 0.6 },
  theme: {
    top: { p: 'grid', a: '#140a20', b: ['#1e0e30', '#0e0618'], line: '#ff4dd2', n: 4, seed: 241 }, side: 'panel', stone: 'panel',
    palette: 'space', neon: 0xff4dd2, accent: '#ff4dd2',
  },
  scenery: { islands: { palette: 'space', trees: false, crystals: true, count: 28, seed: 241 }, sea: false, clouds: false },
  killY: -60,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'PINBALL NEBULA', 'Glowing bumpers bounce you away hard. Thread between them!', 0, '#ff4dd2');

    // BUMPER FIELD
    b.plat({ x: 0, y: 0, z: -26, w: 8, d: 32, style: 'panel' });
    for (const [x, z, c] of [[-2, -15, 0xff4dd2], [2.2, -18, 0x4dffff], [0, -23, 0xffd84d], [-2.6, -28, 0x4dffff], [2.4, -30, 0xff4dd2], [-0.4, -35, 0xffd84d], [2.6, -38, 0x7a4dff]]) b.bumper({ x, y: 0, z, color: c });
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // FLIPPER ALLEY
    b.sign(3, 0, -45, 'FLIPPER ALLEY', 'Flippers swat across the lane. Run past while they\'re down.', 0, '#4dffff');
    b.plat({ x: 0, y: 0, z: -66, w: 4, d: 26, style: 'panel' });
    [[2.3, -58, 1, 0], [-2.3, -64, -1, 0.7], [2.3, -70, 1, 1.4], [-2.3, -76, -1, 0.3]].forEach(([x, z, side, phase]) => b.flipper({ x, y: 0, z, side, period: 2.2, phase }));
    b.plat({ x: 0, y: 0, z: -84, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -84);

    // KICKOUT LANES — sliding platforms
    b.sign(-3, 0, -82, 'KICKOUT LANES', 'Hop across the sliding platforms.', 0, '#ffd84d');
    [-92.5, -99.5, -106.5].forEach((z, i) => b.plat({ x: 0, y: 0, z, w: 4, d: 4, h: 0.6, style: 'panel', motion: b.mo((v, t) => { v.x = Math.sin(t * 1.1 + i * 2.1) * 3; }) }));
    b.plat({ x: 0, y: 0, z: -116, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -116);

    // BUMPER BRIDGE — a narrow lane lined with bumpers, and a flipper at the end
    b.sign(3, 0, -114, 'BUMPER BRIDGE', 'Stay dead centre. Touch a bumper and you\'re off!', 0, '#ff4dd2');
    b.plat({ x: 0, y: 0, z: -130, w: 2.4, d: 20, style: 'panel' });
    for (const [x, z] of [[1.9, -123], [-1.9, -127], [1.9, -131], [-1.9, -135]]) b.bumper({ x, y: 0, z, r: 0.7, power: 12, color: 0x4dffff });
    b.flipper({ x: -1.5, y: 0, z: -138.5, len: 3, side: -1, period: 2.0 });
    b.plat({ x: 0, y: 0, z: -145, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -145);

    // PLUNGER — the mega trampoline launches you to the finish
    b.sign(-3, 0, -143, 'PLUNGER', 'Drop onto the plunger and fly to the finish!', 0, '#ffd84d');
    b.plat({ x: 0, y: -2, z: -153.5, w: 3, d: 3, h: 0.6, style: 'mega', type: 'tramp', bounce: 24 });
    b.bonusFinish('springWall', 0, 8, -165.5, 12, 12, 16);
    b.bumper({ x: -4.5, y: 8, z: -169, color: 0xffd84d }); b.bumper({ x: 4.5, y: 8, z: -169, color: 0x4dffff });
  },
};
