import {
  equipmentCatalog,
  temperRules,
  auxiliaryRules,
  type TurnRule,
  type EquipmentId,
} from "./catalog";
import {
  equippedRelicRank,
  hasEquippedRelic,
  type EquipmentContext,
  type RelicContext,
} from "./context";
export type EquipmentSituation =
  | { kind: "base"; includeAttuned?: boolean }
  | { kind: "turn"; move: "strike" | "guard" | "discern"; correct: boolean }
  | { kind: "challenge"; opponent: "guardian" | "raider" }
  | { kind: "road" }
  | { kind: "mist"; hazard: string };
export interface EquipmentContribution {
  source: EquipmentId;
  effect: "base" | "temper" | "auxiliary" | "attuned" | "exploration";
  damage: number;
  armor: number;
  incoming: number;
  chance: number;
  injuryReduction: number;
}
export function evaluateEquipment(
  s: EquipmentContext,
  situation: EquipmentSituation,
) {
  const sources: EquipmentContribution[] = [];
  const add = (
    source: EquipmentId,
    effect: EquipmentContribution["effect"],
    values: Partial<Omit<EquipmentContribution, "source" | "effect">>,
  ) => {
    sources.push({
      source,
      effect,
      damage: 0,
      armor: 0,
      incoming: 0,
      chance: 0,
      injuryReduction: 0,
      ...values,
    });
  };
  const relic = s.journey.equipped;
  const rank = equippedRelicRank(s);
  if (situation.kind === "base") {
    if (relic && rank) {
      const def = equipmentCatalog[relic];
      add(relic, "base", {
        damage: def.damage[rank] ?? 0,
        armor: def.armor[rank] ?? 0,
      });
    }
    if (situation.includeAttuned) {
      if (s.outerSea?.attuned)
        add("tideSeal", "attuned", {
          damage: equipmentCatalog.tideSeal.damage,
          armor: equipmentCatalog.tideSeal.armor,
        });
      if (s.conclave?.attuned)
        add("spiritPearl", "attuned", {
          damage: equipmentCatalog.spiritPearl.damage,
          armor: equipmentCatalog.spiritPearl.armor,
        });
    }
  } else if (situation.kind === "turn") {
    const { move, correct } = situation;
    const temper = relic ? s.workshop.temper[relic] : "plain";
    const resolve = (rules: readonly TurnRule[], level: number) => {
      let damage = 0,
        incoming = 0;
      for (const rule of rules)
        if (
          rule.move === move &&
          (rule.correct === undefined || rule.correct === correct)
        ) {
          damage += rule.damage?.[level] ?? 0;
          incoming += rule.incoming?.[level] ?? 0;
        }
      return { damage, incoming };
    };
    if (relic && rank) add(relic, "temper", resolve(temperRules[temper], rank));
    const id = s.treasures.equipped;
    const level = id ? s.treasures.owned[id] : 0;
    if (id && level) add(id, "auxiliary", resolve(auxiliaryRules[id], level));
  } else if (relic && rank) {
    if (situation.kind === "challenge")
      add(relic, "exploration", {
        chance:
          (rank === 2 ? 32 : 10) +
          ((relic === "vial" && situation.opponent === "guardian") ||
          (relic === "sword" && situation.opponent === "raider")
            ? 8
            : 0),
        injuryReduction: relic === "vial" ? 1 : 0,
      });
    if (situation.kind === "road")
      add(relic, "exploration", {
        chance: rank * 10 + (relic === "vial" ? 10 : 0),
      });
    if (situation.kind === "mist")
      add(relic, "exploration", {
        chance:
          rank *
          (relic === (situation.hazard === "wind" ? "sword" : "vial") ? 6 : 3),
      });
  }
  const total = {
    damage: 0,
    armor: 0,
    incoming: 0,
    chance: 0,
    injuryReduction: 0,
  };
  for (const item of sources)
    for (const key of Object.keys(total) as (keyof typeof total)[])
      total[key] += item[key];
  return { ...total, sources };
}
export function equipmentPower(s: EquipmentContext) {
  const { damage, armor } = evaluateEquipment(s, { kind: "base" });
  return { damage, armor };
}
export function equipmentTurnEffect(
  s: EquipmentContext,
  move: "strike" | "guard" | "discern",
  correct: boolean,
) {
  const { damage, incoming } = evaluateEquipment(s, {
    kind: "turn",
    move,
    correct,
  });
  return {
    damage,
    incoming,
    note:
      damage || incoming
        ? `器物修正：伤害 ${damage >= 0 ? "+" : ""}${damage}、承伤 ${incoming >= 0 ? "+" : ""}${incoming}。`
        : "",
  };
}
export function equipmentCultivationBonus(s: RelicContext & { realm: number }) {
  return s.realm === 1 && hasEquippedRelic(s, 2) ? 1 : 0;
}
