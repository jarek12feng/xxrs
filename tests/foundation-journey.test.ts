import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  eventView,
  preparationError,
  breakthroughError,
  hasFoundationRecipe,
  type State,
  type Intent,
} from "../src/core";
import { foundationStep } from "../tools/foundation-playthrough";
import { luchiView } from "../src/characters";
const send = (s: State, c: Intent, id = `test-${s.seen.length}`) =>
  dispatch(s, { ...c, id });
function crossing() {
  const s = createGame("试炼", "sword", 42);
  s.month = 36;
  s.age += 36;
  s.story.stage = "crossing";
  s.story.luchi = "companion";
  s.pending = { id: "1:36:crossing", kind: "crossing" };
  return s;
}
const choose = (s: State, option: string) =>
  send(s, { type: "choose", instanceId: s.pending!.id, option });

it("requires a pill for every attempt and gates new recipes behind the relic", () => {
  const s = createGame("叩关", "wood", 1);
  s.qi = 360;
  s.herbs = 100;
  s.stones = 100;
  const snapshot = structuredClone(s);
  expect(preparationError(s, "refine")).toContain("遗府");
  expect(send(s, { type: "prepare", kind: "refine" })).toBe(s);
  expect(send(s, { type: "break", pill: true })).toBe(s);
  expect(send(s, { type: "break", pill: false })).toBe(s);
  expect(s).toEqual(snapshot);
  s.pills = 1; // Existing old-save item remains usable.
  expect(breakthroughError(s)).toBe("");
  expect(send(s, { type: "break", pill: false })).toBe(s);
  expect(send(s, { type: "break", pill: true }).pills).toBe(0);
});

it("requires qi AND a crossing solution, and removes the free bypass", () => {
  const s = crossing();
  s.qi = 179;
  s.mastery = 4;
  expect(choose(s, "blade")).toBe(s);
  expect(choose(s, "detour")).toBe(s);
  expect(
    eventView(s)!
      .options.filter((o) => o.id !== "withdraw")
      .every((o) => o.disabled),
  ).toBe(true);
  s.qi = 180;
  s.mastery = 3;
  expect(choose(s, "blade")).toBe(s);
  s.mastery = 4;
  const passed = choose(s, "blade");
  expect(passed.pending?.kind).toBe("relic");
  expect(passed.injury).toBe(1);
  expect(passed.pills).toBe(0); // Allocation is still a separate, visible choice.
});

it("withdrawal permits preparation without repeated appointment popups, then solo recovery", () => {
  const s = crossing();
  const exit = choose(s, "withdraw");
  expect(exit.month).toBe(s.month);
  expect(exit.seed).toBe(s.seed);
  expect(exit.pending).toBeNull();
  expect(exit.story.luchi).toBe("distant");
  expect(exit.pills).toBe(0);
  const prepared = send(exit, {
    type: "advance",
    activity: "cultivate",
    months: 12,
  });
  expect(prepared.month).toBe(exit.month + 12);
  expect(prepared.pending).toBeNull();
  prepared.qi = 180;
  prepared.herbs = 4;
  const retry = send(prepared, { type: "revisitRelic" });
  expect(validState(retry)).toBe(true);
  expect(luchiView(retry).scene).toBeNull();
  const relic = choose(retry, "medicine");
  expect(eventView(relic)!.options.map((o) => o.id)).toEqual(["self"]);
  expect(choose(relic, "gift")).toBe(relic);
  const won = choose(relic, "self");
  expect(won.pills).toBe(1);
  expect(hasFoundationRecipe(won)).toBe(true);
  expect(won.story.luchi).toBe("distant");
  expect(won.story.trust).toBe(s.story.trust);
  expect(send(won, { type: "revisitRelic" })).toBe(won);
  expect(validState(won)).toBe(true);
  expect(migrateSave(won)).toEqual(won);
});

it.each(["wood", "sword"] as const)(
  "gift preserves a reachable recipe for %s",
  (path) => {
    let s = crossing();
    s.path = path;
    s.qi = 360;
    s.herbs = 10;
    s = choose(choose(s, "medicine"), "gift");
    expect(s.pills).toBe(0);
    expect(s.story.luchi).toBe("foundation");
    expect(hasFoundationRecipe(s)).toBe(true);
    expect(preparationError(s, "refine")).toBe("");
    const brewed = send(s, { type: "prepare", kind: "refine" });
    expect(brewed.pills).toBe(1);
    expect(brewed.month).toBe(s.month + 3);
    expect(brewed.herbs).toBe(s.herbs - 6);
    expect(validState(brewed)).toBe(true);
  },
);

it("failure consumes one pill, retains the recipe and prevents duplicate settlement", () => {
  let s = crossing();
  s.qi = 360;
  s.herbs = 4;
  s = choose(choose(s, "medicine"), "self");
  s.seed = 10000;
  s.injury = 6;
  const c = { id: "failed-attempt", type: "break", pill: true } as const;
  const n = dispatch(s, c);
  expect(n.realm).toBe(0);
  expect(n.pills).toBe(0);
  expect(n.qi).toBe(324);
  expect(n.limit).toBe(s.limit);
  expect(hasFoundationRecipe(n)).toBe(true);
  expect(dispatch(n, c)).toBe(n);
  expect(send(n, { type: "break", pill: true })).toBe(n);
  expect(dispatch(s, c)).toEqual(n);
  n.herbs = 6;
  expect(send(n, { type: "prepare", kind: "refine" }).pills).toBe(1);
});

it("retains old crafted recipes without adding save fields, and freezes terminal/pending states", () => {
  const s = createGame("旧档", "sword");
  s.crafted = 2;
  s.story.stage = "resolved";
  s.story.choice = "missed";
  s.story.luchi = "distant";
  s.herbs = 6;
  expect(validState(s)).toBe(true);
  expect(migrateSave(s)).toEqual(s);
  expect(preparationError(s, "refine")).toBe("");
  expect(send(s, { type: "prepare", kind: "refine" }).pills).toBe(1);
  for (const blocked of [
    crossing(),
    { ...s, status: "dead" as const },
    { ...s, status: "complete" as const },
  ]) {
    expect(send(blocked, { type: "revisitRelic" })).toBe(blocked);
    expect(send(blocked, { type: "prepare", kind: "refine" })).toBe(blocked);
    expect(send(blocked, { type: "break", pill: true })).toBe(blocked);
  }
});

it("replays both routes through earning the recipe before any fresh-life breakthrough", () => {
  for (const path of ["wood", "sword"] as const)
    for (const seed of [1, 42, 9087]) {
      function play() {
        let s = createGame("证道", path, seed);
        for (let i = 0; !s.realm && i < 200; i++) {
          const c = foundationStep(s, true);
          if (c.type === "break") {
            expect(hasFoundationRecipe(s)).toBe(true);
            expect(s.crafted).toBeGreaterThan(0);
            expect(s.pills).toBeGreaterThan(0);
          }
          s = dispatch(s, { ...c, id: `journey-${i}` });
          expect(validState(s)).toBe(true);
        }
        expect(s.realm).toBe(1);
        return s;
      }
      expect(play()).toEqual(play());
    }
});
