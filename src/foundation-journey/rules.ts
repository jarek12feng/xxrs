import type { State } from "../world";
import { challenges, rankIds, sideChoices } from "./content";
import {
  foundationPower,
  foundationExchange,
  completeChallenge,
} from "./combat";
import { journeyActionError } from "./progression";
import { advancePlot } from "./plot";
import type { JourneyAction } from "./state";
export function runFoundationJourney(
  input: State,
  action: JourneyAction,
  id: string,
  tick: (s: State) => State,
) {
  if (!action || journeyActionError(input, action)) return input;
  let s = structuredClone(input);
  if (action.kind === "battle" || action.kind === "travel") {
    s = tick(s);
    if (s.status !== "alive" || s.pending) {
      s.foundationJourney.last =
        "行前准备耗去一月，眼前事件打断了出发。尚未扣挑战补给，原进度保留；先处理事件。";
      return accept(input, s, id);
    }
  }
  const q = s.foundationJourney;
  if (action.kind === "battle") {
    const e = challenges[action.battle];
    s.stones -= e.cost;
    q.duel = {
      id: action.battle,
      hp: foundationPower(s).hp,
      enemy: e.hp,
      turn: 0,
      effect: "none",
      aid: q.aid,
    };
    q.aid = false;
    q.last = `${e.purpose} 行前一月、灵石 −${e.cost}。最多交锋 12 合，失败新增伤势 2；主动撤退不新增伤势，已用时间与补给不退。`;
  } else if (action.kind === "withdraw") {
    const ranked = rankIds.includes(q.duel!.id);
    q.duel = null;
    q.last =
      "你按原定退路撤回，没有新增伤势；已用补给不退，传承、线索与已完成的小关保留。";
    if (ranked) q.board.last = q.last + "既有名次与首胜奖励保留。";
  } else if (action.kind === "move") {
    const d = q.duel!,
      p = foundationExchange(s, action.move);
    if (!p) return input;
    d.turn++;
    d.enemy = Math.max(0, d.enemy - p.damage);
    s.herbs -= p.herbs;
    q.last = `第 ${d.turn} 合：伤敌 ${p.damage}，承伤 ${p.incoming}${p.healing ? `，耗草 ${p.herbs} 回复 ${p.healing}` : ""}。${p.note}`;
    d.effect = action.move;
    if (d.enemy === 0) completeChallenge(s);
    else {
      d.hp = Math.max(0, d.hp - p.incoming) + p.healing;
      if (d.hp === 0 || d.turn >= 12) {
        if (rankIds.includes(d.id)) q.board.losses++;
        s.injury = Math.min(6, s.injury + 2);
        q.duel = null;
        q.last +=
          "本场败退，伤势 +2；免费静养、调整功法灵器后可再来。线索、已得传承与既有排名保留，不判人物死亡。";
        if (rankIds.includes(d.id)) q.board.last = q.last;
      }
    }
  } else advancePlot(s, action);
  return accept(input, s, id);
}
function accept(input: State, s: State, id: string) {
  s.seen = [...input.seen, id].slice(-512);
  s.log.unshift({
    month: s.month,
    kind: "story",
    text: s.foundationJourney.last,
  });
  s.log = s.log.slice(0, 180);
  return s;
}
export function validFoundationJourney(s: State) {
  const q = s.foundationJourney,
    integer = (v: unknown, max = 1e9) =>
      Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !q ||
    !integer(q.cultivation, 600) ||
    !["home", "ferry", "estate", "snow", "inn", "frontier"].includes(
      q.location,
    ) ||
    !integer(q.ferry, 4) ||
    !["none", "spring", "blade", "breath"].includes(q.inheritance) ||
    !["none", "promised", "reunited"].includes(q.sister) ||
    typeof q.consent !== "boolean" ||
    !["none", "open", "escort", "break"].includes(q.ferryOutcome) ||
    !["none", "promised", "covenant"].includes(q.bond) ||
    !["none", "letters", "station"].includes(q.contact) ||
    !["home", "away", "returned", "missing", "shelter", "rescued"].includes(
      q.whereabouts,
    ) ||
    typeof q.reunion !== "boolean" ||
    !integer(q.rescue, 4) ||
    !["none", "party", "companion"].includes(q.target) ||
    typeof q.oldFriend !== "boolean" ||
    typeof q.aid !== "boolean" ||
    typeof q.condensation !== "boolean" ||
    typeof q.last !== "string" ||
    q.last.length > 3000
  )
    return false;
  if (q.departedAt !== null && !integer(q.departedAt, s.month)) return false;
  if (
    !Array.isArray(q.evidence) ||
    q.evidence.length > 3 ||
    new Set(q.evidence).size !== q.evidence.length ||
    !q.evidence.every((e) => ["paper", "registry", "control"].includes(e))
  )
    return false;
  if (
    !Array.isArray(q.won) ||
    new Set(q.won).size !== q.won.length ||
    q.won.length > 11 ||
    !q.won.every((id) => Object.hasOwn(challenges, id))
  )
    return false;
  if (
    !q.board ||
    typeof q.board.last !== "string" ||
    q.board.last.length > 3000 ||
    !integer(q.board.losses) ||
    !Array.isArray(q.board.wins) ||
    q.board.wins.length > 5 ||
    !q.board.wins.every((id, i) => id === rankIds[i] && q.won.includes(id)) ||
    !q.board.best ||
    Array.isArray(q.board.best) ||
    typeof q.board.best !== "object" ||
    !Object.entries(q.board.best).every(
      ([id, n]) =>
        q.board.wins.includes(id as never) && integer(n, 12) && Number(n) > 0,
    ) ||
    q.board.wins.some((id) => !q.board.best[id])
  )
    return false;
  if (
    !q.sides ||
    !(["estate", "snow", "inn"] as const).every((k) => {
      const v = q.sides[k];
      return (
        v &&
        integer(v.step, 3) &&
        typeof v.outcome === "string" &&
        (v.step === 3
          ? Object.hasOwn(sideChoices[k], v.outcome)
          : v.outcome === "") &&
        (k === "inn" || v.step < 2 || q.won.includes(k))
      );
    })
  )
    return false;
  if (
    (q.ferry >= 2 && !q.won.includes("well")) ||
    (q.ferry >= 3 && !q.won.includes("exit")) ||
    (q.ferry === 4 && q.ferryOutcome === "none") ||
    (q.ferry < 4 && q.ferryOutcome !== "none")
  )
    return false;
  if (
    q.inheritance !== "none" &&
    (q.ferry < 2 || !s.journey.known.includes(q.inheritance))
  )
    return false;
  if (
    (q.sister === "reunited" && q.ferry < 2) ||
    (q.consent && q.sister !== "reunited") ||
    (q.ferryOutcome === "open" && (!q.consent || q.evidence.length !== 3))
  )
    return false;
  if (
    q.bond !== "none" &&
    (!s.social.bonded ||
      q.contact === "none" ||
      s.companionship.stage !== "done")
  )
    return false;
  if (
    q.contact !== "none" &&
    (!s.social.met || s.age < 216 || s.companionship.stage !== "done")
  )
    return false;
  if (q.whereabouts !== "home" && q.departedAt === null) return false;
  if (
    (q.reunion && q.departedAt === null) ||
    (q.whereabouts === "away" && q.reunion)
  )
    return false;
  if (q.target === "none" ? q.rescue !== 0 : q.rescue === 0 || q.ferry < 4)
    return false;
  if (q.target === "companion" && (q.bond !== "covenant" || !q.reunion))
    return false;
  if (
    (q.rescue >= 3 && !q.won.includes("frontier")) ||
    (q.rescue === 4 && !q.won.includes("rescue")) ||
    (q.condensation && (q.rescue !== 4 || q.cultivation !== 600))
  )
    return false;
  if (
    s.realm === 0 &&
    (q.cultivation !== 0 ||
      q.ferry !== 0 ||
      q.location !== "home" ||
      q.won.length ||
      q.rescue ||
      q.contact !== "none")
  )
    return false;
  if (q.won.filter((id) => rankIds.includes(id)).length !== q.board.wins.length)
    return false;
  if (
    q.won.includes("well") !== q.ferry >= 2 ||
    q.won.includes("exit") !== q.ferry >= 3
  )
    return false;
  if (q.ferry >= 3 && q.inheritance === "none") return false;
  if (q.evidence.includes("control") && q.ferry < 2) return false;
  if (
    (q.won.includes("frontier") && q.rescue < 2) ||
    (q.won.includes("rescue") && q.rescue !== 4)
  )
    return false;
  if (
    q.aid &&
    (!s.social.met ||
      s.companionship.stage !== "done" ||
      ["away", "missing", "shelter"].includes(q.whereabouts))
  )
    return false;
  if (q.whereabouts === "returned" && !q.reunion) return false;
  if (
    ["missing", "shelter", "rescued"].includes(q.whereabouts) &&
    q.target !== "companion"
  )
    return false;
  if (
    q.target === "companion" &&
    q.whereabouts !==
      (q.rescue === 1 ? "missing" : q.rescue === 4 ? "rescued" : "shelter")
  )
    return false;
  if (q.duel) {
    const d = q.duel,
      e = challenges[d.id];
    if (
      !Object.hasOwn(challenges, d.id) ||
      s.status !== "alive" ||
      s.pending ||
      s.social.scene ||
      s.social.arena.duel ||
      s.expedition.duel ||
      q.won.includes(d.id) ||
      !integer(d.hp, 1000) ||
      d.hp === 0 ||
      !integer(d.enemy, e.hp) ||
      d.enemy === 0 ||
      !integer(d.turn, 11) ||
      !["none", "guard", "strike", "discern"].includes(d.effect) ||
      typeof d.aid !== "boolean"
    )
      return false;
  } else if (q.duel !== null) return false;
  return true;
}
