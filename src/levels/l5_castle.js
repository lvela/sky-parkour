// LEVEL 5 — Castle of the Sky King: storm the floating castle, then defeat the parkour boss on the keep.
import * as THREE from 'three';
import { boxGeo } from '../textures.js';
import { Boss } from '../boss.js';

const V3 = THREE.Vector3;
const ARENA = { cx: 0, cz: -150, y0: 24 };

export default {
  id: 'castle',
  name: 'Castle of the Sky King',
  tagline: 'Storm the floating castle and defeat the Sky King — with parkour.',
  exposure: 0.62,
  sky: {
    mode: 'physical', light: { elev: 2.5, az: 112 }, turbidity: 9, rayleigh: 3.2, mie: 0.01, mieG: 0.88,
    cov: 0.6, cirrus: 1.2, stars: 1, cloudBright: 0.9, tint: [1.2, 0.75, 0.85],
    planet: { elev: 24, az: 200, size: 11, bright: 0.9, a: [0.95, 0.62, 0.38], b: [0.55, 0.32, 0.4], tilt: 0.5 },
  },
  light: { color: 0xff9a6a, intensity: 2.6 }, envIntensity: 1.1, fog: 0.0012,
  hemi: { sky: 0x6a50a0, ground: 0x302020, intensity: 0.45 },
  theme: { top: 'grass', side: 'brick', stone: 'brick', palette: 'castle', accent: '#ffcf4a' },
  scenery: { islands: { palette: 'castle', count: 18, seed: 21 }, sea: {}, clouds: { count: 70 }, birds: true },
  killY: -30,
  boss: true,

  build(b) {
    const t0 = (f) => (t) => { const v = b.zero(); f(v, t); return v; };
    const { cx, cz, y0 } = ARENA;

    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'THE SKY KING', 'He rules the castle above. Reach the keep and defeat him with parkour!', 0, '#ff5a8a');

    // DRAWBRIDGE + HAMMERS
    b.plat({ x: 0, y: 0, z: -23, w: 5, d: 30, style: 'wood' });
    for (const s of [-1, 1]) for (let z = -10; z > -37; z -= 3) b.post(s * 2.6, 0, 1.1, z, false, b.M.iron, 0.08);
    [-15, -23, -31].forEach((z, i) => {
      b.hammer({ x: 0, z, pivotY: 9, L: 7, A: 1.1, phase: i * 2.2 });
      b.post(-3.2, 0, 9.5, z, false, b.M.brick, 0.35); b.post(3.2, 0, 9.5, z, false, b.M.brick, 0.35);
      const beam = b.post(0, 9.2, 9.8, z, false, b.M.brick, 0.3); beam.scale.x = 12;
    });
    b.plat({ x: 0, y: 0, z: -43, w: 12, d: 10, style: 'brick', rock: true, rockDepth: 10 });
    b.checkpoint(0, 0, -42);

    // OUTER WALL CLIMB
    b.sign(-4, 0, -40.5, 'SCALE THE WALL', 'Climb the castle wall using the coloured holds.', 0, '#ff6d8a');
    b.plat({ x: 0, y: 14, z: -50, w: 14, d: 4, h: 15, style: 'brick' });
    b.holds(new V3(0, 0, -48), new V3(0, 0, 1), 0, 14, 0.55, 0.5);
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const m = new THREE.Mesh(boxGeo(1.2, 1.2, 1, 2), b.M.stone);
      m.position.set(s * (4.5 + k * 2), 14.6, -51.5); b.add(m);
    }

    // WALL SLIDES over the moat
    b.sign(3, 14, -51, 'WALL SLIDES', 'Glide along the blue castle walls into the bailey.', 0, '#4d8bff');
    b.plat({ x: -2.6, y: 23, z: -58, w: 0.6, d: 10, h: 15, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 2.6, y: 23, z: -66, w: 0.6, d: 10, h: 15, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: -2.6, y: 23, z: -74, w: 0.6, d: 10, h: 15, style: 'wallrun', type: 'wallrun' });
    b.plat({ x: 0, y: 12, z: -86, w: 10, d: 10, h: 30, style: 'brick' });
    b.checkpoint(0, 12, -86);

    // MOVING TRAMPOLINES across the courtyard
    b.plat({ x: 0, y: 8, z: -97, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.1) * 2.5; }) });
    b.plat({ x: 0, y: 8, z: -107, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17, motion: t0((v, t) => { v.x = Math.sin(t * 1.1 + Math.PI) * 2.5; }) });
    b.plat({ x: 0, y: 12, z: -121, w: 10, d: 18, h: 30, style: 'brick' });
    b.checkpoint(0, 12, -117);

    // KEEP SHAFT — moving walls up to the boss arena
    b.sign(-4, 12, -119.5, 'THE KEEP', 'Wall jump up the shifting shaft to face the Sky King.', 0, '#ff8a4a');
    for (const s of [-1, 1]) {
      b.plat({ x: s * 2.05, y: 28, z: -128, w: 0.6, d: 4, h: 16, style: 'wall', type: 'wall',
        motion: t0((v, t) => { v.x = s * 0.35 * (1 + Math.sin(t * 1.3)); }) });
    }

    // ARENA (keep roof)
    b.plat({ x: cx, y: y0, z: cz, w: 40, d: 40, h: 14, style: 'brick' });
    const parapet = (x, z, w, d) => b.plat({ x, y: y0 + 2.4, z, w, d, h: 2.4, style: 'brick', shadow: false });
    parapet(cx - 19.6, cz, 0.8, 40); parapet(cx + 19.6, cz, 0.8, 40); parapet(cx, cz - 19.6, 40, 0.8);
    parapet(cx - 11.75, cz + 19.6, 16.5, 0.8); parapet(cx + 11.75, cz + 19.6, 16.5, 0.8);
    b.checkpoint(cx, y0, cz + 16.5);
    b.world.boss = new Boss(b, { ...ARENA, name: 'THE SKY KING', power: 1 });

    this.decorate(b);
  },

  decorate(b) {
    const { cx, cz, y0 } = ARENA;
    const brick = b.M.brick;
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a2a7a, roughness: 0.6, metalness: 0.2 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffb04a, toneMapped: false });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xa8142a, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x200004 });
    const add = (m) => { b.add(m); return m; };
    // keep body below the arena
    const keep = add(new THREE.Mesh(boxGeo(38, 70, 38, 6), brick));
    keep.position.set(cx, y0 - 14 - 35, cz);
    const keepRock = add(new THREE.Mesh(new THREE.ConeGeometry(30, 70, 9), new THREE.MeshStandardMaterial({ color: 0x4a4048, roughness: 1, flatShading: true })));
    keepRock.position.set(cx, y0 - 84 - 35, cz); keepRock.rotation.x = Math.PI;
    // round towers
    const tower = (x, z, r, h, base) => {
      const t = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 20), brick));
      t.position.set(x, base + h / 2, z); t.castShadow = true;
      const roof = add(new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, r * 2.6, 20), roofMat));
      roof.position.set(x, base + h + r * 1.3, z); roof.castShadow = true;
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2;
        const w = add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), windowMat));
        const wy = base + h * (0.35 + 0.4 * ((k * 7) % 3) / 3);
        w.position.set(x + Math.cos(a) * (r + 0.05), wy, z + Math.sin(a) * (r + 0.05));
        w.rotation.y = -a + Math.PI / 2;
      }
      const flagPole = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 6), b.M.metal));
      flagPole.position.set(x, base + h + r * 2.6 + 1.8, z);
      const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2, 6, 1), bannerMat));
      flag.position.set(x + 1.2, base + h + r * 2.6 + 3.2, z);
      b.world.anim.push((t) => { flag.rotation.y = Math.sin(t * 2 + x) * 0.3; });
    };
    for (const [x, z] of [[cx - 22, cz + 22], [cx + 22, cz + 22], [cx - 22, cz - 22], [cx + 22, cz - 22]]) tower(x, z, 4, 40, y0 - 30);
    tower(cx - 40, cz + 30, 6, 60, y0 - 70);
    tower(cx + 45, cz - 10, 7, 70, y0 - 75);
    tower(cx - 35, cz - 45, 5, 55, y0 - 55);
    tower(cx + 28, cz + 70, 5, 30, -25);
    tower(cx - 26, cz + 80, 4.5, 28, -22);
    // arena banners & braziers
    for (let k = -2; k <= 2; k++) {
      if (k === 0) continue;
      const bn = add(new THREE.Mesh(new THREE.PlaneGeometry(2, 5), bannerMat));
      bn.position.set(cx + k * 7, y0 - 2.6, cz + 20.06);
    }
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const flames = [];
    for (const [x, z] of [[cx - 18.5, cz + 18.5], [cx + 18.5, cz + 18.5], [cx - 18.5, cz - 18.5], [cx + 18.5, cz - 18.5]]) {
      const bowl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 0.7, 12), b.M.iron));
      bowl.position.set(x, y0 + 2.9, z);
      const stand = add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.6, 8), b.M.iron));
      stand.position.set(x, y0 + 1.3, z);
      const f = add(new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 8), fireMat));
      f.position.set(x, y0 + 4, z); flames.push(f);
    }
    b.world.anim.push((t) => flames.forEach((f, i) => { const s = 1 + Math.sin(t * 13 + i * 2) * 0.15; f.scale.set(s, 1 + Math.sin(t * 9 + i) * 0.25, s); }));
    // outer curtain walls hanging in the sky
    for (const [x, z, w, ry] of [[-30, -60, 50, 0.3], [32, -70, 46, -0.4], [0, -205, 70, 0]]) {
      const wall = add(new THREE.Mesh(boxGeo(w, 14, 4, 6), brick));
      wall.position.set(x, 4, z); wall.rotation.y = ry;
      for (let k = -w / 2 + 2; k < w / 2; k += 4) {
        const m = add(new THREE.Mesh(boxGeo(2, 2, 4, 2), brick));
        m.position.set(x + Math.cos(ry) * k, 12, z - Math.sin(ry) * k); m.rotation.y = ry;
      }
    }
  },
};
