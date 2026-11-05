import { applyArrayMechanic } from "./mechanics/array";
import { correctResponse } from "./types";
import { battle, finiteTree, number, pattern } from "./validation";
import type {
  CombatEffect,
  CombatAdjustment,
  BattleState,
  CombatEncounter,
  CombatProfile,
  Move,
} from "./types";

export interface ActionContext {
  move: Move;
  encounter: CombatEncounter;
  battle: Readonly<BattleState>;
  profile: CombatProfile;
  effect: string;
  arrayCore?: boolean;
  /** An already falling hazard still lands even when its source is dispersed. */
  retaliateOnDefeat?: boolean;
  /** prepared preserves the existing foundation clamp and healing rules. */
  rules?: "standard" | "prepared";
  adjustments?: readonly CombatAdjustment[];
  arrayDiscernBonus?: number;
}

/** Pure calculation. Does not mutate inputs, spend resources or consume RNG. */
export function previewAction({
  move,
  encounter: e,
  battle: d,
  profile,
  effect,
  arrayCore = false,
  retaliateOnDefeat = false,
  rules = "standard",
  adjustments = [],
  arrayDiscernBonus = 7,
}: ActionContext) {
  battle(d);
  pattern(e.pattern, ["guard", "strike", "discern"]);
  if (e.responses) pattern(e.responses, ["guard", "strike", "discern"]);
  finiteTree({ profile, encounter: e, adjustments, arrayDiscernBonus });
  for (const key of ["hp", "damage", "armor"] as const)
    number(profile.power[key], key);
  number(profile.herbs, "herbs");
  number(e.attack, "attack");
  number(e.hp, "enemy maximum hp", 1);
  if (profile.pressure) {
    number(profile.pressure.damageFactor, "damageFactor");
    number(profile.pressure.incomingExtra, "incomingExtra");
  }
  if (!["standard", "prepared"].includes(rules))
    throw new RangeError("Invalid combat rules");
  for (const adjustment of adjustments)
    if (!["power", "exchange", "afterHealing"].includes(adjustment.phase))
      throw new RangeError("Invalid combat adjustment phase");
  const power = { ...profile.power };
  let powerNote = "";
  for (const adjustment of adjustments) {
    if (adjustment.phase !== "power") continue;
    power.hp += adjustment.hp ?? 0;
    power.damage += adjustment.damage ?? 0;
    power.armor += adjustment.armor ?? 0;
    powerNote += adjustment.note ?? "";
  }
  const effects: CombatEffect[] = [];
  if (!["guard", "strike", "discern"].includes(move)) return null;
  const correct = correctResponse(e, d.turn, move);
  let damage =
      power.damage +
      (correct ? 6 : 0) +
      (profile.lantern && move === "discern" ? 3 : 0),
    incoming = Math.max(1, e.attack + (correct ? -5 : 3) - power.armor),
    note = "";
  if (profile.mainActive && profile.main === "blade" && move === "strike") {
    damage += 8;
    incoming += 2;
    note = "剑经抢攻，伤害 +8，未击倒时承伤 +2。";
  }
  if (
    profile.mainActive &&
    profile.main === "spring" &&
    move === "guard" &&
    profile.herbs > 0
  ) {
    damage = Math.max(1, damage - 2);
    note = "长春守势收敛攻势，伤害 −2。";
  }
  if (profile.mainActive && profile.main === "breath" && move === "discern") {
    if (arrayCore) effects.push("array-discern");
    damage += arrayCore ? arrayDiscernBonus : 2;
    incoming -= 2;
    note = arrayCore
      ? `归元息照见阵核，伤害 +${arrayDiscernBonus}、承伤 −2。`
      : "归元息辨清身形，伤害 +2、承伤 −2。";
  }
  if (arrayCore) {
    ({ damage, incoming, note } = applyArrayMechanic(e, d, move, effect, {
      damage,
      incoming,
      note,
    }));
  }
  const temper = profile.equipment;
  damage = Math.max(1, damage + temper.damage);
  incoming += temper.incoming;
  note += temper.note;
  // Foundation historically clamps the shared base before its ordered additions.
  if (rules === "prepared") incoming = Math.max(1, incoming);
  for (const adjustment of adjustments) {
    if (adjustment.phase !== "exchange" || (adjustment.whenCorrect && !correct))
      continue;
    damage = Math.max(1, damage + adjustment.damage);
    incoming = Math.max(0, incoming + adjustment.incoming);
    note += adjustment.note;
    effects.push(...(adjustment.effects ?? []));
  }
  if (profile.pressure) {
    const pressure = profile.pressure;
    damage = Math.max(1, Math.floor(damage * pressure.damageFactor));
    incoming += pressure.incomingExtra;
    if (pressure.gap) note += pressure.description;
  }
  incoming =
    d.enemy <= damage && !retaliateOnDefeat
      ? 0
      : Math.max(rules === "prepared" ? 0 : 1, incoming);
  const remaining = d.hp - incoming;
  const healing =
    (rules === "prepared" || profile.mainActive) &&
    profile.main === "spring" &&
    move === "guard" &&
    profile.herbs > 0 &&
    incoming > 0 &&
    remaining > 0
      ? Math.max(0, Math.min(7, power.hp - remaining))
      : 0;
  // Historic late hazards intentionally do not recalculate lethal/healing outcomes.
  note += powerNote;
  for (const adjustment of adjustments) {
    if (adjustment.phase !== "afterHealing") continue;
    incoming += adjustment.incoming;
    note += adjustment.note ?? "";
  }
  return {
    correct,
    damage,
    incoming,
    healing,
    herbs: healing > 0 ? 1 : 0,
    note,
    effects,
  };
}
