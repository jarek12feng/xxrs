export const tempers = {
  sword: {
    plain: { name: "原纹", hint: "保留原有攻守，无额外修正。" },
    keen: { name: "锐锋纹", hint: "反击伤害 +3、承伤 +1；其他招式不变。" },
    array: { name: "照隙纹", hint: "正确辨影伤害 +4；反击伤害 −1。" },
  },
  vial: {
    plain: { name: "原纹", hint: "保留原有攻守，无额外修正。" },
    shell: { name: "镇守纹", hint: "守势承伤 −3、伤害 −1；其他招式不变。" },
    flow: { name: "流转纹", hint: "正确辨影承伤 −2、伤害 +1；反击承伤 +1。" },
  },
} as const;
export type Temper = "plain" | "keen" | "array" | "shell" | "flow";
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
