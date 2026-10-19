// LEVEL 3 — Thunderstorm: knock-out obstacles (sweepers, punchers, hammers), moving wall jumps, rain & lightning.
export default {
  id: 'storm',
  name: 'Thunderstorm',
  tagline: 'Knockout sweepers, boxing gloves and wrecking hammers in a lightning storm.',
  exposure: 0.85,
  sky: {
    mode: 'gradient', light: { elev: 35, az: -40 },
    zen: [0.05, 0.055, 0.065], hor: [0.13, 0.135, 0.15], glow: [0.08, 0.08, 0.09], glowPow: 6, glowAmt: 0.6,
    cov: 0.3, cloudBright: 0.55, cloudShade: 0.5, cirrus: 0,
  },
  light: { color: 0xc8d4ff, intensity: 1.6 }, envIntensity: 1.3, fog: 0.0035,
  theme: { top: 'grass', side: 'slate', stone: 'slate', palette: 'storm', accent: '#ffe14a' },
  scenery: { islands: { palette: 'storm', leafHue: 0.32, leafLight: 0.16, count: 18, seed: 9 }, sea: {}, clouds: { count: 110, spread: 300 }, rain: true, lightning: true },
  killY: -30,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THUNDERSTORM', 'Obstacles here will KNOCK YOU OUT of the sky. Watch the timing.', 0, '#ffe14a');

    // SWEEPERS
    b.plat({ x: 0, y: 0, z: -17, w: 12, d: 12, style: 'island', rock: true });
    b.sweeper({ x: 0, y: 0, z: -17, r: 5.2, speed: 1.6 });
    b.plat({ x: 0, y: 0.5, z: -32, w: 12, d: 12, style: 'island', rock: true });
    b.sweeper({ x: 0, y: 0.5, z: -32, r: 5.2, speed: -1.2, arms: 2 });

    // PUNCHER BRIDGE
    b.plat({ x: 0, y: 0.5, z: -54, w: 3, d: 26, style: 'metal' });
    b.sign(3, 0.5, -38, 'KNOCKOUT ALLEY', 'Boxing gloves punch across the bridge. Wait for them to pull back!', 0, '#ff4d4d');
    [-45, -50, -55, -60, -64].forEach((z, i) => {
      const s = i % 2 === 0 ? 1 : -1;
      b.puncher({ xRest: s * 3.3, xHit: -s * 0.6, y: 1.5, z, period: 2.8, phase: i * 0.6 });
    });
    b.plat({ x: 0, y: 0.5, z: -74, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -74);

    // HAMMER BRIDGE
    b.sign(-3, 0.5, -77, 'HAMMER TIME', 'Giant hammers swing across the bridge. Run through the gaps!', 0, '#ff4d4d');
    b.plat({ x: 0, y: 0.5, z: -95, w: 4, d: 28, style: 'wood' });
    [-86, -94, -102].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 9.5, L: 8, A: 1.0, phase: i * 2.1 });
      b.post(-3.4, 0.5, 10, z, false, b.M.iron, 0.2); b.post(3.4, 0.5, 10, z, false, b.M.iron, 0.2);
      const beam = b.post(0, 9.8, 10.2, z, false, b.M.iron, 0.2); beam.scale.x = 17.5;
    });
    b.plat({ x: 0, y: 0.5, z: -116, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -116);

    // MOVING WALL JUMPS
    b.sign(3, 0.5, -118.5, 'MOVING WALLS', 'These wall-jump walls bob up and down. Kick off them anyway!', 0, '#ff8a4a');
    [-125.5, -129, -132.5, -136, -139.5].forEach((z, i) => {
      b.plat({ x: (i % 2 === 0 ? -1 : 1) * 2.3, y: 10, z, w: 0.6, d: 10, h: 12, style: 'wall', type: 'wall',
        motion: t0((v, t) => { v.y = Math.sin(t * 1.3 + i * 1.2) * 1.5; }) });
    });
    b.plat({ x: 0, y: 2, z: -151, w: 11, d: 10, style: 'island', rock: true });
    for (const s of [-1, 1]) {
      b.plat({ x: s * 2.05, y: 16, z: -153.5, w: 0.6, d: 4, h: 14, style: 'wall', type: 'wall',
        motion: t0((v, t) => { v.x = s * 0.4 * (1 + Math.sin(t * 1.2)); }) });
    }
    b.sign(-3.2, 2, -147.5, 'BREATHING SHAFT', 'The walls move apart and together. Climb with wall jumps.', 0, '#ff8a4a');
    b.plat({ x: 0, y: 12, z: -159.5, w: 8, d: 8, h: 10, style: 'island', rock: true });
    b.checkpoint(0, 12, -160);

    // MOVING TRAMPOLINES
    b.plat({ x: 0, y: 9, z: -169.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.0) * 2.5; }) });
    b.plat({ x: 0, y: 9, z: -180, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.0 + Math.PI) * 2.5; }) });
    b.plat({ x: 0, y: 13, z: -191, w: 8, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 13, -190);

    // FINAL SPINNER
    b.plat({ x: 0, y: 13, z: -205, w: 12, d: 12, style: 'island', rock: true });
    b.sweeper({ x: 0, y: 13, z: -205, r: 5.5, speed: 2.0, arms: 2 });
    b.finish(0, 13, -220, 12, 12, 14);
  },
};
