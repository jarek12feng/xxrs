import { expect, it } from "vitest";
import { openingGuide } from "../src/opening-guide";
import { expeditionGoal } from "../src/expedition/progression";
import { actionReceipt } from "../src/action-feedback";
import { expeditionSession } from "../tools/expedition-simulation";

it("keeps the return objective after breakthrough and retires it after the boss", () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  p.resolve();
  while (p.state.herbs < 4) p.send({ type: "supplies" });
  p.send({ type: "expedition", action: "healArray" });
  expect(p.state.expedition.cleared).toBe(2);
  const before = structuredClone(p.state);
  expect(expeditionGoal(before)).toContain(`还差 ${360 - before.qi}`);
  expect(openingGuide(before)?.action).toBe("cultivate");
  p.prepare();
  const after = structuredClone(p.state);
  expect(openingGuide(after)?.action).toBe("road");
  expect(openingGuide(after)?.body).toContain("不是入阵条件");
  expect(
    actionReceipt(before, after, { type: "break", pill: false })?.next,
  ).toContain("转运册");
  expect(p.state).toEqual(after);
  p.send({ type: "expedition", action: "enter" });
  expect(openingGuide(p.state)).toBeNull();
  p.fight();
  expect(p.state.expedition.cleared).toBe(3);
  expect(openingGuide(p.state)).toBeNull();
  expect(expeditionGoal(p.state)).toBeNull();
});

it("does not promote a return objective during events, after death, or for unrelated saves", () => {
  const p = expeditionSession();
  p.prepare();
  const s = p.state;
  expect(openingGuide(s)).toBeNull();
  const ready = {
    ...s,
    expedition: { ...s.expedition, accepted: true, cleared: 2 },
  };
  const snapshot = structuredClone(ready);
  expect(openingGuide(ready)?.action).toBe("road");
  expect(openingGuide({ ...ready, status: "dead" })).toBeNull();
  expect(openingGuide({ ...ready, status: "complete" })).toBeNull();
  expect(
    openingGuide({
      ...ready,
      pending: { kind: "meeting", id: "pending" },
    } as typeof s),
  ).toBeNull();
  expect(ready).toEqual(snapshot);
});
