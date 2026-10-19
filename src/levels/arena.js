// Shared pieces for boss levels: the 40 × 40 m arena and helpers for laying out crystal towers.

export function buildArena(b, { cx, cz, y0 }, style = 'brick') {
  b.plat({ x: cx, y: y0, z: cz, w: 40, d: 40, h: 14, style });
  const parapet = (x, z, w, d) => b.plat({ x, y: y0 + 2.4, z, w, d, h: 2.4, style, shadow: false });
  parapet(cx - 19.6, cz, 0.8, 40); parapet(cx + 19.6, cz, 0.8, 40); parapet(cx, cz - 19.6, 40, 0.8);
  parapet(cx - 11.75, cz + 19.6, 16.5, 0.8); parapet(cx + 11.75, cz + 19.6, 16.5, 0.8);
  b.checkpoint(cx, y0, cz + 16.5);
}

// Point on a circle round the arena centre (deg 0 = north/−Z, 90 = east/+X), plus the
// unit vector pointing out from the centre (u) and the one along the circle (v).
export function polar(cx, cz, deg, r) {
  const a = deg * Math.PI / 180;
  return { x: cx + Math.sin(a) * r, z: cz - Math.cos(a) * r, u: { x: Math.sin(a), z: -Math.cos(a) }, v: { x: Math.cos(a), z: Math.sin(a) } };
}

// Square spiral staircase round (px, pz): n steps, each `rise` higher, corners `side` apart.
export function spiral(px, pz, y0, n, rise, side = 4.2) {
  const c = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
  return Array.from({ length: n }, (_, i) => { const [sx, sz] = c[i % 4]; return { x: px + sx * side / 2, y: y0 + rise * (i + 1), z: pz + sz * side / 2 }; });
}

// A slim pillar so a spiral reads as a tower from across the arena.
export function spine(b, x, z, y0, h) {
  b.post(x, y0, y0 + h, z, true, b.M.stone, 0.35);
}
