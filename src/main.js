import * as THREE from 'three';
import { bakeSky } from './sky.js';
import { createCloudSea, createCloudBillboards, createIslands } from './scenery.js';
import { makeTextures } from './textures.js';
import { buildCourse } from './course.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { XRControls } from './xr.js';
import { Hud, fmtTime } from './hud.js';
import { SFX } from './audio.js';

const EXPOSURE = 0.5;
const EYE = 1.62;
const FADE_Y = -10;
const SUN_ELEVATION = 21, SUN_AZIMUTH = -62;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = EXPOSURE;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 20000);
const rig = new THREE.Group();
rig.add(camera); scene.add(rig);
camera.position.set(0, EYE, 0);

const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - SUN_ELEVATION), THREE.MathUtils.degToRad(SUN_AZIMUTH));
const sky = bakeSky(renderer, sunDir, EXPOSURE);
scene.background = sky.background;
scene.environment = sky.envMap;
scene.environmentIntensity = 0.9;
scene.fog = new THREE.FogExp2(sky.fogColor, 0.0009);

const sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 300;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const tex = makeTextures();
const sfx = new SFX();
const world = buildCourse(scene, tex, sfx);
const seaMat = createCloudSea(scene, sky);
createCloudBillboards(scene, sky);
createIslands(scene);

const hud = new Hud(camera);
const input = new Input(renderer.domElement);
const xr = new XRControls(renderer, rig);
const player = new Player(world, sfx);

// ---------- confetti ----------
const CONF = 500;
const confGeo = new THREE.BufferGeometry();
const confPos = new Float32Array(CONF * 3), confVel = new Float32Array(CONF * 3), confCol = new Float32Array(CONF * 3);
const palette = [0xffcf4a, 0xff5a4a, 0x59d6ff, 0x3ddc5a, 0xffffff, 0xff7ad9].map((c) => new THREE.Color(c));
for (let i = 0; i < CONF; i++) { const c = palette[i % palette.length]; confCol.set([c.r, c.g, c.b], i * 3); }
confGeo.setAttribute('position', new THREE.BufferAttribute(confPos, 3));
confGeo.setAttribute('color', new THREE.BufferAttribute(confCol, 3));
const confetti = new THREE.Points(confGeo, new THREE.PointsMaterial({ size: 0.18, vertexColors: true, toneMapped: false }));
confetti.visible = false; confetti.frustumCulled = false;
scene.add(confetti);
function burstConfetti() {
  const c = world.finishPos;
  for (let i = 0; i < CONF; i++) {
    confPos.set([c.x + (Math.random() - 0.5) * 2, c.y + 4 + Math.random() * 2, c.z + (Math.random() - 0.5) * 2], i * 3);
    const a = Math.random() * 6.28, s = 3 + Math.random() * 7;
    confVel.set([Math.cos(a) * s, 6 + Math.random() * 10, Math.sin(a) * s], i * 3);
  }
  confetti.visible = true;
}
function updateConfetti(dt) {
  if (!confetti.visible) return;
  for (let i = 0; i < CONF; i++) {
    confVel[i * 3 + 1] -= 9 * dt;
    for (let k = 0; k < 3; k++) confVel[i * 3 + k] *= 1 - 1.2 * dt;
    for (let k = 0; k < 3; k++) confPos[i * 3 + k] += confVel[i * 3 + k] * dt;
  }
  confGeo.attributes.position.needsUpdate = true;
}

// ---------- game state ----------
let state = 'menu'; // menu | play | dead | won
let paused = false;
let gameTime = 0, runTime = 0, deaths = 0, cpIndex = 0;
let deadT = 0, fadeIn = 0;
let viewYaw = 0, pitch = 0, rigYaw = 0;
const headOff = new THREE.Vector3(), prevHeadOff = new THREE.Vector3();
let xrFresh = true;

function cpTotal() { return world.checkpoints.length - 1; }
function updateStats() { hud.set('stats', `☠ ${deaths}   ⚑ ${cpIndex}/${cpTotal()}`); }

function respawn() {
  const cp = world.checkpoints[cpIndex];
  player.reset(cp.pos);
  viewYaw = cp.yaw; pitch = 0;
  rigYaw = cp.yaw;
  xrFresh = true;
  world.resetCrumbles();
}

function restartRun() {
  cpIndex = 0; deaths = 0; runTime = 0;
  for (const cp of world.checkpoints) cp.deactivate();
  confetti.visible = false;
  hud.clearBanner();
  respawn();
  state = 'play';
  updateStats();
}

respawn();
updateStats();

// ---------- menu / sessions ----------
const ui = {
  loading: document.getElementById('loading'), menu: document.getElementById('menu'),
  play: document.getElementById('playBtn'), vr: document.getElementById('vrBtn'), restart: document.getElementById('restartBtn'),
  sub: document.getElementById('menuSub'), vrnote: document.getElementById('vrnote'),
};
ui.loading.classList.add('hidden');
ui.menu.classList.remove('hidden');

