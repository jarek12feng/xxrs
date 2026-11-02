import type { State } from "../world";
import { qiSites } from "./content";
export const preparationIds = ["medicine", "sect", "wander"] as const;
export type PreparationRoute = (typeof preparationIds)[number];
export type PreparationAction =
  `prep:${PreparationRoute}:${"prepare" | "careful" | "bold" | "trial"}`;
export type PreparationProgress = Record<PreparationRoute, number>;
export const freshPreparation = (): PreparationProgress => ({
  medicine: 0,
  sect: 0,
  wander: 0,
});
export const preparationRoutes = {
  medicine: {
    name: "药谷修行",
    steps: ["备护身药", "选路采药", "护药实战"],
    purpose: "许照岚带你识兽采药，再由你独自护住药篓。",
    cost: "备药耗灵草 3；稳妥走水路另耗灵草 2，或凭神识 8 辨踪。",
    reward: "完成得灵草 4；永久学会药谷正确守势减伤 2。",
  },
  sect: {
    name: "宗门试炼",
    steps: ["领护送差事", "安置药队", "护送考校"],
    purpose: "季衡把药队交给你。先备齐护送所需，再守住山口。",
    cost: "须入门、贡献 2；为药队包扎耗灵草 2，或凭剑意 4 开路并受伤 1。",
    reward: "完成得灵石 12、贡献 2。",
  },
  wander: {
    name: "散修探索",
    steps: ["整备勘路", "破解外围禁制", "独闯古阵"],
    purpose: "自行筹资勘路，不依附宗门；到内府阶段可请裴铸讲解阵枢。",
    cost: "勘路耗灵石 6、需心得 2；神识 8 辨阵，或耗灵石 8、承受伤势 1 强破。",
    reward: "完成得灵石 8；永久学会内府正确辨影减伤 2。",
  },
} as const;
export function preparationReady(s: State) {
  return (
    s.qiJourney.gates >= 2 ||
    preparationIds.some(
      (k) => s.qiJourney.preparations[s.qiJourney.gates]![k] === 3,
    )
  );
}
export function isPreparationAction(a: string): a is PreparationAction {
  return /^prep:(medicine|sect|wander):(prepare|careful|bold|trial)$/.test(a);
}
export function preparationError(s: State, a: PreparationAction) {
  const [, route, step] = a.split(":") as [string, PreparationRoute, string];
  const q = s.qiJourney;
  if (q.gates >= 2 || q.essence) return "当前材料已取得，不再需要准备路线";
  if (s.adventure.step !== "done" || s.qi < (q.gates ? 240 : 120))
    return `先完成寻人历练，并修至 ${q.gates ? 240 : 120} 修为`;
  const progress = q.preparations[q.gates]![route];
  if (progress === 3) return "此番历练已成";
  if (step === "prepare") {
    if (progress !== 0) return "准备已经完成，继续下一步";
    if (route === "medicine")
      return !q.people.scout
        ? "先认识许照岚"
        : s.herbs < 3
          ? "护身药需要灵草 3"
          : "";
    if (route === "sect")
      return s.journey.branch === "none"
        ? "先加入丹堂或剑院"
        : s.journey.contribution < 2
          ? "先做师门差事取得贡献 2"
          : "";
    return s.study < 2 ? "勘路需要心得 2" : s.stones < 6 ? "勘路需灵石 6" : "";
  }
  if (step === "careful" || step === "bold") {
    if (progress !== 1) return "先完成这条路线的整备";
    if (route === "medicine")
      return step === "careful"
        ? s.herbs < 2
          ? "沿水路采药需要灵草 2 护身"
          : ""
        : s.sense < 8
          ? "辨踪需要神识 8"
          : "";
    if (route === "sect")
      return step === "careful"
        ? s.herbs < 2
          ? "为药队包扎需要灵草 2"
          : ""
        : s.mastery < 4
          ? "开路需要剑意 4，伤势将增加 1"
          : "";
    return step === "careful"
      ? s.sense < 8
        ? "辨阵需要神识 8"
        : ""
      : s.stones < 8
        ? "强破需要灵石 8，伤势将增加 1"
        : "";
  }
  if (progress !== 2) return "先完成整备与沿途选择";
  if (!s.journey.main) return "先装配主修功法";
  if (s.injury >= 3) return "先养伤至 2 以下";
  return "";
}
export function settlePreparation(s: State, a: PreparationAction) {
  const [, route, step] = a.split(":") as [string, PreparationRoute, string];
  const q = s.qiJourney,
    p = q.preparations[q.gates]!;
  if (step === "prepare") {
    if (route === "medicine") s.herbs -= 3;
    if (route === "sect") s.journey.contribution -= 2;
    if (route === "wander") s.stones -= 6;
    p[route] = 1;
    q.last =
      route === "medicine"
        ? "你与许照岚备好护身药。下一程要穿过兽径采药，再独自护药归来。"
        : route === "sect"
          ? "你领下护送差事，贡献 −2。药队中有人脚伤未愈，先决定怎样过山口。"
          : "你花灵石 6 整备行装。外围石阵有两处缺口，先选辨阵绕行或强破。";
  } else if (step === "careful" || step === "bold") {
    if (
      (route === "medicine" && step === "careful") ||
      (route === "sect" && step === "careful")
    )
      s.herbs -= 2;
    if ((route === "sect" || route === "wander") && step === "bold")
      s.injury = Math.min(6, s.injury + 1);
    if (route === "wander" && step === "bold") s.stones -= 8;
    p[route] = 2;
    q.last =
      route === "medicine"
        ? step === "careful"
          ? "你用护身药沿浅水绕过兽径，带回了药篓。"
          : "你辨清新旧足迹，从下风处采药归来。"
        : route === "sect"
          ? step === "careful"
            ? "你替伤者包扎，药队重新跟上。"
            : "你以剑开路，伤势 +1，药队通过狭道。"
          : step === "careful"
            ? "你辨明灵流方向，破去外围禁制。"
            : "你耗灵石 8 强破禁制，伤势 +1。";
    q.last += "前方尚有阻拦，须亲自闯过；也可先回山休整。";
  } else {
    q.trial = route;
    q.route =
      route === "medicine"
        ? "medicine"
        : route === "wander"
          ? "array"
          : s.path === "sword"
            ? "sword"
            : "medicine";
    q.node = 1;
    q.last = `${preparationRoutes[route].name}：最后一场须由你独自应对。失败可恢复后重试，不必重做已完成的准备。`;
  }
}
export function preparationEnemy(s: State) {
  const q = s.qiJourney;
  const base =
    q.trial === "wander"
      ? qiSites[1].enemies[0]
      : qiSites[0].enemies[q.gates ? 1 : 0];
  return {
    ...base,
    name:
      q.trial === "sect" ? (q.gates ? "阻路青鳞蟒" : "拦路岩獾") : base.name,
    hp: q.gates ? 90 : 60,
    attack: q.gates ? 16 : 13,
    realm: 0 as const,
    stage: q.gates ? 2 : 1,
  };
}
export function completePreparation(s: State) {
  const q = s.qiJourney,
    r = q.trial!;
  q.preparations[q.gates]![r] = 3;
  if (r === "medicine") {
    s.herbs += 4;
    q.people.beastLesson = true;
  }
  if (r === "sect") {
    s.stones += 12;
    s.journey.contribution += 2;
  }
  if (r === "wander") {
    s.stones += 8;
    q.people.constructLesson = true;
  }
  q.trial = null;
  q.node = 0;
  q.duel = null;
  q.route = null;
  q.last += ` ${preparationRoutes[r].name}已完成。${preparationRoutes[r].reward} 可往秘境取材，带回炼化以破瓶颈。`;
}
