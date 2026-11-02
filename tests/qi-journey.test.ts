import { it, expect } from "vitest";
import { createGame, dispatch, validState, migrateSave } from "../src/core";
import { expeditionSession } from "../tools/expedition-simulation";
import { foundationStep } from "../tools/foundation-playthrough";
import { qiPreview } from "../src/qi-journey/rules";
it.each(["wood", "sword"] as const)(
  "%s character completes both earned bottlenecks through public commands",
  (path) => {
    const p = expeditionSession(42, path);
    const trace: unknown[] = [];
    for (let i = 0; i < 450 && !p.state.realm; i++) {
      const cmd = foundationStep(p.state);
      if (cmd.type === "qiJourney")
        trace.push([
          i,
          cmd.action,
          p.state.qiJourney.duel,
          p.state.qiJourney.last,
          cmd.action === "guard" ? qiPreview(p.state, "guard") : null,
        ]);
      p.send(cmd);
    }
    expect(p.state.realm, JSON.stringify(trace.slice(-18))).toBe(1);
    expect(p.state.qiJourney.gates).toBe(2);
    expect(validState(p.state)).toBe(true);
  },
);
it("cultivation stops at a real material bottleneck without earning passive income", () => {
  let s = createGame("闭关", "sword");
  s.story.stage = "resolved";
  s.story.choice = "self";
  for (let i = 0; i < 30; i++)
    s = dispatch(s, {
      id: `m${i}`,
      type: "advance",
      activity: "cultivate",
      months: 12,
    });
  expect(s.qi).toBe(239);
  expect(s.stones).toBe(12);
  expect(s.realm).toBe(0);
  expect(dispatch(s, { id: "break", type: "break", pill: true })).toBe(s);
});
it("new lifespan is one century and unsupported future saves stay protected", () => {
  expect(createGame("医", "wood").limit).toBe(1200);
  expect(createGame("剑", "sword").limit).toBe(1200);
  expect(() =>
    migrateSave({ ...createGame("未来", "wood"), version: 999 }),
  ).toThrow();
});
it.each(["sturdy", "insightful", "perceptive"] as const)(
  "fresh %s preparations converge without edited stats",
  (aptitude) => {
    for (const path of ["wood", "sword"] as const) {
      let s = createGame("新角色", path, 42, aptitude);
      for (let i = 0; i < 400 && !s.realm; i++)
        s = dispatch(s, { ...foundationStep(s), id: `fresh${i}` });
      expect(
        s.realm,
        JSON.stringify({
          path,
          aptitude,
          adventure: s.adventure,
          qi: s.qi,
          q: s.qiJourney,
          last: s.log.slice(0, 2),
          next: foundationStep(s),
          known: s.journey.known,
        }),
      ).toBe(1);
    }
  },
);

