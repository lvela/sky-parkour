// Atmospheric effects. Each factory adds to `group` and returns an update(t, dt) function.
import * as THREE from 'three';
import { rng } from './textures.js';

// Rain streaks that follow the camera (positions animated entirely on the GPU).
export function createRain(group, world, count = 2600) {
  const r = rng(3);
  const pos = new Float32Array(count * 2 * 3), end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = r() * 60, y = r() * 40, z = r() * 60;
    pos.set([x, y, z, x, y, z], i * 6);
    end[i * 2] = 0; end[i * 2 + 1] = 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('endp', new THREE.BufferAttribute(end, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, center: { value: world.camPos } },
    vertexShader: /* glsl */`
      attribute float endp; uniform float time; uniform vec3 center; varying float vA;
      void main() {
        vec3 box = vec3(60.0, 40.0, 60.0);
        vec3 p = position;
        p.y -= time * 28.0;
        p.x -= time * 4.0;
        p = mod(p - center + box * 0.5, box) - box * 0.5 + center;
        p += vec3(0.12, 0.85, 0.0) * endp;
        vA = endp;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() { gl_FragColor = vec4(0.75, 0.8, 0.9, 0.35 * vA + 0.05); }`,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  group.add(lines);
  return (t) => { mat.uniforms.time.value = t; };
}

// Lightning: random bolts far away + a scene-wide flash and delayed thunder.
export function createLightning(group, sfx, flashLight) {
  const r = rng(11);
  let next = 3, flash = 0, boltLife = 0;
  const boltMat = new THREE.LineBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 1, toneMapped: false });
  let bolt = null;
  const makeBolt = () => {
    if (bolt) { group.remove(bolt); bolt.geometry.dispose(); }
    const a = r() * Math.PI * 2, d = 250 + r() * 500;
    let x = Math.cos(a) * d, z = -200 + Math.sin(a) * d, y = 220;
    const pts = [];
    const branch = [];
    while (y > -160) {
      pts.push(new THREE.Vector3(x, y, z));
      x += (r() - 0.5) * 40; z += (r() - 0.5) * 40; y -= 15 + r() * 25;
      if (r() < 0.2) branch.push(new THREE.Vector3(x, y, z));
    }
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push(pts[i], pts[i + 1]);
    for (const b of branch) {
      let bx = b.x, by = b.y, bz = b.z;
      for (let k = 0; k < 4; k++) { const n = new THREE.Vector3(bx + (r() - 0.5) * 50, by - 20 - r() * 20, bz + (r() - 0.5) * 50); segs.push(new THREE.Vector3(bx, by, bz), n); bx = n.x; by = n.y; bz = n.z; }
    }
    bolt = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), boltMat);
    bolt.frustumCulled = false;
    group.add(bolt);
    return d;
  };
  return (t, dt) => {
    next -= dt;
    if (next <= 0) {
      next = 4 + r() * 8;
      const d = makeBolt();
      flash = 1; boltLife = 0.35;
      sfx.thunder(Math.min(2.5, d / 340));
    }
    if (boltLife > 0) {
      boltLife -= dt;
      boltMat.opacity = boltLife > 0 ? (Math.floor(boltLife * 30) % 3 === 0 ? 0.3 : 1) : 0;
      if (bolt) bolt.visible = boltLife > 0;
    }
    flash = Math.max(0, flash - dt * 4);
    flashLight.intensity = flash * (Math.floor(t * 30) % 2 ? 2.5 : 1.2) * 3;
  };
}

