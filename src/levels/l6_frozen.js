// LEVEL 6 — Frozen Peaks: slippery ice, gusting crosswinds, an ice climb, an ice slide and crumbling ice.
import * as THREE from 'three';
import { rng } from '../textures.js';

const V3 = THREE.Vector3;

export default {
  id: 'frozen',
  name: 'Frozen Peaks',
  tagline: 'Slippery ice, howling crosswinds, an ice climb and a frozen slide in the falling snow.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 14, az: -40 }, turbidity: 2.2, rayleigh: 1.1, cov: 0.55, cirrus: 1.2, tint: [0.95, 1.0, 1.08] },
  light: { color: 0xeaf2ff, intensity: 3.0 }, envIntensity: 1.0, fog: 0.0014,
  theme: { top: 'snow', side: 'dirt', stone: 'stone', palette: 'ice', accent: '#8fd8ff' },
  scenery: { islands: { palette: 'ice', leafHue: 0.4, leafLight: 0.18, count: 22, seed: 31 }, sea: {}, clouds: { count: 80 }, snow: true, birds: false },
  killY: -32,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'FROZEN PEAKS', 'Ice is slippery: land early and stop sliding before the edge!', 0, '#8fd8ff');
    b.tree(5.5, 0, 5, 1.1); b.tree(-6, 0, 5, 0.9); b.tree(6, 0, -5, 0.8);

    // ICE STEPS
    [[0, 0], [1.2, 0.5], [-1.2, 1], [0, 1.5]].forEach(([x, y], i) => b.plat({ x, y, z: -13.5 - i * 7.5, w: 3.5, d: 5, h: 0.8, style: 'ice', type: 'ice' }));
    b.plat({ x: 0, y: 2, z: -46, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 2, -45);

    // WIND BRIDGE (icy!)
    b.sign(3, 2, -48.5, 'WINDY BRIDGE', 'An icy bridge in gusting crosswinds. The flags show the wind.', 0, '#ff6a8a');
    b.plat({ x: 0, y: 2, z: -65, w: 3.5, d: 28, style: 'ice', type: 'ice' });
    b.wind({ x0: -1.75, x1: 1.75, z0: -51, z1: -79, y0: 2, y1: 8, force: 5, period: 6 });
    b.plat({ x: 0, y: 2, z: -87, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 2, -86);

    // ICE CLIMB
    b.sign(-3.4, 2, -90, 'ICE WALL', 'Climb the frozen cliff using the holds.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 13, z: -95, w: 8, d: 6, h: 13, style: 'ice', rock: true, rockDepth: 8 });
    b.holds(new V3(0, 2, -92), new V3(0, 0, 1), 2, 13, 0.55, 0.5);

    // ICE SLIDE
    b.sign(2.6, 13, -96.5, 'FROZEN SLIDE', 'Down the ice and off the ramp!', 0, '#4dd2ff');
    b.ramp({ z0: -98, y0: 13, z1: -128, y1: 4 });
    b.ramp({ z0: -128, y0: 4, z1: -132, y1: 5.2 });
    b.plat({ x: 0, y: 4.5, z: -144, w: 12, d: 16, style: 'island', rock: true });
    b.checkpoint(0, 4.5, -147);

    // CRUMBLING ICE
    b.sign(-3.5, 4.5, -150, 'THIN ICE', 'The cracked tiles will shatter. Keep moving!', 0, '#8fd8ff');
    const r = rng(61);
    for (let row = 0; row < 6; row++) for (let c = 0; c < 3; c++) {
      const crumbly = r() < 0.6;
      b.plat({ x: (c - 1) * 3, y: 4.5 + (r() - 0.5) * 0.5, z: -154.3 - row * 3, w: 1.6, d: 1.6, h: 0.5, style: crumbly ? 'ice' : 'stone', type: crumbly ? 'crumble' : 'solid' });
    }
    b.plat({ x: 0, y: 4.5, z: -177.6, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 4.5, -177);

    // MOVING PLATFORMS IN THE WIND
    b.sign(3, 4.5, -180.5, 'BLIZZARD CROSSING', 'Ride the moving platforms through the gusts.', 0, '#ff6a8a');
    b.plat({ x: 0, y: 4.5, z: -190, w: 4, d: 4, h: 0.6, style: 'metal', motion: t0((v, t) => { v.z = Math.sin(t * 0.7) * 4; }) });
    b.plat({ x: 0, y: 4.5, z: -204, w: 4, d: 4, h: 0.6, style: 'metal', motion: t0((v, t) => { v.z = Math.sin(t * 0.7 + Math.PI) * 4; }) });
    b.wind({ x0: -2, x1: 2, z0: -183, z1: -212, y0: 4.5, y1: 12, force: 3.5, period: 5 });
    b.bonusFinish(['drum', 'grapple'], 0, 4.5, -218, 12, 12, 14);
    b.tree(-4.6, 4.5, -222, 1.0); b.tree(4.8, 4.5, -221, 0.8);
  },
};
