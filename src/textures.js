// Procedurally painted canvas textures, so the game ships with no image assets.
import * as THREE from 'three';

export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Blobs drawn with wrap-around so the texture tiles seamlessly.
function blobs(g, w, h, rnd, n, colors, rmin, rmax, alpha = 1) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (0.25 + rnd() * 0.75);
    g.fillStyle = colors[(rnd() * colors.length) | 0];
    const x = rnd() * w, y = rnd() * h, r = rmin + rnd() * (rmax - rmin);
    for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) {
      if (x + ox + r < 0 || x + ox - r > w || y + oy + r < 0 || y + oy - r > h) continue;
      g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill();
    }
  }
  g.globalAlpha = 1;
}

function grass() {
  const [c, g] = canvas(512); const r = rng(11);
  g.fillStyle = '#4c7d2c'; g.fillRect(0, 0, 512, 512);
  blobs(g, 512, 512, r, 900, ['#3e6b22', '#5b9134', '#2f5719', '#6a9f3c'], 6, 26, 0.35);
  g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512, y = r() * 512, l = 3 + r() * 7, a = -Math.PI / 2 + (r() - 0.5) * 1.2;
    g.strokeStyle = ['#6fae42', '#82c050', '#3d6e20', '#93c95c', '#2c5416'][(r() * 5) | 0];
    g.globalAlpha = 0.35 + r() * 0.5; g.lineWidth = 1 + r();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  blobs(g, 512, 512, r, 60, ['#f4f0c8', '#ffffff', '#f2d64b'], 1.5, 3, 0.8); // tiny flowers
  return toTex(c);
}

// Earth side of an island platform: grassy lip on top, soil below.
function dirt() {
  const [c, g] = canvas(512); const r = rng(12);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#6a4c30'); grd.addColorStop(1, '#4a3322');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  blobs(g, 512, 512, r, 700, ['#7a5a3a', '#3e2b1c', '#8d6d4c', '#5d4630'], 2, 12, 0.5);
  blobs(g, 512, 512, r, 120, ['#8f8a80', '#6f6a62', '#a39d92'], 4, 14, 0.8); // pebbles
  // grass lip
  g.fillStyle = '#4c7d2c'; g.fillRect(0, 0, 512, 60);
  for (let x = 0; x < 512; x += 2) {
    const l = 50 + r() * 50;
    g.strokeStyle = ['#4c7d2c', '#3e6b22', '#5b9134', '#6fae42'][(r() * 4) | 0];
    g.lineWidth = 2 + r() * 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, l); g.stroke();
  }
  return toTex(c);
}

function stone() {
  const [c, g] = canvas(512); const r = rng(21);
  g.fillStyle = '#8f8d87'; g.fillRect(0, 0, 512, 512);
  blobs(g, 512, 512, r, 1600, ['#7d7b75', '#a29f98', '#6f6d68', '#b3b0a8', '#87847d'], 2, 16, 0.35);
  // slabs
  const rows = 4, rh = 512 / rows;
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * 64;
    for (let x = -1; x < 4; x++) {
      const x0 = x * 128 + off;
      g.globalAlpha = 0.12; g.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
      g.fillRect(x0 + 3, y * rh + 3, 122, rh - 6);
      g.globalAlpha = 0.65; g.fillStyle = '#4b4945';
      g.fillRect(x0, y * rh, 3, rh);
    }
    g.globalAlpha = 0.65; g.fillStyle = '#4b4945'; g.fillRect(0, y * rh, 512, 3);
    g.globalAlpha = 0.25; g.fillStyle = '#d8d5cc'; g.fillRect(0, y * rh + 3, 512, 2);
  }
  g.globalAlpha = 1;
  return toTex(c);
}

function wood() {
  const [c, g] = canvas(512); const r = rng(31);
  const planks = 8, ph = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const base = ['#8a5b33', '#7c5130', '#946339', '#83552f'][i % 4];
    g.fillStyle = base; g.fillRect(0, i * ph, 512, ph);
    for (let k = 0; k < 26; k++) {
      g.strokeStyle = r() > 0.5 ? 'rgba(60,35,15,0.35)' : 'rgba(180,130,80,0.25)';
      g.lineWidth = 1 + r() * 1.5;
      const y0 = i * ph + r() * ph, amp = 1 + r() * 3, f = 0.01 + r() * 0.03, ph0 = r() * 6;
      g.beginPath();
      for (let x = 0; x <= 512; x += 8) g.lineTo(x, y0 + Math.sin(x * f + ph0) * amp);
      g.stroke();
    }
    g.fillStyle = 'rgba(30,18,8,0.8)'; g.fillRect(0, i * ph, 512, 3);
    const seam = (r() * 512) | 0;
    g.fillRect(seam, i * ph, 3, ph);
    g.fillStyle = 'rgba(40,40,40,0.9)';
    for (const sx of [seam - 12, seam + 14]) { g.beginPath(); g.arc(sx, i * ph + ph / 2, 2.5, 0, 7); g.fill(); }
  }
  return toTex(c);
}

