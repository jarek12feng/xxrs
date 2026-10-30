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
  } else if (route === "legacy")
    records.push("你沿旧路越过山口，没有取得三种新解法的专属能力。");
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
  return { records, unfinished };
}
