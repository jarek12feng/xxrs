/** Shared pure cultivation rules; optional fields also support the first-volume core. */
export interface Cultivator {
  realm: number;
  qi: number;
  age: number;
  limit: number;
  root: number;
  path: string;
  status: string;
  journey?: { main: string | null };
  growth?: { training: Record<string, number> };
  foundationJourney?: {
    cultivation: number;
    inheritance: string;
    rescue: number;
  };
}
export const minorStageNames = ["前期", "中期", "后期", "圆满"] as const;
export function cultivationStageIndex(s: Cultivator): 0 | 1 | 2 | 3 {
  return Math.min(
    3,
    Math.floor(
      (s.realm === 1 ? (s.foundationJourney?.cultivation ?? 0) : s.qi) /
        (s.realm === 1 ? 200 : 120),
    ),
  ) as 0 | 1 | 2 | 3;
}
export function realmStageLabel(s: Cultivator) {
  return `${s.realm === 1 ? "筑基" : "炼气"}${minorStageNames[cultivationStageIndex(s)]}`;
}
export const remainingLifeMonths = (s: Pick<Cultivator, "age" | "limit">) =>
  Math.max(0, s.limit - s.age);
export function formatLifeMonths(months: number) {
  const n = Math.max(0, Math.floor(months));
  return n >= 12
    ? `${Math.floor(n / 12)} 年${n % 12 ? ` ${n % 12} 月` : ""}`
    : `${n} 月`;
}
/** The last twenty years gradually reduce meditation efficiency to one quarter. */
export function lifeEfficiency(s: Pick<Cultivator, "age" | "limit">) {
  const left = remainingLifeMonths(s);
  return left === 0 ? 0 : 0.25 + 0.75 * Math.min(1, left / 240);
}
export function cultivationBaseGain(s: Cultivator) {
  const main = s.journey?.main;
  const training = main ? (s.growth?.training[main] ?? 0) : 0;
  if (s.realm === 1)
    return (
      2 +
      (s.root >= 8 ? 1 : 0) +
      (training >= 2 ? 1 : 0) +
      (main && s.foundationJourney?.inheritance === main ? 1 : 0) +
      ((s.foundationJourney?.rescue ?? 0) >= 3 ? 1 : 0)
    );
  return (
    (s.path === "wood" ? 10 : 14) +
    Math.max(0, s.root - 4) +
    (main === "spring" ? 3 : 0) +
    training * 2
  );
}
/** Reward at an already advanced month. Death always precedes its reward. */
export function cultivationGainAtAge(s: Cultivator) {
  if (s.status !== "alive" || remainingLifeMonths(s) === 0) return 0;
  return Math.max(1, Math.round(cultivationBaseGain(s) * lifeEfficiency(s)));
}
export const cultivationMonthlyGain = (s: Cultivator) =>
  (s.realm === 1 ? (s.foundationJourney?.cultivation ?? 0) >= 600 : s.qi >= 360)
    ? 0
    : cultivationGainAtAge({ ...s, age: s.age + 1 });
/** Ignores narrative interruptions; reports the maximum safe batch, not a promise to skip events. */
export function cultivationProjection(s: Cultivator, requestedTarget?: number) {
  const current =
    s.realm === 1 ? (s.foundationJourney?.cultivation ?? 0) : s.qi;
  const cap = s.realm === 1 ? 600 : 360;
  const step = s.realm === 1 ? 200 : 120;
  const target = Math.max(
    current,
    Math.min(cap, requestedTarget ?? (cultivationStageIndex(s) + 1) * step),
  );
  const missing = target - current;
  const remainingMonths = remainingLifeMonths(s);
  let gain = 0,
    elapsed = 0,
    batchGain = 0,
    batchMonths = 0;
  while (
    gain < missing &&
    elapsed + 1 < remainingMonths &&
    s.status === "alive"
  ) {
    elapsed++;
    gain += Math.min(
      cap - current - gain,
      cultivationGainAtAge({ ...s, age: s.age + elapsed }),
    );
    if (elapsed <= 12) {
      batchGain = gain;
      batchMonths = elapsed;
    }
  }
  const monthsToTarget = gain >= missing ? elapsed : null;
  return {
    current,
    target,
    missing,
    monthlyGain: cultivationMonthlyGain(s),
    efficiency: lifeEfficiency({ ...s, age: s.age + 1 }),
    monthsToTarget,
    batchMonths,
    batchGain,
    remainingMonths,
    remainingAfterTarget:
      monthsToTarget === null ? null : remainingMonths - monthsToTarget,
  };
}
