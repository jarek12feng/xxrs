import { validLegacyMaterialPractice } from './legacy-material-practice';
import { validMaterialPractice } from './material-practice';
import { validSpiritPractice } from "./spirit-practice";
import { freshReunion, type Reunion } from "../golden-reunion/state";
import { companionChronology } from "./companion";
import type { State } from "../world";
export type TeachingTopic = "method" | "spirit" | "pill" | "ground";
export type RubbingRecipient =
  "chengyuan" | "hengxuan" | "zhaoshuang" | "retain";
import type { TeachingPractice, TeachingResult } from "./teaching";
export interface GoldenStory {
  reunion: Reunion;
  practice: TeachingPractice | null;
  teachingPracticeResults: TeachingResult[];
  direction: "none" | "sect" | "independent";
  observations: ("gauge" | "flow")[];
  duty: "none" | "ward" | "survey";
  tideComplete: boolean;
  oldRecord: boolean;
  teachings: TeachingTopic[];
  teachingSources: ("seat" | "public")[];
  rubbings: RubbingRecipient[];
  companionLetters: number[];
  companionGoldenAt: number | null;
  companionConfirmedAt: number | null;
  last: string;
}
export const freshGoldenStory = (): GoldenStory => ({
  reunion: freshReunion(),
  practice: null,
  teachingPracticeResults: [],
  direction: "none",
  observations: [],
  duty: "none",
  tideComplete: false,
  oldRecord: false,
  teachings: [],
  teachingSources: [],
  rubbings: [],
  companionLetters: [],
  companionGoldenAt: null,
  companionConfirmedAt: null,
  last: "",
});
const unique = (v: unknown, allowed: readonly unknown[], max: number) =>
  Array.isArray(v) &&
  v.length <= max &&
  new Set(v).size === v.length &&
  v.every((x) => allowed.includes(x));
export function validGoldenStory(s: State, legacy = false, legacyMaterial = false): boolean {
  const g = s.goldenStory;
  if (
    !g ||
    !["none", "sect", "independent"].includes(g.direction) ||
    !unique(g.observations, ["gauge", "flow"], 2) ||
    !["none", "ward", "survey"].includes(g.duty) ||
    typeof g.tideComplete !== "boolean" ||
    typeof g.oldRecord !== "boolean" ||
    !unique(g.teachings, ["method", "spirit", "pill", "ground"], 4) ||
    !Array.isArray(g.teachingSources) ||
    g.teachingSources.length !== g.teachings.length ||
    !g.teachingSources.every((x) => ["seat", "public"].includes(x)) ||
    !unique(g.rubbings, ["chengyuan", "hengxuan", "zhaoshuang", "retain"], 2) ||
    !unique(g.companionLetters, [0, 1, 2, 3, 4, 5, 6], 7) ||
    typeof g.last !== "string" ||
    g.last.length > 2000
  )
    return false;
  if (!(
    legacy &&
    g.practice === undefined &&
    g.teachingPracticeResults === undefined
  )) {
    const p = g.practice;
    if (
      !Array.isArray(g.teachingPracticeResults) ||
      g.teachingPracticeResults.length > 4 ||
      new Set(g.teachingPracticeResults.map((r) => r?.topic)).size !==
        g.teachingPracticeResults.length ||
      g.teachingPracticeResults.some(
        (r) =>
          !r ||
          !g.teachings.includes(r.topic) ||
          !Number.isSafeInteger(r.errors) ||
          r.errors < 0 ||
          r.errors > 999,
      )
    )
      return false;
    if (
      p !== null &&
      (!p ||
        !["method", "spirit", "pill", "ground"].includes(p.topic) ||
        g.teachings.includes(p.topic) ||
        !["seat", "public"].includes(p.source) ||
        ![0, 1].includes(p.step) ||
        !Number.isSafeInteger(p.errors) ||
        p.errors < 0 ||
        p.errors > 999 ||
        typeof p.feedback !== "string" ||
        p.feedback.length > 2000 ||
        !s.outerSea.met ||
        (p.material !== undefined && (!(legacyMaterial ? validLegacyMaterialPractice(p.material) : validMaterialPractice(p.material)) || p.material.topic !== p.topic)) ||
        (p.spirit !== undefined && (p.topic !== "spirit" || !validSpiritPractice(p.spirit))))
    )
      return false;
  }
  if (s.realm < 2) {
    const normalized = { ...freshGoldenStory(), ...g };
    return JSON.stringify(normalized) === JSON.stringify(freshGoldenStory());
  }
  if (g.tideComplete && (g.observations.length !== 2 || g.duty === "none"))
    return false;
  if ((g.observations.length || g.duty !== "none") && !s.outerSea.met)
    return false;
  if (g.oldRecord && s.outerSea.cleared < 2) return false;
  if (g.rubbings.length && s.conclave.depth !== 2) return false;
  if (g.teachings.length && !s.outerSea.met) return false;
  const time = companionChronology(s);
  const int = (n: unknown) =>
    Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= s.month;
  if (g.companionGoldenAt !== null || g.companionConfirmedAt !== null) {
    if (
      !time ||
      !int(g.companionGoldenAt) ||
      !int(g.companionConfirmedAt) ||
      g.companionGoldenAt === null ||
      g.companionConfirmedAt === null ||
      g.companionGoldenAt > g.companionConfirmedAt ||
      g.companionGoldenAt !== time.goldenAt ||
      !g.companionLetters.includes(4)
    )
      return false;
    const baseAge = (s.social.gender === "male" ? 24 : 26) * 12;
    if (baseAge + g.companionConfirmedAt - time.met >= 6000) return false;
  } else if (g.companionLetters.includes(4)) return false;
  if (g.companionLetters.length) {
    if (!time) return false;
    for (const id of g.companionLetters) {
      if (
        (id === 5 &&
          (time.goldenAt === null || s.month < time.goldenAt - 240)) ||
        (id === 6 && (time.goldenAt === null || s.month < time.goldenAt - 120))
      )
        return false;
      if (
        (id === 1 && time.elapsed < 120) ||
        (id === 2 && time.elapsed < 600) ||
        (id === 3 && time.age < 2400) ||
        (id === 4 && (time.goldenAt === null || s.month < time.goldenAt))
      )
        return false;
    }
  }
  return true;
}
