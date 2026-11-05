import { spiritReadiness } from "../spirit/profile";
import type { State } from "../world";
import { activityInterruption } from "../scene-activity";
import { quoteSettlement, settleResources } from "../economy";
import { advanceMonths } from "../timeline";
export interface TideSurvey {
  edition: number;
  finished: number;
  outcome: "none" | "careful" | "deep" | "retreated" | "interrupted";
}
export const freshTideSurvey = (): TideSurvey => ({
  edition: 0,
  finished: 0,
  outcome: "none",
});
export const tidePeriod = 120,
  tideWindow = 12,
  tideNotice = 12;
export function tideSchedule(month: number) {
  let edition = Math.max(1, Math.floor(month / tidePeriod));
  if (month >= edition * tidePeriod + tideWindow) edition++;
  const opens = edition * tidePeriod;
  return {
    edition,
    opens,
    closes: opens + tideWindow,
    announces: opens - tideNotice,
  };
}
export const tideKnown = (s: State) => s.realm >= 2 && s.outerSea.cleared === 2;
export function validTideSurvey(s: State) {
  const t = s.tideSurvey;
  if (
    !t ||
    !Number.isSafeInteger(t.edition) ||
    t.edition < 0 ||
    !Number.isSafeInteger(t.finished) ||
    t.finished < 0 ||
    t.finished > s.month ||
    !["none", "careful", "deep", "retreated", "interrupted"].includes(t.outcome)
  )
    return false;
  if (t.edition === 0) return t.finished === 0 && t.outcome === "none";
  return (
    tideKnown(s) &&
    t.outcome !== "none" &&
    t.finished >= t.edition * tidePeriod &&
    t.finished < t.edition * tidePeriod + tideWindow
  );
}
export type TideSurveyAction = "careful" | "deep";
export function tideQuote(s: State, a: TideSurveyAction) {
  const schedule = tideSchedule(s.month),
    months = a === "careful" ? 3 : 4;
  const cost = { stones: 6, herbs: 2 };
  let error = activityInterruption(s);
  if (!["careful", "deep"].includes(a)) error ||= "未知探查方式";
  if (!tideKnown(s)) error ||= "先走通退潮遗迹的两层旧府，认清旧潮路";
  if (
    s.realm !== 2 ||
    s.outerSea.location !== "ferry" ||
    s.conclave.location !== "away" ||
    s.lizhao.location !== "away"
  )
    error ||= "先循已有航路回到外海古渡";
  if (
    s.ascension ||
    s.nascentSoul.attempt ||
    s.itemGrowth.trial ||
    s.spirit.trial
  )
    error ||= "先完成眼前行功";
  if (s.month < schedule.opens || s.month + months >= schedule.closes)
    error ||= "退潮窗口不足以走完往返，候下次潮期";
  if (s.tideSurvey.edition >= schedule.edition)
    error ||= "本次潮隙已经探过，候下次退潮";
  if (s.injury > 1) error ||= "先静养至伤势不超过1，再走湿滑石道";
  const effectiveSense = spiritReadiness(s).effectiveSense;
  const success = a === "careful" || effectiveSense >= 24;
  const reward =
    a === "careful"
      ? { herbs: 4 }
      : success
        ? { herbs: 6, iron: 2 }
        : { herbs: 2 };
  error ||= quoteSettlement(s, cost, reward).error;
  return { ...schedule, months, cost, reward, error, success };
}
/** Atomic expedition with real outward/survey/return months; interruptions spend the visit, never grant loot. */
export function runTideSurvey(
  input: State,
  a: TideSurveyAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (input.seen.includes(id)) return input;
  const q = tideQuote(input, a);
  if (q.error) return input;
  let s = structuredClone(input);
  if (settleResources(s, q.cost, {}).error) return input;
  s.tideSurvey = {
    edition: q.edition,
    finished: s.month,
    outcome: "interrupted",
  };
  const elapsed = advanceMonths(s, q.months, {
    tick,
    interrupt: (n) => activityInterruption(n),
  });
  s = elapsed.state;
  if (
    elapsed.elapsed === q.months &&
    s.status === "alive" &&
    !s.pending &&
    !s.social.scene
  ) {
    s.tideSurvey.outcome = q.success ? a : "retreated";
    if (settleResources(s, {}, q.reward).error) return input;
    if (!q.success) s.injury = Math.min(6, s.injury + 1);
  }
  s.tideSurvey.finished = s.month;
  const text =
    s.tideSurvey.outcome === "interrupted"
      ? "潮隙之行中断，行装已耗，未带回材料。本次潮期不再冒险重入。"
      : s.tideSurvey.outcome === "careful"
        ? "你循旧潮路到侧廊，只采近壁灵草便循绳返渡，带回灵草4。"
        : s.tideSurvey.outcome === "deep"
          ? "你以神识辨明回潮纹路，深入侧廊取回灵草6、玄铁料2，随后沿旧路返渡。"
          : "深处潮影难辨，你及时沿绳退回古渡，带回灵草2，擦伤增加1。";
  s.outerSea.last = text;
  s.log.unshift({ month: s.month, kind: "major", text });
  s.log = s.log.slice(0, 180);
  s.seen = [...s.seen, id].slice(-512);
  return s;
}
