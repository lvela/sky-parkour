// LEVEL 40 — Steel Skyline: a skyscraper building site at dawn. New: the GRAPPLER (fire at a glowing
// grapple point to be reeled in and flung onto the ledge) and telescoping crane bridges.
import * as THREE from 'three';

const STEEL = { p: 'grid', a: '#4a525e', b: ['#555e6a', '#3e4652'], line: '#2a2e36', n: 4, seed: 401 };

export default {
  id: 'skyline',
  name: 'Steel Skyline',
  tagline: 'Pick up the grappler and swing up the skyscrapers. Crane bridges slide out and pull back in.',
  exposure: 0.5,
  sky: { mode: 'physical', light: { elev: 12, az: 70 }, turbidity: 5, rayleigh: 1.6, cov: 0.3, cirrus: 0.7, tint: [1.1, 0.95, 0.9] },
  light: { color: 0xffd8b0, intensity: 3.2 }, envIntensity: 1.0, fog: 0.0010,
  theme: {
    top: STEEL, side: 'metal', stone: { p: 'stripes', a: '#ffcf3a', b: ['#2a2a2e'], n: 6, seed: 402 },
    palette: { soil: 0x4a4f58, rockA: 0x5a606a, rockB: 0x707882, dark: 0x30343a, grassA: 0x5a606a, grassB: 0x6a707a }, accent: '#ffb02e',
  },
  scenery: {
    islands: { palette: { soil: 0x4a4f58, rockA: 0x5a606a, rockB: 0x707882, dark: 0x30343a, grassA: 0x5a606a, grassB: 0x6a707a }, trees: false, count: 18, seed: 401 },
    sea: {}, clouds: { count: 60 },
  },
  killY: -32,

  build(b) {
    b.plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
    b.checkpoint(0, 0, 4);
    b.sign(-4.5, 0, -3, 'STEEL SKYLINE', 'Grab the GRAPPLER from the station. Aim at a glowing ring and fire to be pulled up!', 0, '#ffb02e');
    b.toolStation({ x: 4, y: 0, z: -4, tool: 'grapple' });

    // FIRST GRAPPLE — up a sheer wall
    b.plat({ x: 0, y: 0, z: -11, w: 6, d: 6, style: 'trim' });
    b.grappleCliff({ y: 0, z: -14, h: 8, w: 6, d: 8 });
    b.checkpoint(0, 8, -19);

    // CRANE BRIDGES
    b.sign(3.5, 8, -17, 'CRANE BRIDGES', 'The bridges slide out, wait, then pull back. Cross while they\'re out!', 0, '#ffcf3a');
    b.extendBridge({ y: 8, z: -22, len: 12, n: 3, period: 6 });
    b.plat({ x: 0, y: 8, z: -37, w: 4, d: 4, style: 'metal' });
    b.extendBridge({ y: 8, z: -39, len: 15, n: 3, period: 6.5, phase: 2.5 });
    b.plat({ x: 0, y: 8, z: -59, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 8, -59);

    // SKY HOOKS — grapple rings over the gap fling you forward
    b.sign(-3.5, 8, -57, 'SKY HOOKS', 'Grapple the floating rings — they fling you across the gap.', 0, '#ffb02e');
    b.hook({ x: 0, y: 12, z: -72, launch: { x: 0, y: 6, z: -10 } });
    b.plat({ x: 0, y: 8, z: -82, w: 6, d: 6, style: 'metal' });
    b.hook({ x: 0, y: 14, z: -93, launch: { x: 0, y: 7, z: -10 } });
    b.plat({ x: 0, y: 10, z: -103, w: 8, d: 8, style: 'island', rock: true });
    b.checkpoint(0, 10, -103);

    // TOWER CLIMB — grapple, bridge, grapple
    b.sign(3.5, 10, -101, 'TOWER CLIMB', 'All the way to the top floor.', 0, '#ffcf3a');
    b.plat({ x: 0, y: 10, z: -108, w: 6, d: 2, style: 'trim' });
    b.grappleCliff({ y: 10, z: -109, h: 9, w: 6, d: 6 });
    b.extendBridge({ y: 19, z: -115, len: 12, n: 3, period: 6 });
    b.plat({ x: 0, y: 19, z: -130, w: 4, d: 4, style: 'metal' });
    b.grappleCliff({ y: 19, z: -132, h: 7, w: 6, d: 6 });
    b.checkpoint(0, 26, -135);

    // TOP FLOOR — the longest crane
    b.extendBridge({ y: 26, z: -138, len: 15, n: 3, period: 6.5, phase: 1 });
    b.finish(0, 26, -162, 12, 12, 16);
    this.city(b);
  },

  // skyscrapers and cranes around the site
  city(b) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#20262e'; g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) { g.fillStyle = Math.random() < 0.45 ? '#ffd89a' : '#3a4a5a'; g.fillRect(x, y, 5, 5); }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.5 });
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 26; k++) {
      const side = k % 2 ? 1 : -1, x = side * (30 + r() * 90), z = 40 - r() * 300, w = 10 + r() * 14, h = 60 + r() * 110;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat.clone());
      m.material.map = tex.clone(); m.material.map.repeat.set(w / 8, h / 16); m.material.emissiveMap = m.material.map;
      m.position.set(x, -60 + h / 2, z); b.add(m);
    }
    const yellow = new THREE.MeshStandardMaterial({ color: 0xffb02e, metalness: 0.5, roughness: 0.4 });
    [[-22, -40], [24, -110], [-26, -150]].forEach(([x, z]) => {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 90, 1.2), yellow); mast.position.set(x, -15, z); b.add(mast);
      const jib = new THREE.Mesh(new THREE.BoxGeometry(34, 1, 1), yellow); jib.position.set(x - Math.sign(x) * 12, 30, z); b.add(jib);
    });
  },
};
