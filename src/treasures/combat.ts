import type { State } from "../world";
/** A single active auxiliary. Presentation and all turn-based adapters share this projection. */
export function treasureEffect(
  s: State,
  move: "strike" | "guard" | "discern",
  correct: boolean,
) {
  const auxiliary = s.treasures.equipped;
  const rank = auxiliary ? s.treasures.owned[auxiliary] : 0;
  let damage = 0,
    incoming = 0;
  if (auxiliary === "bell") {
    if (move === "guard") incoming -= rank + 1;
    if (move === "strike") damage--;
  }
  if (auxiliary === "cord" && move === "strike") {
    incoming -= rank + 1;
    damage--;
  }
  if (auxiliary === "mirror" && move === "discern" && correct)
    damage += rank + 1;
  return { damage, incoming };
}
