import { expect, it } from "vitest";
import { createGame, dispatch, type State, type Intent } from "../src/core";
import { actionReceipt } from "../src/action-feedback";
import { mistCheckpoint } from "../tools/mist-checkpoint";
const send = (s: State, c: Intent) =>
  dispatch(s, { ...c, id: `moment-${s.seen.length}` });
it("marks investigation as a discovery instead of a generic empty receipt", () => {
  const s = createGame("玩家", "wood"),
    c = { type: "adventure", action: "inspect" } as const;
  const r = actionReceipt(s, send(s, c), c)!;
  expect(r.title).toContain("线索");
  expect(r.scene?.unlocks).toContain("发现青瘴粉与归路红绳");
});
it("names the origin and destination when travelling", () => {
  const s = send(createGame("玩家", "wood"), {
    type: "adventure",
    action: "inspect",
  });
  const c = { type: "adventure", action: "depart" } as const;
  expect(actionReceipt(s, send(s, c), c)?.scene).toMatchObject({
    from: "雨夜渡口",
    to: "山门药庐",
  });
});
it("does not claim no changes when an arena turn changed only combat state", () => {
  const s = createGame("玩家", "wood");
  s.social.arena.duel = {
    opponent: 0,
    turn: 0,
    hp: 28,
    maxHp: 28,
    enemyHp: 23,
    log: [],
  };
  const c = { type: "arenaTurn", stance: "break" } as const;
  expect(actionReceipt(s, send(s, c), c)).toBeNull(); // The persistent combat board owns round feedback.
});
it("opens a named defeat result on voluntary withdrawal without claiming new wounds", () => {
  const s = createGame("玩家", "wood");
  s.social.arena.duel = {
    opponent: 0,
    turn: 0,
    hp: 28,
    maxHp: 28,
    enemyHp: 23,
    log: [],
  };
  const c = { type: "arenaWithdraw" } as const,
    r = actionReceipt(s, send(s, c), c)!;
  expect(r.ritual).toBe("duel");
  expect(r.title).toContain("认负");
  expect(r.notes.join()).toContain("巩砚");
  expect(r.changes.find((c) => c.label === "伤势")).toBeUndefined();
});
it("keeps an NPC response and relationship milestone after choosing", () => {
  const s = createGame("玩家", "wood", 42, "insightful", "male");
  s.age = 216;
  s.realm = 1;
  s.month = 24;
  s.story.stage = "resolved";
  s.memories.letter = true;
  s.memories.visit = true;
  const visiting = send(s, { type: "visit" });
  const c = {
    type: "choose",
    instanceId: visiting.social.scene!.id,
    option: "listen",
  } as const;
  const r = actionReceipt(visiting, send(visiting, c), c)!;
  expect(r.person?.name).toBe("沈听澜");
  expect(r.person?.response.length).toBeGreaterThan(10);
  expect(r.person?.relation).toBe("尚未相识 → 相识");
});
it("identifies the female player's male companion without changing the saved relationship", () => {
  const s = mistCheckpoint(42, "wood", "female"),
    visiting = send(s, { type: "outing", outing: "walk" });
  const c = {
      type: "choose",
      instanceId: visiting.social.scene!.id,
      option: "mark",
    } as const,
    n = send(visiting, c),
    copy = structuredClone(n);
  expect(actionReceipt(visiting, n, c)?.person?.name).toBe("尹照川");
  expect(n).toEqual(copy);
});
it("records the lamp as a new ability rather than an empty resource action", () => {
  let s = mistCheckpoint();
  for (const action of [
    "receive",
    "accept",
    "companion",
    "station",
    "decode",
    "gate",
    "steady",
    "challenge",
  ] as const)
    s = send(s, { type: "mist", action });
  const c = { type: "mist", action: "read" } as const,
    n = send(s, c),
    r = actionReceipt(s, n, c)!;
  expect(n.adventure.mist.lamp).toBe(true);
  expect(r.scene?.unlocks.join()).toContain("获得探灵灯");
});
it("a genuine combat defeat shows increased injury and no victory reward", () => {
  const s = mistCheckpoint();
  s.social.arena.duel = {
    opponent: 0,
    turn: 0,
    hp: 1,
    maxHp: 40,
    enemyHp: 23,
    log: [],
  };
  const c = { type: "arenaTurn", stance: "discern" } as const,
    n = send(s, c),
    r = actionReceipt(s, n, c)!;
  expect(r.title).toContain("本场落败");
  expect(r.tone).toBe("warning");
  expect(r.changes.find((c) => c.label === "伤势")?.after).toBe(1);
  expect(r.unlocks).toEqual([]);
});
it("old-map exploration exposes progress and reward where the exploration took place", () => {
  const s = mistCheckpoint(),
    c = { type: "explore", place: "valley" } as const,
    n = send(s, c),
    r = actionReceipt(s, n, c)!;
  expect(r.scene).toMatchObject({ chapter: "world", place: "valley" });
  expect(r.scene?.unlocks).toContain("探索进度 1 / 3");
});
