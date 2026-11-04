/** Deterministic test policy using the same visible forecasts as the UI. */
import type { State } from "../src/core";
import { thunderExchange } from "../src/nascent-soul/thunder";
export function chooseThunderMove(s: State) {
  const b = s.nascentSoul.thunder.battle!;
  return (["guard", "strike", "discern"] as const)
    .map((move) => {
      const p = thunderExchange(s, move, true)!;
      return {
        move,
        score:
          p.incoming >= b.hp + p.healing
            ? -10000
            : p.damage >= b.enemy
              ? 10000 - p.incoming
              : p.damage +
                Math.min(p.healing, b.maxHp - b.hp) * 1.5 -
                p.incoming * 1.8,
      };
    })
    .sort((a, b) => b.score - a.score)[0]!.move;
}
