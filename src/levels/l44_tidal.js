// LEVEL 44 — Tidal Temple: a sunken temple in a floating basin where the sea rises and falls.
// New: the TIDE (wade in too deep and you're swept back), floats that ride it, and pressure plates
// that drop a gate for a few seconds.
import * as THREE from 'three';

const MOSS = { p: 'tiles', a: '#5a6a5a', b: ['#6a7a64', '#526252', '#7a8a6a'], line: 'rgba(30,40,30,0.6)', n: 3, seed: 441 };
const TEMPLE_ROCK = { soil: 0x4a5a4a, rockA: 0x6a7a6a, rockB: 0x8a9a88, dark: 0x3a443a, grassA: 0x4a8a5a, grassB: 0x5aa06a };

export default {
  id: 'tidal',
  name: 'Tidal Temple',
  tagline: 'The tide rises and falls. Cross the causeways at low tide, ride the floats, and race the timed gates.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 28, az: -30 }, turbidity: 6, rayleigh: 2.2, cov: 0.75, cirrus: 0.4, tint: [0.9, 1.0, 1.05] },
  light: { color: 0xe0f0ff, intensity: 2.6 }, envIntensity: 1.0, fog: 0.0016,
  theme: { top: MOSS, side: 'stone', stone: { p: 'cracks', a: '#7a8a7a', b: ['#6a7a6a', '#8a9a8a'], line: 'rgba(30,40,30,0.6)', seed: 442 }, palette: TEMPLE_ROCK, accent: '#4dd2c8' },
  scenery: { islands: { palette: TEMPLE_ROCK, count: 24, seed: 441 }, sea: {}, clouds: { count: 70 }, rain: true },
  killY: -32,

  build(b) {
    const tide = b.tide({ x0: -30, x1: 30, z0: 12, z1: -178, low: -2, high: 2.5, period: 14 });
    this.basin(b);
    b.plat({ x: 0, y: 2.4, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 12 });
    b.checkpoint(0, 2.4, 4);
    b.sign(-4.5, 2.4, -3, 'TIDAL TEMPLE', 'The sea rises and falls. Wait for low tide, then run the causeway!', 0, '#4dd2c8');

    // CAUSEWAY
    b.plat({ x: 0, y: 1.2, z: -9, w: 3, d: 2, style: 'trim' });
    b.plat({ x: 0, y: 0, z: -22, w: 4, d: 24, style: 'trim' });
    b.plat({ x: 0, y: 1.2, z: -36, w: 3, d: 2, style: 'trim' });
    b.plat({ x: 0, y: 2.4, z: -41, w: 8, d: 8, style: 'island', rock: true, rockDepth: 8 });
    b.checkpoint(0, 2.4, -41);

    // FLOATS
    b.sign(3.5, 2.4, -39, 'FLOATS', 'The floats rise with the tide. Hop across, and wait for high tide to reach the far side.', 0, '#4dd2c8');
    for (const z of [-48.5, -54.5, -60.5]) b.float({ z, tide });
    b.plat({ x: 0, y: 2.4, z: -68, w: 8, d: 8, style: 'island', rock: true, rockDepth: 8 });
    b.checkpoint(0, 2.4, -66);

    // TIMED GATE
    b.sign(-3.5, 2.4, -66, 'TIMED GATE', 'Step on the orange plate: the gate drops for 5 seconds. Go!', 0, '#ffb02e');
    b.pressureGate({ plate: { x: 0, y: 2.4, z: -70.5 }, gate: { x: 0, y: 0, z: -90, w: 4 }, open: 5 });
    b.plat({ x: 0, y: 1.2, z: -73, w: 3, d: 2, style: 'trim' });
    b.plat({ x: 0, y: 0, z: -84, w: 4, d: 20, style: 'trim' });
    b.plat({ x: 0, y: 1.2, z: -95, w: 3, d: 2, style: 'trim' });
    b.plat({ x: 0, y: 2.4, z: -100, w: 8, d: 8, style: 'island', rock: true, rockDepth: 8 });
    b.checkpoint(0, 2.4, -100);

    // TIDE POOLS
    b.sign(3.5, 2.4, -98, 'TIDE POOLS', 'More floats — the far ledge is higher, so wait for the top of the tide.', 0, '#4dd2c8');
    for (const z of [-107.5, -113.5, -119.5]) b.float({ z, tide });
    b.plat({ x: 0, y: 3.5, z: -127, w: 8, d: 8, style: 'island', rock: true, rockDepth: 8 });
    b.checkpoint(0, 3.5, -125);

    // LAST GATE
    b.sign(-3.5, 3.5, -125, 'LAST GATE', 'Low tide AND an open gate. Pick your moment.', 0, '#ffb02e');
    b.pressureGate({ plate: { x: 0, y: 3.5, z: -129.5 }, gate: { x: 0, y: 0, z: -150, w: 4 }, open: 6 });
    b.plat({ x: 0, y: 1.75, z: -132, w: 3, d: 2, style: 'trim' });
    b.plat({ x: 0, y: 0, z: -145, w: 4, d: 24, style: 'trim' });
    b.plat({ x: 0, y: 1.2, z: -158, w: 3, d: 2, style: 'trim' });
    b.finish(0, 2.4, -165, 12, 12, 10);
  },

  // the stone basin that holds the sea, with broken columns
  basin(b) {
    const stone = b.M.stone;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(64, 4, 196), stone); floor.position.set(0, -9, -83); b.add(floor);
    for (const s of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 196), stone); wall.position.set(s * 31, -3, -83); b.add(wall);
    }
    for (const z of [13, -179]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(64, 14, 2), stone); wall.position.set(0, -3, z); b.add(wall); }
    const col = new THREE.MeshStandardMaterial({ color: 0xc8c8b8, roughness: 0.8 });
    for (let k = 0; k < 14; k++) {
      const s = k % 2 ? 1 : -1, h = 6 + (k * 7) % 9;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, h, 12), col);
      c.position.set(s * (12 + (k * 5) % 14), -7 + h / 2, -10 - k * 12); c.rotation.z = (k % 3 - 1) * 0.15; b.add(c);
    }
  },
};
