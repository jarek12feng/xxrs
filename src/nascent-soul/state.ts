import { unsettledNascentPromises } from './promises';
import { freshCovenant, validCovenant, covenantReady, type Covenant } from './covenant';
import {
  freshThunderPath,
  validThunderPath,
  type ThunderPath,
} from "./thunder-state";
import type { State } from "../world";
export interface NascentSoul {
  covenant: Covenant;
  thunder: ThunderPath;
  trialWon: boolean;
  contactedAt: number | null;
  trial: {
    turn: number;
    body: number;
    mind: number;
    power: number;
    seals: number;
  } | null;
  commitments: {
    duty: "none" | "handover" | "decline";
    home: "none" | "letter" | "remember";
    promise: "none" | "entrust" | "carry";
    companion: "none" | "explain" | "solitary";
  };
  ceremony:
    | "none"
    | "discussed"
    | "witnessed"
    | "married"
    | "renewed"
    | "deferred"
    | "solitary";
  marrowClaimed: boolean;
  marrow: number;
  auxiliaryUsed: number;
  pills: number;
  reviewed: boolean;
  brews: number;
  land: "none" | "shared" | "independent";
  protection: "none" | "array" | "friends";
  strategy: "balanced" | "flow" | "spirit";
  attempt: {
    phase: number;
    flow: number;
    spirit: number;
    stability: number;
  } | null;
  failures: number;
  emerged: boolean;
  celebration: "none" | "simple" | "formal" | "deferred";
  guests: string[];
  office: "none" | "accepted" | "declined";
  ability: "none" | "surveyed" | "sheltered" | "done";
  last: string;
}
export const freshNascentSoul = (): NascentSoul => ({
  covenant: freshCovenant(),
  thunder: freshThunderPath(),
  trialWon: false,
  contactedAt: null,
  trial: null,
  commitments: {
    duty: "none",
    home: "none",
    promise: "none",
    companion: "none",
  },
  ceremony: "none",
  marrowClaimed: false,
  marrow: 0,
  auxiliaryUsed: 0,
  pills: 0,
  reviewed: false,
  brews: 0,
  land: "none",
  protection: "none",
  strategy: "balanced",
  attempt: null,
  failures: 0,
  emerged: false,
  celebration: "none",
  guests: [],
  office: "none",
  ability: "none",
  last: "",
});
export type NascentState = State & { nascentSoul: NascentSoul };
export const nascentState = (s: State) => (s as NascentState).nascentSoul;
export function validNascentSoul(s: State, legacy = false, legacyScenes = false) {
  const n = nascentState(s);
  const int = (x: unknown, max = 1e9) =>
    Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
  if (!n || typeof n !== "object") return false;
  if (!legacyScenes && !validCovenant(n.covenant)) return false;
  if (!legacyScenes && Object.entries(n.covenant).some(([k,v])=> k!=="witnesses" && v!=="none") && (s.conclave.stage<3 || !(s.social.bonded || s.foundationJourney.bond==='promised' || s.foundationJourney.bond==='covenant'))) return false;
  if (!legacyScenes) {
    const c=n.covenant;
    if ([c.form,c.token,c.promise].some(v=>v!=='none') && (c.meeting==='none' || n.ceremony==='none')) return false;
    if (c.witnesses.length && (c.form!=='friends' || !['witnessed','married'].includes(n.ceremony))) return false;
    if (['witnessed','married'].includes(n.ceremony) && c.meeting!=='none' && !covenantReady(c)) return false;
  }
  if (!legacy && !validThunderPath(s, n.thunder)) return false;
  if (n.contactedAt !== null && (!int(n.contactedAt, s.month) || !s.social.met))
    return false;
  if (
    ["trialWon", "marrowClaimed", "reviewed", "emerged"].some(
      (k) => typeof n[k as keyof NascentSoul] !== "boolean",
    )
  )
    return false;
  if (
    ["marrow", "auxiliaryUsed", "pills", "brews", "failures"].some(
      (k) => !int(n[k as keyof NascentSoul]),
    )
  )
    return false;
  const enums = {
    ceremony: [
      "none",
      "discussed",
      "witnessed",
      "married",
      "renewed",
      "deferred",
      "solitary",
    ],
    land: ["none", "shared", "independent"],
    protection: ["none", "array", "friends"],
    strategy: ["balanced", "flow", "spirit"],
    celebration: ["none", "simple", "formal", "deferred"],
    office: ["none", "accepted", "declined"],
    ability: ["none", "surveyed", "sheltered", "done"],
  };
  if (
    Object.entries(enums).some(
      ([k, v]) => !v.includes(n[k as keyof NascentSoul] as string),
    )
  )
    return false;
  if (
    !n.commitments ||
    !["none", "handover", "decline"].includes(n.commitments.duty) ||
    !["none", "letter", "remember"].includes(n.commitments.home) ||
    !["none", "entrust", "carry"].includes(n.commitments.promise) ||
    !["none", "explain", "solitary"].includes(n.commitments.companion)
  )
    return false;
  if (
    typeof n.last !== "string" ||
    n.last.length > 2000 ||
    !Array.isArray(n.guests) ||
    n.guests.length > 12 ||
    n.guests.some((x) => typeof x !== "string" || x.length > 80) ||
    new Set(n.guests).size !== n.guests.length
  )
    return false;
  if (
    n.trial !== null &&
    (!n.trial ||
      !int(n.trial.turn, 5) ||
      !int(n.trial.body, 18) ||
      !n.trial.body ||
      !int(n.trial.mind, 26) ||
      !n.trial.mind ||
      !int(n.trial.power, 12) ||
      !int(n.trial.seals, 6) ||
      n.trialWon ||
      n.attempt)
  )
    return false;
  if (
    n.attempt !== null &&
    (!n.attempt ||
      !int(n.attempt.phase, 2) ||
      !int(n.attempt.flow, 12) ||
      !int(n.attempt.spirit, 12) ||
      !int(n.attempt.stability, 12) ||
      !n.attempt.stability ||
      !n.trialWon ||
      unsettledNascentPromises(s).length > 0 ||
      n.land === "none" ||
      n.protection === "none" ||
      Number(s.realm) !== 2)
  )
    return false;
  if (n.emerged && Number(s.realm) !== 3) return false;
  if (n.celebration !== "none" && !n.emerged) return false;
  if (n.ability !== "none" && (!n.emerged || n.celebration === "none"))
    return false;
  if (Number(s.realm) < 2)
    return (
      JSON.stringify({ ...freshNascentSoul(), ...n, ...(legacyScenes ? {covenant:freshCovenant()} : {}), thunder: freshThunderPath() }) ===
      JSON.stringify(freshNascentSoul())
    );
  if (
    Number(s.realm) === 3 &&
    (!n.trialWon ||
      n.attempt ||
      n.trial)
  )
    return false;
  if ((n.marrow || n.brews || n.pills) && !n.marrowClaimed) return false;
  if (
    n.marrow > 3 ||
    n.pills > 3 ||
    n.brews !== n.auxiliaryUsed ||
    n.pills > n.brews
  )
    return false;
  if (n.trialWon && (!s.lizhao.cleared || Number(s.conclave.stage) < 2))
    return false;
  if (
    (Object.values(n.commitments).some((v) => v !== "none") ||
      n.ceremony !== "none") &&
    Number(s.conclave.stage) < 3
  )
    return false;
  if (n.ceremony === "married" && s.foundationJourney.bond !== "covenant")
    return false;
  if (n.ceremony === "renewed" && s.foundationJourney.bond !== "covenant")
    return false;
  if (n.trial || n.attempt || (!legacy && n.thunder.battle)) {
    if (
      s.status !== "alive" ||
      s.outerSea.location !== "ferry" ||
      s.conclave.location !== "away" ||
      s.lizhao.location !== "away" ||
      s.wayfaring.trip ||
      s.wayfaring.passage ||
      s.conclave.duel ||
      s.lizhao.duel ||
      s.outerSea.duel ||
      s.expedition.duel ||
      s.foundationJourney.duel ||
      s.social.arena.duel ||
      s.sectContest.duel
    )
      return false;
    if (n.trial && Number(s.conclave.stage) !== 2) return false;
    if (
      n.attempt &&
      (Number(s.conclave.stage) !== 3 ||
        s.outerSea.cultivation < 1200 ||
        !s.conclave.attuned ||
        s.conclave.method === "none")
    )
      return false;
  }
  if (n.celebration === "none" && (n.guests.length || n.office !== "none"))
    return false;
  return true;
}
