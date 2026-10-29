import { it, expect } from "vitest";
import { createGame, eventView, dispatch } from "../src/core";
import { actionReceipt } from "../src/action-feedback";

it.each([0, 1, 3])(
  "the relic acknowledges %i existing pills without removing them",
  (pills) => {
    const s = createGame("备丹", "wood");
    s.pills = pills;
    s.pending = { id: "relic-choice", kind: "relic" };
    s.story.stage = "relic";
    const view = eventView(s)!;
    expect(view.title).toBe(pills ? "丹药有余，归途同行" : "一丹，两条仙途");
    if (pills) expect(view.body).toContain(`已有的 ${pills} 枚`);
    const gifted = dispatch(s, {
      type: "choose",
      id: "give",
      instanceId: s.pending.id,
      option: "gift",
    });
    expect(gifted.pills).toBe(pills);
  },
);
it("routine investigation stays nonblocking and successful breakthrough calls cultivation a conversion", () => {
  const s = createGame("验收", "wood");
  const n = dispatch(s, {
    type: "adventure",
    action: "inspect",
    id: "inspect",
  });
  const receipt = actionReceipt(s, n, {
    type: "adventure",
    action: "inspect",
  })!;
  expect(receipt.spotlight).toBe(false);
  expect(receipt.ritual).toBeNull();
  const before = { ...s, qi: 360 };
  const after = { ...s, realm: 1 as const, qi: 0, limit: s.limit + 216 };
  const breakthrough = actionReceipt(before, after, {
    type: "break",
    pill: false,
  })!;
  expect(breakthrough.title).toContain("筑基已成");
  expect(
    breakthrough.changes.find((x) => x.label === "炼气修为转化")?.good,
  ).toBe(true);
});
