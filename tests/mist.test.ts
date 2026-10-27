import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  freshMist,
  mistDetails,
  mistError,
  mistPartner,
  mistQuote,
  type State,
  type Intent,
  type MistAction,
  type MistPartner,
} from "../src/core";
import { mistCheckpoint } from "../tools/mist-checkpoint";

function session(initial = mistCheckpoint()) {
  let s = initial,
    id = 0;
  const send = (intent: Intent) => {
    const old = s,
      before = structuredClone(s);
    s = dispatch(s, {
      ...intent,
      id: `mist-test-${initial.seen.length}-${++id}`,
    });
    expect(old).toEqual(before);
    expect(validState(s), JSON.stringify(intent)).toBe(true);
    return s;
  };
  const act = (action: MistAction) => {
    const old = s,
      before = structuredClone(old);
    send({ type: "mist", action });
    expect(old).toEqual(before);
    return s;
  };
  return {
    get state() {
      return s;
    },
    act,
    send,
  };
}
function camp(
  partner: Exclude<MistPartner, "none"> = "solo",
  initial = mistCheckpoint(),
) {
  const p = session(initial);
  p.act("receive");
  p.act("accept");
  p.act(partner);
  return p;
}
it("unlocks only after the recorded road and preserves the optional initial choice", () => {
  const fresh = createGame("未入山", "wood");
  expect(
    dispatch(fresh, { id: "early", type: "mist", action: "receive" }),
  ).toBe(fresh);
  const p = session();
  const before = p.state;
  p.act("receive");
  p.act("accept");
  expect(mistError(p.state, "garden")).toContain("同行");
  expect(p.state.seed).toBe(before.seed);
  expect(p.state.month).toBe(before.month);
  expect(p.state.stones).toBe(before.stones);
  expect(p.state.adventure.mist.firstRoute).toBe("none");
});
it.each(["garden", "station"] as const)(
  "finishes %s alone without forcing the other branch and enables revisiting",
  (route) => {
    const p = camp();
    p.act("shrine");
    expect(mistError(p.state, "illuminate")).toContain("探灵灯");
    p.act("camp");
    p.act(route);
    p.act(route === "garden" ? "attune" : "decode");
    p.act("gate");
    p.act("steady");
    expect(mistDetails(p.state).chance).toBe(100);
    p.act("challenge");
    p.act("read");
    expect(p.state.adventure.mist.lamp).toBe(true);
    expect(
      p.state.adventure.mist[route === "garden" ? "station" : "garden"],
    ).toBe(false);
    p.act("share");
    p.act("shrine");
    p.act("illuminate");
    expect(p.state.adventure.mist.revisited).toBe(true);
    expect(p.state.adventure.mist.result).toContain("避难室");
    const finished = p.state;
    expect(p.act("illuminate")).toBe(finished);
    expect(migrateSave(p.state)).toEqual(p.state);
  },
);
it("gives both routes different entry requirements and supports route changes", () => {
  const initial = mistCheckpoint(42, "sword");
  initial.study = 0;
  initial.sense = 3;
  initial.herbs = 0;
  const p = camp("solo", initial);
  p.act("garden");
  expect(mistError(p.state, "attune")).toContain("医道");
  expect(mistError(p.state, "tend")).toContain("灵草");
  p.act("camp");
  p.act("luchi");
  p.act("garden");
  p.act("attune");
  expect(p.state.adventure.mist.garden).toBe(true);
  p.act("camp");
  p.act("station");
  expect(mistError(p.state, "decode")).toContain("神识");
  p.act("camp");
  p.act("companion");
  p.act("station");
  p.act("decode");
  expect(p.state.adventure.mist.station).toBe(true);
  expect(p.state.adventure.mist.firstRoute).toBe("garden");
});
it.each(["male", "female"] as const)(
  "remembers the adult %s companion and awards affection once",
  (gender) => {
    const p = camp("companion", mistCheckpoint(42, "wood", gender));
    expect(mistPartner(p.state).name).toBe(
      gender === "male" ? "沈听澜" : "尹照川",
    );
    p.act("station");
    p.act("decode");
    p.act("gate");
    p.act("pursue");
    const affection = p.state.social.affection;
    p.act("challenge");
    p.act("read");
    p.act("share");
    expect(p.state.social.affection).toBe(affection + 8);
    expect(p.state.social.bonded).toBe(false);
    expect(p.state.adventure.mist.result).toContain("信号");
    const shared = p.state;
    expect(p.act("share")).toBe(shared);
    p.act("camp");
    expect(mistError(p.state, "solo")).toContain("写入故事");
  },
);
it("does not invite strangers or minors into the romance companion slot", () => {
  const initial = mistCheckpoint();
  initial.social = { ...createGame("客", "wood").social };
  const p = camp("solo", initial);
  expect(mistError(p.state, "companion")).toContain("成年");
});
it("records stable danger once and turns failure into usable preparation", () => {
  const initial = mistCheckpoint();
  Object.assign(initial, { sense: 3, study: 2, foundation: 0, seed: 12345 });
  const p = camp("solo", initial);
  p.act("garden");
  p.act("attune");
  p.act("gate");
  p.act("pursue");
  const seed = p.state.seed,
    hazard = p.state.adventure.mist.hazard;
  p.act("camp");
  p.act("gate");
  expect(p.state.seed).toBe(seed);
  expect(p.state.adventure.mist.hazard).toBe(hazard);
  const s = structuredClone(p.state);
  s.seed = 12345;
  const cmd = { id: "failure", type: "mist", action: "challenge" } as const;
  const failed = dispatch(s, cmd);
  expect(failed.adventure.mist.roll).toBe(78);
  expect(failed.adventure.mist.passed).toBe(false);
  expect(failed.injury).toBe(s.injury + 1);
  expect(failed.stones).toBe(s.stones - 3);
  expect(failed.adventure.mist.insight).toBe(true);
  expect(dispatch(migrateSave(s), cmd)).toEqual(failed);
  expect(dispatch(failed, cmd)).toBe(failed);
  const safe = structuredClone(s);
  safe.adventure.mist.vow = "steady";
  const safeFailure = dispatch(safe, cmd);
  expect(safeFailure.adventure.mist.passed).toBe(false);
  expect(safeFailure.injury).toBe(safe.injury);
  expect(safeFailure.stones).toBe(safe.stones - 6);
  const recovery = session(failed);
  recovery.act("camp");
  recovery.act("ward");
  expect(recovery.state.adventure.mist.ward).toBe(true);
  recovery.send({ type: "advance", activity: "rest", months: 1 });
  recovery.send({ type: "advance", activity: "meditate", months: 3 });
  recovery.act("luchi");
  recovery.act("gate");
  recovery.act("steady");
  expect(mistDetails(recovery.state).chance).toBeGreaterThan(
    mistDetails(s).chance,
  );
  expect(mistDetails(recovery.state).chance).toBe(100);
  recovery.act("challenge");
  expect(recovery.state.adventure.mist.passed).toBe(true);
});
it("allows the acquired lamp to solve the unvisited garden without herbs or medicinal training", () => {
  const p = camp("solo", mistCheckpoint(42, "sword"));
  p.act("station");
  p.act("decode");
  p.act("gate");
  p.act("steady");
  p.act("challenge");
  p.act("read");
  p.act("share");
  const before = p.state;
  p.act("camp");
  p.act("garden");
  p.act("attune");
  expect(p.state.herbs).toBe(before.herbs);
  expect(p.state.adventure.mist.garden).toBe(true);
  expect(p.state.adventure.mist.result).toContain("探灵灯");
});
it("freezes chapter commands during events, duels, death and sealing", () => {
  const s = camp().state;
  for (const blocked of [
    { ...s, status: "dead" },
    { ...s, status: "complete" },
    { ...s, pending: { id: "pending" } },
    { ...s, social: { ...s.social, scene: { id: "scene" } } },
    {
      ...s,
      social: { ...s.social, arena: { ...s.social.arena, duel: { turn: 1 } } },
    },
  ])
    expect(
      dispatch(blocked as State, {
        id: "blocked",
        type: "mist",
        action: "garden",
      }),
    ).toBe(blocked);
});
it("does not charge duplicate clues or permit insufficient-resource attempts", () => {
  const p = camp();
  p.act("garden");
  const before = p.state.herbs;
  p.act("tend");
  expect(p.state.herbs).toBe(before - 4);
  const once = p.state;
  expect(p.act("tend")).toBe(once);
  p.act("gate");
  p.act("steady");
  const poor = { ...p.state, stones: 5 };
  expect(
    dispatch(poor, { id: "poor", type: "mist", action: "challenge" }),
  ).toBe(poor);
  const hurt = { ...p.state, injury: 3 };
  expect(
    dispatch(hurt, { id: "hurt", type: "mist", action: "challenge" }),
  ).toBe(hurt);
});
it("migrates real v8 progress without touching existing story, RNG or discoveries", () => {
  const s = mistCheckpoint();
  const { mist: _, ...adventure } = s.adventure;
  const old = { ...s, version: 8, adventure },
    before = structuredClone(old);
  expect(migrateSave(old)).toEqual(s);
  expect(old).toEqual(before);
  expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
  for (const patch of [
    { lamp: true },
    { partner: "ghost" },
    { garden: true },
    { attempts: -1 },
    { stage: "nope" },
  ]) {
    const corrupt = {
      ...s,
      adventure: { ...s.adventure, mist: { ...freshMist(), ...patch } },
    };
    expect(validState(corrupt)).toBe(false);
    expect(() => migrateSave(corrupt)).toThrow();
  }
});
it("acknowledges an already found father instead of erasing the earlier letter", () => {
  const p = session();
  p.act("receive");
  const found = structuredClone(p.state);
  found.journey.maps.sea = 3;
  expect(mistQuote(found)).toContain("已经知道他在守灯");
  expect(mistQuote(p.state)).toContain("去了哪里");
});
it("replays both paths and three party choices across seeds, then resets chapter on reincarnation", () => {
  for (const path of ["wood", "sword"] as const)
    for (let seed = 1; seed <= 4; seed++)
      for (const partner of ["solo", "luchi", "companion"] as const) {
        const play = () => {
          const p = camp(partner, mistCheckpoint(seed, path));
          const route = seed % 2 ? "garden" : "station";
          p.act(route);
          p.act(route === "garden" ? "tend" : "decode");
          p.act("gate");
          p.act("steady");
          p.act("challenge");
          expect(p.state.adventure.mist.passed).toBe(true);
          p.act("read");
          p.act("share");
          p.act("shrine");
          p.act("illuminate");
          expect(p.state.adventure.mist.revisited).toBe(true);
          expect(migrateSave(p.state)).toEqual(p.state);
          return p;
        };
        const p = play();
        expect(play().state).toEqual(p.state);
        p.send({ type: "retire" });
        p.send({
          type: "next",
          path: "sword",
          aptitude: "sturdy",
          inheritance: "none",
        });
        expect(p.state.adventure.mist).toEqual(freshMist());
      }
});
