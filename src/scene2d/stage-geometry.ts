// Pixel-only layout. No game clock, RNG or persisted state belongs here.
export function approachPoint(
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const unit = Math.min(width / 1200, height / 760);
  return {
    x: Math.max(
      width * 0.07,
      Math.min(width * 0.93, (x * width) / 100 - 65 * unit),
    ),
    y: Math.max(
      height * 0.58,
      Math.min(height * 0.9, (y * height) / 100 + 82 * unit),
    ),
  };
}
export function groundScale(y: number, height: number) {
  return Math.max(0.72, Math.min(1.12, 0.72 + (y / height - 0.4) * 0.8));
}
export function approachDuration(distance: number, unit: number) {
  return Math.max(160, Math.min(650, (distance / Math.max(0.1, unit)) * 1.4));
}
