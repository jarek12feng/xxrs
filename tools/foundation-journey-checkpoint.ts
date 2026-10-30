import {
  dispatch,
  validState,
  type State,
  type Intent,
  type Gender,
  type Path,
} from "../src/core";
import { mistCheckpoint } from "./mist-checkpoint";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId, JourneyAction } from "../src/foundation-journey/state";
import { foundationExchange } from "../src/foundation-journey/combat";
import { moves } from "../src/expedition/content";
// Reproducible development checkpoint. All progress is earned through public commands.
export function journeyPlayer(initial = mistCheckpoint()) {
  let state = initial,
    serial = 0;
  const send = (intent: Intent) => {
    let id: string;
    do {
      id = `foundation-check-${state.month}-${++serial}`;
    } while (state.seen.includes(id));
    const next = dispatch(state, { ...intent, id });
    if (!validState(next))
      throw new Error(`Invalid state after ${JSON.stringify(intent)}`);
    state = next;
    return state;
  };
  const act = (action: JourneyAction) =>
    send({ type: "foundationJourney", action });
  const cultivate = (target: number) => {
    let guard = 0;
    while (state.foundationJourney.cultivation < target) {
      if (++guard > 100) throw new Error("Cultivation stalled");
      send({ type: "advance", activity: "cultivate", months: 1 });
    }
  };
  const fight = (id: BattleId) => {
    cultivate(challenges[id].cultivation);
    while (state.injury) send({ type: "advance", activity: "rest", months: 1 });
    while (state.stones < 12)
      send({ type: "advance", activity: "work", months: 3 });
    act({ kind: "battle", battle: id });
    if (!state.foundationJourney.duel) throw new Error(`Cannot start ${id}`);
    let guard = 0;
    while (state.foundationJourney.duel) {
      if (++guard > 12) throw new Error("Battle stalled");
      // Pick from public previews: prefer lethal hits, then damage per received hit.
      const options = (Object.keys(moves) as (keyof typeof moves)[]).map(
        (move) => ({ move, p: foundationExchange(state, move)! }),
      );
      options.sort((a, b) => {
        const score = (o: typeof a) =>
          o.p.damage >= state.foundationJourney.duel!.enemy
            ? 10000
            : o.p.damage / Math.max(1, o.p.incoming - o.p.healing);
        return score(b) - score(a);
      });
      act({ kind: "move", move: options[0]!.move });
    }
    if (!state.foundationJourney.won.includes(id))
      throw new Error(`Lost ${id}: ${state.foundationJourney.last}`);
  };
  return {
    get state() {
      return state;
    },
    send,
    act,
    cultivate,
    fight,
  };
}
export function journeyCheckpoint(
  gender: Gender = "male",
  completed = false,
  path: Path = "wood",
  technique: "spring" | "blade" | "breath" = "spring",
  seed = 42,
) {
  const p = journeyPlayer(mistCheckpoint(seed, path, gender));
  if (!p.state.journey.known.includes(technique))
    p.send({ type: "learn", technique });
  p.send({ type: "equip", technique });
  if (!p.state.journey.known.includes("guard"))
    p.send({ type: "learn", technique: "guard" });
  p.send({ type: "equip", technique: "guard" });
  if (!completed) return p.state;
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique });
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.cultivate(240);
  p.act({ kind: "travel", destination: "frontier" });
  p.act({ kind: "report" });
  p.act({ kind: "signal" });
  p.fight("frontier");
  p.act({ kind: "mentor" });
  p.fight("rescue");
  p.cultivate(600);
  p.act({ kind: "finish" });
  return p.state;
}
