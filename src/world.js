// Runtime objects shared by every level: colliders, grabbables, crumbling tiles and the World container.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const _ab = new V3();

// Yaw-rotated box. Types: solid | wall | wallrun | tramp | crumble | knock | ramp
// Ramps: `slope` = rise per metre along local +Z; pos.y is the surface height at the centre.
export class Collider {
  constructor(obj, hx, hy, hz, opts = {}) {
    this.mesh = obj;
    this.half = new V3(hx, hy, hz);
    this.base = obj.position.clone();
    this.baseYaw = obj.rotation.y;
    this.motion = opts.motion || null;
    this.kinematic = !!this.motion;
    this.type = opts.type || 'solid';
    this.bounce = opts.bounce || 0;
    this.slope = opts.slope || 0;
    this.knockPower = opts.knockPower || 12;
    this.active = true;
    this.onStand = null; this.onBounce = null;
    this.bxz = Math.hypot(hx, hz);
    this.pos = this.base.clone(); this.prevPos = this.base.clone();
    this.yaw = this.baseYaw; this.prevYaw = this.yaw;
    this.vel = new V3();
    this.syncMesh = opts.syncMesh !== false;
    if (this.motion) this.apply(this.motion(0));
    this.prevPos.copy(this.pos); this.prevYaw = this.yaw;
    this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
  }
  apply(o) {
    this.pos.set(this.base.x + (o.x || 0), this.base.y + (o.y || 0), this.base.z + (o.z || 0));
    this.yaw = this.baseYaw + (o.yaw || 0);
    this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
    if (this.syncMesh) { this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw; }
  }
  step(t, dt) {
    this.prevPos.copy(this.pos); this.prevYaw = this.yaw;
    this.apply(this.motion(t));
    this.vel.subVectors(this.pos, this.prevPos).divideScalar(Math.max(dt, 1e-4));
  }
}

// A segment you can hang from. kind: bar | swing | zip | hold
export class Grabbable {
  constructor() {
    this.a = new V3(); this.b = new V3(); this.vel = new V3();
    this.grabbed = false; this.forceRelease = false;
    this.kind = 'bar'; this.bodyOffset = null;
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
  update() {}
}

export class Swing extends Grabbable {
  constructor(pivot, L, A, w, phase, width, mesh) {
    super();
    this.kind = 'swing';
    Object.assign(this, { pivot: pivot.clone(), L, A, w, phase, width, mesh });
  }
  update(t) {
    const ph = this.w * t + this.phase;
    const th = this.A * Math.sin(ph), dth = this.A * this.w * Math.cos(ph);
    this.mesh.rotation.x = th;
    const cy = this.pivot.y - this.L * Math.cos(th), cz = this.pivot.z - this.L * Math.sin(th);
    this.a.set(this.pivot.x - this.width / 2, cy, cz);
    this.b.set(this.pivot.x + this.width / 2, cy, cz);
    this.vel.set(0, this.L * dth * Math.sin(th), -this.L * dth * Math.cos(th));
  }
}

export class Bar extends Grabbable {
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

// Climbing hold on a wall. `normal` points out of the wall; `top` holds let you mantle onto the ledge.
export class Hold extends Grabbable {
  constructor(pos, normal, top) {
    super();
    this.kind = 'hold';
    this.a.copy(pos); this.b.copy(pos);
    this.normal = normal.clone(); this.top = !!top;
    this.bodyOffset = normal.clone().multiplyScalar(0.45);
  }
}

export class Zip extends Grabbable {
  constructor(start, end, trolley, sfx) {
    super();
    this.kind = 'zip';
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

export class Crumble {
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
  constructor(sfx) {
    this.sfx = sfx;
    this.colliders = []; this.grabbables = []; this.checkpoints = []; this.crumbles = [];
    this.anim = [];
    this.events = [];
    this.finishCol = null; this.finishPos = new V3();
    this.killY = -32;
    this.boss = null; this.player = null;
    this.camPos = new V3();
  }
  update(t, dt) {
    for (const c of this.colliders) if (c.kinematic) c.step(t, dt);
    for (const c of this.crumbles) c.update(dt);
    for (const g of this.grabbables) g.update(t, dt);
    for (const f of this.anim) f(t, dt);
    if (this.boss) this.boss.update(t, dt);
  }
  resetCrumbles() { for (const c of this.crumbles) c.reset(); }
}
