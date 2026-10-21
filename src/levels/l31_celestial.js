// LEVEL 31 — Celestial Temple: golden temples above a sea of sunset clouds. New: carousel bars.
const GILT = { soil: 0xb8a890, rockA: 0xd8c8a8, rockB: 0xf0e4c8, dark: 0x8a7a60, grassA: 0xf0d890, grassB: 0xffe8a8 };

export default {
  id: 'celestial',
  name: 'Celestial Temple',
  tagline: 'Ride carousel bars round golden masts and swing between temple bells at sunset.',
  exposure: 0.45,
  sky: { mode: 'physical', light: { elev: 4, az: 80 }, turbidity: 3, rayleigh: 2.8, mie: 0.006, cov: 0.62, cirrus: 1.5, cloudBright: 1.1, tint: [1.25, 0.9, 0.7] },
  light: { color: 0xffd090, intensity: 3.4 }, envIntensity: 1.0, fog: 0.001,
  theme: {
    top: { p: 'tiles', a: '#f4ecd8', b: ['#fff8e8', '#e8dcc0', '#f0d890'], line: 'rgba(200,150,60,0.6)', n: 2, seed: 311 },
    side: { p: 'speckle', a: '#e8dcc0', b: ['#f4ecd8', '#d8c8a0', '#f0d890'], seed: 312 },
    stone: { p: 'tiles', a: '#d8b860', b: ['#e8c870', '#c8a850'], line: 'rgba(120,80,20,0.6)', n: 4, seed: 313 },
    palette: GILT, accent: '#ffd84d',
  },
  scenery: {
    islands: { palette: GILT, leafHue: 0.13, leafSat: 0.8, leafLight: 0.6, count: 24, seed: 311 }, sea: {}, clouds: { count: 100 }, birds: true, birdColor: 0xfff4e0,
    drift: [{ count: 400, color: 0xffe080, size: 0.08, fall: -0.3, sway: 1.5, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'CELESTIAL TEMPLE', 'Jump and grab a carousel bar as it swings by, ride it round, then launch off!', 0, '#ffd84d');

    // CAROUSEL
    b.carousel({ cx: 0, y: 3.6, cz: -16, R: 5, n: 4, speed: 0.6 });
    b.plat({ x: 0, y: 0, z: -27, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -27);

    // SKY PENDULUMS
    b.sign(3, 0, -25, 'SKY PENDULUMS', 'Hop across as the platforms swing into line.', 0, '#ffd84d');
    [-35, -41, -47].forEach((z, i) => b.pendulum({ px: 0, py: 7, pz: z, L: 7, A: 0.45, phase: i * 1.1, w: 3, d: 3, axis: 'x' }));
    b.plat({ x: 0, y: 0, z: -56, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -56);

    // HEAVENLY ORBIT — a ring of platforms, then a carousel
    b.sign(-3, 0, -54, 'HEAVENLY ORBIT', 'Ride the orbit, then catch the carousel on the far side.', 0, '#ffd84d');
    b.orbit({ cx: 0, y: 0, cz: -70, R: 6, n: 3, speed: 0.7, style: 'top' });
    b.carousel({ cx: 0, y: 3.6, cz: -84, R: 4.5, n: 3, speed: -0.8 });
    b.plat({ x: 0, y: 0, z: -94, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -94);

    // TEMPLE BELLS
    b.sign(3, 0, -92, 'TEMPLE BELLS', 'Ride the swinging bells across.', 0, '#ffd84d');
    b.pendulum({ px: 0, py: 8, pz: -104, L: 8, A: 0.55, phase: 0, w: 3, d: 3, axis: 'z' });
    b.pendulum({ px: 0, py: 8, pz: -114, L: 8, A: 0.55, phase: Math.PI, w: 3, d: 3, axis: 'z' });
    b.plat({ x: 0, y: 0, z: -127, w: 8, d: 12, style: 'island', rock: true });
    b.checkpoint(0, 0, -124);

    // STAIRWAY TO HEAVEN — two carousels up to the finish
    b.sign(-3, 0, -122, 'STAIRWAY TO HEAVEN', 'Carousel, pillar, carousel, finish!', 0, '#ffd84d');
    b.carousel({ cx: 0, y: 3.6, cz: -139, R: 5, n: 4, speed: 0.7 });
    b.plat({ x: 0, y: 3, z: -149, w: 3, d: 3, style: 'trim', rock: true, rockDepth: 4 });
    b.carousel({ cx: 0, y: 6.6, cz: -157, R: 4.5, n: 3, speed: -0.8 });
    b.bonusFinish('ferris', 0, 6, -167, 12, 12, 16);
  },
};
