// LEVEL 4 — Aurora Night: a neon run under the Milky Way, a huge moon and dancing aurora.
import * as THREE from 'three';

const V3 = THREE.Vector3;

export default {
  id: 'aurora',
  name: 'Aurora Night',
  tagline: 'A glowing night run: slides, climbing, moving walls, wall slides, hammers and a zipline.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 32, az: -150 },
    zen: [0.0015, 0.003, 0.012], hor: [0.012, 0.02, 0.045], glow: [0.05, 0.07, 0.12], glowPow: 18, glowAmt: 0.5,
    cov: 0.62, cloudBright: 0.5, cloudShade: 0.6, cirrus: 0.4, stars: 1, milky: 1,
    moon: { elev: 32, az: -150, size: 3.2, bright: 0.9 },
  },
  light: { color: 0x9fb8ff, intensity: 1.4 }, envIntensity: 2.0, fog: 0.0007,
  hemi: { sky: 0x3050a0, ground: 0x101020, intensity: 0.5 },
  theme: { top: 'darkGrass', side: 'slate', stone: 'slate', palette: 'night', neon: 0x38e8ff, accent: '#7af7ff' },
  scenery: { islands: { palette: 'night', crystals: true, leafHue: 0.45, leafLight: 0.12, count: 22, seed: 13 }, sea: { y: -180 }, clouds: { count: 50, seaY: -180 }, aurora: true },
  killY: -45,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'AURORA NIGHT', 'Follow the glowing edges through the night sky.');

    // NEON SLIDE
    b.ramp({ z0: -8, y0: 0, z1: -38, y1: -8 });
    b.ramp({ z0: -38, y0: -8, z1: -42, y1: -6.8 });
    b.plat({ x: 0, y: -7, z: -52, w: 12, d: 12, style: 'island', rock: true });

    // CLIMB
    b.sign(3, -7, -49.5, 'NIGHT CLIMB', 'Grab the glowing holds and climb to the top.', 0, '#ff6dd2');
    b.plat({ x: 0, y: 5, z: -61, w: 8, d: 6, h: 12, style: 'climb', rock: true, rockDepth: 8 });
    b.holds(new V3(0, -7, -58), new V3(0, 0, 1), -7, 5, 0.55, 0.6);
    b.checkpoint(0, 5, -61.5);

    // MOVING WALL JUMPS (walls slide forward/back)
    b.sign(-3, 5, -62.5, 'SHIFTING WALLS', 'The walls slide back and forth. Wall jump across!', 0, '#ff8a4a');
    [-70, -74, -78, -82].forEach((z, i) => {
      b.plat({ x: (i % 2 === 0 ? -1 : 1) * 2.3, y: 17, z, w: 0.6, d: 10, h: 17, style: 'wall', type: 'wall',
        motion: t0((v, t) => { v.z = Math.sin(t * 1.1 + i * 1.6); }) });
    });
    b.plat({ x: 0, y: 4, z: -94, w: 8, d: 10, style: 'island', rock: true });

    // WALL SLIDES
    b.sign(3, 4, -96, 'WALL SLIDES', 'Glide along the blue walls and leap between them.', 0, '#4d8bff');
    b.plat({ x: -2.6, y: 9, z: -105, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 2.6, y: 9, z: -113, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: -2.6, y: 9, z: -121, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 0, y: 3, z: -133, w: 8, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 3, -133);

    // MOVING TRAMPOLINES
    b.plat({ x: 0, y: 0, z: -144, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.2) * 2; }) });
    b.plat({ x: 0, y: 0, z: -153.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.z = Math.sin(t * 1.2 + 2) * 1.5; }) });
    b.plat({ x: 0, y: 5, z: -163.5, w: 8, d: 11, style: 'island', rock: true });

    // HAMMERS
    b.sign(-3, 5, -161, 'MOONLIGHT HAMMERS', 'Time your run between the swinging hammers.', 0, '#ff4d4d');
    b.plat({ x: 0, y: 5, z: -184, w: 4, d: 24, style: 'stone' });
    [-177, -184, -191].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 14, L: 8, A: 0.95, phase: i * 2.3 });
      b.post(-3.4, 5, 14.5, z, false, b.M.iron, 0.2); b.post(3.4, 5, 14.5, z, false, b.M.iron, 0.2);
      const beam = b.post(0, 14.3, 14.7, z, false, b.M.iron, 0.2); beam.scale.x = 17.5;
    });
    b.plat({ x: 0, y: 5, z: -200, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 5, -199);

    // ZIPLINE FINALE
    b.sign(3, 5, -202, 'STARFALL ZIPLINE', 'Grab the handle and ride down to the finish.', 0, '#7af7ff');
    b.zip(new V3(0, 8.8, -203.3), new V3(0, -5.2, -253.5));
    b.bonusFinish(['phantom', 'bulletTime'], 0, -9, -256, 12, 12, 14);
  },
};
