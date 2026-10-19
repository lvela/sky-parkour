# Sky Parkour

A 3D sky parkour game that runs in the browser and in VR on Meta Quest (WebXR).
It's built with Three.js and has no build step or assets: textures, sky, clouds and sounds are all generated in code.

## Levels
1. **Sky Islands** (bright day): stepping stones, crumbling tiles, trampolines, wall jumps, swings, grab bars, moving platforms, zipline
2. **Sunset Canyon** (golden hour among desert mesas): rock climbing, mega slides with jump ramps, wall slides, moving trampolines
3. **Thunderstorm** (rain and lightning): knockout sweepers, boxing-glove punchers, wrecking hammers, bobbing wall jumps, a "breathing" shaft
4. **Aurora Night** (Milky Way, giant moon, animated aurora, glowing crystals): neon slide, night climb, shifting walls, wall slides, hammers, zipline
5. **Frozen Peaks** (crisp morning, falling snow): slippery ice, an icy bridge in gusting crosswinds, an ice climb, a frozen slide, thin ice
6. **Volcano Rift** (over a sea of lava, rising embers): fireball cannons, lava geysers that launch you across gaps, molten hammers, lava elevators
7. **Cosmic Rift** (deep space, nebula, ringed planet): **low gravity**, moon jumps, phasing platforms, orbital grab bars, a cosmic spinner
8. **Castle of the Sky King** (twilight under a ringed planet): storm the castle, then fight the boss

### The boss: the Sky King
You can't hit him directly. You smash **five crystals** with parkour:
1. **West tower:** a climb
2. **North tower:** trampolines
3. **East tower:** a moving wall-jump shaft
4. **Crumbling spiral:** steps that fall away as you climb them
5. **The gem in his crown:** ride the platforms orbiting him and bounce onto his head

He gets angrier after every crystal. He slams shockwave rings (doubled later) and hurls boulder volleys.
He also swings spinning flail arms and calls lightning that follows you even onto the towers.
When you're up high near him he swats at you; jump when his fist glows red.
You have three hearts. **If he knocks you out, he regains a crystal.**

Fall and you fall to your death, then respawn at the last checkpoint. Best times are saved in your browser.

## Controls
| | Desktop | Meta Quest |
|---|---|---|
| Move | WASD / arrows | Left stick |
| Look / turn | Mouse | Head / right stick (snap turn) |
| Jump, wall jump, launch from a hold | Space | A / X |
| Grab | Hold E or a mouse button | Grip or trigger (per hand; pull or fling yourself) |
| On a climbing hold | Space reach up · A/D + Space sideways · S + Space kick off | Pull down hand over hand · A/X to reach up |
| Next level (after finishing) | Enter | A |
| Back to checkpoint / restart after finishing | R | B / Y |

## Play locally
WebXR and ES modules need a web server (opening the file directly won't work):
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Deploy to GitHub Pages
1. Create a GitHub repo and push these files to it (`index.html` must be at the repo root).
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. After a minute the game is live at `https://<user>.github.io/<repo>/`.

## Play on Meta Quest
Open the GitHub Pages URL in the **Meta Quest Browser** and press **ENTER VR**. GitHub Pages serves over HTTPS, which WebXR requires.

## Files
- `src/sky.js`: per-level skies (physical scattering or storm/night gradients, plus stars, Milky Way, moon, ringed planet and clouds), baked once into an HDR cubemap so they're cheap enough for Quest
- `src/scenery.js`: floating islands, the animated cloud sea below and billboard cumulus clouds
- `src/levels/`: one file per level (sky, lighting, theme and layout)
- `src/builder.js`: level toolkit (platforms, slides, climbing walls, sweepers, punchers, hammers, swings, zipline, finish)
- `src/world.js`: colliders and grabbables · `src/boss.js`: the Sky King · `src/effects.js`: rain, lightning, aurora, birds, fireworks
- `src/player.js`: the character controller and physics
- `src/xr.js`: Quest controllers · `src/input.js`: keyboard and mouse · `src/hud.js`: HUD · `src/audio.js`: synthesized sound
