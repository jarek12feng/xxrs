import { describe, expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  explorationError,
  techniques,
  challengeDetails,
  aidError,
  type State,
  type Intent,
  type Path,
  type Aptitude,
} from "../src/core";
import { createGame as v3Game } from "../src/chapter";

let sequence = 0;
function act(s: State, c: Intent): State {
  const before = structuredClone(s);
  const n = dispatch(s, { ...c, id: `test-${++sequence}` });
  expect(s).toEqual(before);
  expect(validState(n)).toBe(true);
  return n;
}
const advance = (
  s: State,
  activity:
    | "work"
    | "study"
    | "rest"
    | "cultivate"
    | "meditate"
    | "gather"
    | "train" = "work",
  months = 1,
) => act(s, { type: "advance", activity, months });
const choose = (s: State, option: string) =>
  act(s, { type: "choose", instanceId: s.pending!.id, option });
function met() {
  return choose(advance(createGame("访客", "wood", 1), "work", 3), "promise");
}
function settled() {
  const s = met();
  s.realm = 1;
  s.story.stage = "resolved";
  s.story.choice = "gift";
  s.story.luchi = "foundation";
  s.journey.settled = true;
  s.legacy = 6;
  s.earned = 6;
  s.unlocked = ["bond"];
  return s;
}

