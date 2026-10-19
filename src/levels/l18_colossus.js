// LEVEL 18 — BOSS: The Clockwork Colossus. Climb the foundry, then smash six crystals on its machine towers.
import * as THREE from 'three';
import { Boss } from '../boss.js';
import { boxGeo } from '../textures.js';
import { buildArena, polar, spiral, spine } from './arena.js';

const ARENA = { cx: 0, cz: -155, y0: 20 };
const FOUNDRY = { soil: 0x3a2e24, rockA: 0x4a4038, rockB: 0x5e5248, dark: 0x221c16, grassA: 0x6a5030, grassB: 0x8a6a3a };

// Five machine towers, each a different parkour puzzle (see Boss / SKY_KING_TOWERS for the format).
const TOWERS = [
  // PISTON SPIRAL — each piston tops out level with the next one's lowest point
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -120, 14);
    const s = spiral(p.x, p.z, y0 - 1.2, 7, 1.6);
    s.slice(0, 6).forEach((q, i) => b.piston({ x: q.x, y: q.y, z: q.z, w: 2.4, d: 2.4, h: 1.2, amp: 1.6, period: 3, phase: -i * 1.1 }));
    const top = s[6];
    b.plat({ x: top.x, y: top.y + 0.4, z: top.z, w: 3, d: 3, h: 0.6, style: 'metal' });
    spine(b, p.x, p.z, y0, 9);
    return { x: top.x, y: top.y + 0.4, z: top.z, name: 'PISTON SPIRAL', hint: 'Ride the pistons round and up to the crystal!' };
  },
  // CLICK-CLACK SPIRAL — every jump swaps which steps are solid
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -60, 14);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q, i) => b.clickClack({ x: q.x, y: q.y, z: q.z, w: 2.4, d: 2.4, red: i % 2 === 1 }));
    const top = s[8];
    b.plat({ x: top.x, y: top.y, z: top.z, w: 3, d: 3, h: 0.6, style: 'metal' });
    spine(b, p.x, p.z, y0, 10);
    return { x: top.x, y: top.y, z: top.z, name: 'CLICK-CLACK SPIRAL', hint: 'Climb the swapping red and blue steps!' };
  },
  // STEAM BELLOWS — two springy caps up to a high perch
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 0, 14), v = p.v;
    b.mushroom({ x: p.x - v.x * 3.5, y: y0 + 0.3, z: p.z - v.z * 3.5, r: 2, bounce: 17, color: 0xc89a3c, stem: 0 });
    b.plat({ x: p.x, y: y0 + 6, z: p.z, w: 3.5, d: 3.5, h: 0.6, style: 'metal' });
    b.mushroom({ x: p.x + v.x * 3.4, y: y0 + 6.3, z: p.z + v.z * 3.4, r: 1.8, bounce: 17, color: 0xc89a3c, stem: 6 });
    const t = { x: p.x + v.x * 7.2, y: y0 + 11.5, z: p.z + v.z * 7.2 };
    b.plat({ x: t.x, y: t.y, z: t.z, w: 3.5, d: 3.5, h: 0.6, style: 'metal' });
    spine(b, t.x, t.z, y0, 10.9);
    return { ...t, name: 'STEAM BELLOWS', hint: 'Bounce on the brass bellows up to the high perch!' };
  },
  // EXHAUST FAN — float up a column of hot air
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 60, 14), v = p.v;
    b.updraft({ x: p.x - v.x * 2, y: y0, z: p.z - v.z * 2, h: 13 });
    const t = { x: p.x + v.x * 1.5, y: y0 + 10, z: p.z + v.z * 1.5 };
    b.plat({ x: t.x, y: t.y, z: t.z, w: 3, d: 3, h: 0.6, style: 'metal' });
    spine(b, t.x, t.z, y0, 9.4);
    return { ...t, name: 'EXHAUST FAN', hint: 'Float up the exhaust fan to the crystal!' };
  },
  // PISTONS & GEARS — alternating up a spiral
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 120, 14);
    const s = spiral(p.x, p.z, y0, 7, 1);
    [[0, 'piston', 1], [1, 'gear', 3], [2, 'piston', 4], [3, 'gear', 6], [4, 'piston', 7], [5, 'gear', 9]].forEach(([i, kind, h], k) => {
      const q = s[i];
      if (kind === 'piston') b.piston({ x: q.x, y: y0 + h, z: q.z, w: 2.4, d: 2.4, h: 1.2, amp: 2, period: 3.2, phase: k });
      else b.gear({ x: q.x, y: y0 + h, z: q.z, r: 1.8, speed: k % 4 === 1 ? 0.8 : -0.8 });
    });
    const top = s[6];
    b.plat({ x: top.x, y: y0 + 10, z: top.z, w: 3, d: 3, h: 0.6, style: 'metal' });
    spine(b, p.x, p.z, y0, 10);
    return { x: top.x, y: y0 + 10, z: top.z, name: 'PISTONS & GEARS', hint: 'Piston, gear, piston, gear… up to the crystal!' };
  },
];

