import {cultivationMonthlyGain} from "../src/progression";
import {cultivationMonth} from '../src/progression/cultivation';
import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { SAVE_VERSION } from "../src/save-version";
import { expect, it } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  canGather,
  canTrain,
  type State,
  type Intent,
} from "../src/core";

const send = (s: State, c: Intent, id = `lesson-${s.seen.length}`) =>
  dispatch(s, { ...c, id });
function rescued(path: "wood" | "sword" = "wood") {
  let s = createGame("问道", path, 42);
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as const)
    s = send(s, { type: "adventure", action });
  return s;
}
it("opening identity grants neither skills nor speed; either saved label can choose every book", () => {
  const a = createGame("问道", "wood"),
    b = createGame("问道", "sword");
  expect(cultivationMonthlyGain(a)).toBe(cultivationMonthlyGain(b));
  for (const path of ["wood", "sword"] as const)
    for (const choice of ["spring", "blade", "breath"] as const) {
      const s = rescued(path);
      expect(s.journey.known).toEqual([]);
      expect(canGather(s)).toBe(false);
      expect(canTrain(s)).toBe(false);
      const n = send(s, { type: "learning", choice });
      expect(n.journey.known).toEqual([choice]);
      expect(n.journey.main).toBeNull();
      expect(n.journey.learning.book).toBe(true);
      expect(n.month).toBe(s.month);
      expect(n.seed).toBe(s.seed);
      expect(validState(n)).toBe(true);
      expect(
        send(
          migrateSave(n),
          { type: "learning", choice: "blade" },
          "another-id",
        ),
      ).toEqual(n);
    }
});
it("learning and equipping are separate, and paid study allows both gathering and swordplay", () => {
  let s = send(rescued("sword"), { type: "learning", choice: "spring" });
  expect(canGather(s)).toBe(true);
  expect(canTrain(s)).toBe(false);
  expect(send(s, { type: "advance", activity: "train", months: 1 })).toBe(s);
  s.study = 2;
  s.stones = 20;
  s = send(s, { type: "learn", technique: "blade" });
  expect(s.stones).toBe(0);
  expect(canGather(s) && canTrain(s)).toBe(true);
  const n = send(s, { type: "advance", activity: "train", months: 1 });
  expect(n.mastery).toBe(s.mastery + 1);
  expect(n.month).toBe(s.month + 1);
  const equipped = send(s, { type: "equip", technique: "spring" });
  expect(cultivationMonth(equipped).gain*240+cultivationMonth(equipped).remainder).toBeGreaterThan(
    cultivationMonth(s).gain*240+cultivationMonth(s).remainder,
  );
});
it("rewards cannot be taken prematurely, during events or after death", () => {
  const fresh = createGame("客", "wood");
  expect(send(fresh, { type: "learning", choice: "spring" })).toBe(fresh);
  const s = rescued();
  expect(send(s, { type: "learning", choice: "vial" })).toBe(s);
  const waiting = send(s, { type: "advance", activity: "work", months: 3 });
  expect(waiting.pending).not.toBeNull();
  expect(send(waiting, { type: "learning", choice: "spring" })).toBe(waiting);
  for (const status of ["dead", "complete", "legacy"] as const) {
    const frozen = { ...s, status };
    expect(send(frozen, { type: "learning", choice: "spring" })).toBe(frozen);
  }
});
it("relic selection is independent of the book and remains settled after the id ring expires", () => {
  for (const choice of ["sword", "vial"] as const) {
    const s = send(rescued(), { type: "learning", choice: "spring" });
    s.expedition.cleared = 1;
    const n = send(s, { type: "learning", choice });
    expect(n.journey.relics[choice]).toBe(1);
    n.seen = [];
    expect(
      send(n, {
        type: "learning",
        choice: choice === "vial" ? "sword" : "vial",
      }),
    ).toBe(n);
    expect(n.journey.relics[choice === "vial" ? "sword" : "vial"]).toBe(0);
  }
});
it("already learned gifts compensate once and deterministic commands survive a save round trip", () => {
  const s = rescued();
  s.journey.known = ["spring"];
  const n = send(s, { type: "learning", choice: "spring" });
  expect(n.stones).toBe(s.stones + 20);
  expect(n.journey.known).toEqual(["spring"]);
  expect(send(migrateSave(s), { type: "learning", choice: "spring" })).toEqual(
    n,
  );
  expect(send(n, { type: "learning", choice: "spring" })).toBe(n);
});
it("v25 migration marks past rewards settled without grants and rejects invalid or future saves", () => {
  const s = rescued();
  const { learning: _, ...journey } = s.journey;
  const old = { ...s, version: 25, journey };
  const snapshot = structuredClone(old);
  const n = migrateSave(old);
  expect(n.version).toBe(SAVE_VERSION);
  expect(n.journey.learning).toEqual({ book: true, relic: false });
  expect(n.journey.known).toEqual([]);
  expect(n.stones).toBe(s.stones);
  expect(old).toEqual(snapshot);
  expect(
    validState({
      ...n,
      journey: { ...n.journey, learning: { book: 1, relic: false } },
    }),
  ).toBe(false);
  expect(() => migrateSave({ ...n, version: 999 })).toThrow();
});

it.each(["spring", "vial"] as const)("keeps %s compensation claimable if the wallet is full", (choice) => {
  const s = rescued();
  s.journey.known = ["spring"];
  s.expedition.cleared = 1;
  s.journey.relics.vial = 1;
  s.stones = 1e9;
  const snapshot = structuredClone(s);
  expect(send(s, { type: "learning", choice }, "full-wallet")).toBe(s);
  expect(s).toEqual(snapshot);
  s.stones -= 20;
  const n = send(s, { type: "learning", choice }, "full-wallet");
  expect(n.journey.learning[choice === "spring" ? "book" : "relic"]).toBe(true);
  expect(n.stones).toBe(s.stones + (choice === "spring" ? 20 : 12));
  expect(send(n, { type: "learning", choice }, "claim-again")).toBe(n);
});
