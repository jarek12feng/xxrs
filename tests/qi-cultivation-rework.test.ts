import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type State,
  type Intent,
} from "../src/core";
import { createCultivator } from "../tools/cultivator-fixture";
import { cultivationQuote } from "../src/qi-cultivation/rules";
import { qiCultivationStep } from "../tools/qi-cultivation-policy";
import { foundationStep } from "../tools/foundation-playthrough";
import { freshQiCultivation } from "../src/qi-cultivation/state";
import { workshopQuote } from "../src/workshop/rules";
import { battleConclusion } from "../src/battle-conclusion";
import { qiEnemy } from "../src/qi-journey/rules";
import { breakthroughDetails } from "../src/progression/breakthrough";
let serial = 0;
const send = (s: State, i: Intent) =>
  dispatch(s, { ...i, id: `rework-${++serial}` });
function ready() {
  const s = createCultivator("行功", "wood", 42);
  s.qiJourney.cultivation = freshQiCultivation();
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.qi = 119;
  s.study = 2;
  s.journey.known = ["spring"];
  s.journey.main = "spring";
  s.growth.training.spring = 1;
  return s;
}
function finish(s: State) {
  for (let i = 0; s.qiJourney.cultivation.work && i < 30; i++)
    s = send(s, qiCultivationStep(s)!);
  return s;
}
describe("炼气修行整改的实际命令边界", () => {
  it("新档吐纳数年也不能自动跨越中期，附带修为同样受限", () => {
    let s = ready();
    s.qi = 0;
    const start = s.month;
    for (let i = 0; i < 20; i++)
      s = send(s, { type: "advance", activity: "cultivate", months: 12 });
    expect(s.qi).toBe(119);
    expect(s.month - start).toBeGreaterThanOrEqual(36);
    expect(s.qiJourney.cultivation.middle).toBe(false);
    expect(send(s, { type: "prepare", kind: "retreat" }).qi).toBeLessThan(120);
  });
  it.each([
    ["circulate", "circulate", "ease", "circulate"],
    [
      "spread",
      "spread",
      "spread",
      "ease",
      "spread",
      "spread",
      "ease",
      "spread",
    ],
  ])("小周天允许整股与分股两种有效行功，且存读档确定性一致", (...moves) => {
    let s = send(ready(), { type: "qiJourney", action: "cultivation:begin" });
    expect(s.qiJourney.cultivation.work).not.toBeNull();
    for (const move of moves) {
      const i = { type: "qiJourney", action: `cultivation:${move}` } as Intent;
      expect(send(migrateSave(s), i).qiJourney.cultivation).toEqual(
        send(s, i).qiJourney.cultivation,
      );
      s = send(s, i);
    }
    expect(s.qiJourney.cultivation.middle).toBe(true);
    expect(s.qi).toBe(120);
    expect(s.qiJourney.cultivation.work).toBeNull();
  });
  it("强冲散功、不晋级，可养伤后重新尝试；活动期间拒绝其他收益命令", () => {
    let s = send(ready(), { type: "qiJourney", action: "cultivation:begin" });
    expect(send(s, { type: "advance", activity: "work", months: 12 })).toBe(s);
    for (let i = 0; i < 3; i++)
      s = send(s, { type: "qiJourney", action: "cultivation:circulate" });
    expect(s.injury).toBe(1);
    expect(s.qiJourney.cultivation.middle).toBe(false);
    s = send(s, { type: "advance", activity: "rest", months: 1 });
    s = finish(send(s, { type: "qiJourney", action: "cultivation:begin" }));
    expect(s.qiJourney.cultivation.middle).toBe(true);
  });
  it("普通灵草无法替代主药，主药探采与自炼行炉各有实际步骤", () => {
    let s = ready();
    s.qiJourney.cultivation.middle = true;
    s.qiJourney.gates = 2;
    s.qi = 360;
    s.herbs = 50;
    s.stones = 100;
    s.study = 4;
    s.sense = 8;
    expect(
      workshopQuote(s, { product: "foundation", method: "craft" }).error,
    ).toContain("玉髓芝");
    s = finish(send(s, { type: "qiJourney", action: "cultivation:herb" }));
    expect(s.qiJourney.cultivation.roots).toBe(1);
    const before = s;
    s = send(s, { type: "prepare", kind: "refine" });
    expect(s.pills).toBe(before.pills);
    expect(s.qiJourney.cultivation.work?.kind).toBe("alchemy");
    expect(s.qiJourney.cultivation.roots).toBe(0);
    s = finish(s);
    expect(s.pills).toBe(before.pills + 1);
    expect(s.crafted).toBe(before.crafted + 1);
  });
  it("委托炼丹仍消耗真实主药，且只有整段筹备完成才扣料", () => {
    let s = ready();
    s.qiJourney.cultivation.middle = true;
    s.qiJourney.cultivation.roots = 1;
    s.herbs = 20;
    s.stones = 80;
    const before = s;
    s = send(s, {
      type: "workshop",
      order: { product: "foundation", method: "commission" },
    });
    expect(s.pills).toBe(before.pills + 1);
    expect(s.month - before.month).toBe(6);
    expect(s.qiJourney.cultivation.roots).toBe(0);
  });
  it.each(["herbs", "watch", "copy"] as const)(
    "%s差事开始不发钱，完成现场判断才有贡献，错误处理会失败",
    (kind) => {
      let s = ready();
      s.journey.branch = "dan";
      s.herbs = 10;
      s.stones = 20;
      s = send(s, { type: "duty", duty: kind });
      expect(s.journey.contribution).toBe(0);
      expect(s.journey.duties).toBe(0);
      s = finish(s);
      expect(s.journey.contribution).toBe(2);
      expect(s.journey.duties).toBe(1);
      const invalid = { ...s.qiJourney.cultivation, roots: -1 };
      expect(
        validState({
          ...s,
          qiJourney: { ...s.qiJourney, cultivation: invalid },
        }),
      ).toBe(false);
    },
  );
  it("三段行功不再抹去根基差异变成无条件必成", () => {
    const s = {
      foundation: 12,
      mastery: 0,
      injury: 0,
      story: { luchi: "companion", trust: 2 },
      ascension: {
        realm: 0 as const,
        step: 3,
        strain: 0,
        history: ["a", "b", "c"],
      },
    };
    expect(breakthroughDetails(s, true).chance).toBe(77);
    expect(
      breakthroughDetails({ ...s, foundation: 24 }, true).chance,
    ).toBeGreaterThan(77);
  });
  it("准备路线与晋升秘境使用不同敌人，护送不再画成妖兽", () => {
    const s = ready();
    s.qiJourney.trial = "sect";
    s.qiJourney.node = 1;
    expect(qiEnemy(s)?.kind).toBe("人族");
    expect(qiEnemy(s)?.image).toContain("raider");
    s.qiJourney.trial = "medicine";
    expect(qiEnemy(s)?.identity).toBe("herb-marten");
  });
  it("护送战胜负与主动撤离产生明确结果", () => {
    const s = ready();
    s.expedition.duel = { hp: 20, enemy: 20, turn: 0 };
    const n = structuredClone(s);
    n.expedition.duel = null;
    n.expedition.last = "护送完成";
    expect(
      battleConclusion(s, n, { type: "expedition", action: "strike" })?.title,
    ).toBe("战斗胜利");
    n.injury++;
    expect(
      battleConclusion(s, n, { type: "expedition", action: "guard" })?.title,
    ).toContain("战败");
    expect(
      battleConclusion(s, n, { type: "expedition", action: "withdraw" })?.title,
    ).toContain("主动撤离");
  });
  it("外海返回是撤离，身陨不提示养伤再战", () => {
    const s = ready();
    s.outerSea.duel = { depth: 1, hp: 20, enemy: 20, turn: 0, effect: "" };
    const n = structuredClone(s);
    n.outerSea.duel = null;
    n.outerSea.last = "返回古渡，保留已通进度。";
    expect(battleConclusion(s,n,{type:"outerSea",action:{kind:"return"}})?.title).toContain("主动撤离");
    n.status = "dead";
    const result = battleConclusion(s,n,{type:"outerSea",action:{kind:"move",move:"strike"}});
    expect(result?.title).toContain("身陨");
    expect(result?.next).toContain("读取此前存档");
    expect(result?.next).not.toContain("养伤");
  });
  it("宗门战绩判负时，即使没有增加伤势也不得显示胜利", () => {
    const s = ready();
    s.sectContest.duel = { hp: 20, enemy: 20, turn: 0, effect: "" };
    const n = structuredClone(s);
    n.sectContest.duel = null;
    n.sectContest.results.push("loss");
    n.sectContest.last = "对手收剑，执事记下结果。";
    expect(battleConclusion(s,n,{type:"expedition",action:"strike"})?.title).toContain("战败");
  });
  it.each(["medicine", "sect", "wander"] as const)(
    "正常新档经%s路线积累、破禁、取材与筑基，不直接编辑进度",
    (route) => {
      let s = createGame("求道", "wood", 42, "insightful", "male");
      for (let i = 0; i < 650 && !s.realm; i++) {
        const old = s;
        s = send(s, foundationStep(s, true, route));
        expect(s, JSON.stringify(foundationStep(old, true, route))).not.toBe(
          old,
        );
        expect(validState(s)).toBe(true);
      }
      expect(s.realm).toBe(1);
      expect(s.qiJourney.cultivation.middle).toBe(true);
      expect(s.qiJourney.cultivation.relic).toBe(true);
      expect(s.month).toBeGreaterThan(120);
    },
  );
  it("旧突破命令也不能绕过伤势与根基要求，拒绝时不耗丹或随机种子", () => {
    const s = ready();
    s.qiJourney.cultivation.middle = true;
    s.qiJourney.gates = 2;
    s.qi = 360;
    s.pills = 1;
    s.foundation = 11;
    expect(send(s, { type: "break", pill: true })).toBe(s);
    s.foundation = 12;
    s.injury = 1;
    expect(send(s, { type: "break", pill: true })).toBe(s);
  });
  it("被阻止的行功不会扣料和推进时间", () => {
    const s = ready();
    s.study = 0;
    expect(cultivationQuote(s, "cultivation:begin").error).toContain("心得");
    expect(send(s, { type: "qiJourney", action: "cultivation:begin" })).toBe(s);
  });
});
