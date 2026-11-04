import { limitBySchedule } from "./timeline";
import { seaSchedule } from "./outer-sea/calendar";
import {
  cultivationProjection,
  cultivationStageIndex,
  type Cultivator,
} from "./progression";

export type RetreatPace = "short" | "regular" | "long";
/** Player-facing durations only. The world clock and fractional gains remain monthly. */
export function retreatDurations(
  s: Cultivator,
): { pace: RetreatPace; label: string; months: number }[] {
  if (s.realm < 0 || s.realm > 2) return [];
  const early = cultivationStageIndex(s) === 0;
  const months =
    s.realm === 2
      ? [12, 60, 120]
      : s.realm === 0
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
  const schedule = limitBySchedule(s.month ?? 0, duration?.months ?? 0, s.realm === 2 && s.month !== undefined ? seaSchedule(s) : []);
  const limit = schedule.months;
  const forecast = cultivationProjection(s, target, limit);
  return {
    ...forecast,
    duration: duration?.months ?? 0,
    stopsForMeeting: !!schedule.event && forecast.batchMonths === schedule.months,
    exitAge: s.age + forecast.batchMonths,
    remainingAtExit: forecast.remainingMonths - forecast.batchMonths,
    reachesTarget:
      forecast.monthsToTarget !== null &&
      forecast.batchMonths >= forecast.monthsToTarget,
  };
}
