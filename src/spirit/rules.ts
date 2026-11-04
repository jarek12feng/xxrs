import type { State } from "../world";
import { workshopLock } from "../workshop/rules";
import { qiNarrativeActive } from "../qi-journey/narrative";
import { pactActivity } from "../secret-pact/state";
import { spiritReadiness, senseLimit, injureSpirit, restoreSpirit } from "./profile";
import { validSpiritData, type SpiritSource, type SpiritMove } from "./state";
export type SpiritAction =
  | { kind: "enter"; source: SpiritSource; preparation: "self" | "herbs" }
  | { kind: "move"; move: SpiritMove }
  | { kind: "withdraw" | "study" | "refine" | "recover" };
export function spiritSite(s: State): SpiritSource | null {
  if (s.realm === 1 && s.foundationJourney.location === "ferry" && s.foundationJourney.won.includes("well")) return "well";
  if (s.realm === 2 && s.outerSea.location === "ferry" && s.conclave.location === "away" && s.conclave.depth === 2) return "tide";
  return null;
}
/** Shared exclusion; doesn't inspect this module's own trial. */
export function spiritInterruption(s: State): string {
  return workshopLock(s) || (s.ascension || s.nascentSoul.trial || s.nascentSoul.attempt || s.nascentSoul.thunder?.battle || s.lizhao.location !== "away" || qiNarrativeActive(s) || pactActivity(s.secretPact) || s.secretPact.site !== "away" || (s.treasures.auction?.entered && !s.treasures.auction.closed) ? "先处理当前行功、探索或拍卖" : "");
}
export function spiritQuote(s: State, a: SpiritAction) {
  let error = spiritInterruption(s), months = 0, herbs = 0;
  const p = s.spirit;
  if (!p) return { error: "神识记录尚未就绪", months, herbs };
  const need = (bad: boolean, text: string) => { if (bad && !error) error = text; };
  if (p.trial) need(!["move", "withdraw"].includes(a.kind), "先完成识海探阵或撤出");
  switch (a.kind) {
    case "enter": {
      need(!["well", "tide"].includes(a.source) || !["self", "herbs"].includes(a.preparation), "未知探阵准备");
      need(!!p.trial, "已在阵中");
      need(spiritSite(s) !== a.source, a.source === "well" ? "先击退沉井石偶，在无名渡内室探查" : "取得归潮深处拓本后，在外海古渡寻潮隙");
      need((a.source === "well" ? p.manual : p.jade) !== "none", "此处机缘已取得");
      need(p.trauma > 0, "先调息养神，恢复识海创伤");
      need(s.injury > 2, "先将伤势养至2以下或等于2");
      const threshold = a.source === "well" ? 12 : 24;
      need(a.preparation === "self" && spiritReadiness(s).effectiveSense < threshold, `自行探阵需神识${threshold}；也可备灵草4护神`);
      herbs = a.preparation === "herbs" ? 4 : 0;
      need(s.herbs < herbs, "护神需灵草4；也可凝神后自行探阵");
      months = a.source === "well" ? 3 : 6;
      break;
    }
    case "move": need(!p.trial || !["discern", "guard", "reach"].includes(a.move), "当前没有可应对的阵压"); break;
    case "withdraw": need(!p.trial, "当前未在识海探阵中"); break;
    case "study": need(p.manual !== "found", "先从沉井回声阵中取得分念诀残篇"); months = 3; break;
    case "refine": need(p.jade !== "found", "先在归潮拓本指引的潮隙中取得澄神玉髓"); months = 6; break;
    case "recover": need(!p.trauma, "识海无创伤，无需调息"); months = 3; break;
    default: error = "未知神识行动";
  }
  return { error, months, herbs };
}
export const spiritPressure = ["回声叠影", "逆潮冲识", "阵隙暂开", "逆潮冲识"] as const;
export function spiritTrialPreview(s: State, move: SpiritMove) {
  const t = s.spirit.trial;
  if (!t) return null;
  const p = spiritReadiness(s), surge = t.turn === 1 || t.turn === 3;
  const cost = move === "discern" ? 2 : move === "reach" ? 3 : 0;
  const progress = move === "discern" ? (t.turn === 0 ? 2 : 1) : move === "reach" ? 3 : surge ? 1 : 0;
  const rawLoss = move === "guard" ? 0 : move === "reach" ? (t.turn === 2 ? 1 : 4) : surge ? 3 : 1;
  const shortage = t.energy < cost;
  const loss = Math.max(0, rawLoss - p.resistance) + (shortage ? 4 : 0);
  return { pressure: spiritPressure[t.turn], cost, recovery: move === "guard" ? 2 : 0, progress: shortage ? 0 : progress, loss, shortage };
}
export function runSpirit(input: State, a: SpiritAction, id: string, tick: (s: State) => State): State {
  if (!id || input.seen.includes(id)) return input;
  const quote = spiritQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  s.herbs -= quote.herbs;
  const record = (text: string) => {
    s.spirit.last = text;
    s.log.unshift({ month: s.month, kind: "story", text }); s.log = s.log.slice(0, 180);
  };
  for (let i = 0; i < quote.months; i++) {
    s = tick(s);
    if (s.status !== "alive" || s.pending || s.social.scene) {
      record("调息被眼前变故打断，本次准备的年月与药材已用去；尚未取得新成果，处理后可再来。");
      s.seen = [...s.seen, id].slice(-512); return s;
    }
  }
  const p = s.spirit;
  switch (a.kind) {
    case "enter":
      p.trial = { source: a.source, turn: 0, stability: Math.min(12, 8 + spiritReadiness(s).breakthroughBonus), energy: Math.min(12, 6 + Math.floor(spiritReadiness(s).effectiveSense / 12)), progress: 0 };
      record(a.source === "well" ? "沉井内室的石偶已倒，壁上却仍传出三道脚步声。旧主人留下的分念诀封在回声阵中：四轮内辨开六重纹路，守住心神便能取出；可随时收念撤回。苏婉宁在井口留下归绳，取法由你自己应对。" : "归潮拓本上的断线与古渡潮隙相合。一缕澄神玉髓伏在乱流之后：四轮内穿过六重纹路，护住心神才能取出；收念撤回不会丢失已有法门。");
      break;
    case "move": {
      const t = p.trial!, v = spiritTrialPreview(s, a.move)!;
      t.energy = Math.min(12, Math.max(0, t.energy - v.cost) + v.recovery);
      t.stability = Math.max(0, t.stability - v.loss); t.progress += v.progress; t.turn++;
      record(`${v.pressure}：辨开${v.progress}重，心神损耗${v.loss}，余${t.stability}；念力余${t.energy}，纹路${t.progress}/6。${v.shortage ? "念力不足，强探引起回震。" : ""}`);
      if (!t.stability || t.turn === 4) {
        if (t.stability > 0 && t.progress >= 6) {
          if (t.source === "well") p.manual = "found"; else p.jade = "found";
          record(t.source === "well" ? "回声归于一线，你亲手取出分念诀残篇。研修三月可拓展神识上限6，并增神识3；再试运沉井主法时，这番护神功夫会稳住逆流。" : "你护住最后一缕神念，将澄神玉髓收入玉匣。炼化半年可永久拓展神识上限6、增加神识6；圆满考验与凝婴时可抵御识海回震。");
        } else {
          injureSpirit(s);
          record("回声反卷，你及时循归绳退出，留下识海创伤1。永久神识、器物和旧成果保留；可免费调息三月恢复，也可用养神药疗复，之后重试。");
        }
        p.trial = null;
      }
      break;
    }
    case "withdraw": p.trial = null; record("你收拢神念，循已探明的退路离开。未添创伤；已用的准备年月与药材不返还，之后仍可重试。"); break;
    case "study": p.manual = "learned"; s.sense = Math.min(senseLimit(s.realm, p), s.sense + 3); record("三月间，你将分念诀的残缺行文补成自己的行功次序。神识上限永久+6、神识+3、护神抗性+1。沉井主法的逆流如今有了落脚处；此法随你继续修行，不占主修或辅修槽。"); break;
    case "refine": p.jade = "refined"; s.sense = Math.min(senseLimit(s.realm, p), s.sense + 6); record("半年炼化，澄神玉髓融入识海。神识上限永久+6、神识+6，护神抗性增加，合计最多2。空出的御器余力由你安排；凝婴心神储备也随自身神识提高。"); break;
    case "recover": restoreSpirit(s, 1); record("你在安全处调息三月，识海创伤减1。永久神识与已修法门丝毫未损。"); break;
  }
  s.seen = [...s.seen, id].slice(-512);
  return s;
}
export function validSpirit(s: State) {
  const p = s.spirit;
  if (!validSpiritData(p)) return false;
  if (p.manual !== "none" && (s.realm < 1 || !s.foundationJourney.won.includes("well"))) return false;
  if (p.jade !== "none" && (s.realm < 2 || s.conclave.depth !== 2)) return false;
  if (p.trial && (spiritSite(s) !== p.trial.source || spiritInterruption(s))) return false;
  return true;
}
