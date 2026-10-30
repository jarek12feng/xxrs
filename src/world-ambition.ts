import { foundationGoal } from "./foundation-journey/progression";
import type { State } from "./world";
import { arenaError, rivals } from "./social";

// Local, current-life achievements projected from existing progress; never grants rewards.
export function trialBoard(s: State) {
  const wins = s.social.arena.wins;
  const next = rivals[wins];
  return {
    title: ["尚未入榜", "初登试剑榜", "入围决胜", "听松炼气组魁首"][wins]!,
    next: next?.name ?? null,
    requirement: next
      ? arenaError(s) || "已可登台；本场一月、灵石 4。"
      : "本届三场已完成。名次留在当前旅程，不重复发奖。",
    response: [
      s.age < 216
        ? "巩砚把名册压在石镇下：“十八岁再来报名。眼下先走山路，护好自己和同行的人。”"
        : "巩砚翻开名册：“先看看我的招式。准备好了，就来台上报你的名字。”",
      "巩砚在名册上写下你的名字：“这一场算你的。下次护药过山，咱们可以换你守前路。”",
      "裴逐风收剑拱手：“你的名字该写到决胜那一页了。邱星罗会按炼气组的尺度试你的阵步。”",
      "邱星罗合上名册：“本届炼气组魁首，是你。”台边的人让出一条路，巩砚把第一场用过的石镇递给你看，笑着点了点头。",
    ][wins]!,
  };
}

export function journeyHorizon(s: State) {
  const road = s.adventure.road;
  if (s.adventure.step !== "done")
    return {
      stage: "把失踪药工带回山下，得到第一册可以亲手修习的功法。",
      chapter: "从听松山出发，走通青嶂归路，让后来的人也能平安越山。",
    };
  if (road.surveyed)
    return {
      stage: foundationGoal(s),
      chapter:
        "探沉井、取得传承，在云外古道学稳脉并完成内外接应，为凝丹准备。人物支线与听松试剑榜均可选择。",
    };
  return {
    stage:
      s.expedition.cleared === 2
        ? s.realm
          ? "筑基已成，重返青嶂旧阵，挑战守阵者并取出转运册。"
          : "筑基后重返旧阵，亲手取出此前拿不到的转运册。"
        : s.expedition.cleared === 3
          ? "旧阵已经平息。选择过山的方法，将安全归路记入旅亭路簿。"
          : "护送药车、取得灵器，让学来的功法在山路上派上用场。",
    chapter: "打通青嶂关并在云栈旅亭留下归路，完成你在青玄界的第一段行旅。",
  };
}
