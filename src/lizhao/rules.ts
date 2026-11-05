import { endLife } from '../mortality';
import {reagentTerms} from "../world-revisits/projection";
import { startAssay, assayMethod, assayMoves, type AssayMove } from "./assay";
import type { State } from "../world";
import type { Move } from "../combat";
import { executeBattleAction, startBattle } from "../combat";
import { foundationPower } from "../foundation-journey/combat";
import { advanceMonths } from "../timeline";
import { settleResources } from "../economy";
import {
  passageKey,
  passageError,
  passageMonths,
  advancePassage,
} from "../wayfaring/passage";
import { lizhaoMoves } from "./state";
import { lizhaoExchange, lizhaoFoe } from "./combat";
export { lizhaoExchange, lizhaoFoe, lizhaoTell } from "./combat";
export type LizhaoAction =
  | {
      kind:
        | "visit"
        | "leave"
        | "enter"
        | "deeper"
        | "chamber"
        | "return"
        | "fight"
        | "withdraw"
        | "verify"
        | "resupply"
        | "recover"
        | "rumor"
        | "bypass"
        | "negotiate"
        | "expose"
        | "spare"
        | "kill";
    }
  | { kind: "assay"; move: AssayMove }
  | { kind: "route"; route: "cooperate" | "independent" }
  | { kind: "prepare"; preparation: "ward" | "purify" }
  | { kind: "allocate"; allocation: "share" | "private" | "seize" }
  | { kind: "respond"; response: "company" | "ambush" }
  | { kind: "move"; move: Move };
