import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { describe, it, expect } from "vitest";
import { type State } from "../src/core";
import { freshGoldenStory, validGoldenStory } from "../src/golden-story/state";
import {
  teachingSolution,
  goldenStoryQuote,
  runGoldenStory,
  companionNews,
  goldenCooperation,
  type GoldenStoryAction,
} from "../src/golden-story/rules";
function fixture() {
  const s = createGame("问路", "wood", 42, "insightful");
  s.realm = 2;
  s.limit = 6000;
  s.outerSea.location = "ferry";
  s.outerSea.met = true;
  s.goldenCore.farShore = true;
  s.stones = 100;
  s.herbs = 20;
  s.goldenStory = freshGoldenStory();
  return s;
}
const tick = (s: State) => ({ ...s, month: s.month + 1, age: s.age + 1 });
let serial = 0;
const run = (s: State, a: GoldenStoryAction) =>
  runGoldenStory(s, a, `story-${++serial}`, tick);
describe("金丹G1–G5领域", () => {
  it("两处实测与不同分工耗费，潮图不被自动公开", () => {
    for (const duty of ["ward", "survey"] as const) {
      let s = fixture();
      expect(goldenStoryQuote(s, { kind: "measure" }).error).toBeTruthy();
      for (const point of ["gauge", "flow"] as const)
        s = run(s, { kind: "observe", point });
      s = run(s, { kind: "duty", duty });
      const before = structuredClone(s);
      s = run(s, { kind: "measure" });
      expect(s.goldenStory.tideComplete).toBe(true);
      expect(s.month - before.month).toBe(1);
      expect(before.herbs - s.herbs).toBe(duty === "ward" ? 2 : 0);
      expect(before.stones - s.stones).toBe(duty === "survey" ? 4 : 0);
      expect(s.outerSea.pact).toBe("none");
      expect(validGoldenStory(s)).toBe(true);
      expect(run(s, { kind: "measure" })).toBe(s);
    }
  });
  it("未入宗未夺魁未赴会者可取得四项公开问法", () => {
    let s = fixture();
    for (const topic of ["method", "spirit", "pill", "ground"] as const) {
      s = run(s, { kind: "ask", topic, source: "public" });
      for (const move of teachingSolution(topic)) s = run(s, {kind:"practice",move});
    }
    expect(s.goldenStory.teachings).toHaveLength(4);
    expect(s.conclave.wins).toBe(0);
    expect(s.conclave.introduced).toBe(false);
    expect(validGoldenStory(s)).toBe(true);
  });
  it("两份拓本有分配上限、持久合作差异且不动独占宝物", () => {
    let s = fixture();
    s.conclave.depth = 2;
    s.conclave.attuned = true;
    const prior = structuredClone(s.conclave);
    s = run(s, { kind: "rubbing", recipient: "chengyuan" });
    expect(
      goldenStoryQuote(s, { kind: "ask", topic: "ground", source: "public" })
        .months,
    ).toBe(0);
    s = run(s, { kind: "rubbing", recipient: "retain" });
    expect(run(s, { kind: "rubbing", recipient: "hengxuan" })).toBe(s);
    expect(s.conclave).toEqual(prior);
    expect(goldenCooperation(s)).toEqual({
      harbor: true,
      charts: false,
      frost: false,
    });
    expect(validGoldenStory(s)).toBe(true);
  });
  it("退潮旧录要求原成果先实际温养研修", () => {
    let s = fixture();
    s.outerSea.cleared = 2;
    expect(run(s, { kind: "oldRecord" })).toBe(s);
    s.outerSea.attuned = true;
    s.outerSea.method = "continue";
    s = run(s, { kind: "oldRecord" });
    expect(s.goldenStory.oldRecord).toBe(true);
    expect(s.goldenStory.last).toContain("还辨不出旧主人所记的远方在何处");
  });
  it("消息按相识年月而非玩家小境界，不虚构突破或复活", () => {
    const s = fixture();
    s.social.met = true;
    s.social.metMonth = s.month;
    s.social.gender = "male";
    const first = companionNews(s);
    s.conclave.stage = 2;
    expect(companionNews(s)).toEqual(first);
    s.month += 650;
    expect(companionNews(s)?.id).toBe(2);
    expect(companionNews(s)?.text).toContain("出关之日还未定");
    s.month += 2500;
    expect(companionNews(s)?.id).toBe(3);
    expect(companionNews(s)?.text).toContain("此后再无近讯");
  });
  it("重复命令、未知动作与事件期间禁止结算", () => {
    const s = fixture();
    const a = { kind: "observe", point: "gauge" } as const;
    const n = runGoldenStory(s, a, "once", tick);
    expect(runGoldenStory(n, a, "once", tick)).toBe(n);
    expect(run(s, { kind: "nonsense" } as unknown as GoldenStoryAction)).toBe(
      s,
    );
    s.outerSea.location = "ruins";
    expect(run(s, a)).toBe(s);
  });
  it("月结中断保留旧成果且不扣观潮物资", () => {
    let s = fixture();
    for (const point of ["gauge", "flow"] as const)
      s = run(s, { kind: "observe", point });
    s = run(s, { kind: "duty", duty: "ward" });
    const n = runGoldenStory(s, { kind: "measure" }, "interrupt", (n) => ({
      ...tick(n),
      status: "dead",
    }));
    expect(n.goldenStory.tideComplete).toBe(false);
    expect(n.herbs).toBe(s.herbs);
    expect(n.month).toBe(s.month + 1);
  });
  it("校验拒绝伪造完成、重复拓本与未来数据，元婴保留历史", () => {
    const s = fixture();
    s.goldenStory.tideComplete = true;
    expect(validGoldenStory(s)).toBe(false);
    s.goldenStory = freshGoldenStory();
    s.goldenStory.rubbings = ["retain", "retain"];
    expect(validGoldenStory(s)).toBe(false);
    s.goldenStory = freshGoldenStory();
    s.realm = 3;
    expect(validGoldenStory(s)).toBe(true);
  });
  it("会期来信在月结中断问法，不提前结算教学", () => {
    const s = fixture();
    const n = runGoldenStory(
      s,
      { kind: "ask", topic: "pill", source: "public" },
      "deadline",
      (n) => ({ ...tick(n), outerSea: { ...n.outerSea, reminded: true } }),
    );
    expect(n.goldenStory.teachings).toEqual([]);
    expect(n.month).toBe(s.month + 1);
  });
  it("离照现场不得越域问法，未来来信不能伪造", () => {
    const s = fixture();
    s.lizhao.location = "outer";
    expect(
      goldenStoryQuote(s, { kind: "ask", topic: "pill", source: "public" })
        .error,
    ).toBeTruthy();
    s.social.met = true;
    s.social.metMonth = s.month;
    s.goldenStory.companionLetters = [3];
    expect(validGoldenStory(s)).toBe(false);
  });
  it("圆满考验与凝婴过程中不能办理见闻交接", () => {
    const s = fixture();
    s.nascentSoul.trial = { turn: 0, body: 12, mind: 12, power: 0, seals: 0 };
    expect(
      goldenStoryQuote(s, { kind: "ask", topic: "pill", source: "public" })
        .error,
    ).toBeTruthy();
    s.nascentSoul.trial = null;
    s.nascentSoul.attempt = { phase: 0, flow: 0, spirit: 0, stability: 5 };
    expect(
      goldenStoryQuote(s, { kind: "observe", point: "flow" }).error,
    ).toBeTruthy();
  });
});

