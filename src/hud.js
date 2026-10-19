// HUD: DOM overlay on desktop, a head-locked canvas panel + fade sphere in VR.
import * as THREE from 'three';

export function fmtTime(s) {
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`;
}

export class Hud {
  constructor(camera) {
    this.el = {
      hud: document.getElementById('hud'), timer: document.getElementById('timer'), stats: document.getElementById('stats'),
      cross: document.getElementById('crosshair'), hint: document.getElementById('hint'),
      banner: document.getElementById('banner'), big: document.getElementById('bannerBig'), small: document.getElementById('bannerSmall'),
      fade: document.getElementById('fade'), bossWrap: document.getElementById('boss'), bossFill: document.getElementById('bossFill'),
    };
    this.bossOn = false; this.bossFrac = 1;
    this.state = { time: '0:00.00', stats: '', hint: '', big: '', small: '', color: '#ffffff' };
    this.bannerT = 0; this.bannerSticky = false; this.xr = false; this.dirty = true; this.redrawT = 0;

    const c = this.canvas = document.createElement('canvas'); c.width = 1024; c.height = 512;
    this.ctx = c.getContext('2d');
    this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
    this.panel.position.set(0, -0.02, -1.5);
    this.panel.renderOrder = 1000; this.panel.visible = false;
    camera.add(this.panel);
    this.fadeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
    this.fadeMesh.renderOrder = 999; this.fadeMesh.visible = false;
    camera.add(this.fadeMesh);
  }

  setXR(on) { this.xr = on; this.panel.visible = on; this.dirty = true; this.el.cross.classList.toggle('hidden', on); }
  show(on) { this.el.hud.classList.toggle('hidden', !on); this.el.cross.classList.toggle('hidden', !on || this.xr); }

  boss(on, frac = this.bossFrac) {
    this.bossOn = on; this.bossFrac = frac;
    this.el.bossWrap.classList.toggle('hidden', !on);
    this.el.bossFill.style.width = `${Math.max(0, frac) * 100}%`;
    this.dirty = true;
  }

  set(key, val) { if (this.state[key] !== val) { this.state[key] = val; this.dirty = true; } }

  banner(big, small = '', color = '#ffffff', dur = 2.2) {
    this.set('big', big); this.set('small', small); this.set('color', color);
    this.bannerT = dur; this.bannerSticky = dur <= 0;
  }
  clearBanner() { this.set('big', ''); this.set('small', ''); this.bannerSticky = false; this.bannerT = 0; }

  fade(a) {
    this.el.fade.style.opacity = a.toFixed(3);
    this.fadeMesh.material.opacity = a;
    this.fadeMesh.visible = this.xr && a > 0.001;
  }

  update(dt, grabHint) {
    if (!this.bannerSticky && this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) { this.set('big', ''); this.set('small', ''); }
    }
    this.el.cross.classList.toggle('grab', !!grabHint);
    if (!this.dirty) return;
    this.redrawT -= dt;
    if (this.redrawT > 0 && this.xr) return;
    this.redrawT = 0.1;
    this.dirty = false;
    const s = this.state;
    this.el.timer.textContent = s.time;
    this.el.stats.textContent = s.stats;
    this.el.hint.textContent = s.hint;
    this.el.big.textContent = s.big; this.el.big.style.color = s.color;
    this.el.small.textContent = s.small;
    if (this.xr) this.drawPanel();
  }

  drawPanel() {
    const g = this.ctx, s = this.state;
    g.clearRect(0, 0, 1024, 512);
    const fit = (text, weight, size, y) => { // shrink long lines to fit the panel
      g.font = `${weight} ${size}px system-ui, sans-serif`;
      const w = g.measureText(text).width;
      if (w > 980) g.font = `${weight} ${Math.floor(size * 980 / w)}px system-ui, sans-serif`;
      g.fillText(text, 512, y);
    };
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 12;
    g.fillStyle = '#ffffff'; fit(`${s.time}   ${s.stats}`, 800, 34, 40);
    if (s.big) { g.fillStyle = s.color; fit(s.big, 900, 78, 210); }
    if (s.small) { g.fillStyle = '#ffffff'; fit(s.small, 700, 38, 285); }
    if (this.bossOn) {
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(262, 70, 500, 26);
      g.fillStyle = '#ff2a5a'; g.fillRect(266, 74, 492 * Math.max(0, this.bossFrac), 18);
      g.fillStyle = '#ffffff'; g.font = '800 22px system-ui, sans-serif'; g.fillText('THE SKY KING', 512, 112);
    }
    if (s.hint) { g.fillStyle = '#ffcf4a'; fit(s.hint, 800, 32, 470); }
    this.tex.needsUpdate = true;
  }
}
