// LEVEL 28 — BOSS: The Crystal Titan. Storm the frost citadel under the aurora and smash seven crystals.
import * as THREE from 'three';
import { Boss } from '../boss.js';
import { boxGeo } from '../textures.js';
import { buildArena, polar, spiral, spine } from './arena.js';

const ARENA = { cx: 0, cz: -160, y0: 22 };

const TOWERS = [
  // BARREL BLAST — fired up in two stages, the second barrel slides about
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -135, 14.5), v = p.v, u = p.u;
    const at = (s, y) => ({ x: p.x + v.x * s, y, z: p.z + v.z * s });
    const mid = at(0, y0 + 6), top = at(6, y0 + 12);
    b.barrel({ ...at(-4, y0 + 1.2), to: mid });
    b.plat({ ...mid, w: 3.5, d: 3.5, h: 0.6, style: 'ice', type: 'solid' });
    b.barrel({ ...at(1.2, y0 + 7.2), to: top, motion: (t) => { const k = Math.sin(t * 1.2) * 1.5; return { x: u.x * k, z: u.z * k }; } });
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, top.x, top.z, y0, 11.4);
    return { ...top, name: 'BARREL BLAST', hint: 'Blast up in the barrels to the crystal!' };
  },
  // SHRINKING SPIRAL
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -81, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q, i) => b.shrinkPad({ x: q.x, y: q.y, z: q.z, w: 2.6, d: 2.6, period: 3.5, phase: -i * 0.45, min: 0.15 }));
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, p.x, p.z, y0, 10.8);
    return { ...top, name: 'SHRINKING SPIRAL', hint: 'Climb the shrinking crystal pads!' };
  },
  // PORTAL PERCH — a portal up to a high perch, then shrinking pads out over the arena
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -27, 14.5);
    b.portal({ a: { x: p.x, y: y0, z: p.z + 4 }, b: { x: p.x, y: y0 + 12, z: p.z } });
    b.plat({ x: p.x, y: y0 + 12, z: p.z - 0.5, w: 4, d: 4, h: 0.6, style: 'ice', type: 'solid' });
    b.shrinkPad({ x: p.x, y: y0 + 12, z: p.z + 4, w: 3, d: 3, period: 3, min: 0.2 });
    b.shrinkPad({ x: p.x, y: y0 + 12, z: p.z + 9, w: 3, d: 3, period: 3, phase: -1, min: 0.2 });
    const top = { x: p.x, y: y0 + 12, z: p.z + 14 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, p.x, p.z - 0.5, y0, 11.4);
    return { ...top, name: 'PORTAL PERCH', hint: 'Walk through the portal, then cross the shrinking pads!' };
  },
  // CRUSHER STAIRS
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 27, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q, i) => {
      b.plat({ ...q, w: 2.6, d: 2.6, h: 0.6, style: 'ice', type: 'solid' });
      if (i === 2 || i === 5) b.crusher({ x: q.x, y: q.y, z: q.z, w: 2.4, d: 2.4, top: 2.8, period: 2.6, phase: i * 0.4, solidFrame: false });
    });
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, p.x, p.z, y0, 10.8);
    return { ...top, name: 'CRUSHER STAIRS', hint: 'Time your way up the stairs under the crushers!' };
  },
  // RETRACTING RUNGS — up a short spiral, then across bars that pull back
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 81, 14.5);
    const s = spiral(p.x, p.z, y0, 6, 1.2);
    s.slice(0, 5).forEach((q) => b.plat({ ...q, w: 2.6, d: 2.6, h: 0.6, style: 'ice', type: 'solid' }));
    const l = s[5];
    b.plat({ ...l, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    b.retractBar(l.x, l.y + 3.6, l.z - 4, 3, { period: 3, on: 0.6 });
    b.retractBar(l.x, l.y + 3.6, l.z - 9, 3, { period: 3, on: 0.6, phase: -0.8 });
    const top = { x: l.x, y: l.y, z: l.z - 13 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, top.x, top.z, y0, l.y - y0 - 0.6);
    return { ...top, name: 'RETRACTING RUNGS', hint: 'Swing across the bars before they pull back!' };
  },
  // SPINNING LOGS
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 135, 14.5);
    const s = spiral(p.x, p.z, y0, 7, 1.2);
    s.slice(0, 6).forEach((q, i) => b.beam({ ...q, len: 5, w: 0.8, spin: i % 2 ? -0.9 : 0.9, style: 'ice' }));
    const top = s[6];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'ice', type: 'solid' });
    spine(b, p.x, p.z, y0, 8.4);
    return { ...top, name: 'SPINNING LOGS', hint: 'Hop up the spinning ice logs!' };
  },
];

