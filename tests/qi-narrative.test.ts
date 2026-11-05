import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { describe, it, expect } from "vitest";
import { dispatch, validState, migrateSave } from "../src/core";
import type { State } from "../src/core";
import { runQiJourney, qiError, qiPower } from "../src/qi-journey/rules";
import {
  qiCaveComplete,
  qiNarrativeNext,
  qiNarrativeQuote,
  qiNarrativeEnemy,
  type QiNarrativeAction,
} from "../src/qi-journey/narrative";
import { validQiNarrative } from "../src/qi-journey/narrative-state";
import { foundationStep } from "../tools/foundation-playthrough";
const tick = (s: State) => ({ ...s, month: s.month + 1, age: s.age + 1 });
function fixture(main: "spring" | "blade" | "breath" = "spring") {
  const s = createGame("石涧试行", "wood", 42);
  s.pending = null;
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.adventure.step = "done";
  s.qi = 240;
  s.qiJourney.gates = 1;
  s.qiJourney.preparations[1]!.wander = 3;
  s.journey.main = main;
  s.sense = 10;
  s.study = 4;
  s.foundation = 18;
  s.mastery = 10;
  s.herbs = 50;
  s.stones = 100;
  return s;
}
function send(s: State, a: QiNarrativeAction) {
  const error = qiError(s, a);
  expect(error, a).toBe("");
  const next = runQiJourney(s, a, `${s.seen.length}-${a}`, tick);
  expect(
    validQiNarrative(next.qiJourney.narrative),
    JSON.stringify(next.qiJourney.narrative),
  ).toBe(true);
  return next;
}
function enter(
  s: State,
  method: "medicine" | "body" | "array",
  company: "together" | "alone" = "together",
) {
  for (const a of [
    "cave:depart",
    `cave:${company}`,
    `cave:prepare:${method}`,
    "cave:mark",
    "cave:challenge",
  ] as QiNarrativeAction[])
    s = send(s, a);
  return s;
}
function fight(s: State) {
  for (let i = 0; s.qiJourney.narrative.duel && i < 16; i++) {
    const n = s.qiJourney.narrative;
    const e = qiNarrativeEnemy(s);
    s = send(s, `narrative:${e.pattern[n.duel!.turn % e.pattern.length]}`);
  }
  return s;
}
function finish(s: State) {
  s = fight(s);
  expect(s.qiJourney.narrative.phase).toBe("won");
  s = send(s, "cave:process:separate");
  s = send(s, "cave:apply");
  return s;
}
describe("石涧核心历练", () => {
  it.each(["spring", "blade", "breath"] as const)(
    "三主修 %s 的三解法均可完成，成果用于凝元内府",
    (main) => {
      for (const method of ["medicine", "body", "array"] as const) {
        let s = fixture(main);
        const baseline = qiPower(s).armor;
        s = finish(enter(s, method));
        expect(qiCaveComplete(s)).toBe(true);
        expect(qiPower(s).armor).toBe(baseline + 1);
        expect(s.month).toBe(2);
        expect(s.qiJourney.gates).toBe(1);
        expect(s.qiJourney.essence).toBe(false);
        expect(s.qi).toBe(240);
        expect(qiError(s, "cave:apply")).not.toBe("");
        s = send(s, "cave:notes:share");
        s = send(s, "cave:return");
        expect(s.qiJourney.narrative.pursuit).toBe("none");
      }
    },
  );
  it("不是进入、读札记或付钱即可替代凝元历练", () => {
    let s = fixture();
    expect(qiError(s, "enter:array")).toContain("石涧");
    s.qiJourney.essence = true;
    expect(qiError(s, "artisan")).toContain("石涧");
    s.qiJourney.essence = false;
    s = send(s, "cave:depart");
    expect(qiCaveComplete(s)).toBe(false);
    expect(qiError(s, "cave:notes:share")).not.toBe("");
    expect(qiError(s, "cave:apply")).not.toBe("");
    expect(qiError(s, "enter:array")).not.toBe("");
  });
  it("败退保留解法和退路，不重复收费；可恢复重试", () => {
    let s = enter(fixture(), "body");
    const stones = s.stones;
    s.qiJourney.narrative.duel!.hp = 1;
    s.qiJourney.narrative.duel!.turn = 15;
    s = send(s, "narrative:strike");
    expect(s.qiJourney.narrative.phase).toBe("prepared");
    expect(s.qiJourney.narrative.location).toBe("home");
    expect(s.injury).toBe(1);
    s = send(s, "cave:depart");
    expect(s.stones).toBe(stones);
    s = send(s, "cave:challenge");
    s = finish(s);
    expect(s.injury).toBe(0);
  });
  it("同种子同操作一致，旧命令不重复给成果", () => {
    const a = finish(enter(fixture(), "array")),
      b = finish(enter(fixture(), "array"));
    expect(a).toEqual(b);
    expect(runQiJourney(a, "cave:apply", a.seen.at(-1)!, tick)).toBe(a);
    expect(JSON.parse(JSON.stringify(a.qiJourney.narrative))).toEqual(
      a.qiJourney.narrative,
    );
  });
  it("缺准备/资源/受伤不可强进，未知字段和伪造完成拒绝", () => {
    const s = fixture();
    s.qiJourney.gates = 0;
    expect(qiError(s, "cave:depart")).toContain("淬脉");
    const n = structuredClone(s.qiJourney.narrative);
    n.phase = "applied";
    expect(validQiNarrative(n)).toBe(false);
    n.phase = "unknown";
    (n as any).mixture = "fake";
    expect(validQiNarrative(n)).toBe(false);
  });
  it("报价与实际扣费一致，寿尽/来信先于扣费和进度", () => {
    let s = fight(enter(fixture(), "medicine"));
    s = send(s, "cave:process:balance");
    const q = qiNarrativeQuote(s, "cave:apply");
    expect(q.settlement.cost.herbs).toBe(2);
    const herbs = s.herbs;
    const interrupted = runQiJourney(s, "cave:apply", "interrupt", (x) => ({
      ...x,
      month: x.month + 1,
      pending: { id: "test", type: "encounter" } as any,
    }));
    expect(interrupted.herbs).toBe(herbs);
    expect(qiCaveComplete(interrupted)).toBe(false);
    expect(interrupted.qiJourney.narrative.location).toBe("home");
    const dead = runQiJourney(s, "cave:apply", "death", (x) => ({
      ...x,
      status: "dead",
    }));
    expect(dead.herbs).toBe(herbs);
    expect(qiCaveComplete(dead)).toBe(false);
    expect(dead.qiJourney.narrative.location).toBe("home");
  });
});
describe("有限截夺", () => {
  it.each(["share", "leave"] as const)("%s 不生成追兵", (choice) => {
    let s = finish(enter(fixture(), "array"));
    s = send(s, `cave:notes:${choice}`);
    s = send(s, "cave:return");
    expect(qiError(s, "ambush:depart")).not.toBe("");
  });
  it.each(["yield", "escort", "capture", "release"] as const)(
    "%s 有持久回执且不丢核心成果",
    (end) => {
      let s = finish(enter(fixture(), "array"));
      s = send(s, "cave:notes:claim");
      s = send(s, "cave:return");
      s = send(s, "ambush:depart");
      if (end === "capture" || end === "release") {
        s = send(s, "ambush:fight");
        s = fight(s);
        expect(s.qiJourney.narrative.pursuit).toBe("defeated");
      }
      s = send(s, `ambush:${end}`);
      expect(qiCaveComplete(s)).toBe(true);
      expect(s.qiJourney.narrative.location).toBe("home");
      expect(qiError(s, "ambush:depart")).not.toBe("");
      expect(s.qiJourney.narrative.last).toBeTruthy();
    },
  );
  it("独行者不能凭空叫来卢雁回，失败有限收束不刷追兵", () => {
    let s = finish(enter(fixture(), "array", "alone"));
    s = send(s, "cave:notes:claim");
    s = send(s, "cave:return");
    s = send(s, "ambush:depart");
    expect(qiError(s, "ambush:escort")).not.toBe("");
    s = send(s, "ambush:fight");
    s.qiJourney.narrative.duel!.hp = 1;
    s.qiJourney.narrative.duel!.turn = 15;
    s = send(s, "narrative:guard");
    expect(s.qiJourney.narrative.pursuit).toBe("escaped");
    expect(qiCaveComplete(s)).toBe(true);
    expect(qiError(s, "ambush:depart")).not.toBe("");
  });
});
it("入道动机、宗门/散修与家书不赠资源、不改变分丹", () => {
  let s = createGame("药乡", "wood");
  const resources = [s.stones, s.herbs, s.qi, s.seed, s.journey.main];
  s = send(s, "origin:life");
  expect([s.stones, s.herbs, s.qi, s.seed, s.journey.main]).toEqual(resources);
  expect(s.month).toBe(0);
  s.adventure.step = "done";
  s = send(s, "origin:sect");
  expect(s.qiJourney.narrative.last).toContain("尚未入宗");
  s.qiJourney.gates = 2;
  const choice = s.story.choice;
  s = send(s, "origin:entrust");
  expect(s.story.choice).toBe(choice);
  expect(s.qiJourney.narrative.homeReply).toBe("entrust");
});
it("正常命令新档到筑基，药窟可保存恢复", () => {
  let s = createGame("从药乡到筑基", "wood", 42, "insightful");
  let saved = false;
  for (let i = 0; i < 550 && !s.realm; i++) {
    const n = qiNarrativeNext(s);
    const intent =
      n && !qiError(s, n)
        ? { type: "qiJourney" as const, action: n }
        : foundationStep(s);
    s = dispatch(s, { ...intent, id: `normal-${i}` });
    if (s.qiJourney.narrative.duel && !saved) {
      expect(validState(s)).toBe(true);
      const result = migrateSave(JSON.parse(JSON.stringify(s)));
      expect(result).toBeTruthy();
      saved = true;
    }
  }
  expect(
    saved,
    JSON.stringify({ last: s.qiJourney.last, next: foundationStep(s) }),
  ).toBe(true);
  expect(
    s.realm,
    JSON.stringify({
      last: s.qiJourney.last,
      next: foundationStep(s),
      n: s.qiJourney.narrative,
      herbs: s.herbs,
    }),
  ).toBe(1);
  expect(qiCaveComplete(s)).toBe(true);
  expect(validState(s)).toBe(true);
});