export default {
  id: 'colossus',
  name: 'The Clockwork Colossus',
  tagline: 'BOSS: climb the foundry and shut down the Colossus. Six crystals, angrier machines.',
  exposure: 0.55,
  sky: {
    mode: 'physical', light: { elev: 3, az: 120 }, turbidity: 8, rayleigh: 3, mie: 0.012, mieG: 0.88,
    cov: 0.55, cirrus: 1.0, cloudBright: 0.8, tint: [1.3, 0.75, 0.55],
  },
  light: { color: 0xffa060, intensity: 2.8 }, envIntensity: 1.0, fog: 0.0016,
  hemi: { sky: 0x6a4030, ground: 0x302018, intensity: 0.5 },
  theme: {
    top: { p: 'tiles', a: '#6a5a4a', b: ['#7a6a58', '#5a4a3c', '#8a7a64'], line: 'rgba(20,14,8,0.7)', n: 4, seed: 181 },
    side: { p: 'speckle', a: '#3a3430', b: ['#2a2420', '#4a423a', '#6a4a30'], seed: 182 }, stone: 'metal',
    palette: FOUNDRY, accent: '#ffb040',
  },
  scenery: {
    islands: { palette: FOUNDRY, trees: false, count: 18, seed: 181 }, sea: {}, clouds: { count: 60 }, embers: true,
  },
  killY: -30,
  boss: true,

  build(b) {
    const { cx, cz, y0 } = ARENA;
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE COLOSSUS', 'A giant machine guards the foundry. Six crystals power it. Smash them all!', 0, '#ffb040');

    // INTAKE BELT — against the flow, through the lasers
    b.sign(3, 0, -5, 'INTAKE BELT', 'The belt runs backwards and the lasers switch on and off.', 0, '#ff2a4a');
    b.conveyor({ x: 0, y: 0, z: -24, w: 3, d: 30, speed: -3 });
    b.laser({ x: 0, y: 0, z: -17, w: 3, period: 2.2, on: 0.45 });
    b.laser({ x: 0, y: 0, z: -27, w: 3, period: 2.2, on: 0.45, phase: -1.1 });
    b.plat({ x: 0, y: 0, z: -44, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -44);

    // PISTON STACK
    b.sign(3, 0, -42, 'PISTON STACK', 'Each piston tops out level with the next one\'s lowest point.', 0, '#ff8a4a');
    for (let i = 0; i < 4; i++) b.piston({ x: 0, y: 1 + i * 1.6, z: -51 - i * 4.2, w: 2.4, d: 2.4, amp: 1.6, period: 3, phase: -i * 1.1 });
    b.plat({ x: 0, y: 7.4, z: -70, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 7.4, -70);

    // FLYWHEEL & DASH
    b.sign(-2.6, 7.4, -68, 'FLYWHEEL', 'Over the flywheel, then let the dash pad throw you across.', 0, '#3dffb0');
    b.gear({ x: 0, y: 7.4, z: -78.5, r: 2.6, speed: 0.8 });
    b.dashPad({ x: 0, y: 7.4, z: -84.5, push: { x: 0, z: -15 }, bounce: 8 });
    b.plat({ x: 0, y: 7.4, z: -97, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 7.4, -97);

    // EXHAUST + SWAPPING STEPS to the arena
    b.sign(3, 7.4, -95, 'EXHAUST', 'Float up the hot air, then climb the swapping steps to the Colossus.', 0, '#bfeaff');
    b.updraft({ x: 0, y: 7.4, z: -105.5, h: 12.6 });
    b.plat({ x: 0, y: 17, z: -110.5, w: 6, d: 6, style: 'island', rock: true });
    b.checkpoint(0, 17, -110.5);
    [18, 19, 20].forEach((y, i) => b.clickClack({ x: 0, y, z: -118 - i * 5, red: i % 2 === 1 }));
    b.plat({ x: 0, y: 20, z: -132, w: 4, d: 4, style: 'metal' });

    buildArena(b, ARENA, 'trim');
    b.world.boss = new Boss(b, {
      ...ARENA, name: 'THE CLOCKWORK COLOSSUS', power: 2, towers: TOWERS,
      colors: { armor: 0xc89a3c, dark: 0x3a3028, cape: 0x23384f, eye: 0x4dffff, gem: 0x4dffff, crystal: 0xffb040, trim: 0xe8e0d0, wisp: 0xffb040 },
      decorate: (bb, boss) => this.dressBoss(bb, boss),
    });
    this.foundry(b);
  },

  // shoulder cogs that spin, and a smokestack on its back
  dressBoss(b, boss) {
    const brass = b.brass();
    boss.arms.forEach((arm, k) => {
      const cog = new THREE.Group(); cog.position.set(0, 1.4, 0); arm.add(cog);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 16), brass); cog.add(disc); boss.parts.push(disc);
      for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(boxGeo(0.4, 0.4, 0.5, 1), brass); const a = i / 8 * Math.PI * 2; t.position.set(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25); cog.add(t); boss.parts.push(t); }
      b.world.anim.push((t) => { cog.rotation.y = t * (k ? 2 : -2); });
    });
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4, 12), b.M.iron);
    stack.position.set(0, 10.5, -1.9); boss.root.add(stack); boss.parts.push(stack);
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5, depthWrite: false }));
    boss.root.add(smoke);
    b.world.anim.push((t) => { const u = (t * 0.7) % 1; smoke.position.set(0, 12.8 + u * 4, -1.9 - u); smoke.scale.setScalar(0.6 + u * 1.8); smoke.material.opacity = 0.5 * (1 - u); });
  },

  // chimneys, furnace glow and slow background gears around the arena
  foundry(b) {
    const { cx, cz, y0 } = ARENA;
    const fire = new THREE.MeshBasicMaterial({ color: 0xff7a20, toneMapped: false });
    const keep = new THREE.Mesh(boxGeo(38, 70, 38, 6), b.M.side); keep.position.set(cx, y0 - 14 - 35, cz); b.add(keep);
    for (const [x, z, h] of [[-26, -132, 46], [27, -140, 52], [-30, -178, 60], [28, -180, 40]]) {
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, h, 12), b.M.stone); ch.position.set(cx + x, y0 - 20 + h / 2, z); b.add(ch);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.3, 8, 20), fire); rim.rotation.x = Math.PI / 2; rim.position.set(cx + x, y0 - 20 + h, z); b.add(rim);
    }
    for (const [x, y, z, r, s] of [[-45, y0 + 5, cz - 10, 12, 0.15], [46, y0 - 2, cz + 15, 14, -0.1]]) {
      const holder = new THREE.Group(); holder.position.set(x, y, z); holder.rotation.z = Math.PI / 2; b.add(holder);
      const g = new THREE.Group(); holder.add(g);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 32), b.brass()));
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.8), b.brass()); t.position.set(Math.cos(a) * (r + 0.7), 0, Math.sin(a) * (r + 0.7)); t.rotation.y = -a; g.add(t); }
      b.world.anim.push((t) => { g.rotation.y = t * s; });
    }
  },
};
