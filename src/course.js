// The parkour course: colliders, moving parts, grabbables, checkpoints and the finish.
// Travel direction is -Z. Every platform is placed by its TOP surface height.
import * as THREE from 'three';
import { boxGeo, signTexture, rng } from './textures.js';
import { makeRock, makeTree } from './scenery.js';

const V3 = THREE.Vector3;
const _ab = new V3();

// ---------------- colliders ----------------
export class Collider {
  constructor(mesh, hx, hy, hz, opts = {}) {
    this.mesh = mesh;
    this.half = new V3(hx, hy, hz);
    this.base = mesh.position.clone();
    this.baseYaw = mesh.rotation.y;
    this.motion = opts.motion || null;
    this.kinematic = !!this.motion;
    this.type = opts.type || 'solid'; // solid | wall | tramp | crumble
    this.bounce = opts.bounce || 0;
    this.active = true;
    this.onStand = null;
    this.onBounce = null;
    this.bxz = Math.hypot(hx, hz);
    this.pos = this.base.clone();
    this.prevPos = this.base.clone();
    this.yaw = this.baseYaw;
    this.prevYaw = this.yaw;
    this.vel = new V3();
    if (this.motion) this.apply(this.motion(0));
    this.prevPos.copy(this.pos); this.prevYaw = this.yaw;
    this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
  }
  apply(o) {
    this.pos.set(this.base.x + (o.x || 0), this.base.y + (o.y || 0), this.base.z + (o.z || 0));
    this.yaw = this.baseYaw + (o.yaw || 0);
    this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
  }
  step(t, dt) {
    this.prevPos.copy(this.pos); this.prevYaw = this.yaw;
    this.apply(this.motion(t));
    this.vel.subVectors(this.pos, this.prevPos).divideScalar(Math.max(dt, 1e-4));
  }
}

// ---------------- grabbables (a segment you can hang from) ----------------
class Grabbable {
  constructor() {
    this.a = new V3(); this.b = new V3(); this.vel = new V3();
    this.grabbed = false; this.forceRelease = false;
  }
  closest(p, out) {
    const ab = _ab.subVectors(this.b, this.a);
    const l2 = ab.lengthSq();
    let s = l2 > 0 ? ((p.x - this.a.x) * ab.x + (p.y - this.a.y) * ab.y + (p.z - this.a.z) * ab.z) / l2 : 0;
    s = Math.min(1, Math.max(0, s));
    out.copy(this.a).addScaledVector(ab, s);
    return s;
  }
  pointAt(s, out) { return out.copy(this.a).lerp(this.b, s); }
  onGrab() { this.grabbed = true; }
  onRelease() { this.grabbed = false; this.forceRelease = false; }
}

class Swing extends Grabbable {
  constructor(pivot, L, A, w, phase, width, mesh) {
    super();
    Object.assign(this, { pivot: pivot.clone(), L, A, w, phase, width, mesh });
  }
  update(t) {
    const ph = this.w * t + this.phase;
    const th = this.A * Math.sin(ph);
    const dth = this.A * this.w * Math.cos(ph);
    this.mesh.rotation.x = th;
    const cy = this.pivot.y - this.L * Math.cos(th), cz = this.pivot.z - this.L * Math.sin(th);
    this.a.set(this.pivot.x - this.width / 2, cy, cz);
    this.b.set(this.pivot.x + this.width / 2, cy, cz);
    this.vel.set(0, this.L * dth * Math.sin(th), -this.L * dth * Math.cos(th));
  }
}

class Bar extends Grabbable {
  constructor(center, width, motion, mesh) {
    super();
    this.center = center.clone(); this.width = width; this.motion = motion; this.mesh = mesh;
    this.off = new V3(); this.prevOff = new V3();
    if (motion) this.prevOff.copy(motion(0));
    this.update(0, 1 / 60);
  }
  update(t, dt) {
    if (this.motion) this.off.copy(this.motion(t));
    this.vel.subVectors(this.off, this.prevOff).divideScalar(Math.max(dt, 1e-4));
    this.prevOff.copy(this.off);
    this.mesh.position.copy(this.center).add(this.off);
    this.a.copy(this.mesh.position); this.a.x -= this.width / 2;
    this.b.copy(this.mesh.position); this.b.x += this.width / 2;
  }
}

