// Realistic sky: physically based atmospheric scattering (three's Sky shader) plus
// procedural cumulus + cirrus, baked ONCE into an HDR cubemap. Rendering the
// background then costs a single cube lookup, which keeps Quest at full frame rate.
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
`;

const cloudDomeFrag = /* glsl */`
uniform samplerCube skyMap;
uniform vec3 sunDir;
uniform vec3 avgHorizon;
uniform vec3 zenith;
uniform vec3 sunCol;
varying vec3 vDir;
${NOISE_GLSL}
vec3 horizonAt(vec3 d) {
  vec3 hd = normalize(vec3(d.x, 0.0, d.z) + vec3(0.0, 0.04, 0.0));
  return mix(avgHorizon, textureCube(skyMap, hd).rgb, clamp(length(d.xz) * 3.0, 0.0, 1.0));
}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = textureCube(skyMap, d).rgb;
  vec3 horizon = horizonAt(d);
  float lum = dot(horizon, vec3(0.2126, 0.7152, 0.0722));
  vec3 white = mix(vec3(lum), horizon, 0.3);
  float mu = dot(d, sunDir);
  float ph = hg(mu, 0.6) * 4.0;
  if (d.y > 0.0) {
    // Cumulus: a flat layer seen in perspective.
    float t = 1.0 / (d.y + 0.04);
    vec2 p = d.xz * t * 1.6 + vec2(17.0, 3.0);
    float n = fbm(p);
    float dens = smoothstep(0.52, 0.80, n);
    float ns = fbm(p + sunDir.xz * 0.35);
    float light = clamp(0.6 + (n - ns) * 3.5, 0.0, 1.0);
    vec3 lit = white * 1.35 + sunCol * (0.25 + ph * 0.6);
    vec3 shade = mix(zenith, white, 0.55) * 0.62;
    vec3 cc = mix(shade, lit, light);
    cc += sunCol * ph * (1.0 - dens) * 0.6;           // silver lining
    cc = mix(horizon * 1.05, cc, smoothstep(0.0, 0.25, d.y)); // aerial perspective
    col = mix(col, cc, dens * smoothstep(0.0, 0.06, d.y) * 0.97);
    // Cirrus: high, streaky and thin.
    vec2 q = d.xz * (1.0 / (d.y + 0.08)) * 0.5;
    q = mat2(0.8, 0.6, -0.6, 0.8) * q;
    float ci = fbm(vec2(q.x * 0.5, q.y * 3.0) + 40.0);
    float cd = smoothstep(0.55, 0.85, ci) * 0.5 * smoothstep(0.03, 0.35, d.y) * (1.0 - dens);
    col = mix(col, white * 1.5 + sunCol * ph * 0.3, cd);
  } else {
    // Below the horizon: the distant sea of clouds, matched by the cloud-sea mesh.
    col = mix(horizon, white * 1.05, smoothstep(0.0, -0.08, d.y));
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

// JS copy of three's ACES fitted curve so the fog colour matches the rendered horizon.
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
  // Fog is mixed after the colour-space conversion, so store the encoded values raw.
  return new THREE.Color(enc(o[0]), enc(o[1]), enc(o[2]));
}

export function bakeSky(renderer, sunDir, exposure) {
  // Pass 1: atmosphere only.
  const skyScene = new THREE.Scene();
  const sky = new Sky();
  sky.scale.setScalar(50000);
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2;
  u.rayleigh.value = 1.25;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.82;
  u.sunPosition.value.copy(sunDir);
  skyScene.add(sky);
  const rtSky = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 200000, rtSky).update(renderer, skyScene);

  // Probe a few key sky colours (linear HDR) for clouds and fog.
  const colors = { awayH: new THREE.Color(0.5, 0.6, 0.8), sunH: new THREE.Color(1, 0.9, 0.7), perpH: new THREE.Color(0.6, 0.7, 0.85), zenith: new THREE.Color(0.2, 0.35, 0.7) };
  try {
    const rt = new THREE.WebGLRenderTarget(4, 1, { type: THREE.FloatType });
    const ps = new THREE.Scene();
    const pm = new THREE.ShaderMaterial({
      uniforms: { skyMap: { value: rtSky.texture }, sunDir: { value: sunDir } },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: probeFrag,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pm);
    quad.frustumCulled = false;
    ps.add(quad);
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
    rt.dispose(); pm.dispose();
  } catch (e) {
    console.warn('Sky probe failed, using defaults', e);
  }
  const avgHorizon = new THREE.Color().copy(colors.awayH).add(colors.sunH).add(colors.perpH).add(colors.perpH).multiplyScalar(0.25);

  // Pass 2: composite clouds over the atmosphere.
  const cloudScene = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(500, 96, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        skyMap: { value: rtSky.texture }, sunDir: { value: sunDir },
        avgHorizon: { value: avgHorizon }, zenith: { value: colors.zenith }, sunCol: { value: colors.sunH },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: cloudDomeFrag,
    }),
  );
  cloudScene.add(dome);
  const rtFinal = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 2000, rtFinal).update(renderer, cloudScene);
  dome.geometry.dispose(); dome.material.dispose();
  sky.geometry.dispose(); sky.material.dispose();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(rtFinal.texture);
  pmrem.dispose();

  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const white = new THREE.Color(lum(avgHorizon), lum(avgHorizon), lum(avgHorizon)).lerp(avgHorizon, 0.3);

  return {
    sunDir,
    skyMap: rtSky.texture,     // pure atmosphere (linear HDR)
    background: rtFinal.texture, // atmosphere + clouds (linear HDR)
    envMap: env.texture,
    avgHorizon, white,
    zenith: colors.zenith, sunCol: colors.sunH,
    fogColor: acesToDisplay(avgHorizon, exposure),
  };
}
