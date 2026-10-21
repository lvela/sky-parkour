// LEVEL 12 — Coral Reef: a sunken reef in deep blue water; you're buoyant here. New: bubble elevators.
export default {
  id: 'reef',
  name: 'Coral Reef',
  tagline: 'Buoyant jumps over coral, kelp swings and rising bubbles you can ride.',
  exposure: 0.9,
  gravity: 0.8,
  sky: {
    mode: 'gradient', light: { elev: 70, az: 10 },
    zen: [0.0, 0.04, 0.09], hor: [0.02, 0.22, 0.32], glow: [0.2, 0.5, 0.5], glowPow: 4, glowAmt: 0.6,
    cov: 2, cirrus: 0, tint: [0.7, 1.0, 1.1],
  },
  light: { color: 0x9adfff, intensity: 2.2 }, envIntensity: 1.2, fog: 0.0045,
  hemi: { sky: 0x2a8aa0, ground: 0x103040, intensity: 0.8 },
  theme: {
    top: { p: 'speckle', a: '#d8c8a0', b: ['#c8b890', '#e8dcb8', '#ff9a8a', '#b0a080'], seed: 121 },
    side: { p: 'speckle', a: '#c86a6a', b: ['#e88a7a', '#a84a5a', '#ffb0a0', '#8a3a4a'], lip: '#d8c8a0', seed: 122 },
    stone: { p: 'hex', a: '#e88a7a', b: ['#ff9a8a', '#c86a6a'], line: 'rgba(120,40,50,0.6)', size: 24, seed: 123 },
    palette: { soil: 0xc86a6a, rockA: 0xd87a70, rockB: 0xffa090, dark: 0x8a3a4a, grassA: 0x2ab8a0, grassB: 0x3ad8b0 }, accent: '#4dfff0',
  },
  scenery: {
    islands: { palette: { soil: 0xc86a6a, rockA: 0xd87a70, rockB: 0xffa090, dark: 0x8a3a4a, grassA: 0x2ab8a0, grassB: 0x3ad8b0 }, leafHue: 0.45, leafSat: 0.7, leafLight: 0.35, crystals: true, count: 26, seed: 121 },
    sea: {}, clouds: false,
    drift: [{ count: 700, color: 0xd8f8ff, size: 0.12, fall: -1.6, sway: 0.8 }, { count: 500, color: 0x7affe0, size: 0.05, fall: 0.1, sway: 1.5, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'CORAL REEF', 'You\'re buoyant down here: you jump higher and float further.', 0, '#4dfff0');

    // SEA STEPS — wider gaps than you're used to
    [[0, 0.5], [1.5, 1], [-1.5, 1.5], [0, 2]].forEach(([x, y], i) => b.plat({ x, y, z: -13 - i * 7, w: 3, d: 3, h: 1, style: 'trim', rock: true, rockDepth: 3 }));
    b.plat({ x: 0, y: 2, z: -44, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 2, -44);

    // BUBBLE LIFT
    b.sign(3, 2, -42, 'BUBBLE LIFT', 'Hop on a bubble and ride it up. Jump off before it pops!', 0, '#4dfff0');
    b.bubble({ x: 0, z: -51, y0: 1, y1: 14, speed: 1.6, phase: 0 });
    b.bubble({ x: 0, z: -51, y0: 1, y1: 14, speed: 1.6, phase: 6.5 });
    b.plat({ x: 0, y: 12, z: -60, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 12, -60);

    // BUBBLE CHAIN — hop across the rising columns
    b.sign(-3, 12, -58, 'BUBBLE CHAIN', 'Jump from bubble to bubble across the trench.', 0, '#ff9a8a');
    [-70, -78, -86].forEach((z, k) => {
      b.bubble({ x: 0, z, y0: 6, y1: 16, speed: 1.4, phase: k * 3.3 });
      b.bubble({ x: 0, z, y0: 6, y1: 16, speed: 1.4, phase: k * 3.3 + 5 });
    });
    b.plat({ x: 0, y: 13, z: -96, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 13, -96);

    // KELP SWINGS
    b.sign(3, 13, -94, 'KELP SWINGS', 'Grab the handles and launch from one to the next.', 0, '#7aff9a');
    b.swingRig(-99.3, -137.7, 13, 19.6);
    b.swing(0, 19.4, -106, 6, 0.87, 0);
    b.swing(0, 19.4, -118, 6, 0.87, Math.PI);
    b.swing(0, 19.4, -130, 6, 0.87, 0);
    b.plat({ x: 0, y: 13, z: -142, w: 8, d: 10, style: 'island', rock: true });
    b.checkpoint(0, 13, -141);

    // THE CURRENT — drifting platforms in a sideways current
    b.sign(-3, 13, -139, 'THE CURRENT', 'A strong current sweeps across. Time the drifting platforms.', 0, '#4dfff0');
    b.plat({ x: 0, y: 13, z: -153, w: 4, d: 4, h: 0.6, style: 'trim', motion: b.mo((v, t) => { v.z = Math.sin(t * 0.7) * 4; }) });
    b.plat({ x: 0, y: 13, z: -165, w: 4, d: 4, h: 0.6, style: 'trim', motion: b.mo((v, t) => { v.z = -Math.sin(t * 0.7) * 4; }) });
    b.wind({ x0: -2, x1: 2, z0: -148, z1: -172, y0: 13, y1: 22, force: 4, period: 5 });
    b.plat({ x: 0, y: 13, z: -176, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 13, -176);

    // FINAL BUBBLE up to the finish
    b.sign(3, 13, -174, 'SURFACE', 'One last bubble up to the finish!', 0, '#ffd84d');
    b.bubble({ x: 0, z: -183, y0: 12, y1: 25, speed: 1.6, phase: 0 });
    b.bubble({ x: 0, z: -183, y0: 12, y1: 25, speed: 1.6, phase: 6.5 });
    b.bonusFinish('tide', 0, 23, -192, 12, 12, 16);
  },
};
