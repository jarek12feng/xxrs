import type { State } from "../../world";
/** Use only reviewed sheets; no male gait on female characters or qi clothes on golden core. */
export function travelWalkSheet(
  s: Pick<State, "realm" | "social">,
): string | undefined {
  if (s.social.gender !== "male") return undefined;
  return s.realm === 0
    ? "/art/scene2d/hero-qi-walk-v2.png"
    : s.realm === 1
      ? "/art/scene2d/foundation-walk/hero-male-v1.png"
      : undefined;
}
