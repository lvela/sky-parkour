// LEVEL 49 — Toy Factory: a giant toy workshop in bright primary colours. New: SPINNING DRUMS that roll you back
// (or off the side) and SPRING WALLS — bounce between them to climb a pinball alley.
import * as THREE from 'three';

const TOYS = { p: 'tiles', a: '#f4f0e8', b: ['#ff4a3a', '#3a8aff', '#ffd23a', '#3ad85a'], line: 'rgba(255,255,255,0.9)', n: 3, seed: 491 };

export default {
  id: 'toyfactory',
  name: 'Toy Factory',
  tagline: 'Rolling drums, bouncy spring walls and a timed gate in a giant toy workshop.',
  exposure: 0.55,
  sky: { mode: 'physical', light: { elev: 35, az: 160 }, turbidity: 2.2, rayleigh: 1.0, cov: 0.4, cirrus: 0.5, tint: [1.05, 1.0, 1.0] },
  light: { color: 0xffffff, intensity: 3.2 }, envIntensity: 1.1, fog: 0.0009,
  theme: { top: TOYS, side: 'panel', stone: { p: 'stripes', a: '#ff4a3a', b: ['#ffffff'], n: 6, seed: 492 }, palette: 'day', accent: '#ffd23a' },
  scenery: {
    islands: { palette: 'day', count: 26, seed: 491 }, sea: {}, clouds: { count: 70 },
    drift: [{ count: 400, color: 0xff6aa0, size: 0.1, fall: 0.8, sway: 2 }, { count: 300, color: 0x6ab0ff, size: 0.1, fall: 0.8, sway: 2 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'TOY FACTORY', 'The drums roll toward you. Hop from drum to drum without stopping!', 0, '#ffd23a');
    this.blocks(b, [[5.5, 0, 5, 0xff4a3a], [6.5, 1.2, 5.2, 0x3a8aff], [-6, 0, 6, 0xffd23a]]);

    // DRUM CROSSING
    for (const z of [-11, -14.6, -18.2, -21.8]) b.drum({ x: 0, y: 0, z, len: 4, r: 1.6, speed: 3 });
    b.plat({ x: 0, y: 0, z: -30, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -30);

    // LOG ROLL
    b.sign(3.5, 0, -29, 'LOG ROLL', 'These drums roll sideways. Lean against them as you run!', 0, '#3a8aff');
    b.drum({ x: 0, y: 0, z: -42, len: 14, r: 1.4, speed: 2.2, axis: 'z', dir: 1 });
    b.drum({ x: 0, y: 0, z: -58, len: 14, r: 1.4, speed: 2.2, axis: 'z', dir: -1 });
    b.plat({ x: 0, y: 0, z: -71, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -71);

    // PINBALL ALLEY — spring walls
    b.sign(-3.5, 0, -69, 'PINBALL ALLEY', 'Run into a spring wall: it bounces you to the other one, higher each time. Bounce up to the ledge!', 0, '#ff4a3a');
    b.plat({ x: 0, y: 0, z: -87, w: 5.4, d: 24, style: 'trim' });
    for (const s of [-1, 1]) b.springWall({ x: s * 3, y: 0, z: -87.5, w: 0.6, d: 23, h: 9, power: 8, up: 9 });
    b.plat({ x: 0, y: 5, z: -103, w: 6, d: 8, h: 6, style: 'trim' });
    for (const s of [-1, 1]) b.plat({ x: s * 3.3, y: 10, z: -103, w: 0.6, d: 8, h: 5, style: 'wall' }); // catch you as you bounce out
    b.checkpoint(0, 5, -103);

    // ASSEMBLY LINE — drums, then a race through the timed gate
    b.sign(3.5, 5, -101, 'ASSEMBLY LINE', 'Drums, then hit the plate and race the gate!', 0, '#ffd23a');
    for (const z of [-110.8, -114.4, -118]) b.drum({ x: 0, y: 5, z, len: 4, r: 1.6, speed: 3.5 });
    b.plat({ x: 0, y: 5, z: -125.5, w: 4, d: 6, style: 'trim' });
    b.pressureGate({ plate: { x: 0, y: 5, z: -125.5 }, gate: { x: 0, y: 5, z: -138, w: 4 }, open: 4 });
    b.plat({ x: 0, y: 5, z: -138, w: 4, d: 16, style: 'trim' });
    b.finish(0, 5, -152, 12, 12, 16);
  },

  // stacked toy blocks with letters
  blocks(b, list) {
    const letters = ['A', 'B', 'C'];
    list.forEach(([x, y, z, color], i) => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#' + color.toString(16).padStart(6, '0'); g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#fff'; g.font = '900 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letters[i % 3], 32, 35);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      m.position.set(x, y + 0.6, z); m.rotation.y = i * 0.4; m.castShadow = true; b.add(m);
    });
  },
};
