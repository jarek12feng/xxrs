import { expect, it } from "vitest";
import { createGame, dispatch, type Intent, type State } from "../src/core";
import { actionReceipt } from "../src/action-feedback";
const send = (s: State, c: Intent) =>
  dispatch(s, { ...c, id: `feedback-${s.seen.length}` });
function met() {
  let s = send(createGame("验丹", "wood", 42), {
    type: "advance",
    activity: "gather",
    months: 3,
  });
  s.crafted = 1; // Existing recipe retained from an earlier save.
  return send(s, {
    type: "choose",
    instanceId: s.pending!.id,
    option: "promise",
  });
}
it("reports actual alchemy gain, gross inputs and net stones including monthly income", () => {
  const s = met(),
    c = { type: "prepare", kind: "refine" } as const;
  const n = send(s, c),
    r = actionReceipt(s, n, c)!;
  expect(r.title).toContain("丹成");
  expect(r.cost).toContain("灵石 −12");
  expect(r.months).toBe(3);
  expect(r.changes).toContainEqual({
    label: "灵石",
    before: 28,
    after: 19,
    good: false,
  });
  expect(r.changes).toContainEqual({
    label: "筑基丹",
    before: 0,
    after: 1,
    good: true,
  });
  expect(r.notes.join()).not.toContain("约定同行");
});
it("does not announce a pill when lifespan ends during refining", () => {
  const s = met();
  s.age = s.limit - 1;
  const c = { type: "prepare", kind: "refine" } as const;
  const r = actionReceipt(s, send(s, c), c)!;
  expect(r.tone).toBe("warning");
  expect(r.title).toContain("寿元已尽");
  expect(r.changes.some((c) => c.label === "筑基丹")).toBe(false);
  expect(r.next).not.toContain("丹药已收入");
});
it("reports preparation caps instead of promising the nominal reward", () => {
  const s = met();
  s.foundation = 23;
  s.qi = 359;
  const c = { type: "prepare", kind: "retreat" } as const;
  const r = actionReceipt(s, send(s, c), c)!;
  expect(r.changes.find((c) => c.label === "根基")?.after).toBe(24);
  expect(r.changes.find((c) => c.label === "修为")?.after).toBe(360);
});
it("preserves pending story after alchemy and points to its continuation", () => {
  const s = met();
  s.month = 10;
  s.age = 202;
  const c = { type: "prepare", kind: "refine" } as const,
    n = send(s, c);
  expect(n.pending?.kind).toBe("letter");
  expect(actionReceipt(s, n, c)?.next).toContain("剧情");
});
it("displays true seeded breakthrough successes and failures without changing states", () => {
  const outcomes = new Set<string>();
  for (const seed of [1, 42, 10000, 123456, 987654321]) {
    const s = met();
    s.seed = seed;
    s.qi = 360;
    s.pills = 1;
    const c = { type: "break", pill: true } as const,
      n = send(s, c),
      copy = structuredClone(n);
    const r = actionReceipt(s, n, c)!;
    expect(r.title).toContain(n.realm ? "筑基已成" : "突破未成");
    expect(r.changes).toContainEqual({
      label: "筑基丹",
      before: 1,
      after: 0,
      good: false,
    });
    if (!n.realm) expect(r.next).toContain("养伤");
    outcomes.add(r.tone);
    expect(n).toEqual(copy);
    expect(actionReceipt(s, n, c)).toEqual(r);
  }
  expect(outcomes).toEqual(new Set(["success", "warning"]));
});
it("does not invent receipts for rejected commands", () => {
  const s = createGame("修士", "wood"),
    c = { type: "break", pill: false } as const;
  expect(actionReceipt(s, send(s, c), c)).toBeNull();
});
it("identifies failed first-chapter rescue even though its log kind is story", () => {
  let s = createGame("旅人", "wood");
  for (const action of ["inspect", "depart", "depart", "trail"] as const)
    s = send(s, { type: "adventure", action });
  const c = { type: "adventure", action: "challenge" } as const,
    n = send(s, c);
  expect(n.adventure.attempts).toBe(1);
  expect(actionReceipt(s, n, c)?.tone).toBe("warning");
});
it("labels queued alchemy correctly", () => {
  const s = send(met(), { type: "enqueue", action: "refine", repeat: 1 });
  const c = { type: "queueTick" } as const;
  expect(actionReceipt(s, send(s, c), c)?.title).toContain("丹成");
});
it("handles a full log ring without recycling old entries", () => {
  const s = met();
  s.log = Array.from({ length: 180 }, (_, i) => ({
    month: 0,
    text: `旧事${i}`,
    kind: "story",
  }));
  const c = { type: "advance", activity: "gather", months: 3 } as const;
  const r = actionReceipt(s, send(s, c), c)!;
  expect(r.notes).toHaveLength(3);
  expect(r.notes.join()).not.toContain("旧事");
});
