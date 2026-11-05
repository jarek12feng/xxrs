import {
  goldenGoodsIds,
  lotItems,
  treasureIds,
  type Treasure,
} from "./catalog";
import type { Auction } from "./model";
const integer = (x: unknown, max = 1e9): x is number =>
  Number.isSafeInteger(x) && (x as number) >= 0 && (x as number) <= max;
export function validAuction(
  a: Auction | null,
  realm: number,
  owned: Record<Treasure, number>,
): boolean {
  if (a === null) return true;
  if (
    !a ||
    !["market", "foundation", "golden"].includes(a.venue) ||
    (a.venue === "foundation" && !realm) ||
    (a.venue === "golden" && realm < 2) ||
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
      (a.venue === "golden"
        ? goldenGoodsIds.includes(
            l.item as keyof typeof import("./catalog").goldenGoods,
          )
        : !goldenGoodsIds.includes(
            l.item as keyof typeof import("./catalog").goldenGoods,
          )) &&
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
            ? owned[l.item as Treasure] > 0
            : true)
        : l.paid === 0),
  );
}
