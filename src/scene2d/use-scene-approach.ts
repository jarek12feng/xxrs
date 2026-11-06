import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createFrameClock } from "../presentation/actor-action/frame-clock";
import type { Point } from "./navigation";
import { createActorMotion } from "../presentation/actor-action/motion";
import { observeActionEnvironment } from "../presentation/actor-action/environment";

/** Vue adapter. Scenes supply reviewed floor positions; the shared actor owns movement. */
export function useSceneApproach(options: {
  animated: () => boolean;
  initial?: Point;
}) {
  const position = ref<Point>({ ...(options.initial ?? { x: 30, y: 86 }) });
  const moving = ref(false),
    frame = ref(0),
    facing = ref(1);
  let disposed = false;
  let environment: ReturnType<typeof observeActionEnvironment> | undefined;
  const actor = createActorMotion({
    initial: position.value,
    duration: (from, to) => {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      return distance < 0.5 ? 0 : Math.min(1800, Math.max(200, distance * 38));
    },
    show: (state) => {
      position.value = state.position;
      moving.value = state.moving;
      frame.value = state.frame;
      facing.value = state.facing;
    },
  });
  const clock=createFrameClock({
    request:callback=>requestAnimationFrame(callback),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now(),
    advance:elapsed=>{actor.advance(elapsed);return moving.value;},
  });
  const unschedule=clock.stop;
  function cancel() {
    unschedule();
    actor.cancel();
  }
  function skip() {
    unschedule();
    actor.skip();
  }
  function reset(point: Point) {
    unschedule();
    actor.reset(point);
  }
  function walkTo(point: Point, onArrival?: () => void, faceX?: number) {
    cancel();
    if (disposed || document.hidden) return;
    actor.approach(
      {
        path: [point],
        faceX,
        instant: !options.animated() || environment?.reduced(),
      },
      onArrival,
    );
    // Complete zero-distance moves synchronously, including their arrival handler.
    actor.advance(0);
    if (moving.value) clock.start();
  }
  watch(options.animated, (enabled) => {
    if (!enabled && moving.value) skip();
  });
  onMounted(() => {
    environment = observeActionEnvironment(cancel);
  });
  onBeforeUnmount(() => {
    disposed = true;
    clock.dispose();
    actor.dispose();
    environment?.dispose();
  });
  return { position, moving, frame, facing, walkTo, skip, cancel, reset };
}
