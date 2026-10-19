// LEVEL 15 — Haunted Graveyard: a moonlit cemetery adrift in green fog. New: swinging platforms and cursed graves.
import * as THREE from 'three';
import { boxGeo } from '../textures.js';

const V3 = THREE.Vector3;
const GRAVE = { soil: 0x1e1a18, rockA: 0x3a3a3a, rockB: 0x4a4a48, dark: 0x141414, grassA: 0x1d2a1a, grassB: 0x2a3a22 };

export default {
  id: 'haunted',
  name: 'Haunted Graveyard',
  tagline: 'Swinging lanterns, cursed graves that crumble, and the reaper\'s scythes under a full moon.',
  exposure: 0.95,
  sky: {
    mode: 'gradient', light: { elev: 30, az: -20 },
    zen: [0.004, 0.01, 0.008], hor: [0.05, 0.12, 0.08], glow: [0.15, 0.3, 0.2], glowPow: 5, glowAmt: 0.5,
    cov: 0.55, cloudBright: 0.35, cloudShade: 0.4, cirrus: 0.3, stars: 0.7, tint: [0.7, 1.0, 0.8],
    moon: { elev: 30, az: -20, size: 6, bright: 1.2 },
  },
  light: { color: 0xb0ffd0, intensity: 1.6 }, envIntensity: 1.1, fog: 0.0028,
  hemi: { sky: 0x2a5a40, ground: 0x101810, intensity: 0.6 },
  theme: { top: 'darkGrass', side: 'dirt', stone: 'slate', palette: GRAVE, accent: '#7aff9a' },
  scenery: {
    islands: { palette: GRAVE, leafHue: 0.3, leafSat: 0.15, leafLight: 0.12, count: 22, seed: 151 }, sea: {}, clouds: { count: 50 },
    birds: true, birdColor: 0x080808,
    drift: [{ count: 260, color: 0x7aff9a, size: 0.2, fall: 0.1, sway: 3, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'HAUNTED GRAVEYARD', 'Something stirs among the graves… keep moving and don\'t look down.', 0, '#7aff9a');
    this.graves(b, 0, 0, 0, 6);

    // TOMBSTONES
    [[0, 0.3], [1.3, 0.6], [-1.3, 0.9], [0.4, 1.2]].forEach(([x, y], i) => b.plat({ x, y, z: -12.5 - i * 5.5, w: 3, d: 3, h: 1, style: 'trim', rock: true, rockDepth: 3 }));
    b.plat({ x: 0, y: 1.2, z: -37, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -37);

    // LANTERN SWINGS — platforms swinging side to side
    b.sign(3, 1.2, -35, 'LANTERN SWINGS', 'The platforms swing side to side. Jump when the next one swings in line.', 0, '#ffd84d');
    [-45, -51.5, -58].forEach((z, i) => {
      b.pendulum({ px: 0, py: 8.2, pz: z, L: 7, A: 0.5, phase: i * 0.8, w: 3, d: 3, axis: 'x' });
      this.lantern(b, 0, 8.6, z);
    });
    b.plat({ x: 0, y: 1.2, z: -67, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -67);
    this.graves(b, 0, 1.2, -67, 4);

    // RESTLESS GRAVES — one of each pair is cursed
    b.sign(-3, 1.2, -65, 'RESTLESS GRAVES', 'One grave in each pair is cursed and crumbles. Cursed graves glow green now and then.', 0, '#7aff9a');
    b.glassBridge({ x: 0, y: 1.2, z0: -75, rows: 6, gap: 3.2, spread: 1.5, seed: 15, mat: b.M.stone });
    b.plat({ x: 0, y: 1.2, z: -99, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -99);

    // REAPER'S SCYTHES
    b.sign(3, 1.2, -97, 'REAPER\'S SCYTHES', 'Dash between the swinging scythes.', 0, '#ff5a4a');
    b.plat({ x: 0, y: 1.2, z: -117, w: 3, d: 26, style: 'trim' });
    [-110, -117, -124].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 9.7, L: 7, A: 1.0, phase: i * 2.1, speedMul: 1.15 });
      b.post(-3.4, 1.2, 10.5, z, false, b.M.stone, 0.3); b.post(3.4, 1.2, 10.5, z, false, b.M.stone, 0.3);
      const beam = b.post(0, 10, 10.6, z, false, b.M.iron, 0.2); beam.scale.x = 17.5;
    });
    b.plat({ x: 0, y: 1.2, z: -136, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -136);

    // BELL TOWER — climb, then ride the bells across
    b.sign(-3, 1.2, -134, 'BELL TOWER', 'Climb the tower, then ride the swinging bells to the finish.', 0, '#ffd84d');
    b.plat({ x: 0, y: 13, z: -142, w: 6, d: 4, h: 13, style: 'trim', rock: true, rockDepth: 6 });
    b.holds(new V3(0, 1.2, -140), new V3(0, 0, 1), 1.2, 13, 0.55, 0.45);
    b.pendulum({ px: 0, py: 21, pz: -150, L: 8, A: 0.55, phase: 0, w: 3, d: 3, axis: 'z' });
    b.pendulum({ px: 0, py: 21, pz: -160, L: 8, A: 0.55, phase: Math.PI, w: 3, d: 3, axis: 'z' });
    this.lantern(b, 0, 21.4, -150); this.lantern(b, 0, 21.4, -160);
    b.finish(0, 13, -173, 12, 12, 16);
    this.graves(b, 0, 13, -173, 5);
  },

  graves(b, cx, y, cz, n) {
    for (let k = 0; k < n; k++) {
      const s = k % 2 ? 1 : -1, x = cx + s * (4.2 + (k % 3) * 0.8), z = cz + 3 - k * 1.6;
      const m = new THREE.Mesh(boxGeo(0.9, 1.2 + (k % 3) * 0.3, 0.25, 1), b.M.stone);
      m.position.set(x, y + 0.6, z); m.rotation.set(0, s * 0.3, (k % 2 ? 0.08 : -0.06)); m.castShadow = true; b.add(m);
    }
  },

  lantern(b, x, y, z) {
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9aff7a, toneMapped: false }));
    glow.position.set(x, y + 0.6, z); b.add(glow);
    b.world.anim.push((t) => { glow.scale.setScalar(1 + Math.sin(t * 5 + z) * 0.15); });
  },
};
