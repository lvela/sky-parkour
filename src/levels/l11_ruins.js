// LEVEL 11 — Desert Ruins: crumbling temples under a blazing noon sun. New: quicksand and spike traps.
import * as THREE from 'three';

const V3 = THREE.Vector3;

export default {
  id: 'ruins',
  name: 'Desert Ruins',
  tagline: 'Sinking quicksand and spike traps in sun-baked ruins, then a slide down to the oasis.',
  exposure: 0.42,
  sky: { mode: 'physical', light: { elev: 62, az: 20 }, turbidity: 5, rayleigh: 1, mie: 0.006, cov: 0.7, cirrus: 0.6, tint: [1.15, 1.0, 0.85] },
  light: { color: 0xfff0d0, intensity: 3.6 }, envIntensity: 0.8, fog: 0.0012,
  theme: { top: 'sandTop', side: 'sandstone', stone: { p: 'tiles', a: '#c8a070', b: ['#b89060', '#d8b080', '#a88050'], line: 'rgba(80,50,20,0.6)', n: 3, seed: 111 }, palette: 'canyon', accent: '#ffb347' },
  scenery: {
    islands: { palette: 'canyon', mesas: true, leafHue: 0.24, leafLight: 0.3, count: 24, seed: 111 }, sea: {}, clouds: { count: 50 },
    drift: [{ count: 700, color: 0xe0c090, size: 0.06, fall: 0.2, sway: 3 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'DESERT RUINS', 'Quicksand swallows anyone who stands still. Spikes guard the temple.', 0, '#ffb347');
    for (const [x, z] of [[5, -4], [-6, -6], [5.5, 5]]) b.post(x, 0, 2.5 + Math.abs(x) * 0.3, z, true, b.M.stone, 0.45);

    // QUICKSAND — keep moving
    [[0, -12], [1.2, -16.5], [-1.2, -21], [1, -25.5], [0, -30]].forEach(([x, z]) => b.quicksand({ x, y: 0, z, w: 3, d: 3 }));
    b.plat({ x: 0, y: 0, z: -40, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -40);

    // SPIKE TRAPS — a wave of spikes along the corridor
    b.sign(3, 0, -38, 'SPIKE TRAPS', 'The spikes peek out just before they strike. Watch the rhythm!', 0, '#ff5a4a');
    for (let i = 0; i < 6; i++) b.spikes({ x: 0, y: 0, z: -47.5 - i * 3, w: 3, d: 3, period: 2.4, on: 0.4, phase: -i * 0.4 });
    b.plat({ x: 0, y: 0, z: -70, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -70);

    // TEMPLE PILLAR — climb
    b.sign(-3.5, 0, -68, 'TEMPLE PILLAR', 'Climb the old pillar using the holds.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 10, z: -76, w: 6, d: 4, h: 10, style: 'trim', rock: true, rockDepth: 6 });
    b.holds(new V3(0, 0, -74), new V3(0, 0, 1), 0, 10, 0.55, 0.4);

    // SINKING STAIRS — quicksand and spikes, high above the dunes
    b.sign(2.4, 10, -77, 'SINKING STAIRS', 'Quicksand, then spikes, then quicksand… don\'t stop, don\'t rush.', 0, '#ffb347');
    b.quicksand({ x: 0, y: 10, z: -81.5, w: 3, d: 3 });
    b.spikes({ x: 0, y: 10, z: -86, w: 3, d: 3, period: 2.2, on: 0.45, phase: 0 });
    b.quicksand({ x: 0, y: 10, z: -90.5, w: 3, d: 3, rate: 0.7 });
    b.spikes({ x: 0, y: 10, z: -95, w: 3, d: 3, period: 2.2, on: 0.45, phase: 1.1 });
    b.quicksand({ x: 0, y: 10, z: -99.5, w: 3, d: 3, rate: 0.7 });
    b.plat({ x: 0, y: 10, z: -108, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 10, -108);

    // TOMB RUN — a long faster spike corridor
    b.sign(-3, 10, -106, 'TOMB RUN', 'Faster spikes. Find the gap in the wave and sprint!', 0, '#ff5a4a');
    for (let i = 0; i < 7; i++) b.spikes({ x: 0, y: 10, z: -113.5 - i * 3, w: 3, d: 3, period: 2.0, on: 0.45, phase: -i * 0.3 });
    b.plat({ x: 0, y: 10, z: -140, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 10, -140);

    // DUNE SLIDE to the oasis
    b.sign(3, 10, -138, 'DUNE SLIDE', 'Down the slide and off the ramp to the oasis!', 0, '#4dd2ff');
    b.ramp({ z0: -144, y0: 10, z1: -174, y1: 1 });
    b.ramp({ z0: -174, y0: 1, z1: -178, y1: 2.2 });
    b.bonusFinish('pressureGate', 0, 1.5, -192, 12, 16, 14);
    for (const [tx, tz, s] of [[-4.5, -197, 1.1], [4.6, -196, 0.9], [-4.8, -187, 0.8]]) b.tree(tx, 1.5, tz, s);
  },
};
