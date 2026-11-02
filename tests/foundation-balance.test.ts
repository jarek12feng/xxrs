import { expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { foundationCombatFixture } from "../tools/foundation-combat-fixture";
import {
  findCombatRoute,
  fixedCombatRoute,
} from "../tools/foundation-tactics-audit";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId } from "../src/foundation-journey/state";
import { foundationPower, foundationExchange } from "../src/foundation-journey/combat";
import { tacticalAdjustment } from "../src/foundation-journey/tactics";
import { journeyPreparation } from "../src/foundation-journey/preparation";

it("all mains have supplied routes with either first-tier relic, and dry routes with their fitting relic", () => {
  for (const preparation of ["normal", "strong", "no-grass"] as const)
    for (const technique of ["spring", "blade", "breath"] as const)
      for (const gear of ["vial", "sword"] as const)
        for (const id of (Object.keys(challenges) as BattleId[]).filter(id=>!["application","salamander","deer","steady","pactRival"].includes(id))) {
          if (
            preparation === "no-grass" &&
            gear !== (technique === "blade" ? "sword" : "vial")
          )
            continue;
          const s = foundationCombatFixture(id, technique, gear, preparation);
          const route = findCombatRoute(s);
          expect(
            route,
            `${preparation}/${technique}/${gear}/${id}`,
          ).not.toBeNull();
          expect(route!.state.herbs).toBeGreaterThanOrEqual(0);
        }
});

it("blade's offensive relic pays off at the two late gates without requiring perfect survival", () => {
  for (const id of ["rank5", "culmination"] as const) {
    const sword = findCombatRoute(
      foundationCombatFixture(id, "blade", "sword"),
    )!;
    const vial = findCombatRoute(foundationCombatFixture(id, "blade", "vial"))!;
    expect(sword.moves.length).toBeLessThanOrEqual(vial.moves.length);
    expect(foundationExchange(foundationCombatFixture(id,"blade","sword"),"strike")!.damage).toBeGreaterThan(foundationExchange(foundationCombatFixture(id,"blade","vial"),"strike")!.damage);
    expect(sword.state.foundationJourney.duel!.hp).toBeGreaterThanOrEqual(8);
    for (const gear of ["vial", "sword"] as const)
      for (const move of ["guard", "strike", "discern"] as const)
        expect(
          fixedCombatRoute(foundationCombatFixture(id, "blade", gear), move)
            .won,
        ).toBe(false);
  }
});

it("spring herbs still buy survival while empty inventory no longer blocks the ordinary challenge matrix", () => {
  for (const gear of ["vial", "sword"] as const) {
    expect(
      fixedCombatRoute(
        foundationCombatFixture("rank4", "spring", gear),
        "guard",
      ).won,
    ).toBe(false);
    const stocked = findCombatRoute(
      foundationCombatFixture("culmination", "spring", gear),
    )!;
    const dry = findCombatRoute(
      foundationCombatFixture("culmination", "spring", gear, "no-grass"),
    )!;
    expect(stocked.grass).toBeGreaterThan(0);
    // Compare identical tactics: fastest-win beam routes can trade a round for HP.
    const stockedStart = foundationCombatFixture("culmination","spring",gear);
    const dryStart = foundationCombatFixture("culmination","spring",gear,"no-grass");
    stockedStart.foundationJourney.duel!.effect="guard";
    dryStart.foundationJourney.duel!.effect="guard";
    expect(foundationExchange(stockedStart,"guard")!.healing).toBeGreaterThan(foundationExchange(dryStart,"guard")!.healing);
    expect(dry.grass).toBe(0);
  }
});

