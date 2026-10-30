import { expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { trialBoard, journeyHorizon } from "../src/world-ambition";
import { openingGuide } from "../src/opening-guide";
import { lifeReview } from "../src/life-review";
import { actionReceipt } from "../src/action-feedback";
import { arenaFixture } from "../tools/growth-balance";

it("projects the current-life board without changing saves or inventing wins", () => {
  const s = createGame("听松客", "wood");
  expect(trialBoard(s).requirement).toContain("十八岁");
  expect(trialBoard(s).title).toBe("尚未入榜");
  for (let wins = 0; wins <= 3; wins++) {
    s.social.arena.wins = wins;
    const before = structuredClone(s);
    const board = trialBoard(s);
    expect(board.next).toBe(["巩砚", "裴逐风", "邱星罗", null][wins]);
    expect(s).toEqual(before);
  }
  expect(trialBoard(s).requirement).toContain("不重复发奖");
  const next = dispatch(
    { ...s, status: "dead" },
    { id: "next", type: "next", path: "wood", inheritance: "none" },
  );
  expect(trialBoard(next).title).toBe("尚未入榜");
});
it("records an actual command-settled win in the receipt with no additional reward", () => {
  let s = arenaFixture("blade", 42, "sword", "herb", "normal", 0);
  s = dispatch(s, { id: "start", type: "arenaStart" });
  for (let i = 0; i < 6 && s.social.arena.duel; i++) {
    const before = s;
    s = dispatch(s, { id: `turn-${i}`, type: "arenaTurn", stance: "break" });
    if (s.social.arena.wins > before.social.arena.wins) {
      const receipt = actionReceipt(before, s, {
        type: "arenaTurn",
        stance: "break",
      });
      expect(receipt?.title).toContain("初登试剑榜");
      expect(receipt?.notes.join()).toContain("巩砚");
      expect(
        dispatch(before, {
          id: `turn-${i}`,
          type: "arenaTurn",
          stance: "break",
        }),
      ).toEqual(s);
    }
  }
  expect(s.social.arena.wins).toBe(1);
});
it("keeps missed equipment actionable, and stops asking after equipping", () => {
  const s = createGame("药队", "wood");
  s.adventure.step = "done";
  s.adventure.road.thanked = true;
  s.adventure.road.map = true;
  s.journey.known = ["spring"];
  s.journey.main = "spring";
  s.expedition.accepted = true;
  s.expedition.cleared = 1;
  s.journey.relics.vial = 1;
  expect(openingGuide(s)?.title).toContain("灵器");
  s.journey.equipped = "vial";
  expect(openingGuide(s)?.title).not.toContain("未装配");
  s.pending = { kind: "meeting", id: "test" } as typeof s.pending;
  expect(openingGuide(s)).toBeNull();
});
it("separates chapter completion from optional ranking and remembers noncombat choices", () => {
  const s = createGame("归路", "wood");
  expect(journeyHorizon(s).stage).toContain("药工");
  expect(lifeReview(s).records.join()).not.toContain("成株");
  s.adventure.step = "done";
  s.adventure.rescueChoice = "supplies";
  s.adventure.road.surveyed = true;
  expect(journeyHorizon(s).stage).toContain("本篇已完成");
  expect(journeyHorizon(s).chapter).toContain("可选");
  expect(lifeReview(s).records.join()).toContain("暂歇一季");
  expect(lifeReview(s).records.join()).not.toContain("试剑榜");
});

it("keeps the horizon on the old-array objective before and after foundation", () => {
  const s = createGame("待战", "wood", 42);
  s.adventure.step = "done";
  s.expedition.cleared = 2;
  expect(journeyHorizon(s).stage).toContain("筑基后重返");
  s.realm = 1;
  expect(journeyHorizon(s).stage).toContain("挑战守阵者");
  expect(journeyHorizon(s).stage).not.toContain("护送药车、取得灵器");
});