describe("v4 world progression", () => {
  it("does not award the old chapter again on post-foundation retreats", () => {
    let s = settled();
    s.stones = 100;
    for (let i = 0; i < 4; i++)
      s = act(s, { type: "prepare", kind: "retreat" });
    expect(s.legacy).toBe(6);
    expect(s.earned).toBe(6);
    expect(s.status).toBe("alive");
    expect(s.foundation).toBe(24);
    s.crafted = 1;
    s = act(s, { type: "retire" });
    expect(s.unlocked).toContain("herbal");
  });
  it.each(["dan", "jian"] as const)(
    "earns %s promotion through experience and a mentor conversation",
    (branch) => {
      let s = act(met(), { type: "join", branch });
      expect(
        act(s, { type: "join", branch: branch === "dan" ? "jian" : "dan" }),
      ).toBe(s);
      expect(act(s, { type: "promote" })).toBe(s);
      for (let i = 0; i < 3; i++) s = act(s, { type: "duty", duty: "copy" });
      expect(act(s, { type: "promote" })).toBe(s);
      s = act(s, { type: "mentor", answer: "care" });
      expect(act(s, { type: "mentor", answer: "seek" })).toBe(s);
      s = act(s, { type: "promote" });
      expect(s.journey.rank).toBe(1);
      expect(s.journey.contribution).toBe(0);
      expect(s.journey.known).toContain(branch === "dan" ? "spring" : "blade");
      expect(act(s, { type: "promote" })).toBe(s);
    },
  );
  it("freezes all new gameplay while an event is pending", () => {
    const s = advance(createGame("客", "wood"), "work", 3);
    const commands: Intent[] = [
      { type: "join", branch: "dan" },
      { type: "explore", place: "valley" },
      { type: "duty", duty: "watch" },
      { type: "learn", technique: "spring" },
      { type: "enqueue", action: "work", repeat: 1 },
      { type: "retire" },
    ];
    for (const c of commands) expect(act(s, c)).toBe(s);
  });
  it("supports an independent route and exclusive rescue/tracing outcomes", () => {
    for (const approach of ["rescue", "trace"] as const) {
      let s = settled();
      s.herbs = 2;
      s.sense = 8;
      s.study = 2;
      expect(explorationError(s, "peak")).toContain("回春谷");
      s = act(s, { type: "explore", place: "valley" });
      expect(act(s, { type: "explore", place: "valley" })).toBe(s);
      s = act(s, { type: "explore", place: "valley", approach });
      expect(s.journey.approach).toBe(approach);
      expect(s.herbs).toBe(approach === "rescue" ? 0 : 2);
      s = act(s, { type: "explore", place: "valley" });
      s.sense = 12;
      s.study = 4;
      s.foundation = 24;
      s.stones = 200;
      s.journey.known = ["spring", "guard"];
      s.journey.main = "spring";
      s.journey.support = "guard";
      s.journey.relics = { vial: 2, sword: 2 };
      for (const place of ["peak", "sea"] as const) {
        s = act(s, { type: "explore", place });
        s = act(s, {
          type: "equipRelic",
          relic:
            s.journey.encounters[place]!.kind === "guardian" ? "vial" : "sword",
        });
        expect(challengeDetails(s, place)!.chance).toBe(100);
        s = act(s, { type: "challenge", place, mode: "fight" });
        s = act(s, { type: "explore", place });
      }
      expect(s.journey.maps).toEqual({ valley: 3, peak: 3, sea: 3 });
      expect(s.journey.branch).toBe("none");
      expect(s.journey.known).toContain("lantern");
      expect(s.log.some((l) => l.text.includes("亲笔信"))).toBe(true);
      expect(act(s, { type: "explore", place: "sea" })).toBe(s);
    }
  });
  it("requires actual realm and route preparation, not only a map click", () => {
    let s = met();
    s = act(s, { type: "explore", place: "valley" });
    s = act(s, { type: "explore", place: "valley", approach: "trace" });
    s = act(s, { type: "explore", place: "valley" });
    expect(explorationError(s, "peak")).toContain("筑基");
    s.realm = 1;
    s.story.stage = "resolved";
    s.story.choice = "missed";
    expect(explorationError(s, "peak")).toContain("神识");
  });
  it("learns and equips at most one technique per slot with concrete action effects", () => {
    let s = met();
    s.stones = 200;
    s.study = 2;
    for (const technique of Object.keys(
      techniques,
    ) as (keyof typeof techniques)[])
      s = act(s, { type: "learn", technique });
    const paid = s.stones;
    expect(act(s, { type: "learn", technique: "spring" })).toBe(s);
    expect(s.stones).toBe(paid);
    s = act(s, { type: "equip", technique: "spring" });
    const qi = s.qi;
    s = advance(s, "cultivate");
    expect(s.qi - qi).toBe(13);
    s = act(s, { type: "equip", technique: "herb" });
    const herbs = s.herbs;
    s = advance(s, "gather");
    expect(s.herbs - herbs).toBe(3);
    s = act(s, { type: "equip", technique: "breath" });
    expect(s.journey.main).toBe("breath");
    const before = s.qi;
    s = advance(s);
    expect(s.qi - before).toBe(4);
    s.path = "sword";
    s.mastery = 3;
    s = act(s, { type: "equip", technique: "blade" });
    s = act(s, { type: "equip", technique: "guard" });
    const previous = s.qi;
    s = advance(s, "train");
    expect(s.qi - previous).toBe(14);
    expect(s.injury).toBe(0);
    s = act(s, { type: "equip", technique: "lantern" });
    s = advance(s, "meditate");
    expect(s.study).toBe(3);
  });
  it("stops batched actions at events and exactly applies per-month equipped bonuses", () => {
    let s = createGame("批次", "wood");
    s.journey.known = ["spring"];
    s.journey.main = "spring";
    s = advance(s, "cultivate", 12);
    expect(s.month).toBe(3);
    expect(s.qi).toBe(39);
    expect(s.pending?.kind).toBe("meeting");
    s = choose(s, "promise");
    s.qi = 350;
    s = advance(s, "cultivate", 12);
    expect(s.month).toBe(4);
    expect(s.qi).toBe(360);
  });
  it("prioritizes death over duty and exploration rewards", () => {
    for (const type of ["duty", "explore"] as const) {
      let s = act(met(), { type: "join", branch: "dan" });
      s.age = s.limit - 1;
      s = act(
        s,
        type === "duty" ? { type, duty: "watch" } : { type, place: "valley" },
      );
      expect(s.status).toBe("dead");
      expect(s.journey.duties).toBe(0);
      expect(s.journey.maps.valley).toBe(0);
      expect(s.journey.contribution).toBe(0);
    }
  });
  it("retirement, continuation and later death never double legacy; next life resets world", () => {
    let s = settled();
    s = act(s, { type: "retire" });
    expect(s.status).toBe("complete");
    s = act(s, { type: "continue" });
    expect(s.status).toBe("alive");
    expect(s.legacy).toBe(6);
    s.age = s.limit - 1;
    s = advance(s);
    expect(s.status).toBe("dead");
    expect(s.legacy).toBe(6);
    s = act(s, { type: "next", path: "sword", inheritance: "bond" });
    expect(s.journey).toEqual(createGame("新", "sword").journey);
    expect(s.life).toBe(2);
    expect(s.legacy).toBe(6);
  });
  it("migrates completed v3 saves without changing RNG, resources or original object", () => {
    const old = v3Game("旧卷", "sword", 91);
    old.status = "complete";
    old.realm = 1;
    old.story.stage = "resolved";
    old.story.choice = "missed";
    old.earned = 5;
    old.legacy = 5;
    const before = structuredClone(old),
      s = migrateSave(old);
    expect(old).toEqual(before);
    expect(s.version).toBe(9);
    expect(s.seed).toBe(91);
    expect(s.status).toBe("complete");
    expect(act(s, { type: "continue" }).legacy).toBe(5);
  });
  it("rejects corrupt v4 without silently stripping its world data", () => {
    const s = met();
    for (const patch of [
      { maps: { valley: 0, peak: 3, sea: 0 } },
      { known: ["bogus"] },
      { queue: [{ action: "break", remaining: 1 }] },
      { settled: true },
      { rank: 1 },
    ]) {
      const bad = { ...s, journey: { ...s.journey, ...patch } };
      expect(validState(bad)).toBe(false);
      expect(() => migrateSave(bad)).toThrow();
    }
  });
});

