import type { State, Intent } from "../world";
/** Long sea journeys retain their own command and remaining time across events/reloads.
 * No second position is stored: the chapter remains at its last safe origin. */
export const passageRoutes = {
  "sea:sail": { from: "home", to: "ferry", months: 6 },
  "sea:home": { from: "ferry", to: "home", months: 6 },
  "sea:enter": { from: "ferry", to: "ruins", months: 2 },
  "sea:return": { from: "ruins", to: "ferry", months: 1 },
  "conclave:visit": { from: "away", to: "court", months: 2 },
  "conclave:leave": { from: "court", to: "away", months: 2 },
  "conclave:enter": { from: "court", to: "vault", months: 2 },
} as const;
export type PassageRoute = keyof typeof passageRoutes;
export interface Passage {
  route: PassageRoute;
  total: number;
  remaining: number;
}
export function passageKey(
  domain: "sea" | "conclave",
  kind: string,
): PassageRoute | null {
  const key = `${domain}:${kind}`;
  return Object.hasOwn(passageRoutes, key) ? (key as PassageRoute) : null;
}
export function passageTotal(s: State, route: PassageRoute) {
  return route === "conclave:enter" && s.conclave.route === "shelter"
    ? 6
    : passageRoutes[route].months;
}
export function passageIntent(route: PassageRoute): Intent {
  const [domain, kind] = route.split(":");
  return {
    type: domain === "sea" ? "outerSea" : "conclave",
    action: { kind },
  } as Intent;
}
export function isPassageContinuation(s: State, intent: Intent) {
  const p = s.wayfaring.passage;
  return (
    !!p &&
    (intent.type === "outerSea" || intent.type === "conclave") &&
    passageKey(
      intent.type === "outerSea" ? "sea" : "conclave",
      intent.action.kind,
    ) === p.route
  );
}
export function passageError(s: State, route: PassageRoute | null) {
  return s.wayfaring.passage && s.wayfaring.passage.route !== route
    ? "先继续当前航程，或明确放弃此行"
    : "";
}
export function passageMonths(
  s: State,
  route: PassageRoute | null,
  fallback: number,
) {
  return route && s.wayfaring.passage?.route === route
    ? s.wayfaring.passage.remaining
    : fallback;
}
export function validPassage(s: State) {
  const p = s.wayfaring.passage;
  if (p === null) return true;
  if (
    !p ||
    !Object.hasOwn(passageRoutes, p.route) ||
    s.wayfaring.trip ||
    s.realm !== 2 ||
    !s.goldenCore.farShore
  )
    return false;
  const sea = p.route.startsWith("sea:");
  return (
    (sea ? s.outerSea.location : s.conclave.location) ===
      passageRoutes[p.route].from &&
    (sea
      ? !s.outerSea.duel && s.conclave.location === "away"
      : !s.conclave.duel && s.outerSea.location === "ferry") &&
    Number.isInteger(p.total) &&
    p.total === passageTotal(s, p.route) &&
    Number.isInteger(p.remaining) &&
    p.remaining >= 0 &&
    p.remaining <= p.total
  );
}
/** Caller owns qualification and final arrival/rewards. This only advances the clock. */
export function advancePassage(
  input: State,
  route: PassageRoute,
  tick: (s: State) => State,
  interrupted: (s: State) => unknown,
) {
  let s = structuredClone(input);
  s.wayfaring.passage ??= {
    route,
    total: passageTotal(s, route),
    remaining: passageTotal(s, route),
  };
  while (s.wayfaring.passage!.remaining > 0) {
    s = tick(s);
    s.wayfaring.passage!.remaining--;
    if (interrupted(s)) return { state: s, stopped: true };
  }
  s.wayfaring.passage = null;
  return { state: s, stopped: false };
}
