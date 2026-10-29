import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  freshRoad,
  roadDetails,
  roadError,
  hasShelteredRoute,
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
function shelteredState() {
  const p = atPass(12345);
  for (const action of [
    "examineMarks",
    "market",
    "examineLedger",
    "camp",
    "friend",
    "invite",
    "pass",
  ] as RoadAction[])
    p.road(action);
  const s = structuredClone(p.state);
  s.realm = 1;
  s.seed = 12345;
  expect(validState(s)).toBe(true);
  return s;
}
it("records optional clues once without time, resources or RNG costs", () => {
  const p = atPass(42);
  const before = structuredClone(p.state);
  p.road("examineMarks");
  expect(p.state.adventure.road.discoveries).toEqual(["marks"]);
  for (const key of ["month", "age", "stones", "seed"] as const)
    expect(p.state[key]).toBe(before[key]);
  const once = p.state;
  expect(p.road("examineMarks")).toBe(once);
  expect(p.road("examineLedger")).toBe(once);
  p.road("market");
  p.road("examineLedger");
  expect(hasShelteredRoute(p.state)).toBe(true);
  expect(migrateSave(p.state)).toEqual(p.state);
});
it("requires meeting the ledger owner and inspecting danger before reading marks", () => {
  const p = session();
  p.road("thanks");
  p.road("market");
  expect(roadError(p.state, "examineLedger")).toContain("认识");
  p.road("talk");
  p.road("accept");
  p.send({ type: "supplies" });
  p.road("deliver");
  p.road("pass");
  expect(roadError(p.state, "examineMarks")).toContain("观察");
});
it("trades two extra stones for a stronger safer attempt, with identical deterministic rolls", () => {
  const s = shelteredState();
  const command = {
    id: "safe",
    type: "road",
    action: "shelteredChallenge",
  } as const;
  const safe = dispatch(s, command);
  const direct = dispatch(s, { ...command, action: "challenge" });
  expect(roadDetails(s, "sheltered").chance).toBe(roadDetails(s).chance + 10);
  expect(safe.adventure.road.passed).toBe(false);
  expect(direct.adventure.road.passed).toBe(false);
  expect(safe.adventure.road.roll).toBe(direct.adventure.road.roll);
  expect(safe.stones).toBe(s.stones - 6);
  expect(direct.stones).toBe(s.stones - 4);
  expect(safe.injury).toBe(s.injury);
  expect(direct.injury).toBe(s.injury + 1);
  expect(safe.adventure.road.lastApproach).toBe("sheltered");
  expect(dispatch(s, command)).toEqual(safe);
  expect(dispatch(safe, command)).toBe(safe);
  expect(migrateSave(safe)).toEqual(safe);
});
it("keeps preparation and resource gates on the sheltered approach", () => {
  const s = shelteredState();
  for (const patch of [{ stones: 5 }, { realm: 0 }, { injury: 3 }]) {
    const blocked = { ...s, ...patch } as State;
    expect(roadError(blocked, "shelteredChallenge")).not.toBe("");
    expect(
      dispatch(blocked, {
        id: "gate",
        type: "road",
        action: "shelteredChallenge",
      }),
    ).toBe(blocked);
  }
  for (const discoveries of [
    [],
    ["ledger"],
    ["marks"],
  ] as State["adventure"]["road"]["discoveries"][]) {
    const blocked = structuredClone(s);
    blocked.adventure.road.discoveries = discoveries;
    expect(roadError(blocked, "shelteredChallenge")).toContain("账册");
  }
});
it("lets the pavilion names change the return conversation without farming rewards", () => {
  let s = shelteredState();
  Object.assign(s, { sense: 12, study: 4, foundation: 24 });
  let id = 0;
  const act = (action: RoadAction) => {
    s = dispatch(s, { id: `names-${++id}`, type: "road", action });
    expect(validState(s)).toBe(true);
  };
  act("shelteredChallenge");
  expect(s.adventure.road.passed).toBe(true);
  act("lookout");
  const stones = s.stones;
  act("examineNames");
  expect(s.stones).toBe(stones);
  expect(s.adventure.road.discoveries).toContain("names");
  act("survey");
  expect(s.stones).toBe(stones + 8);
  act("survey");
  expect(s.stones).toBe(stones + 8);
  act("market");
  expect(s.adventure.road.result).toContain("旧名字");
  expect(migrateSave(s)).toEqual(s);
});
it("preserves v7 road progress and rejects invalid new clue histories", () => {
  const s = shelteredState();
  const { discoveries: _, lastApproach: __, ...road } = s.adventure.road;
  const old = { ...s, version: 7, adventure: { ...s.adventure, road } };
  expect(migrateSave(old)).toEqual({
    ...s,
    adventure: {
      ...s.adventure,
      rescueChoice: "legacy",
      road: { ...road, discoveries: [], lastApproach: "direct" },
    },
  });
  for (const discoveries of [
    ["ledger", "ledger"],
    ["unknown"],
    ["names"],
    null,
    "ledger",
  ]) {
    const bad = {
      ...s,
      adventure: { ...s.adventure, road: { ...s.adventure.road, discoveries } },
    };
    expect(validState(bad)).toBe(false);
    expect(() => migrateSave(bad)).toThrow();
  }
});
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
    version: 14,
    adventure: { ...adventure, rescueChoice: "legacy", road: freshRoad() },
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
