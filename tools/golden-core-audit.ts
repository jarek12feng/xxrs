import { writeFileSync } from "node:fs";
import { condensationCheckpoint } from "./golden-core-checkpoint";
import {
  dispatch,
  migrateSave,
  validState,
  type State,
  type Intent,
} from "../src/core";
import { goldenExchange, goldenChance } from "../src/golden-core/rules";
import { contestFoes } from "../src/sect-contest/content";
import { readiness } from "../src/combat/game";
const results = [];
for (const main of ["spring", "blade", "breath"] as const)
  for (const route of ["share", "alone", "contest"] as const) {
    let s = condensationCheckpoint(main),
      serial = 0;
    const start = {
      month: s.month,
      age: s.age,
      stones: s.stones,
      herbs: s.herbs,
    };
    const send = (intent: Intent) => {
      const c = { ...intent, id: `audit-${++serial}` };
      const n = dispatch(s, c);
      if (n === s) throw new Error(`Rejected ${JSON.stringify(c)}`);
      if (!validState(n)) throw new Error(`Invalid ${JSON.stringify(c)}`);
      if (JSON.stringify(n) !== JSON.stringify(dispatch(s, c)))
        throw new Error("Non deterministic");
      s = migrateSave(JSON.parse(JSON.stringify(n)));
    };
    const work = (stones: number) => {
      let tries = 0;
      while (s.stones < stones) {
        if (++tries > 30) throw new Error("Cannot fund");
        send({ type: "advance", activity: "work", months: 6 });
      }
    };
    const herbs = (n: number) => {
      while (s.herbs < n) {
        work(8);
        send({ type: "supplies" });
      }
    };
    if (route === "contest") {
      send({ type: "join", branch: "dan" });
      send({ type: "duty", duty: "watch" });
      send({ type: "sectContest", action: { kind: "prepare" } });
      while (s.month < s.sectContest.starts)
        send({ type: "advance", activity: "work", months: 12 });
      send({ type: "sectContest", action: { kind: "enter" } });
      for (let i = 0; i < 3; i++) {
        send({ type: "sectContest", action: { kind: "fight" } });
        if (i === 2)
          send({ type: "sectContest", action: { kind: "withdraw" } });
        else
          while (s.sectContest.duel)
            send({
              type: "sectContest",
              action: {
                kind: "move",
                move: contestFoes[i]!.pattern[s.sectContest.duel.turn % 3]!,
              },
            });
      }
      if (s.sectContest.best !== 2) throw new Error("Need two wins");
      send({
        type: "sectContest",
        action: { kind: "reward", reward: "medicine" },
      });
      send({ type: "sectContest", action: { kind: "leave" } });
    } else {
      work(12);
      herbs(8);
      send({ type: "goldenCore", action: { kind: "prepare" } });
      send({ type: "goldenCore", action: { kind: "route", route } });
      send({ type: "goldenCore", action: { kind: "fight" } });
      while (s.goldenCore.duel) {
        const d = s.goldenCore.duel;
        const options = (["guard", "discern", "strike"] as const)
          .map((move) => ({ move, p: goldenExchange(s, move)! }))
          .sort((a, b) => score(b) - score(a));
        function score(x: (typeof options)[number]): number {
          return (
            (x.p.damage >= d.enemy ? 10000 : 0) +
            x.p.damage -
            x.p.incoming +
            x.p.healing
          );
        }
        send({
          type: "goldenCore",
          action: { kind: "move", move: options[0]!.move },
        });
      }
      send({ type: "goldenCore", action: { kind: "take" } });
    }
    work(16);
    herbs(8);
    send({ type: "goldenCore", action: { kind: "brew", method: "self" } });
    work(32);
    send({ type: "goldenCore", action: { kind: "site", site: "rented" } });
    if (!s.workshop.ward) {
      work(32);
      send({ type: "workshop", order: { product: "ward", method: "buy" } });
    }
    work(16);
    send({ type: "goldenCore", action: { kind: "guard" } });
    while (s.injury) send({ type: "advance", activity: "rest", months: 1 });
    if (main === "spring" && route === "share")
      writeFileSync(
        "docs/condensation-review/before-break.json",
        JSON.stringify(s, null, 2),
      );
    const chance = goldenChance(s),
      before = readiness(s);
    send({ type: "goldenCore", action: { kind: "break" } });
    if (s.realm !== 2) throw new Error("Expected prepared success");
    const power = readiness(s);
    send({ type: "goldenCore", action: { kind: "farShore" } });
    if (main === "spring" && route === "share")
      writeFileSync(
        "docs/condensation-review/after-break.json",
        JSON.stringify(s, null, 2),
      );
    results.push({
      main,
      route,
      start,
      end: { month: s.month, age: s.age, stones: s.stones, herbs: s.herbs },
      months: s.month - start.month,
      chance,
      damageGain: power.damage - before.damage,
      armorGain: power.armor - before.armor,
      valid: validState(s),
    });
  }
writeFileSync(
  "docs/condensation-review/routes.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
