import { describe, expect, it } from "vitest";
import {
  createActionSequence,
  savedActionTransition,
  type ActionSnapshot,
  type ActionFrame,
  type ActionEndReason,
  type ActionSequence,
} from "../src/scene2d/action-sequence";
const idle: ActionSnapshot = {
  prepared: false,
  rescued: false,
  method: "medicine",
};
function harness(initial = idle, reduced = false) {
  let id = 0;
  const timers = new Map<number, () => void>();
  const seen: ActionFrame[] = [];
  const ended: [ActionSequence, ActionEndReason][] = [];
  const controller = createActionSequence({
    initial,
    reduced,
    schedule: (_delay, callback) => {
      timers.set(++id, callback);
      return id;
    },
    cancel: (timer: number) => {
      timers.delete(timer);
    },
    onFrame: (frame) => seen.push(frame),
    onEnd: (sequence, reason) => ended.push([sequence, reason]),
  });
  const tick = () => {
    const next = timers.entries().next().value;
    if (next) {
      timers.delete(next[0]);
      next[1]();
    }
  };
  return { controller, timers, seen, ended, tick };
}
describe("saved scene action sequences", () => {
  it("replays only a fresh saved preparation, preserves snapshots and completes once", () => {
    const h = harness(Object.freeze({ ...idle }));
    const after = Object.freeze({ ...idle, prepared: true });
    h.controller.sync(after);
    h.controller.sync(after);
    expect(h.seen.map((f) => f.phase)).toEqual(["gather"]);
    h.tick();
    h.tick();
    h.tick();
    h.tick();
    expect(h.seen.map((f) => f.phase)).toEqual(["gather", "warm", "seal"]);
    expect(h.ended).toEqual([["medicine", "completed"]]);
    expect(h.controller.active).toBeUndefined();
    expect(h.timers.size).toBe(0);
    expect(after).toEqual({ ...idle, prepared: true });
  });
  it("does not replay restored completion or a method-only update", () => {
    const saved = { ...idle, prepared: true, rescued: true };
    const h = harness(saved);
    h.controller.sync({ ...saved, method: "guide" });
    expect(h.seen).toEqual([]);
    expect(h.ended).toEqual([]);
    expect(h.timers.size).toBe(0);
  });
  it.each([
    ["guide", ["tie", "agree"]],
    ["ward", ["breathe"]],
  ] as const)("plays %s preparation", (method, phases) => {
    const h = harness({ ...idle, method });
    h.controller.sync({ ...idle, method, prepared: true });
    h.tick();
    h.tick();
    expect(h.seen.map((f) => f.phase)).toEqual(phases);
    expect(h.ended).toEqual([[method, "completed"]]);
  });
  it("replaces preparation with rescue and rejects a cancelled timer even if delivered late", () => {
    const h = harness();
    h.controller.sync({ ...idle, prepared: true });
    const late = [...h.timers.values()][0]!;
    h.controller.sync({ ...idle, prepared: true, rescued: true });
    late();
    expect(h.timers.size).toBe(1);
    h.tick();
    h.tick();
    h.tick();
    expect(h.seen.map((f) => f.phase)).toEqual([
      "gather",
      "brace",
      "receive",
      "escape",
    ]);
    expect(h.ended).toEqual([
      ["medicine", "replaced"],
      ["rescue", "completed"],
    ]);
  });
  it("skip resolves final appearance once and cannot replay the same save", () => {
    const h = harness();
    const saved = { ...idle, rescued: true };
    h.controller.sync(saved);
    h.controller.skip();
    h.controller.skip();
    h.controller.sync(saved);
    h.tick();
    expect(h.ended).toEqual([["rescue", "skipped"]]);
    expect(h.timers.size).toBe(0);
    expect(h.seen).toHaveLength(1);
  });
  it("dispose releases timers, ignores future sync and rejects late callbacks", () => {
    const h = harness();
    h.controller.sync({ ...idle, prepared: true });
    const late = [...h.timers.values()][0]!;
    h.controller.dispose();
    h.controller.dispose();
    late();
    h.controller.sync({ ...idle, rescued: true });
    expect(h.ended).toEqual([["medicine", "disposed"]]);
    expect(h.seen).toHaveLength(1);
    expect(h.timers.size).toBe(0);
  });
  it("reduced motion settles directly without transient frames or timers", () => {
    const h = harness(idle, true);
    h.controller.sync({ ...idle, prepared: true, rescued: true });
    expect(h.seen).toEqual([]);
    expect(h.ended).toEqual([["rescue", "reduced"]]);
    expect(h.timers.size).toBe(0);
  });
  it("does not schedule after a frame callback immediately skips the sequence", () => {
    let scheduled = 0;
    const ended: ActionEndReason[] = [];
    const controller = createActionSequence({
      initial: idle,
      reduced: false,
      schedule: () => ++scheduled,
      cancel: (_timer: number) => {},
      onFrame: () => controller.skip(),
      onEnd: (_sequence, reason) => ended.push(reason),
    });
    controller.sync({ ...idle, prepared: true });
    expect(scheduled).toBe(0);
    expect(ended).toEqual(["skipped"]);
  });
  it("has no preparation animation without a saved method and prioritizes rescue", () => {
    expect(
      savedActionTransition(idle, { ...idle, method: "none", prepared: true }),
    ).toBeUndefined();
    expect(
      savedActionTransition(idle, { ...idle, prepared: true, rescued: true }),
    ).toBe("rescue");
  });
});
