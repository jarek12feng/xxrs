import { activityInterruption } from "./scene-activity";
import {
  actionError,
  preparationError,
  breakthroughDetails,
  refineCost,
  type State,
  type Activity,
} from "./core";
export type PauseTarget = "story" | "break" | "queue" | "cultivate";
export interface PauseReason {
  text: string;
  target: PauseTarget;
  label: string;
}
export function automaticPause(
  s: State,
  activity: Activity,
  queued: boolean,
  previous?: State,
): PauseReason | null {
  if (s.status !== "alive")
    return {
      text: "这段修行已经结束，可回看履历、读取存档或新建角色。",
      target: "story",
      label: "回看履历",
    };
  const interrupted = activityInterruption(s);
  if (interrupted)
    return {
      text: `自动修行已暂停：${interrupted}。`,
      target: s.social.arena.duel ? "cultivate" : "story",
      label: s.social.arena.duel ? "返回修行现场" : "返回当前现场",
    };
  if (!s.realm && s.qi >= 360 && (!previous || previous.qi < 360))
    return {
      text: "修为已满，自动修行已暂停。是否现在突破，由你决定。",
      target: "break",
      label: "查看突破把握",
    };
  const task = s.journey.queue[0];
  if (queued && !task)
    return {
      text: "这一轮修行安排已完成，没有继续消耗月份。",
      target: "queue",
      label: "查看修行安排",
    };
  const error =
    queued && task
      ? task.action === "refine"
        ? preparationError(s, "refine")
        : actionError(s, task.action)
      : actionError(s, activity);
  return error
    ? {
        text: `自动修行已暂停：${error}。`,
        target: queued ? "queue" : "cultivate",
        label: queued ? "调整修行安排" : "选择其他行动",
      }
    : null;
}

// Shallow projections change only scalar inputs to the existing chance formula.
// This is not a prediction of elapsed months, story outcomes or successful commands.
export function preparationValues(s: State, pill: boolean) {
  const usingPill = pill;
  const chance = breakthroughDetails(s, usingPill).chance;
  const difference = (next: State, use = usingPill) =>
    breakthroughDetails(next, use).chance - chance;
  const cost = refineCost(s);
  return [
    {
      key: "rest",
      title: "静养一月",
      cost: "一月；伤势 −1",
      gain: s.injury ? difference({ ...s, injury: s.injury - 1 }) : 0,
      unavailable: s.injury ? actionError(s, "rest") : "当前无伤，无需静养",
    },
    {
      key: "retreat",
      title: "闭关固本",
      cost: `六月、灵石 8；根基 +${Math.min(6, 24 - s.foundation)}、修为 +${Math.min(12, 360 - s.qi)}。${s.story.stage === "waiting" && s.month < s.story.deadline ? (s.month + 6 >= s.story.deadline ? "本次固本会越过约期，陆迟将独行" : `完成后距赴约还有 ${s.story.deadline - s.month - 6} 月`) : "会推迟叩关时间"}`,
      gain: difference({ ...s, foundation: Math.min(24, s.foundation + 6) }),
      unavailable: preparationError(s, "retreat"),
    },
    {
      key: "pill",
      title: "筑基丹是叩关必需品",
      cost: s.pills
        ? "消耗已有筑基丹 1 枚"
        : `需玉髓芝主药1株，温养六月后亲手掌火；灵草 ${cost.herbs}、灵石 ${cost.stones}`,
      gain: difference(s, true),
      unavailable:
        usingPill && s.pills > 0
          ? "已计入当前把握"
          : s.pills
            ? ""
            : preparationError(s, "refine"),
    },
  ];
}
