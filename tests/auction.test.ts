import { describe, it, expect } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { auctionFixture } from "../tools/auction-checkpoint";
import {
  auctionQuote,
  auctionSchedule,
  venueAuction,
  type AuctionAction,
} from "../src/auction";
function act(s: State, action: AuctionAction, id = `auction-${s.seen.length}`) {
  return dispatch(s, { type: "treasure", action, id });
}
describe("有地点与会期的拍卖", () => {
  it("真实地点在命令层拒绝，陈旧坊市进度不能从远方参拍", () => {
    const s = auctionFixture();
    expect(validState(s)).toBe(true);
    for (const modify of [
      (x: State) => (x.adventure.road.stage = "home"),
      (x: State) => (x.foundationJourney.location = "ferry"),
      (x: State) => (x.outerSea.location = "ferry"),
    ]) {
      const x = structuredClone(s);
      modify(x);
      expect(act(x, { kind: "catalog", venue: "market" })).toBe(x);
    }
    const f = auctionFixture("foundation", 60);
    expect(validState(f)).toBe(true);
    expect(act(f, { kind: "catalog", venue: "foundation" })).not.toBe(f);
    expect(act(f, { kind: "catalog", venue: "market" })).toBe(f);
  });
  it("每年/五年周期，提前公布；开场和截止边界明确", () => {
    expect(auctionSchedule(12, "market")).toMatchObject({
      number: 1,
      opens: 12,
      closes: 13,
      announces: 6,
    });
    expect(auctionSchedule(13, "market").opens).toBe(24);
    expect(auctionSchedule(60, "foundation")).toMatchObject({
      opens: 60,
      closes: 63,
      announces: 48,
    });
    let s = auctionFixture("market", 5);
    expect(act(s, { kind: "catalog", venue: "market" })).toBe(s);
    s = auctionFixture("market", 6);
    s = act(s, { kind: "catalog", venue: "market" });
    expect(act(s, { kind: "enter" })).toBe(s);
    s.month = 12;
    s.age = 204;
    const n = act(s, { kind: "enter" });
    expect(n.month).toBe(12);
    expect(n.treasures.auction!.entered).toBe(true);
    s.month = 13;
    s.age = 205;
    expect(act(s, { kind: "enter" })).toBe(s);
  });
  it("预览不消耗种子，换场与读档保持原目录；两地不共用冷却", () => {
    let s = auctionFixture("foundation", 60);
    s = act(s, { kind: "catalog", venue: "foundation" });
    const f = structuredClone(s.treasures.auction),
      seed = s.seed;
    for (let i = 0; i < 10; i++) auctionQuote(s, { kind: "enter" });
    expect(s.seed).toBe(seed);
    s.foundationJourney.location = "home";
    s = act(s, { kind: "catalog", venue: "market" });
    expect(venueAuction(s, "foundation")).toEqual(f);
    expect(validState(s)).toBe(true);
    const m = structuredClone(s.treasures.auction),
      nextSeed = s.seed;
    s.foundationJourney.location = "estate";
    s = act(migrateSave(s), { kind: "catalog", venue: "foundation" });
    expect(s.treasures.auction).toEqual(f);
    expect(venueAuction(s, "market")).toEqual(m);
    expect(s.seed).toBe(nextSeed);
  });
  it("同届退出不重开，下届才换目录；不同独特拍品有替代项时避免连抽", () => {
    let s = act(auctionFixture(), { kind: "catalog", venue: "market" });
    const original = structuredClone(s.treasures.auction!);
    s = act(s, { kind: "leave" });
    expect(act(s, { kind: "enter" })).toBe(s);
    expect(act(s, { kind: "catalog", venue: "market" })).toBe(s);
    s.month = 24;
    s.age = 216;
    s = act(s, { kind: "catalog", venue: "market" });
    expect(s.treasures.auction!.number).toBe(2);
    expect(s.treasures.auction!.lots[0].item).not.toBe(original.lots[0].item);
    expect(s.treasures.auction!.lots[2].item).not.toBe(original.lots[2].item);
  });
  it("候会按月推进，剧情/寿尽中断不误入场或重抽", () => {
    for (const death of [false, true]) {
      let s = act(auctionFixture("market", 11), {
        kind: "catalog",
        venue: "market",
      });
      if (death) s.age = s.limit - 1;
      const lots = structuredClone(s.treasures.auction!.lots),
        seed = s.seed;
      s = act(s, { kind: "wait" });
      expect(s.month).toBe(12);
      expect(s.treasures.auction!.entered).toBe(false);
      expect(s.treasures.auction!.lots).toEqual(lots);
      expect(s.seed).toBe(seed);
      expect(validState(s)).toBe(true);
      expect(death ? s.status === "dead" : !!s.pending).toBe(true);
    }
  });
  it("v45保守散场保留成交，未来档/损坏会期/重复会次拒绝", () => {
    let s = act(auctionFixture(), { kind: "catalog", venue: "market" });
    s = act(s, { kind: "budget", value: 100 });
    s = act(s, { kind: "enter" });
    s.treasures.auction!.lots[0].rival = s.treasures.auction!.lots[0].opening;
    s = act(s, { kind: "bid" });
    const old = JSON.parse(JSON.stringify(s));
    old.version = 45;
    delete old.treasures.auctionArchive;
    for (const field of ["opens", "closes", "number"])
      delete old.treasures.auction[field];
    const n = migrateSave(old);
    expect(validState(n)).toBe(true);
    expect(n.treasures.auction!.closed).toBe(true);
    expect(n.stones).toBe(s.stones);
    expect(n.treasures.owned).toEqual(s.treasures.owned);
    expect(n.seed).toBe(s.seed);
    const broken = structuredClone(s);
    broken.treasures.auction!.closes++;
    expect(validState(broken)).toBe(false);
    const duplicate = structuredClone(s);
    duplicate.treasures.auctionArchive.market = duplicate.treasures.auction;
    expect(validState(duplicate)).toBe(false);
    expect(() => migrateSave({ ...s, version: 999 })).toThrow();
  });
});
it("已知会期提醒仅在跨过截止月时出现，不改变状态", async () => {
  const { auctionTimingWarnings } = await import("../src/auction");
  const s = act(auctionFixture("market", 6), {
      kind: "catalog",
      venue: "market",
    }),
    copy = structuredClone(s);
  expect(auctionTimingWarnings(s, 6)).toEqual([]);
  expect(auctionTimingWarnings(s, 7)[0]).toContain("错过坊市小拍");
  expect(s).toEqual(copy);
  expect(auctionTimingWarnings(auctionFixture(), 100)).toEqual([]);
});
it("损坏会场与缺失库存只拒绝，不在校验中抛错", () => {
  const s = act(auctionFixture(), { kind: "catalog", venue: "market" });
  const invalid = JSON.parse(JSON.stringify(s));
  invalid.treasures.auction.venue = "unknown";
  invalid.treasures.auction.entered = true;
  expect(validState(invalid)).toBe(false);
  const missing = JSON.parse(JSON.stringify(s));
  delete missing.treasures.owned;
  expect(validState(missing)).toBe(false);
});

it("散场后管事展示下届会期，不能重开本届", async () => {
  const { auctionNotice } = await import("../src/auction");
  let s = act(auctionFixture(), { kind: "catalog", venue: "market" });
  s = act(s, { kind: "leave" });
  expect(auctionNotice(s, "market")).toMatchObject({
    number: 2,
    opens: 24,
    closes: 25,
    announced: false,
  });
  expect(act(s, { kind: "catalog", venue: "market" })).toBe(s);
});
