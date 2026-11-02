import {
  cultivationProjection,
  cultivationStageIndex,
  type Cultivator,
} from "./cultivation";

export type RetreatPace = "short" | "regular" | "long";
/** Player-facing durations only. The world clock and fractional gains remain monthly. */
export function retreatDurations(
  s: Cultivator,
): { pace: RetreatPace; label: string; months: number }[] {
  if (s.realm !== 0 && s.realm !== 1) return [];
  const early = cultivationStageIndex(s) === 0;
  const months =
    s.realm === 0
      ? early
        ? [1, 3, 6]
        : [3, 12, 36]
      : early
        ? [6, 24, 60]
        : [12, 36, 120];
  return (["short", "regular", "long"] as const).map((pace, i) => ({
    pace,
    label: ["短修", "常规闭关", early && s.realm === 0 ? "潜心修行" : "长关"][
      i
    ]!,
    months: months[i]!,
  }));
}
export function retreatPlan(
  s: Cultivator,
  pace: RetreatPace = "regular",
  target?: number,
) {
  const duration = retreatDurations(s).find((x) => x.pace === pace);
  const forecast = cultivationProjection(s, target, duration?.months ?? 0);
  return {
    ...forecast,
    duration: duration?.months ?? 0,
    exitAge: s.age + forecast.batchMonths,
    remainingAtExit: forecast.remainingMonths - forecast.batchMonths,
    reachesTarget:
      forecast.monthsToTarget !== null &&
      forecast.batchMonths >= forecast.monthsToTarget,
  };
}
