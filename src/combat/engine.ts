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
  rules = "standard",
  adjustments = [],
  arrayDiscernBonus = 7,
}: ActionContext) {
  battle(d);
  pattern(e.pattern, ["guard", "strike", "discern"]);
  if(e.responses) pattern(e.responses,["guard", "strike", "discern"]);
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
  const correct = correctResponse(e,d.turn,move);
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
    // A closed core resists blind attacks; scouting or the exposed turn opens it.
    if (
      move === "strike" &&
      !(e.coreOpen ?? d.turn % e.pattern.length === 2) &&
      effect !== "discern" &&
      effect !== "guard"
    ) {
      damage = Math.max(1, damage - 8);
      incoming += 4;
      note += "阵核闭合，抢攻伤害 −8、反震 +4；先辨影或等阵核露出。";
    }

    if (d.enemy <= e.hp / 2) {
      incoming += 2;
      note += "阵核暴露，阵势转急，承伤 +2。";
    }
    if (effect === "guard" && move === "strike") {
      damage += 10;
      note += "借上合稳守蓄势，反击伤害 +10。";
    }
    if (effect === "discern") {
      damage += 6;
      incoming -= 2;
      note += "沿上合辨出的阵路，伤害 +6、承伤 −2。";
    }
    if (move === "guard") {
      damage = Math.max(1, damage - 4);
      incoming -= 4;
      note += "稳守：伤害 −4、承伤 −4；下合反击 +10。";
    }
    if (move === "discern") {
      damage = Math.max(1, damage - 3);
      note += "探阵：本合伤害 −3；下合伤害 +6、承伤 −2。";
    }
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
    d.enemy <= damage ? 0 : Math.max(rules === "prepared" ? 0 : 1, incoming);
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