function prepared() {
  let s = createGame("关卡验收", "wood", 42, "insightful");
  for (let i = 0; i < 400; i++) {
    const cmd = foundationStep(s);
    if (cmd.type === "qiJourney" && cmd.action.startsWith("enter:")) return s;
    s = dispatch(s, { ...cmd, id: `prepare${i}` });
  }
  throw Error("No entry reached");
}
it.each(["medicine", "sword", "array"] as const)(
  "supports %s preparation with deterministic exchanges and recovery",
  (route) => {
    const s = prepared();
    s.mastery = 4;
    s.sense = 8;
    s.study = 2;
    s.herbs = 20;
    const cmd = {
      id: "entry",
      type: "qiJourney",
      action: `enter:${route}`,
    } as const;
    const active = dispatch(s, cmd);
    expect(active.qiJourney.node).toBe(1);
    expect(validState(active)).toBe(true);
    expect(active.stones).toBe(s.stones - 6);
    expect(active.herbs).toBe(s.herbs - (route === "medicine" ? 4 : 0));
    expect(dispatch(active, cmd)).toBe(active);
    for (const intent of [
      { type: "advance", activity: "work", months: 12 },
      { type: "retire" },
      { type: "break", pill: true },
      { type: "equip", technique: "blade" },
    ] as const)
      expect(dispatch(active, { ...intent, id: "blocked" })).toBe(active);
    const move = { type: "qiJourney", action: "strike", id: "turn" } as const;
    expect(dispatch(migrateSave(active), move)).toEqual(dispatch(active, move));
    const loss = structuredClone(active);
    loss.qiJourney.duel!.hp = 1;
    loss.foundation = 0;
    loss.journey.support = null;
    loss.journey.equipped = null;
    const failed = dispatch(loss, move);
    expect(failed.qiJourney.node).toBe(0);
    expect(failed.injury).toBe(loss.injury + 1);
    expect(failed.qi).toBe(loss.qi);
    expect(failed.qiJourney.gates).toBe(loss.qiJourney.gates);
    expect(validState(failed)).toBe(true);
    const withdrawn = dispatch(active, {
      type: "qiJourney",
      action: "withdraw",
      id: "withdraw",
    });
    expect(withdrawn.stones).toBe(active.stones);
    expect(withdrawn.injury).toBe(active.injury);
    expect(withdrawn.qiJourney.duel).toBeNull();
  },
);
it.each(["refine", "mentor", "artisan"] as const)(
  "%s spends its distinct resources exactly once",
  (action) => {
    const s = prepared();
    s.qiJourney.essence = true;
    s.stones = 60;
    s.herbs = 10;
    s.study = 2;
    s.journey.branch = "dan";
    s.journey.contribution = 6;
    const cmd = { type: "qiJourney", action, id: "refine" } as const;
    const next = dispatch(s, cmd);
    expect(next.qiJourney.gates).toBe(1);
    expect(next.qiJourney.essence).toBe(false);
    expect(next.stones).toBe(
      60 - (action === "refine" ? 24 : action === "mentor" ? 12 : 48),
    );
    expect(next.herbs).toBe(action === "refine" ? 6 : 10);
    expect(next.journey.contribution).toBe(action === "mentor" ? 2 : 6);
    expect(dispatch(next, cmd)).toBe(next);
    expect(validState(next)).toBe(true);
  },
);
it("instant purchases do not spend lifespan or advance appointments", () => {
  const s = prepared(); s.stones = 60; s.age = s.limit - 1;
  const bought = dispatch(s, { type: "qiJourney", action: "buy:healing", id: "buy" });
  expect(bought.status).toBe("alive"); expect(bought.age).toBe(s.age);
  expect(bought.stones).toBe(48);
  expect(bought.growth.medicines.healing).toBe(s.growth.medicines.healing + 1);
  expect(validState(bought)).toBe(true);
  const early = createGame("约定", "wood"); early.stones = 60; early.month = 2; early.age = 194;
  const meeting = dispatch(early, { type: "qiJourney", action: "buy:healing", id: "meeting" });
  expect(meeting.pending).toBeNull(); expect(meeting.month).toBe(2);
  expect(meeting.stones).toBe(48); expect(meeting.growth.medicines.healing).toBe(1);
});
it("commissions and purchases settle once and cannot create negative resources", () => {
  const s = prepared();
  s.herbs = 4;
  s.stones = 0;
  const cmd = {
    type: "qiJourney",
    action: "commission:herbs",
    id: "commission",
  } as const;
  const paid = dispatch(s, cmd);
  expect(paid.herbs).toBe(0);
  expect(paid.stones).toBe(16);
  expect(dispatch(paid, { ...cmd, id: "again" })).toBe(paid);
  const bought = dispatch(paid, {
    type: "qiJourney",
    action: "buy:healing",
    id: "buy",
  });
  expect(bought.stones).toBe(4);
  expect(bought.growth.medicines.healing).toBe(
    paid.growth.medicines.healing + 1,
  );
  expect(
    dispatch(bought, { type: "qiJourney", action: "buy:healing", id: "poor" }),
  ).toBe(bought);
});
it("rejects impossible and malformed journey states", () => {
  const s = prepared();
  for (const patch of [
    { gates: 3 },
    { node: 1 },
    { essence: true, gates: 2 },
    { commissions: ["herbs", "herbs"] },
    { duel: undefined },
    { vigor: -1 },
  ])
    expect(validState({ ...s, qiJourney: { ...s.qiJourney, ...patch } })).toBe(
      false,
    );
});
it("a cultivation queue stops at the current bottleneck and keeps the next task", () => {
  const s = prepared();
  s.qi = 238;
  s.journey.queue = [
    { action: "cultivate", remaining: 12 },
    { action: "work", remaining: 3 },
  ];
  const next = dispatch(s, { type: "queueTick", id: "queue" });
  expect(next.qi).toBe(239);
  expect(next.journey.queue).toEqual([{ action: "work", remaining: 3 }]);
});
