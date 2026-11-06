export type PlaybackEnd =
  "completed" | "skipped" | "replaced" | "disposed" | "reduced";
export interface PlaybackFrame<T> {
  value: T;
  durationMs: number;
}

/** One cancellable presentation at a time. Schedulers must invoke callbacks asynchronously. */
export function createPlayback<T, Timer>(options: {
  schedule: (ms: number, callback: () => void) => Timer;
  cancel: (timer: Timer) => void;
  reduced: () => boolean;
  show: (value: T) => void;
  end: (reason: PlaybackEnd) => void;
}) {
  let timer: Timer | undefined,
    revision = 0,
    playing = false,
    disposed = false;
  function finish(reason: PlaybackEnd) {
    revision++;
    if (timer !== undefined) options.cancel(timer);
    timer = undefined;
    const wasPlaying = playing;
    playing = false;
    if (wasPlaying) options.end(reason);
  }
  return {
    play(frames: readonly PlaybackFrame<T>[]) {
      if (disposed) return;
      const replacement = revision + 1;
      finish("replaced");
      if (disposed || revision !== replacement) return;
      playing = true;
      if (options.reduced()) {
        finish("reduced");
        return;
      }
      const ticket = revision;
      function step(index: number) {
        if (disposed || ticket !== revision) return;
        const frame = frames[index];
        if (!frame) {
          finish("completed");
          return;
        }
        options.show(frame.value);
        if (disposed || ticket !== revision) return;
        timer = options.schedule(Math.max(0, frame.durationMs), () => {
          if (disposed || ticket !== revision) return;
          timer = undefined;
          step(index + 1);
        });
      }
      step(0);
    },
    stop(reason: PlaybackEnd = "skipped") {
      if (!disposed) finish(reason);
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        finish("disposed");
      }
    },
  };
}
