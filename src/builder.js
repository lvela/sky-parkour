// Level-building toolkit. Every helper adds meshes to the level group and physics to the World.
// Travel direction is -Z. Platforms are positioned by their TOP surface height.
import * as THREE from 'three';
import { boxGeo, signTexture, rng, themeTex } from './textures.js';
import { makeRock, makeTree } from './scenery.js';
import { Collider, Swing, Bar, Zip, Hold, Crumble } from './world.js';

const V3 = THREE.Vector3;

export class Builder {
  // theme: { top, side, stone, palette, neon (hex|null), accent }
  // top/side/stone name a shared texture, or are a themeTex() spec for a world-specific one.
  constructor(group, world, tex, sfx, theme) {
    this.g = group; this.world = world; this.tex = tex; this.sfx = sfx; this.theme = theme;
    this.rockSeed = 1;
    const std = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0, ...o });
    const T = (k, d) => (theme[k] && typeof theme[k] === 'object' ? themeTex(theme[k]) : tex[theme[k] || d]);
    this.M = {
      top: std(T('top', 'grass')), side: std(T('side', 'dirt')), stone: std(T('stone', 'stone')),
      wood: std(tex.wood, { roughness: 0.8 }), crumble: std(tex.crumble), wall: std(tex.wall, { roughness: 0.75 }),
      wallrun: std(tex.wallrun, { roughness: 0.5, emissive: 0x0a2a80, emissiveIntensity: 0.4 }),
      trampTop: std(tex.trampTop, { roughness: 0.55 }), megaTop: std(tex.megaTop, { roughness: 0.55 }),
      stripes: std(tex.stripes, { roughness: 0.5, metalness: 0.1 }),
      metal: std(tex.metal, { metalness: 0.85, roughness: 0.35 }),
      checker: std(tex.checker, { roughness: 0.6 }), brick: std(tex.brick), climb: std(tex.climb),
      slide: std(tex.slide, { roughness: 0.25, metalness: 0.1 }),
      ice: std(tex.ice, { roughness: 0.06, metalness: 0.15 }),
      basalt: std(tex.basalt, { emissive: 0xffffff, emissiveMap: tex.basalt, emissiveIntensity: 0.55 }),
      panel: std(tex.panel, { roughness: 0.4, metalness: 0.6, emissive: 0xffffff, emissiveMap: tex.panel, emissiveIntensity: 0.45 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffc94a, metalness: 1, roughness: 0.22 }),
      rope: new THREE.MeshStandardMaterial({ color: 0x9a7a4d, roughness: 1 }),
      grip: new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.4, emissive: 0x553800, emissiveIntensity: 0.6 }),
      cable: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.4 }),
      glove: new THREE.MeshStandardMaterial({ color: 0xd8202a, roughness: 0.45, emissive: 0x300000 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.9, roughness: 0.45 }),
      danger: new THREE.MeshStandardMaterial({ color: 0xff3b2f, roughness: 0.5, emissive: 0x801010, emissiveIntensity: 0.8 }),
      neon: theme.neon ? new THREE.MeshBasicMaterial({ color: theme.neon, toneMapped: false }) : null,
    };
    this.holdMats = [0xff4d6d, 0x4dd2ff, 0xffd84d, 0x7dff6a, 0xc77dff].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: c, emissiveIntensity: theme.neon ? 0.9 : 0.25 }));
    this.out = { x: 0, y: 0, z: 0, yaw: 0 };
  }

  add(o) { this.g.add(o); return o; }
  zero() { const o = this.out; o.x = o.y = o.z = o.yaw = 0; return o; }

  // ---------- platforms ----------
  plat(o) {
    const { x = 0, y, z, w, d, style = 'stone' } = o;
    const h = o.h ?? (style === 'island' ? 1.2 : 0.8);
    const M = this.M;
    let geo, mats;
    switch (style) {
      case 'island': geo = boxGeo(w, h, d, 4, true); mats = [M.side, M.side, M.top, M.stone, M.side, M.side]; break;
      case 'wood': geo = boxGeo(w, h, d, 3); mats = M.wood; break;
      case 'crumble': geo = boxGeo(w, h, d, 2); mats = M.crumble; break;
      case 'wall': geo = boxGeo(w, h, d, 3); mats = M.wall; break;
      case 'wallrun': geo = boxGeo(w, h, d, 3); mats = M.wallrun; break;
      case 'metal': geo = boxGeo(w, h, d, 2); mats = M.metal; break;
      case 'brick': geo = boxGeo(w, h, d, 3); mats = M.brick; break;
      case 'climb': geo = boxGeo(w, h, d, 4); mats = M.climb; break;
      case 'ice': geo = boxGeo(w, h, d, 3); mats = M.ice; break;
      case 'basalt': geo = boxGeo(w, h, d, 3); mats = M.basalt; break;
      case 'panel': geo = boxGeo(w, h, d, 3); mats = M.panel; break;
      case 'top': geo = boxGeo(w, h, d, 3); mats = M.top; break;
      case 'trim': geo = boxGeo(w, h, d, 3); mats = M.stone; break;
      case 'finish': geo = boxGeo(w, h, d, 4, true); mats = [M.side, M.side, M.checker, M.stone, M.side, M.side]; break;
      case 'tramp': case 'mega':
        geo = new THREE.BoxGeometry(w, h, d);
        mats = [M.stripes, M.stripes, style === 'mega' ? M.megaTop : M.trampTop, M.stripes, M.stripes, M.stripes];
        break;
      default: geo = boxGeo(w, h, d, 4); mats = M.stone;
    }
    if (o.mat) mats = o.mat;
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(x, y - h / 2, z);
    mesh.rotation.y = o.yaw || 0;
    mesh.castShadow = o.shadow !== false; mesh.receiveShadow = true;
    this.add(mesh);
    const col = new Collider(mesh, w / 2, h / 2, d / 2, { type: o.type, bounce: o.bounce, motion: o.motion, conveyor: o.conveyor, mud: o.mud, knockPower: o.knockPower });
    this.world.colliders.push(col);
    if (o.rock) {
      const rock = makeRock(w / 2 * 0.92, d / 2 * 0.92, o.rockDepth ?? (w + d) * 0.42, this.rockSeed++, false, this.theme.palette);
      rock.position.y = -h / 2 + 0.05;
      mesh.add(rock);
    }
    if (this.M.neon && (style === 'island' || style === 'stone' || style === 'metal' || style === 'panel') && o.neon !== false) this.neonEdges(mesh, w, h, d);
    if (o.type === 'crumble') this.world.crumbles.push(new Crumble(col, this.sfx, o.crumbleDelay));
    if (o.type === 'tramp') {
      let t = 10;
      col.onBounce = () => { t = 0; };
      this.world.anim.push((_, dt) => { t += dt; mesh.scale.y = 1 - 0.45 * Math.exp(-7 * t) * Math.cos(20 * t); });
    }
    return col;
  }

  neonEdges(mesh, w, h, d) {
    const t = 0.07;
    for (const [sx, sz, lx, lz] of [[0, d / 2, w, t], [0, -d / 2, w, t], [w / 2, 0, t, d], [-w / 2, 0, t, d]]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(lx + t, t, lz + t), this.M.neon);
      e.position.set(sx, h / 2 + 0.005, sz);
      mesh.add(e);
    }
  }

  // Slide segment from (z0, y0) to (z1, y1) along -Z. Chain segments by matching endpoints.
  ramp({ x = 0, z0, y0, z1, y1, w = 4 }) {
    const len = Math.abs(z1 - z0), slope = (y1 - y0) / (z1 - z0);
    const holder = new THREE.Object3D();
    holder.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
    const col = new Collider(holder, w / 2, 0.5, len / 2, { type: 'ramp', slope });
    this.world.colliders.push(col);
    const th = 0.4, L3 = Math.hypot(len, y1 - y0);
    const mesh = new THREE.Mesh(boxGeo(w, th, L3 + 0.15, 3), [this.M.metal, this.M.metal, this.M.slide, this.M.metal, this.M.metal, this.M.metal]);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.x = -Math.atan(slope);
    const n = new V3(0, 1, 0).applyEuler(mesh.rotation);
    mesh.position.copy(holder.position).addScaledVector(n, -th / 2);
    mesh.receiveShadow = true; mesh.castShadow = true;
    this.add(mesh);
    // low rails (visual guides)
    for (const sx of [-w / 2, w / 2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, L3), this.M.danger);
      rail.rotation.copy(mesh.rotation);
      rail.position.copy(holder.position).addScaledVector(n, 0.17).add(new V3(sx, 0, 0));
      this.add(rail);
    }
    return col;
  }

  post(x, y0, y1, z, solid = true, mat = this.M.metal, r = 0.15) {
    const h = y1 - y0;
    const m = new THREE.Mesh(boxGeo(r * 2, h, r * 2, 2), mat);
    m.position.set(x, y0 + h / 2, z); m.castShadow = true;
    this.add(m);
    if (solid) this.world.colliders.push(new Collider(m, r, h / 2, r));
    return m;
  }

  cylinderBetween(a, b, radius, mat) {
    const dir = new V3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 8), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    return m;
  }

  sign(x, y, z, title, body, yaw = 0, accent = this.theme.accent) {
    const g = new THREE.Group();
    const map = signTexture(title, body, accent);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map, roughness: 0.7, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: this.theme.neon ? 0.8 : 0.35 }));
    board.position.y = 2.4;
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 0.1), this.M.wood);
    back.position.set(0, 2.4, -0.07); back.castShadow = true;
    g.add(board, back);
    for (const sx of [-1.4, 1.4]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), this.M.wood);
      p.position.set(sx, 1.6, -0.12); p.castShadow = true;
      g.add(p);
    }
    if (!yaw && Math.abs(x) > 0.5) { x = Math.sign(x) * Math.max(Math.abs(x), 3); yaw = -Math.sign(x) * 0.45; }
    g.position.set(x, y, z); g.rotation.y = yaw;
    this.add(g);
  }

  checkpoint(x, y, z, yaw = 0) {
    const world = this.world;
    const index = world.checkpoints.length;
    const g = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({ color: 0x59d6ff, emissive: 0x1a7fa8, emissiveIntensity: 1, roughness: 0.4 });
    const pad = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 40), padMat);
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.06;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), this.M.metal);
    pole.position.set(2.2, 1.6, 0); pole.castShadow = true;
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, roughness: 0.8 });
    const flagGeo = new THREE.PlaneGeometry(1.2, 0.75, 8, 1); flagGeo.translate(0.6, 0, 0);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(2.2, 2.75, 0); flag.castShadow = true;
    g.add(pad, pole, flag);
    g.position.set(x, y, z); g.rotation.y = yaw;
    this.add(g);
    const base = flagGeo.attributes.position.array.slice();
    world.anim.push((t) => {
      const p = flagGeo.attributes.position;
      for (let i = 0; i < p.count; i++) { const bx = base[i * 3]; p.setZ(i, Math.sin(t * 5 + bx * 4 + index) * 0.12 * bx); }
      p.needsUpdate = true;
      pad.rotation.z = t * 0.5;
    });
    const cp = {
      index, pos: new V3(x, y + 0.02, z), yaw, active: index === 0,
      activate() { this.active = true; flagMat.color.set(0x3ddc5a); padMat.color.set(0x3ddc5a); padMat.emissive.set(0x147a2a); },
      deactivate() { this.active = index === 0; if (index) { flagMat.color.set(0xaaaaaa); padMat.color.set(0x59d6ff); padMat.emissive.set(0x1a7fa8); } },
    };
    if (index === 0) cp.activate();
    world.checkpoints.push(cp);
    return cp;
  }

  swing(px, py, pz, L, A, phase) {
    const group = new THREE.Group();
    group.position.set(px, py, pz);
    const width = 1.3;
    for (const sx of [-0.55, 0.55]) group.add(this.cylinderBetween(new V3(sx, 0, 0), new V3(sx, -L, 0), 0.035, this.M.rope));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width, 10), this.M.grip);
    bar.rotation.z = Math.PI / 2; bar.position.y = -L; bar.castShadow = true;
    group.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10), this.M.metal);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
    this.add(group);
    this.world.grabbables.push(new Swing(new V3(px, py, pz), L, A, Math.sqrt(22 / L), phase, width, group));
  }

  // Overhead beams + posts that carry a row of swings between two platforms.
  swingRig(z0, z1, y0, yTop) {
    for (const sx of [-1.0, 1.0]) {
      this.post(sx, y0, yTop + 0.15, z0);
      this.post(sx, y0, yTop + 0.15, z1);
      const beam = new THREE.Mesh(boxGeo(0.3, 0.3, Math.abs(z1 - z0), 2), this.M.metal);
      beam.position.set(sx, yTop, (z0 + z1) / 2); beam.castShadow = true;
      this.add(beam);
    }
  }

  bar(x, y, z, width, motion) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width, 10), this.M.grip);
    b.rotation.z = Math.PI / 2; b.castShadow = true;
    g.add(b);
    for (const sx of [-width / 2 + 0.1, width / 2 - 0.1]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), this.M.metal);
      rod.position.set(sx, 1.3, 0); g.add(rod);
    }
    const cap = new THREE.Mesh(boxGeo(width, 0.25, 0.4, 2), this.M.metal);
    cap.position.y = 2.65; cap.castShadow = true; g.add(cap);
    this.add(g);
    this.world.grabbables.push(new Bar(new V3(x, y, z), width, motion, g));
  }

  zip(start, end, solidStartPosts = true) {
    const { post } = this;
    post.call(this, start.x - 0.9, start.y - 3.8, start.y + 0.5, start.z, solidStartPosts);
    post.call(this, start.x + 0.9, start.y - 3.8, start.y + 0.5, start.z, solidStartPosts);
    { const cb = new THREE.Mesh(boxGeo(2.1, 0.25, 0.3, 2), this.M.metal); cb.position.set(start.x, start.y + 0.5, start.z); this.add(cb); }
    post.call(this, end.x - 0.9, end.y - 3.8, end.y + 0.5, end.z - 0.3, false);
    post.call(this, end.x + 0.9, end.y - 3.8, end.y + 0.5, end.z - 0.3, false);
    { const cb = new THREE.Mesh(boxGeo(2.1, 0.25, 0.3, 2), this.M.metal); cb.position.set(end.x, end.y + 0.5, end.z - 0.3); this.add(cb); }
    this.add(this.cylinderBetween(start, end, 0.025, this.M.cable));
    const trolley = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), this.M.metal);
    wheel.rotation.z = Math.PI / 2;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), this.M.metal); rod.position.y = -0.4;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), this.M.grip);
    handle.rotation.z = Math.PI / 2; handle.position.y = -0.8; handle.castShadow = true;
    trolley.add(wheel, rod, handle);
    this.add(trolley);
    this.world.grabbables.push(new Zip(start, end, trolley, this.sfx));
  }

  // Climbing holds on a vertical face. `face` = centre of the face at its base, `normal` = axis-aligned outward normal.
  holds(face, normal, y0, y1, spread = 0.55, shift = 0) {
    const tangent = new V3(-normal.z, 0, normal.x);
    const geo = new THREE.DodecahedronGeometry(0.17, 0);
    let row = 0;
    const place = (y, off, top) => {
      const p = face.clone().addScaledVector(tangent, off).addScaledVector(normal, 0.12); p.y = y;
      const m = new THREE.Mesh(geo, this.holdMats[(row * 2 + (off > 0 ? 1 : 0)) % this.holdMats.length]);
      m.position.copy(p); m.rotation.set(row, row * 2, 0); m.castShadow = true;
      if (top) m.scale.set(1.6, 1, 1.6);
      this.add(m);
      this.world.grabbables.push(new Hold(p, normal, top));
    };
    for (let y = y0 + 2.2; y < y1 - 0.9; y += 1.6, row++) {
      const o = shift ? Math.sin(row * 1.3) * shift : 0;
      place(y, o - spread, false); place(y, o + spread, false);
    }
    place(y1 - 0.3, -spread, true); place(y1 - 0.3, spread, true);
  }

  // Rotating knock-out beam centred on (x, z), at a height that you have to jump over.
  sweeper({ x, y, z, r, speed, phase = 0, height = 0.15, arms = 1 }) {
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.8, 14), this.M.iron);
    hub.position.set(x, y + 0.9, z); hub.castShadow = true;
    this.add(hub);
    this.world.colliders.push(new Collider(hub, 0.5, 0.9, 0.5));
    for (let a = 0; a < arms; a++) {
      const beam = new THREE.Group();
      const bar = new THREE.Mesh(boxGeo(r * 2, 0.5, 0.45, 2), this.M.danger);
      bar.castShadow = true;
      beam.add(bar);
      for (const s of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), this.M.glove);
        pad.position.x = s * r; beam.add(pad);
      }
      beam.position.set(x, y + height + 0.25, z);
      beam.rotation.y = phase + (a * Math.PI) / arms;
      this.add(beam);
      this.world.colliders.push(new Collider(beam, r, 0.25, 0.25, {
        type: 'knock', knockPower: 11, motion: (t) => { const o = this.zero(); o.yaw = t * speed; return o; },
      }));
    }
  }

  // Boxing glove that punches across the path along X.
  puncher({ xRest, xHit, y, z, period = 2.4, phase = 0 }) {
    const g = new THREE.Group();
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), this.M.glove);
    glove.scale.set(1.0, 0.9, 0.9); glove.castShadow = true;
    const dir = Math.sign(xHit - xRest);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 10, 8), this.M.metal);
    arm.rotation.z = Math.PI / 2; arm.position.x = -dir * 5.4;
    g.add(glove, arm);
    g.position.set(xRest, y, z);
    this.add(g);
    // housing on the far side
    const house = new THREE.Mesh(boxGeo(1.4, 1.8, 1.8, 2), this.M.iron);
    house.position.set(xRest - dir * 6.6, y, z); house.castShadow = true;
    this.add(house);
    this.world.colliders.push(new Collider(g, 0.7, 0.65, 0.65, {
      type: 'knock', knockPower: 13,
      motion: (t) => {
        const o = this.zero();
        const u = (((t + phase) % period) + period) % period;
        let k;
        if (u < 0.15) k = u / 0.15; else if (u < 0.55) k = 1; else if (u < 1.35) k = 1 - (u - 0.55) / 0.8; else k = 0;
        o.x = (xHit - xRest) * k;
        return o;
      },
    }));
  }

  // Pendulum hammer swinging across the path (in the X-Y plane).
  hammer({ x, z, pivotY, L, A, phase = 0, speedMul = 1 }) {
    const w = Math.sqrt(22 / L) * speedMul;
    const g = new THREE.Group();
    g.position.set(x, pivotY, z);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, L, 8), this.M.iron);
    arm.position.y = -L / 2; g.add(arm);
    const head = new THREE.Mesh(boxGeo(1.4, 1.6, 1.6, 2), this.M.iron);
    head.position.y = -L; head.castShadow = true; g.add(head);
    const band = new THREE.Mesh(boxGeo(1.45, 0.3, 1.65, 2), this.M.danger);
    band.position.y = -L; g.add(band);
    this.add(g);
    // pivot housing
    const box = new THREE.Mesh(boxGeo(1, 0.8, 1, 2), this.M.iron); box.position.set(x, pivotY + 0.3, z); this.add(box);
    const holder = new THREE.Object3D(); holder.position.set(x, pivotY - L, z);
    this.world.colliders.push(new Collider(holder, 0.75, 0.85, 0.85, {
      type: 'knock', knockPower: 14,
      motion: (t) => {
        const th = A * Math.sin(w * t + phase);
        g.rotation.z = th;
        const o = this.zero();
        o.x = L * Math.sin(th); o.y = L - L * Math.cos(th);
        return o;
      },
    }));
  }

  // Fires glowing fireballs along ±X across the path.
  cannon({ x, y, z, dir = 1, range = 14, speed = 12, period = 2.0, phase = 0 }) {
    const base = new THREE.Mesh(boxGeo(1.4, 1.6, 1.4, 2), this.M.basalt);
    base.position.set(x, y - 0.3, z); base.castShadow = true; this.add(base);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.8, 12), this.M.iron);
    barrel.rotation.z = Math.PI / 2; barrel.position.set(x + dir * 1.0, y, z); this.add(barrel);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd060, toneMapped: false });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5a10, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const balls = [];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), coreMat));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), glowMat));
      g.visible = false; this.add(g);
      balls.push({ g, on: false, d: 0 });
    }
    let last = null;
    const world = this.world, sfx = this.sfx;
    world.anim.push((t, dt) => {
      const cyc = Math.floor((t + phase) / period);
      if (cyc !== last) {
        last = cyc;
        const b = balls.find((q) => !q.on);
        if (b) {
          b.on = true; b.d = 0; b.g.visible = true; b.g.position.set(x + dir * 1.9, y, z);
          const P = world.player;
          if (P && Math.abs(P.pos.z - z) < 25 && Math.abs(P.pos.x - x) < 25) sfx.cannon();
        }
      }
      const P = world.player;
      for (const b of balls) {
        if (!b.on) continue;
        b.g.position.x += dir * speed * dt; b.d += speed * dt;
        const s = 1 + Math.sin(t * 20) * 0.1; b.g.scale.set(s, s, s);
        if (P) {
          const dx = P.pos.x - b.g.position.x, dz = P.pos.z - b.g.position.z, by = b.g.position.y;
          if (dx * dx + dz * dz < 0.9 * 0.9 && by > P.pos.y - 0.4 && by < P.pos.y + 2.1) {
            if (P.knock(dir, 0, 12, 6, 'obstacle')) sfx.fireHit();
            b.on = false; b.g.visible = false;
          }
        }
        if (b.d > range) { b.on = false; b.g.visible = false; }
      }
    });
  }

  // Lava geyser: a launch pad that throws you up and forward (push = horizontal velocity).
  geyser({ x, y, z, w = 3, d = 3, bounce = 16, push = { x: 0, z: -9 } }) {
    const col = this.plat({ x, y, z, w, d, h: 0.6, style: 'basalt', type: 'tramp', bounce });
    col.push = push;
    const vent = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, d) * 0.38, 24), new THREE.MeshBasicMaterial({ color: 0xffb040, toneMapped: false }));
    vent.rotation.x = -Math.PI / 2; vent.position.set(x, y + 0.02, z); this.add(vent);
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w, d) * 0.15, Math.min(w, d) * 0.4, 5, 16, 1, true), plumeMat);
    plume.position.set(x, y + 2.5, z); this.add(plume);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xffe080, toneMapped: false }));
    arrow.rotation.x = -Math.PI / 2 * Math.sign(-push.z || 1); arrow.position.set(x, y + 0.5, z - Math.sign(-push.z || 1) * 0.2); this.add(arrow);
    this.world.anim.push((t) => {
      plume.scale.set(1, 0.7 + 0.3 * Math.sin(t * 7), 1);
      plumeMat.opacity = 0.22 + 0.12 * Math.sin(t * 11);
      arrow.position.y = y + 0.6 + Math.sin(t * 4) * 0.15;
    });
    return col;
  }

  // Gusting crosswind inside a box; flags on poles show which way it's blowing.
  wind({ x0, x1, z0, z1, y0, y1, force = 6, period = 5 }) {
    const world = this.world;
    const flags = [];
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xff3b6a, side: THREE.DoubleSide, roughness: 0.8, emissive: 0x300010 });
    for (let z = z0 - 2; z > z1; z -= 7) for (const x of [x0 - 0.6, x1 + 0.6]) {
      this.post(x, y0, y0 + 3.2, z, false, this.M.metal, 0.06);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.6), flagMat);
      f.position.set(x, y0 + 2.8, z); this.add(f); flags.push({ f, x });
    }
    world.anim.push((t, dt) => {
      const g = force * Math.sin((t / period) * Math.PI * 2);
      for (const { f, x } of flags) { f.scale.x = Math.max(0.1, Math.abs(g) / force); f.position.x = x + Math.sign(g) * 0.65 * f.scale.x; f.rotation.y = Math.sin(t * 9 + x) * 0.15; }
      const P = world.player;
      if (P && !P.hang && P.pos.x > x0 - 1 && P.pos.x < x1 + 1 && P.pos.z < z0 && P.pos.z > z1 && P.pos.y > y0 - 2 && P.pos.y < y1) P.vel.x += g * dt;
    });
  }

  // Platform that phases in and out. A faint ghost shows where it will reappear.
  blink({ x, y, z, w = 4, d = 4, period = 4, on = 0.6, phase = 0 }) {
    const col = this.plat({ x, y, z, w, d, h: 0.5, style: 'panel', neon: false });
    col.blinkInfo = { period, on, phase };
    const mat = this.M.panel.clone(); mat.transparent = true;
    col.mesh.material = mat;
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff4dff, transparent: true, toneMapped: false });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.08, d + 0.1), edgeMat);
    edge.position.y = 0.26; col.mesh.add(edge);
    this.world.anim.push((t) => {
      const u = (((t + phase) % period) + period) % period / period;
      const solid = u < on;
      col.active = solid;
      let a = solid ? 1 : 0.12;
      if (solid && u > on - 0.18) a = Math.floor(t * 14) % 2 ? 0.35 : 1;
      if (!solid && u > 0.92) a = 0.4;
      mat.opacity = a; edgeMat.opacity = Math.max(0.3, a);
      mat.depthWrite = a > 0.5;
    });
    return col;
  }

  tree(x, y, z, s = 1) { const t = makeTree(s, Math.round(x * 13 + z * 7)); t.position.set(x, y, z); this.add(t); return t; }

  finish(x, y, z, w = 12, d = 12, rockDepth = 16) {
    const col = this.plat({ x, y, z, w, d, style: 'finish', rock: true, rockDepth });
    this.world.finishCol = col;
    this.world.finishPos.set(x, y, z);
    // the banner hangs on short chains *inside* the arch so the two never overlap
    const R = 4.2, az = z - 0.5;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(R, 0.28, 12, 48, Math.PI), this.M.gold);
    arch.position.set(x, y, az); arch.castShadow = true;
    this.add(arch);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#c4161c'; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = '#ffd84d'; g.lineWidth = 14; g.strokeRect(10, 10, 1004, 236);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 160;
    g.font = `900 ${size}px system-ui, sans-serif`;
    const tw = g.measureText('FINISH').width;
    if (tw > 900) { size = Math.floor(size * 900 / tw); g.font = `900 ${size}px system-ui, sans-serif`; }
    g.fillText('FINISH', 512, 132);
    const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 4;
    const bw = 4.0, bh = 1.0, by = y + 2.75;
    const face = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.3 });
    const board = new THREE.Mesh(boxGeo(bw, bh, 0.06, 2), new THREE.MeshStandardMaterial({ color: 0x8a0e12, roughness: 0.8 }));
    board.position.set(x, by, az); board.castShadow = true; this.add(board);
    for (const s of [1, -1]) { // a readable face on each side
      const f = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), face);
      f.position.set(x, by, az + s * 0.035); f.rotation.y = s > 0 ? 0 : Math.PI;
      this.add(f);
    }
    for (const sx of [-1.6, 1.6]) {
      const top = Math.sqrt((R - 0.2) ** 2 - sx * sx);
      this.add(this.cylinderBetween(new V3(x + sx, by + bh / 2, az), new V3(x + sx, y + top, az), 0.03, this.M.cable));
    }
    return col;
  }
}

export { rng };
