import { expect, it } from "vitest";
import {
  startBattle,
  resolveTurn,
  previewAction,
  previewArenaAction,
  resolveEncounter,
  type ActionContext,
} from "../src/combat";
const context = (): ActionContext => ({
  move: "guard",
  effect: "none",
  battle: startBattle(20, 30),
  encounter: { hp: 30, attack: 10, pattern: ["guard"] },
  profile: {
    power: { hp: 20, damage: 5, armor: 2 },
    main: null,
    mainActive: false,
    lantern: false,
    herbs: 0,
    equipment: { damage: 0, incoming: 0, note: "" },
  },
});
it.each([NaN, Infinity, -1])(
  "rejects invalid exchange values %s without mutating battle",
  (value) => {
    const b = Object.freeze(startBattle(20, 30));
    for (const key of ["damage", "incoming", "healing", "herbs"]) {
      expect(() =>
        resolveTurn(
          b,
          { damage: 3, incoming: 2, healing: 0, herbs: 0, [key]: value },
          { turnLimit: 6, resolution: "journey" },
        ),
      ).toThrow(RangeError);
    }
    expect(b).toEqual({ hp: 20, enemy: 30, turn: 0 });
  },
);
it("rejects empty patterns, non-finite modifiers and invalid policies", () => {
  const c = context();
  c.encounter.pattern = [];
  expect(() => previewAction(c)).toThrow(RangeError);
  c.encounter.pattern = ["guard"];
  c.adjustments = [{ phase: "exchange", damage: NaN, incoming: 0, note: "" }];
  expect(() => previewAction(c)).toThrow(RangeError);
  expect(() =>
    resolveTurn(
      c.battle,
      { damage: 1, incoming: 1, healing: 0, herbs: 0 },
      { turnLimit: 0, resolution: "journey" },
    ),
  ).toThrow(RangeError);
});
it("accepts signed modifiers and preserves the unknown tactical move contract", () => {
  const c = context();
  c.adjustments = [{ phase: "exchange", damage: -2, incoming: -5, note: "" }];
  expect(previewAction(c)?.damage).toBeGreaterThanOrEqual(1);
  expect(
    previewAction({ ...c, move: "unknown" as ActionContext["move"] }),
  ).toBeNull();
});
it("validates encounter odds, injuries and unsigned integer seeds", () => {
  const p = { chance: 50, damage: 1, terms: [] };
  for (const seed of [NaN, Infinity, -1, 0x100000000, 1.5])
    expect(() => resolveEncounter(p, seed)).toThrow(RangeError);
  expect(() => resolveEncounter({ ...p, chance: 101 }, 42)).toThrow(RangeError);
  expect(() => resolveEncounter({ ...p, damage: -1 }, 42)).toThrow(RangeError);
  expect(resolveEncounter(p, 0).seed).toBe(1);
});
it("rejects an empty arena pattern before calculating damage", () => {
  expect(() =>
    previewArenaAction({
      battle: { ...startBattle(20, 30), maxHp: 20 },
      opponent: { attack: 10, pattern: [] },
      stance: "endure",
      profile: {
        main: null,
        support: null,
        attackBase: 5,
        armorBase: 2,
        herbs: 0,
        equipment: { damage: 0, incoming: 0, note: "" },
        pressure: {
          damageFactor: 1,
          incomingExtra: 0,
          gap: 0,
          description: "",
        },
      },
    }),
  ).toThrow(RangeError);
});
