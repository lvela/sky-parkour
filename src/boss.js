// Parkour bosses — giant armoured golems on a 40 × 40 m arena. You can't hit them directly:
// smash the crystals on their towers with parkour, and finally the gem in their crown, reached via
// platforms orbiting them. They fight back harder after every crystal: shockwaves, boulder volleys,
// spinning flails, lightning strikes and arm swats. Knock-outs let them regain a crystal.
// The Sky King (power 1) uses the default towers below. Later bosses pass their own towers, colours
// and a higher power, which speeds everything up and unlocks extra attacks:
//   power 2+: homing wisps · power 3+: meteor showers · power 4+: a vortex inhale that drags you in.
// Wisps only hunt you on the arena floor, so climbing a tower is never interrupted by one.
import * as THREE from 'three';
import { boxGeo } from './textures.js';
import { Collider } from './world.js';

const V3 = THREE.Vector3;

const DEFAULT_COLORS = { armor: 0xa8aec2, dark: 0x4a3a5e, cape: 0x8a1020, eye: 0xff3020, gem: 0xff2a6a, crystal: 0x7af7ff, wisp: 0xb48cff };

// Each tower builder makes its parkour challenge and returns where its crystal sits.
// ctx = { b, cx, cz, y0 }
export const SKY_KING_TOWERS = [
  // A — WEST: rock-climbing tower
  ({ b, cx, cz, y0 }) => {
    b.plat({ x: cx - 15, y: y0 + 12, z: cz, w: 6, d: 6, h: 12, style: 'climb' });
    b.holds(new V3(cx - 12, y0, cz), new V3(1, 0, 0), y0, y0 + 12, 0.6, 0.3);
    return { x: cx - 15, y: y0 + 12, z: cz, name: 'WEST TOWER', hint: 'Climb the west tower and smash the crystal!' };
  },
  // B — NORTH: moving trampoline → wall trampoline → tower top
  ({ b, cx, cz, y0 }) => {
    b.plat({ x: cx, y: y0 + 12, z: cz - 15, w: 6, d: 6, h: 12, style: 'brick' });
    b.plat({ x: cx, y: y0 + 0.6, z: cz - 6.5, w: 3.5, d: 3.5, h: 0.6, style: 'tramp', type: 'tramp', bounce: 17,
      motion: (t) => { const o = b.zero(); o.x = Math.sin(t * 0.9) * 4; return o; } });
    b.plat({ x: cx, y: y0 + 5.5, z: cz - 10.8, w: 5, d: 2.4, h: 0.6, style: 'tramp', type: 'tramp', bounce: 19 });
    return { x: cx, y: y0 + 12, z: cz - 15, name: 'NORTH TOWER', hint: 'Bounce up the north tower and smash the crystal!' };
  },
  // C — EAST: moving wall-jump shaft in front of the tower
  ({ b, cx, cz, y0 }) => {
    b.plat({ x: cx + 16.5, y: y0 + 12, z: cz, w: 5, d: 6, h: 12, style: 'brick' });
    for (const s of [-1, 1]) {
      b.plat({ x: cx + 12, y: y0 + 14, z: cz + s * 2.2, w: 0.6, d: 4, h: 14, style: 'wall', type: 'wall', yaw: Math.PI / 2,
        motion: (t) => { const o = b.zero(); o.z = s * (0.35 + 0.35 * Math.sin(t * 1.4)); return o; } });
    }
    return { x: cx + 16.5, y: y0 + 12, z: cz, name: 'EAST TOWER', hint: 'Wall jump up the moving shaft on the east tower!' };
  },
  // D — SOUTH-EAST: a spiral of crumbling steps up to a floating crystal
  ({ b, cx, cz, y0 }) => {
    const sx = cx + 13, sz = cz + 12;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.75 - i * (Math.PI / 4);
      b.plat({ x: sx + Math.cos(a) * 4, y: y0 + 1.4 * (i + 1), z: sz + Math.sin(a) * 4, w: 2.4, d: 2.4, h: 0.5, style: 'brick', type: 'crumble' });
    }
    const a = Math.PI * 0.75 - 7 * (Math.PI / 4);
    const px = sx + Math.cos(a) * 4, pz = sz + Math.sin(a) * 4;
    b.plat({ x: px, y: y0 + 11.2, z: pz, w: 3, d: 3, h: 0.6, style: 'brick' });
    return { x: px, y: y0 + 11.2, z: pz, name: 'CRUMBLING SPIRAL', hint: 'Race up the crumbling spiral steps to the floating crystal!' };
  },
];

