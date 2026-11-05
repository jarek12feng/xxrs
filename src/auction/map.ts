import type { State } from "../world";
import { knowsLandmark } from "../wayfaring/discovery";
import { auctionNotice, venueAuction } from "./index";
import { auctionVenues, auctionLocationError, venueIds } from "./venues";
import { venueError, type Venue } from "./catalog";
import { formatLifeMonths } from "../progression";
/** Nested facilities share their host's road; they are not teleport destinations. */
export function auctionVenueAt(place: string): Venue | undefined {
  return venueIds.find(
    (v) =>
      auctionVenues[v].mapKey === place ||
      auctionVenues[v].destination === place ||
      auctionVenues[v].site === place,
  );
}
export function auctionMapInfo(s: State, place: string, months?: number) {
  const venue = auctionVenueAt(place);
  if (!venue) return null;
  const def = auctionVenues[venue];
  if (!knowsLandmark(s, def.mapKey) && !venueAuction(s, venue)) return null;
  const here = !auctionLocationError(s, venue),
    saved = venueAuction(s, venue);
  const schedule = auctionNotice(s, venue),
    known = !!saved || here || (venue === "golden" && s.treasures.goldenKnown);
  const arrivalMonth = months === undefined ? null : s.month + months;
  const arrival =
    !known || arrivalMonth === null
      ? ""
      : saved?.entered && !saved.closed
        ? "已在本场竞价中，结束或退出后才能继续行旅。"
        : arrivalMonth >= schedule.closes
          ? `预计第 ${arrivalMonth} 月抵达，将错过第 ${schedule.number} 届；须等后续会期。`
          : arrivalMonth < schedule.opens
            ? `预计第 ${arrivalMonth} 月抵达，距开场尚有 ${formatLifeMonths(schedule.opens - arrivalMonth)}。`
            : `预计第 ${arrivalMonth} 月抵达，仍在本届入场窗口内。`;
  return {
    venue,
    name: def.name,
    place: def.place,
    image: def.image,
    here,
    cadence: `每${formatLifeMonths(def.period)}一届 · 入场窗口${formatLifeMonths(def.window)}`,
    timing: known
      ? `第 ${schedule.number} 届：第 ${schedule.opens} 月开场，第 ${schedule.closes} 月截止入场。`
      : "尚未收到会讯；抵达当地后向管事询问会期与目录。",
    admission: venueError(s, venue),
    arrival,
    directions:
      venue === "golden"
        ? "从外海古渡循商盟航路前往沧澜会馆，单程两个月；泊岸后进入拍卖厅。"
        : venue === "market"
          ? "沿坊市现有归路抵达，在当地点选「坊市拍卖行」。"
          : "沿内陆药路抵达晴川药庄，在当地点选「晴川交易院 · 拍卖行」。",
  };
}
