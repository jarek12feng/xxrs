import { describe, expect, it } from 'vitest';
import { canWalkDirectly, isWalkable, planWalk, planWalkWithin, projectWalkPoint, sceneWalkArea } from '../src/scene2d/navigation';

describe('local scene navigation', () => {
  it.each(['ferry', 'apothecary', 'forest', 'shrine'])('%s routes deterministically on reviewed ground', scene => {
    const from = { x: 20, y: 90 }, to = { x: 85, y: 72 };
    const snapshot = JSON.stringify({ from, to, area: sceneWalkArea(scene) });
    const route = planWalk(scene, from, to);
    expect(route.length).toBeGreaterThan(1);
    expect(route).toEqual(planWalk(scene, from, to));
    for (let i = 0; i < route.length; i++) {
      expect(isWalkable(scene, route[i]!)).toBe(true);
      if (i) expect(canWalkDirectly(scene, route[i - 1]!, route[i]!)).toBe(true);
    }
    expect(JSON.stringify({ from, to, area: sceneWalkArea(scene) })).toBe(snapshot);
  });
  it('walks around forest rocks instead of crossing their corners', () => {
    const from = { x: 30, y: 74 }, to = { x: 75, y: 74 };
    expect(canWalkDirectly('forest', from, to)).toBe(false);
    const route = planWalk('forest', from, to);
    expect(route.length).toBeGreaterThan(2);
    expect(route.slice(1, -1).every(p => p.y > 79)).toBe(true);
    // Sample every leg independently of the segment intersection implementation.
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1]!, b = route[i]!;
      for (let t = 0; t <= 100; t++) expect(isWalkable('forest', { x: a.x + (b.x - a.x) * t / 100, y: a.y + (b.y - a.y) * t / 100 })).toBe(true);
    }
  });
  it('projects scenery and furniture clicks onto nearby ground', () => {
    expect(isWalkable('apothecary', { x: 20, y: 72 })).toBe(false);
    const floor = projectWalkPoint('apothecary', { x: 20, y: 55 })!;
    expect(isWalkable('apothecary', floor)).toBe(true);
    expect(floor.y).toBeGreaterThan(79);
    const edge = projectWalkPoint('shrine', { x: 200, y: -20 })!;
    expect(isWalkable('shrine', edge)).toBe(true);
    expect(planWalk('shrine', edge, edge)).toEqual([edge]);
    expect(sceneWalkArea('home')).toBe(sceneWalkArea('shrine'));
    expect(sceneWalkArea('invitation')).toBe(sceneWalkArea('ferry'));
  });
  it('rejects unavailable floors, non-finite points, and disconnected ground', () => {
    const a = { x: 20, y: 80 }, b = { x: 80, y: 80 };
    expect(planWalk('unreviewed', a, b)).toEqual([]);
    expect(planWalk('ferry', a, { x: NaN, y: 70 })).toEqual([]);
    expect(projectWalkPoint('ferry', { x: Infinity, y: 70 })).toBeUndefined();
    expect(planWalkWithin({ bounds: { left: 0, top: 0, right: 100, bottom: 100 }, obstacles: [{ left: 45, top: 0, right: 55, bottom: 100 }] }, a, b)).toEqual([]);
  });
});
