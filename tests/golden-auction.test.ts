import { it, expect } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  type State,
  type Intent,
} from "../src/core";
import { goldenAuctionFixture } from "../tools/golden-auction-checkpoint";
import { auctionQuote, auctionTimingWarnings } from "../src/auction";
import { auctionMapInfo } from "../src/auction/map";
import { routeNodes, currentLandmark } from "../src/landmarks";
import { storyRoute } from "../src/wayfaring/story-routes";
import { seaQuote } from "../src/outer-sea/rules";
import { sceneOwner } from "../src/scene-activity";
const start = goldenAuctionFixture();
function act(s: State, i: Intent) {
  const n = dispatch(s, { ...i, id: `gold-${s.seen.length}-${s.month}` });
  expect(validState(n)).toBe(true);
  return n;
}
function arrive() {
  let s = act(structuredClone(start), {
    type: "outerSea",
    action: { kind: "auctionNews" },
  });
  return act(s, { type: "outerSea", action: { kind: "guild" } });
}
it("先从古渡商旅得知会馆，地图/来信不抽目录；真实航路往返各两月", () => {
  let s = structuredClone(start);
  expect(routeNodes(s).some((n) => n.key === "outer-guild")).toBe(false);
  expect(seaQuote(s, { kind: "guild" }).error).toBeTruthy();
  const seed = s.seed;
  s = act(s, { type: "outerSea", action: { kind: "auctionNews" } });
  expect(s.seed).toBe(seed);
  expect(s.treasures.auction).toBeNull();
  expect(
    s.correspondence.letters.some((l) => l.id.startsWith("auction:golden:")),
  ).toBe(true);
  expect(routeNodes(s).find((n) => n.key === "outer-guild")?.intent).toEqual({
    type: "outerSea",
    action: { kind: "guild" },
  });
  expect(auctionTimingWarnings(s, 10).join()).toContain("沧澜");
  expect(auctionMapInfo(s, "guild", 2)?.arrival).toContain("距开场");
  expect(
    storyRoute(s, { type: "outerSea", action: { kind: "guild" } }),
  ).toMatchObject({ months: 2, distance: 12000, to: "guild" });
  expect(auctionQuote(s, { kind: "catalog", venue: "golden" }).error).toContain(
    "须抵达",
  );
  const before = s.month;
  s = act(s, { type: "outerSea", action: { kind: "guild" } });
  expect(s.month).toBe(before + 2);
  expect(currentLandmark(s).key).toBe("outer-guild");
  expect(sceneOwner(s)).toBe("sea");
  expect(
    routeNodes(s)
      .filter((n) => n.current)
      .map((n) => n.key),
  ).toEqual(["outer-guild"]);
  s = act(s, { type: "outerSea", action: { kind: "guildReturn" } });
  expect(s.month).toBe(before + 4);
  expect(s.outerSea.location).toBe("ferry");
});
it("同届目录持久，候会与落槌交付真实温养材料且不能竞价中离场旅行", () => {
  let s = arrive();
  s = act(s, {
    type: "treasure",
    action: { kind: "catalog", venue: "golden" },
  });
  const lots = structuredClone(s.treasures.auction!.lots);
  expect(lots[0].item).toBe("temperingChest");
  s = migrateSave(s);
  expect(s.treasures.auction!.lots).toEqual(lots);
  s = act(s, { type: "treasure", action: { kind: "wait" } });
  s = act(s, { type: "treasure", action: { kind: "budget", value: 200 } });
  s = act(s, { type: "treasure", action: { kind: "enter" } });
  expect(seaQuote(s, { kind: "guildReturn" }).error).toBeTruthy();
  const before = {
    stones: s.stones,
    herbs: s.herbs,
    iron: s.workshop.iron,
    month: s.month,
  };
  for (let i = 0; i < 50 && s.treasures.auction!.index === 0; i++)
    s = act(s, { type: "treasure", action: { kind: "bid" } });
  expect(s.herbs).toBe(before.herbs + 12);
  expect(s.workshop.iron).toBe(before.iron + 4);
  expect(s.month).toBe(before.month);
  expect(s.stones).toBe(before.stones - s.treasures.auction!.lots[0].paid);
  expect(s.outerSea.seal).toBe(false);
  expect(s.itemGrowth.golden.blade).toBe("none");
  s = act(s, { type: "treasure", action: { kind: "leave" } });
  expect(auctionQuote(s, { kind: "enter" }).error).toBeTruthy();
  s = act(s, { type: "outerSea", action: { kind: "guildReturn" } });
  expect(s.outerSea.location).toBe("ferry");
});
it("v48只增加未知会馆与空记录，不发会讯奖励或修改原目录，未知未来档拒绝", () => {
  const old = structuredClone(start) as any;
  old.version = 48;
  delete old.treasures.goldenKnown;
  delete old.treasures.auctionArchive.golden;
  const original = structuredClone(old);
  const s = migrateSave(old);
  expect(old).toEqual(original);
  expect(s.treasures.goldenKnown).toBe(false);
  expect(s.treasures.auctionArchive.golden).toBeNull();
  expect(s.seed).toBe(old.seed);
  expect(s.month).toBe(old.month);
  expect(s.correspondence).toEqual(old.correspondence);
  expect(() => migrateSave({ ...s, version: 999 })).toThrow();
});
it("半年的入场截止与下一届目录刷新，不接受把低阶目录伪装成金丹目录", () => {
  let s = arrive();
  s = act(s, {
    type: "treasure",
    action: { kind: "catalog", venue: "golden" },
  });
  const a = structuredClone(s.treasures.auction!);
  s.age += a.closes - s.month;
  s.month = a.closes;
  expect(auctionQuote(s, { kind: "enter" }).error).toContain("截止");
  const fake = structuredClone(s);
  fake.treasures.auction!.lots[0].item = "bell";
  expect(validState(fake)).toBe(false);
  const next = a.opens + 120 - 24;
  s.age += next - s.month;
  s.month = next;
  s = act(s, {
    type: "treasure",
    action: { kind: "catalog", venue: "golden" },
  });
  expect(s.treasures.auction!.number).toBe(a.number + 1);
});
it("v48活动中低阶拍卖迁移保持原目录与竞价进度", async () => {
  const { auctionFixture } = await import("../tools/auction-checkpoint");
  let s = act(auctionFixture(), {
    type: "treasure",
    action: { kind: "catalog", venue: "market" },
  });
  s = act(s, { type: "treasure", action: { kind: "enter" } });
  const old = structuredClone(s) as any;
  old.version = 48;
  delete old.treasures.goldenKnown;
  delete old.treasures.auctionArchive.golden;
  const n = migrateSave(old);
  expect(n.treasures.auction).toEqual(s.treasures.auction);
  expect(n.stones).toBe(s.stones);
  expect(n.seed).toBe(s.seed);
});
it("航程读档仅续行余月；候会提前公告不等于远程领取目录", () => {
  let s = act(structuredClone(start), {
    type: "outerSea",
    action: { kind: "auctionNews" },
  });
  s.wayfaring.passage = { route: "sea:guild", total: 2, remaining: 1 };
  s.month++;
  s.age++;
  expect(validState(s)).toBe(true);
  s = migrateSave(s);
  const m = s.month;
  expect(
    storyRoute(s, { type: "outerSea", action: { kind: "guild" } })?.months,
  ).toBe(1);
  expect(
    auctionQuote(s, { kind: "catalog", venue: "golden" }).error,
  ).toBeTruthy();
  s = act(s, { type: "outerSea", action: { kind: "guild" } });
  expect(s.month).toBe(m + 1);
  expect(s.wayfaring.passage).toBeNull();
  expect(s.outerSea.location).toBe("guild");
});
it("金丹药物和研修札落槌后分别交付，心得满时拒绝出价且保持资源", () => {
  for (const item of ["spirit", "cultivationNotes"] as const) {
    let s = arrive();
    s.study = 0;
    s = act(s, {
      type: "treasure",
      action: { kind: "catalog", venue: "golden" },
    });
    // A controlled valid lot exercises reward settlement independently of pool sampling.
    s.treasures.auction!.lots[0].item = item;
    s = act(s, { type: "treasure", action: { kind: "wait" } });
    s = act(s, { type: "treasure", action: { kind: "budget", value: 200 } });
    s = act(s, { type: "treasure", action: { kind: "enter" } });
    if (item === "cultivationNotes") {
      const full = structuredClone(s);
      full.study = 4;
      expect(auctionQuote(full, { kind: "bid" }).error).toContain("心得");
      expect(act(full, { type: "treasure", action: { kind: "bid" } })).toBe(
        full,
      );
    }
    const medicine = s.growth.medicines.spirit;
    for (let i = 0; i < 50 && s.treasures.auction!.index === 0; i++)
      s = act(s, { type: "treasure", action: { kind: "bid" } });
    expect(item === "spirit" ? s.growth.medicines.spirit : s.study).toBe(
      item === "spirit" ? medicine + 1 : 2,
    );
    s = act(s, { type: "treasure", action: { kind: "leave" } });
    s = act(s, { type: "outerSea", action: { kind: "guildReturn" } });
    s = act(s, { type: "outerSea", action: { kind: "home" } });
    if (item === "spirit") {
      const sense = s.sense;
      s = act(s, { type: "consume", medicine: "spirit" });
      expect(s.growth.medicines.spirit).toBe(medicine);
      expect(s.sense).toBeGreaterThan(sense);
    } else {
      const technique = s.journey.known.find((t) => s.growth.training[t] < 2)!;
      expect(technique).toBeTruthy();
      if (s.herbs < 2) s = act(s, { type: "supplies" });
      const rank = s.growth.training[technique];
      const stones = s.stones;
      s = act(s, { type: "trainTechnique", technique });
      expect(s.growth.training[technique]).toBe(rank + 1);
      expect(s.stones).toBe(stones - 12);
      expect(s.study).toBe(2); // Knowledge is a persistent prerequisite, not currency.
    }
  }
});
