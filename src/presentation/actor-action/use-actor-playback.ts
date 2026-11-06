import { onBeforeUnmount, onMounted, shallowRef, ref } from "vue";
import { createPlayback, type PlaybackFrame, type PlaybackEnd } from "./playback";
import { observeActionEnvironment } from "./environment";

/** Presentation only. Reduced frames may retain a static receipt, never settle a command. */
export function useActorPlayback<T>(options: { onEnd?: (reason: PlaybackEnd) => void } = {}) {
  const frame = shallowRef<T | null>(null);
  const hidden = ref(typeof document !== "undefined" && document.hidden);
  const reduced = ref(typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  let environment: ReturnType<typeof observeActionEnvironment> | undefined;
  const player = createPlayback<T, ReturnType<typeof setTimeout>>({
    schedule: (ms, callback) => setTimeout(callback, ms),
    cancel: timer => clearTimeout(timer),
    reduced: () => typeof document === "undefined" || document.hidden,
    show: value => { frame.value = value; },
    end: reason => { frame.value = null; options.onEnd?.(reason); },
  });
  const stop = () => player.stop();
  onMounted(() => { environment = observeActionEnvironment(stop, state => {
    hidden.value = state.hidden;
    reduced.value = state.reduced;
  }); });
  function play(frames: readonly PlaybackFrame<T>[], reducedFrames: readonly PlaybackFrame<T>[] = []) {
    player.play((environment?.reduced() ?? reduced.value) ? reducedFrames : frames);
  }
  onBeforeUnmount(() => { player.dispose(); environment?.dispose(); });
  return { frame, play, stop, hidden, reduced };
}
