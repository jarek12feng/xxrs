import { expect, it } from "vitest";
import { dispatch } from "../src/core";
import { foundationCombatFixture } from "../tools/foundation-combat-fixture";
import { combatFeedback } from "../src/foundation-journey/feedback";

it("reports saved exchanges with real loss, separate healing, and no rule mutation", () => {
  for (const main of ["spring", "blade", "breath"] as const)
    for (const move of ["guard", "strike", "discern"] as const)
      for (const enemy of [1, 135])
        for (const hp of [1, 40]) {
          const before = foundationCombatFixture("exit", main, "vial");
          Object.assign(before.foundationJourney.duel!, {
            enemy,
            hp,
            effect: "discern",
          });
          const command = {
            id: "round",
            type: "foundationJourney",
            action: { kind: "move", move },
          } as const;
          const after = dispatch(before, command);
          const snapshot = JSON.stringify([before, after]);
          const r = combatFeedback(before, after, command)!;
          expect(r).not.toBeNull();
          expect(r.damage).toBeLessThanOrEqual(enemy);
          expect(r.incoming).toBeLessThanOrEqual(hp);
          expect(r.player.after).toBe(hp - r.incoming + r.healing);
          expect(r.herbs).toBe(before.herbs - after.herbs);
          expect(JSON.stringify([before, after])).toBe(snapshot);
          if (enemy === 1) {
            expect(r).toMatchObject({
              outcome: "win",
              damage: 1,
              incoming: 0,
              healing: 0,
              herbs: 0,
            });
          } else if (after.foundationJourney.duel) {
            expect(r.player.after).toBe(after.foundationJourney.duel.hp);
            expect(r.enemy.after).toBe(after.foundationJourney.duel.enemy);
          }
        }
});
it("ignores rejected moves, withdrawals, and old result redisplays", () => {
  const before = foundationCombatFixture("exit", "spring", "vial");
  const command = {
    id: "round",
    type: "foundationJourney",
    action: { kind: "move", move: "guard" },
  } as const;
  expect(combatFeedback(before, before, command)).toBeNull();
  expect(combatFeedback(before, structuredClone(before), command)).toBeNull();
  const withdraw = {
    id: "leave",
    type: "foundationJourney",
    action: { kind: "withdraw" },
  } as const;
  expect(
    combatFeedback(before, dispatch(before, withdraw), withdraw),
  ).toBeNull();
});
