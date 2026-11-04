import { finiteTree, number } from "./validation";
import { draw } from "./random";

export interface EncounterProfile {
  base: number;
  root: number;
  sense: number;
  foundation: number;
  mastery: number;
  study: number;
  mainEquipped: boolean;
  supportEquipped: boolean;
  equipmentChance: number;
  injuryReduction: number;
  aid: boolean;
  injury: number;
  sea: boolean;
}
/** One-shot encounters keep their existing probability rules, not turn-based damage. */
export function previewEncounter(p: Readonly<EncounterProfile>) {
  finiteTree(p);
  for (const key of [
    "base",
    "root",
    "sense",
    "foundation",
    "mastery",
    "study",
    "injuryReduction",
    "injury",
  ] as const)
    number(p[key], key);
  const terms = [
    { name: "应敌基础", value: p.base },
    { name: "根骨与神识", value: Math.floor(p.root / 2) + p.sense },
    { name: "根基与剑意", value: Math.floor(p.foundation / 2) + p.mastery },
    { name: "研读心得", value: p.study * 5 },
    {
      name: "装配功法",
      value: (p.mainEquipped ? 4 : 0) + (p.supportEquipped ? 4 : 0),
    },
    { name: "灵器与针对性", value: p.equipmentChance },
    { name: "同行援助", value: p.aid ? 20 : 0 },
    { name: "伤势", value: -p.injury * 5 },
    { name: "雾海险境", value: p.sea ? -8 : 0 },
  ];
  return {
    terms,
    chance: Math.max(
      5,
      Math.min(
        100,
        terms.reduce((total, term) => total + term.value, 0),
      ),
    ),
    damage: Math.max(0, (p.sea ? 2 : 1) - p.injuryReduction),
  };
}
export type EncounterPreview = ReturnType<typeof previewEncounter>;
/** Use the command's pre-travel preview, preserving the original interruption/charging order. */
export function resolveEncounter(
  preview: Readonly<EncounterPreview>,
  seed: number,
) {
  number(preview.chance, "chance", 5, 100);
  number(preview.damage, "injury");
  const next = draw(seed);
  const roll = Math.floor(next.value * 100) + 1;
  const won = roll <= preview.chance;
  return {
    seed: next.seed,
    roll,
    chance: preview.chance,
    outcome: won ? ("win" as const) : ("loss" as const),
    injury: won ? 0 : preview.damage,
  };
}
