import { expect, it } from "vitest";
import { createGame, dispatch, type State, type Intent } from "../src/core";
import { storyRoute, storyArrived } from "../src/wayfaring/story-routes";
import { completedStoryRoute } from "../src/wayfaring/completed-routes";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
function send(s: State, i: Intent) {
  const r = storyRoute(s, i)!;
  expect(r).not.toBeNull();
  expect(r.error).toBe("");
  const next = dispatch(s, { ...i, id: `travel-${s.seen.at(-1)}-${s.month}` });
  expect(storyArrived(next, s, r)).toBe(true);
  expect(next.month - s.month).toBe(r.months);
  return next;
}
it("relic invitation, withdrawal, independent return and three-month homecoming use actual decisions", () => {
  let s = createGame("遗府往返", "wood");
  s.adventure.step = "done";
  s.story.stage = "waiting";
  s.month = 36;
  s.qi = 200;
  s.pending = { id: "departure", kind: "departure" };
  s = send(s, { type: "choose", instanceId: "departure", option: "go" });
  s = send(s, {
    type: "choose",
    instanceId: s.pending!.id,
    option: "withdraw",
  });
  s = send(s, { type: "revisitRelic" });
  s.story.stage = "relic";
  s.pending = { id: "relic", kind: "relic" };
  s = send(s, { type: "choose", instanceId: "relic", option: "self" });
  expect(s.pills).toBe(1);
});
it("female meeting and outings open their saved scene; conversation choices are local", () => {
  let s = journeyCheckpoint();
  s.social.gender = "female";
  s.social.met = false;
  s.social.scene = null;
  s = send(s, { type: "visit" });
  s.social.scene = null;
  s.social.met = true;
  s = send(s, { type: "outing", outing: "walk" });
  expect(
    storyRoute(s, {
      type: "choose",
      instanceId: s.social.scene!.id,
      option: "care",
    }),
  ).toBeNull();
});
it("companionship starts at the upstream worksite without charging time", () => {
  let s = journeyCheckpoint();
  s.social.gender = "female";
  s.social.met = true;
  s.social.scene = null;
  s = send(s, { type: "companionship", action: "start" });
  expect(
    storyRoute(s, { type: "companionship", action: "insight" }),
  ).toBeNull();
});
it("arena travel charges the original fee and records the return without a second command", () => {
  let s = journeyCheckpoint();
  s.injury = 0;
  s.social.arena.scouted = [0];
  s.stones = 30;
  const old = s;
  s = send(s, { type: "arenaStart" });
  expect(s.stones).toBe(old.stones - 4);
  const fighting = s;
  s = send(s, { type: "arenaWithdraw" });
  const receipt = completedStoryRoute(s, fighting)!;
  expect(receipt.path).toEqual(["site", "home"]);
  expect(receipt.months).toBe(0);
});
it("service itinerary is a return journey and reward is not shown as a fee, including repeated routines", () => {
  let s = journeyCheckpoint();
  s.recognition.office = 1;
  s.recognition.affiliation = s.journey.branch;
  s.herbs = 30;
  const i: Intent = {
    type: "recognition",
    action: { kind: "undertake", tier: 0, method: "supplies" },
  };
  const r = storyRoute(s, i)!;
  expect(r.path).toEqual(["home", "site", "return"]);
  expect(r.stones).toBe(0);
  s = send(s, i);
  for (let n = 0; n < 2; n++)
    s = send(s, {
      type: "recognition",
      action: { kind: "routine", tier: 0, method: "supplies" },
    });
  s.journey.branch = "dan";
  expect(
    storyRoute(s, {
      type: "recognition",
      action: { kind: "undertake", tier: 1, method: "skill" },
    }),
  ).toBeNull();
});
it("an interrupted service with changed narration cannot fake completion", () => {
  const s = journeyCheckpoint();
  s.recognition.office = 1;
  s.recognition.affiliation = s.journey.branch;
  s.herbs = 30;
  const r = storyRoute(s, {
    type: "recognition",
    action: { kind: "undertake", tier: 0, method: "supplies" },
  })!;
  const n = structuredClone(s);
  n.month++;
  n.recognition.last = "行前有信，暂缓出发。";
  expect(storyArrived(n, s, r)).toBe(false);
});
