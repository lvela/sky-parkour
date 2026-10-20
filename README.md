# Sky Parkour

A 3D sky parkour game that runs in the browser and in VR on Meta Quest (WebXR).
It's built with Three.js and has no build step or assets: textures, sky, clouds, sounds and music are all generated in code.

## Levels
Every tenth world from the Sky King on ends in a boss, and each boss is tougher than the last.
Each world after level 8 adds a new kind of obstacle and is a little harder than the one before.

1. **Sky Islands** (bright day): stepping stones, crumbling tiles, trampolines, wall jumps, swings, grab bars, moving platforms, zipline
2. **Sunset Canyon** (golden hour among desert mesas): rock climbing, mega slides with jump ramps, wall slides, moving trampolines
3. **Thunderstorm** (rain and lightning): knockout sweepers, boxing-glove punchers, wrecking hammers, bobbing wall jumps, a "breathing" shaft
4. **Aurora Night** (Milky Way, giant moon, animated aurora, glowing crystals): neon slide, night climb, shifting walls, wall slides, hammers, zipline
5. **Frozen Peaks** (crisp morning, falling snow): slippery ice, an icy bridge in gusting crosswinds, an ice climb, a frozen slide, thin ice
6. **Volcano Rift** (over a sea of lava, rising embers): fireball cannons, lava geysers that launch you across gaps, molten hammers, lava elevators
7. **Cosmic Rift** (deep space, nebula, ringed planet): **low gravity**, moon jumps, phasing platforms, orbital grab bars, a cosmic spinner
8. **BOSS: Castle of the Sky King** (twilight under a ringed planet): storm the castle, then fight the boss
9. **Blossom Gardens** (spring morning, falling petals): **conveyor walkways** that carry you forward, sideways and backwards
10. **Mushroom Grove** (twilight forest, fireflies): **bouncy mushroom caps**, bobbing caps and spore launchers
11. **Desert Ruins** (blazing noon, drifting dust): **quicksand** that swallows you and **spike traps**
12. **Coral Reef** (deep blue water, **buoyant** gravity): **bubble elevators** you ride up before they pop
13. **Clockwork Tower** (golden hour): **rotating gears**, **pumping pistons** and the hands of a giant clock
14. **Neon City** (rainy cyberpunk night): **laser gates** and **dash pads** across the rooftops
15. **Haunted Graveyard** (full moon, green fog): **swinging platforms** and **cursed graves** that crumble
16. **Candy Kingdom** (pastel sky): **click-clack blocks**: red and blue swap with every jump you make
17. **Windmill Hills** (breezy day): **giant windmill sails** sweeping the path and **updraft fans**
18. **BOSS: The Clockwork Colossus** (foundry at dusk): **six crystals** on piston, click-clack, bellows, fan and gear towers
19. **Jungle Temple** (steamy jungle): **rolling logs** on the temple causeways
20. **Crystal Caverns** (glowing violet geode): **shrinking crystal pads**
21. **Pirate Skies** (flying galleons at sunset): **barrel cannons** that fire you between ships, rocking decks
22. **Toxic Factory** (over an acid sea): **crushers** slamming down on the assembly line
23. **Autumn Canopy** (golden treetops, falling leaves): **swaying and spinning balance beams**
24. **Pinball Nebula** (neon table in deep space): **bumpers** and **flippers**
25. **Mirror Dimension** (pale marble and glass): **portals** and glass bridges with fake panes
26. **Meteor Shower** (starry night): **meteor strikes** on marked targets and **orbiting platforms**
27. **Bog of Shadows** (foggy swamp): **sticky mud** and **retracting bars**
28. **BOSS: The Crystal Titan** (frost citadel under the aurora): **seven crystals**
29. **Inferno Forge** (burning sky, lava sea): **flame jets** you can't jump over
30. **Heavy Planet** (alien world, **crushing gravity**): **shockwave pylons**
31. **Celestial Temple** (golden sunset clouds): **carousel bars** riding round golden masts
32. **Digital Grid** (inside a computer): **glitch blocks** that teleport between two spots
33. **Hurricane Eye** (raging storm): **vortex winds** that drag you round mid-jump
34. **Eclipse Ruins** (total solar eclipse): **paths of light** that only exist while a wave passes
35. **Abyssal Trench** (pitch-black deep, light gravity): **jellyfish bouncers** and sweeping eels
36. **Supernova** (exploding star): **chain-collapse paths** that fall apart behind you
37. **Rainbow Gauntlet** (aurora night): **spinning wall-jump shafts** and a gauntlet of every obstacle
38. **BOSS: The Void Emperor** (the edge of the universe): **eight crystals**
39. **Wild West Mesa** (sunset over red mesas): **bullet time**, where a slow-mo pad hands you a **blaster**; bounce on the trampoline and shoot the target hidden behind the gate. Also **seesaws**
40. **Steel Skyline** (skyscraper site at dawn): the **grappler**, used to pull yourself up sheer walls and swing from floating hooks, plus **telescoping crane bridges**
41. **Balloon Fiesta** (pastel morning, hot-air balloons): **balloons** you float up on (let go before they pop) and **boost rings**
42. **Moonbase** (craters under a ringed planet, low gravity): **low-gravity bubbles** and **floating mines**
43. **Midnight Funfair** (a fair in the night sky): **spinning saucers** and **Ferris wheels**
44. **Tidal Temple** (sunken temple in a floating basin): a **rising and falling tide**, **floats** that ride it, and **pressure-plate gates** that stay open for a few seconds
45. **Neon Rhythm** (synthwave sunset): **beat blocks** that swap in time with the music, and **floor switches**
46. **Sky Railway** (golden hour): **grind rails** with huge leaps off the end, **mine-cart trains** and **saw tracks**
47. **Shadow Labyrinth** (endless dusk): **phantom platforms** that only appear up close, and **squeeze walls**
48. **BOSS: The Storm Sovereign** (a thunderhead throne): **nine crystals**, each tower built from a new gadget
49. **Toy Factory** (giant toy workshop): **spinning drums** and **spring walls** you ping-pong between to climb
50. **The Summit** (the top of the sky at sunrise): the grand finale. Grapple, balloon, grind, and take one last slow-motion shot

