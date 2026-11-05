import { conclavePhase } from "./phases";
import { freshEffort, victoryMemory, conclaveLessons } from "./victories";
import { defeatReview } from "./battle-feedback";
import { conclaveTactics } from "./tactics";
import { methodQuote } from "../techniques";
import { inspectInteraction } from "../story-interactions";
import { settleResources } from "../economy";
import { advanceMonths } from "../timeline";
import { executeBattleAction, startBattle } from "../combat";
import {
  passageKey,
  passageError,
  passageMonths,
  advancePassage,
} from "../wayfaring/passage";
import type { State } from "../world";
import type { Move } from "../expedition/content";
import { foundationPower } from "../foundation-journey/combat";
import { tacticalPreview } from "../combat/game";
import { goldenCap, goldenBlock } from "./state";
import { rivals, wardens } from "./content";
export type ConclaveAction =
  | {
      kind:
        | "mid"
        | "late"
        | "visit"
        | "meet"
        | "leave"
        | "contest"
        | "prepare"
        | "enter"
        | "fight"
        | "withdraw"
        | "attune";
    }
  | { kind: "wait"; until?: "meeting" }
  | { kind: "training"; style: "none" | "ward" | "insight" }
  | { kind: "route"; route: "shelter" | "current" }
  | { kind: "method"; method: "inherit" | "still" }
  | { kind: "move"; move: Move; useHerbs?: boolean };
export const conclaveActive = (s: State) => s.conclave.location !== "away";
export const conclaveFoe = (s: State) =>
  s.conclave.duel?.kind === "contest"
    ? rivals[s.conclave.duel.index]!
    : wardens[s.conclave.duel?.index ?? s.conclave.depth]!;
export const conclaveSupplement = (s: State) =>
  s.outerSea.notice !== null && s.month >= s.outerSea.notice + 624;
const occupied = (s: State) =>
  s.status !== "alive" ||
  s.pending ||
  s.social.scene ||
  s.social.arena.duel ||
  s.foundationJourney.duel ||
  s.expedition.duel ||
  s.sectContest.duel ||
  s.outerSea.location === "ruins" ||
  s.outerSea.duel ||
  s.qiJourney.node ||
  s.goldenCore.expedition !== "idle" ||
  (s.treasures.auction?.entered && !s.treasures.auction.closed);
