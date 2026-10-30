import { describe, expect, it } from "vitest";
import {
  createGame,
  dispatch,
  eventView,
  validState,
  migrateSave,
  type State,
  type Intent,
} from "../src/core";
import { foundationPassages } from "../src/foundation";
import { foundationPreparation } from "../src/foundation-preparation";
import { actionReceipt } from "../src/action-feedback";
import { luchiView } from "../src/characters";
import { exchangePreview, moveHint, readiness } from "../src/expedition/combat";
import { foundationReunion } from "../src/foundation-scenes";
const send = (s: State, intent: Intent) =>
  dispatch(s, { ...intent, id: `risk-${s.seen.length}` });
const choose = (s: State, option: string) =>
  ({ type: "choose", instanceId: s.pending!.id, option }) as const;
function waiting(month = 24) {
  const s = createGame("旧路新行", "sword", 42, "perceptive");
  s.month = month;
  s.age += month;
  s.qi = 180;
  s.sense = 8;
  s.story.stage = "waiting";
  s.story.luchi = "companion";
  s.memories.letter = s.memories.visit = true;
  return s;
}
function crossing(solo = false) {
  const s = waiting(36);
  s.story.stage = "crossing";
  if (solo) {
    s.story.choice = "missed";
    s.story.luchi = "distant";
  }
  s.pending = { id: "1:36:crossing", kind: "crossing" };
  return s;
}
it("uses the same choices in preparation and passage, with qi and resource gates intact", () => {
  for (const qi of [179, 180])
    for (const sense of [7, 8]) {
      const s = crossing();
      s.qi = qi;
      s.sense = sense;
      const snapshot = structuredClone(s);
      expect(eventView(s)!.options.filter((o) => o.id !== "withdraw")).toEqual(
        foundationPassages(s),
      );
      const cmd = choose(s, "sense");
      const n = send(s, cmd);
      if (qi < 180 || sense < 8) expect(n).toBe(s);
      else expect(n.pending?.kind).toBe("relic");
      foundationPreparation(s);
      expect(s).toEqual(snapshot);
    }
});
it("batch preparation stops at letters instead of consuming all requested months", () => {
  const s = waiting(10);
  s.memories.letter = false;
  s.memories.visit = false;
  const next = foundationPreparation(s).next!;
  expect(next.intent).toMatchObject({
    type: "advance",
    activity: "work",
    months: 12,
  });
  const n = send(s, next.intent);
  expect(n.month).toBe(12);
  expect(n.pending?.kind).toBe("letter");
  expect(n.stones - s.stones).toBe(10);
  expect(n.seed).toBe(s.seed);
  expect(validState(n)).toBe(true);
});
it("waiting advances only to the appointment and never chooses or misses it", () => {
  const s = waiting(34);
  const next = foundationPreparation(s).next!;
  const n = send(s, next.intent);
  expect(n.month).toBe(36);
  expect(n.pending?.kind).toBe("departure");
  expect(n.story.choice).toBe("none");
  expect(n.story.trust).toBe(s.story.trust);
  expect(send(s, next.intent)).toEqual(n);
  expect(migrateSave(n)).toEqual(n);
});
it("does not offer idle waiting until one route is ready, or invent a way to raise aptitude", () => {
  const s = waiting();
  s.sense = 3;
  s.root = 4;
  s.wisdom = 4;
  s.herbs = 0;
  s.mastery = 0;
  const p = foundationPreparation(s);
  expect(p.ready).toBe(false);
  expect(p.next).toBeNull();
  expect(p.routes.find((r) => r.id === "endure")?.preparation).toBeNull();
  expect(p.routes.find((r) => r.id === "decipher")?.preparation).toBeNull();
  const command = p.routes.find((r) => r.id === "sense")!.preparation!;
  expect(send(s, command.intent).sense).toBe(4);
});
it("qi preparation is bounded, and offers no actions during pending or ended lives", () => {
  const s = waiting();
  s.qi = 0;
  expect(foundationPreparation(s).next!.intent).toMatchObject({
    type: "advance",
    activity: "cultivate",
  });
  for (const n of [
    crossing(),
    { ...s, status: "dead" as const },
    { ...s, status: "complete" as const },
  ]) {
    const p = foundationPreparation(n);
    expect(p.next).toBeNull();
    expect(
      p.routes
        .filter((r) => r.preparation)
        .every((r) => r.preparation!.disabled),
    ).toBe(true);
  }
});
describe("passage scenes preserve actual preparation and companion presence", () => {
  it.each([
    "sense",
    "decipher",
    "medicine",
    "blade",
    "endure",
    "memory",
    "protect",
  ])("%s is a single settled passage, followed by allocation", (option) => {
    const s = crossing();
    if (option === "endure") {
      s.aptitude = "sturdy";
      s.root = 8;
    }
    if (option === "decipher") {
      s.aptitude = "insightful";
      s.wisdom = 8;
    }
    s.study = 2;
    s.herbs = 4;
    s.mastery = 4;
    if (option === "memory") {
      s.inherited = "bond";
      s.unlocked = ["bond"];
    }
    if (option === "protect") s.realm = 1;
    const intent = choose(s, option),
      cmd = { ...intent, id: "pass-once" };
    const n = dispatch(s, cmd),
      saved = structuredClone(n);
    const receipt = actionReceipt(s, n, intent)!;
    expect(receipt.process?.beats).toHaveLength(3);
    expect(n.pending?.kind).toBe("relic");
    expect(n.pills).toBe(0);
    expect(n.herbs).toBe(option === "medicine" ? 0 : 4);
    expect(n.injury).toBe(["blade", "endure"].includes(option) ? 1 : 0);
    expect(dispatch(n, cmd)).toBe(n);
    expect(dispatch(s, cmd)).toEqual(n);
    expect(n).toEqual(saved);
    expect(validState(n)).toBe(true);
  });
  it("never invents the absent friend in solo passage, reward or withdrawal receipts", () => {
    const s = crossing(true);
    for (const option of ["sense", "withdraw"]) {
      const intent = choose(s, option),
        n = send(s, intent);
      expect(actionReceipt(s, n, intent)?.person).toBeUndefined();
      if (option === "sense") {
        const take = choose(n, "self"),
          won = send(n, take);
        expect(actionReceipt(n, won, take)?.person).toBeUndefined();
        expect(won.story.luchi).toBe("distant");
      }
    }
  });
});
it("successful gift breakthrough acknowledges mutual growth, without inventing a reunion for other branches", () => {
  let s = crossing();
  s.qi = 360;
  s = send(s, choose(s, "sense"));
  s = send(s, choose(s, "gift"));
  s.herbs = 6;
  s.stones = 50;
  s = send(s, { type: "prepare", kind: "refine" });
  s.seed = 1;
  const intent = { type: "break", pill: true } as const,
    n = send(s, intent);
  expect(n.realm).toBe(1);
  expect(actionReceipt(s, n, intent)?.person?.response).toContain("当年那枚丹");
  expect(luchiView(n).whereabouts).not.toContain("洞府外");
  expect(
    foundationReunion({ ...n, story: { ...n.story, choice: "self" } }),
  ).toBeNull();
  expect(foundationReunion({ ...n, realm: 0 })).toBeNull();
  n.journey.maps.sea = 3;
  expect(luchiView(n).quote).toContain("这封信");
});
it("first battle hints are actual per-move results with no additional rolls", () => {
  const s = waiting();
  s.expedition.accepted = true;
  s.expedition.duel = { hp: readiness(s).hp, enemy: 34, turn: 0 };
  for (const main of ["spring", "blade", "breath"] as const) {
    s.journey.main = main;
    s.herbs = 4;
    const snapshot = structuredClone(s);
    for (const move of ["guard", "strike", "discern"] as const) {
      const p = exchangePreview(s, move)!;
      expect(moveHint(s, move)).toContain(
        `伤敌 ${p.damage} / 承伤 ${p.incoming}`,
      );
    }
    expect(s).toEqual(snapshot);
  }
});

