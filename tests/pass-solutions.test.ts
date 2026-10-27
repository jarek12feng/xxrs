import { expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import RoadPanel from "../src/RoadPanel.vue";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import {
  dispatch,
  validState,
  migrateSave,
  createGame,
  freshRoad,
  passSolutions,
  passEcho,
  roadError,
  mistError,
  type State,
  type Intent,
  type PassSolution,
  type RoadAction,
} from "../src/core";
import { actionReceipt } from "../src/action-feedback";

function session(initial = mistCheckpoint(42, "wood", "male", true)) {
  let s = initial,
    id = 0;
  const send = (intent: Intent) => {
    const before = structuredClone(s);
    const next = dispatch(s, {
      ...intent,
      id: `new-pass-${initial.seen.length}-${++id}`,
    });
    expect(s).toEqual(before);
    expect(validState(next), JSON.stringify(intent)).toBe(true);
    s = next;
    return s;
  };
  const road = (action: RoadAction) => send({ type: "road", action });
  const equip = (key: PassSolution) => {
    if (key === "medicine") {
      if (s.path !== "wood") send({ type: "learn", technique: "herb" });
      while (s.herbs < 6) send({ type: "supplies" });
    }
    if (key === "sword") {
      while (s.herbs < 4) send({ type: "supplies" });
      send({ type: "forge", relic: "sword" });
      send({ type: "equipRelic", relic: "sword" });
    }
    if (key === "array") {
      road("examineMarks");
      road("market");
      road("examineLedger");
      road("pass");
    }
  };
  return {
    get state() {
      return s;
    },
    send,
    road,
    equip,
  };
}
const keys = Object.keys(passSolutions) as PassSolution[];
it.each(keys)(
  "replays %s across paths and seeds, with lasting consequences and no lottery",
  (key) => {
    const play = (seed: number, path: "wood" | "sword") => {
      const p = session(mistCheckpoint(seed, path, "male", true));
      p.equip(key);
      const plan = passSolutions[key];
      const unobserved = p.state;
      expect(p.road(plan.finish)).toBe(unobserved); // cannot bypass observation
      p.road(plan.prepare);
      const before = p.state;
      expect(roadError(before, plan.finish)).toBe("");
      p.road(plan.finish);
      expect(p.state.adventure.road.solution).toBe(key);
      expect(p.state.adventure.road.passed).toBe(true);
      expect(p.state.seed).toBe(before.seed);
      expect(p.state.month).toBe(before.month);
      expect(p.state.stones).toBe(
        before.stones - { medicine: 4, sword: 8, array: 6 }[key],
      );
      expect(p.state.herbs).toBe(before.herbs - (key === "medicine" ? 6 : 0));
      expect(p.state.adventure.road.attempts).toBe(0);
      const receipt = actionReceipt(before, p.state, {
        type: "road",
        action: plan.finish,
      })!;
      expect(receipt.person?.name).toBe("青嶂");
      expect(receipt.scene?.unlocks.join()).toContain(plan.name);
      const completed = p.state;
      for (const other of keys) {
        expect(p.road(passSolutions[other].prepare)).toBe(completed);
        expect(p.road(passSolutions[other].finish)).toBe(completed);
      }
      p.road("lookout");
      p.road("survey");
      const afterReward = p.state;
      expect(p.road("survey")).toBe(afterReward);
      p.road("market");
      expect(passEcho(p.state)?.name).toBe("郁青");
      expect(p.state.adventure.road.result).toContain(
        { medicine: "药箱", sword: "货车", array: "通行时刻" }[key],
      );
      p.road("pass");
      expect(passEcho(p.state)?.name).toBe("青嶂");
      expect(passEcho(p.state)?.quote).toContain(
        { medicine: "喝碗茶", sword: "回不来了", array: "喝完" }[key],
      );
      expect(migrateSave(p.state)).toEqual(p.state);
      return p.state;
    };
    for (const path of ["wood", "sword"] as const)
      for (const seed of [1, 42, 88, 12345])
        expect(play(seed, path)).toEqual(play(seed, path));
  },
);
it("allows free reconsideration before commitment and retains failed legacy attempts", () => {
  const p = session();
  p.road("diagnoseRoots");
  const observed = p.state;
  p.road("markCut");
  expect(p.state.stones).toBe(observed.stones);
  expect(p.state.seed).toBe(observed.seed);
  expect(roadError(p.state, "healPass")).toContain("先观察");
  const failed = structuredClone(p.state);
  Object.assign(failed.adventure.road, { attempts: 1, roll: 99, chance: 20 });
  expect(validState(failed)).toBe(true);
  const q = session(failed);
  q.equip("medicine");
  q.road("diagnoseRoots");
  q.road("healPass");
  expect(q.state.adventure.road.attempts).toBe(1);
  expect(q.state.adventure.road.roll).toBe(99);
  expect(q.state.adventure.road.solution).toBe("medicine");
});
it.each(keys)(
  "enforces %s requirements, shared freezes and insufficient resources without mutations",
  (key) => {
    const p = session();
    p.equip(key);
    p.road(passSolutions[key].prepare);
    const ready = p.state;
    const blocked = [
      { ...ready, stones: 0 },
      { ...ready, realm: 0 },
      { ...ready, injury: 3 },
      { ...ready, status: "dead" },
      { ...ready, status: "complete" },
      { ...ready, pending: { id: "event", kind: "letter" } },
      {
        ...ready,
        social: { ...ready.social, scene: { id: "scene", kind: "night" } },
      },
      {
        ...ready,
        social: { ...ready.social, arena: { ...ready.social.arena, duel: {} } },
      },
      key === "medicine"
        ? { ...ready, herbs: 5 }
        : key === "sword"
          ? { ...ready, foundation: 11 }
          : { ...ready, sense: 7 },
    ];
    for (const s of blocked as State[]) {
      const clone = structuredClone(s);
      expect(roadError(s, passSolutions[key].finish)).not.toBe("");
      expect(
        dispatch(s, {
          id: "blocked",
          type: "road",
          action: passSolutions[key].finish,
        }),
      ).toBe(s);
      expect(s).toEqual(clone);
    }
    const cmd = {
      id: "once",
      type: "road",
      action: passSolutions[key].finish,
    } as const;
    const result = dispatch(ready, cmd);
    expect(dispatch(result, cmd)).toBe(result);
  },
);
it("requires actual medical knowledge, sword skill or equipment, and both array clues", () => {
  const p = session(mistCheckpoint(42, "sword", "male", true));
  p.road("diagnoseRoots");
  expect(roadError(p.state, "healPass")).toContain("辨草录");
  p.road("markCut");
  expect(roadError({ ...p.state, mastery: 0 }, "cutPass")).toContain("剑意");
  expect(roadError(p.state, "traceArray")).toContain("账册");
});
it.each(keys)(
  "carries %s into the next chapter as an actionable ability and resets on reincarnation",
  (key) => {
    const p = session();
    p.equip(key);
    p.road(passSolutions[key].prepare);
    p.road(passSolutions[key].finish);
    p.road("lookout");
    p.road("survey");
    p.send({ type: "mist", action: "receive" });
    p.send({ type: "mist", action: "accept" });
    p.send({ type: "mist", action: "solo" });
    // Low remaining knowledge demonstrates the earned ability, not the old stat gate.
    const low = { ...p.state, study: 0, sense: 3, herbs: 0 };
    const q = session(low);
    if (key === "sword") {
      const before = q.state;
      expect(mistError(before, "ward")).toContain("受阻");
      q.send({ type: "mist", action: "caravanBridge" });
      expect(q.state.stones).toBe(before.stones - 6);
      expect(q.state.adventure.mist.ward).toBe(true);
      expect(q.state.adventure.mist.insight).toBe(false);
      expect(mistError(q.state, "caravanBridge")).not.toBe("");
    } else {
      q.send({
        type: "mist",
        action: key === "medicine" ? "garden" : "station",
      });
      q.send({
        type: "mist",
        action: key === "medicine" ? "attune" : "decode",
      });
      expect(
        q.state.adventure.mist[key === "medicine" ? "garden" : "station"],
      ).toBe(true);
      expect(q.state.adventure.mist.result).toContain("青嶂");
    }
    expect(migrateSave(q.state)).toEqual(q.state);
    q.send({ type: "retire" });
    q.send({
      type: "next",
      path: "sword",
      aptitude: "sturdy",
      inheritance: "none",
    });
    expect(q.state.adventure.road).toEqual(freshRoad());
  },
);
it("does not grant a caravan bridge to other routes or combine it with an existing ward", () => {
  const s = mistCheckpoint();
  const p = session(s);
  p.send({ type: "mist", action: "receive" });
  p.send({ type: "mist", action: "accept" });
  expect(mistError(p.state, "caravanBridge")).toContain("商道");
});
it("migrates unfinished and completed v9 without assigning a new life choice", () => {
  for (const current of [
    mistCheckpoint(42, "wood", "male", true),
    mistCheckpoint(),
  ]) {
    const { solution: _, prepared: __, ...road } = current.adventure.road;
    const old = {
      ...current,
      version: 9,
      adventure: { ...current.adventure, road },
    };
    const copy = structuredClone(old),
      next = migrateSave(old);
    expect(old).toEqual(copy);
    expect(next.adventure.road.solution).toBe(road.passed ? "legacy" : "none");
    expect(next.adventure.road.roll).toBe(road.roll);
    expect(next.seed).toBe(old.seed);
    expect(next.stones).toBe(old.stones);
    expect(next.adventure.mist).toEqual(old.adventure.mist);
    expect(() =>
      migrateSave({
        ...old,
        adventure: { ...old.adventure, road: { ...road, roll: 101 } },
      }),
    ).toThrow();
  }
});
it("rejects invented outcomes, missing fields and impossible preparation in current saves", () => {
  const s = createGame("初来", "wood");
  for (const patch of [
    { solution: "medicine" },
    { prepared: "array" },
    { solution: "bogus" },
    { solution: undefined },
  ]) {
    const bad = {
      ...s,
      adventure: { ...s.adventure, road: { ...s.adventure.road, ...patch } },
    };
    expect(validState(bad)).toBe(false);
    expect(() => migrateSave(bad)).toThrow();
  }
});
it("shows all three tradeoffs before commitment and persistent characters after returning", async () => {
  const p = session();
  let html = await renderToString(
    createSSRApp({
      render: () => h(RoadPanel, { game: p.state, busy: false }),
    }),
  );
  for (const key of keys)
    expect(html).toContain(passSolutions[key].consequence);
  expect(html).toContain("满足条件即成功，不掷骰");
  p.equip("sword");
  p.road("markCut");
  p.road("cutPass");
  html = await renderToString(
    createSSRApp({
      render: () => h(RoadPanel, { game: p.state, busy: false }),
    }),
  );
  expect(html).toContain("青嶂");
  expect(html).toContain("没有摆出茶碗");
  expect(html).not.toContain("选择留给后来人的归路");
});
