import { pactFightError } from "../secret-pact/rules";
import { heroineGoal, isHeroineAction, heroineError, maleMainline, sharedJourneyDone } from "./heroine";
import { foundationCap, foundationBlock, hasSteady } from "./growth-state";
import { isGrowthAction, growthQuote, routeForBattle } from "./growth";
import { realmStageLabel } from "../cultivation";
import type { State } from "../world";
import { challenges, rankIds, sideChoices } from "./content";
import type { BattleId, JourneyAction } from "./state";
export const companionPresent = (s: State) =>
  !["away", "missing", "shelter"].includes(s.foundationJourney.whereabouts);
export const cultivationStage = realmStageLabel;
export function foundationGoal(s: State) {
  const q = s.foundationJourney;
  if (q.duel)
    return `正在挑战${challenges[q.duel.id].name}；看清来招，也可无新增伤势撤退。`;
  if (heroineGoal(s)) return heroineGoal(s);
  if (!s.adventure.road.surveyed)
    return "先以筑基之力走通青嶂关，在云栈旅亭留下归路。";
  if (!q.ferry) return "去山河地图的筑基行旅，前往无名渡争取沉井传承。";
  if (q.ferry === 1)
    return "准备功法与灵器，挑战沉井守府石偶。寻姐与取证可自由选择。";
  if (q.inheritance === "none")
    return "选择一条适合自己打法的沉井传承，然后亲手试用。";
  if (!q.won.includes("application")) return foundationBlock(s);
  if (q.ferry === 2) return "中期已可积累；准备好后挑战离渡执卫，打通三地药路。";
  if (q.ferry === 3) return "可护送渡客或破禁离渡，也可留下寻亲、查证。";
  if (q.cultivation < 200) return `再积累 ${200-q.cultivation} 点到筑基中期，前往三地择一取材。`;
  if(!maleMainline(s) && q.rescue === 1)return "先辨认信号，确认内部避险处。";
  if(!maleMainline(s) && q.rescue === 2)return q.heroine.supplied ? "补给已送达，向程砚学稳脉，再安排内层接应。" : q.won.includes("frontier") ? "外缘已打通，将补给送入石室。" : "击退外缘石偶，送入第一批补给。";
  if(!maleMainline(s) && q.rescue === 3)return "比较境界差距与越阶准备，再完成内层接应；晋后期需另行炼化机缘主材。";
  if (!q.growth.refined) return foundationBlock(s);
  if (q.cultivation < 400) return `灵元已凝练，再积累 ${400-q.cultivation} 点到后期。`;
  if (!hasSteady(q)) return "可请药庄岑霁助你行功，去古道自行调息，或接应后向程砚请教稳脉。";
  if (!q.condensation) return `稳脉已成，修行至 500 后到古道贯通周天（当前 ${q.cultivation}）。`;
  if (!q.won.includes("culmination")) return "到古道独自完成长风归流；已学贯流在换招时增伤减伤。";
  if (q.cultivation < 600) return `归流已通，再积累 ${600-q.cultivation} 点修行至圆满。`;
  if (!q.epilogue) return "回听松行前居，收束筑基篇，查看凝丹筹备缺口。";
  return "筑基篇已完成。可以继续原角色，回访故人或挑战尚未完成的榜单。也可筹备凝丹主药、丹药与灵地，叩关金丹。";
}
export function battleError(s: State, id: BattleId) {
  const q = s.foundationJourney,
    e = challenges[id];
  if (!Object.hasOwn(challenges, id)) return "未知挑战";
  if (q.won.includes(id)) return "本场已胜，奖赏已领";
  if (s.injury > 2) return "先静养至伤势不高于 2";
  if (s.stones < (id === "frontier" && q.growth.routes.frontier.choice === "careful" ? 0 : e.cost)) return `需灵石 ${e.cost}；可劳作筹备`;
  if (rankIds.includes(id) && s.age < 216) return "年满十八岁后可参加";
  if (rankIds.includes(id))
    return rankIds[q.board.wins.length] === id ? "" : "先击败本组前一位对手";
  if (id === "pactRival") return pactFightError(s);
  if (id === "application") return q.location === "ferry" && q.inheritance !== "none" && s.journey.main === q.inheritance ? "" : "到无名渡装配已得沉井传承，再试运新法";
  if (id === "steady") return q.growth.steadyStudy !== "none" && !hasSteady(q) && q.location === (q.growth.steadyStudy === "medicine" ? "estate" : "frontier") ? "" : "先在药庄备好行功疗程，或在古道研习调息记录";
  if (id === "frontier" && q.location === "frontier" && q.rescue === 2) return "";
  const route = routeForBattle(id);
  if (route) {
    const p=q.growth.routes[route];
    if (q.location !== route || !p.prepared || !p.choice) return "先完成当地机缘整备与现场取舍";
    if (route === "estate" && !q.won.includes("estate")) return "先了解药圃并稳住护圃阵";
    return "";
  }
  if (id === "culmination")
    return q.location === "frontier" && q.condensation && (!maleMainline(s) || q.rescue === 4)
      ? ""
      : "先在古道贯通周天，再试长风归流";
  if (id === "well" && maleMainline(s) && q.heroine.purpose === "none") return "先与苏婉宁交流入井来意";
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
  if (isHeroineAction(a)) return heroineError(s,a);
  if (isGrowthAction(a)) return growthQuote(s,a).error;
  if (a.kind === "battle") return battleError(s, a.battle);
  if (a.kind === "travel") {
    if (
      !["home", "ferry", "estate", "snow", "inn", "frontier"].includes(
        a.destination,
      )
    )
      return "未知目的地";
    if (a.destination === "ferry" && maleMainline(s) && q.heroine.meeting === "none") return "先在行前居接续青嶂勘路，与苏婉宁一同开路";
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
        return "渡客已经离岸，仍可补证追责，离渡之事已无法重来";
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
  if (a.kind === "revisit") {
    if (!["estate", "snow", "inn"].includes(a.side)) return "未知回访地点";
    return q.location === a.side &&
      q.sides[a.side].step === 3 &&
      !q.aftermath[a.side]
      ? ""
      : "当地事务未了，或此番已回访过";
  }
  if (a.kind === "epilogue")
    return q.location === "home" && q.cultivation === 600 && q.won.includes("culmination") && !q.epilogue
      ? ""
      : "完成长风归流后回听松行前居";
  if (a.kind === "sharedMoment")
    return q.location === "home" &&
      companionPresent(s) &&
      q.bond === "covenant" &&
      !q.sharedMoment
      ? ""
      : "结契后双方在行前居时，可共度一次出行前的晚饭";
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
      (!maleMainline(s) && s.age < 216) ||
      !sharedJourneyDone(s)
    )
      return "成年相识后，先相约同行一次";
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
      return s.age >= 216 && s.social.bonded && q.contact !== "none" && q.bond === "none"
        ? ""
        : "须已定情、商定联络，双方再表达结契意愿";
    if (a.kind === "covenant")
      return q.bond === "promised" ? "" : "先商议结契，再明确答应";
    if (a.kind === "prepareTogether")
      return q.aid
        ? "护脉药包尚未用过，无须再备"
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
      return q.rescue === 0 && q.cultivation >= (maleMainline(s) ? 400 : 240) && q.whereabouts !== "away" && (!maleMainline(s) || (q.reunion && q.heroine.expedition))
        ? ""
        : "需筑基修行 240；已有正常分别者先按约重逢";
    if (a.kind === "signal") return q.rescue === 1 ? "" : "先核实古道事故";
    if (a.kind === "supply")
      return q.rescue === 2 && q.won.includes("frontier") && !q.heroine.supplied ? (s.herbs >= 2 ? "" : "需灵草 2 送入避险处；可采药") : "先确认处境并打通外缘；补给只送一次";
    if (a.kind === "mentor")
      return q.rescue === 2 && q.won.includes("frontier") && q.heroine.supplied
        ? ""
        : "先打通外缘并送入补给";
    if (a.kind === "finish")
      return hasSteady(q) && q.growth.refined && q.cultivation >= 500 && !q.condensation
        ? ""
        : "学会任一种稳脉法，灵元凝练并积累至 500";
  }
  return "当前无法执行";
}
