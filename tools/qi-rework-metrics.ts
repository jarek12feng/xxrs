import { createGame, dispatch, validState } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
const rows = [];
for (const route of ["medicine", "sect", "wander"] as const)
  for (const seed of [1, 42, 847293]) {
    let s = createGame("修行节奏验收", "wood", seed, "insightful", "male"),
      middle: number | null = null,
      pill: number | null = null,
      commands = 0,
      attempts = 0;
    for (; commands < 650 && !s.realm; commands++) {
      const intent = foundationStep(s, true, route),
        n = dispatch(s, { ...intent, id: `metrics-${commands}` });
      if (n === s || !validState(n))
        throw Error(
          `Blocked/invalid ${route} ${seed} ${JSON.stringify(intent)}`,
        );
      if (intent.type === "break") attempts++;
      if (!s.qiJourney.cultivation.middle && n.qiJourney.cultivation.middle)
        middle = n.month;
      if (!s.pills && n.pills && pill === null) pill = n.month;
      s = n;
    }
    if (!s.realm) throw Error("No foundation");
    rows.push({
      route,
      seed,
      middleMonth: middle,
      firstPillMonth: pill,
      foundationMonth: s.month,
      foundationAgeYears: Math.floor(s.age / 12),
      commands,
      attempts,
    });
  }
console.log(
  JSON.stringify(
    {
      scope:
        "Nine deterministic public-command new-game routes; not human play-time measurements.",
      rows,
    },
    null,
    2,
  ),
);
