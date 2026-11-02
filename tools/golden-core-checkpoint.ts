import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
import { dispatch, validState, type State } from "../src/core";
import { goldenQuote, type GoldenAction } from "../src/golden-core/rules";
export function condensationCheckpoint(
  main: "spring" | "blade" | "breath" = "spring",
) {
  const p = journeyPlayer(
    journeyCheckpoint("male", true, main === "blade" ? "sword" : "wood", main),
  );
  p.fight("culmination");
  p.cultivate(600);
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "epilogue" });
  return p.state;
}
export function goldenPlayer(initial: State) {
  let state = initial,
    serial = 0;
  const act = (action: GoldenAction) => {
    const error = goldenQuote(state, action).error;
    if (error) throw new Error(`${action.kind}: ${error}`);
    const next = dispatch(state, {
      type: "goldenCore",
      action,
      id: `golden-check-${state.month}-${++serial}`,
    });
    if (!validState(next))
      throw new Error(`Invalid state after ${action.kind}`);
    state = next;
    return state;
  };
  return {
    get state() {
      return state;
    },
    act,
  };
}
