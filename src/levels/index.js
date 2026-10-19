import islands from './l1_islands.js';
import canyon from './l2_canyon.js';
import storm from './l3_storm.js';
import aurora from './l4_aurora.js';
import frozen from './l6_frozen.js';
import volcano from './l7_volcano.js';
import cosmic from './l8_cosmic.js';
import castle from './l5_castle.js';

// Played in this order; the castle boss is always last.
export const LEVELS = [islands, canyon, storm, aurora, frozen, volcano, cosmic, castle];
