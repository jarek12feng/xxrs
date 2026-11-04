import { quoteSettlement, settleResources, type ResourceSettlement } from "../economy";
import { inspectInteraction } from "../story-interactions";
import type { CombatAdjustment } from "../combat";
import { resolveTurn, startBattle } from "../combat";
import {
  passageIds,
  passagePlan,
  settlePassage,
  type Passage,
} from "./passage";
import { medicineOpening, qiExpectedMove, qiTacticalCue } from "./tactics";
import { runWorkshop, workshopQuote } from "../workshop/rules";
import { isPersonAction, personError, personQuote, settlePerson } from "./people";
import {
  isPreparationAction,
  preparationError,
  preparationQuote,
  settlePreparation,
  preparationReady,
  preparationEnemy,
  completePreparation,
  preparationRoutes,
} from "./preparation";
import type { State } from "../world";
import { hasFoundationRecipe } from "../foundation";
import { readiness, tacticalPreview } from "../combat/game";
import type { Move } from "../expedition/content";
import { qiSites, commissions, type QiAction } from "./content";
import type { QiRoute } from "./state";
export { freshQiJourney, validQiJourney, qiCap } from "./state";
export type { QiJourney } from "./state";
export type { QiAction } from "./content";
export function qiGoal(s: State) {
  const q = s.qiJourney;
  if (s.realm || !q) return null;
  if (q.trial)
    return `${preparationRoutes[q.trial].name}：独自闯过此关，再往秘境取材。`;
  if (q.node)
    return `${qiSites[q.gates]!.name}：${q.node === 2 ? "穿过险地，保留气势迎战守关者。" : "留意敌人的动作，检验你的准备。"}`;
  if (q.essence)
    return `${qiSites[q.gates]!.material}已取得：自行炼化、请师门护脉或付费请匠师协助。`;
  if (q.gates === 2)
    return "经脉与凝元已稳：备齐圆满修为与筑基丹，再考虑固本和疗伤后叩关。";
  if (s.qi >= qiSites[q.gates]!.qi && !preparationReady(s))
    return "药谷采药、师门护送、独闯古阵，择一历练，再入秘境取材。";
  if (q.gates === 1 && preparationReady(s) && !hasFoundationRecipe(s))
    return "先赴青石遗府取得丹方与内府图：回洞府丹炉查看遗府之约与探府准备。";
  return s.qi < qiSites[q.gates]!.qi
    ? `先修炼到 ${qiSites[q.gates]!.qi} 修为，准备${qiSites[q.gates]!.name}。`
    : `突破${q.gates === 0 ? "后期" : "圆满"}瓶颈：准备功法、法器与补给，进入${qiSites[q.gates]!.name}取得${qiSites[q.gates]!.material}。`;
}
function qiRequirementError(s: State, a: QiAction): string {
  const q = s.qiJourney;
  if (
    s.status !== "alive" ||
    (s.realm && !isPersonAction(a)) ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.foundationJourney.duel
  )
    return "先处理眼前事件或结束交锋";
  if (a === "withdraw") return q.node ? "" : "当前没有外出历练";
  if (q.duel)
    return ["guard", "strike", "discern"].includes(a) ? "" : "先结束交锋或撤回";
  if (["guard", "strike", "discern"].includes(a)) return "当前没有交锋";
  if (q.node === 2) {
    if (!passageIds.includes(a as Passage)) return "先通过险地或撤回";
    return passagePlan(s, a as Passage, qiPower(s).hp).error;
  }
  if (isPersonAction(a)) return personError(s, a);
  if (isPreparationAction(a)) return preparationError(s, a);
  if (a.startsWith("buy:")) {
    const product = a.slice(4);
    if (product !== "healing" && product !== "sword" && product !== "vial")
      return "未知货物";
    return workshopQuote(s, { product, method: "buy" }).error;
  }
  if (a.startsWith("commission:")) {
    const k = a.slice(11) as keyof typeof commissions;
    if (!commissions[k]) return "未知委托";
    if (s.adventure.step !== "done") return "先救回药工，认识山下众人";
    if (q.commissions.includes(k)) return "这份委托已经结清";
    if (k === "herbs" && s.herbs < 4) return "需要灵草 4；可采药或坊市购入";
    if (k === "healing" && (s.qi < 120 || s.growth.medicines.healing < 2))
      return "需要炼气中期、回春散 2；研读丹理后可自行炼制";
    if (k === "survey" && (!q.gates || s.study < 2 || s.sense < 8))
      return "先完成淬脉，并有心得 2、神识 8";
    return "";
  }
  if (q.gates >= 2) return "已完成凝元，准备筑基";
  if (a.startsWith("enter:")) {
    const r = a.slice(6) as QiRoute;
    if (!["medicine", "sword", "array"].includes(r)) return "未知入谷准备";
    if (q.essence) return "材料已经取到，先炼化";
    if (!preparationReady(s))
      return "先择药谷、宗门或散修一路，备妥行装并亲自闯关";
    if (s.adventure.step !== "done") return "先救回药工，取得泉谷线索";
    if (s.qi < qiSites[q.gates]!.qi) return `需要修为 ${qiSites[q.gates]!.qi}`;
    if (q.gates === 1 && !hasFoundationRecipe(s))
      return "先赴青石遗府取得丹方与内府图";
    if (s.injury >= 3) return "先养伤至 2 以下";
    if (!s.journey.main) return "先装配一门主修功法";
    if (s.stones < qiSites[q.gates]!.fee)
      return `行前补给需要灵石 ${qiSites[q.gates]!.fee}`;
    if (r === "medicine" && s.herbs < 4) return "药理护身需要灵草 4";
    if (r === "sword" && s.mastery < 4) return "剑意开路需要剑意 4";
    if (r === "array" && (s.sense < 8 || s.study < 2))
      return "识阵寻隙需要神识 8、心得 2";
    return "";
  }
  if (["refine", "mentor", "artisan"].includes(a)) {
    if (!q.essence)
      return `先从${qiSites[q.gates]!.name}带回${qiSites[q.gates]!.material}`;
    const fee = a === "refine" ? 24 : a === "mentor" ? 12 : 48;
    if (a === "refine" && (s.study < 2 || s.herbs < 4))
      return "自行炼化需要心得 2、灵草 4、灵石 24";
    if (
      a === "mentor" &&
      (s.journey.branch === "none" || s.journey.contribution < 4)
    )
      return "师门护脉需要入门、贡献 4、灵石 12；也可自行炼化或请匠师";
    if (s.stones < fee) return `需要灵石 ${fee}；可接委托、师门差事或劳作`;
    return "";
  }
  return "未知行动";
}
export function qiQuote(s: State, a: QiAction) {
  const error = qiRequirementError(s, a);
  const settlement: ResourceSettlement = { cost: {}, reward: {} };
  if (isPersonAction(a)) return { ...personQuote(s, a), error };
  if (isPreparationAction(a)) return { ...preparationQuote(s, a), error };
  if (s.qiJourney.node === 2 && passageIds.includes(a as Passage)) {
    const p = passagePlan(s, a as Passage, qiPower(s).hp);
    return { error, months: 0, settlement: { cost: { herbs: p.herbs, ward: p.ward }, reward: {} } };
  }
  if (a === "buy:healing" || a === "buy:sword" || a === "buy:vial") {
    const p = workshopQuote(s, { product: a.slice(4) as "healing" | "sword" | "vial", method: "buy" });
    return { error, months: p.months, settlement: { cost: { stones: p.stones, herbs: p.herbs, iron: p.iron }, reward: a === "buy:healing" ? { healing: 1 } : {} } };
  }
  if (a.startsWith("enter:")) {
    settlement.cost.stones = qiSites[s.qiJourney.gates]?.fee ?? 0;
    if (a === "enter:medicine") settlement.cost.herbs = 4;
  }
  if (["refine", "mentor", "artisan"].includes(a)) {
    settlement.cost.stones = a === "refine" ? 24 : a === "mentor" ? 12 : 48;
    if (a === "refine") settlement.cost.herbs = 4;
    if (a === "mentor") settlement.cost.contribution = 4;
  }
  if (a === "commission:herbs") { settlement.cost.herbs = 4; settlement.reward.stones = 16; }
  if (a === "commission:healing") {
    settlement.cost.healing = 2;
    settlement.reward.stones = 24;
    if (s.journey.branch !== "none") settlement.reward.contribution = 2;
  }
  if (a === "commission:survey") settlement.reward.stones = 20;
  return {
    error: error || quoteSettlement(s, settlement.cost, settlement.reward).error,
    months: s.qiJourney.node || a === "withdraw" || a.startsWith("buy:") ? 0 : 1,
    settlement,
  };
}
export const qiError = (s: State, a: QiAction) => qiQuote(s, a).error;
export function qiEnemy(s: State) {
  const q = s.qiJourney;
  if (q.trial) return preparationEnemy(s);
  const e = qiSites[q.gates]?.enemies[q.node === 3 ? 1 : 0];
  return e ? { ...e, realm: 0 as const, stage: qiSites[q.gates]!.stage } : null;
}
export function qiPower(s: State) {
  const p = readiness(s),
    q = s.qiJourney;
  return {
    ...p,
    hp: p.hp + (q.route === "medicine" ? 12 : 0),
    damage: p.damage + q.gates * 2 + (q.route === "sword" ? 3 : 0),
    armor: p.armor + q.gates,
  };
}
export function qiPreview(s: State, move: Move) {
  const q = s.qiJourney,
    e = qiEnemy(s);
  if (!q.duel || !e) return null;
  const expected = qiExpectedMove(s, e.identity, e.pattern);
  const adjustments: CombatAdjustment[] = [];
  // Against beasts, guarding is a real defensive choice even outside the ideal tell.
  // Constructs already apply their own guard tradeoff in the combat engine.
  if (e.kind === "妖兽" && move === "guard") {
    adjustments.push({ phase: "power", damage: -3, armor: 4 });
  }
  if (q.route === "sword") adjustments.push({ phase: "power", armor: -1 });
  if (q.route === "array" && move === "discern" && expected === move) {
    adjustments.push({ phase: "power", damage: 3, armor: 2 });
  }
  const correct = expected === move;
  if (
    e.identity === "redback-badger" &&
    move === "strike" &&
    expected !== "strike"
  )
    adjustments.push({ phase: "power", damage: -4 });
  if (
    e.identity === "spring-python" &&
    expected === "discern" &&
    move !== "discern"
  )
    adjustments.push({ phase: "power", armor: -3 });
  if (e.identity === "corridor-guardian" && move === "discern" && correct)
    adjustments.push({ phase: "power", damage: 3 });
  if (
    correct &&
    ((e.kind === "妖兽" && q.people.beastLesson && move === "guard") ||
      (e.kind === "傀儡" && q.people.constructLesson && move === "discern"))
  )
    adjustments.push({ phase: "power", armor: 2 });
  if (medicineOpening(s, e.identity))
    adjustments.push({ phase: "power", armor: 4 });
  if (medicineOpening(s, e.identity))
    adjustments.push({ phase: "power", note: "药气诱开蛇首，本合承伤 −4。" });
  if (e.kind === "妖兽" && move === "guard")
    adjustments.push({ phase: "power", note: "收势护身：伤害 −3、承伤 −4。" });
  return tacticalPreview(s, {
    move: move,
    encounter: { ...e, pattern: Array<Move>(e.pattern.length).fill(expected) },
    battle: q.duel,
    effect: q.duel.effect,
    arrayCore: e.kind === "傀儡",
    power: qiPower(s),
    adjustments,
  });
}
export function qiEnemyTell(s: State) {
  const e = qiEnemy(s),
    d = s.qiJourney.duel;
  if (!e || !d) return "";
  return medicineOpening(s, e.identity)
    ? qiTacticalCue(s, e.identity)
    : e.tells[d.turn % e.pattern.length];
}
export function runQiJourney(
  input: State,
  a: QiAction,
  id: string,
  tick: (s: State) => State,
): State {
  const { quote } = inspectInteraction(input, a, qiQuote);
  if (quote.error) return input;
  if (a === "buy:healing" || a === "buy:sword" || a === "buy:vial")
    return runWorkshop(
      input,
      { product: a.slice(4) as "healing" | "sword" | "vial", method: "buy" },
      id,
      tick,
    );
  let s = structuredClone(input);
  // Outside combat every undertaking takes a month; existing appointments interrupt first.
  if (!s.qiJourney.node && a !== "withdraw") {
    s = tick(s);
    if (s.status !== "alive" || s.pending) {
      s.qiJourney.last =
        s.status === "alive"
          ? "行前来信，原行动暂缓：已过一月，物资未动、准备进度未增加。处理来信后需重新安排。"
          : "寿元已尽，此行未成。";
      s.seen = [...input.seen, id].slice(-512);
      return s;
    }
  }
  const q = s.qiJourney;
  if (!isPersonAction(a) && !isPreparationAction(a) && q.node !== 2 && settleResources(s, quote.settlement.cost, quote.settlement.reward).error) return input;
  if (a === "withdraw") {
    q.node = 0;
    q.duel = null;
    q.trial = null;
    q.last = "撤回山下。已用补给不返还，已炼化的成果保留；准备后可再来。";
  } else if (isPersonAction(a)) {
    if (!settlePerson(s, a)) return input;
  } else if (isPreparationAction(a)) {
    if (!settlePreparation(s, a)) return input;
    if (s.qiJourney.trial)
      s.qiJourney.duel = {
        ...startBattle(qiPower(s).hp, qiEnemy(s)!.hp),
        effect: "none",
      };
  } else if (a.startsWith("commission:")) {
    const k = a.slice(11) as keyof typeof commissions;
    q.commissions.push(k);
    q.last = commissions[k].text;
  } else if (a.startsWith("enter:")) {
    q.route = a.slice(6) as QiRoute;
    q.node = 1;
    q.duel = {
      ...startBattle(qiPower(s).hp, qiEnemy(s)!.hp),
      effect: "none",
    };
    q.last = qiSites[q.gates]!.intro;
  } else if (q.duel) {
    const d = q.duel,
      p = qiPreview(s, a as Move)!;
    const turn = resolveTurn(d, p, { turnLimit: 16, resolution: "journey" });
    const damage = turn.damage;
    Object.assign(d, turn.battle);
    s.herbs -= turn.herbs;
    q.last = `${qiEnemy(s)!.name}气势 −${damage}。`;
    if (turn.outcome === "win") {
      if (q.trial) {
        completePreparation(s);
      } else if (q.node === 1) {
        q.vigor = d.hp;
        q.node = 2;
        q.duel = null;
        q.last +=
          "路口已清。前方灵流逆涌，可用药调息，也可凭灵器或所学穿过；先看余下气势，再决定是否消耗补给。";
      } else {
        q.node = 0;
        q.duel = null;
        q.essence = true;
        if (q.gates === 0 && q.people.scoutReward === "none")
          q.people.scales = true;
        if (q.gates === 1 && q.people.smithReward === "none")
          q.people.core = true;
        s.stones += q.gates ? 16 : 12;
        q.last += `取得${qiSites[q.gates]!.material}，并带回${q.gates ? "失灵阵枢，可交给裴铸" : "完整蟒蜕，可交给许照岚"}。可携材料回山炼化。`;
      }
    } else {
      d.effect = a;
      q.last += `自身气势 −${p.incoming}${p.healing ? `、回气 +${p.healing}` : ""}。${p.note}`;
      if (turn.outcome === "loss") {
        q.duel = null;
        q.node = 0;
        q.trial = null;
        s.injury = Math.min(6, s.injury + 1);
        q.last += "败退，伤势 +1。静养后可筹备重试；修为与已炼化成果保留。";
      }
    }
  } else if (q.node === 2) {
    const p = settlePassage(s, a as Passage, qiPower(s).hp);
    if (p.error) return input;
    q.node = 3;
    q.duel = { ...startBattle(p.vigor, qiEnemy(s)!.hp), effect: "none" };
    q.last = `${p.label}：${p.cost}，以气势 ${p.vigor} 进入深处。`;
  } else {
    q.gates++;
    q.essence = false;
    q.route = null;
    s.foundation = Math.min(24, s.foundation + (q.gates === 1 ? 3 : 4));
    q.last =
      q.gates === 1
        ? "凝露草药力入脉，后期瓶颈已开。根基 +3；修至 240 后进入凝元内府，途中可凭淬脉后的经脉直接行气穿过逆流，不再耗药护脉。"
        : "凝元晶髓炼入气海，圆满瓶颈已开。根基 +4；积累到 360 修为后，可持筑基丹叩关。";
  }
  s.log.unshift({ month: s.month, kind: "major", text: q.last });
  s.log = s.log.slice(0, 180);
  s.seen = [...input.seen, id].slice(-512);
  return s;
}
