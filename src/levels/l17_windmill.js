// LEVEL 17 — Windmill Hills: breezy green hills in the sky. New: giant windmill sails and updraft fans.
export default {
  id: 'windmill',
  name: 'Windmill Hills',
  tagline: 'Slip between the turning sails of giant windmills, then float up on rising air.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 40, az: -80 }, turbidity: 2.5, rayleigh: 1.3, cov: 0.48, cirrus: 1.5 },
  light: { color: 0xfff4e0, intensity: 3.3 }, envIntensity: 0.9, fog: 0.0009,
  theme: { top: 'grass', side: 'dirt', stone: 'stone', palette: 'day', accent: '#7ad0ff' },
  scenery: { islands: { palette: 'day', leafHue: 0.28, count: 26, seed: 171 }, sea: {}, clouds: { count: 90 }, birds: true },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'WINDMILL HILLS', 'The sails sweep right across the path. Wait for a gap and run under!', 0, '#7ad0ff');
    b.tree(5.5, 0, 5, 1.1); b.tree(-6, 0, 5.5, 0.9);

    // SAILS
    b.plat({ x: 0, y: 0, z: -25, w: 4, d: 34, style: 'trim' });
    b.windmill({ x: 0, y: 0, z: -18, r: 5, speed: 0.8, blades: 3, side: 1 });
    b.windmill({ x: 0, y: 0, z: -32, r: 5, speed: -0.9, blades: 3, side: -1, phase: 1 });
    b.plat({ x: 0, y: 0, z: -48, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -48);

    // UPDRAFTS
    b.sign(3, 0, -46, 'UPDRAFTS', 'Jump into the rising air and stop inside it. Float up, then steer onto the ledge.', 0, '#bfeaff');
    b.updraft({ x: 0, y: 0, z: -57, h: 11 });
    b.plat({ x: 0, y: 8, z: -63, w: 6, d: 6, style: 'island', rock: true });
    b.updraft({ x: 0, y: 8, z: -71, h: 11 });
    b.plat({ x: 0, y: 16, z: -77, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 16, -77);

    // GUSTY RIDGE — crosswinds and a windmill on a narrow bridge
    b.sign(-3, 16, -75, 'GUSTY RIDGE', 'Crosswinds and sails. Watch the flags!', 0, '#ff6a8a');
    b.plat({ x: 0, y: 16, z: -95, w: 3, d: 28, style: 'trim' });
    b.wind({ x0: -1.5, x1: 1.5, z0: -81, z1: -109, y0: 16, y1: 24, force: 4, period: 5 });
    b.windmill({ x: 0, y: 16, z: -95, r: 5, speed: 1, blades: 3, side: 1 });
    b.plat({ x: 0, y: 16, z: -115, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 16, -115);

    // THERMALS — float from column to column, each one taller
    b.sign(3, 16, -113, 'THERMALS', 'Drop into the first column and float from one to the next.', 0, '#bfeaff');
    b.updraft({ x: 0, y: 12, z: -124, h: 7 });
    b.updraft({ x: 0, y: 14, z: -130, h: 8 });
    b.updraft({ x: 0, y: 16, z: -136, h: 10 });
    b.plat({ x: 0, y: 22, z: -143, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 22, -142);

    // GRAND MILLS — two windmills, faster
    b.sign(-3, 22, -140, 'GRAND MILLS', 'Faster sails, more of them. Good luck!', 0, '#ff6a8a');
    b.plat({ x: 0, y: 22, z: -157, w: 4, d: 22, style: 'trim' });
    b.windmill({ x: 0, y: 22, z: -152, r: 5, speed: 1.1, blades: 4, side: -1 });
    b.windmill({ x: 0, y: 22, z: -162, r: 5, speed: -1.2, blades: 3, side: 1, phase: 0.5 });
    b.finish(0, 22, -175, 12, 12, 16);
    b.tree(-4.5, 22, -179, 1.0); b.tree(4.6, 22, -178, 0.8);
  },
};
