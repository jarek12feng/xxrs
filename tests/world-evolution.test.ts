import { expect, it, beforeAll } from "vitest";
import {
  worldTransitions,
  nextWorldBoundary,
  settleWorldMonth,
} from "../src/world-evolution";
import { deliverWorldCalendar } from "../src/correspondence/calendar";
import {
  companionChronology,
  companionMilestone,
  companionNews,
} from "../src/golden-story/companion";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { auctionFixture } from "../tools/auction-checkpoint";
import { dispatch, validState, migrateSave, type State } from "../src/core";
let base: State;
beforeAll(() => {
  base = goldenLateCheckpoint();
}, 30000);
it("区间半开、同月固定顺序，整段和逐月产生相同事实，不消耗随机数", () => {
  const s = auctionFixture("market", 5),
    before = structuredClone(s);
  const whole = worldTransitions(s, 145),
    steps = [];
  for (let month = 5; month < 145; month++)
    steps.push(...worldTransitions({ ...s, month }, month + 1));
  expect(whole).toEqual(steps);
  expect(s).toEqual(before);
  expect(
    whole
      .filter((e) => e.kind === "auction")
      .filter((e) => e.venue === "market" && e.edition === 1)
      .map((e) => [e.kind === "auction" ? e.phase : "", e.month]),
  ).toEqual([
    ["announced", 6],
    ["opened", 12],
    ["closed", 13],
  ]);
  expect(nextWorldBoundary(s)?.month).toBe(6);
  expect(worldTransitions(s, 5)).toEqual([]);
  expect(() => worldTransitions(s, 4)).toThrow();
});
it("失利、恢复、独立凝丹按同一里程碑结算，送达不等于核验", () => {
  const s = structuredClone(base);
  s.goldenStory.companionGoldenAt = null;
  s.goldenStory.companionConfirmedAt = null;
  s.goldenStory.companionLetters = [];
  s.correspondence.letters = [];
  const at = companionChronology(s)!.goldenAt!;
  expect(at).not.toBeNull();
  s.month = at - 241;
  const before = structuredClone(s);
  const events = worldTransitions(s, at).filter((e) => e.kind === "companion");
  expect(events.map((e) => [e.newsId, e.month])).toEqual([
    [5, at - 240],
    [6, at - 120],
    [4, at],
  ]);
  const end = { ...structuredClone(s), month: at };
  deliverWorldCalendar(s, end);
  expect(
    end.correspondence.letters
      .filter((l) => l.id.startsWith("companion:"))
      .map((l) => [l.id, l.received]),
  ).toEqual([
    ["companion:5", at - 240],
    ["companion:6", at - 120],
    ["companion:4", at],
  ]);
  expect(end.goldenStory).toEqual(s.goldenStory);
  expect(s).toEqual(before);
  const steps = structuredClone(s);
  for (let month = s.month + 1; month <= at; month++) {
    const prev = { ...steps, month: month - 1 };
    steps.month = month;
    deliverWorldCalendar(prev, steps);
  }
  expect(steps.correspondence).toEqual(end.correspondence);
  const letters = structuredClone(end.correspondence);
  deliverWorldCalendar(s, end);
  expect(end.correspondence).toEqual(letters);
  expect(companionMilestone(end)?.goldenAt).toBe(at);
  expect(companionNews(end)?.id).toBe(4);
});
it("无成长经历不生造凝丹；世界发生与玩家可知独立", () => {
  const s = structuredClone(base);
  s.goldenStory.companionGoldenAt = null;
  s.goldenStory.companionConfirmedAt = null;
  s.goldenStory.companionLetters = [];
  s.foundationJourney.heroine.expedition = false;
  expect(
    worldTransitions(s, s.month + 600).some(
      (e) => e.kind === "companion" && e.newsId === 4,
    ),
  ).toBe(false);
  const fresh = auctionFixture("market", 5),
    end = { ...structuredClone(fresh), month: 7 };
  expect(settleWorldMonth(fresh, end)).toHaveLength(1);
  deliverWorldCalendar(fresh, end);
  expect(end.correspondence.letters).toEqual([]);
});
it("公共推进按实际耗月投递，保存继续与单月推进保留相同会讯", () => {
  let s = structuredClone(base);
  s = dispatch(s, {
    type: "outerSea",
    action: { kind: "auctionNews" },
    id: "evolution-known",
  });
  // Fixture may already know the guild; either route retains actual discovered knowledge.
  expect(s.treasures.goldenKnown).toBe(true);
  const boundary = worldTransitions(s, s.month + 120).find(
    (e) =>
      e.kind === "auction" && e.venue === "golden" && e.phase === "announced",
  )!;
  let serial = 0;
  while (s.month < boundary.month - 6) {
    const next = dispatch(s, {
      type: "advance",
      activity: "work",
      months: Math.min(12, boundary.month - 6 - s.month),
      id: `align-${serial++}`,
    });
    expect(next.month).toBeGreaterThan(s.month);
    s = next;
  }
  s = dispatch(s, {
    type: "correspondence",
    action: { kind: "collect" },
    id: "evolution-collect",
  });
  expect(validState(s)).toBe(true);
  const long = dispatch(s, {
    type: "advance",
    activity: "work",
    months: 12,
    id: "evolution-long",
  });
  expect(long.month).toBeGreaterThan(s.month);
  expect(validState(long)).toBe(true);
  let short = structuredClone(s);
  for (let i = 0; short.month < long.month && i < 12; i++) {
    short = dispatch(short, {
      type: "advance",
      activity: "work",
      months: 1,
      id: `evolution-short-${i}`,
    });
    short = migrateSave(JSON.parse(JSON.stringify(short)));
  }
  expect(short.month).toBe(long.month);
  const scheduled = (n: State) =>
    n.correspondence.letters.filter(
      (l) => l.id.startsWith("auction:") || l.id.startsWith("companion:"),
    );
  expect(scheduled(short)).toEqual(scheduled(long));
  expect(short.seed).toBe(long.seed);
  expect(migrateSave(JSON.parse(JSON.stringify(long)))).toEqual(long);
});
