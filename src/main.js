import * as THREE from 'three';
import { bakeSky } from './sky.js';
import { createCloudSea, createCloudBillboards, createIslands, ROCK_PALETTES } from './scenery.js';
import { createRain, createLightning, createAurora, createBirds, createFireworks, createSnow, createEmbers, createDrift } from './effects.js';
import { makeTextures } from './textures.js';
import { World } from './world.js';
import { Builder } from './builder.js';
import './obstacles.js';
import { LEVELS } from './levels/index.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { XRControls } from './xr.js';
import { Hud, fmtTime } from './hud.js';
import { SFX } from './audio.js';

const EYE = 1.62;
const STORE = 'skyparkour.v2';

// ---------- renderer / persistent scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 300;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0);
const flashLight = new THREE.HemisphereLight(0xdde6ff, 0x404060, 0);
scene.add(hemi, flashLight);
const sunDir = new THREE.Vector3(0, 1, 0);

const tex = makeTextures();
const sharedTex = new Set(Object.values(tex));
const sfx = new SFX();
const hud = new Hud(camera);
const input = new Input(renderer.domElement);
const xr = new XRControls(renderer, rig);
let world = new World(sfx);
const player = new Player(world, sfx);

// ---------- progress ----------
let progress = { best: {}, done: {} };
try { progress = { best: {}, done: {}, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { /* private mode */ }
function saveProgress() { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch { /* ignore */ } }

// ---------- game state ----------
let state = 'menu'; // menu | play | dead | won
let paused = false;
let gameTime = 0, runTime = 0, deaths = 0, cpIndex = 0, hearts = 3;
let deadT = 0, fadeIn = 0, winT = 0, shake = 0, deathMsg = '';
let viewYaw = 0, pitch = 0, rigYaw = 0;
const headOff = new THREE.Vector3(), prevHeadOff = new THREE.Vector3();
let xrFresh = true;
let levelIndex = 0, L = null, levelGroup = null, sky = null, seaMat = null, fireworks = null;

const isBoss = () => !!world.boss;
const palette = (p) => (typeof p === 'string' ? ROCK_PALETTES[p] : p); // a named palette or an inline one
function cpTotal() { return world.checkpoints.length - 1; }
function updateStats() {
  let s = `☠ ${deaths}   ⚑ ${cpIndex}/${cpTotal()}`;
  if (isBoss() && world.boss.state === 'fight') s += '   ' + '❤'.repeat(Math.max(0, hearts)) + '♡'.repeat(Math.max(0, 3 - hearts));
  hud.set('stats', `${L ? L.name : ''}   ${s}`);
}

function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) for (const k of ['map', 'emissiveMap']) if (m[k] && !sharedTex.has(m[k])) m[k].dispose();
  });
}

function loadLevel(i) {
  if (levelGroup) { scene.remove(levelGroup); disposeGroup(levelGroup); }
  if (sky) sky.dispose();
  levelIndex = i; L = LEVELS[i];
  renderer.toneMappingExposure = L.exposure;
  sky = bakeSky(renderer, L.sky, L.exposure);
  scene.background = sky.background;
  scene.environment = sky.envMap;
  scene.environmentIntensity = L.envIntensity;
  scene.fog = new THREE.FogExp2(sky.fogColor, L.fog);
  sun.color.set(L.light.color); sun.intensity = L.light.intensity;
  sunDir.copy(sky.sunDir);
  if (L.hemi) { hemi.color.set(L.hemi.sky); hemi.groundColor.set(L.hemi.ground); hemi.intensity = L.hemi.intensity; } else hemi.intensity = 0;
  flashLight.intensity = 0;

  levelGroup = new THREE.Group();
  scene.add(levelGroup);
  world = new World(sfx);
  world.killY = L.killY;
  const theme = { ...L.theme, palette: palette(L.theme.palette) };
  const b = new Builder(levelGroup, world, tex, sfx, theme);
  L.build(b);
  const S = L.scenery;
  seaMat = S.sea === false ? null : createCloudSea(levelGroup, sky, S.sea);
  if (S.clouds !== false) createCloudBillboards(levelGroup, sky, S.clouds);
  createIslands(levelGroup, { ...S.islands, palette: palette(S.islands.palette) });
  if (S.rain) world.anim.push(createRain(levelGroup, world));
  if (S.lightning) world.anim.push(createLightning(levelGroup, sfx, flashLight));
  if (S.aurora) world.anim.push(createAurora(levelGroup));
  if (S.snow) world.anim.push(createSnow(levelGroup, world));
  if (S.embers) world.anim.push(createEmbers(levelGroup, world));
  for (const d of S.drift || []) world.anim.push(createDrift(levelGroup, world, d));
  if (S.birds) world.anim.push(createBirds(levelGroup, new THREE.Vector3(0, 8, -150), 26, S.birdColor ?? (L.id === 'canyon' ? 0x2a1a14 : 0x222222)));
  fireworks = createFireworks(levelGroup, sfx);
  world.anim.push(fireworks.update);
  world.player = player;
  player.world = world;
  player.gScale = L.gravity ?? 1;
  restartRun(false);
  renderer.compile(scene, camera);
}

