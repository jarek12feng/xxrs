import { luchiView } from "../src/characters";
import { describe, expect, it } from "vitest";
import { createGame, dispatch, validState, arenaError } from "../src/core";
import { rejectedActionReason } from "../src/action-diagnostics";
import { sceneOwner, combatOwner } from "../src/scene-activity";
import { storyChapter } from "../src/scene2d/story-routing";
import { automaticPause } from "../src/cultivation-feedback";
import {
  preparationPlan,
  preparationCompleted,
} from "../src/workshop/preparation";
import { workshopQuote } from "../src/workshop/rules";

describe("preparation and rejected commands", () => {
  it("reports the actual workshop quote without changing state or RNG", () => {
    const s = createGame("筹备", "wood", 42);
    s.stones = 0;
    const before = structuredClone(s),
      intent = {
        type: "workshop",
        order: { product: "ward", method: "buy" },
      } as const;
    expect(dispatch(s, { ...intent, id: "no-money" })).toBe(s);
    expect(rejectedActionReason(s, intent)).toBe(
      workshopQuote(s, intent.order).error,
    );
    expect(s).toEqual(before);
  });
  it("shows a specific breakthrough gate and pending-event recovery", () => {
    const s = createGame("门槛", "wood", 42);
    expect(rejectedActionReason(s, { type: "break", pill: true })).toContain(
      "淬脉",
    );
    s.pending = { id: "meeting", kind: "meeting" };
    expect(
      rejectedActionReason(s, { type: "advance", activity: "work", months: 1 }),
    ).toContain("回应");
  });
  it("collects only the missing budget, does not buy automatically and permits retry", () => {
    let s = createGame("筹资", "wood", 42);
    s.stones = 2;
    const order = { product: "healing", method: "buy" } as const;
    const before = structuredClone(s),
      plan = preparationPlan(s, order);
    expect(s).toEqual(before);
    const work = plan.steps.find(
      (x) => x.intent.type === "advance" && x.intent.activity === "work",
    )!;
    expect(work.error).toBe("");
    s = dispatch(s, { ...work.intent, id: "work" });
    expect(s.stones).toBe(before.stones + work.gain);
    expect(s.growth.medicines.healing).toBe(0);
    expect(preparationPlan(s, order).deficits.stones).toBe(0);
    s = dispatch(s, { type: "workshop", order, id: "buy" });
    expect(s.growth.medicines.healing).toBe(1);
    expect(validState(s)).toBe(true);
  });
  it("estimates trained herb support and never unlocks unlearned gathering", () => {
    const s = createGame("采药", "wood", 42);
    s.herbs = 0;
    const order = { product: "ward", method: "craft" } as const;
    expect(
      preparationPlan(s, order).steps.find((x) => x.label === "采药备灵草")!
        .error,
    ).toContain("先学");
    expect(preparationPlan(s, order).purchases[0]).toMatchObject({
      error: "",
      intent: { type: "supplies" },
    });
    s.journey.known.push("herb");
    s.journey.support = "herb";
    s.growth.training.herb = 2;
    const step = preparationPlan(s, order).steps.find(
      (x) => x.label === "采药备灵草",
    )!;
    expect(step.error).toBe("");
    expect(step.gain).toBe(step.months * 5);
  });
  it("stops batched recovery when healthy without taking extra months", () => {
    const s = createGame("恢复", "wood", 42);
    s.story.stage = "resolved";
    s.story.choice = "missed";
    s.story.luchi = "distant";
    s.month = 40;
    s.age = 232;
    s.injury = 2;
    const intent = {
      type: "advance",
      activity: "rest",
      months: 12,
      id: "heal",
    } as const;
    const n = dispatch(s, intent);
    expect(n.month - s.month).toBe(2);
    expect(n.injury).toBe(0);
    expect(n.stones).toBe(s.stones);
    expect(n.seed).toBe(s.seed);
    expect(dispatch(s, intent)).toEqual(n);
    expect(dispatch(n, intent)).toBe(n);
  });
  it("interrupts recovery at a real event and preserves remaining injury", () => {
    const s = createGame("约期", "wood", 42);
    s.injury = 6;
    const n = dispatch(s, {
      type: "advance",
      activity: "rest",
      months: 6,
      id: "heal",
    });
    expect(n.month).toBe(3);
    expect(n.pending).toBeTruthy();
    expect(n.injury).toBeGreaterThan(0);
    expect(
      dispatch(n, {
        type: "advance",
        activity: "rest",
        months: 6,
        id: "again",
      }),
    ).toBe(n);
  });
  it("blocks preparation commands during events without changing the selected plan", () => {
    const s = createGame("事件", "wood", 42);
    s.stones = 0;
    s.pending = { id: "meeting", kind: "meeting" };
    const p = preparationPlan(s, { product: "ward", method: "buy" });
    expect(p.steps.every((x) => !!x.error)).toBe(true);
  });
});
describe("shared encounter ownership", () => {
  it("keeps the qi scene between fights and pauses automatic actions", () => {
    const s = createGame("现场", "wood", 42);
    s.qiJourney.node = 1;
    expect(combatOwner(s)).toBeNull();
    expect(sceneOwner(s)).toBe("qi");
    expect(storyChapter(s, "road")).toBe("qi");
    expect(automaticPause(s, "work", false)?.text).toContain("探索现场");
    s.qiJourney.node = 0;
    expect(sceneOwner(s)).toBeNull();
  });
  it("keeps a noncombat conclave visit navigationally owned but allows preparation", () => {
    const s = createGame("会谷", "wood", 42);
    s.realm = 2;
    s.conclave.location = "court";
    expect(sceneOwner(s)).toBe("conclave");
    expect(combatOwner(s)).toBeNull();
    expect(automaticPause(s, "work", false)).toBeNull();
    s.conclave.location = "vault";
    expect(automaticPause(s, "work", false)?.text).toContain("探索现场");
  });
});
describe("remaining resource settlement", () => {
  it("rejects a full herb inventory atomically and retries after room is made", () => {
    const s = createGame("补给", "wood", 42);
    s.herbs = 1e9;
    s.stones = 20;
    const before = structuredClone(s),
      c = { type: "supplies", id: "supply" } as const;
    expect(dispatch(s, c)).toBe(s);
    expect(s).toEqual(before);
    expect(rejectedActionReason(s, c)).toContain("上限");
    const n = dispatch({ ...s, herbs: 1e9 - 4 }, c);
    expect(n.herbs).toBe(1e9);
    expect(n.stones).toBe(12);
    expect(n.seen).toContain("supply");
  });
  it("checks arena reward capacity before paying or starting, including duplicate books", () => {
    const s = createGame("试剑", "wood", 42);
    s.age = 240;
    s.month = 48;
    s.story.stage = "resolved";
    s.story.choice = "missed";
    s.story.luchi = "distant";
    s.social.arena.scouted = [0];
    s.journey.known.push("breath");
    s.stones = 1e9;
    expect(arenaError(s)).toContain("上限");
    expect(dispatch(s, { type: "arenaStart", id: "enter" })).toBe(s);
    s.stones -= 20;
    const n = dispatch(s, { type: "arenaStart", id: "enter" });
    expect(n.social.arena.duel).toBeTruthy();
    expect(n.stones).toBe(s.stones - 4);
    n.social.arena.duel!.enemyHp = 1;
    n.stones = 1e9;
    const before = structuredClone(n),
      last = { type: "arenaTurn", stance: "break", id: "final" } as const;
    expect(dispatch(n, last)).toBe(n);
    expect(n).toEqual(before);
    n.stones = 1e9 - 20;
    const won = dispatch(n, last);
    expect(won.social.arena.wins).toBe(1);
    expect(won.stones).toBe(1e9);
    expect(won.social.arena.duel).toBeNull();
    expect(dispatch(won, last)).toBe(won);
  });
});

it("does not invent a completed rescue when preparation reaches the meeting early", () => {
  const s = createGame("相逢", "wood", 42);
  s.pending = { id: "meeting", kind: "meeting" };
  s.adventure.step = "apothecary";
  expect(luchiView(s).quote).not.toContain("上次一起救人");
  s.adventure.step = "done";
  expect(luchiView(s).quote).toContain("上次一起救人");
});

it("consuming an existing medicine does not fulfill a new preparation", () => {
  const s = createGame("筹备判断", "wood", 42);
  const selection = {
    order: { product: "healing", method: "buy" },
    outcome: 1,
  } as const;
  expect(preparationCompleted(s, selection)).toBe(false);
  s.growth.medicines.healing = 2;
  expect(preparationCompleted(s, selection)).toBe(true);
});
