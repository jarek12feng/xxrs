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
export const goldenGoods = {
  spirit: {
    name: "养神丹",
    hint: "金丹养神丹一枚；用于神识修行，仍受药性间隔与境界上限限制。",
    price: 48,
    category: "丹药",
    source: "炉房炼制或购药",
    art: "spirit",
  },
  temperingChest: {
    name: "温养灵材匣",
    hint: "灵草 12、玄铁料 4。用于法宝温养、器纹和炼制，需自备待养法宝。",
    price: 56,
    category: "温养材料",
    source: "采药、炉房购买玄铁料",
    art: "iron",
  },
  cultivationNotes: {
    name: "护器研修札",
    hint: "交付心得 2（上限 4，须有足够余量），达到功法研修所需心得；心得不会因研修消耗，仍须另备灵石和灵草。",
    price: 24,
    category: "研修札记",
    source: "洞府研读",
    art: "guard",
  },
  herbChest: {
    name: "外海药材匣",
    hint: "交付灵草 18，可用于炼药、温养和战前整备。",
    price: 36,
    category: "药材",
    source: "采药与现有药圃",
    art: "herbs",
  },
} as const;
export const goldenGoodsIds = Object.keys(
  goldenGoods,
) as (keyof typeof goldenGoods)[];
export type LotItem =
  | keyof typeof goldenGoods
  | Treasure
  | "healing"
  | "clarity"
  | "ward"
  | Technique;
export const lotItems: LotItem[] = [
  ...goldenGoodsIds,
  ...treasureIds,
  "healing",
  "clarity",
  "ward",
  ...bookIds,
];
export function lotInfo(item: LotItem) {
  if (Object.hasOwn(goldenGoods, item))
    return goldenGoods[item as keyof typeof goldenGoods];
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
export type Venue = "market" | "foundation" | "golden";
export const venues = {
  market: "坊市小拍",
  foundation: "筑基拍卖",
  golden: "沧澜金丹拍卖",
} as const;
export function venueError(s: State, venue: Venue) {
  if (venue === "golden") return s.realm < 2 ? "需金丹境界方可入场" : "";
  return venue === "foundation"
    ? s.realm < 1
      ? "需筑基境界方可入场"
      : ""
    : !s.realm && s.qi < 120
      ? "需炼气中期（修为 120）方可入场"
      : "";
}
