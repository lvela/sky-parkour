// LEVEL 38 — BOSS: The Void Emperor. Cross the edge of the universe and smash eight crystals.
import * as THREE from 'three';
import { Boss } from '../boss.js';
import { boxGeo } from '../textures.js';
import { buildArena, polar, spiral, spine } from './arena.js';

const ARENA = { cx: 0, cz: -195, y0: 24 };

const TOWERS = [
  // SPINNING SHAFT — wall jump up the turning walls, leap out to the crystal
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -135, 14.5), v = p.v;
    b.spinWalls({ x: p.x, y: y0 + 14, z: p.z, h: 14, speed: 0.45 });
    const top = { x: p.x + v.x * 4.6, y: y0 + 12, z: p.z + v.z * 4.6 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 11.4);
    return { ...top, name: 'SPINNING SHAFT', hint: 'Wall jump up the spinning shaft and leap to the crystal!' };
  },
  // JELLY HOP
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -90, 14.5), v = p.v, u = p.u;
    b.jelly({ x: p.x - v.x * 3.5, y: y0 + 0.3, z: p.z - v.z * 3.5, r: 1.8, bounce: 17, color: 0xff4dff, motion: b.mo((q, t) => { const k = Math.sin(t) * 1; q.x = u.x * k; q.z = u.z * k; }) });
    b.plat({ x: p.x, y: y0 + 6, z: p.z, w: 3.5, d: 3.5, h: 0.6, style: 'panel' });
    b.jelly({ x: p.x + v.x * 3.4, y: y0 + 6.3, z: p.z + v.z * 3.4, r: 1.6, bounce: 17, color: 0x9a4dff });
    const top = { x: p.x + v.x * 7.2, y: y0 + 11.5, z: p.z + v.z * 7.2 };
    b.plat({ ...top, w: 3.5, d: 3.5, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 10.9);
    return { ...top, name: 'JELLY HOP', hint: 'Bounce up the void jellies to the crystal!' };
  },
  // GLITCH STAIRS — each block glitches up level with the next one
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -45, 14.5);
    const s = spiral(p.x, p.z, y0, 8, 1.2);
    s.slice(0, 7).forEach((q, i) => b.glitch({ x: q.x, y: q.y, z: q.z, w: 2.6, d: 2.6, alt: { x: q.x, y: q.y + 1.2, z: q.z }, period: 3, phase: i % 2 ? 1.5 : 0, color: 0xff4dff }));
    const top = s[7];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, p.x, p.z, y0, 9.6);
    return { ...top, name: 'GLITCH STAIRS', hint: 'Hop up the glitching stairs when each block lines up!' };
  },
  // PULSE STAIRS — run the climbing light right past his face
  ({ b, cx, cz, y0 }) => {
    b.pulsePath({ x: cx, y: y0 + 1.2, z0: cz - 5.5, n: 4, rise: 1.2, speed: 4, period: 3.5, window: 0.45, color: 0xff4dff });
    const top = { x: cx, y: y0 + 6, z: cz - 17.5 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 5.4);
    return { ...top, name: 'PULSE STAIRS', hint: 'Climb the light stairs right past the Emperor!' };
  },
  // CAROUSEL — up two steps, catch a bar and fling yourself to the crystal
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 45, 14.5), v = p.v;
    const st = spiral(p.x - v.x * 7, p.z - v.z * 7, y0, 2, 1.2);
    st.forEach((q) => b.plat({ ...q, w: 2.6, d: 2.6, h: 0.6, style: 'panel' }));
    b.carousel({ cx: p.x, y: y0 + 6, cz: p.z, R: 4.5, n: 3, speed: 0.7 });
    const top = { x: p.x + v.x * 7.5, y: y0 + 2.4, z: p.z + v.z * 7.5 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    return { ...top, name: 'VOID CAROUSEL', hint: 'Catch a carousel bar and fling yourself to the crystal!' };
  },
  // FLAME STAIRS
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 90, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q, i) => {
      b.plat({ ...q, w: 2.6, d: 2.6, h: 0.6, style: 'panel' });
      if (i % 2) b.flameJet({ x: q.x, y: q.y, z: q.z, period: 2.2, on: 0.35, phase: i * 0.4, h: 3.5, r: 0.6 });
    });
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, p.x, p.z, y0, 10.8);
    return { ...top, name: 'FLAME STAIRS', hint: 'Climb past the void flames when they die down!' };
  },
  // COLLAPSING SPIRAL
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 135, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q) => b.plat({ ...q, w: 2.6, d: 2.6, h: 0.5, style: 'panel', type: 'crumble', crumbleDelay: 0.4 }));
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, p.x, p.z, y0, 10.8);
    return { ...top, name: 'COLLAPSING SPIRAL', hint: 'Race up the collapsing spiral!' };
  },
];

