// LEVEL 41 — Balloon Fiesta: a pastel morning full of hot-air balloons. New: balloons you grab and float up on
// (they pop at the top!) and boost rings that fire you through the air.
import * as THREE from 'three';

const PASTEL = { p: 'tiles', a: '#f4e8f0', b: ['#ffd0e0', '#d0e8ff', '#fff0b0', '#d0ffd8'], line: 'rgba(255,255,255,0.8)', n: 4, seed: 411 };

export default {
  id: 'balloons',
  name: 'Balloon Fiesta',
  tagline: 'Grab a balloon and float up — let go before it pops! Then fly through the boost rings.',
  exposure: 0.55,
  sky: { mode: 'physical', light: { elev: 22, az: 40 }, turbidity: 2.5, rayleigh: 1.2, cov: 0.5, cirrus: 0.6, tint: [1.05, 0.98, 1.08] },
  light: { color: 0xfff0f0, intensity: 3.0 }, envIntensity: 1.1, fog: 0.0009,
  theme: { top: PASTEL, side: 'dirt', stone: PASTEL, palette: 'day', accent: '#ff7ab0' },
  scenery: {
    islands: { palette: 'day', leafHue: 0.92, leafSat: 0.5, leafLight: 0.75, count: 30, seed: 411 }, sea: {}, clouds: { count: 80 }, birds: true,
    drift: [{ count: 400, color: 0xffffff, size: 0.1, fall: 0.6, sway: 2 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'BALLOON FIESTA', 'Grab the balloon\'s handle and float up. Launch off before it POPS!', 0, '#ff7ab0');

    // FIRST BALLOON
    b.plat({ x: 0, y: 0, z: -10.5, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -10.5, y0: 1.9, y1: 10.9, color: 0xff4d6d });
    b.plat({ x: 0, y: 9, z: -15.5, w: 4, d: 4, style: 'trim' });

    // BOOST RINGS
    b.sign(1.5, 9, -14.5, 'BOOST RINGS', 'Jump through a ring and it fires you onward!', 0.2, '#7dff6a');
    b.boostRing({ x: 0, y: 10.5, z: -21, vel: { x: 0, y: 7, z: -15 } });
    b.plat({ x: 0, y: 9, z: -32, w: 4, d: 8, style: 'trim' });
    b.boostRing({ x: 0, y: 10.5, z: -40, vel: { x: 0, y: 12, z: -12 } });
    b.plat({ x: 0, y: 12, z: -51, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 12, -51);

    // BALLOON CHAIN
    b.sign(-3.5, 12, -49, 'BALLOON CHAIN', 'Ride each balloon up and launch to the next one.', 0, '#ff7ab0');
    b.plat({ x: 0, y: 12, z: -58, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -58, y0: 13.9, y1: 21.9, color: 0x4dd2ff, phase: 0 });
    b.plat({ x: 0, y: 20, z: -64, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -64, y0: 21.9, y1: 29.9, color: 0xffd84d, phase: 2 });
    b.plat({ x: 0, y: 28, z: -70.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 28, -70.5);

    // RING RUSH — down through the sky
    b.sign(3.5, 28, -68.5, 'RING RUSH', 'Three rings, three landings. Steer for the platforms!', 0, '#7dff6a');
    b.boostRing({ x: 0, y: 29.6, z: -78, vel: { x: 0, y: 4, z: -16 }, r: 1.8 });
    b.plat({ x: 0, y: 22, z: -94, w: 4, d: 6, style: 'trim' });
    b.boostRing({ x: 0, y: 23.6, z: -100.5, vel: { x: -6, y: 5, z: -14 }, r: 1.8 });
    b.plat({ x: -6, y: 16, z: -115, w: 5, d: 5, style: 'trim' });
    b.boostRing({ x: -6, y: 17.6, z: -121, vel: { x: 6, y: 12, z: -13 }, r: 1.8 });
    b.plat({ x: 0, y: 18, z: -133, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 18, -133);

    // FINALE — balloon into a ring
    b.sign(-3.5, 18, -131, 'GRAND FINALE', 'Float up, launch through the ring, fly to the finish!', 0, '#ff7ab0');
    b.plat({ x: 0, y: 18, z: -140, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -140, y0: 19.9, y1: 27.9, color: 0xc77dff });
    b.boostRing({ x: 0, y: 25, z: -146, vel: { x: 0, y: 8, z: -16 }, r: 2.2 });
    b.finish(0, 24, -160, 12, 12, 16);
    this.hotAir(b);
  },

  // hot-air balloons drifting in the background
  hotAir(b) {
    const cols = [0xff4d6d, 0xffd84d, 0x4dd2ff, 0x7dff6a, 0xc77dff, 0xff9a3d];
    const list = [];
    for (let k = 0; k < 14; k++) {
      const g = new THREE.Group();
      const env = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshStandardMaterial({ color: cols[k % 6], roughness: 0.6 }));
      env.scale.y = 1.2; g.add(env);
      const stripe = new THREE.Mesh(new THREE.SphereGeometry(6.05, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      stripe.scale.y = 1.2; g.add(stripe);
      const basket = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), new THREE.MeshStandardMaterial({ map: b.tex.wood })); basket.position.y = -10; g.add(basket);
      const side = k % 2 ? 1 : -1;
      g.position.set(side * (40 + (k * 37) % 70), 10 + (k * 23) % 50, 20 - k * 22);
      b.add(g); list.push({ g, y: g.position.y, k });
    }
    b.world.anim.push((t) => list.forEach((o) => { o.g.position.y = o.y + Math.sin(t * 0.2 + o.k) * 3; o.g.rotation.y = t * 0.05 + o.k; }));
  },
};
