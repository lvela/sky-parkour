// LEVEL 13 — Clockwork Tower: a brass machine floating in the golden hour. New: rotating gears and pumping pistons.
import * as THREE from 'three';

export default {
  id: 'clockwork',
  name: 'Clockwork Tower',
  tagline: 'Ride turning gears, pumping pistons and the hands of a giant clock.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 7, az: 140 }, turbidity: 5, rayleigh: 2, mie: 0.006, cov: 0.5, cirrus: 1.2, tint: [1.2, 0.9, 0.7] },
  light: { color: 0xffc080, intensity: 3.0 }, envIntensity: 1.0, fog: 0.0011,
  theme: {
    top: { p: 'tiles', a: '#8a6a3a', b: ['#a0804a', '#7a5a30', '#b8945a'], line: 'rgba(40,25,10,0.7)', n: 4, seed: 131 },
    side: { p: 'speckle', a: '#4a4440', b: ['#3a3430', '#5a544e', '#6a4a30'], seed: 132 }, stone: 'metal',
    palette: { soil: 0x4a3a2a, rockA: 0x5a5048, rockB: 0x7a6a58, dark: 0x2a241e, grassA: 0x8a6a3a, grassB: 0xa8844a }, accent: '#ffc04a',
  },
  scenery: {
    islands: { palette: { soil: 0x4a3a2a, rockA: 0x5a5048, rockB: 0x7a6a58, dark: 0x2a241e, grassA: 0x8a6a3a, grassB: 0xa8844a }, trees: false, count: 20, seed: 131 },
    sea: {}, clouds: { count: 60 },
    drift: [{ count: 300, color: 0xffd080, size: 0.07, fall: -0.6, sway: 1.2, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'CLOCKWORK TOWER', 'Gears turn under your feet and pistons pump up and down.', 0, '#ffc04a');

    // COGWHEELS
    [-12, -19.5, -27].forEach((z, i) => b.gear({ x: 0, y: 0.3, z, r: 3, speed: i % 2 ? -0.5 : 0.5, phase: i * 0.4 }));
    b.plat({ x: 0, y: 0.5, z: -37, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -37);

    // PISTON STAIRS
    b.sign(3, 0.5, -35, 'PISTON STAIRS', 'Each piston pumps up and down. Step up as they rise.', 0, '#ff8a4a');
    for (let i = 0; i < 5; i++) b.piston({ x: 0, y: 0.5 + i * 1.2, z: -45 - i * 3.5, amp: 2, period: 3, phase: -i * 0.9 });
    b.plat({ x: 0, y: 7.5, z: -66, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 7.5, -66);

    // GEAR TRAIN — zigzag up the meshing gears
    b.sign(-3, 7.5, -64, 'GEAR TRAIN', 'Hop across the meshing gears. They spin opposite ways!', 0, '#ffc04a');
    b.gear({ x: -2, y: 7.5, z: -75, r: 2.5, speed: 0.7 });
    b.gear({ x: 2, y: 8.2, z: -81, r: 2.5, speed: -0.7 });
    b.gear({ x: -2, y: 8.9, z: -87, r: 2.5, speed: 0.9 });
    b.plat({ x: 0, y: 9, z: -96, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 9, -96);

    // CLOCK HANDS — a spinning cross over a giant clock face
    b.sign(3, 9, -94, 'CLOCK HANDS', 'Ride the clock hands round to the far side.', 0, '#ff8a4a');
    for (const a of [0, Math.PI / 2]) b.plat({ x: 0, y: 9, z: -108, w: 14, d: 1.8, h: 0.5, mat: b.brass(), yaw: a, motion: b.mo((v, t) => { v.yaw = t * 0.5; }) });
    {
      const face = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0xf2e8d0, roughness: 0.6 }));
      face.position.set(0, 7.2, -108); b.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.3, 8, 48), b.brass()); rim.rotation.x = Math.PI / 2; rim.position.set(0, 7.3, -108); b.add(rim);
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, k % 3 ? 0.8 : 1.6), new THREE.MeshStandardMaterial({ color: 0x2a2018 }));
        tick.position.set(Math.cos(a) * 6.6, 7.4, -108 + Math.sin(a) * 6.6); tick.rotation.y = -a + Math.PI / 2; b.add(tick);
      }
    }
    b.plat({ x: 0, y: 9, z: -120, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 9, -120);

    // THE MAINSPRING — pistons and gears to the finish
    b.sign(-3, 9, -118, 'THE MAINSPRING', 'Piston, gear, piston, gear… ride each piston up.', 0, '#ffc04a');
    b.piston({ x: 0, y: 9, z: -128, amp: 3, period: 3.2 });
    b.gear({ x: 0, y: 12, z: -134, r: 2.4, speed: 0.8 });
    b.piston({ x: 0, y: 12, z: -140, amp: 3, period: 3.2, phase: Math.PI });
    b.gear({ x: 0, y: 15, z: -146, r: 2.4, speed: -0.9 });
    b.finish(0, 15.5, -157, 12, 12, 16);

    // background clockwork
    for (const [x, y, z, r, s] of [[-28, 4, -60, 9, 0.2], [30, -6, -110, 12, -0.15], [-34, 10, -160, 8, 0.25]]) {
      const holder = new THREE.Group(); holder.position.set(x, y, z); holder.rotation.z = Math.PI / 2; b.add(holder);
      const g = new THREE.Group(); holder.add(g);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 32), b.brass()); g.add(disc);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 1.6), b.brass()); t.position.set(Math.cos(a) * (r + 0.6), 0, Math.sin(a) * (r + 0.6)); t.rotation.y = -a; g.add(t); }
      b.world.anim.push((t) => { g.rotation.y = t * s; });
    }
  },
};
