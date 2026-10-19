// LEVEL 23 — Autumn Canopy: golden treetops in the afternoon sun. New: swaying and spinning balance beams.
export default {
  id: 'autumn',
  name: 'Autumn Canopy',
  tagline: 'Balance on swaying beams and spinning logs high in the golden treetops.',
  exposure: 0.48,
  sky: { mode: 'physical', light: { elev: 18, az: 100 }, turbidity: 4, rayleigh: 1.8, cov: 0.55, cirrus: 1.1, tint: [1.15, 0.95, 0.8] },
  light: { color: 0xffd8a0, intensity: 3.2 }, envIntensity: 0.9, fog: 0.0012,
  theme: {
    top: { p: 'speckle', a: '#9a6a2a', b: ['#c8742a', '#e8a03a', '#8a3a1a', '#b8501a'], seed: 231 }, side: 'dirt', stone: 'wood',
    palette: 'day', accent: '#ff9a3a',
  },
  scenery: {
    islands: { palette: 'day', leafHue: 0.06, leafSat: 0.8, leafLight: 0.45, count: 28, seed: 231 }, sea: {}, clouds: { count: 70 }, birds: true,
    drift: [{ count: 600, color: 0xe8802a, size: 0.14, fall: 1.4, sway: 2.5 }],
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'AUTUMN CANOPY', 'Narrow beams between the treetops. Some sway, some spin!', 0, '#ff9a3a');
    b.tree(5.5, 0, 5, 1.2); b.tree(-6, 0, 5.5, 1.0);

    // BALANCE BEAMS — still, then swaying
    b.beam({ x: 0, y: 0, z: -15.5, len: 13 });
    b.plat({ x: 0, y: 0, z: -24.5, w: 3, d: 3, style: 'trim' });
    b.beam({ x: 0, y: 0, z: -33, len: 12, amp: 0.8, period: 3 });
    b.plat({ x: 0, y: 0, z: -41.5, w: 3, d: 3, style: 'trim' });
    b.beam({ x: 0, y: 0, z: -49.5, len: 12, amp: 1.2, period: 2.6 });
    b.plat({ x: 0, y: 0, z: -61, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -61);

    // SPINNING LOGS
    b.sign(3, 0, -59, 'SPINNING LOGS', 'The logs spin round. Hop on when one points your way.', 0, '#ffd84d');
    b.beam({ x: 0, y: 0, z: -72, len: 12, w: 0.8, spin: 0.6 });
    b.beam({ x: 0, y: 0, z: -87, len: 12, w: 0.8, spin: -0.7 });
    b.plat({ x: 0, y: 0, z: -99, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -99);

    // CANOPY BARS
    b.sign(-3, 0, -97, 'CANOPY BARS', 'Swing along the branches. Some of them move.', 0, '#ffd84d');
    b.bar(0, 3.6, -105.5, 3);
    b.bar(0, 3.6, -110.5, 3, b.mo((v, t) => { v.y = Math.sin(t * 1.4); }));
    b.bar(0, 3.6, -115.5, 3, b.mo((v, t) => { v.x = Math.sin(t * 1.1) * 2; }));
    b.bar(0, 3.6, -120.5, 3, b.mo((v, t) => { v.y = Math.sin(t * 1.4 + Math.PI); }));
    b.plat({ x: 0, y: 0, z: -127, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -127);

    // FALLING LEAVES — crumbling leaf platforms climbing up
    b.sign(3, 0, -125, 'FALLING LEAVES', 'The leaves crumble under you. Keep climbing!', 0, '#ff6a2a');
    for (let i = 0; i < 5; i++) b.plat({ x: i % 2 ? 0.8 : -0.8, y: 0.8 + i * 0.8, z: -134 - i * 5, w: 2.6, d: 2.6, h: 0.4, style: 'crumble', type: 'crumble' });
    b.plat({ x: 0, y: 4.5, z: -163, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 4.5, -163);

    // THE BIG OAK — one last swaying beam
    b.sign(-3, 4.5, -161, 'THE BIG OAK', 'One last swaying branch to the finish.', 0, '#ff9a3a');
    b.beam({ x: 0, y: 4.5, z: -173, len: 12, amp: 1.0, period: 2.4 });
    b.finish(0, 4.5, -185, 12, 12, 16);
    for (const [tx, tz, s] of [[-4.5, -189, 1.4], [4.6, -188, 1.1]]) b.tree(tx, 4.5, tz, s);
  },
};
