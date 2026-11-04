import { describe, it, expect } from "vitest";
import { outerSeaCheckpoint, seaPlayer } from "../tools/outer-sea-checkpoint";
import { dispatch, validState, migrateSave } from "../src/core";
import { seaFoe, seaQuote } from "../src/outer-sea/rules";
import {currentLandmark,routeNodes} from "../src/landmarks";
import { readiness, tacticalPreview } from "../src/combat/game";
import { cultivationProjection } from "../src/progression";
const start = outerSeaCheckpoint();
function trip(pact: "share" | "private") {
  const p = seaPlayer(structuredClone(start));
  p.work(40);
  p.herbs(12);
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "meet" } });
  p.send({ type: "outerSea", action: { kind: "pact", pact } });
  p.send({ type: "outerSea", action: { kind: "prepare" } });
  p.send({ type: "outerSea", action: { kind: "enter" } });
  return p;
}
function win(p: ReturnType<typeof seaPlayer>) {
  p.send({ type: "outerSea", action: { kind: "fight" } });
  let count = 0;
  while (p.state.outerSea.duel) {
    if (++count > 16) throw new Error("battle stuck");
    const d = p.state.outerSea.duel;
    p.send({
      type: "outerSea",
      action: { kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! },
    });
  }
}
describe("外海开篇", () => {
  it.each([
    ["share", "seal"],
    ["share", "manual"],
    ["private", "seal"],
    ["private", "manual"],
  ] as const)(
    "%s/%s 两层遗迹、真实成长、机缘兑现与五十年告知",
    (pact, reward) => {
      const p = trip(pact);
      win(p);
      expect(currentLandmark(p.state).title).toBe("外海古渡");
    expect(routeNodes(p.state).filter(n=>n.current).map(n=>n.key)).toEqual(["outer-ferry"]);
    expect(p.state.outerSea.cleared).toBe(1);
      expect(p.state.outerSea.cultivation).toBe(30);
      p.send({ type: "outerSea", action: { kind: "reward", reward } });
      p.send({ type: "outerSea", action: { kind: "report" } });
      expect(p.state.outerSea.notice).toBe(p.state.month);
      const before = readiness(p.state);
      p.work(8);
      p.send({
        type: "outerSea",
        action:
          reward === "seal"
            ? { kind: "attune" }
            : { kind: "method", method: "continue" },
      });
      expect(readiness(p.state).damage).toBeGreaterThan(before.damage);
      expect(seaQuote(p.state, { kind: "enter" }).error).not.toBe("");
      const projection = cultivationProjection(p.state, 60, 120);
      const old = p.state.outerSea.cultivation;
      p.send({
        type: "advance",
        activity: "cultivate",
        months: projection.batchMonths,
      });
      expect(p.state.outerSea.cultivation - old).toBe(projection.batchGain);
      while (p.state.outerSea.cultivation < 60)
        p.send({ type: "advance", activity: "cultivate", months: 12 });
      p.work(12);
      p.herbs(6);
      p.send({ type: "outerSea", action: { kind: "prepare" } });
      p.send({ type: "outerSea", action: { kind: "enter" } });
      win(p);
      expect(p.state.outerSea.cleared).toBe(2);
      expect(p.state.outerSea.seal && p.state.outerSea.manual).toBe(true);
      expect(validState(p.state)).toBe(true);
      expect(migrateSave(JSON.parse(JSON.stringify(p.state)))).toEqual(p.state);
      expect(seaQuote(p.state, { kind: "prepare" }).error).not.toBe("");
    },
  );
  it("遗迹互斥、撤回不丢行装，双修不叠加且保留旧功法", () => {
    const p = trip("share");
    const s = p.state;
    for (const i of [
      { type: "advance", activity: "work", months: 1 },
      { type: "equip", technique: "blade" },
      { type: "goldenCore", action: { kind: "farShore" } },
    ] as const)
      expect(dispatch(s, { ...i, id: "blocked" })).toBe(s);
    p.send({ type: "outerSea", action: { kind: "withdraw" } });
    expect(p.state.outerSea.prepared).toBe(true);
    p.send({ type: "outerSea", action: { kind: "enter" } });
    win(p);
    p.send({ type: "outerSea", action: { kind: "reward", reward: "manual" } });
    const known = structuredClone(p.state.journey.known),
      training = structuredClone(p.state.growth.training);
    p.send({
      type: "outerSea",
      action: { kind: "method", method: "continue" },
    });
    const a = readiness(p.state);
    p.send({ type: "outerSea", action: { kind: "method", method: "clear" } });
    expect(readiness(p.state).damage).toBe(a.damage - 3);
    expect(readiness(p.state).armor).toBe(a.armor + 4);
    expect(tacticalPreview(p.state, {
move: "guard",
encounter: seaFoe(1),
battle: {hp:20,enemy:185,turn:1},
effect: ""
})!.healing).toBe(0);
    expect(p.state.journey.known).toEqual(known);
    expect(p.state.growth.training).toEqual(training);
  });
  it("未知档、非法机缘、死亡、寿元边界和重复命令拒绝", () => {
    const s = structuredClone(start);
    s.age = s.limit - 6;
    expect(
      dispatch(s, { id: "late", type: "outerSea", action: { kind: "sail" } }),
    ).toBe(s);
    const bad = structuredClone(start);
    bad.outerSea.seal = true;
    expect(validState(bad)).toBe(false);
    expect(() => migrateSave({ ...start, version: 999 })).toThrow();
    const p = trip("share");
    const c = {
      id: "once",
      type: "outerSea",
      action: { kind: "withdraw" },
    } as const;
    const n = dispatch(p.state, c);
    expect(dispatch(n, c)).toBe(n);
    expect(
      dispatch(
        { ...n, status: "dead" },
        { id: "dead", type: "outerSea", action: { kind: "enter" } },
      ).status,
    ).toBe("dead");
  });
  it("长关在五十年会期消息处停下，前期瓶颈不可跨境", () => {
    const p = trip("share");
    win(p);
    p.send({ type: "outerSea", action: { kind: "reward", reward: "seal" } });
    p.send({ type: "outerSea", action: { kind: "report" } });
    let s = structuredClone(p.state);
    s.month = s.outerSea.notice! + 599;
    s.outerSea.cultivation = 60;
    const n = dispatch(s, {
      id: "notice",
      type: "advance",
      activity: "cultivate",
      months: 120,
    });
    expect(n.month - s.month).toBe(1);
    expect(n.outerSea.reminded).toBe(true);
    s = structuredClone(n);
    s.outerSea.cultivation = 298;
    s.cultivationRemainder = 239;
    const cap = dispatch(s, {
      id: "cap",
      type: "advance",
      activity: "cultivate",
      months: 120,
    });
    expect(cap.outerSea.cultivation).toBe(299);
    expect(cap.realm).toBe(2);
    expect(cap.cultivationRemainder).toBe(0);
  });
});
