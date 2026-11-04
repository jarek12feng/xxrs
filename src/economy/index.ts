export type Resource =
  "stones" | "herbs" | "iron" | "ward" | "pills" | "healing" | "clarity" | "contribution";
export type ResourceAmounts = Partial<Record<Resource, number>>;
export interface ResourceSettlement {
  cost: ResourceAmounts;
  reward: ResourceAmounts;
}
export const resourceNames: Record<Resource, string> = {
  contribution: "贡献",
  stones: "灵石",
  herbs: "灵草",
  iron: "玄铁料",
  ward: "护脉丹",
  pills: "筑基丹",
  healing: "回春散",
  clarity: "清心丹",
};
export interface ResourceContext {
  journey?: { contribution: number };
  stones: number;
  herbs: number;
  pills?: number;
  workshop?: { iron?: number; ward?: number };
  growth?: { medicines?: { healing: number; clarity: number } };
}
function balance(s: ResourceContext, key: Resource): number | undefined {
  if (key === "contribution") return s.journey?.contribution;
  if (key === "stones" || key === "herbs" || key === "pills") return s[key];
  if (key === "iron" || key === "ward") return s.workshop?.[key];
  return s.growth?.medicines?.[key];
}
function write(s: ResourceContext, key: Resource, value: number) {
  if (key === "contribution") s.journey!.contribution = value;
  else if (key === "stones" || key === "herbs" || key === "pills") s[key] = value;
  else if (key === "iron" || key === "ward") s.workshop![key] = value;
  else s.growth!.medicines![key] = value;
}
/** Rewards never finance the same action's entry cost. Validate every line before any mutation. */
export function quoteSettlement(
  s: ResourceContext,
  cost: ResourceAmounts,
  reward: ResourceAmounts = {},
) {
  const keys = [
    ...new Set([...Object.keys(cost), ...Object.keys(reward)]),
  ] as Resource[];
  const lines: {
    resource: Resource;
    before: number;
    cost: number;
    reward: number;
    after: number;
  }[] = [];
  let error = "";
  for (const key of keys) {
    const before = balance(s, key),
      debit = cost[key] ?? 0,
      credit = reward[key] ?? 0;
    if (
      !Object.hasOwn(resourceNames, key) ||
      before === undefined ||
      ![before, debit, credit].every((n) => Number.isSafeInteger(n) && n >= 0)
    ) {
      error ||= "未知资源或非法收支";
      continue;
    }
    const after = before - debit + credit;
    if (before < debit) error ||= `需要${resourceNames[key]} ${debit}`;
    if (!Number.isSafeInteger(after) || after > 1e9)
      error ||= "资源超过可保存上限";
    lines.push({ resource: key, before, cost: debit, reward: credit, after });
  }
  return { error, lines };
}
export function settleResources(
  s: ResourceContext,
  cost: ResourceAmounts,
  reward: ResourceAmounts = {},
) {
  const quote = quoteSettlement(s, cost, reward);
  if (!quote.error)
    for (const line of quote.lines) write(s, line.resource, line.after);
  return quote;
}
/** Existing chapter fact owns the claim flag; no second reward ledger is introduced. */
export function claimResources(
  s: ResourceContext,
  claimed: boolean,
  reward: ResourceAmounts,
) {
  return claimed
    ? { error: "此奖励已领取", lines: [] }
    : settleResources(s, {}, reward);
}
