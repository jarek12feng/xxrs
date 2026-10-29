import type { State } from "./world";
import { passSolutions } from "./pass-solutions";

export function lifeReview(s: State) {
  const records: string[] = [];
  const unfinished: string[] = [];
  const next: string[] = [];
  if (s.realm === 1)
    records.push("你已由炼气踏入筑基，能够承受旧阵深处的灵流。");
  else records.push("此世尚未筑基，已经走过的路仍记在卷宗里。");
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
    const alternatives = {
      medicine:
        "下世可试一剑开山：让货车通行、请商队架桥，但旧刻痕将无法保全。",
      sword:
        "下世可试与山立约：保留旧阵与名字、凭归阵手法辨读废驿，但赶路者须等候。",
      array: "下世可试草木作桥：保住活根、沿根脉救草，但货车仍需绕行。",
    };
    next.push(alternatives[route]);
  } else if (route === "legacy")
    records.push("你沿旧路越过山口，没有取得三种新解法的专属能力。");
  else unfinished.push("青嶂关尚未留下本世的归路选择。");
  if (s.adventure.mist.revisited)
    records.push("你带回探灵灯，重访山祠，点亮了归灯。");
  else if (s.adventure.mist.stage !== "dormant")
    unfinished.push("雾海来信仍有未完的追寻；归灯尚未点亮。");
  if (s.journey.maps.sea === 3)
    records.push("陆迟父亲的亲笔信已经送回；他仍在守灯，父子尚未团聚。");
  if (s.social.arena.wins)
    records.push(
      `听松擂台已胜 ${s.social.arena.wins}/3 场${s.social.arena.wins === 3 ? "，夺得本届魁首" : ""}。`,
    );
  next.push(
    s.journey.main === "spring"
      ? "下世可试剑经抢攻：少耗草、争取早收尾，也要承担额外承伤。"
      : "下世可试长春续航：把灵草留给守势，在战斗耗材与炼丹准备之间取舍。",
  );
  if (s.story.choice === "gift")
    next.push("下世可留下孤丹，亲历护脉丹纹与另一种独行结局。");
  else if (s.story.choice === "self")
    next.push("下世可把孤丹赠给陆迟，再看故人会怎样护持你。");
  return { records, unfinished, next };
}
