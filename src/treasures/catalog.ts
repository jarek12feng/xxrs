import type { State, Technique } from "../world";
import { treasures, treasureIds, type Treasure } from "../equipment";
export { treasures, treasureIds, type Treasure } from "../equipment";
export const books: Record<Technique, string> = {
  spring: "长春诀",
  blade: "听松剑经",
  breath: "归元息",
  herb: "辨草录",
  guard: "护身诀",
  lantern: "照夜篇",
};
export const bookIds = Object.keys(books) as Technique[];
export type LotItem = Treasure | "healing" | "clarity" | "ward" | Technique;
export const lotItems: LotItem[] = [
  ...treasureIds,
  "healing",
  "clarity",
  "ward",
  ...bookIds,
];
export function lotInfo(item: LotItem) {
  if (Object.hasOwn(treasures, item))
    return {
      ...treasures[item as Treasure],
      category: "灵器",
      source: "坊市委托",
    };
  if (Object.hasOwn(books, item))
    return {
      name: books[item as Technique],
      hint: "竞得即学会，可到功法页装配；不自动替换当前功法。",
      price: 20,
      category: "功法",
      source: "坊市求教（另需心得 2）",
    };
  return item === "healing"
    ? {
        name: "回春散",
        hint: "服用降低伤势 2。",
        price: 12,
        category: "药物",
        source: "炉房购药",
      }
    : item === "clarity"
      ? {
          name: "清心丹",
          hint: "神识 +2；药力上限 24，不超本境上限；服药间隔三月。",
          price: 12,
          category: "丹药",
          source: "炉房购药",
        }
      : {
          name: "护脉丹",
          hint: "炼气秘境两战之间回气 26；筑基可用于药庄行前准备。",
          price: 20,
          category: "丹药",
          source: "炉房购药",
        };
}
export type Venue = "market" | "foundation";
export const venues = { market: "坊市小拍", foundation: "筑基拍卖" } as const;
export function venueError(s: State, venue: Venue) {
  return venue === "foundation"
    ? s.realm < 1
      ? "需筑基境界方可入场"
      : ""
    : !s.realm && s.qi < 120
      ? "需炼气中期（修为 120）方可入场"
      : "";
}
