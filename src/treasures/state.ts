import {
  lotItems,
  treasureIds,
  type Treasure,
  type LotItem,
  type Venue,
} from "./catalog";
export interface Lot {
  item: LotItem;
  opening: number;
  price: number;
  rival: number;
  step: number;
  result: "waiting" | "won" | "passed";
  paid: number;
}
export interface Auction {
  venue: Venue;
  lots: Lot[];
  index: number;
  entered: boolean;
  closed: boolean;
  budget: number;
}
export interface Treasures {
  owned: Record<Treasure, number>;
  equipped: Treasure | null;
  auction: Auction | null;
  nextMonth: number;
  last: string;
}
export const freshTreasures = (): Treasures => ({
  owned: { bell: 0, cord: 0, mirror: 0 },
  equipped: null,
  auction: null,
  nextMonth: 0,
  last: "",
});
const integer = (x: unknown, max = 1e9): x is number =>
  Number.isSafeInteger(x) && (x as number) >= 0 && (x as number) <= max;
export function validTreasures(t: Treasures, realm: number) {
  if (
    !t ||
    !t.owned ||
    !treasureIds.every((k) => integer(t.owned[k], 2)) ||
    (!realm &&
      (t.owned.mirror > 0 || treasureIds.some((k) => t.owned[k] > 1))) ||
    (t.equipped !== null &&
      (!treasureIds.includes(t.equipped) || !t.owned[t.equipped])) ||
    !integer(t.nextMonth) ||
    typeof t.last !== "string" ||
    t.last.length > 2000
  )
    return false;
  const a = t.auction;
  if (a === null) return true;
  if (
    !a ||
    !["market", "foundation"].includes(a.venue) ||
    (a.venue === "foundation" && !realm) ||
    !Array.isArray(a.lots) ||
    a.lots.length !== 3 ||
    !integer(a.index, 3) ||
    typeof a.entered !== "boolean" ||
    typeof a.closed !== "boolean" ||
    !integer(a.budget) ||
    (a.index === 3) !== a.closed ||
    (!a.entered && a.index !== 0)
  )
    return false;
  return a.lots.every(
    (l, i) =>
      l &&
      lotItems.includes(l.item) &&
      (a.venue !== "market" || l.item !== "mirror") &&
      integer(l.opening, 100) &&
      l.opening > 0 &&
      integer(l.step, 10) &&
      l.step > 0 &&
      integer(l.price, 200) &&
      l.price >= l.opening - l.step &&
      (l.price - (l.opening - l.step)) % l.step === 0 &&
      integer(l.rival, 150) &&
      l.rival >= l.opening &&
      integer(l.paid, 200) &&
      ["waiting", "won", "passed"].includes(l.result) &&
      (i < a.index ? l.result !== "waiting" : l.result === "waiting") &&
      (l.result === "won"
        ? l.paid === l.price &&
          l.paid + l.step > l.rival &&
          (treasureIds.includes(l.item as Treasure)
            ? t.owned[l.item as Treasure] > 0
            : true)
        : l.paid === 0),
  );
}
