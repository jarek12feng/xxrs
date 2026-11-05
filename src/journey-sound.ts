import type { Intent, State } from "./core";
import type { SoundCue } from "./sound-cues";

// Presentation of committed results; never infer victory from a vanished duel alone.
export function journeySound(
  before: State,
  after: State,
  intent: Intent,
): SoundCue | null {
  if (before === after) return null;
  switch (intent.type) {
    case "artifactGrowth": {
      const a = before.itemGrowth.golden,
        b = after.itemGrowth.golden;
      if (b.proven && !a.proven) return "victory";
      if (a.blade === "none" && b.blade === "embryo") return "inheritance";
      if (b.blade !== a.blade || (b.seal && !a.seal) || (b.pearl && !a.pearl))
        return "upgrade";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel?.turn !== a.duel.turn
      )
        return b.duel ? intent.action.move : "hurt";
      if (intent.action.kind === "withdraw" && a.duel && !b.duel) return "rest";
      break;
    }
    case "itemGrowth": {
      const a = before.itemGrowth,
        b = after.itemGrowth;
      if (
        b.ring > a.ring ||
        (b.reinforced && !a.reinforced) ||
        (b.reforged.sword && !a.reforged.sword) ||
        (b.reforged.vial && !a.reforged.vial)
      )
        return "upgrade";
      if (b.collected > a.collected) return "gather";
      if (
        intent.action.kind === "move" &&
        a.trial &&
        b.trial?.turn !== a.trial.turn
      )
        return b.trial
          ? intent.action.move === "brace"
            ? "guard"
            : "discern"
          : "hurt";
      if (intent.action.kind === "withdraw" && a.trial && !b.trial)
        return "rest";
      break;
    }
    case "spirit": {
      const a = before.spirit,
        b = after.spirit;
      if (b.trauma > a.trauma) return "hurt";
      if (b.manual !== a.manual || b.jade !== a.jade)
        return (b.manual === "learned" && a.manual !== "learned") ||
          (b.jade === "refined" && a.jade !== "refined")
          ? "upgrade"
          : "inheritance";
      if (b.trauma < a.trauma) return "rest";
      if (
        intent.action.kind === "move" &&
        a.trial &&
        b.trial &&
        b.trial.turn > a.trial.turn
      )
        return intent.action.move === "reach" ? "discern" : intent.action.move;
      if (intent.action.kind === "withdraw" && a.trial && !b.trial)
        return "rest";
      break;
    }
    case "outerSea": {
      const a = before.outerSea,
        b = after.outerSea;
      if (b.cleared > a.cleared) return "victory";
      if ((b.seal && !a.seal) || (b.manual && !a.manual)) return "inheritance";
      if ((b.attuned && !a.attuned) || b.method !== a.method) return "upgrade";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel?.turn !== a.duel.turn
      )
        return b.duel ? intent.action.move : "hurt";
      if (intent.action.kind === "withdraw" && a.duel && !b.duel) return "rest";
      if (b.location !== a.location) return "boat-step";
      break;
    }
    case "conclave": {
      const a = before.conclave,
        b = after.conclave;
      if (b.wins > a.wins || b.depth > a.depth) return "victory";
      if (
        b.stage > a.stage ||
        (b.attuned && !a.attuned) ||
        b.method !== a.method
      )
        return "upgrade";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel?.turn !== a.duel.turn
      )
        return b.duel ? intent.action.move : "hurt";
      if (intent.action.kind === "withdraw" && a.duel && !b.duel) return "rest";
      break;
    }
    case "sectContest": {
      const a = before.sectContest,
        b = after.sectContest;
      if (b.results.length > a.results.length)
        return b.results.at(-1) === "win"
          ? "victory"
          : intent.action.kind === "withdraw"
            ? "rest"
            : "hurt";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel &&
        b.duel.turn > a.duel.turn
      )
        return intent.action.move;
      break;
    }
    case "goldenCore": {
      const a = before.goldenCore,
        b = after.goldenCore;
      if (b.expedition === "won" && a.expedition !== "won") return "victory";
      if (b.pills > a.pills) return "medicine";
      if (b.farShore && !a.farShore) return "discovery";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel?.turn !== a.duel.turn
      )
        return b.duel ? intent.action.move : "hurt";
      if (intent.action.kind === "withdraw" && a.duel && !b.duel) return "rest";
      break;
    }
    case "lizhao": {
      const a = before.lizhao,
        b = after.lizhao;
      if (
        (b.outerCleared && !a.outerCleared) ||
        (b.cleared && !a.cleared) ||
        (b.pursuit === "repelled" && a.pursuit !== "repelled")
      )
        return "victory";
      if (b.assay.mistakes > a.assay.mistakes) return "failure";
      if (b.recipeVerified && !a.recipeVerified) return "ward-test";
      if (
        intent.action.kind === "move" &&
        a.duel &&
        b.duel?.turn !== a.duel.turn
      )
        return b.duel ? intent.action.move : "hurt";
      if (intent.action.kind === "withdraw" && a.duel && !b.duel) return "rest";
      if (intent.action.kind === "assay" && b.last !== a.last)
        return "medicine";
      break;
    }
    case "goldenStory": {
      const a = before.goldenStory,
        b = after.goldenStory;
      if (b.teachings.length > a.teachings.length) return "ward-learn";
      if (b.practice && a.practice && b.practice.errors > a.practice.errors)
        return "failure";
      if (b.tideComplete && !a.tideComplete) return "ward-test";
      if (b.reunion.stage !== a.reunion.stage) {
        if (b.reunion.stage === "met") return "reunion";
        if (b.reunion.stage === "departed") return "farewell";
        if (b.reunion.stage === "resolved") return "ward-test";
        return "route-mark";
      }
      if (intent.action.kind === "practice" && b.last !== a.last)
        return "discern";
      break;
    }
    case "nascentSoul": {
      const a = before.nascentSoul,
        b = after.nascentSoul;
      if (b.failures > a.failures) return "failure";
      if (
        (b.trialWon && !a.trialWon) ||
        (b.thunder.cleared && !a.thunder.cleared) ||
        (b.thunder.practiced && !a.thunder.practiced)
      )
        return "victory";
      if (b.ability === "done" && a.ability !== "done") return "rescue-clear";
      if (b.pills > a.pills) return "medicine";
      if (
        b.ceremony !== a.ceremony &&
        ["witnessed", "married", "renewed"].includes(b.ceremony)
      )
        return "vow";
      if (b.emerged && !a.emerged) return "promotion";
      if (
        intent.action.kind === "thunderMove" &&
        b.thunder.last?.serial !== a.thunder.last?.serial &&
        b.thunder.last
      )
        return b.thunder.last.outcome === "loss" ? "hurt" : intent.action.move;
      if (
        intent.action.kind === "trialMove" &&
        a.trial &&
        b.trial?.turn !== a.trial.turn
      )
        return !b.trial
          ? "hurt"
          : intent.action.move === "break"
            ? "strike"
            : intent.action.move === "mind"
              ? "discern"
              : "guard";
      if (intent.action.kind === "crossing" && b.last !== a.last)
        return intent.action.move === "advance" ? "boat-step" : "guard";
      if (intent.action.kind === "step" && b.last !== a.last)
        return "cultivate";
      if (
        intent.action.kind === "withdraw" &&
        (a.trial || a.attempt || a.thunder.battle) &&
        !b.trial &&
        !b.attempt &&
        !b.thunder.battle
      )
        return "rest";
      break;
    }
    case "treasure": {
      const a = before.treasures.auction,
        b = after.treasures.auction;
      if (
        a &&
        b &&
        a.number === b.number &&
        a.venue === b.venue &&
        b.lots.some(
          (lot, i) => lot.result === "won" && a.lots[i]?.result !== "won",
        )
      )
        return "handover";
      break;
    }
  }
  return null;
}
