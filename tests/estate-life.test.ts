import { beforeAll, expect, it } from "vitest";
import { dispatch, migrateSave, validState, type State } from "../src/core";
import { estateRevisitCheckpoint } from "../tools/world-revisits-checkpoint";
import {
  estateQuote,
  estateRelationship,
  runEstateLife,
  type EstateAction,
} from "../src/estate-life/rules";
import { freshEstateLife } from "../src/estate-life/state";
let base: State;
beforeAll(() => {
  base = estateRevisitCheckpoint();
  while (base.herbs < 12)
    base = dispatch(base, {
      type: "supplies",
      id: `fixture-supplies-${base.herbs}`,
    });
}, 30000);
let serial = 0;
function act(s: State, action: EstateAction) {
  expect(estateQuote(s, action).error, action).toBe("");
  const n = dispatch(s, {
    type: "estateLife",
    action,
    id: `estate-${++serial}`,
  });
  expect(n).not.toBe(s);
  expect(validState(n)).toBe(true);
  return n;
}
function medicine(s: State, separate = false) {
  s = act(s, "medicine");
  for (const a of (separate
    ? ["separate", "separate", "separate", "separate"]
    : ["dry", "dry", "cool", "cool"]) as EstateAction[])
    s = act(s, a);
  return s;
}
it("两种制药方式消耗有别，报价一致、固定重放、存读与奖励防重", () => {
  const start = structuredClone(base),
    before = structuredClone(start);
  const cmd = {
    type: "estateLife" as const,
    action: "medicine" as const,
    id: "same",
  };
  expect(dispatch(start, cmd)).toEqual(dispatch(start, cmd));
  expect(start).toEqual(before);
  const cooked = medicine(start);
  expect(cooked.estateLife.work).toEqual({
    kind: "medicine",
    progress: 0,
    strain: 0,
  });
  const ready = migrateSave(JSON.parse(JSON.stringify(cooked)));
  const n = act(ready, "herbs");
  expect(n.herbs).toBe(start.herbs + 4);
  expect(n.month).toBe(start.month + 5);
  expect(n.foundationJourney.growth).toEqual(start.foundationJourney.growth);
  expect(estateQuote(n, "medicine").error).toContain("下一批");
  expect(estateRelationship(n)).toContain("认可");
  expect(
    dispatch(n, { type: "estateLife", action: "herbs", id: "new-claim" }),
  ).toBe(n);
  const divided = act(medicine(start, true), "stones");
  expect(divided.herbs).toBe(start.herbs - 6);
  expect(divided.stones).toBe(start.stones + 12);
  expect(divided.month).toBe(n.month - 2);
  expect(n.seed).toBe(start.seed);
});
it("三批护运可混合短坡与沿渠，磨损须恢复；求教在制药及护运都有用途", () => {
  let s = act(base, "escort");
  s = act(s, "ridge");
  s = act(s, "ridge");
  expect(estateQuote(s, "ridge").error).toContain("篓架");
  s = act(s, "canal");
  s = act(s, "stones");
  expect(s.month).toBe(base.month + 4);
  expect(s.stones).toBe(base.stones + 12);
  s = act(s, "learn");
  expect(s.estateLife.packing).toBe(true);
  expect(estateQuote(s, "learn").error).toContain("已学");
  const m = act(s, "medicine");
  expect(estateQuote(m, "separate").cost).toEqual({});
  let next = structuredClone(s);
  next.month = s.estateLife.availableAt.escort;
  next.age += next.month - s.month;
  next = act(next, "escort");
  next = act(next, "ridge");
  next = act(next, "ridge");
  next = act(next, "ridge");
  expect(next.estateLife.work?.strain).toBe(3);
  expect(estateQuote(next, "herbs").error).toBe("");
  let repair = act(base, "escort");
  for (const a of ["ridge", "ridge", "repair", "ridge"] as EstateAction[])
    repair = act(repair, a);
  expect(repair.month).toBe(base.month + 4);
  expect(repair.estateLife.work?.progress).toBe(3);
});
it("无药理可护运或购买，未做旧取材不虚构人情；进度可暂放、返庄或交还", () => {
  const s = structuredClone(base);
  s.journey.known = s.journey.known.filter(
    (k) => !["spring", "herb"].includes(k),
  );
  expect(estateQuote(s, "medicine").error).toContain("长春诀");
  expect(estateQuote(s, "escort").error).toBe("");
  expect(estateQuote(s, "learn").error).toContain("记录");
  const n = act(base, "buy");
  expect(n.herbs).toBe(base.herbs + 4);
  expect(n.stones).toBe(base.stones - 6);
  expect(n.estateLife.completed).toEqual({ medicine: 0, escort: 0 });
  let work = act(base, "medicine");
  work = act(work, "dry");
  const saved = structuredClone(work.estateLife);
  const away = structuredClone(work);
  away.foundationJourney.location = "home";
  expect(estateQuote(away, "cool").error).toContain("药庄");
  expect(away.estateLife).toEqual(saved);
  expect(migrateSave(JSON.parse(JSON.stringify(away))).estateLife).toEqual(
    saved,
  );
  const cancelled = act(work, "cancel");
  expect(cancelled.estateLife.work).toBeNull();
  expect(cancelled.herbs).toBe(work.herbs);
  expect(estateQuote(cancelled, "medicine").error).toBe("");
});
it("错误操作、资源不足、容量、战斗/死亡/旅途锁定不发生部分结算", () => {
  const s = structuredClone(base);
  s.herbs = 1;
  expect(estateQuote(s, "medicine").error).toContain("灵草");
  const w = act(base, "medicine");
  expect(estateQuote(w, "ridge").error).toBeTruthy();
  expect(estateQuote(w, "herbs").error).toContain("湿气");
  const hot = act(act(w, "dry"), "dry");
  expect(estateQuote(hot, "dry").error).toBeTruthy();
  const ready = medicine(base);
  ready.herbs = 1e9;
  expect(estateQuote(ready, "herbs").error).toContain("上限");
  expect(
    dispatch(ready, { type: "estateLife", action: "herbs", id: "full" }),
  ).toBe(ready);
  for (const edit of [
    (s: State) => {
      s.status = "dead";
    },
    (s: State) => {
      s.foundationJourney.location = "home";
    },
    (s: State) => {
      s.injury = 2;
    },
  ]) {
    const n = structuredClone(base);
    edit(n);
    expect(estateQuote(n, "escort").error).toBeTruthy();
  }
  expect(estateQuote(base, "bogus" as EstateAction).error).toBeTruthy();
});
it("最后一个月被事件或寿尽打断不记成果，不发报酬；已耗材料年月保留", () => {
  const ready = medicine(base);
  const n = runEstateLife(ready, "herbs", "interrupted", (s) => ({
    ...s,
    month: s.month + 1,
    age: s.age + 1,
    status: "dead",
  }));
  expect(n.month).toBe(ready.month + 1);
  expect(n.herbs).toBe(ready.herbs);
  expect(n.estateLife.completed.medicine).toBe(0);
  expect(n.estateLife.work).toEqual(ready.estateLife.work);
  const start = runEstateLife(base, "medicine", "start-interrupted", (s) => ({
    ...s,
    month: s.month + 1,
    age: s.age + 1,
    status: "dead",
  }));
  expect(start.herbs).toBe(base.herbs - 2);
  expect(start.estateLife.work).toBeNull();
  let ticks = 0;
  const last = runEstateLife(ready, "herbs", "last-month", (s) => ({
    ...s,
    month: s.month + 1,
    age: s.age + 1,
    status: ++ticks === 2 ? "dead" : "alive",
  }));
  expect(last.estateLife.completed.medicine).toBe(0);
});
it("v59保守补空记录，未知未来版本与损坏数据拒绝", () => {
  const old = JSON.parse(JSON.stringify(base));
  old.version = 59;
  delete old.estateLife;
  const n = migrateSave(old);
  expect(n.estateLife).toEqual(freshEstateLife());
  expect(n.stones).toBe(base.stones);
  expect(n.foundationJourney).toEqual(base.foundationJourney);
  expect(() => migrateSave({ ...base, version: 61 })).toThrow();
  for (const work of [
    { kind: "escort", progress: 4, strain: 0 },
    { kind: "medicine", progress: -1, strain: 0 },
    { kind: "medicine", progress: 2, strain: 5 },
  ])
    expect(
      validState({ ...base, estateLife: { ...freshEstateLife(), work } }),
    ).toBe(false);
  expect(
    validState({
      ...base,
      estateLife: { ...freshEstateLife(), packing: true },
    }),
  ).toBe(false);
});

