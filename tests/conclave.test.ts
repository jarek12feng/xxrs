import { describe, it, expect } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import {
  conclaveCheckpoint,
  conclavePlayer,
} from "../tools/conclave-checkpoint";
import { seaPlayer } from "../tools/outer-sea-checkpoint";
import {
  conclaveQuote,
  conclaveExchange,
  conclaveFoe,
  conclaveSupplement,
} from "../src/conclave/rules";
import { freshConclave, goldenCap } from "../src/conclave/state";
import { readiness, tacticalPreview } from "../src/combat/game";
import {
  cultivationProjection,
  cultivationStageIndex,
} from "../src/cultivation";
import { currentLandmark, routeNodes } from "../src/landmarks";
const start = conclaveCheckpoint();
const send = (
  s: State,
  action: Parameters<typeof conclaveQuote>[1],
  id = "new",
) => dispatch(s, { type: "conclave", action, id });
function qualify() {
  const p = conclavePlayer();
  p.arrive();
  p.work(12);
  p.herbs(20);
  p.act({ kind: "training", style: "ward" });
  p.battle("contest");
  p.battle("contest");
  return p;
}
describe("诸宗会与凝婴机缘", () => {
  it("新角色在五十年内备好中期，无法用闭关越过阶段门槛", () => {
    expect(validState(start)).toBe(true);
    expect(start.month - start.outerSea.notice!).toBeLessThan(600);
    expect(start.conclave.stage).toBe(1);
    const s = structuredClone(start);
    s.conclave = freshConclave();
    s.outerSea.cultivation = 299;
    s.cultivationRemainder = 0;
    s.stones = 18;
    expect(validState(s)).toBe(true);
    expect(
      dispatch(s, {
        id: "cap",
        type: "advance",
        activity: "cultivate",
        months: 120,
      }),
    ).toBe(s);
    const before = readiness(s);
    const n = send(s, { kind: "mid" });
    expect(n.conclave.stage).toBe(1);
    expect(readiness(n).damage - before.damage).toBe(5);
    expect(readiness(n).armor - before.armor).toBe(3);
    for (const field of ["attuned", "manual"] as const) {
      const bad = structuredClone(s);
      bad.outerSea[field] = false;
      if (field === "manual") bad.outerSea.method = "none";
      expect(send(bad, { kind: "mid" })).toBe(bad);
    }
    const old = structuredClone(start);
    old.conclave = freshConclave();
    old.outerSea.cultivation = 299;
    old.outerSea.method = "none";
    expect(send(old, { kind: "mid" })).toBe(old);
  });
  it("到会期才允许赴会，错过正会仍可补试，两胜即可入境无需争优", () => {
    expect(send(start, { kind: "visit" })).toBe(start);
    const p = qualify();
    expect(p.state.conclave.wins).toBe(2);
    expect(p.state.conclave.depth).toBe(0);
    expect(currentLandmark(p.state).title).toBe("诸宗会谷");
    expect(
      routeNodes(p.state)
        .filter((n) => n.current)
        .map((n) => n.key),
    ).toEqual(["conclave-court"]);
    p.act({ kind: "route", route: "shelter" });
    p.work(10);
    p.herbs(2);
    p.act({ kind: "prepare" });
    p.act({ kind: "enter" });
    expect(currentLandmark(p.state).title).toBe("归潮秘境");
    expect(
      routeNodes(p.state)
        .filter((n) => n.current)
        .map((n) => n.key),
    ).toEqual(["conclave-vault"]);
    expect(validState(p.state)).toBe(true);
    p.act({ kind: "withdraw" });
    const late = structuredClone(start);
    late.month = late.outerSea.notice! + 700;
    late.outerSea.reminded = true;
    expect(conclaveSupplement(late)).toBe(true);
    expect(send(late, { kind: "visit" }).conclave.last).toContain("补试");
  });
  it("取宝、温养、深处取法、转修及后期突破形成真实成长", () => {
    const p = qualify();
    p.act({ kind: "route", route: "current" });
    p.work(30);
    p.herbs(12);
    p.act({ kind: "prepare" });
    p.act({ kind: "enter" });
    p.battle("fight");
    expect(p.state.conclave.depth).toBe(1);
    p.work(18);
    p.act({ kind: "prepare" });
    expect(conclaveQuote(p.state, { kind: "enter" }).error).toContain("定神珠");
    const before = readiness(p.state);
    p.act({ kind: "attune" });
    expect(readiness(p.state).armor - before.armor).toBe(5);
    p.act({ kind: "enter" });
    p.battle("fight");
    expect(p.state.conclave.depth).toBe(2);
    expect(p.state.conclave.wins).toBe(2);
    const known = structuredClone(p.state.journey.known),
      training = structuredClone(p.state.growth.training);
    p.act({ kind: "method", method: "inherit" });
    const inherited = readiness(p.state);
    p.act({ kind: "method", method: "still" });
    expect(readiness(p.state).damage).toBe(inherited.damage - 8);
    expect(readiness(p.state).armor).toBe(inherited.armor + 6);
    const battle = tacticalPreview(p.state, {
move: "guard",
encounter: { hp: 300, attack: 50, pattern: ["guard"] },
battle: { hp: 10, enemy: 300, turn: 0 },
effect: ""
})!;
    expect(battle.healing).toBe(0);
    expect(p.state.journey.known).toEqual(known);
    expect(p.state.growth.training).toEqual(training);
    const forecast = cultivationProjection(p.state, 599, 120);
    const previous = p.state.outerSea.cultivation;
    p.send({
      type: "advance",
      activity: "cultivate",
      months: forecast.batchMonths,
    });
    expect(p.state.outerSea.cultivation - previous).toBe(forecast.batchGain);
    while (p.state.outerSea.cultivation < 599)
      p.send({ type: "advance", activity: "cultivate", months: 120 });
    p.work(30);
    p.act({ kind: "late" });
    expect(cultivationStageIndex(p.state)).toBe(2);
    expect(goldenCap(p.state)).toBe(899);
    expect(p.state.realm).toBe(2);
    const beforePrize = p.state.stones;
    p.battle("contest");
    expect(p.state.conclave.wins).toBe(3);
    expect(p.state.stones - beforePrize).toBe(32);
    expect(send(p.state, { kind: "contest" })).toBe(p.state);
    p.act({ kind: "leave" });
    p.send({ type: "outerSea", action: { kind: "home" } });
    expect(validState(p.state)).toBe(true);
  });
  it("交锋与秘境禁止换装、补药或跳转，主动撤退保留行装与胜绩", () => {
    const p = qualify();
    p.act({ kind: "route", route: "shelter" });
    p.work(10);
    p.herbs(2);
    p.act({ kind: "prepare" });
    p.act({ kind: "enter" });
    p.act({ kind: "fight" });
    const s = p.state;
    for (const command of [
      { type: "supplies" },
      { type: "advance", activity: "work", months: 1 },
      { type: "outerSea", action: { kind: "home" } },
      { type: "equip", technique: "blade" },
    ] as const)
      expect(dispatch(s, { ...command, id: "blocked" })).toBe(s);
    const preview = conclaveExchange(s, conclaveFoe(s).pattern[0]!)!;
    const n = send(s, { kind: "move", move: conclaveFoe(s).pattern[0]! });
    expect(n.conclave.duel!.enemy).toBe(
      s.conclave.duel!.enemy - preview.damage,
    );
    p.act({ kind: "withdraw" });
    expect(p.state.conclave.wins).toBe(2);
    expect(p.state.conclave.depth).toBe(0);
    expect(p.state.conclave.supplies).toBe(true);
    expect(p.state.injury).toBe(s.injury);
  });
  it("败退保留胜绩且半年后可再试，重复奖励与死亡事件命令不执行", () => {
    const p = conclavePlayer();
    p.arrive();
    p.work(12);
    p.act({ kind: "training", style: "ward" });
    p.battle("contest");
    p.act({ kind: "contest" });
    const s = structuredClone(p.state);
    s.conclave.duel!.hp = 1;
    s.conclave.duel!.enemy = 340;
    const n = send(s, { kind: "move", move: "strike" });
    expect(n.conclave.wins).toBe(1);
    expect(n.conclave.duel).toBeNull();
    expect(n.injury).toBe(2);
    expect(n.conclave.retryAt).toBe(n.month + 6);
    expect(send(n, { kind: "contest" })).toBe(n);
    const recovered = seaPlayer(n);
    recovered.send({ type: "advance", activity: "rest", months: 6 });
    if (recovered.state.month < recovered.state.conclave.retryAt)
      recovered.send({ type: "conclave", action: { kind: "wait" } });
    expect(conclaveQuote(recovered.state, { kind: "contest" }).error).toBe("");
    const action = {
      type: "conclave",
      action: { kind: "contest" },
      id: "one",
    } as const;
    const once = dispatch(recovered.state, action);
    expect(dispatch(once, action)).toBe(once);
    const dead = { ...recovered.state, status: "dead" as const };
    expect(send(dead, { kind: "contest" })).toBe(dead);
    const pending = {
      ...recovered.state,
      pending: { id: "pending-letter", kind: "letter" as const },
    };
    expect(send(pending, { kind: "contest" })).toBe(pending);
  });
  it("非法资格、宝物、叠加状态拒绝，迁移不补奖励且未知档保护", () => {
    for (const modify of [
      (s: State) => (s.conclave.wins = 2),
      (s: State) => (s.conclave.attuned = true),
      (s: State) => (s.conclave.stage = 2),
      (s: State) => (s.conclave.method = "still"),
      (s: State) => (s.conclave.location = "vault"),
    ]) {
      const bad = structuredClone(start);
      modify(bad);
      expect(validState(bad)).toBe(false);
      expect(() => migrateSave(bad)).toThrow();
    }
    const old = structuredClone(start);
    old.conclave = freshConclave();
    old.outerSea.cultivation = 299;
    const v30 = { ...old, version: 30, conclave: undefined };
    const migrated = migrateSave(v30);
    expect(migrated.conclave).toEqual(freshConclave());
    expect(migrated.version).toBe(34);
    expect(validState(migrated)).toBe(true);
    expect(() => migrateSave({ ...start, version: 999 })).toThrow();
  });
  it("破境需足够寿元和资源，会期消息中断只过时间不扣物资或授予境界", () => {
    const s = structuredClone(start);
    s.conclave = freshConclave();
    s.outerSea.cultivation = 299;
    s.stones = 18;
    const poor = { ...s, stones: 17 };
    expect(send(poor, { kind: "mid" })).toBe(poor);
    const old = { ...s, age: s.limit - 12 };
    expect(send(old, { kind: "mid" })).toBe(old);
    s.month = s.outerSea.notice! + 599;
    s.outerSea.reminded = false;
    const n = send(s, { kind: "mid" });
    expect(n.month).toBe(s.month + 1);
    expect(n.conclave.stage).toBe(0);
    expect(n.stones).toBe(18);
    expect(n.outerSea.reminded).toBe(true);
    expect(validState(n)).toBe(true);
  });
});
