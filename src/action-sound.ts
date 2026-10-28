import type { Intent, State } from "./core";
import type { SoundCue } from "./sound-cues";
// Called only after persistence succeeds. No oscillator or game state belongs here.
export function actionSound(
  before: State,
  after: State,
  intent: Intent,
): SoundCue {
  if (intent.type === "expedition") {
    const effect = after.expedition.effect;
    if (effect === "win") return "victory";
    if (effect === "loss") return "hurt";
    if (
      after.expedition.duel &&
      before.expedition.duel &&
      ["strike", "guard", "discern", "hurt"].includes(effect)
    )
      return effect as SoundCue;
  }
  if (before.adventure.rescueChoice !== after.adventure.rescueChoice)
    return "choice";
  return intent.type === "adventure" && intent.action === "inspect"
    ? "discovery"
    : "step";
}
