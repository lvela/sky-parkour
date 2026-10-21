// LEVEL 22 — Toxic Factory: a rusting plant over a sea of glowing acid. New: crushers.
const RUST = { soil: 0x4a3020, rockA: 0x5a4a3a, rockB: 0x6a5a48, dark: 0x2a2018, grassA: 0x5a6a2a, grassB: 0x7a8a3a };

export default {
  id: 'toxic',
  name: 'Toxic Factory',
  tagline: 'Crushers slam down on the assembly line high above a sea of glowing acid.',
  exposure: 0.8,
  sky: {
    mode: 'gradient', light: { elev: 30, az: 60 },
    zen: [0.06, 0.07, 0.03], hor: [0.25, 0.3, 0.12], glow: [0.4, 0.45, 0.1], glowPow: 4, glowAmt: 0.5,
    cov: 0.45, cloudBright: 0.5, cloudShade: 0.5, cirrus: 0.3, tint: [0.9, 1.1, 0.6],
  },
  light: { color: 0xd8ff90, intensity: 2.0 }, envIntensity: 1.1, fog: 0.0025,
  hemi: { sky: 0x6a7a30, ground: 0x40a020, intensity: 0.6 },
  theme: {
    top: { p: 'tiles', a: '#5a5e58', b: ['#6a6e66', '#4a4e48'], line: 'rgba(20,20,20,0.7)', n: 4, seed: 221 },
    side: { p: 'speckle', a: '#5a3a2a', b: ['#7a4a2a', '#4a2a1a', '#8a5a3a'], seed: 222 }, stone: 'metal',
    palette: RUST, accent: '#b0ff3a',
  },
  scenery: {
    islands: { palette: RUST, trees: false, count: 18, seed: 221 },
    sea: { y: -50, liquid: { hot: [0.8, 3.5, 0.4], vein: [0.2, 1.0, 0.1], crust: [0.02, 0.04, 0.02] } }, clouds: { count: 45, seaY: -50 },
    drift: [{ count: 600, color: 0x8a9a7a, size: 0.06, fall: 0.6, sway: 1.5 }],
  },
  killY: -35,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'TOXIC FACTORY', 'Crushers slam down on the walkway. Run underneath while they\'re up!', 0, '#b0ff3a');

    // CRUSHERS
    b.plat({ x: 0, y: 0, z: -25, w: 3.2, d: 34, style: 'metal' });
    [-15, -23, -31].forEach((z, i) => b.crusher({ x: 0, y: 0, z, period: 3, phase: i }));
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // ASSEMBLY LINE — a conveyor carries you under the crushers
    b.sign(3, 0, -45, 'ASSEMBLY LINE', 'The belt carries you under the crushers. Wait for your moment, then go!', 0, '#ffcf3a');
    b.conveyor({ x: 0, y: 0, z: -66, w: 3, d: 28, speed: 2.5 });
    [-58, -66, -74].forEach((z, i) => b.crusher({ x: 0, y: 0, z, period: 2.6, phase: i * 0.9 }));
    b.plat({ x: 0, y: 0, z: -85, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -85);

    // ACID LIFTS
    b.sign(-3, 0, -83, 'ACID LIFTS', 'Hop up the rising and sinking lifts.', 0, '#b0ff3a');
    b.plat({ x: 0, y: 0, z: -93, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.plat({ x: 0, y: 4, z: -99, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9 + Math.PI); }) });
    b.plat({ x: 0, y: 8, z: -105, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.plat({ x: 0, y: 11.5, z: -112, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 11.5, -112);

    // PRESS LINE — crushers and lasers
    b.sign(3, 11.5, -110, 'PRESS LINE', 'Crushers and lasers, one after another.', 0, '#ff2a4a');
    b.plat({ x: 0, y: 11.5, z: -131, w: 3.2, d: 30, style: 'metal' });
    b.crusher({ x: 0, y: 11.5, z: -122, period: 2.4 });
    b.laser({ x: 0, y: 11.5, z: -128, w: 3.2, period: 2.2, on: 0.45 });
    b.crusher({ x: 0, y: 11.5, z: -134, period: 2.2, phase: 1 });
    b.laser({ x: 0, y: 11.5, z: -140, w: 3.2, period: 2.0, on: 0.45, phase: -0.8 });
    b.plat({ x: 0, y: 11.5, z: -153, w: 8, d: 12, style: 'island', rock: true });
    b.checkpoint(0, 11.5, -150);

    // SMOKESTACK — wall jump up the chimney
    b.sign(-3, 11.5, -149, 'SMOKESTACK', 'Wall jump up the chimney, then ride the belt to the finish.', 0, '#ff8a4a');
    b.plat({ x: -2.05, y: 23.5, z: -157, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.plat({ x: 2.05, y: 23.5, z: -157, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.plat({ x: 0, y: 20.5, z: -163, w: 8, d: 8, h: 9, style: 'island', rock: true, rockDepth: 6 });
    b.checkpoint(0, 20.5, -163.5);
    b.conveyor({ x: 0, y: 20.5, z: -173, w: 3, d: 8, speed: 5 });
    b.bonusFinish('sawTrack', 0, 20.5, -186, 12, 12, 16);
  },
};