describe("online queue", () => {
  it("persists remaining work, stops at a pending event and refuses duplicate ticks", () => {
    let s = act(createGame("队列", "wood"), {
      type: "enqueue",
      action: "gather",
      repeat: 6,
    });
    for (let i = 0; i < 3; i++) s = act(s, { type: "queueTick" });
    expect(s.month).toBe(3);
    expect(s.journey.queue[0].remaining).toBe(3);
    expect(act(s, { type: "queueTick" })).toBe(s);
    s = choose(s, "promise");
    s = migrateSave(s);
    const c = { type: "queueTick", id: "one-tick" } as const;
    const n = dispatch(s, c);
    expect(dispatch(n, c)).toBe(n);
    expect(n.journey.queue[0].remaining).toBe(2);
  });
  it("does not consume missing materials or skip a blocked job", () => {
    let s = act(met(), { type: "enqueue", action: "refine", repeat: 1 });
    s = act(s, { type: "enqueue", action: "work", repeat: 1 });
    expect(act(s, { type: "queueTick" })).toBe(s);
    expect(s.month).toBe(3);
    s.herbs = 6;
    s.stones = 20;
    s = act(s, { type: "queueTick" });
    expect(s.pills).toBe(1);
    expect(s.month).toBe(6);
    expect(s.journey.queue[0].action).toBe("work");
  });
  it("finishes healing early and leaves the next job untouched at full qi", () => {
    let s = met();
    s.injury = 1;
    s = act(s, { type: "enqueue", action: "rest", repeat: 12 });
    s = act(s, { type: "enqueue", action: "cultivate", repeat: 12 });
    s = act(s, { type: "queueTick" });
    expect(s.injury).toBe(0);
    expect(s.journey.queue[0].action).toBe("cultivate");
    s.qi = 355;
    s = act(s, { type: "queueTick" });
    expect(s.qi).toBe(360);
    expect(s.journey.queue).toHaveLength(0);
    expect(s.realm).toBe(0);
  });
});

