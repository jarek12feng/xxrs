import { foundationStep } from "./foundation-playthrough";
import {
  createGame,
  dispatch,
  validState,
  type State,
  type Intent,
  type Path,
  type Aptitude,
  type AdventureAction,
  type RoadAction,
} from "../src/core";
import { encounters } from "../src/expedition/content";
export function expeditionSession(
  seed = 42,
  path: Path = "wood",
  aptitude: Aptitude = "insightful",
) {
  let state = createGame("护送验收", path, seed, aptitude),
    id = 0;
  function send(intent: Intent) {
    if (++id > 800) throw Error("Simulation did not converge");
    state = dispatch(state, { ...intent, id: `expedition-sim-${id}` });
    if (!validState(state))
      throw Error(`Invalid state after ${JSON.stringify(intent)}`);
    return state;
  }
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as AdventureAction[])
    send({ type: "adventure", action });
  // The opening medicine route is available to both paths through its own preparation.
  for (const action of ["thanks", "market", "talk", "accept"] as RoadAction[])
    send({ type: "road", action });
  send({ type: "supplies" });
  for (const action of ["deliver", "pass", "inspect", "camp"] as RoadAction[])
    send({ type: "road", action });
  function resolve() {
    while (state.pending) send(foundationStep(state));
  }
  function prepare() {
    while (!state.journey.settled) send(foundationStep(state));
    while (state.injury) send({ type: "advance", activity: "rest", months: 3 });
    while (state.sense < 6)
      send({ type: "advance", activity: "meditate", months: 1 });
    while (state.study < 2)
      send({ type: "advance", activity: "study", months: 1 });
    while (state.foundation < 6) send({ type: "prepare", kind: "retreat" });
  }
  function fight(correct = true) {
    for (let i = 0; state.expedition.duel && i < 12; i++) {
      const d = state.expedition.duel,
        e = encounters[state.expedition.cleared]!;
      const needed = e.pattern[d.turn % e.pattern.length]!;
      send({
        type: "expedition",
        action: correct ? needed : needed === "strike" ? "guard" : "strike",
      });
    }
  }
  return {
    get state() {
      return state;
    },
    send,
    prepare,
    resolve,
    fight,
  };
}
export function balanceSample() {
  const rows: {
    path: Path;
    aptitude: Aptitude;
    seed: number;
    cleared: number;
    adventureMonths: number;
    netStones: number;
    injury: number;
  }[] = [];
  for (const path of ["wood", "sword"] as Path[])
    for (const aptitude of ["sturdy", "insightful", "perceptive"] as Aptitude[])
      for (let seed = 1; seed <= 10; seed++) {
        const p = expeditionSession(seed, path, aptitude);
        p.prepare();
        const start = p.state;
        p.send({ type: "expedition", action: "accept" });
        p.send({ type: "expedition", action: "enter" });
        p.fight();
        p.send({ type: "expedition", action: "studyArray" });
        p.send({ type: "expedition", action: "enter" });
        p.fight();
        rows.push({
          path,
          aptitude,
          seed,
          cleared: p.state.expedition.cleared,
          adventureMonths: p.state.month - start.month,
          netStones: p.state.stones - start.stones,
          injury: p.state.injury,
        });
      }
  return rows;
}
if (process.argv.includes("--run"))
  console.log(JSON.stringify(balanceSample(), null, 2));
