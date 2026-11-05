import { crossingQuote, crossingView, type CrossingMove } from "./crossing";
import { nascentPromises, unsettledNascentPromises } from './promises';
export { nascentPromises } from './promises';
import { channelingPreview, channelingSituation } from './channeling';
import { covenantReady, covenantChoiceText, covenantCeremonyText, covenantReturnText, type CovenantChoice } from './covenant';
import { preparationRates } from "../preparation-rates";
import { spiritReadiness, injureSpirit } from "../spirit";
import { applyThunderTurn, startThunder, thunderMethodNames } from "./thunder";
import type { Move } from "../combat";
import { companionContact } from "./contact";
import type { State } from "../world";
import { nascentState } from "./state";
import { advanceMonths } from "../timeline";
import { quoteSettlement, settleResources } from "../economy";
export type NascentAction =
  | { kind: "crossing"; move: CrossingMove }
  | CovenantChoice
  | { kind: "discoverMethod" | "practiceThunder" }
  | { kind: "studyMethod"; method: "continuity" | "stillness" }
  | { kind: "thunderMove"; move: Move; useHerbs?: boolean }
  | {
      kind:
        | "contact"
        | "trial"
        | "complete"
        | "withdraw"
        | "claimMarrow"
        | "renewMarrow"
        | "review"
        | "recover"
        | "begin"
        | "emerge"
        | "survey"
        | "shelter"
        | "cross";
    }
  | { kind: "trialMove"; move: "body" | "mind" | "break" }
  | {
      kind: "commit";
      topic: "duty" | "home" | "promise" | "companion";
      choice: string;
    }
  | {
      kind: "ceremony";
      choice: "discuss" | "witness" | "meal" | "renew" | "defer" | "solitary";
    }
  | { kind: "brew"; method: "self" | "commission"; fire: "steady" | "rush" }
  | { kind: "land"; choice: "shared" | "independent" }
  | { kind: "protection"; choice: "array" | "friends" }
  | { kind: "strategy"; choice: "balanced" | "flow" | "spirit" }
  | {
      kind: "step";
      move:
        "release" | "channel" | "anchor" | "observe" | "unite" | "circulate";
    }
  | {
      kind: "celebrate";
      choice: "simple" | "formal" | "deferred";
      office: "accepted" | "declined";
    };
// C consumes its own ledger; B owns cumulative acquisition and never loses completion.
export const nascentAuxiliaryUsed = (s: State) =>
  nascentState(s)?.auxiliaryUsed ?? 0;
const lizhao = (s: State) =>
  (
    s as State & {
      lizhao?: {
        cleared: boolean;
        recipeVerified: boolean;
        reagent: number;
        duel: unknown;
        location: string;
      };
    }
  ).lizhao;
export const nascentCap = (s: State) =>
  Number(s.conclave.stage) >= 3 ? 1200 : 899;
export const nascentActive = (s: State) =>
  !!(
    nascentState(s)?.trial ||
    nascentState(s)?.attempt ||
    nascentState(s)?.thunder?.battle
  );
const occupied = (s: State) =>
  s.status !== "alive" ||
  !!(
    s.pending ||
    s.spirit?.trial ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.foundationJourney.duel ||
    s.sectContest.duel ||
    s.conclave.duel ||
    s.outerSea.duel ||
    s.qiJourney.node ||
    lizhao(s)?.duel ||
    (lizhao(s)?.location ?? "away") !== "away" ||
    s.ascension ||
    s.wayfaring.trip ||
    s.wayfaring.passage ||
    s.goldenCore.expedition !== "idle" ||
    s.outerSea.location === "ruins" ||
    s.conclave.location === "vault" ||
    (s.treasures.auction?.entered && !s.treasures.auction.closed)
  );
