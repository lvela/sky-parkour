// LEVEL 10 — Mushroom Grove: a twilight forest of giant glowing fungi. New: bouncy mushroom caps.
export default {
  id: 'mushroom',
  name: 'Mushroom Grove',
  tagline: 'Bounce across giant glowing mushrooms in a twilight forest full of fireflies.',
  exposure: 0.8,
  sky: {
    mode: 'gradient', light: { elev: 12, az: 150 },
    zen: [0.02, 0.015, 0.06], hor: [0.25, 0.12, 0.3], glow: [0.5, 0.2, 0.4], glowPow: 6, glowAmt: 0.7,
    cov: 0.5, cloudBright: 0.5, cloudShade: 0.5, cirrus: 0.4, stars: 0.8, tint: [0.9, 0.7, 1.1],
  },
  light: { color: 0xc8a0ff, intensity: 1.6 }, envIntensity: 1.1, fog: 0.0018,
  hemi: { sky: 0x6050a0, ground: 0x203020, intensity: 0.6 },
  theme: {
    top: { p: 'speckle', a: '#2e4a2a', b: ['#24401f', '#3a5a30', '#1c3018', '#4a6a3a'], seed: 101 },
    side: { p: 'speckle', a: '#3a2a20', b: ['#2a1e16', '#4a382a'], lip: '#2e4a2a', seed: 102 }, stone: 'stone',
    palette: { soil: 0x2a2018, rockA: 0x3a3440, rockB: 0x4a4458, dark: 0x1a1620, grassA: 0x2e5a3a, grassB: 0x3a6a48 }, accent: '#c8ff6a',
  },
  scenery: {
    islands: { palette: { soil: 0x2a2018, rockA: 0x3a3440, rockB: 0x4a4458, dark: 0x1a1620, grassA: 0x2e5a3a, grassB: 0x3a6a48 }, leafHue: 0.78, leafSat: 0.5, leafLight: 0.35, count: 24, seed: 103 },
    sea: {}, clouds: { count: 50 },
    drift: [{ count: 420, color: 0xc8ff6a, size: 0.16, fall: 0.05, sway: 2.5, additive: true }],
  },
  killY: -32,

  build(b) {
    const caps = [0xff4d6d, 0x4dd2ff, 0xffb84d, 0xc77dff, 0x7dff6a];
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'MUSHROOM GROVE', 'Mushroom caps are springy. Hold forward in the air to keep your speed.', 0, '#c8ff6a');
    b.mushroom({ x: 5, y: 1.5, z: 5, r: 1.4, color: caps[3], stem: 1.5 });

    // CAP HOPS
    [-13, -22, -31].forEach((z, i) => b.mushroom({ x: 0, y: 0.3, z, r: 1.8, bounce: 14, color: caps[i] }));
    b.plat({ x: 0, y: 1, z: -42, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 1, -42);

    // GIANT STEPS — each cap is higher than the last
    b.sign(3, 1, -40, 'GIANT STEPS', 'Bounce from cap to cap, higher and higher.', 0, '#ffb84d');
    b.mushroom({ x: 0, y: 1.3, z: -48, r: 2.4, bounce: 16, color: caps[1], stem: 6 });
    b.mushroom({ x: 0, y: 5, z: -55, r: 2.4, bounce: 16, color: caps[2], stem: 10 });
    b.plat({ x: 0, y: 8, z: -64.5, w: 6, d: 7, style: 'island', rock: true });
    b.checkpoint(0, 8, -65);

    // BOBBING CAPS
    b.sign(-2.5, 8, -63, 'BOBBING CAPS', 'These ones bob up and down. Drop on when they\'re low.', 0, '#4dd2ff');
    [-74, -82, -90].forEach((z, i) => b.mushroom({ x: 0, y: 8.4, z, r: 1.8, bounce: 14, color: caps[(i + 3) % 5], stem: 3, motion: b.mo((v, t) => { v.y = 1.5 * Math.sin(t * 1.2 + i * 2); }) }));
    b.plat({ x: 0, y: 9, z: -101, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 9, -101);

    // SPORE LAUNCHERS — they hurl you along the arrows
    b.sign(3, 9, -99, 'SPORE LAUNCHERS', 'These caps throw you far. The last one throws you LEFT!', 0, '#ff4d6d');
    b.mushroom({ x: 0, y: 9.3, z: -110, r: 2, bounce: 16, push: { x: 0, z: -9 }, color: caps[0], stem: 8 });
    b.mushroom({ x: 0, y: 9.3, z: -123, r: 2, bounce: 16, push: { x: 0, z: -9 }, color: caps[4], stem: 8 });
    b.mushroom({ x: 0, y: 9.3, z: -136, r: 2, bounce: 16, push: { x: -7, z: -6 }, color: caps[2], stem: 8 });
    b.plat({ x: -10, y: 9, z: -147, w: 8, d: 12, style: 'island', rock: true });
    b.checkpoint(-10, 9, -144);

    // STALK SHAFT — wall jump between two giant stalks
    b.sign(-13.2, 9, -142, 'STALK SHAFT', 'Wall jump left and right up between the stalks.', 0, '#ff8a4a');
    b.plat({ x: -12.05, y: 21, z: -151.5, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.plat({ x: -7.95, y: 21, z: -151.5, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
    b.plat({ x: -10, y: 18, z: -158, w: 8, d: 8, h: 9, style: 'island', rock: true, rockDepth: 6 });
    b.checkpoint(-10, 18, -158.5);

    // MEGA CAP to the finish
    b.sign(-13, 18, -156, 'MEGA CAP', 'Drop onto the giant cap and it\'ll launch you to the finish!', 0, '#c8ff6a');
    b.mushroom({ x: -10, y: 12.3, z: -168, r: 2.2, bounce: 22, color: 0xff3a8a, stem: 14 });
    b.bonusFinish('teacups', -10, 20, -183, 12, 12, 16);
    b.mushroom({ x: -14, y: 21.5, z: -188, r: 1.3, color: caps[1], stem: 1.5 });
    b.mushroom({ x: -5.5, y: 21.2, z: -187, r: 1.0, color: caps[4], stem: 1.2 });
  },
};