export default {
  id: 'void',
  name: 'The Void Emperor',
  tagline: 'BOSS: at the edge of the universe. Eight crystals, every attack, and a vortex that drags you in.',
  exposure: 1.0,
  sky: {
    mode: 'gradient', light: { elev: 30, az: 20 },
    zen: [0.001, 0, 0.004], hor: [0.02, 0.004, 0.03], glow: [0.3, 0.05, 0.4], glowPow: 4, glowAmt: 0.5,
    cov: 2, cirrus: 0, stars: 1.5, milky: 1.4, nebula: 1.3, space: true,
    planet: { elev: 18, az: 170, size: 24, bright: 0.8, a: [0.5, 0.2, 0.8], b: [0.15, 0.05, 0.3], tilt: 0.5 },
  },
  light: { color: 0xe0c0ff, intensity: 2.2 }, envIntensity: 1.5, fog: 0.0004,
  hemi: { sky: 0x6030a0, ground: 0x0a0414, intensity: 0.6 },
  theme: {
    top: { p: 'hex', a: '#120a1e', b: ['#1a0e2a', '#0a0612'], line: '#ff4dff', glow: true, size: 30, seed: 381 }, side: 'panel',
    stone: { p: 'grid', a: '#0a0612', b: ['#140a20'], line: '#9a4dff', n: 4, seed: 382 },
    palette: 'space', neon: 0xff4dff, accent: '#ff4dff',
  },
  scenery: {
    islands: { palette: 'space', trees: false, crystals: true, count: 32, seed: 381 }, sea: false, clouds: false,
    drift: [{ count: 700, color: 0xd08aff, size: 0.07, fall: -0.4, sway: 1.5, additive: true }],
  },
  killY: -60,
  boss: true,

  build(b) {
    const { y0 } = ARENA;
    const jets = (z) => { for (const x of [-0.75, 0.75]) b.flameJet({ x, y: 0, z, period: 2.2, on: 0.4, phase: z * 0.08 }); };
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE VOID EMPEROR', 'Eight crystals. When he inhales, run AWAY from him!', 0, '#ff4dff');

    // VOID FLAMES
    b.plat({ x: 0, y: 0, z: -25, w: 3, d: 34, style: 'panel' });
    [-15, -23, -31, -39].forEach(jets);
    b.plat({ x: 0, y: 0, z: -47, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -47);

    // GLITCH STREAM
    b.sign(3, 0, -45, 'GLITCH STREAM', 'Ride the glitching blocks up.', 0, '#4dfff0');
    [[0.8, -55.5], [2.8, -61.5], [4.8, -67.5]].forEach(([y, z], i) => b.glitch({ x: 0, y, z, alt: { x: 0, y: y + 2, z }, period: 3, phase: i % 2 ? 1.5 : 0 }));
    b.plat({ x: 0, y: 6.8, z: -74.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 6.8, -74.5);

    // COLLAPSE
    b.sign(-3, 6.8, -72.5, 'EVENT HORIZON', 'The path collapses behind you. Run!', 0, '#ff8a3a');
    b.collapse({ x: 0, y: 6.8, z0: -79.8, n: 10, xs: [0, 1.2, 0, -1.2], ys: Array.from({ length: 10 }, (_, i) => i * 0.4), interval: 0.42, lead: 0.8 });
    b.plat({ x: 0, y: 10.4, z: -112.1, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 10.4, -112.1);

    // STARLIGHT — a jelly bounce, then a rising wave of light
    b.sign(3, 10.4, -110.1, 'STARLIGHT', 'Bounce up, then run with the rising light.', 0, '#ffd84d');
    b.jelly({ x: 0, y: 10.7, z: -117.4, bounce: 18, color: 0xff4dff });
    b.plat({ x: 0, y: 16.4, z: -127, w: 6, d: 6, style: 'panel' });
    b.checkpoint(0, 16.4, -127);
    b.pulsePath({ x: 0, y: 16.95, z0: -131.2, n: 8, rise: 0.55, speed: 5, period: 4, window: 0.42, color: 0xff4dff });

    // THE LAST SHAFT — up to the throne
    b.plat({ x: 0, y: 20.8, z: -158, w: 6, d: 8, style: 'panel' });
    b.checkpoint(0, 20.8, -155.5);
    b.sign(-3.5, 20.8, -155, 'THE LAST SHAFT', 'Up the spinning shaft to the Emperor\'s throne.', 0, '#ff8a4a');
    b.spinWalls({ x: 0, y: 34.8, z: -158.5, h: 14, speed: 0.45 });
    b.plat({ x: 0, y: y0, z: -168, w: 6, d: 10, style: 'panel' });

    buildArena(b, ARENA, 'trim');
    b.world.boss = new Boss(b, {
      ...ARENA, name: 'THE VOID EMPEROR', power: 4, towers: TOWERS,
      colors: { armor: 0x2a1840, dark: 0x0a0612, cape: 0x4a0a6a, eye: 0xff4dff, gem: 0xffffff, crystal: 0xff4dff, trim: 0x9a4dff, wisp: 0xff4dff },
      decorate: (bb, boss) => this.dressBoss(bb, boss),
    });
    this.throne(b);
  },

  // horns and a spinning halo of void energy
  dressBoss(b, boss) {
    const horn = new THREE.MeshStandardMaterial({ color: 0x1a0a24, metalness: 0.6, roughness: 0.3, emissive: 0x40104a });
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 8), horn);
      h.position.set(s * 1.3, 1.9, 0); h.rotation.z = -s * 0.7; boss.head.add(h); boss.parts.push(h);
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.12, 8, 48), new THREE.MeshBasicMaterial({ color: 0xff4dff, toneMapped: false }));
    halo.position.set(0, 3.4, -0.6); halo.rotation.x = 0.3; boss.head.add(halo); boss.parts.push(halo);
    const pull = new THREE.Mesh(new THREE.TorusGeometry(1, 0.15, 8, 64), new THREE.MeshBasicMaterial({ color: 0xb04dff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pull.rotation.x = Math.PI / 2; pull.position.set(boss.c.x, boss.y0 + 0.6, boss.c.z); b.add(pull);
    b.world.anim.push((t) => {
      halo.rotation.z = t * 1.5;
      // the inhale: rings rush in toward him
      if (boss.anim.pull > 0) { const k = 1 - ((t * 1.2) % 1); pull.scale.setScalar(2 + k * 16); pull.material.opacity = 0.8 * (1 - k * 0.6); } else pull.material.opacity = 0;
    });
  },

  // floating obsidian shards round the arena
  throne(b) {
    const { cx, cz, y0 } = ARENA;
    const base = new THREE.Mesh(new THREE.ConeGeometry(28, 80, 7), b.M.side); base.rotation.x = Math.PI; base.position.set(cx, y0 - 14 - 40, cz); b.add(base);
    const shardMat = new THREE.MeshStandardMaterial({ color: 0x1a0a24, metalness: 0.5, roughness: 0.3, emissive: 0x30104a, flatShading: true });
    const shards = [];
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * Math.PI * 2, r = 32 + (k % 3) * 8;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(2 + (k % 4), 0), shardMat);
      m.scale.y = 2.2; m.position.set(cx + Math.cos(a) * r, y0 + (k % 5) * 6 - 6, cz + Math.sin(a) * r); b.add(m); shards.push({ m, a, r, y: m.position.y });
    }
    b.world.anim.push((t) => shards.forEach((s, i) => { const a = s.a + t * 0.05; s.m.position.set(cx + Math.cos(a) * s.r, s.y + Math.sin(t + i) * 1.5, cz + Math.sin(a) * s.r); s.m.rotation.y = t * 0.3 + i; }));
    const keep = new THREE.Mesh(boxGeo(38, 30, 38, 6), b.M.side); keep.position.set(cx, y0 - 14 - 15, cz); b.add(keep);
  },
};
