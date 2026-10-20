// LEVEL 43 — Midnight Funfair: a fairground floating in the night sky, all lights and music.
// New: spinning saucers (fairground teacups) and Ferris wheels.
import * as THREE from 'three';

const CANDY = { p: 'stripes', a: '#ff4d8a', b: ['#fff0f4'], n: 8, seed: 431 };

export default {
  id: 'funfair',
  name: 'Midnight Funfair',
  tagline: 'Ride the spinning saucers and the Ferris wheel to the top of the fair.',
  exposure: 0.95,
  sky: {
    mode: 'gradient', light: { elev: 40, az: 30 },
    zen: [0.006, 0.002, 0.02], hor: [0.06, 0.02, 0.08], glow: [0.3, 0.08, 0.3], glowPow: 3, glowAmt: 0.4,
    cov: 0.4, cloudBright: 0.3, cloudShade: 0.4, cirrus: 0.1, stars: 1.3, milky: 0.6,
    moon: { elev: 35, az: 20, size: 4, bright: 1.0 },
  },
  light: { color: 0xc0b0ff, intensity: 1.6 }, envIntensity: 1.4, fog: 0.0012,
  hemi: { sky: 0x6040a0, ground: 0x200a20, intensity: 0.7 },
  theme: { top: { p: 'tiles', a: '#2a1a3a', b: ['#3a2050', '#4a2a3a', '#2a2a50'], line: '#ffd84d', n: 4, seed: 432 }, side: 'panel', stone: CANDY, palette: 'night', neon: 0xffd84d, accent: '#ffd84d' },
  scenery: { islands: { palette: 'night', trees: false, crystals: true, count: 24, seed: 431 }, sea: {}, clouds: { count: 40 } },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'MIDNIGHT FUNFAIR', 'Hop onto a spinning saucer as it swings past, and ride it round.', 0, '#ffd84d');
    this.bunting(b, 0, 6, 8);

    // SPINNING SAUCERS
    b.teacups({ cx: 0, y: 0, cz: -18, R: 5, n: 3, speed: 0.5, spin: 1.2, size: 3 });
    b.plat({ x: 0, y: 0, z: -30.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -30.5);

    // FERRIS WHEEL
    b.sign(3.5, 0, -28.5, 'FERRIS WHEEL', 'Step into a gondola at the bottom, ride to the top and jump off forward.', 0, '#ff4d8a');
    b.plat({ x: 0, y: 0, z: -36, w: 3, d: 3, style: 'trim' });
    b.ferris({ x: 0, y: 0, z: -39.5, R: 7, n: 6, speed: 0.3 });
    b.plat({ x: 0, y: 14, z: -44.2, w: 4, d: 4, style: 'trim' });
    b.plat({ x: 0, y: 14, z: -53, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 14, -53);

    // HIGH-WIRE SEESAWS
    b.sign(-3.5, 14, -51, 'HIGH WIRE', 'Seesaws above the fairground.', 0, '#ffd84d');
    b.seesaw({ x: 0, y: 14, z: -63, len: 10 });
    b.plat({ x: 0, y: 13, z: -72.5, w: 3, d: 3, style: 'trim' });
    b.seesaw({ x: 0, y: 13, z: -81, len: 10 });
    b.plat({ x: 0, y: 11.5, z: -93, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 11.5, -93);

    // TEACUP FRENZY → THE BIG WHEEL
    b.sign(3.5, 11.5, -91, 'BIG WHEEL', 'Faster saucers, then the biggest wheel of all.', 0, '#ff4d8a');
    b.teacups({ cx: 0, y: 11.5, cz: -107, R: 5, n: 4, speed: 0.6, spin: -1.0, size: 3 });
    b.plat({ x: 0, y: 11.5, z: -117, w: 3, d: 3, style: 'trim' });
    b.ferris({ x: 0, y: 11.5, z: -120.5, R: 8, n: 8, speed: 0.28 });
    b.finish(0, 27.5, -129, 12, 12, 16);
    this.bunting(b, 0, 33.5, -133);
  },

  // strings of coloured lights
  bunting(b, x, y, z) {
    const cols = [0xff4d6d, 0xffd84d, 0x4dd2ff, 0x7dff6a, 0xc77dff];
    for (let k = 0; k < 16; k++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: cols[k % 5], toneMapped: false }));
      const u = k / 15;
      bulb.position.set(x - 5.8 + u * 11.6, y - Math.sin(u * Math.PI) * 1.2, z);
      b.add(bulb);
    }
    for (const s of [-5.8, 5.8]) b.post(x + s, y - 6, y + 0.2, z, false, b.M.metal, 0.08);
  },
};