function respawn() {
  const cp = world.checkpoints[cpIndex];
  player.reset(cp.pos);
  viewYaw = cp.yaw; pitch = 0; rigYaw = cp.yaw;
  xrFresh = true;
  world.resetCrumbles();
  hearts = 3;
  if (world.boss) world.boss.reset(deathMsg === 'KNOCKED OUT!');
  deathMsg = '';
  updateStats();
}

function restartRun(play = true) {
  cpIndex = 0; deaths = 0; runTime = 0; winT = 0;
  for (const cp of world.checkpoints) cp.deactivate();
  hud.clearBanner();
  hud.boss(false);
  respawn();
  if (play) state = 'play';
  updateStats();
}

// Restart the current level from the top. The boss level is rebuilt so the King is back at full strength.
function replay() {
  if (isBoss()) { loadLevel(levelIndex); state = 'play'; }
  else restartRun();
}

function nextLevel() {
  const n = (levelIndex + 1) % LEVELS.length;
  selected = n;
  withLoading(() => { loadLevel(n); state = 'play'; hud.banner(LEVELS[n].name.toUpperCase(), LEVELS[n].tagline, '#ffcf4a', 3); renderMenu(); });
}

player.onKnock = () => {
  if (!isBoss() || world.boss.state !== 'fight' || state !== 'play') return;
  hearts--; updateStats();
  if (renderer.xr.isPresenting) { xr.pulse(0, 1, 120); xr.pulse(1, 1, 120); }
  if (hearts <= 0) die('KNOCKED OUT!', `${world.boss.name} wins this round… try again!`);
};

function die(big, small) {
  state = 'dead'; deadT = 0; deaths++;
  deathMsg = big;
  sfx.death();
  hud.banner(big, small, '#ff4a3a', 0);
  updateStats();
}

function win() {
  state = 'won';
  sfx.win();
  fireworks.burst(world.finishPos.clone(), 8, 30);
  const prev = progress.best[L.id];
  const record = !prev || runTime < prev;
  if (record) progress.best[L.id] = runTime;
  progress.done[L.id] = true;
  saveProgress();
  renderMenu();
  const last = levelIndex === LEVELS.length - 1;
  const xrMode = renderer.xr.isPresenting;
  const nextTxt = last ? (xrMode ? 'A: back to level 1' : 'ENTER: back to level 1') : (xrMode ? 'A: next level' : 'ENTER: next level');
  const title = isBoss() ? `YOU DEFEATED ${world.boss.name}!` : 'LEVEL COMPLETE!';
  hud.banner(title, `${fmtTime(runTime)}${record ? ' · NEW BEST' : ''} · ☠ ${deaths} · ${nextTxt} · ${xrMode ? 'B' : 'R'}: replay`, '#ffcf4a', 0);
}

// ---------- menu ----------
const ui = {
  loading: document.getElementById('loading'), menu: document.getElementById('menu'),
  play: document.getElementById('playBtn'), vr: document.getElementById('vrBtn'), restart: document.getElementById('restartBtn'),
  sub: document.getElementById('menuSub'), vrnote: document.getElementById('vrnote'), levels: document.getElementById('levels'),
};
let selected = 0;

function withLoading(fn) {
  ui.loading.textContent = 'Painting the sky…';
  ui.loading.classList.remove('hidden');
  setTimeout(() => { fn(); ui.loading.classList.add('hidden'); }, 30);
}

function renderMenu() {
  ui.levels.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const card = document.createElement('button');
    card.className = 'level' + (i === selected ? ' sel' : '') + (lv.boss ? ' boss' : '');
    const best = progress.best[lv.id];
    card.innerHTML = `<span class="num">${lv.boss ? 'BOSS · LEVEL ' + (i + 1) : 'LEVEL ' + (i + 1)}</span><span class="name">${lv.name}</span><span class="tag">${lv.tagline}</span><span class="best">${progress.done[lv.id] ? '✔ ' : ''}${best ? 'Best ' + fmtTime(best) : 'Not completed'}</span>`;
    card.addEventListener('click', () => {
      if (selected === i && levelIndex === i) return;
      selected = i;
      withLoading(() => { loadLevel(i); state = 'menu'; paused = false; renderMenu(); setMenuMode(); });
    });
    ui.levels.appendChild(card);
  });
}

