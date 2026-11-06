export type EstateJob = "medicine" | "escort";
export interface EstateLife {
  work: null | { kind: EstateJob; progress: number; strain: number };
  completed: Record<EstateJob, number>;
  availableAt: Record<EstateJob, number>;
  packing: boolean;
  last: string;
}
export const freshEstateLife = (): EstateLife => ({
  work: null,
  completed: { medicine: 0, escort: 0 },
  availableAt: { medicine: 0, escort: 0 },
  packing: false,
  last: "",
});
export function validEstateLife(x: unknown): x is EstateLife {
  if (!x || typeof x !== "object") return false;
  const v = x as EstateLife;
  const integer = (n: unknown, max = 1e9) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
  if (
    !v.completed ||
    !v.availableAt ||
    !["medicine", "escort"].every(
      (k) =>
        integer(v.completed[k as EstateJob]) &&
        integer(v.availableAt[k as EstateJob]),
    ) ||
    typeof v.packing !== "boolean" ||
    typeof v.last !== "string" ||
    v.last.length > 1000
  )
    return false;
  if (v.packing && !v.completed.medicine && !v.completed.escort) return false;
  return (
    v.work === null ||
    (!!v.work &&
      ["medicine", "escort"].includes(v.work.kind) &&
      integer(v.work.progress, v.work.kind === "medicine" ? 4 : 3) &&
      integer(v.work.strain, 4))
  );
}
