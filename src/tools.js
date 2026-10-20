// Gadgets handed out by stations in the later worlds:
//   BLASTER  — shoot targets (world.targets) to open gates. Usually paired with a slow-mo pad.
//   GRAPPLER — fire at a grapple point (world.hooks) to be reeled in and flung onto the ledge.
// Aiming uses the camera (desktop) or the controller's pointing ray (VR), with a little aim
// assist; walls and platforms block the shot. A reticle ring locks on when a shot will land.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const RANGE = { gun: 34, grapple: 18 };

export function makeGunModel() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xe8ecf4, metalness: 0.4, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23262e, metalness: 0.6, roughness: 0.4 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x4dffd2, toneMapped: false });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(0.07, 0.08, 0.26, body, 0, 0, 0);
  box(0.05, 0.12, 0.06, dark, 0, -0.09, 0.07).rotation.x = -0.25;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.16, 12), dark);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.2); g.add(barrel);
  box(0.075, 0.015, 0.2, glow, 0, 0.047, 0);
  const tip = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 16), glow); tip.position.set(0, 0.01, -0.28); g.add(tip);
  g.userData.muzzle = new V3(0, 0.01, -0.3);
  return g;
}

export function makeHookModel() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xffb02e, metalness: 0.3, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.8, roughness: 0.3 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.24, 12), body); b.rotation.x = Math.PI / 2; g.add(b);
  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 14), dark); spool.rotation.z = Math.PI / 2; spool.position.set(0, 0.06, 0.03); g.add(spool);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.05), dark); grip.position.set(0, -0.08, 0.06); grip.rotation.x = -0.25; g.add(grip);
  for (let k = 0; k < 3; k++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.08, 6), dark);
    const a = k / 3 * Math.PI * 2;
    claw.position.set(Math.cos(a) * 0.035, Math.sin(a) * 0.035, -0.15); claw.rotation.x = -Math.PI / 2; claw.rotation.z = a;
    g.add(claw);
  }
  g.userData.muzzle = new V3(0, 0, -0.17);
  return g;
}