describe("encounters and preparation", () => {
  function encounter(seed = 12345) {
    let s = settled();
    s.sense = 8;
    s.study = 2;
    s.stones = 200;
    s.herbs = 20;
    for (let i = 0; i < 3; i++)
      s = act(s, { type: "explore", place: "valley", approach: "trace" });
    s.seed = seed;
    return act(s, { type: "explore", place: "peak" });
  }
  it("rolls named opponents from the stored seed and does not reroll on reload", () => {
    const a = encounter(1),
      b = encounter(12345);
    expect(a.journey.encounters.peak!.kind).toBe("guardian");
    expect(b.journey.encounters.peak!.kind).toBe("raider");
    expect(migrateSave(a)).toEqual(a);
    expect(act(a, { type: "explore", place: "peak" })).toBe(a);
  });
  it("can fail, preserves the obstacle, and improves with a relevant spirit tool and help", () => {
    let s = encounter();
    s.seed = 12345;
    s.story.trust = 4;
    const before = challengeDetails(s, "peak")!.chance;
    s = act(s, { type: "challenge", place: "peak", mode: "fight" });
    expect(s.journey.encounters.peak!.outcome).toBe("loss");
    expect(s.journey.maps.peak).toBe(1);
    expect(s.injury).toBe(1);
    s = advance(s, "rest");
    s = act(s, { type: "forge", relic: "sword" });
    s = act(s, { type: "equipRelic", relic: "sword" });
    expect(challengeDetails(s, "peak")!.chance).toBe(before + 18);
    s = act(s, { type: "aid", place: "peak", helper: "luchi" });
    expect(challengeDetails(s, "peak")!.chance).toBe(before + 38);
    expect(aidError(s, "peak", "mentor")).toContain("已有");
    s = act(s, { type: "forge", relic: "sword" });
    s.sense = 12;
    s.study = 4;
    s.foundation = 24;
    expect(challengeDetails(s, "peak")!.chance).toBe(100);
    s = act(s, { type: "challenge", place: "peak", mode: "fight" });
    expect(s.journey.maps.peak).toBe(2);
    expect(act(s, { type: "challenge", place: "peak", mode: "fight" })).toBe(s);
  });
  it("lets a prepared cultivator negotiate with a guardian, but not with a raider", () => {
    let s = encounter(1),
      seed = s.seed,
      herbs = s.herbs;
    s = act(s, { type: "challenge", place: "peak", mode: "parley" });
    expect(s.journey.encounters.peak!.outcome).toBe("peace");
    expect(s.herbs).toBe(herbs - 6);
    expect(s.seed).toBe(seed);
    const evil = encounter(12345);
    expect(
      act(evil, { type: "challenge", place: "peak", mode: "parley" }),
    ).toBe(evil);
  });
  it("rejects unaffordable preparation, limits upgrades, and keeps gear across reload but not reincarnation", () => {
    let s = encounter();
    s.stones = 0;
    expect(act(s, { type: "forge", relic: "vial" })).toBe(s);
    expect(act(s, { type: "challenge", place: "peak", mode: "fight" })).toBe(s);
    s.stones = 100;
    s = act(s, { type: "forge", relic: "vial" });
    s = act(s, { type: "forge", relic: "vial" });
    expect(act(s, { type: "forge", relic: "vial" })).toBe(s);
    s = act(s, { type: "equipRelic", relic: "vial" });
    expect(challengeDetails(s, "peak")!.damage).toBe(0);
    expect(migrateSave(s).journey.relics.vial).toBe(2);
    s = act(s, { type: "retire" });
    s = act(s, { type: "next", path: "sword", inheritance: "none" });
    expect(s.journey.relics.vial).toBe(0);
  });
  it("death takes priority over the battle roll and loot", () => {
    let s = encounter();
    s.age = s.limit - 1;
    const seed = s.seed;
    s = act(s, { type: "challenge", place: "peak", mode: "fight" });
    expect(s.status).toBe("dead");
    expect(s.seed).toBe(seed);
    expect(s.journey.encounters.peak!.attempts).toBe(0);
  });
});

