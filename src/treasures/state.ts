import { treasureIds, type Treasure, type Venue } from "./catalog";
import { validAuction } from "../auction/validation";
import type { Auction } from "../auction/model";
export type { Lot, Auction } from "../auction/model";
export interface Treasures {
  owned: Record<Treasure, number>;
  equipped: Treasure[];
  artifacts: ("tideSeal" | "spiritPearl" | "tideBlade")[];
  goldenKnown: boolean;
  auction: Auction | null;
  auctionArchive: Record<Venue, Auction | null>;
  nextMonth: number;
  last: string;
}
export const freshTreasures = (): Treasures => ({
  owned: { bell: 0, cord: 0, mirror: 0 },
  equipped: [],
  artifacts: [],
  goldenKnown: false,
  auction: null,
  auctionArchive: { market: null, foundation: null, golden: null },
  nextMonth: 0,
  last: "",
});
const integer = (x: unknown, max = 1e9): x is number =>
  Number.isSafeInteger(x) && (x as number) >= 0 && (x as number) <= max;
export function validTreasures(t: Treasures, realm: number, legacy = false) {
  if (
    !t ||
    !t.owned ||
    !treasureIds.every((k) => integer(t.owned[k], 2)) ||
    (!realm &&
      (t.owned.mirror > 0 || treasureIds.some((k) => t.owned[k] > 1))) ||
    (legacy
      ? t.equipped !== null &&
        (!treasureIds.includes(t.equipped as unknown as Treasure) ||
          !t.owned[t.equipped as unknown as Treasure])
      : !Array.isArray(t.equipped) ||
        new Set(t.equipped).size !== t.equipped.length ||
        t.equipped.length > 3 ||
        t.equipped.some((id) => !treasureIds.includes(id) || !t.owned[id]) ||
        !Array.isArray(t.artifacts) ||
        new Set(t.artifacts).size !== t.artifacts.length ||
        t.artifacts.length > 3 ||
        t.artifacts.some(
          (id) => !["tideSeal", "spiritPearl", "tideBlade"].includes(id),
        )) ||
    !integer(t.nextMonth) ||
    typeof t.last !== "string" ||
    t.last.length > 2000
  )
    return false;
  return validAuction(t.auction, realm, t.owned);
}
