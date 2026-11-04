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
  if (after.realm > before.realm) return after.realm >= 2 ? "golden-breakthrough" : "breakthrough";
  if (after.status === "complete" && before.status !== "complete")
    return "closure";
  if (intent.type === "ascension") {
    if (intent.action === "commit" && (after.pills < before.pills || after.goldenCore.pills < before.goldenCore.pills)) return "failure";
    if (intent.action === "withdraw") return "rest";
    if (intent.action === "medicine") return "medicine";
    if (intent.action === "press") return "guard";
    return "cultivate";
  }
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
  if (intent.type === "workshop") {
    const o = intent.order;
    if ("relic" in o)
      return before.workshop.temper[o.relic] !== after.workshop.temper[o.relic]
        ? "upgrade"
        : "choice";
    if (o.product === "sword" || o.product === "vial")
      return after.journey.relics[o.product] > before.journey.relics[o.product]
        ? "upgrade"
        : "choice";
    if (o.product === "iron") return "choice";
    const gained =
      o.product === "foundation"
        ? after.pills > before.pills
        : o.product === "ward"
          ? after.workshop.ward > before.workshop.ward
          : after.growth.medicines[o.product] >
            before.growth.medicines[o.product];
    return gained ? "medicine" : "choice";
  }
  if (intent.type === "prepare")
    return intent.kind === "retreat"
      ? "cultivate"
      : after.pills > before.pills
        ? "medicine"
        : "choice";
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
  if (intent.type === "brew")
    return after.growth.medicines[intent.medicine] >
      before.growth.medicines[intent.medicine]
      ? "medicine"
      : "choice";
  if (intent.type === "consume") return "medicine";
  if (intent.type === "equip" || intent.type === "equipRelic") return "choice";
  if (intent.type === "arenaTurn") {
    if (after.social.arena.wins > before.social.arena.wins) return "victory";
    if (after.social.arena.losses > before.social.arena.losses) return "hurt";
    return ({ break: "strike", endure: "guard", discern: "discern" } as const)[
      intent.stance
    ];
  }
  if (
    intent.type === "companionship" &&
    before.companionship.last !== after.companionship.last
  ) {
    const old = before.companionship,
      now = after.companionship;
    if (now.stage === "dispute" && old.stage === "prepare") return "ward-learn";
    if (now.plan !== old.plan)
      return after.social.gender === "male" ? "route-mark" : "lamp-align";
    if (now.stage === "done" && old.stage !== "done") return "ward-test";
    if (intent.action === "test") return "hurt";
    if (intent.action === "revisit") return "handover";
  }
  if (intent.type === "qiJourney") {
    if (after.qiJourney.gates > before.qiJourney.gates) return "upgrade";
    if (
      before.qiJourney.trial &&
      after.qiJourney.preparations[before.qiJourney.gates]![
        before.qiJourney.trial
      ] === 3
    )
      return "victory";
    if (
      (after.qiJourney.essence && !before.qiJourney.essence) ||
      (before.qiJourney.node === 1 && after.qiJourney.node === 2)
    )
      return "victory";
    if (
      before.qiJourney.duel &&
      !after.qiJourney.duel &&
      ["strike", "guard", "discern"].includes(intent.action)
    )
      return "hurt";
    if (
      intent.action === "guard" ||
      intent.action === "strike" ||
      intent.action === "discern"
    )
      return intent.action;
    return "choice";
  }
  if (intent.type === "secretPact") {
    if(after.secretPact.manual && !before.secretPact.manual)return "inheritance";
    if(after.secretPact.stage === "inside" && before.secretPact.stage !== "inside")return "discovery";
    if(after.secretPact.supplies && !before.secretPact.supplies)return "handover";
    return "choice";
  }
  if (intent.type === "foundationJourney") {
    const old = before.foundationJourney,
      now = after.foundationJourney;
    if (now.epilogue && !old.epilogue) return "closure";
    if (now.growth.refined && !old.growth.refined) return "upgrade";
    if (now.growth.steady !== old.growth.steady) return "ward-learn";
    if (now.heroine.map !== old.heroine.map) return "route-mark";
    if (now.heroine.meeting !== old.heroine.meeting) return "discovery";
    if (now.heroine.expedition && !old.heroine.expedition) return "signal-send";
    if (now.heroine.supplied && !old.heroine.supplied) return "handover";

    if (now.condensation && !old.condensation) return "inheritance";
    if (now.rescue === 4 && old.rescue !== 4) return "rescue-clear";
    if (now.bond === "covenant" && old.bond !== "covenant") return "vow";
    if (now.reunion && !old.reunion) return "reunion";
    if (now.whereabouts === "away" && old.whereabouts !== "away")
      return "farewell";
    if (now.rescue === 1 && old.rescue === 0) return "signal-send";
    if (now.rescue === 2 && old.rescue === 1) return "signal-reply";
    if (now.ferryOutcome !== old.ferryOutcome) return "handover";
    if (now.won.length > old.won.length)
      return old.duel?.id === "well" || old.duel?.id === "exit"
        ? "array-open"
        : "victory";
    if (now.inheritance !== old.inheritance) return "inheritance";
    if (now.location !== old.location && now.location === "ferry")
      return "boat-step";
    if (intent.action.kind === "move" && old.duel)
      return now.duel ? intent.action.move : "hurt";
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

// Only a settled advancement triggers a short score. Restoration is not an action.
export function breakthroughMusic(before:State, after:State): "foundation-rise" | "golden-rise" | null {
  return after.status === 'alive' && after.realm > before.realm
    ? after.realm >= 2 ? 'golden-rise' : 'foundation-rise' : null;
}
