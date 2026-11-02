import type { State } from "../world";
export interface SectContest {
  stage:
    "unheard" | "invited" | "preparing" | "deferred" | "entered" | "finished";
  source: "none" | "mentor" | "return";
  announced: number;
  starts: number;
  reminded: boolean;
  edition: number;
  results: ("win" | "loss")[];
  best: number;
  claimed: number;
  duel: { hp: number; enemy: number; turn: number; effect: string } | null;
  last: string;
}
export const freshSectContest = (): SectContest => ({
  stage: "unheard",
  source: "none",
  announced: 0,
  starts: 0,
  reminded: false,
  edition: 0,
  results: [],
  best: 0,
  claimed: 0,
  duel: null,
  last: "",
});
const int = (v: unknown, max = 1e9) =>
  Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
export function validSectContest(s: State): boolean {
  const t = s.sectContest;
  if (
    !t ||
    ![
      "unheard",
      "invited",
      "preparing",
      "deferred",
      "entered",
      "finished",
    ].includes(t.stage) ||
    !["none", "mentor", "return"].includes(t.source) ||
    !int(t.announced) ||
    !int(t.starts) ||
    !int(t.edition) ||
    !int(t.best, 3) ||
    !int(t.claimed, t.best) ||
    typeof t.reminded !== "boolean" ||
    typeof t.last !== "string" ||
    t.last.length > 2000 ||
    !Array.isArray(t.results) ||
    t.results.length > 3 ||
    t.results.some((x) => !["win", "loss"].includes(x))
  )
    return false;
  if (t.stage === "unheard")
    return (
      t.source === "none" &&
      t.announced === 0 &&
      t.starts === 0 &&
      t.edition === 0 &&
      !t.reminded &&
      !t.results.length &&
      !t.best &&
      !t.claimed &&
      t.duel === null
    );
  if (
    !s.social ||
    !s.foundationJourney ||
    !s.expedition ||
    !s.qiJourney ||
    !s.treasures ||
    s.realm < 1 ||
    s.journey?.branch === "none" ||
    t.source === "none" ||
    t.announced > s.month ||
    t.starts !== t.announced + 120 ||
    t.edition < 1 ||
    (t.reminded && s.month < t.starts)
  )
    return false;
  if (t.stage === "finished" ? t.results.length !== 3 : t.results.length > 2)
    return false;
  if (!["entered", "finished"].includes(t.stage) && t.results.length)
    return false;
  if (["entered", "finished"].includes(t.stage) && s.month < t.starts)
    return false;
  if (
    t.stage === "finished" &&
    t.best < t.results.filter((x) => x === "win").length
  )
    return false;
  const d = t.duel;
  if (d === null) return true;
  return (
    t.stage === "entered" &&
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene &&
    !s.social.arena.duel &&
    !s.foundationJourney.duel &&
    !s.expedition.duel &&
    !s.qiJourney.node &&
    !(s.treasures.auction?.entered && !s.treasures.auction.closed) &&
    int(d.hp, 200) &&
    d.hp > 0 &&
    int(d.enemy, 150) &&
    d.enemy > 0 &&
    int(d.turn, 11) &&
    ["", "guard", "strike", "discern"].includes(d.effect)
  );
}
