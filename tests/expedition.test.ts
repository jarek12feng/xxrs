import { describe, expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  roadError,
} from "../src/core";
import { expeditionError, freshExpedition } from "../src/expedition/rules";
import {
  expeditionSession,
  balanceSample,
} from "../tools/expedition-simulation";

it("replays 60 public-command routes with finite costs and single rewards", () => {
  const first = balanceSample();
  expect(first).toEqual(balanceSample());
  expect(first).toHaveLength(60);
  for (const row of first)
    expect(row).toMatchObject({
      cleared: 3,
      adventureMonths: 3,
      netStones: 14,
      injury: 0,
    });
});
it("persists combat, blocks competing commands and keeps checkpoints after failure", () => {
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  const before = p.state;
  p.send({ type: "expedition", action: "enter" });
  expect(p.state.month).toBe(before.month + 1);
  expect(p.state.stones).toBe(before.stones - 2);
  expect(p.state.seed).toBe(before.seed);
  const active = p.state;
  expect(migrateSave(active)).toEqual(active);
  for (const cmd of [
    { type: "advance", activity: "work", months: 1 },
    { type: "road", action: "market" },
    { type: "retire" },
    { type: "prepare", kind: "retreat" },
  ] as const)
    expect(dispatch(active, { ...cmd, id: "blocked" })).toBe(active);
  p.fight();
  p.send({ type: "expedition", action: "studyArray" });
  p.send({ type: "expedition", action: "enter" });
  p.fight(false);
  expect(p.state.expedition.cleared).toBe(2);
  expect(p.state.injury).toBe(1);
  p.send({ type: "advance", activity: "rest", months: 1 });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  expect(p.state.expedition.cleared).toBe(3);
  expect(p.state.journey.known).toContain("guard");
  const end = p.state;
  p.send({ type: "expedition", action: "enter" });
  expect(p.state).toBe(end);
});
it("prioritizes appointments and death over entry costs and combat", () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  const old = p.state;
  const atAppointment = { ...old, month: 2, age: 194 };
  expect(validState(atAppointment)).toBe(true);
  const next = dispatch(atAppointment, {
    type: "expedition",
    action: "enter",
    id: "meeting",
  });
  expect(next.pending?.kind).toBe("meeting");
  expect(next.expedition.duel).toBeNull();
  expect(next.stones).toBe(old.stones);
  expect(validState(next)).toBe(true);
  const dying = { ...old, age: old.limit - 1 };
  const dead = dispatch(dying, {
    type: "expedition",
    action: "enter",
    id: "death",
  });
  expect(dead.status).toBe("dead");
  expect(dead.expedition.duel).toBeNull();
  expect(dead.stones).toBe(old.stones);
  expect(validState(dead)).toBe(true);
});
it("rejects malformed progress and migrates v11 without resetting prior accomplishments", () => {
  const p = expeditionSession();
  p.prepare();
  const { expedition: _, ...rest } = p.state;
  const old = { ...rest, version: 11 };
  const frozen = structuredClone(old);
  expect(migrateSave(old)).toEqual({
    ...rest,
    version: 13,
    expedition: freshExpedition(),
  });
  expect(old).toEqual(frozen);
  for (const patch of [
    { cleared: 4 },
    { accepted: true, cleared: 2, attempts: 0 },
    { duel: { hp: 20, enemy: 5, turn: 0 } },
    { effect: "oops" },
    { attempts: -1 },
  ])
    expect(
      validState({
        ...p.state,
        expedition: { ...freshExpedition(), ...patch },
      }),
    ).toBe(false);
  expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
  expect(() => migrateSave({ ...old, version: 14 })).toThrow();
});
it("honors resource gates, command idempotency and no free-pass bypass once accepted", () => {
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  expect(
    roadError(
      {
        ...p.state,
        adventure: {
          ...p.state.adventure,
          road: { ...p.state.adventure.road, stage: "pass" },
        },
      },
      "healPass",
    ),
  ).toContain("先完成");
  expect(expeditionError({ ...p.state, stones: 1 }, "enter")).toContain("灵石");
  const cmd = { type: "expedition", action: "enter", id: "once" } as const;
  const next = dispatch(p.state, cmd);
  expect(dispatch(next, cmd)).toBe(next);
  const withdrawn = dispatch(next, {
    type: "expedition",
    action: "withdraw",
    id: "withdraw",
  });
  expect(withdrawn.injury).toBe(next.injury);
  expect(withdrawn.expedition.duel).toBeNull();
  expect(withdrawn.stones).toBe(next.stones);
  expect(validState(withdrawn)).toBe(true);
});

it("supports the herb alternative and then the consequential medicine ending", () => {
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  const herbs = p.state.herbs;
  p.send({ type: "expedition", action: "healArray" });
  expect(p.state.herbs).toBe(herbs - 4 + 2);
  expect(p.state.expedition.cleared).toBe(2);
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  p.send({ type: "road", action: "pass" });
  p.send({ type: "road", action: "diagnoseRoots" });
  while (p.state.herbs < 6) p.send({ type: "supplies" });
  p.send({ type: "road", action: "healPass" });
  expect(p.state.adventure.road.solution).toBe("medicine");
  expect(p.state.expedition.cleared).toBe(3);
});
it("resets checkpoints on reincarnation and preserves them through everyday preparation", () => {
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  const quest = structuredClone(p.state.expedition);
  p.send({ type: "advance", activity: "work", months: 1 });
  expect(p.state.expedition).toEqual(quest);
  p.send({ type: "retire" });
  p.send({ type: "next", path: "wood", inheritance: "none" });
  expect(p.state.expedition).toEqual(freshExpedition());
});
