import type { State, Technique } from "../world";
import { workshopLock } from "../workshop/rules";
import {
  treasures,
  treasureIds,
  bookIds,
  lotInfo,
  venueError,
  type Treasure,
  type LotItem,
  type Venue,
} from "./catalog";
import type { Lot } from "./state";
export type TreasureAction =
  | { kind: "commission" | "refine" | "equip"; item: Treasure }
  | { kind: "unequip" }
  | { kind: "catalog"; venue: Venue }
  | { kind: "enter" | "bid" | "pass" | "leave" }
  | { kind: "budget"; value: number };
export function treasureQuote(s: State, a: TreasureAction) {
  let error = workshopLock(s),
    stones = 0,
    iron = 0,
    months = 0;
  const active = s.treasures.auction;
  if (a.kind === "commission" || a.kind === "refine" || a.kind === "equip") {
    if (!treasureIds.includes(a.item))
      return { error: "未知器物", stones, iron, months };
    const def = treasures[a.item],
      rank = s.treasures.owned[a.item];
    error ||=
      s.realm < def.realm
        ? "需筑基方能驾驭此器"
        : !s.realm && s.qi < 120
          ? "炼气中期才能驾驭辅器"
          : "";
    if (a.kind === "commission") {
      stones = def.price;
      months = 1;
      error ||= rank ? "已拥有此器" : "";
    }
    if (a.kind === "refine") {
      stones = 18;
      iron = 1;
      months = 1;
      error ||= !s.realm
        ? "筑基后方可精炼"
        : rank !== 1
          ? "需拥有尚未精炼的器物"
          : "";
    }
    if (a.kind === "equip")
      error ||= !rank
        ? "尚未拥有此器"
        : s.treasures.equipped === a.item
          ? "已装配"
          : "";
  } else if (a.kind === "unequip")
    error ||= !s.treasures.equipped ? "未装配辅器" : "";
  else if (a.kind === "catalog") {
    error ||= !["market", "foundation"].includes(a.venue)
      ? "未知会场"
      : venueError(s, a.venue);
    error ||=
      active && !active.closed
        ? "本场目录已公布，赴会或离场后再候下场"
        : s.month < s.treasures.nextMonth
          ? `下场目录在第 ${s.treasures.nextMonth} 月公布`
          : "";
  } else if (a.kind === "budget")
    error ||=
      !Number.isSafeInteger(a.value) || a.value < 0 || a.value > 1e9
        ? "预算须为非负整数"
        : !active || active.closed
          ? "先查看拍卖目录"
          : "";
  else if (["enter", "bid", "pass", "leave"].includes(a.kind)) {
    error ||=
      !active || active.closed
        ? "本场已结束或尚未公布目录"
        : venueError(s, active.venue);
    if (active && !active.closed) {
      if (a.kind === "enter") {
        months = 1;
        error ||= active.entered ? "已经入场" : "";
      }
      if (a.kind === "bid" || a.kind === "pass")
        error ||= !active.entered ? "先赴会入场" : "";
      if (a.kind === "bid") {
        const l = active.lots[active.index];
        stones = l.price + l.step;
        error ||=
          stones > active.budget ? "本次出价超过预算；可调整上限或放弃" : "";
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
  } else error ||= "未知宝物操作";
  if (
    active?.entered &&
    !active.closed &&
    ["commission", "refine", "equip", "unequip"].includes(a.kind)
  )
    error ||= "先结束本场拍卖";
  error ||=
    s.stones < stones
      ? `需要灵石 ${stones}，可劳作筹资或放弃竞拍`
      : s.workshop.iron < iron
        ? "需要玄铁料 1，可在炉房购买"
        : "";
  return { error, stones, iron, months };
}
function draw(s: State, n: number) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0;
  return s.seed % n;
}
function makeLot(s: State, pool: LotItem[]): Lot {
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
export function runTreasure(
  input: State,
  a: TreasureAction,
  id: string,
  tick: (s: State) => State,
) {
  const quote = treasureQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  for (let m = 0; m < quote.months; m++) {
    s = tick(s);
    if (s.status !== "alive" || s.pending || s.social.scene) {
      s.treasures.last = "行程中断，未扣灵石材料，也未领取拍品或器物。";
      return finish();
    }
  }
  const t = s.treasures;
  if (a.kind === "commission" || a.kind === "refine") {
    s.stones -= quote.stones;
    s.workshop.iron -= quote.iron;
    t.owned[a.item]++;
    t.last = `${treasures[a.item].name}${a.kind === "refine" ? "精炼完成" : "已收入储物袋"}，花费灵石 ${quote.stones}。装配后才生效。`;
  } else if (a.kind === "equip") {
    t.equipped = a.item;
    t.last = `已装配${treasures[a.item].name}。${treasures[a.item].hint}`;
  } else if (a.kind === "unequip") {
    t.equipped = null;
    t.last = "已卸下辅器。";
  } else if (a.kind === "catalog") {
    const gear = treasureIds.filter(
      (k) =>
        !t.owned[k] &&
        treasures[k].realm <= (a.venue === "market" ? 0 : s.realm),
    );
    const manuals = bookIds.filter((k) => !s.journey.known.includes(k));
    const drugs: LotItem[] = s.realm ? ["healing"] : ["healing", "ward"];
    if (s.sense < 12) drugs.push("clarity");
    t.auction = {
      venue: a.venue,
      lots: [
        makeLot(s, gear.length ? gear : drugs),
        makeLot(s, drugs),
        makeLot(s, manuals.length ? manuals : drugs),
      ],
      index: 0,
      entered: false,
      closed: false,
      budget: 0,
    };
    t.nextMonth = s.month + 12;
    t.last = "目录已公布。可先筹资并设置预算，赴会时耗一月。刷新不会更换拍品。";
  } else if (a.kind === "budget") {
    t.auction!.budget = a.value;
    t.last = `每口出价上限设为 ${a.value} 灵石，仍须逐次确认。`;
  } else if (a.kind === "enter") {
    t.auction!.entered = true;
    t.last = "已入拍卖会，请量力出价。未竞得不扣灵石。";
  } else if (a.kind === "leave") {
    const auction = t.auction!;
    auction.entered = true;
    for (const l of auction.lots)
      if (l.result === "waiting") l.result = "passed";
    auction.index = 3;
    auction.closed = true;
    t.nextMonth = Math.max(t.nextMonth, s.month + 12);
    t.last = "已离场，已竞得的拍品保留，其余不扣款。";
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
        s.stones -= offer;
        if (treasureIds.includes(l.item as Treasure))
          t.owned[l.item as Treasure] = 1;
        else if (bookIds.includes(l.item as Technique))
          s.journey.known.push(l.item as Technique);
        else if (l.item === "ward") s.workshop.ward++;
        else s.growth.medicines[l.item as "healing" | "clarity"]++;
        t.last = `${lotInfo(l.item).name}以 ${offer} 灵石落槌，已交付。`;
      }
    }
    if (l.result !== "waiting") auction.index++;
    if (auction.index === 3) {
      auction.closed = true;
      t.nextMonth = Math.max(t.nextMonth, s.month + 12);
      t.last += " 本场结束。";
    }
  }
  return finish();
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    s.log.unshift({
      month: s.month,
      kind:
        s.status !== "alive" || s.pending || s.social.scene
          ? "warning"
          : "major",
      text: s.treasures.last,
    });
    s.log = s.log.slice(0, 180);
    return s;
  }
}
