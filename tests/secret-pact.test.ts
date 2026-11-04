import { expect, it } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  createGame,
  type State,
} from "../src/core";
import {
  journeyPlayer,
  journeyCheckpoint,
} from "../tools/foundation-journey-checkpoint";
import { pactQuote, runPact, type PactAction } from "../src/secret-pact/rules";
import { freshSecretPact } from "../src/secret-pact/state";
import { foundationExchange } from "../src/foundation-journey/combat";
import { eligibleOffice } from "../src/recognition/rules";
import { pactView } from "../src/secret-pact/view";
const send = (
  s: State,
  action: PactAction,
  id = `pact-${s.seen.length}-${action}`,
) => dispatch(s, { type: "secretPact", action, id });
const cache = new Map<string, State>();
function ready(main: "spring" | "blade" | "breath" = "spring") {
  if (cache.has(main)) return structuredClone(cache.get(main)!);
  const p = journeyPlayer(
    journeyCheckpoint("male", false, main === "blade" ? "sword" : "wood", main),
  );
  p.act({ kind: "travel", destination: "ferry" });
  p.send({ type: "secretPact", action: "promise" });
  expect(p.state.secretPact.stage).toBe("promised");
  expect(p.state.foundationJourney.cultivation).toBeLessThan(200);
  expect(pactQuote(p.state, "enterLight").error).toContain("中期");
  p.fight("well");
  p.act({ kind: "inherit", technique: main });
  p.fight("application");
  p.cultivate(200);
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.act({ kind: "travel", destination: "frontier" });
  while (p.state.stones < 100)
    p.send({ type: "advance", activity: "work", months: 12 });
  while (p.state.herbs < 30) p.send({ type: "supplies" });
  p.act({ kind: "routePrepare", route: "frontier", method: "service" });
  p.act({ kind: "routeChoose", route: "frontier", choice: "careful" });
  p.fight("frontier");
  expect(validState(p.state)).toBe(true);
  p.send({ type: "wayfaring", action: { kind: "visit", site: "zhaoxuan" } });
  expect(p.state.secretPact.site).toBe("zhaoxuan");
  cache.set(main, p.state);
  return structuredClone(p.state);
}
function enter(s: State, action: "enterAnchor" | "enterLight") {
  let n = send(s, action);
  for (const a of ["guardFlow", "readFlow", "breakFlow"] as const)
    n = send(n, a);
  expect(n.secretPact.trial).toBe("division");
  return n;
}
function prepare(s: State) {
  const p = journeyPlayer(s);
  for (const technique of [s.journey.main!, "guard"] as const) {
    while (p.state.growth.training[technique] < 2) {
      const before = p.state.growth.training[technique];
      p.send({ type: "trainTechnique", technique });
      expect(p.state.growth.training[technique]).toBe(before + 1);
    }
  }
  p.cultivate(350);
  return p.state;
}
it("a promise precedes the realm gate; optional decline can be reversed without elapsed-time punishment", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.send({ type: "secretPact", action: "decline" });
  expect(p.state.secretPact.stage).toBe("declined");
  p.send({ type: "secretPact", action: "promise" });
  const month = p.state.secretPact.promisedMonth;
  p.send({ type: "advance", activity: "work", months: 12 });
  expect(p.state.secretPact.promisedMonth).toBe(month);
  expect(p.state.secretPact.stage).toBe("promised");
  expect(validState(p.state)).toBe(true);
  const noGate = ready();
  noGate.foundationJourney.cultivation = 199;
  expect(send(noGate, "enterAnchor")).toEqual(noGate);
});
it.each(["spring", "blade", "breath"] as const)(
  "%s prepares and wins the exclusive reward without replaying the cleared route",
  (main) => {
    const initial = prepare(ready(main)),
      entered = enter(initial, "enterAnchor");
    expect(entered.month).toBe(initial.month + 1);
    expect(entered.herbs).toBe(initial.herbs - 2);
    expect(send(entered, "exchange")).toEqual(entered);
    const p = journeyPlayer(send(entered, "insist"));
    p.fight("pactRival");
    const n = p.state;
    expect(n.secretPact.manual).toBe(true);
    expect(n.stones).toBe(entered.stones);
    expect(validState(n)).toBe(true);
    expect(send(n, "exchange")).toEqual(n);
    expect(n.foundationJourney.won).toEqual([
      ...initial.foundationJourney.won,
      "pactRival",
    ]);
    expect(send(n, "supplies")).toEqual(n);
    p.act({ kind: "travel", destination: "frontier" });
    p.act({ kind: "routeProcess", route: "frontier", method: "self" });
    expect(p.state.foundationJourney.growth.refined).toBe(true);
    expect(eligibleOffice(p.state)).toBe(2);
    expect(p.state.recognition.deeds).toEqual([]);
    expect(validState(p.state)).toBe(true);
  },
);
it("yield pays once and does not grant the exclusive method; exchange cannot spend missing resources", () => {
  const s = enter(ready(), "enterLight");
  const poor = structuredClone(s);
  poor.stones = 0;
  expect(send(poor, "exchange")).toEqual(poor);
  const n = send(s, "yield", "yield-once");
  expect(n.stones).toBe(s.stones + 24);
  expect(n.secretPact.manual).toBe(false);
  expect(send(n, "yield", "yield-once")).toEqual(n);
  expect(send(n, "yield")).toEqual(n);
  expect(validState(n)).toBe(true);
});
it.each(["insist", "seize"] as const)(
  "%s leads to actual battle and durable, different relationships",
  (choice) => {
    const s = send(enter(prepare(ready()), "enterAnchor"), choice);
    expect(s.secretPact.aggressor).toBe(
      choice === "insist" ? "rival" : "player",
    );
    const p = journeyPlayer(s);
    p.fight("pactRival");
    expect(p.state.secretPact.manual).toBe(true);
    expect(p.state.secretPact.outcome).toBe(
      choice === "insist" ? "won" : "seized",
    );
    expect(p.state.foundationJourney.cultivation).toBe(
      s.foundationJourney.cultivation,
    );
    expect(p.state.stones).toBe(s.stones);
    expect(validState(p.state)).toBe(true);
    expect(pactQuote(p.state, "supplies").error).toBeTruthy();
    expect(pactView(p.state).relationship).toContain(
      choice === "insist" ? "作证" : "失信",
    );
    const n = send(p.state, "settle");
    expect(n.secretPact.settled).toBe(true);
    expect(n.secretPact.manual).toBe(true);
    expect(n.stones).toBe(p.state.stones - (choice === "seize" ? 24 : 0));
    expect(validState(n)).toBe(true);
    expect(
      dispatch(n, {
        id: "again-fight",
        type: "foundationJourney",
        action: { kind: "battle", battle: "pactRival" },
      }),
    ).toEqual(n);
  },
);
it("retreat retains the route material; pursuit remains possible and peace closes it", () => {
  const initial = send(enter(ready(), "enterLight"), "insist");
  const p = journeyPlayer(initial);
  p.act({ kind: "battle", battle: "pactRival" });
  p.act({ kind: "withdraw" });
  expect(p.state.secretPact.outcome).toBe("retreated");
  expect(p.state.injury).toBe(initial.injury);
  expect(p.state.foundationJourney.won).toEqual(initial.foundationJourney.won);
  expect(validState(p.state)).toBe(true);
  const restored = migrateSave(JSON.parse(JSON.stringify(p.state)));
  const chase = journeyPlayer(prepare(restored));
  chase.fight("pactRival");
  expect(chase.state.secretPact.manual).toBe(true);
  const peace = send(restored, "settle");
  expect(pactView(peace).fight).toBe(false);
  expect(validState(peace)).toBe(true);
  const continued = journeyPlayer(peace);
  continued.act({ kind: "travel", destination: "frontier" });
  continued.act({ kind: "routeProcess", route: "frontier", method: "self" });
  expect(continued.state.foundationJourney.growth.refined).toBe(true);
});
it("preparing a retreat and preserving trust change actual incoming damage", () => {
  const base = ready();
  const start = (anchor: boolean, choice: "insist" | "seize") =>
    dispatch(send(enter(base, anchor ? "enterAnchor" : "enterLight"), choice), {
      type: "foundationJourney",
      action: { kind: "battle", battle: "pactRival" },
      id: `fight-${anchor}-${choice}`,
    });
  const a = start(true, "insist"),
    b = start(false, "insist"),
    c = start(true, "seize");
  expect(foundationExchange(a, "strike")!.incoming).toBeLessThan(
    foundationExchange(b, "strike")!.incoming,
  );
  expect(foundationExchange(a, "strike")!.incoming).toBeLessThan(
    foundationExchange(c, "strike")!.incoming,
  );
  const withManual = structuredClone(a);
  withManual.secretPact.manual = true;
  withManual.foundationJourney.duel!.effect = "guard";
  a.foundationJourney.duel!.effect = "guard";
  expect(foundationExchange(withManual, "discern")!.damage).toBe(
    foundationExchange(a, "discern")!.damage + 6,
  );
});
it("locks and interrupted travel cannot debit, award or enter; new records survive deterministic save roundtrips", () => {
  const s = ready();
  const dead = { ...s, status: "dead" as const };
  expect(send(dead, "enterLight")).toEqual(dead);
  const interrupted = runPact(s, "enterAnchor", "interrupt", (x) => ({
    ...x,
    status: "dead",
    month: x.month + 1,
  }));
  expect(interrupted.herbs).toBe(s.herbs);
  expect(interrupted.secretPact.stage).toBe("promised");
  const a = send(send(s, "enterAnchor"), "exchange"),
    b = send(send(s, "enterAnchor"), "exchange");
  expect(a).toEqual(b);
  expect(migrateSave(JSON.parse(JSON.stringify(a)))).toEqual(a);
  const old: any = structuredClone(s);
  old.version = 24;
  old.sense = Math.min(12, old.sense);
  delete old.spirit;
  delete old.secretPact;
  const migrated = migrateSave(old);
  expect(migrated.secretPact).toEqual(freshSecretPact());
  expect(old.version).toBe(24);
  expect(() =>
    migrateSave({ ...a, secretPact: { ...a.secretPact, outcome: "seized" } }),
  ).toThrow();
  expect(() =>
    migrateSave({ ...a, secretPact: { ...a.secretPact, manual: true } }),
  ).toThrow();
  expect(() => migrateSave({ ...a, version: 999 })).toThrow();
  expect(validState(createGame("新角色", "wood"))).toBe(true);
});

