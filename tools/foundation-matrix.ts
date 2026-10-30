import { foundationCombatFixture } from "./foundation-combat-fixture";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId } from "../src/foundation-journey/state";
import { findCombatRoute, fixedCombatRoute } from "./foundation-tactics-audit";
const rows = [];
for (const gear of ["vial", "sword"] as const)
  for (const preparation of ["normal", "strong", "no-grass"] as const)
    for (const technique of ["spring", "blade", "breath"] as const)
      for (const id of Object.keys(challenges)) {
        const s = foundationCombatFixture(
          id as BattleId,
          technique,
          gear,
          preparation,
        );
        const plan = findCombatRoute(s);
        rows.push({
          gear,
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
