import { expect, it } from "vitest";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import {
  foundationBattleReadiness,
  foundationExchange,
} from "../src/foundation-journey/combat";
import { challenges } from "../src/foundation-journey/content";
import { battleError } from "../src/foundation-journey/progression";
import { findCombatRoute } from "../tools/foundation-tactics-audit";
import { realmPressure } from "../src/realm-pressure";

function duel() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.act({ kind: "battle", battle: "exit" });
  return structuredClone(p.state);
}
it("the same stronger enemy defeats ordinary preparation but earned inheritance enables a solo victory", () => {
  const trained = duel();
  expect(trained.foundationJourney.cultivation).toBeLessThan(200);
  expect(findCombatRoute(trained)).not.toBeNull();
  const ordinary = structuredClone(trained);
  ordinary.foundationJourney.inheritance = "none";
  expect(foundationBattleReadiness(ordinary, "exit").uncovered).toBe(1);
  expect(findCombatRoute(ordinary)).toBeNull();
  expect(foundationBattleReadiness(trained, "exit").methods).toContain(
    "沉井传承与主修相合",
  );
  // The actual first-clear reward is unchanged, and it cannot be claimed twice.
  const route = findCombatRoute(trained)!;
  const player = journeyPlayer(trained),
    stones = trained.stones;
  for (const move of route.moves) player.act({ kind: "move", move });
  expect(player.state.stones).toBe(stones + challenges.exit.prize);
  expect(player.state.foundationJourney.cultivation).toBe(
    trained.foundationJourney.cultivation + 40,
  );
  expect(battleError(player.state, "exit")).toContain("不重复发奖");
});
it("a second-tier equipped relic is an independent earned route past the same pressure", () => {
  const s = duel();
  s.foundationJourney.inheritance = "none";
  s.journey.equipped = "vial";
  s.journey.relics.vial = 2;
  expect(foundationBattleReadiness(s, "exit").uncovered).toBe(0);
  expect(findCombatRoute(s)).not.toBeNull();
  s.journey.relics.vial = 1;
  expect(foundationBattleReadiness(s, "exit").uncovered).toBe(1);
  expect(findCombatRoute(s)).toBeNull();
});
it("earned methods stack across minor realms but never erase a major realm gap", () => {
  const s = duel();
  s.journey.equipped = "vial";
  s.journey.relics.vial = 2;
  expect(realmPressure(s, { realm: 1, stage: 2 }).uncovered).toBe(0);
  s.realm = 0;
  expect(
    realmPressure(s, { realm: 1, stage: 0 }, true).uncovered,
  ).toBeGreaterThan(0);
});
it("cooperation has actual exchange effects, needs the companion present and never enters solo trials", () => {
  const s = duel();
  s.foundationJourney.bond = "covenant";
  s.foundationJourney.reunion = true;
  s.companionship.stage = "done";
  s.foundationJourney.duel!.aid = true;
  const together = foundationExchange(s, "guard")!;
  expect(foundationBattleReadiness(s, "exit").cooperation).toBe(true);
  s.foundationJourney.whereabouts = "away";
  const alone = foundationExchange(s, "guard")!;
  expect(foundationBattleReadiness(s, "exit").cooperation).toBe(false);
  expect(together.damage).toBe(alone.damage + 4);
  expect(together.incoming).toBeLessThan(alone.incoming);
  s.foundationJourney.whereabouts = "returned";
  expect(foundationBattleReadiness(s, "culmination").cooperation).toBe(false);
  expect(foundationBattleReadiness(s, "rank5").cooperation).toBe(false);
});
it("cooperative previews settle the same hp, damage and herb cost through commands", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  const ready = structuredClone(p.state);
  ready.social.met = true;
  ready.social.bonded = true;
  ready.foundationJourney.bond = "covenant";
  ready.foundationJourney.reunion = true;
  ready.foundationJourney.whereabouts = "returned";
  ready.companionship.stage = "done";
  ready.foundationJourney.aid = true;
  // Focus on settlement, not the separate relationship-history validator.
  const start = runFoundationJourney(
    ready,
    { kind: "battle", battle: "exit" },
    "coop-start",
    (s) => s,
  );
  expect(start.foundationJourney.aid).toBe(false);
  expect(start.foundationJourney.duel!.aid).toBe(true);
  const preview = foundationExchange(start, "guard")!;
  const result = runFoundationJourney(
    start,
    { kind: "move", move: "guard" },
    "coop-move",
    (s) => s,
  );
  expect(result.foundationJourney.duel!.hp).toBe(
    start.foundationJourney.duel!.hp - preview.incoming + preview.healing,
  );
  expect(result.foundationJourney.duel!.enemy).toBe(
    start.foundationJourney.duel!.enemy - preview.damage,
  );
  expect(result.herbs).toBe(start.herbs - preview.herbs);
  for (const whereabouts of ["away", "missing", "shelter"] as const) {
    start.foundationJourney.whereabouts = whereabouts;
    expect(foundationBattleReadiness(start, "exit").cooperation).toBe(false);
  }
});
import { runFoundationJourney } from "../src/foundation-journey/rules";
