import { goldenCap } from "../conclave/state";
import type { State } from "../world";
export interface OuterSea {
  location: "home" | "ferry" | "ruins" | "guild";
  met: boolean;
  pact: "none" | "share" | "private";
  prepared: boolean;
  cleared: number;
  reward: "none" | "seal" | "manual";
  seal: boolean;
  manual: boolean;
  attuned: boolean;
  method: "none" | "continue" | "clear";
  cultivation: number;
  notice: number | null;
  reminded: boolean;
  duel: {
    depth: 1 | 2;
    hp: number;
    enemy: number;
    turn: number;
    effect: string;
  } | null;
  last: string;
}
export const freshOuterSea = (): OuterSea => ({
  location: "home",
  met: false,
  pact: "none",
  prepared: false,
  cleared: 0,
  reward: "none",
  seal: false,
  manual: false,
  attuned: false,
  method: "none",
  cultivation: 0,
  notice: null,
  reminded: false,
  duel: null,
  last: "",
});
export function validOuterSea(s: State) {
  const o = s.outerSea;
  const int = (n: unknown, max = 1e9) =>
    Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
  if (
    !o ||
    !["home", "ferry", "ruins", "guild"].includes(o.location) ||
    !["none", "share", "private"].includes(o.pact) ||
    !["none", "seal", "manual"].includes(o.reward) ||
    !["none", "continue", "clear"].includes(o.method) ||
    !int(o.cleared, 2) ||
    !int(o.cultivation, goldenCap(s)) ||
    ["met", "prepared", "seal", "manual", "attuned", "reminded"].some(
      (k) => typeof o[k as keyof OuterSea] !== "boolean",
    ) ||
    typeof o.last !== "string" ||
    o.last.length > 2000
  )
    return false;
  if (s.realm < 2)
    return JSON.stringify(o) === JSON.stringify(freshOuterSea());
  if ((o.location !== "home" || o.met) && !s.goldenCore.farShore) return false;
  if (
    !o.met &&
    (o.pact !== "none" ||
      o.prepared ||
      o.cleared ||
      o.reward !== "none" ||
      o.seal ||
      o.manual ||
      o.cultivation ||
      o.notice !== null)
  )
    return false;
  if ((o.prepared || o.cleared || o.location === "ruins") && o.pact === "none")
    return false;
  if (o.cleared === 0 && (o.reward !== "none" || o.seal || o.manual))
    return false;
  if (
    (o.reward === "none" && (o.seal || o.manual)) ||
    (o.reward === "seal" && !o.seal) ||
    (o.reward === "manual" && !o.manual)
  )
    return false;
  if (
    (o.cleared < 2 && o.seal && o.manual) ||
    (o.cleared === 2 && (!o.seal || !o.manual))
  )
    return false;
  if ((o.attuned && !o.seal) || (o.method !== "none" && !o.manual))
    return false;
  if (o.notice !== null && (!int(o.notice, s.month) || o.reward === "none"))
    return false;
  if (o.reminded && (o.notice === null || s.month < o.notice + 600))
    return false;
  if (o.duel === null) return true;
  const d = o.duel;
  return (
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene &&
    !s.social.arena.duel &&
    !s.foundationJourney.duel &&
    !s.expedition.duel &&
    !s.sectContest.duel &&
    !s.qiJourney.node &&
    !s.goldenCore.duel &&
    !(s.treasures.auction?.entered && !s.treasures.auction.closed) &&
    o.location === "ruins" &&
    o.prepared &&
    d.depth === o.cleared + 1 &&
    (d.depth === 1 || d.depth === 2) &&
    int(d.hp, 300) &&
    d.hp > 0 &&
    int(d.enemy, 300) &&
    d.enemy > 0 &&
    int(d.turn, 15) &&
    ["", "guard", "strike", "discern"].includes(d.effect)
  );
}
