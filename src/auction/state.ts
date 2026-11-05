import type { State } from "../world";
import { validAuction } from "./validation";
import {
  auctionLocationError,
  auctionSchedule,
  auctionVenues,
  venueIds,
} from "./venues";
export function upgradeAuctions(s: State): State {
  s.treasures.auctionArchive = {
    market: null,
    foundation: null,
  } as State["treasures"]["auctionArchive"];
  const a = s.treasures.auction;
  if (a) {
    Object.assign(a, auctionSchedule(s.month, a.venue));
    for (const lot of a.lots)
      if (lot.result === "waiting") lot.result = "passed";
    a.entered = true;
    a.closed = true;
    a.index = 3;
    s.treasures.last =
      "拍卖现按当地会期举办。旧场已安全散场，已竞得物品和付款记录保留；未成交不扣款，请到对应会场询问下届。";
  }
  return s;
}
export function validAuctions(s: State, legacy = false): boolean {
  const ids = legacy ? venueIds.filter((v) => v !== "golden") : venueIds;
  const t = s.treasures,
    archive = t?.auctionArchive;
  if (
    !archive ||
    (legacy
      ? Object.keys(archive).length < 2 ||
        Object.keys(archive).length > 3 ||
        (archive.golden !== undefined && archive.golden !== null)
      : Object.keys(archive).length !== ids.length) ||
    !ids.every((v) => Object.hasOwn(archive, v))
  )
    return false;
  if (
    !legacy &&
    t.goldenKnown &&
    (s.realm < 2 || !s.outerSea.met || !s.goldenCore.farShore)
  )
    return false;
  if (
    !t.owned ||
    (!legacy &&
      (typeof t.goldenKnown !== "boolean" ||
        ((t.auction?.venue === "golden" ||
          archive.golden ||
          s.outerSea.location === "guild") &&
          !t.goldenKnown)))
  )
    return false;
  if (
    t.auction &&
    (!venueIds.includes(t.auction.venue) || archive[t.auction.venue] !== null)
  )
    return false;
  if (
    t.auction?.entered &&
    !t.auction.closed &&
    (s.status !== "alive" ||
      s.pending ||
      s.social.scene ||
      auctionLocationError(s, t.auction.venue))
  )
    return false;
  return (
    [t.auction, ...ids.map((v) => archive[v])].every((a) => {
      if (a === null) return true;
      if (!a || !venueIds.includes(a.venue)) return false;
      const def = auctionVenues[a.venue];
      return (
        Number.isSafeInteger(a.number) &&
        a.number > 0 &&
        a.number <= 1e9 &&
        a.opens === a.number * def.period &&
        a.closes === a.opens + def.window &&
        (!a.entered ||
          a.closed ||
          (s.month >= a.opens && s.month < a.closes)) &&
        validAuction(a, s.realm, t.owned)
      );
    }) &&
    ids.every(
      (v) =>
        !archive[v] ||
        (archive[v]!.venue === v &&
          (!archive[v]!.entered || archive[v]!.closed)),
    )
  );
}
