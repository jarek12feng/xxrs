import { expect, it } from "vitest";
import { createGame, dispatch, migrateSave } from "../src/core";
import {
  retreatDurations,
  retreatPlan,
  type RetreatPace,
} from "../src/retreat";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";

it("scales player choices by realm and stage without opening golden core", () => {
  const s = createGame("闭关", "wood");
  expect(retreatDurations(s).map((x) => x.months)).toEqual([1, 3, 6]);
  s.qi = 120;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([3, 12, 36]);
  s.realm = 1;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([6, 24, 60]);
  s.foundationJourney.cultivation = 200;
  expect(retreatDurations(s).map((x) => x.months)).toEqual([12, 36, 120]);
  expect(retreatDurations({ ...s, realm: 2 })).toEqual([]);
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
