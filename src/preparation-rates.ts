/** Existing monthly yields, shared by settlement and preparation estimates. */
export const preparationRates = { stones: 5, herbs: 2, healing: 1 } as const;
export const monthlyStudy = (wisdom: number) => (wisdom >= 8 ? 2 : 1);

/** Earned realm abilities improve paid work; cultivation and travel never pay wages. */
export const monthlyWorkIncome = (s: { realm: number }) =>
  [5, 8, 12, 16][Math.min(3, Math.max(0, s.realm))]!;
/** Existing commissions pay for responsibility as well as physical labour. */
export const dutyIncome = (
  s: { realm: number },
  duty: "herbs" | "watch" | "copy",
) =>
  ({ herbs: 10, watch: 8, copy: 6 })[duty] +
  [0, 4, 10, 18][Math.min(3, Math.max(0, s.realm))]!;