// Aurora borealis: glowing curtains drifting high in the sky.
export function createAurora(group) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float time; varying vec2 vUv; varying float vSeed;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.z += sin(p.x * 0.004 + time * 0.25) * 140.0 + sin(p.x * 0.011 - time * 0.4) * 50.0;
        vSeed = p.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float time; varying vec2 vUv; varying float vSeed;
      void main() {
        float rays = 0.55 + 0.45 * sin(vUv.x * 160.0 + time * 1.4 + sin(vUv.x * 30.0 + time) * 2.0);
        rays *= 0.6 + 0.4 * sin(vUv.x * 47.0 - time * 0.7);
        float v = vUv.y;
        float shape = smoothstep(0.0, 0.12, v) * pow(1.0 - v, 1.6);
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        vec3 green = vec3(0.1, 1.0, 0.45), violet = vec3(0.65, 0.2, 1.0);
        vec3 col = mix(green, violet, smoothstep(0.35, 0.95, v));
        float a = shape * rays * edge * 0.55;
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  const curtains = [];
  const r = rng(21);
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.PlaneGeometry(3200 + r() * 1200, 520 + r() * 200, 160, 1);
    const m = new THREE.Mesh(geo, mat);
    m.position.set((r() - 0.5) * 1500, 420 + r() * 200, -1500 - i * 500 + r() * 200);
    m.rotation.y = (r() - 0.5) * 0.5;
    m.frustumCulled = false;
    group.add(m);
    curtains.push(m);
  }
  return (t) => { mat.uniforms.time.value = t; };
}

// Flock of birds gliding in lazy circles.
export function createBirds(group, center, count = 26, color = 0x222222) {
  const r = rng(31);
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.4, 0, 0, 0.4, -1.6, 0, 0, 0, 0, -0.4, 0, 0, 0.4, 1.6, 0, 0]), 3));
  wing.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const birds = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(wing.clone(), mat);
    const s = 1 + r() * 0.6; m.scale.set(s, s, s);
    group.add(m);
    birds.push({ m, r: 40 + r() * 120, h: center.y + 15 + r() * 50, sp: (0.05 + r() * 0.08) * (r() > 0.5 ? 1 : -1), ph: r() * 6.28, cx: center.x + (r() - 0.5) * 120, cz: center.z + (r() - 0.5) * 300, flap: 6 + r() * 4 });
  }
  return (t) => {
    for (const b of birds) {
      const a = b.ph + t * b.sp;
      b.m.position.set(b.cx + Math.cos(a) * b.r, b.h + Math.sin(t * 0.3 + b.ph) * 4, b.cz + Math.sin(a) * b.r);
      b.m.rotation.set(0, -a + (b.sp > 0 ? Math.PI : 0), 0);
      const f = Math.sin(t * b.flap + b.ph) * 0.45;
      const p = b.m.geometry.attributes.position;
      p.setY(2, f); p.setY(5, f); p.needsUpdate = true;
    }
  };
}

// Fireworks: call burst(pos) to launch; update animates all live particles.
export function createFireworks(group, sfx) {
  const N = 1800;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pts.frustumCulled = false;
  group.add(pts);
  let cursor = 0;
  const pending = [];
  const c = new THREE.Color();
  const explode = (p) => {
    c.setHSL(Math.random(), 1, 0.6);
    const n = 160;
    for (let i = 0; i < n; i++) {
      const k = cursor; cursor = (cursor + 1) % N;
      const d = new THREE.Vector3().randomDirection().multiplyScalar(10 + Math.random() * 6);
      pos.set([p.x, p.y, p.z], k * 3); vel.set([d.x, d.y, d.z], k * 3);
      col.set([c.r * 3, c.g * 3, c.b * 3], k * 3); life[k] = 1.6 + Math.random() * 0.6;
    }
    sfx.firework();
  };
  return {
    burst(p, count = 6, spread = 25) {
      for (let i = 0; i < count; i++) pending.push({ t: i * 0.35 + Math.random() * 0.2, p: p.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, 12 + Math.random() * 14, (Math.random() - 0.5) * spread)) });
    },
    update(t, dt) {
      for (let i = pending.length - 1; i >= 0; i--) { pending[i].t -= dt; if (pending[i].t <= 0) { explode(pending[i].p); pending.splice(i, 1); } }
      for (let k = 0; k < N; k++) {
        if (life[k] <= 0) continue;
        life[k] -= dt;
        vel[k * 3 + 1] -= 6 * dt;
        for (let j = 0; j < 3; j++) { vel[k * 3 + j] *= 1 - 1.5 * dt; pos[k * 3 + j] += vel[k * 3 + j] * dt; col[k * 3 + j] *= 1 - 1.2 * dt; }
        if (life[k] <= 0) pos[k * 3 + 1] = -9999;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
  };
}
