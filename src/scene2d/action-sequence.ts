import { createPlayback, type PlaybackEnd } from "../presentation/actor-action/playback";
/** Ephemeral presentation only: callers must supply successfully persisted snapshots. */
export interface ActionSnapshot {
  prepared: boolean;
  rescued: boolean;
  method?: "none" | "medicine" | "guide" | "ward";
}
export type ActionSequence = "medicine" | "guide" | "ward" | "rescue";
export type ActionPhase =
  | "gather"
  | "warm"
  | "seal"
  | "tie"
  | "agree"
  | "breathe"
  | "brace"
  | "receive"
  | "escape";
export interface ActionFrame {
  sequence: ActionSequence;
  phase: ActionPhase;
  label: string;
  durationMs: number;
  index: number;
}
export type ActionEndReason = PlaybackEnd;
interface SequenceOptions<Timer> {
  initial: ActionSnapshot;
  reduced: boolean | (() => boolean);
  /** Schedule asynchronously, returning a handle that cancel can release. */
  schedule: (delayMs: number, callback: () => void) => Timer;
  cancel: (timer: Timer) => void;
  onFrame: (frame: ActionFrame) => void;
  /** Restore the persisted final appearance; never dispatch a game command here. */
  onEnd: (sequence: ActionSequence, reason: ActionEndReason) => void;
}
const frames: Record<
  ActionSequence,
  readonly (readonly [ActionPhase, string, number])[]
> = {
  medicine: [
    ["gather", "取药", 650],
    ["warm", "温药", 850],
    ["seal", "封装", 600],
  ],
  guide: [
    ["tie", "系绳", 700],
    ["agree", "约定退路", 700],
  ],
  ward: [["breathe", "调息", 1100]],
  rescue: [
    ["brace", "稳住阵门", 700],
    ["receive", "接应药工", 850],
    ["escape", "退到安全处", 750],
  ],
};

/** Reloaded completion is the baseline, not a fresh action. Rescue supersedes preparation. */
export function savedActionTransition(
  before: ActionSnapshot,
  after: ActionSnapshot,
): ActionSequence | undefined {
  if (!before.rescued && after.rescued) return "rescue";
  if (
    !before.prepared &&
    after.prepared &&
    after.method &&
    after.method !== "none"
  )
    return after.method;
  return undefined;
}

export function createActionSequence<Timer>(options: SequenceOptions<Timer>) {
  let saved = { ...options.initial };
  let active: ActionSequence | undefined, disposed = false;
  const player = createPlayback<ActionFrame, Timer>({
    schedule: options.schedule, cancel: options.cancel, reduced: () => typeof options.reduced === 'function' ? options.reduced() : options.reduced,
    show: options.onFrame,
    end: reason => {
      const sequence = active; active = undefined;
      if (sequence) options.onEnd(sequence, reason);
    },
  });
  return {
    get active() { return active; },
    sync(next: ActionSnapshot) {
      if (disposed) return;
      const sequence = savedActionTransition(saved, next);
      saved = { ...next };
      if (!sequence) return;
      player.stop('replaced');
      if (disposed) return;
      active = sequence;
      player.play(frames[sequence].map(([phase, label, durationMs], index) => ({
        durationMs, value: { sequence, phase, label, durationMs, index },
      })));
    },
    skip() { player.stop(); },
    dispose() { if (!disposed) { disposed = true; player.dispose(); } },
  };
}
