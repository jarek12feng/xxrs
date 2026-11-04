import type { EquipmentContext } from "./context";
import { previewEquipment, type EquipmentChange } from "./operations";
import { evaluateEquipment } from "./effects";

/** Read-only comparison including loss or recovery of single-item focus. */
export function loadoutPreview(s: EquipmentContext, change: EquipmentChange): string {
    const preview = previewEquipment(s, [change]);
    if (preview.error) return "";
    const delta = (n: number) => `${n >= 0 ? "+" : ""}${n}`;
    const turns = (["strike", "guard", "discern"] as const).map((move, i) => {
      const context = { kind: "turn" as const, move, correct: true };
      const before = evaluateEquipment(s, context);
      const after = evaluateEquipment(preview.next, context);
      return `${["反击", "守势", "识破"][i]}伤害 ${delta(preview.after.damage - preview.before.damage + after.damage - before.damage)}、承伤 ${delta(before.armor - after.armor + after.incoming - before.incoming + preview.before.armor - preview.after.armor)}`;
    });
    return `${change.kind === "withdraw" ? "收回后" : "装配后"}器物基础修正差值（正确应对；实际结算还受境界压制、承伤下限及击倒免反击影响）：${turns.join("；")}。`;
}
