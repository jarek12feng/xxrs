import type { State } from "./world";
import { roadScenes, roadClues, type Road } from "./road";
type LegacyRoad = Omit<Road, "solution" | "prepared">;
const freshLegacyRoad = (): LegacyRoad => ({
  stage: "home",
  thanked: false,
  met: false,
  commission: false,
  map: false,
  obstacle: "none",
  route: "none",
  ally: false,
  attempts: 0,
  roll: 0,
  chance: 0,
  passed: false,
  surveyed: false,
  result: "",
  discoveries: [],
  lastApproach: "direct",
});
function validRoadProgress(r: LegacyRoad, s: State): boolean {
  if (s.adventure.step !== "done") {
    const { discoveries: _, lastApproach: __, ...initial } = freshLegacyRoad();
    return (
      !!r &&
      (Object.keys(initial) as (keyof typeof initial)[]).every(
        (k) => r[k] === initial[k],
      )
    );
  }
  const int = (x: unknown, max = 1e9) =>
    Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
  return (
    !!r &&
    Object.hasOwn(roadScenes, r.stage) &&
    ["thanked", "met", "commission", "map", "ally", "passed", "surveyed"].every(
      (k) => typeof r[k as keyof LegacyRoad] === "boolean",
    ) &&
    ["none", "mist", "gale"].includes(r.obstacle) &&
    ["none", "art", "relic", "friend"].includes(r.route) &&
    int(r.attempts) &&
    int(r.roll, 100) &&
    int(r.chance, 100) &&
    typeof r.result === "string" &&
    r.result.length < 1500 &&
    (!r.met || (r.thanked && r.stage !== "home")) &&
    (!r.commission || r.met) &&
    (!r.map || r.commission) &&
    (!r.ally || r.map) &&
    (r.route === "none" || r.map) &&
    (!r.thanked || s.adventure.step === "done") &&
    (r.stage === "home" || r.thanked) &&
    (!["pass", "camp", "beyond", "lookout"].includes(r.stage) || r.map) &&
    (r.obstacle === "none" ? r.attempts === 0 : r.map) &&
    (r.attempts === 0
      ? r.roll === 0 && r.chance === 0
      : r.roll >= 1 &&
        r.chance >= 5 &&
        r.route !== "none" &&
        (r.passed || r.roll > r.chance)) &&
    (!r.passed || (s.realm === 1 && r.attempts > 0 && r.roll <= r.chance)) &&
    (!["beyond", "lookout"].includes(r.stage) || r.passed) &&
    (!r.surveyed || r.passed)
  );
}
export function validRoadV9(r: LegacyRoad, s: State): boolean {
  return (
    validRoadProgress(r, s) &&
    Array.isArray(r.discoveries) &&
    r.discoveries.length <= 3 &&
    r.discoveries.every(
      (k) => typeof k === "string" && Object.hasOwn(roadClues, k),
    ) &&
    new Set(r.discoveries).size === r.discoveries.length &&
    ["direct", "sheltered"].includes(r.lastApproach) &&
    (!r.discoveries.includes("ledger") || r.met) &&
    (!r.discoveries.includes("marks") || r.obstacle !== "none") &&
    (!r.discoveries.includes("names") || r.passed) &&
    (r.lastApproach === "direct" ||
      (r.attempts > 0 &&
        r.discoveries.includes("ledger") &&
        r.discoveries.includes("marks"))) &&
    (s.adventure.step === "done" ||
      (r.discoveries.length === 0 && r.lastApproach === "direct"))
  );
}
