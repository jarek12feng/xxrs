import type { State } from "../world";
import { workshopLock } from "../workshop/rules";
export type PactAction =
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
  return s.foundationJourney.location !== "frontier"
    ? "到古道支脉追索；已走通的外缘不必重闯"
    : p.settled
      ? "双方已了结此怨"
      : p.stage === "betrayed" || p.outcome === "retreated"
        ? ""
        : "此时没有夺宝之争";
}
export function pactQuote(s: State, a: PactAction) {
  const p = s.secretPact,
    q = s.foundationJourney;
  let error = workshopLock(s) ? "先处理眼前事件或结束交锋" : "",
    herbs = 0,
    stones = 0,
    months = 0;
  error ||= s.realm !== 1 ? "筑基后再赴此约" : "";
  if (a === "promise" || a === "decline") {
    error ||= !["none", "declined"].includes(p.stage)
      ? "约定已记下"
      : q.location !== "ferry"
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
          : q.location !== "frontier"
            ? "照玄遗府在云外古道支脉"
            : q.ferry < 4
              ? "先走通无名渡"
              : !q.won.includes("frontier")
                ? "沿古道取材路线打通外缘石偶，再与道友会合"
                : s.injury > 2
                  ? "先将伤势养至 2 或以下"
                  : "";
  } else if (["exchange", "yield", "insist", "seize"].includes(a)) {
    error ||=
      p.stage !== "inside"
        ? "先一同进入遗府"
        : q.location !== "frontier"
          ? "回古道内府再商议分宝"
          : "";
    if (a === "exchange") {
      herbs = 6;
      stones = 12;
    }
  } else if (a === "leave") {
    error ||= !["inside", "betrayed"].includes(p.stage)
      ? "此番已经退出内府"
      : q.location !== "frontier"
        ? "回到古道交代此事"
        : "";
  } else if (a === "settle") {
    error ||=
      p.stage !== "resolved" ||
      !["won", "seized", "retreated"].includes(p.outcome)
        ? "此时无夺宝旧怨可了结"
        : p.settled
          ? "此怨已了结"
          : "";
    if (p.manual) {
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
  error ||=
    s.herbs < herbs
      ? `需灵草 ${herbs}`
      : s.stones < stones
        ? `需灵石 ${stones}`
        : "";
  return { error, herbs, stones, months };
}
export function runPact(
  input: State,
  a: PactAction,
  id: string,
  tick: (s: State) => State,
) {
  const quote = pactQuote(input, a);
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
  s.herbs -= quote.herbs;
  s.stones -= quote.stones;
  if (a === "promise") {
    p.stage = "promised";
    p.promisedMonth = s.month;
    p.last =
      "叶照收起阵盘：“照玄府内罡风不歇，须到筑基中期才能站稳。到时在古道外缘会合，各走各的准备，不催年月。”贺崇按了按右腕：“旧伤多年，寻常丹药无用。若有补脉法，我愿拿别的换。”三人约定：散财平分，独一份的传承当面议价，未议定前谁也不动手。";
  } else if (a === "decline") {
    p.stage = "declined";
    p.last = "你暂不同行。叶照留下方位：“日后有意，再来商议。”";
  } else if (a === "enterAnchor" || a === "enterLight") {
    p.stage = "inside";
    p.preparation = a === "enterAnchor" ? "anchor" : "light";
    p.last =
      (a === "enterAnchor"
        ? "你用灵草稳住阵钉，叶照替众人留了一段可靠退路。"
        : "你们轻装越过风口，省下药草，却未留稳固阵钉。") +
      " 贺崇挡住石门回流，三人抵达照玄内府。石台上只有一枚玉简，传法后即碎，无法分抄。叶照辨出其中护脉法能接续守势与识阵。贺崇盯着玉简：“此法也许能补我旧伤。旁的我都不要，这一份，让给我。”";
  } else if (a === "exchange") {
    p.stage = "resolved";
    p.outcome = "exchange";
    p.manual = true;
    p.last =
      "你拿出六株灵草、十二枚灵石，换贺崇另寻药师治伤。叶照替他记下药庄的诊期。贺崇沉默片刻，松开手：“照原约，玉简归你。此番不是白让。”你受得照玄护脉法，玉简随即碎去。守势后接识阵，额外伤敌 2；可在下一场筑基交锋试用。";
  } else if (a === "yield") {
    p.stage = "resolved";
    p.outcome = "yield";
    s.stones += 24;
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
    p.last =
      p.outcome === "left"
        ? "你放下争执，沿退路离府。两位道友留下商议，你带着此前所得继续自己的道途。"
        : "你护住随身所得撤出。玉简留在贺崇手里，叶照记下了争执的始末。此后可回古道追索，也可传信了结旧怨；主材和既有修行均未失去。";
  } else if (a === "settle") {
    p.settled = true;
    p.last = ["won", "seized"].includes(p.outcome)
      ? "你寄去六株灵草与二十四枚灵石，补偿贺崇另寻治伤之法。他回信应下止争，叶照也记下此约。传承仍归你，旧怨暂了；双方不再追索，也不恢复同行补给。"
      : "你传信言明不再追索玉简，贺崇也应下互不寻仇。旧怨暂了，双方不再同行。";
  } else if (a === "supplies") {
    p.supplies = true;
    s.growth.medicines.healing += 2;
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
  p.last = victory
    ? (p.aggressor === "player"
        ? "你击退贺崇，取走照玄玉简。叶照收起阵盘独自离去：“法是你的了，往后不必再来约我。”"
        : "你击落贺崇的剑，夺回玉简。叶照作证，是他先毁约。贺崇收剑离去，此怨尚未了结。") +
      "照玄护脉法已领悟：守势后接识阵，额外伤敌 2。"
    : "此番未能夺回玉简，你沿退路离府。先前主材与传承仍在；养伤后可追索，也可传信了结旧怨。";
  s.foundationJourney.last += " " + p.last;
}