it('自动药窟策略先撤出补草或疗伤，不在互斥现场发恢复命令',()=>{
 let s=finish(enter(fixture(),'body'));
 s.qiJourney.narrative.phase='processed';s.herbs=0;
 expect(qiNarrativeNext(s)).toBe('cave:return');
 s=send(s,'cave:return');expect(qiNarrativeNext(s)).toBeNull();
 s.herbs=4;expect(qiNarrativeNext(s)).toBe('cave:depart');
 s=send(s,'cave:depart');s.qiJourney.narrative.phase='prepared';s.qiJourney.narrative.mixture='none';s.injury=3;
 expect(qiNarrativeNext(s)).toBe('cave:return');
});

it('额外札记给下次内府准备不同实效，交札止争收回额外加成但保留核心',()=>{
 const completed=finish(enter(fixture(),'array'));const damage=qiPower(completed).damage;
 const shared=send(completed,'cave:notes:share');expect(qiPower(shared).damage).toBe(damage+1);
 let claimed=send(completed,'cave:notes:claim');expect(qiPower(claimed).damage).toBe(damage+2);
 claimed=send(claimed,'cave:return');claimed=send(claimed,'ambush:depart');claimed=send(claimed,'ambush:yield');
 expect(qiPower(claimed).damage).toBe(damage);expect(qiCaveComplete(claimed)).toBe(true);
 const left=send(completed,'cave:notes:leave');expect(qiPower(left).damage).toBe(damage);
});
