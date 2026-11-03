import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Point } from './navigation';

/** Presentation only: callers supply reviewed floor positions, never raw skyline hotspots. */
export function useSceneApproach(options: { animated: () => boolean; initial?: Point }) {
  const position = ref<Point>({ ...(options.initial ?? { x: 30, y: 86 }) });
  const moving = ref(false), frame = ref(0), facing = ref(1);
  let target = { ...position.value }, origin = { ...position.value };
  let arrival: (() => void) | undefined, raf: number | undefined, started = 0, duration = 0;
  let preference: MediaQueryList | undefined, disposed = false, generation = 0;
  function cancel() {
    generation++;
    if (raf !== undefined) cancelAnimationFrame(raf);
    raf = undefined; arrival = undefined; moving.value = false; frame.value = 0;
  }
  function skip() {
    if (!moving.value) return;
    const done = arrival;
    position.value = { ...target };
    cancel(); done?.();
  }
  function reset(point: Point) { cancel(); position.value = { ...point }; }
  function walkTo(point: Point, onArrival?: () => void) {
    cancel();
    if (disposed || document.hidden || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    target = { ...point }; origin = { ...position.value };
    facing.value = target.x < origin.x ? -1 : 1;
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
    if (!options.animated() || preference?.matches || distance < .5) {
      position.value = { ...target }; onArrival?.(); return;
    }
    arrival = onArrival; moving.value = true; started = performance.now();
    duration = Math.min(1800, Math.max(200, distance * 38));
    const ticket = generation;
    function tick(now: number) {
      if (ticket !== generation || disposed) return;
      const elapsed = now - started, progress = Math.min(1, elapsed / duration);
      position.value = { x: origin.x + (target.x - origin.x) * progress, y: origin.y + (target.y - origin.y) * progress };
      frame.value = Math.floor(elapsed / 100) % 8;
      if (progress === 1) { skip(); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }
  function visibility() { if (document.hidden) cancel(); }
  function motion() { if (preference?.matches) cancel(); }
  function key(event: KeyboardEvent) { if (event.key === 'Escape') cancel(); }
  watch(options.animated, enabled => { if (!enabled && moving.value) skip(); });
  onMounted(() => {
    preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    preference?.addEventListener?.('change', motion);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('keydown', key);
  });
  onBeforeUnmount(() => {
    disposed = true; cancel(); preference?.removeEventListener?.('change', motion);
    document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', key);
  });
  return { position, moving, frame, facing, walkTo, skip, cancel, reset };
}
