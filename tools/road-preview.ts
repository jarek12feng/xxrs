// Developer-only: generate an importable checkpoint through public game commands.
// Bundle with esbuild for Node, then pass a new output path (never overwrites).
import { writeFileSync } from "node:fs";
import {
  createGame,
  dispatch,
  validState,
  type Intent,
  type RoadAction,
  type AdventureAction,
} from "../src/core";
let state = createGame("云路验收", "wood", 42),
  id = 0;
function send(intent: Intent) {
  if (++id > 500) throw new Error("Preview simulation did not converge");
  state = dispatch(state, { ...intent, id: `preview-${id}` });
  if (!validState(state)) throw new Error("Invalid generated state");
}
function road(action: RoadAction) {
  send({ type: "road", action });
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
for (const action of ["thanks", "market", "talk", "accept"] as RoadAction[])
  road(action);
send({ type: "supplies" });
for (const action of [
  "deliver",
  "invite",
  "pass",
  "inspect",
  "camp",
  "friend",
] as RoadAction[])
  road(action);
while (!state.journey.settled) {
  if (state.pending)
    send({
      type: "choose",
      instanceId: state.pending.id,
      option: {
        meeting: "promise",
        letter: "listen",
        visit: "herbs",
        departure: "go",
        crossing: "detour",
        relic: "gift",
      }[state.pending.kind],
    });
  else if (state.injury) send({ type: "advance", activity: "rest", months: 3 });
  else if (state.qi >= 360) send({ type: "break", pill: state.pills > 0 });
  else
    send({
      type: "advance",
      activity: state.realm ? "work" : "cultivate",
      months: 12,
    });
}
while (state.injury) send({ type: "advance", activity: "rest", months: 3 });
while (state.sense < 12)
  send({ type: "advance", activity: "meditate", months: 3 });
while (state.study < 4) send({ type: "advance", activity: "study", months: 2 });
while (state.stones < 80)
  send({ type: "advance", activity: "work", months: 12 });
while (state.foundation < 24) send({ type: "prepare", kind: "retreat" });
road("pass");
const output = process.argv[2];
if (!output) throw new Error("Pass a fresh output filename");
writeFileSync(output, JSON.stringify(state, null, 2), { flag: "wx" });
console.log(
  `Generated ${output}: month ${state.month}, ${id} commands, ready for the pass`,
);
