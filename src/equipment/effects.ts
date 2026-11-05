import { equipmentControl, artifactReady } from "./control";
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
  | { kind: "turn"; move: "strike" | "guard" | "discern"; correct: boolean; previousMove?: "strike" | "guard" | "discern" | "none" }
  | { kind: "challenge"; opponent: "guardian" | "raider" }
  | { kind: "road" }
  | { kind: "mist"; hazard: string };
export interface EquipmentContribution {
  source: EquipmentId;
  effect: "base" | "temper" | "auxiliary" | "attuned" | "exploration" | "focus" | "sequence" | "reforge";
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
  const control = equipmentControl(s);
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
      if (s.treasures.artifacts.includes("tideBlade") && artifactReady(s,"tideBlade"))
        add("tideBlade", "attuned", {damage:3});

      if (
        s.treasures.artifacts.includes("tideSeal") &&
        artifactReady(s, "tideSeal")
      )
        add("tideSeal", "attuned", {
          damage: equipmentCatalog.tideSeal.damage,
          armor: equipmentCatalog.tideSeal.armor,
        });
      if (
        s.treasures.artifacts.includes("spiritPearl") &&
        artifactReady(s, "spiritPearl")
      )
        add("spiritPearl", "attuned", {
          damage: equipmentCatalog.spiritPearl.damage,
          armor: equipmentCatalog.spiritPearl.armor,
        });
    }
  } else if (situation.kind === "turn") {
    const { move, correct } = situation;
    const active=(id: "tideBlade"|"tideSeal"|"spiritPearl")=>s.treasures.artifacts.includes(id)&&artifactReady(s,id);
    if (correct && active("tideBlade") && move==="strike" &&
      (situation.previousMove==="guard"||situation.previousMove==="discern"))
      add("tideBlade","sequence",{damage:10,incoming:2});
    if (correct && active("tideSeal") && s.itemGrowth?.golden?.seal && move==="guard")
      add("tideSeal","sequence",{incoming:-3});
    if (correct && active("spiritPearl") && s.itemGrowth?.golden?.pearl && move==="discern")
      add("spiritPearl","sequence",{incoming:-3});

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
    if (relic && rank && s.itemGrowth?.reforged[relic]) {
      add(
        relic,
        "reforge",
        relic === "sword"
          ? {
              damage:
                move === "strike" ? 3 : move === "discern" && correct ? 1 : 0,
            }
          : {
              incoming:
                move === "guard" ? -2 : move === "discern" && correct ? -1 : 0,
            },
      );
    }
    for (const id of s.treasures.equipped) {
      const level = s.treasures.owned[id];
      if (level) add(id, "auxiliary", resolve(auxiliaryRules[id], level));
    }
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
  if (situation.kind === "base" && control.focused && control.ids[0])
    add(control.ids[0], "focus", { damage: 2, armor: 1 });
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
  const { damage, armor } = evaluateEquipment(s, {
    kind: "base",
    includeAttuned: true,
  });
  return { damage, armor };
}
export function equipmentTurnEffect(
  s: EquipmentContext,
  move: "strike" | "guard" | "discern",
  correct: boolean,
  previousMove?: "strike" | "guard" | "discern" | "none",
) {
  const { damage, incoming, sources } = evaluateEquipment(s, {
    kind: "turn",
    move,
    correct,
    previousMove,
  });
  const reforged = sources.find(
    (source) =>
      source.effect === "reforge" && (source.damage || source.incoming),
  );
  const reforgeNote = reforged
    ? `其中${equipmentCatalog[reforged.source].name}重铸：${reforged.damage ? `伤害 +${reforged.damage}` : `承伤 ${reforged.incoming}`}（已计入器物修正；最终承伤受下限与击倒免反击影响）。`
    : "";
  const artifactNote = sources.filter(v=>v.effect==="sequence").map(v=>v.source==="tideBlade"?"潮纹剑蓄势破罡：正确反击伤害+10、承伤+2（已计入器物修正）。":v.source==="tideSeal"?"镇潮印镇压：正确守势承伤−3（已计入器物修正）。":"定神珠护识：正确辨影承伤−3（已计入器物修正）。").join("");
  return {
    damage,
    incoming,
    note:
      damage || incoming
        ? `器物修正：伤害 ${damage >= 0 ? "+" : ""}${damage}、承伤 ${incoming >= 0 ? "+" : ""}${incoming}。${reforgeNote}${artifactNote}`
        : reforgeNote + artifactNote,
  };
}
export function equipmentCultivationBonus(s: RelicContext & { realm: number }) {
  return s.realm === 1 && hasEquippedRelic(s, 2) ? 1 : 0;
}
