// LEVEL 39 — Wild West Mesa: red mesas at sunset. New: BULLET TIME (a slow-mo pad hands you a blaster —
// bounce on the trampoline and shoot the target hidden behind the gate) and seesaws.
import * as THREE from 'three';

export default {
  id: 'mesa',
  name: 'Wild West Mesa',
  tagline: 'Step on the clock pad, bounce, and in slow motion shoot the target behind the gate. Plus tipping seesaws.',
  exposure: 0.42,
  sky: { mode: 'physical', light: { elev: 6, az: -80 }, turbidity: 9, rayleigh: 2.6, cov: 0.35, cirrus: 1.2, tint: [1.25, 0.85, 0.65] },
  light: { color: 0xffa060, intensity: 3.0 }, envIntensity: 0.9, fog: 0.0011,
  theme: {
    top: { p: 'speckle', a: '#c8622a', b: ['#d8763a', '#b8521e', '#e89050', '#a8441a'], seed: 391 }, side: 'dirt',
    stone: { p: 'planks', a: '#8a5a32', b: ['#7a4a26', '#9a6a3c'], seed: 392 },
    palette: 'canyon', accent: '#ff9a3a',
  },
  scenery: {
    islands: { palette: 'canyon', trees: false, count: 26, seed: 391 }, sea: {}, clouds: { count: 50 }, birds: true, birdColor: 0x2a1a14,
    drift: [{ count: 300, color: 0xd89060, size: 0.08, fall: 0.2, sway: 3 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'WILD WEST MESA', 'Seesaws tip toward whichever end you stand on. Keep moving!', 0, '#ff9a3a');
    this.cacti(b, [[5.5, 0, 5], [-6, 0, 6], [6, 0, -4]]);

    // SEESAWS
    b.seesaw({ x: 0, y: 0, z: -14, len: 10 });
    b.plat({ x: 0, y: -1, z: -23.5, w: 3, d: 3, style: 'trim' });
    b.seesaw({ x: 0, y: -1, z: -32, len: 10 });
    b.plat({ x: 0, y: -2.5, z: -44, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, -2.5, -44);

    // BULLET TIME — the new trick
    b.sign(3.5, -2.5, -42, 'BULLET TIME', 'Step on the clock pad: time slows and you get a BLASTER. Bounce, and shoot the target over the gate!', 0, '#4dffd2');
    b.bulletTime({ y: -2.5, z: -52, sway: 1.2 });
    b.plat({ x: 0, y: -2.5, z: -69, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, -2.5, -69);
    this.cacti(b, [[3, -2.5, -71], [-3, -2.5, -67]]);

    // QUICK DRAW — two targets, one bounce
    b.sign(-3.5, -2.5, -67, 'QUICK DRAW', 'Two targets this time. Get them both in one bounce — or bounce again.', 0, '#ff5a5a');
    b.plat({ x: 0, y: -2.5, z: -82.5, w: 4, d: 15, style: 'trim' });
    b.slowPad({ x: 0, y: -2.5, z: -77, dur: 9 });
    b.plat({ x: 0, y: -2.1, z: -81.5, w: 3, d: 3, h: 0.6, style: 'tramp', type: 'tramp', bounce: 16 });
    const gate = b.gate({ x: 0, y: -2.5, z: -89.75, w: 10, h: 6.5 });
    const t1 = b.target({ x: -2, y: 4.9, z: -96, motion: b.mo((v, t) => { v.x = Math.sin(t * 0.9) * 1.2; }) });
    const t2 = b.target({ x: 2, y: 4.9, z: -96, motion: b.mo((v, t) => { v.x = -Math.sin(t * 0.9) * 1.2; }) });
    b.linkTargets(gate, [t1, t2]);
    b.plat({ x: 0, y: -2.5, z: -97, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, -2.5, -97);

    // DUSTY TRAIL — long seesaws down the canyon
    b.sign(3.5, -2.5, -95, 'DUSTY TRAIL', 'Longer seesaws, bigger tilt.', 0, '#ff9a3a');
    b.seesaw({ x: 0, y: -2.5, z: -110, len: 12 });
    b.seesaw({ x: 0, y: -4, z: -125, len: 12 });
    b.plat({ x: 0, y: -5.5, z: -138, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, -5.5, -138);

    // SHOWDOWN — a target that sways wide
    b.sign(-3.5, -5.5, -136, 'SHOWDOWN', 'One last shot. This target won\'t keep still.', 0, '#4dffd2');
    b.bulletTime({ y: -5.5, z: -146, sway: 2.4 });
    b.finish(0, -5.5, -164, 12, 12, 16);
    this.mesas(b);
  },

  cacti(b, list) {
    const m = b.mat('cactus', () => new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.8 }));
    for (const [x, y, z] of list) {
      const g = new THREE.Group(); g.position.set(x, y, z); b.add(g);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.6, 10), m); trunk.position.y = 1.3; trunk.castShadow = true; g.add(trunk);
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 8), m); arm.position.set(s * 0.6, 1.4 + s * 0.2, 0); g.add(arm);
        const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8), m); elbow.rotation.z = Math.PI / 2; elbow.position.set(s * 0.38, 0.9 + s * 0.2, 0); g.add(elbow);
      }
    }
  },

  // flat-topped mesas on the horizon
  mesas(b) {
    const rock = new THREE.MeshStandardMaterial({ color: 0xb8582a, roughness: 1, flatShading: true });
    const band = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 1, flatShading: true });
    [[-90, -120, 30, 40], [110, -60, 40, 55], [-140, -260, 50, 70], [150, -230, 36, 48], [30, -340, 60, 80]].forEach(([x, z, r, h], i) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 9), i % 2 ? band : rock);
      m.position.set(x, -40 + h / 2 - 20, z); m.rotation.y = i; b.add(m);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.85, 4, 9), i % 2 ? rock : band);
      cap.position.set(x, -40 + h - 18, z); cap.rotation.y = i; b.add(cap);
    });
  },
};