function setMenuMode() {
  const inRun = state !== 'menu';
  ui.sub.textContent = inRun ? `Paused — ${L.name}` : `Thousands of feet up. ${LEVELS.length} worlds. ${LEVELS.filter((lv) => lv.boss).length} bosses.`;
  ui.play.textContent = inRun ? 'RESUME' : 'PLAY';
  ui.restart.classList.toggle('hidden', !inRun);
}

function showMenu() { ui.menu.classList.remove('hidden'); setMenuMode(); renderMenu(); hud.show(false); }
function hideMenu() { ui.menu.classList.add('hidden'); hud.show(true); }

function startPlaying() {
  if (state === 'menu') { state = 'play'; hud.banner(L.name.toUpperCase(), L.tagline, '#ffcf4a', 3); }
  paused = false; hideMenu();
}

ui.play.addEventListener('click', () => { sfx.init(); input.lock(); });
ui.restart.addEventListener('click', () => { sfx.init(); replay(); input.lock(); });
input.onLockChange = (locked) => {
  if (renderer.xr.isPresenting) return;
  if (locked) startPlaying();
  else if (state !== 'menu') { paused = true; showMenu(); }
};
addEventListener('keydown', (e) => { if (e.code === 'Enter' && state === 'won') nextLevel(); });

let xrSession = null;
async function setupVR() {
  if (!('xr' in navigator)) { ui.vrnote.textContent = 'WebXR not available in this browser. Open this page in the Meta Quest Browser to play in VR (HTTPS required).'; return; }
  let ok = false;
  try { ok = await navigator.xr.isSessionSupported('immersive-vr'); } catch { ok = false; }
  if (!ok) { ui.vrnote.textContent = 'No VR headset detected. On Meta Quest, open this page in the Quest Browser and press ENTER VR.'; return; }
  ui.vr.disabled = false;
  ui.vrnote.textContent = 'Headset detected. Pick a level, press ENTER VR, then use your controllers.';
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
  hud.setXR(true);
  startPlaying();
  xrFresh = true; rigYaw = viewYaw;
});
renderer.xr.addEventListener('sessionend', () => {
  hud.setXR(false);
  camera.position.set(0, EYE, 0); camera.rotation.set(0, 0, 0); camera.quaternion.identity();
  viewYaw = rigYaw; pitch = 0;
  paused = true; showMenu();
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
    camera.position.set((Math.random() - 0.5) * shake * 0.4, EYE + (Math.random() - 0.5) * shake * 0.4, 0);
    camera.rotation.set(pitch, 0, 0);
  }
  rig.updateMatrixWorld(true);
}

