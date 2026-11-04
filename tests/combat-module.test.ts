import { describe, expect, it } from "vitest";
import {
  startBattle,
  previewAction,
  resolveTurn,
  previewArenaAction,
  resolveArenaAction,
  type ActionContext,
  type ArenaContext,
} from "../src/combat";

function context(): ActionContext {
  return {
    move: "guard",
    effect: "none",
    battle: startBattle(30, 100),
    encounter: { hp: 100, attack: 20, pattern: ["guard", "strike", "discern"] },
    profile: {
      power: { hp: 40, damage: 10, armor: 3 },
      main: "spring",
      mainActive: true,
      lantern: false,
      herbs: 2,
      equipment: { damage: 0, incoming: 0, note: "" },
    },
  };
}
function arena(): ArenaContext {
  return {
    battle: { ...startBattle(30, 100), maxHp: 40 },
    opponent: { attack: 15, pattern: ["endure", "break", "discern"] },
    stance: "endure",
    profile: {
      main: "spring",
      support: null,
      attackBase: 10,
      armorBase: 3,
      herbs: 2,
      equipment: { damage: 0, incoming: 0, note: "" },
      pressure: { damageFactor: 1, incomingExtra: 0, gap: 0, description: "" },
    },
  };
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

describe("public combat interface without game state", () => {
  it("previews and settles a turn without mutating inputs or spending caller resources", () => {
    const input = freeze(context());
    const p = previewAction(input)!;
    expect(p).toMatchObject({ damage: 14, incoming: 12, healing: 7, herbs: 1 });
    const result = resolveTurn(input.battle, freeze(p), {
      turnLimit: 12,
      resolution: "journey",
    });
    expect(result.battle).toEqual({ hp: 25, enemy: 86, turn: 1 });
    expect(result.herbs).toBe(1);
    expect(input.profile.herbs).toBe(2);
    expect(input.battle).toEqual({ hp: 30, enemy: 100, turn: 0 });
    expect(previewAction(input)).toEqual(p);
  });

  it("does not retaliate or spend healing herbs after a tactical killing blow", () => {
    const input = context();
    input.battle = { hp: 1, enemy: 1, turn: 0 };
    const p = previewAction(input)!;
    expect(p).toMatchObject({ incoming: 0, healing: 0, herbs: 0 });
    expect(
      resolveTurn(input.battle, p, { turnLimit: 12, resolution: "journey" }),
    ).toMatchObject({ outcome: "win", battle: { hp: 1, enemy: 0, turn: 1 } });
  });

  it("cannot heal a lethal hit and does not require herbs for a normal guard", () => {
    const input = context();
    input.battle = { hp: 5, enemy: 100, turn: 0 };
    expect(previewAction(input)).toMatchObject({ healing: 0, herbs: 0 });
    input.profile.herbs = 0;
    expect(previewAction(input)).toMatchObject({
      damage: 16,
      healing: 0,
      herbs: 0,
    });
    const p = previewAction(input)!;
    expect(
      resolveTurn(input.battle, p, { turnLimit: 12, resolution: "journey" })
        .outcome,
    ).toBe("loss");
  });

  it("preserves the two chapter settlement orders, including late additional incoming", () => {
    const battle = { hp: 8, enemy: 1, turn: 11 };
    const p = { damage: 10, incoming: 12, healing: 0, herbs: 0 };
    expect(
      resolveTurn(battle, p, { turnLimit: 12, resolution: "journey" }),
    ).toMatchObject({
      battle: { hp: 8, enemy: 0 },
      outcome: "win",
      incoming: 0,
    });
    expect(
      resolveTurn(battle, p, { turnLimit: 12, resolution: "simultaneous" }),
    ).toMatchObject({
      battle: { hp: 0, enemy: 0 },
      outcome: "win",
      incoming: 12,
    });
  });

  it("ends at the configured turn limit and rejects subsequent settlement", () => {
    for (const turnLimit of [12, 16, 18]) {
      const p = { damage: 1, incoming: 0, healing: 0, herbs: 0 };
      const result = resolveTurn(
        { hp: 20, enemy: 100, turn: turnLimit - 1 },
        p,
        { turnLimit, resolution: "journey" },
      );
      expect(result.outcome).toBe("loss");
      expect(() =>
        resolveTurn(result.battle, p, { turnLimit, resolution: "journey" }),
      ).toThrow();
    }
    expect(() => startBattle(0, 100)).toThrow();
  });

  it("exposes effect identifiers independently of the display text", () => {
    const input = context();
    input.move = "discern";
    input.profile.main = "breath";
    input.arrayCore = true;
    expect(previewAction(input)!.effects).toEqual(["array-discern"]);
  });
});

describe("arena rules remain separate and deterministic", () => {
  it("previews without RNG and replays a saved battle with the same seed", () => {
    const input = freeze(arena());
    const p = previewArenaAction(input);
    const result = resolveArenaAction(input, 42);
    expect(result.seed).toBe(11355432);
    expect(result.incoming).toBeGreaterThanOrEqual(p.incomingMin);
    expect(result.incoming).toBeLessThanOrEqual(p.incomingMax);
    expect(result).toMatchObject({
      damage: 16,
      incoming: 8,
      healing: 6,
      herbs: 1,
    });
    expect(resolveArenaAction(JSON.parse(JSON.stringify(input)), 42)).toEqual(
      result,
    );
    expect(previewArenaAction(input)).toEqual(p);
  });

  it("only the arena sword first strike suppresses a killing-blow retaliation", () => {
    const input = arena();
    input.battle = { hp: 1, enemy: 1, turn: 0, maxHp: 40 };
    expect(resolveArenaAction(input, 42)).toMatchObject({
      outcome: "loss",
      healing: 0,
      herbs: 0,
    });
    input.stance = "break";
    input.profile.main = "blade";
    expect(resolveArenaAction(input, 42)).toMatchObject({
      outcome: "win",
      incoming: 0,
      healing: 0,
    });
  });

  it("retains the sixth-turn timeout", () => {
    const input = arena();
    input.battle = { ...input.battle, turn: 5, enemy: 1000 };
    const result = resolveArenaAction(input, 42);
    expect(result.outcome).toBe("loss");
    expect(() =>
      resolveArenaAction({ ...input, battle: result.battle }, result.seed),
    ).toThrow();
  });
});

describe("chapter contributions use the public calculation pipeline", () => {
  it("applies ordered additions and pressure before deciding lethal and healing", () => {
    const input = context();
    input.rules = "prepared";
    input.profile.pressure = {
      damageFactor: 0.5,
      incomingExtra: 8,
      gap: 1,
      description: "境界压制。",
    };
    input.adjustments = [
      {
        phase: "exchange",
        damage: 4,
        incoming: -2,
        note: "传承。",
        effects: ["inheritance"],
      },
      { phase: "exchange", damage: -30, incoming: -30, note: "换招。" },
      {
        phase: "exchange",
        damage: 4,
        incoming: -3,
        whenCorrect: true,
        note: "协作。",
      },
    ];
    const frozen = freeze(input);
    expect(previewAction(frozen)).toMatchObject({
      damage: 2,
      incoming: 8,
      healing: 7,
      herbs: 1,
      effects: ["inheritance"],
      note: "长春守势收敛攻势，伤害 −2。传承。换招。协作。境界压制。",
    });
    expect(
      previewAction({ ...input, battle: { ...input.battle, enemy: 2 } }),
    ).toMatchObject({ damage: 2, incoming: 0, healing: 0, herbs: 0 });
  });

  it("applies preparation to power without modifying the caller's base power", () => {
    const input = context();
    input.adjustments = [
      { phase: "power", damage: 3, armor: 4, hp: 12, note: "整备。" },
    ];
    expect(previewAction(freeze(input))).toMatchObject({
      damage: 17,
      incoming: 8,
      healing: 7,
    });
    expect(input.profile.power).toEqual({ hp: 40, damage: 10, armor: 3 });
    expect(previewAction(input)!.note.endsWith("整备。")).toBe(true);
  });

  it("preserves historical late hazards instead of silently changing victory or healing", () => {
    const input = context();
    input.battle = { hp: 1, enemy: 1, turn: 0 };
    input.adjustments = [{ phase: "afterHealing", incoming: 12 }];
    const p = previewAction(input)!;
    expect(p).toMatchObject({ incoming: 12, healing: 0, herbs: 0 });
    expect(
      resolveTurn(input.battle, p, {
        resolution: "simultaneous",
        turnLimit: 18,
      }),
    ).toMatchObject({ outcome: "win", battle: { hp: 0, enemy: 0 } });
  });
});
