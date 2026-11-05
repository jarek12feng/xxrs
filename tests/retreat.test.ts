import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { expect, it } from "vitest";
import { dispatch, migrateSave } from "../src/core";
import {
  retreatDurations,
  retreatPlan,
  type RetreatPace,
} from "../src/retreat";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";

it("forecasts the known gathering letter interruption instead of the full retreat", () => {
  const s = conclaveCheckpoint();
  s.month = s.outerSea.notice! + 559;
  s.outerSea.reminded = false;
  const p = retreatPlan(s, 'regular');
  expect(p.batchMonths).toBe(41);
  expect(p.stopsForMeeting).toBe(true);
  const next = dispatch(s, {id:'letter-retreat',type:'advance',activity:'cultivate',months:p.batchMonths});
  expect(next.age).toBe(p.exitAge);
  expect(next.outerSea.cultivation - s.outerSea.cultivation).toBe(p.batchGain);
  expect(next.outerSea.reminded).toBe(true);
  expect(retreatPlan(next, 'regular').batchMonths).toBe(60);
});

it("stops the default late-foundation retreat at the circulation milestone", () => {
  const s = journeyCheckpoint('male', true);
  s.foundationJourney.cultivation = 492;
  s.foundationJourney.condensation = false;
  s.foundationJourney.won = s.foundationJourney.won.filter(x => x !== 'culmination');
  const plan = retreatPlan(s, 'long');
  expect(plan.target).toBe(500);
  const next = dispatch(s, { id:'circulation-retreat', type:'advance', activity:'cultivate', months:plan.batchMonths });
  expect(next.foundationJourney.cultivation).toBe(500);
  expect(next.age).toBe(plan.exitAge);
  expect(retreatPlan(s, 'long', 599).target).toBe(599);
});

it("scales player choices by realm and stage including golden early practice", () => {
  const s = createGame("闭关", "wood");
  expect(retreatDurations(s).map((x) => x.months)).toEqual([1, 3, 6]);
  s.qi = 120;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([3, 12, 36]);
  s.realm = 1;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([6, 24, 60]);
  s.foundationJourney.cultivation = 200;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([12, 36, 120]);
  expect(retreatDurations({ ...s, realm: 2 }).map(x=>x.months)).toEqual([12,60,120]);
});
it("shortens to the earned cap and reports actual exit age without spending the unused years", () => {
  const s = journeyCheckpoint();
  s.foundationJourney.cultivation = 198;
  const p = retreatPlan(s, "long");
  expect(p.target).toBe(199);
  expect(p.batchMonths).toBeLessThan(p.duration);
  const n = dispatch(s, {
    id: "retreat",
    type: "advance",
    activity: "cultivate",
    months: p.batchMonths,
  });
  expect(n.foundationJourney.cultivation).toBe(199);
  expect(n.age).toBe(p.exitAge);
  expect(n.limit - n.age).toBe(p.remainingAtExit);
  expect(n.stones).toBe(s.stones);
  expect(n.herbs).toBe(s.herbs);
  expect(retreatPlan(n).batchMonths).toBe(0);
});
it("all durations use the same monthly gains, seed and saved remainder", () => {
  for (const pace of ["short", "regular", "long"] as RetreatPace[]) {
    const s = journeyCheckpoint();
    const p = retreatPlan(s, pace);
    const n = dispatch(s, {
      id: "batch",
      type: "advance",
      activity: "cultivate",
      months: p.batchMonths,
    });
    let monthly = s;
    for (let i = 0; i < p.batchMonths; i++)
      monthly = migrateSave(
        dispatch(monthly, {
          id: `m${i}`,
          type: "advance",
          activity: "cultivate",
          months: 1,
        }),
      );
    expect(n.foundationJourney).toEqual(monthly.foundationJourney);
    expect(n.cultivationRemainder).toBe(monthly.cultivationRemainder);
    expect(n.seed).toBe(monthly.seed);
    expect(n.age).toBe(monthly.age);
    expect(
      n.foundationJourney.cultivation - s.foundationJourney.cultivation,
    ).toBe(p.batchGain);
  }
});
it("a planned retreat reserves the final month and pending events interrupt a long request", () => {
  const old = journeyCheckpoint();
  old.age = old.limit - 4;
  const p = retreatPlan(old, "long");
  expect(p.batchMonths).toBe(3);
  expect(p.remainingAtExit).toBe(1);
  const n = dispatch(old, {
    id: "old",
    type: "advance",
    activity: "cultivate",
    months: p.batchMonths,
  });
  expect(n.status).toBe("alive");
  expect(retreatPlan(n).batchMonths).toBe(0);
  const fresh = createGame("来信", "wood");
  fresh.adventure.step = "done";
  const plan = retreatPlan(fresh, "long");
  const stop = dispatch(fresh, {
    id: "event",
    type: "advance",
    activity: "cultivate",
    months: plan.batchMonths,
  });
  expect(stop.pending?.kind).toBe("meeting");
  expect(stop.month).toBe(3);
  expect(stop.month).toBeLessThan(plan.batchMonths);
  expect(
    dispatch(stop, {
      id: "again",
      type: "advance",
      activity: "cultivate",
      months: plan.batchMonths,
    }),
  ).toBe(stop);
});
