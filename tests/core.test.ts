import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  thresholds,
  validState,
  type State,
  type Command,
} from "../src/core";
const run = (s: State, c: Command) => dispatch(s, c);
describe("deterministic cultivation engine", () => {
  it("replays the same seed and commands identically", () => {
    function sim() {
      let s = createGame("测试", "wood", 42);
      for (let i = 0; i < 500; i++) {
        s = run(
          s,
          s.pending !== null
            ? { id: `${i}`, type: "choose", event: s.pending, option: 1 }
            : { id: `${i}`, type: "tick", months: 12 },
        );
      }
      return s;
    }
    expect(sim()).toEqual(sim());
  });
  it("stops a multi-month tick at a decision and rejects duplicate command", () => {
    const s = run(createGame("甲", "wood"), {
      id: "a",
      type: "tick",
      months: 12,
    });
    expect(s.month).toBe(9);
    expect(s.pending).not.toBeNull();
    expect(run(s, { id: "b", type: "tick", months: 12 })).toBe(s);
    expect(run(s, { id: "a", type: "tick", months: 1 })).toBe(s);
  });
  it("rejects unaffordable choices atomically and stale instances", () => {
    let s = createGame("甲", "wood");
    s.pending = 1;
    s.stones = 0;
    expect(run(s, { id: "a", type: "choose", event: 1, option: 0 })).toBe(s);
    expect(run(s, { id: "b", type: "choose", event: 2, option: 1 })).toBe(s);
    s = run(s, { id: "c", type: "choose", event: 1, option: 1 });
    expect(s.insight).toBe(2);
    expect(run(s, { id: "c", type: "choose", event: 1, option: 1 })).toBe(s);
  });
  it("death preempts events and supports paid inheritance", () => {
    const s = createGame("甲", "wood");
    s.age = s.limit - 1;
    s.month = 8;
    const dead = run(s, { id: "a", type: "tick", months: 12 });
    expect(dead.status).toBe("dead");
    expect(dead.pending).toBeNull();
    expect(run(dead, { id: "b", type: "tick", months: 1 })).toBe(dead);
    dead.legacy = 5;
    const next = run(dead, { id: "c", type: "next", gift: "health" });
    expect(next.life).toBe(2);
    expect(next.legacy).toBe(2);
    expect(next.limit).toBe(68 * 12);
    expect(next.status).toBe("alive");
  });
  it("does not allow breakthroughs without cultivation or nonexistent pills", () => {
    const s = createGame("甲", "sword");
    expect(run(s, { id: "a", type: "break", pill: false })).toBe(s);
    s.qi = thresholds[0];
    expect(run(s, { id: "b", type: "break", pill: true })).toBe(s);
    const a = run(s, { id: "c", type: "break", pill: false });
    expect(a).toEqual(
      run(structuredClone(s), { id: "c", type: "break", pill: false }),
    );
    expect(a.seed).not.toBe(s.seed);
  });
  it("supports a whole life and reincarnation without negative resources", () => {
    let s = createGame("甲", "spirit", 9981);
    for (let i = 0; i < 2500 && s.status === "alive"; i++) {
      const cmd: Command =
        s.pending !== null
          ? { id: `${i}`, type: "choose", event: s.pending, option: 1 }
          : s.qi >= thresholds[s.realm]
            ? { id: `${i}`, type: "break", pill: false }
            : { id: `${i}`, type: "tick", months: 12 };
      s = run(s, cmd);
      expect(validState(s)).toBe(true);
      expect(s.stones).toBeGreaterThanOrEqual(0);
    }
    expect(s.status).not.toBe("alive");
    expect(s.legacy).toBeGreaterThanOrEqual(3);
    const next = run(s, { id: "next", type: "next", gift: "wealth" });
    expect(next.life).toBe(2);
    expect(next.pills).toBe(1);
  });
  it("rejects corrupt save input", () => {
    expect(validState({ version: 1 })).toBe(false);
    const s = createGame("甲", "wood");
    expect(validState(s)).toBe(true);
    s.stones = -1;
    expect(validState(s)).toBe(false);
  });
  it("keeps even an early death eligible for reincarnation", () => {
    const s = createGame("短命", "wood");
    s.age = s.limit - 1;
    const dead = dispatch(s, { id: "end", type: "tick", months: 1 });
    expect(dead.legacy).toBe(3);
    expect(
      dispatch(dead, { id: "next", type: "next", gift: "insight" }).status,
    ).toBe("alive");
  });
  it("rejects an old choice when the same event recurs later", () => {
    const s = createGame("时序", "wood");
    s.pending = 0;
    s.month = 27;
    expect(
      dispatch(s, {
        id: "stale",
        type: "choose",
        event: 0,
        option: 0,
        expectedMonth: 9,
      }),
    ).toBe(s);
  });
  it("handles null log entries and impossible living saves without throwing", () => {
    const s = createGame("坏档", "wood");
    expect(validState({ ...s, log: [null] })).toBe(false);
    expect(validState({ ...s, age: s.limit })).toBe(false);
    expect(validState({ ...s, seed: 0 })).toBe(false);
  });
  it("reaches a terminal outcome over 60 seeded lives across all paths", () => {
    for (const path of ["wood", "sword", "spirit"] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        let s = createGame("模拟", path, seed);
        for (let i = 0; i < 2500 && s.status === "alive"; i++) {
          const c: Command =
            s.pending !== null
              ? {
                  id: `${i}`,
                  type: "choose",
                  event: s.pending,
                  option: 1,
                  expectedMonth: s.month,
                }
              : s.qi >= thresholds[s.realm]
                ? { id: `${i}`, type: "break", pill: false }
                : { id: `${i}`, type: "tick", months: 12 };
          s = dispatch(s, c);
          expect(validState(s)).toBe(true);
        }
        expect(s.status).not.toBe("alive");
        expect(
          dispatch(s, { id: "next", type: "next", gift: "insight" }).life,
        ).toBe(2);
      }
    }
  });
});
