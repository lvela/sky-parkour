// THE SKY KING — a giant armoured golem on the castle keep. You can't hit him directly:
// parkour up each of his three towers (climb, trampolines, moving wall jumps) and smash the
// crystal on top. Meanwhile he slams shockwaves, hurls boulders and (later) spins a flail arm.
import * as THREE from 'three';
import { boxGeo } from './textures.js';
import { Collider } from './world.js';

const V3 = THREE.Vector3;

export class Boss {
  constructor(b, { cx, cz, y0 }) {
    this.b = b; this.world = b.world; this.sfx = b.sfx;
    this.c = new V3(cx, y0, cz); this.y0 = y0;
    this.hp = 3; this.maxHp = 3;
    this.state = 'dormant'; // dormant | fight | dying | dead
    this.anim = { slam: 0, throw: 0, flash: 0, roar: 0 };
    this.tShock = 3; this.tBoulder = 2; this.tAction = 0;
    this.waves = []; this.boulders = []; this.debris = [];
    this.time = 0;
    this.buildArenaPieces();
    this.buildBody();
    this.setActiveTower(0);
  }

  get phase() { return this.maxHp - this.hp; } // 0, 1, 2

  // ---------------- construction ----------------
  buildArenaPieces() {
    const b = this.b, { x: cx, z: cz } = this.c, y0 = this.y0;
    // pedestal
    b.plat({ x: cx, y: y0 + 1, z: cz, w: 8, d: 8, h: 1, style: 'brick' });
    const towers = this.towers = [];
    const crystalGeo = new THREE.OctahedronGeometry(0.9, 0); crystalGeo.scale(1, 1.6, 1);
    const mkCrystal = (x, y, z, name, hint) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x7af7ff, emissive: 0x28c8ff, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.2, toneMapped: false });
      const m = new THREE.Mesh(crystalGeo, mat);
      m.position.set(x, y + 1.6, z); m.castShadow = true;
      b.add(m);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x7af7ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 120, 12, 1, true), beamMat);
      beam.position.set(x, y + 60, z);
      b.add(beam);
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.6, 10), b.M.gold);
      ped.position.set(x, y + 0.3, z); b.add(ped);
      towers.push({ name, hint, pos: new V3(x, y, z), crystal: m, mat, beam, beamMat, done: false });
    };

    // A — WEST: rock-climbing tower
    b.plat({ x: cx - 15, y: y0 + 12, z: cz, w: 6, d: 6, h: 12, style: 'climb' });
    b.holds(new V3(cx - 12, y0, cz), new V3(1, 0, 0), y0, y0 + 12, 0.6, 0.3);
    mkCrystal(cx - 15, y0 + 12, cz, 'WEST TOWER', 'Climb the west tower and smash the crystal!');

    // B — NORTH: moving trampoline → wall trampoline → tower top
    b.plat({ x: cx, y: y0 + 12, z: cz - 15, w: 6, d: 6, h: 12, style: 'brick' });
    b.plat({ x: cx, y: y0 + 0.6, z: cz - 6.5, w: 3.5, d: 3.5, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17,
      motion: (t) => { const o = b.zero(); o.x = Math.sin(t * 0.9) * 4; return o; } });
    b.plat({ x: cx, y: y0 + 5.5, z: cz - 10.8, w: 5, d: 2.4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 19 });
    mkCrystal(cx, y0 + 12, cz - 15, 'NORTH TOWER', 'Bounce up the north tower and smash the crystal!');

    // C — EAST: moving wall-jump shaft in front of the tower
    b.plat({ x: cx + 16.5, y: y0 + 12, z: cz, w: 5, d: 6, h: 12, style: 'brick' });
    for (const s of [-1, 1]) {
      b.plat({ x: cx + 12, y: y0 + 14, z: cz + s * 2.2, w: 0.6, d: 4, h: 14, style: 'wall', type: 'wall', yaw: Math.PI / 2,
        motion: (t) => { const o = b.zero(); o.z = s * (0.35 + 0.35 * Math.sin(t * 1.4)); return o; } });
    }
    mkCrystal(cx + 16.5, y0 + 12, cz, 'EAST TOWER', 'Wall jump up the moving shaft on the east tower!');
  }

  buildBody() {
    const b = this.b, { x: cx, z: cz } = this.c;
    this.flailAngle = 0;
    const root = this.root = new THREE.Group();
    root.position.set(cx, this.y0 + 1, cz);
    b.add(root);
    const armor = this.armorMat = new THREE.MeshStandardMaterial({ color: 0xa8aec2, metalness: 0.7, roughness: 0.3, emissive: 0x000000 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a3a5e, metalness: 0.5, roughness: 0.5 });
    const gold = b.M.gold;
    const eyeMat = this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3020, toneMapped: false });
    const cape = new THREE.MeshStandardMaterial({ color: 0x8a1020, roughness: 0.8, side: THREE.DoubleSide });
    const parts = this.parts = [];
    const add = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); parts.push(m); return m; };
    for (const s of [-1, 1]) {
      add(root, boxGeo(1.6, 4.2, 1.8, 2), dark, s * 1.3, 2.1, 0);
      add(root, boxGeo(1.9, 0.9, 2.4, 2), armor, s * 1.3, 0.45, 0.25);
    }
    add(root, boxGeo(5.2, 1.2, 3.2, 2), gold, 0, 4.6, 0);
    add(root, boxGeo(5.6, 4.6, 3.4, 2), armor, 0, 7.4, 0);
    add(root, boxGeo(2.2, 2.2, 0.3, 2), gold, 0, 7.6, 1.75); // chest emblem
    const capeM = add(root, new THREE.PlaneGeometry(5, 8, 6, 8), cape, 0, 5.4, -1.8);
    this.cape = capeM; this.capeBase = capeM.geometry.attributes.position.array.slice();
    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(s * 3.6, 9, 0); root.add(sh);
      add(sh, new THREE.SphereGeometry(1.5, 16, 12), armor, 0, 0, 0);
      add(sh, boxGeo(1.3, 4.4, 1.3, 2), dark, 0, -2.6, 0);
      add(sh, boxGeo(2.1, 2.1, 2.1, 2), armor, 0, -5.4, 0.2);
      for (let k = -1; k <= 1; k++) add(sh, new THREE.ConeGeometry(0.25, 0.7, 6), gold, k * 0.6, -5.4, 1.35).rotation.x = Math.PI / 2;
      this.arms.push(sh);
    }
    const head = this.head = new THREE.Group(); head.position.set(0, 10.9, 0); root.add(head);
    add(head, boxGeo(2.6, 2.6, 2.6, 2), armor, 0, 0, 0);
    add(head, boxGeo(2.65, 0.35, 0.5, 2), dark, 0, 0.1, 1.15);
    for (const s of [-1, 1]) add(head, boxGeo(0.55, 0.22, 0.2, 2), eyeMat, s * 0.6, 0.1, 1.4);
    add(head, new THREE.CylinderGeometry(1.45, 1.35, 0.8, 16, 1, true), gold, 0, 1.6, 0);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      add(head, new THREE.ConeGeometry(0.28, 0.9, 6), gold, Math.cos(a) * 1.35, 2.35, Math.sin(a) * 1.35);
    }
    const gem = add(head, new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0xff2a6a, toneMapped: false }), 0, 1.7, 1.45);
    gem.scale.set(1, 1.3, 0.6);
    // body collider so you can't run through him
    const holder = new THREE.Object3D(); holder.position.set(cx, this.y0 + 1 + 6, cz);
    this.bodyCol = new Collider(holder, 2.9, 6, 1.9);
    this.world.colliders.push(this.bodyCol);

    // spinning flail (phase 2+): two arms, enabled per phase
    this.flails = [];
    for (let k = 0; k < 2; k++) {
      const vis = new THREE.Group();
      const chain = new THREE.Mesh(boxGeo(8, 0.35, 0.35, 2), b.M.iron);
      chain.position.x = 8.5; vis.add(chain);
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), b.M.danger); ball.position.x = 12.3; vis.add(ball);
      for (let j = 0; j < 8; j++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 6), b.M.iron);
        const dir = new V3().randomDirection(); spike.position.copy(dir).multiplyScalar(1.05).add(new V3(12.3, 0, 0));
        spike.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); vis.add(spike);
      }
      vis.position.set(cx, this.y0 + 0.75, cz); vis.visible = false;
      b.add(vis);
      const holder2 = new THREE.Object3D(); holder2.position.set(cx, this.y0 + 0.7, cz);
      const offset = k * Math.PI;
      const col = new Collider(holder2, 4.2, 0.55, 0.6, {
        type: 'knock', knockPower: 12, syncMesh: false,
        motion: (t) => {
          const o = b.zero();
          const a = this.flailAngle + offset;
          o.yaw = a; o.x = Math.cos(a) * 8.6; o.z = -Math.sin(a) * 8.6;
          vis.rotation.y = a;
          return o;
        },
      });
      col.active = false;
      this.world.colliders.push(col);
      this.flails.push({ vis, col });
    }
  }

  setActiveTower(i) {
    this.towers.forEach((tw, k) => {
      const on = k === i && !tw.done;
      tw.mat.emissiveIntensity = on ? 2.2 : 0.3;
      tw.beamMat.opacity = on ? 0.18 : 0;
    });
    this.active = i;
  }

  get hint() {
    if (this.state === 'dormant') return 'Step into the arena to face the Sky King';
    const tw = this.towers[this.active];
    return tw ? tw.hint : '';
  }

  // called when the player respawns: calm down and wait for them to re-enter
  reset() {
    for (const w of this.waves) this.b.g.remove(w.mesh);
    for (const bo of this.boulders) { this.b.g.remove(bo.mesh); this.b.g.remove(bo.marker); }
    this.waves = []; this.boulders = [];
    if (this.state === 'fight') this.state = 'dormant';
    this.anim.slam = this.anim.throw = 0;
    for (const f of this.flails) { f.col.active = false; f.vis.visible = false; }
  }

  wake() {
    this.state = 'fight'; this.tShock = 2.5; this.tBoulder = 4;
    this.anim.roar = 1.2; this.sfx.roar();
    this.world.events.push({ type: 'bossWake' });
    this.updateFlails();
  }

  updateFlails() {
    const n = this.phase >= 2 ? 2 : this.phase >= 1 ? 1 : 0;
    this.flails.forEach((f, k) => { const on = this.state === 'fight' && k < n; f.col.active = on; f.vis.visible = on; });
  }

  // ---------------- runtime ----------------
  update(t, dt) {
    this.time += dt;
    const P = this.world.player;
    const y0 = this.y0, c = this.c;
    this.towers.forEach((tw) => { tw.crystal.rotation.y += dt * 1.5; tw.crystal.position.y = tw.pos.y + 1.6 + Math.sin(t * 2) * 0.2; });
    const cp = this.cape.geometry.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const by = this.capeBase[i * 3 + 1], bx = this.capeBase[i * 3];
      cp.setZ(i, Math.sin(t * 2.5 + bx * 0.8 + by * 0.6) * 0.25 * (4 - by) / 8);
    }
    cp.needsUpdate = true;

    if (this.state === 'dead') { this.updateDebris(dt); return; }
    if (this.state === 'dying') { this.updateDying(dt); return; }
    if (!P) return;

    const inArena = Math.abs(P.pos.x - c.x) < 20 && Math.abs(P.pos.z - c.z) < 20 && P.pos.y > y0 - 0.5;
    if (this.state === 'dormant' && inArena) this.wake();

    // face the player
    const dx = P.pos.x - c.x, dz = P.pos.z - c.z;
    const want = Math.atan2(dx, dz);
    let diff = want - this.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.root.rotation.y += diff * Math.min(1, dt * 2.5);
    this.head.rotation.x = -Math.atan2(P.pos.y - (y0 + 12), Math.hypot(dx, dz)) * 0.5;
    this.root.position.y = y0 + 1 + Math.sin(t * 1.6) * 0.08;

    // tower crystals
    const tw = this.towers[this.active];
    if (this.state === 'fight' && tw) {
      const hx = P.pos.x - tw.pos.x, hz = P.pos.z - tw.pos.z, hy = P.pos.y - tw.pos.y;
      if (hx * hx + hz * hz < 2.0 * 2.0 && hy > -0.3 && hy < 2.5) this.hitCrystal(tw);
    }

    if (this.state === 'fight') {
      const speed = [1, 1.35, 1.7][this.phase] || 1.7;
      this.flailAngle += dt * (0.55 + this.phase * 0.3);
      const onFloor = P.pos.y < y0 + 2.5 && inArena;
      this.tShock -= dt * speed;
      if (this.tShock <= 0 && this.anim.slam <= 0) { this.anim.slam = 1.0; this.tShock = 6.5; }
      this.tBoulder -= dt * speed;
      if (this.tBoulder <= 0 && onFloor && this.anim.throw <= 0) { this.anim.throw = 0.9; this.tBoulder = 4.5; }
    }

    this.animate(dt);
    this.updateWaves(dt, P);
    this.updateBoulders(dt, P);
  }

  animate(dt) {
    const a = this.anim;
    let la = 0, ra = 0;
    if (a.slam > 0) {
      const prev = a.slam; a.slam -= dt;
      const k = 1 - a.slam; // 0 → 1
      const up = k < 0.6 ? -2.7 * (k / 0.6) : -2.7 + 2.7 * Math.min(1, (k - 0.6) / 0.12);
      la = ra = up;
      if (prev > 0.28 && a.slam <= 0.28) this.spawnWave();
    }
    if (a.throw > 0) {
      const prev = a.throw; a.throw -= dt;
      const k = 1 - a.throw / 0.9;
      ra = k < 0.6 ? -3.0 * (k / 0.6) : -3.0 + 4.0 * Math.min(1, (k - 0.6) / 0.15);
      if (prev > 0.35 && a.throw <= 0.35) this.spawnBoulder();
    }
    if (a.roar > 0) { a.roar -= dt; la = Math.min(la, -1.2); ra = Math.min(ra, -1.2); this.head.rotation.x = -0.5; }
    this.arms[0].rotation.x += (la - this.arms[0].rotation.x) * Math.min(1, dt * 14);
    this.arms[1].rotation.x += (ra - this.arms[1].rotation.x) * Math.min(1, dt * 14);
    if (a.flash > 0) {
      a.flash -= dt;
      const on = Math.floor(a.flash * 16) % 2 === 0;
      this.armorMat.emissive.setRGB(on ? 1 : 0, on ? 0.9 : 0, on ? 0.9 : 0);
    } else this.armorMat.emissive.setRGB(0, 0, 0);
    this.eyeMat.color.setRGB(1, 0.15 + 0.1 * Math.sin(this.time * 8), 0.1);
  }

  spawnWave() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.9, 64, 1, true), mat);
    mesh.position.set(this.c.x, this.y0 + 0.45, this.c.z);
    this.b.g.add(mesh);
    this.waves.push({ r: 4.2, mesh, hit: false });
    this.sfx.slam();
    this.world.events.push({ type: 'shake', amount: 0.6 });
  }

  updateWaves(dt, P) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r += dt * (9 + this.phase * 2);
      w.mesh.scale.set(w.r, 1, w.r);
      w.mesh.material.opacity = 0.85 * (1 - w.r / 22);
      if (!w.hit && P) {
        const dx = P.pos.x - this.c.x, dz = P.pos.z - this.c.z, d = Math.hypot(dx, dz);
        if (Math.abs(d - w.r) < 0.7 && P.pos.y < this.y0 + 0.75 && P.pos.y > this.y0 - 0.5) {
          w.hit = true;
          if (P.knock(dx, dz, 10, 8, 'boss')) this.sfx.hurt();
        }
      }
      if (w.r > 21) { this.b.g.remove(w.mesh); w.mesh.geometry.dispose(); w.mesh.material.dispose(); this.waves.splice(i, 1); }
    }
  }

  spawnBoulder() {
    const P = this.world.player; if (!P) return;
    const from = new V3();
    this.arms[1].children[2].getWorldPosition(from);
    const to = P.pos.clone().addScaledVector(new V3(P.vel.x, 0, P.vel.z), 0.6);
    to.y = this.y0;
    const lim = 19; to.x = Math.max(this.c.x - lim, Math.min(this.c.x + lim, to.x)); to.z = Math.max(this.c.z - lim, Math.min(this.c.z + lim, to.z));
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 1, flatShading: true, emissive: 0x401000 }));
    mesh.castShadow = true;
    const marker = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 32), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    marker.rotation.x = -Math.PI / 2; marker.position.set(to.x, this.y0 + 0.05, to.z);
    this.b.g.add(mesh, marker);
    this.boulders.push({ from, to, t: 0, dur: 1.4, mesh, marker });
    this.sfx.throwRock();
  }

  updateBoulders(dt, P) {
    for (let i = this.boulders.length - 1; i >= 0; i--) {
      const bo = this.boulders[i];
      bo.t += dt;
      const k = Math.min(1, bo.t / bo.dur);
      bo.mesh.position.lerpVectors(bo.from, bo.to, k);
      bo.mesh.position.y += Math.sin(k * Math.PI) * 9;
      bo.mesh.rotation.x += dt * 5; bo.mesh.rotation.z += dt * 3;
      bo.marker.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(bo.t * 12));
      const s = 0.6 + k * 0.6; bo.marker.scale.set(s, s, s);
      if (k >= 1) {
        if (P) {
          const dx = P.pos.x - bo.to.x, dz = P.pos.z - bo.to.z;
          if (dx * dx + dz * dz < 2.4 * 2.4 && Math.abs(P.pos.y - bo.to.y) < 2.2) {
            if (P.knock(dx || 1, dz, 11, 8, 'boss')) this.sfx.hurt();
          }
        }
        this.sfx.boulder();
        this.world.events.push({ type: 'shake', amount: 0.35 });
        this.burst(bo.to, 0x8a7560, 14);
        this.b.g.remove(bo.mesh, bo.marker);
        bo.mesh.geometry.dispose(); bo.marker.geometry.dispose();
        this.boulders.splice(i, 1);
      }
    }
    this.updateDebris(dt);
  }

  burst(at, color, n) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
    const geo = new THREE.IcosahedronGeometry(0.3, 0);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(at).add(new V3(0, 0.5, 0));
      this.b.g.add(m);
      this.debris.push({ m, v: new V3((Math.random() - 0.5) * 10, 4 + Math.random() * 8, (Math.random() - 0.5) * 10), life: 1.6, spin: Math.random() * 8 });
    }
  }

  updateDebris(dt) {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.v.y -= 22 * dt; d.m.position.addScaledVector(d.v, dt);
      d.m.rotation.x += d.spin * dt; d.m.rotation.y += d.spin * dt;
      d.life -= dt;
      if (d.life <= 0) { if (d.m.parent) d.m.parent.remove(d.m); this.debris.splice(i, 1); }
    }
  }

  hitCrystal(tw) {
    tw.done = true;
    tw.crystal.visible = false; tw.beamMat.opacity = 0;
    this.burst(tw.crystal.position.clone().setY(tw.pos.y + 1), 0x7af7ff, 24);
    this.hp--;
    this.anim.flash = 1.2; this.anim.roar = 1.0;
    this.sfx.bossHit();
    this.world.events.push({ type: 'bossHit', hp: this.hp, max: this.maxHp });
    for (const bo of this.boulders) { this.b.g.remove(bo.mesh, bo.marker); }
    this.boulders = [];
    if (this.hp <= 0) {
      this.state = 'dying'; this.dyingT = 0;
      for (const f of this.flails) { f.col.active = false; f.vis.visible = false; }
      for (const w of this.waves) this.b.g.remove(w.mesh);
      this.waves = [];
      return;
    }
    this.setActiveTower(this.active + 1);
    this.tShock = 3; this.tBoulder = 3;
    this.updateFlails();
  }

  updateDying(dt) {
    this.dyingT += dt;
    this.root.position.x = this.c.x + (Math.random() - 0.5) * 0.4;
    this.root.position.z = this.c.z + (Math.random() - 0.5) * 0.4;
    this.anim.flash = Math.max(this.anim.flash, 0.2);
    this.animate(dt);
    if (Math.random() < dt * 6) { this.sfx.boulder(); this.burst(this.root.position.clone().add(new V3((Math.random() - 0.5) * 6, 3 + Math.random() * 9, (Math.random() - 0.5) * 4)), 0xffa040, 6); }
    this.updateDebris(dt);
    if (this.dyingT > 2.6) {
      // fall apart
      this.state = 'dead';
      this.sfx.explode();
      this.world.events.push({ type: 'shake', amount: 1.2 });
      this.bodyCol.active = false;
      this.root.updateMatrixWorld(true);
      const pos = new V3(), q = new THREE.Quaternion(), s = new V3();
      for (const m of this.parts) {
        m.matrixWorld.decompose(pos, q, s);
        this.b.g.add(m);
        m.position.copy(pos); m.quaternion.copy(q); m.scale.copy(s);
        const out = pos.clone().sub(this.c); out.y = 0; out.normalize();
        this.debris.push({ m, v: new V3(out.x * (4 + Math.random() * 8), 6 + Math.random() * 12, out.z * (4 + Math.random() * 8)), life: 6, spin: Math.random() * 4 });
      }
      this.root.visible = false;
      this.world.events.push({ type: 'bossDefeated' });
    }
  }
}
