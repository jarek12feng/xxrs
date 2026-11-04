export const medicines = {
  healing: {
    name: "回春散",
    herbs: 2,
    stones: 4,
    hint: "伤势降低 2；服用不耗月份。不能恢复交锋气势。",
  },
  clarity: {
    name: "清心丹",
    herbs: 2,
    stones: 4,
    hint: "神识 +2（上限 12）；服用不耗月份，三个月内不能再服。",
  },
} as const;

export const medicineCategories = {
  healing: "疗伤",
  energy: "回气",
  cultivation: "修炼",
  breakthrough: "突破",
  detox: "解毒",
  spirit: "神识",
  meridian: "护脉",
} as const;
export type MedicineCategory = keyof typeof medicineCategories;
/** Existing playable medicines only. Empty categories do not advertise unreleased items. */
export const medicineCatalog = {
  healing: { ...medicines.healing, categories: ["healing"] },
  clarity: { ...medicines.clarity, categories: ["spirit"] },
  ward: {
    name: "护脉丹",
    hint: "在淬脉泉或凝元内府两战之间服用：回气 26，不增伤势。每次消耗一枚，不能在交锋中服用。",
    categories: ["energy", "meridian"],
  },
  foundation: {
    name: "筑基丹",
    hint: "突破筑基必需一枚；仍须完成淬脉、凝元并积累圆满修为。",
    categories: ["breakthrough"],
  },
  goldenCore: {
    name: "凝丹丹药",
    hint: "用于凝丹叩关，每次尝试消耗一枚；须在凝丹机缘中取得主药并炼制。",
    categories: ["breakthrough"],
  },
} as const;
export type MedicineId = keyof typeof medicineCatalog;
export const getMedicine = (id: MedicineId) => medicineCatalog[id];
export function listMedicines(category?: MedicineCategory): MedicineId[] {
  return (Object.keys(medicineCatalog) as MedicineId[]).filter(
    (id) =>
      !category ||
      (medicineCatalog[id].categories as readonly MedicineCategory[]).includes(
        category,
      ),
  );
}
export function medicineCategoryLabel(id: MedicineId) {
  return medicineCatalog[id].categories
    .map((category) => medicineCategories[category])
    .join(" / ");
}
