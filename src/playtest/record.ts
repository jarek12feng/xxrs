import type { State } from "../world";
export interface PlaytestEntry {
  at: string;
  elapsedMs: number;
  kind: string;
  month: number | null;
  stage: string;
}
export interface PlaytestRecord {
  schema: 1;
  build: string;
  startedAt: string;
  startingPoint: "new-character" | "existing-save";
  entries: PlaytestEntry[];
  truncated: boolean;
}
export function stage(s: State | null) {
  if (!s) return "建角前";
  if (s.foundationJourney.epilogue) return "筑基篇完成";
  if (s.foundationJourney.won.includes("culmination")) return "圆满试炼完成";
  if (s.foundationJourney.condensation) return "周天贯流";
  if (s.foundationJourney.rescue)
    return `古道接应 ${s.foundationJourney.rescue}/4`;
  if (s.foundationJourney.ferry) return `无名渡 ${s.foundationJourney.ferry}/4`;
  return s.realm
    ? "筑基初行"
    : s.adventure.step === "done"
      ? "炼气修行"
      : "入山营救";
}
export function startRecord(
  build: string,
  s: State | null,
  now: number,
): PlaytestRecord {
  return {
    schema: 1,
    build,
    startedAt: new Date(now).toISOString(),
    startingPoint: s ? "existing-save" : "new-character",
    entries: [],
    truncated: false,
  };
}
export function appendRecord(
  r: PlaytestRecord,
  kind: string,
  s: State | null,
  now: number,
) {
  if (r.entries.length >= 5000) {
    r.truncated = true;
    return;
  }
  r.entries.push({
    at: new Date(now).toISOString(),
    elapsedMs: Math.max(0, now - Date.parse(r.startedAt)),
    kind,
    month: s?.month ?? null,
    stage: stage(s),
  });
}
export function milestones(before: State | null, after: State) {
  if (!before) return ["建角完成"];
  const result: string[] = [];
  if (after.journey.known.length > before.journey.known.length)
    result.push("获得功法");
  if (after.journey.main !== before.journey.main && after.journey.main)
    result.push("装配主修");
  if (
    after.journey.equipped !== before.journey.equipped &&
    after.journey.equipped
  )
    result.push("装配灵器");
  if (after.realm > before.realm) result.push("突破筑基");
  if (after.expedition.cleared > before.expedition.cleared)
    result.push("护送关卡完成");
  if (after.foundationJourney.won.length > before.foundationJourney.won.length)
    result.push("筑基挑战首胜");
  if (after.injury > before.injury) result.push("伤势增加");
  if (after.injury < before.injury) result.push("恢复伤势");
  if (stage(after) !== stage(before)) result.push(stage(after));
  return result;
}
