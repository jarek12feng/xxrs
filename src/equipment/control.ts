import { controlCapacity, spiritReadiness } from "../spirit";
import { equipmentCatalog, type EquipmentId } from "./catalog";
import type { EquipmentContext } from "./context";
export const controlCosts: Record<EquipmentId, number> = {
  sword: 2,
  vial: 2,
  bell: 2,
  cord: 2,
  mirror: 4,
  tideBlade: 10,
  tideSeal: 8,
  spiritPearl: 6,
};
export function equipmentControl(s: EquipmentContext) {
  const ids: EquipmentId[] = [
    ...(s.journey.equipped ? [s.journey.equipped] : []),
    ...s.treasures.equipped,
    ...s.treasures.artifacts,
  ];
  const capacity = controlCapacity(s.sense);
  const used = ids.reduce((total, id) => total + controlCosts[id], 0);
  return {
    ids,
    capacity,
    used,
    remaining: capacity - used,
    focused: ids.length === 1 && spiritReadiness(s).effectiveSense >= 18,
    error:
      used > capacity
        ? `御器需神识容量 ${used}，当前 ${capacity}；先卸下其他器物或修炼神识`
        : "",
  };
}
export function artifactReady(
  s: EquipmentContext,
  id: "tideSeal" | "spiritPearl" | "tideBlade",
) {
  return (
    s.realm >= 2 &&
    !!(id === "tideBlade" ? s.itemGrowth?.golden?.blade === "attuned" : id === "tideSeal"
      ? s.outerSea?.seal && s.outerSea.attuned
      : (s.conclave?.depth ?? 0) >= 1 && s.conclave?.attuned)
  );
}
export function controlDescription(s: EquipmentContext) {
  const c = equipmentControl(s);
  return `御器 ${c.used}/${c.capacity} · ${c.ids.map((id) => equipmentCatalog[id].name).join("、") || "未出战器物"}${c.focused ? " · 专御：伤害 +2、护体 +1" : ""}`;
}
