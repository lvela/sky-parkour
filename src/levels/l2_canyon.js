// LEVEL 2 — Sunset Canyon: rock climbing, giant slides with kickers, wall slides, moving trampolines.
import * as THREE from 'three';

const THREE_V = THREE.Vector3;

export default {
  id: 'canyon',
  name: 'Sunset Canyon',
  tagline: 'Rock climbing, mega slides, wall slides and moving trampolines at golden hour.',
  exposure: 0.42,
  sky: { mode: 'physical', light: { elev: 5, az: 125 }, turbidity: 6.5, rayleigh: 2.6, mie: 0.007, mieG: 0.86, cov: 0.58, cirrus: 1.4, cloudBright: 1.0, tint: [1.35, 0.78, 0.58] },
  light: { color: 0xffb070, intensity: 3.4 }, envIntensity: 0.8, fog: 0.0011,
  theme: { top: 'sandTop', side: 'sandstone', stone: 'sandstone', palette: 'canyon', accent: '#ffb347' },
  scenery: { islands: { palette: 'canyon', mesas: true, leafHue: 0.22, leafLight: 0.28, count: 26, seed: 5 }, sea: {}, clouds: { count: 60 }, birds: true },
  killY: -30,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    // start
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'SUNSET CANYON', 'Climb the cliffs, ride the slides, and race the sunset.');
    b.tree(5.5, 0, 5, 1.0); b.tree(-6, 0, 5.5, 0.8);

    // stepping stones
    [0.6, 1.2, 1.8].forEach((y, i) => b.plat({ x: [0, 1.5, -1][i], y, z: -12 - i * 5.5, w: 3, d: 3, h: 1.2, rock: true, rockDepth: 3 }));

    // ROCK CLIMB 1
    b.plat({ x: 0, y: 2, z: -30, w: 8, d: 6, style: 'island', rock: true });
    b.sign(-3, 2, -28.5, 'ROCK CLIMB', 'Hold E / grip on a hold, press jump to reach up. Hold S + jump to kick off.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 12, z: -37, w: 8, d: 8, h: 12, style: 'climb', rock: true, rockDepth: 10 });
    b.holds(new THREE_V(0, 2, -33), new THREE_V(0, 0, 1), 2, 12);
    b.checkpoint(0, 12, -38.5);

    // MEGA SLIDE 1 with a kicker
    b.sign(2.6, 12, -40, 'MEGA SLIDE', 'Run onto the slide. Steer with your stick or keys and fly off the ramp!', 0, '#4dd2ff');
    b.ramp({ z0: -41, y0: 12, z1: -71, y1: 3 });
    b.ramp({ z0: -71, y0: 3, z1: -79, y1: 2.6 });
    b.ramp({ z0: -79, y0: 2.6, z1: -83, y1: 3.8 });
    b.plat({ x: 0, y: 3, z: -95, w: 12, d: 16, style: 'island', rock: true });
    b.checkpoint(0, 3, -97);

    // WALL SLIDES
    b.sign(-3.2, 3, -100.5, 'WALL SLIDES', 'Jump onto a blue wall to glide along it, then jump to the next one.', 0, '#4d8bff');
    b.plat({ x: -2.6, y: 8, z: -109, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 2.6, y: 8, z: -117, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: -2.6, y: 8, z: -125, w: 0.6, d: 10, h: 10, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 0, y: 2, z: -137, w: 8, d: 10, style: 'island', rock: true });

    // MOVING TRAMPOLINES
    b.sign(2.8, 2, -140, 'MOVING TRAMPOLINES', 'They slide side to side. Time your drop!', 0, '#ffd84d');
    b.plat({ x: 0, y: 0, z: -148, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.1) * 3; }) });
    b.plat({ x: 0, y: 0, z: -158, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.1 + Math.PI) * 3; }) });
    b.plat({ x: 0, y: 0, z: -168, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.1) * 3; }) });
    b.plat({ x: 0, y: 5, z: -178, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 5, -177);

    // ROCK CLIMB 2 — taller, zig-zag holds
    b.sign(-3.4, 5, -181.5, 'THE BIG WALL', 'A tall zig-zag climb. Don\'t look down!', 0, '#ff6d8a');
    b.plat({ x: 0, y: 20, z: -187, w: 10, d: 8, h: 20, style: 'climb', rock: true, rockDepth: 12 });
    b.holds(new THREE_V(0, 5, -183), new THREE_V(0, 0, 1), 5, 20, 0.55, 1.2);
    b.checkpoint(0, 20, -188.5);

    // FINAL SLIDE → giant launch onto the finish
    b.sign(3, 20, -190, 'FINAL DESCENT', 'The longest slide in the sky. Hold on to your hat!', 0, '#4dd2ff');
    b.ramp({ z0: -191, y0: 20, z1: -221, y1: 12 });
    b.ramp({ z0: -221, y0: 12, z1: -231, y1: 11.4 });
    b.ramp({ z0: -231, y0: 11.4, z1: -256, y1: 4 });
    b.ramp({ z0: -256, y0: 4, z1: -260, y1: 5.4 });
    b.bonusFinish(['train', 'bulletTime'], 0, 4, -286, 16, 24, 20);
    b.tree(-6, 4, -294, 1.1); b.tree(6.2, 4, -292, 0.9);
  },
};
