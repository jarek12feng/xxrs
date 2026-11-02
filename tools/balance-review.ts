import { createGame, dispatch, validState } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
import { routeInfo } from "../src/foundation-journey/growth";
import type { ResourceRoute } from "../src/foundation-journey/growth-state";
import { foundationCombatFixture } from "./foundation-combat-fixture";
import { findCombatRoute, fixedCombatRoute } from "./foundation-tactics-audit";

export function fullBalanceJourney(
  route: ResourceRoute,
  main: "spring" | "blade" | "breath",
  upgrade = false,
) {
  const p = journeyPlayer(
    journeyCheckpoint("male", false, main === "blade" ? "sword" : "wood", main),
  );
  const start = {
    age: p.state.age / 12,
    stones: p.state.stones,
    month: p.state.month,
  };
  const fund = () => {
    for (let i = 0; p.state.stones < 90 && i < 20; i++)
      p.send({ type: "advance", activity: "work", months: 12 });
    for (let i = 0; p.state.herbs < 15 && i < 20; i++)
      p.send({ type: "supplies" });
  };
  if (upgrade) {
    fund();
    if (p.state.growth.training[main] < 2)
      p.send({ type: "trainTechnique", technique: main });
    if (p.state.growth.training[main] < 2)
      p.send({ type: "trainTechnique", technique: main });
    const relic = main === "blade" ? "sword" : "vial";
    p.send({ type: "forge", relic });
    p.send({ type: "equipRelic", relic });
  }
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: main });
  p.fight("application");
  p.cultivate(200);
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.act({ kind: "travel", destination: route });
  fund();
  p.act({ kind: "routePrepare", route, method: "service" });
  p.act({ kind: "routeChoose", route, choice: "careful" });
  if (route === "estate") {
    p.act({ kind: "sideInvestigate", side: "estate" });
    p.fight("estate");
  }
  p.fight(routeInfo[route].foe);
  fund();
  p.act({ kind: "routeProcess", route, method: "self" });
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "mapPlan", plan: "detour" });
  p.act({ kind: "contact", contact: "letters" });
  p.act({ kind: "depart" });
  p.cultivate(400);
  p.act({ kind: "reunion" });
  p.act({ kind: "expeditionPlan" });
  p.act({ kind: "travel", destination: "frontier" });
  p.act({ kind: "report" });
  p.act({ kind: "signal" });
  if (route === "frontier") p.act({ kind: "supply" });
  else p.fight("frontier");
  p.act({ kind: "mentor" });
  p.fight("rescue");
  p.cultivate(500);
  p.act({ kind: "finish" });
  p.fight("culmination");
  p.cultivate(600);
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "epilogue" });
  const s = p.state;
  if (!validState(s) || !s.foundationJourney.epilogue)
    throw Error("Incomplete route");
  return {
    route,
    main,
    upgrade,
    start,
    month: s.month,
    age: s.age / 12,
    limit: s.limit / 12,
    remaining: (s.limit - s.age) / 12,
    stones: s.stones,
    herbs: s.herbs,
  };
}
export function balanceReview() {
  const qi = [];
  for (const route of ["medicine", "sect", "wander"] as const)
    for (const path of ["wood", "sword"] as const)
      for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
        for (let i = 1; i <= 16; i++) {
          const seed = Math.imul(i, 2654435761) >>> 0;
          let s = createGame("数值复核", path, seed, aptitude),
            income = 0,
            spending = 0,
            workMonths = 0,
            failures = 0,
            commands = 0;
          for (; commands < 600 && !s.realm; commands++) {
            const before = s,
              c = foundationStep(s, true, route);
            s = dispatch(s, { ...c, id: `balance-review-${commands}` });
            if (!validState(s)) throw Error("Invalid qi route");
            income += Math.max(0, s.stones - before.stones);
            spending += Math.max(0, before.stones - s.stones);
            if (c.type === "advance" && c.activity === "work")
              workMonths += s.month - before.month;
            if (c.type === "break" && s.pills < before.pills && !s.realm)
              failures++;
          }
          if (!s.realm) throw Error("Qi route did not finish");
          qi.push({
            route,
            path,
            aptitude,
            seed,
            commands,
            month: s.month,
            age: s.age / 12,
            limit: s.limit / 12,
            income,
            spending,
            workMonths,
            failures,
            stones: s.stones,
          });
        }
  const foundation = [];
  for (const route of ["estate", "snow", "frontier"] as const)
    for (const main of ["spring", "blade", "breath"] as const)
      for (const upgrade of [false, true])
        foundation.push(fullBalanceJourney(route, main, upgrade));
  const combat = [];
  for (const id of [
    "well",
    "application",
    "salamander",
    "deer",
    "frontier",
    "rescue",
    "culmination",
  ] as const)
    for (const main of ["spring", "blade", "breath"] as const)
      for (const gear of [
        "none",
        "sword1",
        "sword2",
        "vial1",
        "vial2",
      ] as const) {
        const s = foundationCombatFixture(
          id,
          main,
          gear.startsWith("sword") ? "sword" : "vial",
        );
        if (gear === "none") s.journey.equipped = null;
        else s.journey.relics[s.journey.equipped!] = gear.endsWith("2") ? 2 : 1;
        const route = findCombatRoute(s);
        combat.push({
          id,
          main,
          gear,
          solved: !!route,
          rounds: route?.moves.length,
          hp: route?.state.foundationJourney.duel?.hp,
          constantWins: (["guard", "strike", "discern"] as const).filter(
            (m) => fixedCombatRoute(s, m).won,
          ),
        });
      }
  return {
    note: "Public-command reference journeys and controlled combat fixtures. Not human win rates or first-play durations.",
    qi,
    foundation,
    combat,
  };
}
if (process.argv.includes("--run"))
  console.log(JSON.stringify(balanceReview(), null, 2));
