import { expect, it } from "vitest";
import {
  previewEncounter,
  resolveEncounter,
  type EncounterProfile,
} from "../src/combat";

const profile: EncounterProfile = {
  base: 20,
  root: 11,
  sense: 5,
  foundation: 9,
  mastery: 4,
  study: 2,
  mainEquipped: true,
  supportEquipped: true,
  equipmentChance: 12,
  injuryReduction: 1,
  aid: true,
  injury: 2,
  sea: true,
};
it("retains all nine existing chance terms and the failure injury calculation", () => {
  const p = previewEncounter(Object.freeze({ ...profile }));
  expect(p.chance).toBe(70);
  expect(p.damage).toBe(1);
  expect(p.terms.map((term) => term.value)).toEqual([
    20, 10, 8, 10, 8, 12, 20, -10, -8,
  ]);
  expect(previewEncounter({ ...profile, study: 100 }).chance).toBe(100);
  expect(previewEncounter({ ...profile, injury: 100 }).chance).toBe(5);
  expect(previewEncounter({ ...profile, sea: false }).damage).toBe(0);
});
it("consumes one seeded draw, with replayable success and failure", () => {
  const p = previewEncounter(profile);
  expect(resolveEncounter(p, 42)).toEqual({
    seed: 11355432,
    roll: 1,
    chance: 70,
    outcome: "win",
    injury: 0,
  });
  const difficult = previewEncounter({ ...profile, injury: 100 });
  const result = resolveEncounter(difficult, 123456789);
  expect(result).toEqual({
    seed: 2714967881,
    roll: 64,
    chance: 5,
    outcome: "loss",
    injury: 1,
  });
  expect(
    resolveEncounter(JSON.parse(JSON.stringify(difficult)), 123456789),
  ).toEqual(result);
  expect(difficult).toEqual(previewEncounter({ ...profile, injury: 100 }));
});
