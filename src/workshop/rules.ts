import { quoteSettlement, settleResources, type ResourceAmounts } from "../economy";
import { advanceMonths } from "../timeline";
import { applyEquipmentChange } from "../equipment";
import type { State } from "../world";
import { planOrder, type WorkshopOrder } from "./recipes";
export type { WorkshopOrder } from "./recipes";
export type WorkshopCommand = {
  id: string;
  type: "workshop";
  order: WorkshopOrder;
};
export function workshopLock(s: State): string {
  return s.wayfaring.trip || s.wayfaring.passage || s.conclave?.duel ||
    s.conclave?.location === "vault" ||
    s.outerSea?.location === "ruins" ||
    s.goldenCore?.duel ||
    s.goldenCore.expedition !== "idle" ||
    s.sectContest.duel ||
    s.status !== "alive" ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.foundationJourney.duel ||
    s.qiJourney.node
    ? "先处理眼前事件或结束历练，再回炉房准备"
    : "";
}
export function workshopLocationError(s: State): string {
  return s.conclave.location !== "away" || s.outerSea.location !== "home"
    ? "此处可调整出战器物；炼器、精炼、刻纹、委托与拍卖需回坊市"
    : "";
}
function workshopReward(order: WorkshopOrder): ResourceAmounts {
  if ("relic" in order) return {};
  switch (order.product) {
    case "foundation": return { pills: 1 };
    case "healing": case "clarity": case "spirit": case "ward": case "iron":
      return { [order.product]: 1 };
    default: return {};
  }
}
export function workshopQuote(s: State, o: WorkshopOrder) {
  const { name, effect, stones, herbs, iron, months, study, reason } =
    planOrder(s, o);
  const cost = [
    herbs ? `灵草 ${herbs}` : "",
    stones ? `灵石 ${stones}` : "",
    iron ? `玄铁料 ${iron}` : "",
  ]
    .filter(Boolean)
    .join("、");
  const error =
    workshopLock(s) ||
    (("relic" in o || o.product === "sword" || o.product === "vial")
      ? workshopLocationError(s) : "") ||
    reason ||
    (s.study < study
      ? `需要心得 ${study}；可在洞府研读，或选择委托加工`
      : "") ||
    (s.stones < stones || s.herbs < herbs || s.workshop.iron < iron
      ? `需要${cost}；灵草和玄铁料可在坊市购入`
      : "") ||
    quoteSettlement(s, { stones, herbs, iron }, workshopReward(o)).error;
  const hint = "product" in o && o.product === "clarity" && s.sense >= 12 && s.sense < 24
    ? "每颗最多增加神识 2；凝神每月增加 1 且不耗材料。接近本境或药力上限时，实际药效会减少。"
    : "";
  return { name, effect: [effect, hint].filter(Boolean).join(" "), stones, herbs, iron, months, study, cost, error };
}
export function runWorkshop(
  input: State,
  order: WorkshopOrder,
  id: string,
  tick: (s: State) => State,
): State {
  const quote = workshopQuote(input, order);
  if (quote.error) return input;
  let s = structuredClone(input);
  // Interruptions advance only time. No debit or product until the whole undertaking completes.
  const elapsed = advanceMonths(s, quote.months, { tick, interrupt: s => (s.status !== "alive" || s.pending) ? "interrupted" : "" });
  s = elapsed.state;
  if (elapsed.stopped) {
      s.log.unshift({
        month: s.month,
        kind: "warning",
        text: `${quote.name}尚未开炉：${s.status === "alive" ? "先处理来信或约定" : "寿元已尽"}。未扣材料、未领取成品。`,
      });
      s.seen = [...input.seen, id].slice(-512);
      s.log = s.log.slice(0, 180);
      return s;

  }
  const reward = workshopReward(order);
  if (settleResources(s, { stones: quote.stones, herbs: quote.herbs, iron: quote.iron }, reward).error) return input;
  if ("relic" in order) {
    if (applyEquipmentChange(s, {
      kind: "temper",
      id: order.relic,
      temper: order.temper,
    }).error) return input;
  } else
    switch (order.product) {
      case "sword":
      case "vial":
        if (applyEquipmentChange(s, {
          kind: s.journey.relics[order.product] ? "refine" : "acquire",
          id: order.product,
        }).error) return input;
        break;
      case "foundation":
        if (order.method === "craft") s.crafted++;
        break;
    }
  s.log.unshift({
    month: s.month,
    kind: "major",
    text: `${quote.name}${order.method === "buy" ? "已购入" : "炼制完成"}：${quote.cost}，耗时 ${quote.months} 月。${quote.effect}`,
  });
  s.log = s.log.slice(0, 180);
  s.seen = [...input.seen, id].slice(-512);
  return s;
}
