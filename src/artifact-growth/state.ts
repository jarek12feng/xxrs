import type { BattleState } from "../combat";
export interface ArtifactGrowth {
  heard: boolean;
  blade: "none" | "embryo" | "attuned";
  proven: boolean;
  seal: boolean;
  pearl: boolean;
  duel:
    | (BattleState & {
        kind: "claim" | "proof";
        broken: boolean;
        effect: string;
        preparation: "sense" | "herbs";
      })
    | null;
  last: string;
}
export const freshArtifactGrowth = (): ArtifactGrowth => ({
  heard: false,
  blade: "none",
  proven: false,
  seal: false,
  pearl: false,
  duel: null,
  last: "",
});
export function validArtifactGrowth(x: unknown): x is ArtifactGrowth {
  if (!x || typeof x !== "object") return false;
  const p = x as ArtifactGrowth;
  if (
    [p.heard, p.proven, p.seal, p.pearl].some((v) => typeof v !== "boolean") ||
    !["none", "embryo", "attuned"].includes(p.blade) ||
    typeof p.last !== "string" ||
    p.last.length > 2000 ||
    (p.blade !== "none" && !p.heard) ||
    (p.proven && p.blade !== "attuned")
  )
    return false;
  if (p.duel === null) return true;
  const d = p.duel;
  return (
    !!d &&
    typeof d.broken === "boolean" &&
    ["claim", "proof"].includes(d.kind) &&
    ["sense", "herbs"].includes(d.preparation) &&
    [d.hp, d.enemy, d.turn].every(
      (v) => Number.isSafeInteger(v) && v >= 0 && v <= 100000,
    ) &&
    d.hp > 0 &&
    d.enemy > 0 &&
    d.turn < 18 &&
    ["none", "guard", "strike", "discern"].includes(d.effect) &&
    p.heard &&
    (d.kind === "claim"
      ? p.blade === "none"
      : p.blade === "attuned" && !p.proven)
  );
}
