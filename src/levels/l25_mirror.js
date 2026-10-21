// LEVEL 25 — Mirror Dimension: a pale, impossible world of marble and glass. New: portals.
const MARBLE = { soil: 0xc8c4d8, rockA: 0xd8d4e8, rockB: 0xf0eef8, dark: 0x9890b0, grassA: 0xf8f8ff, grassB: 0xe0e0f0 };

export default {
  id: 'mirror',
  name: 'Mirror Dimension',
  tagline: 'Step through portals to impossible places and cross the glass bridges — if you can tell which panes are real.',
  exposure: 0.45,
  sky: {
    mode: 'gradient', light: { elev: 50, az: 0 },
    zen: [0.5, 0.45, 0.7], hor: [0.9, 0.85, 1.0], glow: [0.5, 0.5, 0.6], glowPow: 8, glowAmt: 0.5,
    cov: 0.7, cloudBright: 1.1, cloudShade: 1, cirrus: 0.5, tint: [1, 0.95, 1.1],
  },
  light: { color: 0xffffff, intensity: 3.0 }, envIntensity: 1.0, fog: 0.0015,
  hemi: { sky: 0xd0c8ff, ground: 0x8080a0, intensity: 0.5 },
  theme: {
    top: { p: 'tiles', a: '#f0eef8', b: ['#ffffff', '#e0dcf0', '#d8e8ff'], line: 'rgba(120,110,160,0.5)', n: 2, seed: 251 }, side: 'metal',
    stone: { p: 'tiles', a: '#e8e4f4', b: ['#f8f6ff', '#d8d4e8'], line: 'rgba(120,110,160,0.4)', n: 4, seed: 252 },
    palette: MARBLE, accent: '#b04dff',
  },
  scenery: {
    islands: { palette: MARBLE, trees: false, crystals: true, count: 26, seed: 251 }, sea: {}, clouds: { count: 80 },
    drift: [{ count: 400, color: 0xffffff, size: 0.07, fall: -0.3, sway: 1.5, additive: true }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -1, 'MIRROR DIMENSION', 'Walk into a purple portal and you\'ll come out of the green one.', 0, '#b04dff');

    // FIRST STEP — a portal up to a floating island
    b.portal({ a: { x: 0, y: 0, z: -6 }, b: { x: 0, y: 6, z: -30 } });
    b.plat({ x: 0, y: 6, z: -32, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -32);

    // HALL OF MIRRORS
    b.sign(3, 6, -30, 'HALL OF MIRRORS', 'One pane in each pair is fake. Fakes flicker now and then. Watch closely!', 0, '#4dffd2');
    b.glassBridge({ x: 0, y: 6, z0: -40, rows: 7, gap: 3.2, spread: 1.5, seed: 25 });
    b.plat({ x: 0, y: 6, z: -67, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6, -67);

    // PORTAL LOOP
    b.sign(-3, 6, -65, 'PORTAL LOOP', 'Through the portal, across the slider, through the next one.', 0, '#b04dff');
    b.portal({ a: { x: 0, y: 6, z: -69.5 }, b: { x: 8, y: 12, z: -80 } });
    b.plat({ x: 8, y: 12, z: -83, w: 4, d: 8, style: 'trim' });
    b.plat({ x: 8, y: 12, z: -92, w: 4, d: 4, h: 0.6, style: 'trim', motion: b.mo((v, t) => { v.x = Math.sin(t * 1.1) * 3; }) });
    b.plat({ x: 8, y: 12, z: -99.5, w: 4, d: 4, style: 'trim' });
    b.portal({ a: { x: 8, y: 12, z: -101 }, b: { x: 0, y: 3, z: -114 } });
    b.plat({ x: 0, y: 3, z: -117, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 3, -117);

    // MIRROR LEAP — jump through a portal hanging over the void
    b.sign(3, 3, -115, 'MIRROR LEAP', 'Take a running jump through the floating portal!', 0, '#4dffd2');
    b.portal({ a: { x: 0, y: 3, z: -124.5 }, b: { x: 0, y: 10, z: -139.5 } });
    b.plat({ x: 0, y: 10, z: -144, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 10, -145);

    // FINAL REFLECTION
    b.sign(-3, 10, -143, 'FINAL REFLECTION', 'One more glass bridge, one more portal.', 0, '#b04dff');
    b.glassBridge({ x: 0, y: 10, z0: -152, rows: 5, gap: 3.2, spread: 1.6, seed: 52 });
    b.plat({ x: 0, y: 10, z: -169, w: 4, d: 4, style: 'trim' });
    b.portal({ a: { x: 0, y: 10, z: -170.5 }, b: { x: 0, y: 20, z: -189 } });
    b.bonusFinish('phantom', 0, 20, -193, 12, 12, 16);
  },
};
