import {
  dispatch,
  validState,
  type State,
  type Intent,
  type Gender,
  type Path,
} from "../src/core";
import { cultivationProjection } from "../src/cultivation";
import { mistCheckpoint } from "./mist-checkpoint";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId, JourneyAction } from "../src/foundation-journey/state";
import { findCombatRoute } from "./foundation-tactics-audit";

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
      if (++guard > 100 || state.status !== "alive")
        throw new Error("Cultivation stalled or lifespan exhausted");
      const plan = cultivationProjection(state, target);
      if (!plan.batchMonths) throw new Error("No cultivation time remains");
      const before = state.foundationJourney.cultivation;
      send({
        type: "advance",
        activity: "cultivate",
        months: plan.batchMonths,
      });
      if (state.foundationJourney.cultivation <= before)
        throw new Error("Cultivation did not advance");
    }
  };
  const fight = (id: BattleId) => {
    cultivate(challenges[id].cultivation);
    while (state.injury) send({ type: "advance", activity: "rest", months: 1 });
    while (state.stones < 12)
      send({ type: "advance", activity: "work", months: 3 });
    act({ kind: "battle", battle: id });
    if (!state.foundationJourney.duel) throw new Error(`Cannot start ${id}`);
    let plan = findCombatRoute(state);
    if (
      !plan &&
      state.foundationJourney.cultivation < challenges[id].stage * 200
    ) {
      // A public-command safe alternative to finding an exceptional cross-stage build.
      act({ kind: "withdraw" });
      cultivate(challenges[id].stage * 200);
      while (state.stones < 4)
        send({ type: "advance", activity: "work", months: 3 });
      act({ kind: "battle", battle: id });
      plan = findCombatRoute(state);
    }
    if (!plan) throw new Error(`No bounded-search route for ${id}`);
    for (const move of plan.moves) act({ kind: "move", move });
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
