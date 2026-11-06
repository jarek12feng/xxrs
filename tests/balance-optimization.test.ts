import { describe, expect, it } from "vitest";
import { createCultivator } from "../tools/cultivator-fixture";
import { foundationStep } from "../tools/foundation-playthrough";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import { dispatch, migrateSave, validState } from "../src/core";
import {
  cultivationMonth,
  cultivationProjection,
  goldenChance,
} from "../src/progression";
import { monthlyWorkIncome, dutyIncome } from "../src/preparation-rates";
import { preparationPlan } from "../src/workshop/preparation";
import { qiCultivationStep } from "../tools/qi-cultivation-policy";
import { ascensionOptions } from "../src/ascension/rules";

function qiPlayer() {
  let s = createCultivator("数值衔接", "wood", 42);
  for (let i = 0; i < 600; i++) {
    const intent = foundationStep(s);
    if (intent.type === "break") {
      // Numerical boundary control using otherwise command-earned, valid progress.
      s.qi = 230;
      expect(validState(s)).toBe(true);
      return s;
    }
    s = dispatch(s, { ...intent, id: `ready-${i}` });
  }
  throw Error("No ready qi state");
}
describe("数值衔接优化", () => {
  it("180不再暗降速度，后期240减速；跨界预估、逐月与读档结算相同", () => {
    const s = qiPlayer();
    const units = (qi: number) => {
      const r = cultivationMonth({ ...s, qi, cultivationRemainder: 0 });
      return r.gain * 240 + r.remainder;
    };
    expect(units(179)).toBe(units(180));
    expect(units(239)).toBe(units(240) * 2);
    const forecast = cultivationProjection(s, 300);
    const batch = dispatch(s, {
      type: "advance",
      activity: "cultivate",
      months: 12,
      id: "batch",
    });
    let monthly = s;
    for (let i = 0; i < 12; i++)
      monthly = migrateSave(
        dispatch(monthly, {
          type: "advance",
          activity: "cultivate",
          months: 1,
          id: `single-${i}`,
        }),
      );
    expect(batch.qi).toBeGreaterThan(240);
    expect(batch.qi - s.qi).toBe(forecast.batchGain);
    expect(batch.qi).toBe(monthly.qi);
    expect(batch.cultivationRemainder).toBe(monthly.cultivationRemainder);
  });
  it("凝丹行功后灵地和护持仍参与成功率，准备充分可达100%，强推真实降率", () => {
    const s = condensationCheckpoint();
    s.foundation = 24;
    s.journey.main = "spring";
    s.growth.training.spring = 2;
    s.goldenCore.attempts = 0;
    s.goldenCore.guard = false;
    s.goldenCore.site = "repaired";
    s.ascension = {
      realm: 1,
      step: 3,
      strain: 0,
      history: ["引气", "稳脉", "凝聚"],
    };
    expect(goldenChance(s)).toBe(93);
    s.goldenCore.site = "rented";
    expect(goldenChance(s)).toBe(97);
    s.goldenCore.guard = true;
    expect(goldenChance(s)).toBe(100);
    s.ascension.strain = 2;
    expect(goldenChance(s)).toBe(82);
    s.ascension.step = 2;
    s.ascension.strain = 0;
    s.ascension.history = s.ascension.history.slice(0, 2);
    expect(ascensionOptions(s).find((o) => o.id === "press")!.detail).toContain(
      "82%",
    );
    expect(goldenChance(migrateSave(s))).toBe(goldenChance(s));
  });
  it("高境界差事只有完成验收才发放对应报酬，不能重复领取", () => {
    let s = condensationCheckpoint();
    s.journey.branch = "dan";
    const before = s.stones;
    s = dispatch(s, { type: "duty", duty: "watch", id: "duty-start" });
    expect(s.qiJourney.cultivation.work?.kind).toBe("watch");
    expect(s.stones).toBe(before);
    for (let i = 0; i < 3; i++) {
      const intent = qiCultivationStep(s)!;
      const command = { ...intent, id: `duty-step-${i}` };
      const next = dispatch(s, command);
      expect(dispatch(next, command)).toBe(next);
      s = migrateSave(next);
    }
    expect(s.qiJourney.cultivation.work).toBeNull();
    expect(s.stones - before).toBe(12);
  });
  it("境界劳作报价与实际收入一致，非劳作与寿尽不能获得报酬", () => {
    const s = condensationCheckpoint();
    s.stones = 0;
    const quote = preparationPlan(s, {
      product: "ward",
      method: "buy",
    }).steps.find(
      (x) => x.intent.type === "advance" && x.intent.activity === "work",
    )!;
    const n = dispatch(s, { ...quote.intent, id: "fund" });
    expect(n.stones - s.stones).toBe(quote.gain);
    expect(n.stones - s.stones).toBe((n.month - s.month) * 8);
    expect(validState(n)).toBe(true);
    const rested = dispatch(
      { ...s, injury: 1 },
      { type: "advance", activity: "rest", months: 1, id: "rest" },
    );
    expect(rested.stones).toBe(s.stones);
    const dead = dispatch(
      { ...s, age: s.limit - 1 },
      { type: "advance", activity: "work", months: 1, id: "death" },
    );
    expect(dead.status).toBe("dead");
    expect(dead.stones).toBe(s.stones);
    expect(
      dispatch(dead, {
        type: "advance",
        activity: "work",
        months: 1,
        id: "again",
      }),
    ).toBe(dead);
    expect([0, 1, 2, 3].map((realm) => monthlyWorkIncome({ realm }))).toEqual([
      5, 8, 12, 16,
    ]);
    for (const realm of [0, 1, 2, 3])
      expect(dutyIncome({ realm }, "watch")).toBeGreaterThan(
        monthlyWorkIncome({ realm }),
      );
  });
});
