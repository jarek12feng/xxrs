import { settleResources } from "../economy";
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
  return s.conclave?.duel ||
    s.conclave?.location === "vault" ||
    s.outerSea?.location === "ruins" ||
    s.goldenCore?.duel ||
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
    reason ||
    (s.study < study
      ? `需要心得 ${study}；可在洞府研读，或选择委托加工`
      : "") ||
    (s.stones < stones || s.herbs < herbs || s.workshop.iron < iron
      ? `需要${cost}；灵草和玄铁料可在坊市购入`
      : "");
  return { name, effect, stones, herbs, iron, months, study, cost, error };
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
  if (settleResources(s, { stones: quote.stones, herbs: quote.herbs, iron: quote.iron }).error) return input;
  if ("relic" in order) {
    applyEquipmentChange(s, {
      kind: "temper",
      id: order.relic,
      temper: order.temper,
    });
  } else
    switch (order.product) {
      case "healing":
      case "clarity":
        s.growth.medicines[order.product]++;
        break;
      case "ward":
        s.workshop.ward++;
        break;
      case "iron":
        s.workshop.iron++;
        break;
      case "sword":
      case "vial":
        applyEquipmentChange(s, {
          kind: s.journey.relics[order.product] ? "refine" : "acquire",
          id: order.product,
        });
        break;
      case "foundation":
        s.pills++;
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