export const lizhaoActivity = (s: State) => s.lizhao.location !== "away";
function occupied(s: State) {
  return (
    s.status !== "alive" ||
    !!s.pending ||
    !!s.social.scene ||
    !!s.ascension ||
    !!s.nascentSoul.trial ||
    !!s.nascentSoul.attempt ||
    !!s.nascentSoul.thunder?.battle ||
    !!s.social.arena.duel ||
    !!s.foundationJourney.duel ||
    !!s.expedition.duel ||
    !!s.sectContest.duel ||
    !!s.qiJourney.node ||
    !!s.qiJourney.duel ||
    !!s.goldenCore.duel ||
    s.goldenCore.expedition !== "idle" ||
    !!s.outerSea.duel ||
    !!s.conclave.duel ||
    !!s.secretPact.hazard ||
    !!s.wayfaring.trip ||
    !!(s.treasures.auction?.entered && !s.treasures.auction.closed)
  );
}
export function lizhaoQuote(s: State, a: LizhaoAction) {
  const l = s.lizhao;
  let months = 0,
    stones = 0,
    herbs = 0,
    error = "";
  if (occupied(s)) error = "先处理眼前事件、交锋或行程";
  else if (s.realm !== 2 || s.conclave.stage < 2)
    error = "先融汇丹元，达到金丹后期";
  else if (s.conclave.location !== "away" || s.outerSea.location !== "ferry")
    error = "先离开会谷，在外海古渡接续离照航路";
  error ||= passageError(s, passageKey("lizhao", a.kind));
  if (l.duel)
    return {
      months,
      stones,
      herbs,
      error:
        error ||
        ((a.kind === "move" && lizhaoMoves.includes(a.move)) ||
        a.kind === "withdraw"
          ? ""
          : "先结束眼前交锋或撤回整备"),
    };
  const at = (...places: (typeof l.location)[]) => places.includes(l.location);
  switch (a.kind) {
    case "visit":
      months = 6;
      if (!at("away")) error ||= "已经抵达离照";
      break;
    case "leave":
      months = 6;
      if (!at("harbor")) error ||= "先返回离照港";
      break;
    case "route":
      if (
        !at("harbor") ||
        l.route !== "none" ||
        !["cooperate", "independent"].includes(a.route)
      )
        error ||= "在离照港商定首次探路方式";
      break;
    case "prepare":
      months = 2;
      stones = l.route === "cooperate" ? 12 : 18;
      herbs = a.preparation === "purify" ? 4 : 2;
      if (
        !at("harbor") ||
        l.route === "none" ||
        l.cleared ||
        !["ward", "purify"].includes(a.preparation) ||
        l.preparation === a.preparation
      )
        error ||= "先商定探路方式；已取药者无需重备入府行装";
      break;
    case "enter":
      if (
        !at("harbor") ||
        l.route === "none" ||
        l.preparation === "none" ||
        l.cleared
      )
        error ||= "先备好护潮符或净药囊";
      if (s.injury > 1 || l.recovery) error ||= "先在港口治伤调息";
      break;
    case "deeper":
      if (!at("outer") || !l.outerCleared || l.cleared)
        error ||= "先破开外层分潮禁阵";
      break;
    case "chamber":
      if (!at("inner", "harbor") || !l.cleared) error ||= "先取得内层定性辅药";
      break;
    case "return":
      if (!at("outer", "inner", "chamber")) error ||= "当前不在洞天中";
      break;
    case "fight":
      months = 1;
      if (!(
        (at("outer") && !l.outerCleared) ||
        (at("inner") && !l.cleared) ||
        (at("bay") && l.pursuit === "confront")
      ))
        error ||= "此处没有未完成的挑战";
      if (s.injury > 1 || l.recovery) error ||= "先回港恢复，再应对挑战";
      break;
    case "verify":
      months = 1;
      herbs = 2;
      if (!at("chamber") || !l.cleared || l.recipeVerified || l.assay.phase!=="idle")
        error ||= "取药后在旧丹室验证一次药理";
      break;
    case "assay": {
      const method = assayMethod(s, a.move);
      months = method.months;
      herbs = method.herbs;
      if(!at("chamber") || !l.cleared || l.recipeVerified || !["cloudy","clear"].includes(l.assay.phase) || !assayMoves.includes(a.move)) error ||= "先在旧丹室备好试料，再根据药液决定排潮或定性";
      error ||= method.error;
      break;
    }
    case "allocate":
      if (a.allocation === "seize" && l.reagent >= 20)
        error ||= "药匣已满，不能再扣下余药";
      if (
        !at("chamber", "harbor") ||
        !l.recipeVerified ||
        l.allocation !== "none" ||
        !["share", "private", "seize"].includes(a.allocation)
      )
        error ||= "先验证药理，再商定剩余药株和排潮记录的归属";
      break;
    case "resupply":
      ({months,stones,herbs}=reagentTerms(s));
      if (!at("harbor") || !l.cleared || !l.recipeVerified || l.reagent >= 20)
        error ||= "先完成离照取药与药理验证，药匣至多存20份";
      break;
    case "recover":
      months = 3;
      herbs = 2;
      if (!at("harbor") || (!s.injury && !l.recovery))
        error ||= "港口可治疗伤势、排出残毒";
      break;
    case "rumor":
      if (!at("harbor") || l.pursuit !== "rumor") error ||= "没有新的航线消息";
      break;
    case "respond":
      months = 2;
      stones = a.response === "company" ? 12 : 0;
      if (
        !at("harbor") ||
        l.pursuit !== "warned" ||
        !["company", "ambush"].includes(a.response)
      )
        error ||= "先听清伏潮湾风险";
      if (s.injury > 1 || l.recovery) error ||= "先治伤调息，勿带伤赴约";
      break;
    case "bypass":
      months = 6;
      stones = 8;
      if (!at("harbor") || l.pursuit !== "warned")
        error ||= "先听清伏潮湾风险，再选择绕行";
      break;
    case "negotiate":
      stones = 18;
      if (!at("bay") || !["confront", "defeated"].includes(l.pursuit))
        error ||= "仅在伏潮湾当面对质时可止争";
      break;
    case "expose":
      if (!at("bay") || l.pursuit !== "defeated")
        error ||= "先击败韩砺舟，取得他随身的雇契";
      break;
    case "spare":
    case "kill":
      if (!at("bay") || l.pursuit !== "defeated")
        error ||= "先在交锋中制住韩砺舟";
      break;
    case "withdraw":
      if (!at("bay")) error ||= "当前没有需要撤离的交锋";
      break;
    case "move":
      error ||= "当前没有交锋";
      break;
    default:
      error ||= "未知离照操作";
  }
  months = passageMonths(s, passageKey("lizhao", a.kind), months);
  if (!error && (s.stones < stones || s.herbs < herbs))
    error = `需灵石 ${stones}、灵草 ${herbs}；可先回古渡筹备`;
  if (!error && s.limit - s.age <= months) error = "余寿不足以完成此次行动";
  return { months, stones, herbs, error };
}
export function lizhaoGoal(s: State) {
  const l = s.lizhao;
  if (l.duel)
    return l.duel.kind === "han"
      ? "韩砺舟是受雇夺药的人族修士。气势耗尽或积毒100会陨落；主动撤回保命，超时仍有气势可伤退。"
      : "辨影排毒并为下一合开路；守势蓄力，潮压退后可反击。趁开口破枢才能有效取药；外层可伤退；内层气势耗尽或积毒100会陨落，十八合未破阵但仍能自持则伤退。";
  if (l.location === "away")
    return "前往离照洞天，寻找使凝婴灵髓稳定成丹的辅药。";
  if (l.recovery) return "回港治疗残毒；已开通路与取得的药材都保留。";
  if (l.location === "bay")
    return l.pursuit === "defeated"
      ? "雇契在韩砺舟身上。决定止争、交港口作证、放他离去或杀死他。"
      : "韩砺舟截住去路。可以谈赔偿止争、应战或撤回港口。";
  if (!l.cleared)
    return !l.outerCleared
      ? "商定合作或独探，准备护潮符或净药囊，亲自破开外层通路。"
      : "外层通路已开。穿过药池取回定性辅药，辨药排毒可减轻积累的毒息。";
  if (!l.recipeVerified)
    return "在旧丹室以少量灵草验证药理，辨明凝婴灵髓与定性辅药的用法。";
  if (l.allocation === "none")
    return "自己的炼丹药份已封存；剩余药株与可复制记录仍待商定归属。";
  if (l.pursuit === "rumor")
    return "港口药船管事带来一则与你的分配争议有关的消息。";
  if (l.pursuit === "warned")
    return "已知伏潮湾有人收买航线；可结伴、设伏或付出半年绕行，亦可暂缓。";
  return "药理与通路已掌握。可补取辅药，再回古渡准备圆满考验和化婴丹。";
}
export function runLizhao(
  input: State,
  a: LizhaoAction,
  id: string,
  tick: (s: State) => State,
) {
  if (input.seen.includes(id)) return input;
  const q = lizhaoQuote(input, a);
  if (q.error) return input;
  let s = structuredClone(input);
  const passage = passageKey("lizhao", a.kind);
  if (passage) {
    const result = advancePassage(input, passage, tick, (n) => occupied(n));
    s = result.state;
    if (result.stopped) {
      record(
        `离照航程暂止，尚余 ${s.wayfaring.passage!.remaining} 月；处理眼前消息后继续，不重复扣除已耗年月。`,
      );
      return finish();
    }
  } else {
    const elapsed = advanceMonths(s, q.months, {
      tick,
      interrupt: (n) => (occupied(n) ? "interrupted" : ""),
    });
    s = elapsed.state;
    if (elapsed.stopped) {
      record("行动暂止，物资与成果尚未结算；先处理眼前消息。");
      return finish();
    }
  }
  if (settleResources(s, { stones: q.stones, herbs: q.herbs }).error)
    return input;
  const l = s.lizhao;
  switch (a.kind) {
    case "visit":
      l.location = "harbor";
      record(
        "离照港的药船管事指向洞天：旧主人以分潮禁阵排出海毒，再用定性辅药稳定灵髓。只有亲自打通药池的人，才能订下后续取药之约。",
      );
      break;
    case "leave":
      l.location = "away";
      record("你循离照航路返回外海古渡，药理、通路和分配约定留在行囊中。");
      break;
    case "route":
      l.route = a.route;
      record(
        a.route === "cooperate"
          ? "你与药船修士约定共同校图，自己的炼丹药份优先封存；余药另议。合作降低行装费用，交锋伤害 +3。"
          : "你自筹勘路，不动他人的药株；自己的取药成果由自己保留，余药可以各取所得。",
      );
      break;
    case "prepare":
      l.preparation = a.preparation;
      record(
        a.preparation === "ward"
          ? "护潮符备妥：每合承伤 −8，积毒仍须辨药排出。"
          : "净药囊备妥：每合积毒降低10；护体需靠自身功法与招式。",
      );
      break;
    case "enter":
      l.location = l.outerCleared ? "inner" : "outer";
      record(
        l.outerCleared
          ? "你沿已开的分潮石道直抵药池，不必重打外阵。"
          : "你踏上外层分潮石道。阵流时开时闭，先看清来势再动手。",
      );
      break;
    case "deeper":
      l.location = "inner";
      record(
        "药池守炉傀儡仍照旧令排毒、护药。必须稳住丹元，才能从潮毒中取出定性药株。",
      );
      break;
    case "chamber":
      l.location = "chamber";
      record(
        "旧丹室残留分药槽与试药炉。单有灵髓会聚而不凝，可用普通灵草试炉，选择分槽缓炼或分念辨性，按炉况调整后收药。",
      );
      break;
    case "return":
      l.location = "harbor";
      record("你沿已知退路回到离照港，探索与取药成果保留。");
      break;
    case "fight": {
      const kind =
        l.location === "bay"
          ? "han"
          : l.location === "inner"
            ? "inner"
            : "outer";
      l.duel = {
        kind,
        ...startBattle(
          foundationPower(s).hp + (l.route === "cooperate" ? 16 : 0),
          lizhaoFoe(kind).hp,
        ),
        effect: "",
        toxin: 0,
      };
      record(
        `${lizhaoFoe(kind).name}已起势。最多十八合；${kind === "outer" ? "外层败退伤势 +2、需三月排毒" : "气势耗尽或积毒100会陨落；超时仍能自持则伤退"}。主动撤离不加伤、不丢药材。`,
      );
      break;
    }
    case "move": {
      const d = l.duel!;
      const r = executeBattleAction(d, s.herbs, {
        turnLimit: 18, resolution: "simultaneous",
      }, () => lizhaoExchange(s, a.move))!;
      const p = r.exchange;
      Object.assign(d, r.battle);
      d.effect = a.move;
      d.toxin = p.toxin;
      s.herbs = r.remainingHerbs;
      record(
        `削去气势 ${p.damage}，承伤 ${p.incoming}，回气 ${p.healing}；积毒 ${p.toxin}/100。${p.note}`,
      );
      const loss = p.toxin >= 100 || r.outcome === "loss" || (d.kind !== "outer" && r.battle.hp <= 0);
      if (loss) {
        l.duel = null;
        if (d.kind !== 'outer' && (r.battle.hp <= 0 || p.toxin >= 100)) {
          endLife(s, d.kind === 'han' ? 'duel' : 'lizhao');
          l.last = s.result;
          return s;
        }
        l.location = "harbor";
        l.recovery = true;
        s.injury = Math.min(6, s.injury + 2);
        if (d.kind === "han") l.pursuit = "warned";
        l.response = d.kind === "han" ? "none" : l.response;
        record(
          "你循退路回港，伤势 +2，需排出残毒。已通道路、主药、辅药、法门都保留；治伤后可再作选择。",
        );
      } else if (r.outcome === "win") {
        l.duel = null;
        if (d.kind === "outer") {
          l.outerCleared = true;
          record(
            "分潮禁阵已稳，外层通路永久保留。可进入内层药池，或先回港补充灵草。",
          );
        } else if (d.kind === "inner") {
          l.cleared = true;
          l.reagent += 2;
          record(
            "你稳住药性，将两份定性辅药逐一封入药瓶，并把来时的药路记在图上。日后缺药，可回港商议轮采的时节与费用。前方旧丹室留有试炉旧录，可带药前去互验。",
          );
        } else {
          l.pursuit = "defeated";
          record(
            "韩砺舟被迫收刀，随身雇契露出药商邵荃的私印：委托只属两人，并非三宗授意。如何处置由你决定。",
          );
        }
      }
      break;
    }
    case "verify":
      l.assay = startAssay();
      record("你将两份普通灵草投入试炉，黑沫沿槽翻涌，炉底尚有清液。先看槽边旧刻和眼前药液，再决定如何行炉；封存辅药留在药匣里。");
      break;
    case "assay": {
      const result=assayMethod(s,a.move);l.assay=result.next;
      if(l.assay.phase==="stable")l.recipeVerified=true;
      record(result.note);break;
    }
    case "allocate":
      l.allocation = a.allocation;
      if (a.allocation === "seize") {
        l.pursuit = "rumor";
        l.reagent++;
        record(
          "你明知剩余药株已由药商邵荃出资预订，仍将其划入自己的份额。对方拒绝今后私人接应；港口已有消息说他在打听你的归路。多得一份辅药；因港口需额外安排接应，后续补药加收8灵石，赔偿止争或公开雇契后恢复原价。",
        );
      } else
        record(
          a.allocation === "share"
            ? "你公开可复制的排潮记录，余药按出力分取。合作者愿按原价继续供药，自己的两份辅药不交出。"
            : "你保留独立勘探所得，不动他人预订的药株。各方按约散去，无人因这次分配追索你。",
        );
      break;
    case "resupply":
      l.reagent++;
      record(
        "你沿已开药路轮取一份定性辅药，支付港口工钱并补足排毒药。此为通路维护后的取药，不重领奖、不重开分配争议。",
      );
      break;
    case "recover":
      s.injury = Math.max(0, s.injury - 2);
      l.recovery = false;
      record("三个月调息排毒，伤势减轻2。若仍重伤，可继续静养或在此治疗。");
      break;
    case "rumor":
      l.pursuit = "warned";
      record(
        "药船管事带来确切消息：邵荃雇韩砺舟在伏潮湾夺药。结伴需灵石12、两月；设伏需两月；绕行需灵石8、半年。应战气势耗尽或积毒100会陨落；可主动撤回、谈赔偿或绕行。超时伤退需三月排毒，不丢主药和辅药，没有暗中限期。",
      );
      break;
    case "respond":
      l.response = a.response;
      l.location = "bay";
      l.pursuit = "confront";
      record(
        a.response === "company"
          ? "港口修士同船作证并掩护退路，交锋承伤 −6。韩砺舟仍截住航道，索要药瓶。"
          : "你预先辨清回潮礁位，在伏潮湾等候。前两合反制伤害 +14；韩砺舟踏入浅礁才发现你已准备应战。",
      );
      break;
    case "bypass":
      l.pursuit = "bypassed";
      record(
        "你用半年从北侧旧航道绕行，药船交接改变了药物去向。韩砺舟不再有可靠航线，此次截药就此落空；邵荃的私人合作仍未恢复。",
      );
      break;
    case "negotiate":
      l.pursuit = "settled";
      l.location = "harbor";
      record(
        "你赔付灵石18给药株的原订户，韩砺舟在港口见证下解除此次雇契。追索停止，邵荃不再与你私下合作；公共补药渠道照常。",
      );
      break;
    case "expose":
      l.pursuit = "exposed";
      l.location = "harbor";
      record(
        "你带着雇契与韩砺舟到港口对质。邵荃的私雇夺药行为被记案，韩砺舟被禁止承接本港护送。追索终止，公共补药不受影响。",
      );
      break;
    case "spare":
      l.pursuit = "repelled";
      l.location = "harbor";
      record(
        "你收回兵刃，命韩砺舟断掉这次雇契。他负伤离去，不再续追；你仍不接受他的私人护送。",
      );
      break;
    case "kill":
      l.pursuit = "killed";
      l.location = "harbor";
      record(
        "你杀死韩砺舟，留下雇契交港口说明经过。他不再出现，他的旧识也不再向你提供私人接应；公共取药仍凭已开通路办理。",
      );
      break;
    case "withdraw": {
      const han = l.duel?.kind === "han" || l.location === "bay";
      l.duel = null;
      l.location = "harbor";
      if (han) {
        l.pursuit = "warned";
        l.response = "none";
      }
      record(
        "你沿预留退路回港，不新增伤势与材料损失。可以重新准备，伏潮湾仍由你选择是否应对。",
      );
      break;
    }
  }
  return finish();
  function record(text: string) {
    s.lizhao.last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
