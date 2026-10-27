import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  freshRoad,
  roadDetails,
  roadError,
  preparationError,
  type State,
  type Intent,
  type RoadAction,
  type AdventureAction,
} from "../src/core";

function session(seed = 1) {
  let s = createGame("行路人", "wood", seed),
    id = 0;
  const send = (intent: Intent) => {
    const before = structuredClone(s);
    const next = dispatch(s, { ...intent, id: `road-${++id}` });
    expect(s).toEqual(before);
    expect(validState(next)).toBe(true);
    s = next;
    return s;
  };
  const road = (action: RoadAction) => send({ type: "road", action });
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as AdventureAction[])
    send({ type: "adventure", action });
  return {
    get state() {
      return s;
    },
    send,
    road,
  };
}
function atPass(seed = 1) {
  const p = session(seed);
  for (const a of ["thanks", "market", "talk", "accept"] as RoadAction[])
    p.road(a);
  p.send({ type: "supplies" });
  p.road("deliver");
  p.road("pass");
  p.road("inspect");
  return p;
}
it("requires the rescue and lets the returned world remember it without extra rewards", () => {
  const start = createGame("客", "wood");
  expect(dispatch(start, { id: "bad", type: "road", action: "thanks" })).toBe(
    start,
  );
  const p = session(),
    money = p.state.stones;
  expect(preparationError(p.state, "retreat")).toContain("第三月");
  p.road("thanks");
  expect(p.state.adventure.road.result).toContain("配药");
  expect(p.state.stones).toBe(money);
  const s = p.state;
  expect(p.road("thanks")).toBe(s);
  p.road("market");
  expect(p.state.adventure.road.stage).toBe("market");
});
it.each(["art", "relic", "friend"] as const)(
  "requires actual %s preparation, not only a selected label",
  (route) => {
    const p = atPass();
    p.road("camp");
    p.road(route);
    p.road("pass");
    const s = structuredClone(p.state);
    s.realm = 1;
    expect(roadError(s, "challenge")).toMatch(/装配|邀请/);
    expect(
      dispatch(s, { id: "unprepared", type: "road", action: "challenge" }),
    ).toBe(s);
  },
);
it("rejects contradictory progress and malformed roll histories", () => {
  const s = session().state;
  for (const patch of [
    { met: true },
    { route: "friend" },
    { map: true },
    { surveyed: true },
    { attempts: 1 },
    { chance: 101 },
    { stage: "bad" },
  ]) {
    expect(
      validState({
        ...s,
        adventure: { ...s.adventure, road: { ...freshRoad(), ...patch } },
      }),
    ).toBe(false);
  }
  const p = atPass();
  p.road("camp");
  p.road("friend");
  p.road("invite");
  p.road("pass");
  const bad = structuredClone(p.state);
  Object.assign(bad.adventure.road, { attempts: 1, roll: 20, chance: 50 });
  expect(validState(bad)).toBe(false);
});
it("accepts either herbs or perception, with one commission and no duplicate reward", () => {
  const p = atPass();
  expect(p.state.adventure.road.map).toBe(true);
  p.road("market");
  const s = p.state;
  expect(p.road("deliver")).toBe(s);
  expect(p.road("verify")).toBe(s);
  const q = session();
  for (const a of ["thanks", "market", "talk", "accept"] as RoadAction[])
    q.road(a);
  const unprepared = q.state;
  expect(q.road("verify")).toBe(unprepared);
  const prepared = structuredClone(q.state);
  prepared.sense = 6;
  prepared.study = 2;
  const result = dispatch(prepared, {
    id: "verify",
    type: "road",
    action: "verify",
  });
  expect(validState(result)).toBe(true);
  expect(result.adventure.road.map).toBe(true);
  expect(result.herbs).toBe(prepared.herbs);
});
it("persists the seeded obstacle; rejected actions consume neither RNG nor command ids", () => {
  const p = atPass(42),
    s = p.state;
  expect(migrateSave(s)).toEqual(s);
  expect(p.road("inspect")).toBe(s);
  expect(p.road("challenge")).toBe(s);
  expect(roadError(s, "challenge")).toContain("筑基");
  expect(atPass(42).state).toEqual(s);
  p.road("camp");
  p.road("friend");
  p.road("invite");
  p.road("pass");
  const ready = structuredClone(p.state);
  ready.realm = 1;
  expect(validState(ready)).toBe(true);
  expect(roadError({ ...ready, injury: 3 }, "challenge")).toContain("养伤");
  expect(roadError({ ...ready, stones: 0 }, "challenge")).toContain("灵石");
});
it("failed challenges retain the map, equipment and ally and can be improved", () => {
  const p = atPass(12345);
  p.road("camp");
  p.road("friend");
  p.road("invite");
  p.road("pass");
  const s = structuredClone(p.state);
  s.realm = 1;
  s.seed = 12345;
  const n = dispatch(s, { id: "attempt", type: "road", action: "challenge" });
  expect(n.adventure.road.passed).toBe(false);
  expect(n.injury).toBe(s.injury + 1);
  expect(n.stones).toBe(s.stones - 4);
  expect(n.adventure.road.map && n.adventure.road.ally).toBe(true);
  expect(n.journey).toEqual(s.journey);
  expect(
    dispatch(n, { id: "attempt", type: "road", action: "challenge" }),
  ).toBe(n);
  expect(
    dispatch(migrateSave(s), {
      id: "attempt",
      type: "road",
      action: "challenge",
    }),
  ).toEqual(n);
  expect(
    roadDetails({ ...n, sense: 12, study: 4, foundation: 24, injury: 0 })
      .chance,
  ).toBe(100);
});
it("freezes road actions during events, death and social scenes", () => {
  const p = atPass();
  p.road("camp");
  p.send({ type: "advance", activity: "work", months: 12 });
  expect(p.state.pending).not.toBeNull();
  const s = p.state;
  expect(p.road("friend")).toBe(s);
  for (const frozen of [
    { ...s, status: "dead" as const },
    { ...s, pending: null, social: { ...s.social, scene: {} } },
  ])
    expect(
      dispatch(frozen as State, {
        id: "blocked",
        type: "road",
        action: "friend",
      }),
    ).toBe(frozen);
});
it("migrates v6 without changing resources, scene, old story or RNG; rejects corrupt road data", () => {
  const s = session().state;
  const { road: _, ...adventure } = s.adventure;
  const old = { ...s, version: 6, adventure };
  const upgraded = migrateSave(old);
  expect(upgraded).toEqual({
    ...s,
    version: 7,
    adventure: { ...adventure, road: freshRoad() },
  });
  expect(() =>
    migrateSave({
      ...s,
      adventure: { ...s.adventure, road: { ...freshRoad(), passed: true } },
    }),
  ).toThrow();
  const start = createGame("客", "wood");
  start.adventure.road.met = true;
  expect(validState(start)).toBe(false);
  expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
});
it.each(["art", "relic", "friend"] as const)(
  "plays %s from zero with real commands, repeatable across seeds, and resets on reincarnation",
  (route) => {
    const play = (seed: number) => {
      const p = atPass(seed);
      p.road("camp");
      p.road(route);
      for (let i = 0; i < 180 && !p.state.journey.settled; i++) {
        const s = p.state;
        if (s.pending)
          p.send({
            type: "choose",
            instanceId: s.pending.id,
            option: {
              meeting: "promise",
              letter: "listen",
              visit: "herbs",
              departure: "go",
              crossing: "detour",
              relic: "gift",
            }[s.pending.kind],
          });
        else if (s.injury)
          p.send({ type: "advance", activity: "rest", months: 12 });
        else if (s.qi >= 360) p.send({ type: "break", pill: s.pills > 0 });
        else
          p.send({
            type: "advance",
            activity: s.realm ? "work" : "cultivate",
            months: 12,
          });
      }
      expect(p.state.journey.settled).toBe(true);
      for (let i = 0; i < 60; i++) {
        const s = p.state;
        if (s.injury) p.send({ type: "advance", activity: "rest", months: 3 });
        else if (s.sense < 12)
          p.send({ type: "advance", activity: "meditate", months: 3 });
        else if (s.study < 4)
          p.send({ type: "advance", activity: "study", months: 2 });
        else if (s.stones < 80)
          p.send({ type: "advance", activity: "work", months: 12 });
        else if (s.foundation < 24)
          p.send({ type: "prepare", kind: "retreat" });
        else break;
      }
      if (route === "art") {
        p.send({ type: "learn", technique: "guard" });
        p.send({ type: "equip", technique: "guard" });
      }
      if (route === "relic") {
        p.send({ type: "supplies" });
        p.send({ type: "forge", relic: "vial" });
        p.send({ type: "equipRelic", relic: "vial" });
      }
      if (route === "friend") p.road("invite");
      expect(roadDetails(p.state).chance).toBe(100);
      p.road("pass");
      expect(roadError(p.state, "challenge")).toBe("");
      p.road("challenge");
      expect(p.state.adventure.road.stage).toBe("beyond");
      p.road("lookout");
      const money = p.state.stones;
      p.road("survey");
      expect(p.state.stones).toBe(money + 8);
      const s = p.state;
      expect(p.road("survey")).toBe(s);
      p.road("market");
      expect(p.state.adventure.road.result).toContain("你的名字");
      p.road("pass");
      expect(p.state.adventure.road.stage).toBe("beyond");
      expect(p.state.stones).toBe(money + 8);
      expect(p.state.adventure.road.attempts).toBe(1);
      p.send({ type: "retire" });
      p.send({
        type: "next",
        path: "sword",
        aptitude: "sturdy",
        inheritance: "none",
      });
      expect(p.state.adventure.road).toEqual(freshRoad());
      return p.state;
    };
    for (let seed = 1; seed <= 10; seed++)
      expect(play(seed)).toEqual(play(seed));
  },
);
