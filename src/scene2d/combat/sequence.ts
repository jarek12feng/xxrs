import { createPlayback } from "../../presentation/actor-action/playback";
/** Presentation snapshots must come from successfully saved domain state. */
export interface CombatSnapshot {
  id: string;
  turn: number;
  player: number;
  enemy: number;
  enemyName: string;
  enemyImage?: string;
  effect: string;
}
export type CombatPhase = "approach" | "strike" | "impact" | "return";
export interface CombatBeat {
  phase: CombatPhase;
  snapshot: CombatSnapshot;
  playerLost: number;
  enemyLost: number;
}
export function combatExchange(
  before: CombatSnapshot | null,
  after: CombatSnapshot | null,
) {
  if (
    !before ||
    !after ||
    before.id !== after.id ||
    after.turn !== before.turn + 1
  )
    return null;
  return {
    snapshot: { ...after },
    playerLost: Math.max(0, before.player - after.player),
    enemyLost: Math.max(0, before.enemy - after.enemy),
  };
}
export function createCombatSequence<T>(options: {
  initial: CombatSnapshot | null;
  schedule: (ms: number, callback: () => void) => T;
  cancel: (timer: T) => void;
  reduced: () => boolean;
  show: (beat: CombatBeat | null) => void;
}) {
  let baseline = options.initial ? { ...options.initial } : null;
  let disposed = false;
  const player = createPlayback<CombatBeat, T>({
    schedule: options.schedule, cancel: options.cancel, reduced: options.reduced,
    show: options.show, end: () => options.show(null),
  });
  function stop() { player.stop(); }
  return {
    stop,
    sync(next: CombatSnapshot | null) {
      if (disposed) return;
      const exchange = combatExchange(baseline, next);
      const changed = baseline?.id !== next?.id || baseline?.turn !== next?.turn ||
        baseline?.player !== next?.player || baseline?.enemy !== next?.enemy;
      baseline = next ? { ...next } : null;
      if (!changed) return;
      if (!exchange) { stop(); return; }
      const phases: readonly CombatPhase[] = ['approach', 'strike', 'impact', 'return'];
      const durations = [180, 240, 300, 220];
      player.play(phases.map((phase, index) => ({
        durationMs: durations[index]!, value: { ...exchange, phase },
      })));
    },
    dispose() { if (!disposed) { disposed = true; player.dispose(); } },
  };
}
