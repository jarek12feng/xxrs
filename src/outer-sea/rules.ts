import { methodQuote } from "../techniques";
import { inspectInteraction } from "../story-interactions";
import { settleResources } from "../economy";
import { advanceMonths } from "../timeline";
import { dueDeadlines } from "../timeline";
import { seaSchedule } from "./calendar";
import { resolveTurn, startBattle } from "../combat";
import {
  passageKey,
  passageError,
  passageMonths,
  advancePassage,
} from "../wayfaring/passage";
import { goldenCap, goldenBlock } from "../conclave/state";
import { conclaveGoal } from "../conclave/rules";
import type { State } from "../world";
import type { Move } from "../expedition/content";
import { tacticalPreview } from "../combat/game";
import { foundationPower } from "../foundation-journey/combat";
export type SeaAction =
  | {
      kind:
        | "sail"
        | "meet"
        | "prepare"
        | "enter"
        | "fight"
        | "withdraw"
        | "return"
        | "home"
        | "attune"
        | "report";
    }
  | { kind: "pact"; pact: "share" | "private" }
  | { kind: "reward"; reward: "seal" | "manual" }
  | { kind: "method"; method: "continue" | "clear" }
  | { kind: "move"; move: Move };
export const seaFoe = (depth: number) =>
  depth === 1
    ? {
        name: "镇潮石卫",
        realm: 2 as const,
        stage: 0,
        hp: 185,
        attack: 33,
        pattern: ["discern", "guard", "strike"] as const,
      }
    : {
        name: "内府守枢石卫",
        realm: 2 as const,
        stage: 0,
        hp: 285,
        attack: 42,
        pattern: ["guard", "strike", "discern"] as const,
      };
export const seaTells = [
  "阵眼明灭，先辨清灵流。",
  "石臂挟潮横扫，先守住来势。",
  "石卫回身归位，趁隙反击。",
];
const occupied = (s: State) =>
  s.status !== "alive" ||
  s.pending ||
  s.social.scene ||
  s.social.arena.duel ||
  s.foundationJourney.duel ||
  s.expedition.duel ||
  s.sectContest.duel ||
  s.qiJourney.node ||
  s.goldenCore.expedition !== "idle" ||
  (s.treasures.auction?.entered && !s.treasures.auction.closed);
