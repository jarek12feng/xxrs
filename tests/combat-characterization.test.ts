import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { type Technique } from "../src/core";
import { tacticalPreview, readiness } from "../src/combat/game";
import { foundationExchange } from "../src/foundation-journey/combat";
import { turnPreview } from "../src/social";
import { challenges } from "../src/foundation-journey/content";
import expected from "./fixtures/combat-equipment-sequence.json";

// Historical extraction baseline remains in combat-before-extraction.json.
// 2026-11-05: only realm-one tactical/foundation groups change for mirror sequences;
// arena, realm-zero and realm-two fingerprints stay identical. Sequence rules and
// command settlement are independently asserted in equipment-sequence.test.ts.
// These are behavior fingerprints,
// not balance or win-rate claims. Each group enumerates HP, moves, effects and equipment.
function fingerprint(value: unknown) {
  return createHash("sha256")
    .update(
      JSON.stringify(value, (key, entry) =>
        key === "effects" ? undefined : entry,
      ),
    )
    .digest("hex");
}
function fixture(main: Technique, realm: 0 | 1 | 2) {
  const s = createGame("战斗对照", "wood", 42);
  s.realm = realm;
  s.foundation = 12;
  s.sense = 11;
  s.study = 8;
  s.mastery = 9;
  s.journey.main = main;
  s.journey.support = "lantern";
  s.growth.training[main] = 2;
  s.foundationJourney.inheritance = main as "blade" | "spring" | "breath";
  s.foundationJourney.cultivation = 400;
  s.foundationJourney.condensation = true;
  s.journey.equipped = main === "blade" ? "sword" : "vial";
  s.journey.relics = { sword: 2, vial: 2 };
  s.workshop.temper = { sword: "array", vial: "flow" };
  s.treasures.equipped = ["mirror"];
  s.treasures.owned.mirror = 2;
  return s;
}
it("preserves tactical, foundation and arena calculations with explicit equipment sequences", () => {
  const groups: Record<string, string> = {};
  for (const main of ["blade", "spring", "breath"] as const) {
    for (const realm of [0, 1, 2] as const) {
      const s = fixture(main, realm);
      const values: unknown[] = [];
      for (const attuned of [false, true]) {
        s.outerSea.attuned = attuned;
        s.conclave.attuned = attuned;
        for (const method of ["continue", "clear"] as const) {
          s.outerSea.method = method;
          for (const herbs of [0, 3]) {
            s.herbs = herbs;
            for (const hp of [1, 20, 60])
              for (const enemy of [1, 40, 120])
                for (const move of ["guard", "strike", "discern"] as const)
                  for (const effect of ["none", "guard", "discern"]) {
                    const power = readiness(s);
                    if (attuned) { power.damage += 4; power.armor += 8; }
                    // Legacy attunement used to supply these bonuses automatically, even below gold.
                    // Supply that historical input explicitly; v35 deployment is tested separately.
                    const p = tacticalPreview(s, {
                      power,
                      move,
                      encounter: {
                        realm: 1,
                        stage: 2,
                        hp: 120,
                        attack: 30,
                        pattern: ["guard", "strike", "discern"],
                      },
                      battle: { hp, enemy, turn: 2 },
                      effect,
                      arrayCore: true,
                    });
                    values.push([power, p]);
                  }
          }
        }
      }
      groups[`tactical/${main}/${realm}`] = fingerprint(values);
    }
    const s = fixture(main, 1);
    const values: unknown[] = [];
    for (const id of Object.keys(challenges) as (keyof typeof challenges)[])
      for (const ruleset of [1, 2] as const)
        for (const herbs of [0, 3]) {
          s.herbs = herbs;
          for (const effect of ["none", "guard", "discern", "strike"] as const)
            for (const enemy of [1, challenges[id].hp]) {
              s.foundationJourney.duel = {
                id,
                hp: 25,
                enemy,
                turn: 3,
                effect,
                ruleset,
                aid: false,
              };
              for (const move of ["guard", "strike", "discern"] as const)
                values.push(foundationExchange(s, move));
            }
        }
    groups[`foundation/${main}`] = fingerprint(values);
    const arena: unknown[] = [];
    for (const support of [null, "guard", "herb", "lantern"] as const) {
      s.journey.support = support;
      for (const herbs of [0, 3])
        for (const hp of [1, 20, 50]) {
          s.herbs = herbs;
          for (const enemyHp of [1, 30])
            for (const turn of [0, 3, 5]) {
              s.social.arena.duel = {
                hp,
                maxHp: 50,
                enemyHp,
                turn,
                opponent: 2,
                log: [],
              };
              for (const stance of ["break", "endure", "discern"] as const)
                arena.push(turnPreview(s, stance));
            }
        }
    }
    groups[`arena/${main}`] = fingerprint(arena);
  }
  expect(groups).toEqual(expected);
});
