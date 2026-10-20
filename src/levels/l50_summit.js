// LEVEL 50 — The Summit: the highest peak in the sky, at sunrise. The grand finale: grappler, balloons,
// boost rings, grind rail, phantoms and seesaws — and one last slow-motion shot to open the gate.
import * as THREE from 'three';

const SNOWROCK = { p: 'speckle', a: '#e8eef6', b: ['#f4f8ff', '#d8e0ec', '#c8d0dc', '#ffffff'], seed: 501 };

export default {
  id: 'summit',
  name: 'The Summit',
  tagline: 'The grand finale at the top of the sky: grapple, float, grind and take one last slow-motion shot.',
  exposure: 0.48,
  sky: { mode: 'physical', light: { elev: 4, az: 0 }, turbidity: 3, rayleigh: 1.4, cov: 0.25, cirrus: 1.0, tint: [1.15, 1.0, 0.95] },
  light: { color: 0xffd0a0, intensity: 3.4 }, envIntensity: 1.0, fog: 0.0007,
  theme: { top: SNOWROCK, side: 'stone', stone: { p: 'tiles', a: '#c8a04a', b: ['#d8b05a', '#b8903a'], line: 'rgba(255,240,200,0.8)', n: 3, seed: 502 }, palette: 'ice', accent: '#ffd84d' },
  scenery: {
    islands: { palette: 'ice', trees: false, crystals: true, count: 30, seed: 501 }, sea: {}, clouds: { count: 90 }, birds: true,
    drift: [{ count: 500, color: 0xfff4e0, size: 0.07, fall: 0.5, sway: 2, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE SUMMIT', 'The last climb. Everything you learned in the sky, one more time.', 0, '#ffd84d');
    b.toolStation({ x: 4, y: 0, z: -4, tool: 'grapple' });

    // GRAPPLE ASCENT
    b.plat({ x: 0, y: 0, z: -10, w: 6, d: 4, style: 'trim' });
    b.grappleCliff({ y: 0, z: -12, h: 8, w: 6, d: 6 });
    b.hook({ x: 0, y: 12, z: -26, launch: { x: 0, y: 6, z: -10 } });
    b.plat({ x: 0, y: 8, z: -36, w: 6, d: 6, style: 'trim' });
    b.grappleCliff({ y: 8, z: -39, h: 8, w: 6, d: 6 });
    b.checkpoint(0, 16, -42);

    // BALLOON & RING
    b.sign(3.5, 16, -40, 'UP AND OVER', 'Balloon up, launch through the ring.', 0, '#ff7ab0');
    b.plat({ x: 0, y: 16, z: -48.5, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -48.5, y0: 17.9, y1: 25.9, color: 0xffd84d });
    b.boostRing({ x: 0, y: 23.5, z: -55, vel: { x: 0, y: 12.5, z: -13 }, r: 2.2 });
    b.plat({ x: 0, y: 22, z: -69.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 22, -69.5);

    // RIDGE RAIL
    b.sign(-3.5, 22, -67.5, 'RIDGE RAIL', 'Grind the ridge and jump at the end!', 0, '#4dd2ff');
    b.grindRail({ y: 22.3, z0: -74, z1: -100, speed: 10 });
    b.plat({ x: 0, y: 22, z: -112, w: 6, d: 6, style: 'trim' });

    // PHANTOM RIDGE & SEESAW
    b.phantom({ x: 0, y: 22, z: -119, color: 0xffd84d });
    b.phantom({ x: 1.5, y: 23, z: -124.5, color: 0xffd84d });
    b.seesaw({ x: 0, y: 23, z: -133, len: 10 });
    b.plat({ x: 0, y: 22, z: -144, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 22, -144);

    // THE LAST SHOT
    b.sign(3.5, 22, -142, 'THE LAST SHOT', 'Slow-mo, bounce, shoot. The finish is behind that gate.', 0, '#4dffd2');
    b.bulletTime({ y: 22, z: -151, sway: 2.5 });
    b.finish(0, 22, -169, 12, 12, 16);
    this.peaks(b);
  },

  // snowy peaks poking through the clouds
  peaks(b) {
    const snow = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.7, flatShading: true });
    const rock = new THREE.MeshStandardMaterial({ color: 0x6a7080, roughness: 1, flatShading: true });
    [[-80, -100, 40, 110], [90, -60, 34, 90], [-120, -240, 60, 150], [110, -220, 46, 120], [0, -330, 80, 180], [-40, 60, 30, 70]].forEach(([x, z, r, h], i) => {
      const base = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rock); base.position.set(x, -60 + h / 2, z); base.rotation.y = i; b.add(base);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.42, h * 0.42, 7), snow); cap.position.set(x, -60 + h - h * 0.21 + 0.5, z); cap.rotation.y = i; b.add(cap);
    });
  },
};