it("replays 60 whole lives through new exploration and intentional reincarnation", () => {
  function play(
    seed: number,
    path: Path,
    aptitude: Aptitude,
    branch: "none" | "dan" | "jian",
  ) {
    let s = createGame("行者", path, seed, aptitude),
      serial = 0;
    const send = (c: Intent) => {
      s = dispatch(s, { ...c, id: `replay-${serial++}` });
      expect(validState(s)).toBe(true);
    };
    for (
      let guard = 0;
      !s.journey.settled && s.status === "alive" && guard < 400;
      guard++
    ) {
      if (s.pending) {
        const choices = {
          meeting: "promise",
          letter: "listen",
          visit: "herbs",
          departure: "go",
          crossing: "detour",
          relic: seed % 2 ? "gift" : "self",
        };
        send({
          type: "choose",
          instanceId: s.pending.id,
          option: choices[s.pending.kind],
        });
      } else if (s.injury > 0)
        send({ type: "advance", activity: "rest", months: 12 });
      else if (s.qi >= 360) send({ type: "break", pill: s.pills > 0 });
      else
        send({
          type: "advance",
          activity: s.realm === 1 ? "work" : "cultivate",
          months: 12,
        });
    }
    expect(s.status).toBe("alive");
    expect(s.journey.settled).toBe(true);
    while (s.injury) send({ type: "advance", activity: "rest", months: 12 });
    if (branch !== "none") {
      send({ type: "join", branch });
      for (let i = 0; i < 3; i++) send({ type: "duty", duty: "copy" });
      send({ type: "mentor", answer: "seek" });
      send({ type: "promote" });
    } else {
      while (s.sense < 8)
        send({ type: "advance", activity: "meditate", months: 1 });
      while (s.study < 2)
        send({ type: "advance", activity: "study", months: 1 });
    }
    // Actual preparation commands, not edited stats: independent and sect routes both work.
    while (s.sense < 12)
      send({ type: "advance", activity: "meditate", months: 1 });
    while (s.study < 4) send({ type: "advance", activity: "study", months: 1 });
    while (s.stones < 180)
      send({ type: "advance", activity: "work", months: 12 });
    while (s.foundation < 24) send({ type: "prepare", kind: "retreat" });
    for (const technique of ["spring", "guard"] as const) {
      send({ type: "learn", technique });
      send({ type: "equip", technique });
    }
    for (const relic of ["vial", "sword"] as const)
      for (let i = 0; i < 2; i++) {
        if (s.stones < 32)
          send({ type: "advance", activity: "work", months: 12 });
        if (s.herbs < 4) send({ type: "supplies" });
        send({ type: "forge", relic });
      }
    for (let i = 0; i < 3; i++)
      send({ type: "explore", place: "valley", approach: "trace" });
    for (const place of ["peak", "sea"] as const) {
      send({ type: "explore", place });
      send({
        type: "equipRelic",
        relic:
          s.journey.encounters[place]!.kind === "guardian" ? "vial" : "sword",
      });
      expect(challengeDetails(s, place)!.chance).toBe(100);
      if (s.stones < 4) send({ type: "advance", activity: "work", months: 1 });
      send({ type: "challenge", place, mode: "fight" });
      send({ type: "explore", place });
    }
    expect(s.journey.maps.sea).toBe(3);
    send({ type: "retire" });
    expect(s.status).toBe("complete");
    send({ type: "next", path, aptitude, inheritance: "none" });
    expect(s.life).toBe(2);
    expect(s.journey.maps.sea).toBe(0);
    return s;
  }
  for (const path of ["wood", "sword"] as const)
    for (const branch of ["none", "dan", "jian"] as const)
      for (let seed = 1; seed <= 10; seed++) {
        const aptitude = (["sturdy", "insightful", "perceptive"] as const)[
          seed % 3
        ];
        expect(play(seed, path, aptitude, branch)).toEqual(
          play(seed, path, aptitude, branch),
        );
      }
});
