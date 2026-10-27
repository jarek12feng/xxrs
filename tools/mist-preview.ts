import { writeFileSync } from "node:fs";
import { mistCheckpoint } from "./mist-checkpoint";
const output = process.argv[2];
if (!output) throw new Error("Pass a fresh output filename");
const state = mistCheckpoint();
writeFileSync(output, JSON.stringify(state, null, 2), { flag: "wx" });
console.log(
  `Generated ${output}: month ${state.month}, ready for the letter; real commands only.`,
);
