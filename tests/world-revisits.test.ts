import { describe, it, expect, beforeAll } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import {
  estateRevisitCheckpoint,
  lizhaoRevisitCheckpoint,
} from "../tools/world-revisits-checkpoint";
import { revisitView, reagentTerms } from "../src/world-revisits/projection";
import { revisitQuote, type RevisitAction } from "../src/world-revisits/rules";
import { lizhaoQuote } from "../src/lizhao/rules";
let ferry: State;
beforeAll(() => {
  ferry = conclaveCheckpoint();
});
const buy = (s: State, action: RevisitAction, id = "revisit-buy") =>
  dispatch(s, { type: "revisit", action, id });
describe("旧地回访与原选择后果", () => {
  it("无经历不补人情、不读取截断日志；纯投影不改存档", () => {
    const s = structuredClone(ferry),
      before = structuredClone(s);
    expect(revisitView(s, "ferry")?.account).toContain("共享");
    expect(revisitView(s, "estate")).toBeNull();
    s.log = [];
    expect(revisitView(s, "ferry")).toEqual(revisitView(before, "ferry"));
    s.log = before.log;
    expect(s).toEqual(before);
    s.outerSea.cleared = 0;
    expect(revisitView(s, "ferry")).toBeNull();
    expect(buy(s, { site: "ferry", offer: "herbs" })).toBe(s);
  });
  it("公开潮图省草药钱，私图省成丹钱，缺钱/上限/离场均不部分结算", () => {
    expect(revisitQuote(ferry, { site: "ferry", offer: "herbs" }).cost).toEqual(
      { stones: 6 },
    );
    const privateMap = structuredClone(ferry);
    privateMap.outerSea.pact = "private";
    expect(
      revisitQuote(privateMap, { site: "ferry", offer: "herbs" }).cost,
    ).toEqual({ stones: 8 });
    expect(
      revisitQuote(privateMap, { site: "ferry", offer: "spirit" }).cost,
    ).toEqual({ stones: 40 });
    expect(
      revisitQuote(ferry, { site: "ferry", offer: "spirit" }).cost,
    ).toEqual({ stones: 48 });
    const poor = structuredClone(ferry);
    poor.stones = 5;
    expect(buy(poor, { site: "ferry", offer: "herbs" })).toBe(poor);
    const full = structuredClone(ferry);
    full.herbs = 1e9;
    expect(buy(full, { site: "ferry", offer: "herbs" })).toBe(full);
    const away = structuredClone(ferry);
    away.outerSea.location = "home";
    expect(buy(away, { site: "ferry", offer: "herbs" })).toBe(away);
    expect(
      buy({ ...ferry, status: "dead" }, { site: "ferry", offer: "herbs" })
        .status,
    ).toBe("dead");
  });
  it("购买只扣本次费用，不重发历练成果；重复ID和保存重放一致", () => {
    const s = structuredClone(ferry);
    s.stones = 100;
    const a = { site: "ferry", offer: "spirit" } as const,
      n = buy(s, a);
    expect(n.stones).toBe(52);
    expect(n.growth.medicines.spirit).toBe(s.growth.medicines.spirit + 1);
    expect(n.month).toBe(s.month);
    expect(n.seed).toBe(s.seed);
    expect(n.outerSea.cleared).toBe(s.outerSea.cleared);
    expect(n.outerSea.seal).toBe(s.outerSea.seal);
    expect(buy(s, a)).toEqual(n);
    expect(buy(n, a)).toBe(n);
    expect(validState(n)).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
    const twice = buy(n, a, "second-order");
    expect(twice.stones).toBe(4);
    expect(twice.growth.medicines.spirit).toBe(s.growth.medicines.spirit + 2);
  });
  it.each(["careful", "swift"] as const)(
    "药庄%s真实取材流程留下不同补给与回访描述",
    (choice) => {
      const s = estateRevisitCheckpoint(choice),
        v = revisitView(s, "estate")!;
      expect(v.account).toContain(
        choice === "careful" ? "留下根床" : "当季减量",
      );
      expect(v.offers[0]!.cost.stones).toBe(choice === "careful" ? 6 : 8);
      const n = buy(s, { site: "estate", offer: "herbs" });
      expect(n.herbs).toBe(s.herbs + 4);
      expect(n.foundationJourney.growth.routes.estate.revisited).toBe(false);
      expect(validState(n)).toBe(true);
    },
  );
  it.each(["share", "private", "seize"] as const)(
    "离照%s分药影响真实轮取，仍不需重打",
    (allocation) => {
      const s = lizhaoRevisitCheckpoint(allocation),
        q = lizhaoQuote(s, { kind: "resupply" }),
        terms = reagentTerms(s);
      expect(q.error).toBe("");
      expect(q.months).toBe(terms.months);
      expect(q.stones).toBe(terms.stones);
      const n = dispatch(s, {
        type: "lizhao",
        action: { kind: "resupply" },
        id: "revisit-refill",
      });
      expect(n.month - s.month).toBe(allocation === "share" ? 4 : 6);
      expect(s.stones - n.stones).toBe(
        allocation === "private" ? 20 : allocation === "seize" ? 32 : 24,
      );
      expect(n.lizhao.reagent).toBe(s.lizhao.reagent + 1);
      expect(n.lizhao.cleared).toBe(true);
      expect(n.lizhao.duel).toBeNull();
      expect(validState(n)).toBe(true);
    },
  );
  it("扣药的争议只有原有赔偿/公开雇契事实才解除加价，不抹掉扣药历史", () => {
    const s = lizhaoRevisitCheckpoint("seize");
    for (const pursuit of [
      "rumor",
      "warned",
      "repelled",
      "killed",
      "bypassed",
    ] as const) {
      s.lizhao.pursuit = pursuit;
      expect(reagentTerms(s).stones).toBe(32);
    }
    for (const pursuit of ["settled", "exposed"] as const) {
      s.lizhao.pursuit = pursuit;
      expect(reagentTerms(s).stones).toBe(24);
      expect(revisitView(s, "lizhao")?.account).toMatch(/扣药|扣下/);
    }
  });
});
