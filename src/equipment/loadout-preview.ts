import type { EquipmentContext } from "./context";
import { previewEquipment, type EquipmentChange } from "./operations";
import { evaluateEquipment } from "./effects";

/** Read-only comparison including loss or recovery of single-item focus. */
export function loadoutPreview(
  s: EquipmentContext,
  change: EquipmentChange,
): string {
  const preview = previewEquipment(s, [change]);
  if (preview.error) return "";
  const delta = (n: number) => `${n >= 0 ? "+" : ""}${n}`;
  const turns = (["strike", "guard", "discern"] as const).map((move, i) => {
    const context = { kind: "turn" as const, move, correct: true };
    const before = evaluateEquipment(s, context);
    const after = evaluateEquipment(preview.next, context);
    return `${["反击", "守势", "识破"][i]}伤害 ${delta(preview.after.damage - preview.before.damage + after.damage - before.damage)}、承伤 ${delta(before.armor - after.armor + after.incoming - before.incoming + preview.before.armor - preview.after.armor)}`;
  });
  const sequences =
    s.realm === 1
      ? (["strike", "discern"] as const)
          .map((move) => {
            const context = {
              kind: "turn" as const,
              move,
              correct: true,
              previousMove: "guard" as const,
            };
            const before = evaluateEquipment(s, context);
            const after = evaluateEquipment(preview.next, context);
            return `守势后${move === "strike" ? "正确反击" : "正确辨影"}：伤害 ${delta(preview.after.damage - preview.before.damage + after.damage - before.damage)}、承伤 ${delta(preview.before.armor - preview.after.armor + after.incoming - before.incoming)}`;
          })
          .join("；")
      : "";
  return `${change.kind === "withdraw" ? "收回后" : "装配后"}器物基础修正差值（正确应对；实际结算还受境界压制、承伤下限及击倒免反击影响）：${turns.join("；")}。${sequences ? `换招对照（含基础修正，不叠加前文）：${sequences}。` : ""}`;
}
