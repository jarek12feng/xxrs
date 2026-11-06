import {qiCultivationStep} from './qi-cultivation-policy';
import { admissionStep } from './initiation-policy';
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
  p.act({ kind: "travel", destination: "home" });
  for(let i=0;i<4 && p.state.journey.branch==='none';i++) {
    const step=admissionStep(p.state,'dan'); if(!step)throw Error('Missing admission witness');
    p.send(step);
  }
  // A new member reports after admission to receive the next meeting notice.
  p.send({type:'duty',duty:'copy'});
  for(let i=0;p.state.qiJourney.cultivation.work&&i<12;i++)p.send(qiCultivationStep(p.state)!);
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