it("preparation shortcuts stop at the two remaining retreat windows without auto-spending", () => {
  for (const [month, stop] of [
    [20, 23],
    [24, 29],
    [30, 36],
  ]) {
    const s = waiting(month);
    const p = foundationPreparation(s);
    const n = send(s, p.next!.intent);
    expect(n.month).toBe(stop);
    expect(n.foundation).toBe(s.foundation);
    expect(n.mastery).toBe(s.mastery);
    expect(n.stones - s.stones).toBe((stop! - month!) * 5);
    expect(p.optional.some((x) => x.intent.type === "prepare")).toBe(true);
    // Generic batch retains its existing behavior; only the shortcut is bounded.
    const generic = send(s, { type: "advance", activity: "work", months: 12 });
    expect(generic.month).toBe(Math.min(month! + 12, 36));
  }
});
it("optional cultivation preserves the preparation window and projection never mutates state", () => {
  const s = waiting(20),
    before = structuredClone(s);
  const p = foundationPreparation(s);
  const cultivate = p.optional.find(
    (x) => x.intent.type === "advance" && x.intent.activity === "cultivate",
  )!;
  expect(send(s, cultivate.intent).month).toBe(23);
  expect(s).toEqual(before);
  expect(p.timing).toContain("第三十六月或更晚会失约");
});

it("timing and capped preparation gains reflect the actual stage and inventory", async () => {
  const { preparationValues } = await import("../src/cultivation-feedback");
  for (const qi of [350, 360]) {
    const s = waiting(30);
    s.qi = qi;
    s.foundation = 22;
    expect(foundationPreparation(s).timing).toContain(
      `根基 +2、修为 +${360 - qi}`,
    );
    expect(
      preparationValues(s, true).find((x) => x.key === "retreat")!.cost,
    ).toContain(`根基 +2、修为 +${360 - qi}`);
  }
  const s = waiting();
  s.story.choice = "missed";
  s.story.stage = "resolved";
  expect(foundationPreparation(s).timing).toContain("探府前");
  s.story.choice = "self";
  expect(foundationPreparation(s).timing).toContain("取丹后");
  const fresh = createGame("未相识", "wood");
  expect(foundationPreparation(fresh).timing).toContain("探府前");
});
it("training projection includes injury penalty and equipped guard protection", () => {
  const s = waiting();
  s.mastery = 3;
  expect(foundationPreparation(s).trainingHint).toContain(
    "伤势 +1；当前把握净变化 -4",
  );
  const n = send(s, { type: "advance", activity: "train", months: 1 });
  expect(n.injury).toBe(1);
  s.journey.support = "guard";
  expect(foundationPreparation(s).trainingHint).toContain(
    "伤势 +0；当前把握净变化 1",
  );
});
