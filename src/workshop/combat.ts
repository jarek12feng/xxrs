import { treasureEffect } from "../treasures/combat";
import type { State } from "../world";
// All turn-based battle adapters use this projection before realm pressure and lethal resolution.
export function temperEffect(
  s: State,
  move: "strike" | "guard" | "discern",
  correct: boolean,
) {
  const relic = s.journey.equipped;
  const t = relic ? s.workshop.temper[relic] : "plain";
  let damage = 0,
    incoming = 0;
  if (t === "keen" && move === "strike") {
    damage = 3;
    incoming = 1;
  }
  if (t === "array") {
    if (move === "discern" && correct) damage = 4;
    if (move === "strike") damage = -1;
  }
  if (t === "shell" && move === "guard") {
    damage = -1;
    incoming = -3;
  }
  if (t === "flow") {
    if (move === "discern" && correct) {
      damage = 1;
      incoming = -2;
    }
    if (move === "strike") incoming = 1;
  }
  const auxiliary = treasureEffect(s, move, correct);
  damage += auxiliary.damage;
  incoming += auxiliary.incoming;
  return {
    damage,
    incoming,
    note:
      damage || incoming
        ? `器物修正：伤害 ${damage >= 0 ? "+" : ""}${damage}、承伤 ${incoming >= 0 ? "+" : ""}${incoming}。`
        : "",
  };
}
