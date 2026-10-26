import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  type State,
  type AdventureAction,
} from "../src/core";
let sequence = 0;
function act(s: State, action: AdventureAction) {
  const before = structuredClone(s);
  const n = dispatch(s, {
    id: `story-${++sequence}`,
    type: "adventure",
    action,
  });
  expect(s).toEqual(before);
  expect(validState(n)).toBe(true);
  return n;
}
function ready(method: "medicine" | "guide" | "ward") {
  let s = createGame("旅人", "wood");
  for (const action of [
    "inspect",
    "depart",
    method,
    "prepare",
    "depart",
    "trail",
  ] as AdventureAction[])
    s = act(s, action);
  return s;
}
it.each(["medicine", "guide", "ward"] as const)(
  "completes %s rescue with distinct outcome, one reward and no monthly grind",
  (method) => {
    let s = ready(method);
    const money = s.stones;
    s = act(s, "challenge");
    expect(s.adventure.step).toBe("home");
    expect(s.adventure.result).toContain(
      { medicine: "妖修", guide: "陆迟", ward: "呼吸" }[method],
    );
    s = act(s, "return");
    expect(s.stones).toBe(money + 12);
    expect(s.month).toBe(0);
    if (method === "medicine") expect(s.study).toBe(1);
    if (method === "guide") expect(s.sense).toBe(4);
    if (method === "ward") expect(s.foundation).toBe(2);
    expect(s.story).toEqual(createGame("旅人", "wood").story);
    expect(act(s, "return")).toBe(s);
  },
);
it("requires a clue, permits failure, and supports informed recovery", () => {
  let s = createGame("客", "wood");
  expect(act(s, "depart")).toBe(s);
  s = act(s, "inspect");
  s = act(s, "depart");
  s = act(s, "depart");
  s = act(s, "trail");
  s = act(s, "challenge");
  expect(s.adventure.step).toBe("shrine");
  expect(s.adventure.attempts).toBe(1);
  expect(s.adventure.clue).toBe(true);
  s = act(s, "retreat");
  s = act(s, "guide");
  s = act(s, "rush");
  expect(s.adventure.ready).toBe(false);
  s = act(s, "prepare");
  s = act(s, "depart");
  s = act(s, "trail");
  s = act(s, "challenge");
  expect(s.adventure.step).toBe("home");
});
it("wrong route disrupts preparation but never erases the clue", () => {
  let s = ready("ward");
  s = act(s, "retreat");
  s = act(s, "depart");
  s = act(s, "shortcut");
  expect(s.adventure.ready).toBe(false);
  expect(s.adventure.clue).toBe(true);
  expect(act(s, "challenge").adventure.step).toBe("shrine");
});
it("preserves scene through saves and ordinary actions; honors pending events and command ids", () => {
  const s = ready("medicine");
  expect(migrateSave(s)).toEqual(s);
  const command = {
    id: "one-rescue",
    type: "adventure",
    action: "challenge",
  } as const;
  const n = dispatch(s, command);
  expect(dispatch(n, command)).toBe(n);
  const advanced = dispatch(s, {
    id: "one-month",
    type: "advance",
    activity: "work",
    months: 1,
  });
  expect(advanced.adventure).toEqual(s.adventure);
  const pending = dispatch(createGame("客", "wood"), {
    id: "meeting",
    type: "advance",
    activity: "work",
    months: 3,
  });
  expect(act(pending, "inspect")).toBe(pending);
});
it("migrates v5 without rewriting progress or forcing the new adventure", () => {
  const current = ready("guide");
  const { adventure: _, ...old } = current;
  const raw = { ...old, version: 5 };
  const s = migrateSave(raw);
  expect(s.adventure.step).toBe("invitation");
  expect(s.story).toEqual(current.story);
  expect(s.social).toEqual(current.social);
  expect(s.stones).toBe(current.stones);
  expect(act(s, "enter").adventure.step).toBe("ferry");
  expect(() => migrateSave({ ...raw, qi: -10 })).toThrow();
});
