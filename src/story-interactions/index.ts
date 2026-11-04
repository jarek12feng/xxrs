import { resourceNames, type Resource, type ResourceAmounts } from "../economy";
export interface InteractionQuote {
  error: string;
  months?: number;
}
export interface InteractionSpec<A> {
  label: string;
  action: A;
  detail?: string;
}
/** Flat action payloads have stable IDs independent of translated labels or property order. */
export function interactionId(action: unknown) {
  return typeof action === "object" && action !== null
    ? JSON.stringify(action, Object.keys(action).sort())
    : JSON.stringify(action);
}
export function inspectInteraction<S, A, Q extends InteractionQuote>(
  state: S,
  action: A,
  quoteAction: (s: S, a: A) => Q,
) {
  const quote = quoteAction(state, action);
  const cost: ResourceAmounts = {};
  for (const key of Object.keys(resourceNames) as Resource[]) {
    const value = (quote as Record<string, unknown>)[key];
    if (typeof value === "number" && value > 0) cost[key] = value;
  }
  return {
    id: interactionId(action),
    action,
    available: !quote.error,
    error: quote.error,
    months: quote.months ?? 0,
    cost,
    quote,
  };
}
export function projectInteractions<S, A, Q extends InteractionQuote>(
  state: S,
  specs: readonly InteractionSpec<A>[],
  quote: (s: S, a: A) => Q,
) {
  return specs.map((spec) => ({
    ...spec,
    ...inspectInteraction(state, spec.action, quote),
  }));
}
/** Resolve against the current offered set and current state. Cached enabled flags are never authority. */
export function selectInteraction<S, A, Q extends InteractionQuote>(
  state: S,
  specs: readonly InteractionSpec<A>[],
  id: string,
  quote: (s: S, a: A) => Q,
) {
  const spec = specs.find((x) => interactionId(x.action) === id);
  if (!spec) return { error: "此选项已不在当前场景", action: null };
  const current = inspectInteraction(state, spec.action, quote);
  return {
    error: current.error,
    action: current.available ? spec.action : null,
  };
}
export interface InteractionReceipt {
  accepted: boolean;
  text: string;
  next: string;
}
