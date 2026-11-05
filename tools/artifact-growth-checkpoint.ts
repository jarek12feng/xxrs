/** Isolated, public-command late-Golden route. Never a claim of normal new-save UI play. */
import { lizhaoCheckpoint } from "./lizhao-checkpoint";
import { goldenCompletionPlayer } from "./golden-completion-checkpoint";
import { chooseLizhaoMove } from "./lizhao-fixture";
export function artifactGrowthCheckpoint() {
  const p = goldenCompletionPlayer(lizhaoCheckpoint());
  p.send({ type: "artifactGrowth", action: { kind: "hear" } });
  p.lizhao({ kind: "visit" });
  p.lizhao({ kind: "route", route: "cooperate" });
  p.lizhao({ kind: "prepare", preparation: "ward" });
  p.lizhao({ kind: "enter" });
  p.lizhao({ kind: "fight" });
  p.until(
    () => !p.state.lizhao.duel,
    () => p.lizhao({ kind: "move", move: chooseLizhaoMove(p.state) }),
    "outer battle",
    18,
  );
  if (!p.state.lizhao.outerCleared) throw Error("Failed outer route");
  p.lizhao({ kind: "return" });
  return p.state;
}