### The bosses
You can't hit a boss directly. You smash its crystals with parkour, one tower at a time, and finally the gem in its crown,
which you reach by riding the platforms orbiting it and bouncing onto its head.

**The Sky King** has five crystals:
1. **West tower:** a climb
2. **North tower:** trampolines
3. **East tower:** a moving wall-jump shaft
4. **Crumbling spiral:** steps that fall away as you climb them
5. **The gem in his crown:** ride the platforms orbiting him and bounce onto his head

Every boss gets angrier after every crystal. They slam shockwave rings and hurl boulder volleys.
They swing spinning flail arms and call lightning that follows you even onto the towers.
When you're up high near them they swat at you; jump when the fist glows red.
You have three hearts. **If a boss knocks you out, it regains a crystal.**

Each later boss has more crystals, attacks faster, and adds new attacks:
- **The Clockwork Colossus** (6 crystals): flails from the start and **homing wisps** that chase you.
- **The Crystal Titan** (7 crystals): lightning from the start, extra boulders and **meteor showers** across the whole arena.
- **The Void Emperor** (8 crystals): up to three flails, triple shockwaves, and a **vortex inhale** that drags you toward him. Run away from him while he inhales!
- **The Storm Sovereign** (9 crystals): the fastest boss. Every tower needs a gadget or trick from worlds 39–47: grappler, boost ring, Ferris wheel, balloon, switch stairs, phantom steps, a cart track, and a cage you open by shooting a circling target.

Homing wisps only chase you on the arena floor. Once you're up a tower or hanging on, they fizzle out.

### Gadgets
Some stations hand you a gadget. It stays with you until you pick up a different one or restart the level.
- **Blaster:** shoot targets to open gates. It usually comes from a **slow-mo pad**: step on it, and time slows for 8 seconds while you bounce and aim.
- **Grappler:** aim at a glowing grapple point (up to 18 m away) and fire. You're reeled in and flung up over the ledge, or onward from a floating hook.

A ring locks on when your shot will land. Walls and platforms block shots.

If you fall you're straight back at your last checkpoint, with no death screen. Best times are saved in your browser.

### Music
Each level gets its own cheerful parkour tune (key, tempo and melody are generated from the level), and a pounding boss theme kicks in when a boss wakes up. Press **M** to turn the music on or off.

## Controls
| | Desktop | Meta Quest |
|---|---|---|
| Move | WASD / arrows | Left stick |
| Look / turn | Mouse | Head / right stick (snap turn) |
| Jump, wall jump, launch from a hold | Space | A / X |
| Grab | Hold E or a mouse button (E / right-click while holding a gadget) | Grip or trigger (per hand; pull or fling yourself). Grip only while holding a gadget |
| Fire the blaster / grappler | Left click or F | Trigger (aims where the controller points) |
| Music on / off | M | |
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
- `src/world.js`: colliders and grabbables · `src/boss.js`: the bosses · `src/obstacles.js`: the obstacles added in worlds 9–38 · `src/obstacles2.js`: the obstacles and gadget stations added in worlds 39–50 · `src/levels/arena.js`: boss arena helpers · `src/effects.js`: rain, lightning, aurora, birds, fireworks
- `src/player.js`: the character controller and physics
- `src/tools.js`: the blaster and grappler (models, aiming, shots, rope)
- `src/xr.js`: Quest controllers · `src/input.js`: keyboard and mouse · `src/hud.js`: HUD · `src/audio.js`: synthesized sound effects · `src/music.js`: the procedural soundtrack
