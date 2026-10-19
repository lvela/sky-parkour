// LEVEL 34 — Eclipse Ruins: ancient ruins under a total solar eclipse. New: paths of light that only exist as a wave passes.
const RUIN = { soil: 0x2a2018, rockA: 0x3a3028, rockB: 0x4a3e32, dark: 0x16100c, grassA: 0x4a3a24, grassB: 0x5a4a2e };

export default {
  id: 'eclipse',
  name: 'Eclipse Ruins',
  tagline: 'Race waves of light across the void while spikes and flames guard the sun temple.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 24, az: 0 },
    zen: [0.005, 0.004, 0.008], hor: [0.15, 0.08, 0.06], glow: [1.0, 0.6, 0.3], glowPow: 30, glowAmt: 2.0,
    cov: 0.5, cloudBright: 0.3, cloudShade: 0.4, cirrus: 0.3, stars: 0.8, tint: [1.1, 0.8, 0.7],
    moon: { elev: 24, az: 0, size: 3, bright: 0.02 },
  },
  light: { color: 0xffb070, intensity: 1.4 }, envIntensity: 1.1, fog: 0.0014,
  hemi: { sky: 0x3a2a40, ground: 0x201010, intensity: 0.5 },
  theme: {
    top: { p: 'tiles', a: '#3a3028', b: ['#4a3a30', '#2a221c'], line: 'rgba(255,180,90,0.35)', n: 3, seed: 341 },
    side: { p: 'speckle', a: '#2a2420', b: ['#3a3028', '#1e1a16'], seed: 342 },
    stone: { p: 'cracks', a: '#2a221c', b: ['#3a3028'], line: '#ffb060', glow: true, seed: 343 },
    palette: RUIN, accent: '#ffd84d',
  },
  scenery: {
    islands: { palette: RUIN, leafHue: 0.08, leafLight: 0.12, count: 22, seed: 341 }, sea: {}, clouds: { count: 40 },
    drift: [{ count: 500, color: 0x8a7a6a, size: 0.06, fall: 0.5, sway: 1.5 }],
  },
  killY: -32,

  build(b) {
    const jets = (z, o) => { for (const x of [-0.75, 0.75]) b.flameJet({ x, y: 0, z, period: o.period, on: 0.4, phase: o.phase }); };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'ECLIPSE RUINS', 'The light path is only solid while it glows. Wait for the wave, then run WITH it!', 0, '#ffd84d');

    // PATH OF LIGHT
    b.pulsePath({ x: 0, y: 0, z0: -9.7, n: 10, speed: 5, period: 4, window: 0.4 });
    b.plat({ x: 0, y: 0, z: -41.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -41.5);

    // SUN TRAPS — spikes and flames
    b.sign(3, 0, -39.5, 'SUN TRAPS', 'Spikes and flames take turns. Find the rhythm.', 0, '#ff5a2a');
    b.plat({ x: 0, y: 0, z: -61, w: 3, d: 30, style: 'trim' });
    [-50, -58, -66].forEach((z, i) => b.spikes({ x: 0, y: 0.01, z, w: 3, d: 3, period: 2.2, on: 0.4, phase: i * 0.7 }));
    [-54, -62, -70].forEach((z, i) => jets(z, { period: 2.2, phase: 1.1 + i * 0.7 }));
    b.plat({ x: 0, y: 0, z: -81, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -81);

    // RISING LIGHT — a climbing wave
    b.sign(-3, 0, -79, 'RISING LIGHT', 'This wave climbs. Hop up with it.', 0, '#ffd84d');
    b.pulsePath({ x: 0, y: 0.4, z0: -86.2, n: 10, speed: 5.5, period: 4.5, window: 0.4, rise: 0.4 });
    b.plat({ x: 0, y: 4, z: -118.4, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 4, -118.4);

    // SHADOW GLASS
    b.sign(3, 4, -116.4, 'SHADOW GLASS', 'Half these panes are fake. They flicker in the eclipse light.', 0, '#9ad0ff');
    b.glassBridge({ x: 0, y: 4, z0: -126, rows: 7, gap: 3.2, spread: 1.5, seed: 34 });
    b.plat({ x: 0, y: 4, z: -152, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 4, -152);

    // TOTALITY — the fastest wave
    b.sign(-3, 4, -150, 'TOTALITY', 'The fastest wave of all. Don\'t fall behind!', 0, '#ffd84d');
    b.pulsePath({ x: 0, y: 4, z0: -157.2, n: 12, speed: 6.5, period: 3.5, window: 0.35 });
    b.finish(0, 4, -197.4, 12, 12, 16);
  },
};
