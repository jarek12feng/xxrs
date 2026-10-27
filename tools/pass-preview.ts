// Generate a fresh checkpoint with public commands, never overwrite a player's file.
import { writeFileSync } from "node:fs";
import { mistCheckpoint } from "./mist-checkpoint";
import { dispatch, validState, type Intent } from "../src/core";
let s = mistCheckpoint(42, "wood", "male", true),
  id = 0;
const send = (intent: Intent) => {
  s = dispatch(s, { ...intent, id: `pass-preview-${++id}` });
  if (!validState(s)) throw new Error("Invalid preview checkpoint");
};
while (s.herbs < 10) send({ type: "supplies" });
send({ type: "forge", relic: "sword" });
send({ type: "equipRelic", relic: "sword" });
for (const action of [
  "examineMarks",
  "market",
  "examineLedger",
  "pass",
] as const)
  send({ type: "road", action });
const output = process.argv[2];
if (!output) throw new Error("Pass a new output filename");
writeFileSync(output, JSON.stringify(s, null, 2), { flag: "wx" });
console.log(`Prepared all three solutions at ${output}`);