function crumble() {
  const [c, g] = canvas(512); const r = rng(41);
  g.fillStyle = '#d29a52'; g.fillRect(0, 0, 512, 512);
  blobs(g, 512, 512, r, 1400, ['#b9813f', '#e2b06c', '#a8733a', '#efc489'], 2, 14, 0.4);
  g.strokeStyle = 'rgba(70,40,15,0.85)'; g.lineCap = 'round';
  for (let i = 0; i < 28; i++) {
    let x = r() * 512, y = r() * 512, a = r() * Math.PI * 2;
    g.lineWidth = 1 + r() * 3;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 10; k++) { a += (r() - 0.5) * 1.4; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); }
    g.stroke();
  }
  return toTex(c);
}

function wall() {
  const [c, g] = canvas(512); const r = rng(51);
  g.fillStyle = '#d4622a'; g.fillRect(0, 0, 512, 512);
  blobs(g, 512, 512, r, 900, ['#c2541f', '#e0733a', '#b84c1a', '#e88a50'], 3, 14, 0.35);
  g.strokeStyle = 'rgba(255,225,190,0.55)'; g.lineWidth = 14; g.lineJoin = 'round';
  for (let y = 60; y < 512; y += 128) {
    g.beginPath(); g.moveTo(156, y + 50); g.lineTo(256, y - 20); g.lineTo(356, y + 50); g.stroke();
  }
  g.fillStyle = 'rgba(60,20,5,0.6)';
  g.fillRect(0, 0, 512, 6); g.fillRect(0, 0, 6, 512);
  return toTex(c);
}

function trampTop(c1, c2) {
  const [c, g] = canvas(512);
  g.fillStyle = '#1b1b1d'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = c1; g.fillRect(36, 36, 440, 440);
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = i % 2 ? c2 : 'rgba(255,255,255,0.85)'; g.lineWidth = 14;
    g.beginPath(); g.arc(256, 256, 40 + i * 32, 0, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
  for (let i = 40; i < 476; i += 12) {
    g.beginPath(); g.moveTo(i, 36); g.lineTo(i, 476); g.stroke();
    g.beginPath(); g.moveTo(36, i); g.lineTo(476, i); g.stroke();
  }
  return toTex(c, false);
}

function stripes() {
  const [c, g] = canvas(256);
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1d1d1d';
  for (let i = -256; i < 512; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 32 + 256, 256); g.lineTo(i + 256, 256); g.fill();
  }
  return toTex(c);
}

function metal() {
  const [c, g] = canvas(256); const r = rng(61);
  g.fillStyle = '#a7aeb5'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    g.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    const y = r() * 256; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + (r() - 0.5) * 2); g.stroke();
  }
  return toTex(c);
}

function checker() {
  const [c, g] = canvas(256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? '#141414' : '#f4f4f4';
    g.fillRect(x * 32, y * 32, 32, 32);
  }
  return toTex(c);
}

export function makeTextures() {
  return {
    grass: grass(), dirt: dirt(), stone: stone(), wood: wood(), crumble: crumble(),
    wall: wall(), trampTop: trampTop('#2f7de1', '#ffcf3a'), megaTop: trampTop('#e2362f', '#ffe14a'),
    stripes: stripes(), metal: metal(), checker: checker(),
  };
}

// Box with UVs scaled so textures keep a constant world size (s metres per tile).
// fitSides keeps the side faces' V in 0..1 (used for the grassy lip on islands).
export function boxGeo(w, h, d, s = 4, fitSides = false) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const side = f !== 2 && f !== 3;
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      const v = side && fitSides ? uv.getY(k) : uv.getY(k) * dims[f][1] / s;
      uv.setXY(k, uv.getX(k) * dims[f][0] / s, v);
    }
  }
  return g;
}

export function signTexture(title, body, accent = '#ffcf4a') {
  const [c, g] = canvas(1024, 512);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#173350'); grd.addColorStop(1, '#0c1d31');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = accent; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 496);
  g.fillStyle = accent; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 92px system-ui, sans-serif';
  g.fillText(title, 512, 120);
  g.fillStyle = '#ffffff'; g.font = '600 46px system-ui, sans-serif';
  const words = body.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > 900) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => g.fillText(l, 512, 250 + i * 62 - (lines.length - 1) * 10));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
