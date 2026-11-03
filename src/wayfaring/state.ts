import { validPassage, type Passage } from "./passage";
import type { Destination } from "../foundation-journey/state";
import type { State } from "../world";
import { routeBetween, sites, type TravelMode } from "./routes";
export interface Wayfaring {
  passage: Passage | null;
  swordFlight: "none" | "practiced" | "learned";
  trip: null | {
    from: Destination;
    to: Destination;
    mode: TravelMode;
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
    s.foundationJourney.location === t.from &&
    (t.mode !== "flight" || w.swordFlight !== "none") &&
    Number.isInteger(t.total) &&
    t.total === routeBetween(t.from, t.to, t.mode, s.realm).months &&
    Number.isInteger(t.remaining) &&
    t.remaining >= 0 &&
    t.remaining <= t.total
  );
}
