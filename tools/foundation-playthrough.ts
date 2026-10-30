import {
  eventView,
  hasFoundationRecipe,
  refineCost,
  type State,
  type Intent,
} from "../src/core";

// A public-command player policy for reproducible journey regressions, never edits saves.
export function foundationStep(s: State, gift = true): Intent {
  if (s.pending) {
    const choices = {
      meeting: "promise",
      letter: "listen",
      visit: "herbs",
      departure: "go",
      crossing: "withdraw",
      relic: gift ? "gift" : "self",
    };
    let option = choices[s.pending.kind];
    if (s.pending.kind === "crossing")
      option =
        eventView(s)!.options.find((o) => !o.disabled && o.id !== "withdraw")
          ?.id ?? "withdraw";
    if (s.pending.kind === "relic" && s.story.choice === "missed")
      option = "self";
    return { type: "choose", instanceId: s.pending.id, option };
  }
  if (s.injury) return { type: "advance", activity: "rest", months: 3 };
  if (!hasFoundationRecipe(s) && !s.pills) {
    if (s.qi < 180)
      return { type: "advance", activity: "cultivate", months: 12 };
    // Buy a guaranteed crossing solution; avoids aptitude-specific edited fixtures.
    if (s.herbs < 4)
      return s.stones >= 8
        ? { type: "supplies" }
        : { type: "advance", activity: "work", months: 3 };
    if (
      s.story.choice === "missed" ||
      (s.story.stage === "waiting" && s.month >= 36)
    )
      return { type: "revisitRelic" };
    return {
      type: "advance",
      activity: s.qi < 360 ? "cultivate" : "work",
      months: 12,
    };
  }
  if (!s.pills) {
    const cost = refineCost(s);
    if (s.stones < cost.stones + 16)
      return { type: "advance", activity: "work", months: 6 };
    if (s.herbs < cost.herbs) return { type: "supplies" };
    return { type: "prepare", kind: "refine" };
  }
  if (s.qi < 360) return { type: "advance", activity: "cultivate", months: 12 };
  return { type: "break", pill: true };
}
