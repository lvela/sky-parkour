// LEVEL 42 — Moonbase: grey craters under a black sky with a ringed blue planet overhead. Low gravity everywhere.
// New: LOW-GRAVITY BUBBLES (gravity drops even further inside) and floating mines.
import * as THREE from 'three';

const REGOLITH = { p: 'speckle', a: '#8a8a90', b: ['#9a9aa0', '#7a7a80', '#aaaab0', '#6a6a70'], seed: 421 };
const MOON_ROCK = { soil: 0x6a6a70, rockA: 0x7a7a80, rockB: 0x9a9aa0, dark: 0x4a4a50, grassA: 0x8a8a90, grassB: 0x9a9aa0 };

export default {
  id: 'moonbase',
  name: 'Moonbase',
  tagline: 'Low gravity on the Moon — and bubbles where it\'s even lower. Float past the drifting mines.',
  exposure: 0.9,
  gravity: 0.7,
  sky: {
    mode: 'gradient', light: { elev: 25, az: 60 },
    zen: [0, 0, 0.002], hor: [0.01, 0.01, 0.02], glow: [0.2, 0.2, 0.2], glowPow: 6, glowAmt: 0.3,
    cov: 2, cirrus: 0, stars: 1.6, milky: 1.2, space: true,
    planet: { elev: 28, az: -150, size: 12, bright: 1.0, a: [0.2, 0.45, 0.9], b: [0.25, 0.6, 0.3], tilt: 1.4 },
  },
  light: { color: 0xffffff, intensity: 3.0 }, envIntensity: 1.2, fog: 0.0003,
  hemi: { sky: 0x405070, ground: 0x101014, intensity: 0.5 },
  theme: { top: REGOLITH, side: 'stone', stone: { p: 'hex', a: '#d8dce4', b: ['#c8ccd4', '#e0e4ec'], line: '#4dd2ff', glow: true, size: 24, seed: 422 }, palette: MOON_ROCK, accent: '#9ad8ff' },
  scenery: { islands: { palette: MOON_ROCK, trees: false, crystals: true, count: 24, seed: 421 }, sea: false, clouds: false },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'MOONBASE', 'Gravity is weak here: your jumps go higher and further.', 0, '#9ad8ff');
    this.base(b, 6, 0, 3);

    // MOON HOPS
    b.plat({ x: 0, y: 0, z: -14.5, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 1, z: -23, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 2, z: -31.5, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 2, z: -41.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2, -41.5);

    // LOW-G BUBBLE
    b.sign(3.5, 2, -39.5, 'LOW-G BUBBLE', 'Inside the shimmering bubble gravity almost vanishes. Float up!', 0, '#9ad8ff');
    b.lowGrav({ x: 0, y: 2, z: -60, R: 9, h: 16, scale: 0.5 });
    b.plat({ x: 0, y: 2, z: -52, w: 3, d: 3, style: 'trim' });
    b.plat({ x: 3, y: 6, z: -58, w: 3, d: 3, style: 'trim' });
    b.plat({ x: -2, y: 10, z: -63, w: 3, d: 3, style: 'trim' });
    b.plat({ x: 0, y: 14, z: -68, w: 3, d: 3, style: 'trim' });
    b.plat({ x: 0, y: 13, z: -77, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 13, -77);

    // MINEFIELD
    b.sign(-3.5, 13, -75, 'MINEFIELD', 'Floating mines drift across the path. Time your run!', 0, '#ff4a3a');
    b.plat({ x: 0, y: 13, z: -95, w: 5, d: 24, style: 'trim' });
    b.mines({ x0: -2.5, x1: 2.5, y: 13, z0: -85, z1: -105, n: 5, speed: 1.1 });
    b.plat({ x: 0, y: 13, z: -113, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 13, -113);

    // CRATER FLOAT — a long low-g tunnel with mines inside
    b.sign(3.5, 13, -111, 'CRATER FLOAT', 'Long floaty leaps — but mind the mines drifting in the bubble.', 0, '#9ad8ff');
    b.lowGrav({ x: 0, y: 13, z: -133, R: 5, d: 22, h: 14, scale: 0.5 });
    b.plat({ x: 0, y: 13, z: -122, w: 3, d: 3, style: 'trim' });
    b.mines({ x0: -2, x1: 2, y: 14, z0: -125, z1: -131, n: 2, speed: 0.8 });
    b.plat({ x: 0, y: 17, z: -133, w: 3, d: 3, style: 'trim' });
    b.plat({ x: 0, y: 21, z: -141, w: 3, d: 3, style: 'trim' });
    b.finish(0, 20, -152, 12, 12, 16);
    this.base(b, -7, 20, -150);
  },

  // a little moonbase dome with an antenna
  base(b, x, y, z) {
    const white = new THREE.MeshStandardMaterial({ color: 0xe8ecf4, roughness: 0.4, metalness: 0.3 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), white); dome.position.set(x, y, z); dome.castShadow = true; b.add(dome);
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: 0x9ad8ff, toneMapped: false })); win.position.set(x, y + 1, z + 1.75); win.rotation.x = -0.5; b.add(win);
    b.post(x + 1.2, y, y + 4, z - 0.5, false, b.M.metal, 0.05);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), white); dish.position.set(x + 1.2, y + 4, z - 0.5); dish.rotation.x = Math.PI * 0.7; b.add(dish);
  },
};