export default {
  id: 'titan',
  name: 'The Crystal Titan',
  tagline: 'BOSS: storm the frost citadel and shatter the Titan. Seven crystals, meteor storms and homing wisps.',
  exposure: 0.9,
  sky: {
    mode: 'gradient', light: { elev: 35, az: -30 },
    zen: [0.002, 0.006, 0.02], hor: [0.03, 0.07, 0.12], glow: [0.1, 0.2, 0.3], glowPow: 4, glowAmt: 0.4,
    cov: 0.75, cloudBright: 0.35, cloudShade: 0.4, cirrus: 0.4, stars: 1.2, milky: 0.8, tint: [0.8, 0.95, 1.2],
    moon: { elev: 40, az: -30, size: 4, bright: 1.0 },
  },
  light: { color: 0xbfe0ff, intensity: 2.0 }, envIntensity: 1.3, fog: 0.0012,
  hemi: { sky: 0x4070a0, ground: 0x202840, intensity: 0.6 },
  theme: { top: 'snow', side: { p: 'speckle', a: '#8fa6bd', b: ['#6f86a0', '#9fb6cc', '#c8dcf0'], lip: '#eef4fb', seed: 281 }, stone: 'ice', palette: 'ice', accent: '#8fd8ff' },
  scenery: { islands: { palette: 'ice', leafHue: 0.4, leafLight: 0.18, count: 22, seed: 281 }, sea: {}, clouds: { count: 60 }, snow: true, aurora: true },
  killY: -30,
  boss: true,

  build(b) {
    const { cx, cz, y0 } = ARENA;
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE CRYSTAL TITAN', 'Seven crystals keep the Titan alive. Climb the citadel and shatter them all!', 0, '#8fd8ff');

    // ICE CAUSEWAY — rolling ice logs
    b.sign(3, 0, -5, 'ICE CAUSEWAY', 'Jump the ice logs rolling at you.', 0, '#8fd8ff');
    b.plat({ x: 0, y: 0, z: -24, w: 4, d: 32, style: 'ice' });
    b.logs({ x: 0, y: 0, z0: -9, z1: -39, w: 4, speed: 7, gap: 2, count: 3 });
    b.plat({ x: 0, y: 0, z: -45, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -45);

    // BARREL LIFT
    b.sign(3, 0, -43, 'BARREL LIFT', 'Two barrels blast you up the cliff.', 0, '#ffd84d');
    b.barrel({ x: 0, y: 1.2, z: -47.5, to: { x: 0, y: 8, z: -62 } });
    b.plat({ x: 0, y: 8, z: -63, w: 5, d: 5, style: 'island', rock: true, rockDepth: 4 });
    b.barrel({ x: 0, y: 9.2, z: -65, to: { x: 0, y: 15, z: -80 } });
    b.plat({ x: 0, y: 15, z: -82, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 15, -82);

    // FROST PADS
    b.sign(-3, 15, -80, 'FROST PADS', 'The pads shrink away in turn. Keep up with them!', 0, '#8fd8ff');
    [-90.25, -96.25, -102.25, -108.25].forEach((z, i) => b.shrinkPad({ x: 0, y: 15, z, period: 3.5, phase: -i * 0.9, style: 'ice' }));
    b.plat({ x: 0, y: 15, z: -117, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 15, -117);

    // THE GATE — a swaying beam, then a portal up to the citadel
    b.sign(3, 15, -115, 'THE GATE', 'Cross the swaying beam and take the portal up to the Titan.', 0, '#b04dff');
    b.beam({ x: 0, y: 15, z: -127, len: 12, amp: 0.8, period: 3, style: 'ice' });
    b.plat({ x: 0, y: 15, z: -136.5, w: 4, d: 4, style: 'trim' });
    b.portal({ a: { x: 0, y: 15, z: -138 }, b: { x: 0, y: y0, z: -132 } });
    b.plat({ x: 0, y: y0, z: -134, w: 6, d: 6, style: 'trim' });

    buildArena(b, ARENA, 'trim');
    b.world.boss = new Boss(b, {
      ...ARENA, name: 'THE CRYSTAL TITAN', power: 3, towers: TOWERS,
      colors: { armor: 0x9fd8ff, dark: 0x2a4a6a, cape: 0xe8f4ff, eye: 0x7af7ff, gem: 0x4dc8ff, crystal: 0xb48cff, trim: 0xe0e8f0, wisp: 0x7af7ff },
      decorate: (bb, boss) => this.dressBoss(bb, boss),
    });
    this.citadel(b);
  },

  // ice spikes on the shoulders and a crown of shards
  dressBoss(b, boss) {
    const ice = new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x4ab0ff, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 });
    boss.arms.forEach((arm) => {
      for (let k = 0; k < 3; k++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2 + k * 0.5, 6), ice);
        sp.position.set((k - 1) * 0.7, 1.4 + k * 0.2, 0); sp.rotation.z = (k - 1) * -0.4; arm.add(sp); boss.parts.push(sp);
      }
    });
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.4, 6), ice);
      const a = (k / 5) * Math.PI * 2;
      sp.position.set(Math.cos(a) * 1.1, 3.4, Math.sin(a) * 1.1); sp.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
      boss.head.add(sp); boss.parts.push(sp);
    }
  },

  // frosted keep under the arena and ice towers around it
  citadel(b) {
    const { cx, cz, y0 } = ARENA;
    const ice = new THREE.MeshStandardMaterial({ color: 0xcfeaff, roughness: 0.2, metalness: 0.1, emissive: 0x1a4a80, emissiveIntensity: 0.3 });
    const keep = new THREE.Mesh(boxGeo(38, 70, 38, 6), b.M.side); keep.position.set(cx, y0 - 14 - 35, cz); b.add(keep);
    for (const [x, z, r, h] of [[-26, -136, 4, 50], [26, -138, 4.5, 56], [-27, -184, 5, 62], [27, -183, 4, 44], [-45, -160, 6, 80], [46, -150, 7, 70]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 8), ice); t.position.set(cx + x, y0 - 40 + h / 2, z); b.add(t);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(r, r * 3, 8), ice); tip.position.set(cx + x, y0 - 40 + h + r * 1.5, z); b.add(tip);
    }
  },
};
