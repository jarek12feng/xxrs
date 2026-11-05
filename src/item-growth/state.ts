import { freshArtifactGrowth, type ArtifactGrowth } from "../artifact-growth/state";
export type CacheMove = "observe" | "brace" | "reach";
export interface ItemGrowth {
  golden: ArtifactGrowth;
  discovered: boolean;
  reinforced: boolean;
  ring: 0 | 1 | 2;
  collected: number;
  ore: number;
  packedOre: number;
  reforged: { sword: boolean; vial: boolean };
  trial: { turn: number; stability: number; progress: number } | null;
  last: string;
}
export const freshItemGrowth = (): ItemGrowth => ({
  golden: freshArtifactGrowth(),
  discovered: false,
  reinforced: false,
  ring: 0,
  collected: 0,
  ore: 0,
  packedOre: 0,
  reforged: { sword: false, vial: false },
  trial: null,
  last: "",
});
export function storageProfile(p: ItemGrowth) {
  const capacity = p.ring === 2 ? 6 : p.ring === 1 ? 4 : p.reinforced ? 2 : 1;
  return {
    name: p.ring ? "栖尘戒" : p.reinforced ? "扩容储物袋" : "粗制储物袋",
    capacity,
    used: p.ore * 2,
    remaining: capacity - p.ore * 2,
  };
}
export function validItemGrowthData(x: unknown): x is ItemGrowth {
  if (!x || typeof x !== "object") return false;
  const p = x as ItemGrowth;
  const integer = (v: unknown, max: number) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    typeof p.discovered !== "boolean" ||
    typeof p.reinforced !== "boolean" ||
    ![0, 1, 2].includes(p.ring) ||
    !integer(p.collected, 2) ||
    !integer(p.ore, 2) ||
    !integer(p.packedOre, 2) ||
    !p.reforged ||
    typeof p.reforged.sword !== "boolean" ||
    typeof p.reforged.vial !== "boolean" ||
    typeof p.last !== "string" ||
    p.last.length > 2000
  )
    return false;
  if (
    p.collected !==
      p.ore +
        p.packedOre +
        Number(p.reforged.sword) +
        Number(p.reforged.vial) ||
    storageProfile(p).remaining < 0
  )
    return false;
  if (!p.discovered && (p.ring || p.collected || p.trial)) return false;
  if (p.trial === null) return true;
  return (
    !!p.trial &&
    !p.ring &&
    integer(p.trial.turn, 2) &&
    integer(p.trial.stability, 8) &&
    p.trial.stability > 0 &&
    integer(p.trial.progress, 6) &&
    p.trial.progress <= p.trial.turn * 3
  );
}

/** Inner compartments preserve ordinary alchemy herbs; no effect on breakthrough resources. */
export function preservedHerbSaving(
  p: Pick<ItemGrowth, "ring"> | undefined,
  product: string,
  method: string,
) {
  return p?.ring === 2 &&
    method !== "buy" &&
    ["healing", "clarity", "spirit", "ward"].includes(product)
    ? 1
    : 0;
}
