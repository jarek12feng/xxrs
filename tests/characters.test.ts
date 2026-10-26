import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  eventView,
  validState,
  migrateSave,
  aptitudes,
  refineCost,
  cultivationGain,
  replayHints,
  type State,
  type Intent,
  type Aptitude,
} from "../src/core";
import { createGame as v2Game, dispatch as v2Dispatch } from "../src/legacy-v2";
import { luchiView } from "../src/characters";
let seq = 0;
function act(s: State, c: Intent) {
  const n = dispatch(s, { ...c, id: "v3-" + ++seq });
  expect(validState(n)).toBe(true);
  return n;
}
const go = (
  s: State,
  months = 1,
  activity: "work" | "cultivate" | "meditate" | "study" = "work",
) => act(s, { type: "advance", months, activity });
const choose = (s: State, option: string) =>
  act(s, { type: "choose", instanceId: s.pending!.id, option });
function start(a: Aptitude = "insightful") {
  return choose(go(createGame("测试", "wood", 1, a), 3), "aid");
}
function until(s: State, month: number) {
  for (let i = 0; i < 100 && s.month < month; i++) {
    s = go(s, Math.min(12, month - s.month));
    if (s.pending?.kind === "letter") s = choose(s, "listen");
    if (s.pending?.kind === "visit") s = choose(s, "lesson");
  }
  return s;
}
describe("人物与资质", () => {
  it("three equal budgets affect actions, not breakthrough lottery directly", () => {
    for (const a of Object.values(aptitudes))
      expect(a.root + a.wisdom + a.sense).toBe(15);
    expect(cultivationGain(start("sturdy"))).toBe(14);
    expect(cultivationGain(start("insightful"))).toBe(10);
    expect(go(start("insightful"), 1, "study").study).toBe(2);
    expect(go(start("sturdy"), 1, "study").study).toBe(1);
    expect(go(start("perceptive"), 1, "meditate").sense).toBe(8);
  });
  it("wisdom and trained sense reduce different alchemy costs", () => {
    let s = start();
    expect(refineCost(s)).toEqual({ herbs: 6, stones: 12 });
    s = go(s, 1, "study");
    expect(refineCost(s).herbs).toBe(4);
    s = go(s, 5, "meditate");
    expect(refineCost(s)).toEqual({ herbs: 4, stones: 8 });
    s.herbs = 4;
    const before = s.stones,
      n = act(s, { type: "prepare", kind: "refine" });
    expect(n.herbs).toBe(0);
    expect(n.stones).toBe(before - 8 + 3);
    expect(n.pills).toBe(1);
  });
  it("letter freezes time, exposes motivation, and cannot pay twice", () => {
    let s = go(start(), 9);
    expect(s.pending?.kind).toBe("letter");
    expect(go(s)).toBe(s);
    const instanceId = s.pending!.id;
    s = choose(s, "read");
    expect(s.memories.confided).toBe(true);
    expect(s.study).toBe(1);
    expect(luchiView(s).known).toContain("父亲");
    expect(act(s, { type: "choose", instanceId, option: "read" })).toBe(s);
  });
  it("low wisdom still has a free empathetic alternative", () => {
    const s = go(start("sturdy"), 9);
    expect(
      eventView(s)?.options.find((o) => o.id === "read")?.disabled,
    ).toBeTruthy();
    expect(choose(s, "read")).toBe(s);
    expect(choose(s, "listen").memories.confided).toBe(true);
  });
  it("visit offers mutually exclusive help with caps", () => {
    let s = choose(go(start(), 9), "listen");
    s = go(s, 12);
    expect(s.pending?.kind).toBe("visit");
    const herbs = choose(s, "herbs");
    expect(herbs.herbs).toBe(s.herbs + 4);
    expect(herbs.sense).toBe(s.sense);
    s.injury = 1;
    s.foundation = 23;
    const heal = choose(s, "heal");
    expect(heal.injury).toBe(0);
    expect(heal.foundation).toBe(24);
    s.sense = 12;
    s.study = 4;
    expect(choose(s, "lesson").sense).toBe(12);
    expect(choose(s, "lesson").study).toBe(4);
  });
  it("long preparations defer mid-story scenes without losing them", () => {
    let s = go(start(), 6);
    s = act(s, { type: "prepare", kind: "retreat" });
    expect(s.month).toBe(15);
    expect(s.pending?.kind).toBe("letter");
    s = choose(s, "listen");
    s = go(s, 6);
    s.herbs = 6;
    s = act(s, { type: "prepare", kind: "refine" });
    expect(s.month).toBe(24);
    expect(s.pending?.kind).toBe("visit");
  });
  it.each([
    ["sturdy", "endure", 1],
    ["insightful", "decipher", 0],
    ["perceptive", "sense", 0],
  ] as const)(
    "%s has a distinct prepared crossing",
    (aptitude, option, injury) => {
      let s = start(aptitude);
      if (aptitude === "insightful") s = go(s, 1, "study");
      if (aptitude === "perceptive") s = go(s, 1, "meditate");
      s = choose(until(s, 36), "go");
      s = choose(s, option);
      expect(s.memories.crossing).toBe(option);
      expect(s.injury).toBe(injury);
      expect(s.pending?.kind).toBe("relic");
    },
  );
  it("self branch protects exactly one failure and unlocks a unique inheritance", () => {
    let s = choose(choose(choose(until(start(), 36), "go"), "detour"), "self");
    expect(s.ward).toBe(true);
    s.qi = 360;
    s.seed = 10000;
    s.injury = 6;
    const limit = s.limit;
    s = act(s, { type: "break", pill: false });
    expect(s.realm).toBe(0);
    expect(s.qi).toBe(324);
    expect(s.limit).toBe(limit);
    expect(s.ward).toBe(false);
    s.qi = 360;
    s.seed = 10000;
    s = act(s, { type: "break", pill: false });
    expect(s.qi).toBe(252);
    expect(s.limit).toBe(limit - 12);
    s.qi = 360;
    s.seed = 1;
    s = act(s, { type: "break", pill: false });
    expect(s.unlocked).toContain("ember");
    const next = act(s, {
      type: "next",
      path: "sword",
      inheritance: "ember",
      aptitude: "perceptive",
    });
    expect(next.ward).toBe(true);
    expect(next.root).toBe(4);
    expect(next.sense).toBe(7);
    expect(next.study).toBe(0);
    expect(next.memories.confided).toBe(false);
    expect(replayHints(s).length).toBeGreaterThan(0);
  });
  it("migrates v2 in place with pending decisions and no retroactive gifts", () => {
    let old = v2Game("旧档", "sword", 73);
    old = v2Dispatch(old, {
      id: "a",
      type: "advance",
      activity: "work",
      months: 3,
    });
    old = v2Dispatch(old, {
      id: "b",
      type: "choose",
      instanceId: old.pending!.id,
      option: "aid",
    });
    for (let i = 0; i < 3; i++)
      old = v2Dispatch(old, {
        id: "c" + i,
        type: "advance",
        activity: "work",
        months: 12,
      });
    const copy = structuredClone(old);
    const n = migrateSave(old);
    expect(old).toEqual(copy);
    expect(n.month).toBe(36);
    expect(n.pending).toEqual(old.pending);
    expect(n.stones).toBe(old.stones);
    expect(n.memories).toMatchObject({
      letter: true,
      visit: true,
      confided: false,
      support: "none",
    });
    expect(n.version).toBe(3);
    expect(validState(n)).toBe(true);
    expect(migrateSave(n)).toEqual(n);
    expect(choose(n, "go").pending?.kind).toBe("crossing");
  });
  it("rejects invalid new fields and preserves input on dispatch", () => {
    const s = start(),
      copy = structuredClone(s);
    go(s);
    expect(s).toEqual(copy);
    for (const bad of [
      { ...s, aptitude: "bad" },
      { ...s, root: 99 },
      { ...s, sense: 13 },
      { ...s, study: -1 },
      { ...s, ward: 1 },
      { ...s, memories: null },
    ])
      expect(validState(bad)).toBe(false);
  });
  it("all 3 aptitudes × 2 paths × 3 endings × 10 seeds finish deterministically", () => {
    function play(
      aptitude: Aptitude,
      path: "wood" | "sword",
      ending: string,
      seed: number,
    ) {
      let s = createGame("重放", path, seed, aptitude);
      let i = 0;
      while (s.status === "alive" && i < 400) {
        const c: Intent = s.pending
          ? {
              type: "choose",
              instanceId: s.pending.id,
              option: {
                meeting: "aid",
                letter: "listen",
                visit: "lesson",
                departure: ending === "missed" ? "stay" : "go",
                crossing: "detour",
                relic: ending,
              }[s.pending.kind],
            }
          : s.injury
            ? { type: "advance", activity: "rest", months: 1 }
            : s.qi === 360
              ? { type: "break", pill: s.pills > 0 }
              : {
                  type: "advance",
                  activity: s.realm === 1 ? "work" : "cultivate",
                  months: 12,
                };
        s = dispatch(s, { ...c, id: "play-" + ++i });
        expect(validState(s)).toBe(true);
      }
      expect(s.status).toBe("complete");
      expect(s.story.choice).toBe(ending);
      return s;
    }
    for (const a of Object.keys(aptitudes) as Aptitude[])
      for (const p of ["wood", "sword"] as const)
        for (const ending of ["self", "gift", "missed"])
          for (let seed = 1; seed <= 10; seed++)
            expect(play(a, p, ending, seed)).toEqual(play(a, p, ending, seed));
  });
});
