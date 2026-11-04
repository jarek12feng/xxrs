import type { MedicineId } from "./catalog";
export type MedicineScene =
  | "daily"
  | "between-battles"
  | "foundation-breakthrough"
  | "golden-breakthrough";
export interface MedicineUseContext {
  scene: MedicineScene;
  count: number;
  month: number;
  injury?: number;
  sense?: number;
  lastMedicineMonth?: number | null;
}
const rules = {
  healing: { scene: "daily", injury: 2, sense: 0, recovery: 0, cooldown: 0 },
  clarity: { scene: "daily", injury: 0, sense: 2, recovery: 0, cooldown: 3 },
  ward: {
    scene: "between-battles",
    injury: 0,
    sense: 0,
    recovery: 26,
    cooldown: 0,
  },
  foundation: {
    scene: "foundation-breakthrough",
    injury: 0,
    sense: 0,
    recovery: 0,
    cooldown: 0,
  },
  goldenCore: {
    scene: "golden-breakthrough",
    injury: 0,
    sense: 0,
    recovery: 0,
    cooldown: 0,
  },
} as const;
/** Local use conditions and effects. Story/combat locks and breakthrough eligibility stay with command owners. */
export function quoteMedicineUse(id: MedicineId, context: MedicineUseContext) {
  const rule = Object.hasOwn(rules, id) ? rules[id] : null;
  let error = !rule
    ? "未知丹方"
    : rule.scene !== context.scene
      ? "此药不能在当前场景使用"
      : !Number.isSafeInteger(context.count) || context.count < 1
        ? "储物袋中没有此药"
        : "";
  if (
    !error &&
    rule?.cooldown &&
    context.lastMedicineMonth != null &&
    context.month - context.lastMedicineMonth < rule.cooldown
  )
    error = `药性未散，再过 ${rule.cooldown - (context.month - context.lastMedicineMonth)} 个月可服药`;
  if (!error && id === "healing" && !context.injury)
    error = "没有伤势，无需服药";
  if (!error && id === "clarity" && (context.sense ?? 0) >= 12)
    error = "神识已达本篇上限";
  return {
    error,
    consumed: error ? 0 : 1,
    remaining: context.count - (error ? 0 : 1),
    healed: error
      ? 0
      : Math.max(0, Math.min(context.injury ?? 0, rule?.injury ?? 0)),
    sense: error
      ? 0
      : Math.max(0, Math.min(12 - (context.sense ?? 0), rule?.sense ?? 0)),
    recovery: error ? 0 : (rule?.recovery ?? 0),
    nextUseMonth:
      !error && rule?.cooldown ? context.month + rule.cooldown : null,
  };
}
export interface DailyMedicineState {
  month: number;
  injury: number;
  sense: number;
  growth: {
    medicines: { healing: number; clarity: number };
    lastMedicineMonth: number | null;
  };
}
export function dailyMedicineQuote(
  s: DailyMedicineState,
  id: "healing" | "clarity",
) {
  return quoteMedicineUse(id, {
    scene: "daily",
    count: s.growth.medicines[id],
    month: s.month,
    injury: s.injury,
    sense: s.sense,
    lastMedicineMonth: s.growth.lastMedicineMonth,
  });
}
export function applyDailyMedicine(
  s: DailyMedicineState,
  id: "healing" | "clarity",
) {
  const quote = dailyMedicineQuote(s, id);
  if (!quote.error) {
    s.growth.medicines[id] = quote.remaining;
    s.injury -= quote.healed;
    s.sense += quote.sense;
    if (quote.nextUseMonth !== null) s.growth.lastMedicineMonth = s.month;
  }
  return quote;
}
