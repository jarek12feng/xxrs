import { expect, it } from "vitest";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import { mistGoal } from "../src/mist";
import { luchiView } from "../src/characters";
it("completed return never asks to illuminate the shrine again", () => {
  const s = mistCheckpoint();
  Object.assign(s.adventure.mist, {
    stage: "home",
    settled: true,
    revisited: true,
    lamp: true,
  });
  expect(mistGoal(s)).toContain("已完成");
  expect(mistGoal(s)).not.toContain("重访");
});
it("delivered father letter takes precedence over old travelling dialogue", () => {
  const s = mistCheckpoint();
  s.journey.maps.sea = 3;
  Object.assign(s.adventure.mist, {
    stage: "home",
    partner: "luchi",
    settled: true,
  });
  expect(luchiView(s).known).toContain("来信");
  expect(luchiView(s).quote).not.toContain("没读完");
  expect(luchiView(s).whereabouts).toContain("故乡");
});

import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  cultivationGain,
  type State,
} from "../src/core";
import { readiness, exchangePreview } from "../src/expedition/combat";
import { expeditionSession } from "../tools/expedition-simulation";
function learner() {
  const s = createGame("试炼", "sword", 91);
  s.study = 2;
  s.stones = 80;
  s.herbs = 20;
  s.journey.known = ["blade", "guard"];
  s.journey.main = "blade";
  s.journey.support = "guard";
  return s;
}
it("training is bounded, affects actual combat and cultivation, and preserves seed", () => {
  const s = learner(),
    old = structuredClone(s);
  const n = dispatch(s, {
    id: "train",
    type: "trainTechnique",
    technique: "blade",
  });
  expect(n.growth.training.blade).toBe(1);
  expect(n.seed).toBe(s.seed);
  expect(readiness(n).damage - readiness(s).damage).toBe(2);
  expect(cultivationGain(n) - cultivationGain(s)).toBe(2);
  expect(
    dispatch(n, { id: "again", type: "trainTechnique", technique: "blade" }),
  ).toBe(n);
  expect(
    dispatch(n, { id: "train", type: "trainTechnique", technique: "blade" }),
  ).toBe(n);
  expect(s).toEqual(old);
  expect(validState(n)).toBe(true);
  expect(
    dispatch(s, { id: "train", type: "trainTechnique", technique: "blade" }),
  ).toEqual(n);
});
it("clarity has cooldown but healing does not block it, cannot waste capped effects, and rejects invalid commands", () => {
  const s = learner();
  s.injury = 1;
  let n = dispatch(s, { id: "brew", type: "brew", medicine: "healing" });
  expect(n.growth.medicines.healing).toBe(1);
  n = dispatch(n, { id: "use", type: "consume", medicine: "healing" });
  expect(n.injury).toBe(0);
  expect(n.growth.medicines.healing).toBe(0);
  n = dispatch(n, { id: "brew2", type: "brew", medicine: "clarity" });
  const sense = n.sense;
  n = dispatch(n, { id: "use2", type: "consume", medicine: "clarity" });
  expect(n.sense).toBe(sense + 2);
  n = dispatch(n, { id: "brew3", type: "brew", medicine: "clarity" });
  expect(
    dispatch(n, { id: "early", type: "consume", medicine: "clarity" }),
  ).toBe(n);
  n.month += 3;
  expect(
    dispatch(n, { id: "use3", type: "consume", medicine: "clarity" }).sense,
  ).toBe(sense + 4);
  expect(
    dispatch(n, { id: "bad", type: "brew", medicine: "bogus" as "clarity" }),
  ).toBe(n);
});
it("growth commands are blocked by each terminal and interactive state", () => {
  for (const mutate of [
    (s: State) => {
      s.status = "dead";
    },
    (s: State) => {
      s.status = "complete";
    },
    (s: State) => {
      s.pending = { id: "e", kind: "meeting" };
    },
    (s: State) => {
      s.expedition.duel = { hp: 20, enemy: 20, turn: 0 };
    },
    (s: State) => {
      s.social.scene = { id: "x", kind: "meet" };
    },
  ]) {
    const s = learner();
    mutate(s);
    expect(
      dispatch(s, { id: "t", type: "trainTechnique", technique: "blade" }),
    ).toBe(s);
    expect(dispatch(s, { id: "b", type: "brew", medicine: "clarity" })).toBe(s);
  }
});
it("migrates v12 conservatively, rejects corrupt growth, and retains it across monthly updates", () => {
  const s = learner();
  const { growth: _, ...rest } = s;
  const old = { ...rest, version: 12 };
  const copy = structuredClone(old);
  const n = migrateSave(old);
  expect(n.version).toBe(18);
  expect(old).toEqual(copy);
  expect(n.seed).toBe(old.seed);
  expect(
    validState({
      ...n,
      growth: { ...n.growth, medicines: { healing: -1, clarity: 0 } },
    }),
  ).toBe(false);
  const t = dispatch(n, {
    id: "t",
    type: "trainTechnique",
    technique: "blade",
  });
  const advanced = dispatch(t, {
    id: "a",
    type: "advance",
    activity: "work",
    months: 1,
  });
  expect(advanced.growth).toEqual(t.growth);
  expect(validState(advanced)).toBe(true);
});
it("escort earns usable equipment and medicine once; a closed boss core punishes unprepared strikes", () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  expect(p.state.journey.relics.sword + p.state.journey.relics.vial).toBe(1);
  expect(p.state.growth.medicines.healing).toBe(1);
  const s = learner();
  s.realm = 1; // Guardian combat opens only after foundation breakthrough.
  s.expedition = {
    accepted: true,
    cleared: 2,
    attempts: 3,
    duel: { hp: 40, enemy: 64, turn: 0 },
    last: "",
    effect: "none",
  };
  const blind = exchangePreview(s, "strike")!;
  s.expedition.effect = "discern";
  const prepared = exchangePreview(s, "strike")!;
  expect(prepared.damage).toBeGreaterThan(blind.damage);
  expect(prepared.incoming).toBeLessThan(blind.incoming);
});
import { challengeDetails, encounterDescription } from "../src/world";
import { expeditionMistEcho } from "../src/expedition/resolution";
it("first rescue supplies a path-specific skill and never duplicates it", () => {
  const p = expeditionSession(42, "sword");
  expect(p.state.journey.known).toContain("blade");
  const s = p.state;
  expect(
    dispatch(s, { id: "repeat-return", type: "adventure", action: "return" }),
  ).toBe(s);
});
it("rescued garden changes later encounter text and allows cost-free peaceful passage", () => {
  const s = mistCheckpoint();
  s.adventure.mist.garden = true;
  s.journey.maps.valley = 3;
  s.journey.approach = "rescue";
  s.journey.maps.peak = 1;
  s.journey.encounters.peak = {
    kind: "guardian",
    aid: "none",
    attempts: 0,
    passed: false,
    lastRoll: 0,
    lastChance: 0,
    outcome: "none",
  };
  s.herbs = 0;
  s.sense = 8;
  s.study = 2;
  s.injury = 0;
  expect(encounterDescription(s, "guardian")).toContain("救过药圃");
  const n = dispatch(s, {
    id: "peace",
    type: "challenge",
    place: "peak",
    mode: "parley",
  });
  expect(n.journey.encounters.peak?.outcome).toBe("peace");
  expect(n.herbs).toBe(0);
});
it("returning after supplementary evidence acknowledges it without rewarding affection twice", () => {
  const s = mistCheckpoint();
  s.expedition.cleared = 3;
  Object.assign(s.adventure.mist, {
    stage: "station",
    station: true,
    passed: true,
    lamp: true,
    settled: true,
    revisited: true,
  });
  const n = dispatch(s, { id: "supplement", type: "mist", action: "home" });
  expect(n.adventure.mist.result).toContain("随队救治");
  expect(n.social.affection).toBe(s.social.affection);
  expect(n.story.trust).toBe(s.story.trust);
  expect(expeditionMistEcho(n, "share")).not.toContain("还未核实");
});
it("prepared spirit tools matter more than bare attributes in a mid-game encounter", () => {
  const s = learner();
  s.sense = 8;
  s.foundation = 12;
  s.mastery = 4;
  s.study = 3;
  s.journey.encounters.peak = {
    kind: "raider",
    aid: "luchi",
    attempts: 0,
    passed: false,
    lastRoll: 0,
    lastChance: 0,
    outcome: "none",
  };
  const bare = challengeDetails(s, "peak")!.chance;
  expect(bare).toBeLessThan(100);
  s.journey.equipped = "sword";
  s.journey.relics.sword = 2;
  expect(challengeDetails(s, "peak")!.chance).toBe(100);
});
it("equipped training changes monthly settlement and the recorded gains together", () => {
  const s = learner();
  s.growth.training.blade = 1;
  const n = dispatch(s, {
    id: "monthly",
    type: "advance",
    activity: "train",
    months: 1,
  });
  expect(n.qi - s.qi).toBe(16);
  expect(
    n.log.some(
      (l) => l.text.includes("修为 +16") && l.text.includes("已计入功法"),
    ),
  ).toBe(true);
  expect(n.log.some((l) => l.text.includes("修为 +10；每四重"))).toBe(false);
  const foundation = { ...s, realm: 1 as const, qi: 0 };
  expect(
    dispatch(foundation, {
      id: "post-foundation",
      type: "advance",
      activity: "train",
      months: 1,
    }).qi,
  ).toBe(0);
});
import { turnPreview } from "../src/social";
it("arena guard reduces both damage and incoming, and trained support mitigates damage", () => {
  const s = learner();
  s.social.arena.duel = {
    opponent: 0,
    turn: 0,
    hp: 28,
    maxHp: 28,
    enemyHp: 23,
    log: [],
  };
  const strike = turnPreview(s, "break")!,
    guard = turnPreview(s, "endure")!;
  expect(guard.damage).toBeLessThan(strike.damage);
  const untrained = guard.incoming;
  s.growth.training.guard = 1;
  expect(turnPreview(s, "endure")!.incoming).toBe(untrained - 1);
});
