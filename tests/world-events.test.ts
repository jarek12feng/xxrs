import { expect, it } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  createGame,
  type State,
  type Intent,
} from "../src/core";
import { knownWorldFacts } from "../src/world-events";
import { messageSources } from "../src/correspondence/sources";
import { messageThreads } from "../src/correspondence/view";
import { messageStatus } from "../src/correspondence/rules";
import { messageLead } from "../src/correspondence/leads";
import type { AuctionAction } from "../src/auction";
import { auctionFixture } from "../tools/auction-checkpoint";
import {
  outerSeaCheckpoint,
  seaPlayer,
  observeTide,
} from "../tools/outer-sea-checkpoint";
import { seaFoe } from "../src/outer-sea/rules";
function act(s: State, intent: Intent, id: string) {
  const cmd = { ...intent, id };
  const next = dispatch(s, cmd);
  expect(next).not.toBe(s);
  expect(validState(next)).toBe(true);
  expect(dispatch(s, cmd)).toEqual(next);
  expect(migrateSave(JSON.parse(JSON.stringify(next)))).toEqual(next);
  return next;
}
it("事实投影不改变世界、消耗随机数或为新人物编造事件", () => {
  const s = createGame("新行", "wood", 42),
    before = structuredClone(s);
  expect(knownWorldFacts(s)).toEqual([]);
  expect(messageSources(s)).toEqual([]);
  expect(s).toEqual(before);
});
it("参与拍卖后按实际成交结算回执，归入同届，不重复发奖", () => {
  let s = auctionFixture();
  let i = 0;
  const send = (action: AuctionAction) => {
    s = act(s, { type: "treasure", action }, `auction-report-${++i}`);
  };
  send({ kind: "catalog", venue: "market" });
  send({ kind: "budget", value: 100 });
  send({ kind: "enter" });
  while (!s.treasures.auction!.closed) send({ kind: "bid" });
  const result = s.correspondence.letters.find(
    (l) => l.id === "auction:market:1:result",
  )!;
  expect(result).toBeTruthy();
  expect(result.read).toBe(false);
  const wins = s.treasures.auction!.lots.filter((l) => l.result === "won");
  expect(
    knownWorldFacts(s).find((f) => f.kind === "auction-result"),
  ).toMatchObject({ won: wins.map((l) => ({ item: l.item, paid: l.paid })) });
  expect(
    messageThreads(s.correspondence.letters).filter(
      (g) => g.id === "auction:market:1",
    ),
  ).toHaveLength(1);
  const before = structuredClone(s);
  s = act(
    s,
    { type: "correspondence", action: { kind: "read", letter: result.id } },
    "read-result",
  );
  expect(s.stones).toBe(before.stones);
  expect(s.treasures).toEqual(before.treasures);
  expect(messageStatus(s, result)).toContain("已交割");
  expect(
    dispatch(s, {
      type: "correspondence",
      action: { kind: "collect" },
      id: "no-extra",
    }),
  ).toBe(s);
});
it("遗迹潮图到两层取宝形成真实公共命令闭环，旧信提示随事实更新", () => {
  const p = seaPlayer(outerSeaCheckpoint());
  p.work(40);
  p.herbs(12);
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "meet" } });
  observeTide(p.send);
  expect(p.state.correspondence.letters.some((l) => l.id === "sea:ruins")).toBe(
    false,
  );
  p.send({ type: "outerSea", action: { kind: "pact", pact: "share" } });
  const chart = p.state.correspondence.letters.find(
    (l) => l.id === "sea:ruins",
  )!;
  expect(messageLead(p.state, chart)).toContain("准备遗迹行装");
  const win = () => {
    p.send({ type: "outerSea", action: { kind: "fight" } });
    let n = 0;
    while (p.state.outerSea.duel) {
      if (++n > 20) throw Error("fight stalled");
      const d = p.state.outerSea.duel;
      p.send({
        type: "outerSea",
        action: { kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! },
      });
    }
  };
  p.send({ type: "outerSea", action: { kind: "prepare" } });
  p.send({ type: "outerSea", action: { kind: "enter" } });
  win();
  expect(
    p.state.correspondence.letters.some(
      (l) => l.id === "sea:ruins:outer-cleared",
    ),
  ).toBe(true);
  expect(messageLead(p.state, chart)).toContain("选择外府机缘");
  p.send({ type: "outerSea", action: { kind: "reward", reward: "manual" } });
  p.send({ type: "outerSea", action: { kind: "method", method: "continue" } });
  while (p.state.outerSea.cultivation < 60)
    p.send({ type: "advance", activity: "cultivate", months: 12 });
  p.work(12);
  p.herbs(6);
  p.send({ type: "outerSea", action: { kind: "prepare" } });
  p.send({ type: "outerSea", action: { kind: "enter" } });
  win();
  const thread = messageThreads(p.state.correspondence.letters).find(
    (t) => t.id === "sea:ruins",
  )!;
  expect(thread.letters.map((l) => l.id)).toEqual([
    "sea:ruins",
    "sea:ruins:outer-cleared",
    "sea:ruins:outer-reward",
    "sea:ruins:complete",
  ]);
  expect(thread.unread).toBe(4);
  expect(messageStatus(p.state, chart)).toContain("已完成");
  expect(messageLead(p.state, chart)).toContain("已经完成");
  const before = structuredClone(p.state);
  knownWorldFacts(p.state);
  messageSources(p.state);
  expect(p.state).toEqual(before);
}, 30000);

it("榜单事实只列已结算对手，同榜变化归组，不虚构其他修士名次", () => {
  const s = auctionFixture("foundation", 60);
  s.foundationJourney.board.wins = ["rank1"];
  const before = structuredClone(s),
    report = messageSources(s).find((l) => l.id === "arena:foundation:1")!;
  expect(report.body).toContain("罗砺");
  expect(report.body).not.toContain("周雁回");
  expect(s).toEqual(before);
  const letters = [report, { ...report, id: "arena:foundation:2" }].map(
    (l) => ({
      ...l,
      received: s.month,
      read: false,
      followed: false,
      response: "none" as const,
    }),
  );
  expect(messageThreads(letters)).toHaveLength(1);
  expect(messageThreads(letters)[0]!.unread).toBe(2);
});
