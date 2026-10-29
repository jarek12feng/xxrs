import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  mistError,
  type AdventureAction,
  type State,
} from "../src/core";
import { actionReceipt } from "../src/action-feedback";
import { openingGuide } from "../src/opening-guide";
import { mistCheckpoint } from "../tools/mist-checkpoint";
export function rescue(
  seed = 42,
  method: "medicine" | "guide" | "ward" = "medicine",
) {
  let s = createGame("归途", "sword", seed);
  for (const [i, action] of (
    [
      "inspect",
      "depart",
      method,
      "prepare",
      "depart",
      "trail",
      "challenge",
    ] as AdventureAction[]
  ).entries()) {
    const before = structuredClone(s);
    const next = dispatch(s, { id: `opening-${i}`, type: "adventure", action });
    expect(s).toEqual(before);
    expect(validState(next)).toBe(true);
    s = next;
  }
  return s;
}
it.each(["medicine", "guide", "ward"] as const)(
  "preserves %s rescue, records either irreversible choice, and never rewards twice",
  (method) => {
    for (const seed of [1, 42, 9087]) {
      const before = rescue(seed, method);
      for (const action of ["return", "takeHerbs"] as const) {
        const command = { id: "decision", type: "adventure", action } as const;
        const s = dispatch(before, command);
        expect(validState(s)).toBe(true);
        expect(s.adventure.rescueChoice).toBe(
          action === "return" ? "roots" : "supplies",
        );
        expect(s.herbs).toBe(before.herbs + (action === "takeHerbs" ? 4 : 0));
        expect(s.stones).toBe(before.stones + 12);
        expect(s.seed).toBe(before.seed);
        expect(s.month).toBe(before.month);
        expect(dispatch(migrateSave(before), command)).toEqual(s);
        expect(dispatch(s, command)).toBe(s);
        expect(
          dispatch(s, {
            ...command,
            id: "again",
            action: action === "return" ? "takeHerbs" : "return",
          }),
        ).toBe(s);
        const revisit = dispatch(s, {
          id: "visit",
          type: "road",
          action: "thanks",
        });
        expect(revisit.adventure.road.result).toContain(
          action === "return" ? "护根" : "渡口伤者",
        );
      }
    }
  },
);
it("blocks decisions before rescue, during a pending event or duel, and after death or sealing", () => {
  const home = rescue();
  const pending = dispatch(home, {
    id: "month",
    type: "advance",
    activity: "work",
    months: 3,
  });
  for (const s of [
    createGame("客", "wood"),
    pending,
    { ...home, status: "dead" },
    { ...home, status: "complete" },
    {
      ...home,
      social: { ...home.social, scene: { id: "heart", kind: "meet" } },
    },
  ] as State[]) {
    for (const action of ["return", "takeHerbs"] as const)
      expect(dispatch(s, { id: "blocked", type: "adventure", action })).toBe(s);
  }
});
it.each(["roots", "supplies"] as const)(
  "carries %s into the third chapter as a real capability boundary",
  (choice) => {
    let s = mistCheckpoint(42, "sword", "male", false, choice);
    s.study = 0;
    s.herbs = 0;
    for (const action of ["receive", "accept", "solo", "garden"] as const)
      s = dispatch(s, { id: action, type: "mist", action });
    const before = structuredClone(s);
    const next = dispatch(s, { id: "roots", type: "mist", action: "attune" });
    if (choice === "roots") {
      expect(mistError(s, "attune")).toBe("");
      expect(next.adventure.mist.garden).toBe(true);
      expect(next.adventure.mist.result).toContain("山祠");
      expect(next.herbs).toBe(0);
      expect(next.seed).toBe(s.seed);
      expect(validState(next)).toBe(true);
    } else {
      expect(next).toBe(s);
      expect(mistError(s, "attune")).not.toBe("");
    }
    expect(s).toEqual(before);
  },
);
it("rejects missing or premature choice fields and preserves completed v10 as legacy", () => {
  const current = dispatch(rescue(), {
    id: "choice",
    type: "adventure",
    action: "takeHerbs",
  });
  const { rescueChoice: _, ...adventure } = current.adventure;
  const old = { ...current, version: 10, adventure };
  const frozen = structuredClone(old);
  const upgraded = migrateSave(old);
  expect(upgraded).toEqual({
    ...current,
    adventure: { ...adventure, rescueChoice: "legacy" },
  });
  expect(old).toEqual(frozen);
  expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
  expect(validState({ ...old, version: 11 })).toBe(false);
  expect(validState({ ...current, version: "11" })).toBe(false);
  expect(
    validState({
      ...current,
      adventure: { ...current.adventure, rescueChoice: "none" },
    }),
  ).toBe(false);
  expect(
    validState({ ...rescue(), adventure: current.adventure, version: 15 }),
  ).toBe(false);
  const start = createGame("客", "wood");
  expect(
    validState({
      ...start,
      adventure: { ...start.adventure, rescueChoice: "roots" },
    }),
  ).toBe(false);
});
it("shows relevant guidance without changing state or forcing a play duration", () => {
  let s = dispatch(rescue(), {
    id: "choice",
    type: "adventure",
    action: "return",
  });
  expect(openingGuide(s)?.body).toContain("护根");
  s = dispatch(s, { id: "thanks", type: "road", action: "thanks" });
  expect(openingGuide(s)?.action).toBe("skills");
  expect(openingGuide(s)?.body).toContain("装配主修");
  const before = structuredClone(s);
  openingGuide(s);
  expect(s).toEqual(before);
  s = dispatch(s, { id: "work", type: "advance", activity: "work", months: 3 });
  expect(openingGuide(s)).toBeNull();
});

it("resolves the opening mystery through playable discoveries and matches the rescue performance", () => {
  let s = createGame("察阵", "wood");
  s = dispatch(s, { id: "inspect", type: "adventure", action: "inspect" });
  expect(s.adventure.result).toContain("结朝里");
  for (const [i, action] of (
    ["depart", "medicine", "prepare", "depart", "trail"] as AdventureAction[]
  ).entries())
    s = dispatch(s, { id: `path-${i}`, type: "adventure", action });
  expect(s.adventure.result).toContain("护路印");
  const before = structuredClone(s);
  const next = dispatch(s, {
    id: "rescue",
    type: "adventure",
    action: "challenge",
  });
  expect(next.adventure.result).toContain("送下山求救");
  expect(
    actionReceipt(s, next, { type: "adventure", action: "challenge" })?.process
      ?.title,
  ).toBe("药气缓阵");
  expect(s).toEqual(before);
});
