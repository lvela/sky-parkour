// LEVEL 16 — Candy Kingdom: a pastel sky land of sweets. New: click-clack blocks that swap with every jump.
const CANDY = { soil: 0x6a3a24, rockA: 0xd88ab0, rockB: 0xf0b0d0, dark: 0x8a4a6a, grassA: 0xfff0f8, grassB: 0xffd0e8 };

export default {
  id: 'candy',
  name: 'Candy Kingdom',
  tagline: 'Red and blue blocks swap with every jump you make. Plan your hops!',
  exposure: 0.52,
  sky: { mode: 'physical', light: { elev: 35, az: 60 }, turbidity: 2, rayleigh: 1.6, cov: 0.6, cirrus: 1, tint: [1.15, 0.95, 1.1] },
  light: { color: 0xfff0f8, intensity: 3.0 }, envIntensity: 1.0, fog: 0.001,
  theme: {
    top: { p: 'stripes', a: '#ffffff', b: ['#ff6aa8'], seed: 161 },
    side: { p: 'planks', a: '#5a3220', b: ['#6a3a24', '#5a3220', '#7a4628'], line: 'rgba(30,15,8,0.7)', lip: '#ffd0e8', seed: 162 },
    stone: { p: 'tiles', a: '#ffd8ec', b: ['#ffe8f4', '#ffc8e0', '#d8f0ff', '#fff0c8'], line: 'rgba(255,255,255,0.8)', n: 4, seed: 163 },
    palette: CANDY, accent: '#ff6aa8',
  },
  scenery: {
    islands: { palette: CANDY, leafHue: 0.9, leafSat: 0.8, leafLight: 0.72, count: 24, seed: 161 }, sea: {}, clouds: { count: 80 }, birds: true, birdColor: 0xff6aa8,
    drift: [{ count: 500, color: 0xfff0a0, size: 0.09, fall: 0.3, sway: 1.5, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'CANDY KINGDOM', 'Every jump swaps the red and blue blocks. Leap toward the ghostly ones!', 0, '#ff6aa8');
    b.mushroom({ x: 5.5, y: 1, z: -4, r: 1.2, color: 0x7dff6a, stem: 1 });

    // CLICK-CLACK
    for (let i = 0; i < 6; i++) b.clickClack({ x: 0, y: 0, z: -12 - i * 6, red: i % 2 === 1 });
    b.plat({ x: 0, y: 0, z: -50.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -50.5);

    // CANDY STAIRS
    b.sign(3, 0, -48.5, 'CANDY STAIRS', 'Up the swapping stairs. Hop in place to swap them if you need to.', 0, '#3a8aff');
    for (let i = 0; i < 5; i++) b.clickClack({ x: 0, y: 1 + i, z: -58 - i * 5, red: i % 2 === 1 });
    b.plat({ x: 0, y: 5.5, z: -86, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 5.5, -86);

    // LOLLIPOP SWINGS
    b.sign(-3, 5.5, -84, 'LOLLIPOP SWINGS', 'Grab the handles and launch from swing to swing.', 0, '#ffd84d');
    b.swingRig(-90.3, -128.7, 5.5, 12.1);
    b.swing(0, 11.9, -97, 6, 0.87, 0);
    b.swing(0, 11.9, -109, 6, 0.87, Math.PI);
    b.swing(0, 11.9, -121, 6, 0.87, 0);
    b.plat({ x: 0, y: 5.5, z: -132, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 5.5, -132);

    // GUMDROP HOPS
    b.sign(3, 5.5, -130, 'GUMDROPS', 'Bounce across the gumdrops.', 0, '#7dff6a');
    [-138.5, -147.5, -156.5].forEach((z, i) => b.mushroom({ x: 0, y: 5.8, z, r: 1.8, bounce: 14, color: [0x7dff6a, 0xffb84d, 0xc77dff][i], stem: 3 }));
    b.plat({ x: 0, y: 6.5, z: -167, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6.5, -167);

    // SUGAR RUSH — zigzag of swapping blocks
    b.sign(-3, 6.5, -165, 'SUGAR RUSH', 'A zigzag of swapping blocks. Count your jumps!', 0, '#ff6aa8');
    for (let i = 0; i < 8; i++) b.clickClack({ x: i % 2 ? 1.6 : -1.6, y: 6.5 + (i % 2) * 0.6, z: -175 - i * 4.2, w: 2.6, d: 2.6, red: i % 2 === 1 });
    b.bonusFinish('switches', 0, 7, -215, 12, 12, 16);
    b.mushroom({ x: -4.5, y: 8, z: -219, r: 1.3, color: 0xff6aa8, stem: 1 });
    b.mushroom({ x: 4.5, y: 7.8, z: -218, r: 1.1, color: 0x4dd2ff, stem: 0.8 });
  },
};
