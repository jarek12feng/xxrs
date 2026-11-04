import { settleResources } from "../economy";
import { techniques, techniqueIds, type Technique } from "./catalog";
export { techniques, techniqueIds, type Technique } from "./catalog";
export interface TechniqueContext {
  realm: number;
  study: number;
  stones: number;
  herbs: number;
  journey: {
    known: Technique[];
    main: Technique | null;
    support: Technique | null;
  };
  growth: {
    training: Record<Technique, number>;
  };
}
export interface TechniqueEffectsContext {
  realm: number;
  journey?: { main: string | null; support?: string | null };
  growth?: { training: Record<string, number> };
  foundationJourney?: { inheritance: string };
  outerSea?: { method: string };
  conclave?: { method: string };
}
export type TechniqueChange = {
  kind: "learn" | "equip" | "train";
  id: Technique;
};
export const canGather = (s: { journey: { known: readonly string[] } }) =>
  s.journey.known.some((t) => t === "spring" || t === "herb");
export const canTrain = (s: { journey: { known: readonly string[] } }) =>
  s.journey.known.includes("blade");
export function techniqueTraining(
  s: TechniqueEffectsContext,
  slot: "main" | "support",
) {
  const id = s.journey?.[slot];
  return id ? (s.growth?.training[id] ?? 0) : 0;
}
export const mainTraining = (s: TechniqueEffectsContext) =>
  techniqueTraining(s, "main");
export const supportTraining = (s: TechniqueEffectsContext) =>
  techniqueTraining(s, "support");
export function techniqueChangeError(
  s: TechniqueContext,
  change: TechniqueChange,
) {
  if (!techniqueIds.includes(change.id)) return "未知功法";
  const known = s.journey.known.includes(change.id);
  if (change.kind === "learn")
    return known
      ? "已习得这册功法"
      : s.study < 2
        ? "需要心得 2"
        : s.stones < 20
          ? "需要灵石 20"
          : "";
  if (!known) return "先习得这册功法";
  if (change.kind === "equip") return "";
  if (change.kind !== "train") return "未知功法操作";
  const rank = s.growth.training[change.id];
  return rank >= 2
    ? "已通达本篇"
    : rank === 1 && s.realm === 0
      ? "筑基后可研修至通达"
      : s.study < 2
        ? "需要心得 2；在洞府研读"
        : s.stones < 12 || s.herbs < 2
          ? "需要灵石 12、灵草 2"
          : "";
}
/** Command-owned draft only; event locks and save transactions remain with the caller. */
function payTechnique(
  s: TechniqueContext,
  cost: { stones: number; herbs?: number },
) {
  const wallet = { stones: s.stones, herbs: s.herbs };
  const result = settleResources(wallet, cost);
  if (!result.error) {
    s.stones = wallet.stones;
    s.herbs = wallet.herbs;
  }
  return result;
}
export function applyTechnique(s: TechniqueContext, change: TechniqueChange) {
  const error = techniqueChangeError(s, change);
  if (error) return { error };
  if (change.kind === "equip")
    s.journey[techniques[change.id].slot] = change.id;
  if (change.kind === "learn") {
    const paid = payTechnique(s, { stones: 20 });
    if (paid.error) return { error: paid.error };
    s.journey.known.push(change.id);
  }
  if (change.kind === "train") {
    const paid = payTechnique(s, { stones: 12, herbs: 2 });
    if (paid.error) return { error: paid.error };
    s.growth.training[change.id]++;
  }
  return { error: "" };
}
/** Story rewards don't pay market tuition. Returns false for duplicates; story decides compensation. */
export function grantTechnique(
  s: Pick<TechniqueContext, "journey">,
  id: Technique,
) {
  if (!techniqueIds.includes(id) || s.journey.known.includes(id)) return false;
  s.journey.known.push(id);
  return true;
}
export function techniqueCultivationBonus(s: TechniqueEffectsContext) {
  const training = mainTraining(s),
    main = s.journey?.main;
  if (s.realm >= 3) return 0;
  if (s.realm === 2)
    return (
      (training >= 2 ? 1 : 0) +
      (s.outerSea?.method && s.outerSea.method !== "none" ? 2 : 0) +
      (s.conclave?.method && s.conclave.method !== "none" ? 2 : 0)
    );
  if (s.realm === 1)
    return (
      (training >= 2 ? 1 : 0) +
      (main && s.foundationJourney?.inheritance === main ? 1 : 0)
    );
  return (main === "spring" ? 3 : 0) + training * 2;
}
export function techniqueActivityEffect(
  s: TechniqueEffectsContext,
  activity: string,
) {
  const main = s.journey?.main,
    support = s.journey?.support;
  return {
    qi:
      (activity === "train" && main === "blade"
        ? 4
        : activity === "work" && main === "breath"
          ? 4
          : 0) +
      (activity === "train" || activity === "work" ? mainTraining(s) * 2 : 0),
    herbs:
      activity === "gather" && support === "herb" ? 1 + supportTraining(s) : 0,
    preventInjury: activity === "train" && support === "guard",
    study: activity === "meditate" && support === "lantern" ? 1 : 0,
  };
}
export function techniqueCombatProfile(s: TechniqueEffectsContext) {
  return {
    main: s.journey?.main ?? null,
    mainActive:
      s.conclave?.method !== "still" && s.outerSea?.method !== "clear",
    lantern: s.journey?.support === "lantern",
  };
}

export function techniquePower(s: TechniqueEffectsContext) {
  return {
    damage:
      mainTraining(s) * 2 +
      (s.conclave?.method === "inherit" ? 5 : 0) +
      (s.conclave?.method !== "still" && s.outerSea?.method === "continue"
        ? 3
        : 0),
    armor:
      (s.journey?.support === "guard" ? 2 : 0) +
      supportTraining(s) +
      (s.conclave?.method === "still" ? 6 : 0) +
      (s.conclave?.method !== "still" && s.outerSea?.method === "clear"
        ? 4
        : 0),
  };
}
export function methodQuote(
  book: "sea" | "conclave",
  current: string,
  next: string,
  acquired: boolean,
  safe: boolean,
) {
  const sea = book === "sea";
  return {
    months: current === "none" ? (sea ? 12 : 24) : sea ? 3 : 6,
    error:
      !acquired ||
      !safe ||
      !(sea ? ["continue", "clear"] : ["inherit", "still"]).includes(next) ||
      current === next
        ? sea
          ? "需澄息篇，在安全处选择未启用的运功方式"
          : "取回抱元凝神录后，在安全处参悟或转修"
        : "",
  };
}
