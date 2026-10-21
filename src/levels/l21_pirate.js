// LEVEL 21 — Pirate Skies: flying galleons at sunset. New: barrel cannons that fire you between ships.
import * as THREE from 'three';
import { boxGeo } from '../textures.js';

const V3 = THREE.Vector3;

export default {
  id: 'pirate',
  name: 'Pirate Skies',
  tagline: 'Barrel cannons fire you between flying galleons. Ride the rocking decks and dodge the cannonballs.',
  exposure: 0.45,
  sky: { mode: 'physical', light: { elev: 6, az: -100 }, turbidity: 4, rayleigh: 2.4, mie: 0.006, cov: 0.5, cirrus: 1.2, tint: [1.2, 0.85, 0.7] },
  light: { color: 0xffc890, intensity: 3.2 }, envIntensity: 0.9, fog: 0.0011,
  theme: {
    top: { p: 'planks', a: '#8a6a44', b: ['#9a7a50', '#7a5a38', '#8a6440'], line: 'rgba(30,18,8,0.8)', seed: 211 },
    side: { p: 'planks', a: '#5a4028', b: ['#6a4a2e', '#4a3420', '#5e4428'], line: 'rgba(20,12,4,0.8)', seed: 212 }, stone: 'wood',
    palette: 'day', accent: '#ffd84d',
  },
  scenery: { islands: { palette: 'day', leafHue: 0.3, count: 22, seed: 211 }, sea: {}, clouds: { count: 80 }, birds: true, birdColor: 0xf4f4f4 },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'PIRATE SKIES', 'Walk into a barrel and it fires you to the next ship!', 0, '#ffd84d');

    // BARREL HOP — ship to ship
    b.barrel({ x: 0, y: 1.2, z: -6, to: { x: 0, y: 2, z: -26 } });
    this.ship(b, 0, 2, -28, 6, 10);
    b.barrel({ x: 0, y: 3.2, z: -31.5, to: { x: 6, y: 4, z: -50 } });
    this.ship(b, 6, 4, -52, 6, 10);
    b.barrel({ x: 6, y: 5.2, z: -55.5, to: { x: 0, y: 4, z: -72 } });
    b.plat({ x: 0, y: 4, z: -74, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 4, -74);

    // ROCKING DECKS
    b.sign(3, 4, -72, 'ROCKING DECKS', 'The decks rock back and forth. Jump when they swing close.', 0, '#4dd2ff');
    b.pendulum({ px: 0, py: 13, pz: -84, L: 9, A: 0.4, phase: 0, w: 4, d: 5, axis: 'z' });
    b.pendulum({ px: 0, py: 13, pz: -95, L: 9, A: 0.4, phase: Math.PI, w: 4, d: 5, axis: 'z' });
    b.plat({ x: 0, y: 4, z: -106, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 4, -106);

    // CROW'S NEST
    b.sign(-3, 4, -104, 'CROW\'S NEST', 'Climb the mast to the lookout.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 16, z: -112, w: 4, d: 4, h: 12, style: 'wood' });
    b.holds(new V3(0, 4, -110), new V3(0, 0, 1), 4, 16, 0.5, 0.35);

    // CANNON ALLEY — a gangplank under fire
    b.sign(2.4, 16, -112, 'CANNON ALLEY', 'Cannons fire across the gangplank. Run between the shots!', 0, '#ff5a2a');
    b.plat({ x: 0, y: 16, z: -128, w: 3, d: 28, style: 'wood' });
    [-119, -125, -131, -137].forEach((z, i) => {
      const s = i % 2 ? -1 : 1;
      b.cannon({ x: s * 6, y: 17, z, dir: -s, range: 12, speed: 12, period: 2.0, phase: i * 0.5 });
      b.plat({ x: s * 6, y: 16.2, z, w: 2, d: 2, h: 1.2, style: 'wood' });
    });
    b.plat({ x: 0, y: 16, z: -146, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 16, -146);

    // SWINGING BARRELS — they slide side to side; jump in when one lines up
    b.sign(-3, 16, -144, 'LOOSE CANNONS', 'These barrels slide about. Jump in when one lines up!', 0, '#ffd84d');
    b.barrel({ x: 0, y: 17.2, z: -151.5, to: { x: 0, y: 16, z: -167 }, motion: (t) => ({ x: Math.sin(t * 0.9) * 3 }) });
    b.plat({ x: 0, y: 16, z: -168, w: 5, d: 5, style: 'wood', rock: true, rockDepth: 4 });
    b.barrel({ x: 0, y: 17.2, z: -171.5, to: { x: 0, y: 14, z: -190 }, motion: (t) => ({ x: Math.sin(t * 1.3 + 1) * 4 }) });
    b.bonusFinish('boostRing', 0, 14, -193, 12, 12, 16);
    this.ship(b, 0, 14, -193, 0, 0);
  },

  // a hull and mast under a deck (w = d = 0 → just a mast and sail behind the finish)
  ship(b, x, y, z, w, d) {
    const wood = b.M.side;
    if (w) {
      b.plat({ x, y, z, w, d, style: 'top' });
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.2, d, 6, 1, false, 0, Math.PI), wood);
      hull.rotation.x = Math.PI / 2; hull.rotation.y = Math.PI; hull.position.set(x, y - 0.8, z); b.add(hull);
      for (const s of [-1, 1]) { const rail = new THREE.Mesh(boxGeo(0.15, 0.6, d, 2), wood); rail.position.set(x + s * (w / 2 - 0.1), y + 0.3, z); b.add(rail); }
    }
    const mx = x + (w ? w * 0.3 : 4.5), mz = z + (d ? d * 0.1 : 4);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9, 8), wood); mast.position.set(mx, y + 4.5, mz); b.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.5, 4, 4), new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: 0.9, side: THREE.DoubleSide }));
    sail.position.set(mx, y + 5.5, mz - 0.3); b.add(sail);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide }));
    flag.position.set(mx + 0.7, y + 9.2, mz); b.add(flag);
    b.world.anim.push((t) => { sail.rotation.y = Math.sin(t * 0.8 + x) * 0.08; flag.rotation.y = Math.sin(t * 3 + z) * 0.3; });
  },
};
