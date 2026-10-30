import * as world from "../src/core";
import { foundationStep } from "../tools/foundation-playthrough";
import { describe, it, expect } from "vitest";
// Aptitude/story rules; complete runs use the current public world commands.
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
} from "../src/chapter";
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
    s.crafted = 1; // Preserve an already learned recipe in a legacy save.
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
    s.crafted = 1;
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
      s.qi = 180;
      s = choose(s, option);
      expect(s.memories.crossing).toBe(option);
      expect(s.injury).toBe(injury);
      expect(s.pending?.kind).toBe("relic");
    },
  );
  it("self branch protects exactly one failure without a cross-character reward", () => {
    let s = until(start(), 36);
    s.qi = 180;
    s.study = 2;
    s = choose(choose(choose(s, "go"), "decipher"), "self");
    expect(s.ward).toBe(true);
    s.qi = 360;
    s.seed = 10000;
    s.injury = 6;
    const limit = s.limit;
    s.pills = 1; // Isolate repeated failure protection from material acquisition.
    s = act(s, { type: "break", pill: true });
    expect(s.realm).toBe(0);
    expect(s.qi).toBe(324);
    expect(s.limit).toBe(limit);
    expect(s.ward).toBe(false);
    s.qi = 360;
    s.seed = 10000;
    s.pills = 1; // Isolate repeated failure protection from material acquisition.
    s = act(s, { type: "break", pill: true });
    expect(s.qi).toBe(252);
    expect(s.limit).toBe(limit - 12);
    s.qi = 360;
    s.seed = 1;
    s.pills = 1; // Isolate repeated failure protection from material acquisition.
    s = act(s, { type: "break", pill: true });
    expect(s.unlocked).toEqual([]);
    const next = act(s, {
      type: "next",
      path: "sword",
      inheritance: "none",
      aptitude: "perceptive",
    });
    expect(next.ward).toBe(false);
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
      let s = world.createGame("重放", path, seed, aptitude);
      let i = 0;
      while (!s.journey.settled && s.status === "alive" && i < 400) {
        let c = foundationStep(s, ending === "gift");
        if (ending === "missed" && s.pending?.kind === "departure")
          c = { type: "choose", instanceId: s.pending.id, option: "stay" };
        s = world.dispatch(s, { ...c, id: "play-" + ++i });
        expect(world.validState(s)).toBe(true);
      }
      expect(s.journey.settled).toBe(true);
      expect(s.story.choice).toBe(ending === "missed" ? "self" : ending);
      if (ending === "missed") expect(s.story.luchi).toBe("distant");
      return s;
    }
    for (const a of Object.keys(aptitudes) as Aptitude[])
      for (const p of ["wood", "sword"] as const)
        for (const ending of ["self", "gift", "missed"])
          for (let seed = 1; seed <= 10; seed++)
            expect(play(a, p, ending, seed)).toEqual(play(a, p, ending, seed));
  });
});
