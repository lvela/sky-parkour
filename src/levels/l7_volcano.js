// LEVEL 7 — Volcano Rift: over a sea of lava. Fireball cannons, geyser launch pads, molten hammers, lava elevators.
export default {
  id: 'volcano',
  name: 'Volcano Rift',
  tagline: 'Fireball cannons, lava geysers that launch you across, molten hammers and lava elevators.',
  exposure: 0.85,
  sky: {
    mode: 'gradient', light: { elev: 25, az: 40 },
    zen: [0.03, 0.012, 0.01], hor: [0.32, 0.08, 0.03], glow: [0.6, 0.15, 0.02], glowPow: 3, glowAmt: 0.8,
    cov: 0.42, cloudBright: 0.45, cloudShade: 0.4, cirrus: 0.3, tint: [1.3, 0.55, 0.4],
  },
  light: { color: 0xff9a6a, intensity: 1.8 }, envIntensity: 1.2, fog: 0.0028,
  hemi: { sky: 0x80301a, ground: 0xff5010, intensity: 0.7 },
  theme: { top: 'basalt', side: 'basalt', stone: 'basalt', palette: 'volcano', accent: '#ff8a3a' },
  scenery: { islands: { palette: 'volcano', trees: false, count: 16, seed: 41 }, sea: { y: -60, lava: true }, clouds: { count: 45, seaY: -60 }, embers: true },
  killY: -40,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'VOLCANO RIFT', 'The sea below is molten lava. Don\'t fall in!', 0, '#ff8a3a');

    // BASALT STONES
    [[0, 0], [1.4, 0.6], [-1.2, 0], [1.0, 0.8], [-0.8, 0.4]].forEach(([x, y], i) => b.plat({ x, y, z: -12 - i * 5.5, w: 3, d: 3, h: 1.2, style: 'basalt', rock: true, rockDepth: 4 }));
    b.plat({ x: 0, y: 0.5, z: -42, w: 8, d: 8, style: 'island', rock: true });

    // FIREBALL BRIDGE
    b.sign(3, 0.5, -40, 'FIREBALL BRIDGE', 'Cannons fire across the bridge. Time your run between shots!', 0, '#ff5a2a');
    b.plat({ x: 0, y: 0.5, z: -60, w: 4, d: 28, style: 'basalt' });
    [-50, -56, -62, -68].forEach((z, i) => {
      const s = i % 2 === 0 ? 1 : -1;
      b.cannon({ x: s * 6, y: 1.5, z, dir: -s, range: 12, speed: 11, period: 2.2, phase: i * 0.55 });
      b.post(s * 6, -12, 0.7, z, false, b.M.basalt, 0.6);
    });
    b.plat({ x: 0, y: 0.5, z: -81, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -80.5);

    // GEYSER LAUNCHES
    b.sign(-3, 0.5, -83, 'GEYSERS', 'Jump onto a geyser and it will hurl you across the gap!', 0, '#ffb040');
    b.geyser({ x: 0, y: 0.5, z: -89, w: 4, d: 4, bounce: 16, push: { x: 0, z: -9 } });
    b.geyser({ x: 0, y: 0.5, z: -102.1, w: 4, d: 4, bounce: 16, push: { x: 0, z: -9 } });
    b.geyser({ x: 0, y: 0.5, z: -115.2, w: 4, d: 4, bounce: 16, push: { x: 0, z: -9 } });
    b.plat({ x: 0, y: 0.5, z: -132, w: 10, d: 12, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -131);

    // MOLTEN HAMMERS
    b.sign(3, 0.5, -136, 'MOLTEN HAMMERS', 'Run between the swinging hammers.', 0, '#ff4d4d');
    b.plat({ x: 0, y: 0.5, z: -150, w: 4, d: 24, style: 'basalt' });
    [-143, -150, -157].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 9.5, L: 8, A: 0.95, phase: i * 2.3 });
      b.post(-3.4, 0.5, 10, z, false, b.M.basalt, 0.3); b.post(3.4, 0.5, 10, z, false, b.M.basalt, 0.3);
      const beam = b.post(0, 9.8, 10.2, z, false, b.M.iron, 0.2); beam.scale.x = 17.5;
    });
    b.plat({ x: 0, y: 0.5, z: -166, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0.5, -165);

    // LAVA ELEVATORS
    b.sign(-3, 0.5, -168.5, 'LAVA ELEVATORS', 'Hop up the rising and sinking platforms.', 0, '#ffb040');
    b.plat({ x: 0, y: 0.5, z: -173, w: 4, d: 4, h: 0.6, style: 'metal', motion: t0((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.plat({ x: 0, y: 4.5, z: -179, w: 4, d: 4, h: 0.6, style: 'metal', motion: t0((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9 + Math.PI); }) });
    b.plat({ x: 0, y: 8.5, z: -185, w: 4, d: 4, h: 0.6, style: 'metal', motion: t0((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.plat({ x: 0, y: 12, z: -192, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 12, -191);

    // FINAL CROSSFIRE + GEYSER TO THE PEAK
    b.plat({ x: 0, y: 12, z: -205, w: 4, d: 18, style: 'basalt' });
    [-200, -208].forEach((z, i) => {
      const s = i % 2 === 0 ? -1 : 1;
      b.cannon({ x: s * 6, y: 13, z, dir: -s, range: 12, speed: 12, period: 2.0, phase: i * 1.0 });
      b.post(s * 6, 0, 12.2, z, false, b.M.basalt, 0.6);
    });
    b.geyser({ x: 0, y: 12, z: -216, w: 4, d: 4, bounce: 18, push: { x: 0, z: -8 } });
    b.bonusFinish(['grindRail', 'bulletTime'], 0, 17, -230, 12, 16, 20);
  },
};
