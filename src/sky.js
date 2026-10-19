// Per-level skies, baked ONCE into an HDR cubemap (one cube lookup per pixel at runtime,
// which keeps Quest at full frame rate).
//   pass 1: atmosphere — physically based scattering (three's Sky) or a custom gradient (storm / night)
//   pass 2: celestial bodies (stars, Milky Way, moon, ringed planet) + procedural cumulus/cirrus
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const NOISE_GLSL = /* glsl */`
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 8; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
float hg(float mu, float g) { float g2 = g * g; return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * mu, 1.5) * 0.0795775; }
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

const gradientFrag = /* glsl */`
uniform vec3 zen, hor, glowCol, lightDir;
uniform float glowPow, glowAmt;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 col = mix(hor, zen, pow(h, 0.5));
  if (d.y < 0.0) col = hor * (1.0 + d.y * 0.6);
  float mu = max(dot(d, lightDir), 0.0);
  col += glowCol * (pow(mu, glowPow) * glowAmt + pow(mu, 8.0) * glowAmt * 0.15);
  gl_FragColor = vec4(col, 1.0);
}`;

const domeFrag = /* glsl */`
uniform samplerCube skyMap;
uniform vec3 sunDir, avgHorizon, zenith, sunCol, tint;
uniform float cov, cloudBright, cloudShade, cirrus, stars, milky, nebula, space;
uniform vec3 moonDir; uniform float moonSize, moonBright;
uniform vec3 planetDir; uniform float planetSize, planetBright; uniform vec3 planetA, planetB, ringN;
varying vec3 vDir;
${NOISE_GLSL}
vec3 horizonAt(vec3 d) {
  vec3 hd = normalize(vec3(d.x, 0.0, d.z) + vec3(0.0, 0.04, 0.0));
  return mix(avgHorizon, textureCube(skyMap, hd).rgb, clamp(length(d.xz) * 3.0, 0.0, 1.0));
}
vec3 starField(vec3 d) {
  vec2 sc = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
  vec3 acc = vec3(0.0);
  for (int l = 0; l < 2; l++) {
    float k = l == 0 ? 85.0 : 170.0;
    vec2 g = sc * k; vec2 cell = floor(g); vec2 f = fract(g);
    float r = hash(cell + float(l) * 17.0);
    if (r > 0.93) {
      vec2 c = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 0.6 + 0.2;
      float b = pow(hash(cell + 11.3), 5.0) * 4.0 + 0.2;
      vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash(cell + 5.0));
      acc += tint * b * smoothstep(0.16, 0.0, length(f - c));
    }
  }
  return acc;
}
void main() {
  vec3 d = normalize(vDir);
  vec3 base = textureCube(skyMap, d).rgb;
  vec3 col = base;
  vec3 horizon = horizonAt(d);
  float hl = lum(horizon);
  vec3 white = mix(vec3(hl), horizon, 0.3);
  float above = space > 0.5 ? 1.0 : smoothstep(-0.02, 0.05, d.y);
  float dark = clamp(1.0 - lum(base) * 6.0, 0.0, 1.0); // celestial objects only show in a dark sky

  // stars + Milky Way
  if (stars > 0.0) col += starField(d) * stars * dark * above * 0.16;
  if (milky > 0.0) {
    vec3 mwN = normalize(vec3(0.35, 0.5, 0.79));
    float bd = dot(d, mwN);
    float band = exp(-bd * bd / 0.025);
    vec2 mp = vec2(atan(d.z, d.x) * 4.0, bd * 14.0);
    float neb = fbm(mp * 1.5 + 3.0);
    float dust = smoothstep(0.45, 0.72, fbm(mp * 3.0 + 9.0));
    vec3 mw = mix(vec3(0.45, 0.5, 0.85), vec3(0.95, 0.75, 0.85), neb) * band * neb * (1.0 - dust * 0.85);
    col += mw * milky * dark * above * 0.035;
    col += starField(d * 1.7 + 0.3) * band * milky * dark * above * 0.03;
  }

  // nebula clouds
  if (nebula > 0.0) {
    vec2 sc = vec2(atan(d.z, d.x) * 1.6, d.y * 2.6);
    float n1 = fbm(sc * 1.4 + 7.0);
    float n2 = fbm(sc * 2.7 - 3.0);
    float neb = smoothstep(0.42, 0.85, n1);
    vec3 nc = mix(vec3(0.55, 0.12, 0.75), vec3(0.1, 0.55, 0.8), n2);
    nc = mix(nc, vec3(1.0, 0.35, 0.45), smoothstep(0.6, 0.85, fbm(sc * 4.0 + 1.0)) * 0.6);
    col += nc * neb * nebula * 0.09 * (0.6 + 0.4 * n2);
  }

  // ringed planet
  if (planetSize > 0.0) {
    float Rp = sin(planetSize);
    vec3 Pc = planetDir;
    float b = dot(d, Pc), c = dot(Pc, Pc) - Rp * Rp, disc = b * b - c;
    float ts = disc > 0.0 ? b - sqrt(disc) : 1e9;
    float dn = dot(d, ringN);
    float tr = abs(dn) > 1e-4 ? dot(Pc, ringN) / dn : -1.0;
    float rr = tr > 0.0 ? length(d * tr - Pc) / Rp : 0.0;
    float ringA = 0.0; vec3 ringCol = vec3(0.0);
    if (rr > 1.3 && rr < 2.5) {
      float bands = 0.55 + 0.45 * sin(rr * 38.0) * sin(rr * 11.0 + 1.0);
      ringA = smoothstep(1.3, 1.45, rr) * smoothstep(2.5, 2.2, rr) * bands * 0.85;
      ringCol = mix(planetA, vec3(0.95, 0.9, 0.8), 0.5) * planetBright * (0.7 + 0.3 * bands);
    }
    vec3 planetCol = vec3(0.0); float pA = 0.0;
    if (ts < 1e8) {
      vec3 n = normalize(d * ts - Pc);
      float lat = dot(n, ringN);
      float bandN = fbm(vec2(lat * 9.0, lat * 2.0 + dot(n, sunDir)));
      vec3 surf = mix(planetA, planetB, bandN);
      float diff = max(dot(n, sunDir), 0.0);
      float rim = pow(1.0 - max(dot(n, -d), 0.0), 3.0);
      planetCol = surf * planetBright * (diff * 1.1 + 0.18) + vec3(0.5, 0.6, 1.0) * rim * planetBright * 0.6;
      pA = smoothstep(0.0, 0.002, disc);
    }
    if (ringA > 0.0 && tr > ts) { col = mix(col, ringCol, ringA); col = mix(col, planetCol, pA); }
    else { col = mix(col, planetCol, pA); col = mix(col, ringCol, ringA); }
  }

  // moon
  if (moonSize > 0.0) {
    float mc = dot(d, moonDir);
    float ang = acos(clamp(mc, -1.0, 1.0));
    vec3 t1 = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)));
    vec3 t2 = cross(t1, moonDir);
    vec2 q = vec2(dot(d, t1), dot(d, t2)) / sin(moonSize);
    float r = length(q);
    col += vec3(0.6, 0.7, 1.0) * moonBright * 0.06 * exp(-ang * 14.0) * above;
    if (r < 1.0 && mc > 0.0) {
      vec3 n = t1 * q.x + t2 * q.y - moonDir * sqrt(1.0 - r * r);
      vec3 L = normalize(-moonDir + t1 * 0.55 + vec3(0.0, 0.25, 0.0));
      float shade = max(dot(n, L), 0.0) * 0.95 + 0.03;
      float maria = smoothstep(0.42, 0.62, fbm(q * 2.2 + 5.0));
      float craters = fbm(q * 9.0);
      vec3 mcol = vec3(0.92, 0.92, 0.88) * (1.0 - maria * 0.35) * (0.8 + 0.3 * craters);
      col = mix(col, mcol * shade * moonBright, smoothstep(1.0, 0.985, r));
    }
  }

  // clouds
  float mu = dot(d, sunDir);
  float ph = hg(mu, 0.6) * 4.0;
  if (d.y > 0.0) {
    float t = 1.0 / (d.y + 0.04);
    vec2 p = d.xz * t * 1.6 + vec2(17.0, 3.0);
    float n = fbm(p);
    float dens = smoothstep(cov, cov + 0.28, n);
    float ns = fbm(p + sunDir.xz * 0.35);
    float light = clamp(0.6 + (n - ns) * 3.5, 0.0, 1.0);
    vec3 lit = white * 1.35 * cloudBright * tint + sunCol * (0.25 + ph * 0.6);
    vec3 shade = mix(zenith, white, 0.55) * 0.62 * cloudShade * mix(tint, vec3(1.0), 0.5);
    vec3 cc = mix(shade, lit, light);
    cc += sunCol * ph * (1.0 - dens) * 0.6;
    cc = mix(horizon * 1.05, cc, smoothstep(0.0, 0.25, d.y));
    col = mix(col, cc, dens * smoothstep(0.0, 0.06, d.y) * 0.97);
    if (cirrus > 0.0) {
      vec2 q = d.xz * (1.0 / (d.y + 0.08)) * 0.5;
      q = mat2(0.8, 0.6, -0.6, 0.8) * q;
      float ci = fbm(vec2(q.x * 0.5, q.y * 3.0) + 40.0);
      float cd = smoothstep(0.55, 0.85, ci) * 0.5 * cirrus * smoothstep(0.03, 0.35, d.y) * (1.0 - dens);
      col = mix(col, white * 1.5 * cloudBright * tint + sunCol * ph * 0.3, cd);
    }
  } else if (space < 0.5) {
    col = mix(horizon, white * 1.05 * tint, smoothstep(0.0, -0.08, d.y));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const probeFrag = /* glsl */`
uniform samplerCube skyMap;
uniform vec3 sunDir;
void main() {
  float i = floor(gl_FragCoord.x);
  vec3 d;
  if (i < 0.5) d = normalize(vec3(-sunDir.x, 0.03, -sunDir.z));
  else if (i < 1.5) d = normalize(vec3(sunDir.x, 0.1, sunDir.z));
  else if (i < 2.5) d = normalize(vec3(sunDir.z, 0.03, -sunDir.x));
  else d = vec3(0.0, 1.0, 0.0);
  gl_FragColor = vec4(textureCube(skyMap, d).rgb, 1.0);
}`;

function acesToDisplay(c, exposure) {
  const v = [c.r, c.g, c.b].map((x) => x * exposure / 0.6);
  const i = [
    0.59719 * v[0] + 0.35458 * v[1] + 0.04823 * v[2],
    0.07600 * v[0] + 0.90834 * v[1] + 0.01566 * v[2],
    0.02840 * v[0] + 0.13383 * v[1] + 0.83777 * v[2],
  ].map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081));
  const o = [
    1.60475 * i[0] - 0.53108 * i[1] - 0.07367 * i[2],
    -0.10208 * i[0] + 1.10813 * i[1] - 0.00605 * i[2],
    -0.00327 * i[0] - 0.07276 * i[1] + 1.07602 * i[2],
  ].map((x) => Math.min(1, Math.max(0, x)));
  const enc = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  return new THREE.Color(enc(o[0]), enc(o[1]), enc(o[2])); // fog mixes post-encoding, so store raw
}

