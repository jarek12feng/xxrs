import type { Intent, State } from "./world";

// Attribute only a committed action that actually used this route's capability.
export function routePayoff(
  before: State,
  after: State,
  intent: Intent,
): string[] {
  if (before === after || intent.type !== "mist") return [];
  const a = before.adventure.mist,
    b = after.adventure.mist;
  const route = before.adventure.road.solution;
  if (
    route === "medicine" &&
    before.adventure.rescueChoice !== "roots" &&
    intent.action === "attune" &&
    !a.garden &&
    b.garden
  )
    return [
      "青嶂关留下的草木桥，此刻有了回响：你沿用救草手法疏通药圃，本次未消耗灵草；货车仍要绕行的那条窄径，也留下了这份本领。",
    ];
  if (
    route === "array" &&
    intent.action === "decode" &&
    !a.station &&
    b.station
  )
    return [
      "与山立约时记下的归阵手法，让你读懂了废驿。这一步不再要求神识 8、心得 2 或同行协作；旧阵与名字留在山上，通行仍须等待时刻。",
    ];
  if (
    route === "sword" &&
    intent.action === "caravanBridge" &&
    !a.ward &&
    b.ward
  )
    return [
      `开山后通行的商队，如今替你架起归桥。本次灵石 −${before.stones - after.stones}，护归准备 +20；旧刻痕虽已失去，这条宽路把援手带到了雾海。`,
    ];
  return [];
}
