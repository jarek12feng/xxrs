import {
  foundationCap,
  hasSteady,
  type FoundationProgress,
} from "./foundation-journey/growth-state";
import { qiCap, type QiJourney } from "./qi-journey/state";
/** Shared pure cultivation rules; optional fields also support the first-volume core. */
export interface Cultivator {
  realm: number;
  outerSea?: { cultivation: number; method: string };
  cultivationRemainder?: number;
  qiJourney?: QiJourney;
  qi: number;
  age: number;
  limit: number;
  root: number;
  path: string;
  status: string;
  journey?: {
    main: string | null;
    equipped?: string | null;
    relics?: Record<string, number>;
  };
  growth?: { training: Record<string, number> };
  foundationJourney?: FoundationProgress & {
    cultivation: number;
    inheritance: string;
    rescue: number;
  };
}
export const minorStageNames = ["前期", "中期", "后期", "圆满"] as const;
export function cultivationStageIndex(s: Cultivator): 0 | 1 | 2 | 3 {
  if (s.realm === 2) return 0;
  return Math.min(
    3,
    Math.floor(
      (s.realm === 1 ? (s.foundationJourney?.cultivation ?? 0) : s.qi) /
        (s.realm === 1 ? 200 : 120),
    ),
  ) as 0 | 1 | 2 | 3;
}
export function realmStageLabel(s: Cultivator) {
  return `${s.realm === 2 ? "金丹" : s.realm === 1 ? "筑基" : "炼气"}${minorStageNames[cultivationStageIndex(s)]}`;
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
  if (s.realm === 2)
    return (
      3 +
      (training >= 2 ? 1 : 0) +
      (s.outerSea?.method && s.outerSea.method !== "none" ? 2 : 0)
    );
  if (s.realm === 1)
    return (
      2 +
      (s.root >= 8 ? 1 : 0) +
      (training >= 2 ? 1 : 0) +
      (main && s.foundationJourney?.inheritance === main ? 1 : 0) +
      (s.foundationJourney && hasSteady(s.foundationJourney) ? 1 : 0) +
      (s.journey?.equipped && (s.journey.relics?.[s.journey.equipped] ?? 0) >= 2
        ? 1
        : 0)
    );
  return (
    (s.journey ? 10 : s.path === "wood" ? 10 : 14) +
    Math.max(0, s.root - 4) +
    (main === "spring" ? 3 : 0) +
    training * 2
  );
}
/** Integer fractional progress is saved, so pausing, switching activities or loading never loses effort. */
export function cultivationMonth(s: Cultivator) {
  const remainder = s.cultivationRemainder ?? 0;
  if (s.status !== "alive" || remainingLifeMonths(s) === 0)
    return { gain: 0, remainder };
  // A full point takes sustained practice. Main training, root and earned methods shorten it.
  const units = Math.max(
    1,
    Math.round(
      cultivationBaseGain(s) *
        lifeEfficiency(s) *
        (s.realm === 2 ? 12 : s.realm === 1 ? 24 : s.qi < 180 ? 240 : 60),
    ),
  );
  const total = remainder + units;
  return { gain: Math.floor(total / 240), remainder: total % 240 };
}
/** Reward at an already advanced month. Death always precedes its reward. */
export function cultivationGainAtAge(s: Cultivator) {
  return cultivationMonth(s).gain;
}
export const cultivationMonthlyGain = (s: Cultivator) =>
  (
    s.realm === 2
      ? (s.outerSea?.cultivation ?? 0) >= 299
      : s.realm === 1
        ? (s.foundationJourney?.cultivation ?? 0) >= foundationCap(s)
        : s.qi >= qiCap(s)
  )
    ? 0
    : cultivationGainAtAge({ ...s, age: s.age + 1 });
/** Ignores narrative interruptions; reports the maximum safe batch, not a promise to skip events. */
export function cultivationProjection(
  s: Cultivator,
  requestedTarget?: number,
  batchLimit = 12,
) {
  const current =
    s.realm === 2
      ? (s.outerSea?.cultivation ?? 0)
      : s.realm === 1
        ? (s.foundationJourney?.cultivation ?? 0)
        : s.qi;
  const cap = s.realm === 2 ? 299 : s.realm === 1 ? foundationCap(s) : qiCap(s);
  const step = s.realm === 2 ? 300 : s.realm === 1 ? 200 : 120;
  const target = Math.max(
    current,
    Math.min(cap, requestedTarget ?? (cultivationStageIndex(s) + 1) * step),
  );
  const missing = target - current;
  const remainingMonths = remainingLifeMonths(s);
  let gain = 0,
    elapsed = 0,
    batchGain = 0,
    batchMonths = 0,
    remainder = s.cultivationRemainder ?? 0;
  while (
    gain < missing &&
    elapsed + 1 < remainingMonths &&
    s.status === "alive"
  ) {
    elapsed++;
    const month = cultivationMonth({
      ...s,
      qi: s.realm ? s.qi : current + gain,
      age: s.age + elapsed,
      cultivationRemainder: remainder,
    });
    remainder = month.remainder;
    gain += Math.min(cap - current - gain, month.gain);
    if (elapsed <= batchLimit) {
      batchGain = gain;
      batchMonths = elapsed;
    }
  }
  const monthsToTarget = gain >= missing ? elapsed : null;
  return {
    current,
    bottleneck: cap < (s.realm === 2 ? 900 : s.realm === 1 ? 600 : 360),
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

/** Incidental practice cannot outgrow dedicated meditation after the first bottleneck. */
export function incidentalQiGain(s: Cultivator, activity: string) {
  if (s.realm) return 0;
  const main = s.journey?.main;
  const training = main ? (s.growth?.training[main] ?? 0) : 0;
  const base =
    activity === "train"
      ? 10 + (main === "blade" ? 4 : 0) + training * 2
      : activity === "work"
        ? (main === "breath" ? 4 : 0) + training * 2
        : activity === "gather"
          ? 3
          : activity === "meditate"
            ? 2
            : 0;
  return s.qi < 180
    ? base
    : activity === "train"
      ? Math.ceil(base / 3)
      : Math.min(1, base);
}
