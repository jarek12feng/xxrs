import { createCultivator as createGame } from "./cultivator-fixture";
/** Isolated late-Golden fixture, not a normal-play checkpoint. */
import { type State } from "../src/core";
import { freshLizhao } from "../src/lizhao/state";
import { lizhaoExchange } from "../src/lizhao/combat";
export function lizhaoFixture(
  main: "spring" | "blade" | "breath" = "spring",
): State {
  const s = createGame("离照回归", "wood", 42, "insightful", "male");
  s.realm = 2;
  s.conclave.stage = 2;
  s.outerSea.location = "ferry";
  s.goldenCore.farShore = true;
  s.conclave.location = "away";
  s.journey.main = main;
  s.journey.known = [main];
  s.foundation = 40;
  s.study = 16;
  s.mastery = 16;
  s.sense = 36;
  s.foundationJourney.cultivation = 500;
  s.age = 1800;
  s.month = 1608;
  s.limit = 6000;
  s.stones = 300;
  s.herbs = 100;
  s.injury = 0;
  s.pending = null;
  s.lizhao = freshLizhao();
  return s;
}
export const lizhaoTick = (s: State) => ({
  ...s,
  month: s.month + 1,
  age: s.age + 1,
});
export function chooseLizhaoMove(s: State) {
  const d = s.lizhao.duel!;
  return (["guard", "strike", "discern"] as const)
    .map((move) => {
      const p = lizhaoExchange(s, move)!;
      return {
        move,
        score:
          p.toxin >= 100
            ? -10000
            : p.damage >= d.enemy
              ? 10000
              : p.incoming >= d.hp + p.healing
                ? -10000
                : p.damage + p.healing - p.incoming * 1.5 - p.toxin * 0.3,
      };
    })
    .sort((a, b) => b.score - a.score)[0]!.move;
}
