// Parkour obstacles for worlds 39–50, plus the gadgets. Installed onto Builder.prototype like obstacles.js.
// Same conventions: travel is -Z, platforms are placed by their TOP surface height.
import * as THREE from 'three';
import { Builder } from './builder.js';
import { boxGeo } from './textures.js';
import { Collider, Bar } from './world.js';
import { makeGunModel, makeHookModel } from './tools.js';

const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const glowMat = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false });
const addMat = (color, opacity = 0.5) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const hidden = new THREE.MeshBasicMaterial({ visible: false });
const cyc = (t, period, phase = 0) => ((((t + phase) % period) + period) % period) / period;
const nearXZ = (P, x, z, r) => !!P && (P.pos.x - x) ** 2 + (P.pos.z - z) ** 2 < r * r;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function stripeTex(c1, c2, n = 8) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = c1; g.fillRect(0, 0, 64, 64);
  g.fillStyle = c2;
  for (let i = -n; i < n * 2; i += 2) { g.beginPath(); g.moveTo(i * 64 / n, 0); g.lineTo((i + 1) * 64 / n, 0); g.lineTo((i + 1) * 64 / n - 64, 64); g.lineTo(i * 64 / n - 64, 64); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

Object.assign(Builder.prototype, {
  // =====================================================================================
  // GADGETS
  // =====================================================================================

  // ---------- TOOL STATION: a pedestal that hands you the blaster ('gun') or the grappler ('grapple')
  toolStation({ x, y, z, tool = 'grapple' }) {
    const color = tool === 'gun' ? 0x4dffd2 : 0xffb02e;
    this.plat({ x, y: y + 0.6, z, w: 1.2, d: 1.2, h: 1.2, style: 'metal' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 8, 40), glowMat(color)); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + 0.05, z); this.add(ring);
    const model = tool === 'gun' ? makeGunModel() : makeHookModel();
    model.scale.setScalar(3.2); model.position.set(x, y + 2.1, z); this.add(model);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 16, 1, true), addMat(color, 0.25)); beam.position.set(x, y + 1.8, z); this.add(beam);
    const world = this.world;
    world.anim.push((t) => {
      model.rotation.y = t * 1.5; model.position.y = y + 2.1 + Math.sin(t * 2) * 0.12;
      const P = world.player;
      if (P && P.tool !== tool && nearXZ(P, x, z, 1.9) && Math.abs(P.pos.y - y) < 2.5) {
        P.tool = tool; this.sfx.pickup();
        world.events.push({ type: 'tool', tool });
      }
      beam.material.opacity = P && P.tool === tool ? 0.08 : 0.25;
    });
  },

  // ---------- SLOW-MO PAD: step on it and time slows down for `dur` real seconds. Optionally hands you a gadget too.
  slowPad({ x, y, z, dur = 8, give = 'gun' }) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#0a1a3a'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#6ad0ff'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.moveTo(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40); g.lineTo(64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48); g.stroke(); }
    g.lineWidth = 8; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(90, 64); g.stroke();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.8, roughness: 0.4 });
    const M = this.M.metal;
    const col = this.plat({ x, y, z, w: 2.8, d: 2.8, h: 0.3, mat: [M, M, face, M, M, M], neon: false });
    let model = null;
    if (give) { model = give === 'gun' ? makeGunModel() : makeHookModel(); model.scale.setScalar(2.5); model.position.set(x, y + 1.6, z); this.add(model); }
    const world = this.world;
    let stood = 0, was = false;
    col.onStand = () => { stood = 0.1; };
    world.anim.push((t, dt) => {
      if (model) { model.rotation.y = t * 1.5; model.visible = !world.player || world.player.tool !== give; }
      const on = stood > 0; stood -= dt;
      face.emissiveIntensity = world.slowmo > 0 ? 1.6 : 0.8;
      if (on && !was) {
        const P = world.player;
        if (give && P && P.tool !== give) { P.tool = give; this.sfx.pickup(); world.events.push({ type: 'tool', tool: give }); }
        if (world.slowmo <= 0.5) world.events.push({ type: 'slowmo' });
        world.slowmo = Math.max(world.slowmo, dur);
      }
      was = on;
    });
    return col;
  },

  // ---------- TARGET: a bullseye for the blaster. onHit fires once. Optional motion.
  target({ x, y, z, r = 0.7, yaw = 0, motion = null, onHit = null }) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; this.add(g);
    const red = glowMat(0xff2a3a), white = glowMat(0xffffff);
    [[r, red], [r * 0.75, white], [r * 0.5, red], [r * 0.25, white]].forEach(([rr, m], i) => {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(rr, 32), m); disc.position.z = 0.02 + i * 0.01; g.add(disc);
      const back = disc.clone(); back.rotation.y = Math.PI; back.position.z = -0.02 - i * 0.01; g.add(back);
    });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 32), this.M.gold); g.add(rim);
    const halo = new THREE.Mesh(new THREE.RingGeometry(r * 1.1, r * 1.45, 32), addMat(0xff4d6a, 0.4)); g.add(halo);
    const T = { pos: new V3(x, y, z), r, dead: false, spin: 0 };
    T.hit = () => {
      if (T.dead) return;
      T.dead = true; T.spin = 1;
      this.sfx.ding();
      if (onHit) onHit(T);
    };
    this.world.targets.push(T);
    this.world.anim.push((t, dt) => {
      if (motion) { const o = motion(t); g.position.set(x + (o.x || 0), y + (o.y || 0), z + (o.z || 0)); T.pos.copy(g.position); }
      halo.material.opacity = T.dead ? 0 : 0.25 + 0.2 * Math.sin(t * 5);
      if (T.spin > 0) {
        T.spin = Math.max(0, T.spin - dt * 1.5);
        g.rotation.y += dt * 20 * T.spin; g.scale.setScalar(Math.max(0.01, T.spin));
        if (T.spin === 0) g.visible = false;
      }
    });
    return T;
  },

  // ---------- ENERGY GATE: a wall of light that blocks the path until opened (sinks into the floor).
  // close() raises it again. Returns { open(), close(), col, opened }.
  gate({ x = 0, y, z, w = 4, h = 6.5, color = 0x4dffd2, yaw = 0 }) {
    const tex = stripeTex('#0a2a2a', '#1a8a7a', 6); tex.repeat.set(w / 2, h / 2);
    const mat = new THREE.MeshStandardMaterial({ color, map: tex, emissive: color, emissiveMap: tex, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false });
    const st = { k: 0, target: 0 };
    const col = this.plat({ x, y: y + h, z, w, d: 0.4, h, yaw, mat, neon: false, shadow: false,
      motion: this.mo((v) => { v.y = -h * st.k; }) });
    col.rayBlock = true;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    for (const s of [-1, 1]) this.post(x + cs * s * (w / 2 + 0.25), y - 0.5, y + h + 0.4, z - sn * s * (w / 2 + 0.25), true, this.M.iron, 0.25);
    const cap = new THREE.Mesh(boxGeo(w + 1, 0.4, 0.6, 2), this.M.iron); cap.position.set(x, y + h + 0.6, z); cap.rotation.y = yaw; this.add(cap);
    const lamp = new THREE.Mesh(boxGeo(w * 0.6, 0.15, 0.62, 2), glowMat(0xff3a3a)); lamp.position.set(x, y + h + 0.6, z); lamp.rotation.y = yaw; this.add(lamp);
    const G = { col, opened: false };
    G.open = () => { if (st.target === 1) return; st.target = 1; G.opened = true; this.sfx.door(); lamp.material.color.set(0x3dff6a); };
    G.close = () => { if (st.target === 0) return; st.target = 0; G.opened = false; this.sfx.door(); lamp.material.color.set(0xff3a3a); };
    this.world.anim.push((t, dt) => {
      st.k = clamp(st.k + (st.target ? 1 : -1) * dt * 1.4, 0, 1);
      col.active = st.k < 0.97; col.mesh.visible = col.active;
      tex.offset.y = t * 0.3;
    });
    return G;
  },

  // gate opens once every target in the list has been shot
  linkTargets(gate, targets, msg = 'GATE OPEN!') {
    for (const T of targets) {
      const prev = T.onHitLinked;
      T.onHitLinked = () => { if (prev) prev(); if (targets.every((q) => q.dead)) { gate.open(); this.world.events.push({ type: 'banner', big: msg, small: '', color: '#4dffd2', dur: 1.6 }); } };
      const hit = T.hit; T.hit = () => { const was = T.dead; hit(); if (!was) T.onHitLinked(); };
    }
  },

  // ---------- BULLET TIME: slow-mo pad (hands you the blaster) → trampoline → a tall gate with its target
  // hidden behind it. Bounce, and while you hang in the air in slow motion, shoot the target over the gate.
  // Builds its own floor from z + 3 to z - 10. Returns { gate, target, endZ }.
  bulletTime({ x = 0, y, z, w = 4, dur = 8, sway = 1.5, style = 'trim', bounce = 16 }) {
    this.plat({ x, y, z: z - 3.5, w, d: 13, style });
    this.slowPad({ x, y, z, dur, give: 'gun' });
    this.plat({ x, y: y + 0.4, z: z - 4.5, w: 3, d: 3, h: 0.6, style: 'tramp', type: 'tramp', bounce });
    const gate = this.gate({ x, y, z: z - 9.75, w: w + 6, h: 6.5 });
    const target = this.target({ x, y: y + 7.4, z: z - 16, r: 0.8, motion: sway ? this.mo((v, t) => { v.x = Math.sin(t * 0.8) * sway; }) : null });
    this.linkTargets(gate, [target]);
    return { gate, target, endZ: z - 10 };
  },

  // ---------- GRAPPLE POINT: a glowing anchor. You're reeled in so your hands reach it, then flung by `launch`.
  // normal: direction the anchor faces (toward the player). Default launch hops you up over a ledge behind it.
  hook({ x, y, z, normal = { x: 0, z: 1 }, launch = null, r = 0.6 }) {
    const n = new V3(normal.x, 0, normal.z).normalize();
    const g = new THREE.Group(); g.position.set(x, y, z); g.lookAt(x + n.x, y, z + n.z); this.add(g);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20), this.M.iron); plate.rotation.x = Math.PI / 2; g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 24), glowMat(0xffb02e)); ring.position.z = 0.08; g.add(ring);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), glowMat(0xffffff)); core.position.z = 0.1; g.add(core);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 24), addMat(0xffb02e, 0.4)); halo.position.z = 0.09; g.add(halo);
    const H = { pos: new V3(x, y, z), r, launch: launch ? new V3(launch.x || 0, launch.y || 0, launch.z || 0) : new V3(-n.x * 3.5, 12, -n.z * 3.5) };
    this.world.hooks.push(H);
    this.world.anim.push((t) => { halo.scale.setScalar(1 + 0.15 * Math.sin(t * 4)); halo.material.opacity = 0.25 + 0.2 * Math.sin(t * 4); });
    return H;
  },

  // ---------- GRAPPLE CLIFF: a sheer block too tall to climb, with a grapple point under its lip.
  // y = floor height in front of it; the cliff top is at y + h and runs back (−Z) by d.
  grappleCliff({ x = 0, y, z, h = 8, w = 6, d = 6, style = 'trim' }) {
    this.plat({ x, y: y + h, z: z - d / 2, w, d, h: h + 4, style });
    return this.hook({ x, y: y + h - 1.0, z: z + 0.22 });
  },

  // =====================================================================================
  // PLATFORMS THAT MOVE
  // =====================================================================================

  // ---------- SEESAW: a plank on a pivot that tips toward whichever end you stand on
  seesaw({ x = 0, y, z, len = 10, w = 2.4, max = 0.3, rate = 0.8 }) {
    const N = 8, seg = len / N, st = { th: 0 };
    const segs = new Set();
    for (let k = 0; k < N; k++) {
      const lz = -len / 2 + seg * (k + 0.5);
      segs.add(this.plat({ x, y, z: z + lz, w, d: seg + 0.04, h: 0.4, mat: hidden, shadow: false, motion: this.mo((v) => { v.y = lz * Math.sin(st.th); }) }));
    }
    const plank = new THREE.Mesh(boxGeo(w, 0.4, len, 3), this.M.wood); plank.position.set(x, y - 0.2, z); plank.castShadow = true; plank.receiveShadow = true; this.add(plank);
    for (const s of [-1, 1]) { const stripe = new THREE.Mesh(boxGeo(w + 0.04, 0.42, 0.3, 2), this.M.danger); stripe.position.z = s * (len / 2 - 0.3); plank.add(stripe); }
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0, 1.1, 1.6, 3), this.M.iron); pivot.position.set(x, y - 1.2, z); pivot.rotation.z = Math.PI / 2; pivot.rotation.y = Math.PI / 2; this.add(pivot);
    const world = this.world;
    world.anim.push((t, dt) => {
      const P = world.player;
      const on = P && P.onGround && segs.has(P.ground);
      const want = on ? clamp(-(P.pos.z - z) / (len / 2), -1, 1) * max : 0;
      st.th += clamp(want - st.th, -rate * dt, rate * dt);
      plank.rotation.x = -st.th;
    });
  },

  // ---------- EXTENDING BRIDGE: a telescoping bridge that slides out of its housing toward −Z, waits, and retracts
  extendBridge({ x = 0, y, z, len = 12, w = 3, n = 3, period = 6, phase = 0, hold = 0.45 }) {
    const seg = len / n;
    const st = { e: 0, warn: false };
    const ext = (u) => (u < 0.12 ? u / 0.12 : u < 0.12 + hold ? 1 : u < 0.32 + hold ? 1 - (u - 0.12 - hold) / 0.2 : 0);
    const edge = glowMat(0xffd84d);
    for (let k = 0; k < n; k++) {
      const col = this.plat({ x, y: y - k * 0.02, z: z - seg * (k + 0.5), w: w - k * 0.15, d: seg + 0.1, h: 0.4, style: 'metal',
        motion: this.mo((v, t) => { v.z = seg * k * (1 - ext(cyc(t, period, phase))); }) });
      for (const s of [-1, 1]) { const e = new THREE.Mesh(boxGeo(0.08, 0.06, seg, 1), edge); e.position.set(s * (w - k * 0.15) / 2, 0.2, 0); col.mesh.add(e); }
    }
    const house = new THREE.Mesh(boxGeo(w + 0.8, 1.4, 1.2, 2), this.M.iron); house.position.set(x, y - 0.5, z + 0.6); this.add(house);
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      const warn = u > 0.12 + hold - 0.12 && u < 0.12 + hold;
      edge.color.set(warn && Math.floor(t * 10) % 2 ? 0xff3a3a : 0xffd84d);
    });
  },

  // ---------- FERRIS WHEEL: level gondolas riding a wheel that turns across the path (in the X-Y plane).
  // Hop on at the bottom (surface height y), ride to the top (y + 2R) and jump off forward.
  ferris({ x = 0, y, z, R = 7, n = 6, speed = 0.3, w = 2.6, d = 2.4 }) {
    const cy = y + R;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU;
      const col = this.plat({ x, y, z, w, d, h: 0.4, style: 'metal',
        motion: this.mo((v, t) => { const a = t * speed + a0; v.x = R * Math.sin(a); v.y = R - R * Math.cos(a); }) });
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(w * 0.7, 0.8, 4), glowMat([0xff4d6d, 0xffd84d, 0x4dd2ff, 0x7dff6a, 0xc77dff, 0xff9a3d][k % 6]));
      canopy.position.y = 2.8; canopy.rotation.y = Math.PI / 4; col.mesh.add(canopy);
      for (const s of [-1, 1]) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), this.M.metal); rod.position.set(s * (w / 2 - 0.1), 1.5, 0); col.mesh.add(rod); }
    }
    const wheel = new THREE.Group(); wheel.position.set(x, cy + 2.8, z); this.add(wheel);
    const lights = [];
    for (const s of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 8, 64), this.M.metal); rim.position.z = s * (d / 2 + 0.4); wheel.add(rim);
      for (let k = 0; k < n * 2; k++) {
        const a = k / (n * 2) * TAU;
        const spoke = new THREE.Mesh(boxGeo(R, 0.1, 0.1, 1), this.M.metal); spoke.rotation.z = a; spoke.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, s * (d / 2 + 0.4)); wheel.add(spoke);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), glowMat(k % 2 ? 0xffd84d : 0xff4dd2)); bulb.position.set(Math.cos(a) * R, Math.sin(a) * R, s * (d / 2 + 0.55)); wheel.add(bulb); lights.push(bulb);
      }
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, d + 1.6, 12), this.M.iron); axle.rotation.x = Math.PI / 2; wheel.add(axle);
    for (const s of [-1, 1]) for (const sx of [-1, 1]) {
      this.add(this.cylinderBetween(new V3(x + sx * R * 0.6, y - 12, z + s * (d / 2 + 1)), new V3(x, cy + 2.8, z + s * (d / 2 + 0.8)), 0.18, this.M.iron));
    }
    this.world.anim.push((t) => { wheel.rotation.z = -t * speed; lights.forEach((l, i) => { l.visible = (Math.floor(t * 4) + i) % 3 !== 0; }); });
  },

  // ---------- SPINNING SAUCERS: a turntable of spinning saucers circling a hub (fairground teacups)
  teacups({ cx = 0, y, cz, R = 5, n = 3, speed = 0.4, spin = 1.2, size = 2.8 }) {
    const colors = [0xff4d8a, 0x4dd2ff, 0xffd84d, 0x7dff6a];
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU;
      const motion = this.mo((v, t) => { const a = t * speed + a0; v.x = Math.cos(a) * R; v.z = -Math.sin(a) * R; v.yaw = t * spin; });
      const col = this.plat({ x: cx, y, z: cz, w: size * 0.82, d: size * 0.82, h: 0.4, mat: hidden, shadow: false, motion });
      this.plat({ x: cx, y, z: cz, w: size * 0.82, d: size * 0.82, h: 0.4, yaw: Math.PI / 4, mat: hidden, shadow: false, motion: this.mo((v, t) => { const a = t * speed + a0; v.x = Math.cos(a) * R; v.z = -Math.sin(a) * R; v.yaw = t * spin; }) });
      const m = new THREE.MeshStandardMaterial({ color: colors[k % 4], roughness: 0.35, metalness: 0.2 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(size / 2, size / 2 * 0.8, 0.4, 28), m); disc.castShadow = true; disc.receiveShadow = true; col.mesh.add(disc);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(size / 2, 0.08, 6, 28), this.M.gold); lip.rotation.x = Math.PI / 2; lip.position.y = 0.2; col.mesh.add(lip);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), glowMat(0xffffff)); dot.rotation.x = -Math.PI / 2; dot.position.set(size * 0.3, 0.21, 0); col.mesh.add(dot);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 30, 16), this.brass()); hub.position.set(cx, y - 14.6, cz); this.add(hub);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 16), this.M.danger); top.position.set(cx, y + 1.1, cz); this.add(top);
    this.world.colliders.push(new Collider(hub, 1, 15, 1));
  },

  // ---------- TRAIN: carts running round a closed loop of track (path = [[x, y, z], …], a cart's top at each y)
  train({ path, n = 3, speed = 3, w = 3, d = 3, color = 0xd84a2a }) {
    const pts = path.map(([px, py, pz]) => new V3(px, py, pz));
    const lens = pts.map((p, i) => p.distanceTo(pts[(i + 1) % pts.length]));
    const total = lens.reduce((a, b) => a + b, 0);
    const at = (s, out) => {
      s = ((s % total) + total) % total;
      for (let i = 0; i < pts.length; i++) {
        if (s <= lens[i]) return out.lerpVectors(pts[i], pts[(i + 1) % pts.length], s / lens[i]);
        s -= lens[i];
      }
      return out.copy(pts[0]);
    };
    const tmp = new V3(), p0 = pts[0];
    const body = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
    for (let k = 0; k < n; k++) {
      const off = k * total / n;
      const col = this.plat({ x: p0.x, y: p0.y, z: p0.z, w, d, h: 0.5, style: 'metal',
        motion: this.mo((v, t) => { at(t * speed + off, tmp); v.x = tmp.x - p0.x; v.y = tmp.y - p0.y; v.z = tmp.z - p0.z; }) });
      const tub = new THREE.Mesh(boxGeo(w, 0.9, d, 2), body); tub.position.y = -0.7; tub.castShadow = true; col.mesh.add(tub);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12), this.M.iron); wh.rotation.z = Math.PI / 2; wh.position.set(sx * (w / 2 - 0.1), -1.15, sz * (d / 2 - 0.5)); col.mesh.add(wh);
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i].clone(), b = pts[(i + 1) % pts.length].clone();
      a.y -= 1.45; b.y -= 1.45;
      this.add(this.cylinderBetween(a, b, 0.09, this.M.iron));
    }
  },

  // ---------- SINKING FLOATS & TIDE: a sea that rises and falls. Wading too deep sends you back to the checkpoint.
  // Returns { level(t) }. float() platforms bob on it.
  tide({ x0, x1, z0, z1, low, high, period = 10, phase = 0, color = 0x2a8aa8 }) {
    const level = (t) => low + (high - low) * (0.5 - 0.5 * Math.cos(cyc(t, period, phase) * TAU));
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(160,220,255,0.9)'; g.lineWidth = 3;
    for (let i = 0; i < 9; i++) { g.beginPath(); for (let xx = 0; xx <= 128; xx += 8) g.lineTo(xx, i * 16 + Math.sin(xx / 128 * TAU * 2 + i) * 4); g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set((x1 - x0) / 8, (z0 - z1) / 8); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ color, map: tex, transparent: true, opacity: 0.78, roughness: 0.1, metalness: 0.3, emissive: color, emissiveIntensity: 0.25 });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z0 - z1), mat);
    sea.rotation.x = -Math.PI / 2; sea.position.set((x0 + x1) / 2, low, (z0 + z1) / 2); this.add(sea);
    const world = this.world;
    world.anim.push((t, dt) => {
      const L = level(t);
      sea.position.y = L; tex.offset.x += dt * 0.05; tex.offset.y += dt * 0.08;
      const P = world.player;
      if (P && !P.hang && P.pos.x > x0 && P.pos.x < x1 && P.pos.z < z0 && P.pos.z > z1 && P.pos.y < L - 0.7) world.events.push({ type: 'kill', msg: 'SPLASH' });
    });
    return { level, low, high };
  },

  float({ x = 0, z, w = 3, d = 3, tide, off = 0.35, style = 'wood' }) {
    return this.plat({ x, y: tide.low + off, z, w, d, h: 0.6, style, motion: this.mo((v, t) => { v.y = tide.level(t) - tide.low + Math.sin(t * 2 + z) * 0.05; }) });
  },

  // ---------- GRIND RAIL: a narrow rail that rushes you along toward −Z. Jump off the end for a huge leap.
  grindRail({ x = 0, y, z0, z1, speed = 10, color = 0x4dd2ff }) {
    const len = z0 - z1;
    const shine = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, metalness: 1, roughness: 0.15, emissive: color, emissiveIntensity: 0.2 });
    const col = this.plat({ x, y, z: (z0 + z1) / 2, w: 0.55, d: len, h: 0.3, mat: shine, conveyor: { x: 0, z: -speed }, neon: false });
    const strip = new THREE.Mesh(boxGeo(0.1, 0.02, len, 1), glowMat(color)); strip.position.y = 0.16; col.mesh.add(strip);
    for (let z = z0 - 1; z > z1; z -= 6) this.post(x, y - 8, y - 0.3, z, false, this.M.iron, 0.12);
    const chev = [];
    for (let z = z0 - 1.5; z > z1 + 1; z -= 3) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 3), glowMat(color)); c.rotation.x = -Math.PI / 2; c.position.set(x, y + 0.2, z); this.add(c); chev.push(c); }
    this.world.anim.push((t) => chev.forEach((c, i) => { c.visible = (Math.floor(t * 8) - i) % 4 === 0; }));
    return col;
  },

  // ---------- SPINNING DRUM: a big rolling cylinder. axis 'x' rolls toward you as you cross it;
  // axis 'z' runs along the path and rolls you off the side unless you fight it.
  drum({ x = 0, y, z, len = 4, r = 1.1, speed = 3.5, axis = 'x', dir = 1 }) {
    const tex = stripeTex('#d8402a', '#f2e6d0', 4); tex.repeat.set(len / 2, 3);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 28), m);
    cyl.castShadow = true; cyl.receiveShadow = true;
    cyl.position.set(x, y - r, z);
    if (axis === 'x') cyl.rotation.z = Math.PI / 2; else cyl.rotation.x = Math.PI / 2;
    this.add(cyl);
    const conveyor = axis === 'x' ? { x: 0, z: speed * dir } : { x: speed * dir, z: 0 };
    this.plat({ x, y, z, w: axis === 'x' ? len : r * 1.3, d: axis === 'x' ? r * 1.3 : len, h: 0.4, mat: hidden, shadow: false, conveyor });
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), this.M.iron);
      if (axis === 'x') { cap.rotation.z = Math.PI / 2; cap.position.set(x + s * (len / 2 + 0.2), y - r, z); } else { cap.rotation.x = Math.PI / 2; cap.position.set(x, y - r, z + s * (len / 2 + 0.2)); }
      this.add(cap);
    }
    this.world.anim.push((t, dt) => {
      if (axis === 'x') cyl.rotation.x -= dir * speed / r * dt; else cyl.rotation.y += dir * speed / r * dt;
    });
  },

  // =====================================================================================
  // HAZARDS
  // =====================================================================================

  // ---------- SPRING WALL: a padded wall that flings you back out and up. Two facing each other make a bounce shaft.
  springWall({ x, y, z, w = 0.6, d = 4, h = 6, power = 8, up = 9, yaw = 0 }) {
    const tex = stripeTex('#ffcf3a', '#2a2a30', 6); tex.repeat.set(1, h / 2);
    const pad = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0x403000 });
    const col = this.plat({ x, y: y + h, z, w, d, h, yaw, mat: [pad, pad, this.M.metal, this.M.metal, pad, pad], type: 'spring', knockPower: power, bounce: up, neon: false });
    let k = 10;
    col.onBounce = () => { k = 0; };
    this.world.anim.push((t, dt) => { k += dt; const s = 1 + 0.25 * Math.exp(-8 * k) * Math.sin(30 * k); col.mesh.scale.set(s, 1, 1); });
    return col;
  },

  // ---------- SQUEEZE WALLS: two spiked walls slam together across the path, then pull apart
  squeeze({ x = 0, y, z, gap = 4, d = 2.5, h = 3, period = 3, phase = 0 }) {
    const shut = (u) => (u < 0.5 ? 0 : u < 0.6 ? (u - 0.5) / 0.1 : u < 0.75 ? 1 : u < 0.95 ? 1 - (u - 0.75) / 0.2 : 0);
    for (const s of [-1, 1]) {
      const col = this.plat({ x: x + s * (gap / 2 + 0.75), y: y + h, z, w: 1.5, d, h, mat: this.M.iron, type: 'knock', knockPower: 11,
        motion: this.mo((v, t) => { const u = cyc(t, period, phase); v.x = -s * shut(u) * gap / 2; if (u > 0.42 && u < 0.5) v.x += (Math.random() - 0.5) * 0.06; }) });
      const spikes = new THREE.Mesh(boxGeo(0.1, h * 0.8, d * 0.9, 1), this.M.danger); spikes.position.x = -s * 0.8; col.mesh.add(spikes);
      for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 6), this.mat('spike2', () => new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.25 }))); sp.rotation.z = s * Math.PI / 2; sp.position.set(-s * 1.0, (k % 3 - 1) * 0.8, (Math.floor(k / 3) - 0.5) * d * 0.5); col.mesh.add(sp); }
    }
    let was = 0;
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase);
      if (was < 0.6 && u >= 0.6 && nearXZ(this.world.player, x, z, 14)) this.sfx.slam();
      was = u;
    });
  },

  // ---------- SAW TRACK: a circular saw racing back and forth along a slot across the path. Jump it!
  sawTrack({ x0, x1, y, z, speed = 1, r = 0.8, phase = 0 }) {
    const slot = new THREE.Mesh(boxGeo(x1 - x0 + 2 * r, 0.04, 0.3, 1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    slot.position.set((x0 + x1) / 2, y + 0.02, z); this.add(slot);
    const blade = new THREE.Group(); this.add(blade);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 32), this.mat('saw', () => new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 1, roughness: 0.2 })));
    disc.rotation.x = Math.PI / 2; blade.add(disc);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), this.M.danger); tooth.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); tooth.rotation.z = a - Math.PI / 2; blade.add(tooth); }
    const holder = new THREE.Object3D(); holder.position.set((x0 + x1) / 2, y + r * 0.45, z);
    const mid = (x0 + x1) / 2, amp = (x1 - x0) / 2;
    const col = new Collider(holder, r * 0.8, r * 0.45, 0.12, { type: 'knock', knockPower: 11, motion: (t) => { const o = this.zero(); o.x = Math.sin(t * speed + phase) * amp; return o; } });
    this.world.colliders.push(col);
    this.world.anim.push((t) => { blade.position.set(mid + Math.sin(t * speed + phase) * amp, y, z); blade.rotation.z = -t * 18; });
  },

  // ---------- FLOATING MINES: spiked mines drifting back and forth across the path (and bobbing). Touch one and it blows.
  mines({ x0 = -3, x1 = 3, y, z0, z1, n = 4, speed = 0.9, bob = 0.6 }) {
    const world = this.world;
    const shell = new THREE.MeshStandardMaterial({ color: 0x2a2d34, metalness: 0.7, roughness: 0.4 });
    const spikeM = this.mat('spike2', () => new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.25 }));
    const list = [];
    for (let k = 0; k < n; k++) {
      const g = new THREE.Group(); this.add(g);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), shell));
      for (let j = 0; j < 10; j++) { const d = new V3().randomDirection(); const s = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 5), spikeM); s.position.copy(d).multiplyScalar(0.6); s.quaternion.setFromUnitVectors(new V3(0, 1, 0), d); g.add(s); }
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glowMat(0xff2a2a)); light.position.y = 0.6; g.add(light);
      const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), addMat(0xffa040, 0)); this.add(flash);
      list.push({ g, light, flash, z: z0 - (k + 0.5) * (z0 - z1) / n, ph: k * 2.1, down: 0, boom: 0 });
    }
    world.anim.push((t, dt) => {
      const P = world.player;
      for (const m of list) {
        const mx = (x0 + x1) / 2 + Math.sin(t * speed + m.ph) * (x1 - x0) / 2, my = y + 1.2 + Math.sin(t * 1.7 + m.ph) * bob;
        m.g.position.set(mx, my, m.z); m.g.rotation.y = t + m.ph;
        m.light.visible = Math.floor(t * 4 + m.ph) % 2 === 0;
        if (m.boom > 0) { m.boom -= dt; m.flash.material.opacity = m.boom * 1.4; m.flash.scale.setScalar(1 + (0.6 - m.boom) * 5); }
        if (m.down > 0) { m.down -= dt; m.g.visible = false; continue; }
        m.g.visible = true;
        if (P) {
          const cy = clamp(my, P.pos.y + 0.35, P.pos.y + 1.35);
          const dx = P.pos.x - mx, dz = P.pos.z - m.z, dy = cy - my;
          if (dx * dx + dy * dy + dz * dz < 1.0 * 1.0) {
            P.knock(dx || 0.5, dz || 0.5, 10, 7, 'obstacle');
            m.down = 2; m.boom = 0.6; m.flash.position.set(mx, my, m.z);
            this.sfx.boulder(); world.events.push({ type: 'shake', amount: 0.25 });
          }
        }
      }
    });
  },

  // ---------- TESLA FLOOR: a grid of metal tiles that charge up (glow and crackle) then zap. Don't be standing on one!
  // pattern 'checker' alternates the two halves; 'rows' sweeps a wave of zaps down the path.
  zapTiles({ x = 0, y, z0, nx = 2, nz = 6, size = 2.4, period = 2.4, pattern = 'checker' }) {
    const world = this.world;
    const tiles = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.8, roughness: 0.3, emissive: 0x4d9aff, emissiveIntensity: 0 });
      const tx = x + (i - (nx - 1) / 2) * size, tz = z0 - (j + 0.5) * size;
      const col = this.plat({ x: tx, y, z: tz, w: size - 0.08, d: size - 0.08, h: 0.5, mat, neon: false });
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.25, 4, 5, 1, true), addMat(0xbfe0ff, 0)); bolt.position.set(tx, y + 2, tz); this.add(bolt);
      const ph = pattern === 'checker' ? ((i + j) % 2) * 0.5 : j / nz;
      tiles.push({ col, mat, bolt, ph, x: tx, z: tz, fired: -1 });
    }
    world.anim.push((t) => {
      const P = world.player;
      for (const T of tiles) {
        const u = cyc(t / period - T.ph, 1);
        // 0–0.55 calm, 0.55–0.85 charging, 0.85–0.95 ZAP
        const charge = u > 0.55 && u < 0.85 ? (u - 0.55) / 0.3 : 0;
        const zap = u >= 0.85 && u < 0.95;
        T.mat.emissiveIntensity = zap ? 2.2 : charge * (Math.floor(t * (8 + charge * 20)) % 2 ? 1.2 : 0.4);
        T.bolt.material.opacity = zap ? 0.6 + 0.4 * Math.random() : 0;
        const cycle = Math.floor(t / period - T.ph);
        if (zap && T.fired !== cycle && P && P.onGround && P.ground === T.col) {
          T.fired = cycle;
          P.knock(P.pos.x - T.x || 0.4, P.pos.z - T.z || 0.4, 7, 9, 'obstacle');
          this.sfx.zap();
        }
      }
    });
  },

  // =====================================================================================
  // SWITCHES, BEATS & TRICKS
  // =====================================================================================

  // ---------- FLOOR SWITCH: stepping on it flips its channel, swapping every switch block on that channel
  switchPad({ x, y, z, channel = 'a', color = 0x7dff6a }) {
    const world = this.world;
    world.switches[channel] = world.switches[channel] || false;
    this.plat({ x, y, z, w: 2.2, d: 2.2, h: 0.3, style: 'metal' });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3 }));
    knob.scale.y = 0.4; knob.position.set(x, y, z); this.add(knob);
    let was = false;
    world.anim.push(() => {
      const P = world.player;
      const on = !!P && P.onGround && nearXZ(P, x, z, 1.3) && Math.abs(P.pos.y - y) < 0.4;
      if (on && !was) { world.switches[channel] = !world.switches[channel]; this.sfx.click(); }
      was = on;
      knob.position.y = y - (on ? 0.12 : 0);
      knob.material.emissiveIntensity = world.switches[channel] ? 1.4 : 0.4;
    });
  },

  switchBlock({ x, y, z, w = 3, d = 3, channel = 'a', on = true, color = 0x7dff6a }) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0.35, transparent: true });
    const col = this.plat({ x, y, z, w, d, h: 0.6, mat, neon: false });
    col.mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.6, d)), new THREE.LineBasicMaterial({ color, toneMapped: false })));
    const world = this.world;
    let last = null;
    world.anim.push(() => {
      const solid = world.switches[channel] ? !on : on;
      if (solid === last) return;
      last = solid; col.active = solid;
      mat.opacity = solid ? 1 : 0.12; mat.depthWrite = solid; col.mesh.castShadow = solid;
    });
    return col;
  },

  // ---------- BEAT BLOCKS: two groups that swap every `beats` beats, in time with the music. They pulse on every beat.
  beatBlocks({ x, y, z, w = 3, d = 3, group = 0, beats = 2, bpm = 120 }) {
    const color = group ? 0xff4dd2 : 0x4dd2ff;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, emissive: color, emissiveIntensity: 0.5, transparent: true });
    const col = this.plat({ x, y, z, w, d, h: 0.6, mat, neon: false });
    col.mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.6, d)), new THREE.LineBasicMaterial({ color, toneMapped: false })));
    const world = this.world;
    world.anim.push((t) => {
      const mb = world.beat ? world.beat() : null;
      const beat = mb ?? t * bpm / 60;
      const slot = Math.floor(beat / beats), within = beat - slot * beats;
      const solid = (slot % 2 === 0) === (group === 0);
      const warn = solid && within > beats - 1; // flashes for the last beat: jump now!
      col.active = solid;
      const pulse = Math.exp(-6 * (beat % 1));
      mat.opacity = solid ? (warn && Math.floor(t * 16) % 2 ? 0.4 : 1) : 0.1;
      mat.depthWrite = solid;
      mat.emissiveIntensity = solid ? 0.4 + pulse : 0.2;
      col.mesh.scale.y = 1 + (solid ? pulse * 0.25 : 0);
    });
    return col;
  },

  // ---------- PHANTOM PLATFORM: invisible until you get close — a faint shimmer gives it away
  phantom({ x, y, z, w = 3, d = 3, reveal = 7, color = 0xb48cff }) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a2040, roughness: 0.4, emissive: color, emissiveIntensity: 0.4, transparent: true, opacity: 0 });
    const col = this.plat({ x, y, z, w, d, h: 0.5, mat, neon: false, shadow: false });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.5, d)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.06, toneMapped: false }));
    col.mesh.add(edges);
    const world = this.world;
    world.anim.push((t) => {
      const P = world.player;
      const dist = P ? Math.hypot(P.pos.x - x, (P.pos.y - y) * 1.5, P.pos.z - z) : 99;
      const k = clamp((reveal - dist) / 2.5, 0, 1);
      mat.opacity = k * 0.95; mat.depthWrite = k > 0.5;
      edges.material.opacity = 0.05 + 0.04 * Math.sin(t * 3 + x + z) + k * 0.9;
    });
    return col;
  },

  // ---------- PRESSURE PLATE + TIMED GATE: step on the plate and the gate drops for `open` seconds. Race it!
  pressureGate({ plate, gate: g, open = 5 }) {
    const G = this.gate({ ...g, color: 0xffb02e });
    const world = this.world;
    this.plat({ x: plate.x, y: plate.y, z: plate.z, w: 2.4, d: 2.4, h: 0.3, style: 'metal' });
    const pad = new THREE.Mesh(boxGeo(1.8, 0.12, 1.8, 1), new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff5a10, emissiveIntensity: 0.6 }));
    pad.position.set(plate.x, plate.y + 0.04, plate.z); this.add(pad);
    // countdown lamps along the gate's cap
    const lamps = [];
    for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat(0xffd84d)); l.position.set(g.x - 1.2 + k * 0.6, g.y + (g.h || 6.5) + 1.0, g.z); this.add(l); lamps.push(l); }
    let timer = 0;
    world.anim.push((t, dt) => {
      const P = world.player;
      const on = !!P && P.onGround && nearXZ(P, plate.x, plate.z, 1.3) && Math.abs(P.pos.y - plate.y) < 0.4;
      if (on) { if (timer <= 0) G.open(); timer = open; }
      pad.position.y = plate.y + (on ? -0.02 : 0.04);
      if (timer > 0) { timer -= dt; if (timer <= 0) G.close(); }
      const left = timer / open;
      lamps.forEach((l, k) => { l.visible = timer > 0 ? k < Math.ceil(left * 5) && !(left < 0.3 && Math.floor(t * 8) % 2) : true; l.material.color.set(timer > 0 ? 0x3dff6a : 0xffd84d); });
    });
    return G;
  },

  // =====================================================================================
  // AIR
  // =====================================================================================

  // ---------- BALLOON: grab the string and float up. It pops at the top — let go (or launch off) before then!
  balloon({ x, z, y0, y1, speed = 2.2, phase = 0, color = 0xff4d6d, pause = 1.4 }) {
    const L = y1 - y0, period = L / speed + pause;
    const off = new V3();
    const motion = (t) => { const u = cyc(t, period, phase) * period; off.set(0, Math.max(0, u - pause) * speed, 0); return off; };
    const g = new THREE.Group(); this.add(g);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), this.M.grip); handle.rotation.z = Math.PI / 2; g.add(handle);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.8, 4), this.M.rope); string.position.y = 0.9; g.add(string);
    const ballMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), ballMat); ball.scale.y = 1.15; ball.position.y = 2.75; ball.castShadow = true; g.add(ball);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), ballMat); knot.position.y = 1.75; g.add(knot);
    const bar = new Bar(new V3(x, y0, z), 0.9, motion, g);
    this.world.grabbables.push(bar);
    let popped = false;
    this.world.anim.push((t) => {
      const u = cyc(t, period, phase) * period;
      const inflate = u < pause ? 0.25 + 0.75 * (u / pause) : 1;
      ball.scale.set(inflate, inflate * 1.15, inflate);
      const top = u > period - 0.12;
      if (top && !popped) {
        popped = true;
        if (bar.grabbed) bar.forceRelease = true;
        if (nearXZ(this.world.player, x, z, 20)) this.sfx.pop();
      }
      if (!top) popped = false;
      bar.disabled = top || u < pause * 0.6;
      g.visible = !top;
    });
    return bar;
  },

  // ---------- BOOST RING: fly through it and it fires you along `vel`. It stands upright, facing the way you come in.
  boostRing({ x, y, z, vel = { x: 0, y: 6, z: -14 }, r = 1.6, color = 0x7dff6a }) {
    const v = new V3(vel.x, vel.y, vel.z);
    const dir = Math.hypot(vel.x, vel.z) > 0.5 ? new V3(vel.x, 0, vel.z).normalize() : new V3(0, 0, -1);
    const g = new THREE.Group(); g.position.set(x, y, z); g.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir); this.add(g);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(r, 0.13, 10, 40), glowMat(color)); g.add(torus);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, 0.04, 6, 32), addMat(0xffffff, 0.6)); g.add(inner);
    const film = new THREE.Mesh(new THREE.CircleGeometry(r, 32), addMat(color, 0.12)); g.add(film);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), addMat(color, 0.7)); c.rotation.x = -Math.PI / 2; c.position.z = -0.6 - k * 0.7; g.add(c); }
    const world = this.world;
    let cool = 0, kick = 0;
    const rel = new V3();
    world.anim.push((t, dt) => {
      cool -= dt; kick = Math.max(0, kick - dt * 3);
      inner.rotation.z = t * 3; g.scale.setScalar(1 + kick * 0.3);
      const P = world.player;
      if (!P || P.hang || cool > 0) return;
      rel.set(P.pos.x - x, P.pos.y + 0.9 - y, P.pos.z - z);
      const along = rel.dot(dir), perp = Math.sqrt(Math.max(0, rel.lengthSq() - along * along));
      if (Math.abs(along) < 0.8 && perp < r) {
        cool = 0.5; kick = 1;
        P.vel.copy(v); P.onGround = false; P.ground = null; P.launchT = 0.9; P.grapple = null;
        this.sfx.whoosh(); this.sfx.spring();
      }
    });
  },

  // ---------- LOW-GRAVITY ZONE: a shimmering column where gravity drops to `scale` — float those jumps!
  lowGrav({ x = 0, y, z, R = 8, h = 14, d = 0, scale = 0.35, color = 0x9ad8ff }) {
    // a cylinder (or, with d, a box R wide and d long)
    const geo = d ? new THREE.BoxGeometry(R * 2, h, d) : new THREE.CylinderGeometry(R, R, h, 32, 1, true);
    const shell = new THREE.Mesh(geo, addMat(color, 0.06)); shell.position.set(x, y - 1 + h / 2, z); this.add(shell);
    const n = 160, pos = new Float32Array(n * 3), seed = [];
    for (let k = 0; k < n; k++) { seed.push([Math.random(), Math.random(), Math.random()]); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color, size: 0.12, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); this.add(pts);
    const world = this.world;
    const inside = (P) => P.pos.y > y - 1.5 && P.pos.y < y - 1 + h && (d ? Math.abs(P.pos.x - x) < R && Math.abs(P.pos.z - z) < d / 2 : nearXZ(P, x, z, R));
    world.anim.push((t) => {
      for (let k = 0; k < n; k++) {
        const [a, b, c] = seed[k];
        const yy = y - 1 + ((c * h + t * 0.6 * (0.5 + a)) % h);
        if (d) { pos[k * 3] = x + (a - 0.5) * 2 * R; pos[k * 3 + 2] = z + (b - 0.5) * d; } else { const ang = a * TAU + t * 0.1, rr = Math.sqrt(b) * R; pos[k * 3] = x + Math.cos(ang) * rr; pos[k * 3 + 2] = z + Math.sin(ang) * rr; }
        pos[k * 3 + 1] = yy;
      }
      pg.attributes.position.needsUpdate = true;
      const P = world.player;
      if (P && inside(P)) P.zoneG = scale;
    });
  },
});