function showMenu(pausedText) {
  ui.menu.classList.remove('hidden');
  if (pausedText) { ui.sub.textContent = pausedText; ui.play.textContent = 'RESUME'; ui.restart.classList.remove('hidden'); }
  hud.show(false);
}
function hideMenu() { ui.menu.classList.add('hidden'); hud.show(true); }

ui.play.addEventListener('click', () => {
  sfx.init();
  input.lock();
});
ui.restart.addEventListener('click', () => { sfx.init(); restartRun(); input.lock(); });
input.onLockChange = (locked) => {
  if (renderer.xr.isPresenting) return;
  if (locked) {
    if (state === 'menu') { state = 'play'; hud.banner('GO!', 'Reach the finish', '#ffcf4a', 1.5); }
    paused = false; hideMenu();
  } else if (state !== 'menu') {
    paused = true; showMenu('Paused');
  }
};

let xrSession = null;
async function setupVR() {
  if (!('xr' in navigator)) { ui.vrnote.textContent = 'WebXR not available in this browser. Open this page in the Meta Quest Browser to play in VR (HTTPS required).'; return; }
  let ok = false;
  try { ok = await navigator.xr.isSessionSupported('immersive-vr'); } catch { ok = false; }
  if (!ok) { ui.vrnote.textContent = 'No VR headset detected. On Meta Quest, open this page in the Quest Browser and press ENTER VR.'; return; }
  ui.vr.disabled = false;
  ui.vrnote.textContent = 'Headset detected. Press ENTER VR, then use your controllers.';
  ui.vr.addEventListener('click', async () => {
    sfx.init();
    if (xrSession) { xrSession.end(); return; }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      xrSession = session;
      session.addEventListener('end', () => { xrSession = null; });
      await renderer.xr.setSession(session);
    } catch (e) { ui.vrnote.textContent = 'Could not start VR: ' + e.message; }
  });
}
setupVR();