export function seaQuote(s: State, a: SeaAction) {
  const o = s.outerSea;
  let months = 0,
    stones = 0,
    herbs = 0,
    error = "";
  if (occupied(s)) error = "先处理眼前事件或结束其他交锋";
  else if (s.realm !== 2 || !s.goldenCore.farShore)
    error = "先凝成金丹，越过云壁取得远行视野";
  if (o.duel)
    return {
      months,
      stones,
      herbs,
      error:
        error ||
        (a.kind === "withdraw" ||
        (a.kind === "move" && ["guard", "strike", "discern"].includes(a.move))
          ? ""
          : "先结束石卫交锋或撤出遗迹"),
    };
  if (a.kind === "sail") {
    months = 6;
    stones = o.met ? 0 : 12;
    if (o.location !== "home") error ||= "已经抵达外海";
  } else if (a.kind === "meet") {
    if (o.location !== "ferry" || o.met) error ||= "先到外海古渡相识";
  } else if (a.kind === "pact") {
    if (
      !o.met ||
      o.location !== "ferry" ||
      o.pact !== "none" ||
      !["share", "private"].includes(a.pact)
    )
      error ||= "先在古渡商议观潮记录的归属";
  } else if (a.kind === "prepare") {
    months = 1;
    stones = o.pact === "share" ? 6 : 10;
    herbs = 2;
    if (
      o.location !== "ferry" ||
      o.pact === "none" ||
      o.prepared ||
      o.cleared === 2
    )
      error ||= "先在古渡商定分取之约，或行装已经备妥";
  } else if (a.kind === "enter") {
    months = 2;
    if (o.location !== "ferry" || !o.prepared || o.cleared === 2)
      error ||= "先准备遗迹行装";
    if (
      o.cleared === 1 &&
      (o.reward === "none" ||
        o.cultivation < 60 ||
        (!o.attuned && o.method === "none"))
    )
      error ||= "内府潮压更强：先分取机缘、修行至 60，并温养镇潮印或参悟澄息篇";
  } else if (a.kind === "fight") {
    if (o.location !== "ruins" || !o.prepared || o.cleared === 2)
      error ||= "先进入退潮遗迹";
    if (s.injury > 1) error ||= "先撤回静养至伤势不超过 1";
  } else if (a.kind === "withdraw" || a.kind === "return") {
    months = 1;
    if (o.location !== "ruins") error ||= "当前不在遗迹";
  } else if (a.kind === "home") {
    months = 6;
    if (o.location !== "ferry") error ||= "先回到古渡";
  } else if (a.kind === "reward") {
    if (
      o.location !== "ferry" ||
      o.cleared < 1 ||
      o.reward !== "none" ||
      !["seal", "manual"].includes(a.reward)
    )
      error ||= "先通过外府，回古渡按约分取机缘";
  } else if (a.kind === "attune") {
    months = 6;
    stones = 8;
    if (!o.seal || o.attuned || o.location === "ruins")
      error ||= "需已取得镇潮印，且在安全处首次温养";
  } else if (a.kind === "method") {
    const method = methodQuote("sea", o.method, a.method, o.manual, o.location !== "ruins");
    months = method.months;
    error ||= method.error;
  } else if (a.kind === "report") {
    if (o.location !== "ferry" || o.reward === "none")
      error ||= "先取回机缘，在古渡与两位道友交接";
    else if (o.notice !== null) error ||= "约定与五十年会期已记入行囊";
  } else error ||= "未知外海操作";
  const passage = passageKey("sea", a.kind);
  error ||= passageError(s, passage);
  months = passageMonths(s, passage, months);
  if (!error && (s.stones < stones || s.herbs < herbs))
    error = `需灵石 ${stones}、灵草 ${herbs}；可回山劳作或筹备`;
  if (!error && s.limit - s.age <= months) error = "余寿不足以完成此行";
  return { months, stones, herbs, error };
}
export function seaExchange(s: State, move: Move) {
  const d = s.outerSea.duel;
  return d
    ? tacticalPreview(s, {
        move: move,
        encounter: seaFoe(d.depth),
        battle: d,
        effect: d.effect,
        arrayCore: true,
        power: foundationPower(s),
        adjustments: [
          { phase: "power", hp: s.outerSea.pact === "share" ? 12 : 0 },
        ],
      })
    : null;
}
export function seaGoal(s: State) {
  const o = s.outerSea;
  if (s.conclave.location !== "away") return conclaveGoal(s);
  if (o.duel) return "看清石卫来势再出手；也可撤回古渡，已通进度保留。";
  if (o.location === "ruins")
    return "应对眼前石卫，取得封存机缘；退路仍然畅通。";
  return !s.goldenCore.farShore
    ? "先以丹元护体越过云壁，再循海路远行。"
    : !o.met
      ? o.location === "ferry"
        ? "与古渡修士交谈，听清两宗所求。"
        : "前往外海古渡，探听退潮遗迹与新的修行机缘。"
      : o.pact === "none"
        ? "与顾沧遥、叶问苓商议观潮记录的分取。"
        : !o.cleared
          ? "备好行装，入退潮遗迹破开外府。"
          : o.reward === "none"
            ? "回古渡分取镇潮印或澄息篇，先用上所得。"
            : o.cleared < 2
              ? `${!o.attuned && o.method === "none" ? "先温养法宝或参悟功法，" : ""}${o.cultivation < 60 ? "修至 60 后再探内府。" : "已能承受内府潮压，可整备后重返遗迹。"}${o.notice === null ? "回古渡交接，还可听闻诸宗会期。" : ""}`
              : s.conclave.stage
                ? conclaveGoal(s)
                : goldenBlock(s);
}
export function updateSeaCalendar(s: State) {
  const o = s.outerSea;
  if (s.status !== "alive") {
    o.duel = null;
    return;
  }
  if (dueDeadlines(s.month, seaSchedule(s)).length > 0) {
    o.reminded = true;
    o.last =
      "五十年前约定的诸宗会期已至。顾沧遥来信邀你从古渡赴会；两场胜绩便能争取归潮秘境资格。若暂时无暇，各宗会留下轮值补试，旧胜绩仍认。";
    s.log.unshift({ month: s.month, kind: "major", text: o.last });
    s.log = s.log.slice(0, 180);
  }
}
export function runSea(
  input: State,
  a: SeaAction,
  id: string,
  tick: (s: State) => State,
) {
  const offer = inspectInteraction(input, a, seaQuote);
  if (!offer.available) return input;
  const quote = offer.quote;
  let s = structuredClone(input);
  const passage = passageKey("sea", a.kind);
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
    const elapsed = advanceMonths(s, quote.months, { tick, interrupt: s => (occupied(s) || (s.outerSea.reminded && !input.outerSea.reminded)) ? "interrupted" : "" });
    s = elapsed.state;
    if (elapsed.stopped) {
        record("行程暂止，尚未扣除物资或结算成果。");
        return finish();

    }
  }
  if (settleResources(s, { stones: quote.stones, herbs: quote.herbs }).error) return input;
  const o = s.outerSea;
  if (a.kind === "sail") {
    o.location = "ferry";
    record(
      o.met
        ? "你循熟悉的航道重回古渡。顾沧遥仍在查验潮堤，叶问苓把旧记录摊在檐下。"
        : "金丹护体撑过长潮，你在古渡落脚。深青衣袍的修士正校准潮堤铜铃；另一位阵修伏案辨认残缺的观潮图。",
    );
  }
  if (a.kind === "meet") {
    o.met = true;
    record(
      "澄渊宗顾沧遥想修复潮堤，让药船能在涨潮时通行；衡璇院叶问苓要找回内府观潮记录，校正宗门阵图。她指向远岸：“记录给我校勘，法宝与功法由你先选。也可以各走各路，彼此不动对方的收获。”",
    );
  }
  if (a.kind === "pact") {
    o.pact = a.pact;
    record(
      a.pact === "share"
        ? "你答应公开观潮记录供两宗修堤。顾沧遥提供潮路接应，行装较省，交锋初始气势 +12；叶问苓留在外阵测算退潮。"
        : "你约定独自探路，保留自己勘出的支路，仍交还原有观潮记录。两人尊重界线；行装自筹，外府首通另得灵石 24。",
    );
  }
  if (a.kind === "prepare") {
    o.prepared = true;
    record(
      "避潮符与护脉药已备。未打通石卫前撤回，行装保留；胜后此份行装用尽，下次探索需重新筹备。",
    );
  }
  if (a.kind === "enter") {
    o.location = "ruins";
    record(
      o.cleared
        ? "你再次踏上退潮石道，已知的外府不必重打。内府守枢石卫在断桥后起身，先守横扫、趁回身反击，再辨阵眼。"
        : "退潮露出石道，金丹神识照见水下暗流。镇潮石卫拦在外府前：辨阵眼、守横扫、趁归位反击。",
    );
  }
  if (a.kind === "fight") {
    const depth = (o.cleared + 1) as 1 | 2;
    o.duel = {
      depth,
      ...startBattle(
        foundationPower(s).hp + (o.pact === "share" ? 12 : 0),
        seaFoe(depth).hp,
      ),
      effect: "",
    };
    record(
      `${seaFoe(depth).name} · 金丹前期。最多十六合；败退伤势 +2，主动撤回不加伤。`,
    );
  }
  if (a.kind === "move") {
    const p = seaExchange(s, a.move)!,
      d = o.duel!;
    const turn = resolveTurn(d, p, {
      turnLimit: 16,
      resolution: "simultaneous",
    });
    Object.assign(d, turn.battle);
    s.herbs -= turn.herbs;
    d.effect = a.move;
    record(
      `削去气势 ${p.damage}，承受 ${p.incoming}${p.healing ? `，耗灵草 ${p.herbs} 回气 ${p.healing}` : ""}。${p.note}`,
    );
    if (turn.outcome === "win") {
      o.cleared = d.depth;
      o.duel = null;
      o.prepared = false;
      o.location = "ferry";
      o.cultivation = Math.min(
        goldenCap(s),
        o.cultivation + (o.cleared === 1 ? 30 : 45),
      );
      if (o.cleared === 1) {
        if (o.pact === "private") s.stones += 24;
        record(
          "外府石卫归位，你取回封存的镇潮印与澄息篇，退回古渡。修行 +30；按约先选一件参悟，另一件仍须内府记录校验封印。" +
            (o.pact === "private" ? "你独自勘出的支路另得灵石 24。" : ""),
        );
      } else {
        o.seal = true;
        o.manual = true;
        record(
          "内府观潮记录已取回，第二件机缘的封印也已解开。修行 +45；镇潮印与澄息篇均归你参悟。" +
            (o.pact === "share"
              ? "顾沧遥依公开潮图修好旧堤，叶问苓将你的勘路记入两宗往来册。"
              : "叶问苓收回原卷，顾沧遥按约只使用旧图；你勘出的支路仍由你自己掌握。"),
        );
      }
    } else if (turn.outcome === "loss") {
      o.duel = null;
      o.location = "ferry";
      s.injury = Math.min(6, s.injury + 2);
      record(
        "你退回古渡，伤势 +2。已通的外府、分取约定与行装保留，静养后可再来。",
      );
    }
  }
  if (a.kind === "withdraw" || a.kind === "return") {
    o.duel = null;
    o.location = "ferry";
    record("你沿退潮石道撤回古渡，不新增伤势；已探明的进度与行装保留。");
  }
  if (a.kind === "home") {
    o.location = "home";
    record(
      "你沿熟路回山，外海人物与遗迹进度留在行囊中。旧友仍有自己的去处，这次归来不重置往事。",
    );
  }
  if (a.kind === "reward") {
    o.reward = a.reward;
    o.seal = a.reward === "seal";
    o.manual = a.reward === "manual";
    record(
      a.reward === "seal"
        ? "你先取镇潮印。温养后伤害 +4、护体 +3；澄息篇暂由叶问苓保管，内府记录能解开余封。"
        : "你先取澄息篇。可用它补全原主修的运功，或改用澄息守势；镇潮印暂由顾沧遥封存，内府记录能解开余封。",
    );
  }
  if (a.kind === "attune") {
    o.attuned = true;
    record(
      "半年温养，镇潮印随丹元收放。此后交锋伤害 +4、护体 +3，不替换原有灵器。",
    );
  }
  if (a.kind === "method") {
    o.method = a.method;
    record(
      a.method === "continue"
        ? "你用澄息篇补全原主修的金丹运转：伤害 +3，保留原招式；吐纳效率提高。"
        : "你改以澄息法运转丹元：护体 +4，原主修招式暂不触发；旧功法与研修仍保留，可在安全处花三个月改回。吐纳效率提高。",
    );
  }
  if (a.kind === "report") {
    o.notice = s.month;
    record(
      "交接观潮图时，顾沧遥提起五十年后的诸宗会：“照霜门也会来。争到名次，可求取法门与凝婴药材的机缘；各宗到时才定分配。”叶问苓约你届时带新见闻再叙。会期已记下，不替你报名。两场胜绩可争取入境资格，归潮秘境藏有凝婴宝物；这五十年可先凝炼丹元、温养法宝。",
    );
  }
  return finish();
  function record(text: string) {
    s.outerSea.last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
