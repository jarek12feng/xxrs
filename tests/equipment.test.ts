import { describe, expect, it } from "vitest";
import {
  applyEquipmentChange,
  equipmentChangeError,
  equipmentCultivationBonus,
  evaluateEquipment,
  getEquipment,
  hasEquippedRelic,
  inspectEquipment,
  previewEquipment,
  type EquipmentContext,
  type EquipmentChange,
} from "../src/equipment";
function ready(): EquipmentContext {
  return {
    realm: 1,
    qi: 0,
    journey: { equipped: null, relics: { sword: 1, vial: 1 } },
    workshop: { temper: { sword: "plain", vial: "plain" } },
    treasures: { equipped: null, owned: { bell: 1, cord: 1, mirror: 1 } },
    outerSea: { seal: true, attuned: false },
    conclave: { depth: 1, attuned: false },
  };
}
describe("equipment public interface", () => {
  it("separates category, tier, slot and refinement rank", () => {
    expect(getEquipment("sword")).toMatchObject({
      shape: "sword",
      categories: ["attack"],
      tier: "spirit",
      slot: "primary",
      maxRank: 2,
    });
    expect(getEquipment("tideSeal")).toMatchObject({
      tier: "artifact",
      slot: "attuned",
    });
    expect(inspectEquipment(ready(), "tideSeal")).toMatchObject({
      rank: 1,
      active: false,
    });
  });
  it("acquisition is not activation; equipment slots replace independently", () => {
    const s = ready();
    expect(evaluateEquipment(s, { kind: "base" }).damage).toBe(0);
    applyEquipmentChange(s, { kind: "equip", id: "sword" });
    applyEquipmentChange(s, { kind: "equip", id: "bell" });
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 2,
      armor: 0,
    });
    applyEquipmentChange(s, { kind: "equip", id: "vial" });
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 0,
      armor: 1,
    });
    expect(inspectEquipment(s, "bell").active).toBe(true);
    applyEquipmentChange(s, { kind: "unequip", slot: "auxiliary" });
    expect(inspectEquipment(s, "vial").active).toBe(true);
  });
  it.each([
    ["sword", 1, 2, 0],
    ["sword", 2, 5, 0],
    ["vial", 1, 0, 1],
    ["vial", 2, 0, 3],
  ] as const)("preserves %s rank %i base power", (id, rank, damage, armor) => {
    const s = ready();
    s.journey.equipped = id;
    s.journey.relics[id] = rank;
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage,
      armor,
    });
  });
  it("returns source-attributed combined turn effects, including negative tradeoffs", () => {
    const s = ready();
    s.journey.equipped = "sword";
    s.workshop.temper.sword = "keen";
    s.treasures.equipped = "cord";
    const result = evaluateEquipment(s, {
      kind: "turn",
      move: "strike",
      correct: false,
    });
    expect(result).toMatchObject({ damage: 2, incoming: -1 });
    expect(result.sources).toEqual([
      expect.objectContaining({
        source: "sword",
        effect: "temper",
        damage: 3,
        incoming: 1,
      }),
      expect.objectContaining({
        source: "cord",
        effect: "auxiliary",
        damage: -1,
        incoming: -2,
      }),
    ]);
    expect(
      evaluateEquipment(s, { kind: "turn", move: "guard", correct: true }),
    ).toMatchObject({ damage: 0, incoming: 0 });
  });
  it("requires correct discernment and uses refined auxiliary values", () => {
    const s = ready();
    s.journey.equipped = "sword";
    s.workshop.temper.sword = "array";
    s.treasures.equipped = "mirror";
    s.treasures.owned.mirror = 2;
    expect(
      evaluateEquipment(s, { kind: "turn", move: "discern", correct: true })
        .damage,
    ).toBe(7);
    expect(
      evaluateEquipment(s, { kind: "turn", move: "discern", correct: false })
        .damage,
    ).toBe(0);
  });
  it("preserves distinct exploration formulas and failure injury reduction", () => {
    const s = ready();
    s.journey.equipped = "vial";
    s.journey.relics.vial = 2;
    expect(
      evaluateEquipment(s, { kind: "challenge", opponent: "guardian" }),
    ).toMatchObject({ chance: 40, injuryReduction: 1 });
    expect(
      evaluateEquipment(s, { kind: "challenge", opponent: "raider" }).chance,
    ).toBe(32);
    expect(evaluateEquipment(s, { kind: "road" }).chance).toBe(30);
    expect(evaluateEquipment(s, { kind: "mist", hazard: "wind" }).chance).toBe(
      6,
    );
    expect(evaluateEquipment(s, { kind: "mist", hazard: "echo" }).chance).toBe(
      12,
    );
    expect(equipmentCultivationBonus(s)).toBe(1);
    expect(hasEquippedRelic(s, 2)).toBe(true);
    expect(equipmentCultivationBonus({ realm: 1 })).toBe(0);
    expect(equipmentCultivationBonus({ ...s, realm: 2 })).toBe(0);
  });
  it("includes only attuned story treasures when explicitly requested", () => {
    const s = ready();
    expect(
      evaluateEquipment(s, { kind: "base", includeAttuned: true }),
    ).toMatchObject({ damage: 0, armor: 0 });
    s.outerSea!.attuned = true;
    s.conclave!.attuned = true;
    expect(
      evaluateEquipment(s, { kind: "base", includeAttuned: true }),
    ).toMatchObject({ damage: 4, armor: 8 });
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 0,
      armor: 0,
    });
    expect(s.journey.equipped).toBeNull();
    expect(s.treasures.equipped).toBeNull();
  });
  it("rejects realm, ownership, rank and incompatible inscription changes without mutation", () => {
    const s = ready();
    s.realm = 0;
    s.qi = 119;
    s.treasures.owned.bell = 0;
    const saved = structuredClone(s);
    for (const change of [
      { kind: "equip", id: "mirror" },
      { kind: "acquire", id: "bell" },
      { kind: "refine", id: "sword" },
      { kind: "temper", id: "sword", temper: "shell" },
      { kind: "acquire", id: "sword" },
      { kind: "equip", id: "unknown" },
    ])
      expect(applyEquipmentChange(s, change as EquipmentChange).error).not.toBe(
        "",
      );
    expect(s).toEqual(saved);
    s.qi = 120;
    expect(applyEquipmentChange(s, { kind: "acquire", id: "bell" }).error).toBe(
      "",
    );
    s.realm = 1;
    expect(applyEquipmentChange(s, { kind: "refine", id: "sword" }).error).toBe(
      "",
    );
    expect(equipmentChangeError(s, { kind: "refine", id: "sword" })).toBe(
      "已精炼至二阶",
    );
  });
  it("previews the same change as execution without altering input, RNG or resources", () => {
    const s = { ...ready(), seed: 42, stones: 77, month: 12 };
    const before = structuredClone(s);
    const changes: EquipmentChange[] = [
      { kind: "refine", id: "sword" },
      { kind: "equip", id: "sword" },
    ];
    const preview = previewEquipment(s, changes);
    expect(preview.error).toBe("");
    expect(preview.after.damage).toBe(5);
    const actual = structuredClone(s);
    for (const change of changes) applyEquipmentChange(actual, change);
    expect(preview.next).toEqual(actual);
    expect(s).toEqual(before);
    expect(preview.next).toMatchObject({ seed: 42, stones: 77, month: 12 });
    const failed = previewEquipment(s, [
      ...changes,
      { kind: "temper", id: "sword", temper: "shell" },
    ]);
    expect(failed.error).not.toBe("");
    expect(failed.next).toBe(s);
    expect(failed.after).toEqual(failed.before);
  });
});
