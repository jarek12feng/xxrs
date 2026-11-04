import { freshQiPeople, validQiPeople, type QiPeople } from "./people";
import {
  freshPreparation,
  preparationIds,
  type PreparationProgress,
  type PreparationRoute,
} from "./preparation";
export type QiRoute = "medicine" | "sword" | "array";
export interface QiJourney {
  people: QiPeople;
  preparations: PreparationProgress[];
  trial: PreparationRoute | null;
  gates: number;
  node: number;
  route: QiRoute | null;
  essence: boolean;
  vigor: number;
  commissions: string[];
  duel: { hp: number; enemy: number; turn: number; effect: string } | null;
  last: string;
}
export const freshQiJourney = (): QiJourney => ({
  people: freshQiPeople(),
  preparations: [freshPreparation(), freshPreparation()],
  trial: null,
  gates: 0,
  node: 0,
  route: null,
  essence: false,
  vigor: 0,
  commissions: [],
  duel: null,
  last: "",
});
export { qiCap } from "../progression/caps";
export function validQiJourney(
  s: {
    realm: number;
    status: string;
    qiJourney: QiJourney;
    pending: unknown;
    social: { scene: unknown; arena: { duel: unknown } };
    expedition: { duel: unknown };
    foundationJourney: { duel: unknown };
  },
  legacy = false,
) {
  const q = s.qiJourney;
  if (
    !q ||
    !Number.isSafeInteger(q.vigor) ||
    q.vigor < 0 ||
    q.vigor > 200 ||
    !Number.isInteger(q.gates) ||
    q.gates < 0 ||
    q.gates > 2 ||
    !Number.isInteger(q.node) ||
    q.node < 0 ||
    q.node > 3 ||
    ![null, "medicine", "sword", "array"].includes(q.route) ||
    typeof q.essence !== "boolean" ||
    typeof q.last !== "string" ||
    q.last.length > 3000 ||
    !Array.isArray(q.commissions) ||
    q.commissions.some((x) => !["herbs", "healing", "survey"].includes(x)) ||
    new Set(q.commissions).size !== q.commissions.length
  )
    return false;
  if (
    !legacy &&
    (!validQiPeople(q.people) ||
      !Array.isArray(q.preparations) ||
      q.preparations.length !== 2 ||
      q.preparations.some(
        (p) =>
          !p ||
          preparationIds.some(
            (k) => !Number.isInteger(p[k]) || p[k] < 0 || p[k] > 3,
          ),
      ) ||
      !(q.trial === null || preparationIds.includes(q.trial)) ||
      (q.trial !== null &&
        (q.node !== 1 ||
          !q.duel ||
          q.gates >= 2 ||
          q.preparations[q.gates]![q.trial] !== 2)))
  )
    return false;
  if (
    (q.node || q.duel) &&
    (s.realm !== 0 ||
      s.status !== "alive" ||
      s.pending ||
      s.social.scene ||
      s.social.arena.duel ||
      s.expedition.duel ||
      s.foundationJourney.duel ||
      q.gates >= 2 ||
      q.essence)
  )
    return false;
  if (q.essence && (q.node !== 0 || q.gates >= 2)) return false;
  if (q.node && !q.route) return false;
  if (q.duel === null) return q.node !== 1 && q.node !== 3;
  const d = q.duel;
  if (!d || typeof d !== "object") return false;
  return (
    [1, 3].includes(q.node) &&
    Number.isSafeInteger(d.hp) &&
    d.hp > 0 &&
    d.hp <= 200 &&
    Number.isSafeInteger(d.enemy) &&
    d.enemy > 0 &&
    d.enemy <= 250 &&
    Number.isInteger(d.turn) &&
    d.turn >= 0 &&
    d.turn < 16 &&
    ["none", "guard", "strike", "discern"].includes(d.effect)
  );
}
