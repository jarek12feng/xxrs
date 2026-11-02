import { expect, it } from "vitest";
import { createGame, dispatch, migrateSave, validState } from "../src/core";
import { cultivationProjection, incidentalQiGain } from "../src/cultivation";
import { foundationCombatFixture } from "../tools/foundation-combat-fixture";
import {
  findCombatRoute,
  fixedCombatRoute,
} from "../tools/foundation-tactics-audit";
import { growthQuote } from "../src/foundation-journey/growth";
import { planOrder } from "../src/workshop/recipes";
import { readiness } from "../src/expedition/combat";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { fullBalanceJourney } from "../tools/balance-review";

function resting() {
  const s = journeyCheckpoint();
  return s;
}
it("fractional cultivation survives other activities and saves; long and monthly commands settle identically", () => {
  const s = resting();
  const c = {
    type: "advance",
    activity: "cultivate",
    months: 120,
    id: "long",
  } as const;
  const batch = dispatch(s, c);
  let monthly = s;
  for (let i = 0; i < 120; i++)
    monthly = migrateSave(
      dispatch(monthly, { ...c, id: `month${i}`, months: 1 }),
    );
  for (const key of [
    "age",
    "month",
    "cultivationRemainder",
    "seed",
    "stones",
  ] as const)
    expect(batch[key]).toEqual(monthly[key]);
  expect(batch.foundationJourney).toEqual(monthly.foundationJourney);
  expect(batch.foundationJourney.cultivation).toBe(24);
  expect(cultivationProjection(s, 199, 120).batchGain).toBe(24);
  const partial = dispatch(s, { ...c, months: 1 });
  expect(partial.cultivationRemainder).toBe(48);
  const work = dispatch(partial, {
    id: "work",
    type: "advance",
    activity: "work",
    months: 1,
  });
  expect(work.cultivationRemainder).toBe(48);
  expect(migrateSave(work)).toEqual(work);
  expect(dispatch(batch, c)).toBe(batch);
});
it("forecasts the change in qi accumulation speed and caps without carrying surplus through a bottleneck", () => {
  const s = createGame("瓶颈", "wood");
  s.adventure.step = "done";
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.qi = 175;
  const forecast = cultivationProjection(s, 239, 120);
  const n = dispatch(s, {
    id: "cross-speed",
    type: "advance",
    activity: "cultivate",
    months: forecast.batchMonths,
  });
  expect(n.qi - s.qi).toBe(forecast.batchGain);
  expect(n.month - s.month).toBe(forecast.monthsToTarget);
  expect(n.qi).toBe(239);
  expect(n.cultivationRemainder).toBe(0);
  expect(
    dispatch(n, {
      id: "blocked",
      type: "advance",
      activity: "cultivate",
      months: 120,
    }),
  ).toBe(n);
  expect(incidentalQiGain({ ...s, qi: 200 }, "work")).toBeLessThanOrEqual(1);
});
it("long retreats stop at an event or death, and refuse combat without touching the ledger", () => {
  const fresh = createGame("来信", "wood");
  fresh.adventure.step = "done";
  const stop = dispatch(fresh, {
    id: "event",
    type: "advance",
    activity: "cultivate",
    months: 120,
  });
  expect(stop.month).toBe(3);
  expect(stop.pending?.kind).toBe("meeting");
  const s = resting();
  s.age = s.limit - 1;
  s.cultivationRemainder = 239;
  const end = dispatch(s, {
    id: "death",
    type: "advance",
    activity: "cultivate",
    months: 120,
  });
  expect(end.status).toBe("dead");
  expect(end.foundationJourney.cultivation).toBe(0);
  expect(end.cultivationRemainder).toBe(239);
  const battle = foundationCombatFixture("well", "spring", "vial");
  expect(
    dispatch(battle, {
      id: "battle",
      type: "advance",
      activity: "cultivate",
      months: 120,
    }),
  ).toBe(battle);
});
it("v22 migration starts only fractional bookkeeping, preserves the original and rejects malformed or future data", () => {
  const s = createGame("原档", "wood");
  const old = { ...s, version: 22 };
  delete (old as Partial<typeof old>).cultivationRemainder;
  const copy = structuredClone(old),
    n = migrateSave(old);
  expect(old).toEqual(copy);
  expect(n).toEqual(s);
  for (const value of [-1, 240, 0.5, NaN, undefined])
    expect(validState({ ...s, cultivationRemainder: value })).toBe(false);
  expect(() => migrateSave({ ...s, version: 25 })).toThrow();
});
it("same-stage second-rank upgrades buy real attack and armor, with craft cheaper than commission", () => {
  const s = resting();
  s.journey.equipped = "sword";
  s.journey.relics.sword = 1;
  const first = readiness(s);
  s.journey.relics.sword = 2;
  expect(readiness(s).damage - first.damage).toBe(3);
  s.journey.equipped = "vial";
  s.journey.relics.vial = 1;
  const armor = readiness(s).armor;
  s.journey.relics.vial = 2;
  expect(readiness(s).armor - armor).toBe(2);
  s.journey.relics.sword = 1;
  const craft = planOrder(s, { product: "sword", method: "craft" }),
    commission = planOrder(s, { product: "sword", method: "commission" });
  expect(craft.stones + craft.herbs * 2).toBe(24);
  expect(commission.stones).toBeGreaterThan(craft.stones);
});
it("buying all preparation materials never costs more than buying the equivalent route service", () => {
  const s = resting();
  s.foundationJourney.ferry = 4;
  s.foundationJourney.cultivation = 200;
  s.stones = 200;
  s.herbs = 20;
  s.workshop.ward = 1;
  for (const route of ["estate", "snow", "frontier"] as const) {
    s.foundationJourney.location = route;
    s.growth.training.spring = 2;
    s.journey.main = "spring";
    const supplies = growthQuote(s, {
        kind: "routePrepare",
        route,
        method: "supplies",
      }),
      service = growthQuote(s, {
        kind: "routePrepare",
        route,
        method: "service",
      });
    expect(supplies.error).toBe("");
    expect(service.error).toBe("");
    const equivalent =
      supplies.stones +
      supplies.herbs * 2 +
      supplies.ward * planOrder(s, { product: "ward", method: "buy" }).stones;
    expect(equivalent).toBeLessThan(service.stones);
    expect(supplies.months).toBe(service.months);
  }
});
it("spring can win with changing moves but cannot hold guard through the sampled mainline, even with a second-rank relic", () => {
  for (const id of [
    "well",
    "application",
    "salamander",
    "deer",
    "frontier",
    "rescue",
    "culmination",
  ] as const)
    for (const gear of ["sword", "vial"] as const) {
      const s = foundationCombatFixture(id, "spring", gear);
      s.journey.relics[gear] = 2;
      expect(findCombatRoute(s), `${id}/${gear}`).not.toBeNull();
      expect(fixedCombatRoute(s, "guard").won, `${id}/${gear}`).toBe(false);
    }
});
it("earned preparation saves years through public commands while an ordinary non-romance route still completes", () => {
  const ordinary = fullBalanceJourney("frontier", "spring"),
    prepared = fullBalanceJourney("frontier", "spring", true);
  expect(ordinary.age).toBeGreaterThan(90);
  expect(ordinary.age).toBeLessThan(170);
  expect(prepared.age).toBeLessThan(ordinary.age - 10);
  expect(prepared.remaining).toBeGreaterThan(30);
});

it("all three mains can meet the salamander with either first-rank relic by reading the water", () => {
  for (const main of ["spring", "blade", "breath"] as const)
    for (const gear of ["sword", "vial"] as const) {
      const s = foundationCombatFixture("salamander", main, gear);
      expect(findCombatRoute(s), `${main}/${gear}`).not.toBeNull();
    }
});
