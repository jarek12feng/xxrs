/** Public equipment interface. Pure TypeScript. */
export { equipmentControl, controlCosts, artifactReady, controlDescription } from "./control";
export {
  relics,
  treasures,
  treasureIds,
  tempers,
  getEquipment,
} from "./catalog";
export type {
  Relic,
  Treasure,
  Temper,
  EquipmentId,
  EquipableId,
} from "./catalog";
export type { EquipmentContext, RelicContext } from "./context";
export { equippedRelicRank, hasEquippedRelic } from "./context";
export {
  evaluateEquipment,
  equipmentPower,
  equipmentTurnEffect,
  equipmentCultivationBonus,
} from "./effects";
export type { EquipmentSituation, EquipmentContribution } from "./effects";
export {
  inspectEquipment,
  equipmentChangeError,
  applyEquipmentChange,
  previewEquipment,
} from "./operations";
export type { EquipmentChange } from "./operations";

export {
  equipmentCategories,
  listEquipment,
  equipmentCategoryLabel,
} from "./catalog";
export type { EquipmentCategory } from "./catalog";
