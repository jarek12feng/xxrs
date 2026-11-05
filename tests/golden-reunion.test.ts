import { beforeAll, describe, expect, it } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  createGame,
  type State,
} from "../src/core";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { goldenStoryQuote, runGoldenStory } from "../src/golden-story/rules";
import {
  reunionQuote,
  reunionSupport,
  type ReunionAction,
} from "../src/golden-reunion";
import { freshReunion } from "../src/golden-reunion/state";
import { messageSources } from "../src/correspondence/sources";
import { SAVE_VERSION } from "../src/save-version";
let base: State;
beforeAll(() => {
  base = goldenLateCheckpoint();
  expect(base.goldenStory.companionGoldenAt).not.toBeNull();
}, 30000);
function act(
  s: State,
  action: ReunionAction,
  id = `reunion:${s.seen.length}:${JSON.stringify(action)}`,
) {
  const command = {
    type: "goldenStory" as const,
    action: { kind: "reunion" as const, action },
    id,
  };
  const next = dispatch(s, command);
  expect(
    next,
    JSON.stringify(action) + ":" + goldenStoryQuote(s, command.action).error,
  ).not.toBe(s);
  expect(dispatch(s, command)).toEqual(next);
  expect(dispatch(next, command)).toBe(next);
  expect(validState(next)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(next)))).toEqual(next);
  return next;
}
describe("金丹重逢与同行", () => {
  it("实测批注只减相应问法核验，不跳过亲习或叠加折扣", () => {
    let s = act(act(act(base, { kind: "invite" }), { kind: "meet" }), {
      kind: "plan",
      approach: "ward",
    });
    s = act(act(s, { kind: "anchor" }), { kind: "cross" });
    s.goldenStory.teachings = [];
    s.goldenStory.teachingSources = [];
    s.goldenStory.teachingPracticeResults = [];
    s.goldenStory.rubbings = [];
    expect(
      goldenStoryQuote(s, { kind: "ask", topic: "ground", source: "public" })
        .months,
    ).toBe(0);
    expect(
      goldenStoryQuote(s, { kind: "ask", topic: "spirit", source: "public" })
        .months,
    ).toBe(1);
    const next = dispatch(s, {
      type: "goldenStory",
      action: { kind: "ask", topic: "ground", source: "public" },
      id: "reunion-teaching",
    });
    expect(next.goldenStory.practice?.topic).toBe("ground");
    expect(next.goldenStory.teachings).toEqual([]);
    expect(validState(next)).toBe(true);
  });

  it("可靠来信只解锁相约；读信不赴约，回信不传送", () => {
    const no = structuredClone(base);
    no.goldenStory.companionGoldenAt = null;
    no.goldenStory.companionConfirmedAt = null;
    no.goldenStory.companionLetters = no.goldenStory.companionLetters.filter(
      (v) => v !== 4,
    );
    expect(reunionQuote(no, { kind: "invite" }).error).toBeTruthy();
    expect(messageSources(no).some((l) => l.id === "reunion:invitation")).toBe(
      false,
    );
    const letter = base.correspondence.letters.find(
      (l) => l.id === "reunion:invitation",
    );
    expect(letter).toBeTruthy();
    let s = dispatch(base, {
      type: "correspondence",
      action: { kind: "read", letter: letter!.id },
      id: "read-reunion",
    });
    expect(s.goldenStory.reunion.stage).toBe("none");
    s = dispatch(s, {
      type: "correspondence",
      action: { kind: "accept", letter: letter!.id },
      id: "accept-reunion",
    });
    expect(s.goldenStory.reunion.stage).toBe("invited");
    expect(s.month).toBe(base.month);
    expect(s.outerSea.location).toBe(base.outerSea.location);
    expect(validState(s)).toBe(true);
    s.outerSea.location = "home";
    expect(reunionQuote(s, { kind: "meet" }).error).toContain("海路");
  });
  it.each(["ward", "survey", "edge"] as const)(
    "%s 可恢复误判、保存续做、仅领一次、不同来信",
    (approach) => {
      let s = act(base, { kind: "invite" });
      s = act(s, { kind: "meet" });
      const relation = structuredClone(s.social);
      s = act(s, { kind: "plan", approach });
      const month = s.month;
      s = act(s, { kind: "cross" });
      expect(s.goldenStory.reunion.stage).toBe("planned");
      expect(s.goldenStory.reunion.mistakes).toBe(1);
      expect(s.injury).toBe(base.injury);
      const q = reunionQuote(s, { kind: "anchor" });
      s = act(s, { kind: "anchor" });
      s = act(s, { kind: "cross" });
      expect(s.month - month).toBe(q.months + 2);
      const sharing = approach === "survey" ? "private" : "public";
      const stones = s.stones,
        herbs = s.herbs;
      s = act(s, { kind: "share", sharing });
      expect(s.stones).toBe(stones + (sharing === "private" ? 8 : 0));
      expect(s.herbs).toBe(herbs + (sharing === "public" ? 4 : 0));
      expect(
        dispatch(s, {
          type: "goldenStory",
          action: { kind: "reunion", action: { kind: "share", sharing } },
          id: "again",
        }),
      ).toBe(s);
      s = act(s, { kind: "depart" });
      expect(s.social).toEqual(relation);
      expect(
        s.correspondence.letters.find((l) => l.id === "reunion:followup")?.body,
      ).toContain(sharing === "public" ? "照新图备航" : "整图且不急着刻");
    },
  );
  it("无特定宝物仍可行，已掌握的法门或出战宝物节约布锚时间", () => {
    let s = act(act(act(base, { kind: "invite" }), { kind: "meet" }), {
      kind: "plan",
      approach: "survey",
    });
    const ordinary = structuredClone(s);
    ordinary.spirit.manual = "none";
    ordinary.treasures.artifacts = [];
    expect(reunionSupport(ordinary, "survey")).toBe("");
    expect(reunionQuote(ordinary, { kind: "anchor" }).months).toBe(2);
    expect(reunionSupport(s, "survey")).toBeTruthy();
    expect(reunionQuote(s, { kind: "anchor" }).months).toBe(1);
    const snapshot = structuredClone(s);
    reunionQuote(s, { kind: "anchor" });
    expect(s).toEqual(snapshot);
  });
  it("中断不推进测读，寿尽/事件/交锋拒绝，满库存不吞成果", () => {
    let s = act(act(act(base, { kind: "invite" }), { kind: "meet" }), {
      kind: "plan",
      approach: "ward",
    });
    const interrupted = runGoldenStory(
      s,
      { kind: "reunion", action: { kind: "anchor" } },
      "interrupted",
      (n) => ({ ...n, status: "dead" }),
    );
    expect(interrupted.goldenStory.reunion).toEqual(s.goldenStory.reunion);
    expect(
      goldenStoryQuote(
        { ...s, status: "dead" },
        { kind: "reunion", action: { kind: "anchor" } },
      ).error,
    ).toBeTruthy();
    expect(
      goldenStoryQuote(
        { ...s, age: s.limit - 1 },
        { kind: "reunion", action: { kind: "anchor" } },
      ).error,
    ).toBeTruthy();
    s = act(act(s, { kind: "anchor" }), { kind: "cross" });
    s.herbs = 1e9;
    expect(
      reunionQuote(s, { kind: "share", sharing: "public" }).error,
    ).toContain("上限");
    expect(
      dispatch(s, {
        type: "goldenStory",
        action: {
          kind: "reunion",
          action: { kind: "share", sharing: "public" },
        },
        id: "full",
      }),
    ).toBe(s);
  });
  it("v48保守迁移、跨阶段字段和未来版本保护", () => {
    const old: any = structuredClone(base);
    old.version = 48;
    delete old.goldenStory.reunion;
    const snapshot = structuredClone(old);
    const upgraded = migrateSave(old);
    expect(upgraded.version).toBe(SAVE_VERSION);
    expect(upgraded.goldenStory.reunion).toEqual(freshReunion());
    expect(old).toEqual(snapshot);
    expect(upgraded.correspondence).toEqual(base.correspondence);
    const broken = structuredClone(base);
    broken.goldenStory.reunion.stage = "departed";
    expect(validState(broken)).toBe(false);
    expect(() => migrateSave({ ...base, version: SAVE_VERSION + 1 })).toThrow();
    expect(validState(createGame("初行", "wood", 1))).toBe(true);
  });
});
