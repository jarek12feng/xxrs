import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  activeEventId,
  companion,
  eventView,
  duelIntent,
  type State,
  type Intent,
} from "../src/core";
import { createGame as createV4 } from "../src/legacy-v4";
let sequence = 0;
function act(s: State, intent: Intent) {
  const before = structuredClone(s);
  const n = dispatch(s, { ...intent, id: `social-${++sequence}` });
  expect(s).toEqual(before);
  expect(validState(n)).toBe(true);
  return n;
}
function adult(gender: "male" | "female" = "male", seed = 1) {
  const s = createGame("试炼", "wood", seed, "insightful", gender);
  s.month = 25;
  s.age = 217;
  s.stones = 100;
  s.herbs = 20;
  s.story.stage = "resolved";
  s.story.choice = "gift";
  s.story.luchi = "foundation";
  return s;
}
function choose(s: State, option: string) {
  return act(s, { type: "choose", instanceId: activeEventId(s), option });
}
function prepared(seed = 1) {
  const s = adult("male", seed);
  s.realm = 1;
  s.journey.settled = true;
  s.foundation = 24;
  s.sense = 12;
  s.study = 4;
  s.journey.known = ["breath", "guard"];
  s.journey.main = "breath";
  s.journey.support = "guard";
  s.journey.relics.sword = 2;
  s.journey.equipped = "sword";
  return s;
}
describe("relationships and arena", () => {
  it.each(["male", "female"] as const)(
    "finishes the %s relationship through finite shared memories",
    (gender) => {
      let s = adult(gender);
      expect(companion(s)?.gender).toBe(gender === "male" ? "女" : "男");
      s = choose(act(s, { type: "visit" }), "listen");
      s = choose(act(s, { type: "outing", outing: "walk" }), "stay");
      expect(act(s, { type: "outing", outing: "walk" })).toBe(s);
      s = choose(act(s, { type: "outing", outing: "night" }), "honest");
      s.social.arena.losses = 2;
      s = choose(act(s, { type: "outing", outing: "watch" }), "thanks");
      expect(s.social.affection).toBe(53);
      s = choose(act(s, { type: "confess" }), "later");
      expect(s.social.bonded).toBe(false);
      s = choose(act(s, { type: "confess" }), "yes");
      expect(s.social.bonded).toBe(true);
      expect(act(s, { type: "confess" })).toBe(s);
      expect(migrateSave(s)).toEqual(s);
    },
  );
  it("requires adulthood and preserves old identity choice", () => {
    const young = createGame("客", "wood", 1, "insightful", "male");
    expect(act(young, { type: "visit" })).toBe(young);
    let s = migrateSave(createV4("旧客", "wood"));
    expect(s.social.gender).toBeNull();
    s = act(s, { type: "identity", gender: "female" });
    expect(act(s, { type: "identity", gender: "male" })).toBe(s);
  });
  it("freezes scenes, rejects stale choices and restores the exact pending scene", () => {
    const s = act(adult(), { type: "visit" });
    for (const c of [
      { type: "advance", activity: "work", months: 1 },
      { type: "arenaScout" },
      { type: "queueTick" },
    ] as Intent[])
      expect(act(s, c)).toBe(s);
    expect(
      act(s, { type: "choose", instanceId: "stale", option: "listen" }),
    ).toBe(s);
    expect(migrateSave(s)).toEqual(s);
    const n = choose(s, "listen");
    expect(
      act(n, {
        type: "choose",
        instanceId: activeEventId(s),
        option: "listen",
      }),
    ).toBe(n);
  });
  it("scouting, injury and realm gates cannot be skipped", () => {
    let s = adult();
    expect(act(s, { type: "arenaStart" })).toBe(s);
    s = act(s, { type: "arenaScout" });
    s.injury = 1;
    expect(act(s, { type: "arenaStart" })).toBe(s);
    s.injury = 0;
    s.social.arena.wins = 2;
    s.social.arena.scouted.push(2);
    expect(act(s, { type: "arenaStart" })).toBe(s);
  });
  it("losing retains gear, creates recovery needs and cannot reroll a saved turn", () => {
    let s = act(act(adult(), { type: "arenaScout" }), { type: "arenaStart" });
    expect(act(s, { type: "advance", activity: "work", months: 1 })).toBe(s);
    expect(act(s, { type: "equipRelic", relic: "vial" })).toBe(s);
    const command = {
      id: "same-turn",
      type: "arenaTurn",
      stance: "discern",
    } as const;
    expect(dispatch(migrateSave(s), command)).toEqual(dispatch(s, command));
    const n = dispatch(s, command);
    expect(dispatch(n, command)).toBe(n);
    while (s.social.arena.duel)
      s = act(s, { type: "arenaTurn", stance: "discern" });
    expect(s.social.arena.losses).toBe(1);
    expect(s.injury).toBe(1);
    expect(s.social.arena.wins).toBe(0);
  });
  it("prepared builds can beat all three rivals across 40 seeds without repeated rewards", () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = prepared(seed);
      for (let match = 0; match < 3; match++) {
        s = act(act(s, { type: "arenaScout" }), { type: "arenaStart" });
        expect(s.social.arena.duel).not.toBeNull();
        s = migrateSave(s);
        while (s.social.arena.duel)
          s = act(s, { type: "arenaTurn", stance: duelIntent(s)! });
        expect(s.social.arena.wins).toBe(match + 1);
      }
      expect(s.journey.known).toContain("lantern");
      expect(act(s, { type: "arenaStart" })).toBe(s);
    }
  });
  it("rejects corrupt social data and future saves", () => {
    const s = adult();
    s.social.affection = 101;
    expect(validState(s)).toBe(false);
    expect(() => migrateSave(s)).toThrow();
    expect(() => migrateSave({ ...adult(), version: 99 })).toThrow();
  });
});

it.each(["male", "female"] as const)(
  "keeps cultivation ambitions and prior answers in the %s romance after reload",
  (gender) => {
    for (const night of ["promise", "honest"] as const) {
      let s = choose(act(adult(gender), { type: "visit" }), "listen");
      s = choose(act(s, { type: "outing", outing: "walk" }), "care");
      s = act(migrateSave(s), { type: "outing", outing: "night" });
      expect(eventView(s)?.body).toContain("照料伤者");
      expect(eventView(s)?.body).toContain("闭关");
      s = choose(s, night);
      s.social.arena.losses = 2;
      s = choose(act(s, { type: "outing", outing: "watch" }), "thanks");
      s = act(migrateSave(s), { type: "confess" });
      expect(eventView(s)?.body).toContain(
        night === "promise" ? "愿意与我再走" : "心里的不安",
      );
      expect(eventView(s)?.body).toContain("不想你放弃自己的");
      expect(migrateSave(s)).toEqual(s);
    }
  },
);
