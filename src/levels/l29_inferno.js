// LEVEL 29 — Inferno Forge: a forge floating over a lava sea under a burning sky. New: flame jets.
export default {
  id: 'inferno',
  name: 'Inferno Forge',
  tagline: 'Flame jets, crushers and furnace belts over a sea of lava. The heat is on.',
  exposure: 0.85,
  sky: {
    mode: 'gradient', light: { elev: 20, az: -60 },
    zen: [0.04, 0.005, 0.005], hor: [0.4, 0.06, 0.02], glow: [0.8, 0.2, 0.02], glowPow: 3, glowAmt: 0.9,
    cov: 0.4, cloudBright: 0.4, cloudShade: 0.4, cirrus: 0.3, tint: [1.4, 0.5, 0.3],
  },
  light: { color: 0xff7a40, intensity: 1.8 }, envIntensity: 1.2, fog: 0.003,
  hemi: { sky: 0x801a10, ground: 0xff4010, intensity: 0.8 },
  theme: {
    top: { p: 'cracks', a: '#1e1414', b: ['#2a1a18', '#140c0c'], line: '#ff5a10', glow: true, seed: 291 }, side: 'basalt', stone: 'basalt',
    palette: 'volcano', accent: '#ff7a20',
  },
  scenery: { islands: { palette: 'volcano', trees: false, count: 16, seed: 291 }, sea: { y: -60, lava: true }, clouds: { count: 40, seaY: -60 }, embers: true },
  killY: -40,

  build(b) {
    const jets = (z, o) => { for (const x of [-0.75, 0.75]) b.flameJet({ x, y: o.y ?? 0, z, period: o.period, on: o.on ?? 0.4, phase: o.phase ?? 0 }); };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'INFERNO FORGE', 'Vents flicker just before they blast fire. You can\'t jump over the flames!', 0, '#ff7a20');

    // FLAME CORRIDOR
    b.plat({ x: 0, y: 0, z: -25, w: 3, d: 34, style: 'basalt' });
    [-14, -20, -26, -32, -38].forEach((z, i) => jets(z, { period: 2.4, phase: -i * 0.5 }));
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // FURNACE BELT — a backwards belt through the flames
    b.sign(3, 0, -45, 'FURNACE BELT', 'The belt drags you back toward the fire. Keep running!', 0, '#ffcf3a');
    b.conveyor({ x: 0, y: 0, z: -66, w: 3, d: 28, speed: -3 });
    [-58, -66, -74].forEach((z, i) => jets(z, { period: 2.2, on: 0.45, phase: i * 0.7 }));
    b.plat({ x: 0, y: 0, z: -85, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -85);

    // MOLTEN PRESS — crushers and flames
    b.sign(-3, 0, -83, 'MOLTEN PRESS', 'Crusher, flames, crusher, flames.', 0, '#ff5a2a');
    b.plat({ x: 0, y: 0, z: -104, w: 3.2, d: 28, style: 'basalt' });
    b.crusher({ x: 0, y: 0, z: -95, period: 2.4 });
    jets(-101, { period: 2.2, phase: 0.5 });
    b.crusher({ x: 0, y: 0, z: -107, period: 2.2, phase: 1 });
    jets(-113, { period: 2.0, phase: 1.2 });
    b.plat({ x: 0, y: 0, z: -123, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -123);

    // LAVA LIFTS under cannon fire
    b.sign(3, 0, -121, 'LAVA LIFTS', 'Ride the lifts up while cannons fire across them.', 0, '#ffb040');
    b.plat({ x: 0, y: 0, z: -131, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.plat({ x: 0, y: 4, z: -137, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9 + Math.PI); }) });
    b.plat({ x: 0, y: 8, z: -143, w: 4, d: 4, h: 0.6, style: 'metal', motion: b.mo((v, t) => { v.y = 2 + 2 * Math.sin(t * 0.9); }) });
    b.cannon({ x: 7, y: 5, z: -137, dir: -1, range: 14, speed: 11, period: 2.6 });
    b.cannon({ x: -7, y: 9, z: -143, dir: 1, range: 14, speed: 11, period: 2.6, phase: 1.3 });
    b.post(7, -10, 4.4, -137, false, b.M.basalt, 0.6); b.post(-7, -10, 8.4, -143, false, b.M.basalt, 0.6);
    b.plat({ x: 0, y: 11.5, z: -150, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 11.5, -150);

    // FORGE HEART — dash over a flame vent, then up the burning steps
    b.sign(-3, 11.5, -148, 'FORGE HEART', 'Dash over the vent while it\'s quiet, then climb the burning steps.', 0, '#ff5a2a');
    b.dashPad({ x: 0, y: 11.5, z: -155.5, push: { x: 0, z: -16 }, bounce: 8 });
    b.plat({ x: 0, y: 9.5, z: -161.5, w: 2, d: 2, style: 'basalt' });
    b.flameJet({ x: 0, y: 9.5, z: -161.5, period: 2.6, on: 0.45, h: 6, r: 0.9 });
    b.plat({ x: 0, y: 11.5, z: -169, w: 6, d: 6, style: 'basalt', rock: true, rockDepth: 5 });
    b.plat({ x: 0, y: 12.7, z: -176, w: 3, d: 3, style: 'basalt' });
    b.flameJet({ x: 0, y: 12.7, z: -176, period: 2, on: 0.35 });
    b.plat({ x: 0, y: 13.9, z: -181, w: 3, d: 3, style: 'basalt' });
    b.flameJet({ x: 0, y: 13.9, z: -181, period: 2, on: 0.35, phase: 1 });
    b.finish(0, 14.5, -191, 12, 12, 16);
  },
};
