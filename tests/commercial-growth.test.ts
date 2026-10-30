import { freshFoundationJourney } from "../src/foundation-journey/state";
import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  type State,
  type Technique,
} from "../src/core";
import { mistDetails } from "../src/mist";
import { growthComparison } from "../src/growth-feedback";
import { turnPreview, duelIntent } from "../src/social";

function prepared(main: Technique = "spring", herbs = 8) {
  const s = createGame("同预算", "wood", 42, "perceptive");
  Object.assign(s, {
    month: 48,
    age: 240,
    realm: 1,
    foundation: 12,
    study: 4,
    sense: 8,
    stones: 80,
    herbs,
  });
  Object.assign(s.story, {
    stage: "resolved",
    choice: "gift",
    luchi: "foundation",
  });
  s.memories.letter = s.memories.visit = true;
  s.journey.known = [main, "herb"];
  s.journey.main = main;
  s.journey.support = "herb";
  s.journey.settled = true;
  s.growth.training[main] = 1;
  s.journey.relics[main === "blade" ? "sword" : "vial"] = 1;
  s.journey.equipped = main === "blade" ? "sword" : "vial";
  return s;
}
it("late rewards affect the same mist trial, while caps and inactive equipment stay honest", () => {
  const s = prepared();
  s.adventure.mist.stage = "gate";
  s.adventure.mist.hazard = "echo";
  const old = mistDetails(s).chance;
  const n = structuredClone(s);
  n.journey.relics.vial = 2;
  expect(mistDetails(n).chance - old).toBe(6);
  expect(growthComparison(s, n).join()).toContain("雾海");
  n.journey.relics.sword = 2;
  expect(mistDetails(n).chance).toBe(old + 6);
  n.journey.support = "lantern";
  expect(mistDetails(n).chance).toBe(old + 14);
  n.adventure.mist.ward = true;
  n.adventure.mist.insight = true;
  expect(mistDetails(n).chance).toBe(100);
});
it("clarity saves months, respects cap and cooldown; healing remains available in that cooldown", () => {
  let s = prepared();
  s.sense = 11;
  s.injury = 2;
  s.growth.medicines = { clarity: 2, healing: 1 };
  let n = dispatch(s, { id: "clarity", type: "consume", medicine: "clarity" });
  expect(n.sense).toBe(12);
  expect(n.month).toBe(s.month);
  expect(n.seed).toBe(s.seed);
  expect(n.log[0].text).toContain("神识 +1");
  expect(
    dispatch(n, { id: "again", type: "consume", medicine: "clarity" }),
  ).toBe(n);
  n = dispatch(n, { id: "healing", type: "consume", medicine: "healing" });
  expect(n.injury).toBe(0);
  expect(n.growth.lastMedicineMonth).toBe(s.month);
  expect(validState(n)).toBe(true);
  expect(
    dispatch(n, { id: "healing", type: "consume", medicine: "healing" }),
  ).toBe(n);
});
it("v13 mid-duel migration preserves resources, seed, turn and original; future saves are rejected", () => {
  let s = prepared();
  s = dispatch(s, { id: "scout", type: "arenaScout" });
  s = dispatch(s, { id: "start", type: "arenaStart" });
  const old = { ...s, version: 13 };
  const copy = structuredClone(old);
  expect(migrateSave(old)).toEqual({ ...old, version: 17, foundationJourney: freshFoundationJourney() });
  expect(old).toEqual(copy);
  expect(() => migrateSave({ ...old, version: 18 })).toThrow();
  const invalid = structuredClone(old);
  invalid.social.arena.duel!.turn = 4;
  expect(() => migrateSave(invalid)).toThrow();
});
it("spring trades grass for survival; breath reduces discern damage and blade pays for aggression", () => {
  const s = prepared();
  s.social.arena.duel = {
    opponent: 0,
    turn: 0,
    hp: 10,
    maxHp: 31,
    enemyHp: 23,
    log: [],
  };
  const spring = turnPreview(s, "endure")!;
  expect(spring.herbs).toBe(1);
  s.herbs = 0;
  expect(turnPreview(s, "endure")!.heal).toBe(spring.heal - 6);
  s.journey.main = "blade";
  const blade = turnPreview(s, "break")!;
  s.journey.main = "breath";
  expect(turnPreview(s, "break")!.incoming).toBe(blade.incoming - 2);
});
it("equal-budget builds can win the final arena through public commands and deterministic replay", () => {
  for (const main of ["spring", "blade", "breath"] as const) {
    const initial = prepared(main);
    initial.social.arena.wins = 2;
    const play = () => {
      let s = dispatch(initial, { id: "scout", type: "arenaScout" });
      s = dispatch(s, { id: "start", type: "arenaStart" });
      for (let i = 0; s.social.arena.duel && i < 6; i++) {
        s = dispatch(s, {
          id: `turn-${i}`,
          type: "arenaTurn",
          stance: main === "spring" && i === 1 ? "endure" : duelIntent(s)!,
        });
        expect(validState(s)).toBe(true);
      }
      return s;
    };
    const result = play();
    expect(result.social.arena.wins, main).toBe(3);
    expect(play()).toEqual(result);
  }
});

