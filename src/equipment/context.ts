import type { SpiritState } from "../spirit";
import type { Relic, Treasure } from "./catalog";
/** Structural view over the existing save. No dependency on the world or chapter modules. */
export interface EquipmentContext {
  realm: number;
  sense: number;
  spirit?: SpiritState;
  qi: number;
  journey: { equipped: Relic | null; relics: Record<Relic, number> };
  workshop: {
    temper: {
      sword: "plain" | "keen" | "array";
      vial: "plain" | "shell" | "flow";
    };
  };
  treasures: {
    equipped: Treasure[];
    artifacts: ("tideSeal" | "spiritPearl")[];
    owned: Record<Treasure, number>;
  };
  outerSea?: { attuned: boolean; seal: boolean };
  conclave?: { attuned: boolean; depth: number };
}
/** Also accepts the first-volume cultivation view, which has no equipment yet. */
export interface RelicContext {
  journey?: { equipped?: string | null; relics?: Record<string, number> };
}
export function equippedRelicRank(s: RelicContext) {
  const id = s.journey?.equipped;
  return id ? (s.journey?.relics?.[id] ?? 0) : 0;
}
export function hasEquippedRelic(s: RelicContext, minimumRank = 1, id?: Relic) {
  return (
    (!id || s.journey?.equipped === id) && equippedRelicRank(s) >= minimumRank
  );
}