it("试法错误有线索可改，不扣年月；保存续试、原地授法与重放一致", () => {
  let s=run(fixture(),{kind:"ask",topic:"pill",source:"public"});
  expect(s.goldenStory.teachings).toEqual([]);
  const month=s.month, stones=s.stones;
  const bad=runGoldenStory(s,{kind:"practice",move:"pillVent"},"wrong",tick);
  expect(bad).toEqual(runGoldenStory(s,{kind:"practice",move:"pillVent"},"wrong",tick));
  expect(bad.goldenStory.practice?.errors).toBe(1);
  expect(bad.goldenStory.practice?.feedback).toContain("混流");
  s=run(bad,{kind:"practice",move:"pillReset"});
  s=JSON.parse(JSON.stringify(s));
  expect(validGoldenStory(s)).toBe(true);
  s.conclave.location="court";
  expect(run(s,{kind:"practice",move:"pillVent"})).toBe(s);
  s.conclave.location="away";
  for(const move of teachingSolution("pill")) s=run(s,{kind:"practice",move});
  expect(s.goldenStory.teachings).toEqual(["pill"]);
  expect(s.goldenStory.teachingPracticeResults).toEqual([{topic:"pill",errors:1}]);
  expect(s.month).toBe(month); expect(s.stones).toBe(stones);
  expect(run(s,{kind:"practice",move:"pillVent"})).toBe(s);
});
it("旧版问法记录保留，缺失练习字段只允许在旧版校验",()=>{
  const s=fixture(); s.goldenStory.teachings=["method"];s.goldenStory.teachingSources=["public"];
  delete (s.goldenStory as Partial<typeof s.goldenStory>).practice;
  delete (s.goldenStory as Partial<typeof s.goldenStory>).teachingPracticeResults;
  expect(validGoldenStory(s,true)).toBe(true);expect(validGoldenStory(s)).toBe(false);
  const young=createGame("旧档","wood",42,"insightful");
  delete (young.goldenStory as Partial<typeof young.goldenStory>).practice;
  delete (young.goldenStory as Partial<typeof young.goldenStory>).teachingPracticeResults;
  expect(validGoldenStory(young,true)).toBe(true);
});
it("试法存档拒绝已授话题重复练习与虚假结果",()=>{
 const s=run(fixture(),{kind:"ask",topic:"method",source:"public"});
 s.goldenStory.teachingPracticeResults=[{topic:"pill",errors:0}];expect(validGoldenStory(s)).toBe(false);
 s.goldenStory.teachingPracticeResults=[];s.goldenStory.teachings=["method"];s.goldenStory.teachingSources=["public"];expect(validGoldenStory(s)).toBe(false);
});
