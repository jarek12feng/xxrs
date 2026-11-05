import type { State } from "../world";
import type { Move } from "../combat";
import { artifactReady, evaluateEquipment } from "../equipment";
/** Local hazard responses. Ordinary damage/armor remain owned by equipment. */
export function lizhaoRelicResponse(s: State, move: Move, correct: boolean) {
  const d = s.lizhao.duel;
  if (!d || d.kind === "han") return { toxin: 0, note: "" };
  const active = (id: "tideSeal" | "spiritPearl") =>
    s.treasures.artifacts.includes(id) && artifactReady(s, id);
  if (move === "guard" && correct && active("tideSeal"))
    return {
      toxin: -6,
      note: "镇潮印压住回潮，守势少纳毒息6；原有护体与续炼减伤仍按器物计算。",
    };
  if (move === "discern" && correct && active("spiritPearl"))
    return {
      toxin: -8,
      note: "定神珠映清支流，辨影额外排去毒息8；普通辨影也能开路排毒。",
    };
  const previousMove = ["guard", "strike", "discern"].includes(d.effect)
    ? (d.effect as Move)
    : "none";
  const breaking = evaluateEquipment(s, {
    kind: "turn",
    move,
    correct,
    previousMove,
  }).sources.some((v) => v.source === "tideBlade" && v.effect === "sequence");
  return {
    toxin: 0,
    note: breaking
      ? "潮纹剑沿已开的罡隙破枢，蓄势增伤已计入本合伤害，不重复叠加。"
      : "",
  };
}
