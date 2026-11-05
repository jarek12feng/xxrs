import type { State } from "../world";
export type ReunionApproach = "ward" | "survey" | "edge";
export type ReunionStage =
  | "none"
  | "invited"
  | "met"
  | "planned"
  | "anchored"
  | "resolved"
  | "shared"
  | "departed";
export interface Reunion {
  stage: ReunionStage;
  approach: ReunionApproach | null;
  sharing: "public" | "private" | null;
  metAt: number | null;
  departedAt: number | null;
  mistakes: number;
  last: string;
}
export const freshReunion = (): Reunion => ({
  stage: "none",
  approach: null,
  sharing: null,
  metAt: null,
  departedAt: null,
  mistakes: 0,
  last: "",
});
const stages: ReunionStage[] = [
  "none",
  "invited",
  "met",
  "planned",
  "anchored",
  "resolved",
  "shared",
  "departed",
];
export function validReunion(s: State): boolean {
  const r = s.goldenStory?.reunion;
  if (
    !r ||
    !stages.includes(r.stage) ||
    ![null, "ward", "survey", "edge"].includes(r.approach) ||
    ![null, "public", "private"].includes(r.sharing) ||
    !Number.isSafeInteger(r.mistakes) ||
    r.mistakes < 0 ||
    r.mistakes > 100 ||
    typeof r.last !== "string" ||
    r.last.length > 2000
  )
    return false;
  const n = stages.indexOf(r.stage);
  const date = (v: unknown) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= s.month;
  if (n === 0) return JSON.stringify(r) === JSON.stringify(freshReunion());
  const g = s.goldenStory;
  if (
    s.realm < 2 ||
    s.social.gender !== "male" ||
    g.companionGoldenAt === null ||
    g.companionConfirmedAt === null ||
    !g.companionLetters.includes(4)
  )
    return false;
  if (
    n < 2
      ? r.metAt !== null
      : !date(r.metAt) ||
        r.metAt! < g.companionConfirmedAt ||
        288 + r.metAt! - s.social.metMonth! >= 6000
  )
    return false;
  if (n >= 3 !== (r.approach !== null) || n >= 6 !== (r.sharing !== null))
    return false;
  if (n < 3 && r.mistakes !== 0) return false;
  if (
    n < 7
      ? r.departedAt !== null
      : !date(r.departedAt) ||
        r.departedAt! < r.metAt! ||
        288 + r.departedAt! - s.social.metMonth! >= 6000
  )
    return false;
  return true;
}
