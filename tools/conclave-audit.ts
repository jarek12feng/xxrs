import { writeFileSync } from "node:fs";
import { conclavePlayer } from "./conclave-checkpoint";
const samples = [];
for (const main of ["spring", "blade", "breath"] as const)
  for (const route of ["shelter", "current"] as const)
    for (const preparation of ["ward", "insight"] as const)
      for (const method of ["inherit", "still"] as const) {
        const p = conclavePlayer(main);
        const start = p.state.month;
        const midBeforeMeeting = p.state.month - p.state.outerSea.notice!;
        if (
          main === "spring" &&
          route === "shelter" &&
          preparation === "ward" &&
          method === "inherit"
        )
          writeFileSync(
            "docs/conclave-review/start.json",
            JSON.stringify(p.state, null, 2),
          );
        p.arrive();
        p.work(12);
        p.herbs(20);
        p.act({ kind: "training", style: preparation });
        p.battle("contest");
        p.battle("contest");
        p.act({ kind: "route", route });
        for (let i = 0; i < 2; i++) {
          p.work(18);
          p.herbs(12);
          p.act({ kind: "prepare" });
          p.act({ kind: "enter" });
          p.battle("fight");
          if (!i) {
            p.work(18);
            p.act({ kind: "attune" });
          }
        }
        p.act({ kind: "method", method });
        while (p.state.outerSea.cultivation < 599)
          p.send({ type: "advance", activity: "cultivate", months: 120 });
        p.work(30);
        p.act({ kind: "late" });
        p.act({ kind: "leave" });
        p.send({ type: "outerSea", action: { kind: "home" } });
        samples.push({
          main,
          route,
          preparation,
          method,
          midMonthsSinceNotice: midBeforeMeeting,
          elapsedMonths: p.state.month - start,
          age: p.state.age,
          remaining: p.state.limit - p.state.age,
          stones: p.state.stones,
          herbs: p.state.herbs,
          stage: p.state.conclave.stage,
          wins: p.state.conclave.wins,
          depth: p.state.conclave.depth,
        });
        if (
          main === "spring" &&
          route === "shelter" &&
          preparation === "ward" &&
          method === "inherit"
        )
          writeFileSync(
            "docs/conclave-review/completed.json",
            JSON.stringify(p.state, null, 2),
          );
      }
writeFileSync(
  "docs/conclave-review/routes.json",
  JSON.stringify(samples, null, 2),
);
console.log("Passed", samples.length, "public-command routes");
console.log(
  "Midpoint months since notice",
  Math.min(...samples.map((s) => s.midMonthsSinceNotice)),
  Math.max(...samples.map((s) => s.midMonthsSinceNotice)),
);