class Zip extends Grabbable {
  constructor(start, end, trolley, sfx) {
    super();
    this.start = start.clone(); this.end = end.clone();
    this.dir = new V3().subVectors(end, start); this.len = this.dir.length(); this.dir.normalize();
    this.u0 = 0.4; this.uEnd = this.len - 2.2; this.u = this.u0;
    this.speed = 0; this.idle = 0; this.trolley = trolley; this.sfx = sfx;
    this.update(0, 0);
  }
  onGrab() { super.onGrab(); this.idle = 0; this.speed = Math.max(this.speed, 1.5); this.sfx.zip(); }
  update(t, dt) {
    if (this.grabbed) {
      this.speed = Math.min(this.speed + 8 * dt, 15);
      const rem = this.uEnd - this.u;
      if (rem < 10) this.speed = Math.max(4, Math.min(this.speed, rem * 1.6));
      this.u += this.speed * dt;
      if (this.u >= this.uEnd) { this.u = this.uEnd; this.forceRelease = true; }
      this.vel.copy(this.dir).multiplyScalar(this.speed);
    } else {
      this.idle += dt;
      this.vel.set(0, 0, 0);
      if (this.idle > 1.5 && this.u > this.u0) { this.u = Math.max(this.u0, this.u - 12 * dt); this.speed = 0; }
    }
    const p = this.trolley.position.copy(this.start).addScaledVector(this.dir, this.u);
    this.a.set(p.x - 0.45, p.y - 0.8, p.z);
    this.b.set(p.x + 0.45, p.y - 0.8, p.z);
  }
}

class Crumble {
  constructor(col, sfx) {
    this.col = col; this.mesh = col.mesh; this.sfx = sfx;
    this.base = this.mesh.position.clone();
    this.state = 'idle'; this.timer = 0; this.vy = 0;
    col.onStand = () => this.trigger();
  }
  trigger() {
    if (this.state !== 'idle') return;
    this.state = 'shake'; this.timer = 0.6; this.sfx.crack();
  }
  update(dt) {
    if (this.state === 'shake') {
      this.timer -= dt;
      const j = 0.05;
      this.mesh.position.set(this.base.x + (Math.random() - 0.5) * j, this.base.y + (Math.random() - 0.5) * j, this.base.z + (Math.random() - 0.5) * j);
      if (this.timer <= 0) { this.state = 'fall'; this.col.active = false; this.vy = 0; this.timer = 0; this.sfx.crumble(); }
    } else if (this.state === 'fall') {
      this.timer += dt;
      this.vy -= 20 * dt;
      this.mesh.position.y += this.vy * dt;
      this.mesh.rotation.x += dt * 0.8; this.mesh.rotation.z += dt * 0.5;
      if (this.timer > 3.5) this.reset();
    }
  }
  reset() {
    this.state = 'idle'; this.col.active = true;
    this.mesh.position.copy(this.base); this.mesh.rotation.set(0, 0, 0);
  }
}

export class World {
  constructor(scene, sfx) {
    this.scene = scene; this.sfx = sfx;
    this.colliders = []; this.grabbables = []; this.checkpoints = []; this.crumbles = [];
    this.anim = [];
    this.finishCol = null; this.finishPos = new V3();
    this.killY = -32;
  }
  update(t, dt) {
    for (const c of this.colliders) if (c.kinematic) c.step(t, dt);
    for (const c of this.crumbles) c.update(dt);
    for (const g of this.grabbables) g.update(t, dt);
    for (const f of this.anim) f(t, dt);
  }
  resetCrumbles() { for (const c of this.crumbles) c.reset(); }
}

