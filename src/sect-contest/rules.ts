import { awardContestMilestones } from "../golden-core/rules";
import type { State, Command } from "../world";
import type { Move } from "../expedition/content";
import { tacticalExchange } from "../expedition/combat";
import { foundationPower } from "../foundation-journey/combat";
import { contestFoes, contestRank, NOTICE_MONTHS } from "./content";
export type ContestAction =
  | { kind: "prepare" | "defer" | "enter" | "fight" | "withdraw" | "leave" }
  | { kind: "move"; move: Move }
  | { kind: "reward"; reward: "herbs" | "medicine" };
const crisis = (s: State) =>
  s.foundationJourney.heroine.expedition && s.foundationJourney.rescue < 4;
function occupied(s: State) {
  return (
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.foundationJourney.duel ||
    s.expedition.duel ||
    s.qiJourney.node ||
    (s.treasures.auction?.entered && !s.treasures.auction.closed)
  );
}
function record(s: State, text: string) {
  s.sectContest.last = text;
  s.log.unshift({ month: s.month, kind: "major", text });
  s.log = s.log.slice(0, 180);
}
export const contestDate = (month: number) =>
  `修行 ${Math.floor(month / 12)} 年 ${month % 12} 月`;
export function updateContestCalendar(s: State) {
  const t = s.sectContest;
  if(s.realm === 2) return;
  if (s.status !== "alive") {
    t.duel = null;
    return;
  }
  if (
    ["invited", "preparing"].includes(t.stage) &&
    !t.reminded &&
    s.month >= t.starts
  ) {
    t.reminded = true;
    t.stage = "invited";
    record(
      s,
      "山门传来许砚舟的口信：“十年前说的内比开场了。若有意，回山见；手头有要紧事也不必勉强。”会期一年，尚未替你报名。",
    );
  }
}
export function discoverContest(s: State, c: Command) {
  const t = s.sectContest;
  if (
    occupied(s) ||
    crisis(s) ||
    s.realm !== 1 ||
    s.journey.branch === "none" ||
    s.foundationJourney.cultivation < 200 ||
    s.foundationJourney.location !== "home" ||
    t.duel
  )
    return;
  const encounter =
    c.type === "mentor" ||
    c.type === "duty" ||
    c.type === "recognition" ||
    (c.type === "foundationJourney" &&
      c.action.kind === "travel" &&
      c.action.destination === "home");
  if (
    !encounter ||
    !(
      t.stage === "unheard" ||
      (["deferred", "finished", "invited", "preparing"].includes(t.stage) &&
        s.month >= t.starts + 12 &&
        t.claimed >= t.best)
    )
  )
    return;
  t.stage = "invited";
  t.source = c.type === "foundationJourney" ? "return" : "mentor";
  t.announced = s.month;
  t.starts = s.month + NOTICE_MONTHS.foundation;
  t.reminded = false;
  t.edition++;
  t.results = [];
  record(
    s,
    `${t.source === "return" ? "回山交接行囊时，许砚舟向你提起" : "师门交接后，许砚舟与你同路，说起"}十年后的宗门内比：“我想试试带队之前，自己能守住多少招。你若有意，也留些时间备战。”定在${contestDate(t.starts)}，会期一年；两胜授凝露芝心，夺魁可另选凝丹培养；不参赛也可在后期赴凝露药圃取主药。`,
  );
}
export function contestError(s: State, a: ContestAction): string {
  const t = s.sectContest;
  if (occupied(s)) return "先处理眼前事件或结束其他交锋";
  if (crisis(s) && a.kind !== "defer") return "古道接应尚未结束，先照应同行者";
  if (s.realm !== 1 || s.journey.branch === "none" || t.stage === "unheard")
    return "尚未听到师门内比的消息";
  if (t.duel)
    return a.kind === "withdraw" ||
      (a.kind === "move" && ["guard", "strike", "discern"].includes(a.move))
      ? ""
      : "先结束本场斗法";
  if (a.kind === "move" || a.kind === "withdraw") return "尚未开始斗法";
  if (a.kind === "prepare" || a.kind === "defer")
    return ["invited", "preparing"].includes(t.stage)
      ? a.kind === "prepare" && s.month >= t.starts
        ? "内比已经开场，回山赴会或暂不参加"
        : ""
      : "当前没有待答复的邀约";
  if (a.kind === "enter")
    return !["invited", "preparing"].includes(t.stage)
      ? "本届未待赴会"
      : s.month < t.starts
        ? `尚有 ${t.starts - s.month} 月，可修行、探险或整备`
        : s.month >= t.starts + 12
          ? "本届会期已过，之后同门相逢可知下一届消息"
          : s.foundationJourney.location !== "home"
            ? "先回听松行前居赴会"
            : "";
  if (a.kind === "fight")
    return t.stage !== "entered"
      ? "先赴会"
      : s.foundationJourney.location !== "home"
        ? "先回山赴会"
        : s.injury > 2
          ? "先静养，伤势须不超过 2"
          : s.stones < 2
            ? "需灵石 2 整备，可劳作筹资"
            : "";
  if (a.kind === "leave")
    return t.stage === "finished" && t.claimed < t.best
      ? "先选取本次新成绩奖励，再与同门道别"
      : ["entered", "finished"].includes(t.stage)
        ? ""
        : "当前不在会场";
  if (a.kind === "reward")
    return t.stage !== "finished" || t.claimed >= t.best
      ? "没有尚未领取的新成绩奖励"
      : !["herbs", "medicine"].includes(a.reward)
        ? "未知奖励"
        : "";
  return "未知内比操作";
}
export function contestExchange(s: State, move: Move) {
  const t = s.sectContest;
  if (!t.duel) return null;
  return tacticalExchange(
    s,
    move,
    contestFoes[t.results.length]!,
    t.duel,
    t.duel.effect,
    false,
    foundationPower(s),
  );
}
export function runContest(
  input: State,
  a: ContestAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (contestError(input, a)) return input;
  let s = structuredClone(input);
  if (a.kind === "fight") {
    s = tick(s);
    if (occupied(s)) {
      record(s, "赴台途中行程中断，未扣整备费，也未开始斗法。");
      return finish();
    }
  }
  const t = s.sectContest;
  if (a.kind === "prepare") {
    t.stage = "preparing";
    record(
      s,
      `你与许砚舟约好届时再见。距${contestDate(t.starts)}还有 ${t.starts - s.month} 月，可继续修行与远行。`,
    );
  }
  if (a.kind === "defer") {
    t.stage = "deferred";
    record(
      s,
      "你暂不赴这届内比。许砚舟应下：“各有各的路，等你回山再说。”不影响修行与主线。",
    );
  }
  if (a.kind === "enter") {
    t.stage = "entered";
    record(
      s,
      "你来到松间石台。三场斗法皆点到为止，胜负逐场记名；场间可以离台整备，所有赛果结算后再领表现奖。",
    );
  }
  if (a.kind === "fight") {
    s.stones -= 2;
    t.duel = {
      hp: foundationPower(s).hp,
      enemy: contestFoes[t.results.length]!.hp,
      turn: 0,
      effect: "",
    };
    record(
      s,
      `${contestFoes[t.results.length]!.name}行礼入场。整备花费灵石 2、一月；认输不受伤，败北伤势 +1。`,
    );
  }
  if (a.kind === "move") {
    const p = contestExchange(s, a.move)!,
      d = t.duel!;
    s.herbs -= p.herbs;
    d.enemy = Math.max(0, d.enemy - p.damage);
    d.hp = Math.max(0, d.hp - p.incoming + p.healing);
    d.turn++;
    d.effect = a.move;
    record(
      s,
      `你化去对方 ${p.damage} 气势，承受 ${p.incoming}${p.healing ? `，耗灵草 ${p.herbs} 回气 ${p.healing}` : ""}。${p.note}`,
    );
    if (!d.enemy) end("win", false);
    else if (!d.hp || d.turn >= 12) end("loss", true);
  }
  if (a.kind === "withdraw") end("loss", false);
  if (a.kind === "leave") {
    if (t.stage === "entered") {
      while (t.results.length < 3) t.results.push("loss");
      t.stage = "finished";
      t.best = Math.max(t.best, t.results.filter((x) => x === "win").length);
      record(
        s,
        "你交还赛签，余场记为弃权。已胜场次保留，仍可领取尚未领过的成绩奖励。",
      );
    } else {
      t.stage = "deferred";
      t.results = [];
      record(s, "你离开松间石台。赛果与已取得的奖励留在履历中。");
    }
  }
  if (a.kind === "reward") {
    const extra = awardContestMilestones(s,t.claimed);
    const count = t.best - t.claimed;
    t.claimed = t.best;
    if (a.reward === "herbs") s.herbs += count * 4;
    else s.growth.medicines.healing += count;
    record(
      s,
      `新成绩奖励已入囊：${a.reward === "herbs" ? `灵草 ${count * 4}` : `回春散 ${count}`}。${extra}。相同或更低成绩不重复发放。`,
    );
  }
  return finish();
  function end(result: "win" | "loss", hurt: boolean) {
    const t = s.sectContest,
      foe = contestFoes[t.results.length]!;
    t.results.push(result);
    t.duel = null;
    if (hurt) s.injury = Math.min(6, s.injury + 1);
    record(
      s,
      `${foe.name}一场${result === "win" ? "由你取胜" : "你暂居下风"}。${hurt ? "伤势 +1，可在场间免费静养。" : ""}${foe.after}`,
    );
    if (t.results.length === 3) {
      t.stage = "finished";
      const wins = t.results.filter((x) => x === "win").length;
      t.best = Math.max(t.best, wins);
      record(
        s,
        `${t.last} 三场已毕，${wins} 胜：${contestRank(wins)}。${wins ? "师门按新达到的成绩备下药材或回春散，可任选一种。" : "执事记下你的参赛经历；三位同门的招法已亲自试过，下届可再来。"}`,
      );
    }
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
