// Parkour obstacles for worlds 9–38. Installed onto Builder.prototype, so levels call them as b.conveyor(...) etc.
// Same conventions as builder.js: travel is -Z, platforms are placed by their TOP surface height.
import * as THREE from 'three';
import { Builder } from './builder.js';
import { boxGeo, themeTex } from './textures.js';
import { Collider, Bar } from './world.js';
import { G } from './player.js';

const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const glowMat = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false });
const addMat = (color, opacity = 0.5) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const hidden = new THREE.MeshBasicMaterial({ visible: false });
// 0..1 position inside a repeating cycle
const cyc = (t, period, phase = 0) => ((((t + phase) % period) + period) % period) / period;
const nearXZ = (P, x, z, r) => !!P && (P.pos.x - x) ** 2 + (P.pos.z - z) ** 2 < r * r;

Object.assign(Builder.prototype, {
  // motion helper: b.mo((v, t) => { v.x = ... })
  mo(f) { return (t) => { const v = this.zero(); f(v, t); return v; }; },

  // cached extra materials
  mat(key, make) { if (!this.M[key]) this.M[key] = make(); return this.M[key]; },
  brass() { return this.mat('brass', () => new THREE.MeshStandardMaterial({ color: 0xc89a3c, metalness: 0.9, roughness: 0.3 })); },

  // ---------- CONVEYOR: a moving walkway that carries you along its local -Z (rotate with yaw; negative speed reverses)
  conveyor({ x = 0, y, z, w = 3, d = 12, speed = 4, yaw = 0 }) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#26282c'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffcf3a';
    for (const y0 of [8, 72]) { g.beginPath(); g.moveTo(24, y0 + 40); g.lineTo(64, y0); g.lineTo(104, y0 + 40); g.lineTo(88, y0 + 48); g.lineTo(64, y0 + 24); g.lineTo(40, y0 + 48); g.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    const belt = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 });
    const M = this.M.metal;
    const cv = { x: -Math.sin(yaw) * speed, z: -Math.cos(yaw) * speed };
    const col = this.plat({ x, y, z, w, d, h: 0.6, yaw, mat: [M, M, belt, M, M, M], conveyor: cv, neon: false });
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(boxGeo(0.15, 0.25, d, 2), this.M.danger);
      rail.position.set(s * (w / 2 + 0.07), 0.42, 0); col.mesh.add(rail);
    }
    this.world.anim.push((t, dt) => { tex.offset.y -= speed * dt / 4; });
    return col;
  },

  // ---------- MUSHROOM: a springy mushroom cap (a trampoline). Optional motion and push like geysers.
  mushroom({ x, y, z, r = 1.6, bounce = 16, color = 0xff4d6d, motion, push, stem = 4 }) {
    const col = this.plat({ x, y, z, w: r * 1.5, d: r * 1.5, h: 0.6, type: 'tramp', bounce, motion, mat: hidden, shadow: false });
    if (push) col.push = push;
    const capMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 10, 0, TAU, 0, Math.PI / 2), capMat);
    cap.scale.y = 0.38; cap.position.y = -0.3; cap.castShadow = true;
    col.mesh.add(cap);
    const spotMat = this.mat('spot', () => new THREE.MeshStandardMaterial({ color: 0xfff6e8, roughness: 0.6, emissive: 0x605040 }));
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + 0.3, rr = r * (k % 2 ? 0.55 : 0.3);
      const s = new THREE.Mesh(new THREE.SphereGeometry(r * 0.12, 8, 6), spotMat);
      s.position.set(Math.cos(a) * rr, -0.3 + r * 0.38 * Math.sqrt(1 - (rr / r) ** 2), Math.sin(a) * rr); s.scale.y = 0.4;
      col.mesh.add(s);
    }
    const gill = new THREE.Mesh(new THREE.CircleGeometry(r, 24), this.mat('gill', () => new THREE.MeshStandardMaterial({ color: 0xe8d8c0, roughness: 0.9, side: THREE.DoubleSide })));
    gill.rotation.x = Math.PI / 2; gill.position.y = -0.3; col.mesh.add(gill);
    if (stem > 0) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.32, stem, 10), this.mat('stem', () => new THREE.MeshStandardMaterial({ color: 0xf2e6d0, roughness: 0.8 })));
      st.position.y = -0.3 - stem / 2; st.castShadow = true; col.mesh.add(st);
    }
    return col;
  },

  // ---------- QUICKSAND: sinks while you stand on it, swallows itself at the bottom, then resurfaces
  quicksand({ x, y, z, w = 3, d = 3, rate = 0.55, max = 1.4 }) {
    const st = { sink: 0, stood: 0, gone: 0 };
    const mat = new THREE.MeshStandardMaterial({ map: this.M.top.map, roughness: 1, color: 0xffffff });
    const col = this.plat({ x, y, z, w, d, h: 0.8, mat, motion: (t) => { const o = this.zero(); o.y = -st.sink; return o; } });
    col.onStand = () => { st.stood = 0.12; };
    const swirl = new THREE.Mesh(new THREE.RingGeometry(0.2, Math.min(w, d) * 0.42, 24, 1), new THREE.MeshBasicMaterial({ color: 0x3a2410, transparent: true, opacity: 0, depthWrite: false }));
    swirl.rotation.x = -Math.PI / 2; swirl.position.y = 0.41; col.mesh.add(swirl);
    this.world.anim.push((t, dt) => {
      if (st.gone > 0) {
        st.gone -= dt;
        if (st.gone <= 0) { st.sink = 0; col.active = true; col.mesh.visible = true; }
        return;
      }
      if (st.stood > 0) { st.stood -= dt; st.sink += rate * dt; } else st.sink = Math.max(0, st.sink - rate * 0.7 * dt);
      const k = st.sink / max;
      mat.color.setScalar(1 - k * 0.5);
      swirl.material.opacity = k * 0.7; swirl.rotation.z = t * 3;
      if (st.sink >= max) { col.active = false; col.mesh.visible = false; st.gone = 2.2; this.sfx.crumble(); }
    });
    return col;
  },

  // ---------- SPIKE TRAP: a floor tile whose spikes shoot up on a timer (they peek out just before)
  spikes({ x, y, z, w = 3, d = 3, period = 2.4, on = 0.4, phase = 0 }) {
    this.plat({ x, y, z, w, d, h: 0.5, style: 'trim' });
    const n = Math.max(2, Math.round(w / 0.6)), m = Math.max(2, Math.round(d / 0.6));
    const geo = new THREE.ConeGeometry(0.16, 0.8, 6); geo.translate(0, 0.4, 0);
    const im = new THREE.InstancedMesh(geo, this.mat('spike', () => new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.25 })), n * m);
    const mm = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) im.setMatrixAt(k++, mm.makeTranslation((i + 0.5) / n * w - w / 2, 0, (j + 0.5) / m * d - d / 2));
    im.position.set(x, y - 0.85, z); im.castShadow = true;
    this.add(im);
    const holder = new THREE.Object3D(); holder.position.set(x, y + 0.45, z);
    const col = new Collider(holder, w / 2, 0.45, d / 2, { type: 'knock', knockPower: 10 });
    col.spiky = true; col.active = false;
    this.world.colliders.push(col);
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const up = u < on, warn = u > 1 - 0.14;
      col.active = up;
      const target = up ? y - 0.02 : warn ? y - 0.55 : y - 0.85;
      im.position.y += (target - im.position.y) * (up ? 0.6 : 0.25);
    });
    return col;
  },

  // ---------- BUBBLE ELEVATOR: bubbles float up from y0 to y1 and pop at the top. Ride one up, hop off in time.
  bubble({ x, z, y0, y1, speed = 1.6, phase = 0, r = 1.4 }) {
    const L = y1 - y0;
    const g = new THREE.Group(); g.position.set(x, y0 - 0.15, z);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xbff4ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55, emissive: 0x3aa8c8, emissiveIntensity: 0.4 }));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd8fbff, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    shell.position.y = 0.3;
    g.add(disc, shell); this.add(g);
    const col = new Collider(g, r * 0.85, 0.15, r * 0.85, { motion: (t) => { const o = this.zero(); o.y = cyc(t * speed, L, phase) * L; return o; } });
    this.world.colliders.push(col);
    let wasTop = false;
    this.world.anim.push((t) => {
      const u = cyc(t * speed, L, phase);
      const s = Math.min(1, u / 0.08);
      g.scale.setScalar(Math.max(0.01, s));
      col.active = u > 0.04 && u < 0.96;
      const top = u > 0.9;
      shell.material.opacity = top && Math.floor(t * 12) % 2 ? 0.45 : 0.18;
      if (u >= 0.96 && !wasTop && nearXZ(this.world.player, x, z, 20)) this.sfx.pop();
      wasTop = u >= 0.96;
    });
    return col;
  },

  // ---------- GEAR: a big rotating cog you stand on. Neighbouring gears should spin in opposite directions.
  gear({ x, y, z, r = 3, speed = 0.6, teeth = 14, h = 0.6, phase = 0 }) {
    const a = r * 0.85;
    const motion = (t) => { const o = this.zero(); o.yaw = t * speed + phase; return o; };
    const col = this.plat({ x, y, z, w: a * 2, d: a * 2, h, mat: hidden, motion, shadow: false });
    this.plat({ x, y, z, w: a * 2, d: a * 2, h, yaw: Math.PI / 4, mat: hidden, motion, shadow: false });
    const brass = this.brass();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), brass); disc.castShadow = true; disc.receiveShadow = true;
    col.mesh.add(disc);
    for (let k = 0; k < teeth; k++) {
      const ang = k / teeth * TAU;
      const tooth = new THREE.Mesh(boxGeo(0.55, h, 0.7, 2), brass);
      tooth.position.set(Math.cos(ang) * (r + 0.25), 0, Math.sin(ang) * (r + 0.25)); tooth.rotation.y = -ang;
      col.mesh.add(tooth);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, h + 0.06, 16), this.M.iron);
    col.mesh.add(hub);
    for (let k = 0; k < 4; k++) {
      const spoke = new THREE.Mesh(boxGeo(r * 1.6, h + 0.03, 0.3, 2), this.M.iron);
      spoke.rotation.y = k * Math.PI / 4; col.mesh.add(spoke);
    }
    return col;
  },

  // ---------- PISTON: a pillar that pumps up and down. Chain several with phase offsets for a moving staircase.
  piston({ x, y, z, w = 2.5, d = 2.5, amp = 2, period = 3, phase = 0, h = 8 }) {
    const col = this.plat({ x, y, z, w, d, h, mat: this.brass(), motion: (t) => { const o = this.zero(); o.y = amp * (0.5 + 0.5 * Math.sin(t / period * TAU + phase)); return o; } });
    const cap = new THREE.Mesh(boxGeo(w + 0.2, 0.3, d + 0.2, 2), this.M.danger);
    cap.position.y = h / 2 - 0.1; col.mesh.add(cap);
    return col;
  },

  // ---------- LASER GATE: beams across the path that switch on and off. Too tall to jump; time your run.
  // low: true makes a single ankle-height beam you jump over instead.
  laser({ x = 0, y, z, w = 4, period = 2.4, on = 0.5, phase = 0, low = false, color = 0xff2a4a }) {
    const heights = low ? [0.35] : [0.3, 0.8, 1.3, 1.8];
    const beamMat = addMat(color, 0.9);
    const beams = heights.map((hy) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, w, 6), beamMat);
      m.rotation.z = Math.PI / 2; m.position.set(x, y + hy, z); this.add(m); return m;
    });
    for (const s of [-1, 1]) {
      const post = this.post(x + s * (w / 2 + 0.15), y, y + (low ? 0.8 : 2.2), z, true, this.M.iron, 0.18);
      const lamp = new THREE.Mesh(boxGeo(0.4, 0.2, 0.4, 2), glowMat(color)); lamp.position.set(post.position.x, y + (low ? 0.9 : 2.3), z); this.add(lamp);
    }
    const lo = heights[0] - 0.15, hi = heights[heights.length - 1] + 0.15;
    const holder = new THREE.Object3D(); holder.position.set(x, y + (lo + hi) / 2, z);
    const col = new Collider(holder, w / 2, (hi - lo) / 2, 0.15, { type: 'knock', knockPower: 10 });
    this.world.colliders.push(col);
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const live = u < on, warn = !live && u > 1 - 0.12;
      col.active = live;
      const vis = live || (warn && Math.floor(t * 20) % 2 === 0);
      beamMat.opacity = live ? 0.9 : warn ? 0.35 : 0;
      for (const m of beams) m.visible = vis;
    });
    return col;
  },

  // ---------- DASH PAD: launches you fast and low in the direction of the arrows
  dashPad({ x, y, z, w = 3, d = 3, push = { x: 0, z: -16 }, bounce = 6.5, color = 0x3dffb0 }) {
    const col = this.plat({ x, y, z, w, d, h: 0.5, style: 'metal', type: 'tramp', bounce });
    col.push = push;
    const yaw = Math.atan2(-push.x, -push.z);
    const mat = glowMat(color, 1);
    const chev = new THREE.Group(); chev.rotation.y = yaw; chev.position.set(x, y + 0.03, z); this.add(chev);
    for (let k = 0; k < 3; k++) {
      for (const s of [-1, 1]) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.22, Math.min(w, 2.4) * 0.5), mat);
        bar.rotation.x = -Math.PI / 2; bar.rotation.z = s * 0.8;
        bar.position.set(s * 0.32, 0, d * 0.25 - k * d * 0.25);
        chev.add(bar);
      }
    }
    this.world.anim.push((t) => { chev.children.forEach((c, i) => { c.visible = (Math.floor(t * 6) + Math.floor(i / 2)) % 3 !== 0; }); });
    return col;
  },

  // ---------- SWINGING PLATFORM: a platform hanging from ropes, swinging side to side (axis 'x') or back and forth ('z')
  pendulum({ px = 0, py, pz, L = 6, A = 0.6, phase = 0, w = 3, d = 3, axis = 'x', speedMul = 1 }) {
    const om = Math.sqrt(22 / L) * speedMul;
    const pivot = new THREE.Group(); pivot.position.set(px, py, pz); this.add(pivot);
    for (const s of [-1, 1]) {
      const off = axis === 'x' ? new V3(0, 0, s * d * 0.4) : new V3(s * w * 0.4, 0, 0);
      pivot.add(this.cylinderBetween(off, off.clone().setY(-L), 0.04, this.M.rope));
    }
    const beam = new THREE.Mesh(boxGeo(axis === 'x' ? 0.4 : w + 1, 0.4, axis === 'x' ? d + 1 : 0.4, 2), this.M.iron);
    beam.position.set(px, py + 0.2, pz); this.add(beam);
    return this.plat({
      x: px, y: py - L, z: pz, w, d, h: 0.5, style: 'wood',
      motion: this.mo((v, t) => {
        const th = A * Math.sin(om * t + phase);
        if (axis === 'x') { pivot.rotation.z = th; v.x = L * Math.sin(th); } else { pivot.rotation.x = th; v.z = -L * Math.sin(th); }
        v.y = L - L * Math.cos(th);
      }),
    });
  },

  // ---------- GLASS BRIDGE: pairs of glass panes, one of each pair shatters. The fake ones shimmer now and then.
  // Pass `mat` for trick tiles in another look (e.g. gravestones).
  glassBridge({ x = 0, y, z0, rows = 6, gap = 3.2, spread = 1.5, seed = 1, size = 2.2, mat = null }) {
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const glass = mat || this.mat('glass', () => new THREE.MeshStandardMaterial({ color: 0xbfefff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5, emissive: 0x204050, emissiveIntensity: 0.3 }));
    const fake = glass.clone();
    if (mat) fake.emissive.set(0x40ff90);
    for (let i = 0; i < rows; i++) {
      const z = z0 - i * gap;
      const bad = rnd() < 0.5 ? -1 : 1;
      for (const sd of [-1, 1]) {
        const isFake = sd === bad;
        this.plat({ x: x + sd * spread, y, z, w: size, d: size, h: mat ? 0.6 : 0.25, mat: isFake ? fake : glass, type: isFake ? 'crumble' : 'solid', crumbleDelay: 0.06, neon: false });
      }
    }
    for (const sd of [-1, 1]) {
      const rail = new THREE.Mesh(boxGeo(0.15, 0.15, rows * gap, 2), this.M.metal);
      rail.position.set(x + sd * (spread + size / 2 + 0.2), y - 0.2, z0 - (rows - 1) * gap / 2); this.add(rail);
    }
    const base = mat ? 0 : 0.3;
    this.world.anim.push((t) => { const u = cyc(t, 3.1); fake.emissiveIntensity = u < 0.1 ? base + Math.abs(Math.sin(u * 31)) * 0.5 : base; });
  },

  // ---------- CLICK-CLACK BLOCKS: red blocks are solid while blue are ghosts, and every jump you make swaps them
  clickClack({ x, y, z, w = 3, d = 3, red = true }) {
    const color = red ? 0xff3a5a : 0x3a8aff;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0.35, transparent: true });
    const col = this.plat({ x, y, z, w, d, h: 0.8, mat, neon: false });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.8, d)), new THREE.LineBasicMaterial({ color, toneMapped: false }));
    col.mesh.add(edges);
    let last = -1;
    this.world.anim.push(() => {
      const P = this.world.player;
      const solid = ((P ? P.jumps : 0) % 2 === 0) === red;
      if (solid === last) return;
      last = solid;
      col.active = solid;
      mat.opacity = solid ? 1 : 0.12; mat.depthWrite = solid;
      col.mesh.castShadow = solid;
    });
    return col;
  },

  // ---------- WINDMILL: giant blades turning across the path (in the X-Y plane). Slip under between blades.
  windmill({ x = 0, y, z, r = 5, speed = 0.9, blades = 3, phase = 0, side = 1 }) {
    const hubY = y + r - 0.4;
    const rotor = new THREE.Group(); rotor.position.set(x, hubY, z); this.add(rotor);
    const sail = this.mat('sail', () => new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.9, side: THREE.DoubleSide }));
    for (let k = 0; k < blades; k++) {
      const arm = new THREE.Group(); arm.rotation.z = k / blades * TAU; rotor.add(arm);
      const spar = new THREE.Mesh(boxGeo(r, 0.25, 0.25, 2), this.M.wood); spar.position.x = r / 2; arm.add(spar);
      const cloth = new THREE.Mesh(boxGeo(r * 0.75, 0.9, 0.08, 2), sail); cloth.position.set(r * 0.6, 0.4, 0); cloth.castShadow = true; arm.add(cloth);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 12), this.M.iron); hub.rotation.x = Math.PI / 2; rotor.add(hub);
    // axle out to a tower beside the path
    const tx = x + side * (r + 2.5);
    this.add(this.cylinderBetween(new V3(x, hubY, z), new V3(tx, hubY, z), 0.2, this.M.iron));
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, hubY - y + 30, 8), this.M.stone);
    tower.position.set(tx, hubY - (hubY - y + 30) / 2 + 1, z); tower.castShadow = true; this.add(tower);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.4, 8), this.M.wood); roof.position.set(tx, hubY + 2.2, z); this.add(roof);
    for (let k = 0; k < blades; k++) {
      for (let rr = 1.2; rr < r; rr += 0.9) {
        const holder = new THREE.Object3D(); holder.position.set(x, hubY, z);
        this.world.colliders.push(new Collider(holder, 0.5, 0.5, 0.3, {
          type: 'knock', knockPower: 11,
          motion: (t) => { const o = this.zero(); const a = phase + t * speed + k / blades * TAU; o.x = Math.cos(a) * rr; o.y = Math.sin(a) * rr; return o; },
        }));
      }
    }
    this.world.anim.push((t) => { rotor.rotation.z = phase + t * speed; });
  },

  // ---------- UPDRAFT FAN: a column of rising air. Jump in to float up, then steer out at the top.
  updraft({ x, y, z, r = 1.6, h = 12, force = 36, maxUp = 8 }) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.4, 0.5, 20), this.M.iron);
    base.position.set(x, y - 0.25, z); this.add(base);
    this.world.colliders.push(new Collider(base, (r + 0.3) * 0.75, 0.25, (r + 0.3) * 0.75));
    const blades = new THREE.Group(); blades.position.set(x, y + 0.05, z); this.add(blades);
    for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(boxGeo(r * 1.8, 0.06, 0.4, 2), this.M.metal); bl.rotation.y = k * Math.PI / 4; bl.rotation.x = 0.3; blades.add(bl); }
    const colMat = addMat(0xbfeaff, 0.12);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), colMat);
    column.position.set(x, y + h / 2, z); this.add(column);
    const rings = [];
    for (let k = 0; k < 4; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.04, 6, 24), addMat(0xe8f8ff, 0.5));
      ring.rotation.x = Math.PI / 2; this.add(ring); rings.push(ring);
    }
    const world = this.world;
    world.anim.push((t, dt) => {
      blades.rotation.y = t * 14;
      rings.forEach((ring, k) => { const u = cyc(t * 0.6 + k / 4, 1); ring.position.set(x, y + u * h, z); ring.material.opacity = 0.5 * (1 - u); });
      const P = world.player;
      if (P && !P.hang && nearXZ(P, x, z, r) && P.pos.y > y - 0.6 && P.pos.y < y + h) {
        const k = Math.min(1, (y + h - P.pos.y) / 3); // eases off near the top so you hover
        P.vel.y = Math.min(maxUp, P.vel.y + force * k * dt);
        P.vel.y = Math.max(P.vel.y, -4);
      }
    });
  },

  // ---------- ROLLING LOGS: logs roll toward you (along +Z) from z1 to z0. Jump them!
  logs({ x = 0, y, z0, z1, w = 4, speed = 6, gap = 2.6, count = 3, r = 0.45, phase = 0 }) {
    const L = z0 - z1, C = count * gap * speed;
    const logMat = this.mat('log', () => new THREE.MeshStandardMaterial({ map: this.tex.wood, roughness: 0.9 }));
    for (let k = 0; k < count; k++) {
      const off = k * gap * speed + phase * speed;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), logMat);
      log.rotation.z = Math.PI / 2; log.castShadow = true;
      const g = new THREE.Group(); g.add(log); g.position.set(x, y + r, z1); this.add(g);
      const holder = new THREE.Object3D(); holder.position.set(x, y + r, z1);
      const col = new Collider(holder, w / 2, r, r, {
        type: 'knock', knockPower: 9,
        motion: (t) => { const o = this.zero(); o.z = Math.min(L, ((t * speed + off) % C + C) % C); return o; },
      });
      this.world.colliders.push(col);
      this.world.anim.push((t) => {
        const u = ((t * speed + off) % C + C) % C;
        const live = u < L;
        col.active = live; g.visible = live;
        g.position.z = z1 + Math.min(u, L); g.rotation.x = u / r;
      });
    }
    // gate the logs roll out of
    for (const s of [-1, 1]) this.post(x + s * (w / 2 + 0.4), y, y + 3.4, z1 - 0.6, true, this.M.stone, 0.4);
    const lintel = new THREE.Mesh(boxGeo(w + 1.6, 0.8, 1.0, 2), this.M.stone); lintel.position.set(x, y + 3.6, z1 - 0.6); this.add(lintel);
  },

  // ---------- SHRINKING PAD: shrinks away to nothing and grows back
  shrinkPad({ x, y, z, w = 3.5, d = 3.5, period = 4, phase = 0, min = 0, style = 'trim' }) {
    const col = this.plat({ x, y, z, w, d, h: 0.5, style });
    this.world.anim.push((t) => {
      const s = min + (1 - min) * (0.5 + 0.5 * Math.cos(cyc(t, period, phase) * TAU));
      col.half.x = w / 2 * s; col.half.z = d / 2 * s; col.bxz = Math.hypot(col.half.x, col.half.z);
      col.mesh.scale.set(Math.max(0.01, s), 1, Math.max(0.01, s));
      col.active = s > 0.12;
    });
    return col;
  },

  // ---------- BARREL CANNON: jump into the barrel and it fires you onto the target. Barrels can move (motion).
  barrel({ x, y, z, to, time = 1.2, motion }) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.add(g);
    const aim = new THREE.Group(); g.add(aim);
    const wood = this.mat('barrelWood', () => new THREE.MeshStandardMaterial({ map: this.tex.wood, roughness: 0.8 }));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.0, 16, 1, true), wood); body.material.side = THREE.DoubleSide; aim.add(body);
    for (const yy of [-0.8, 0.8]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.07, 6, 20), this.M.iron); hoop.rotation.x = Math.PI / 2; hoop.position.y = yy; aim.add(hoop); }
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.5, 5), glowMat(0xffd84d)); star.position.y = -0.95; star.rotation.x = Math.PI / 2; aim.add(star);
    const world = this.world, sfx = this.sfx;
    let cool = 0;
    const cur = new V3(x, y, z);
    const vel = (P) => {
      const T = time, gg = G * (P ? P.gScale : 1);
      return new V3((to.x - cur.x) / T, (to.y - (cur.y - 0.8)) / T + 0.5 * gg * T, (to.z - cur.z) / T);
    };
    const orient = () => { const v = vel(world.player).normalize(); aim.quaternion.setFromUnitVectors(new V3(0, 1, 0), v); };
    orient();
    world.anim.push((t, dt) => {
      if (motion) { const o = motion(t); cur.set(x + (o.x || 0), y + (o.y || 0), z + (o.z || 0)); g.position.copy(cur); orient(); }
      cool -= dt;
      const P = world.player;
      if (!P || P.hang || cool > 0) return;
      const dx = P.pos.x - cur.x, dy = P.pos.y + 0.8 - cur.y, dz = P.pos.z - cur.z;
      if (dx * dx + dy * dy + dz * dz < 1.3 * 1.3) {
        cool = 0.8;
        P.pos.set(cur.x, cur.y - 0.8, cur.z);
        P.vel.copy(vel(P));
        P.onGround = false; P.ground = null; P.launchT = time; // weak air control so you fly where it aims
        sfx.cannon();
        g.scale.setScalar(1.25);
      }
      g.scale.setScalar(1 + (g.scale.x - 1) * 0.85);
    });
  },

  // ---------- CRUSHER: a heavy block that slams down onto the path. Run under while it's up.
  crusher({ x = 0, y, z, w = 3, d = 3, top = 5, period = 3, phase = 0, solidFrame = true }) {
    const hh = 1.2;
    const g = new THREE.Group(); this.add(g);
    const block = new THREE.Mesh(boxGeo(w, hh * 2, d, 2), this.M.iron); block.castShadow = true; g.add(block);
    const teeth = new THREE.Mesh(boxGeo(w + 0.05, 0.3, d + 0.05, 2), this.M.danger); teeth.position.y = -hh + 0.15; g.add(teeth);
    g.position.set(x, y + top + hh, z);
    const bottomAt = (u) => {
      if (u < 0.5) return top; // up
      if (u < 0.58) { const k = (u - 0.5) / 0.08; return top * (1 - k * k); } // slam
      if (u < 0.72) return 0.02; // down
      return top * (u - 0.72) / 0.28; // rise
    };
    const col = new Collider(g, w / 2, hh, d / 2, {
      type: 'knock', knockPower: 12,
      motion: (t) => { const o = this.zero(); const u = cyc(t, period, phase); o.y = bottomAt(u) - top; if (u > 0.4 && u < 0.5) o.x = (Math.random() - 0.5) * 0.08; return o; },
    });
    this.world.colliders.push(col);
    for (const s of [-1, 1]) this.post(x + s * (w / 2 + 0.35), y, y + top + hh * 2 + 0.6, z, solidFrame, this.M.iron, 0.2);
    const cap = new THREE.Mesh(boxGeo(w + 1.2, 0.4, 0.6, 2), this.M.iron); cap.position.set(x, y + top + hh * 2 + 0.8, z); this.add(cap);
    let was = 0;
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      if (was < 0.58 && u >= 0.58) {
        const P = this.world.player;
        if (nearXZ(P, x, z, 14)) { this.sfx.slam(); this.world.events.push({ type: 'shake', amount: 0.2 }); }
      }
      was = u;
    });
    return col;
  },

  // ---------- BEAM: a narrow balance beam that can sway sideways (amp) or spin around its centre (spin)
  beam({ x = 0, y, z, len = 10, w = 0.5, amp = 0, period = 3, phase = 0, spin = 0, style = 'wood' }) {
    return this.plat({
      x, y, z, w, d: len, h: 0.4, style,
      motion: amp || spin ? this.mo((v, t) => { if (amp) v.x = amp * Math.sin(t / period * TAU + phase); if (spin) v.yaw = t * spin; }) : undefined,
    });
  },

  // ---------- PINBALL BUMPER: a glowing post that bounces you away hard
  bumper({ x, y, z, r = 0.8, h = 1.6, power = 13, color = 0xff4dd2 }) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 20), this.M.metal);
    body.position.set(x, y + h / 2, z); body.castShadow = true; this.add(body);
    const ringMat = glowMat(color);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.12, 8, 24), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + h * 0.6, z); this.add(ring);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, 0.2, 20), ringMat); top.position.set(x, y + h + 0.1, z); this.add(top);
    const col = new Collider(body, r * 0.85, h / 2 + 0.1, r * 0.85, { type: 'knock', knockPower: power });
    col.spiky = true;
    this.world.colliders.push(col);
    this.world.anim.push((t) => { const s = 1 + Math.sin(t * 6 + x) * 0.06; ring.scale.set(s, s, s); });
    return col;
  },

  // ---------- FLIPPER: a pinball paddle that swats across the path from a pivot
  flipper({ x, y, z, len = 4, side = 1, period = 2.2, phase = 0, color = 0xff4dd2 }) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.add(g);
    const paddle = new THREE.Mesh(boxGeo(len, 0.9, 0.6, 2), this.M.danger); paddle.castShadow = true; g.add(paddle);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12), glowMat(color)); pin.position.set(x, y + 0.6, z); this.add(pin);
    const rest = side > 0 ? Math.PI + 0.5 : -0.5, hit = side > 0 ? Math.PI - 0.6 : 0.6; // pivot at x, paddle points toward the path
    const col = new Collider(g, len / 2, 0.45, 0.3, {
      type: 'knock', knockPower: 14,
      motion: (t) => {
        const u = cyc(t, period, phase);
        const k = u < 0.12 ? u / 0.12 : u < 0.3 ? 1 : u < 0.6 ? 1 - (u - 0.3) / 0.3 : 0;
        const a = rest + (hit - rest) * k;
        const o = this.zero();
        o.x = Math.cos(a) * len / 2; o.z = -Math.sin(a) * len / 2; o.yaw = a; o.y = 0.45;
        return o;
      },
    });
    this.world.colliders.push(col);
    return col;
  },

  // ---------- PORTAL: step into ring A and come out of ring B with your speed intact
  portal({ a, b, color = 0xb04dff, exitColor = 0x4dffd2 }) {
    const ring = (p, c) => {
      const g = new THREE.Group(); g.position.set(p.x, p.y + 1.4, p.z); this.add(g);
      const torus = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.14, 10, 40), glowMat(c)); g.add(torus);
      const swirl = new THREE.Mesh(new THREE.CircleGeometry(1.22, 40), addMat(c, 0.35)); g.add(swirl);
      const inner = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.9, 5, 1), addMat(0xffffff, 0.25)); inner.position.z = 0.01; g.add(inner);
      this.world.anim.push((t) => { inner.rotation.z = t * 3; swirl.material.opacity = 0.3 + 0.1 * Math.sin(t * 4); });
      return g;
    };
    ring(a, color); ring(b, exitColor);
    const world = this.world, sfx = this.sfx;
    let cool = 0;
    world.anim.push((t, dt) => {
      cool -= dt;
      const P = world.player;
      if (!P || P.hang || cool > 0) return;
      const dx = P.pos.x - a.x, dy = P.pos.y + 0.9 - (a.y + 1.4), dz = P.pos.z - a.z;
      if (Math.abs(dz) < 0.6 && dx * dx + dy * dy < 1.2 * 1.2) {
        cool = 0.6;
        P.pos.set(b.x + dx, b.y + Math.max(0.05, P.pos.y - a.y), b.z + Math.sign(P.vel.z || -1) * 0.7);
        P.onGround = false; P.ground = null;
        sfx.warp();
        world.events.push({ type: 'shake', amount: 0.15 });
      }
    });
  },

  // ---------- ROCKFALL: meteors / stalactites rain onto a zone at surface height y. Red rings mark the impacts.
  rockfall({ x0, x1, z0, z1, y, period = 1.1, aim = 0.5, color = 0xff6a2a, fall = 1.1 }) {
    const world = this.world, sfx = this.sfx, g = this.g;
    const pool = [];
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 1, flatShading: true, emissive: color, emissiveIntensity: 0.6 });
    for (let k = 0; k < 5; k++) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), rockMat);
      const trail = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 8, 1, true), addMat(color, 0.45)); trail.position.y = 2.6; rock.add(trail);
      const marker = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 28), glowMat(0xff2a1a, 0.8)); marker.rotation.x = -Math.PI / 2;
      rock.visible = marker.visible = false; g.add(rock, marker);
      pool.push({ rock, marker, t: -1, at: new V3() });
    }
    let last = null, seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    world.anim.push((t, dt) => {
      const n = Math.floor(t / period);
      const P = world.player;
      if (n !== last) {
        last = n;
        const m = pool.find((q) => q.t < 0);
        const inZone = P && P.pos.x > x0 - 2 && P.pos.x < x1 + 2 && P.pos.z < z0 + 4 && P.pos.z > z1 - 4;
        if (m && inZone) {
          m.t = 0;
          if (rnd() < aim) m.at.set(Math.min(x1, Math.max(x0, P.pos.x + P.vel.x * 0.6)), y, Math.min(z0, Math.max(z1, P.pos.z + P.vel.z * 0.6)));
          else m.at.set(x0 + rnd() * (x1 - x0), y, z0 + rnd() * (z1 - z0));
          m.marker.position.set(m.at.x, y + 0.06, m.at.z); m.marker.visible = true; m.rock.visible = true;
        }
      }
      for (const m of pool) {
        if (m.t < 0) continue;
        m.t += dt;
        const k = m.t / fall;
        m.rock.position.set(m.at.x + (1 - k) * 6, y + 0.8 + (1 - k) * 34, m.at.z);
        m.rock.rotation.x += dt * 4;
        m.marker.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(m.t * 10));
        if (k >= 1) {
          m.t = -1; m.rock.visible = m.marker.visible = false;
          if (P) {
            const dx = P.pos.x - m.at.x, dz = P.pos.z - m.at.z;
            if (dx * dx + dz * dz < 1.7 * 1.7 && Math.abs(P.pos.y - y) < 2.2) P.knock(dx || 0.5, dz || 0.5, 10, 8, 'obstacle');
          }
          if (nearXZ(P, m.at.x, m.at.z, 25)) { sfx.boulder(); world.events.push({ type: 'shake', amount: 0.15 }); }
        }
      }
    });
  },

  // ---------- MUD: a bog that slows your run and saps your jump
  mud({ x = 0, y, z, w = 4, d = 8 }) {
    const m = this.mat('mud', () => new THREE.MeshStandardMaterial({ map: themeTex({ p: 'cracks', a: '#4a3420', b: ['#3a2814', '#5e4429', '#2e2010'], line: 'rgba(20,12,4,0.7)', seed: 77 }), roughness: 0.6, metalness: 0.05 }));
    return this.plat({ x, y, z, w, d, h: 0.8, mat: m, mud: true });
  },

  // ---------- RETRACTING BAR: a grab bar that pulls back into its housing on a timer (and drops you)
  retractBar(x, y, z, width, { period = 3, on = 0.6, phase = 0, motion } = {}) {
    this.bar(x, y, z, width, motion);
    const g = this.world.grabbables[this.world.grabbables.length - 1];
    const barMesh = g.mesh.children[0];
    const warnMat = this.mat('gripWarn', () => new THREE.MeshStandardMaterial({ color: 0xff4a3a, emissive: 0x801010, emissiveIntensity: 1 }));
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const out = u < on;
      g.disabled = !out;
      if (!out && g.grabbed) g.forceRelease = true;
      const s = out ? 1 : Math.max(0.05, 1 - (u - on) * 12);
      barMesh.scale.y = out ? 1 : s;
      barMesh.material = out && u > on - 0.15 ? warnMat : this.M.grip;
    });
  },

  // ---------- FLAME JET: a vent that blasts a column of fire. Too tall to jump; wait for it to die down.
  flameJet({ x, y, z, period = 2.6, on = 0.4, phase = 0, h = 4.5, r = 0.75 }) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 1.1, 0.25, 12), this.M.iron);
    vent.position.set(x, y + 0.12, z); this.add(vent);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(r * 0.6, 16), glowMat(0xff7a20)); glow.rotation.x = -Math.PI / 2; glow.position.set(x, y + 0.26, z); this.add(glow);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12, 1, true), addMat(0xff6a10, 0.8));
    fire.position.set(x, y + h / 2, z); fire.rotation.x = Math.PI; this.add(fire);
    const core = new THREE.Mesh(new THREE.ConeGeometry(r * 0.5, h * 0.8, 10, 1, true), addMat(0xffe080, 0.9));
    core.position.set(x, y + h * 0.4, z); core.rotation.x = Math.PI; this.add(core);
    const holder = new THREE.Object3D(); holder.position.set(x, y + h / 2, z);
    const col = new Collider(holder, r, h / 2, r, { type: 'knock', knockPower: 11 });
    col.spiky = true; col.active = false;
    this.world.colliders.push(col);
    let wasOn = false;
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const live = u < on, warn = !live && u > 1 - 0.15;
      col.active = live;
      const s = live ? 1 + Math.sin(t * 30) * 0.08 : warn ? 0.18 : 0.001;
      fire.scale.set(live ? 1 : 0.5, s, live ? 1 : 0.5); core.scale.set(1, s, 1);
      fire.position.y = y + h * s / 2; core.position.y = y + h * 0.4 * s;
      if (live && !wasOn && nearXZ(this.world.player, x, z, 12)) this.sfx.fireHit();
      wasOn = live;
    });
    return col;
  },

  // ---------- ORBITING PLATFORMS: n platforms circling a hub at radius R
  orbit({ cx = 0, y, cz, R = 6, n = 3, speed = 0.5, w = 3, d = 3, phase = 0, style = 'trim', hub = true }) {
    for (let k = 0; k < n; k++) {
      this.plat({ x: cx, y, z: cz, w, d, h: 0.5, style, motion: this.mo((v, t) => { const a = t * speed + phase + k / n * TAU; v.x = Math.cos(a) * R; v.z = -Math.sin(a) * R; v.yaw = a; }) });
    }
    if (hub) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 20, 12), this.M.iron);
      pillar.position.set(cx, y - 10.5, cz); this.add(pillar);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), glowMat(0xffe08a)); orb.position.set(cx, y + 0.4, cz); this.add(orb);
    }
  },

  // ---------- CAROUSEL BARS: grab bars riding round a central mast
  carousel({ cx = 0, y, cz, R = 5, n = 4, speed = 0.6, phase = 0 }) {
    const spin = new THREE.Group(); spin.position.set(cx, y + 2.65, cz); this.add(spin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 30, 12), this.brass());
    mast.position.set(cx, y - 12, cz); this.add(mast);
    const top = new THREE.Mesh(new THREE.ConeGeometry(R * 0.5, 1.5, 16), this.M.danger); top.position.set(cx, y + 3.6, cz); this.add(top);
    for (let k = 0; k < n; k++) {
      const a0 = phase + k / n * TAU;
      const arm = new THREE.Mesh(boxGeo(R, 0.2, 0.2, 2), this.brass()); arm.position.x = R / 2; const ag = new THREE.Group(); ag.rotation.y = a0; ag.add(arm); spin.add(ag);
      this.bar(cx, y, cz, 2.6, (t) => { const o = this.zero(); const a = t * speed + a0; o.x = Math.cos(a) * R; o.z = -Math.sin(a) * R; return o; });
    }
    this.world.anim.push((t) => { spin.rotation.y = t * speed; });
  },

  // ---------- GLITCH BLOCK: jumps between two spots every half period (flickers just before). A ghost shows the other spot.
  glitch({ x, y, z, w = 3, d = 3, alt, period = 3, phase = 0, color = 0x4dfff0 }) {
    const off = { x: alt.x - x, y: alt.y - y, z: alt.z - z };
    const mat = new THREE.MeshStandardMaterial({ color: 0x14202a, roughness: 0.4, emissive: color, emissiveIntensity: 0.25 });
    const col = this.plat({ x, y, z, w, d, h: 0.5, mat, neon: false, motion: this.mo((v, t) => { if (cyc(t, period, phase) >= 0.5) { v.x = off.x; v.y = off.y; v.z = off.z; } }) });
    col.mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.5, d)), new THREE.LineBasicMaterial({ color, toneMapped: false })));
    const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.5, d)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3, toneMapped: false }));
    this.add(ghost);
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const second = u >= 0.5;
      ghost.position.set(second ? x : alt.x, (second ? y : alt.y) - 0.25, second ? z : alt.z);
      const left = second ? 1 - u : 0.5 - u;
      const flick = left < 0.1 && Math.floor(t * 24) % 2 === 0;
      col.mesh.visible = !flick;
      mat.emissiveIntensity = left < 0.1 ? 0.9 : 0.25;
    });
    return col;
  },

  // ---------- VORTEX: a whirlwind zone that drags you round its centre (dir 1 = anticlockwise from above)
  vortex({ cx = 0, cz, y0, y1, R = 9, force = 7, dir = 1 }) {
    const world = this.world;
    const funnelMat = addMat(0xbfc8d8, 0.08);
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.4, y1 - y0 + 10, 24, 6, true), funnelMat);
    funnel.position.set(cx, (y0 + y1) / 2, cz); this.add(funnel);
    const debris = [];
    const dm = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 1, flatShading: true });
    for (let k = 0; k < 26; k++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2 + (k % 4) * 0.12), dm);
      this.add(m); debris.push({ m, r: R * (0.5 + (k * 0.37) % 0.6), h: y0 + ((k * 2.3) % (y1 - y0 + 6)) - 2, a: k * 1.7, w: 1.2 + (k % 5) * 0.2 });
    }
    world.anim.push((t, dt) => {
      funnel.rotation.y = t * dir * 1.5;
      for (const d of debris) { const a = d.a + t * d.w * dir; d.m.position.set(cx + Math.cos(a) * d.r, d.h + Math.sin(t + d.a) * 0.8, cz - Math.sin(a) * d.r); d.m.rotation.x += dt * 3; }
      const P = world.player;
      if (!P || P.hang || P.pos.y < y0 - 1 || P.pos.y > y1) return;
      const dx = P.pos.x - cx, dz = P.pos.z - cz, r = Math.hypot(dx, dz);
      if (r > R || r < 0.5) return;
      // same sense as orbit(): position (cos a, −sin a) moves along (−sin a, −cos a) = (dz, −dx) / r
      const tx = dz / r * dir, tz = -dx / r * dir;
      const f = force * (1 - r / R * 0.5);
      if (P.onGround) { P.pos.x += tx * f * 0.35 * dt; P.pos.z += tz * f * 0.35 * dt; } else { P.vel.x += tx * f * dt; P.vel.z += tz * f * dt; }
    });
  },

  // ---------- PULSE PATH: a row of light tiles along -Z, lit by a travelling wave. Only lit tiles are solid. Run with the wave!
  pulsePath({ x = 0, y, z0, n = 10, step = 3, w = 2.6, d = 2.4, speed = 5, period = 4, window = 0.4, rise = 0, color = 0xffd84d }) {
    const tiles = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x202028, roughness: 0.3, emissive: color, emissiveIntensity: 0, transparent: true });
      const col = this.plat({ x, y: y + i * rise, z: z0 - i * step, w, d, h: 0.35, mat, neon: false });
      col.mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.35, d)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, toneMapped: false })));
      tiles.push({ col, mat, lag: i * step / speed });
    }
    this.world.anim.push((t) => {
      for (const tl of tiles) {
        const u = cyc(t - tl.lag, period);
        const lit = u < window, warn = lit && u > window - 0.08;
        tl.col.active = lit;
        tl.mat.emissiveIntensity = lit ? (warn && Math.floor(t * 16) % 2 ? 0.2 : 1.4) : 0;
        tl.mat.opacity = lit ? 1 : 0.15; tl.mat.depthWrite = lit;
      }
    });
    return tiles;
  },

  // ---------- JELLYFISH: a drifting, bouncy jellyfish (a moving trampoline)
  jelly({ x, y, z, r = 1.6, bounce = 15, motion, color = 0xff7af0 }) {
    const col = this.plat({ x, y, z, w: r * 1.5, d: r * 1.5, h: 0.6, type: 'tramp', bounce, motion, mat: hidden, shadow: false });
    const bell = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.2, transparent: true, opacity: 0.7, emissive: color, emissiveIntensity: 0.7, side: THREE.DoubleSide }));
    bell.scale.y = 0.4; bell.position.y = -0.3; col.mesh.add(bell);
    const tentMat = addMat(color, 0.55);
    const tents = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      const tt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 3, 4), tentMat);
      tt.position.set(Math.cos(a) * r * 0.6, -1.9, Math.sin(a) * r * 0.6); col.mesh.add(tt); tents.push(tt);
    }
    this.world.anim.push((t) => tents.forEach((tt, k) => { tt.rotation.x = Math.sin(t * 2 + k) * 0.25; tt.rotation.z = Math.cos(t * 1.7 + k) * 0.25; }));
    return col;
  },

  // ---------- PULSE EMITTER: a pylon that sends shockwave rings along the floor (surface height y). Jump each ring.
  pulseEmitter({ x, y, z, period = 2.6, phase = 0, maxR = 12, speed = 6, color = 0xffa040 }) {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.4, 10), this.M.iron);
    pylon.position.set(x, y + 1.2, z); this.add(pylon);
    this.world.colliders.push(new Collider(pylon, 0.55, 1.2, 0.55));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), glowMat(color)); core.position.set(x, y + 2.7, z); this.add(core);
    const mat = addMat(color, 0.8);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 48, 1, true), mat); ring.position.set(x, y + 0.3, z); this.add(ring);
    const world = this.world;
    let hit = false, lastN = null;
    world.anim.push((t) => {
      const tt = t + phase, n = Math.floor(tt / period);
      const r = 0.8 + (tt - n * period) * speed;
      if (n !== lastN) { lastN = n; hit = false; }
      const live = r < maxR;
      ring.visible = live; ring.scale.set(r, 1, r); mat.opacity = 0.8 * (1 - r / maxR);
      core.scale.setScalar(1 + Math.max(0, 0.4 - (tt - n * period)) * 1.5);
      const P = world.player;
      if (live && !hit && P) {
        const dx = P.pos.x - x, dz = P.pos.z - z, d = Math.hypot(dx, dz);
        if (Math.abs(d - r) < 0.55 && P.pos.y < y + 0.55 && P.pos.y > y - 0.5) { hit = true; P.knock(dx || 1, dz, 9, 7, 'obstacle'); }
      }
    });
  },

  // ---------- CHAIN COLLAPSE: step on the first tile and the path starts falling apart from behind — keep running!
  // xs / ys: optional per-tile x offsets and heights so the path can weave and climb.
  collapse({ x = 0, y, z0, n = 10, step = 3, w = 2.6, d = 2.6, interval = 0.42, lead = 0.9, style = 'trim', xs = null, ys = null }) {
    const tiles = [];
    for (let i = 0; i < n; i++) {
      const col = this.plat({ x: x + (xs ? xs[i % xs.length] : 0), y: y + (ys ? ys[i] : 0), z: z0 - i * step, w, d, h: 0.5, style, type: 'crumble', crumbleDelay: 0.35 });
      tiles.push(this.world.crumbles[this.world.crumbles.length - 1]);
      col.mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.5, d)), new THREE.LineBasicMaterial({ color: 0xff6a3a, toneMapped: false })));
    }
    let start = -1;
    const fired = new Array(n).fill(false);
    const first = tiles[0].col, orig = first.onStand;
    let now = 0;
    first.onStand = () => { orig(); if (start < 0) start = now; };
    this.world.anim.push((t) => {
      now = t;
      if (start < 0) return;
      // everything back in place (respawn, or the whole chain fell and reset) → re-arm
      if (fired.some(Boolean) && tiles.every((c) => c.state === 'idle')) { start = -1; fired.fill(false); return; }
      for (let i = 0; i < n; i++) if (!fired[i] && t - start > lead + i * interval) { fired[i] = true; tiles[i].trigger(); }
    });
    return tiles;
  },

  // ---------- SPINNING SHAFT: two wall-jump walls rotating round a vertical axis. Wall jump up while it turns.
  spinWalls({ x = 0, y, z, gap = 4.2, h = 14, d = 4, speed = 0.4, phase = 0 }) {
    for (const s of [-1, 1]) {
      this.plat({
        x, y, z, w: 0.6, d, h, style: 'wall', type: 'wall',
        motion: this.mo((v, t) => { const a = t * speed + phase; v.x = Math.cos(a) * s * gap / 2; v.z = -Math.sin(a) * s * gap / 2; v.yaw = a; }),
      });
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), this.M.danger); cap.position.set(x, y + 0.5, z); this.add(cap);
  },
});

