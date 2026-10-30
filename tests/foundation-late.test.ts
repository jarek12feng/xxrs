import { expect, it } from "vitest";
import {
  dispatch,
  migrateSave,
  validState,
  createGame,
  type Intent,
} from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { freshFoundationJourney } from "../src/foundation-journey/state";
import {
  challenges,
  rankIds,
  sideChoices,
} from "../src/foundation-journey/content";
import { foundationBoard } from "../src/foundation-journey/view";
import { actionReceipt } from "../src/action-feedback";
import { lifeReview } from "../src/life-review";
import {
  foundationPower,
  foundationExchange,
} from "../src/foundation-journey/combat";

it("public-command solo path completes all pre-gold mainline without optional stories, ranks or romance", () => {
  const s = journeyCheckpoint("male", true);
  expect(s.foundationJourney.condensation).toBe(true);
  expect(s.foundationJourney.target).toBe("party");
  expect(s.foundationJourney.sister).toBe("none");
  expect(s.foundationJourney.board.wins).toEqual([]);
  expect(s.foundationJourney.bond).toBe("none");
  expect(s.realm).toBe(1);
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  expect(journeyCheckpoint("male", true)).toEqual(s);
});
it("five consecutive ranks settle actual rewards once, keep separate old results, and create visible receipts and history", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  const oldArena = structuredClone(p.state.social.arena);
  for (const [i, id] of rankIds.entries()) {
    p.cultivate(challenges[id].cultivation);
    const start = p.state,
      healing = start.growth.medicines.healing,
      clarity = start.growth.medicines.clarity;
    p.fight(id);
    expect(p.state.stones - start.stones).toBe(10 + (i + 1) * 4 - 4);
    expect(p.state.growth.medicines.healing - healing).toBe(i === 2 ? 2 : 0);
    expect(p.state.growth.medicines.clarity - clarity).toBe(i === 4 ? 2 : 0);
    expect(p.state.foundationJourney.board.best[id]).toBeGreaterThan(0);
    const receipt = actionReceipt(start, p.state, {
      type: "foundationJourney",
      action: { kind: "move", move: "guard" },
    })!;
    expect(receipt.title).toContain(foundationBoard(p.state).title);
    expect(receipt.spotlight).toBe(true);
    expect(receipt.notes.join("")).toContain("均已结算");
    expect(receipt.next).toContain(
      i === 4 ? "金丹组尚未开放" : challenges[rankIds[i + 1]!].foe,
    );
    const saved = migrateSave(JSON.parse(JSON.stringify(p.state)));
    expect(saved).toEqual(p.state);
    expect(
      dispatch(saved, {
        id: "another-id",
        type: "foundationJourney",
        action: { kind: "battle", battle: id },
      }),
    ).toBe(saved);
  }
  expect(p.state.social.arena).toEqual(oldArena);
  expect(lifeReview(p.state).records.join("")).toContain("本届魁首");
  expect(p.state.foundationJourney.board.last).toContain("清心丹 2 瓶");
});
it("optional sister and public accountability require actual meeting and consent; damaged records can be recovered", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.act({ kind: "sister" });
  p.act({ kind: "evidence", evidence: "paper" });
  p.act({ kind: "evidence", evidence: "registry" });
  expect(p.state.foundationJourney.last).toContain("目前能够确认");
  p.fight("well");
  p.act({ kind: "inherit", technique: "breath" });
  p.act({ kind: "evidence", evidence: "control" });
  p.fight("exit");
  const before = p.state;
  p.act({ kind: "ferryOutcome", outcome: "open" });
  expect(p.state).toBe(before);
  p.act({ kind: "ferryOutcome", outcome: "break" });
  expect(p.state.foundationJourney.evidence).not.toContain("control");
  p.act({ kind: "reuniteSister" });
  p.act({ kind: "consent" });
  p.act({ kind: "evidence", evidence: "control" });
  p.act({ kind: "ferryOutcome", outcome: "open" });
  expect(p.state.foundationJourney.ferryOutcome).toBe("open");
  expect(lifeReview(p.state).records.join("")).toContain("当面重逢");
});
it.each(["estate", "snow", "inn"] as const)(
  "%s optional outcomes can all finish, with no repeated reward",
  (side) => {
    for (const outcome of Object.keys(sideChoices[side])) {
      const p = journeyPlayer(journeyCheckpoint("male", true));
      p.act({ kind: "travel", destination: side });
      p.act({ kind: "sideInvestigate", side });
      if (side !== "inn") p.fight(side);
      p.act({ kind: "sideResolve", side, outcome });
      expect(p.state.foundationJourney.sides[side]).toEqual({
        step: 3,
        outcome,
      });
      const before = p.state;
      p.act({ kind: "sideResolve", side, outcome });
      expect(p.state).toBe(before);
    }
  },
);
it("active challenge locks all other commands, can reload and retreat without injury or refund", () => {
  const p = journeyPlayer(journeyCheckpoint());
  const before = p.state;
  p.act({ kind: "battle", battle: "rank1" });
  expect(p.state.month).toBe(before.month + 1);
  expect(p.state.stones).toBe(before.stones - 4);
  const s = migrateSave(JSON.parse(JSON.stringify(p.state)));
  const commands: Intent[] = [
    { type: "advance", activity: "cultivate", months: 1 },
    { type: "equip", technique: "blade" },
    { type: "consume", medicine: "healing" },
    { type: "arenaStart" },
    { type: "companionship", action: "start" },
    {
      type: "foundationJourney",
      action: { kind: "travel", destination: "ferry" },
    },
  ];
  for (const c of commands)
    expect(dispatch(s, { ...c, id: "blocked" })).toBe(s);
  p.act({ kind: "withdraw" });
  expect(p.state.injury).toBe(before.injury);
  expect(p.state.stones).toBe(before.stones - 4);
  expect(p.state.foundationJourney.board.wins).toEqual([]);
});
it("cultivation raises challenge power and stops at 600 without charging extra months", () => {
  const p = journeyPlayer(journeyCheckpoint());
  const power = foundationPower(p.state);
  p.cultivate(600);
  expect(foundationPower(p.state).hp).toBeGreaterThan(power.hp);
  const s = p.state;
  p.send({ type: "advance", activity: "cultivate", months: 12 });
  expect(p.state).toBe(s);
  expect(
    dispatch(createGame("new", "wood", 42), {
      id: "x",
      type: "foundationJourney",
      action: { kind: "battle", battle: "rank1" },
    }).foundationJourney.won,
  ).toEqual([]);
});
it("v16 migration starts new progression empty and rejects malformed or future state", () => {
  const s = journeyCheckpoint(),
    { foundationJourney: _, ...rest } = s;
  const old = { ...rest, version: 16 };
  const before = structuredClone(old);
  const upgraded = migrateSave(old);
  expect(upgraded.foundationJourney).toEqual(freshFoundationJourney());
  expect(old).toEqual(before);
  expect(() => migrateSave({ ...upgraded, version: 18 })).toThrow();
  for (const patch of [
    { cultivation: -1 },
    { cultivation: 601 },
    { board: { wins: ["rank5"], losses: 0, best: { rank5: 1 }, last: "" } },
    {
      duel: {
        id: "rank1",
        hp: 1,
        enemy: 1,
        turn: 12,
        effect: "none",
        aid: false,
      },
    },
    { condensation: true },
    { whereabouts: "missing" },
  ])
    expect(
      validState({
        ...s,
        foundationJourney: { ...s.foundationJourney, ...patch },
      }),
    ).toBe(false);
});
it("wrong tactics can lose without losing previous rewards, and can retry after recovery", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.fight("rank1");
  p.cultivate(100);
  p.act({ kind: "battle", battle: "rank2" });
  // Boundary fixture only: one remaining HP makes a nonlethal wrong response lose.
  const s = structuredClone(p.state);
  s.foundationJourney.duel!.hp = 1;
  const move = foundationExchange(s, "discern")!;
  expect(move.incoming).toBeGreaterThan(0);
  const lost = dispatch(s, {
    id: "lose",
    type: "foundationJourney",
    action: { kind: "move", move: "discern" },
  });
  expect(lost.injury).toBe(s.injury + 2);
  expect(lost.foundationJourney.board.losses).toBe(1);
  expect(lost.foundationJourney.board.wins).toEqual(["rank1"]);
  expect(lost.foundationJourney.duel).toBeNull();
  const retry = journeyPlayer(lost);
  retry.fight("rank2");
  expect(retry.state.foundationJourney.board.wins).toHaveLength(2);
});
it.each(["male", "female"] as const)(
  "%s explicit covenant, real absence and mutual rescue complete through commands",
  (gender) => {
    const p = journeyPlayer(journeyCheckpoint(gender));
    for (const action of [
      "start",
      "insight",
      gender === "male" ? "public" : "relay",
      "test",
    ] as const)
      p.send({ type: "companionship", action });
    expect(p.state.companionship.stage).toBe("done");
    for (const [outing, option] of [
      ["walk", "stay"],
      ["night", "honest"],
    ] as const) {
      p.send({ type: "outing", outing });
      p.send({ type: "choose", instanceId: p.state.social.scene!.id, option });
    }
    // A genuine old-board win unlocks the shared post-match memory.
    p.send({ type: "arenaScout" });
    p.send({ type: "arenaStart" });
    for (let i = 0; i < 8 && p.state.social.arena.duel; i++)
      p.send({ type: "arenaTurn", stance: "break" });
    expect(p.state.social.arena.wins).toBe(1);
    p.send({ type: "outing", outing: "watch" });
    p.send({
      type: "choose",
      instanceId: p.state.social.scene!.id,
      option: "thanks",
    });
    p.send({ type: "confess" });
    p.send({
      type: "choose",
      instanceId: p.state.social.scene!.id,
      option: "yes",
    });
    p.act({ kind: "contact", contact: "letters" });
    p.act({ kind: "propose" });
    expect(p.state.foundationJourney.bond).toBe("promised");
    p.act({ kind: "covenant" });
    expect(p.state.foundationJourney.bond).toBe("covenant");
    p.act({ kind: "prepareTogether" });
    p.act({ kind: "depart" });
    expect(p.state.foundationJourney.aid).toBe(false);
    const away = p.state;
    p.act({ kind: "reunion" });
    expect(p.state).toBe(away);
    for (const c of [
      { type: "background" },
      { type: "companionship", action: "revisit" },
      { type: "mist", action: "companion" },
    ] as Intent[])
      expect(dispatch(away, { ...c, id: "absent" })).toBe(away);
    p.send({ type: "advance", activity: "cultivate", months: 3 });
    p.act({ kind: "reunion" });
    expect(p.state.foundationJourney.reunion).toBe(true);
    p.act({ kind: "travel", destination: "ferry" });
    p.fight("well");
    p.act({ kind: "inherit", technique: "spring" });
    p.fight("exit");
    p.act({ kind: "ferryOutcome", outcome: "escort" });
    p.cultivate(240);
    p.act({ kind: "travel", destination: "frontier" });
    p.act({ kind: "report" });
    expect(p.state.foundationJourney.whereabouts).toBe("missing");
    p.act({ kind: "signal" });
    expect(p.state.foundationJourney.whereabouts).toBe("shelter");
    p.fight("frontier");
    p.act({ kind: "mentor" });
    p.fight("rescue");
    expect(p.state.foundationJourney.whereabouts).toBe("rescued");
    expect(p.state.foundationJourney.last).toContain(
      gender === "male" ? "沈听澜" : "尹照川",
    );
    p.cultivate(600);
    p.act({ kind: "finish" });
    expect(p.state.foundationJourney.condensation).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(p.state)))).toEqual(p.state);
  },
);
it.each([
  ["wood", "spring", 7],
  ["sword", "blade", 42],
  ["wood", "breath", 88],
] as const)(
  "%s %s seed %s can complete the solo mainline with a different build",
  (path, technique, seed) => {
    const s = journeyCheckpoint("female", true, path, technique, seed);
    expect(s.foundationJourney.condensation).toBe(true);
    expect(s.foundationJourney.inheritance).toBe(technique);
    expect(s.journey.main).toBe(technique);
    expect(validState(s)).toBe(true);
  },
);
it("invalid prototype-key challenge cannot create invalid resources or combat state", () => {
  const s = journeyCheckpoint("male", true);
  for (const battle of ["toString", "__proto__", "unknown"])
    expect(
      dispatch(s, {
        id: "invalid",
        type: "foundationJourney",
        action: { kind: "battle", battle: battle as never },
      }),
    ).toBe(s);
});
it("victory sound is a read-only projection of the settled reward", async () => {
  const { actionSound } = await import("../src/action-sound");
  const p = journeyPlayer(journeyCheckpoint());
  const old = p.state;
  p.fight("rank1");
  const snapshot = structuredClone(p.state);
  expect(
    actionSound(old, p.state, {
      type: "foundationJourney",
      action: { kind: "move", move: "guard" },
    }),
  ).toBe("victory");
  expect(p.state).toEqual(snapshot);
});
it("foundation board keeps the adult entry rule and rejects an array used as the reward record", () => {
  const young = createGame("少年修士", "wood", 42);
  young.realm = 1;
  young.month = 23;
  young.age = 215;
  expect(
    dispatch(young, {
      id: "too-young",
      type: "foundationJourney",
      action: { kind: "battle", battle: "rank1" },
    }),
  ).toBe(young);
  const s = journeyCheckpoint();
  s.foundationJourney.board.best = [] as never;
  expect(validState(s)).toBe(false);
});
