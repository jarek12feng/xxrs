import { expect, it } from "vitest";
import {
  dispersedSeeds,
  recoveryRun,
  preparationBudget,
  balanceOpening,
} from "../tools/balance-scenarios";
it("dispersed public-command journeys cover first and consecutive failures, shortages and unprotected recovery", () => {
  for (const path of ["wood", "sword"] as const) {
    const rows = dispersedSeeds.map((seed) => recoveryRun(seed, path));
    expect(rows.some((r) => r.attempts[0]!.success)).toBe(true);
    expect(rows.some((r) => !r.attempts[0]!.success)).toBe(true);
    const consecutive = rows.find((r) => r.attempts.length >= 3)!;
    expect(consecutive).toBeDefined();
    expect(consecutive.shortages).toBeGreaterThan(0);
    const [first, second] = consecutive.attempts;
    expect(first!.before.ward).toBe(true);
    expect(first!.after).toMatchObject({
      qi: 324,
      ward: false,
      pills: 0,
      injury: 2,
    });
    expect(first!.after.limit).toBe(first!.before.limit);
    expect(second!.before.ward).toBe(false);
    expect(second!.after).toMatchObject({
      qi: 252,
      ward: false,
      pills: 0,
      injury: 2,
    });
    expect(second!.after.limit).toBe(second!.before.limit - 12);
    expect(consecutive.commands).toContainEqual({ type: "supplies" });
    expect(consecutive.commands).toContainEqual({
      type: "prepare",
      kind: "refine",
    });
    expect(consecutive.attempts.at(-1)!.success).toBe(true);
    expect(recoveryRun(consecutive.seed, path)).toEqual(consecutive);
    for (const r of rows)
      for (const a of r.attempts)
        expect(a.after.pills).toBe(a.before.pills - 1);
  }
});
it("gift failures recover with earned recipe and no ward on both paths", () => {
  for (const path of ["wood", "sword"] as const) {
    const row = dispersedSeeds
      .map((seed) => recoveryRun(seed, path, true))
      .find((r) => r.attempts.length > 1)!;
    expect(row).toBeDefined();
    expect(row.attempts[0]!.before.ward).toBe(false);
    expect(row.attempts.at(-1)!.success).toBe(true);
  }
});
it("equal-deadline builds pay real costs without changing starting inventory or deadline", () => {
  for (const path of ["wood", "sword"] as const)
    for (const aptitude of ["sturdy", "insightful", "perceptive"] as const) {
      const basic = preparationBudget(path, aptitude, "wait");
      const prepared = preparationBudget(path, aptitude, "foundation");
      const build = preparationBudget(path, aptitude, "build");
      for (const r of [basic, prepared, build]) {
        expect(r.month).toBe(35);
        expect(r.retreatStones).toBeLessThanOrEqual(16);
        expect(r.trainingStones).toBeLessThanOrEqual(12);
        expect(r.trainingHerbs).toBeLessThanOrEqual(2);
      }
      expect(prepared.foundation).toBe(12);
      expect(prepared.qi).toBeGreaterThanOrEqual(359);
      expect(prepared.projectedPillChance - basic.projectedPillChance).toBe(12);
      expect(build.readiness.damage).toBeGreaterThan(basic.readiness.damage);
    }
});

it("public spending can exhaust stones; rejected brewing is inert and labor restores retry", async () => {
  const { dispatch, preparationError } = await import("../src/core");
  const { foundationStep } = await import("../tools/foundation-playthrough");
  const p = balanceOpening(3668339987, "sword");
  for (let i = 0; i < 100; i++) {
    const c = foundationStep(p.state, false);
    p.send(c);
    if (c.type === "break") break;
  }
  expect(p.state.realm).toBe(0);
  while (p.state.stones >= 8) p.send({ type: "supplies" });
  expect(preparationError(p.state, "refine")).not.toBe("");
  const before = structuredClone(p.state);
  expect(
    dispatch(p.state, { type: "prepare", kind: "refine", id: "poor-refine" }),
  ).toBe(p.state);
  expect(p.state).toEqual(before);
  let worked = false;
  for (let i = 0; i < 160 && !p.state.realm; i++) {
    const c = foundationStep(p.state, false);
    if (c.type === "advance" && c.activity === "work") worked = true;
    p.send(c);
  }
  expect(worked).toBe(true);
  expect(p.state.realm).toBe(1);
});
