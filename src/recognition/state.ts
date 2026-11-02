export type Office = 0 | 1 | 2;
export type Affiliation = "none" | "dan" | "jian";
export type DeedTier = 0 | 1 | 2;
export type Method = "supplies" | "skill";
export interface Recognition {
  innerMonth: number | null;
  office: Office;
  affiliation: Affiliation;
  deferred: boolean;
  appointments: { tier: 1 | 2; affiliation: Affiliation; month: number }[];
  deeds: {
    tier: DeedTier;
    method: Method;
    affiliation: Affiliation;
    month: number;
  }[];
  last: string;
}
export const freshRecognition = (): Recognition => ({
  innerMonth: null,
  office: 0,
  affiliation: "none",
  deferred: false,
  appointments: [],
  deeds: [],
  last: "",
});
export function validRecognition(
  r: Recognition,
  month: number,
  realm: number,
  branch: Affiliation,
) {
  const time = (n: unknown) =>
    Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= month;
  return (
    !!r &&
    [0, 1, 2].includes(r.office) &&
    ["none", "dan", "jian"].includes(r.affiliation) &&
    typeof r.deferred === "boolean" &&
    typeof r.last === "string" &&
    r.last.length <= 2000 &&
    (r.innerMonth === null ||
      (realm === 1 && branch !== "none" && time(r.innerMonth))) &&
    Array.isArray(r.appointments) &&
    r.appointments.length <= 4 &&
    r.appointments.every(
      (a) =>
        !!a &&
        [1, 2].includes(a.tier) &&
        ["none", "dan", "jian"].includes(a.affiliation) &&
        time(a.month),
    ) &&
    new Set(r.appointments.map((a) => `${a.affiliation}:${a.tier}`)).size ===
      r.appointments.length &&
    (!r.office ||
      r.appointments.some(
        (a) => a.tier === r.office && a.affiliation === r.affiliation,
      )) &&
    (!r.appointments.some((a) => a.tier === 2) || realm === 1) &&
    Array.isArray(r.deeds) &&
    r.deeds.length <= 3 &&
    r.deeds.every(
      (d) =>
        !!d &&
        [0, 1, 2].includes(d.tier) &&
        ["supplies", "skill"].includes(d.method) &&
        ["none", "dan", "jian"].includes(d.affiliation) &&
        time(d.month),
    ) &&
    new Set(r.deeds.map((d) => d.tier)).size === r.deeds.length &&
    (!r.deeds.some((d) => d.tier >= 1) || realm === 1) &&
    (!r.deeds.some((d) => d.tier === 2) ||
      r.appointments.some((a) => a.tier === 2))
  );
}
