// LEVEL 46 — Sky Railway: rail lines strung between islands in the golden hour. New: GRIND RAILS that rush you
// along (jump off the end for a huge leap), mine-cart trains on looping track, and saw blades racing along slots.
import * as THREE from 'three';

const SLEEPERS = { p: 'planks', a: '#6a4a2a', b: ['#5a3e22', '#7a5632', '#4e341c'], seed: 461 };

export default {
  id: 'railway',
  name: 'Sky Railway',
  tagline: 'Grind the rails, jump off the ends for huge leaps, ride the mine carts and hop the saw blades.',
  exposure: 0.45,
  sky: { mode: 'physical', light: { elev: 9, az: 110 }, turbidity: 7, rayleigh: 2.0, cov: 0.45, cirrus: 1.0, tint: [1.2, 0.95, 0.75] },
  light: { color: 0xffc890, intensity: 3.1 }, envIntensity: 0.9, fog: 0.0010,
  theme: { top: SLEEPERS, side: 'dirt', stone: { p: 'speckle', a: '#8a7a6a', b: ['#7a6a5a', '#9a8a7a'], seed: 462 }, palette: 'canyon', accent: '#4dd2ff' },
  scenery: { islands: { palette: 'canyon', count: 26, seed: 461 }, sea: {}, clouds: { count: 70 }, birds: true },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'SKY RAILWAY', 'Hop on the rail and it rushes you along. JUMP at the very end for a giant leap!', 0, '#4dd2ff');

    // GRIND RAIL
    b.grindRail({ y: 0.3, z0: -8, z1: -38, speed: 10 });
    b.plat({ x: 0, y: 0, z: -50, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -50);

    // MINE CARTS
    b.sign(3.5, 0, -48, 'MINE CARTS', 'Hop in a cart and ride it across. Jump off at the far end.', 0, '#ffb02e');
    b.train({ path: [[0, 0, -58], [0, 0, -88], [6.5, 0, -88], [6.5, 0, -58]], n: 3, speed: 4 });
    b.plat({ x: 0, y: 0, z: -95, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -95);

    // SAW YARD
    b.sign(-3.5, 0, -93, 'SAW YARD', 'Saw blades race along the slots. Jump them!', 0, '#ff4a3a');
    b.plat({ x: 0, y: 0, z: -115, w: 4, d: 32, style: 'trim' });
    b.sawTrack({ x0: -1.6, x1: 1.6, y: 0, z: -105, speed: 1.4 });
    b.sawTrack({ x0: -1.6, x1: 1.6, y: 0, z: -112, speed: 1.8, phase: 1 });
    b.sawTrack({ x0: -1.6, x1: 1.6, y: 0, z: -119, speed: 1.2, phase: 2 });
    b.sawTrack({ x0: -1.6, x1: 1.6, y: 0, z: -126, speed: 2, phase: 0.5 });
    b.plat({ x: 0, y: 0, z: -137, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -137);

    // EXPRESS LINE
    b.sign(3.5, 0, -135, 'EXPRESS LINE', 'Two rails. The second one is faster — and there\'s a saw on it!', 0, '#4dd2ff');
    b.grindRail({ y: 0.3, z0: -142, z1: -166, speed: 10 });
    b.plat({ x: 0, y: 0, z: -177, w: 4, d: 6, style: 'trim' });
    b.checkpoint(0, 0, -177);
    b.grindRail({ y: 0.3, z0: -181, z1: -205, speed: 12, color: 0xffb02e });
    b.sawTrack({ x0: -1.4, x1: 1.4, y: 0.3, z: -190, speed: 1.6 });
    b.finish(0, 0, -222, 12, 12, 16);
    this.signals(b);
  },

  // railway signals and a water tower
  signals(b) {
    const red = new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false }), green = new THREE.MeshBasicMaterial({ color: 0x3dff6a, toneMapped: false });
    for (const [x, z] of [[2.5, -6], [-2.5, -140], [2.5, -179]]) {
      b.post(x, 0, 4, z, false, b.M.iron, 0.08);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.4), b.M.iron); box.position.set(x, 4.2, z); b.add(box);
      const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), red); l1.position.set(x, 4.45, z + 0.2); b.add(l1);
      const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), green); l2.position.set(x, 3.95, z + 0.2); b.add(l2);
    }
    const wood = new THREE.MeshStandardMaterial({ map: b.tex.wood });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 16), wood); tank.position.set(-5.5, 6, -48); b.add(tank);
    for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) b.post(-5.5 + dx, 0, 4.5, -48 + dz, false, b.M.wood, 0.12);
  },
};
