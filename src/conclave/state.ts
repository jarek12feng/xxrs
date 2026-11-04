import { validEffort, type BattleEffort, type Victory } from "./victories";
import type { State } from "../world";
export interface Conclave {
  stage: 0 | 1 | 2 | 3;
  location: "away" | "court" | "vault";
  introduced: boolean;
  preparation: "none" | "ward" | "insight";
  wins: number;
  retryAt: number;
  route: "none" | "shelter" | "current";
  supplies: boolean;
  depth: number;
  attuned: boolean;
  method: "none" | "inherit" | "still";
  victories: Victory[];
  duel: {
    kind: "contest" | "vault";
    index: number;
    hp: number;
    enemy: number;
    turn: number;
    effect: string;
    effort: BattleEffort | null;
  } | null;
  last: string;
}
export const freshConclave = (): Conclave => ({
  stage: 0,
  location: "away",
  introduced: false,
  preparation: "none",
  wins: 0,
  retryAt: 0,
  route: "none",
  supplies: false,
  depth: 0,
  attuned: false,
  method: "none",
  duel: null,
  victories: [],
  last: "",
});
import { goldenCap } from "../progression/caps";
export { goldenCap } from "../progression/caps";
export function goldenBlock(s: { conclave?: { stage: number } }) {
  return (s.conclave?.stage ?? 0) === 0
    ? "修满 299，走通退潮内府、温养镇潮印并参悟澄息篇，再凝炼丹元突破中期。"
    : s.conclave?.stage === 1
      ? "修满 599，温养定神珠、走通归潮秘境并参悟凝婴法门，再融汇丹元突破后期。"
      : s.conclave?.stage === 2 ? "修满899，走通离照洞天、验证丹方，再赴圆满试炼。" : "金丹圆满，安顿承诺、备齐化婴丹与凝婴灵地，再叩元婴关。";
}
export function validConclave(s: State, legacy = false) {
  const c = s.conclave;
  const int = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !c ||
    !int(c.stage, 3) ||
    !int(c.wins, 3) ||
    !int(c.depth, 2) ||
    !int(c.retryAt) ||
    c.retryAt > s.month + 6 ||
    !["away", "court", "vault"].includes(c.location) ||
    !["none", "ward", "insight"].includes(c.preparation) ||
    !["none", "shelter", "current"].includes(c.route) ||
    !["none", "inherit", "still"].includes(c.method) ||
    ["introduced", "supplies", "attuned"].some(
      (k) => typeof c[k as keyof Conclave] !== "boolean",
    ) ||
    typeof c.last !== "string" ||
    c.last.length > 2000
  )
    return false;
  if (!legacy && (!Array.isArray(c.victories) || c.victories.length>5 || new Set(c.victories.map(v=>`${v?.kind}/${v?.index}`)).size!==c.victories.length || c.victories.some(v=>!v || !int(v.turns,18) || v.turns<1 || !validEffort(v,v.turns) || !int(v.index,2) || (v.kind==='contest' ? v.index>=c.wins : v.kind!=='vault' || v.index>=c.depth)))) return false;
  if (s.realm < 2) {
    const {victories: _records,...rest}=c;
    const {victories: _fresh,...fresh}=freshConclave();
    return JSON.stringify(rest)===JSON.stringify(fresh) && (legacy || c.victories.length===0);
  }
  if (
    c.stage > 0 &&
    (s.outerSea.cleared !== 2 ||
      !s.outerSea.attuned ||
      s.outerSea.method === "none" ||
      s.outerSea.cultivation < c.stage * 300)
  )
    return false;
  if (s.outerSea.cultivation > goldenCap(s)) return false;
  if (
    (c.location !== "away" ||
      c.introduced ||
      c.wins ||
      c.preparation !== "none") &&
    (s.outerSea.notice === null || s.month < s.outerSea.notice + 600)
  )
    return false;
  if (c.location !== "away" && s.outerSea.location !== "ferry") return false;
  if (
    !c.introduced &&
    (c.wins || c.preparation !== "none" || c.location === "vault")
  )
    return false;
  if ((c.wins || c.duel) && c.stage === 0) return false;
  if (
    (c.route !== "none" || c.supplies || c.depth || c.location === "vault") &&
    c.wins < 2
  )
    return false;
  if ((c.supplies || c.depth || c.location === "vault") && c.route === "none")
    return false;
  if (c.attuned && c.depth < 1) return false;
  if (c.depth === 2 && !c.attuned) return false;
  if (c.method !== "none" && c.depth < 2) return false;
  if (c.stage >= 2 && c.method === "none") return false;
  if (c.duel === null) return true;
  const d = c.duel;
  return (
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene &&
    !s.social.arena.duel &&
    !s.foundationJourney.duel &&
    !s.expedition.duel &&
    !s.sectContest.duel &&
    !s.outerSea.duel &&
    !s.qiJourney.node &&
    !s.goldenCore.duel &&
    !(s.treasures.auction?.entered && !s.treasures.auction.closed) &&
    int(d.index, 2) &&
    int(d.hp, 500) &&
    d.hp > 0 &&
    int(d.enemy, 600) &&
    d.enemy > 0 &&
    int(d.turn, 17) &&
    (legacy || d.effort === null || validEffort(d.effort,d.turn)) &&
    ["", "strike", "guard", "discern"].includes(d.effect) &&
    (d.kind === "contest"
      ? c.location === "court" && d.index === c.wins && c.wins < 3
      : c.location === "vault" &&
        d.kind === "vault" &&
        d.index === c.depth &&
        c.depth < 2 &&
        c.supplies &&
        (c.depth === 0 || c.attuned))
  );
}
