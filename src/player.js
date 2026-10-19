// Kinematic character controller: vertical capsule (circle in XZ, segment in Y)
// against yaw-rotated boxes. Handles running, jumping, wall jumps, trampolines,
// riding moving platforms and hanging from swings / bars / ziplines.
import * as THREE from 'three';

export const G = 22;
const JUMP_V = 8.6, RUN = 7.2, RADIUS = 0.35, STEP = 0.45;
const WALL_PUSH = 7.5, WALL_UP = 9.2, TERMINAL = 55;
const LAUNCH_FWD = 8, LAUNCH_UP = 7.5;
const _p = new THREE.Vector3();

export class Player {
  constructor(world, sfx) {
    this.world = world; this.sfx = sfx;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.height = 1.7;
    this.onGround = false; this.ground = null; this._ground = null;
    this.coyote = 0; this.jumpBuf = 0;
    this.wallN = new THREE.Vector3(); this.wallTime = 0; this.wallLock = 0; this.touchWall = false;
    this.hang = null; this.block = new Map(); this.grabCool = 0; this.time = 0;
    this.yawDelta = 0; this.grabInRange = false; this.landV = 0;
  }

  reset(p) {
    this.pos.copy(p); this.vel.set(0, 0, 0);
    if (this.hang) this.hang.g.onRelease();
    this.hang = null; this.ground = null; this.onGround = false;
    this.block.clear(); this.jumpBuf = 0; this.wallTime = 0;
  }

  // inp: { move:{x,y}, yaw, jump, hands:[{pos, rel, vel, held, pressed, range, desktop}] }
  update(dt, inp) {
    this.time += dt; this.yawDelta = 0;
    this.jumpBuf = inp.jump ? 0.15 : Math.max(0, this.jumpBuf - dt);
    this.grabCool = Math.max(0, this.grabCool - dt);
    if (this.hang) this.updateHang(dt, inp);
    else this.updateMove(dt, inp);
  }

  findGrab(hands, onlyHand = -1, requireHeld = true) {
    if (this.grabCool > 0) return null;
    let best = null, bestD = Infinity;
    hands.forEach((h, i) => {
      if (onlyHand >= 0 && i !== onlyHand) return;
      if (requireHeld && !h.held) return;
      for (const g of this.world.grabbables) {
        if ((this.block.get(g) || 0) > this.time) continue;
        const s = g.closest(h.pos, _p);
        const d = _p.distanceTo(h.pos);
        if (d < h.range && d < bestD) { bestD = d; best = { g, s, hand: i, point: _p.clone() }; }
      }
    });
    return best;
  }

  startHang(c, inp) {
    const H = inp.hands[c.hand];
    const hang = { g: c.g, s: c.s, hand: c.hand, offset: new THREE.Vector3(), lerp: new THREE.Vector3() };
    if (H.desktop) hang.lerp.copy(this.pos).sub(_p.copy(c.point).sub(H.rel));
    else hang.offset.subVectors(c.point, H.pos);
    this.hang = hang;
    c.g.onGrab();
    this.onGround = false; this.ground = null;
    this.sfx.grab();
  }

  endHang(inp, launch) {
    const { g, hand } = this.hang;
    const H = inp.hands[hand];
    this.vel.copy(g.vel);
    if (launch) {
      this.vel.x += -Math.sin(inp.yaw) * LAUNCH_FWD;
      this.vel.z += -Math.cos(inp.yaw) * LAUNCH_FWD;
      const hs = Math.hypot(this.vel.x, this.vel.z);
      if (hs > 11) { this.vel.x *= 11 / hs; this.vel.z *= 11 / hs; }
      this.vel.y = Math.min(9, Math.max(this.vel.y + LAUNCH_UP, 5));
      this.sfx.whoosh();
    } else {
      if (!H.desktop && H.vel) {
        // Fling: throwing your hand backwards throws your body forwards.
        _p.copy(H.vel).multiplyScalar(-1.1);
        if (_p.length() > 10) _p.setLength(10);
        this.vel.add(_p);
      }
      this.vel.y += 1.0;
      if (this.vel.lengthSq() > 30) this.sfx.whoosh();
    }
    g.onRelease();
    this.block.set(g, this.time + 0.5);
    this.grabCool = 0.12;
    this.hang = null;
  }

