export interface MapPoint {
  x: number;
  y: number;
}
export function measurePath(points: readonly MapPoint[]) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  return { points, lengths, total: lengths.reduce((a, b) => a + b, 0) };
}
export function pointAt(
  path: ReturnType<typeof measurePath>,
  progress: number,
) {
  const { points, lengths, total } = path;
  if (!points.length) return { x: 0, y: 0, facing: 1 };
  let distance = Math.max(0, Math.min(1, progress)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] && lengths[i] > 0) {
      const t = distance / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
        facing: points[i + 1].x < points[i].x ? -1 : 1,
      };
    }
    distance -= lengths[i];
  }
  return { ...points[points.length - 1], facing: 1 };
}
