export type SpiritSource = "well" | "tide";
export type SpiritMove = "discern" | "guard" | "reach";
export interface SpiritState {
  manual: "none" | "found" | "learned";
  jade: "none" | "found" | "refined";
  trauma: number;
  trial: { source: SpiritSource; turn: number; stability: number; energy: number; progress: number } | null;
  last: string;
}
export const freshSpirit = (): SpiritState => ({ manual: "none", jade: "none", trauma: 0, trial: null, last: "" });
export function validSpiritData(value: unknown): value is SpiritState {
  if (!value || typeof value !== "object") return false;
  const p = value as SpiritState;
  const int = (x: unknown, max: number) => Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
  if (!["none", "found", "learned"].includes(p.manual) || !["none", "found", "refined"].includes(p.jade) || !int(p.trauma, 3) || typeof p.last !== "string" || p.last.length > 2000) return false;
  if (p.trial === null) return true;
  const t = p.trial;
  return !!t && ["well", "tide"].includes(t.source) && int(t.turn, 3) && int(t.stability, 12) && t.stability > 0 && int(t.energy, 12) && int(t.progress, 9) && (t.source === "well" ? p.manual === "none" : p.jade === "none");
}