  updateHang(dt, inp) {
    const hg = this.hang, g = hg.g, H = inp.hands[hg.hand];
    // VR: grabbing with the other hand transfers the hold (monkey-bar style).
    if (!H.desktop) {
      for (let i = 0; i < inp.hands.length; i++) {
        if (i === hg.hand || !inp.hands[i].pressed) continue;
        const saved = this.block; this.block = new Map(); // allow re-grabbing the same object with the other hand
        const c = this.findGrab(inp.hands, i);
        this.block = saved;
        if (c) { g.onRelease(); this.hang = null; this.startHang(c, inp); this.sfx.grab(); return; }
      }
    }
    if (this.jumpBuf > 0) { this.jumpBuf = 0; this.endHang(inp, true); return; }
    if (!H.held || g.forceRelease) { this.endHang(inp, false); return; }
    g.pointAt(hg.s, _p);
    if (H.desktop) {
      hg.lerp.multiplyScalar(Math.exp(-dt * 14));
      this.pos.copy(_p).sub(H.rel).add(hg.lerp);
    } else {
      this.pos.copy(_p).sub(hg.offset).sub(H.rel);
    }
    this.vel.copy(g.vel);
    this.grabInRange = false;
  }

  updateMove(dt, inp) {
    const v = this.vel, p = this.pos;
    // ride kinematic ground
    const g = this.ground;
    if (this.onGround && g && g.kinematic && g.active) {
      const dyaw = g.yaw - g.prevYaw;
      let rx = p.x - g.prevPos.x, rz = p.z - g.prevPos.z;
      if (dyaw !== 0) {
        const c = Math.cos(dyaw), s = Math.sin(dyaw);
        const nx = c * rx + s * rz, nz = -s * rx + c * rz;
        rx = nx; rz = nz; this.yawDelta += dyaw;
      }
      p.x = g.pos.x + rx; p.z = g.pos.z + rz; p.y += g.pos.y - g.prevPos.y;
    }

    // desired movement in world space (forward = -Z at yaw 0)
    const sy = Math.sin(inp.yaw), cy = Math.cos(inp.yaw);
    let wx = cy * inp.move.x - sy * inp.move.y;
    let wz = -sy * inp.move.x - cy * inp.move.y;
    let wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; wl = 1; }

    if (this.onGround) {
      const tx = wx * RUN, tz = wz * RUN;
      const ax = tx - v.x, az = tz - v.z, al = Math.hypot(ax, az), maxA = 70 * dt;
      if (al > maxA) { v.x += ax / al * maxA; v.z += az / al * maxA; } else { v.x = tx; v.z = tz; }
    } else if (wl > 0.01) {
      // air steering: turns momentum toward the stick without bleeding launch speed
      const accel = this.wallLock > 0 ? 4 : 20;
      const dx = wx / wl, dz = wz / wl;
      const sp = Math.hypot(v.x, v.z);
      const along = sp > 0.01 ? (v.x * dx + v.z * dz) / sp : 1;
      const tSpeed = along > 0 ? Math.max(RUN * wl, sp) : RUN * wl;
      const ax = dx * tSpeed - v.x, az = dz * tSpeed - v.z, al = Math.hypot(ax, az), maxA = accel * dt;
      if (al > maxA) { v.x += ax / al * maxA; v.z += az / al * maxA; } else { v.x += ax; v.z += az; }
    }

