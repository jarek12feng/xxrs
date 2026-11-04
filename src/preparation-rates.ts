/** Existing monthly yields, shared by settlement and preparation estimates. */
export const preparationRates = { stones: 5, herbs: 2, healing: 1 } as const;
export const monthlyStudy = (wisdom: number) => (wisdom >= 8 ? 2 : 1);
