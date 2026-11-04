import { describe, it, expect } from "vitest";
import { createGame, dispatch, validState, migrateSave } from "../src/core";
import {
  companionChronology,
  companionNews,
} from "../src/golden-story/companion";
import { freshGoldenStory, validGoldenStory } from "../src/golden-story/state";
import { runGoldenStory } from "../src/golden-story/rules";
import { companionContact } from "../src/nascent-soul/contact";
import { nascentQuote } from "../src/nascent-soul/rules";
import {
  goldenLateCheckpoint,
  finishGoldenCompletion,
} from "../tools/golden-completion-checkpoint";
function syntheticHistory() {
  const s = createGame("消息边界", "wood", 42, "insightful");
  s.realm = 2;
  s.limit = 6000;
  s.month = 3700;
  s.age = 3892;
  s.social.gender = "male";
  s.social.met = true;
  s.social.metMonth = 100;
  const q = s.foundationJourney;
  q.heroine.map = "public";
  q.heroine.expedition = true;
  q.heroine.supplied = true;
  q.rescue = 4;
  q.won = ["rescue"];
  q.inheritance = "spring";
  q.departedAt = 500;
  q.epilogue = true;
  s.goldenCore.formedAt = 1300;
  s.goldenStory = freshGoldenStory();
  return s;
}
describe("伙伴独立凝丹来信", () => {
  it("读投影不能确认突破，只有可靠来信命令写入真实年月", () => {
    const s = syntheticHistory();
    const before = JSON.stringify(s);
    const news = companionNews(s)!;
    expect(news.id).toBe(4);
    expect(news.text).toContain("最初那一炉没成");
    expect(news.text).toContain("凝丹第1100月");
    expect(JSON.stringify(s)).toBe(before);
    expect(companionContact(s).confirmedGolden).toBe(false);
    expect(companionContact(s).reliable).toBe(false);
    const n = runGoldenStory(s, { kind: "companion" }, "news", (x) => x);
    expect(n.goldenStory.companionGoldenAt).toBe(1100);
    expect(n.goldenStory.companionConfirmedAt).toBe(3700);
    expect(validGoldenStory(n)).toBe(true);
    expect(companionContact(n).reliable).toBe(true);
    expect(runGoldenStory(n, { kind: "companion" }, "again", (x) => x)).toBe(n);
  });
  it("没有自己的经历、她的筹备过迟或超过五百年均不捏造成功或死亡", () => {
    const s = syntheticHistory();
    s.foundationJourney.heroine.expedition = false;
    expect(companionNews(s)?.id).toBe(3);
    s.foundationJourney.heroine.expedition = true;
    s.foundationJourney.departedAt = 1900;
    expect(companionChronology(s)?.goldenAt).toBe(null);
    expect(companionNews(s)?.id).toBe(3);
    s.foundationJourney.departedAt = 500;
    s.month = 6100;
    expect(companionNews(s)?.id).toBe(3);
    expect(companionNews(s)?.text).toContain("此后再无近讯");
  });
  it("玩家小阶段不改本人日期，伪造或未来确认消息不合法", () => {
    const s = syntheticHistory();
    const first = companionNews(s);
    s.conclave.stage = 3;
    expect(companionNews(s)).toEqual(first);
    s.goldenStory.companionGoldenAt = 1660;
    s.goldenStory.companionConfirmedAt = 3700;
    expect(validGoldenStory(s)).toBe(false);
    s.goldenStory.companionLetters = [4];
    expect(validGoldenStory(s)).toBe(true);
    s.goldenStory.companionConfirmedAt = 4000;
    expect(validGoldenStory(s)).toBe(false);
  });
  it("失败与恢复有独立可收阅的阶段消息，尚未成功不延长可靠窗口", () => {
    const s = syntheticHistory();
    s.month = 860;
    expect(companionNews(s)?.id).toBe(5);
    let n = runGoldenStory(s, { kind: "companion" }, "failed-letter", (x) => x);
    expect(n.goldenStory.companionGoldenAt).toBeNull();
    expect(validGoldenStory(n)).toBe(true);
    n.month = 980;
    expect(companionNews(n)?.id).toBe(6);
    n = runGoldenStory(n, { kind: "companion" }, "recovery-letter", (x) => x);
    expect(n.goldenStory.companionGoldenAt).toBeNull();
    expect(validGoldenStory(n)).toBe(true);
  });
  for (const main of ["spring", "blade", "breath"] as const)
    it(`${main}真实公共命令至三百岁后仍能确认伙伴金丹并联络，不改年轻存档`, () => {
      const late = goldenLateCheckpoint(main);
      expect(validState(late)).toBe(true);
      expect(late.goldenStory.companionGoldenAt).not.toBeNull();
      expect(late.goldenStory.companionLetters).toContain(4);
      const full = finishGoldenCompletion(late);
      const s = full.checkpoints.completion!;
      expect(companionContact(s).age).toBeGreaterThan(2400);
      expect(companionContact(s).confirmedGolden).toBe(true);
      expect(companionContact(s).reliable).toBe(true);
      expect(nascentQuote(s, { kind: "contact" }).error).toBe("");
      const n = dispatch(s, {
        type: "nascentSoul",
        action: { kind: "contact" },
        id: `normal-contact-${main}`,
      });
      expect(n).not.toBe(s);
      expect(validState(n)).toBe(true);
      expect(n.nascentSoul.contactedAt).toBe(n.month);
      expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
    }, 30000);
});
