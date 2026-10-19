// LEVEL 27 — Bog of Shadows: a fog-choked swamp at dusk. New: sticky mud and retracting bars.
const BOG = { soil: 0x2a2418, rockA: 0x3a3a2e, rockB: 0x4a4a3a, dark: 0x1a1a12, grassA: 0x3a4a2a, grassB: 0x4a5a34 };

export default {
  id: 'bog',
  name: 'Bog of Shadows',
  tagline: 'Wade through sticky mud and swing on bars that pull back into the fog.',
  exposure: 0.9,
  sky: {
    mode: 'gradient', light: { elev: 10, az: -120 },
    zen: [0.02, 0.03, 0.03], hor: [0.15, 0.17, 0.12], glow: [0.3, 0.25, 0.1], glowPow: 4, glowAmt: 0.4,
    cov: 0.6, cloudBright: 0.4, cloudShade: 0.5, cirrus: 0.3, tint: [0.85, 1.0, 0.8],
  },
  light: { color: 0xc8d0a0, intensity: 1.6 }, envIntensity: 1.0, fog: 0.004,
  hemi: { sky: 0x4a5a40, ground: 0x1a2010, intensity: 0.6 },
  theme: {
    top: { p: 'speckle', a: '#3a4a2a', b: ['#2a3a1e', '#4a5a34', '#5a4a2a'], seed: 271 },
    side: { p: 'speckle', a: '#3a2e20', b: ['#2a2016', '#4a3a28'], lip: '#3a4a2a', seed: 272 }, stone: 'slate',
    palette: BOG, accent: '#c8ff6a',
  },
  scenery: {
    islands: { palette: BOG, leafHue: 0.22, leafSat: 0.3, leafLight: 0.15, count: 24, seed: 271 }, sea: {}, clouds: { count: 40 },
    drift: [{ count: 380, color: 0xc8ff6a, size: 0.15, fall: 0.05, sway: 2.5, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'BOG OF SHADOWS', 'Mud slows you down and saps your jump. Bars pull back into their housings!', 0, '#c8ff6a');
    b.tree(5.5, 0, 5, 1.0); b.tree(-6, 0, 5, 0.8);

    // MUD FLATS
    b.mud({ x: 0, y: 0, z: -20, w: 4, d: 24 });
    for (const z of [-15, -24]) b.plat({ x: 0, y: 0.4, z, w: 4, d: 0.6, h: 0.5, style: 'wood' });
    b.plat({ x: 0, y: 0, z: -37.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -37.5);

    // RETRACTING BARS
    b.sign(3, 0, -35.5, 'RETRACTING BARS', 'Bars turn red, then pull back. Swing on before they go!', 0, '#ff4a3a');
    [-44, -49, -54, -59, -64].forEach((z, i) => b.retractBar(0, 3.6, z, 3, { period: 3, on: 0.6, phase: -i * 0.6 }));
    b.plat({ x: 0, y: 0, z: -71, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -71);

    // SINKING BOG — quicksand and mud pads
    b.sign(-3, 0, -69, 'SINKING BOG', 'Quicksand sinks, mud sticks. Short hops only!', 0, '#c8ff6a');
    b.quicksand({ x: 0, y: 0, z: -79.5, rate: 0.8 });
    b.mud({ x: 0, y: 0, z: -85.5, w: 3, d: 3 });
    b.quicksand({ x: 0, y: 0, z: -90, rate: 0.8 });
    b.mud({ x: 0, y: 0, z: -96, w: 3, d: 3 });
    b.quicksand({ x: 0, y: 0, z: -100.5, rate: 0.8 });
    b.plat({ x: 0, y: 0, z: -109, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -109);

    // SWAMP SCYTHES — hammers over a mud bridge
    b.sign(3, 0, -107, 'SWAMP SCYTHES', 'Scythes swing over the mud. You can\'t run, so time it!', 0, '#ff5a4a');
    b.mud({ x: 0, y: 0, z: -125, w: 3, d: 24 });
    [-119, -127, -135].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 8.5, L: 7, A: 1.0, phase: i * 2.2, speedMul: 0.8 });
      b.post(-3.4, 0, 9.3, z, false, b.M.stone, 0.3); b.post(3.4, 0, 9.3, z, false, b.M.stone, 0.3);
      const beam = b.post(0, 8.8, 9.4, z, false, b.M.iron, 0.2); beam.scale.x = 17.5;
    });
    b.plat({ x: 0, y: 0, z: -142, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -142);

    // GNARLED BARS
    b.sign(-3, 0, -140, 'GNARLED BARS', 'Moving bars, retracting bars, and both at once.', 0, '#ff4a3a');
    b.bar(0, 3.6, -148.5, 3);
    b.bar(0, 3.6, -153.5, 3, b.mo((v, t) => { v.y = Math.sin(t * 1.4); }));
    b.retractBar(0, 3.6, -158.5, 3, { period: 2.6, on: 0.6 });
    b.retractBar(0, 3.6, -163.5, 3, { period: 2.6, on: 0.6, phase: -0.8, motion: b.mo((v, t) => { v.x = Math.sin(t) * 1.5; }) });
    b.retractBar(0, 3.6, -168.5, 3, { period: 2.6, on: 0.6, phase: -1.6 });
    b.finish(0, 0, -177, 12, 12, 16);
    b.tree(-4.5, 0, -181, 0.9); b.tree(4.6, 0, -180, 0.7);
  },
};
