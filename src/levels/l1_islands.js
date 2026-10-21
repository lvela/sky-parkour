// LEVEL 1 — Sky Islands: the original course in bright daylight.
import * as THREE from 'three';
import { rng } from '../textures.js';

const V3 = THREE.Vector3;

export default {
  id: 'islands',
  name: 'Sky Islands',
  tagline: 'Jumps, crumbling tiles, trampolines, wall jumps, swings, grabbers and a zipline.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 21, az: -62 }, turbidity: 3.2, rayleigh: 1.25, cov: 0.52, cirrus: 1 },
  light: { color: 0xfff0dc, intensity: 3.2 }, envIntensity: 0.9, fog: 0.0009,
  theme: { top: 'grass', side: 'dirt', stone: 'stone', palette: 'day', accent: '#ffcf4a' },
  scenery: { islands: { palette: 'day' }, sea: {}, clouds: {}, birds: true },
  killY: -32,

  build(b) {
    const Z = -4.3; // everything after the trampolines is shifted by this
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'SKY ISLANDS', 'Reach the finish far ahead. Fall and you fall to your death.');
    b.tree(5.5, 0, 5, 1.2); b.tree(-6, 0, 5.5, 0.9); b.tree(6, 0, -5.5, 1.0);

    // 1. stepping stones
    const stoneX = [0, 1.8, -1.2, 1.5, -1.5, 0], stoneY = [0.5, 1.0, 1.5, 1.2, 1.8, 2.0];
    for (let i = 0; i < 6; i++) b.plat({ x: stoneX[i], y: stoneY[i], z: -12 - i * 5.5, w: 3, d: 3, h: 1.2, rock: true, rockDepth: 3 });
    b.plat({ x: 0, y: 2, z: -47.5, w: 8, d: 8, style: 'island', rock: true });

    // 2. tile jumps
    b.sign(-2.2, 2, -49.5, 'TILE JUMPS', 'Orange tiles crumble a moment after you land. Keep moving!');
    const tr = rng(99);
    for (let row = 0; row < 7; row++) for (let c = 0; c < 3; c++) {
      const crumbly = tr() < 0.55;
      b.plat({ x: (c - 1) * 3, y: 2 + (tr() - 0.5) * 0.6, z: -53.5 - row * 3, w: 1.4, d: 1.4, h: 0.5, style: crumbly ? 'crumble' : 'stone', type: crumbly ? 'crumble' : 'solid' });
    }
    b.plat({ x: 0, y: 2, z: -78.7, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2, -78.7);

    // 3. trampolines
    b.sign(-2.2, 2, -80.8, 'TRAMPOLINES', 'Drop onto a trampoline to bounce high. Hold forward in the air.');
    b.plat({ x: 0, y: 0, z: -88.7, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 5, z: -97, w: 5, d: 5, style: 'wood', rock: true, rockDepth: 4 });
    b.plat({ x: 0, y: 1, z: -105.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 1, z: -116.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 6, z: -120.7 + Z, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -120.7 + Z);

    // 4. wall jumps
    b.sign(2.2, 6, -122.8 + Z, 'WALL JUMPS', 'Jump into an orange wall, then press jump again to kick off it.', 0, '#ff8a4a');
    [-129.7, -133.2, -136.7, -140.2, -143.7].forEach((z, i) => {
      b.plat({ x: (i % 2 === 0 ? -1 : 1) * 2.3, y: 16, z: z + Z, w: 0.6, d: 10, h: 12, style: 'wall', type: 'wall' });
    });
    b.plat({ x: 0, y: 7, z: -154 + Z, w: 8, d: 10, style: 'island', rock: true });
    b.plat({ x: -2.05, y: 19, z: -157 + Z, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.plat({ x: 2.05, y: 19, z: -157 + Z, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.sign(-3.2, 7, -152.2 + Z, 'THE SHAFT', 'Wall jump left and right to climb up. Push forward at the top.', 0, '#ff8a4a');
    b.plat({ x: 0, y: 16, z: -163 + Z, w: 8, d: 8, h: 9, style: 'island', rock: true, rockDepth: 6 });
    b.checkpoint(0, 16, -163.5 + Z);

    // 5. swings
    b.sign(-2.6, 16, -160.2 + Z, 'SWINGS', 'Hold E (or grip) near the handle. Press jump to launch at the next one.');
    b.swingRig(-166.3 + Z, -204.7 + Z, 16, 22.6);
    b.swing(0, 22.4, -173 + Z, 6, 0.87, 0);
    b.swing(0, 22.4, -185 + Z, 6, 0.87, Math.PI);
    b.swing(0, 22.4, -197 + Z, 6, 0.87, 0);
    b.plat({ x: 0, y: 16, z: -208 + Z, w: 8, d: 8, style: 'island', rock: true });

    // 6. grabbers
    b.sign(-2.6, 16, -205.8 + Z, 'GRABBERS', 'Grab a bar, then jump to fling yourself to the next. Some bars move!');
    const o = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.bar(0, 19.6, -214.5 + Z, 3);
    b.bar(0, 19.6, -219.5 + Z, 3);
    b.bar(0, 19.6, -224.5 + Z, 3, o((v, t) => { v.y = Math.sin(t * 1.3); }));
    b.bar(0, 19.6, -229.5 + Z, 3, o((v, t) => { v.y = Math.sin(t * 1.3 + Math.PI); }));
    b.bar(0, 19.6, -234.5 + Z, 3, o((v, t) => { v.x = Math.sin(t) * 2; }));
    b.bar(0, 19.6, -239.5 + Z, 3, o((v, t) => { v.x = Math.sin(t + Math.PI) * 2; }));
    b.plat({ x: 0, y: 17, z: -246 + Z, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 17, -246 + Z);

    // 7. moving & rotating platforms
    b.sign(-2.6, 17, -243.8 + Z, 'ON THE MOVE', 'Ride the moving platforms and time your jumps across the spinner.');
    b.plat({ x: 0, y: 17, z: -260 + Z, w: 4, d: 4, h: 0.6, style: 'metal', motion: o((v, t) => { v.z = Math.sin(t * 0.7) * 6; }) });
    for (const a of [0, Math.PI / 2]) b.plat({ x: 0, y: 17, z: -276 + Z, w: 11, d: 2.2, h: 0.6, style: 'wood', yaw: a, motion: o((v, t) => { v.yaw = t * 0.5; }) });
    { const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 3, 10), b.M.metal); hub.position.set(0, 15.2, -276 + Z); b.add(hub); }
    b.plat({ x: 0, y: 17.5, z: -286 + Z, w: 4, d: 4, h: 0.6, style: 'metal', motion: o((v, t) => { v.x = Math.sin(t * 0.8) * 5; }) });
    b.plat({ x: 0, y: 18, z: -295 + Z, w: 8, d: 8, style: 'island', rock: true });

    // 8. zipline
    b.sign(-2.6, 18, -292.2 + Z, 'ZIPLINE', 'Grab the handle and hold on. Let go over the island below.');
    b.zip(new V3(0, 21.8, -298.3 + Z), new V3(0, 6.8, -345.5 + Z));
    b.plat({ x: 0, y: 3, z: -347 + Z, w: 10, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 3, -348.5 + Z);

    // 9. final climb
    b.sign(-3.4, 3, -343.6 + Z, 'FINAL CLIMB', 'Crumbling steps, then the MEGA trampoline to the finish!', 0, '#ff5a4a');
    [4, 5.2, 6.4, 7.6, 8.8, 10].forEach((y, i) => {
      const crumbly = i === 1 || i === 3 || i === 4;
      b.plat({ x: [1.2, -1.2, 1.2, -1.2, 1.2, 0][i], y, z: -355.5 - i * 4.5 + Z, w: 2.6, d: 2.2, h: 0.6, style: crumbly ? 'crumble' : 'stone', type: crumbly ? 'crumble' : 'solid' });
    });
    b.plat({ x: 0, y: 10, z: -384.5 + Z, w: 6, d: 6, rock: true, rockDepth: 5 });
    b.plat({ x: 0, y: 8, z: -392.5 + Z, w: 3, d: 3, h: 0.6, style: 'mega', type: 'tramp', bounce: 24 });
    b.bonusFinish(['seesaw', 'grapple'], 0, 18, -404.5 + Z, 12, 12, 18);
    for (const [tx, tz, s] of [[-4.5, -409, 1.2], [4.6, -408.5, 1.0], [-4.8, -400.5, 0.8], [4.7, -401, 0.9]]) b.tree(tx, 18, tz + Z, s);
  },
};
