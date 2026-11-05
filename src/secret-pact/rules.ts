import {
  quoteSettlement,
  settleResources,
  type ResourceAmounts,
} from "../economy";
import { inspectInteraction } from "../story-interactions";
import type { State } from "../world";
import {
  revisionActions,
  revisionQuote,
  applyRevision,
  hasPactMaterial,
  type PactRevisionAction,
} from "./revision";
export { pactDestinationError, arrivePactSite } from "./revision";
export { pactTrialComplete, pactActivity } from "./state";
export type PactAction =
  | PactRevisionAction
  | "exitSite"
  | "promise"
  | "decline"
  | "enterAnchor"
  | "enterLight"
  | "exchange"
  | "yield"
  | "insist"
  | "seize"
  | "leave"
  | "settle"
  | "supplies";
export const pactEarnedTrust = (s: State) =>
  ["exchange", "yield", "won"].includes(s.secretPact.outcome);
export function pactFightError(s: State) {
  const p = s.secretPact;
  return p.site !== "zhaoxuan"
    ? "先抵达照玄遗府"
    : p.settled
      ? "双方已了结此怨"
      : (p.trial === "division" && p.stage === "betrayed") ||
          (["escape", "complete"].includes(p.trial) && p.outcome === "retreated" && !p.hazard)
        ? ""
        : "此时没有夺宝之争";
}
export function pactQuote(s: State, a: PactAction) {
  const p = s.secretPact,
    q = s.foundationJourney;
  let error =
      s.status !== "alive" ||
      s.pending ||
      s.social.scene ||
      s.social.arena.duel ||
      s.expedition.duel ||
      s.foundationJourney.duel ||
      s.wayfaring.trip ||
      s.wayfaring.passage ||
      s.qiJourney.node ||
      s.goldenCore.duel ||
      s.goldenCore.expedition !== "idle" ||
      s.outerSea.location === "ruins" ||
      s.conclave.duel ||
      s.conclave.location === "vault" ||
      s.sectContest.duel
        ? "先处理眼前事件或结束交锋"
        : "",
    herbs = 0,
    stones = 0,
    months = 0;
  error ||= s.realm !== 1 ? "筑基后再赴此约" : "";
  if (revisionActions.includes(a)) {
    const r = revisionQuote(s, a as PactRevisionAction);
    error ||= r.error;
    herbs = r.herbs;
    stones = r.stones;
    months = r.months;
  } else if (a === "exitSite") {
    error ||=
      p.site === "away" || p.hazard
        ? "先撤回安全石台"
        : p.trial === "division"
          ? "先决定分宝或退出争夺"
          : "";
  } else if (a === "exchange") {
    error ||= "贺崇不肯以药资换此传承；欲得玉简，须争过这一场";
  } else if (a === "promise" || a === "decline") {
    error ||= !["none", "declined"].includes(p.stage)
      ? "约定已记下"
      : q.location !== "ferry" && !hasPactMaterial(s)
        ? "在无名渡与两位道友相识"
        : "";
    if (a === "decline" && p.stage === "declined") error ||= "已谢绝此行";
  } else if (a === "enterAnchor" || a === "enterLight") {
    herbs = a === "enterAnchor" ? 2 : 0;
    months = 1;
    error ||=
      p.stage !== "promised"
        ? "先与两位道友约定同行"
        : q.cultivation < 200
          ? "罡风须持续护体，至少筑基中期方可入内"
          : p.site !== "zhaoxuan"
            ? "先从地图前往照玄遗府"
            : q.ferry < 4
              ? "先走通无名渡"
              : !hasPactMaterial(s)
                ? "药庄、雪线或古道择一路完成取材，再与道友会合"
                : s.injury > 2
                  ? "先将伤势养至 2 或以下"
                  : "";
  } else if (["yield", "insist", "seize"].includes(a)) {
    error ||=
      p.stage !== "inside" || p.trial !== "division"
        ? "先一同进入遗府"
        : p.site !== "zhaoxuan"
          ? "回照玄内府再商议分宝"
          : "";
  } else if (a === "leave") {
    error ||=
      !["inside", "betrayed"].includes(p.stage) || p.trial !== "division"
        ? "此番已经退出内府"
        : p.site !== "zhaoxuan"
          ? "回到照玄交代此事"
          : "";
  } else if (a === "settle") {
    error ||=
      p.stage !== "resolved" ||
      !["won", "seized", "retreated"].includes(p.outcome)
        ? "此时无夺宝旧怨可了结"
        : p.settled
          ? "此怨已了结"
          : "";
    if (p.manual && p.aggressor === "player") {
      herbs = 6;
      stones = 24;
    }
  } else if (a === "supplies") {
    error ||= !["exchange", "yield"].includes(p.outcome)
      ? "贺崇只向守约协商的旧友寄送补给"
      : p.supplies
        ? "补给已经收下"
        : "";
  } else error ||= "未知赴约事项";
  if (
    p.hazard &&
    !["guardFlow", "readFlow", "breakFlow", "withdrawFlow"].includes(a)
  )
    error ||= "先结束眼前险阵";
  error ||=
    s.herbs < herbs
      ? `需灵草 ${herbs}`
      : s.stones < stones
        ? `需灵石 ${stones}`
        : "";
  const reward: ResourceAmounts =
    a === "yield" ? { stones: 24 } : a === "supplies" ? { healing: 2 } : {};
  const settlement = { cost: { herbs, stones }, reward };
  error ||= quoteSettlement(s, settlement.cost, settlement.reward).error;
  return { error, herbs, stones, months, settlement };
}
export function runPact(
  input: State,
  a: PactAction,
  id: string,
  tick: (s: State) => State,
) {
  const { quote } = inspectInteraction(input, a, pactQuote);
  if (quote.error) return input;
  let s = structuredClone(input);
  if (quote.months) {
    s = tick(s);
    if (s.status !== "alive" || s.pending || s.social.scene) {
      s.secretPact.last =
        s.status === "alive"
          ? "行前来信，暂缓赴约。药材未动，两位道友仍按原约等候。"
          : "寿元已尽，未能赴约。";
      return finish();
    }
  }
  const p = s.secretPact;
  if (settleResources(s, quote.settlement.cost, quote.settlement.reward).error)
    return input;
  if (revisionActions.includes(a)) {
    applyRevision(s, a as PactRevisionAction);
  } else if (a === "exitSite") {
    p.last =
      "你退至府外安全石台，未完成的险阵记录保留。可就地静养，离开仍须走地图行程。";
  } else if (a === "promise") {
    p.stage = "promised";
    p.promisedMonth = s.month;
    p.last =
      "叶照收起阵盘：“照玄府内罡风不歇，须到筑基中期才能站稳。待你准备妥当，我们在古道外缘会合，不必赶日子。”贺崇按了按右腕：“旧伤多年，寻常丹药无用。若有补脉法，我志在必得。”三人约定：散财平分，独一份的传承当面议价，未议定前谁也不动手。";
  } else if (a === "decline") {
    p.stage = "declined";
    p.last = "你暂不同行。叶照留下方位：“日后有意，再来商议。”";
  } else if (a === "enterAnchor" || a === "enterLight") {
    p.stage = "inside";
    p.trial = "crossing";
    p.hazard = { hp: 100, progress: 0, turn: 0 };
    p.preparation = a === "enterAnchor" ? "anchor" : "light";
    p.last =
      (a === "enterAnchor"
        ? "你用灵草稳住阵钉，叶照替众人留了一段可靠退路。"
        : "你们轻装越过风口，省下药草，却未留稳固阵钉。") +
      " 贺崇按住旧伤，仍替你挡住门侧回流；叶照守归绳，你须亲手稳住阵脚、辨流、破开石门，才能到分宝石台。";
  } else if (a === "yield") {
    p.stage = "resolved";
    p.outcome = "yield";
    p.trial = "escape";
    p.hazard = { hp: 100, progress: 0, turn: 0 };
    p.last =
      "贺崇交出约定的二十四枚灵石，才伸手取简。叶照看着他受法，将这一笔分取记清。贺崇郑重一揖：“你让的是机缘，我记着。”你未得照玄护脉法，保住了一位愿意相助的同道。";
  } else if (a === "insist" || a === "seize") {
    p.stage = "betrayed";
    p.aggressor = a === "insist" ? "rival" : "player";
    p.last =
      a === "insist"
        ? "你请他依约继续商议。贺崇忽然扣住玉简，剑锋切向阵钉：“我已等不起下一回。”叶照护住退路，厉声喝止。你可夺回玉简，也可保全自身退出；败退不丢此前取得的晋升主材。"
        : "你趁两人验阵，先伸手夺简。贺崇横剑拦住你，叶照后退一步：“说好未议定便不动手，你先破的约。”她不再替你护阵。此举会留下毁约记录；夺得传承后，两人也不会再提供同行补给。";
  } else if (a === "leave") {
    p.stage = "resolved";
    p.outcome = p.aggressor === "none" ? "left" : "retreated";
    p.trial = "escape";
    p.hazard = { hp: 100, progress: 0, turn: 0 };
    if (p.aggressor !== "none") p.pursuit = "pending";
    p.last =
      p.outcome === "left"
        ? "你放下争执，沿退路离府。两位道友留下商议，你带着此前所得继续自己的道途。"
        : "你护住随身所得撤出。玉简留在贺崇手里，叶照记下了争执的始末。此后可回古道追索，也可传信了结旧怨；主材和既有修行均未失去。";
  } else if (a === "settle") {
    p.settled = true;
    p.pursuit = "closed";
    p.last =
      p.aggressor === "rival"
        ? "叶照寄来旧约副本，贺崇承认自己先动手，答应不再追索。你不欠他玉简，无需赔偿；已得法门保留。"
        : ["won", "seized"].includes(p.outcome)
          ? "你寄去六株灵草与二十四枚灵石，补偿贺崇另寻治伤之法。他回信应下止争，叶照也记下此约。传承仍归你，旧怨暂了；双方不再追索，也不恢复同行补给。"
          : "你传信言明不再追索玉简，贺崇也应下互不寻仇。旧怨暂了，双方不再同行。";
  } else if (a === "supplies") {
    p.supplies = true;
    p.last =
      "贺崇托药队送来两份回春散：“旧伤正在调治。下次行路，莫省这点护身药。”补给已收下，此信不另占行程。";
  }
  return finish();
  function finish() {
    s.seen = [...s.seen, id].slice(-512);
    s.log.unshift({ month: s.month, kind: "story", text: s.secretPact.last });
    s.log = s.log.slice(0, 180);
    return s;
  }
}
export function resolvePactBattle(s: State, victory: boolean) {
  const p = s.secretPact;
  p.stage = "resolved";
  p.outcome = victory
    ? p.aggressor === "player"
      ? "seized"
      : "won"
    : "retreated";
  p.manual = victory;
  const completed = p.trial === "complete";
  p.trial = completed ? "complete" : victory ? "stabilize" : "escape";
  p.hazard = null;
  p.pursuit = "pending";
  p.last = victory
    ? (p.aggressor === "player"
        ? "你击退贺崇，取走照玄玉简。叶照收起阵盘独自离去：“法是你的了，往后不必再来约我。”"
        : "你击落贺崇的剑，夺回玉简。叶照作证，是他先毁约。贺崇收剑离去，此怨尚未了结。") +
      "照玄护脉法已领悟：守势后接识阵，伤害 +6、承伤 −3。"
    : "此番未能夺回玉简，你沿退路离府。先前主材与传承仍在；养伤后可追索，也可传信了结旧怨。";
  p.last += completed ? " 先前已完成的逆流历练保留，不必重走通路。" : " 离府逆流尚未稳住，须完成通路实战才计作中期历练。";
  s.foundationJourney.last += " " + p.last;
}
