import type { LotItem, Venue } from "./catalog";
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
  number: number;
  opens: number;
  closes: number;
  lots: Lot[];
  index: number;
  entered: boolean;
  closed: boolean;
  budget: number;
}
