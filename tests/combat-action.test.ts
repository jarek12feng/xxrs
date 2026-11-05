import { expect, it, vi } from "vitest";
import {
  executeBattleAction,
  startBattle,
  previewAction,
  type ActionContext,
} from "../src/combat";

function context(): ActionContext {
  return {
    battle: startBattle(30, 40),
    move: "guard",
    effect: "none",
    encounter: { hp: 40, attack: 20, pattern: ["guard"] },
    profile: {
      power: { hp: 30, damage: 10, armor: 2 },
      main: "spring",
      mainActive: true,
      lantern: false,
      herbs: 2,
      equipment: { damage: 0, incoming: 0, note: "" },
    },
  };
}
it("public execution recalculates once and returns a coherent battle, resource and receipt transaction", () => {
  const c = context(),
    original = structuredClone(c);
  const quote = previewAction(c)!;
  const calculate = vi.fn(() => previewAction(c));
  const result = executeBattleAction(
    c.battle,
    2,
    { turnLimit: 12, resolution: "journey" },
    calculate,
  )!;
  expect(calculate).toHaveBeenCalledTimes(1);
  expect(c).toEqual(original);
  expect(result.battle.enemy).toBe(40 - quote.damage);
  expect(result.battle.hp).toBe(30 - quote.incoming + quote.healing);
  expect(result.remainingHerbs + result.exchange.herbs).toBe(2);
  expect(result.exchange.note).toBe(quote.note);
  expect(result).toEqual(
    executeBattleAction(
      c.battle,
      2,
      { turnLimit: 12, resolution: "journey" },
      () => previewAction(c),
    ),
  );
});
it("actual receipt caps overkill and preserves explicitly selected simultaneous hazard behavior", () => {
  const b = startBattle(8, 2);
  const calculate = () => ({
    damage: 50,
    incoming: 4,
    healing: 0,
    herbs: 0,
    note: "hazard",
  });
  const journey = executeBattleAction(
    b,
    0,
    { turnLimit: 12, resolution: "journey" },
    calculate,
  )!;
  const hazard = executeBattleAction(
    b,
    0,
    { turnLimit: 12, resolution: "simultaneous" },
    calculate,
  )!;
  expect(journey.exchange).toMatchObject({ damage: 2, incoming: 0 });
  expect(hazard.exchange).toMatchObject({ damage: 2, incoming: 4 });
  expect(journey.battle.hp).toBe(8);
  expect(hazard.battle.hp).toBe(4);
  expect(b).toEqual(startBattle(8, 2));
});
it("rejects unavailable resources and terminal turns before producing any transaction", () => {
  const b = startBattle(8, 20),
    policy = { turnLimit: 12, resolution: "journey" } as const;
  const calculate = vi.fn(() => ({
    damage: 2,
    incoming: 1,
    healing: 3,
    herbs: 1,
  }));
  expect(() => executeBattleAction(b, 0, policy, calculate)).toThrow(
    "Insufficient",
  );
  calculate.mockClear();
  expect(() =>
    executeBattleAction({ ...b, turn: 12 }, 1, policy, calculate),
  ).toThrow("ended");
  expect(calculate).not.toHaveBeenCalled();
  expect(executeBattleAction(b, 1, policy, () => null)).toBeNull();
});
