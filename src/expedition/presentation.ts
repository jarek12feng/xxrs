import type { State, Intent } from "../core";
import { encounters } from "./content";
import { readiness } from "./rules";
export function preparationAdvice(
  s: State,
): { text: string; label: string; intent: Intent }[] {
  const q = s.expedition;
  if (!q.accepted || q.duel || q.cleared >= 3) return [];
  const advice: { text: string; label: string; intent: Intent }[] = [];
  if (s.injury)
    advice.push({
      text: `当前伤势 ${s.injury}，先恢复气势。`,
      label: "静养一月 · 伤势 −1",
      intent: { type: "advance", activity: "rest", months: 1 },
    });
  if (s.stones < encounters[q.cleared]!.cost)
    advice.push({
      text: "补给不足；劳作是稳定的恢复途径。",
      label: "劳作一月 · 灵石 +5",
      intent: { type: "advance", activity: "work", months: 1 },
    });
  if (q.cleared === 1 && s.herbs < 4) {
    if (s.study < 2)
      advice.push({
        text: "研读提升阵法理解，也增加交锋伤害。",
        label: "研读一月",
        intent: { type: "advance", activity: "study", months: 1 },
      });
    if (s.sense < 6)
      advice.push({
        text: `神识 ${s.sense}/6；也可以备灵草 4 走温养路线。`,
        label: "凝神一月 · 神识 +1",
        intent: { type: "advance", activity: "meditate", months: 1 },
      });
  }
  return advice;
}
export function battleMeters(s: State) {
  const q = s.expedition,
    e = encounters[Math.min(q.cleared, 2)]!;
  return { playerMax: readiness(s).hp, enemyMax: e.hp };
}
