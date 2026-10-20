// Meta Quest / WebXR controllers: thumbstick locomotion, snap turn, per-hand grabbing.
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export class XRControls {
  constructor(renderer, rig) {
    this.hands = [];
    const factory = new XRControllerModelFactory();
    const glowGeo = new THREE.SphereGeometry(0.035, 12, 8);
    for (let i = 0; i < 2; i++) {
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(factory.createControllerModel(grip));
      const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0xffcf4a, transparent: true, opacity: 0.0, depthWrite: false }));
      grip.add(glow);
      rig.add(grip);
      const ctrl = renderer.xr.getController(i);
      rig.add(ctrl);
      const h = {
        grip, ctrl, glow, source: null, handedness: '',
        held: false, prevHeld: false, pressed: false,
        prevLocal: new THREE.Vector3(), velLocal: new THREE.Vector3(), tracked: false,
        aPrev: false, bPrev: false, trigPrev: false, fire: false,
      };
      ctrl.addEventListener('connected', (e) => { h.source = e.data; h.handedness = e.data.handedness; h.tracked = false; });
      ctrl.addEventListener('disconnected', () => { h.source = null; h.held = false; });
      this.hands.push(h);
    }
    this.turnReady = true;
    this.toolMode = false; // holding a gadget: the trigger fires it, the grip still grabs
  }

  pulse(handIndex, strength = 0.5, ms = 40) {
    const s = this.hands[handIndex] && this.hands[handIndex].source;
    const act = s && s.gamepad && s.gamepad.hapticActuators && s.gamepad.hapticActuators[0];
    try { if (act && act.pulse) act.pulse(strength, ms); } catch { /* not supported */ }
  }

  poll(dt) {
    let mx = 0, my = 0, turn = 0, jump = false, respawn = false;
    const tmp = new THREE.Vector3();
    for (const h of this.hands) {
      h.prevHeld = h.held; h.held = false; h.pressed = false; h.fire = false;
      const gp = h.source && h.source.gamepad;
      // hand velocity in rig space (excludes locomotion, so flings feel physical)
      const p = h.grip.position;
      if (h.tracked) {
        tmp.subVectors(p, h.prevLocal).divideScalar(Math.max(dt, 1e-3));
        h.velLocal.lerp(tmp, 0.5);
      } else { h.velLocal.set(0, 0, 0); h.tracked = true; }
      h.prevLocal.copy(p);
      if (!gp) continue;
      const b = gp.buttons;
      const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] || 0, gp.axes[1] || 0];
      const trig = !!(b[0] && b[0].pressed);
      h.fire = trig && !h.trigPrev && this.toolMode; h.trigPrev = trig;
      h.held = !!((b[1] && b[1].pressed) || (trig && !this.toolMode));
      h.pressed = h.held && !h.prevHeld;
      if (h.handedness === 'left') { mx = ax[0]; my = -ax[1]; }
      else if (h.handedness === 'right') {
        if (Math.abs(ax[0]) > 0.7) { if (this.turnReady) { turn = Math.sign(ax[0]); this.turnReady = false; } }
        else if (Math.abs(ax[0]) < 0.3) this.turnReady = true;
      }
      const a = !!(b[4] && b[4].pressed), bb = !!(b[5] && b[5].pressed);
      if (a && !h.aPrev) jump = true;
      if (bb && !h.bPrev) respawn = true;
      h.aPrev = a; h.bPrev = bb;
    }
    const l = Math.hypot(mx, my);
    if (l < 0.15) { mx = 0; my = 0; } else if (l > 1) { mx /= l; my /= l; }
    return { move: { x: mx, y: my }, jump, turn, respawn };
  }
}
