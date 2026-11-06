import { dutyIncome } from "../preparation-rates";
import { dutySituations, isDuty } from "./duties";
import type { State } from "../world";
import { advanceMonths } from "../timeline";
import {
  quoteSettlement,
  settleResources,
  type ResourceAmounts,
} from "../economy";
import type { Undertaking } from "./state";
export type CultivationAction =
  `cultivation:${"heat" | "coolFire" | "extract" | "blend" | "condense" | "warm" | "cool" | "bind" | "shelter" | "detour" | "rope" | "restore" | "omit" | "annotate" | "begin" | "relic" | "herb" | "herbs" | "watch" | "copy" | "circulate" | "spread" | "ease" | "brace" | "harvest" | "wash" | "discern" | "treat" | "escort" | "compare" | "rush" | "withdraw"}`;
const ids = [
  "heat",
  "coolFire",
  "extract",
  "blend",
  "condense",
  "warm",
  "cool",
  "bind",
  "shelter",
  "detour",
  "rope",
  "restore",
  "omit",
  "annotate",
  "begin",
  "relic",
  "herb",
  "herbs",
  "watch",
  "copy",
  "circulate",
  "spread",
  "ease",
  "brace",
  "harvest",
  "wash",
  "discern",
  "treat",
  "escort",
  "compare",
  "rush",
  "withdraw",
];
export const isCultivationAction = (a: string): a is CultivationAction =>
  a.startsWith("cultivation:") && ids.includes(a.slice(12));
