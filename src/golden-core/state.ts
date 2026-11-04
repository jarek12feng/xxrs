import type { State } from "../world";
export interface GoldenCore {
  medicine: number;
  pills: number;
  contestMedicine: boolean;
  champion: "none" | "pending" | "haven" | "guard";
  havenCredit: boolean;
  guardCredit: boolean;
  site: "none" | "rented" | "repaired" | "sect";
  guard: boolean;
  attempts: number;
  lastChance: number;
  lastRoll: number;
  formedAt: number | null;
  farShore: boolean;
  expedition: "idle" | "prepared" | "path" | "won";
  route: "none" | "share" | "alone";
  gathered: number;
  duel: { hp: number; enemy: number; turn: number; effect: string } | null;
  last: string;
}
export const freshGoldenCore = (): GoldenCore => ({
  medicine: 0,
  pills: 0,
  contestMedicine: false,
  champion: "none",
  havenCredit: false,
  guardCredit: false,
  site: "none",
  guard: false,
  attempts: 0,
  lastChance: 0,
  lastRoll: 0,
  formedAt: null,
  farShore: false,
  expedition: "idle",
  route: "none",
  gathered: 0,
  duel: null,
  last: "",
});
export function validGoldenCore(s: State) {
  const g = s.goldenCore;
  const int = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !g ||
    !["none", "pending", "haven", "guard"].includes(g.champion) ||
    !["none", "rented", "repaired", "sect"].includes(g.site) ||
    !["idle", "prepared", "path", "won"].includes(g.expedition) ||
    !["none", "share", "alone"].includes(g.route) ||
    !["medicine", "pills", "attempts", "gathered"].every((k) =>
      int(g[k as keyof GoldenCore]),
    ) ||
    !int(g.lastChance, 100) ||
    !int(g.lastRoll, 100) ||
    ![
      "contestMedicine",
      "havenCredit",
      "guardCredit",
      "guard",
      "farShore",
    ].every((k) => typeof g[k as keyof GoldenCore] === "boolean") ||
    typeof g.last !== "string" ||
    g.last.length > 2000
  )
    return false;
  if (
    (g.contestMedicine && s.sectContest?.claimed < 2) ||
    (g.champion !== "none" && s.sectContest?.claimed < 3) ||
    (g.havenCredit && g.champion !== "haven") ||
    (g.guardCredit && g.champion !== "guard")
  )
    return false;
  if (
    g.medicine + g.pills + g.attempts !==
    g.gathered + Number(g.contestMedicine)
  )
    return false;
  if (
    (g.attempts === 0) !== (g.lastRoll === 0) ||
    (g.attempts === 0) !== (g.lastChance === 0)
  )
    return false;
  if (
    g.formedAt === null
      ? s.realm >= 2 || g.farShore
      : !int(g.formedAt, s.month) ||
        s.realm < 2 ||
        !s.foundationJourney?.epilogue ||
        !g.attempts ||
        g.lastRoll > g.lastChance
  )
    return false;
  if (g.site === "sect" && g.champion !== "haven") return false;
  if (
    g.expedition === "idle"
      ? g.route !== "none" || g.duel !== null
      : s.realm !== 1 ||
        s.foundationJourney?.cultivation < 400 ||
        !s.foundationJourney.growth.refined
  )
    return false;
  if (
    (g.expedition === "prepared" && g.route !== "none") ||
    (["path", "won"].includes(g.expedition) && g.route === "none")
  )
    return false;
  if (s.realm === 0 && JSON.stringify(g) !== JSON.stringify(freshGoldenCore()))
    return false;
  const d = g.duel;
  return (
    d === null ||
    (!!d &&
      g.expedition === "path" &&
      s.status === "alive" &&
      !s.pending &&
      !s.sectContest.duel &&
      !s.foundationJourney.duel &&
      !s.social.scene &&
      !s.social.arena.duel &&
      !s.expedition.duel &&
      !s.qiJourney.node &&
      !(s.treasures.auction?.entered && !s.treasures.auction.closed) &&
      int(d.hp, 300) &&
      d.hp > 0 &&
      int(d.enemy, 200) &&
      d.enemy > 0 &&
      int(d.turn, 15) &&
      ["", "guard", "strike", "discern"].includes(d.effect))
  );
}
