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
export type ActionEndReason =
  "completed" | "skipped" | "replaced" | "disposed" | "reduced";
interface SequenceOptions<Timer> {
  initial: ActionSnapshot;
  reduced: boolean;
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
  let active: ActionSequence | undefined;
  let pending: { timer: Timer } | undefined;
  let revision = 0;
  let disposed = false;

  const finish = (reason: ActionEndReason) => {
    revision++;
    if (pending) options.cancel(pending.timer);
    pending = undefined;
    const sequence = active;
    active = undefined;
    if (sequence) options.onEnd(sequence, reason);
  };
  const start = (sequence: ActionSequence) => {
    finish("replaced");
    if (disposed) return;
    active = sequence;
    if (options.reduced) {
      finish("reduced");
      return;
    }
    const token = revision;
    const show = (index: number) => {
      if (disposed || token !== revision) return;
      const item = frames[sequence][index];
      if (!item) {
        finish("completed");
        return;
      }
      options.onFrame({
        sequence,
        phase: item[0],
        label: item[1],
        durationMs: item[2],
        index,
      });
      // Callbacks may skip/dispose synchronously; do not leave a new timer behind.
      if (disposed || token !== revision) return;
      pending = {
        timer: options.schedule(item[2], () => {
          if (disposed || token !== revision) return;
          pending = undefined;
          show(index + 1);
        }),
      };
    };
    show(0);
  };
  return {
    get active() {
      return active;
    },
    sync(next: ActionSnapshot) {
      if (disposed) return;
      const sequence = savedActionTransition(saved, next);
      saved = { ...next };
      if (sequence) start(sequence);
    },
    skip() {
      if (!disposed) finish("skipped");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      finish("disposed");
    },
  };
}
