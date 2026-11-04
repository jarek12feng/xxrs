import type { State } from "../world";
import type { Move } from "../combat";
export type Pursuit =
  | "none"
  | "rumor"
  | "warned"
  | "confront"
  | "defeated"
  | "repelled"
  | "settled"
  | "exposed"
  | "killed"
  | "bypassed";
export interface Lizhao {
  location: "away" | "harbor" | "outer" | "inner" | "chamber" | "bay";
  route: "none" | "cooperate" | "independent";
  preparation: "none" | "ward" | "purify";
  outerCleared: boolean;
  cleared: boolean;
  recipeVerified: boolean;
  reagent: number;
  allocation: "none" | "share" | "private" | "seize";
  pursuit: Pursuit;
  response: "none" | "company" | "ambush";
  recovery: boolean;
  duel: null | {
    kind: "outer" | "inner" | "han";
    hp: number;
    enemy: number;
    turn: number;
    effect: string;
    toxin: number;
  };
  last: string;
}
export const freshLizhao = (): Lizhao => ({
  location: "away",
  route: "none",
  preparation: "none",
  outerCleared: false,
  cleared: false,
  recipeVerified: false,
  reagent: 0,
  allocation: "none",
  pursuit: "none",
  response: "none",
  recovery: false,
  duel: null,
  last: "",
});
export const lizhaoMoves: readonly Move[] = ["guard", "strike", "discern"];
export function validLizhao(s: State) {
  const l = s.lizhao;
  const int = (v: unknown, max: number) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !l ||
    !["away", "harbor", "outer", "inner", "chamber", "bay"].includes(
      l.location,
    ) ||
    !["none", "cooperate", "independent"].includes(l.route) ||
    !["none", "ward", "purify"].includes(l.preparation) ||
    !["none", "share", "private", "seize"].includes(l.allocation) ||
    ![
      "none",
      "rumor",
      "warned",
      "confront",
      "defeated",
      "repelled",
      "settled",
      "exposed",
      "killed",
      "bypassed",
    ].includes(l.pursuit) ||
    !["none", "company", "ambush"].includes(l.response) ||
    !int(l.reagent, 20) ||
    typeof l.last !== "string" ||
    l.last.length > 2000 ||
    ["outerCleared", "cleared", "recipeVerified", "recovery"].some(
      (k) => typeof l[k as keyof Lizhao] !== "boolean",
    )
  )
    return false;
  if (s.realm < 2) return JSON.stringify(l) === JSON.stringify(freshLizhao());
  if ((l.location !== "away" || l.route !== "none") && s.conclave.stage < 2)
    return false;
  if (["outer", "inner"].includes(l.location) && l.preparation === "none")
    return false;
  if (
    l.route === "none" &&
    (l.preparation !== "none" || l.outerCleared || l.cleared)
  )
    return false;
  if (
    (l.cleared && !l.outerCleared) ||
    ((l.recipeVerified || l.reagent > 0 || l.allocation !== "none") &&
      !l.cleared)
  )
    return false;
  if (l.pursuit !== "none" && l.allocation !== "seize") return false;
  if (l.allocation === "seize" && l.pursuit === "none") return false;
  if (
    (l.location === "inner" && !l.outerCleared) ||
    (l.location === "chamber" && !l.cleared)
  )
    return false;
  if (l.location === "bay" && !["confront", "defeated"].includes(l.pursuit))
    return false;
  if (["confront", "defeated"].includes(l.pursuit) && l.location !== "bay")
    return false;
  if (
    l.response !== "none" &&
    ["none", "rumor", "warned", "bypassed"].includes(l.pursuit)
  )
    return false;
  const d = l.duel;
  if (d === null) return true;
  if (!d) return false;
  return (
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene &&
    ["outer", "inner", "han"].includes(d.kind) &&
    int(d.hp, 4000) &&
    d.hp > 0 &&
    int(d.enemy, 2000) &&
    d.enemy > 0 &&
    int(d.turn, 17) &&
    int(d.toxin, 99) &&
    ["", ...lizhaoMoves].includes(d.effect) &&
    (d.kind === "han"
      ? l.location === "bay" && l.pursuit === "confront"
      : l.location === d.kind &&
        l.preparation !== "none" &&
        (d.kind === "outer" ? !l.outerCleared : !l.cleared))
  );
}
