import { evaluateEquipment, type EquipmentContext } from "../equipment";
/** Compatibility projection for auxiliary-only callers. */
export function treasureEffect(
  s: EquipmentContext,
  move: "strike" | "guard" | "discern",
  correct: boolean,
) {
  const sources = evaluateEquipment(s, {
    kind: "turn",
    move,
    correct,
  }).sources.filter((x) => x.effect === "auxiliary");
  return sources.reduce(
    (sum, x) => ({
      damage: sum.damage + x.damage,
      incoming: sum.incoming + x.incoming,
    }),
    { damage: 0, incoming: 0 },
  );
}
