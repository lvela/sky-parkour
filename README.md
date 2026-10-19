# Sky Parkour

A 3D sky parkour game that runs in the browser and in VR on Meta Quest (WebXR).
It's built with Three.js and has no build step or assets: textures, sky, clouds and sounds are all generated in code.

## The course (~400 m, 5 checkpoints)
1. **Jumps:** stepping stones over the void
2. **Tile jumps:** a grid of small tiles; the orange ones crumble
3. **Trampolines:** bounce up to higher islands
4. **Wall jumps:** a zig-zag wall corridor, then a vertical shaft to climb
5. **Swings:** three pendulum swings over a big gap
6. **Grabbers:** monkey-bar style grab bars, some of them moving
7. **Moving platforms:** a sliding platform, a spinning cross and a side-to-side platform
8. **Zipline:** a long slide down to a lower island
9. **Final climb:** crumbling steps, then a MEGA trampoline up to the finish

If you fall, you fall to your death and respawn at the last checkpoint.

## Controls
| | Desktop | Meta Quest |
|---|---|---|
| Move | WASD / arrows | Left stick |
| Look / turn | Mouse | Head / right stick (snap turn) |
| Jump, wall jump, launch from a hold | Space | A / X |
| Grab | Hold E or a mouse button | Grip or trigger (per hand; pull or fling yourself) |
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
- `src/sky.js`: atmospheric-scattering sky plus procedural cumulus and cirrus, baked once into an HDR cubemap (cheap enough for Quest)
- `src/scenery.js`: floating islands, the animated cloud sea below and billboard cumulus clouds
- `src/course.js`: the course layout, colliders, swings, bars, zipline, crumbling tiles and checkpoints
- `src/player.js`: the character controller and physics
- `src/xr.js`: Quest controllers · `src/input.js`: keyboard and mouse · `src/hud.js`: HUD · `src/audio.js`: synthesized sound
