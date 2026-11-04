import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type State,
} from "../src/core";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { inlandTravel, routeBetween, sites } from "../src/wayfaring/routes";
import { travelQuote } from "../src/wayfaring/rules";
import { measurePath, pointAt } from "../src/presentation/movement/path";
const initial = journeyCheckpoint("male", false, "wood", "spring");
const fresh = () => structuredClone(initial);
const travel = (
  s: State,
  to: "home" | "ferry" | "snow" = "ferry",
  mode: "land" | "flight" = "land",
  id = "trip",
) =>
  dispatch(s, {
    id,
    type: "foundationJourney",
    action: { kind: "travel", destination: to, mode },
  });
it("authored distances use one rounding for a whole itinerary; all routes are symmetric", () => {
  for (const from of Object.keys(sites) as (keyof typeof sites)[])
    for (const to of Object.keys(sites) as (keyof typeof sites)[]) {
      for (const mode of ["land", "flight"] as const) {
        const a = routeBetween(from, to, mode),
          b = routeBetween(to, from, mode);
        expect(a.distance).toBe(b.distance);
        expect(a.months).toBe(b.months);
        expect(a.months).toBe(Math.ceil(a.distance / a.speed));
      }
    }
  expect(routeBetween("home", "snow", "land").months).toBe(7);
  expect(routeBetween("home", "snow", "flight").months).toBe(2);
  expect(routeBetween("home", "snow", "flight", 2).months).toBe(1);
});
it("land travel advances the agreed clock once without work income, then reaches the real story location", () => {
  const s = fresh(),
    q = travelQuote(s, "ferry");
  const n = travel(s);
  expect(n.month - s.month).toBe(q.months);
  expect(n.age - s.age).toBe(q.months);
  expect(n.stones).toBe(s.stones);
  expect(n.foundationJourney.location).toBe("ferry");
  expect(n.foundationJourney.ferry).toBe(1);
  expect(n.wayfaring.trip).toBeNull();
  expect(validState(n)).toBe(true);
  expect(travel(s)).toEqual(n);
  expect(travel(n)).toBe(n);
  expect(s).toEqual(initial);
});
it("non-sword characters learn through study and actual flight; unsupported flight and duplicate study cannot grant mastery", () => {
  const s = fresh();
  expect(travel(s, "ferry", "flight")).toBe(s);
  const n = dispatch(s, {
    id: "study",
    type: "wayfaring",
    action: { kind: "study" },
  });
  expect(n.month - s.month).toBe(1);
  expect(n.wayfaring.swordFlight).toBe("practiced");
  expect(n.journey.main).toBe(s.journey.main);
  expect(
    dispatch(n, { id: "study2", type: "wayfaring", action: { kind: "study" } }),
  ).toBe(n);
  const arrived = travel(n, "ferry", "flight");
  expect(arrived.month - n.month).toBe(1);
  expect(arrived.wayfaring.swordFlight).toBe("learned");
  expect(validState(arrived)).toBe(true);
  expect(migrateSave(arrived)).toEqual(arrived);
  expect(
    dispatch(createGame("炼气", "wood"), {
      id: "qi-study",
      type: "wayfaring",
      action: { kind: "study" },
    }).wayfaring.swordFlight,
  ).toBe("none");
});
it("flight cannot bypass the story gate or departed companions mainline", () => {
  const s = fresh();
  s.wayfaring.swordFlight = "learned";
  expect(travel(s, "snow", "flight")).toBe(s);
  s.foundationJourney.heroine.meeting = "none";
  expect(travel(s, "ferry", "flight")).toBe(s);
});
it("calendar interruption saves remaining months; reload and resume never repay spent time", () => {
  const s = fresh();
  s.journey.branch = "dan";
  s.sectContest.source = "return";
  s.sectContest.edition = 1;
  s.sectContest.announced = s.month - 119;
  s.sectContest.stage = "invited";
  s.sectContest.starts = s.month + 1;
  s.sectContest.reminded = false;
  const n = travel(s);
  expect(n.month - s.month).toBe(1);
  expect(n.foundationJourney.location).toBe("home");
  expect(n.wayfaring.trip?.remaining).toBe(2);
  expect(
    dispatch(n, { id: "work", type: "advance", activity: "work", months: 1 }),
  ).toBe(n);
  expect(travel(n, "snow", "land", "change")).toBe(n);
  expect(validState(n)).toBe(true);
  const resumed = travel(migrateSave(JSON.parse(JSON.stringify(n))), "ferry", "land", "resume");
  expect(resumed.month - s.month).toBe(3);
  expect(resumed.foundationJourney.location).toBe("ferry");
  expect(resumed.wayfaring.trip).toBeNull();
});
it("death cannot arrive or complete flight; pending events block departure and studying", () => {
  const s = fresh();
  s.limit = s.age + 1;
  const n = travel(s);
  expect(n.status).toBe("dead");
  expect(n.foundationJourney.location).toBe("home");
  expect(n.wayfaring.trip?.remaining).toBe(2);
  expect(validState(n)).toBe(true);
  const blocked = fresh();
  blocked.pending = { id: "event", kind: "letter" };
  expect(travel(blocked)).toBe(blocked);
  expect(
    dispatch(blocked, {
      id: "learn",
      type: "wayfaring",
      action: { kind: "study" },
    }),
  ).toBe(blocked);
});
it("in-progress trip cannot change mode, and abandonment retains spent months", () => {
  const s = fresh();
  s.wayfaring.swordFlight = "learned";
  const quote=inlandTravel.plan({from:'home',to:'ferry',mode:'land',traveler:{realm:1,speeds:{land:1200},effects:[]}});
  if(!quote.ok)throw Error(quote.error);
  s.wayfaring.trip = {
    plan:quote.plan,
    from: "home",
    to: "ferry",
    mode: "land",
    total: 3,
    remaining: 2,
  };
  expect(travel(s, "ferry", "flight", "switch")).toBe(s);
  const n = dispatch(s, {
    id: "cancel",
    type: "wayfaring",
    action: { kind: "cancel" },
  });
  expect(n.month).toBe(s.month);
  expect(n.wayfaring.trip).toBeNull();
  expect(n.foundationJourney.location).toBe("home");
});
it("version 31 migrates only empty travel facts; malformed current travel and future saves are rejected", () => {
  const old = { ...fresh(), version: 31 };
  delete (old as Partial<State>).wayfaring;
  const n = migrateSave(old);
  expect(n.version).toBe(34);
  expect(n.wayfaring).toEqual({ swordFlight: "none", trip: null, passage: null, last: "" });
  expect(n.seed).toBe(old.seed);
  expect(validState(n)).toBe(true);
  for (const trip of [
    { from: "home", to: "snow", mode: "land", total: 1, remaining: 1 },
    { from: "home", to: "ferry", mode: "flight", total: 1, remaining: 1 },
    { from: "home", to: "ferry", mode: "land", total: 3, remaining: 4 },
  ])
    expect(validState({ ...n, wayfaring: { ...n.wayfaring, trip } })).toBe(
      false,
    );
  expect(() => migrateSave({ ...n, version: 99 })).toThrow();
});
it("reusable path geometry handles zero-length segments and a turn at constant distance", () => {
  const path = measurePath([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(pointAt(path, 0.75)).toMatchObject({ x: 100, y: 50 });
  expect(pointAt(path, 2)).toMatchObject({ x: 100, y: 100 });
  expect(pointAt(measurePath([]), 0.5)).toMatchObject({ x: 0, y: 0 });
});
