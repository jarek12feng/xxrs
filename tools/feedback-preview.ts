// Developer-only checkpoints, made with public commands; never overwrite output.
import { writeFileSync } from "node:fs";
import { createGame, dispatch, validState, type Intent } from "../src/core";
const [output, mode = "refine", seed = "123456"] = process.argv.slice(2);
if (!output) throw new Error("Pass a fresh output filename");
let s = createGame("丹火验收", "wood", Number(seed)),
  id = 0;
function send(c: Intent) {
  if (++id > 500) throw new Error("Checkpoint did not converge");
  s = dispatch(s, { ...c, id: `feedback-preview-${id}` });
  if (!validState(s)) throw new Error("Invalid checkpoint");
}
send({ type: "advance", activity: "gather", months: 3 });
send({ type: "choose", instanceId: s.pending!.id, option: "promise" });
if (mode === "break") {
  while (s.qi < 360 || s.pending) {
    if (s.pending)
      send({
        type: "choose",
        instanceId: s.pending.id,
        option: {
          meeting: "promise",
          letter: "listen",
          visit: "herbs",
          departure: "go",
          crossing: "detour",
          relic: "self",
        }[s.pending.kind],
      });
    else if (s.injury) send({ type: "advance", activity: "rest", months: 3 });
    else send({ type: "advance", activity: "cultivate", months: 12 });
  }
}
writeFileSync(output, JSON.stringify(s, null, 2), { flag: "wx" });
console.log(
  `Generated ${mode} checkpoint at month ${s.month}, realm ${s.realm}`,
);
