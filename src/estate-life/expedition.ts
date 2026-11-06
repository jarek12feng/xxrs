import type { ResourceAmounts } from "../economy";
import type { State } from "../world";
import { growthQuote } from "../foundation-journey/growth";
import { workshopQuote } from "../workshop/rules";
import { medicineError } from "../growth";
/** The snow route owns qualification/costs. This is only a connection to existing preparation sources. */
export function snowSupplyView(s: State) {
  const q = s.foundationJourney;
  if (
    s.realm !== 1 ||
    q.ferry < 4 ||
    q.cultivation < 200 ||
    !["estate", "snow"].includes(q.location) ||
    s.secretPact.site !== "away"
  )
    return null;
  const route = q.growth.routes.snow;
  const won = q.won.includes("deer");
  // Other routes already solved the material bottleneck: do not invent a new required expedition.
  if (q.location === "estate" && q.growth.refined && !route.prepared && !won)
    return null;
  const self = growthQuote(s, {
    kind: "routePrepare",
    route: "snow",
    method: "supplies",
  });
  const cost: ResourceAmounts = self.settlement.cost;
  return {
    title: won
      ? "雪线归来 · 整理补给"
      : route.prepared
        ? "雪线行前 · 药与退路"
        : "雪线备行 · 护寒物资",
    purpose: won
      ? "寒髓晶已由你亲自取得。返庄可按下一程所需补药，已得成果不必重领。"
      : route.prepared
        ? "护寒整备已完成。交锋仍需看清来势，药物不能代替应对。"
        : "雪线可争取寒髓晶，用于凝练中期灵元。自备护寒是一种准备办法，灵器、通达功法或当地租阵也可应对寒流。",
    prepared: route.prepared,
    won,
    cost,
    missing: {
      ward: Math.max(0, (cost.ward ?? 0) - s.workshop.ward),
      herbs: Math.max(0, (cost.herbs ?? 0) - s.herbs),
      stones: Math.max(0, (cost.stones ?? 0) - s.stones),
    },
    herbUse:
      s.journey.main === "spring"
        ? "当前主修长春诀：交锋中灵草可用于守势续航；用来炼丹的药材不能同时留作战中补给。"
        : "灵草可留作原有炼丹与行前整备；当前主修不以长春守势耗草回血。",
    orders: (
      [
        { product: "ward", method: "craft" },
        { product: "ward", method: "buy" },
        ...(s.injury
          ? ([
              { product: "healing", method: "craft" },
              { product: "healing", method: "buy" },
            ] as const)
          : []),
      ] as const
    ).map((order) => ({ order, quote: workshopQuote(s, order) })),
    healingError: medicineError(s, "healing", true),
  };
}
