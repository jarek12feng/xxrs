import { legacyEquipment } from "./legacy-equipment";
import { expect, it } from "vitest";
import { dispatch, validState, migrateSave } from "../src/core";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { seaQuote } from "../src/outer-sea/rules";
import { storyRoute } from "../src/wayfaring/story-routes";
const initial = conclaveCheckpoint();
function beforeNotice(offset = 1) {
  const s = structuredClone(initial);
  s.outerSea.notice = s.month - 600 + offset;
  s.outerSea.reminded = false;
  expect(validState(s)).toBe(true);
  return s;
}
it.each([1, 6])(
  "persists interrupted sea journey at month %s, then charges only the remainder after reload",
  (offset) => {
    const s = beforeNotice(offset),
      intent = { type: "outerSea" as const, action: { kind: "home" as const } };
    const n = dispatch(s, { ...intent, id: "sail-home" });
    expect(validState(n)).toBe(true);
    expect(n.month - s.month).toBe(offset);
    expect(n.outerSea.location).toBe("ferry");
    expect(n.wayfaring.passage).toEqual({
      route: "sea:home",
      total: 6,
      remaining: 6 - offset,
    });
    expect(n.stones).toBe(s.stones);
    expect(
      dispatch(n, { id: "work", type: "advance", activity: "work", months: 1 }),
    ).toBe(n);
    expect(
      dispatch(n, {
        id: "change",
        type: "conclave",
        action: { kind: "visit" },
      }),
    ).toBe(n);
    const restored = migrateSave(JSON.parse(JSON.stringify(n)));
    expect(seaQuote(restored, { kind: "home" }).months).toBe(6 - offset);
    expect(storyRoute(restored, intent)?.months).toBe(6 - offset);
    const end = dispatch(restored, { ...intent, id: "continue" });
    expect(end.month - s.month).toBe(6);
    expect(end.outerSea.location).toBe("home");
    expect(end.wayfaring.passage).toBeNull();
    expect(validState(end)).toBe(true);
    expect(dispatch(restored, { ...intent, id: "continue" })).toEqual(end);
    expect(dispatch(end, { ...intent, id: "continue" })).toBe(end);
  },
);
it("abandoning an interrupted voyage keeps paid months and never grants destination or supplies", () => {
  const s = beforeNotice(),
    n = dispatch(s, {
      id: "start",
      type: "outerSea",
      action: { kind: "home" },
    });
  const end = dispatch(n, {
    id: "cancel",
    type: "wayfaring",
    action: { kind: "cancel" },
  });
  expect(end.month).toBe(n.month);
  expect(end.outerSea.location).toBe("ferry");
  expect(end.wayfaring.passage).toBeNull();
  expect(end.stones).toBe(n.stones);
  expect(validState(end)).toBe(true);
});
it("validates route ownership, mutually exclusive travel and old v32 pending inland trips without granting flight", () => {
  const s = beforeNotice(),
    n = dispatch(s, {
      id: "start",
      type: "outerSea",
      action: { kind: "home" },
    });
  expect(
    validState({
      ...n,
      wayfaring: {
        ...n.wayfaring,
        passage: { route: "sea:sail", total: 6, remaining: 5 },
      },
    }),
  ).toBe(false);
  expect(
    validState({
      ...n,
      wayfaring: {
        ...n.wayfaring,
        passage: { route: "sea:home", total: 6, remaining: 7 },
      },
    }),
  ).toBe(false);
  const { passage: _, ...wayfaring } = s.wayfaring;
  const old = { ...s, sense: Math.min(12, s.sense), treasures: legacyEquipment(s), version: 32, wayfaring };
  const upgraded = migrateSave(old);
  expect(upgraded.version).toBe(35);
  expect(upgraded.wayfaring.passage).toBeNull();
  expect(upgraded.wayfaring.swordFlight).toBe(s.wayfaring.swordFlight);
  expect(old.version).toBe(32);
  expect(() => migrateSave({ ...s, version:999 })).toThrow();
});