export const cultivationActive = (s: State) => !!s.qiJourney.cultivation?.work;
export function cultivationQuote(s: State, a: CultivationAction) {
  const k = a.slice(12),
    p = s.qiJourney.cultivation,
    w = p?.work;
  let error = "",
    months = 0;
  const cost: ResourceAmounts = {};
  if (
    s.conclave.location !== "away" ||
    s.outerSea.location !== "home" ||
    s.goldenCore.expedition !== "idle" ||
    s.sectContest.duel ||
    s.lizhao.location !== "away" ||
    s.itemGrowth.trial ||
    s.itemGrowth.golden.duel ||
    s.spirit.trial ||
    s.secretPact.hazard ||
    (s.treasures.auction?.entered && !s.treasures.auction.closed) ||
    s.status !== "alive" ||
    (s.pending && !(s.pending.kind === "relic" && !p.relic)) ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.foundationJourney.duel ||
    s.qiJourney.node ||
    s.qiJourney.narrative.location !== "home" ||
    s.ascension ||
    s.wayfaring.trip ||
    s.wayfaring.passage
  )
    error = "先结束眼前的行程或交锋";
  if (["begin", "relic", "herb", "herbs", "watch", "copy"].includes(k)) {
    if (w) error ||= "先完成或退出眼前事务";
    if (k === "relic") {
      if (s.pending?.kind !== "relic" || p.relic)
        error ||= "眼前没有尚未破开的遗府封丹阵";
      if (s.injury >= 3) error ||= "伤势已重，先退出遗府养伤，再沿旧路回来破禁";
    } else if (k === "begin") {
      months = 6;
      if (s.realm || p.middle) error ||= "小周天已经贯通";
      if (s.qi < 119) error ||= "先积累至119修为，再尝试贯通小周天";
      if (
        !s.journey.main ||
        (s.growth.training[s.journey.main] ?? 0) < 1 ||
        s.study < 2
      )
        error ||= "先将主修功法研至入门，并研读至心得2；功法页可研修";
      if (s.injury) error ||= "先养好伤势，行功不可带伤强冲";
    } else if (k === "herb") {
      months = 6;
      cost.stones = 6;
      if (s.realm || s.qiJourney.gates < 2)
        error ||= "先走通凝元内府，才能沿内府药图寻找玉髓芝";
      if (p.roots >= 99) error ||= "主药已足够，先开炉";
      if (s.injury >= 3) error ||= "先养伤至2以下";
    } else {
      months = 1;
      if (s.journey.branch === "none") error ||= "师门委托只向正式弟子开放";
      if (k === "herbs") cost.herbs = 2;
      if (k === "copy") cost.stones = 3;
      if (s.injury >= 3) error ||= "先养伤至2以下再承接差事";
    }
  } else if (!w && !(k === "withdraw" && s.pending?.kind === "relic"))
    error ||= "眼前没有正在进行的事务";
  else if (w && k !== "withdraw") {
    const allowed: Record<Undertaking, string[]> = {
      alchemy: ["heat", "coolFire", "extract", "blend", "condense"],
      circulation: ["circulate", "spread", "ease"],
      relic: ["circulate", "spread", "ease"],
      herb: ["brace", "harvest", "wash", "discern"],
      herbs: ["warm", "cool", "bind"],
      watch: ["shelter", "detour", "rope"],
      copy: ["restore", "omit", "annotate"],
    };
    if (!allowed[w.kind].includes(k)) error ||= "此处不能这样做";
    if (k === "wash" && w.kind === "herb") cost.herbs = 2;
    if (k === "discern" && w.kind === "herb" && s.sense < 8)
      error ||= "辨清地下灵流需要神识8；也可布绳护根或用药液缓流";
  }
  error ||= quoteSettlement(
    s,
    cost,
    ["herbs", "watch", "copy"].includes(k)
      ? { stones: dutyIncome(s, k as "herbs" | "watch" | "copy"), contribution: 2 }
      : {},
  ).error;
  return { error, months, cost };
}
export function runCultivation(
  input: State,
  a: CultivationAction,
  id: string,
  tick: (s: State) => State,
): State {
  const q = cultivationQuote(input, a);
  if (q.error) return input;
  const elapsed = advanceMonths(structuredClone(input), q.months, {
    tick,
    interrupt: (s) => (s.status !== "alive" || s.pending ? "interrupted" : ""),
  });
  const s = elapsed.state,
    p = s.qiJourney.cultivation,
    k = a.slice(12);
  const note = (text: string) => {
    p.last = text;
    s.qiJourney.last = text;
    s.log.unshift({ month: s.month, kind: "story", text });
    s.log = s.log.slice(0, 180);
    s.seen = [...input.seen, id].slice(-512);
    return s;
  };
  if (elapsed.stopped && q.months > 0)
    return note(
      "行程暂缓：已过年月记入寿元，尚未扣料或领取报酬。先处理眼前之事。",
    );
  if (settleResources(s, q.cost).error) return input;
  if (["begin", "relic", "herb", "herbs", "watch", "copy"].includes(k)) {
    const kind: Undertaking =
      k === "begin" ? "circulation" : (k as Undertaking);
    p.work = {
      kind,
      vigor: kind === "circulation" || kind === "relic" ? 12 : 10,
      progress: 0,
      pressure: kind === "herb" ? 2 : isDuty(kind) ? s.seed % 3 : 0,
      prepared: false,
      turn: 0,
    };
    return note(
      kind === "relic"
        ? "丹匣外还有六重封纹，强取会毁去孤丹。你须稳住阵压，再逐层剥离封纹；可整股破禁，也可沿纹慢解。"
        : kind === "circulation"
          ? "半年收心行功，灵息已满，经脉尚窄。每次运转都会积下脉压；可分股慢行，也可整股推进后及时舒脉。"
          : kind === "herb"
            ? "循内府药图寻药半年，终于找到玉髓芝。根须缠在地下灵流中，强采会折根。先稳住灵流，再分段取出。"
            : kind === "herbs"
              ? "药已送到山下。三位病人症状不同，需要辨清药性再施治；不能把整包药随手分掉。"
              : kind === "watch"
                ? "夜路有三段险坡。山风会吹乱灯火；辨清路标、护稳灯盏，再带队越过。"
                : "旧卷有三处异文。对照原签后誊入，切勿凭猜测抄写。",
    );
  }
  const w = p.work!;
  if (k === "withdraw") {
    p.work = null;
    if (s.pending?.kind === "relic") {
      s.pending = null;
      s.story.stage = "resolved";
      s.story.choice = "missed";
      s.story.luchi = "distant";
    }
    return note(
      "你收手退回。已用物资与年月不退，未领取成果；可以休整后重新尝试。",
    );
  }
  w.turn++;
  let text = "";
  if (w.kind === "circulation" || w.kind === "relic") {
    if (k === "circulate") {
      w.progress += 2;
      w.pressure += 2;
      w.vigor -= 2;
      text =
        w.kind === "relic"
          ? "整股灵息剥离两重封纹，阵压随之升高。"
          : "整股灵息通过经脉，脉压随之升高。";
    }
    if (k === "spread") {
      w.progress++;
      w.pressure++;
      w.vigor--;
      text =
        w.kind === "relic"
          ? "你沿纹引流，剥离一重封印。"
          : "灵息分股慢行，周天推进一段。";
    }
    if (k === "ease") {
      w.pressure = Math.max(0, w.pressure - 3);
      w.vigor--;
      text = "你暂缓推进，散开积压的灵息。";
    }
  } else if (w.kind === "herb") {
    if (k === "brace") {
      w.pressure = Math.max(0, w.pressure - 1);
      w.vigor--;
      text = "护根绳稳住一侧，地下灵流稍缓。";
    }
    if (k === "wash" || k === "discern") {
      w.pressure = 0;
      w.vigor -= 2;
      text =
        k === "wash"
          ? "药液护住细根，灵流暂时平息。"
          : "神识沿根须寻找回流，将阵压引向空隙。";
    }
    if (k === "harvest") {
      w.vigor--;
      if (w.pressure <= 1) {
        w.progress++;
        text = "你沿着缓流取出一段完整根须。";
      } else {
        w.vigor -= 3;
        text = "灵流扯动根须！你收手护住主根，损耗了护持余力。";
      }
      w.pressure++;
    }
  } else if (w.kind === "alchemy") {
    w.vigor--;
    if (k === "heat") {
      w.pressure++;
      text = "炉火渐旺，丹液的温度随之升高。";
    } else if (k === "coolFire") {
      w.pressure = Math.max(0, w.pressure - 1);
      text = "你收小炉口，缓缓降低丹液温度。";
    } else {
      const steps = ["extract", "blend", "condense"],
        heat = [2, 1, 3];
      if (k === steps[w.progress] && w.pressure === heat[w.progress]) {
        w.progress++;
        text = [
          "主药精华已经析出。辅药遇旺火会散，需要文火调和。",
          "药性已经相融，需要旺火收拢成丹。",
          "丹香凝而不散，你收火封瓶。",
        ][w.progress - 1]!;
      } else {
        w.vigor -= 3;
        text =
          "药性与火候不合，丹液翻涌，炉中余力额外损失3。及时调火仍可挽回。";
      }
    }
  } else if (isDuty(w.kind)) {
    const situation = dutySituations[w.kind][w.pressure]!;
    w.vigor--;
    if (k === situation.answer) {
      w.progress++;
      text = situation.success;
      w.pressure = (w.pressure + 1) % 3;
    } else {
      w.vigor -= 3;
      text = "判断与现场不符，出了差错。你及时停下重新检查，余力额外减少3。";
    }
  }
  if (w.pressure >= 5 || w.vigor <= 0 || w.turn >= 30) {
    const injury =
      w.kind === "circulation" || w.kind === "relic" || w.kind === "herb";
    p.work = null;
    if (injury) s.injury = Math.min(6, s.injury + 1);
    return note(
      `${text} ${injury ? "气息失稳，你及时收手，伤势+1。" : w.kind === "alchemy" ? "丹液失去药性，这一炉未能成丹，投入的主辅药已耗尽。" : "事务未能交付，没有取得报酬。"}已完成的其他历练保留，可休整后再试。`,
    );
  }
  const target = w.kind === "circulation" || w.kind === "relic" ? 6 : 3;
  if (w.progress >= target) {
    if (w.kind === "alchemy") {
      if (settleResources(s, {}, { pills: 1 }).error) return input;
      s.crafted++;
      text =
        "筑基丹炼成。玉髓芝主药与辅药已凝为一枚丹，入炉的材料不会返还；叩关仍须圆满、稳固根基与无伤经脉。";
    } else if (w.kind === "relic") {
      p.relic = true;
      text =
        "六重封纹逐一熄灭，丹匣完好打开。你亲手护住了这枚孤丹，丹方和内府图也得以保存。现在可以决定丹药归属。";
    } else if (w.kind === "circulation") {
      p.middle = true;
      s.qi = Math.max(120, s.qi);
      s.foundation = Math.min(24, s.foundation + 2);
      text =
        "小周天贯通，炼气中期已成！经脉能承载更长的行功，药谷、护送与辅器由此开放。根基+2。";
    } else if (w.kind === "herb") {
      p.roots++;
      text =
        "玉髓芝连同完整主根收入药匣。筑基主药+1；可自行研习丹方开炉，也可携药请丹师炼制。";
    } else {
      const reward = dutyIncome(s, w.kind);
      if (settleResources(s, {}, { stones: reward, contribution: 2 }).error)
        return input;
      s.journey.duties++;
      if (w.kind === "herbs") s.foundation = Math.min(24, s.foundation + 1);
      if (w.kind === "copy") s.study = Math.min(4, s.study + 1);
      text = `${w.kind === "herbs" ? "三位病人服药后逐渐安稳，温蘅收到了回诊药签" : w.kind === "watch" ? "整队人平安走出夜路，季衡验过归程灯记" : "三处异文各有原签可查，藏卷执事验收了校本"}。灵石+${reward}，贡献+2。`;
    }
    p.work = null;
  }
  return note(text);
}
