import type { State } from "../world";
import { challenges, rankIds, sideChoices } from "./content";
import type { BattleId, JourneyAction } from "./state";
export const companionPresent = (s: State) =>
  !["away", "missing", "shelter"].includes(s.foundationJourney.whereabouts);
export const cultivationStage = (s: State) =>
  ["筑基初期", "筑基中期", "筑基后期", "筑基圆满"][
    Math.min(3, Math.floor(s.foundationJourney.cultivation / 200))
  ]!;
export function foundationGoal(s: State) {
  const q = s.foundationJourney;
  if (q.duel)
    return `正在挑战${challenges[q.duel.id].name}；看清来招，也可无新增伤势撤退。`;
  if (!s.adventure.road.surveyed)
    return "先以筑基之力走通青嶂关，在云栈旅亭留下归路。";
  if (!q.ferry) return "去山河地图的筑基行旅，前往无名渡争取沉井传承。";
  if (q.ferry === 1)
    return "准备功法与灵器，挑战沉井守府石偶。寻姐与取证可自由选择。";
  if (q.inheritance === "none")
    return "选择一条适合自己打法的沉井传承，然后亲手试用。";
  if (q.ferry === 2)
    return q.cultivation >= 80
      ? "修行已足，装配传承后挑战离渡禁制，亲手试用新法门。"
      : `再积累 ${80 - q.cultivation} 点筑基修行，即可挑战离渡禁制，试用刚获得的传承。`;
  if (q.ferry === 3)
    return "决定渡口如何交接；可以先破禁或护送，不要求完整追责。";
  if (q.rescue < 4)
    return "前往云外古道，核实事故、接通信号、送入补给，再与程砚共同打开归路。";
  if (!q.condensation)
    return `古道接应已完成。筑基修行 ${q.cultivation}/600；积累圆满后整理凝丹准备，支线和榜单均非必做。`;
  return "金丹前主线已收束，凝丹准备已记下。可回访故人、补完支线或挑战听松筑基榜；金丹突破尚未开放。";
}
export function battleError(s: State, id: BattleId) {
  const q = s.foundationJourney,
    e = challenges[id];
  if (!Object.hasOwn(challenges, id)) return "未知挑战";
  if (q.won.includes(id)) return "本场已胜，不重复发奖";
  if (s.injury > 2) return "先静养至伤势不高于 2";
  if (q.cultivation < e.cultivation)
    return `需筑基修行 ${e.cultivation}，当前 ${q.cultivation}；可回洞府吐纳`;
  if (s.stones < e.cost) return `需灵石 ${e.cost}；可劳作筹备`;
  if (rankIds.includes(id) && s.age < 216) return "年满十八岁后可参加";
  if (rankIds.includes(id))
    return rankIds[q.board.wins.length] === id ? "" : "先击败本组前一位对手";
  if (id === "well")
    return q.location === "ferry" && q.ferry === 1 ? "" : "先前往无名渡";
  if (id === "exit")
    return q.location === "ferry" && q.ferry === 2 && q.inheritance !== "none"
      ? ""
      : "先探沉井并取得传承";
  if (id === "estate" || id === "snow")
    return q.location === id && q.sides[id].step === 1
      ? ""
      : "先到当地了解险阻与旧记录";
  if (id === "frontier")
    return q.location === "frontier" && q.rescue === 2
      ? ""
      : "先核实信号并完成首次补给";
  return q.location === "frontier" &&
    q.rescue === 3 &&
    q.won.includes("frontier")
    ? ""
    : "先完成外缘挑战并向程砚学稳脉";
}
export function journeyActionError(s: State, a: JourneyAction): string {
  const q = s.foundationJourney;
  if (
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel
  )
    return "先处理眼前事件或结束交锋";
  if (s.realm < 1) return "筑基后开放";
  if (q.duel)
    return a.kind === "move" || a.kind === "withdraw"
      ? ""
      : "交锋中不能换装、旅行或另领奖励";
  if (a.kind === "move" || a.kind === "withdraw") return "当前没有交锋";
  if (a.kind === "battle") return battleError(s, a.battle);
  if (a.kind === "travel") {
    if (
      !["home", "ferry", "estate", "snow", "inn", "frontier"].includes(
        a.destination,
      )
    )
      return "未知目的地";
    if (a.destination === q.location) return "已在此处";
    if (a.destination !== "home" && !s.adventure.road.surveyed)
      return "先走通青嶂关并记录归路";
    if (!["home", "ferry"].includes(a.destination) && q.ferry < 4)
      return "先完成无名渡主干，打通药路出口";
    return "";
  }
  if (a.kind === "inherit")
    return q.location === "ferry" &&
      q.ferry === 2 &&
      q.inheritance === "none" &&
      ["spring", "blade", "breath"].includes(a.technique)
      ? ""
      : "此刻不能领取传承";
  if (
    ["sister", "reuniteSister", "evidence", "consent", "ferryOutcome"].includes(
      a.kind,
    )
  ) {
    if (q.location !== "ferry" || !q.ferry) return "先到无名渡";
    if (a.kind === "sister")
      return q.sister === "none" ? "" : "已经接下这次寻亲";
    if (a.kind === "reuniteSister")
      return q.sister === "promised" && q.ferry >= 2
        ? ""
        : "答应寻亲并打通外府后，可去侧院打听消息";
    if (a.kind === "consent")
      return q.sister === "reunited" && !q.consent
        ? ""
        : "先当面重逢，再询问公开范围";
    if (a.kind === "evidence")
      return !["paper", "registry", "control"].includes(a.evidence) ||
        q.evidence.includes(a.evidence)
        ? "没有新的可核实记录"
        : a.evidence === "control" && q.ferry < 2
          ? "先进入外府"
          : "";
    if (a.kind === "ferryOutcome") {
      if (q.ferry < 3 || !["open", "escort", "break"].includes(a.outcome))
        return "先打通离渡通路";
      if (q.ferryOutcome === a.outcome || q.ferryOutcome === "open")
        return "已完成这一交接";
      if (q.ferry === 4 && a.outcome !== "open")
        return "交接后只能补证追责，不重选已经发生的安排";
      if (a.outcome === "open" && (q.evidence.length < 3 || !q.consent))
        return "需三份相互印证的记录，并取得郁晚舟的公开范围同意；可先护送或破禁";
      return "";
    }
  }
  if (a.kind === "sideInvestigate" || a.kind === "sideResolve") {
    if (!Object.hasOwn(q.sides, a.side) || q.location !== a.side || q.ferry < 4)
      return "先到对应地点";
    const side = q.sides[a.side];
    if (a.kind === "sideInvestigate")
      return side.step === 0 ? "" : "已核实这段线索";
    if (side.step !== 2 || !Object.hasOwn(sideChoices[a.side], a.outcome))
      return "先完成现场历险或跟随阿团";
    return "";
  }
  if (a.kind === "oldFriend")
    return q.ferry >= 4 && !q.oldFriend
      ? ""
      : "完成无名渡后可接续陆迟近况，仅记录一次";
  if (
    [
      "contact",
      "propose",
      "covenant",
      "prepareTogether",
      "depart",
      "reunion",
    ].includes(a.kind)
  ) {
    if (
      !s.social.met ||
      !s.social.gender ||
      s.age < 216 ||
      s.companionship.stage !== "done"
    )
      return "先成年相识并完成一次职业同行";
    if (s.adventure.mist.partner === "companion" && !s.adventure.mist.settled)
      return "先收束已经约好的雾海同行";
    if (a.kind === "reunion")
      return q.location === "home" &&
        q.whereabouts === "away" &&
        q.departedAt !== null &&
        s.month >= q.departedAt + 3
        ? ""
        : "分别后至少修行三个月，再回听松行前居按约见面；没有现实倒计时";
    if (!companionPresent(s) || q.location !== "home")
      return "对方不在听松行前居；可查看已知去向";
    if (a.kind === "contact")
      return q.contact === "none" && ["letters", "station"].includes(a.contact)
        ? ""
        : "已经约好联系办法";
    if (a.kind === "propose")
      return s.social.bonded && q.contact !== "none" && q.bond === "none"
        ? ""
        : "须已定情、商定联络，双方再表达结契意愿";
    if (a.kind === "covenant")
      return q.bond === "promised" ? "" : "先商议结契，再明确答应";
    if (a.kind === "prepareTogether")
      return q.aid
        ? "本次共同准备尚未使用，不叠加"
        : s.herbs < 2
          ? "需灵草 2；朋友也能共同准备"
          : "";
    if (a.kind === "depart")
      return q.contact !== "none" && !q.reunion && q.whereabouts === "home"
        ? ""
        : "先约好联络；这趟远行已经安排过了";
  }
  if (["report", "signal", "supply", "mentor", "finish"].includes(a.kind)) {
    if (q.location !== "frontier" || q.ferry < 4) return "先到云外古道";
    if (a.kind === "report")
      return q.rescue === 0 && q.cultivation >= 240 && q.whereabouts !== "away"
        ? ""
        : "需筑基修行 240；已有正常分别者先按约重逢";
    if (a.kind === "signal") return q.rescue === 1 ? "" : "先核实古道事故";
    if (a.kind === "supply")
      return q.rescue === 2 && !q.won.includes("frontier")
        ? "补给通路须通过外缘挑战打通；选择外缘挑战即可"
        : "补给随外缘胜利结算，不重复消耗";
    if (a.kind === "mentor")
      return q.rescue === 2 && q.won.includes("frontier")
        ? ""
        : "先打通外缘并送入补给";
    if (a.kind === "finish")
      return q.rescue === 4 && q.cultivation >= 600 && !q.condensation
        ? ""
        : "完成内外接应，并将筑基修行积累至 600";
  }
  return "当前无法执行";
}