function handleEvents() {
  for (const e of world.events) {
    if (e.type === 'shake') shake = Math.max(shake, e.amount);
    else if (e.type === 'bossWake') { hud.boss(true, world.boss.hp / world.boss.maxHp, world.boss.name); hud.banner(`${world.boss.name} AWAKENS!`, `Smash the ${world.boss.maxHp} glowing crystals with parkour!`, '#ff5a8a', 3); updateStats(); }
    else if (e.type === 'bossHit') {
      hud.boss(true, e.hp / e.max);
      if (e.hp > 0) hud.banner('CRYSTAL SMASHED!', `${e.hp} crystal${e.hp > 1 ? 's' : ''} left — he's getting angrier…`, '#7af7ff', 3);
      fireworks.burst(player.pos, 2, 6);
    } else if (e.type === 'bossHeal') {
      hud.boss(true, e.hp / e.max);
      hud.banner(`${world.boss.name} REGAINS A CRYSTAL!`, 'Knock-outs heal him. Stay on your feet!', '#ff5a8a', 3);
    } else if (e.type === 'bossDefeated') {
      hud.boss(false);
      hud.banner(`${world.boss.name} FALLS!`, '', '#ffcf4a', 3);
      fireworks.burst(world.boss.c, 14, 40);
      world.finishPos.copy(world.boss.c);
      winT = 3.2;
    }
  }
  world.events.length = 0;
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const inXR = renderer.xr.isPresenting;
  const playing = (state === 'play' || state === 'won') && !paused;
  const dsk = input.read();

  if (!paused) { gameTime += dt; world.camPos.copy(player.pos); world.update(gameTime, dt); }
  handleEvents();

  if (playing) {
    let inp;
    if (inXR) {
      const xi = xr.poll(dt);
      rotY(camera.position, rigYaw, headOff); headOff.y = 0;
      if (!xrFresh && !player.hang) player.pos.add(fwdTmp.subVectors(headOff, prevHeadOff));
      xrFresh = false;
      if (xi.turn) { rigYaw -= xi.turn * Math.PI / 6; rotY(camera.position, rigYaw, headOff); headOff.y = 0; }
      prevHeadOff.copy(headOff);
      placeRig(true);
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
      if (state === 'won' && xi.jump) { nextLevel(); renderer.render(scene, camera); return; }
      inp = { move: xi.move, yaw: headYaw, jump: xi.jump, hands: vrHands };
      if (xi.respawn) { if (state === 'won') replay(); else respawn(); }
    } else {
      viewYaw -= dsk.lookX * 0.0022;
      pitch = Math.max(-1.5, Math.min(1.5, pitch - dsk.lookY * 0.0022));
      deskHand.pos.set(player.pos.x - Math.sin(viewYaw) * 0.4, player.pos.y + 1.6, player.pos.z - Math.cos(viewYaw) * 0.4);
      deskHand.held = dsk.grab; deskHand.pressed = dsk.grabPressed;
      inp = { move: dsk.move, yaw: viewYaw, jump: dsk.jump, hands: [deskHand] };
      if (dsk.respawn) { if (state === 'won') replay(); else respawn(); }
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

    if (state === 'play' && world.finishCol && player.onGround && player.ground === world.finishCol) win();
    if (state === 'play' && winT > 0) { winT -= dt; if (winT <= 0) win(); }
    if (state === 'play' && player.pos.y < world.killY) die('YOU FELL TO YOUR DEATH', 'Respawning at checkpoint…');

    if (state === 'play') runTime += dt;
    const B = world.boss;
    const bossHint = B && B.state !== 'dead' && B.state !== 'dying' && Math.abs(player.pos.z - B.c.z) < 24 && Math.abs(player.pos.x - B.c.x) < 24 ? B.hint : '';
    hud.set('hint', player.hang
      ? (player.hang.g.kind === 'hold'
        ? (inXR ? 'Pull down to climb · A/X to reach up' : 'SPACE reach up · A/D + SPACE sideways · S + SPACE kick off')
        : (inXR ? 'A / X to launch · let go to drop' : 'SPACE to launch · release E to drop'))
      : player.grabInRange ? (inXR ? 'Squeeze grip to grab' : 'Hold E / mouse to grab') : bossHint);
    sfx.setWind(player.vel.length(), player.sliding);
  } else if (state === 'dead' && !paused) {
    deadT += dt;
    if (inXR) xr.poll(dt);
    if (deadT > 2.0) {
      respawn(); state = 'play'; fadeIn = 1; hud.clearBanner();
      if (isBoss()) hud.boss(world.boss.state !== 'dead', world.boss.hp / world.boss.maxHp, world.boss.name);
      if (inXR) { rotY(camera.position, rigYaw, headOff); headOff.y = 0; prevHeadOff.copy(headOff); }
    }
    sfx.setWind(0, false);
  }

  if (inXR) { rotY(camera.position, rigYaw, headOff); headOff.y = 0; }
  shake = Math.max(0, shake - dt * 1.5);
  placeRig(inXR);

  // fade to black while falling, then back in after respawn
  const fadeY = world.killY + 20;
  let fade = 0;
  if (state === 'dead') fade = Math.min(1, (deathMsg === 'KNOCKED OUT!' ? 0.5 : 0.85) + deadT);
  else if (state === 'play') fade = Math.max(0, Math.min(0.85, (fadeY - player.pos.y) / (fadeY - world.killY) * 0.85));
  if (fadeIn > 0) { fadeIn = Math.max(0, fadeIn - dt * 1.6); fade = Math.max(fade, fadeIn); }
  hud.fade(fade);

  hud.set('time', fmtTime(runTime));
  hud.update(dt, player.grabInRange && !inXR);

  sun.target.position.copy(player.pos);
  sun.position.copy(player.pos).addScaledVector(sunDir, 120);
  if (seaMat) seaMat.uniforms.time.value = gameTime;

  renderer.render(scene, camera);
});

// ---------- boot ----------
loadLevel(0);
renderMenu();
ui.loading.classList.add('hidden');
showMenu();

// Debug hook (browser console): __sky.tp(x, y, z), __sky.load(i)
window.__sky = {
  get player() { return player; }, get world() { return world; }, camera, input,
  look(y, p) { viewYaw = y; pitch = p; },
  tp(x, y, z) { player.reset(new THREE.Vector3(x, y, z)); },
  load(i) { selected = i; loadLevel(i); },
  get state() { return state; },
};