it("a failed attempt awards no treasure; recovery and preparation allow a later victory", () => {
  const initial = send(enter(ready(), "enterLight"), "insist");
  const p = journeyPlayer(initial);
  p.act({ kind: "battle", battle: "pactRival" });
  for (let i = 0; i < 12 && p.state.foundationJourney.duel; i++)
    p.act({ kind: "move", move: "strike" });
  expect(p.state.secretPact.outcome).toBe("retreated");
  expect(p.state.secretPact.manual).toBe(false);
  expect(p.state.injury).toBe(initial.injury + 2);
  expect(p.state.foundationJourney.won).toEqual(initial.foundationJourney.won);
  while (p.state.injury)
    p.send({ type: "advance", activity: "rest", months: 1 });
  const trained = journeyPlayer(prepare(p.state));
  trained.fight("pactRival");
  expect(trained.state.secretPact.manual).toBe(true);
  expect(validState(trained.state)).toBe(true);
  const final = trained.state;
  trained.act({ kind: "battle", battle: "pactRival" });
  expect(trained.state).toEqual(final);
});
it("treasure mitigates a later battle only after guard into discern", () => {
  const p = journeyPlayer(
    send(enter(prepare(ready()), "enterAnchor"), "insist"),
  );
  p.fight("pactRival");
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "battle", battle: "rank1" });
  expect(p.state.foundationJourney.duel).not.toBeNull();
  p.act({ kind: "move", move: "guard" });
  const without = structuredClone(p.state);
  without.secretPact.manual = false;
  const actual = foundationExchange(p.state, "discern")!;
  const baseline = foundationExchange(without, "discern")!;
  expect(actual.damage).toBe(baseline.damage + 6);
  expect(actual.incoming).toBe(Math.max(0, baseline.incoming - 3));
  expect(foundationExchange(p.state, "strike")).toEqual(
    foundationExchange(without, "strike"),
  );
});

it("keeps compensation and mailed supplies unclaimed when storage is full", () => {
  const s = enter(ready(), "enterLight");
  s.stones = 1e9;
  expect(pactView(s).actions.find((x) => x.action === "yield")?.error).toBe(
    "资源超过可保存上限",
  );
  expect(send(s, "yield", "capacity-yield")).toBe(s);
  expect(s.secretPact.stage).toBe("inside");
  s.stones -= 24;
  const paid = send(s, "yield", "capacity-yield");
  expect(paid.stones).toBe(1e9);
  expect(paid.secretPact.outcome).toBe("yield");
  let exited = paid;
  for (const a of ["guardFlow", "readFlow", "breakFlow"] as const)
    exited = send(exited, a);
  Object.assign(paid, exited);
  paid.growth.medicines.healing = 1e9 - 1;
  expect(send(paid, "supplies", "capacity-supplies")).toBe(paid);
  expect(paid.secretPact.supplies).toBe(false);
  paid.growth.medicines.healing--;
  const n = send(paid, "supplies", "capacity-supplies");
  expect(n.growth.medicines.healing).toBe(1e9);
  expect(n.secretPact.supplies).toBe(true);
  expect(send(migrateSave(n), "supplies", "another-claim")).toEqual(n);
});
