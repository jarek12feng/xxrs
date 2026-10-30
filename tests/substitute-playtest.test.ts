import { expect, it } from "vitest";
import { runRoute } from "../tools/substitute-playtest";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { foundationMoveSetup } from "../src/foundation-journey/battle-cues";
import { foundationGoal } from "../src/foundation-journey/progression";

it.each(["spring", "blade", "breath"] as const)(
  "%s can recover from deliberate mistakes from a new character without checkpoint grants",
  (technique) => {
    const result = runRoute(42, technique, "mistakes", "insightful", "preview");
    expect(result.error).toBeUndefined();
    expect(result.completed).toBe(true);
    expect(result.replayVerified).toBe(true);
    expect(result.battles.some((b) => !b.won)).toBe(true);
    expect(
      result.trace.some(
        (t) => t.command.type === "advance" && t.command.activity === "rest",
      ),
    ).toBe(true);
    expect(
      result.trace.some(
        (t) =>
          t.command.type === "foundationJourney" &&
          ["sideInvestigate", "covenant"].includes(t.command.action.kind),
      ),
    ).toBe(false);
  },
);
it("exposes future combo value without changing state and advances the goal after real outer victory", () => {
  const p = journeyPlayer(journeyCheckpoint("male"));
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  expect(foundationGoal(p.state)).toContain("点筑基修行");
  p.cultivate(240);
  p.act({ kind: "travel", destination: "frontier" });
  p.act({ kind: "report" });
  p.act({ kind: "signal" });
  p.act({ kind: "battle", battle: "frontier" });
  const before = structuredClone(p.state);
  expect(foundationMoveSetup(p.state, "discern")).toContain("下合反击另增伤 8");
  expect(foundationMoveSetup(p.state, "guard")).toContain("下合反击伤害 +10");
  expect(p.state).toEqual(before);
  p.act({ kind: "withdraw" });
  p.fight("frontier");
  expect(foundationGoal(p.state)).toContain("补给已送达");
  expect(foundationGoal(p.state)).toContain("向程砚学稳脉");
  p.act({ kind: "mentor" });
  expect(foundationGoal(p.state)).toContain("越阶准备");
});
