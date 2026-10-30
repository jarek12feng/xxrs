import { expect, it } from "vitest";
import {
  dispatch,
  migrateSave,
  validState,
  createGame,
  type State,
} from "../src/core";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import {
  freshCompanionship,
  type CompanionAction,
  type Method,
  type Plan,
} from "../src/companionship/rules";
import { companionshipView } from "../src/companionship/view";
const send = (s: State, action: CompanionAction) =>
  dispatch(s, {
    id: `companion-${s.seen.length}`,
    type: "companionship",
    action,
  });
function ready(gender: "male" | "female" = "male") {
  const s = mistCheckpoint(42, "wood", gender);
  expect(s.social.met).toBe(true);
  expect(s.social.bonded).toBe(false);
  return s;
}
it.each([
  ["male", "public"],
  ["male", "detour"],
  ["female", "relay"],
  ["female", "backup"],
] as const)(
  "%s friendship can complete %s without romance and preserve a distinct revisit",
  (gender, plan) => {
    const initial = ready(gender),
      snapshot = structuredClone(initial);
    let s = send(initial, "start");
    s = send(s, "insight");
    expect(s.journey.known).toContain("guard");
    expect(s.companionship.stage).toBe("dispute");
    s = send(s, plan);
    expect(s.companionship.stage).toBe("trial");
    const beforeTrial = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(beforeTrial).toEqual(s);
    s = dispatch(beforeTrial, {
      id: "equip-guard",
      type: "equip",
      technique: "guard",
    });
    s = send(s, "test");
    expect(s.companionship.stage).toBe("done");
    expect(s.injury).toBe(initial.injury);
    expect(s.companionship.plan).toBe(plan);
    expect(s.social).toEqual(initial.social);
    expect(s.seed).toBe(initial.seed);
    expect(s.month).toBe(initial.month);
    expect(validState(s)).toBe(true);
    const rewardState = {
      stones: s.stones,
      study: s.study,
      known: [...s.journey.known],
    };
    s = send(s, "revisit");
    expect(s.companionship.last).toContain(
      plan === "public"
        ? "问路"
        : plan === "detour"
          ? "错过"
          : plan === "relay"
            ? "按时离开"
            : "等天明",
    );
    expect(send(s, "revisit")).toBe(s);
    expect(send(s, "test")).toBe(s);
    expect(send(s, "insight")).toBe(s);
    expect({
      stones: s.stones,
      study: s.study,
      known: s.journey.known,
    }).toEqual(rewardState);
    const replay = ["start", "insight", plan] as CompanionAction[];
    expect(replay.reduce(send, initial)).toEqual(beforeTrial);
    expect(initial).toEqual(snapshot);
  },
);
it.each(["strength", "insight", "supplies"] as Method[])(
  "preparation %s consumes only its stated resources",
  (method) => {
    let s = send(ready(), "start");
    s.mastery = 12 - s.root;
    const before = structuredClone(s);
    s = send(s, method);
    expect(s.companionship.stage).toBe("dispute");
    expect(s.herbs).toBe(before.herbs - (method === "supplies" ? 4 : 0));
    expect(s.stones).toBe(before.stones);
    expect(s.seed).toBe(before.seed);
    expect(validState(s)).toBe(true);
  },
);
it("failure keeps rewards and plan, free recovery and equipping change the same test outcome", () => {
  let s = send(send(send(ready(), "start"), "insight"), "public");
  s.journey.support = null;
  const reward = [...s.journey.known],
    before = s.injury;
  s = send(s, "test");
  expect(s.injury).toBe(before + 2);
  expect(s.companionship.stage).toBe("trial");
  expect(s.journey.known).toEqual(reward);
  const plan = structuredClone(s.companionship);
  s = dispatch(s, {
    id: "recover",
    type: "advance",
    activity: "rest",
    months: 1,
  });
  expect(s.companionship).toEqual(plan);
  s = dispatch(s, { id: "equip", type: "equip", technique: "guard" });
  const healed = s.injury;
  s = send(s, "test");
  expect(s.companionship.stage).toBe("done");
  expect(s.injury).toBe(healed);
  expect(validState(s)).toBe(true);
});
it("blocks premature, unaffordable, foreign and repeated commands without mutation", () => {
  const first = createGame("尚未相识", "wood");
  expect(send(first, "start")).toBe(first);
  let s = ready();
  for (const changed of [
    { realm: 0 },
    { age: 200 },
    { status: "dead" },
    { status: "ascended" },
    { pending: { kind: "meeting" } },
  ]) {
    const blocked = { ...s, ...changed } as State;
    expect(send(blocked, "start")).toBe(blocked);
  }
  for (const changed of [
    { social: { ...s.social, scene: { id: "x", kind: "background" } } },
    { expedition: { ...s.expedition, duel: {} } },
    { social: { ...s.social, arena: { ...s.social.arena, duel: {} } } },
  ]) {
    const blocked = { ...s, ...changed } as State;
    expect(send(blocked, "start")).toBe(blocked);
  }
  expect(send(s, "test")).toBe(s);
  s = send(s, "start");
  s.herbs = 0;
  s.sense = 1;
  s.root = 1;
  s.mastery = 0;
  for (const action of ["strength", "insight", "supplies"] as Method[])
    expect(send(s, action)).toBe(s);
  s.sense = 8;
  s.study = 2;
  s = send(s, "insight");
  s.stones = 0;
  expect(send(s, "relay")).toBe(s);
  expect(send(s, "detour")).toBe(s);
  expect(send(s, "public").companionship.stage).toBe("trial");
});
it("migration never invents shared adventures, preserves established pledges and rejects corrupt new stages", () => {
  const s = ready();
  const { companionship: _, ...rest } = s;
  const old = { ...rest, version: 15 };
  const n = migrateSave(old);
  expect(n.companionship).toEqual(freshCompanionship());
  expect(n.social).toEqual(old.social);
  expect(n.seed).toBe(old.seed);
  expect(validState(n)).toBe(true);
  expect(validState({ ...n, companionship: undefined })).toBe(false);
  expect(
    validState({
      ...n,
      companionship: { ...n.companionship, stage: "done", plan: "relay" },
    }),
  ).toBe(false);
  expect(() => migrateSave({ ...n, version: 19 })).toThrow();
  expect(companionshipView(n).options[0]?.disabled).toBe("");
});
it("established pledges remain intact and an already learned technique never duplicates", () => {
  let s = ready("female");
  s.social.memories = ["walk", "night", "watch"];
  Object.assign(s.social.answers, {
    walk: "mark",
    night: "honest",
    watch: "learn",
    pledge: "yes",
  });
  s.social.bonded = true;
  s.social.affection = 60;
  if (!s.journey.known.includes("guard")) s.journey.known.push("guard");
  s.study = 2;
  expect(validState(s)).toBe(true);
  const old = structuredClone(s.social);
  s = send(send(s, "start"), "insight");
  expect(s.journey.known.filter((x) => x === "guard")).toHaveLength(1);
  expect(s.study).toBe(4);
  s = send(s, "backup");
  s = dispatch(s, { id: "pledged-equip", type: "equip", technique: "guard" });
  s = send(s, "test");
  expect(s.social).toEqual(old);
  expect(s.companionship.last).toContain("定情");
  expect(validState(s)).toBe(true);
});
