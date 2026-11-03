/** Presentation-only coordinates, expressed as percentages of the scene artwork. */
export interface Point { x: number; y: number }
export interface WalkRect { left: number; top: number; right: number; bottom: number }
export interface WalkArea { bounds: Readonly<WalkRect>; obstacles: readonly Readonly<WalkRect>[] }

const clearance = 0.3;
const areas: Record<string, WalkArea> = {
  ferry: { bounds: { left: 10, top: 70, right: 90, bottom: 92 }, obstacles: [] },
  apothecary: {
    bounds: { left: 10, top: 69, right: 90, bottom: 94 },
    obstacles: [
      { left: 10, top: 69, right: 31, bottom: 79 },
      { left: 74, top: 69, right: 90, bottom: 77 },
    ],
  },
  forest: {
    bounds: { left: 16, top: 70, right: 86, bottom: 93 },
    obstacles: [{ left: 49, top: 70, right: 57, bottom: 79 }],
  },
  shrine: {
    bounds: { left: 15, top: 71, right: 87, bottom: 93 },
    obstacles: [{ left: 65, top: 71, right: 80, bottom: 79 }],
  },
};
for (const area of Object.values(areas)) {
  Object.freeze(area.bounds);
  area.obstacles.forEach(Object.freeze);
  Object.freeze(area.obstacles);
  Object.freeze(area);
}

/** Unknown scenes deliberately have no floor until their artwork is reviewed. */
export function sceneWalkArea(sceneKey: string): WalkArea | undefined {
  const key = sceneKey === 'invitation' ? 'ferry' : sceneKey === 'home' ? 'shrine' : sceneKey;
  return Object.hasOwn(areas, key) ? areas[key] : undefined;
}
const finite = (p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y);
const within = (r: Readonly<WalkRect>, p: Point) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
const walkable = (area: WalkArea, p: Point) => finite(p) && within(area.bounds, p) && !area.obstacles.some(r => within(r, p));
export function isWalkable(sceneKey: string, point: Point): boolean {
  const area = sceneWalkArea(sceneKey);
  return !!area && walkable(area, point);
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
const clampPoint = (r: Readonly<WalkRect>, p: Point): Point => ({ x: clamp(p.x, r.left, r.right), y: clamp(p.y, r.top, r.bottom) });
function corners(r: Readonly<WalkRect>): Point[] {
  return [
    { x: r.left - clearance, y: r.top - clearance },
    { x: r.right + clearance, y: r.top - clearance },
    { x: r.right + clearance, y: r.bottom + clearance },
    { x: r.left - clearance, y: r.bottom + clearance },
  ];
}
function project(area: WalkArea, point: Point): Point | undefined {
  if (!finite(point)) return undefined;
  const p = clampPoint(area.bounds, point);
  if (walkable(area, p)) return p;
  const candidates = area.obstacles.flatMap(r => [
    ...corners(r),
    { x: r.left - clearance, y: p.y }, { x: r.right + clearance, y: p.y },
    { x: p.x, y: r.top - clearance }, { x: p.x, y: r.bottom + clearance },
  ]).map(q => clampPoint(area.bounds, q)).filter(q => walkable(area, q));
  candidates.sort((a, b) => distance(a, p) - distance(b, p) || a.x - b.x || a.y - b.y);
  return candidates[0];
}
/** Hotspots above the floor project to the closest available standing position. */
export function projectWalkPoint(sceneKey: string, point: Point): Point | undefined {
  const area = sceneWalkArea(sceneKey);
  return area && project(area, point);
}

// Slab intersection: exact segment/rectangle intersection, including its boundary.
function crosses(a: Point, b: Point, rect: Readonly<WalkRect>): boolean {
  let enter = 0, leave = 1;
  for (const [origin, delta, low, high] of [
    [a.x, b.x - a.x, rect.left, rect.right],
    [a.y, b.y - a.y, rect.top, rect.bottom],
  ]) {
    if (delta === 0) { if (origin! < low! || origin! > high!) return false; }
    else {
      const t0 = (low! - origin!) / delta!;
      const t1 = (high! - origin!) / delta!;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) return false;
    }
  }
  return true;
}
function direct(area: WalkArea, a: Point, b: Point): boolean {
  return walkable(area, a) && walkable(area, b) && !area.obstacles.some(r => crosses(a, b, r));
}
export function canWalkDirectly(sceneKey: string, from: Point, to: Point): boolean {
  const area = sceneWalkArea(sceneKey);
  return !!area && direct(area, from, to);
}

/** Pure visibility-graph route. Includes projected start/end; [] means unavailable. */
export function planWalk(sceneKey: string, from: Point, to: Point): Point[] {
  const area = sceneWalkArea(sceneKey);
  return area ? planWalkWithin(area, from, to) : [];
}
/** Also accepts a reviewed custom floor; never reads state or advances game time. */
export function planWalkWithin(area: WalkArea, from: Point, to: Point): Point[] {
  const start = project(area, from), end = project(area, to);
  if (!start || !end) return [];
  if (distance(start, end) < 1e-8) return [start];
  if (direct(area, start, end)) return [start, end];
  const nodes = [start, end, ...area.obstacles.flatMap(corners).filter(p => walkable(area, p))];
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && Number.isFinite(costs[i]) && (current < 0 || costs[i]! < costs[current]!)) current = i;
    }
    if (current < 0) return [];
    if (current === 1) {
      const result: Point[] = [];
      for (let i = 1; i >= 0; i = previous[i]!) result.unshift(nodes[i]!);
      return result;
    }
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !direct(area, nodes[current]!, nodes[i]!)) continue;
      const next = costs[current]! + distance(nodes[current]!, nodes[i]!);
      if (next < costs[i]!) { costs[i] = next; previous[i] = current; }
    }
  }
  return [];
}
