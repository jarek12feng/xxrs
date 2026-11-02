import { createGame, dispatch, validState } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
export function sample() {
  const rows = [];
  for (const route of ["medicine", "sect", "wander"] as const)
    for (const path of ["wood", "sword"] as const)
      for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
        for (const seed of [1, 42, 2718]) {
          let s = createGame("成长核对", path, seed, aptitude);
          let income = 0,
            spending = 0,
            work = 0,
            battles = 0,
            commands = 0;
          const gates: number[] = [];
          for (; commands < 450 && !s.realm; commands++) {
            const before = s;
            const cmd = foundationStep(s, true, route);
            s = dispatch(s, { ...cmd, id: `audit${commands}` });
            if (!validState(s)) throw Error("Invalid state");
            income += Math.max(0, s.stones - before.stones);
            spending += Math.max(0, before.stones - s.stones);
            if (cmd.type === "advance" && cmd.activity === "work") work++;
            if (
              cmd.type === "qiJourney" &&
              ["strike", "guard", "discern"].includes(cmd.action)
            )
              battles++;
            if (s.qiJourney.gates > before.qiJourney.gates) gates.push(s.month);
          }
          rows.push({
            route,
            path,
            aptitude,
            seed,
            realm: s.realm,
            commands,
            months: s.month,
            age: s.age / 12,
            limit: s.limit / 12,
            work,
            battleCommands: battles,
            income,
            spending,
            stones: s.stones,
            gateMonths: gates,
          });
        }
  return rows;
}
console.log(
  JSON.stringify(
    {
      note: "Public commands; reference policy knows encounter patterns and spends conservatively. These are regression samples, not real player durations or success rates.",
      rows: sample(),
    },
    null,
    2,
  ),
);
