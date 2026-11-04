import { relics } from "../equipment";
import { medicines, getMedicine } from "../medicines";
export { medicines } from "../medicines";
export const products = {
  ...medicines,
  foundation: getMedicine("foundation"),
  ward: getMedicine("ward"),
  sword: {
    name: relics.sword.name,
    hint: "装配后一阶伤害 +2、二阶伤害 +5；二阶器物辅助筑基吐纳；筑基后可精炼至二阶。",
  },
  vial: {
    name: relics.vial.name,
    hint: "装配后一阶减伤 1、二阶减伤 3；二阶器物辅助筑基吐纳；筑基后可精炼至二阶。",
  },
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
