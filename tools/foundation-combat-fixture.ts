import { createGame } from "../src/core";
import { foundationPower } from "../src/foundation-journey/combat";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId } from "../src/foundation-journey/state";

export function foundationCombatFixture(
  id: BattleId,
  technique: "spring" | "blade" | "breath",
  gear: "sword" | "vial",
  preparation: "normal" | "strong" | "no-grass" = "normal",
) {
  const e = challenges[id];
  // Equal-budget controlled fixture. Not a fresh-character route, not human win rate.
  const s = createGame("控制条件", "wood", 2654435761, "insightful");
  Object.assign(s, {
    realm: 1,
    foundation: preparation === "strong" ? 24 : 12,
    sense: 8,
    study: 4,
    herbs: preparation === "no-grass" ? 0 : 8,
  });
  s.journey.main = technique;
  s.journey.support = "guard";
  s.journey.relics[gear] = 1;
  s.journey.equipped = gear;
  s.growth.training[technique] = id === "well" || id === "rank1" ? 1 : 2;
  s.journey.known = [technique, "guard"];
  const q = s.foundationJourney;
  q.cultivation = e.cultivation;
  q.inheritance = id === "well" || id === "rank1" ? "none" : technique;
  q.rescue = ["rescue", "culmination"].includes(id) ? 3 : 0;
  q.condensation = id === "culmination";
  q.duel = {
    ruleset: 2,
    id: id,
    hp: foundationPower(s).hp,
    enemy: e.hp,
    turn: 0,
    effect: "none",
    aid: false,
  };
  return s;
}
