import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  type State,
} from "../src/core";
import { adventureOptions, type AdventureAction } from "../src/adventure";
import { openingScene } from "../src/scene2d/opening";
const send = (s: State, action: AdventureAction) =>
  dispatch(s, { type: "adventure", action, id: `scene-${s.seen.length}` });
it.each(["medicine", "guide", "ward"] as const)(
  "scene objects expose every legal action through %s rescue without advancing time",
  (method) => {
    let s = createGame("问路", "wood", 42);
    for (const action of [
      "inspect",
      "depart",
      method,
      "prepare",
      "depart",
      "trail",
      "challenge",
      "return",
    ] as const) {
      const snapshot = structuredClone(s);
      const scene = openingScene(s.adventure);
      if(s.adventure.step === "shrine") expect(scene.calm).toBe(false);
      expect(
        scene.objects.flatMap((o) => o.options.map((x) => x.action)),
      ).toContain(action);
      expect(
        new Set(scene.objects.flatMap((o) => o.options.map((x) => x.action))),
      ).toEqual(new Set(adventureOptions(s.adventure).map((o) => o.action)));
      expect(s).toEqual(snapshot);
      s = send(s, action);
      expect(s.month).toBe(0);
      expect(s.seed).toBe(42);
      expect(validState(s)).toBe(true);
      expect(migrateSave(s)).toEqual(s);
    }
    expect(s.adventure.step).toBe("done");
  },
);
it("scene reflects persisted rescue, and failed rescue retains the retreat", () => {
  let s = createGame("试险", "wood", 42);
  for (const a of [
    "inspect",
    "depart",
    "depart",
    "trail",
    "challenge",
  ] as const)
    s = send(s, a);
  expect(openingScene(s.adventure).calm).toBe(false);
  expect(
    openingScene(s.adventure).objects.flatMap((o) =>
      o.options.map((x) => x.action),
    ),
  ).toContain("retreat");
  for (const a of [
    "retreat",
    "ward",
    "prepare",
    "depart",
    "trail",
    "challenge",
  ] as const)
    s = send(s, a);
  expect(openingScene(s.adventure).key).toBe("shrine");
  expect(openingScene(s.adventure).calm).toBe(true);
  expect(
    openingScene(s.adventure).objects.find((o) => o.id === "gate")!.name,
  ).toContain("已稳住");
});
it("explicit learn-and-equip settles once and survives reload without changing time or RNG", () => {
  let s = createGame("试功", "wood", 42);
  for (const a of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as const)
    s = send(s, a);
  const cmd = {
    type: "learning" as const,
    choice: "blade" as const,
    equip: true,
    id: "gift",
  };
  const n = dispatch(s, cmd);
  expect(n.journey.main).toBe("blade");
  expect(n.journey.known).toEqual(["blade"]);
  expect(n.month).toBe(s.month);
  expect(n.seed).toBe(s.seed);
  expect(validState(n)).toBe(true);
  expect(dispatch(migrateSave(s), cmd)).toEqual(n);
  expect(dispatch(n, { ...cmd, id: "repeat" })).toBe(n);
  expect(dispatch({ ...s, status: "dead" }, cmd).journey.main).toBeNull();
});
