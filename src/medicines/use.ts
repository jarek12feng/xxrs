import { senseLimit } from "../spirit";
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
  realm?: number;
  lastMedicineMonth?: number | null;
}
const rules = {
  healing: { scene: "daily", injury: 2, sense: 0, recovery: 0, cooldown: 0 },
  spirit: { scene: "daily", injury: 0, sense: 4, recovery: 0, cooldown: 3 },
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
  const spiritual = id === "clarity" || id === "spirit";
  const limit = Math.min(
    senseLimit(context.realm ?? 0),
    id === "clarity" ? 24 : 48,
  );
  const gain =
    id === "clarity"
      ? (context.sense ?? 0) < 12
        ? 2
        : 1
      : id === "spirit"
        ? (context.sense ?? 0) < 36
          ? 4
          : 2
        : 0;
  if (!error && id === "spirit" && (context.realm ?? 0) < 2)
    error = "金丹后方可炼化养神丹";
  if (!error && spiritual && (context.sense ?? 0) >= limit)
    error = "神识已达本境或此药药力上限";
  return {
    error,
    consumed: error ? 0 : 1,
    remaining: context.count - (error ? 0 : 1),
    healed: error
      ? 0
      : Math.max(0, Math.min(context.injury ?? 0, rule?.injury ?? 0)),
    sense: error
      ? 0
      : Math.max(0, Math.min(limit - (context.sense ?? 0), gain)),
    recovery: error ? 0 : (rule?.recovery ?? 0),
    nextUseMonth:
      !error && rule?.cooldown ? context.month + rule.cooldown : null,
  };
}
export interface DailyMedicineState {
  month: number;
  injury: number;
  sense: number;
  realm?: number;
  growth: {
    medicines: { healing: number; clarity: number; spirit?: number };
    lastMedicineMonth: number | null;
  };
}
export function dailyMedicineQuote(
  s: DailyMedicineState,
  id: "healing" | "clarity" | "spirit",
) {
  return quoteMedicineUse(id, {
    scene: "daily",
    count: s.growth.medicines[id] ?? 0,
    realm: s.realm,
    month: s.month,
    injury: s.injury,
    sense: s.sense,
    lastMedicineMonth: s.growth.lastMedicineMonth,
  });
}
export function applyDailyMedicine(
  s: DailyMedicineState,
  id: "healing" | "clarity" | "spirit",
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
