// LEVEL 48 — BOSS: The Storm Sovereign. A thunderhead throne above the clouds. Nine crystals, the
// fastest boss yet, and every tower uses a new gadget or trick from worlds 39–47.
import * as THREE from 'three';
import { Boss } from '../boss.js';
import { boxGeo } from '../textures.js';
import { buildArena, polar, spiral, spine } from './arena.js';

const ARENA = { cx: 0, cz: -150, y0: 26 };

const TOWERS = [
  // GRAPPLE SPIRE — pick up the grappler and get pulled up a sheer pillar
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -135, 14.5);
    b.plat({ x: p.x, y: y0 + 12, z: p.z, w: 5, d: 5, h: 12, style: 'trim' });
    b.hook({ x: p.x + 2.72, y: y0 + 11, z: p.z, normal: { x: 1, z: 0 } }); // on the face toward the boss
    b.toolStation({ x: p.x + 6, y: y0, z: p.z - 4, tool: 'grapple' });
    return { x: p.x, y: y0 + 12, z: p.z, name: 'GRAPPLE SPIRE', hint: 'Grab the grappler, then grapple up the spire to the crystal!' };
  },
  // BOOST LAUNCH — run through the ring to be fired up onto the ledge
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 168, 15);
    b.boostRing({ x: p.x, y: y0 + 1.2, z: p.z + 2.5, vel: { x: 0, y: 14, z: -4 }, r: 1.4 });
    const top = { x: p.x, y: y0 + 4, z: p.z - 1.1 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 3.4);
    return { ...top, name: 'BOOST LAUNCH', hint: 'Run through the boost ring and it fires you up to the crystal!' };
  },
  // FERRIS — ride the little wheel up
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -45, 15);
    b.ferris({ x: p.x, y: y0, z: p.z, R: 5, n: 4, speed: 0.35, w: 2.4, d: 2.2 });
    const top = { x: p.x, y: y0 + 10, z: p.z - 3.1 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z - 1, y0, 9.4);
    return { ...top, name: 'STORM WHEEL', hint: 'Ride the storm wheel up and jump to the crystal!' };
  },
  // BALLOON — float up and launch onto the ledge
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 0, 12.5);
    b.balloon({ x: p.x, z: p.z, y0: y0 + 1.9, y1: y0 + 11.9, color: 0x9adfff });
    const top = { x: p.x, y: y0 + 10, z: p.z - 3.75 };
    b.plat({ ...top, w: 3, d: 4.5, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 9.4);
    return { ...top, name: 'STORM BALLOON', hint: 'Grab the balloon, float up and launch to the crystal before it pops!' };
  },
  // SWITCH STAIRS — the upper steps are switched off until you hit the switch halfway up
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 45, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.1);
    s.forEach((q, i) => {
      if (i === 4) b.switchPad({ ...q, channel: 'storm', color: 0xffd84d });
      else if (i < 8) b.switchBlock({ ...q, w: 2.6, d: 2.6, channel: 'storm', on: i < 4, color: i < 4 ? 0x7dff6a : 0xffa040 });
    });
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, p.x, p.z, y0, 9.4);
    return { ...top, name: 'SWITCH STAIRS', hint: 'Climb to the switch halfway up — it turns on the orange steps!' };
  },
  // PHANTOM SPIRAL
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 90, 14.5);
    const s = spiral(p.x, p.z, y0, 9, 1.2);
    s.slice(0, 8).forEach((q) => b.phantom({ ...q, w: 2.6, d: 2.6, reveal: 6, color: 0x9adfff }));
    const top = s[8];
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, p.x, p.z, y0, 10.8);
    return { ...top, name: 'PHANTOM SPIRAL', hint: 'Climb the phantom steps — they appear as you get close!' };
  },
  // STORM TRAIN — carts climb a looping track to the crystal
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, 135, 14.5);
    b.train({ path: [[p.x - 3.5, y0 + 0.3, p.z + 3], [p.x - 3.5, y0 + 9, p.z - 6], [p.x + 2, y0 + 9, p.z - 6], [p.x + 2, y0 + 0.3, p.z + 3]], n: 3, speed: 2.5, color: 0x3a5a8a });
    const top = { x: p.x - 3.5, y: y0 + 9, z: p.z - 9.1 };
    b.plat({ ...top, w: 3, d: 3, h: 0.6, style: 'panel' });
    spine(b, top.x, top.z, y0, 8.4);
    return { ...top, name: 'STORM TRAIN', hint: 'Ride a cart up the track and hop off at the top!' };
  },
  // BLASTER CAGE — the crystal is caged; grab the blaster and shoot the target circling above
  ({ b, cx, cz, y0 }) => {
    const p = polar(cx, cz, -90, 14.5), u = p.u;
    const top = { x: p.x, y: y0 + 2.4, z: p.z };
    b.plat({ ...top, w: 4, d: 4, h: 2.4, style: 'panel' });
    b.plat({ x: p.x - u.x * 3, y: y0 + 1.2, z: p.z - u.z * 3, w: 2, d: 2.4, h: 1.2, style: 'panel' });
    const gates = [];
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, ox = Math.sin(a) * 2.3, oz = Math.cos(a) * 2.3;
      gates.push(b.gate({ x: p.x + ox, y: y0 + 2.4, z: p.z + oz, w: 4.2, h: 3.4, yaw: a, color: 0x9adfff }));
    }
    const target = b.target({ x: p.x, y: y0 + 9, z: p.z, r: 0.8, motion: b.mo((v, t) => { v.x = Math.cos(t * 0.9) * 3; v.z = Math.sin(t * 0.9) * 3; }) });
    const hit = target.hit;
    target.hit = () => { const was = target.dead; hit(); if (!was) { gates.forEach((g) => g.open()); b.world.events.push({ type: 'banner', big: 'CAGE OPEN!', color: '#9adfff', dur: 1.6 }); } };
    b.slowPad({ x: p.x - u.x * 7, y: y0, z: p.z - u.z * 7, dur: 8, give: 'gun' });
    return { ...top, name: 'BLASTER CAGE', hint: 'Step on the clock pad for the blaster, shoot the circling target to open the cage!' };
  },
];

