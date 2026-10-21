// LEVEL 33 — Hurricane Eye: deep inside a raging storm. New: vortex winds that drag you round in circles.
export default {
  id: 'hurricane',
  name: 'Hurricane Eye',
  tagline: 'Whirlwinds drag you sideways mid-jump while debris rains down in the heart of the storm.',
  exposure: 0.9,
  sky: {
    mode: 'gradient', light: { elev: 40, az: 30 },
    zen: [0.02, 0.025, 0.03], hor: [0.12, 0.14, 0.16], glow: [0.1, 0.1, 0.12], glowPow: 4, glowAmt: 0.3,
    cov: 0.35, cloudBright: 0.45, cloudShade: 0.5, cirrus: 0.2, tint: [0.8, 0.85, 0.95],
  },
  light: { color: 0xc8d4e8, intensity: 1.6 }, envIntensity: 1.0, fog: 0.0022,
  hemi: { sky: 0x5a6a7a, ground: 0x1a1e24, intensity: 0.6 },
  theme: { top: 'slate', side: 'dirt', stone: 'stone', palette: 'storm', accent: '#9ad0ff' },
  scenery: { islands: { palette: 'storm', leafHue: 0.3, leafLight: 0.15, count: 22, seed: 331 }, sea: {}, clouds: { count: 90 }, rain: true, lightning: true },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'HURRICANE EYE', 'Whirlwinds push you sideways in the air. Steer against them!', 0, '#9ad0ff');

    // OUTER BANDS — gusting crosswinds
    b.plat({ x: 0, y: 0, z: -25, w: 3, d: 34, style: 'trim' });
    b.wind({ x0: -1.5, x1: 1.5, z0: -8, z1: -42, y0: 0, y1: 8, force: 5, period: 4.5 });
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // THE SPIRAL — stepping stones inside a whirlwind
    b.sign(3, 0, -45, 'THE SPIRAL', 'A whirlwind spins round these stones. Aim off to the side!', 0, '#9ad0ff');
    [-55.5, -61.5, -67.5, -73.5, -79.5].forEach((z) => b.plat({ x: 0, y: 0, z, w: 3, d: 3, h: 1, style: 'trim', rock: true, rockDepth: 3 }));
    b.vortex({ cx: 0, cz: -67.5, y0: -1, y1: 10, R: 13, force: 7 });
    b.plat({ x: 0, y: 0, z: -88, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -88);

    // DEBRIS FIELD
    b.sign(-3, 0, -86, 'DEBRIS FIELD', 'Ride the orbit while debris crashes down around you.', 0, '#ff6a2a');
    b.orbit({ cx: 0, y: 0, cz: -102, R: 6, n: 3, speed: 0.7 });
    b.rockfall({ x0: -7, x1: 7, z0: -95, z1: -109, y: 0, period: 1.2, aim: 0.4, color: 0x9ab0c8 });
    b.plat({ x: 0, y: 0, z: -116, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -116);

    // EYEWALL — sliding platforms in a reversed whirlwind
    b.sign(3, 0, -114, 'EYEWALL', 'The strongest winds yet, spinning the other way.', 0, '#9ad0ff');
    [-126, -134, -142].forEach((z, i) => b.plat({ x: 0, y: 0, z, w: 4, d: 4, h: 0.6, style: 'trim', motion: b.mo((v, t) => { v.z = Math.sin(t * 0.8 + (i % 2) * Math.PI) * 3; }) }));
    b.vortex({ cx: 0, cz: -134, y0: -1, y1: 10, R: 10, force: 9, dir: -1 });
    b.plat({ x: 0, y: 0, z: -152, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -152);

    // CALM CENTRE
    b.sign(-3, 0, -150, 'CALM CENTRE', 'Bounce up into the calm eye of the storm.', 0, '#ffd84d');
    b.plat({ x: 0, y: 0, z: -159.5, w: 3, d: 3, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.bonusFinish('grapple', 0, 5, -170, 12, 12, 16);
  },
};
