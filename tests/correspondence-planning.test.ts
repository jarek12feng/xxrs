import { expect, it } from "vitest";
import { dispatch } from "../src/core";
import {
  messageThreads,
  commitments,
  commitmentWarnings,
} from "../src/correspondence/view";
import {
  auctionFixture,
  auctionTravelFixture,
} from "../tools/auction-checkpoint";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { travelQuote } from "../src/wayfaring/rules";
import type { Letter } from "../src/correspondence/state";
const letter = (id: string, read = false): Letter => ({
  id,
  read,
  kind: "notice",
  sender: "道友",
  reliability: "personal",
  title: id,
  body: "旧信",
  received: 0,
  followed: false,
  response: "none",
  destination: "world",
  expires: null,
});
it("同事归并、会次独立、最新进展前置，分组不读信不改历史", () => {
  const letters = [
    letter("pact:invitation", true),
    letter("auction:market:1"),
    letter("auction:market:2"),
    letter("pact:accepted"),
  ];
  const before = structuredClone(letters),
    groups = messageThreads(letters);
  expect(groups.map((g) => g.id)).toEqual([
    "pact",
    "auction:market:2",
    "auction:market:1",
  ]);
  expect(groups[0]!.unread).toBe(1);
  expect(groups[0]!.letters).toHaveLength(2);
  expect(letters).toEqual(before);
});
it("只读取已答应的照玄之约，无期限不生成错过警报，完成后移出待办", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  expect(commitments(p.state)).toEqual([]);
  p.send({ type: "secretPact", action: "promise" });
  const item = commitments(p.state)[0]!;
  expect(item.deadline).toBeNull();
  expect(item.preparation).toContain("筑基中期");
  expect(commitmentWarnings(p.state, 120)).toEqual([]);
  const s = structuredClone(p.state);
  s.secretPact.trial = "complete";
  expect(commitments(s)).toEqual([]);
});
it("关注的拍卖按真实路线计算，出关未过期但赶路迟到也提醒", () => {
  let s = auctionTravelFixture();
  const id = `auction:foundation:${s.treasures.auction!.number}`;
  s = dispatch(s, {
    type: "correspondence",
    action: { kind: "follow", letter: id },
    id: "follow",
  });
  const q = travelQuote(s, "estate", "flight");
  expect(q.error).toBe("");
  const c = commitments(s).find((c) => c.id === id)!;
  expect(c.travelMonths).toBe(q.months);
  const deadline = c.deadline!,
    months = deadline - s.month - q.months;
  expect(s.month + months).toBeLessThan(deadline);
  expect(commitmentWarnings(s, months).join()).toContain(
    `预计第${deadline}月抵达`,
  );
  expect(commitmentWarnings(s, deadline - s.month).join()).toContain(
    "已到或超过",
  );
  expect(commitmentWarnings(s, 0).join()).not.toContain(
    `预计第${deadline}月抵达`,
  );
  const before = structuredClone(s);
  commitments(s);
  commitmentWarnings(s, months);
  expect(s).toEqual(before);
});
it("已在会场为零路程、过期或散场撤出关注安排；未知道路不假定零耗时", () => {
  let s = dispatch(auctionFixture(), {
    type: "treasure",
    action: { kind: "catalog", venue: "market" },
    id: "cat",
  });
  s = dispatch(s, {
    type: "correspondence",
    action: { kind: "follow", letter: "auction:market:1" },
    id: "follow",
  });
  expect(commitments(s)[0]!.travelMonths).toBe(0);
  s.adventure.road.stage = "home";
  expect(commitments(s)[0]!.travelMonths).toBeNull();
  expect(commitmentWarnings(s, 0).join()).toContain("无法确认完整行程");
  s.month = 13;
  expect(commitments(s)).toEqual([]);
});
it("取消关注恢复原会期警示，投影不改变种子、时间或存档", () => {
  let s = dispatch(auctionFixture(), {
    type: "treasure",
    action: { kind: "catalog", venue: "market" },
    id: "cat",
  });
  const before = structuredClone(s);
  expect(commitmentWarnings(s, 12).join()).toContain("可能错过");
  expect(commitments(s)).toEqual([]);
  expect(s).toEqual(before);
});
