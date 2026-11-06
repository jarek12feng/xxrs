export type Undertaking =
  "circulation" | "alchemy" | "relic" | "herb" | "herbs" | "watch" | "copy";
export interface QiCultivation {
  middle: boolean;
  relic: boolean;
  roots: number;
  work: null | {
    kind: Undertaking;
    vigor: number;
    progress: number;
    pressure: number;
    prepared: boolean;
    turn: number;
  };
  last: string;
}
export const freshQiCultivation = (): QiCultivation => ({
  middle: false,
  relic: false,
  roots: 0,
  work: null,
  last: "",
});
export function validQiCultivation(x: unknown): x is QiCultivation {
  if (!x || typeof x !== "object") return false;
  const p = x as QiCultivation,
    w = p.work;
  const int = (v: number, max: number) =>
    Number.isSafeInteger(v) && v >= 0 && v <= max;
  return (
    typeof p.relic === "boolean" &&
    typeof p.middle === "boolean" &&
    int(p.roots, 99) &&
    typeof p.last === "string" &&
    p.last.length <= 3000 &&
    (w === null ||
      (!!w &&
        [
          "circulation",
          "alchemy",
          "relic",
          "herb",
          "herbs",
          "watch",
          "copy",
        ].includes(w.kind) &&
        int(w.vigor, 12) &&
        w.vigor > 0 &&
        int(
          w.progress,
          w.kind === "circulation" || w.kind === "relic" ? 5 : 2,
        ) &&
        int(w.pressure, ["herbs", "watch", "copy"].includes(w.kind) ? 2 : 4) &&
        typeof w.prepared === "boolean" &&
        int(w.turn, 29)))
  );
}