export class Boss {
  // opts: { cx, cz, y0, name, power (1–4), colors, towers, decorate(b, boss) }
  constructor(b, opts) {
    const { cx, cz, y0 } = opts;
    this.b = b; this.world = b.world; this.sfx = b.sfx;
    this.c = new V3(cx, y0, cz); this.y0 = y0;
    this.name = opts.name || 'THE SKY KING';
    this.power = opts.power || 1;
    this.colors = { ...DEFAULT_COLORS, ...opts.colors };
    const towerDefs = opts.towers || SKY_KING_TOWERS;
    this.hp = this.maxHp = towerDefs.length + 1;
    this.state = 'dormant'; // dormant | fight | dying | dead
    this.anim = { slam: 0, throw: 0, flash: 0, roar: 0, swat: 0, pull: 0 };
    this.tShock = 3; this.tBoulder = 2; this.tLightning = 4; this.tSwat = 2; this.waveQueue = 0;
    this.tWisp = 5; this.tMeteor = 6; this.tPull = 9;
    this.waves = []; this.boulders = []; this.debris = []; this.strikes = []; this.wisps = [];
    this.time = 0;
    this.buildArenaPieces(towerDefs);
    this.buildBody();
    if (opts.decorate) opts.decorate(b, this);
    // tower E: the gem in his crown
    this.towers.push({ name: 'CROWN', hint: 'Ride the orbiting platforms, bounce onto his head and smash the crown gem!',
      pos: new V3(cx, y0 + 12.4, cz), crystal: this.gem, mat: this.gemMat, beam: this.gemBeam, beamMat: this.gemBeam.material, done: false, attached: true, radius: 2.8 });
    this.setActiveTower(0);
  }

  get phase() { return this.maxHp - this.hp; } // crystals smashed so far
  get frac() { return this.phase / Math.max(1, this.maxHp - 1); } // 0 → 1 over the fight
  get speed() { return (1 + 0.8 * this.frac) * (1 + 0.1 * (this.power - 1)); }