renderer.xr.addEventListener('sessionstart', () => {
  if (document.pointerLockElement) document.exitPointerLock();
  hud.setXR(true); hideMenu();
  if (state === 'menu') { state = 'play'; hud.banner('GO!', 'Reach the finish', '#ffcf4a', 1.5); }
  paused = false; xrFresh = true; rigYaw = viewYaw;
});
renderer.xr.addEventListener('sessionend', () => {
  hud.setXR(false);
  camera.position.set(0, EYE, 0); camera.rotation.set(0, 0, 0); camera.quaternion.identity();
  viewYaw = rigYaw; pitch = 0;
  paused = true; showMenu('Paused');
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- main loop ----------
const clock = new THREE.Clock();
const fwdTmp = new THREE.Vector3(), q = new THREE.Quaternion();
const deskHand = { pos: new THREE.Vector3(), rel: new THREE.Vector3(0, 1.95, 0), vel: new THREE.Vector3(), held: false, pressed: false, range: 1.8, desktop: true };
const vrHands = [0, 1].map(() => ({ pos: new THREE.Vector3(), rel: new THREE.Vector3(), vel: new THREE.Vector3(), held: false, pressed: false, range: 0.5, desktop: false }));

function rotY(v, yaw, out) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return out.set(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

function placeRig(inXR) {
  if (inXR) {
    rig.position.set(player.pos.x - headOff.x, player.pos.y, player.pos.z - headOff.z);
    rig.rotation.set(0, rigYaw, 0);
  } else {
    rig.position.copy(player.pos);
    rig.rotation.set(0, viewYaw, 0);
    camera.position.set(0, EYE, 0);
    camera.rotation.set(pitch, 0, 0);
  }
  rig.updateMatrixWorld(true);
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const inXR = renderer.xr.isPresenting;
  const playing = (state === 'play' || state === 'won') && !paused;
  const dsk = input.read();

  if (!paused) { gameTime += dt; world.update(gameTime, dt); }

  if (playing) {
    let inp;
    if (inXR) {
      const xi = xr.poll(dt);
      // physical head movement inside the play space moves the body
      rotY(camera.position, rigYaw, headOff); headOff.y = 0;
      if (!xrFresh && !player.hang) player.pos.add(fwdTmp.subVectors(headOff, prevHeadOff));
      xrFresh = false;
      if (xi.turn) { rigYaw -= xi.turn * Math.PI / 6; rotY(camera.position, rigYaw, headOff); headOff.y = 0; }
      prevHeadOff.copy(headOff);
      placeRig(true);
      // head yaw for locomotion direction
      camera.getWorldQuaternion(q);
      fwdTmp.set(0, 0, -1).applyQuaternion(q);
      const headYaw = Math.atan2(-fwdTmp.x, -fwdTmp.z);
      xr.hands.forEach((h, i) => {
        const H = vrHands[i];
        h.grip.getWorldPosition(H.pos);
        H.rel.subVectors(H.pos, player.pos);
        rotY(h.velLocal, rigYaw, H.vel);
        H.held = h.held && !!h.source; H.pressed = h.pressed;
      });
      inp = { move: xi.move, yaw: headYaw, jump: xi.jump, hands: vrHands };
      if (xi.respawn) { if (state === 'won') restartRun(); else respawn(); }
    } else {
      viewYaw -= dsk.lookX * 0.0022;
      pitch = Math.max(-1.5, Math.min(1.5, pitch - dsk.lookY * 0.0022));
      deskHand.pos.set(player.pos.x - Math.sin(viewYaw) * 0.4, player.pos.y + 1.6, player.pos.z - Math.cos(viewYaw) * 0.4);
      deskHand.held = dsk.grab; deskHand.pressed = dsk.grabPressed;
      inp = { move: dsk.move, yaw: viewYaw, jump: dsk.jump, hands: [deskHand] };
      if (dsk.respawn) { if (state === 'won') restartRun(); else respawn(); }
    }

    const wasHang = player.hang;
    player.update(dt, inp);
    if (!inXR) viewYaw += player.yawDelta;
    if (inXR && player.hang && !wasHang) xr.pulse(player.hang.hand, 0.6, 50);
    if (inXR) xr.hands.forEach((h, i) => { h.glow.material.opacity = player.hang && player.hang.hand === i ? 0.9 : 0; });

    // checkpoints
    for (let i = cpIndex + 1; i < world.checkpoints.length; i++) {
      const cp = world.checkpoints[i];
      const dx = player.pos.x - cp.pos.x, dz = player.pos.z - cp.pos.z, dy = player.pos.y - cp.pos.y;
      if (dx * dx + dz * dz < 4 * 4 && Math.abs(dy) < 2.5) {
        for (let k = cpIndex + 1; k <= i; k++) world.checkpoints[k].activate();
        cpIndex = i; sfx.checkpoint();
        hud.banner('CHECKPOINT', `${i} / ${cpTotal()}`, '#3ddc5a', 2);
        updateStats();
      }
    }

    // finish
    if (state === 'play' && player.onGround && player.ground === world.finishCol) {
      state = 'won'; sfx.win(); burstConfetti();
      hud.banner('YOU MADE IT!', `Time ${fmtTime(runTime)}  ·  Deaths ${deaths}  ·  ${inXR ? 'B' : 'R'} to run again`, '#ffcf4a', 0);
    }

    // death
    if (state === 'play' && player.pos.y < world.killY) {
      state = 'dead'; deadT = 0; deaths++; updateStats();
      sfx.death();
      hud.banner('YOU FELL TO YOUR DEATH', 'Respawning at checkpoint…', '#ff4a3a', 0);
    }

    if (state === 'play') runTime += dt;
    hud.set('hint', player.hang
      ? (inXR ? 'A / X to launch  ·  let go to drop' : 'SPACE to launch  ·  release E to drop')
      : player.grabInRange ? (inXR ? 'Squeeze grip to grab' : 'Hold E / mouse to grab') : '');
    sfx.setWind(player.vel.length());
  } else if (state === 'dead' && !paused) {
    deadT += dt;
    if (inXR) xr.poll(dt);
    if (deadT > 2.0) {
      respawn(); state = 'play'; fadeIn = 1; hud.clearBanner();
      if (inXR) { rotY(camera.position, rigYaw, headOff); headOff.y = 0; prevHeadOff.copy(headOff); }
    }
    sfx.setWind(0);
  }

  // camera / rig placement
  if (inXR) { rotY(camera.position, rigYaw, headOff); headOff.y = 0; }
  placeRig(inXR);

  // fade: falling → black, then fade back in after respawn
  let fade = 0;
  if (state === 'dead') fade = Math.min(1, 0.85 + deadT);
  else if (state === 'play') fade = Math.max(0, Math.min(0.85, (FADE_Y - player.pos.y) / (FADE_Y - world.killY) * 0.85));
  if (fadeIn > 0) { fadeIn = Math.max(0, fadeIn - dt * 1.6); fade = Math.max(fade, fadeIn); }
  hud.fade(fade);

  hud.set('time', fmtTime(runTime));
  hud.update(dt, player.grabInRange && !inXR);
  updateConfetti(dt);

  // sun shadow follows the player
  sun.target.position.copy(player.pos);
  sun.position.copy(player.pos).addScaledVector(sunDir, 120);
  seaMat.uniforms.time.value = gameTime;

  renderer.render(scene, camera);
});

// Debug hook (handy from the browser console): __sky.tp(z) teleports to the platform nearest z.
window.__sky = {
  player, world, camera, input,
  look(y, p) { viewYaw = y; pitch = p; },
  tp(x, y, z) { player.reset(new THREE.Vector3(x, y, z)); },
  get state() { return state; },
};