    // jumping
    this.coyote = this.onGround ? 0.12 : Math.max(0, this.coyote - dt);
    this.wallTime = this.onGround ? 0 : Math.max(0, this.wallTime - dt);
    this.wallLock = Math.max(0, this.wallLock - dt);
    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        v.y = JUMP_V;
        if (g && g.kinematic) { v.x += g.vel.x; v.z += g.vel.z; v.y += Math.max(0, g.vel.y); }
        this.coyote = 0; this.jumpBuf = 0; this.onGround = false; this.ground = null;
        this.sfx.jump();
      } else if (this.wallTime > 0) {
        const n = this.wallN, vn = v.x * n.x + v.z * n.z;
        v.x += n.x * (WALL_PUSH - vn); v.z += n.z * (WALL_PUSH - vn);
        v.y = WALL_UP;
        this.wallTime = 0; this.wallLock = 0.28; this.jumpBuf = 0;
        this.sfx.wallJump();
      }
    }

    v.y -= G * dt;
    if (this.touchWall && v.y < -3) v.y = -3; // wall slide
    if (v.y < -TERMINAL) v.y = -TERMINAL;

    // integrate with sub-steps
    const wasGround = this.onGround;
    this.onGround = false; this.touchWall = false; this._ground = null; this.landV = 0;
    const steps = Math.max(1, Math.ceil(v.length() * dt / 0.2));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const prevFeet = p.y;
      p.addScaledVector(v, h);
      for (let it = 0; it < 3; it++) {
        let any = false;
        for (const c of this.world.colliders) if (c.active && this.resolve(c, prevFeet)) any = true;
        if (!any) break;
      }
    }
    this.ground = this._ground;
    if (this.onGround && !wasGround && this.landV < -5) this.sfx.land(Math.min(1, -this.landV / 25));
    if (this.ground && this.ground.onStand) this.ground.onStand();

    // grabbing
    const c = this.findGrab(inp.hands);
    if (c) { this.startHang(c, inp); this.grabInRange = false; return; }
    this.grabInRange = !!this.findGrab(inp.hands, -1, false);
  }

  resolve(c, prevFeet) {
    const p = this.pos, h = c.half, R = RADIUS, H = this.height;
    const dx = p.x - c.pos.x, dz = p.z - c.pos.z, br = c.bxz + R;
    if (dx * dx + dz * dz > br * br) return false;
    const feet = p.y - c.pos.y, top = feet + H;
    if (top <= -h.y || feet >= h.y) return false;
    const lx = c.cs * dx - c.sn * dz, lz = c.sn * dx + c.cs * dz;
    const qx = Math.min(h.x, Math.max(-h.x, lx)), qz = Math.min(h.z, Math.max(-h.z, lz));
    const ddx = lx - qx, ddz = lz - qz, d2 = ddx * ddx + ddz * ddz;
    if (d2 >= R * R) return false;

    let penH, nx, nz;
    if (d2 > 1e-10) {
      const d = Math.sqrt(d2); penH = R - d; nx = ddx / d; nz = ddz / d;
    } else {
      const e1 = h.x - lx, e2 = lx + h.x, e3 = h.z - lz, e4 = lz + h.z;
      penH = e1; nx = 1; nz = 0;
      if (e2 < penH) { penH = e2; nx = -1; nz = 0; }
      if (e3 < penH) { penH = e3; nx = 0; nz = 1; }
      if (e4 < penH) { penH = e4; nx = 0; nz = -1; }
      penH += R;
    }

    const v = this.vel;
    const penUp = h.y - feet;
    const wasAbove = prevFeet - c.pos.y >= h.y - 0.06;
    if (v.y <= 1.0 && (wasAbove || (penUp <= STEP && v.y <= 0.5))) {
      p.y += penUp;
      if (c.type === 'tramp') {
        v.y = c.bounce; this.coyote = 0; this.jumpBuf = 0;
        if (c.onBounce) c.onBounce();
        this.sfx.bounce();
      } else {
        if (v.y < this.landV) this.landV = v.y;
        if (v.y < 0) v.y = 0;
        this.onGround = true; this._ground = c;
      }
      return true;
    }
    if (prevFeet + H - c.pos.y <= -h.y + 0.06 && v.y > 0) {
      p.y -= top + h.y; v.y = 0; // head bump
      return true;
    }
    const wx = c.cs * nx + c.sn * nz, wz = -c.sn * nx + c.cs * nz;
    p.x += wx * penH; p.z += wz * penH;
    const vn = v.x * wx + v.z * wz;
    if (vn < 0) { v.x -= wx * vn; v.z -= wz * vn; }
    if (c.type === 'wall' && !this.onGround && Math.abs(nx) > 0.5) { // long faces only
      this.wallN.set(wx, 0, wz); this.wallTime = 0.2; this.touchWall = true;
    }
    return true;
  }
}
