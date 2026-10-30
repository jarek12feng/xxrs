import { createGame } from "../src/core";
import { foundationPower } from "../src/foundation-journey/combat";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId } from "../src/foundation-journey/state";
import { findCombatRoute, fixedCombatRoute } from "./foundation-tactics-audit";
const rows = [];
for (const preparation of ["normal", "strong", "no-grass"] as const)
  for (const technique of ["spring", "blade", "breath"] as const)
    for (const [id, e] of Object.entries(challenges)) {
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
      s.journey.relics.vial = 1;
      s.journey.equipped = "vial";
      s.growth.training[technique] = id === "well" || id === "rank1" ? 1 : 2;
      const q = s.foundationJourney;
      q.cultivation = e.cultivation;
      q.inheritance = id === "well" || id === "rank1" ? "none" : technique;
      q.rescue = ["rescue", "culmination"].includes(id) ? 3 : 0;
      q.condensation = id === "culmination";
      q.duel = {
        ruleset: 2,
        id: id as BattleId,
        hp: foundationPower(s).hp,
        enemy: e.hp,
        turn: 0,
        effect: "none",
        aid: false,
      };
      const plan = findCombatRoute(s);
      rows.push({
        preparation,
        technique,
        id,
        plan: plan
          ? {
              turns: plan.moves.length,
              hp: plan.state.foundationJourney.duel!.hp,
              grass: plan.grass,
              moves: plan.moves,
            }
          : null,
        baselines: Object.fromEntries(
          (["guard", "strike", "discern", "read"] as const).map((m) => [
            m,
            fixedCombatRoute(s, m),
          ]),
        ),
      });
    }
console.log(
  JSON.stringify(
    {
      method:
        "Equal-budget synthetic combat fixtures; 160-state bounded search, no player win rates or elapsed playtime",
      rows,
    },
    null,
    2,
  ),
);
