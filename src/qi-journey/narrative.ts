import type { State } from "../world";
import type { Move } from "../expedition/content";
import type { ResourceAmounts } from "../economy";
import { quoteSettlement, settleResources } from "../economy";
import { startBattle, executeBattleAction } from "../combat";
import { readiness, tacticalPreview } from "../combat/game";
import { preparationReady } from "./preparation";
import type { CaveMethod } from "./narrative-state";
export type QiNarrativeAction =
  | `origin:${"world" | "life" | "kin" | "quiet"}`
  | "origin:sect"
  | "origin:letter"
  | "origin:entrust"
  | "cave:depart"
  | "cave:return"
  | `cave:prepare:${CaveMethod}`
  | "cave:together"
  | "cave:alone"
  | "cave:mark"
  | "cave:challenge"
  | `cave:process:${"separate" | "balance"}`
  | "cave:apply"
  | `cave:notes:${"share" | "leave" | "claim"}`
  | "ambush:depart"
  | "ambush:return"
  | "ambush:yield"
  | "ambush:escort"
  | "ambush:fight"
  | "ambush:capture"
  | "ambush:release"
  | `narrative:${Move}`;
const actions = new Set<string>([
  "origin:world",
  "origin:life",
  "origin:kin",
  "origin:quiet",
  "origin:sect",
  "origin:letter",
  "origin:entrust",
  "cave:depart",
  "cave:return",
  "cave:prepare:medicine",
  "cave:prepare:body",
  "cave:prepare:array",
  "cave:together",
  "cave:alone",
  "cave:mark",
  "cave:challenge",
  "cave:process:separate",
  "cave:process:balance",
  "cave:apply",
  "cave:notes:share",
  "cave:notes:leave",
  "cave:notes:claim",
  "ambush:depart",
  "ambush:return",
  "ambush:yield",
  "ambush:escort",
  "ambush:fight",
  "ambush:capture",
  "ambush:release",
  "narrative:guard",
  "narrative:strike",
  "narrative:discern",
]);
export const isQiNarrativeAction = (a: string): a is QiNarrativeAction =>
  actions.has(a);
/** Extra notes only help the next inner-vault challenge; yielding them removes that benefit. */
export function qiNotesPower(s: State) {
  const n=s.qiJourney.narrative;
  if (!n || !qiCaveComplete(s) || s.qiJourney.gates!==1) return 0;
  return n.notes==='shared' ? 1 : n.notes==='claimed' && n.pursuit!=='yielded' ? 2 : 0;
}
export const qiCaveComplete = (s: State) =>
  s.qiJourney.narrative?.phase === "applied";
export const qiNarrativeActive = (s: State) =>
  !!s.qiJourney.narrative && s.qiJourney.narrative.location !== "home";
export const qiNarrativeBattle = (s: State) => !!s.qiJourney.narrative?.duel;
export const qiNarrativeLocation = (s: State) =>
  s.qiJourney.narrative?.location ?? "home";