  // ---------------- construction ----------------
  buildArenaPieces(towerDefs) {
    const b = this.b, { x: cx, z: cz } = this.c, y0 = this.y0;
    // pedestal
    b.plat({ x: cx, y: y0 + 1, z: cz, w: 8, d: 8, h: 1, style: 'brick' });
    const towers = this.towers = [];
    const crystalGeo = new THREE.OctahedronGeometry(0.9, 0); crystalGeo.scale(1, 1.6, 1);
    const cc = this.colors.crystal;
    const mkCrystal = (x, y, z, name, hint) => {
      const mat = new THREE.MeshStandardMaterial({ color: cc, emissive: cc, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.2, toneMapped: false });
      const m = new THREE.Mesh(crystalGeo, mat);
      m.position.set(x, y + 1.6, z); m.castShadow = true;
      b.add(m);
      const beamMat = new THREE.MeshBasicMaterial({ color: cc, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 120, 12, 1, true), beamMat);
      beam.position.set(x, y + 60, z);
      b.add(beam);
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.6, 10), b.M.gold);
      ped.position.set(x, y + 0.3, z); b.add(ped);
      towers.push({ name, hint, pos: new V3(x, y, z), crystal: m, mat, beam, beamMat, done: false, radius: 2.0 });
    };
    for (const def of towerDefs) {
      const tw = def({ b, cx, cz, y0 });
      mkCrystal(tw.x, tw.y, tw.z, tw.name, tw.hint);
    }

    // last — orbiting platforms that spiral around the boss (appear for the crown gem)
    this.orbit = [];
    const R = 8, w = 0.35 + 0.07 * (this.power - 1);
    [1.3, 2.8, 4.3, 5.8].forEach((h, i) => {
      const tramp = i === 3;
      const col = b.plat({ x: cx, y: y0 + h, z: cz, w: 3, d: 3, h: tramp ? 0.6 : 0.4, style: tramp ? 'tramp' : 'metal', type: tramp ? 'tramp' : 'solid', bounce: 19,
        motion: (t) => { const o = b.zero(); const a = t * w + i * (Math.PI / 6); o.x = Math.cos(a) * R; o.z = -Math.sin(a) * R; o.yaw = a; return o; } });
      col.active = false; col.mesh.visible = false;
      this.orbit.push(col);
    });
  }

  buildBody() {
    const b = this.b, { x: cx, z: cz } = this.c;
    this.flailAngle = 0;
    const root = this.root = new THREE.Group();
    root.position.set(cx, this.y0 + 1, cz);
    b.add(root);
    const C = this.colors;
    const armor = this.armorMat = new THREE.MeshStandardMaterial({ color: C.armor, metalness: 0.7, roughness: 0.3, emissive: 0x000000 });
    this.fistMat = new THREE.MeshStandardMaterial({ color: C.armor, metalness: 0.7, roughness: 0.3, emissive: 0x000000 });
    const dark = new THREE.MeshStandardMaterial({ color: C.dark, metalness: 0.5, roughness: 0.5 });
    const gold = C.trim ? new THREE.MeshStandardMaterial({ color: C.trim, metalness: 1, roughness: 0.25 }) : b.M.gold;
    const eyeMat = this.eyeMat = new THREE.MeshBasicMaterial({ color: C.eye, toneMapped: false });
    this.eyeCol = new THREE.Color(C.eye);
    const cape = new THREE.MeshStandardMaterial({ color: C.cape, roughness: 0.8, side: THREE.DoubleSide });
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
      add(sh, boxGeo(2.1, 2.1, 2.1, 2), s > 0 ? (this.fistMat || armor) : armor, 0, -5.4, 0.2);
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
    this.gemMat = new THREE.MeshStandardMaterial({ color: C.gem, emissive: C.gem, emissiveIntensity: 0.4, toneMapped: false });
    const gem = this.gem = add(head, new THREE.OctahedronGeometry(0.55, 0), this.gemMat, 0, 2.3, 0);
    gem.scale.set(1, 1.5, 1);
    this.gemBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 120, 12, 1, true), new THREE.MeshBasicMaterial({ color: C.gem, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.gemBeam.position.set(cx, this.y0 + 74, cz);
    b.add(this.gemBeam);

    // body collider so you can't run through him
    const holder = new THREE.Object3D(); holder.position.set(cx, this.y0 + 1 + 6, cz);
    this.bodyCol = new Collider(holder, 2.9, 6, 1.9);
    this.world.colliders.push(this.bodyCol);

    // spinning flails: up to three arms, enabled per phase and spaced evenly
    this.flails = []; this.flailCount = 0;
    for (let k = 0; k < 3; k++) {
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
      const col = new Collider(holder2, 4.2, 0.55, 0.6, {
        type: 'knock', knockPower: 12, syncMesh: false,
        motion: (t) => {
          const o = b.zero();
          const a = this.flailAngle + k * Math.PI * 2 / Math.max(1, this.flailCount);
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
    const orbitOn = i === 4;
    if (this.orbit) for (const c of this.orbit) { c.active = orbitOn; c.mesh.visible = orbitOn; }
  }

  get hint() {
    if (this.state === 'dormant') return `Step into the arena to face ${this.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`;
    const tw = this.towers[this.active];
    if (!tw) return '';
    if (this.anim.pull > 0) return 'He\'s inhaling — run AWAY from him!';
    return tw.hint + (this.frac >= 0.5 ? '  ·  Jump when his fist glows red!' : '');
  }

  // called when the player respawns: calm down and wait for them to re-enter
  reset(knockedOut = false) {
    for (const w of this.waves) this.b.g.remove(w.mesh);
    for (const bo of this.boulders) { this.b.g.remove(bo.mesh); this.b.g.remove(bo.marker); }
    for (const st of this.strikes) this.b.g.remove(st.marker, st.bolt);
    this.clearWisps();
    this.waves = []; this.boulders = []; this.strikes = []; this.waveQueue = 0;
    const wasFighting = this.state === 'fight';
    if (wasFighting) this.state = 'dormant';
    this.anim.slam = this.anim.throw = this.anim.swat = this.anim.pull = 0;
    for (const f of this.flails) { f.col.active = false; f.vis.visible = false; }
    // a knock-out lets the King regain his last crystal
    if (knockedOut && wasFighting && this.hp < this.maxHp && this.active > 0) {
      const k = this.active - 1, tw = this.towers[k];
      tw.done = false; tw.crystal.visible = true;
      this.hp++;
      this.setActiveTower(k);
      this.sfx.heal();
      this.world.events.push({ type: 'bossHeal', hp: this.hp, max: this.maxHp });
    }
  }

  wake() {
    this.state = 'fight'; this.woken = true; this.tShock = 2.5; this.tBoulder = 4; this.tWisp = 4; this.tMeteor = 6; this.tPull = 8;
    this.anim.roar = 1.2; this.sfx.roar();
    this.world.events.push({ type: 'bossWake' });
    this.updateFlails();
  }

  updateFlails() {
    const n = this.flailCount = Math.min(3, Math.floor(this.frac * 2 + 0.5 + (this.power - 1) * 0.5));
    this.flails.forEach((f, k) => { const on = this.state === 'fight' && k < n; f.col.active = on; f.vis.visible = on; });
  }

  // ---------------- runtime ----------------
  update(t, dt) {
    this.time += dt;
    const P = this.world.player;
    const y0 = this.y0, c = this.c;
    this.towers.forEach((tw) => { if (tw.attached) return; tw.crystal.rotation.y += dt * 1.5; tw.crystal.position.y = tw.pos.y + 1.6 + Math.sin(t * 2) * 0.2; });
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
      if (hx * hx + hz * hz < tw.radius * tw.radius && hy > -0.3 && hy < 2.5) this.hitCrystal(tw);
    }

    if (this.state === 'fight') {
      const speed = this.speed, pw = this.power;
      this.flailAngle += dt * (0.55 + this.frac * 1.2) * (1 + 0.1 * (pw - 1));
      const onFloor = P.pos.y < y0 + 2.5 && inArena;
      const busy = this.anim.slam > 0 || this.anim.throw > 0 || this.anim.swat > 0 || this.anim.pull > 0;
      this.tShock -= dt * speed;
      if (this.tShock <= 0 && !busy) { this.anim.slam = 1.0; this.tShock = 7.5; }
      this.tBoulder -= dt * speed;
      if (this.tBoulder <= 0 && onFloor && !busy) { this.anim.throw = 0.9; this.tBoulder = 5.5; }
      // lightning from half way (from the start for power 3+): follows you anywhere, towers included
      if (this.frac >= 0.5 - 0.25 * (pw - 1) && inArena) {
        this.tLightning -= dt * speed;
        if (this.tLightning <= 0) { this.tLightning = 7.5; this.spawnStrike(P); }
      }
      // arm swat: punishes hanging around high up near him
      this.tSwat -= dt * Math.min(speed, 1.4);
      const near = Math.hypot(dx, dz) < 11 && P.pos.y > y0 + 2.2;
      if (near && this.tSwat <= 0 && !busy) { this.anim.swat = 0.95; this.tSwat = 4.5; this.sfx.swat(); }
      if (this.waveQueue > 0) { this.waveQueue -= dt; if (this.waveQueue <= 0) this.spawnWave(); }
      // power 2+: homing wisps (only launched while you're down on the floor)
      if (pw >= 2 && onFloor && !P.hang) {
        this.tWisp -= dt * speed;
        if (this.tWisp <= 0) { this.tWisp = Math.max(7, 13 - pw); this.spawnWisp(); }
      }
      // power 3+: meteor showers over the whole arena, one aimed at you
      if (pw >= 3 && inArena) {
        this.tMeteor -= dt * speed;
        if (this.tMeteor <= 0) { this.tMeteor = 12; this.spawnMeteors(P); }
      }
      // power 4: he inhales and drags you toward him
      if (pw >= 4 && inArena) {
        this.tPull -= dt * speed;
        if (this.tPull <= 0 && !busy) { this.tPull = 13; this.anim.pull = 2.4; this.sfx.roar(); }
      }
      if (this.anim.pull > 0 && !P.hang) {
        const px = c.x - P.pos.x, pz = c.z - P.pos.z, d = Math.hypot(px, pz);
        if (d > 3) {
          if (P.onGround) { P.pos.x += px / d * 1.6 * dt; P.pos.z += pz / d * 1.6 * dt; } else { P.vel.x += px / d * 4.5 * dt; P.vel.z += pz / d * 4.5 * dt; }
        }
      }
    }

    this.animate(dt);
    this.updateWaves(dt, P);
    this.updateBoulders(dt, P);
    this.updateStrikes(dt, P);
    this.updateWisps(dt, P);
  }

  // ---- wisps: glowing orbs that chase you for a few seconds
  spawnWisp() {
    const from = new V3(); this.head.getWorldPosition(from);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), new THREE.MeshBasicMaterial({ color: this.colors.wisp, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    g.position.copy(from);
    this.b.g.add(g);
    this.wisps.push({ g, life: 5 });
    this.sfx.zap();
  }

  updateWisps(dt, P) {
    const sp = 2.4 + this.power * 0.3;
    // they lose interest once you're up a tower or hanging on, and fizzle out
    const hunting = P && this.state === 'fight' && !P.hang && P.pos.y < this.y0 + 2.5;
    for (let i = this.wisps.length - 1; i >= 0; i--) {
      const w = this.wisps[i];
      w.life -= dt * (hunting ? 1 : 3);
      let hit = false;
      if (hunting) {
        const d = new V3(P.pos.x, P.pos.y + 1, P.pos.z).sub(w.g.position);
        const l = d.length();
        if (l < 0.8) { hit = true; P.knock(d.x || 0.5, d.z || 0.5, 4, 4, 'boss'); } else w.g.position.addScaledVector(d, sp * dt / l);
      } else w.g.position.y += dt * 1.5;
      const s = 1 + Math.sin(this.time * 12 + i) * 0.15; w.g.scale.setScalar(w.life < 0.5 ? s * w.life * 2 : s);
      if (hit || w.life <= 0) { this.b.g.remove(w.g); this.wisps.splice(i, 1); if (hit) this.sfx.hurt(); }
    }
  }

  clearWisps() { for (const w of this.wisps) this.b.g.remove(w.g); this.wisps = []; }

  // ---- meteors: reuse boulders, falling straight down from the sky
  spawnMeteors(P) {
    const n = 2 + this.power;
    for (let k = 0; k < n; k++) {
      const to = k === 0
        ? new V3(P.pos.x, P.onGround ? P.pos.y : this.y0, P.pos.z)
        : new V3(this.c.x + (Math.random() - 0.5) * 36, this.y0, this.c.z + (Math.random() - 0.5) * 36);
      this.throwOne(0, to, true);
    }
    this.sfx.throwRock();
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
    if (a.pull > 0) {
      a.pull -= dt; la = ra = -2.2; this.head.rotation.x = -0.4;
      this.armorMat.emissive.setRGB(0.25 + 0.2 * Math.sin(this.time * 20), 0, 0.35);
    }
    if (a.throw > 0) {
      const prev = a.throw; a.throw -= dt;
      const k = 1 - a.throw / 0.9;
      ra = k < 0.6 ? -3.0 * (k / 0.6) : -3.0 + 4.0 * Math.min(1, (k - 0.6) / 0.15);
      if (prev > 0.35 && a.throw <= 0.35) this.spawnBoulder();
    }
    if (a.swat > 0) {
      const prev = a.swat; a.swat -= dt;
      const k = 1 - a.swat / 0.95;
      ra = k < 0.55 ? -1.6 * (k / 0.55) : -1.6 + 1.6 * Math.min(1, (k - 0.55) / 0.15);
      this.arms[1].rotation.z = k < 0.55 ? 1.3 * (k / 0.55) : 1.3 * (1 - Math.min(1, (k - 0.55) / 0.2));
      this.fistMat.emissive.setRGB(k < 0.6 ? 0.9 * k : 0, 0.05, 0);
      if (prev > 0.38 && a.swat <= 0.38) this.swatHit();
    } else { this.arms[1].rotation.z *= 0.9; this.fistMat.emissive.setRGB(0, 0, 0); }
    if (a.roar > 0) { a.roar -= dt; la = Math.min(la, -1.2); ra = Math.min(ra, -1.2); this.head.rotation.x = -0.5; }
    this.arms[0].rotation.x += (la - this.arms[0].rotation.x) * Math.min(1, dt * 14);
    this.arms[1].rotation.x += (ra - this.arms[1].rotation.x) * Math.min(1, dt * 14);
    if (a.flash > 0) {
      a.flash -= dt;
      const on = Math.floor(a.flash * 16) % 2 === 0;
      this.armorMat.emissive.setRGB(on ? 1 : 0, on ? 0.9 : 0, on ? 0.9 : 0);
    } else if (a.pull <= 0) this.armorMat.emissive.setRGB(0, 0, 0);
    this.eyeMat.color.copy(this.eyeCol).multiplyScalar(0.85 + 0.15 * Math.sin(this.time * 8));
  }

  spawnWave() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.9, 64, 1, true), mat);
    mesh.position.set(this.c.x, this.y0 + 0.45, this.c.z);
    this.b.g.add(mesh);
    this.waves.push({ r: 4.2, mesh, hit: false });
    // follow-up waves late in the fight (earlier, and a third one, for stronger bosses)
    const extra = this.frac >= 0.75 - 0.25 * (this.power - 1) ? (this.power >= 4 && this.frac >= 0.5 ? 2 : 1) : 0;
    this.waveCount = (this.waveCount || 0) + 1;
    if (this.waveCount <= extra) this.waveQueue = 0.6; else this.waveCount = 0;
    this.sfx.slam();
    this.world.events.push({ type: 'shake', amount: 0.6 });
  }

  updateWaves(dt, P) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r += dt * (9 + this.frac * 8 + (this.power - 1) * 1.5);
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
    const n = (this.frac >= 1 ? 3 : this.frac >= 0.5 ? 2 : 1) + (this.power >= 3 ? 1 : 0);
    for (let k = 0; k < n; k++) this.throwOne(k === 0 ? 0 : 3.5);
    this.sfx.throwRock();
  }

  throwOne(spread, target = null, sky = false) {
    const P = this.world.player; if (!P) return;
    const from = new V3();
    let to;
    if (target) { to = target; from.copy(to).add(new V3(8, 45, -4)); } else {
      this.arms[1].children[2].getWorldPosition(from);
      to = P.pos.clone().addScaledVector(new V3(P.vel.x, 0, P.vel.z), 0.6);
      if (spread) { const a = Math.random() * Math.PI * 2; to.x += Math.cos(a) * spread; to.z += Math.sin(a) * spread; }
      to.y = this.y0;
    }
    const lim = 19; to.x = Math.max(this.c.x - lim, Math.min(this.c.x + lim, to.x)); to.z = Math.max(this.c.z - lim, Math.min(this.c.z + lim, to.z));
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 1, flatShading: true, emissive: 0x401000 }));
    mesh.castShadow = true;
    const marker = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 32), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    marker.rotation.x = -Math.PI / 2; marker.position.set(to.x, this.y0 + 0.05, to.z);
    this.b.g.add(mesh, marker);
    marker.position.y = to.y + 0.05;
    this.boulders.push({ from, to, t: 0, dur: sky ? 1.6 : 1.4, mesh, marker, sky });
  }

  // ---- lightning: a warning ring follows your position, then a bolt strikes it
  spawnStrike(P) {
    const g = this.b.g;
    const marker = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 32), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    marker.rotation.x = -Math.PI / 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 60, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xe0d0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    g.add(marker, bolt);
    this.strikes.push({ t: 0, track: 1.0, fire: 1.35, marker, bolt, at: P.pos.clone(), done: false });
  }

  updateStrikes(dt, P) {
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const st = this.strikes[i];
      st.t += dt;
      if (st.t < st.track && P) { st.at.x += (P.pos.x - st.at.x) * Math.min(1, dt * 5); st.at.z += (P.pos.z - st.at.z) * Math.min(1, dt * 5); st.at.y = P.onGround ? P.pos.y : st.at.y; }
      st.marker.position.set(st.at.x, st.at.y + 0.05, st.at.z);
      const pulse = 0.5 + 0.5 * Math.sin(st.t * (st.t > st.track ? 40 : 14));
      st.marker.material.opacity = 0.35 + 0.6 * pulse;
      st.marker.scale.setScalar(st.t > st.track ? 1.2 : 1);
      if (!st.done && st.t >= st.fire) {
        st.done = true;
        st.bolt.position.set(st.at.x, st.at.y + 30, st.at.z);
        st.bolt.material.opacity = 1;
        this.sfx.zap();
        this.world.events.push({ type: 'shake', amount: 0.3 });
        if (P) {
          const dx = P.pos.x - st.at.x, dz = P.pos.z - st.at.z;
          if (dx * dx + dz * dz < 1.9 * 1.9 && Math.abs(P.pos.y - st.at.y) < 2.5) P.knock(dx || 0.5, dz || 0.5, 8, 9, 'boss');
        }
      }
      if (st.done) st.bolt.material.opacity = Math.max(0, st.bolt.material.opacity - dt * 5);
      if (st.t > st.fire + 0.35) {
        this.b.g.remove(st.marker, st.bolt);
        st.marker.geometry.dispose(); st.bolt.geometry.dispose();
        this.strikes.splice(i, 1);
      }
    }
  }

  swatHit() {
    const P = this.world.player; if (!P) return;
    const dx = P.pos.x - this.c.x, dz = P.pos.z - this.c.z;
    // jumping over the swing dodges it
    if ((P.onGround || P.hang) && Math.hypot(dx, dz) < 11.5 && P.pos.y > this.y0 + 1.8 && P.pos.y < this.y0 + 15) {
      // only hits in the half he's facing
      const fx = Math.sin(this.root.rotation.y), fz = Math.cos(this.root.rotation.y);
      if ((dx * fx + dz * fz) > 0) P.knock(dx, dz, 13, 6, 'boss');
    }
  }

  updateBoulders(dt, P) {
    for (let i = this.boulders.length - 1; i >= 0; i--) {
      const bo = this.boulders[i];
      bo.t += dt;
      const k = Math.min(1, bo.t / bo.dur);
      bo.mesh.position.lerpVectors(bo.from, bo.to, k);
      if (!bo.sky) bo.mesh.position.y += Math.sin(k * Math.PI) * 9;
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
    const at = new V3(); tw.crystal.getWorldPosition(at);
    this.burst(at, tw.attached ? 0xff2a6a : 0x7af7ff, 24);
    this.hp--;
    this.anim.flash = 1.2; this.anim.roar = 1.0;
    this.sfx.bossHit();
    this.world.events.push({ type: 'bossHit', hp: this.hp, max: this.maxHp });
    for (const bo of this.boulders) { this.b.g.remove(bo.mesh, bo.marker); }
    this.boulders = [];
    this.clearWisps(); this.anim.pull = 0;
    if (this.hp <= 0) {
      this.state = 'dying'; this.dyingT = 0;
      for (const f of this.flails) { f.col.active = false; f.vis.visible = false; }
      for (const w of this.waves) this.b.g.remove(w.mesh);
      for (const st of this.strikes) this.b.g.remove(st.marker, st.bolt);
      this.waves = []; this.strikes = [];
      for (const c of this.orbit) { c.active = false; c.mesh.visible = false; }
      return;
    }
    this.setActiveTower(this.active + 1);
    this.tShock = 3; this.tBoulder = 3; this.tLightning = 3; this.tWisp = 4; this.tMeteor = 5;
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