it("new style rules match command settlement, remain deterministic, and never heal lethal hits", () => {
  for (const technique of ["spring", "blade", "breath"] as const)
    for (const grass of [0, 4])
      for (const hp of [1, 50])
        for (const enemy of [1, 135])
          for (const move of ["guard", "strike", "discern"] as const) {
            const s = foundationCombatFixture("exit", technique, "sword");
            s.herbs = grass;
            Object.assign(s.foundationJourney.duel!, {
              hp,
              enemy,
              effect: "guard",
              turn: 1,
            });
            const before = structuredClone(s);
            const p = foundationExchange(s, move)!;
            const command = {
              id: "balance-turn",
              type: "foundationJourney",
              action: { kind: "move", move },
            } as const;
            const n = dispatch(s, command);
            expect(s).toEqual(before);
            expect(dispatch(before, command)).toEqual(n);
            expect(n.seed).toBe(s.seed);
            expect(n.herbs).toBe(s.herbs - p.herbs);
            if (enemy <= p.damage) {
              expect(p.incoming).toBe(0);
              expect(p.herbs).toBe(0);
              expect(n.foundationJourney.won).toContain("exit");
            } else if (p.incoming >= hp) {
              expect(p.healing).toBe(0);
              expect(n.foundationJourney.duel).toBeNull();
              expect(n.injury).toBe(s.injury + 2);
            } else {
              expect(n.foundationJourney.duel!.hp).toBe(
                hp - p.incoming + p.healing,
              );
              expect(n.foundationJourney.duel!.enemy).toBe(enemy - p.damage);
            }
          }
});

it("blade bonuses require setup; old battle rules retain their original style and breath bonus", () => {
  const s = foundationCombatFixture("well", "blade", "sword");
  expect(tacticalAdjustment(s, "strike").note).not.toContain("剑经循隙");
  s.foundationJourney.duel!.effect = "discern";
  expect(tacticalAdjustment(s, "strike").note).toContain("剑经循隙");
  s.foundationJourney.duel!.ruleset = 1;
  expect(tacticalAdjustment(s, "strike")).toEqual({
    damage: 0,
    incoming: 0,
    note: "",
  });
  s.journey.main = "breath";
  expect(foundationExchange(s, "discern")!.note).toContain("伤害 +7");
  s.foundationJourney.duel!.ruleset = 2;
  expect(foundationExchange(s, "discern")!.note).toContain("伤害 +5");
  expect(foundationExchange(s, "discern")!.note).not.toContain("伤害 +7");
  s.journey.main = "spring";
  expect(tacticalAdjustment(s, "guard").note).toContain("长春固护");
  s.foundationJourney.duel!.effect = "guard";
  expect(tacticalAdjustment(s, "guard").note).not.toContain("长春固护");
});

it("spring preparation offers optional herbs and budgets both herbs and entry cost", () => {
  const s = createGame("补给", "wood", 42);
  s.realm = 1;
  s.journey.main = "spring";
  s.foundationJourney.ferry = 1;
  s.herbs = 0;
  s.stones = 8;
  expect(journeyPreparation(s)).toMatchObject({
    needsHerbs: true,
    needsFunds: true,
  });
  s.stones = 12;
  expect(journeyPreparation(s)?.needsFunds).toBe(false);
  const n = dispatch(s, { id: "buy", type: "supplies" });
  expect(n.herbs).toBe(4);
  expect(n.stones).toBe(4);
  expect(journeyPreparation(n)?.needsHerbs).toBe(false);
  s.journey.main = "blade";
  expect(journeyPreparation(s)?.needsHerbs).toBe(false);
});

it("new growth challenges are reachable with a developed foundation and fitting relic",()=>{
 for(const id of ["application","salamander","deer","steady","pactRival"] as const)for(const main of ["spring","blade","breath"] as const){
  const s=foundationCombatFixture(id,main,main==="blade"?"sword":"vial","strong");
  if (id === "pactRival") {
    // Optional treasure contention is tested after preparation, not at entry eligibility.
    s.foundationJourney.cultivation = 350;
    s.growth.training.guard = 2;
    s.journey.relics[main === "blade" ? "sword" : "vial"] = 2;
    s.foundationJourney.duel!.hp = foundationPower(s).hp;
  }
  expect(findCombatRoute(s),`${id}/${main}`).not.toBeNull();
 }
});
