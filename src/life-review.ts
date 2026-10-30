import { foundationBoard } from "./foundation-journey/view";
import { trialBoard } from "./world-ambition";
import type { State } from "./world";
import { passSolutions } from "./pass-solutions";

export function lifeReview(s: State) {
  const records: string[] = [];
  const unfinished: string[] = [];
  if (s.adventure.rescueChoice === "roots")
    records.push(
      "你把药工救回山下，留下成株护住药圃；山下的伤者等了另一队送药。",
    );
  if (s.adventure.rescueChoice === "supplies")
    records.push(
      "你把药工与成株送回山下，救了眼前的伤者；祠边药圃因此暂歇一季。",
    );
  if (s.realm === 1)
    records.push("你已由炼气踏入筑基，能够承受旧阵深处的灵流。");
  else records.push("尚未筑基，已经走过的路仍记在卷宗里。");
  if (s.expedition.cleared === 3)
    records.push("你护送药队、查清古阵，击败守阵傀儡并取出转运册。");
  else if (s.expedition.accepted)
    unfinished.push(
      `护送与旧阵已完成 ${s.expedition.cleared}/3 段，转运册尚未取出。`,
    );
  const route = s.adventure.road.solution;
  if (route !== "none" && route !== "legacy") {
    records.push(
      `你选择了${passSolutions[route].name}。${passSolutions[route].consequence}`,
    );
  } else if (route === "legacy") records.push("你沿旧路越过青嶂山口。");
  else unfinished.push("青嶂关尚未留下你的归路选择。");
  if (s.adventure.mist.revisited)
    records.push("你带回探灵灯，重访山祠，点亮了归灯。");
  else if (s.adventure.mist.stage !== "dormant")
    unfinished.push("雾海来信仍有未完的追寻；归灯尚未点亮。");
  if (s.journey.maps.sea === 3)
    records.push("陆迟父亲的亲笔信已经送回；他仍在守灯，父子尚未团聚。");
  if (s.social.arena.wins)
    records.push(
      `听松试剑榜：${trialBoard(s).title}，胜 ${s.social.arena.wins}/3 场。`,
    );
  const q = s.foundationJourney;
  if (q.board.wins.length)
    records.push(
      `听松试剑榜 · 筑基组：${foundationBoard(s).title}，首胜 ${q.board.wins.length}/5 场，奖励已入袋。`,
    );
  if (q.ferry === 4)
    records.push(
      `无名渡传承与离渡已完成：${{ open: "隐去病人身份，公开证据", escort: "先护送离渡", break: "破禁开放出口", none: "" }[q.ferryOutcome]}。`,
    );
  if (q.sister === "reunited")
    records.push(
      "郁青与郁晚舟当面重逢，她还在侧院照料伤者，姐弟约好继续通信。",
    );
  if (q.bond === "covenant") records.push("你与知己在窗下交换信物，结为道侣。");
  if (q.reunion)
    records.push("分别远行后，你们在听松重逢，交换了新图或修阵所得。");
  if (q.rescue === 4)
    records.push(
      q.target === "companion"
        ? "与道侣内外接应，和探索队一起安全撤回。"
        : "与闻岑内外接应，探索队安全撤回。",
    );
  if (q.condensation)
    records.push("筑基修行圆满，金丹前主线收束，已整理凝丹准备。");
  else if (q.ferry)
    unfinished.push("仍在积累筑基修行与古道稳脉机缘，凝丹准备尚未完成。");
  return { records, unfinished };
}
