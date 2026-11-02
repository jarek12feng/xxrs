import { expect, it } from "vitest";
import { createGame, dispatch, migrateSave, validState, type State } from "../src/core";
import { foundationStep } from "../tools/foundation-playthrough";
import { qiEnemyTell, qiPreview, qiPower, qiError } from "../src/qi-journey/rules";
import { passagePlan } from "../src/qi-journey/passage";
import { journeyCheckpoint, journeyPlayer } from "../tools/foundation-journey-checkpoint";
import { growthQuote } from "../src/foundation-journey/growth";
import { tacticalAdjustment } from "../src/foundation-journey/tactics";
import { journeyOptions } from "../src/foundation-journey/view";
import { qiInvestmentSample } from "../tools/forward-growth-audit";

it.each(["spring", "blade", "breath"] as const)("%s can clear the full valley with distinct consumable and training investments", main => {
  for (const [route, passage] of [["medicine", "ward"], ["array", "sense"]] as const)
    expect(qiInvestmentSample(main, route, passage).won, `${main}/${route}/${passage}`).toBe(true);
});
it("a long-lived vial investment supports a full sword-route valley without spending passage medicine", () => {
  const result = qiInvestmentSample("spring", "sword", "relic");
  expect(result.won).toBe(true); expect(result.wardSpent).toBe(0);
});

function qiReady() {
  let s = createGame("向前修行", "wood", 42, "insightful");
  for (let i = 0; i < 400; i++) {
    const a = foundationStep(s);
    if (a.type === "qiJourney" && a.action.startsWith("enter:")) return s;
    s = dispatch(s, { ...a, id: `forward-${i}` });
  }
  throw Error("No qi checkpoint");
}
function passage() {
  const s = qiReady();
  s.qiJourney.route = "array"; s.qiJourney.node = 2; s.qiJourney.vigor = 10;
  s.sense = 8; s.study = 2; s.herbs = 3; s.workshop.ward = 1;
  return s;
}
it("medicine changes the python's next opening; preview, visible intent and saved settlement agree", () => {
  const s = passage();
  s.qiJourney.node = 3; s.qiJourney.route = "medicine";
  s.qiJourney.duel = { hp: 50, enemy: 100, turn: 0, effect: "guard" };
  const p = qiPreview(s, "strike")!;
  expect(p.correct).toBe(true);
  expect(qiEnemyTell(s)).toContain("鳞缝");
  expect(qiPreview(s, "guard")!.note).toContain("承伤 −4");
  const plain = structuredClone(s); plain.qiJourney.route = "array";
  expect(qiPreview(plain, "strike")!.correct).toBe(false);
  const cmd = { type: "qiJourney", action: "strike", id: "opening" } as const;
  const n = dispatch(s, cmd);
  expect(n.qiJourney.duel!.enemy).toBe(100 - p.damage);
  expect(n.qiJourney.duel!.hp).toBe(50 - p.incoming + p.healing);
  expect(dispatch(migrateSave(s), cmd)).toEqual(n);
  expect(validState(n)).toBe(true);
  expect(qiEnemyTell(n)).not.toContain("颈下鳞缝已露");
  const kill = structuredClone(s); kill.qiJourney.duel!.enemy = 1;
  const won = dispatch(kill, cmd);
  expect(won.qiJourney.essence).toBe(true);
  expect(dispatch(won, { ...cmd, id: "no-repeat" })).toBe(won);
});
it("equipment, mastered technique and medicine offer distinct passage recoveries with exact costs", () => {
  const s = passage();
  s.journey.equipped = "vial"; s.journey.relics.vial = 1;
  s.growth.training[s.journey.main!] = 1;
  const results = (["relic", "sense", "herbs", "ward"] as const).map(action => {
    const p = passagePlan(s, action, qiPower(s).hp);
    const n = dispatch(s, { type: "qiJourney", action, id: `pass-${action}` });
    expect(n.qiJourney.duel!.hp).toBe(p.vigor);
    expect(n.herbs).toBe(s.herbs - p.herbs);
    expect(n.workshop.ward).toBe(s.workshop.ward - p.ward);
    expect(validState(n)).toBe(true);
    expect(dispatch(n, { type: "qiJourney", action, id: "repeat" })).toBe(n);
    return p.vigor;
  });
  expect(results).toEqual([22, 28, 28, 36]);
  const unequipped = structuredClone(s); unequipped.journey.equipped = null;
  expect(qiError(unequipped, "relic")).toContain("装配");
  const untrained = structuredClone(s); untrained.growth.training[s.journey.main!] = 0;
  expect(passagePlan(untrained, "sense", qiPower(untrained).hp).vigor).toBe(16);
  s.workshop.ward = 0;
  expect(dispatch(s, { type: "qiJourney", action: "ward", id: "empty" })).toBe(s);
});
it("earned meridians open a free onward passage without returning to the medicine valley", () => {
  const s = passage();
  expect(qiError(s, "meridian")).toContain("淬脉");
  s.qiJourney.gates = 1; s.qi = 240; s.herbs = 0; s.workshop.ward = 0;
  const n = dispatch(s, { type: "qiJourney", action: "meridian", id: "onward" });
  expect(n.qiJourney.node).toBe(3); expect(n.qiJourney.duel!.hp).toBe(22);
  expect(n.herbs).toBe(0); expect(n.stones).toBe(s.stones);
  expect(n.month).toBe(s.month); expect(validState(n)).toBe(true);
  expect(migrateSave(n)).toEqual(n);
});

