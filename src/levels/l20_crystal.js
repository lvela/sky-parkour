// LEVEL 20 — Crystal Caverns: a glittering violet geode lit by its own crystals. New: shrinking crystal pads.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const GEODE = { soil: 0x2a2040, rockA: 0x3a3050, rockB: 0x4a4068, dark: 0x1a1428, grassA: 0x6a4aa0, grassB: 0x8a6ac0 };

export default {
  id: 'crystal',
  name: 'Crystal Caverns',
  tagline: 'Crystal pads shrink away beneath you, phase crystals blink and the floor is slick.',
  exposure: 0.9,
  sky: {
    mode: 'gradient', light: { elev: 40, az: 20 },
    zen: [0.01, 0.005, 0.03], hor: [0.12, 0.05, 0.2], glow: [0.3, 0.2, 0.6], glowPow: 3, glowAmt: 0.5,
    cov: 2, cirrus: 0, nebula: 0.6, stars: 0.5, tint: [0.9, 0.8, 1.2],
  },
  light: { color: 0xc8a0ff, intensity: 1.8 }, envIntensity: 1.3, fog: 0.002,
  hemi: { sky: 0x6040c0, ground: 0x201040, intensity: 0.7 },
  theme: {
    top: { p: 'hex', a: '#3a2a5a', b: ['#4a3a70', '#2a1a4a'], line: '#c08aff', glow: true, size: 28, seed: 201 },
    side: { p: 'speckle', a: '#2a2040', b: ['#3a2a5a', '#1a1430', '#5a3a8a'], seed: 202 },
    stone: { p: 'cracks', a: '#3a3050', b: ['#4a4068', '#2a2040'], line: '#a07aff', glow: true, seed: 203 },
    palette: GEODE, neon: 0xc08aff, accent: '#c08aff',
  },
  scenery: {
    islands: { palette: GEODE, trees: false, crystals: true, count: 30, seed: 201 }, sea: false, clouds: false,
    drift: [{ count: 500, color: 0x9af0ff, size: 0.08, fall: 0.2, sway: 1.5, additive: true }],
  },
  killY: -40,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'CRYSTAL CAVERNS', 'Crystal pads shrink away and grow back. Don\'t be on one when it vanishes!', 0, '#c08aff');

    // SHRINKING PADS
    [-12.5, -18.5, -24.5, -30.5].forEach((z, i) => b.shrinkPad({ x: 0, y: 0, z, period: 4, phase: -i * 1.0 }));
    b.plat({ x: 0, y: 0, z: -39, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -39);

    // PHASE CRYSTALS
    b.sign(3, 0, -37, 'PHASE CRYSTALS', 'These blink in and out. Jump while they\'re solid.', 0, '#ff4dff');
    [-47.5, -54, -60.5].forEach((z, i) => b.blink({ x: 0, y: 0, z, w: 4, d: 4, period: 3, on: 0.6, phase: (i % 2) * 1.5 }));
    b.plat({ x: 0, y: 0, z: -69, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -69);

    // CRYSTAL ICE
    b.sign(-3, 0, -67, 'CRYSTAL ICE', 'Slick crystal. Land early and don\'t slide off!', 0, '#9af0ff');
    [[0, 0], [1, 0.4], [-1, 0.8]].forEach(([x, y], i) => b.plat({ x, y, z: -77.5 - i * 7, w: 3.5, d: 5, h: 0.8, style: 'ice', type: 'ice' }));
    b.plat({ x: 0, y: 0.8, z: -103, w: 8, d: 12, style: 'island', rock: true });
    b.checkpoint(0, 0.8, -99);

    // SHRINK & SWEEP — dodge the sweeper, then faster shrinking steps
    b.sign(3, 0.8, -98, 'SHRINK & SWEEP', 'Jump the sweeper, then race up the shrinking steps.', 0, '#c08aff');
    b.sweeper({ x: 0, y: 0.8, z: -105, r: 3.5, speed: 1.6 });
    [1.3, 1.8, 2.3, 2.8].forEach((y, i) => b.shrinkPad({ x: 0, y, z: -113.5 - i * 6, period: 3, phase: -i * 0.75 }));
    b.plat({ x: 0, y: 3, z: -139.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 3, -139.5);

    // GEODE WALL
    b.sign(-3, 3, -137.5, 'GEODE WALL', 'Climb the geode, then one last shrinking pad.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 15, z: -145.5, w: 6, d: 4, h: 12, style: 'trim' });
    b.holds(new V3(0, 3, -143.5), new V3(0, 0, 1), 3, 15, 0.55, 0.45);
    b.shrinkPad({ x: 0, y: 15, z: -151.25, period: 3 });
    b.finish(0, 15, -160, 12, 8, 16);
    const cm = new THREE.MeshBasicMaterial({ color: 0xc08aff, toneMapped: false });
    for (const [x, z, s] of [[-4.5, -162, 1.4], [4.6, -161, 1.1], [-3.5, -158, 0.8]]) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), cm); c.scale.set(s, s * 2.6, s); c.position.set(x, 15 + s * 1.4, z); b.add(c);
    }
  },
};
