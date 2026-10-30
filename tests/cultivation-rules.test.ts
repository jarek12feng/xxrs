import { describe, expect, it } from "vitest";
import { createGame, dispatch, type State } from "../src/core";
import {
  cultivationStageIndex,
  cultivationMonthlyGain,
  cultivationProjection,
  lifeEfficiency,
} from "../src/cultivation";
function player(realm: 0 | 1 = 1): State {
  const s = createGame("修行验证", "sword", 42);
  s.adventure.step = "done";
  s.realm = realm;
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.qi = 0;
  s.month = 48;
  s.age = 240;
  s.limit = 792;
  return s;
}
const meditate = (s: State, months: number, id = "meditate") =>
  dispatch(s, { id, type: "advance", activity: "cultivate", months });
describe("修行、寿元与小境界", () => {
  it("uses four minor stages in each realm without a story gate", () => {
    for (const realm of [0, 1] as const)
      for (const stage of [0, 1, 2, 3] as const) {
        const s = player(realm);
        s.qi = stage * 120;
        s.foundationJourney.cultivation = stage * 200;
        expect(cultivationStageIndex(s)).toBe(stage);
      }
    const s = player();
    s.foundationJourney.cultivation = 199;
    const n = meditate(s, 1);
    expect(cultivationStageIndex(n)).toBe(1);
    expect(n.foundationJourney.ferry).toBe(0);
  });
  it("reduces meditation gains with remaining life in both realms", () => {
    for (const realm of [0, 1] as const) {
      const young = player(realm);
      const old = { ...young, age: young.limit - 60 };
      expect(cultivationMonthlyGain(old)).toBeLessThan(
        cultivationMonthlyGain(young),
      );
      expect(cultivationMonthlyGain(old)).toBeGreaterThanOrEqual(1);
      expect(lifeEfficiency(old)).toBeLessThan(lifeEfficiency(young));
    }
  });
  it("recalculates each month and forecast agrees across an efficiency boundary", () => {
    const s = player();
    s.root = 8;
    s.age = s.limit - 188;
    const prediction = cultivationProjection(s, 600);
    const batch = meditate(s, 12, "batch");
    let monthly = s;
    for (let i = 0; i < 12; i++) monthly = meditate(monthly, 1, `single-${i}`);
    expect(batch.foundationJourney.cultivation).toBe(
      monthly.foundationJourney.cultivation,
    );
    expect(batch.foundationJourney.cultivation).toBe(prediction.batchGain);
    expect(batch.age).toBe(monthly.age);
    expect(batch.seed).toBe(monthly.seed);
    expect(prediction.batchGain).toBeLessThan(12 * cultivationMonthlyGain(s));
  });
  it("does not give cultivation or resources in the final month or allow another action", () => {
    const s = player();
    s.age = s.limit - 1;
    const n = meditate(s, 12);
    expect(n.status).toBe("dead");
    expect(n.age).toBe(s.limit);
    expect(n.foundationJourney.cultivation).toBe(
      s.foundationJourney.cultivation,
    );
    expect(n.stones).toBe(s.stones);
    expect(meditate(n, 1, "again")).toBe(n);
    expect(cultivationProjection(s).monthsToTarget).toBeNull();
    expect(cultivationMonthlyGain(s)).toBe(0);
  });
  it("cannot bypass foundation cultivation through work or sword training", () => {
    for (const activity of ["work", "train"] as const) {
      const s = player();
      s.journey.main = "blade";
      const n = dispatch(s, {
        id: activity,
        type: "advance",
        activity,
        months: 1,
      });
      expect(n.foundationJourney.cultivation).toBe(0);
      expect(n.month).toBe(s.month + 1);
    }
  });
  it("retains exploration-based efficiency and a meaningful foundation time cost", () => {
    const s = player();
    const slow = cultivationProjection(s, 600);
    s.journey.main = "blade";
    s.growth.training.blade = 2;
    s.foundationJourney.inheritance = "blade";
    s.foundationJourney.rescue = 3;
    const prepared = cultivationProjection(s, 600);
    expect(prepared.monthsToTarget).toBeLessThan(slow.monthsToTarget!);
    expect(prepared.monthsToTarget).toBeGreaterThan(60);
    expect(slow.monthsToTarget).toBeGreaterThan(200);
  });
  it("requires a pill and cannot use breakthrough lifespan to revive on its final month", () => {
    const s = player(0);
    s.qi = 360;
    s.pills = 0;
    const command = { id: "break", type: "break", pill: true } as const;
    expect(dispatch(s, command)).toBe(s);
    s.pills = 1;
    s.age = s.limit - 1;
    const n = dispatch(s, command);
    expect(n.status).toBe("dead");
    expect(n.realm).toBe(0);
    expect(n.limit).toBe(s.limit);
    expect(n.pills).toBe(1);
    expect(n.seed).toBe(s.seed);
    expect(dispatch(n, { ...command, id: "revive" })).toBe(n);
  });
  it("successful breakthrough keeps real age and only adds eighteen years", () => {
    const s = player(0);
    s.qi = 360;
    s.pills = 1;
    s.foundation = 24;
    s.mastery = 12;
    s.sense = 12;
    let success: State | undefined;
    for (let seed = 1; seed <= 100; seed++) {
      const n = dispatch(
        { ...s, seed },
        { id: `break-${seed}`, type: "break", pill: true },
      );
      if (n.realm === 1) {
        success = n;
        break;
      }
    }
    expect(success).toBeDefined();
    expect(success!.age).toBe(s.age + 1);
    expect(success!.limit).toBe(s.limit + 216);
    expect(success!.pills).toBe(0);
  });
  it("reports no gain at the cap and retains actual overshoot in a stage forecast", () => {
    const s = player();
    s.foundationJourney.cultivation = 199;
    expect(cultivationProjection(s).batchGain).toBe(
      meditate(s, 1).foundationJourney.cultivation - 199,
    );
    s.foundationJourney.cultivation = 600;
    expect(cultivationMonthlyGain(s)).toBe(0);
  });
  it("pauses a breakthrough month for a pending story before consuming its pill", () => {
    const s = player(0);
    s.qi = 360;
    s.pills = 1;
    s.story.stage = "unmet";
    s.month = 2;
    const n = dispatch(s, { id: "break-meeting", type: "break", pill: true });
    expect(n.pending?.kind).toBe("meeting");
    expect(n.realm).toBe(0);
    expect(n.pills).toBe(1);
    expect(n.seed).toBe(s.seed);
  });
});
