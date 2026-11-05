import { foundationBoard } from "./foundation-journey/view";
import { trialBoard } from "./world-ambition";
import type { State } from "./world";
import { passSolutions } from "./pass-solutions";

export function lifeReview(s: State) {
  const records: string[] = [];
  const pact=s.secretPact;
  if(pact.promisedMonth!==null)records.push(`修行第 ${pact.promisedMonth} 月，与贺崇、叶照约定中期同探照玄遗府。`);
  if(pact.stage==='resolved')records.push(pact.last);
  if(pact.aggressor==='player')records.push('照玄府中，你先毁约夺简，叶照不再应邀同行。');
  if(pact.aggressor==='rival')records.push(pact.settled?'与贺崇的夺宝旧怨已传信了结。':'贺崇毁约夺简，旧怨未了。');
  const r = s.recognition;
  if (r.innerMonth !== null) records.push(`修行第 ${r.innerMonth} 月，凭青嶂亲历受录内门。`);
  for (const a of r.appointments) records.push(`修行第 ${a.month} 月，受任${a.tier === 1 ? '领队' : a.affiliation === 'dan' ? '丹房主事' : a.affiliation === 'jian' ? '护路执事' : '药队客卿'}。`);
  for (const d of r.deeds) records.push(`修行第 ${d.month} 月，${['首次独领山口药队','首次主持筑基药运','首次统筹深山归路'][d.tier]}，${d.method === 'supplies' ? '以药护脉，稳行归来' : '凭亲习功法护住同行者'}。`);
  const unfinished: string[] = [];
  if (s.adventure.rescueChoice === "roots")
    records.push(
      "你把药工救回山下，留下成株护住药圃；山下的伤者等了另一队送药。",
    );
  if (s.adventure.rescueChoice === "supplies")
    records.push(
      "你把药工与成株送回山下，救了眼前的伤者；祠边药圃因此暂歇一季。",
    );
  if (s.realm >= 1)
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
        ? `与${q.bond === "covenant" ? "道侣" : "同行故人"}内外接应，和探索队一起安全撤回。`
        : "与闻岑内外接应，探索队安全撤回。",
    );
  if (q.condensation)
    records.push("筑基修行圆满，已将沉井传承与古道稳脉接成周天贯流。");
  else if (q.ferry && s.realm === 1)
    unfinished.push("仍在积累筑基修行与古道稳脉机缘，凝丹准备尚未完成。");
  if (q.won.includes("culmination"))
    records.push("独自走完长风归流阵，完成筑基圆满试炼。");
  if (q.epilogue) records.push("长风归山：你已完成筑基圆满历练，亲自走回山门。");
  if (q.sharedMoment)
    records.push("与道侣在行前居共度雨夜，留下各自远行前的一顿饭。");
  for (const side of ["estate", "snow", "inn"] as const)
    if (q.aftermath[side])
      records.push(
        `${{ estate: "药庄", snow: "雪线", inn: "旅亭" }[side]}回访：亲手参与了自己选择留下的后续。`,
      );
  if (s.realm >= 2) records.push('你凝成金丹，将一身修行带往外海。');
  if (s.goldenCore.farShore) records.push('越过穿云壁，亲自看见了山外与外海相连的天地。');
  const sea = s.outerSea;
  if (sea.seal) records.push(`退潮遗迹所得镇潮印${sea.attuned ? '已经温养，可主动御使' : '已收入行囊'}。`);
  if (sea.manual) records.push('你取得澄息篇，留下另一条运功的可能。');
  if (sea.cleared === 1) unfinished.push('内府观潮记录尚未取回，另一件机缘的封印未解。');
  if (s.conclave.wins) records.push(`诸宗会中取得 ${s.conclave.wins} 场胜绩。`);
  if (s.lizhao.cleared) records.push('你从离照内层取得定性辅药，为凝婴备下实物。');
  if (s.lizhao.route !== 'none' && !s.lizhao.cleared) unfinished.push('离照药池的辅药尚未取回。');
  if (s.lizhao.recipeVerified) records.push('离照试炉完成，亲手验证了分潮与定性药理。');
  if (s.goldenStory.companionConfirmedAt !== null) records.push('你已收到可靠消息，确认苏婉宁独立凝丹。');
  const n = s.nascentSoul;
  if (n.brews) records.push(`你曾炼成化婴丹 ${n.brews} 炉，为叩问天关备下丹药。`);
  if (s.realm >= 3) records.push(n.thunder.cleared ? '三重天关已过，金丹化婴；你曾真正站上新的境界。' : '你已成就元婴，走过的修行仍留在今生的履历里。');
  else if (n.thunder.practiced || n.brews) unfinished.push('凝婴的准备已留下痕迹，元婴天关却未跨过。');
  if (n.ability === 'done') records.push('元婴初成后，你亲自护渡并完成彼岸测绘，让新能力落在了实处。');
  if (['married', 'renewed'].includes(n.ceremony)) records.push('你们依彼此的选择完成结契礼，留下今生的约定。');
  if (q.whereabouts === 'away' && s.social.met) unfinished.push('故人仍在自己的远行途中，你们尚未再次相见。');
  if (s.status === 'dead' && s.realm < 3 && !unfinished.some(x => x.includes('天关'))) unfinished.unshift(`${['筑基', '凝丹', '凝婴'][s.realm]}之愿尚未实现，此生的修行止在这里。`);
  return { records, unfinished };

}
