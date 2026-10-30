import { cultivationProjection } from "./cultivation";
import {
  actionError,
  preparationError,
  breakthroughDetails,
  type State,
  type Intent,
} from "./core";
import { foundationPassages, hasFoundationRecipe } from "./foundation";

export function foundationPreparation(s: State) {
  const locked =
    s.status !== "alive" ||
    !!s.pending ||
    !!s.social.scene ||
    !!s.social.arena.duel ||
    !!s.expedition.duel;
  const routes = foundationPassages({ ...s, qi: Math.max(180, s.qi) });
  const ready = routes.some((r) => !r.disabled);
  const action = (label: string, intent: Intent, error = "") => ({
    label,
    intent,
    disabled: locked || !!error,
    error,
  });
  const cultivate = (target: number) => {
    const months = Math.min(
      12,
      waiting && target === 360 ? stop - s.month : 12,
      cultivationProjection(s, target).batchMonths,
    );
    return action(
      `吐纳至${target === 180 ? "探府" : "叩关"}修为 · 最多 ${months} 月`,
      { type: "advance", activity: "cultivate", months },
      actionError(s, "cultivate") ||
        (months <= 0 ? "剩余寿元不足以完成一月修炼" : ""),
    );
  };
  const waiting =
    !s.realm &&
    !hasFoundationRecipe(s) &&
    s.story.stage === "waiting" &&
    s.month < 36;
  // These are review stops for this shortcut only, not new domain batch semantics.
  // Finish a six-month retreat strictly before month 36 (month 35 is safe).
  const stop =
    waiting && s.qi >= 180 && s.foundation < 12 && s.month < 23
      ? 23
      : waiting && s.foundation < 24 && s.month < 29
        ? 29
        : 36;
  const waitingMonths = Math.min(12, stop - s.month);
  const foundationGain = Math.min(6, 24 - s.foundation);
  const qiGain = Math.min(30, 360 - s.qi);
  const trainInjury =
    s.journey.support !== "guard" && (s.mastery + 1) % 4 === 0
      ? Math.min(1, 6 - s.injury)
      : 0;
  const trainQi = Math.min(
    360 - s.qi,
    10 +
      (s.journey.main === "blade" ? 4 : 0) +
      (s.journey.main ? s.growth.training[s.journey.main] * 2 : 0),
  );
  const trainChance =
    breakthroughDetails(
      {
        ...s,
        mastery: Math.min(12, s.mastery + 1),
        injury: s.injury + trainInjury,
      },
      true,
    ).chance - breakthroughDetails(s, true).chance;
  return {
    trainingHint: `本次历练：剑意 +${s.mastery < 12 ? 1 : 0}、修为 +${s.mastery < 12 ? trainQi : 0}、伤势 +${s.mastery < 12 ? trainInjury : 0}；当前把握净变化 ${s.mastery < 12 ? trainChance : 0} 个百分点。每四重剑意增加一层伤势（装配护身诀可避免）；可免费静养一月恢复一层伤势。`,
    timing: waiting
      ? `距赴约还有 ${36 - s.month} 月。固本一次需六月、灵石 8，根基 +${foundationGain}、修为 +${qiGain}；结束在第三十六月或更晚会失约。提前积满修为，可把余下月份用于固本、历练或劳作，也可直接候约，不必练满。`
      : `${hasFoundationRecipe(s) || s.pills ? "取丹后" : "探府前"}固本需六月、灵石 8；根基 +${foundationGain}、修为 +${qiGain}。准备会消耗月份，提高把握与尽早叩关请自行权衡。`,
    optional:
      !s.realm && s.qi >= 180 && !locked
        ? [
            action(
              "自行闭关固本 · 六月 / 灵石 8",
              { type: "prepare", kind: "retreat" },
              preparationError(s, "retreat"),
            ),
            ...(s.path === "sword" || s.inherited === "sword"
              ? [
                  action(
                    "自行历练剑意一月",
                    { type: "advance", activity: "train", months: 1 },
                    actionError(s, "train"),
                  ),
                ]
              : []),
            ...(waiting && s.qi < 360 ? [cultivate(360)] : []),
          ]
        : [],
    routes: routes.map((r) => ({
      ...r,
      preparation: !r.disabled
        ? null
        : r.id === "sense"
          ? action(
              "凝神一月",
              { type: "advance", activity: "meditate", months: 1 },
              actionError(s, "meditate"),
            )
          : r.id === "decipher" && s.wisdom >= 8
            ? action(
                "研读一月",
                { type: "advance", activity: "study", months: 1 },
                actionError(s, "study"),
              )
            : r.id === "medicine"
              ? action(
                  "购灵草四株 · 灵石 8",
                  { type: "supplies" },
                  s.stones < 8 ? "需要灵石 8，可先劳作" : "",
                )
              : r.id === "blade"
                ? action(
                    "历练一月",
                    { type: "advance", activity: "train", months: 1 },
                    actionError(s, "train"),
                  )
                : null,
    })),
    ready,
    next:
      s.realm || locked
        ? null
        : s.pills || hasFoundationRecipe(s)
          ? s.qi < 360
            ? cultivate(360)
            : null
          : s.qi < 180
            ? cultivate(180)
            : ready && s.story.stage === "waiting" && s.month < 36
              ? action(
                  `边劳作边候约 · 最多 ${waitingMonths} 月${stop < 36 ? "，停下查看准备" : ""}`,
                  {
                    type: "advance",
                    activity: "work",
                    months: waitingMonths,
                  },
                  actionError(s, "work"),
                )
              : null,
  };
}