export const qiNarrativeDestinations = {
  home: {
    id: "qi-medicine-court",
    name: "山门药坪",
    region: "听松山下",
    image: "/art/world-story/qi/sect-medicine-court.webp",
  },
  cave: {
    id: "qi-stone-ravine",
    name: "石涧旧药窟",
    region: "听松药路支涧",
    image: "/art/world-story/qi/stone-ravine-vault.webp",
  },
  branch: {
    id: "qi-pass-branch",
    name: "青嶂支路",
    region: "青嶂关外药路",
    image: "/scenes/mist-path.jpg",
  },
} as const;
export function qiNarrativeTravel(s: State) {
  const location = qiNarrativeLocation(s);
  const candidates: {
    action: QiNarrativeAction;
    to: typeof location;
    distance: number;
  }[] =
    location === "home"
      ? [
          { action: "cave:depart", to: "cave", distance: 120 },
          { action: "ambush:depart", to: "branch", distance: 90 },
        ]
      : [
          {
            action: location === "cave" ? "cave:return" : "ambush:return",
            to: "home",
            distance: location === "cave" ? 120 : 90,
          },
        ];
  return candidates.map((c) => ({
    ...c,
    from: location,
    ...qiNarrativeQuote(s, c.action),
  }));
}
export const motiveText = {
  world: "想看看百年后的天地",
  life: "不愿受困于衰老",
  kin: "想有能力护住牵挂的人",
  quiet: "还没有想好怎样说",
};
export function qiNarrativeGoal(s: State) {
  const n = s.qiJourney.narrative;
  if (n.location === "branch")
    return n.pursuit === "defeated"
      ? "段厉已失去抵抗，决定如何收束。"
      : "段厉盯上的是额外札记；可交出、结伴护送或正面应战。";
  if (n.phase === "applied")
    return "杂气已经分开，护脉法已亲自用过。回山准备凝元，额外札记不影响晋升。";
  if (n.phase === "processed")
    return "把亲手调成的药液用于逆流调息，检验能否稳定经脉。";
  if (n.phase === "won")
    return "旧药床安静下来。分离或调匀药性，再亲手用一次。";
  if (n.phase === "challenge")
    return "药气沿旧阵翻涌；看清每一合来势，守住气息。";
  return "凝元前须亲自处理杂气。备好解法、选同行方式并留退路，再试药窟旧阵。";
}
function requirement(s: State, a: QiNarrativeAction) {
  const n = s.qiJourney.narrative;
  if (!n) return "先更新存档格式";
  if (
    s.status !== "alive" ||
    s.realm !== 0 ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.foundationJourney.duel ||
    s.qiJourney.node ||
    s.qiJourney.duel ||
    s.wayfaring?.trip ||
    s.wayfaring?.passage ||
    s.ascension
  )
    return "先处理眼前事件或结束行程";
  if (a === "cave:return") return n.location === "cave" ? "" : "当前不在药窟";
  if (a === "ambush:return")
    return n.location === "branch" ? "" : "当前不在青嶂支路";
  if (n.duel) return a.startsWith("narrative:") ? "" : "先结束交锋或撤回";
  if (a.startsWith("narrative:")) return "当前没有交锋";
  if (a.startsWith("origin:")) {
    if (n.location !== "home") return "回到山下再交谈";
    if (a === "origin:sect")
      return s.adventure.step !== "done"
        ? "先完成药篓营救"
        : n.sectBriefed
          ? "已经听过药坪交代"
          : "";
    if (a === "origin:letter" || a === "origin:entrust")
      return s.qiJourney.gates < 2
        ? "凝元后再交托远行家书"
        : n.homeReply !== "none"
          ? "家书已经交托"
          : "";
    return n.motive !== "unspoken" ? "此番心意已经记下" : "";
  }
  if (a === "cave:depart")
    return n.location !== "home"
      ? "先回山下"
      : s.qiJourney.gates !== 1
        ? "淬脉之后、凝元之前前往石涧"
        : n.phase === "applied" && n.notes !== "undecided"
          ? "药窟行程已结"
          : "";
  if (a === "ambush:depart")
    return n.location !== "home"
      ? "先回山下"
      : n.pursuit !== "warned"
        ? "当前没有截夺风险"
        : "";
  if (a.startsWith("ambush:")) {
    if (n.location !== "branch") return "先赴青嶂支路";
    if (a === "ambush:capture" || a === "ambush:release")
      return n.pursuit === "defeated" ? "" : "先击退段厉";
    if (n.pursuit !== "warned") return "这段争端已经收束";
    if (a === "ambush:escort" && n.company !== "together")
      return "此前未与卢雁回结伴，可交出额外札记或自行应战";
    if (a === "ambush:fight" && s.injury >= 3) return "伤势须降至2以下再战";
    return "";
  }
  if (n.location !== "cave") return "先沿药路抵达石涧";
  if (a === "cave:together" || a === "cave:alone")
    return n.company === "none" ? "" : "同行方式已定";
  if (a === "cave:mark") return n.retreatMarked ? "退路已经标好" : "";
  if (a.startsWith("cave:prepare:")) {
    if (n.method) return "已备妥解法，失败后可沿用";
    if (n.company === "none") return "先与卢雁回说定同行或独行";
    if (a === "cave:prepare:array" && (s.sense < 8 || s.study < 2))
      return "辨阵准备需要神识8、心得2";
    if (!s.journey.main) return "先装配主修功法";
    return "";
  }
  if (a === "cave:challenge")
    return n.phase !== "prepared"
      ? "先备好一种解法"
      : !n.retreatMarked
        ? "先留出退路"
        : s.injury >= 3
          ? "伤势须降至2以下再试阵"
          : "";
  if (a.startsWith("cave:process:"))
    return n.phase === "won"
      ? ""
      : ["processed", "applied"].includes(n.phase)
        ? "药性已经处理妥当"
        : "先亲自稳住药床旧阵";
  if (a === "cave:apply")
    return n.phase === "processed"
      ? ""
      : n.phase === "applied"
        ? "已经亲自运用过药法"
        : "先处理混杂药性";
  if (a.startsWith("cave:notes:"))
    return !["won", "processed", "applied"].includes(n.phase)
      ? "先完成核心挑战"
      : n.notes !== "undecided"
        ? "额外札记已经分定"
        : "";
  return "未知行动";
}
export function qiNarrativeQuote(s: State, a: QiNarrativeAction) {
  const cost: ResourceAmounts = {};
  if (a === "cave:prepare:medicine") cost.herbs = 2;
  if (a === "cave:prepare:body") cost.stones = 4;
  if (a === "cave:apply") cost.herbs = 2;
  const months = ["cave:depart", "ambush:depart", "cave:apply"].includes(a)
    ? 1
    : 0;
  const reward: ResourceAmounts = {};
  return {
    months,
    settlement: { cost, reward },
    error: requirement(s, a) || quoteSettlement(s, cost).error,
  };
}
export function qiNarrativeEnemy(s: State) {
  const n = s.qiJourney.narrative;
  const ambush = n.pursuit === "fighting";
  return {
    name: ambush ? "段厉 · 炼气后期" : "药床逆流阵 · 炼气后期",
    hp: ambush ? 100 : 90,
    attack: ambush ? 17 : 16,
    realm: 0 as const,
    stage: 2,
    pattern: (ambush
      ? ["guard", "discern", "strike"]
      : n.method === "medicine"
        ? ["guard", "strike", "discern"]
        : n.method === "body"
          ? ["guard", "discern", "strike"]
          : ["discern", "guard", "strike"]) as Move[],
  };
}
export function qiNarrativePreview(s: State, move: Move) {
  const n = s.qiJourney.narrative;
  if (!n.duel) return null;
  const e = qiNarrativeEnemy(s),
    expected = e.pattern[n.duel.turn % e.pattern.length];
  const methodMove = n.method === "array" ? "discern" : "guard";
  return tacticalPreview(s, {
    move,
    encounter: e,
    battle: n.duel,
    effect: n.duel.effect,
    arrayCore: n.location === "cave",
    adjustments: [
      {
        phase: "power",
        armor:
          n.location === "cave" && move === methodMove
            ? n.method === "body"
              ? 4
              : n.method === "medicine"
                ? 2
                : 3
            : 0,
        damage:
          n.method === "medicine" &&
          n.location === "cave" &&
          move === "strike" &&
          expected === "strike"
            ? 3
            : 0,
      },
    ],
  });
}
export function qiNarrativeTell(s: State) {
  const n = s.qiJourney.narrative;
  if (!n.duel) return "";
  const e = qiNarrativeEnemy(s);
  const move = e.pattern[n.duel.turn % e.pattern.length];
  return n.location === "cave"
    ? {
        guard: "药气正面冲来，先护住经脉。",
        discern: "阵槽忽明忽暗，辨清哪一道是真流。",
        strike: "药气回落，正好切断逆流。",
      }[move]
    : {
        guard: "段厉压步劈来，先收势护身。",
        discern: "他虚晃一招，留意侧面的短刃。",
        strike: "他收刀换气，正是反击空隙。",
      }[move];
}
export function runQiNarrative(
  input: State,
  a: QiNarrativeAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (input.seen.includes(id)) return input;
  const quote = qiNarrativeQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  // Preparation/action time is quoted once; pending events interrupt before any cost or progress.
  for (let i = 0; i < quote.months; i++) {
    s = tick(s);
    if (s.status !== "alive" || s.pending) {
      const n = s.qiJourney.narrative;
      n.location = "home";
      if (s.status !== "alive") {
        n.duel = null;
        if (n.phase === "challenge") n.phase = "prepared";
        if (n.pursuit === "fighting") n.pursuit = "warned";
      }
      n.last =
        s.status === "alive"
          ? "来信打断行程；已过一月，材料未扣，行动尚未完成。"
          : "寿元已尽，此行未成。";
      s.qiJourney.last = n.last;
      s.seen = [...input.seen, id].slice(-512);
      return s;
    }
  }
  if (settleResources(s, quote.settlement.cost).error) return input;
  const n = s.qiJourney.narrative;
  if (a.startsWith("origin:")) {
    if (a === "origin:sect") {
      n.sectBriefed = true;
      n.last = `药坪上，药队分出一半药草送往丹堂。温蘅道：“听松宗靠这条药路传法，也得护住运药的人。陆怀真掌门是金丹后期，能传凝丹之法，却没有在世元婴授业。”${s.journey.branch === "none" ? "你尚未入宗；她说明散修仍可求教、护药与同探秘境，不必拜师才有前路。" : s.journey.branch === "jian" ? "剑院与丹堂同属听松，你的护送修行也关系着药队的生计。" : "丹堂与剑院同属听松，炼药不能离开护送和供给。"}`;
    } else if (a === "origin:letter" || a === "origin:entrust") {
      n.homeReply = a === "origin:letter" ? "letter" : "entrust";
      n.last = `你${a === "origin:letter" ? "写下这一路取药与凝元的经历" : "请药队替你传话，只说自己仍在修行"}。故乡旧友托来的话说，药乡的日子也在变；你没有要求他们一直等在渡口。温蘅提醒：筑基能增寿，却不是从此没有尽头。青石那一枚丹的去向，不替你决定此后为什么走下去。`;
    } else {
      n.motive = a.slice(7) as "world" | "life" | "kin" | "quiet";
      n.last = `你握住家里缝的药囊：${motiveText[n.motive]}。药乡、晒药的长辈和同龄旧友仍在山外。那次药运遇险，是随队老药师教你调息，温蘅随后认出你能感应灵气；你才自己决定上山求教。`;
    }
  } else if (a === "cave:depart") {
    n.location = "cave";
    n.last =
      "沿听松药路走入石涧。卢雁回指着废药床：这里旧阵会搅动杂气，先备解法、说清分工，再留一条退路。";
  } else if (a === "ambush:depart") {
    n.location = "branch";
    n.last =
      "你循药路抵达青嶂支路，见到新折的草茎和截断的撤离绳。段厉已公开索要额外札记；核心药法与晋升材料不在交涉之列。";
  } else if (a === "cave:return" || a === "ambush:return") {
    if (n.phase === "challenge") n.phase = "prepared";
    if (n.pursuit === "fighting" || n.pursuit === "defeated")
      n.pursuit = "escaped";
    n.location = "home";
    n.duel = null;
    n.last =
      "沿预留退路回到山下。准备、已处理药性与应用成果保留；用过的补给不退。";
    if (n.pursuit === "escaped")
      n.last +=
        "你带着核心所学脱身，额外札记的争端止于此行，段厉不再反复追来。";
  } else if (a === "cave:together" || a === "cave:alone") {
    n.company = a === "cave:together" ? "together" : "alone";
    n.last =
      n.company === "together"
        ? "你与卢雁回说定互守退路，核心药法各自实测，额外札记另行分抄；她不会代你闯阵。"
        : "你谢过卢雁回的线索，自己探路、自己担风险；核心药法不受宗籍限制。";
  } else if (a === "cave:mark") {
    n.retreatMarked = true;
    n.last =
      "你在右侧干地系好退绳，试过回路。失利可撤回疗伤，已备解法不用重做。";
  } else if (a.startsWith("cave:prepare:")) {
    n.method = a.slice(13) as CaveMethod;
    n.phase = "prepared";
    n.last = {
      medicine: "你用两株灵草调出诱引药气，准备把冲流引向空药床。",
      body: "你以四枚灵石稳住护体阵脚，准备迎住逆流，逐步越过旧阵。",
      array: "你将灵流的真假回路逐一刻在石片上，准备在变阵时解除节点。",
    }[n.method];
  } else if (a === "cave:challenge" || a === "ambush:fight") {
    if (a === "cave:challenge") n.phase = "challenge";
    else n.pursuit = "fighting";
    n.duel = {
      ...startBattle(readiness(s).hp, qiNarrativeEnemy(s).hp),
      effect: "none",
    };
    n.last =
      a === "cave:challenge"
        ? "你踏上药床干地，旧阵的杂气开始冲击经脉。三种来势须亲自应对。"
        : "段厉堵住侧径，持刀来夺札记。你已留好退路，可以击退、擒送或撤离。";
  } else if (a.startsWith("narrative:")) {
    const move = a.slice(10) as Move;
    const turn = executeBattleAction(n.duel!, s.herbs, {
      turnLimit: 16, resolution: "journey",
    }, () => qiNarrativePreview(s, move));
    if (!turn) return input;
    const p = turn.exchange;
    n.duel = { ...turn.battle, effect: move };
    s.herbs = turn.remainingHerbs;
    n.last = `${qiNarrativeEnemy(s).name}气势 −${turn.damage}，自身气势 −${turn.incoming}${turn.healing ? `、回气 +${turn.healing}` : ""}。${p.note}`;
    if (turn.outcome === "win") {
      n.duel = null;
      if (n.location === "cave") {
        n.phase = "won";
        n.last += "你稳住了药床旧阵，接下来须亲自处理混杂药性。";
      } else {
        n.pursuit = "defeated";
        n.last += "段厉弃刀退让。可押交护路执事，或让他留下停止截路的回执。";
      }
    } else if (turn.outcome === "loss") {
      n.duel = null;
      s.injury = Math.min(6, s.injury + 1);
      if (n.location === "cave") n.phase = "prepared";
      else n.pursuit = "escaped";
      n.location = "home";
      n.last += "你沿退路败退，伤势 +1，晋升资源和核心所学保留。";
      n.last +=
        n.pursuit === "escaped"
          ? "此番争端止于脱身，不再生成追兵。"
          : "疗伤后可用原准备重试。";
    }
  } else if (a.startsWith("cave:process:")) {
    n.phase = "processed";
    n.mixture = a.endsWith("separate") ? "separated" : "balanced";
    n.last =
      n.mixture === "separated"
        ? "你沿阵槽分开燥烈与清润两股药气，留下可以护脉的清液。"
        : "你依刚才受力的先后，逐次调匀药性，把骤涌化成缓流。";
  } else if (a === "cave:apply") {
    n.phase = "applied";
    s.injury = Math.max(0, s.injury - 1);
    n.last =
      "你用两株灵草将亲手处理的药液敷入逆流调息，整整一月检验经脉。伤势 −1（最低为0）；此后凝元内府交锋护甲 +1。药液在逆流中也不再散乱，你已经能将这套手法用于凝元准备。";
  } else if (a.startsWith("cave:notes:")) {
    n.notes = a.endsWith("share")
      ? "shared"
      : a.endsWith("leave")
        ? "left"
        : "claimed";
    if (n.notes === "claimed") {
      n.pursuit = "warned";
      n.last =
        "你带走完整额外札记，凝元内府伤害 +2。卢雁回没有同意你独占，故不替你应战；若此前结伴，她仍会守退路。段厉在出口露面，声称要在青嶂支路截取札记。可放弃札记、结伴走正路或设伏应战，核心药法不会被夺走。";
    } else
      n.last =
        n.notes === "shared"
          ? "你与卢雁回分抄药床观察，双方保留各自所得，分抄的阵路让凝元内府伤害 +1。她愿意继续交流；没有额外争端。"
          : "你留下额外札记，只带亲手学会的药性处置法。此行没有分宝争端。";
  } else {
    n.pursuit = (
      {
        "ambush:yield": "yielded",
        "ambush:escort": "escorted",
        "ambush:capture": "captured",
        "ambush:release": "escaped",
      } as const
    )[a as "ambush:yield"];
    n.location = "home";
    n.last = (
      {
        "ambush:yield":
          "你放下额外札记，从预留正路离开。段厉得到他索要之物，额外札记的伤害加成消失，截路争端就此结束；核心所学保留。",
        "ambush:escort":
          "卢雁回按守退路的约定陪你走正路，药队见证段厉截路。护路执事接管这一段，他不再尾随。她仍不认可你独占札记，也没有替你战斗。",
        "ambush:capture":
          "你将弃刀的段厉押交护路执事，留下截路证据。他被看押，不再复用为追兵；卢雁回只为亲眼所见作证。",
        "ambush:release":
          "段厉签下停止截路的回执，弃刀离去。此番恩怨收束，不会在筑基篇无故变强再来。",
      } as Record<string, string>
    )[a]!;
  }
  s.qiJourney.last = n.last;
  s.log.unshift({ month: s.month, kind: "major", text: n.last });
  s.log = s.log.slice(0, 180);
  s.seen = [...input.seen, id].slice(-512);
  return s;
}
/** Command-only support for existing full-journey regression harnesses. */
export function qiNarrativeNext(s: State): QiNarrativeAction | null {
  const n = s.qiJourney.narrative;
  if (
    !n ||
    s.qiJourney.gates !== 1 ||
    (!qiNarrativeActive(s) && !preparationReady(s))
  )
    return null;
  if (n.duel) {
    const e = qiNarrativeEnemy(s);
    return `narrative:${e.pattern[n.duel.turn % e.pattern.length]}`;
  }
  if (n.location === "home")
    return n.phase === "applied" || s.injury >= 3 || s.herbs < 2
      ? null
      : "cave:depart";
  if (
    n.location === "cave" &&
    ((n.phase === "processed" && s.herbs < 2) ||
      (n.phase === "prepared" && s.injury >= 3))
  )
    return "cave:return";
  if (n.company === "none") return "cave:together";
  if (!n.method)
    return s.sense >= 8 && s.study >= 2
      ? "cave:prepare:array"
      : "cave:prepare:body";
  if (!n.retreatMarked) return "cave:mark";
  if (n.phase === "prepared") return "cave:challenge";
  if (n.phase === "won") return "cave:process:separate";
  if (n.phase === "processed") return "cave:apply";
  if (n.notes === "undecided") return "cave:notes:share";
  return "cave:return";
}