// ---------------- builder ----------------
export function buildCourse(scene, tex, sfx) {
  const world = new World(scene, sfx);
  const std = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0, ...o });
  const M = {
    grass: std(tex.grass), dirt: std(tex.dirt), stone: std(tex.stone), wood: std(tex.wood, { roughness: 0.8 }),
    crumble: std(tex.crumble), wall: std(tex.wall, { roughness: 0.75 }),
    trampTop: std(tex.trampTop, { roughness: 0.55 }), megaTop: std(tex.megaTop, { roughness: 0.55 }),
    stripes: std(tex.stripes, { roughness: 0.5, metalness: 0.1 }),
    metal: std(tex.metal, { metalness: 0.85, roughness: 0.35 }),
    checker: std(tex.checker, { roughness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffc94a, metalness: 1, roughness: 0.22 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x9a7a4d, roughness: 1 }),
    grip: new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.4, emissive: 0x553800, emissiveIntensity: 0.6 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.4 }),
  };
  let rockSeed = 1;
  let OZ = 0; // z offset applied to everything placed after it is set

  function plat(o) {
    const { x = 0, y, w, d, style = 'stone' } = o;
    const z = o.z + OZ;
    const h = o.h ?? (style === 'island' ? 1.2 : 0.8);
    let geo, mats;
    switch (style) {
      case 'island': geo = boxGeo(w, h, d, 4, true); mats = [M.dirt, M.dirt, M.grass, M.stone, M.dirt, M.dirt]; break;
      case 'wood': geo = boxGeo(w, h, d, 3); mats = M.wood; break;
      case 'crumble': geo = boxGeo(w, h, d, 2); mats = M.crumble; break;
      case 'wall': geo = boxGeo(w, h, d, 3); mats = M.wall; break;
      case 'metal': geo = boxGeo(w, h, d, 2); mats = M.metal; break;
      case 'finish': geo = boxGeo(w, h, d, 4, true); mats = [M.dirt, M.dirt, M.checker, M.stone, M.dirt, M.dirt]; break;
      case 'tramp': case 'mega':
        geo = new THREE.BoxGeometry(w, h, d);
        mats = [M.stripes, M.stripes, style === 'mega' ? M.megaTop : M.trampTop, M.stripes, M.stripes, M.stripes];
        break;
      default: geo = boxGeo(w, h, d, 4); mats = M.stone;
    }
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(x, y - h / 2, z);
    mesh.rotation.y = o.yaw || 0;
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    const col = new Collider(mesh, w / 2, h / 2, d / 2, { type: o.type, bounce: o.bounce, motion: o.motion });
    world.colliders.push(col);
    if (o.rock) {
      const rock = makeRock(w / 2 * 0.92, d / 2 * 0.92, o.rockDepth ?? (w + d) * 0.42, rockSeed++);
      rock.position.y = -h / 2 + 0.05;
      mesh.add(rock);
    }
    if (o.type === 'crumble') world.crumbles.push(new Crumble(col, sfx));
    if (o.type === 'tramp') {
      let t = 10;
      col.onBounce = () => { t = 0; };
      world.anim.push((_, dt) => {
        t += dt;
        mesh.scale.y = 1 - 0.45 * Math.exp(-7 * t) * Math.cos(20 * t);
      });
    }
    return col;
  }

  function post(x, y0, y1, z, solid = true, mat = M.metal, r = 0.15) {
    const h = y1 - y0;
    const m = new THREE.Mesh(boxGeo(r * 2, h, r * 2, 2), mat);
    m.position.set(x, y0 + h / 2, z + OZ); m.castShadow = true;
    scene.add(m);
    if (solid) world.colliders.push(new Collider(m, r, h / 2, r));
    return m;
  }

  function cylinderBetween(a, b, radius, mat) {
    const dir = new V3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 8), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    return m;
  }

  function sign(x, y, z, title, body, yaw = 0, accent) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: signTexture(title, body, accent), roughness: 0.7, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }));
    board.material.emissiveMap = board.material.map; board.material.emissiveIntensity = 0.35;
    board.position.y = 2.4;
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 0.1), M.wood);
    back.position.set(0, 2.4, -0.07);
    g.add(board, back);
    for (const sx of [-1.4, 1.4]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), M.wood);
      p.position.set(sx, 1.6, -0.12); p.castShadow = true;
      g.add(p);
    }
    back.castShadow = true;
    // push signs off the racing line and angle them toward it
    if (!yaw && Math.abs(x) > 0.5) { x = Math.sign(x) * Math.max(Math.abs(x), 3); yaw = -Math.sign(x) * 0.45; }
    g.position.set(x, y, z + OZ); g.rotation.y = yaw;
    scene.add(g);
  }

  function checkpoint(x, y, z) {
    z += OZ;
    const index = world.checkpoints.length;
    const g = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({ color: 0x59d6ff, emissive: 0x1a7fa8, emissiveIntensity: 1, roughness: 0.4 });
    const pad = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 40), padMat);
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.06;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), M.metal);
    pole.position.set(2.2, 1.6, 0); pole.castShadow = true;
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, roughness: 0.8 });
    const flagGeo = new THREE.PlaneGeometry(1.2, 0.75, 8, 1); flagGeo.translate(0.6, 0, 0);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(2.2, 2.75, 0); flag.castShadow = true;
    g.add(pad, pole, flag);
    g.position.set(x, y, z);
    scene.add(g);
    const base = flagGeo.attributes.position.array.slice();
    world.anim.push((t) => {
      const p = flagGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const bx = base[i * 3];
        p.setZ(i, Math.sin(t * 5 + bx * 4 + index) * 0.12 * bx);
      }
      p.needsUpdate = true;
      pad.rotation.z = t * 0.5;
    });
    const cp = {
      index, pos: new V3(x, y + 0.02, z), yaw: 0, active: index === 0,
      activate() { this.active = true; flagMat.color.set(0x3ddc5a); padMat.color.set(0x3ddc5a); padMat.emissive.set(0x147a2a); },
      deactivate() { this.active = index === 0; if (index) { flagMat.color.set(0xaaaaaa); padMat.color.set(0x59d6ff); padMat.emissive.set(0x1a7fa8); } },
    };
    if (index === 0) cp.activate();
    world.checkpoints.push(cp);
    return cp;
  }

  function swing(px, py, pz, L, A, phase) {
    pz += OZ;
    const group = new THREE.Group();
    group.position.set(px, py, pz);
    const width = 1.3;
    for (const sx of [-0.55, 0.55]) group.add(cylinderBetween(new V3(sx, 0, 0), new V3(sx, -L, 0), 0.035, M.rope));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width, 10), M.grip);
    bar.rotation.z = Math.PI / 2; bar.position.y = -L; bar.castShadow = true;
    group.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10), M.metal);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
    scene.add(group);
    world.grabbables.push(new Swing(new V3(px, py, pz), L, A, Math.sqrt(22 / L), phase, width, group));
  }

  function bar(x, y, z, width, motion) {
    z += OZ;
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width, 10), M.grip);
    b.rotation.z = Math.PI / 2; b.castShadow = true;
    g.add(b);
    for (const sx of [-width / 2 + 0.1, width / 2 - 0.1]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), M.metal);
      rod.position.set(sx, 1.3, 0); g.add(rod);
    }
    const cap = new THREE.Mesh(boxGeo(width, 0.25, 0.4, 2), M.metal);
    cap.position.y = 2.65; cap.castShadow = true; g.add(cap);
    scene.add(g);
    world.grabbables.push(new Bar(new V3(x, y, z), width, motion, g));
  }

  const out = { x: 0, y: 0, z: 0, yaw: 0 };
  const zero = () => { out.x = out.y = out.z = out.yaw = 0; return out; };

  // ===== START ISLAND =====
  plat({ x: 0, y: 0, z: 0, w: 16, d: 16, style: 'island', rock: true, rockDepth: 16 });
  checkpoint(0, 0, 4);
  sign(-4.5, 0, -3, 'SKY PARKOUR', 'Reach the finish far ahead. Fall and you fall to your death.');
  { const t = makeTree(1.2, 3); t.position.set(5.5, 0, 5); scene.add(t); }
  { const t = makeTree(0.9, 4); t.position.set(-6, 0, 5.5); scene.add(t); }
  { const t = makeTree(1.0, 5); t.position.set(6, 0, -5.5); scene.add(t); }

  // ===== 1. JUMPS: stepping stones =====
  const stoneX = [0, 1.8, -1.2, 1.5, -1.5, 0];
  const stoneY = [0.5, 1.0, 1.5, 1.2, 1.8, 2.0];
  for (let i = 0; i < 6; i++) plat({ x: stoneX[i], y: stoneY[i], z: -12 - i * 5.5, w: 3, d: 3, h: 1.2, style: 'stone', rock: true, rockDepth: 3 });
  plat({ x: 0, y: 2, z: -47.5, w: 8, d: 8, style: 'island', rock: true });

  // ===== 2. TILE JUMPS (orange tiles crumble) =====
  sign(-2.2, 2, -49.5, 'TILE JUMPS', 'Orange tiles crumble a moment after you land. Keep moving!');
  const tr = rng(99);
  for (let row = 0; row < 7; row++) for (let colI = 0; colI < 3; colI++) {
    const crumbly = tr() < 0.55;
    plat({ x: (colI - 1) * 3, y: 2 + (tr() - 0.5) * 0.6, z: -53.5 - row * 3, w: 1.4, d: 1.4, h: 0.5, style: crumbly ? 'crumble' : 'stone', type: crumbly ? 'crumble' : 'solid' });
  }
  plat({ x: 0, y: 2, z: -78.7, w: 8, d: 8, style: 'island', rock: true });
  checkpoint(0, 2, -78.7);

  // ===== 3. TRAMPOLINES =====
  sign(-2.2, 2, -80.8, 'TRAMPOLINES', 'Drop onto a trampoline to bounce high. Hold forward in the air.');
  plat({ x: 0, y: 0, z: -88.7, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
  plat({ x: 0, y: 5, z: -97, w: 5, d: 5, style: 'wood', rock: true, rockDepth: 4 });
  plat({ x: 0, y: 1, z: -105.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
  plat({ x: 0, y: 1, z: -116.5, w: 4, d: 4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17 });
  OZ = -4.3;
  plat({ x: 0, y: 6, z: -120.7, w: 8, d: 8, style: 'island', rock: true });
  checkpoint(0, 6, -120.7);

  // ===== 4. WALL JUMPS =====
  sign(2.2, 6, -122.8, 'WALL JUMPS', 'Jump into an orange wall, then press jump again to kick off it.', 0, '#ff8a4a');
  const wallZ = [-129.7, -133.2, -136.7, -140.2, -143.7];
  wallZ.forEach((z, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    plat({ x: side * 2.3, y: 16, z, w: 0.6, d: 10, h: 12, style: 'wall', type: 'wall' });
  });
  plat({ x: 0, y: 7, z: -154, w: 8, d: 10, style: 'island', rock: true });
  // vertical shaft: bounce left-right between the walls to climb
  plat({ x: -2.05, y: 19, z: -157, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
  plat({ x: 2.05, y: 19, z: -157, w: 0.6, d: 4, h: 12, style: 'wall', type: 'wall' });
  sign(-3.2, 7, -152.2, 'THE SHAFT', 'Wall jump left and right to climb up. Push forward at the top.', 0, '#ff8a4a');
  plat({ x: 0, y: 16, z: -163, w: 8, d: 8, h: 9, style: 'island', rock: true, rockDepth: 6 });
  checkpoint(0, 16, -163.5);

  // ===== 5. SWINGS =====
  sign(-2.6, 16, -160.2, 'SWINGS', 'Hold E (or grip) near the handle. Press jump to launch at the next one.');
  for (const sx of [-1.0, 1.0]) {
    post(sx, 16, 22.75, -166.3);
    post(sx, 16, 22.75, -204.7);
    const beam = new THREE.Mesh(boxGeo(0.3, 0.3, 39, 2), M.metal);
    beam.position.set(sx, 22.6, -185.5 + OZ); beam.castShadow = true;
    scene.add(beam);
  }
  swing(0, 22.4, -173, 6, 0.87, 0);
  swing(0, 22.4, -185, 6, 0.87, Math.PI);
  swing(0, 22.4, -197, 6, 0.87, 0);
  plat({ x: 0, y: 16, z: -208, w: 8, d: 8, style: 'island', rock: true });

  // ===== 6. GRABBERS =====
  sign(-2.6, 16, -205.8, 'GRABBERS', 'Grab a bar, then jump to fling yourself to the next. Some bars move!');
  bar(0, 19.6, -214.5, 3);
  bar(0, 19.6, -219.5, 3);
  bar(0, 19.6, -224.5, 3, (t) => zero() && (out.y = Math.sin(t * 1.3) * 1.0, out));
  bar(0, 19.6, -229.5, 3, (t) => zero() && (out.y = Math.sin(t * 1.3 + Math.PI) * 1.0, out));
  bar(0, 19.6, -234.5, 3, (t) => zero() && (out.x = Math.sin(t * 1.0) * 2.0, out));
  bar(0, 19.6, -239.5, 3, (t) => zero() && (out.x = Math.sin(t * 1.0 + Math.PI) * 2.0, out));
  plat({ x: 0, y: 17, z: -246, w: 8, d: 8, style: 'island', rock: true });
  checkpoint(0, 17, -246);

  // ===== 7. MOVING & ROTATING PLATFORMS =====
  sign(-2.6, 17, -243.8, 'ON THE MOVE', 'Ride the moving platforms and time your jumps across the spinner.');
  plat({ x: 0, y: 17, z: -260, w: 4, d: 4, h: 0.6, style: 'metal', motion: (t) => { zero(); out.z = Math.sin(t * 0.7) * 6; return out; } });
  for (const a of [0, Math.PI / 2]) {
    plat({ x: 0, y: 17, z: -276, w: 11, d: 2.2, h: 0.6, style: 'wood', yaw: a, motion: (t) => { zero(); out.yaw = t * 0.5; return out; } });
  }
  { const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 3, 10), M.metal); hub.position.set(0, 15.2, -276 + OZ); scene.add(hub); }
  plat({ x: 0, y: 17.5, z: -286, w: 4, d: 4, h: 0.6, style: 'metal', motion: (t) => { zero(); out.x = Math.sin(t * 0.8) * 5; return out; } });
  plat({ x: 0, y: 18, z: -295, w: 8, d: 8, style: 'island', rock: true });

  // ===== 8. ZIPLINE =====
  sign(-2.6, 18, -292.2, 'ZIPLINE', 'Grab the handle and hold on. Let go over the island below.');
  const zs = new V3(0, 21.8, -298.3 + OZ), ze = new V3(0, 6.8, -345.5 + OZ);
  post(-0.9, 18, 22.3, -298.3); post(0.9, 18, 22.3, -298.3);
  { const cb = new THREE.Mesh(boxGeo(2.1, 0.25, 0.3, 2), M.metal); cb.position.set(0, 22.3, -298.3 + OZ); scene.add(cb); }
  post(-0.9, 3, 7.4, -345.8, false); post(0.9, 3, 7.4, -345.8, false);
  { const cb = new THREE.Mesh(boxGeo(2.1, 0.25, 0.3, 2), M.metal); cb.position.set(0, 7.3, -345.8 + OZ); scene.add(cb); }
  scene.add(cylinderBetween(zs, ze, 0.025, M.cable));
  const trolley = new THREE.Group();
  {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), M.metal);
    wheel.rotation.z = Math.PI / 2;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), M.metal); rod.position.y = -0.4;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), M.grip);
    handle.rotation.z = Math.PI / 2; handle.position.y = -0.8; handle.castShadow = true;
    trolley.add(wheel, rod, handle);
  }
  scene.add(trolley);
  world.grabbables.push(new Zip(zs, ze, trolley, sfx));
  plat({ x: 0, y: 3, z: -347, w: 10, d: 10, style: 'island', rock: true });
  checkpoint(0, 3, -348.5);

  // ===== 9. FINAL CLIMB =====
  sign(-3.4, 3, -343.6, 'FINAL CLIMB', 'Crumbling steps, then the MEGA trampoline to the finish!', 0, '#ff5a4a');
  const stepY = [4, 5.2, 6.4, 7.6, 8.8, 10];
  const stepX = [1.2, -1.2, 1.2, -1.2, 1.2, 0];
  stepY.forEach((y, i) => {
    const crumbly = i === 1 || i === 3 || i === 4;
    plat({ x: stepX[i], y, z: -355.5 - i * 4.5, w: 2.6, d: 2.2, h: 0.6, style: crumbly ? 'crumble' : 'stone', type: crumbly ? 'crumble' : 'solid' });
  });
  plat({ x: 0, y: 10, z: -384.5, w: 6, d: 6, style: 'stone', rock: true, rockDepth: 5 });
  plat({ x: 0, y: 8, z: -392.5, w: 3, d: 3, h: 0.6, style: 'mega', type: 'tramp', bounce: 24 });
  world.finishCol = plat({ x: 0, y: 18, z: -404.5, w: 12, d: 12, style: 'finish', rock: true, rockDepth: 18 });
  world.finishPos.set(0, 18, -405 + OZ);

  // finish arch
  {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.28, 12, 40, Math.PI), M.gold);
    arch.position.set(0, 18, -405 + OZ); arch.castShadow = true;
    scene.add(arch);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#c4161c'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#fff'; g.font = '900 170px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('FINISH', 512, 136);
    const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), new THREE.MeshStandardMaterial({ map: bt, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.25 }));
    banner.position.set(0, 21.2, -405 + OZ);
    scene.add(banner);
    for (const [tx, tz, s] of [[-4.5, -409, 1.2], [4.6, -408.5, 1.0], [-4.8, -400.5, 0.8], [4.7, -401, 0.9]]) {
      const t = makeTree(s, tx * 10 + tz); t.position.set(tx, 18, tz + OZ); scene.add(t);
    }
  }
  return world;
}