export function conclaveQuote(s: State, a: ConclaveAction) {
  const c = s.conclave;
  let error = "",
    months = 0,
    stones = 0,
    herbs = 0;
  if (occupied(s)) error = "先处理眼前事件或结束其他行程";
  if (s.realm !== 2 || !s.goldenCore.farShore)
    error ||= "先结成金丹，踏上海外道途";
  if (c.duel)
    return {
      months,
      stones,
      herbs,
      error:
        error ||
        (a.kind === "withdraw" ||
        (a.kind === "move" && ["guard", "strike", "discern"].includes(a.move) && (a.useHerbs === undefined || typeof a.useHerbs === "boolean"))
          ? ""
          : "先结束交锋或撤回"),
    };
  if (a.kind === "wait") {
    months = Math.min(
      a.until === "meeting" ? 600 : 120,
      Math.max(
        0,
        s.outerSea.notice !== null && s.month < s.outerSea.notice + 600
          ? s.outerSea.notice + 600 - s.month
          : c.retryAt - s.month,
      ),
    );
    if (a.until !== undefined && a.until !== "meeting") error ||= "未知候约方式";
    if (a.until === "meeting" && (c.location !== "away" || s.outerSea.notice === null || s.month >= s.outerSea.notice + 600))
      error ||= "仅能按已经得知、尚未到来的诸宗会期候约";
    if (c.location === "vault" || months <= 0)
      error ||= "当前没有需要候待的会期或调息期限";
  } else if (a.kind === "mid" || a.kind === "late") {
    months = a.kind === "mid" ? 12 : 24;
    stones = a.kind === "mid" ? 18 : 30;
    if (c.location === "vault" || s.injury)
      error ||= "先回安全处养好伤势，再闭关破境";
    if (
      a.kind === "mid"
        ? c.stage !== 0 ||
          s.outerSea.cultivation < 299 ||
          s.outerSea.cleared !== 2 ||
          !s.outerSea.attuned ||
          s.outerSea.method === "none"
        : c.stage !== 1 ||
          s.outerSea.cultivation < 599 ||
          c.depth !== 2 ||
          !c.attuned ||
          c.method === "none"
    )
      error ||= goldenBlock(s);
  } else if (a.kind === "visit") {
    months = 2;
    if (
      c.location !== "away" ||
      s.outerSea.location !== "ferry" ||
      s.outerSea.notice === null ||
      s.month < s.outerSea.notice + 600
    )
      error ||= "先在古渡听闻会期，五十年后随道友赴会";
  } else if (a.kind === "meet") {
    if (c.location !== "court" || c.introduced)
      error ||= "先抵达诸宗会，与来客相识";
  } else if (a.kind === "leave") {
    months = 2;
    if (c.location !== "court") error ||= "先撤出秘境，再回古渡";
  } else if (a.kind === "training") {
    months = a.style === "none" ? 0 : 6;
    stones = a.style === "none" ? 0 : a.style === "ward" ? 12 : 6;
    if (
      c.location !== "court" ||
      !c.introduced ||
      !["none", "ward", "insight"].includes(a.style) ||
      c.preparation === a.style
    )
      error ||= "先与各宗道友相识，选择尚未使用的备战方法";
  } else if (a.kind === "contest") {
    months = 1;
    if (c.location !== "court" || !c.introduced || c.stage < 1 || c.wins === 3)
      error ||= "需金丹中期，在会场凭剩余对手胜绩争取资格";
    if (s.month < c.retryAt)
      error ||= `上场失利后需调息至修行第 ${Math.floor(c.retryAt / 12) + 1} 年 ${(c.retryAt % 12) + 1} 月；已得胜绩保留`;
    if (s.injury > 1) error ||= "先养伤至 1 或以下";
  } else if (a.kind === "route") {
    if (
      c.location !== "court" ||
      c.wins < 2 ||
      c.route !== "none" ||
      !["shelter", "current"].includes(a.route)
    )
      error ||= "取得两场胜绩后，与叶问苓商定入境路线";
  } else if (a.kind === "prepare") {
    months = 2;
    stones = c.route === "shelter" ? 10 : 6;
    herbs = (c.route === "shelter" ? 2 : 4) - conclaveLessons(s).herbsSaved;
    if (
      c.location !== "court" ||
      c.route === "none" ||
      c.supplies ||
      c.depth === 2
    )
      error ||= "先约定路线，或行装已经备妥";
  } else if (a.kind === "enter") {
    months = c.route === "shelter" ? 6 : 2;
    if (c.location !== "court" || !c.supplies || c.depth === 2)
      error ||= "在会场备好入境行装再出发";
    if (c.depth === 1 && !c.attuned)
      error ||= "深处震荡识海，先温养外殿取得的定神珠";
  } else if (a.kind === "fight") {
    if (c.location !== "vault" || !c.supplies || c.depth === 2)
      error ||= "先进入归潮秘境";
    if (s.injury > 1) error ||= "先撤回养伤至 1 或以下";
  } else if (a.kind === "withdraw") {
    if (c.location !== "vault") error ||= "当前不在秘境或交锋中";
  } else if (a.kind === "attune") {
    months = 12;
    stones = 18;
    if (c.location === "vault" || c.depth < 1 || c.attuned)
      error ||= "取得定神珠后，在安全处温养";
  } else if (a.kind === "method") {
    const method = methodQuote("conclave", c.method, a.method, c.depth === 2, c.location !== "vault");
    months = method.months;
    error ||= method.error;
  } else error ||= "未知诸宗会操作";
  const passage = passageKey("conclave", a.kind);
  error ||= passageError(s, passage);
  months = passageMonths(s, passage, months);
  if (!error && (s.stones < stones || s.herbs < herbs))
    error = `需灵石 ${stones}、灵草 ${herbs}；可劳作或购药筹备`;
  if (!error && s.limit - s.age <= months) error = "余寿不足以完成此行";
  return { error, months, stones, herbs };
}
export function conclaveExchange(s: State, move: Move, useHerbs = true) {
  const c = s.conclave,
    d = c.duel;
  if (!d) return null;
  const power = foundationPower(s);
  // Preparation is a choice, never a stackable repeat reward.
  return tacticalPreview(s, {
    move: move,
    encounter: {...conclaveFoe(s), responses:conclavePhase(s)!.responses, coreOpen:conclavePhase(s)!.mode === "surge"},
    useHerbs,
    battle: d,
    effect: d.effect,
    arrayCore: d.kind === "vault",
    power,
    adjustments: [
      ...conclaveTactics(s, move).adjustments,
      {
        phase: "power",
        hp: d.kind === "vault" && c.route === "shelter" ? 16 + conclaveLessons(s).shelterHp : 0,
        armor: c.preparation === "ward" ? 3 : 0,
        damage:
          (d.kind === "vault" && c.route === "current" && move === "strike"
            ? 5 + conclaveLessons(s).currentDamage
            : 0) + (c.preparation === "insight" && move === "discern" ? 6 : 0),
      },
      {
        phase: "afterHealing",
        incoming: d.kind === "vault" && d.index === 1 && !c.attuned ? 12 : 0,
      },
    ],
  });
}
export function conclaveGoal(s: State) {
  const c = s.conclave;
  if (c.duel)
    return `${conclaveFoe(s).name}正在换势；留意来招，也可撤出保留此前胜绩。`;
  if (c.location === "vault")
    return c.depth
      ? "以定神珠护住识海，争取抱元凝神录。"
      : "探明外殿，争取凝婴所需的定神珠。";
  if (!c.stage) return goldenBlock(s);
  if (
    c.location === "away" &&
    c.stage > 0 &&
    (c.wins < 2 || c.depth < 2 || c.method === "none")
  )
    return s.outerSea.notice !== null && s.month < s.outerSea.notice + 600
      ? "丹元已凝，已具备会谷登台所需境界，无须先修满599。可继续修炼增强实力，也可按会期候约；两胜便能争取归潮秘境资格。"
      : s.outerSea.location === "home"
        ? "回到外海古渡，循道友来信前往会谷；已有胜绩保留。"
        : "循道友来信前往会谷；旧胜绩与秘境进度仍在，可接续未完的道途。";
  if (c.wins < 2)
    return `诸宗会已有 ${c.wins}/2 场胜绩；取得入境资格不必争夺魁首。`;
  if (!c.depth) return "与叶问苓约定路线，备好行装，进入归潮秘境。";
  if (!c.attuned) return "温养定神珠，再借它抵御秘境深处的识海震荡。";
  if (c.depth < 2) return "定神珠已能护持神识，重返秘境直接进入深处。";
  if (c.method === "none") return "参悟抱元凝神录，选择承接旧法或转修守神法。";
  return c.stage === 1
    ? goldenBlock(s)
    : "宝物与凝婴法门已备；返回古渡，循潮路赴离照取药、验证丹方，再筹备圆满与凝婴。";
}
export function runConclave(
  input: State,
  a: ConclaveAction,
  id: string,
  tick: (s: State) => State,
) {
  const offer = inspectInteraction(input, a, conclaveQuote);
  if (!offer.available) return input;
  const q = offer.quote;
  let s = structuredClone(input);
  const passage = passageKey("conclave", a.kind);
  if (passage) {
    const result = advancePassage(
      input,
      passage,
      tick,
      (n) => occupied(n) || (n.outerSea.reminded && !input.outerSea.reminded),
    );
    s = result.state;
    if (result.stopped) {
      record(
        `航程暂止，尚余 ${s.wayfaring.passage!.remaining} 月；处理眼前消息后继续，不重复扣除已耗年月。行装尚未扣除。`,
      );
      return finish();
    }
  } else {
    const elapsed = advanceMonths(s, q.months, { tick, interrupt: s => (occupied(s) || (s.outerSea.reminded && !input.outerSea.reminded)) ? "interrupted" : "" });
    s = elapsed.state;
    if (elapsed.stopped) {
        record(
          a.kind === "wait" && s.outerSea.reminded
            ? "古渡传来会谷来信，五十年之约已至。你结束候约，可自行决定何时赴会。"
            : "行程暂止，物资尚未扣除，成果尚未结算。",
        );
        return finish();

    }
  }
  if (settleResources(s, { stones: q.stones, herbs: q.herbs }).error) return input;
  const c = s.conclave;
  if (a.kind === "wait")
    record("你留居候约，年月与余寿照常流逝，修为没有增长；尚未报名或参加斗法。");
  if (a.kind === "mid" || a.kind === "late") {
    c.stage = a.kind === "mid" ? 1 : 2;
    s.outerSea.cultivation = c.stage * 300;
    s.cultivationRemainder = 0;
    record(
      a.kind === "mid"
        ? "镇潮印与澄息法在丹田中相应，丹元凝而不滞。金丹中期：气势 +12、伤害 +5、护体 +3，修行上限升至 599，能够应对诸宗会的中期修士。"
        : "定神珠守住识海，你将新法与丹元融成一体。金丹后期：气势再 +12、伤害再 +5、护体再 +3，修行上限升至 899。凝婴所需化婴丹仍须另行筹备。",
    );
  }
  if (a.kind === "visit") {
    c.location = "court";
    record(
      conclaveSupplement(s)
        ? "正会已散，各宗留下轮值修士主持入境补试。旧胜绩照录，仍以两场实战验明护身与破阵之能，无须再等五十年。"
        : "你随古渡来船抵达会谷。三宗旗帜分列石台，顾沧遥从同行来客中认出你，领你去看归潮秘境的残图。",
    );
  }
  if (a.kind === "meet") {
    c.introduced = true;
    record(
      "照霜门纪闻霜要寻找失传的凝神法，衡璇院程砚舟要校验归潮阵势。叶问苓说明：两场胜绩便可入境，第三场争优自愿；定神珠与抱元凝神录由入境者自取，阵图拓本交衡璇院修补潮路。化婴丹、凝婴法门与护神宝物缺一不可，普通法宝不能代替定神珠。",
    );
  }
  if (a.kind === "leave") {
    c.location = "away";
    record("你回到古渡。诸宗胜绩、入境资格与已探明的道路保留。");
  }
  if (a.kind === "training") {
    c.preparation = a.style;
    record(
      a.style === "none" ? "你按自己的功法与器物备战，不再采用会谷演练加成；此前演练耗费不返还。" : a.style === "ward"
        ? "顾沧遥陪你练成稳守潮势，诸宗会与归潮秘境交锋护体 +3，辨影后接守势额外承伤 −5；原辨阵准备不再启用。"
        : "叶问苓与你推演潮阵，诸宗会与归潮秘境辨影伤害 +6，辨影后接反击额外伤害 +8；原守势准备不再启用。",
    );
  }
  if (a.kind === "route") {
    c.route = a.route;
    record(
      a.route === "shelter"
        ? `你与叶问苓约定绕行背潮石道：入境六个月，行装灵石 10、灵草 ${2-conclaveLessons(s).herbsSaved}，秘境初始气势 +${16+conclaveLessons(s).shelterHp}。图中险流会公开标注，后来药船也能避开。`
        : `你选择循主流抢渡：入境两个月，行装灵石 6、灵草 ${4-conclaveLessons(s).herbsSaved}，秘境反击伤害 +${5+conclaveLessons(s).currentDamage}。答应带回实测水位，供衡璇院修正潮阵。`,
    );
  }
  if(a.kind === "route"){const lessons=conclaveLessons(s);record(c.last + " " + [lessons.gu,lessons.ye].filter(Boolean).join(" "));}
  if (a.kind === "prepare") {
    c.supplies = true;
    record(
      "行装已备。撤退或败退不丢失行装，每通一层才用尽；已探明的路不会要求重打。" + (conclaveLessons(s).herbsSaved ? "叶问苓按你辨影拆招的记录修订潮图，本次少耗灵草 1。" : ""),
    );
  }
  if (a.kind === "enter") {
    c.location = "vault";
    record(
      c.depth
        ? "定神珠映出深处阵纹，你循已知石道直抵照神阵枢。"
        : "三宗验过会谷胜绩，打开潮门。归潮外殿中，守珠傀儡护着一枚温润灵珠。",
    );
  }
  if (a.kind === "contest" || a.kind === "fight") {
    const kind = a.kind === "contest" ? "contest" : "vault",
      index = kind === "contest" ? c.wins : c.depth;
    c.duel = {
      kind,
      index,
      ...startBattle(
        foundationPower(s).hp +
          (kind === "vault" && c.route === "shelter" ? 16 + conclaveLessons(s).shelterHp : 0),
        (kind === "contest" ? rivals : wardens)[index]!.hp,
      ),
      effect: "",
      effort: freshEffort(),
    };
    record(
      `${conclaveFoe(s).name}与你交锋。最多十八合；败退伤势 +2，已获胜绩与秘境进度保留。`,
    );
  }
  if (a.kind === "move") {
    const d = c.duel!;
    const turn = executeBattleAction(d, s.herbs, { turnLimit: 18, resolution: "simultaneous" }, () => conclaveExchange(s, a.move, a.useHerbs));
    if (!turn) return input;
    const p = turn.exchange;
    const review = turn.outcome === "loss" ? defeatReview(s, a.move, p.damage, p.incoming, p.note, turn.battle.turn >= 18 && turn.battle.hp > 0) : "";
    Object.assign(d, turn.battle);
    s.herbs = turn.remainingHerbs;
    if(d.effort){d.effort.moves[a.move]++;d.effort.herbs+=turn.herbs;}
    d.effect = a.move;
    record(
      `削去气势 ${p.damage}，承受 ${p.incoming}${p.healing ? `，耗灵草 ${p.herbs} 回气 ${p.healing}` : ""}。${p.note}`,
    );
    if (turn.outcome === "win") {
      if(d.effort)c.victories.push({...structuredClone(d.effort),kind:d.kind,index:d.index,turns:d.turn});
      c.duel = null;
      if (d.kind === "contest") {
        c.wins++;
        s.stones += c.wins === 3 ? 32 : 18;
        record(
          c.wins === 1
            ? "顾沧遥收印认负，将你的首场胜绩记入会册。获得灵石 18，尚需一胜取得入境资格。"
            : c.wins === 2
              ? "纪闻霜收剑。两场胜绩已录，归潮秘境的入境资格归你。获得灵石 18；可以直接与叶问苓商议入境，无须再争优。"
              : "你拆开程砚舟的阵势，得到诸宗争优嘉许与灵石 32。他将破阵记录带回衡璇院；这份荣誉不额外垄断凝婴机缘。",
        );
      } else {
        c.depth++;
        c.location = "court";
        c.supplies = false;
        s.outerSea.cultivation = Math.min(
          goldenCap(s),
          s.outerSea.cultivation + (c.depth === 1 ? 45 : 60),
        );
        record(
          c.depth === 1
            ? "你取得定神珠，修为 +45。此珠能护持凝婴时的神识，却须先温养一年；温养后可出战，容量 6、护体 +5；温养也可抵住秘境深处的识海阵压。"
            : "照神阵枢平息，你取得抱元凝神录与一份凝婴灵髓，修为 +60。灵髓是化婴丹主材，尚不是成丹。" +
                (c.route === "shelter"
                  ? "叶问苓将你标明的险流补入公开海图。"
                  : "衡璇院依你的实测水位修正潮阵，药船多了一段可行航道。"),
        );
      }
      const won=c.victories.find(v=>v.kind===d.kind && v.index===d.index);
      if(won)record(c.last + " " + victoryMemory(won));
    } else if (turn.outcome === "loss") {
      c.duel = null;
      s.injury = Math.min(6, s.injury + 2);
      if (d.kind === "contest") c.retryAt = s.month + 6;
      else c.location = "court";
      record(
        "你败退离场，伤势 +2。此前胜绩、秘境进度与未用尽的行装保留；斗法失利须调息半年再试，秘境可养伤后重返。" + review,
      );
    }
  }
  if (a.kind === "withdraw") {
    c.duel = null;
    c.location = "court";
    record("你循来路撤回，不新增伤势；已有胜绩与秘境进度、行装保留。");
  }
  if (a.kind === "attune") {
    c.attuned = true;
    record(
      "一年温养后，定神珠与识海相应：深处阵压被抵住；在宝物页出战后占用容量 6、护体 +5。此珠保留为日后凝婴所需宝物，不会因探索消失。",
    );
  }
  if (a.kind === "method") {
    c.method = a.method;
    record(
      a.method === "inherit"
        ? "你将抱元凝神录接入旧法：伤害 +5，原有主修与澄息运功仍有效，金丹吐纳更快。旧功法与研修保留。"
        : "你转修抱元守神法：护体 +6，原主修招式与澄息攻守加成暂停，金丹吐纳更快。旧功法与研修保留，安全处可花半年改回。",
    );
  }
  return finish();
  function record(text: string) {
    s.conclave.last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
