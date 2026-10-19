// Scenery: floating rock islands, the cloud sea far below, and billboard cumulus.
import * as THREE from 'three';
import { rng } from './textures.js';

// ---------- noise ----------
function hash3(x, y, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683) ^ Math.imul(s, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz, s);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm3(x, y, z, s, oct = 4) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { v += a * vnoise3(x * f, y * f, z * f, s + i * 17); n += a; a *= 0.5; f *= 2.03; }
  return v / n;
}

// ---------- floating rocks ----------
const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });

// Flat-topped, stalactite-like rock. Top surface sits at y≈0 (dome rises at most 0.08·min(rx,rz)).
export function makeRock(rx, rz, depth, seed = 1, grassTop = false) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const topH = 0.08 * Math.min(rx, rz);
  const soil = new THREE.Color(0x5a4330), rockA = new THREE.Color(0x7d7368), rockB = new THREE.Color(0x9a9286), dark = new THREE.Color(0x4a443e);
  const grassA = new THREE.Color(0x4f8a2c), grassB = new THREE.Color(0x6aa63a);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = fbm3(x * 2.2 + 5, y * 2.2, z * 2.2, seed);
    const n2 = fbm3(x * 7, y * 7, z * 7, seed + 99, 3);
    const t = Math.max(0, -y);
    const k = (0.82 + 0.18 * n) * (1 - 0.3 * Math.pow(t, 1.4));
    const nx = x * rx * k, nz = z * rz * k;
    const ny = y > 0 ? y * topH : -Math.pow(t, 0.85) * depth * (0.7 + 0.6 * n) + (n2 - 0.5) * 0.15 * depth * t;
    pos.setXYZ(i, nx, ny, nz);
    if (grassTop && y > -0.06) {
      c.copy(grassA).lerp(grassB, n2);
    } else if (t < 0.12) {
      c.copy(soil).lerp(rockA, t / 0.12);
    } else {
      const band = 0.5 + 0.5 * Math.sin(ny * 1.7 + n * 6);
      c.copy(rockA).lerp(rockB, band * 0.6 + n2 * 0.4).lerp(dark, Math.min(1, t * 0.7));
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, rockMat);
  m.receiveShadow = true;
  return m;
}

export function createIslands(scene) {
  const r = rng(777);
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2, 6); trunkGeo.translate(0, 1, 0);
  const leafGeo = new THREE.ConeGeometry(1.6, 4.5, 7); leafGeo.translate(0, 4, 0);
  const trees = [];
  const islands = [];
  for (let i = 0; i < 22; i++) {
    const side = r() > 0.5 ? 1 : -1;
    const x = side * (110 + r() * 700);
    const z = 300 - r() * 1200;
    const y = -70 + r() * 120;
    const R = 10 + r() * 40;
    const rock = makeRock(R, R * (0.6 + r() * 0.4), R * (1.1 + r() * 1.2), 100 + i, true);
    rock.position.set(x, y, z);
    rock.rotation.y = r() * 6.28;
    scene.add(rock);
    islands.push(rock);
    const nTrees = Math.floor(R / 3);
    for (let k = 0; k < nTrees; k++) {
      const a = r() * 6.28, rr = Math.sqrt(r()) * 0.6;
      const lx = Math.cos(a) * rr * R, lz = Math.sin(a) * rr * R * 0.6;
      const p = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), rock.rotation.y);
      const s = 0.8 + r() * 1.4;
      const ty = y + 0.08 * R * 0.6 * Math.sqrt(Math.max(0, 1 - rr * rr)) - 0.4;
      trees.push({ x: x + p.x, y: ty, z: z + p.z, s, rot: r() * 6.28 });
    }
  }
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b2a, roughness: 0.9, flatShading: true });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, trees.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const tint = new THREE.Color();
  trees.forEach((t, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rot);
    m.compose(p.set(t.x, t.y, t.z), q, sc.set(t.s, t.s, t.s));
    trunks.setMatrixAt(i, m); leaves.setMatrixAt(i, m);
    leaves.setColorAt(i, tint.setHSL(0.27 + r() * 0.08, 0.5, 0.55 + r() * 0.25));
  });
  scene.add(trunks, leaves);
  return islands;
}

// Small decorative tree for course platforms.
export function makeTree(s = 1, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 2.2 * s, 7), new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 1 }));
  trunk.position.y = 1.1 * s; trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 + r() * 0.05, 0.55, 0.32), roughness: 0.9, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.6 - i * 0.35) * s, 2.2 * s, 8), leafMat);
    cone.position.y = (2.4 + i * 1.1) * s; cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

// ---------- cloud sea ----------
function tileNoise(size, period, seed, oct) {
  const out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < oct; o++) {
    const p = period << o;
    const lat = new Float32Array(p * p);
    const r = rng(seed * 31 + o * 7 + 1);
    for (let i = 0; i < p * p; i++) lat[i] = r();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const fx = x / size * p, fy = y / size * p;
      const xi = Math.floor(fx), yi = Math.floor(fy);
      let u = fx - xi, v = fy - yi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
      const x1 = (xi + 1) % p, y1 = (yi + 1) % p;
      const a = lat[yi * p + xi], b = lat[yi * p + x1], c = lat[y1 * p + xi], d = lat[y1 * p + x1];
      out[y * size + x] += amp * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
    }
    total += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  // stretch contrast to roughly 0..1
  let mn = 1, mx = 0;
  for (const v of out) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) / (mx - mn);
  return out;
}

