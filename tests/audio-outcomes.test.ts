import { expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { actionSound } from "../src/action-sound";
import { sceneMusic } from "../src/local-music";
const pair = () => {
  const a = createGame("声音结果", "wood", 42);
  return [a, structuredClone(a)] as const;
};
it("death overrides the routine action, and rebirth overrides terminal state", () => {
  const [a, b] = pair();
  b.status = "dead";
  expect(
    actionSound(a, b, { type: "advance", activity: "work", months: 1 }),
  ).toBe("death");
  b.life++;
  expect(
    actionSound(a, b, { type: "next", path: "wood", inheritance: "none" }),
  ).toBe("rebirth");
});
it("real breakthrough failure is identified even at the injury cap", () => {
  let [a] = pair();
  a.qi = 360;
  a.qiJourney.gates = 2;
  a.injury = 6;
  for (const seed of [123456, 987654321, 2147483647, 4294967295]) {
    a.seed = seed;
    a.pills = 1;
    const b = dispatch(a, { id: "failure", type: "break", pill: true });
    if (b !== a && b.realm === 0) {
      expect(actionSound(a, b, { type: "break", pill: true })).toBe("failure");
      return;
    }
  }
  throw new Error("No failed attempt exercised");
});
it("mist failure with no injury still has feedback; revisiting a result does not replay it", () => {
  const [a, b] = pair();
  b.adventure.mist.attempts = 1;
  expect(actionSound(a, b, { type: "mist", action: "challenge" })).toBe(
    "failure",
  );
  b.adventure.mist.passed = true;
  expect(actionSound(a, b, { type: "mist", action: "challenge" })).toBe(
    "discovery",
  );
  expect(
    actionSound(b, structuredClone(b), { type: "mist", action: "camp" }),
  ).toBe("step");
});
it("family challenges distinguish a win, loss and peaceful passage", () => {
  const [a, b] = pair();
  b.journey.encounters.peak = {
    kind: "guardian",
    aid: "none",
    attempts: 1,
    passed: false,
    outcome: "loss",
    lastRoll: 90,
    lastChance: 60,
  };
  expect(
    actionSound(a, b, { type: "challenge", place: "peak", mode: "fight" }),
  ).toBe("failure");
  b.journey.encounters.peak.passed = true;
  b.journey.encounters.peak.outcome = "win";
  expect(
    actionSound(a, b, { type: "challenge", place: "peak", mode: "fight" }),
  ).toBe("victory");
  b.journey.encounters.peak.outcome = "peace";
  expect(
    actionSound(a, b, { type: "challenge", place: "peak", mode: "parley" }),
  ).toBe("reunion");
});
it("story sound follows committed gift, letter and lamp flags, not button text", () => {
  const [a, b] = pair();
  b.story.choice = "gift";
  expect(
    actionSound(a, b, { type: "choose", instanceId: "gift", option: "gift" }),
  ).toBe("reunion");
  b.journey.maps.sea = 3;
  expect(actionSound(a, b, { type: "explore", place: "sea" })).toBe("closure");
  const [c, d] = pair();
  d.adventure.mist.revisited = true;
  expect(actionSound(c, d, { type: "mist", action: "illuminate" })).toBe(
    "closure",
  );
  expect(
    actionSound(d, structuredClone(d), { type: "mist", action: "shrine" }),
  ).toBe("step");
  expect(sceneMusic("再见那座山祠", false)).toBe("mystery");
  expect(sceneMusic("再见那座山祠", true)).toBe("home");
});
it("terminal closure and learning have feedback without changing the seed", () => {
  const [a, b] = pair();
  b.status = "complete";
  expect(actionSound(a, b, { type: "retire" })).toBe("closure");
  b.status = "alive";
  b.journey.known.push("spring");
  expect(actionSound(a, b, { type: "learn", technique: "spring" })).toBe(
    "discovery",
  );
  expect(b.seed).toBe(a.seed);
});

it('筑基凝丹有不同短乐，失败、原档重读与未突破不触发庆祝', async()=>{
 const {breakthroughMusic}=await import('../src/action-sound');
 const [a,b]=pair();
 b.realm=1;
 expect(breakthroughMusic(a,b)).toBe('foundation-rise');
 expect(actionSound(a,b,{type:'ascension',action:'commit'})).toBe('breakthrough');
 const c=structuredClone(b); c.realm=2;
 expect(breakthroughMusic(b,c)).toBe('golden-rise');
 expect(actionSound(b,c,{type:'ascension',action:'commit'})).toBe('golden-breakthrough');
 expect(breakthroughMusic(c,structuredClone(c))).toBeNull();
 const failed=structuredClone(b); b.goldenCore.pills=1;
 expect(actionSound(b,failed,{type:'ascension',action:'commit'})).toBe('failure');
 expect(breakthroughMusic(b,failed)).toBeNull();
 c.status='dead';
 expect(breakthroughMusic(b,c)).toBeNull();
 expect(actionSound(b,c,{type:'ascension',action:'commit'})).toBe('death');
});
