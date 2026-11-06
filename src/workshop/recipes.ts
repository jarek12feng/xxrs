import { preservedHerbSaving } from "../item-growth/state";
import { equipmentChangeError } from "../equipment";
import type { State } from "../world";
import { hasFoundationRecipe } from "../foundation";
import {
  foundationCost,
  medicines,
  products,
  type Product,
  type Method,
} from "./catalog";
import { tempers, type Temper } from "./state";
export type WorkshopOrder =
  | { product: Product; method: Method }
  | { relic: "sword" | "vial"; temper: Temper; method: "craft" | "commission" };
export function planOrder(s: State, o: WorkshopOrder) {
  let stones = 0,
    herbs = 0,
    iron = 0,
    months = 0,
    study = 0,
    reason = "",
    name = "",
    effect = "";
  const method = o.method;
  if (!["craft", "buy", "commission"].includes(method)) reason = "未知制作方式";
  if ("relic" in o) {
    if (
      !Object.hasOwn(tempers, o.relic) ||
      !Object.hasOwn(tempers[o.relic], o.temper) ||
      method === "buy"
    )
      reason = "未知器纹";
    else {
      const item =
        tempers[o.relic][o.temper as keyof (typeof tempers)[typeof o.relic]];
      name = `${products[o.relic].name}·${item.name}`;
      effect = item.hint;
      stones = method === "craft" ? 8 : 20;
      iron = 1;
      months = 1;
      study = method === "craft" ? 2 : 0;
      reason = equipmentChangeError(s, {
        kind: "temper",
        id: o.relic,
        temper: o.temper,
      });
    }
  } else if (!Object.hasOwn(products, o.product)) reason = "未知丹方或器谱";
  else {
    const p = o.product;
    name = products[p].name;
    effect = products[p].hint;
    if(p==="foundation")effect += " 每炉另耗玉髓芝主药1株，温养丹液六个月。";
    if (p === "iron") {
      stones = 8;
      if (method !== "buy") reason = "玄铁料从坊市购入";
    } else if (p === "sword" || p === "vial") {
      const rank = s.journey.relics[p];
      stones =
        method === "craft"
          ? rank
            ? 16
            : 24
          : method === "commission"
            ? rank
              ? 20
              : 28
            : 40;
      herbs = method === "buy" ? 0 : 4;
      months = method === "buy" ? 0 : 1;
      study = method === "craft" ? 2 : 0;
      name = `${rank ? "精炼" : ""}${name}`;
      if (method === "buy" && rank) reason = "已持有此器，可选择精炼或刻纹";
      else
        reason = equipmentChangeError(s, {
          kind: rank ? "refine" : "acquire",
          id: p,
        });
      // Ordinary metal and furnace fuel are included in the fee; herbs temper the spirit channels.
    } else {
      const cost =
        p === "foundation"
          ? foundationCost(s)
          : p === "ward"
            ? { herbs: 3, stones: 6 }
            : medicines[p];
      herbs = method === "buy" ? 0 : cost.herbs;
      stones =
        method === "buy"
          ? p === "ward"
            ? 20
            : p === "spirit" ? 48 : 12
          : cost.stones +
            (method === "commission"
              ? p === "foundation"
                ? 12
                : p === "ward"
                  ? 4
                  : 2
              : 0);
      months = method === "buy" ? 0 : p === "foundation" ? 6 : 1;
      study =
        method === "craft"
          ? p === "ward"
            ? 2
            : p === "foundation"
              ? 4
              : 1
          : 0;
      if (p === "spirit" && s.realm < 2) reason = "金丹后方可筹备养神丹";
      else if (p === "foundation" && method === "buy")
        reason = "坊市不出售筑基丹；取得遗府丹方后可自炼或委托";
      else if (p === "foundation" && !hasFoundationRecipe(s))
        reason = "先闯过青石遗府，取得筑基丹方";
      else if (p === "foundation" && !s.qiJourney.cultivation.roots)
        reason = "缺少玉髓芝主药；凝元后循内府药图亲自探采，普通灵草不能替代";
      else if (p === "foundation" && method === "craft" && s.sense < 8)
        reason = "自行控火需神识8；也可携主药委托丹师";
      else if (p === "ward" && !s.realm && s.qi < 120)
        reason = "炼气中期开始筹备护脉丹";
    }
  }
  const saved = "product" in o ? Math.min(herbs, preservedHerbSaving(s.itemGrowth, o.product, method)) : 0;
  if (saved) { herbs -= saved; effect += ` 栖尘戒内层隔存药材，本炉节省灵草${saved}。`; }
  return { name, effect, stones, herbs, iron, months, study, reason };
}
