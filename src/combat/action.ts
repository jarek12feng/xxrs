import { resolveTurn, type TurnPolicy } from "./turn";
import { battle as validateBattle, integer } from "./validation";
import type { BattleState, TurnExchange } from "./types";

/** A scene supplies its current snapshot and a pure calculation, never a cached UI quote.
 * The result is a complete, immutable-by-convention transaction; only the command owner
 * commits it. No clocks, RNG, rewards, story callbacks or persistence live here.
 */
export function executeBattleAction<P extends TurnExchange>(
  battle: Readonly<BattleState>,
  herbs: number,
  policy: TurnPolicy,
  calculate: () => P | null,
) {
  validateBattle(battle);
  integer(herbs, "available herbs", 0);
  integer(policy.turnLimit, "turnLimit", 1);
  if (battle.hp <= 0 || battle.enemy <= 0 || battle.turn >= policy.turnLimit)
    throw new RangeError("Battle already ended");
  const quote = calculate();
  if (!quote) return null;
  integer(quote.herbs, "herb cost", 0);
  if (quote.herbs > herbs) throw new RangeError("Insufficient combat herbs");
  const resolved = resolveTurn(battle, quote, policy);
  return {
    ...resolved,
    remainingHerbs: herbs - resolved.herbs,
    /** Keep explanatory metadata, but report actual damage (no overkill) and retaliation. */
    exchange: {
      ...quote,
      damage: resolved.damage,
      incoming: resolved.incoming,
      healing: resolved.healing,
      herbs: resolved.herbs,
    },
  };
}
