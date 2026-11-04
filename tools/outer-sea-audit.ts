import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { outerSeaCheckpoint, seaPlayer, observeTide } from "./outer-sea-checkpoint";
import { seaFoe } from "../src/outer-sea/rules";
const output = process.argv[2] ?? "docs/outer-sea-review";
mkdirSync(output, { recursive: true });
const results = [];
for (const main of ["spring", "blade", "breath"] as const)
  for (const pact of ["share", "private"] as const)
    for (const reward of ["seal", "manual"] as const) {
      const p = seaPlayer(outerSeaCheckpoint(main));
      const start = {
        month: p.state.month,
        stones: p.state.stones,
        herbs: p.state.herbs,
      };
      if (main === "spring" && pact === "share" && reward === "seal")
        writeFileSync(
          join(output, "start.json"),
          JSON.stringify(p.state, null, 2),
        );
      const sea = (
        action: Parameters<typeof p.send>[0] extends never
          ? never
          : import("../src/outer-sea/rules").SeaAction,
      ) => p.send({ type: "outerSea", action });
      p.work(40);
      p.herbs(12);
      sea({ kind: "sail" });
      sea({ kind: "meet" });
      observeTide(p.send);
      sea({ kind: "pact", pact });
      sea({ kind: "prepare" });
      sea({ kind: "enter" });
      const fight = () => {
        sea({ kind: "fight" });
        let turns = 0;
        while (p.state.outerSea.duel) {
          const d = p.state.outerSea.duel;
          if (++turns > 16) throw new Error("stuck");
          sea({ kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! });
        }
      };
      fight();
      if (p.state.outerSea.cleared !== 1) throw new Error(`lost outer ${main}`);
      sea({ kind: "reward", reward });
      sea({ kind: "report" });
      p.work(8);
      sea(
        reward === "seal"
          ? { kind: "attune" }
          : { kind: "method", method: "continue" },
      );
      if (reward === "seal") {
        while (p.state.sense < 18)
          p.send({ type: "advance", activity: "meditate", months: 1 });
        p.send({
          type: "treasure",
          action: { kind: "deploy", item: "tideSeal" },
        });
      }
      while (p.state.outerSea.cultivation < 60)
        p.send({ type: "advance", activity: "cultivate", months: 12 });
      p.work(12);
      p.herbs(6);
      sea({ kind: "prepare" });
      sea({ kind: "enter" });
      fight();
      if (p.state.outerSea.cleared !== 2)
        throw new Error(`lost inner ${main}/${pact}/${reward}`);
      results.push({
        main,
        pact,
        reward,
        start,
        end: {
          month: p.state.month,
          stones: p.state.stones,
          herbs: p.state.herbs,
          cultivation: p.state.outerSea.cultivation,
        },
        months: p.state.month - start.month,
      });
      if (main === "spring" && pact === "share" && reward === "seal")
        writeFileSync(
          join(output, "completed.json"),
          JSON.stringify(p.state, null, 2),
        );
    }
writeFileSync(join(output, "routes.json"), JSON.stringify(results, null, 2));
console.log(`Passed ${results.length} deterministic public-command routes`);
