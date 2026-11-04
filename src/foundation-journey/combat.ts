import { sharedJourneyDone } from "./heroine";
import { hasSteady } from "./growth-state";
import { realmPressure } from "../realm-pressure";
import type { State } from "../world";
import { readiness, tacticalPreview } from "../combat/game";
import type { Move, CombatAdjustment } from "../combat";
import { expectedMove, tacticalAdjustment } from "./tactics";
import { challenges } from "./content";
export function foundationCooperation(s: State, id: keyof typeof challenges) {
  const q = s.foundationJourney;
  return (
    !id.startsWith("rank") &&
    id !== "culmination" &&
    q.bond === "covenant" &&
    q.reunion &&
    sharedJourneyDone(s) &&
    ["home", "returned", "rescued"].includes(q.whereabouts) &&
    (q.duel ? q.duel.aid : q.aid)
  );
}
export function foundationBattleReadiness(
  s: State,
  id: keyof typeof challenges,
) {
  const cooperation = foundationCooperation(s, id);
  return {
    ...realmPressure(s, challenges[id], cooperation),
    cooperation,
    cooperationNote: cooperation
      ? "道侣依约同行，正确应对时协助牵制：伤害 +4、承伤 −3；共同准备仅供本场。"
      : id === "culmination" || id.startsWith("rank")
        ? "本场独自应战，不提供道侣协作。"
        : "道侣结契、远行归来且在场，共同准备后可协作一场。",
  };
}
export function foundationPower(s: State) {
  const base = readiness(s),
    tier = Math.floor(s.foundationJourney.cultivation / 100);
  return {
    hp: base.hp + tier * 4,
    damage: base.damage + tier,
    armor:
      base.armor +
      Math.floor(tier / 2) +
      (hasSteady(s.foundationJourney) ? 2 : 0) +
      (s.foundationJourney.duel?.aid ? 2 : 0),
  };
}
export function foundationExchange(s: State, move: Move) {
  const q = s.foundationJourney,
    d = q.duel;
  if (!d) return null;
  const power = foundationPower(s);
  const trained =
    q.inheritance !== "none" &&
    s.journey.main === q.inheritance &&
    move ===
      { spring: "guard", blade: "strike", breath: "discern" }[q.inheritance];
  const preparation = foundationBattleReadiness(s, d.id);
  const adjustments: CombatAdjustment[] = [];
  if (trained)
    adjustments.push({
      phase: "exchange",
      damage: 4,
      incoming: -2,
      effects: ["inheritance"],
      note: "沉井传承生效：伤害 +4、承伤 −2。",
    });
  if (d.ruleset === 2)
    adjustments.push({ phase: "exchange", ...tacticalAdjustment(s, move) });
  if (preparation.cooperation)
    adjustments.push({
      phase: "exchange",
      damage: 4,
      incoming: -3,
      whenCorrect: true,
      note: "道侣牵制来势，伤害 +4、承伤 −3。",
    });
  return tacticalPreview(s, {
    move: move,
    encounter:
      d.ruleset === 2
        ? {
            ...challenges[d.id],
            coreOpen: expectedMove(s) === "strike",
            pattern: Array(challenges[d.id].pattern.length).fill(
              expectedMove(s),
            ),
          }
        : {
            ...challenges[d.id],
            attack:
              d.id === "rank4"
                ? 27
                : d.id === "rank5"
                  ? 29
                  : challenges[d.id].attack,
          },
    battle: d,
    effect: d.effect,
    arrayCore: challenges[d.id].array,
    power,
    rules: "prepared",
    pressure: preparation,
    adjustments,
    arrayDiscernBonus: d.ruleset === 2 ? 5 : 7,
  });
}