export function createCloudSea(scene, sky) {
  const size = 256;
  const a = tileNoise(size, 4, 1, 6), b = tileNoise(size, 8, 2, 5), c = tileNoise(size, 16, 3, 4);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = a[i] * 255; data[i * 4 + 1] = b[i] * 255; data[i * 4 + 2] = c[i] * 255; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      noiseTex: { value: tex }, bgMap: { value: sky.background },
      sunDir: { value: sky.sunDir }, time: { value: 0 },
      white: { value: sky.white }, zenith: { value: sky.zenith }, sunCol: { value: sky.sunCol }, avgHorizon: { value: sky.avgHorizon },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D noiseTex; uniform samplerCube bgMap;
      uniform vec3 sunDir; uniform float time;
      uniform vec3 white; uniform vec3 zenith; uniform vec3 sunCol; uniform vec3 avgHorizon;
      varying vec3 vWorld;
      float field(vec2 uv) {
        float a = texture2D(noiseTex, uv * 0.0009 + vec2(time * 0.0012, 0.0)).r;
        float b = texture2D(noiseTex, uv * 0.0031 + vec2(0.0, time * 0.0025)).g;
        float c = texture2D(noiseTex, uv * 0.011 - vec2(time * 0.004)).b;
        return a * 0.55 + b * 0.3 + c * 0.15;
      }
      void main() {
        vec3 V = vWorld - cameraPosition; float dist = length(V); vec3 vd = V / dist;
        vec2 uv = vWorld.xz;
        float n = field(uv);
        float ns = field(uv + sunDir.xz * 60.0);
        float dens = smoothstep(0.30, 0.62, n);
        float light = clamp(0.62 + (n - ns) * 4.0, 0.0, 1.0);
        float toSun = pow(max(dot(normalize(vec3(vd.x, 0.0, vd.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0), 3.0);
        vec3 lit = white * 1.2 + sunCol * (0.15 + 0.35 * toSun);
        vec3 shade = mix(zenith, white, 0.45) * 0.55;
        vec3 col = mix(shade, lit, light);
        vec3 gap = mix(zenith, avgHorizon, 0.3) * 0.42;
        col = mix(gap, col, dens);
        vec3 far = textureCube(bgMap, vd).rgb;
        float fog = 1.0 - exp(-dist * 0.00028);
        col = mix(col, far, fog);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(18000, 18000), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -160, -200);
  scene.add(sea);
  return mat;
}

// ---------- billboard cumulus (single instanced draw call) ----------
function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const r = rng(5);
  for (let i = 0; i < 18; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 28;
    const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * 0.8, rad = 18 + r() * 22;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, 6.29); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function createCloudBillboards(scene, sky) {
  const r = rng(4242);
  const offsets = [], scales = [], shades = [], rots = [];
  const addCluster = (cx, cy, cz, S) => {
    const n = 7 + Math.floor(r() * 9);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.sqrt(r());
      const ox = Math.cos(a) * d * S, oz = Math.sin(a) * d * S * 0.6;
      const oy = (r() - 0.25) * S * 0.35 * (1 - d * 0.5);
      offsets.push(cx + ox, cy + oy, cz + oz);
      scales.push(S * (0.55 + r() * 0.5) * (1 - d * 0.35));
      shades.push(Math.min(1, Math.max(0, 0.35 + oy / (S * 0.35) * 0.6 + (r() - 0.5) * 0.2)));
      rots.push(r() * 6.28);
    }
  };
  for (let i = 0; i < 70; i++) {
    const side = r() > 0.5 ? 1 : -1;
    addCluster(side * (90 + r() * 2400), -130 + r() * 230, 1800 - r() * 4400, 35 + r() * 110);
  }
  for (let i = 0; i < 22; i++) addCluster((r() - 0.5) * 300, -140 + r() * 70, 60 - r() * 520, 30 + r() * 50); // below the course
  const count = scales.length;
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
  geo.setAttribute('scale', new THREE.InstancedBufferAttribute(new Float32Array(scales), 1));
  geo.setAttribute('shade', new THREE.InstancedBufferAttribute(new Float32Array(shades), 1));
  geo.setAttribute('rot', new THREE.InstancedBufferAttribute(new Float32Array(rots), 1));
  geo.instanceCount = count;

  const lit = sky.white.clone().multiplyScalar(1.3).add(sky.sunCol.clone().multiplyScalar(0.2));
  const shade = sky.zenith.clone().lerp(sky.white, 0.55).multiplyScalar(0.62);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { map: { value: puffTexture() }, litCol: { value: lit }, shadeCol: { value: shade }, sunCol: { value: sky.sunCol }, sunDir: { value: sky.sunDir } },
    vertexShader: /* glsl */`
      attribute vec3 offset; attribute float scale; attribute float shade; attribute float rot;
      uniform vec3 sunDir;
      varying vec2 vUv; varying float vShade; varying float vAlpha; varying float vPhase;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(offset, 1.0);
        float c = cos(rot), s = sin(rot);
        vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
        mv.xy += q * scale;
        float dist = -mv.z;
        vAlpha = smoothstep(5200.0, 3200.0, dist) * smoothstep(8.0, 60.0, dist);
        vShade = clamp(shade + position.y * 0.45, 0.0, 1.0);
        vec3 wdir = normalize(offset - cameraPosition);
        vPhase = pow(max(dot(wdir, sunDir), 0.0), 6.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec3 litCol; uniform vec3 shadeCol; uniform vec3 sunCol;
      varying vec2 vUv; varying float vShade; varying float vAlpha; varying float vPhase;
      void main() {
        float a = texture2D(map, vUv).a * vAlpha;
        if (a < 0.01) discard;
        vec3 col = mix(shadeCol, litCol, vShade) + sunCol * vPhase * (0.3 + 0.7 * (1.0 - a));
        gl_FragColor = vec4(col, min(1.0, a * 1.15));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  scene.add(mesh);
  return mesh;
}
