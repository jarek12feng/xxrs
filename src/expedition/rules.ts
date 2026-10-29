import type { State } from "../world";
import { expeditionIntermission } from "./progression";
import { encounters, type Move } from "./content";
import { readiness, exchangePreview } from "./combat";
export { readiness } from "./combat";
export interface Expedition {
  accepted: boolean;
  cleared: number;
  attempts: number;
  duel: { hp: number; enemy: number; turn: number } | null;
  last: string;
  effect: "none" | "guard" | "strike" | "discern" | "hurt" | "win" | "loss";
}
export type ExpeditionAction =
  "accept" | "enter" | "withdraw" | "studyArray" | "healArray" | Move;
export const freshExpedition = (): Expedition => ({
  accepted: false,
  cleared: 0,
  attempts: 0,
  duel: null,
  last: "",
  effect: "none",
});
export function expeditionError(s: State, a: ExpeditionAction): string {
  const q = s.expedition;
  if (
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel
  )
    return "先处理眼前事件";
  if (
    s.adventure.step !== "done" ||
    !s.adventure.road.map ||
    !["pass", "camp"].includes(s.adventure.road.stage)
  )
    return "补齐航图后，在青嶂关或行营接取";
  if (a === "accept")
    return q.accepted
      ? "已接取委托"
      : s.adventure.road.passed
        ? "本世已过关，下世可接新委托"
        : "";
  if (!q.accepted || q.cleared === 3) return "当前没有待完成的关卡";
  if (q.duel)
    return ["guard", "strike", "discern", "withdraw"].includes(a)
      ? ""
      : "先结束当前交锋";
  if (["guard", "strike", "discern", "withdraw"].includes(a))
    return "尚未开始交锋";
  if (s.injury >= 3) return "伤势过重，先静养至 2 以下";
  if (q.cleared === 1) {
    if (!["studyArray", "healArray"].includes(a)) return "选择辨阵或温养草根";
    if (a === "studyArray" && (s.sense < 6 || s.study < 2))
      return "需要神识 6、心得 2；可回洞府凝神、研读";
    if (a === "healArray" && s.herbs < 4)
      return "需要灵草 4；可采药或在坊市购买";
  } else {
    if (a !== "enter") return "此处需要交锋";
    if (q.cleared === 2 && s.realm < 1)
      return "守阵交锋需筑基；先回洞府修行、突破";
  }
  return s.stones < encounters[q.cleared]!.cost
    ? `需灵石 ${encounters[q.cleared]!.cost} 作为补给；劳作可筹措`
    : "";
}
export function expeditionBlocksPass(s: State) {
  return s.expedition?.accepted && s.expedition.cleared < 3
    ? "先完成护送、寻踪与守阵交锋，再决定山口的归路"
    : "";
}
// The caller supplies the existing monthly clock, so story hooks and death retain priority.
export function runExpedition(
  input: State,
  a: ExpeditionAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (expeditionError(input, a)) return input;
  let s = structuredClone(input);
  if (a === "accept") {
    s.expedition.accepted = true;
    s.expedition.last =
      "接下护送委托。先护住药车，再调查古阵；前两关炼气即可完成。阵核深处需筑基护体，届时药队撤回坊市、封阵休整，约定筑基后再会合。每次行前准备消耗一月与补给，小关进度永久保留。";
  } else if (a === "withdraw") {
    s.expedition.duel = null;
    s.expedition.effect = "loss";
    s.expedition.last =
      "主动撤回行营，没有新增伤势；已用的时间和补给不退，小关进度保留。";
  } else if (!s.expedition.duel) {
    s = tick(s);
    if (s.status !== "alive" || s.pending) {
      s.expedition.last =
        "你先撤回山下休整、筹备一月行装，收到陆迟的消息，暂缓出发。尚未扣除补给或开始挑战；处理约定后再回青嶂关会合。";
    } else {
      const q = s.expedition,
        e = encounters[q.cleared]!;
      s.stones -= e.cost;
      q.attempts++;
      q.effect = "none";
      if (q.cleared === 1) {
        if (a === "healArray") s.herbs -= 4;
        complete(s);
      } else {
        q.duel = { hp: readiness(s).hp, enemy: e.hp, turn: 0 };
        q.last = e.story;
      }
    }
  } else {
    const q = s.expedition,
      d = q.duel!;
    const { correct, damage, incoming, healing, herbs, note } = exchangePreview(
      s,
      a as Move,
    )!;
    d.enemy = Math.max(0, d.enemy - damage);
    d.turn++;
    s.herbs -= herbs;
    q.effect = q.cleared === 2 || correct ? (a as Move) : "hurt";
    q.last = `第 ${d.turn} 合：${correct ? "看破招式" : q.cleared === 2 ? "变招应对" : "未能化解来招"}，敌方气势 −${damage}。${note}`;
    if (d.enemy === 0) complete(s);
    else {
      d.hp = Math.max(0, d.hp - incoming) + healing;
      q.last += `自身气势 −${incoming}。`;
      if (healing) q.last += `消耗灵草 ${herbs}，恢复气势 ${healing}。`;
      if (!d.hp || d.turn >= 12) {
        q.duel = null;
        q.effect = "loss";
        s.injury = Math.min(6, s.injury + 1);
        q.last +=
          "撤退，伤势 +1。先静养；留意敌人蓄力提示，凝神、研读或固本都能增强下次应对。已过小关保留。";
      }
    }
  }
  s.seen = [...input.seen, id].slice(-512);
  return s;
}
function complete(s: State) {
  const q = s.expedition,
    e = encounters[q.cleared]!;
  s.stones += e.reward;
  s.herbs += 2;
  q.cleared++;
  q.duel = null;
  q.effect = "win";
  q.last = `${e.name}完成：灵石 +${e.reward}、灵草 +2；本关不可重复领奖。`;
  if (q.cleared === 1) {
    const relic = s.path === "sword" ? "sword" : "vial";
    if (!s.journey.relics[relic]) {
      s.journey.relics[relic] = 1;
      q.last += `药队赠你${relic === "sword" ? "听松灵剑" : "归元灵瓶"}，请在储物袋装配，下一场交锋便能生效。`;
    } else {
      s.stones += 12;
      q.last += "已有药队赠器，折为精炼资材：灵石 +12。";
    }
    s.growth.medicines.healing++;
    q.last +=
      "另获回春散一份，可在储物袋疗伤。药箱保住了，袭击者遗落的药签却印着旧阵的纹样。";
  }
  if (q.cleared === 2) q.last += e.story + expeditionIntermission(s);
  if (q.cleared === 3) {
    if (!s.journey.known.includes("guard")) {
      s.journey.known.push("guard");
      q.last += "获得护身诀（可在功法面板装配）。";
    } else {
      s.stones += 12;
      q.last += "已掌握护身诀，折为研修资材：灵石 +12。";
    }
    q.last +=
      "你们在阵核里找到完整转运册，可在下方对簿查看名单真相。青嶂让出旧阵：救草、开山还是修阵，这次由你决定。";
  }
}
export function validExpedition(s: State): boolean {
  const q = s.expedition;
  const int = (n: unknown, max: number) =>
    Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
  if (
    !q ||
    typeof q.accepted !== "boolean" ||
    !int(q.cleared, 3) ||
    !int(q.attempts, 1e9) ||
    typeof q.last !== "string" ||
    q.last.length > 3000 ||
    !["none", "guard", "strike", "discern", "hurt", "win", "loss"].includes(
      q.effect,
    )
  )
    return false;
  if (
    !q.accepted &&
    (q.cleared || q.attempts || q.duel || q.last || q.effect !== "none")
  )
    return false;
  if (
    q.accepted &&
    (!s.adventure.road.map ||
      s.adventure.step !== "done" ||
      q.attempts < q.cleared)
  )
    return false;
  if (q.accepted && s.adventure.road.passed && q.cleared < 3) return false;
  if (q.duel === null) return true;
  const d = q.duel;
  return (
    !!d &&
    q.accepted &&
    (q.cleared === 0 || q.cleared === 2) &&
    q.attempts > q.cleared &&
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene &&
    !s.social.arena.duel &&
    ["pass", "camp"].includes(s.adventure.road.stage) &&
    (q.cleared !== 2 || s.realm === 1) &&
    int(d.hp, 60) &&
    d.hp > 0 &&
    int(d.enemy, encounters[q.cleared]!.hp) &&
    d.enemy > 0 &&
    int(d.turn, 11)
  );
}
