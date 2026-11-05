import type { State } from "../world";
import { lotInfo, type LotItem } from "./catalog";
import type { Lot } from "./model";
function draw(s: State, n: number) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0;
  return s.seed % n;
}
export function makeLot(s: State, pool: LotItem[]): Lot {
  const item = pool[draw(s, pool.length)]!,
    reference = lotInfo(item).price,
    step = 2,
    opening = Math.max(4, Math.floor(reference / 2 / 2) * 2);
  const rival =
    opening + draw(s, Math.max(2, Math.floor(reference / 4))) * step;
  return {
    item,
    opening,
    price: opening - step,
    rival,
    step,
    result: "waiting",
    paid: 0,
  };
}
