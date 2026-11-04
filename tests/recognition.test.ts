import { actionReceipt } from "../src/action-feedback";
import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  type State,
} from "../src/core";
import { foundationStep } from "../tools/foundation-playthrough";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import {
  recognitionQuote,
  currentOffice,
  eligibleOffice,
  type RecognitionAction,
  runRecognition,
} from "../src/recognition/rules";
import { validRecognition } from "../src/recognition/state";
import { growthQuote } from "../src/foundation-journey/growth";
const send = (
  s: State,
  action: RecognitionAction,
  id = `recognition-${s.seen.length}-${action.kind}`,
) => dispatch(s, { type: "recognition", action, id });
let cached: State | undefined;
function mid() {
  if (cached) return structuredClone(cached);
  let s = createGame("任用验收", "wood", 42);
  for (let i = 0; i < 450; i++) {
    if (eligibleOffice(s) && !recognitionQuote(s, { kind: "appoint" }).error) {
      cached = s;
      return structuredClone(s);
    }
    s = dispatch(s, {
      ...foundationStep(s, true, "wander"),
      id: `progress-${i}`,
    });
  }
  throw Error("No earned invitation");
}
it("requires cultivation and real experience, while appointment is optional and reversible", () => {
  const fresh = createGame("初入山门", "wood");
  expect(eligibleOffice(fresh)).toBe(0);
  const s = mid();
  expect(s.realm).toBe(0);
  expect(validState(s)).toBe(true);
  const deferred = send(s, { kind: "defer" });
  expect(deferred.recognition.deferred).toBe(true);
  const appointed = send(deferred, { kind: "appoint" });
  expect(currentOffice(appointed)).toBe(1);
  expect(appointed.stones).toBe(s.stones);
  expect(appointed.month).toBe(s.month);
  const resigned = send(appointed, { kind: "resign" });
  expect(currentOffice(resigned)).toBe(0);
  const again = send(resigned, { kind: "appoint" });
  expect(again.recognition.appointments).toHaveLength(1);
  expect(again.stones).toBe(s.stones);
  expect(validState(again)).toBe(true);
  const noDeed = structuredClone(s);
  noDeed.expedition.cleared = 0;
  noDeed.qiJourney.preparations.forEach((p) => {
    p.medicine = 0;
    p.sect = 0;
    p.wander = 0;
  });
  expect(eligibleOffice(noDeed)).toBe(0);
});
it.each(["none", "dan", "jian"] as const)(
  "%s has paid work with finite first rewards and repeatable earned work",
  (branch) => {
    let s = mid();
    s.journey.branch = branch;
    s.herbs = 20;
    s = send(s, { kind: "appoint" });
    const action = { kind: "undertake", tier: 0, method: "supplies" } as const;
    const q = recognitionQuote(s, action);
    expect(q.error).toBe("");
    const a = send(s, action, "first"),
      b = send(s, action, "first");
    expect(a).toEqual(b);
    expect(validState(a)).toBe(true);
    expect(a.month).toBe(s.month + 1);
    expect(a.herbs).toBe(s.herbs - q.herbs);
    expect(a.stones).toBe(s.stones + q.stones);
    expect(a.recognition.deeds).toHaveLength(1);
    expect(send(a, action, "first")).toEqual(a);
    expect(send(a, action, "duplicate")).toEqual(a);
    const routine = { ...action, kind: "routine" } as const;
    expect(recognitionQuote(a, routine).stones).toBeLessThan(q.stones);
    const c = send(a, routine, "repeat");
    expect(c.recognition.deeds).toHaveLength(1);
    expect(c.month).toBe(a.month + 1);
    expect(s.recognition.deeds).toHaveLength(0);
  },
);
it("earned ability replaces supplies and work cannot proceed under unresolved events", () => {
  let s = send(mid(), { kind: "appoint" });
  s.sense = 1;
  s.study = 0;
  s.herbs = 0;
  const action = { kind: "undertake", tier: 0, method: "skill" } as const;
  expect(recognitionQuote(s, action).error).toContain("神识");
  s.qi = 240;
  expect(recognitionQuote(s, action).error).toBe("");
  s.status = "dead";
  expect(send(s, action)).toEqual(s);
});
it("interrupted travel never pays or consumes supplies", () => {
  const s = send(mid(), { kind: "appoint" });
  s.herbs = 20;
  const a = runRecognition(
    s,
    { kind: "undertake", tier: 0, method: "supplies" },
    "interrupted",
    (x) => ({ ...x, status: "dead", month: x.month + 1 }),
  );
  expect(a.stones).toBe(s.stones);
  expect(a.herbs).toBe(s.herbs);
  expect(a.recognition.deeds).toHaveLength(0);
});
it("foundation proof earns inner access, its actual discount and senior responsibility", () => {
  let s = mistCheckpoint();
  s.journey.branch = "dan";
  s = send(s, { kind: "inner" });
  expect(s.recognition.innerMonth).toBe(s.month);
  expect(validState(s)).toBe(true);
  expect(
    growthQuote(s, { kind: "routeProcess", route: "estate", method: "sect" })
      .contribution,
  ).toBe(6);
  s = send(s, { kind: "appoint" });
  s.herbs = 20;
  s = send(s, { kind: "undertake", tier: 1, method: "supplies" });
  expect(s.recognition.deeds.some((d) => d.tier === 1)).toBe(true);
  expect(eligibleOffice(s)).toBe(1);
  s.foundationJourney.cultivation = 200;
  s.foundationJourney.growth.refined = true;
  expect(eligibleOffice(s)).toBe(2);
  s = send(s, { kind: "appoint" });
  expect(currentOffice(s)).toBe(2);
  s.journey.contribution = 0;
  expect(currentOffice(s)).toBe(2);
  expect(send(s, { kind: "resign" }).recognition.innerMonth).toBe(
    s.recognition.innerMonth,
  );
});
it("saves preserve earned history; v23 migration creates no fictitious appointment", () => {
  const s = send(mid(), { kind: "appoint" });
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  const old: any = structuredClone(s);
  old.version = 23;
  delete old.recognition;
  const migrated = migrateSave(old)!;
  expect(migrated.version).toBe(34);
  expect(migrated.recognition.appointments).toEqual([]);
  expect(migrated.cultivationRemainder).toBe(s.cultivationRemainder);
  expect(old.version).toBe(23);
  expect(() => migrateSave({ ...s, version: 999 })).toThrow();
  for (const bad of [
    { ...s.recognition, appointments: [null] },
    { ...s.recognition, deeds: [null] },
    { ...s.recognition, office: 2 },
  ]) {
    expect(
      validRecognition(bad as any, s.month, s.realm, s.journey.branch),
    ).toBe(false);
    expect(() => migrateSave({ ...s, recognition: bad })).toThrow();
  }
});

it("minor breakthroughs report the actual newly usable ability", () => {
  const before = mid();
  before.qi = 239;
  const after = structuredClone(before);
  after.qi = 240;
  after.month++;
  const receipt = actionReceipt(before, after, {
    type: "advance",
    activity: "cultivate",
    months: 1,
  })!;
  expect(receipt.title).toContain("炼气后期");
  expect(receipt.notes.join("")).toContain("省下护脉草药");
  const appointed = send(before, { kind: "appoint" });
  expect(
    actionReceipt(before, appointed, {
      type: "recognition",
      action: { kind: "appoint" },
    })?.returnTo,
  ).toBe("sect");
});