it("雪线补给投影复用真实报价，合作不是资格；其它路线已凝练不再催赴雪线", async () => {
  const { snowSupplyView } = await import("../src/estate-life/expedition");
  const { growthQuote } = await import("../src/foundation-journey/growth");
  const { workshopQuote } = await import("../src/workshop/rules");
  const s = structuredClone(base);
  s.foundationJourney.growth.refined = false;
  s.foundationJourney.growth.routes.snow.prepared = false;
  s.foundationJourney.won = s.foundationJourney.won.filter((x) => x !== "deer");
  s.herbs = 0;
  s.workshop.ward = 0;
  s.stones = 1;
  const before = structuredClone(s);
  const view = snowSupplyView(s)!;
  expect(view.missing).toEqual({ ward: 1, herbs: 2, stones: 1 });
  expect(view.cost).toEqual(
    growthQuote(s, { kind: "routePrepare", route: "snow", method: "supplies" })
      .settlement.cost,
  );
  expect(view.orders[0].quote).toEqual(
    workshopQuote(s, { product: "ward", method: "craft" }),
  );
  expect(s).toEqual(before);
  s.foundationJourney.growth.refined = true;
  expect(snowSupplyView(s)).toBeNull();
  s.foundationJourney.location = "snow";
  expect(snowSupplyView(s)).not.toBeNull();
  s.foundationJourney.growth.routes.snow.prepared = true;
  expect(snowSupplyView(s)?.prepared).toBe(true);
  s.foundationJourney.won.push("deer");
  expect(snowSupplyView(s)?.won).toBe(true);
});
