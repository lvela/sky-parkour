import islands from './l1_islands.js';
import canyon from './l2_canyon.js';
import storm from './l3_storm.js';
import aurora from './l4_aurora.js';
import frozen from './l6_frozen.js';
import volcano from './l7_volcano.js';
import cosmic from './l8_cosmic.js';
import castle from './l5_castle.js';
import blossom from './l09_blossom.js';
import mushroom from './l10_mushroom.js';
import ruins from './l11_ruins.js';
import reef from './l12_reef.js';
import clockwork from './l13_clockwork.js';
import neon from './l14_neon.js';
import haunted from './l15_haunted.js';
import candy from './l16_candy.js';
import windmill from './l17_windmill.js';
import colossus from './l18_colossus.js';
import jungle from './l19_jungle.js';
import crystal from './l20_crystal.js';
import pirate from './l21_pirate.js';
import toxic from './l22_toxic.js';
import autumn from './l23_autumn.js';
import pinball from './l24_pinball.js';
import mirror from './l25_mirror.js';
import meteor from './l26_meteor.js';
import bog from './l27_bog.js';
import titan from './l28_titan.js';
import inferno from './l29_inferno.js';
import heavy from './l30_heavy.js';
import celestial from './l31_celestial.js';
import grid from './l32_grid.js';
import hurricane from './l33_hurricane.js';
import eclipse from './l34_eclipse.js';
import abyss from './l35_abyss.js';
import supernova from './l36_supernova.js';
import rainbow from './l37_rainbow.js';
import voidEmperor from './l38_void.js';

// Played in this order. Every tenth level from the Sky King on is a boss, each tougher than the last.
export const LEVELS = [
  islands, canyon, storm, aurora, frozen, volcano, cosmic, castle,
  blossom, mushroom, ruins, reef, clockwork, neon, haunted, candy, windmill, colossus,
  jungle, crystal, pirate, toxic, autumn, pinball, mirror, meteor, bog, titan,
  inferno, heavy, celestial, grid, hurricane, eclipse, abyss, supernova, rainbow, voidEmperor,
];
