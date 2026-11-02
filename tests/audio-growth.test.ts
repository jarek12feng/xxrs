import { expect, it } from "vitest";
import { createGame, dispatch, type Intent } from "../src/core";
import { gameAudioScene } from "../src/audio-scene";
import { actionSound } from "../src/action-sound";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";

it("scores qi battles and the interval between them, and clears combat on the title screen", () => {
  const s = createGame("听音", "wood", 42);
  s.qiJourney.node = 1;
  s.qiJourney.duel = { hp: 10, enemy: 20, turn: 0, effect: "none" };
  expect(gameAudioScene(s, "", "听松山居").music).toBe("trial");
  s.qiJourney.duel = null;
  s.qiJourney.node = 2;
  expect(gameAudioScene(s, "", "听松山居").music).toBe("mystery");
  s.qiJourney.node = 0;
  expect(gameAudioScene(s, "", "听松山居").music).toBe("home");
  expect(gameAudioScene(null, "", "听松山居").music).toBe("home");
});

it("keeps foundation location music in its visible panel and all duel systems take priority", () => {
  const s = journeyCheckpoint();
  s.foundationJourney.location = "estate";
  expect(gameAudioScene(s, "world", "听松山居").music).toBe("journey");
  expect(gameAudioScene(s, "", "听松山居").music).toBe("foundation");
  s.foundationJourney.location = "home";
  s.foundationJourney.heroine.meeting = "insight";
  s.foundationJourney.heroine.map = "none";
  expect(gameAudioScene(s, "world", "听松山居").music).toBe("survey");
  s.foundationJourney.duel = {
    ruleset: 2,
    id: "well",
    hp: 10,
    enemy: 20,
    turn: 0,
    effect: "none",
    aid: false,
  };
  expect(gameAudioScene(s, "world", "听松山居").music).toBe("frontier");
  s.foundationJourney.duel = null;
  s.social.arena.duel = {
    opponent: 0,
    hp: 10,
    maxHp: 10,
    enemyHp: 20,
    turn: 0,
    log: [],
  };
  expect(gameAudioScene(s, "world", "听松山居").music).toBe("trial");
});

it("plays defeat at capped injury and does not mistake withdrawal for defeat", () => {
  const before = createGame("败退", "wood", 42);
  before.injury = 6;
  before.qiJourney.node = 1;
  before.qiJourney.duel = { hp: 1, enemy: 200, turn: 15, effect: "none" };
  const after = structuredClone(before);
  after.qiJourney.duel = null;
  after.qiJourney.node = 0;
  expect(
    actionSound(before, after, { type: "qiJourney", action: "guard" }),
  ).toBe("hurt");
  expect(
    actionSound(before, after, { type: "qiJourney", action: "withdraw" }),
  ).toBe("choice");
});

it("plays growth and shared journey cues only for newly earned results", () => {
  const before = journeyCheckpoint();
  const cases: [Intent, (s: typeof before) => void, string][] = [
    [
      {
        type: "foundationJourney",
        action: { kind: "routeProcess", route: "estate", method: "self" },
      },
      (s) => (s.foundationJourney.growth.refined = true),
      "upgrade",
    ],
    [
      { type: "foundationJourney", action: { kind: "move", move: "guard" } },
      (s) => (s.foundationJourney.growth.steady = "practice"),
      "ward-learn",
    ],
    [
      {
        type: "foundationJourney",
        action: { kind: "mapPlan", plan: "public" },
      },
      (s) => (s.foundationJourney.heroine.map = "public"),
      "route-mark",
    ],
    [
      { type: "foundationJourney", action: { kind: "expeditionPlan" } },
      (s) => (s.foundationJourney.heroine.expedition = true),
      "signal-send",
    ],
  ];
  before.foundationJourney.heroine.map = "none";
  for (const [intent, change, cue] of cases) {
    const after = structuredClone(before);
    change(after);
    expect(actionSound(before, after, intent)).toBe(cue);
    expect(actionSound(after, structuredClone(after), intent)).toBe("step");
  }
});

it("uses discovery for the actual mainline meeting command", () => {
  const before = journeyCheckpoint();
  before.foundationJourney.heroine.meeting = "none";
  before.foundationJourney.location = "home";
  before.adventure.road.surveyed = true;
  before.herbs = 10;
  const intent: Intent = {
    type: "foundationJourney",
    action: { kind: "meetHeroine", method: "supplies" },
  };
  const after = dispatch(before, { ...intent, id: "audio-meeting" });
  expect(after.foundationJourney.heroine.meeting).toBe("supplies");
  expect(actionSound(before, after, intent)).toBe("discovery");
});

it("uses unresolved tension for a missing companion, and waterside ambience for the sunken well", () => {
  const s = journeyCheckpoint();
  s.foundationJourney.location = "home";
  s.foundationJourney.whereabouts = "missing";
  expect(gameAudioScene(s, "world", "听松山居").music).toBe("mystery");
  expect(gameAudioScene(s, "relationship", "听松山居").music).toBe("mystery");
  expect(gameAudioScene(s, "", "听松山居").music).toBe("foundation");
  s.foundationJourney.location = "ferry";
  s.foundationJourney.duel = {
    ruleset: 2,
    id: "well",
    hp: 10,
    enemy: 20,
    turn: 0,
    effect: "none",
    aid: false,
  };
  expect(gameAudioScene(s, "world", "听松山居")).toEqual({
    music: "frontier",
    ambient: "waterside",
  });
});
