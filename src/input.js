// Desktop keyboard + mouse (pointer lock) input.
export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.dx = 0; this.dy = 0;
    this.mouse = [false, false, false];
    this._jump = false; this._grab = false; this._respawn = false; this._fire = false; this._music = false;
    this.toolMode = false; // holding a gadget: left click fires, E / right click grabs
    this.locked = false;
    this.onLockChange = null;

    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this._jump = true;
      if (e.code === 'KeyE') this._grab = true;
      if (e.code === 'KeyR') this._respawn = true;
      if (e.code === 'KeyF') this._fire = true;
      if (e.code === 'KeyM') this._music = true;
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.fill(false); });
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.dx += e.movementX || 0; this.dy += e.movementY || 0;
    });
    addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this.mouse[e.button] = true;
      if (e.button === 0 && this.toolMode) this._fire = true; else this._grab = true;
    });
    addEventListener('mouseup', (e) => { this.mouse[e.button] = false; });
    addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      if (!this.locked) this.mouse.fill(false);
      if (this.onLockChange) this.onLockChange(this.locked);
    });
  }

  lock() {
    try {
      const p = this.el.requestPointerLock({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => this.el.requestPointerLock());
    } catch { this.el.requestPointerLock(); }
  }

  read() {
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    const r = {
      move: { x, y },
      jump: this._jump,
      grab: k.has('KeyE') || (this.mouse[0] && !this.toolMode) || this.mouse[2],
      fire: this._fire,
      music: this._music,
      grabPressed: this._grab,
      lookX: this.dx, lookY: this.dy,
      respawn: this._respawn,
    };
    this._jump = this._grab = this._respawn = this._fire = this._music = false;
    this.dx = this.dy = 0;
    return r;
  }
}
