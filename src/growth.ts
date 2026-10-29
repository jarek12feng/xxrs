import type { State, Technique } from "./world";
export const techniqueIds = [
  "spring",
  "blade",
  "breath",
  "herb",
  "guard",
  "lantern",
] as const;
export interface Growth {
  training: Record<Technique, number>;
  medicines: { healing: number; clarity: number };
  lastMedicineMonth: number | null;
}
export const freshGrowth = (): Growth => ({
  training: { spring: 0, blade: 0, breath: 0, herb: 0, guard: 0, lantern: 0 },
  medicines: { healing: 0, clarity: 0 },
  lastMedicineMonth: null,
});
export const medicines = {
  healing: {
    name: "回春散",
    herbs: 2,
    stones: 4,
    hint: "伤势降低 2；适合战后休整",
  },
  clarity: {
    name: "清心丹",
    herbs: 3,
    stones: 6,
    hint: "神识 +1（上限 12）；帮助识阵与突破准备",
  },
} as const;
export type Medicine = keyof typeof medicines;
export type GrowthCommand =
  | { id: string; type: "trainTechnique"; technique: Technique }
  | { id: string; type: "brew" | "consume"; medicine: Medicine };
export function trainingError(s: State, t: Technique) {
  if (!techniqueIds.includes(t) || !s.journey.known.includes(t))
    return "先习得这册功法";
  const rank = s.growth.training[t];
  if (rank >= 2) return "已通达本篇";
  if (rank === 1 && s.realm === 0) return "筑基后可研修至通达";
  if (s.study < 2) return "需要心得 2；在洞府研读";
  if (s.stones < 12 || s.herbs < 2) return "需要灵石 12、灵草 2";
  return "";
}
export function medicineError(s: State, m: Medicine, use = false) {
  if (!Object.hasOwn(medicines, m)) return "未知丹方";
  if (use) {
    if (!s.growth.medicines[m]) return "储物袋中没有此药";
    if (
      s.growth.lastMedicineMonth !== null &&
      s.month - s.growth.lastMedicineMonth < 3
    )
      return `药性未散，再过 ${3 - (s.month - s.growth.lastMedicineMonth)} 个月可服药`;
    if (m === "healing" && !s.injury) return "没有伤势，无需服药";
    if (m === "clarity" && s.sense >= 12) return "神识已达本篇上限";
  } else {
    const recipe = medicines[m];
    if (s.study < 1) return "先研读一次，掌握基础丹理";
    if (s.herbs < recipe.herbs || s.stones < recipe.stones)
      return `需要灵草 ${recipe.herbs}、灵石 ${recipe.stones}`;
  }
  return "";
}
export function runGrowth(input: State, c: GrowthCommand): State {
  if (
    input.status !== "alive" ||
    input.pending ||
    input.social.scene ||
    input.social.arena.duel ||
    input.expedition.duel
  )
    return input;
  const error =
    c.type === "trainTechnique"
      ? trainingError(input, c.technique)
      : medicineError(input, c.medicine, c.type === "consume");
  if (error) return input;
  const s = structuredClone(input);
  let text = "";
  if (c.type === "trainTechnique") {
    s.stones -= 12;
    s.herbs -= 2;
    s.growth.training[c.technique]++;
    text = `功法研修至${s.growth.training[c.technique] === 1 ? "熟练" : "通达"}；装配后生效。灵石 −12、灵草 −2。`;
  } else if (c.type === "brew") {
    const r = medicines[c.medicine];
    s.herbs -= r.herbs;
    s.stones -= r.stones;
    s.growth.medicines[c.medicine]++;
    text = `炼成${r.name}，已收入储物袋；服药后需三个月散去药性。`;
  } else {
    s.growth.medicines[c.medicine]--;
    s.growth.lastMedicineMonth = s.month;
    if (c.medicine === "healing") s.injury = Math.max(0, s.injury - 2);
    else s.sense++;
    text = `服用${medicines[c.medicine].name}：${medicines[c.medicine].hint}。下次可服药：第 ${s.month + 3} 月。`;
  }
  s.log.unshift({ month: s.month, kind: "story", text });
  s.log = s.log.slice(0, 180);
  s.seen = [...s.seen, c.id].slice(-512);
  return s;
}
export function validGrowth(s: State) {
  const g = s.growth;
  const int = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  return (
    !!g &&
    !!g.training &&
    techniqueIds.every(
      (t) =>
        int(g.training[t], 2) &&
        (g.training[t] < 2 || s.realm === 1) &&
        (g.training[t] === 0 || s.journey.known.includes(t)),
    ) &&
    !!g.medicines &&
    ["healing", "clarity"].every((k) => int(g.medicines[k as Medicine])) &&
    (g.lastMedicineMonth === null || int(g.lastMedicineMonth, s.month))
  );
}
export function mainTraining(s: State) {
  return s.journey.main ? s.growth.training[s.journey.main] : 0;
}
export function supportTraining(s: State) {
  return s.journey.support ? s.growth.training[s.journey.support] : 0;
}
export function growthGoals(s: State): string[] {
  const goals: string[] = [];
  if (!s.journey.main)
    goals.push(
      "功法：装配营救谢礼中的主修；也可经宗门、擂台或坊市取得其他法门。",
    );
  else if (s.growth.training[s.journey.main] < (s.realm ? 2 : 1))
    goals.push("功法：在功法页研修当前主修，提高修行收益和交锋伤害。");
  if (!s.journey.equipped)
    goals.push("装备：护送药车取得第一件灵器后装配；也可在坊市炼制。");
  else if (s.realm && s.journey.relics[s.journey.equipped] < 2)
    goals.push("装备：筑基后精炼灵器，强化交锋中的攻守效果。");
  if (s.injury) goals.push("丹药：回春散可恢复伤势；无材料时可免费静养。");
  if (!s.realm)
    goals.push(`境界：修为 ${s.qi}/360；固本、心得、筑基丹都能改善突破准备。`);
  else
    goals.push(
      "境界：筑基已成。用完整构筑完成守阵交锋与听松擂台；金丹尚未开放。",
    );
  return goals;
}
