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
export const products = {
  ...medicines,
  foundation: {
    name: "筑基丹",
    hint: "突破筑基必需一枚；仍须完成淬脉、凝元并积累圆满修为。",
  },
  ward: {
    name: "护脉丹",
    hint: "在淬脉泉或凝元内府两战之间服用：回气 26，不增伤势。每次消耗一枚，不能在交锋中服用。",
  },
  sword: { name: "听松灵剑", hint: "装配后每阶伤害 +2；筑基后可精炼至二阶。" },
  vial: { name: "归元灵瓶", hint: "装配后每阶减伤 1；筑基后可精炼至二阶。" },
  iron: { name: "玄铁料", hint: "用于刻纹、重铸器纹。坊市常备，可直接购入。" },
} as const;
export type Product = keyof typeof products;
export type Method = "craft" | "buy" | "commission";
export function foundationCost(s: {
  wisdom: number;
  study: number;
  sense: number;
}) {
  return {
    herbs: s.wisdom >= 8 && s.study >= 2 ? 4 : 6,
    stones: s.sense >= 8 ? 8 : 12,
  };
}
