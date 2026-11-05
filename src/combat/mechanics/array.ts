import type { BattleState, CombatEncounter, Move } from "../types";

/** Internal array mechanic. It transforms only the running exchange; no chapter state. */
export function applyArrayMechanic(
  e: CombatEncounter,
  d: Readonly<BattleState>,
  move: Move,
  effect: string,
  exchange: { damage: number; incoming: number; note: string },
) {
  let { damage, incoming, note } = exchange;
  // A closed core resists blind attacks; scouting or the exposed turn opens it.
  if (
    move === "strike" &&
    !(e.coreOpen ?? d.turn % e.pattern.length === 2) &&
    effect !== "discern" &&
    effect !== "guard"
  ) {
    damage = Math.max(1, damage - 8);
    incoming += 4;
    note += "阵核闭合，抢攻伤害 −8、反震 +4；先辨影或等阵核露出。";
  }

  if (d.enemy <= e.hp / 2) {
    incoming += 2;
    note += "阵核暴露，阵势转急，承伤 +2。";
  }
  if (effect === "guard" && move === "strike") {
    damage += 10;
    note += "借上合稳守蓄势，反击伤害 +10。";
  }
  if (effect === "discern") {
    damage += 6;
    incoming -= 2;
    note += "沿上合辨出的阵路，伤害 +6、承伤 −2。";
  }
  if (move === "guard") {
    damage = Math.max(1, damage - 4);
    incoming -= 4;
    note += "稳守：伤害 −4、承伤 −4；下合反击 +10。";
  }
  if (move === "discern") {
    damage = Math.max(1, damage - 3);
    note += "探阵：本合伤害 −3；下合伤害 +6、承伤 −2。";
  }
  return { damage, incoming, note };
}