export default {
  id: 'sovereign',
  name: 'The Storm Sovereign',
  tagline: 'BOSS: a thunderhead throne above the clouds. Nine crystals and every new gadget — grapple, blast and balloon your way to them.',
  exposure: 0.8,
  sky: {
    mode: 'gradient', light: { elev: 30, az: -40 },
    zen: [0.01, 0.015, 0.03], hor: [0.08, 0.1, 0.14], glow: [0.3, 0.35, 0.5], glowPow: 4, glowAmt: 0.5,
    cov: 0.95, cloudBright: 0.35, cloudShade: 0.6, cirrus: 0.4, tint: [0.8, 0.9, 1.2],
  },
  light: { color: 0xc8dcff, intensity: 2.2 }, envIntensity: 1.2, fog: 0.0016,
  hemi: { sky: 0x4a5a8a, ground: 0x10141e, intensity: 0.6 },
  theme: {
    top: { p: 'hex', a: '#2a3448', b: ['#323e54', '#222a3a'], line: '#9adfff', glow: true, size: 28, seed: 481 }, side: 'stone',
    stone: { p: 'stripes', a: '#ffd84d', b: ['#1a2030'], n: 6, seed: 482 }, palette: 'storm', neon: 0x9adfff, accent: '#9adfff',
  },
  scenery: { islands: { palette: 'storm', trees: false, crystals: true, count: 26, seed: 481 }, sea: {}, clouds: { count: 60 }, rain: true, lightning: true },
  killY: -32,
  boss: true,

  build(b) {
    const { y0 } = ARENA;
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE STORM SOVEREIGN', 'Nine crystals. Every tower needs a new trick. Wisps only chase you on the floor!', 0, '#9adfff');

    // TESLA FLOOR
    b.sign(4.5, 0, -3, 'TESLA FLOOR', 'Tiles charge up and ZAP. Run with the wave of sparks.', 0, '#4d9aff');
    b.zapTiles({ x: 0, y: 0, z0: -9, nx: 2, nz: 8, size: 2.6, period: 2.4, pattern: 'rows' });
    b.plat({ x: 0, y: 0, z: -34, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 0, -34);

    // GRAPPLE CLIFF
    b.toolStation({ x: 3.5, y: 0, z: -33, tool: 'grapple' });
    b.plat({ x: 0, y: 0, z: -39, w: 6, d: 2, style: 'trim' });
    b.grappleCliff({ y: 0, z: -40, h: 9, w: 6, d: 8 });
    b.checkpoint(0, 9, -45);

    // BALLOON & RING
    b.sign(-3, 9, -43, 'UPDRAUGHT', 'Float up, then launch through the ring.', 0, '#9adfff');
    b.plat({ x: 0, y: 9, z: -51.5, w: 3, d: 3, style: 'trim' });
    b.balloon({ x: 0, z: -51.5, y0: 10.9, y1: 18.9, color: 0x9adfff });
    b.boostRing({ x: 0, y: 16.5, z: -58, vel: { x: 0, y: 12.5, z: -13 }, r: 2.2 });
    b.plat({ x: 0, y: 15, z: -72.5, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 15, -72.5);

    // BULLET TIME
    b.bulletTime({ y: 15, z: -80, sway: 1.8 });
    b.plat({ x: 0, y: 15, z: -97, w: 6, d: 8, style: 'trim' });
    b.checkpoint(0, 15, -96);
    b.toolStation({ x: 2.2, y: 15, z: -99.4, tool: 'grapple' }); // swap the blaster back for the grappler

    // CRANE & CLIFF up to the throne
    b.extendBridge({ y: 15, z: -101, len: 12, n: 3, period: 6 });
    b.plat({ x: 0, y: 15, z: -114.5, w: 6, d: 3, style: 'trim' });
    b.grappleCliff({ y: 15, z: -116, h: 11, w: 6, d: 6 });
    b.plat({ x: 0, y: y0, z: -126, w: 6, d: 8, style: 'trim' });

    buildArena(b, ARENA, 'trim');
    b.world.boss = new Boss(b, {
      ...ARENA, name: 'THE STORM SOVEREIGN', power: 5, towers: TOWERS,
      colors: { armor: 0x3a4a6a, dark: 0x141a28, cape: 0x1a2a5a, eye: 0x9adfff, gem: 0xffffff, crystal: 0x9adfff, trim: 0xffd84d, wisp: 0x9adfff },
      decorate: (bb, boss) => this.dressBoss(bb, boss),
    });
    this.thunderhead(b);
  },

  // a crown of lightning and crackling arcs
  dressBoss(b, boss) {
    const bolt = new THREE.MeshBasicMaterial({ color: 0xffe88a, toneMapped: false });
    for (let k = 0; k < 5; k++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.8, 4), bolt);
      const a = (k - 2) * 0.35;
      s.position.set(Math.sin(a) * 1.2, 2.6, Math.cos(a) * 0.3 - 0.4); s.rotation.z = -a; boss.head.add(s); boss.parts.push(s);
    }
    const arcs = [];
    for (let k = 0; k < 3; k++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(3.4 + k * 0.6, 0.05, 6, 48, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: 0x9adfff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      arc.position.y = 7.5; boss.root.add(arc); boss.parts.push(arc); arcs.push(arc);
    }
    b.world.anim.push((t) => arcs.forEach((a, k) => { a.rotation.set(t * (1.3 + k * 0.4), t * (0.7 + k * 0.3), k); a.material.opacity = Math.random() < 0.85 ? 0.7 : 0.1; }));
  },

  // the cloud throne under the arena
  thunderhead(b) {
    const { cx, cz, y0 } = ARENA;
    const cloud = new THREE.MeshStandardMaterial({ color: 0x5a6478, roughness: 1, flatShading: true });
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, r = 18 + (k % 3) * 6;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(8 + (k % 4) * 2, 1), cloud);
      m.position.set(cx + Math.cos(a) * r, y0 - 18 - (k % 3) * 4, cz + Math.sin(a) * r); b.add(m);
    }
    const keep = new THREE.Mesh(boxGeo(38, 30, 38, 6), b.M.side); keep.position.set(cx, y0 - 14 - 15, cz); b.add(keep);
  },
};