import { actionReceipt } from "../src/action-feedback";
import { growthGoals } from "../src/growth";
import { expeditionGoal, familyQuestGoal } from "../src/expedition/progression";
import { nextGoal } from "../src/world";
import { arenaMatrix } from "../tools/combat-matrix";
it("promotion receipt distinguishes a trained book from an actual new book", () => {
  const s = prepared();
  s.journey.branch = "dan";
  s.journey.contribution = 6;
  s.journey.duties = 3;
  s.journey.mentor = true;
  const n = dispatch(s, { id: "promote", type: "promote" });
  expect(n.stones - s.stones).toBe(12);
  const receipt = actionReceipt(s, n, { type: "promote" })!;
  expect(receipt.next).toContain("改赠灵石 12");
  expect(receipt.title).not.toContain("新功法");
  expect(receipt.unlocks).toEqual([]);
  expect(dispatch(n, { id: "again", type: "promote" })).toBe(n);
});
it("gift text preserves the distinction between self-made reserve and the estate pill", () => {
  for (const pills of [0, 1]) {
    const s = prepared();
    s.realm = 0;
    s.journey.settled = false;
    s.story.stage = "relic";
    s.story.choice = "none";
    s.story.luchi = "companion";
    s.pills = pills;
    s.pending = { id: `${s.life}:${s.month}:relic`, kind: "relic" };
    const n = dispatch(s, {
      id: "gift",
      type: "choose",
      instanceId: s.pending.id,
      option: "gift",
    });
    expect(n.pills).toBe(pills);
    const text = n.log.map((l) => l.text).join();
    expect(text).toContain(pills ? "自备的 1 枚丹药仍留给自己" : "遗府中唯一");
  }
});
it("completed goals do not send players back to completed arena or shrine", () => {
  const s = prepared();
  s.expedition.cleared = 3;
  s.social.arena.wins = 3;
  s.journey.maps = { valley: 3, peak: 3, sea: 3 };
  expect(growthGoals(s).join()).not.toContain("完成守阵交锋");
  expect(nextGoal(s)).not.toContain("参加听松擂台");
  expect(familyQuestGoal(s)).toContain("已完成");
  s.realm = 0;
  s.expedition.accepted = true;
  s.expedition.cleared = 2;
  expect(expeditionGoal(s)).not.toContain("先在储物袋装配");
  expect(expeditionGoal(s)).not.toContain("在功法页研修主修");
});
it("same-budget arena matrix exposes resource and preparation tradeoffs", () => {
  const rows = arenaMatrix();
  expect(rows).toHaveLength(36);
  expect(
    rows
      .filter((r) => r.tier === "normal")
      .every((r) => r.winningSequences > 0),
  ).toBe(true);
  expect(
    rows.filter((r) => r.tier === "full").every((r) => r.winningSequences > 0),
  ).toBe(true);
  const spring = rows.find(
    (r) => r.tier === "normal" && r.main === "spring" && r.opponent === 2,
  )!;
  const dry = rows.find(
    (r) => r.tier === "no-grass" && r.main === "spring" && r.opponent === 2,
  )!;
  expect(spring.winningSequences).toBeGreaterThan(1);
  expect(spring.fastest!.grass).toBeGreaterThan(0);
  expect(dry.winningSequences).toBe(0);
  expect(
    rows.find(
      (r) => r.tier === "normal" && r.main === "blade" && r.opponent === 2,
    )!.fastest!.rounds,
  ).toBeLessThan(spring.fastest!.rounds);
});
it("duplicate arena rewards pay once and defeat explains the recovery route", () => {
  const s = prepared();
  s.social.arena.wins = 1;
  s.journey.known.push("guard");
  let n = dispatch(s, { id: "scout", type: "arenaScout" });
  n = dispatch(n, { id: "start", type: "arenaStart" });
  expect(n.social.arena.duel).not.toBeNull();
  n.social.arena.duel!.enemyHp = 1;
  const before = n.stones;
  const won = dispatch(n, { id: "win", type: "arenaTurn", stance: "discern" });
  expect(won.stones - before).toBe(24);
  expect(won.social.arena.last).toContain("折为灵石 12");
  expect(dispatch(won, { id: "win", type: "arenaTurn", stance: "discern" })).toBe(won);

  let poor = prepared("spring", 0);
  poor.growth.medicines.healing = 1;
  poor = dispatch(poor, { id: "scout", type: "arenaScout" });
  poor = dispatch(poor, { id: "start", type: "arenaStart" });
  poor.social.arena.duel!.hp = 1;
  poor.social.arena.duel!.enemyHp = 1;
  const lost = dispatch(poor, { id: "loss", type: "arenaTurn", stance: "endure" });
  expect(lost.social.arena.wins).toBe(0);
  expect(lost.herbs).toBe(0);
  expect(lost.social.arena.last).toContain("同时耗尽");
  expect(lost.social.arena.last).toContain("先采药");
  expect(lost.social.arena.last).toContain("储物袋有回春散");
  expect(validState(lost)).toBe(true);
});
