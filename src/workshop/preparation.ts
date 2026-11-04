import { quoteSettlement } from "../economy";
import { actionError, type State, type Intent } from "../core";
import { activityInterruption } from "../scene-activity";
import { preparationRates, monthlyStudy } from "../preparation-rates";
import { techniqueActivityEffect } from "../techniques";
import { workshopQuote, type WorkshopOrder } from "./rules";
export interface PreparationSelection {
  order: WorkshopOrder;
  outcome: string | number;
}
/** Estimates use existing monthly yields; events can stop the emitted ordinary command early. */
export function preparationPlan(s: State, order: WorkshopOrder) {
  const quote = workshopQuote(s, order);
  const deficits = {
    stones: Math.max(0, quote.stones - s.stones),
    herbs: Math.max(0, quote.herbs - s.herbs),
    iron: Math.max(0, quote.iron - s.workshop.iron),
    study: Math.max(0, quote.study - s.study),
  };
  const steps: {
    label: string;
    months: number;
    gain: number;
    error: string;
    intent: Intent;
  }[] = [];
  for (const [key, activity, rate, label] of [
    ["stones", "work", preparationRates.stones, "劳作筹灵石"],
    [
      "herbs",
      "gather",
      preparationRates.herbs + techniqueActivityEffect(s, "gather").herbs,
      "采药备灵草",
    ],
    ["study", "study", monthlyStudy(s.wisdom), "研读积累心得"],
  ] as const) {
    if (!deficits[key]) continue;
    const months = Math.min(12, Math.ceil(deficits[key] / rate));
    steps.push({
      label,
      months,
      gain: Math.min(key === "study" ? 4 - s.study : Infinity, months * rate),
      error: activityInterruption(s) || actionError(s, activity),
      intent: { type: "advance", activity, months },
    });
  }
  const purchases: { label: string; error: string; intent: Intent }[] = [];
  if (deficits.herbs)
    purchases.push({
      label: "坊市购草 · 灵石 8 换灵草 4",
      error:
        activityInterruption(s) ||
        quoteSettlement(s, { stones: 8 }, { herbs: 4 }).error,
      intent: { type: "supplies" },
    });
  if (deficits.iron) {
    const order = { product: "iron", method: "buy" } as const,
      ironQuote = workshopQuote(s, order);
    purchases.push({
      label: `购买玄铁料 · ${ironQuote.cost}`,
      error: activityInterruption(s) || ironQuote.error,
      intent: { type: "workshop", order },
    });
  }
  return { quote, deficits, steps, purchases };
}
/** A selected preparation ends when its actual output changes, not when time passes. */
export function preparationOutcome(
  s: State,
  order: WorkshopOrder,
): string | number {
  if ("relic" in order) return s.workshop.temper[order.relic];
  switch (order.product) {
    case "sword":
    case "vial":
      return s.journey.relics[order.product];
    case "foundation":
      return s.pills;
    case "ward":
    case "iron":
      return s.workshop[order.product];
    case "healing":
    case "clarity":
      return s.growth.medicines[order.product];
  }
}

export function preparationCompleted(
  s: State,
  selection: PreparationSelection,
) {
  const outcome = preparationOutcome(s, selection.order);
  if (typeof outcome === "number" && typeof selection.outcome === "number")
    return outcome > selection.outcome;
  return (
    "relic" in selection.order &&
    outcome === selection.order.temper &&
    outcome !== selection.outcome
  );
}
