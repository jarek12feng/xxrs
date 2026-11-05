import type { State } from "../world";
import { combatOwner } from "../scene-activity";
import { qiNarrativeActive } from "../qi-journey/narrative";
import type { Venue } from "./catalog";
export const auctionVenues = {
  market: {
    name: "坊市小拍",
    mapKey: "market",
    destination: "market",
    site: "market-auction",
    place: "听松山下坊市",
    period: 12,
    notice: 6,
    window: 1,
    image: "/art/auction/market-hall.webp",
    detail: "临街木厅里药香未散，木台上陈列着修士送来的灵器与丹瓶。",
  },
  foundation: {
    name: "晴川筑基拍卖",
    mapKey: "inland-estate",
    destination: "estate",
    site: "foundation-auction",
    place: "晴川药庄交易院",
    period: 60,
    notice: 12,
    window: 3,
    image: "/art/auction/foundation-hall.webp",
    detail: "晴川水道映入石厅，隔席依次亮起，陈列台上的护物阵纹缓缓流转。",
  },
  golden: {
    name: "沧澜金丹拍卖",
    mapKey: "outer-guild",
    destination: "guild",
    site: "golden-auction",
    place: "沧澜会馆",
    period: 120,
    notice: 24,
    window: 6,
    image: "/art/auction/golden-hall.webp",
    detail:
      "白玉拍台悬在护宝阵中，窗外海潮托起商盟船灯。此地十年开一场金丹拍卖。",
  },
} as const;
export const venueIds = Object.keys(auctionVenues) as Venue[];
/** Chapter locations are authoritative; stale road stages alone never grant admission. */
export function auctionLocationError(s: State, venue: Venue): string {
  const away =
    s.wayfaring.trip ||
    s.wayfaring.passage ||
    combatOwner(s) ||
    qiNarrativeActive(s) ||
    s.qiJourney.node ||
    s.secretPact.site !== "away" ||
    s.goldenCore.expedition !== "idle" ||
    (venue === "golden"
      ? s.outerSea.location !== "guild"
      : s.outerSea.location !== "home") ||
    s.conclave.location !== "away" ||
    s.lizhao.location !== "away" ||
    s.sectContest.stage === "entered" ||
    s.ascension ||
    s.nascentSoul.attempt;
  const here =
    venue === "market"
      ? s.adventure.step === "done" &&
        s.adventure.road.stage === "market" &&
        s.foundationJourney.location === "home" &&
        ["dormant", "home", "letter"].includes(s.adventure.mist.stage)
      : venue === "golden"
        ? s.realm >= 2 && s.outerSea.location === "guild"
        : s.realm >= 1 && s.foundationJourney.location === "estate";
  return away || !here
    ? `须抵达${auctionVenues[venue].place}，才能办理参拍`
    : "";
}
export function auctionSchedule(month: number, venue: Venue) {
  const def = auctionVenues[venue];
  let number = Math.max(1, Math.floor(month / def.period));
  if (month >= number * def.period + def.window) number++;
  const opens = number * def.period;
  return {
    number,
    opens,
    closes: opens + def.window,
    announces: opens - def.notice,
  };
}
