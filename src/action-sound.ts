import type { Intent, State } from "./core";
import type { SoundCue } from "./sound-cues";
// Called only after persistence succeeds. No oscillator or game state belongs here.
export function actionSound(
  before: State,
  after: State,
  intent: Intent,
): SoundCue {
  // Terminal outcomes take priority over the action that happened to cause them.
  if (after.life > before.life) return "rebirth";
  if (after.status === "dead" && before.status !== "dead") return "death";
  if (after.realm > before.realm) return "breakthrough";
  if (after.status === "complete" && before.status !== "complete")
    return "closure";
  if (intent.type === "break" && after.qi < before.qi) return "failure";
  if (after.adventure.mist.attempts > before.adventure.mist.attempts)
    return after.adventure.mist.passed ? "discovery" : "failure";
  if (intent.type === "challenge") {
    const old = before.journey.encounters[intent.place];
    const encounter = after.journey.encounters[intent.place];
    if (encounter && encounter.attempts > (old?.attempts ?? 0))
      return encounter.outcome === "peace"
        ? "reunion"
        : encounter.passed
          ? "victory"
          : "failure";
  }
  if (
    (!before.adventure.mist.revisited && after.adventure.mist.revisited) ||
    (before.journey.maps.sea < 3 && after.journey.maps.sea === 3)
  )
    return "closure";
  if (
    (!before.adventure.mist.settled && after.adventure.mist.settled) ||
    (!before.social.bonded && after.social.bonded)
  )
    return "reunion";
  if (
    before.story.choice !== after.story.choice &&
    after.story.choice !== "none"
  )
    return after.story.choice === "gift"
      ? "reunion"
      : after.story.choice === "missed"
        ? "failure"
        : "choice";
  if (
    intent.type === "choose" &&
    before.pending?.kind === "visit" &&
    !after.pending
  )
    return "reunion";
  if (
    (!before.adventure.mist.lamp && after.adventure.mist.lamp) ||
    (!before.adventure.mist.station && after.adventure.mist.station) ||
    (!before.adventure.mist.garden && after.adventure.mist.garden)
  )
    return "discovery";
  if (
    intent.type === "learn" &&
    after.journey.known.length > before.journey.known.length
  )
    return "discovery";
  if (intent.type === "duty" && after.journey.duties > before.journey.duties)
    return intent.duty === "herbs"
      ? "gather"
      : intent.duty === "copy"
        ? "study"
        : "guard";
  if (intent.type === "promote" && after.journey.rank > before.journey.rank)
    return "promotion";
  if (
    intent.type === "forge" &&
    after.journey.relics[intent.relic] > before.journey.relics[intent.relic]
  )
    return "upgrade";
  if (
    intent.type === "trainTechnique" &&
    after.growth.training[intent.technique] >
      before.growth.training[intent.technique]
  )
    return "upgrade";
  if (intent.type === "prepare")
    return intent.kind === "retreat" ? "cultivate" : "medicine";
  if (intent.type === "advance") {
    const routine = {
      gather: "gather",
      cultivate: "cultivate",
      meditate: "meditate",
      study: "study",
      rest: "rest",
      work: "work",
      train: "strike",
    } as const;
    if (intent.activity in routine)
      return routine[intent.activity as keyof typeof routine];
  }
  if (intent.type === "brew" || intent.type === "consume") return "medicine";
  if (intent.type === "equip" || intent.type === "equipRelic") return "choice";
  if (intent.type === "arenaTurn") {
    if (after.social.arena.wins > before.social.arena.wins) return "victory";
    if (after.social.arena.losses > before.social.arena.losses) return "hurt";
    return ({ break: "strike", endure: "guard", discern: "discern" } as const)[
      intent.stance
    ];
  }
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