export function nascentQuote(s: State, a: NascentAction) {
  const n = nascentState(s);
  let error = "",
    months = 0,
    stones = 0,
    herbs = 0;
  if (!n)
    return {
      error: "凝婴记录尚未建立",
      months,
      stones,
      herbs,
      settlement: { cost: {}, reward: {} },
    };
  if (occupied(s)) error = "先结束眼前事件、旅行或其他险境；离照行程请先回古渡";
  if (s.outerSea.location !== "ferry" || s.conclave.location !== "away")
    error ||= "先回外海古渡，在已开静室安排此事";
  if (Number(s.realm) < 2) error ||= "结成金丹后再问此道";
  if (n.trial && !["trialMove", "withdraw"].includes(a.kind))
    error ||= "先完成禁室考验或撤出";
  if (n.attempt && !["step", "withdraw"].includes(a.kind))
    error ||= "凝婴尚在行功，只能应对当前变化或中止";
  if (n.thunder.battle && !["thunderMove", "withdraw"].includes(a.kind))
    error ||= "劫雷未散，先应雷或主动散功撤回";
  const post = ["emerge", "celebrate", "survey", "shelter", "cross", "crossing"];
  if (Number(s.realm) === 3 && !post.includes(a.kind) && !["contact", "covenant", "ceremony"].includes(a.kind))
    error ||= "元婴已成，先出关并兑现新能力";
  if (Number(s.realm) === 3 && !n.emerged && ["contact", "covenant", "ceremony"].includes(a.kind))
    error ||= "先稳固境界，出关后再赴约";
  if (Number(s.realm) !== 3 && post.includes(a.kind))
    error ||= "凝婴成功后才能出关";
  const need = (bad: unknown, msg: string) => {
    if (bad) error ||= msg;
  };
  switch (a.kind) {
    case "discoverMethod":
      months = 1;
      need(
        s.conclave.depth !== 2 ||
          !s.lizhao.recipeVerified ||
          n.thunder.discovered,
        "携归潮凝神录和离照丹室实录，到古渡核对元婴续篇",
      );
      break;
    case "studyMethod":
      months = 12;
      need(
        !n.thunder.discovered ||
          !["continuity", "stillness"].includes(a.method) ||
          n.thunder.method === a.method,
        "先核对元婴续篇，再选择尚未研修的行功法",
      );
      break;
    case "practiceThunder":
      months = 1;
      need(
        n.thunder.method === "none" ||
          n.thunder.practiced ||
          Number(s.conclave.stage) < 3,
        "圆满后携已研修的元婴续篇，在近岸试雷台验法",
      );
      need(s.injury > 0, "先养好伤势，再试雷验法");
      break;
    case "thunderMove":
      need(
        !n.thunder.battle ||
          !["guard", "strike", "discern"].includes(a.move) ||
          (a.useHerbs !== undefined && typeof a.useHerbs !== "boolean"),
        "当前没有可应对的雷势",
      );
      break;
    case "contact":
      need(!companionContact(s).availableForMeeting, "她尚在勘潮与休养，等此行结束再约仪式");
      months = 6;
      stones = 6;
      need(
        !companionContact(s).reliable ||
          companionContact(s).age + 6 >= companionContact(s).lifespan,
        "尚无近期回音，先循旧信路问讯。",
      );
      need(
        companionContact(s).invitationCurrent && s.month - n.contactedAt! < 120,
        "近十年已约定过相见地点",
      );
      break;
    case "trial":
      months = 3;
      stones = 12;
      need(
        !lizhao(s)?.cleared ||
          !lizhao(s)?.recipeVerified ||
          Number(s.conclave.stage) !== 2 ||
          s.outerSea.cultivation < 899 ||
          n.trialWon,
        "离照取药后修至899，再入试丹禁室",
      );
      need(s.injury > 0, "先养好伤势");
      break;
    case "trialMove":
      need(
        !n.trial || !["body", "mind", "break"].includes(a.move),
        "当前没有可应对的禁室阵势",
      );
      break;
    case "withdraw":
      need(!nascentActive(s), "当前无须撤出");
      break;
    case "complete":
      months = 12;
      need(
        !n.trialWon ||
          !lizhao(s)?.recipeVerified ||
          Number(s.conclave.stage) !== 2 ||
          s.outerSea.cultivation < 899,
        "通过禁室考验、修满899后再融汇圆满",
      );
      need(s.injury > 0, "先养好伤势");
      break;
    case "commit": {
      need(!nascentPromises(s)[a.topic], "此事没有尚待交接的承诺");
      need(Number(s.conclave.stage) < 3, "圆满后再作长关前交接");
      const options = {
        duty: ["handover", "decline"],
        home: ["letter", "remember"],
        promise: ["entrust", "carry"],
        companion: ["explain", "solitary"],
      };
      need(
        !Object.hasOwn(options, a.topic) ||
          !options[a.topic]?.includes(a.choice),
        "请选择明确的交接办法",
      );
      need(n.commitments[a.topic] === a.choice, "此项已记下");
      need(
        a.topic === "companion" && a.choice === "explain" && !s.social.met,
        "尚无相识同道，可独自立愿",
      );
      break;
    }
    case "covenant": {
      need(!companionContact(s).availableForMeeting, "她尚在勘潮与休养，等此行结束再约仪式");
      const values = {meeting:['remember','listen'],form:['quiet','friends'],token:['map','cord'],promise:['return','letters']} as const;
      need(Number(s.conclave.stage)<3 || !(s.social.bonded || s.foundationJourney.bond==='promised' || s.foundationJourney.bond==='covenant'), '先相知定情，再来商议此约');
      need(!companionContact(s).reliable || !(companionContact(s).present || (companionContact(s).invitationCurrent)), '先约好相见，再当面商议');
      need(!Object.hasOwn(values,a.topic) || !(values[a.topic] as readonly string[]).includes(a.choice), '这份约定尚未说清');
      need(a.topic==='meeting' ? !['none','deferred','solitary'].includes(n.ceremony) : n.ceremony!=='discussed', '先完成眼前的相谈');
      need(n.covenant[a.topic]===a.choice, '这句话已经记下');
      break;
    }
    case "ceremony": {
      if (["discuss","witness","meal","renew"].includes(a.choice)) need(!companionContact(s).availableForMeeting, "她尚在勘潮与休养，等此行结束再约仪式");
      need(Number(s.conclave.stage) < 3, "圆满后再商议行前仪式");
      const bonded = s.foundationJourney.bond === "covenant";
      const lover = s.social.bonded || s.foundationJourney.bond === "promised";
      if (["discuss", "witness", "meal", "renew"].includes(a.choice))
        need(
          !companionContact(s).reliable ||
            !(
              companionContact(s).present ||
              (companionContact(s).invitationCurrent)
            ),
          "先与实际能相见的伴侣约好仪式，暂缓不影响凝婴",
        );
      if (a.choice === "discuss")
        need(
          bonded || !lover || !["none", "deferred", "solitary"].includes(n.ceremony) || n.covenant.meeting === "none",
          "已定情且尚未结契者可商议",
        );
      else if (a.choice === "witness")
        need(n.ceremony !== "discussed" || !covenantReady(n.covenant), "先商定行礼、信物与往后的约定");
      else if (a.choice === "meal")
        need(n.ceremony !== "witnessed", "先完成见证");
      else if (a.choice === "renew")
        need(
          !bonded || !["none", "deferred", "solitary"].includes(n.ceremony),
          "已有契约才可重温，且不重复行礼",
        );
      else if (a.choice === "defer")
        need((!lover && !bonded) || !["none", "discussed"].includes(n.ceremony), "已相知定情才有待议仪式，行过的礼不再撤回");
      else if (a.choice === "solitary")
        need(lover || bonded || n.ceremony !== "none", "单身者可独自立愿");
      else need(true, "未知仪式");
      break;
    }
    case "claimMarrow":
      need(
        s.conclave.depth !== 2 || n.marrowClaimed,
        "须归潮取得灵髓，首次转录只可一次",
      );
      break;
    case "renewMarrow":
      months = 6;
      stones = 24;
      need(
        !n.marrowClaimed || !lizhao(s)?.cleared || n.marrow >= 3,
        "归潮药床已开，可有偿续取；主药最多备三份",
      );
      break;
    case "review":
      months = 6;
      need(!lizhao(s)?.cleared || n.reviewed, "离照验证丹方后可复核一次药理");
      break;
    case "brew":
      months = a.method === "self" ? 6 : 12;
      stones = a.method === "self" ? 18 : 48;
      herbs = n.reviewed ? 4 : 6;
      need(
        !["self", "commission"].includes(a.method) ||
          !["steady", "rush"].includes(a.fire),
        "未知炼丹方法",
      );
      need(
        !lizhao(s)?.cleared ||
          !lizhao(s)?.recipeVerified ||
          n.marrow < 1 ||
          (lizhao(s)?.reagent ?? 0) < 1,
        "需归潮主药1份与离照辅药1份；缺药可循已开渠道续取",
      );
      need(a.method === "self" && s.study < 4, "自炼需心得4；也可委托炼丹");
      need(n.pills >= 3, "最多备三枚化婴丹");
      break;
    case "land":
      months = a.choice === "independent" ? 12 : 6;
      stones = a.choice === "independent" ? 24 : 36;
      need(
        !lizhao(s)?.cleared ||
          !["shared", "independent"].includes(a.choice) ||
          n.land === a.choice,
        "离照完成后选择未备妥的灵地",
      );
      break;
    case "protection":
      months = 6;
      stones = a.choice === "array" ? 24 : 18;
      need(
        !lizhao(s)?.cleared ||
          !["array", "friends"].includes(a.choice) ||
          n.protection === a.choice,
        "离照完成后安排护持；阵法与合作道友均可",
      );
      break;
    case "strategy":
      need(
        !["balanced", "flow", "spirit"].includes(a.choice) ||
          n.strategy === a.choice,
        "选择不同的行功准备",
      );
      break;
    case "recover":
      months = 1;
      need(s.injury === 0, "当前无伤可养");
      break;
    case "begin":
      months = 12;
      need(
        s.limit - s.age <= 30,
        "凝婴行功共需30月，劫雷交锋不另扣年月；须至少余寿31月，避免服丹后无法完成行功",
      );
      need(
        !n.thunder.practiced || n.thunder.method === "none",
        "先研成能修至元婴的续篇，并以当前功法法宝通过试雷验法",
      );
      need(
        Number(s.conclave.stage) !== 3 ||
          s.outerSea.cultivation < 1200 ||
          !n.trialWon ||
          !lizhao(s)?.cleared,
        "修至金丹圆满1200并完成离照及禁室考验",
      );
      need(
        !s.conclave.attuned || s.conclave.method === "none",
        "先温养定神珠并掌握凝婴法门",
      );
      need(
        unsettledNascentPromises(s).length > 0,
        "先安排尚未了结的托付与约定",
      );
      need(
        n.land === "none" || n.protection === "none" || n.pills < 1,
        "需灵地、护持与一枚化婴丹",
      );
      need(s.injury > 0, "先养好伤势再正式叩关");
      break;
    case "step":
      months = 6;
      need(!n.attempt, "尚未开始凝婴");
      need(
        ![
          "release",
          "channel",
          "anchor",
          "observe",
          "unite",
          "circulate",
        ].includes(a.move),
        "未知行功方法",
      );
      break;
    case "emerge":
      months = 6;
      need(n.emerged, "已经出关");
      break;
    case "celebrate":
      need(
        !n.emerged ||
          !["none", "deferred"].includes(n.celebration) ||
          (n.celebration === "deferred" && a.choice === "deferred") ||
          !["simple", "formal", "deferred"].includes(a.choice) ||
          !["accepted", "declined"].includes(a.office),
        "出关后可筹办庆贺；暂缓后可再议，已行礼不重复办理",
      );
      months = a.choice === "formal" ? 2 : 0;
      stones = a.choice === "formal" ? 24 : a.choice === "simple" ? 6 : 0;
      break;
    case "survey":
      months = 1;
      need(
        !n.emerged || n.celebration === "none" || n.ability !== "none",
        "先出关并决定大典，再赴古渡潮隙勘察",
      );
      break;
    case "shelter":
    case "cross":
    case "crossing": {
      const q = crossingQuote(s, a.kind === "crossing" ? a.move : a.kind === "shelter" ? "main" : "advance");
      months=q.months; error ||= q.error;
      break;
    }
    default:
      need(true, "未知凝婴操作");
  }
  error ||= quoteSettlement(s, { stones, herbs }).error;
  need(s.limit - s.age <= months, "余寿不足以完成此行动");
  return {
    error,
    months,
    stones,
    herbs,
    settlement: { cost: { stones, herbs }, reward: {} },
  };
}
export function nascentTrialPreview(s: State, move: "body" | "mind" | "break") {
  const t = nascentState(s).trial;
  if (!t) return null;
  const pressure = t.turn % 3;
  const match = move === ["body", "mind", "break"][pressure];
  const powerCost = move === "break" ? 3 : 1;
  const bodyLoss = pressure === 0 ? (move === "body" ? 0 : 4) : 1;
  const mindLoss =
    pressure === 1
      ? Math.max(0, (move === "mind" ? 0 : 4) - spiritReadiness(s).resistance)
      : 1;
  return {
    pressure: ["丹火灼身", "识海回震", "禁纹暴露"][pressure],
    bodyLoss,
    mindLoss,
    powerCost,
    seals: move === "break" ? (match ? 3 : 1) : 0,
    recover: move === "body" ? 2 : move === "mind" ? 1 : 0,
  };
}
export const nascentStepPreview = channelingPreview;
export function nascentGuests(s: State) {
  const guests: string[] = [];
  if (
    companionContact(s).reliable &&
    (companionContact(s).present ||
      companionContact(s).invitationCurrent)
  )
    guests.push(s.social.gender === "male" ? "苏婉宁" : "尹照川");
  if (s.conclave.introduced) guests.push("衡璇院轮值使者", "澄渊宗轮值使者");
  if (s.journey.branch !== "none") guests.push("听松宗当值执事");
  return guests;
}
export function nascentGoal(s: State) {
  const n = nascentState(s);
  if (!n) return "待问凝婴之道";
  if (n.thunder.battle)
    return n.thunder.battle.kind === "practice"
      ? "试雷验法：以当前功法、法宝和护体拆开引雷阵，确认自身能够接雷。"
      : "三重天劫已至，护体承雷、破开雷脉与辨势导流均由你自己应对；渡过末劫才真正结婴。";
  if (n.trial)
    return "禁室六轮：护体、守神、破禁共用有限丹元，破开六道封印才能通过。";
  if (n.attempt) return nascentStepPreview(s, "")!.hint;
  if (Number(s.realm) === 3)
    return n.ability === "done"
      ? "测绘队已沿你护住的潮路渡过险段，彼岸的路标亮了起来。"
      : !n.emerged
        ? "稳固境界，出关报平安。"
        : n.celebration === "none"
          ? "自行决定庆贺规模与是否承担新职责。"
          : n.ability !== "none" ? crossingView(s).hint : "前往古渡潮隙，以新能力护持测绘队渡过潮隙乱流。";
  if (!n.trialWon)
    return "离照取药后，修满899，在试丹禁室安排护体、护神与破禁。";
  if (Number(s.conclave.stage) < 3) return "禁室已通，融汇丹元抵达金丹圆满。";
  return "修满1200，研成元婴续篇并试雷验法，备好化婴丹、灵地与护持；三段行功后须亲自渡过天劫，结契自愿。";
}
export function runNascent(
  input: State,
  a: NascentAction,
  id: string,
  tick: (s: State) => State,
): State {
  const q = nascentQuote(input, a);
  if (q.error || input.seen.includes(id)) return input;
  let s = structuredClone(input);
  const elapsed = advanceMonths(s, q.months, {
    tick,
    interrupt: (x) => (occupied(x) ? "interrupted" : ""),
  });
  s = elapsed.state;
  const record = (text: string) => {
    nascentState(s).last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  };
  const finish = () => {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  };
  if (elapsed.stopped) {
    if (s.status !== "alive") {
      nascentState(s).trial = null;
      nascentState(s).attempt = null;
      nascentState(s).thunder.battle = null;
    }
    record(
      "行功暂止，已耗年月保留；本次物资未扣、成果未结算。处理眼前消息后可继续。",
    );
    return finish();
  }
  if (settleResources(s, q.settlement.cost).error) return input;
  const n = nascentState(s);
  switch (a.kind) {
    case "discoverMethod":
      n.thunder.discovered = true;
      record(
        "古渡传讲人将你带回的归潮凝神录与离照丹室实录并排展开：原录只讲抱元凝神，续篇才记载元婴的长养与渡劫。你认出丹室残纹补齐了行功缺口，得以自行研习抱元归一或太素守神两条续法。化婴丹护住化丹关，功法维持婴形；天劫仍须自己的护体与法宝承受，谁也不能代渡。",
      );
      break;
    case "studyMethod":
      n.thunder.method = a.method;
      n.thunder.practiced = false;
      record(
        `一年推演与试运后，你研成${thunderMethodNames[a.method]}。${a.method === "continuity" ? "把旧有主修接续到元婴行功，渡劫破雷伤害增加8。" : "以清静守神调和身神，渡劫护体增加6。"}此法有元婴长养的完整行功依据，须到近岸石台引雷验法，不能只持有玉简便叩关。`,
      );
      break;
    case "practiceThunder":
      startThunder(s, "practice");
      record(
        "你沿古渡静室外的石阶登上近岸无人试雷台，将已研功法接入旧引雷阵。试雷不耗化婴丹；失败伤势2，养好后可重试。每合的雷势与预估承伤都可先看清，再决定怎样接招。",
      );
      break;
    case "thunderMove": {
      const r = applyThunderTurn(s, a.move, a.useHerbs);
      record(
        `你${a.move === "guard" ? "展开护体承雷" : a.move === "strike" ? "迎着雷隙破开雷脉" : "凝神辨势，将雷流导向空台"}：削去雷势${r.damage}，承伤${r.incoming}${r.healing ? `，耗灵草${r.herbs}回气${r.healing}` : ""}。${r.note}`,
      );
      if (s.status === 'dead') { n.last = s.result; break; }
      if (r.outcome === "loss")
        record(
          r.kind === "practice"
            ? "试雷余势压破护体，你沿退路离台。伤势2；功法仍在，养伤、调整法宝或补给后可重新验法。"
            : "十二合未能化去此重雷势，你趁气势尚存散功退回静室。此丹已耗，伤势3；修为基础、元婴功法、试雷所得与补药渠道保留，恢复后可再叩关。",
        );
      if (r.outcome === "wave")
        record(
          n.last +
            " 这一重劫雷已散，下一层雷云正在收拢；气势与药物消耗延续，不能中途换装或凭空回满。",
        );
      if (r.outcome === "win")
        record(
          r.kind === "practice"
            ? "引雷阵的雷脉被你亲手拆开。你已用当前功法和器物完成试雷验法，接下来须备好化婴丹并把修为积至1200。"
            : `三重劫雷尽散，丹破婴生，寿限再增五百年。你如今${Math.floor(s.age / 12)}岁${s.age % 12}月，寿限${Math.floor(s.limit / 12)}岁${s.limit % 12}月，余寿${Math.floor((s.limit - s.age) / 12)}年${(s.limit - s.age) % 12}月。静室门外，已有报平安的灯火等候。`,
        );
      break;
    }
    case "contact":
      n.contactedAt = s.month;
      record(
        "你循近期来信约定古渡见面，支付往返信使与落脚费用。对方安排好自己的行程，答应在近十年内前来商议；约见不改变其修为。",
      );
      break;
    case "trial":
      n.trial = {
        turn: 0,
        body: 18,
        mind: spiritReadiness(s).trialMind,
        power: 12,
        seals: 0,
      };
      record(
        "禁室丹火、回震、露纹依次更替。六轮内破开六道封印；护体回丹元2，守神回丹元1，破禁耗丹元3。失败伤势2，已得药物与通路保留。",
      );
      break;
    case "trialMove": {
      const t = n.trial!,
        p = nascentTrialPreview(s, a.move)!;
      t.turn++;
      t.body = Math.max(0, t.body - p.bodyLoss);
      t.mind = Math.max(0, t.mind - p.mindLoss);
      if (t.power >= p.powerCost) {
        t.power = Math.min(12, t.power - p.powerCost + p.recover);
        t.seals += p.seals;
      } else {
        t.body = Math.max(0, t.body - 5);
        t.mind = Math.max(0, t.mind - 5);
      }
      record(
        `${p.pressure}：护体余${t.body}，心神余${t.mind}，丹元余${t.power}，已破封印${t.seals}/6。`,
      );
      if (t.body === 0 || t.mind === 0 || t.turn >= 6) {
        n.trialWon = t.body > 0 && t.mind > 0 && t.seals >= 6;
        n.trial = null;
        if (n.trialWon)
          record(
            "你在连续丹火中护住身神，并亲手拆尽六道禁纹。金丹圆满的综合考验已过。",
          );
        else {
          if (t.mind === 0) injureSpirit(s);
          s.injury = Math.min(6, s.injury + 2);
          record(
            "禁室熄火，你退回石阶。伤势增加2，养伤后可重新挑战，离照药物与法门保留。",
          );
        }
      }
      break;
    }
    case "withdraw":
      if (n.attempt || n.thunder.battle?.kind === "tribulation") {
        s.injury = Math.min(6, s.injury + 2);
        n.failures++;
      }
      n.trial = null;
      n.attempt = null;
      n.thunder.battle = null;
      record("你主动中止行功，已耗丹药与年月不返还，已得历练和通路保留。");
      break;
    case "complete":
      (s.conclave as { stage: number }).stage = 3;
      s.outerSea.cultivation = 900;
      s.cultivationRemainder = 0;
      record(
        "丹火、神识与护体归于一息，金丹圆满。丹元仍可积蓄至1200；长关之前，须将药物、功法与护持一一备妥。",
      );
      break;
    case "commit": {
      (n.commitments as Record<string, string>)[a.topic] = a.choice;
      const lines: Record<string, string> = {
        handover: s.journey.rank
          ? "你将已领职务的账册交给轮值执事，并写明长关期间的接手人。"
          : "你把合作账册交还同道，说明不代领新的差事。",
        decline: "你明确暂不担任新的职务，已受托事项交还原联络人安排。",
        letter:
          "你写下一封家书，托现有药路转交。来不及相见的人，名字仍留在信末。",
        remember:
          "你抚平旧信的折角，把来不及说的话记在页后，随后将它收回行囊。",
        entrust: "你将尚未接续的寻人线索封好，托渡口联络人留意新消息：‘这件事我记着，待出关再续。’",
        carry: "你在随身簿中记下尚未完成的寻人之约，将旧线索夹在页间。出关后，仍从这里接着找。",
        explain: "你将长关的安排写进信中，也请对方留下下一程的信路。若有急事，仍循约好的记号传讯。",
        solitary: "你留下闭关处与急讯的送法，收好行囊，独自向静室走去。",
      };
      record(lines[a.choice]!);
      break;
    }
    case "covenant": {
      Object.assign(n.covenant, {[a.topic]:a.choice});
      record(covenantChoiceText(s,a));
      break;
    }
    case "ceremony": {
      const next = {
        discuss: "discussed",
        witness: "witnessed",
        meal: "married",
        renew: "renewed",
        defer: "deferred",
        solitary: "solitary",
      } as const;
      n.ceremony = next[a.choice];
      if (a.choice === "meal") {
        s.foundationJourney.bond = "covenant";
        if (s.foundationJourney.contact === "none")
          s.foundationJourney.contact = "letters";
      }
      if (a.choice==='witness') n.covenant.witnesses = n.covenant.form==='friends' ? nascentGuests(s).filter(name=>!['苏婉宁','尹照川'].includes(name)) : [];
      record(covenantCeremonyText(s,a.choice));
      break;
    }
    case "claimMarrow":
      n.marrowClaimed = true;
      n.marrow++;
      record(
        "你将归潮带出的凝婴灵髓封入丹匣。药床位置与轮采时节已记在路图上，日后缺药，可依约再往。",
      );
      break;
    case "renewMarrow":
      n.marrow++;
      record("你按已探明的药床轮采约定取得一份灵髓，支付24灵石，耗时半年。");
      break;
    case "review":
      n.reviewed = true;
      record(
        "你将离照丹室记录与今世药性逐条互验。后续每炉灵草由6降为4，稳火方案可确定成丹；辨清药性使正式行功初始稳定由6增至7，遇到一次资源接续不稳时多留一分收势余地。",
      );
      break;
    case "brew":
      n.marrow--;
      lizhao(s)!.reagent--;
      n.auxiliaryUsed++;
      n.brews++;
      if (a.fire === "rush" && a.method === "self") {
        s.injury = Math.min(6, s.injury + 1);
        record(
          "急火损坏本炉药性，主药和辅药各耗一份，伤势1。已开补药渠道保留；改用稳火或委托可确定成丹。",
        );
      } else {
        n.pills++;
        record(
          "主药与离照辅药相合，化婴丹成一枚。每次正式叩关消耗一枚，失败可重新备药炼制。",
        );
      }
      break;
    case "land":
      n.land = a.choice;
      record(
        a.choice === "independent"
          ? "你依离照学到的阵理修复古渡旧静室，亲自校验灵流与退路。"
          : "你用已完成的探境实测换得轮用灵地，支付维护费用；不因此加入外宗。",
      );
      break;
    case "protection":
      n.protection = a.choice;
      record(
        a.choice === "array"
          ? "你布好外护阵，将突变导往废弃泄流道。渡劫护体增加3，护持不依赖伴侣在场。"
          : "合作道友轮值守住外围，使你能多保留18气势迎雷；不代渡，也不要求恋爱或宗籍。",
      );
      break;
    case "strategy":
      n.strategy = a.choice;
      record("已更改凝婴丹元与心神分配；正式叩关前仍可调整。");
      break;
    case "recover":
      s.injury = Math.max(0, s.injury - preparationRates.healing);
      record(
        `静养一月，伤势减${preparationRates.healing}，与普通静养相同，无须另购药物。`,
      );
      break;
    case "begin":
      n.pills--;
      n.attempt = {
        phase: 0,
        flow: n.strategy === "flow" ? 9 : n.strategy === "spirit" ? 5 : 7,
        spirit: Math.min(
          12,
          (n.strategy === "spirit" ? 9 : n.strategy === "flow" ? 5 : 7) +
            spiritReadiness(s).breakthroughBonus,
        ),
        stability: n.reviewed ? 7 : 6,
      };
      record(
        `化婴丹已服下。${channelingSituation(s)}丹元和心神必须留给后续两段；失稳会耗去此丹并留下可恢复伤势。`,
      );
      break;
    case "step": {
      const d = n.attempt!,
        p = nascentStepPreview(s, a.move)!;
      d.flow = Math.max(0, Math.min(12, d.flow - p.flow));
      d.spirit = Math.max(0, Math.min(12, d.spirit - p.spirit));
      d.stability = Math.max(0, d.stability - p.loss);
      d.phase++;
      record(
        `${p.phase}：丹元余${d.flow}，心神余${d.spirit}，稳定余${d.stability}。${p.warning}`,
      );
      if (d.stability === 0) {
        if (d.spirit === 0) injureSpirit(s);
        n.attempt = null;
        n.failures++;
        s.injury = Math.min(6, s.injury + 3);
        record(
          "身神未能相合，本次凝婴中止。丹药已耗、伤势3；修为、法门、关系与补药渠道保留。",
        );
      } else if (d.phase === 3) {
        n.attempt = null;
        startThunder(s, "tribulation", d.flow + d.spirit);
        record(
          "身神相合，未稳的婴形引动天地雷机。你从静室踏上相连的近岸渡劫台，护持者守住外围退路；三重天劫必须亲自承受。此刻仍是金丹，正式天劫气势耗尽会陨落（同归于尽亦然）；每合出招前可主动散功退劫。渡过最后一重且保住自身气势才会真正结婴。行功留存的丹元与心神已化为额外气势。",
        );
      }
      break;
    }
    case "emerge":
      n.emerged = true;
      record(
        s.foundationJourney.bond === "covenant"
          ? "你推开静室门。" + covenantReturnText(s)
          : "你推开静室门，将平安消息交给轮值道友。灯火照见来路，你已能亲自护持更远的险境。",
      );
      break;
    case "celebrate":
      n.celebration = a.choice;
      n.office = a.office;
      n.guests = a.choice === "deferred" ? [] : nascentGuests(s);
      record(
        a.choice === "deferred" ? "你将庆贺留待日后，先托信驿送出平安信。古渡那边已有回音，想办时再来商议。" : `你${a.choice === "formal" ? "安排正式观礼" : a.choice === "simple" ? "与相识者行简礼" : "暂缓大典，先把平安消息送出"}。${n.guests.length ? "到场：" + n.guests.join("、") + "。" : ""}${a.office === "accepted" ? "你答应先看过潮隙，再与古渡管事商议护路的范围。" : "你谢绝新增职务，仍保留既有合作。"}席散后，古渡送来潮隙复起的消息，测绘队盼你前去看看。`,
      );
      break;
    case "survey":
      n.ability = "surveyed";
      record(
        "你以元婴神识探入潮隙：主潮横截航道，彼岸回流冲击落脚处，中段却有可安全停舟的回水湾。测绘队在此岸装好测杆，等你决定如何护送；旧日金丹只能独自择隙通过。",
      );
      break;
    case "shelter":
    case "cross":
    case "crossing": {
      const result = crossingQuote(s, a.kind === "crossing" ? a.move : a.kind === "shelter" ? "main" : "advance");
      n.crossing=result.next;
      n.ability=result.done ? "done" : "sheltered";
      record(result.note);
      break;
    }
  }
  return finish();
}
