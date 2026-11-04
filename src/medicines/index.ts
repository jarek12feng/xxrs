/** Read-only medicine definitions and purpose categories. Consumption remains with its owning rules. */
export {
  medicines,
  medicineCategories,
  getMedicine,
  listMedicines,
  medicineCategoryLabel,
} from "./catalog";
export type { MedicineCategory, MedicineId } from "./catalog";
export { quoteMedicineUse, dailyMedicineQuote, applyDailyMedicine } from './use';
export type { MedicineScene, MedicineUseContext, DailyMedicineState } from './use';
