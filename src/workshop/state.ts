import { tempers } from "../equipment";
export { tempers, type Temper } from "../equipment";
export interface Workshop {
  iron: number;
  ward: number;
  temper: {
    sword: "plain" | "keen" | "array";
    vial: "plain" | "shell" | "flow";
  };
}
export const freshWorkshop = (): Workshop => ({
  iron: 0,
  ward: 0,
  temper: { sword: "plain", vial: "plain" },
});
export function validWorkshop(
  w: Workshop,
  relics: { sword: number; vial: number },
  realm: number,
) {
  if (
    !w ||
    !relics ||
    !w.temper ||
    ![w.iron, w.ward].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1e9,
    )
  )
    return false;
  return (["sword", "vial"] as const).every(
    (r) =>
      Object.hasOwn(tempers[r], w.temper[r]) &&
      (w.temper[r] === "plain" || (realm >= 1 && relics[r] > 0)),
  );
}

export function temperInfo(w: Workshop, relic: "sword" | "vial") {
  return relic === "sword"
    ? tempers.sword[w.temper.sword]
    : tempers.vial[w.temper.vial];
}
