import { dailyMedicineQuote, applyDailyMedicine } from "./medicines";
import { hasEquippedRelic } from "./equipment";
import type { State, Technique } from "./world";
import { techniqueIds, techniqueChangeError, applyTechnique } from "./techniques";
export { techniqueIds, mainTraining, supportTraining } from "./techniques";
export interface Growth {
  training: Record<Technique, number>;
  medicines: { healing: number; clarity: number; spirit: number };
  lastMedicineMonth: number | null;
}
export const freshGrowth = (): Growth => ({
  training: { spring: 0, blade: 0, breath: 0, herb: 0, guard: 0, lantern: 0 },
  medicines: { healing: 0, clarity: 0, spirit: 0 },
  lastMedicineMonth: null,
});
import { medicines } from "./workshop/catalog";
import { workshopQuote, workshopLock } from "./workshop/rules";
export { medicines } from "./workshop/catalog";
export type Medicine = keyof typeof medicines;
export type GrowthCommand =
  | { id: string; type: "trainTechnique"; technique: Technique }
  | { id: string; type: "brew"; medicine: Medicine }
  | { id: string; type: "consume"; medicine: Medicine };
export function trainingError(s: State, t: Technique) {
  if (!techniqueIds.includes(t)) return "先习得这册功法";
  return techniqueChangeError(s, { kind: "train", id: t });
}
export function medicineError(s: State, m: Medicine, use = false) {
  if (workshopLock(s)) return "先处理眼前事件或结束历练";
  if (!Object.hasOwn(medicines, m)) return "未知丹方";
  return use ? dailyMedicineQuote(s, m).error : workshopQuote(s, { product: m, method: "craft" }).error;
}

export function runGrowth(
  input: State,
  c: Exclude<GrowthCommand, { type: "brew" }>,
): State {
  if (workshopLock(input)) return input;
  const error =
    c.type === "trainTechnique"
      ? trainingError(input, c.technique)
      : medicineError(input, c.medicine, c.type === "consume");
  if (error) return input;
  const s = structuredClone(input);
  let text = "";
  if (c.type === "trainTechnique") {
    applyTechnique(s, { kind: "train", id: c.technique });
    text = `功法研修至${s.growth.training[c.technique] === 1 ? "熟练" : "通达"}；装配后生效。灵石 −12、灵草 −2。`;
  } else {
    const used = applyDailyMedicine(s, c.medicine);
    text = c.medicine === "healing"
      ? `服用回春散：伤势 −${used.healed}，不推进月份；单场气势不受影响。`
      : `服用${medicines[c.medicine].name}：神识 +${used.sense}，不推进月份。下次可服养神药：第 ${used.nextUseMonth} 月。`;

  }
  s.log.unshift({ month: s.month, kind: "story", text });
  s.log = s.log.slice(0, 180);
  s.seen = [...s.seen, c.id].slice(-512);
  return s;
}
export function validGrowth(s: State, legacy = false) {
  const g = s.growth;
  const int = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  return (
    !!g &&
    !!g.training &&
    techniqueIds.every(
      (t) =>
        int(g.training[t], 2) &&
        (g.training[t] < 2 || s.realm >= 1) &&
        (g.training[t] === 0 || s.journey.known.includes(t)),
    ) &&
    !!g.medicines &&
    (legacy ? ["healing", "clarity"] : ["healing", "clarity", "spirit"]).every((k) => int(g.medicines[k as Medicine])) &&
    (g.lastMedicineMonth === null || int(g.lastMedicineMonth, s.month))
  );
}
export function growthGoals(s: State): string[] {
  const goals: string[] = [];
  if (!s.journey.main)
    goals.push(
      "功法：装配营救谢礼中的主修；也可经宗门、擂台或坊市取得其他法门。",
    );
  else if (s.growth.training[s.journey.main] < (s.realm ? 2 : 1))
    goals.push("功法：在功法页研修当前主修，提高修行收益和交锋伤害。");
  if (!hasEquippedRelic(s))
    goals.push("装备：护送药车取得第一件灵器后装配；也可在坊市炼制。");
  else if (s.realm && !hasEquippedRelic(s, 2))
    goals.push("装备：筑基后精炼灵器，强化交锋中的攻守效果。");
  if (s.injury) goals.push("丹药：回春散可恢复伤势；无材料时可免费静养。");
  if (!s.realm)
    goals.push(
      `境界：修为 ${s.qi}/360；先闯遗府备齐筑基丹，再以固本与疗伤提高把握。`,
    );
  else if(s.realm === 2) goals.push("境界：金丹已成，可在凝丹机缘中越过云壁，试用丹元护体。");
  else {
    const remaining = [
      s.expedition.accepted && s.expedition.cleared < 3 ? "守阵交锋" : "",
      s.social.arena.wins < 3 ? "听松擂台" : "",
    ].filter(Boolean);
    goals.push(
      remaining.length
        ? `境界：筑基已成，可准备${remaining.join("、")}；可继续完成筑基修行，争取主药并筹备结丹。`
        : "境界：旧阵与听松擂台已过，可继续行旅、回访故人；可继续完成筑基修行，争取主药并筹备结丹。",
    );
  }
  return goals;
}
