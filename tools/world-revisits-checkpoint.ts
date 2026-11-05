import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
import { lizhaoDepthCheckpoint } from "./lizhao-depth-checkpoint";
import { goldenCompletionPlayer } from "./golden-completion-checkpoint";
export function estateRevisitCheckpoint(
  choice: "careful" | "swift" = "careful",
) {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.cultivate(280);
  p.act({ kind: "travel", destination: "estate" });
  while (p.state.stones < 80)
    p.send({ type: "advance", activity: "work", months: 6 });
  while (p.state.herbs < 12) p.send({ type: "supplies" });
  p.act({ kind: "sideInvestigate", side: "estate" });
  p.fight("estate");
  p.act({ kind: "routePrepare", route: "estate", method: "service" });
  p.act({ kind: "routeChoose", route: "estate", choice });
  p.fight("salamander");
  p.act({ kind: "routeProcess", route: "estate", method: "self" });
  if (!p.state.foundationJourney.growth.routes.estate.processed)
    throw Error("Estate route incomplete");
  return p.state;
}
export function lizhaoRevisitCheckpoint(
  allocation: "share" | "private" | "seize" = "share",
) {
  const p = goldenCompletionPlayer(lizhaoDepthCheckpoint());
  p.lizhao({ kind: "verify" });
  p.lizhao({ kind: "assay", move: "drain" });
  p.lizhao({ kind: "assay", move: "bind" });
  p.lizhao({ kind: "allocate", allocation });
  p.lizhao({ kind: "return" });
  p.work(40);
  p.herbs(8);
  return p.state;
}
