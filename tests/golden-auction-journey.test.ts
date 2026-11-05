import { expect, it } from "vitest";
import {
  outerSeaCheckpoint,
  seaPlayer,
  observeTide,
} from "../tools/outer-sea-checkpoint";
import { seaFoe, type SeaAction } from "../src/outer-sea/rules";
import { auctionSchedule, auctionQuote } from "../src/auction";

it("正常金丹资源与年月：筹资、提前赴会、离开再访、成交后服药及跨届", () => {
  const p = seaPlayer(outerSeaCheckpoint());
  const start = {
    month: p.state.month,
    stones: p.state.stones,
    study: p.state.study,
  };
  p.work(180);
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "meet" } });
  p.send({ type: "outerSea", action: { kind: "auctionNews" } });
  const schedule = auctionSchedule(p.state.month, "golden");
  // Advance by ordinary work commands, without altering the calendar or resources.
  while (p.state.month < schedule.announces)
    p.send({
      type: "advance",
      activity: "work",
      months: Math.min(12, schedule.announces - p.state.month),
    });
  p.send({ type: "outerSea", action: { kind: "guild" } });
  p.send({ type: "treasure", action: { kind: "catalog", venue: "golden" } });
  const catalog = structuredClone(p.state.treasures.auction!);
  const missed = seaPlayer(structuredClone(p.state));
  missed.send({ type: "advance", activity: "cultivate", months: 120 });
  while (missed.state.month < catalog.closes)
    missed.send({
      type: "advance",
      activity: "work",
      months: Math.min(12, catalog.closes - missed.state.month),
    });
  expect(auctionQuote(missed.state, { kind: "enter" }).error).toContain("截止");
  expect(missed.state.treasures.auction!.lots).toEqual(catalog.lots);
  p.send({ type: "outerSea", action: { kind: "guildReturn" } });
  p.send({ type: "outerSea", action: { kind: "home" } });
  p.send({ type: "advance", activity: "work", months: 1 });
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "guild" } });
  expect(p.state.treasures.auction).toEqual(catalog);
  if (p.state.month < catalog.opens)
    p.send({ type: "treasure", action: { kind: "wait" } });
  p.send({ type: "treasure", action: { kind: "budget", value: 180 } });
  p.send({ type: "treasure", action: { kind: "enter" } });
  const before = { herbs: p.state.herbs, iron: p.state.workshop.iron };
  let guard = 0;
  while (!p.state.treasures.auction!.closed) {
    if (++guard > 100) throw Error("Auction stalled");
    p.send({ type: "treasure", action: { kind: "bid" } });
  }
  expect(p.state.herbs).toBeGreaterThanOrEqual(before.herbs + 12);
  expect(p.state.workshop.iron).toBe(before.iron + 4);
  const paid = p.state.treasures.auction!.lots.map((l) => ({
    item: l.item,
    paid: l.paid,
  }));
  p.send({ type: "outerSea", action: { kind: "guildReturn" } });
  p.send({ type: "outerSea", action: { kind: "home" } });
  if (p.state.growth.medicines.spirit) {
    const sense = p.state.sense;
    p.send({ type: "consume", medicine: "spirit" });
    expect(p.state.sense).toBeGreaterThan(sense);
  }
  while (p.state.month < catalog.closes)
    p.send({ type: "advance", activity: "work", months: 1 });
  expect(auctionQuote(p.state, { kind: "enter" }).error).toBeTruthy();
  const next = auctionSchedule(p.state.month, "golden");
  while (p.state.month < next.announces)
    p.send({
      type: "advance",
      activity: "work",
      months: Math.min(12, next.announces - p.state.month),
    });
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "guild" } });
  p.send({ type: "treasure", action: { kind: "catalog", venue: "golden" } });
  expect(p.state.treasures.auction!.number).toBe(catalog.number + 1);
  p.send({ type: "outerSea", action: { kind: "guildReturn" } });
  const sea = (action: SeaAction) => p.send({ type: "outerSea", action });
  observeTide(p.send);
  sea({ kind: "pact", pact: "share" });
  for (let depth = 1; depth <= 2; depth++) {
    if (depth === 2)
      while (p.state.outerSea.cultivation < 60)
        p.send({ type: "advance", activity: "cultivate", months: 12 });
    p.herbs(6);
    sea({ kind: "prepare" });
    sea({ kind: "enter" });
    sea({ kind: "fight" });
    while (p.state.outerSea.duel) {
      const d = p.state.outerSea.duel;
      sea({ kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! });
    }
    expect(p.state.outerSea.cleared).toBe(depth);
    if (depth === 1) {
      sea({ kind: "reward", reward: "seal" });
      sea({ kind: "attune" });
      while (p.state.sense < 18)
        p.send({ type: "advance", activity: "meditate", months: 1 });
      p.send({
        type: "treasure",
        action: { kind: "deploy", item: "tideSeal" },
      });
    }
  }
  const materialBefore = p.state.herbs;
  p.send({
    type: "artifactGrowth",
    action: { kind: "cultivate", artifact: "tideSeal" },
  });
  expect(p.state.itemGrowth.golden.seal).toBe(true);
  expect(p.state.herbs).toBe(materialBefore - 4);
  console.log(
    JSON.stringify({
      start,
      edition: catalog.number,
      opens: catalog.opens,
      paid,
      endMonth: p.state.month,
      stones: p.state.stones,
    }),
  );
}, 60000);
