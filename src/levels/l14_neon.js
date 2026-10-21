// LEVEL 14 — Neon City: rain-slick rooftops in a cyberpunk night. New: laser gates and dash pads.
import * as THREE from 'three';
import { boxGeo, rng } from '../textures.js';

export default {
  id: 'neon',
  name: 'Neon City',
  tagline: 'Time the laser gates and let dash pads fling you across rain-slick rooftops.',
  exposure: 0.9,
  sky: {
    mode: 'gradient', light: { elev: 35, az: -40 },
    zen: [0.005, 0.003, 0.02], hor: [0.08, 0.02, 0.12], glow: [0.4, 0.05, 0.4], glowPow: 3, glowAmt: 0.5,
    cov: 0.55, cloudBright: 0.3, cloudShade: 0.3, cirrus: 0.2, stars: 0.6, tint: [0.8, 0.6, 1.2],
  },
  light: { color: 0x9a7aff, intensity: 1.4 }, envIntensity: 1.4, fog: 0.0016,
  hemi: { sky: 0x4a2a8a, ground: 0x10101a, intensity: 0.6 },
  theme: {
    top: { p: 'grid', a: '#14141c', b: ['#1c1c28', '#101018'], line: '#3af0ff', n: 4, seed: 141 }, side: 'panel', stone: 'panel',
    palette: { soil: 0x1a1a24, rockA: 0x22222e, rockB: 0x2e2e3e, dark: 0x0e0e14, grassA: 0x2a2a3a, grassB: 0x3a2a4a }, neon: 0x4dffff, accent: '#4dffff',
  },
  scenery: {
    islands: { palette: { soil: 0x1a1a24, rockA: 0x22222e, rockB: 0x2e2e3e, dark: 0x0e0e14, grassA: 0x2a2a3a, grassB: 0x3a2a4a }, trees: false, crystals: true, count: 26, seed: 141 },
    sea: {}, clouds: { count: 40 }, rain: true,
  },
  killY: -40,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'NEON CITY', 'Red lasers knock you flat. Wait for them to switch off, then run!', 0, '#4dffff');

    // LASER GRID
    b.plat({ x: 0, y: 0, z: -23, w: 4, d: 30, style: 'panel' });
    [-14, -20, -26, -32].forEach((z, i) => b.laser({ x: 0, y: 0, z, w: 4, period: 2.4, on: 0.5, phase: -i * 0.6 }));
    b.plat({ x: 0, y: 0, z: -42, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -42);

    // DASH PADS — rooftop to rooftop
    b.sign(3, 0, -40, 'DASH PADS', 'Step on a green pad and it flings you across the gap.', 0, '#3dffb0');
    b.dashPad({ x: 0, y: 0, z: -48.5, push: { x: 0, z: -16 }, bounce: 8 });
    b.plat({ x: 0, y: 0, z: -61, w: 6, d: 6, style: 'panel', rock: true, rockDepth: 8 });
    b.dashPad({ x: 0, y: 0, z: -65.5, push: { x: 0, z: -16 }, bounce: 8 });
    b.plat({ x: 0, y: 0, z: -78, w: 6, d: 6, style: 'panel', rock: true, rockDepth: 8 });
    b.dashPad({ x: 0, y: 0, z: -82.5, push: { x: -10, z: -12 }, bounce: 8 });
    b.plat({ x: -8, y: 0, z: -93, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(-8, 0, -93);

    // NEON SLIDES — wall slides between billboards
    b.sign(-11, 0, -91, 'NEON SLIDES', 'Jump onto the blue walls and slide along them.', 0, '#4d8bff');
    [[-10.6, -103], [-5.4, -111], [-10.6, -119]].forEach(([x, z]) => b.plat({ x, y: 9, z, w: 0.6, d: 10, h: 15, style: 'wallrun', type: 'wallrun' }));
    b.plat({ x: -8, y: -2, z: -131, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(-8, -2, -131);

    // LASER DASH — jump the low beams, time the gates, dash away
    b.sign(-11, -2, -129, 'LASER DASH', 'Jump the low beams, time the gates, then dash to the next roof.', 0, '#ff2a4a');
    b.plat({ x: -8, y: -2, z: -147, w: 3, d: 20, style: 'panel' });
    b.laser({ x: -8, y: -2, z: -141, w: 3, period: 1.6, on: 0.5, low: true });
    b.laser({ x: -8, y: -2, z: -145, w: 3, period: 1.6, on: 0.5, phase: 0.8, low: true });
    b.laser({ x: -8, y: -2, z: -149, w: 3, period: 1.8, on: 0.45 });
    b.laser({ x: -8, y: -2, z: -153, w: 3, period: 1.8, on: 0.45, phase: -0.6 });
    b.dashPad({ x: -8, y: -2, z: -158.5, push: { x: 8, z: -13 }, bounce: 8 });
    b.plat({ x: -2, y: -2, z: -170, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(-2, -2, -170);

    // LAST LEAP
    b.sign(1.5, -2, -168, 'LAST LEAP', 'One more dash to the finish.', 0, '#3dffb0');
    b.dashPad({ x: -2, y: -2, z: -175.5, push: { x: 0, z: -16 }, bounce: 8 });
    b.bonusFinish('beatBlocks', -2, -2, -191, 12, 12, 16);

    this.skyline(b);
  },

  // towers of lit windows below and around the course
  skyline(b) {
    const r = rng(1414);
    const neons = [0xff4dd2, 0x4dffff, 0xffd84d, 0x7a4dff].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    for (let i = 0; i < 60; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (16 + r() * 70), z = 20 - r() * 260;
      const w = 8 + r() * 12, d = 8 + r() * 12, top = -14 + r() * 26, h = 140;
      const m = new THREE.Mesh(boxGeo(w, h, d, 6), b.M.panel);
      m.position.set(x, top - h / 2, z); b.add(m);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), neons[i % 4]);
      rim.position.set(x, top, z); b.add(rim);
      if (r() < 0.4) {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(4 + r() * 4, 1.5 + r() * 2), neons[(i + 1) % 4]);
        sign.position.set(x - side * (w / 2 + 0.05), top - 4 - r() * 10, z); sign.rotation.y = side * Math.PI / 2 * -1; b.add(sign);
      }
    }
  },
};
