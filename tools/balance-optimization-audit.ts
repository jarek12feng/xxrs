/** Public-command continuation for the three established builds; no edited progress. */
import {
  goldenLateCheckpoint,
  finishGoldenCompletion,
} from "./golden-completion-checkpoint";
const rows = [];
for (const main of ["spring", "blade", "breath"] as const) {
  const journey = finishGoldenCompletion(goldenLateCheckpoint(main));
  rows.push({
    main,
    checkpoints: Object.fromEntries(
      Object.entries(journey.checkpoints)
        .filter(([key]) =>
          ["late", "completion", "nascent-ready", "nascent"].includes(key),
        )
        .map(([key, s]) => [
          key,
          {
            month: s.month,
            age: s.age / 12,
            limit: s.limit / 12,
            stones: s.stones,
          },
        ]),
    ),
  });
}
console.log(
  JSON.stringify(
    {
      scope:
        "Three deterministic public-command reference journeys; not player success rates or human play time.",
      rows,
    },
    null,
    2,
  ),
);
