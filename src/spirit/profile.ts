import type { SpiritState } from "./state";
export interface SpiritContext { sense: number; spirit?: SpiritState; conclave?: { attuned: boolean } }
/** Initial nascent range stays unchanged; long-term growth is separate work. */
export function senseLimit(realm: number, spirit?: SpiritState) {
  const base = realm >= 2 ? 48 : realm === 1 ? 24 : 12;
  return base + (realm >= 1 && spirit?.manual === "learned" ? 6 : 0) + (realm >= 2 && spirit?.jade === "refined" ? 6 : 0);
}
export const combatSense = (sense: number) => Math.min(12, sense);
/** Both breakthroughs still leave a choice: all available items cost 24. */
export const controlCapacity = (sense: number) => Math.min(22, 4 + Math.floor(sense / 3));
export function spiritReadiness(s: SpiritContext) {
  const effectiveSense = Math.max(0, s.sense - (s.spirit?.trauma ?? 0) * 3);
  const resistance = Math.min(2, Number(s.spirit?.manual === "learned") + Number(s.spirit?.jade === "refined") + Number(!!s.conclave?.attuned));
  return {
    effectiveSense,
    trialMind: 18 + Math.min(8, Math.floor(Math.max(0, effectiveSense - 12) / 6)),
    breakthroughBonus: Math.min(4, Math.floor(Math.max(0, effectiveSense - 12) / 12)),
    resistance,
  };
}
/** Permanent cultivation and legal equipment capacity never decrease when injured. */
export function injureSpirit(s: { spirit?: SpiritState }, severity = 1) {
  if (s.spirit) s.spirit.trauma = Math.min(3, s.spirit.trauma + Math.max(0, Math.floor(severity)));
}
export function restoreSpirit(s: { spirit?: SpiritState }, amount: number) {
  const healed = Math.min(s.spirit?.trauma ?? 0, Math.max(0, Math.floor(amount)));
  if (s.spirit) s.spirit.trauma -= healed;
  return healed;
}
