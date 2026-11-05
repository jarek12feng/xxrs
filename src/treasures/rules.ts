import { getEquipment, type EquipmentId } from "../equipment";
import { settleResources } from "../economy";
import { advanceMonths } from "../timeline";
import { equipmentChangeError, applyEquipmentChange } from "../equipment";
import type { State } from "../world";
import { workshopLock, workshopLocationError } from "../workshop/rules";
import { treasures, treasureIds, type Treasure } from "./catalog";
import {
  auctionQuote,
  applyAuction,
  isAuctionAction,
  type AuctionAction,
} from "../auction";
export type TreasureAction =
  | { kind: "deploy" | "withdraw"; item: EquipmentId }
  | { kind: "commission" | "refine" | "equip"; item: Treasure }
  | { kind: "unequip" }
  | AuctionAction;
export function isEquipmentAction(a: TreasureAction) {
  return ["equip", "unequip", "deploy", "withdraw"].includes(a.kind);
}
export function treasureQuote(s: State, a: TreasureAction) {
  if (isAuctionAction(a)) return auctionQuote(s, a);
  let error = workshopLock(s),
    stones = 0,
    iron = 0,
    months = 0;
  if (!isEquipmentAction(a)) error ||= workshopLocationError(s);
  const active = s.treasures.auction;
  if (a.kind === "deploy" || a.kind === "withdraw") {
    error ||= equipmentChangeError(s, { kind: a.kind, id: a.item });
  } else if (
    a.kind === "commission" ||
    a.kind === "refine" ||
    a.kind === "equip"
  ) {
    if (!treasureIds.includes(a.item))
      return { error: "未知器物", stones, iron, months };
    const def = treasures[a.item];
    error ||= equipmentChangeError(s, {
      kind: a.kind === "commission" ? "acquire" : a.kind,
      id: a.item,
    });
    if (a.kind === "commission") {
      stones = def.price;
      months = 1;
    }
    if (a.kind === "refine") {
      stones = 18;
      iron = 1;
      months = 1;
    }
  } else if (a.kind === "unequip")
    error ||= equipmentChangeError(s, { kind: "unequip", slot: "auxiliary" });
  else error ||= "未知宝物操作";
  if (
    active?.entered &&
    !active.closed &&
    ["commission", "refine", "equip", "unequip", "deploy", "withdraw"].includes(
      a.kind,
    )
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
export function runTreasure(
  input: State,
  a: TreasureAction,
  id: string,
  tick: (s: State) => State,
) {
  const quote = treasureQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  const elapsed = advanceMonths(s, quote.months, {
    tick,
    interrupt: (s) =>
      s.status !== "alive" || s.pending || s.social.scene ? "interrupted" : "",
  });
  s = elapsed.state;
  if (elapsed.stopped) {
    s.treasures.last = "行程中断，未扣灵石材料，也未领取拍品或器物。";
    return finish();
  }
  const t = s.treasures;
  if (a.kind === "deploy" || a.kind === "withdraw") {
    if (applyEquipmentChange(s, { kind: a.kind, id: a.item }).error)
      return input;
    t.last = `${getEquipment(a.item).name}已${a.kind === "deploy" ? "出战" : "收回"}。`;
  } else if (a.kind === "commission" || a.kind === "refine") {
    if (settleResources(s, { stones: quote.stones, iron: quote.iron }).error)
      return input;
    if (
      applyEquipmentChange(s, {
        kind: a.kind === "commission" ? "acquire" : "refine",
        id: a.item,
      }).error
    )
      return input;
    t.last = `${treasures[a.item].name}${a.kind === "refine" ? "精炼完成" : "已收入储物袋"}，花费灵石 ${quote.stones}。装配后才生效。`;
  } else if (a.kind === "equip") {
    if (applyEquipmentChange(s, { kind: "equip", id: a.item }).error)
      return input;
    t.last = `已装配${treasures[a.item].name}。${treasures[a.item].hint}`;
  } else if (a.kind === "unequip") {
    if (applyEquipmentChange(s, { kind: "unequip", slot: "auxiliary" }).error)
      return input;
    t.last = "已卸下辅器。";
  } else if (isAuctionAction(a)) {
    if (!applyAuction(s, a)) return input;
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