export function dirFrom(elevDeg, azDeg) {
  return new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevDeg), THREE.MathUtils.degToRad(azDeg));
}

const vtx = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

// sky: {
//   mode: 'physical' | 'gradient', light: {elev, az},
//   turbidity, rayleigh, mie, mieG,                       (physical)
//   zen, hor, glow, glowPow, glowAmt,                      (gradient, colours as [r,g,b] linear)
//   cov, cloudBright, cloudShade, cirrus, stars, milky,
//   moon: {elev, az, size, bright}, planet: {elev, az, size, bright, a, b, tilt}
// }
export function bakeSky(renderer, sky, exposure) {
  const lightDir = dirFrom(sky.light.elev, sky.light.az);
  const col3 = (a) => new THREE.Color(a[0], a[1], a[2]);

  // ---- pass 1: atmosphere
  const s1 = new THREE.Scene();
  let disposeS1;
  if (sky.mode === 'gradient') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(500, 64, 32), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, vertexShader: vtx, fragmentShader: gradientFrag,
      uniforms: {
        zen: { value: col3(sky.zen) }, hor: { value: col3(sky.hor) }, glowCol: { value: col3(sky.glow || [0, 0, 0]) },
        lightDir: { value: lightDir }, glowPow: { value: sky.glowPow ?? 40 }, glowAmt: { value: sky.glowAmt ?? 0 },
      },
    }));
    s1.add(m);
    disposeS1 = () => { m.geometry.dispose(); m.material.dispose(); };
  } else {
    const s = new Sky();
    s.scale.setScalar(50000);
    const u = s.material.uniforms;
    u.turbidity.value = sky.turbidity ?? 3.2;
    u.rayleigh.value = sky.rayleigh ?? 1.25;
    u.mieCoefficient.value = sky.mie ?? 0.004;
    u.mieDirectionalG.value = sky.mieG ?? 0.82;
    u.sunPosition.value.copy(lightDir);
    s1.add(s);
    disposeS1 = () => { s.geometry.dispose(); s.material.dispose(); };
  }
  const rtSky = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 200000, rtSky).update(renderer, s1);
  disposeS1();

  // ---- probe key colours (linear HDR)
  const colors = { awayH: new THREE.Color(0.5, 0.6, 0.8), sunH: new THREE.Color(1, 0.9, 0.7), perpH: new THREE.Color(0.6, 0.7, 0.85), zenith: new THREE.Color(0.2, 0.35, 0.7) };
  try {
    const rt = new THREE.WebGLRenderTarget(4, 1, { type: THREE.FloatType });
    const ps = new THREE.Scene();
    const pm = new THREE.ShaderMaterial({
      uniforms: { skyMap: { value: rtSky.texture }, sunDir: { value: lightDir } },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: probeFrag,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pm);
    quad.frustumCulled = false; ps.add(quad);
    renderer.setRenderTarget(rt);
    renderer.render(ps, new THREE.Camera());
    const buf = new Float32Array(16);
    renderer.readRenderTargetPixels(rt, 0, 0, 4, 1, buf);
    renderer.setRenderTarget(null);
    if (buf.every((x) => Number.isFinite(x)) && buf[0] + buf[1] + buf[2] > 0) {
      colors.awayH.setRGB(buf[0], buf[1], buf[2]);
      colors.sunH.setRGB(buf[4], buf[5], buf[6]);
      colors.perpH.setRGB(buf[8], buf[9], buf[10]);
      colors.zenith.setRGB(buf[12], buf[13], buf[14]);
    }
    rt.dispose(); pm.dispose(); quad.geometry.dispose();
  } catch (e) { console.warn('Sky probe failed, using defaults', e); }
  const avgHorizon = new THREE.Color().copy(colors.awayH).add(colors.sunH).add(colors.perpH).add(colors.perpH).multiplyScalar(0.25);

  // ---- pass 2: bodies + clouds
  const moon = sky.moon, planet = sky.planet;
  const tint = sky.tint ? col3(sky.tint) : new THREE.Color(1, 1, 1);
  const ringN = new THREE.Vector3(0, 1, 0);
  if (planet) ringN.applyAxisAngle(new THREE.Vector3(1, 0, 0), planet.tilt ?? 0.45).applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.3).normalize();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 96, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, vertexShader: vtx, fragmentShader: domeFrag,
    uniforms: {
      skyMap: { value: rtSky.texture }, sunDir: { value: lightDir },
      avgHorizon: { value: avgHorizon }, zenith: { value: colors.zenith }, sunCol: { value: colors.sunH },
      tint: { value: tint }, cov: { value: sky.cov ?? 0.52 }, cloudBright: { value: sky.cloudBright ?? 1 }, cloudShade: { value: sky.cloudShade ?? 1 },
      cirrus: { value: sky.cirrus ?? 1 }, stars: { value: sky.stars ?? 0 }, milky: { value: sky.milky ?? 0 }, nebula: { value: sky.nebula ?? 0 }, space: { value: sky.space ? 1 : 0 },
      moonDir: { value: moon ? dirFrom(moon.elev, moon.az) : new THREE.Vector3(0, 1, 0) },
      moonSize: { value: moon ? THREE.MathUtils.degToRad(moon.size) : 0 }, moonBright: { value: moon ? moon.bright : 0 },
      planetDir: { value: planet ? dirFrom(planet.elev, planet.az) : new THREE.Vector3(0, 1, 0) },
      planetSize: { value: planet ? THREE.MathUtils.degToRad(planet.size) : 0 }, planetBright: { value: planet ? planet.bright : 0 },
      planetA: { value: planet ? col3(planet.a) : new THREE.Color() }, planetB: { value: planet ? col3(planet.b) : new THREE.Color() },
      ringN: { value: ringN },
    },
  }));
  const s2 = new THREE.Scene(); s2.add(dome);
  const rtFinal = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 2000, rtFinal).update(renderer, s2);
  dome.geometry.dispose(); dome.material.dispose();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(rtFinal.texture);
  pmrem.dispose();

  const l = 0.2126 * avgHorizon.r + 0.7152 * avgHorizon.g + 0.0722 * avgHorizon.b;
  const white = new THREE.Color(l, l, l).lerp(avgHorizon, 0.3);
  return {
    sunDir: lightDir,
    skyMap: rtSky.texture, background: rtFinal.texture, envMap: env.texture,
    avgHorizon, white, zenith: colors.zenith, sunCol: colors.sunH, tint,
    fogColor: acesToDisplay(avgHorizon, exposure),
    dispose() { rtSky.dispose(); rtFinal.dispose(); env.dispose(); },
  };
}
