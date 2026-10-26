import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  eventView,
  breakthroughDetails,
  migrateSave,
  type State,
  type Intent,
  type Path,
} from "../src/core";
import { createGame as oldGame } from "../src/legacy-v1";
let id = 0;
const run = (s: State, c: Intent) => dispatch(s, { ...c, id: String(++id) });
const advance = (
  s: State,
  months = 1,
  activity: "cultivate" | "gather" | "train" | "work" | "rest" = "work",
) => run(s, { type: "advance", activity, months });
const choose = (s: State, option: string) =>
  run(s, { type: "choose", instanceId: s.pending!.id, option });
function meeting(path: Path = "wood") {
  return choose(advance(createGame("测试", path, 1), 3), "aid");
}
function settleMid(s: State) {
  if (s.pending?.kind === "letter") return choose(s, "listen");
  if (s.pending?.kind === "visit") return choose(s, "herbs");
  return s;
}
function relic(path: Path = "wood") {
  let s = meeting(path);
  while (s.month < 36) s = settleMid(advance(s, 12));
  return choose(choose(s, "go"), "detour");
}
describe("筑基篇", () => {
  it("pauses at meeting, rejects stale choices and duplicate commands", () => {
    const s = advance(createGame("甲", "wood"), 12);
    expect(s.month).toBe(3);
    expect(advance(s)).toBe(s);
    expect(run(s, { type: "choose", instanceId: "stale", option: "aid" })).toBe(
      s,
    );
    const command = {
      id: "unique",
      type: "choose" as const,
      instanceId: s.pending!.id,
      option: "aid",
    };
    const next = dispatch(s, command);
    expect(dispatch(next, command)).toBe(next);
    expect(validState(next)).toBe(true);
  });
  it("routes have different access, gains and injury costs", () => {
    const wood = meeting(),
      sword = meeting("sword");
    expect(advance(wood, 1, "train")).toBe(wood);
    expect(advance(sword, 1, "gather")).toBe(sword);
    expect(advance(wood, 1, "cultivate").qi).toBe(10);
    expect(advance(sword, 1, "cultivate").qi).toBe(14);
    const trained = advance(sword, 4, "train");
    expect(trained.mastery).toBe(4);
    expect(trained.injury).toBe(1);
    expect(advance(trained, 1, "rest").injury).toBe(0);
  });
  it("alchemy spends resources and exactly three months", () => {
    let s = advance(meeting(), 3, "gather");
    const n = run(s, { type: "prepare", kind: "refine" });
    expect(n.month).toBe(s.month + 3);
    expect(n.herbs).toBe(0);
    expect(n.stones).toBe(s.stones - 12 + 3);
    expect(n.pills).toBe(1);
    expect(n.crafted).toBe(1);
  });
  it("retreat across appointment misses it, ordinary travel stops for choice", () => {
    let s = meeting();
    while (s.month < 30) s = settleMid(advance(s, Math.min(12, 30 - s.month)));
    const missed = run(s, { type: "prepare", kind: "retreat" });
    expect(missed.story.choice).toBe("missed");
    expect(missed.pending).toBeNull();
    expect(advance(s, 6).pending?.kind).toBe("departure");
  });
  it("exclusive pill allocation and trust affect protection", () => {
    const s = relic();
    const self = choose(s, "self"),
      gift = choose(s, "gift");
    expect(self.pills).toBe(1);
    expect(gift.pills).toBe(0);
    expect(gift.month).toBe(39);
    expect(gift.story.luchi).toBe("foundation");
    expect(
      breakthroughDetails(gift).parts.find((p) => p.label === "陆迟护法")
        ?.value,
    ).toBe(15);
    gift.story.trust = 3;
    expect(
      breakthroughDetails(gift).parts.find((p) => p.label === "陆迟护法")
        ?.value,
    ).toBe(10);
  });
  it("supports prepared crossings and disables unaffordable ones", () => {
    let s = meeting();
    s.month = 36;
    s.pending = { id: "1:36:departure", kind: "departure" };
    s = choose(s, "go");
    expect(
      eventView(s)?.options.find((o) => o.id === "medicine")?.disabled,
    ).toBeTruthy();
    expect(choose(s, "medicine")).toBe(s);
    s.herbs = 4;
    const n = choose(s, "medicine");
    expect(n.herbs).toBe(0);
    expect(n.injury).toBe(0);
  });
  it("full qi does not truncate work batches", () => {
    const s = meeting();
    s.qi = 360;
    expect(advance(s, 3).month).toBe(6);
  });
  it("death precedes rewards, and inheritance does not stack", () => {
    const s = meeting();
    s.limit = s.age + 1;
    s.crafted = 1;
    const dead = advance(s);
    expect(dead.status).toBe("dead");
    expect(dead.stones).toBe(s.stones);
    expect(dead.unlocked).toContain("herbal");
    const next = run(dead, {
      type: "next",
      path: "sword",
      inheritance: "herbal",
    });
    expect(next.herbs).toBe(4);
    expect(next.foundation).toBe(0);
    expect(advance(next, 1, "gather").herbs).toBe(6);
  });
  it("bond unlock gives second-life exclusive options", () => {
    let s = choose(relic(), "gift");
    s.qi = 360;
    s.seed = 1;
    s = run(s, { type: "break", pill: false });
    expect(s.status).toBe("complete");
    expect(s.result).toContain("双星");
    s = run(s, { type: "next", path: "sword", inheritance: "bond" });
    s = advance(s, 3);
    expect(eventView(s)?.options.some((o) => o.id === "remember")).toBe(true);
    s = choose(s, "remember");
    expect(s.story.trust).toBe(3);
    while (s.month < 36) s = settleMid(advance(s, 12));
    s = choose(s, "go");
    expect(choose(s, "memory").injury).toBe(0);
  });
  it("failure consumes a pill and retains 70% qi", () => {
    let s = meeting();
    s.qi = 360;
    s.pills = 1;
    s.seed = 123456;
    s.injury = 6;
    let found = false;
    for (let seed = 10000; seed < 1000000; seed += 10000) {
      s.seed = seed;
      const n = run(s, { type: "break", pill: true });
      if (n.realm === 0) {
        expect(n.qi).toBe(252);
        expect(n.pills).toBe(0);
        expect(n.limit).toBe(s.limit - 12);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
  it("migrates v1 without changing the original, requires explicit start", () => {
    const old = oldGame("旧人", "spirit", 42),
      copy = structuredClone(old);
    const migrated = migrateSave(old);
    expect(old).toEqual(copy);
    expect(migrated.status).toBe("legacy");
    expect(migrated.archive).toEqual(old);
    expect(advance(migrated)).toBe(migrated);
    const fresh = run(migrated, { type: "beginChapter", path: "sword" });
    expect(fresh.age).toBe(192);
    expect(fresh.archive).toEqual(old);
    expect(validState(fresh)).toBe(true);
    expect(() => migrateSave({ version: 99 })).toThrow();
  });
  it("rejects malformed states", () => {
    const s = createGame("甲", "wood");
    for (const bad of [
      { ...s, qi: -1 },
      { ...s, seed: 0 },
      { ...s, archive: {} },
      { ...s, unlocked: ["bond", "bond"] },
      { ...s, status: "complete" },
      { ...s, pending: { id: "bad", kind: "meeting" } },
    ])
      expect(validState(bad)).toBe(false);
  });
  it("replays 120 complete runs deterministically across routes and endings", () => {
    function simulate(path: Path, seed: number, choice: string) {
      let s = createGame("重放", path, seed);
      let step = 0;
      const command = (intent: Intent) => {
        s = dispatch(s, { ...intent, id: String(++step) });
        expect(validState(s)).toBe(true);
      };
      while (s.status === "alive" && step < 400) {
        if (s.pending) {
          const k = s.pending.kind;
          command({
            type: "choose",
            instanceId: s.pending.id,
            option:
              k === "letter"
                ? "listen"
                : k === "visit"
                  ? "herbs"
                  : k === "meeting"
                    ? "aid"
                    : k === "departure"
                      ? choice === "missed"
                        ? "stay"
                        : "go"
                      : k === "crossing"
                        ? "detour"
                        : choice,
          });
        } else if (s.injury)
          command({ type: "advance", activity: "rest", months: 1 });
        else if (s.qi === 360) command({ type: "break", pill: s.pills > 0 });
        else
          command({
            type: "advance",
            activity: s.realm === 1 ? "work" : "cultivate",
            months: 12,
          });
      }
      expect(s.status).toBe("complete");
      expect(s.story.choice).toBe(choice);
      return s;
    }
    for (const path of ["wood", "sword"] as const)
      for (const choice of ["gift", "self", "missed"])
        for (let seed = 1; seed <= 20; seed++)
          expect(simulate(path, seed, choice)).toEqual(
            simulate(path, seed, choice),
          );
  });
});
