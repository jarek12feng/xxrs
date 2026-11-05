import type { State, Technique } from "../world";
import { senseLimit } from "../spirit";
import { grantTechnique } from "../techniques";
import { applyEquipmentChange } from "../equipment";
import {
  quoteSettlement,
  settleResources,
  type ResourceAmounts,
} from "../economy";
import {
  bookIds,
  treasureIds,
  treasures,
  venueError,
  lotInfo,
  type Venue,
  type Treasure,
  type LotItem,
} from "./catalog";
import type { Auction } from "./model";
import { makeLot } from "./lots";
import {
  auctionVenues,
  auctionLocationError,
  auctionSchedule,
  venueIds,
} from "./venues";
export {
  auctionVenues,
  auctionLocationError,
  auctionSchedule,
  venueIds,
} from "./venues";
export type AuctionAction =
  | { kind: "catalog"; venue: Venue }
  | { kind: "enter" | "bid" | "pass" | "leave" | "wait" }
  | { kind: "budget"; value: number };
export function isAuctionAction(a: { kind: string }): a is AuctionAction {
  return [
    "catalog",
    "enter",
    "bid",
    "pass",
    "leave",
    "wait",
    "budget",
  ].includes(a.kind);
}
export function venueAuction(s: State, venue: Venue): Auction | null {
  return s.treasures.auction?.venue === venue
    ? s.treasures.auction
    : s.treasures.auctionArchive[venue];
}
export function auctionNotice(s: State, venue: Venue) {
  const saved = venueAuction(s, venue),
    schedule = auctionSchedule(s.month, venue);
  const current =
    saved && !saved.closed && saved.closes > s.month ? saved : null;
  const next =
    saved?.closed && saved.number === schedule.number
      ? auctionSchedule(saved.closes, venue)
      : schedule;
  return {
    ...(current || next),
    saved,
    announced:
      s.month >=
      (current ? current.opens - auctionVenues[venue].notice : next.announces),
  };
}
function lotReward(item: LotItem): ResourceAmounts {
  if (item === "spirit") return { spirit: 1 };
  if (item === "temperingChest") return { herbs: 12, iron: 4 };
  if (item === "herbChest") return { herbs: 18 };
  return ["ward", "healing", "clarity"].includes(item) ? { [item]: 1 } : {};
}
export function auctionQuote(s: State, a: AuctionAction) {
  let error = "",
    stones = 0,
    months = 0;
  const active = s.treasures.auction;
  const venue = a.kind === "catalog" ? a.venue : active?.venue;
  if (!venue || !venueIds.includes(venue))
    return { error: "尚未公布目录或会场未知", stones, months, iron: 0 };
  error =
    s.status !== "alive" || s.pending || s.social.scene
      ? "先回应眼前的事情"
      : auctionLocationError(s, venue);
  error ||= venueError(s, venue);
  if (a.kind === "catalog") {
    const schedule = auctionSchedule(s.month, venue),
      saved = venueAuction(s, venue);
    if (active?.entered && !active.closed) error ||= "先结束本场拍卖";
    else if (
      saved &&
      saved.number === schedule.number &&
      s.treasures.auction === saved
    )
      error ||= saved.closed ? "本届已经散场，请候下届" : "本届目录已经公布";
    else if (s.month < schedule.announces)
      error ||= `第 ${schedule.announces} 月公布下届目录`;
  } else {
    if (!active || active.closed) error ||= "本场已结束或尚未公布目录";
    else if (a.kind !== "leave" && s.month >= active.closes)
      error ||= "本届入场已截止，请查看下届会讯";
    else if (a.kind === "budget") {
      if (!Number.isSafeInteger(a.value) || a.value < 0 || a.value > 1e9)
        error ||= "预算须为非负整数";
    } else if (a.kind === "wait") {
      months = Math.max(0, active.opens - s.month);
      if (active.entered || !months) error ||= "本届已开场，无须候会";
    } else if (a.kind === "enter") {
      if (active.entered) error ||= "已经入场";
      else if (s.month < active.opens)
        error ||= `第 ${active.opens} 月开场，尚需 ${active.opens - s.month} 月`;
    } else if (a.kind === "bid" || a.kind === "pass") {
      if (!active.entered) error ||= "先赴会入场";
      if (a.kind === "bid") {
        const l = active.lots[active.index];
        stones = l.price + l.step;
        if (l.item === "cultivationNotes" && s.study > 2)
          error ||= "已有心得充足，无须再竞拍这份研修札";
        if (stones > active.budget)
          error ||= "本次出价超过预算；可调整上限或放弃";
        error ||= quoteSettlement(s, { stones }, lotReward(l.item)).error;
        if (
          treasureIds.includes(l.item as Treasure) &&
          s.treasures.owned[l.item as Treasure]
        )
          error ||= "已经拥有此器，可放弃本拍";
        if (
          bookIds.includes(l.item as Technique) &&
          s.journey.known.includes(l.item as Technique)
        )
          error ||= "已经学会此功法，可放弃本拍";
      }
    }
  }
  return { error, stones, months, iron: 0 };
}
/** Mutates only the command's private draft. Caller discards the draft on any failed delivery. */
export function applyAuction(s: State, a: AuctionAction): boolean {
  const t = s.treasures;
  if (a.kind === "catalog") {
    const schedule = auctionSchedule(s.month, a.venue),
      old = venueAuction(s, a.venue);
    if (t.auction && t.auction.venue !== a.venue)
      t.auctionArchive[t.auction.venue] = t.auction;
    t.auctionArchive[a.venue] = null;
    if (old && old.number === schedule.number) {
      t.auction = old;
      t.last = "已展开本届原目录，拍品和进度保持不变。";
      return true;
    }
    const gear = treasureIds.filter(
      (k) =>
        !t.owned[k] && treasures[k].realm <= (a.venue === "market" ? 0 : 1),
    );
    const manuals = bookIds.filter((k) => !s.journey.known.includes(k));
    const drugs: LotItem[] =
      a.venue === "market" ? ["healing", "ward"] : ["healing", "ward"];
    if (s.sense < Math.min(24, senseLimit(s.realm, s.spirit)))
      drugs.push("clarity");
    // Prefer a different unique lot next time when alternatives actually exist.
    const varied = (pool: LotItem[], index: number) =>
      pool.length > 1 ? pool.filter((k) => k !== old?.lots[index]?.item) : pool;
    t.auction = {
      venue: a.venue,
      ...schedule,
      lots: [
        makeLot(
          s,
          a.venue === "golden"
            ? ["temperingChest"]
            : varied(gear.length ? gear : drugs, 0),
        ),
        makeLot(
          s,
          a.venue === "golden"
            ? s.sense < senseLimit(s.realm, s.spirit)
              ? ["spirit", "herbChest"]
              : ["herbChest"]
            : drugs,
        ),
        makeLot(
          s,
          a.venue === "golden"
            ? varied(
                s.study <= 2
                  ? ["cultivationNotes", "herbChest"]
                  : ["herbChest"],
                2,
              )
            : varied(manuals.length ? manuals : drugs, 2),
        ),
      ],
      index: 0,
      entered: false,
      closed: false,
      budget: 0,
    };
    t.nextMonth =
      schedule.opens +
      auctionVenues[a.venue].period -
      auctionVenues[a.venue].notice;
    t.last = `第 ${schedule.number} 届目录已公布，第 ${schedule.opens} 月开场，第 ${schedule.closes} 月截止入场。可先离开筹资，本届拍品不变。`;
  } else if (a.kind === "budget") {
    t.auction!.budget = a.value;
    t.last = `每口出价上限设为 ${a.value} 灵石。`;
  } else if (a.kind === "wait") {
    t.last = "候会结束，可入席参拍。";
  } else if (a.kind === "enter") {
    t.auction!.entered = true;
    t.last = "你已入席。成交才扣灵石，关闭面板后可继续本场。";
  } else if (a.kind === "leave") {
    const auction = t.auction!;
    auction.entered = true;
    for (const l of auction.lots)
      if (l.result === "waiting") l.result = "passed";
    auction.index = 3;
    auction.closed = true;
    t.last = "已退出本届，已竞得拍品保留，其余不扣款；本届不能重新参拍。";
  } else if (a.kind === "bid" || a.kind === "pass") {
    const auction = t.auction!,
      l = auction.lots[auction.index];
    if (a.kind === "pass") {
      l.result = "passed";
      t.last = `放弃${lotInfo(l.item).name}，未扣灵石。`;
    } else {
      const offer = l.price + l.step;
      if (offer + l.step <= l.rival) {
        l.price = offer + l.step;
        t.last = `另一位买家出价 ${l.price} 灵石。你尚未付款，可以继续或放弃。`;
      } else {
        l.price = offer;
        l.paid = offer;
        l.result = "won";
        if (settleResources(s, { stones: offer }, lotReward(l.item)).error)
          return false;
        if (treasureIds.includes(l.item as Treasure)) {
          if (
            applyEquipmentChange(s, { kind: "acquire", id: l.item as Treasure })
              .error
          )
            return false;
        } else if (bookIds.includes(l.item as Technique)) {
          if (!grantTechnique(s, l.item as Technique)) return false;
        }
        if (l.item === "cultivationNotes") {
          if (s.study > 2) return false;
          s.study += 2;
        }
        t.last = `${lotInfo(l.item).name}以 ${offer} 灵石落槌，已交付。`;
      }
    }
    if (l.result !== "waiting") auction.index++;
    if (auction.index === 3) {
      auction.closed = true;

      t.last += " 本场结束。";
    }
  }
  return true;
}
/** Advisory only: ordinary auctions never interrupt cultivation or travel automatically. */
export function auctionTimingWarnings(s: State, months: number): string[] {
  return venueIds.flatMap((v) => {
    const saved = venueAuction(s, v);
    const a =
      saved && !saved.closed && saved.closes > s.month
        ? saved
        : v === "golden" && s.treasures.goldenKnown
          ? { ...auctionNotice(s, v), closed: false, entered: false }
          : null;
    return a &&
      !a.closed &&
      !a.entered &&
      s.month < a.closes &&
      s.month + months >= a.closes
      ? [
          `本次安排可能错过${auctionVenues[v].name}第 ${a.number} 届（第 ${a.closes} 月截止入场）。若要赴会，请缩短安排并预留路程；继续则等候下届。`,
        ]
      : [];
  });
}
