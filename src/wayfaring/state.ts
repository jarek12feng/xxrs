import { validJourneyPlan, type JourneyPlan } from './engine';
import { validPassage, type Passage } from "./passage";
import type { TravelDestination } from "./routes";
import type { State } from "../world";
import { routeBetween, sites, type TravelMode } from "./routes";
export interface Wayfaring {
  passage: Passage | null;
  swordFlight: "none" | "practiced" | "learned";
  trip: null | {
    from: TravelDestination;
    to: TravelDestination;
    mode: TravelMode;
    plan: JourneyPlan;
    total: number;
    remaining: number;
  };
  last: string;
}
export const freshWayfaring = (): Wayfaring => ({
  passage: null,
  swordFlight: "none",
  trip: null,
  last: "",
});
export function validWayfaring(s: State) {
  const w = s.wayfaring;
  if (
    !w ||
    !["none", "practiced", "learned"].includes(w.swordFlight) ||
    typeof w.last !== "string"
  )
    return false;
  if (!validPassage(s)) return false;
  if (w.swordFlight !== "none" && s.realm < 1) return false;
  const t = w.trip;
  if (t === null) return true;
  return (
    !!t &&
    Object.hasOwn(sites, t.from) &&
    Object.hasOwn(sites, t.to) &&
    t.from !== t.to &&
    ["land", "flight"].includes(t.mode) &&
    s.realm >= 1 &&
    !!s.foundationJourney &&
    (s.secretPact?.site === "zhaoxuan" ? "pact" : s.secretPact?.site === "brokenStele" ? "stele" : s.foundationJourney.location) === t.from &&
    (t.mode !== "flight" || w.swordFlight !== "none") &&
    Number.isInteger(t.total) &&
    validJourneyPlan(t.plan) &&
    t.plan.from === t.from && t.plan.to === t.to && t.plan.mode === t.mode &&
    t.plan.path.every(id=>Object.hasOwn(sites,id)) &&
    t.plan.fixedMonths === 0 && t.total > 0 &&
    t.plan.distance === routeBetween(t.from,t.to,t.mode,s.realm).distance &&
    t.plan.path.join(':') === routeBetween(t.from,t.to,t.mode,s.realm).path.join(':') &&
    Math.abs(t.plan.movingMonths-t.plan.distance/t.plan.speed)<1e-9 &&
    t.total === t.plan.months &&
    Number.isInteger(t.remaining) &&
    t.remaining >= 0 &&
    t.remaining <= t.total
  );
}
