import { battle as validateBattle, integer, number } from "./validation";
import type { BattleState, TurnExchange, BattleOutcome } from "./types";

export interface TurnPolicy {
  turnLimit: number;
  /** journey: enemy defeat skips retaliation; simultaneous: settle both sides first. */
  resolution: "journey" | "simultaneous";
}
export function startBattle(playerHp: number, enemyHp: number): BattleState {
  if (
    !Number.isSafeInteger(playerHp) ||
    playerHp <= 0 ||
    !Number.isSafeInteger(enemyHp) ||
    enemyHp <= 0
  )
    throw new RangeError("Battle requires positive integer vigor");
  return { hp: playerHp, enemy: enemyHp, turn: 0 };
}
/** Apply an already calculated exchange exactly once to a caller-owned snapshot.
 * Callers retain command validation/idempotency and apply resource costs and story consequences.
 * Passing a terminal battle is rejected; the module never mutates its arguments.
 */
export function resolveTurn(
  battle: Readonly<BattleState>,
  exchange: Readonly<TurnExchange>,
  policy: TurnPolicy,
) {
  validateBattle(battle);
  integer(policy.turnLimit, "turnLimit", 1);
  if (!["journey", "simultaneous"].includes(policy.resolution))
    throw new RangeError("Invalid combat resolution");
  for (const key of ["damage", "incoming", "healing", "herbs"] as const)
    number(exchange[key], key);
  if (battle.hp <= 0 || battle.enemy <= 0 || battle.turn >= policy.turnLimit)
    throw new RangeError("Battle already ended");
  const enemy = Math.max(0, battle.enemy - exchange.damage);
  const skip = policy.resolution === "journey" && enemy === 0;
  const hp = skip
    ? battle.hp
    : policy.resolution === "journey"
      ? Math.max(0, battle.hp - exchange.incoming) + exchange.healing
      : Math.max(0, battle.hp - exchange.incoming + exchange.healing);
  const next = { hp, enemy, turn: battle.turn + 1 };
  // Existing chapter rules give enemy defeat priority, including the simultaneous policy.
  const outcome: BattleOutcome =
    enemy === 0
      ? "win"
      : hp <= 0 || next.turn >= policy.turnLimit
        ? "loss"
        : "ongoing";
  return {
    battle: next,
    outcome,
    herbs: exchange.herbs,
    damage: battle.enemy - enemy,
    incoming: skip ? 0 : exchange.incoming,
    healing: skip ? 0 : exchange.healing,
  };
}
