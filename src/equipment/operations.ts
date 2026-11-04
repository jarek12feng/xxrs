import {
  equipmentCatalog,
  tempers,
  type EquipableId,
  type EquipmentId,
  type Relic,
  type Temper,
  type Treasure,
} from "./catalog";
import type { EquipmentContext } from "./context";
import { evaluateEquipment, type EquipmentSituation } from "./effects";
export type EquipmentChange =
  | { kind: "equip" | "acquire" | "refine"; id: EquipableId }
  | { kind: "temper"; id: Relic; temper: Temper }
  | { kind: "unequip"; slot: "primary" | "auxiliary" };
export function inspectEquipment(s: EquipmentContext, id: EquipmentId) {
  const definition = equipmentCatalog[id];
  if (id === "tideSeal" || id === "spiritPearl")
    return {
      definition,
      rank: (
        id === "tideSeal" ? s.outerSea?.seal : (s.conclave?.depth ?? 0) >= 1
      )
        ? 1
        : 0,
      active: !!(id === "tideSeal" ? s.outerSea?.attuned : s.conclave?.attuned),
      error: "此宝由剧情取得与温养，不占主器或辅器位",
    };
  const main = id === "sword" || id === "vial";
  const rank = main ? s.journey.relics[id] : s.treasures.owned[id];
  const def = equipmentCatalog[id];
  const error =
    s.realm < def.realm
      ? "需筑基方能驾驭此器"
      : !s.realm && s.qi < def.qi
        ? "炼气中期才能驾驭辅器"
        : "";
  return {
    definition,
    rank,
    active: main ? s.journey.equipped === id : s.treasures.equipped === id,
    error,
  };
}
/** Equipment-local checks. The command owner must also enforce event locks and costs. */
export function equipmentChangeError(
  s: EquipmentContext,
  change: EquipmentChange,
): string {
  if (change.kind === "unequip")
    return !["primary", "auxiliary"].includes(change.slot)
      ? "未知装备位"
      : (change.slot === "primary" ? s.journey.equipped : s.treasures.equipped)
        ? ""
        : change.slot === "primary"
          ? "未装配主器"
          : "未装配辅器";
  if (!["equip", "acquire", "refine", "temper"].includes(change.kind))
    return "未知装备操作";
  if (
    !Object.hasOwn(equipmentCatalog, change.id) ||
    (equipmentCatalog[change.id] as { slot: string }).slot === "attuned"
  )
    return "未知器物";
  const item = inspectEquipment(s, change.id);
  if (change.kind === "temper") {
    if (
      !Object.hasOwn(tempers, change.id) ||
      !Object.hasOwn(tempers[change.id], change.temper)
    )
      return "未知器纹";
    return !item.rank
      ? "先取得此器"
      : !s.realm
        ? "筑基后可刻纹与重铸"
        : s.workshop.temper[change.id] === change.temper
          ? "已是此器纹"
          : "";
  }
  if (item.error) return item.error;
  if (change.kind === "equip")
    return !item.rank ? "尚未拥有此器" : item.active ? "已装配" : "";
  if (change.kind === "acquire") return item.rank ? "已拥有此器" : "";
  const primary = equipmentCatalog[change.id].slot === "primary";
  if (primary && !item.rank) return "尚未拥有此器";
  if (primary && item.rank >= equipmentCatalog[change.id].maxRank)
    return "已精炼至二阶";
  return !s.realm
    ? primary
      ? "筑基后可精炼"
      : "筑基后方可精炼"
    : item.rank !== 1
      ? "需拥有尚未精炼的器物"
      : "";
}
/** Mutates only equipment fields on a command-owned draft; never debits resources or advances time. */
export function applyEquipmentChange(
  s: EquipmentContext,
  change: EquipmentChange,
): { error: string } {
  const error = equipmentChangeError(s, change);
  if (error) return { error };
  if (change.kind === "unequip") {
    if (change.slot === "primary") s.journey.equipped = null;
    else s.treasures.equipped = null;
  } else if (change.kind === "temper") {
    if (change.id === "sword")
      s.workshop.temper.sword =
        change.temper as EquipmentContext["workshop"]["temper"]["sword"];
    else
      s.workshop.temper.vial =
        change.temper as EquipmentContext["workshop"]["temper"]["vial"];
  } else if (change.id === "sword" || change.id === "vial") {
    if (change.kind === "equip") s.journey.equipped = change.id;
    else s.journey.relics[change.id]++;
  } else {
    if (change.kind === "equip") s.treasures.equipped = change.id as Treasure;
    else s.treasures.owned[change.id]++;
  }
  return { error: "" };
}
/** Pure hypothetical projection. No RNG, save writes, cost payment, or input mutation. */
export function previewEquipment<T extends EquipmentContext>(
  s: T,
  changes: readonly EquipmentChange[],
  situation: EquipmentSituation = { kind: "base", includeAttuned: true },
) {
  const next = {
    ...s,
    journey: { ...s.journey, relics: { ...s.journey.relics } },
    workshop: { ...s.workshop, temper: { ...s.workshop.temper } },
    treasures: { ...s.treasures, owned: { ...s.treasures.owned } },
  } as T;
  for (const change of changes) {
    const { error } = applyEquipmentChange(next, change);
    if (error)
      return {
        error,
        next: s,
        before: evaluateEquipment(s, situation),
        after: evaluateEquipment(s, situation),
      };
  }
  return {
    error: "",
    next,
    before: evaluateEquipment(s, situation),
    after: evaluateEquipment(next, situation),
  };
}
