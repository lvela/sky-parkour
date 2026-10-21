// LEVEL 19 — Jungle Temple: a steaming jungle and an ancient temple in the clouds. New: rolling logs.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const JUNGLE = { soil: 0x3a2a1a, rockA: 0x4a5040, rockB: 0x5a6a4a, dark: 0x2a2a20, grassA: 0x2a6a2a, grassB: 0x3a8a34 };

export default {
  id: 'jungle',
  name: 'Jungle Temple',
  tagline: 'Jump the logs rolling down the temple causeways, swing on vines and scale the temple wall.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 45, az: 30 }, turbidity: 9, rayleigh: 2, mie: 0.008, cov: 0.62, cirrus: 0.8, tint: [0.95, 1.05, 0.85] },
  light: { color: 0xfff0c0, intensity: 3.0 }, envIntensity: 0.9, fog: 0.0022,
  theme: {
    top: 'darkGrass',
    side: { p: 'speckle', a: '#5a5a48', b: ['#4a4a3a', '#6a6a54', '#3a5a2a'], lip: '#2f5a24', seed: 191 },
    stone: { p: 'tiles', a: '#7a7a68', b: ['#6a6a58', '#8a8a74', '#5a6a48'], line: 'rgba(30,40,20,0.7)', n: 3, seed: 192 },
    palette: JUNGLE, accent: '#ffd84d',
  },
  scenery: {
    islands: { palette: JUNGLE, leafHue: 0.3, leafSat: 0.7, leafLight: 0.22, count: 30, seed: 191 }, sea: {}, clouds: { count: 70 }, birds: true,
    drift: [{ count: 400, color: 0xf0ff9a, size: 0.07, fall: 0.15, sway: 2, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'JUNGLE TEMPLE', 'Logs roll down the causeways. Jump them as they come!', 0, '#ffd84d');
    b.tree(5.5, 0, 5, 1.3); b.tree(-6, 0, 5.5, 1.1); b.tree(6, 0, -5, 0.9);

    // ROLLING LOGS
    b.plat({ x: 0, y: 0, z: -25, w: 4, d: 34, style: 'trim' });
    b.logs({ x: 0, y: 0, z0: -9, z1: -41, w: 4, speed: 6, gap: 2.4, count: 3 });
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // VINE SWINGS
    b.sign(3, 0, -45, 'VINE SWINGS', 'Grab a vine and launch to the next.', 0, '#7aff9a');
    b.swingRig(-50.3, -88.7, 0, 6.6);
    b.swing(0, 6.4, -57, 6, 0.87, 0);
    b.swing(0, 6.4, -69, 6, 0.87, Math.PI);
    b.swing(0, 6.4, -81, 6, 0.87, 0);
    b.plat({ x: 0, y: 0, z: -92, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -92);

    // SPIKE CORRIDOR — spikes AND logs
    b.sign(-3, 0, -90, 'SPIKE CORRIDOR', 'Spikes in the floor and logs rolling at you. Keep your rhythm.', 0, '#ff5a4a');
    b.plat({ x: 0, y: 0, z: -112, w: 4, d: 30, style: 'trim' });
    [-104, -112, -120].forEach((z, i) => b.spikes({ x: 0, y: 0.01, z, w: 4, d: 3, period: 2.4, on: 0.4, phase: i * 0.8 }));
    b.logs({ x: 0, y: 0, z0: -98, z1: -126, w: 4, speed: 5, gap: 3, count: 2 });
    b.plat({ x: 0, y: 0, z: -133, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -133);

    // TEMPLE WALL
    b.sign(3, 0, -131, 'TEMPLE WALL', 'Climb the temple wall.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 12, z: -139, w: 8, d: 4, h: 12, style: 'trim' });
    b.holds(new V3(0, 0, -137), new V3(0, 0, 1), 0, 12, 0.55, 0.5);

    // SACRED CAUSEWAY — faster logs, narrower path
    b.sign(-2.5, 12, -140, 'SACRED CAUSEWAY', 'Faster logs on a narrow path. Almost there!', 0, '#ffd84d');
    b.plat({ x: 0, y: 12, z: -158, w: 3, d: 34, style: 'trim' });
    b.logs({ x: 0, y: 12, z0: -142, z1: -174, w: 3, speed: 7, gap: 2, count: 3, r: 0.5 });
    b.bonusFinish('grapple', 0, 12, -182, 12, 12, 16);
    b.tree(-4.5, 12, -186, 1.2); b.tree(4.6, 12, -185, 1.0);
    // temple top
    for (const s of [-1, 1]) b.post(s * 5, 12, 18, -187, true, b.M.stone, 0.6);
  },
};
