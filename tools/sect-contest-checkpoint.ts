import { dispatch, validState, type State } from "../src/core";
import {
  journeyPlayer,
  journeyCheckpoint,
} from "./foundation-journey-checkpoint";
// Developer fixture built through public commands; not a natural first-play claim.
export function contestCheckpoint(
  open = false,
  main: "spring" | "blade" | "breath" = "spring",
): State {
  const p = journeyPlayer(
    journeyCheckpoint("male", false, main === "blade" ? "sword" : "wood", main),
  );
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: main });
  p.fight("application");
  p.cultivate(200);
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.send({ type: "join", branch: "dan" });
  p.act({ kind: "travel", destination: "home" });
  let s = p.state;
  if (open) {
    s = dispatch(s, {
      id: "contest-agree",
      type: "sectContest",
      action: { kind: "prepare" },
    });
    for (let i = 0; i < 10; i++)
      s = dispatch(s, {
        id: `contest-prepare-${i}`,
        type: "advance",
        activity: "work",
        months: 12,
      });
  }
  if (
    !validState(s) ||
    s.sectContest.stage !== "invited" ||
    (open && s.month !== s.sectContest.starts)
  )
    throw new Error("Contest checkpoint not reached");
  return s;
}
