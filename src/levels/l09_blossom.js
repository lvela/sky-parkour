// LEVEL 9 — Blossom Gardens: a spring morning among cherry trees. New: conveyor walkways.
export default {
  id: 'blossom',
  name: 'Blossom Gardens',
  tagline: 'Moving walkways through the cherry blossoms: ride the flow and fight the crosscurrents.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 30, az: -30 }, turbidity: 2.6, rayleigh: 1.4, cov: 0.6, cirrus: 0.8, tint: [1.08, 0.97, 1.03] },
  light: { color: 0xfff2ea, intensity: 3.1 }, envIntensity: 0.95, fog: 0.001,
  theme: {
    top: { p: 'speckle', a: '#5d9a3c', b: ['#4c8a2e', '#6eaa48', '#ffc0d8', '#ffe0ec'], seed: 91 }, side: 'dirt',
    stone: { p: 'tiles', a: '#d9ccb6', b: ['#cbbda5', '#e6dac6'], line: 'rgba(90,70,50,0.45)', seed: 92 }, palette: 'day', accent: '#ff8ab8',
  },
  scenery: {
    islands: { palette: 'day', leafHue: 0.93, leafSat: 0.65, leafLight: 0.74, count: 24, seed: 91 }, sea: {}, clouds: { count: 70 }, birds: true,
    drift: [{ count: 900, color: 0xffb6d2, size: 0.13, fall: 1.0, sway: 2.2 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'BLOSSOM GARDENS', 'The garden paths move! Yellow arrows show which way a walkway carries you.', 0, '#ff8ab8');
    b.tree(5.5, 0, 5, 1.1); b.tree(-6, 0, 5.5, 0.9); b.tree(6, 0, -5.5, 0.8);

    // GARDEN PATH
    [[0, 0.4], [1.4, 0.8], [-1.2, 1.2], [0.6, 1.2]].forEach(([x, y], i) => b.plat({ x, y, z: -12 - i * 5.5, w: 3, d: 3, h: 1, style: 'trim', rock: true, rockDepth: 3 }));
    b.plat({ x: 0, y: 1.2, z: -37, w: 8, d: 8, style: 'island', rock: true });

    // WALKWAY — carries you forward, so you jump much further off its end
    b.sign(3, 1.2, -35, 'WALKWAYS', 'This one carries you forward. Run with it and you\'ll fly off the end!', 0, '#ffcf3a');
    b.conveyor({ x: 0, y: 1.2, z: -50, w: 3, d: 16, speed: 4 });
    b.plat({ x: 0, y: 1.2, z: -64, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -64);

    // CROSSCURRENTS — sideways belts; angle your run against them
    b.sign(-3, 1.2, -62, 'CROSSCURRENTS', 'These belts push you sideways. Lean into them so you don\'t drift off!', 0, '#ff8ab8');
    b.conveyor({ x: 0, y: 1.2, z: -76, w: 14, d: 4, speed: 2.5, yaw: Math.PI / 2 });
    b.conveyor({ x: 0, y: 1.2, z: -92, w: 14, d: 4, speed: 2.5, yaw: -Math.PI / 2 });
    b.plat({ x: 0, y: 1.2, z: -106, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1.2, -106);
    b.tree(-3, 1.2, -108, 0.8);

    // AGAINST THE FLOW — belts running backwards, with gaps
    b.sign(3, 1.2, -104, 'AGAINST THE FLOW', 'Backwards belts steal your speed. Jump from the very end!', 0, '#ffcf3a');
    [[1.2, -115], [1.6, -123], [2.0, -131]].forEach(([y, z]) => b.conveyor({ x: 0, y, z, w: 3, d: 6, speed: -3 }));
    b.plat({ x: 0, y: 2, z: -140, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2, -140);

    // BLOSSOM BOUNCE — up to the high garden
    b.sign(-3, 2, -138, 'BLOSSOM BOUNCE', 'Up to the high garden!', 0, '#ff8ab8');
    b.plat({ x: 0, y: 1, z: -148.7, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
    b.plat({ x: 0, y: 6, z: -157, w: 5, d: 5, style: 'wood', rock: true, rockDepth: 4 });
    b.plat({ x: 0, y: 6, z: -166, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -166);

    // SLALOM — left, right, then a fast belt to launch you onto the finish
    b.sign(3, 6, -164, 'SLALOM', 'Left belt, right belt, then the express lane to the finish!', 0, '#ffcf3a');
    b.conveyor({ x: 0, y: 6, z: -177, w: 8, d: 3, speed: 3.5, yaw: Math.PI / 2 });
    b.conveyor({ x: 0, y: 6, z: -187, w: 8, d: 3, speed: 3.5, yaw: -Math.PI / 2 });
    b.conveyor({ x: 0, y: 6, z: -197, w: 3, d: 8, speed: 6 });
    b.bonusFinish('balloon', 0, 6, -210, 12, 12, 16);
    for (const [tx, tz, s] of [[-4.5, -214, 1.2], [4.6, -213, 1.0], [-4.8, -206, 0.8]]) b.tree(tx, 6, tz, s);
  },
};