// Ray against a yaw-rotated collider box; returns the distance along the ray or Infinity.
export function rayBox(c, o, d, tMax) {
  const dx = o.x - c.pos.x, dy = o.y - c.pos.y, dz = o.z - c.pos.z;
  // quick reject with the bounding sphere
  const r = Math.hypot(c.bxz, c.half.y), tc = -(dx * d.x + dy * d.y + dz * d.z);
  if (dx * dx + dy * dy + dz * dz - tc * tc > r * r || tc + r < 0 || tc - r > tMax) return Infinity;
  const ox = c.cs * dx - c.sn * dz, oz = c.sn * dx + c.cs * dz;
  const vx = c.cs * d.x - c.sn * d.z, vz = c.sn * d.x + c.cs * d.z;
  let t0 = 0, t1 = tMax;
  for (const [p, v, h] of [[ox, vx, c.half.x], [dy, d.y, c.half.y], [oz, vz, c.half.z]]) {
    if (Math.abs(v) < 1e-9) { if (p < -h || p > h) return Infinity; continue; }
    let a = (-h - p) / v, b = (h - p) / v;
    if (a > b) { const s = a; a = b; b = s; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0;
}

// Distance to the first solid thing along the ray (only visible meshes and gates block).
export function firstHit(world, o, d, tMax) {
  let best = tMax;
  for (const c of world.colliders) {
    if (!c.active || !(c.mesh.isMesh || c.rayBlock) || c.mesh.visible === false) continue;
    const t = rayBox(c, o, d, best);
    if (t < best) best = t;
  }
  return best;
}

// The target / grapple point a shot from o along d would hit, or null.
export function pick(world, tool, o, d, assist = 0.035) {
  const list = tool === 'gun' ? world.targets : world.hooks;
  if (!list || !list.length) return null;
  const range = RANGE[tool];
  let best = null, bestErr = Infinity;
  const oc = new V3();
  for (const it of list) {
    if (it.dead) continue;
    oc.subVectors(it.pos, o);
    const t = oc.dot(d);
    if (t < 0.5 || t > range) continue;
    const perp = Math.sqrt(Math.max(0, oc.lengthSq() - t * t));
    if (perp > it.r + t * assist) continue;
    const err = perp / t;
    if (err < bestErr && firstHit(world, o, d, t - it.r - 0.15) >= t - it.r - 0.15) { best = { it, t }; bestErr = err; }
  }
  return best;
}

export class Tools {
  constructor(scene, camera, sfx) {
    this.scene = scene; this.camera = camera; this.sfx = sfx;
    this.world = null; this.player = null;
    this.models = { gun: makeGunModel(), grapple: makeHookModel() };
    this.holder = new THREE.Group();
    this.holder.add(this.models.gun, this.models.grapple);
    camera.add(this.holder);
    this.deskPose();
    this.reticle = new THREE.Mesh(new THREE.RingGeometry(0.75, 1, 32), new THREE.MeshBasicMaterial({ color: 0x4dff8a, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    this.reticle.renderOrder = 998; this.reticle.visible = false;
    scene.add(this.reticle);
    this.tracers = [];
    this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd84d, emissive: 0x806010, roughness: 0.6 }));
    this.rope.visible = false; scene.add(this.rope);
    this.aim = null; this.recoil = 0;
    this._m = new V3(); this._d = new V3(); this._q = new THREE.Quaternion();
  }

  deskPose() { this.holder.position.set(0.24, -0.22, -0.42); this.holder.rotation.set(0, 0, 0); }

  attach(world, player) { this.world = world; this.player = player; this.rope.visible = false; this.reticle.visible = false; for (const t of this.tracers) this.scene.remove(t.m); this.tracers = []; }

  // VR: hold the gadget in the given controller (its pointing ray space); desktop: in front of the camera
  setParent(obj) {
    const p = obj || this.camera;
    if (this.holder.parent !== p) { p.add(this.holder); if (obj) { this.holder.position.set(0, -0.02, 0.06); this.holder.rotation.set(0, 0, 0); } else this.deskPose(); }
  }

  muzzle(out) {
    const m = this.models[this.player.tool] || this.models.gun;
    return m.localToWorld(out.copy(m.userData.muzzle));
  }

  tracer(a, b, color) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new V3(0, 1, 0), this._d.subVectors(b, a).normalize());
    this.scene.add(m); this.tracers.push({ m, life: 0.18 });
  }

  // o, d: aim ray in world space (d normalised). fire: trigger pressed this frame. vr: wider aim assist.
  update(dtReal, { o, d, fire, vr }) {
    const P = this.player, W = this.world;
    const tool = P.tool;
    this.holder.visible = !!tool;
    this.models.gun.visible = tool === 'gun'; this.models.grapple.visible = tool === 'grapple';
    this.recoil = Math.max(0, this.recoil - dtReal * 6);
    this.models.gun.position.z = this.models.grapple.position.z = this.recoil * 0.06;
    this.models.gun.rotation.x = this.models.grapple.rotation.x = this.recoil * 0.3;

    this.aim = tool ? pick(W, tool, o, d, vr ? 0.06 : 0.035) : null;
    if (tool === 'grapple' && P.grapple) this.aim = null;
    if (this.aim) {
      const r = this.aim.it.r * 1.25;
      this.reticle.visible = true; this.reticle.position.copy(this.aim.it.pos);
      this.reticle.quaternion.copy(this.camera.getWorldQuaternion(this._q));
      this.reticle.scale.setScalar(r * (1 + 0.1 * Math.sin(performance.now() / 90)));
      this.reticle.material.color.set(tool === 'gun' ? 0xff4d6a : 0x4dff8a);
    } else this.reticle.visible = false;

    if (fire && tool) {
      const m = this.muzzle(this._m);
      this.recoil = 1;
      if (tool === 'gun') {
        this.sfx.shoot();
        let end;
        if (this.aim) { end = this.aim.it.pos.clone(); this.aim.it.hit(); }
        else end = o.clone().addScaledVector(d, firstHit(W, o, d, RANGE.gun));
        this.tracer(m, end, 0x4dffd2);
      } else if (P.grapple) {
        P.grapple = null; this.sfx.click();
      } else if (this.aim) {
        const h = this.aim.it;
        P.startGrapple(h.pos, h.launch);
        this.sfx.hookFire(); this.sfx.hookLatch();
      } else {
        this.sfx.hookFire();
        this.tracer(m, o.clone().addScaledVector(d, Math.min(8, firstHit(W, o, d, 8))), 0xffd84d);
      }
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dtReal; t.m.material.opacity = Math.max(0, t.life / 0.18) * 0.9;
      if (t.life <= 0) { this.scene.remove(t.m); t.m.geometry.dispose(); t.m.material.dispose(); this.tracers.splice(i, 1); }
    }

    if (P.grapple) {
      const a = this.muzzle(this._m), b = P.grapple.a;
      const len = a.distanceTo(b);
      this.rope.visible = true;
      this.rope.position.copy(a).add(b).multiplyScalar(0.5);
      this.rope.scale.set(1, len, 1);
      this.rope.quaternion.setFromUnitVectors(new V3(0, 1, 0), this._d.subVectors(b, a).normalize());
    } else this.rope.visible = false;
  }
}