function snowReady() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" }); p.fight("well");
  p.act({ kind: "inherit", technique: "spring" }); p.fight("application");
  p.cultivate(200); p.fight("exit"); p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.act({ kind: "travel", destination: "snow" });
  return p.state;
}
it.each(["supplies", "service", "relic", "training"] as const)("snow %s preparation reaches the same earned material without mandatory return trips", method => {
  const s = snowReady();
  // Controlled inventory isolates preparation prices; progression above uses public commands.
  s.stones = 100; s.herbs = 20; s.workshop.ward = 1;
  s.journey.relics.vial = 2; s.journey.equipped = "vial";
  const action = { kind: "routePrepare", route: "snow", method } as const;
  const quote = growthQuote(s, action);
  const n = dispatch(s, { type: "foundationJourney", action, id: "snow-prep" });
  expect(quote.error).toBe(""); expect(n.month - s.month).toBe(method === "training" ? 6 : 1);
  expect(n.stones).toBe(100 - quote.stones); expect(n.herbs).toBe(20 - quote.herbs);
  expect(n.workshop.ward).toBe(1 - quote.ward);
  expect(dispatch(n, { type: "foundationJourney", action, id: "twice" })).toBe(n);
  expect(dispatch(migrateSave(s), { type: "foundationJourney", action, id: "snow-prep" })).toEqual(n);
  const p = journeyPlayer(n);
  p.act({ kind: "routeChoose", route: "snow", choice: "swift" });
  p.fight("deer"); p.act({ kind: "routeProcess", route: "snow", method: "self" });
  expect(p.state.foundationJourney.growth.refined).toBe(true);
  expect(p.state.foundationJourney.growth.routes.snow.revisited).toBe(false);
  expect(p.state.foundationJourney.last).toContain("前两合");
  expect(validState(p.state)).toBe(true);
});
it("alternative snow preparation rejects un-equipped knowledge, wrong locations, poor funds and lifespan exhaustion", () => {
  const s = snowReady(); s.stones = 100;
  s.journey.equipped = null;
  const gear = { kind: "routePrepare", route: "snow", method: "relic" } as const;
  expect(growthQuote(s, gear).error).toContain("装配二阶");
  const training = { kind: "routePrepare", route: "snow", method: "training" } as const;
  const untrained = structuredClone(s); untrained.growth.training[untrained.journey.main!] = 0;
  expect(growthQuote(untrained, training).error).toContain("通达");
  expect(growthQuote(s, { ...training, route: "estate" }).error).not.toBe("");
  const poor = structuredClone(s); poor.stones = 1;
  expect(dispatch(poor, { type: "foundationJourney", action: training, id: "poor" })).toBe(poor);
  s.age = s.limit - 2;
  const n = dispatch(s, { type: "foundationJourney", action: training, id: "last" });
  expect(n.status).toBe("dead"); expect(n.stones).toBe(s.stones);
  expect(n.foundationJourney.growth.routes.snow.prepared).toBe(false);
  const options = journeyOptions(untrained, "journey");
  expect(options.find(o => o.label.startsWith("行功御寒"))?.error).not.toBe("");
});
it("refined essence helps the next frontier fights only after promotion, with a bounded opening benefit", () => {
  const s = journeyCheckpoint("male", true);
  s.foundationJourney.duel = { id: "rescue", ruleset: 2, hp: 70, enemy: 200, turn: 0, effect: "none", aid: false };
  const plain = structuredClone(s); plain.foundationJourney.growth.refined = false;
  expect(tacticalAdjustment(s, "guard").incoming).toBe(tacticalAdjustment(plain, "guard").incoming - 3);
  for (const turn of [2, 3]) {
    s.foundationJourney.duel.turn = turn; plain.foundationJourney.duel!.turn = turn;
    expect(tacticalAdjustment(s, "guard").incoming).toBe(tacticalAdjustment(plain, "guard").incoming);
  }
  s.foundationJourney.duel.turn = 0; s.foundationJourney.cultivation = 399;
  expect(tacticalAdjustment(s, "guard").note).not.toContain("凝练灵元抵住");
});
