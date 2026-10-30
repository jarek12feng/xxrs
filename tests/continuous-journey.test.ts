import { expect, it } from "vitest";
import { createGame, dispatch, validState } from "../src/core";
import { mistCheckpoint } from "../tools/mist-checkpoint";

it("reviewing a chapter and continuing preserves the same person's world and relationships", () => {
  const s = mistCheckpoint(42, "wood", "female");
  const before = structuredClone(s);
  const review = dispatch(s, { id: "review", type: "retire" });
  expect(review.status).toBe("complete");
  const continued = dispatch(review, { id: "resume", type: "continue" });
  expect(continued.status).toBe("alive");
  for (const key of [
    "social",
    "adventure",
    "growth",
    "expedition",
    "journey",
    "seed",
    "age",
    "qi",
    "unlocked",
    "legacy",
  ] as const)
    expect(continued[key]).toEqual(s[key]);
  expect(s).toEqual(before);
  expect(validState(continued)).toBe(true);
});
it("fresh starts reset every domain and reject inherited bonuses without consuming time or RNG", () => {
  const s = mistCheckpoint(42, "wood", "female");
  s.status = "dead";
  const before = structuredClone(s);
  expect(
    dispatch(s, {
      id: "gift",
      type: "next",
      path: "sword",
      inheritance: "bond",
    }),
  ).toBe(s);
  expect(dispatch(s, { id: "resume", type: "continue" })).toBe(s);
  const command = {
    id: "fresh",
    type: "next",
    path: "sword",
    inheritance: "none",
    aptitude: "sturdy",
  } as const;
  const n = dispatch(s, command);
  expect(n).toEqual(dispatch(s, command));
  const fresh = createGame(s.name, "sword", n.seed, "sturdy");
  expect(n).toEqual({ ...fresh, seen: ["fresh"] });
  expect(validState(n)).toBe(true);
  expect(s).toEqual(before);
});
