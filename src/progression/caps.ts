import { pactTrialComplete, type SecretPact } from "../secret-pact/state";
import type { FoundationProgress } from "../foundation-journey/growth-state";
export function qiCap(s: { realm: number; qiJourney?: { gates: number; cultivation?: {middle:boolean} } }) {
  if(!s.realm && s.qiJourney?.cultivation && !s.qiJourney.cultivation.middle)return 119;
  return s.realm || !s.qiJourney || s.qiJourney.gates === 2
    ? 360
    : s.qiJourney.gates === 0
      ? 239
      : 359;
}
export function foundationCap(s: { foundationJourney?: FoundationProgress; secretPact?: SecretPact }) {
  const q = s.foundationJourney;
  if (!q?.won?.includes("application")) return 199;
  if (!q.growth?.refined) return 399;
  // Preserve already-earned old progress without fabricating the new trial.
  if (s.secretPact && !pactTrialComplete(s.secretPact)) return Math.max(399, Math.min(600, q.cultivation));
  if (!q.won.includes("culmination")) return 599;
  return 600;
}
export const hasSteady = (q: FoundationProgress) =>
  q.rescue >= 3 || (!!q.growth && q.growth.steady !== "none");
export const goldenCap = (s: { conclave?: { stage: number } }) =>
  [299, 599, 899, 1200][s.conclave?.stage ?? 0] ?? 299;
