/** Screen composition only: never used for travel, collision or game time. */
export function sceneFocus(point: { x: number; y: number } | undefined, width: number) {
  if (!point || width <= 900) return { x: 0, y: 0, scale: 1 };
  // Bring the observed object into the free left half, clear of the inspector.
  // Bounded translation avoids exposing empty space at the image edges.
  return {
    x: Math.max(-8, Math.min(8, (38 - point.x) * 0.22)),
    y: Math.max(-5, Math.min(5, (58 - point.y) * 0.15)),
    scale: 1.18,
  };
}
