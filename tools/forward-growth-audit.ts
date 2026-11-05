import { createCultivator as createGame } from "./cultivator-fixture";
import { dispatch, validState, type State } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import type { QiRoute } from "../src/qi-journey/state";
import type { Passage } from "../src/qi-journey/passage";
import type { Move } from "../src/expedition/content";

export function qiEntryCheckpoint() {
  let s = createGame("成长取舍样本", "wood", 42, "insightful");
  for (let i = 0; i < 400; i++) {
    const cmd = foundationStep(s);
    if (cmd.type === "qiJourney" && cmd.action.startsWith("enter:")) return s;
    s = dispatch(s, { ...cmd, id: `tradeoff-entry-${i}` });
  }
  throw Error("No entry checkpoint");
}

// Control fixtures compare investments, not natural player success rates or optimal builds.
export function qiInvestmentSample(main: "spring" | "blade" | "breath", route: QiRoute, passage: Passage) {
  const base = qiEntryCheckpoint();
  if (!base.journey.known.includes(main)) base.journey.known.push(main);
  base.journey.main = main;
  // Keep foundation/sense/study earned by the reference journey (18/9/4).
  base.mastery = 4;
  base.injury = 0; base.stones = 30; base.herbs = 12;
  base.journey.equipped = passage === "relic" ? "vial" : null;
  base.journey.relics = { sword: 0, vial: passage === "relic" ? 1 : 0 };
  base.growth.training[main] = passage === "sense" ? 1 : 0;
  base.workshop.ward = passage === "ward" ? 1 : 0;
  const entered = dispatch(base, { type: "qiJourney", action: `enter:${route}`, id: "sample-enter" });
  if (!entered.qiJourney.duel) throw Error("Entry rejected");
  let states: { s: State; moves: string[] }[] = [{ s: entered, moves: [] }];
  for (let step = 0; step < 33; step++) {
    const next: typeof states = [];
    for (const { s, moves } of states) {
      const actions: (Move | Passage)[] = s.qiJourney.duel ? ["guard", "strike", "discern"] : [passage];
      for (const action of actions) {
        const n = dispatch(s, { type: "qiJourney", action, id: `sample-${step}` });
        if (n === s || (!n.qiJourney.node && !n.qiJourney.essence)) continue;
        if (!validState(n)) throw Error("Invalid sample state");
        const sequence = [...moves, action];
        if (n.qiJourney.essence) return {
          main, route, passage, won: true, moves: sequence,
          herbsSpent: base.herbs - n.herbs, wardSpent: base.workshop.ward - n.workshop.ward,
          entryStones: base.stones - (n.stones - 12),
        };
        next.push({ s: n, moves: sequence });
      }
    }
    next.sort((a, b) => {
      const score = (s: State) => s.qiJourney.node * 100 + (s.qiJourney.duel?.hp ?? s.qiJourney.vigor) - (s.qiJourney.duel?.enemy ?? 0) * 0.55 + s.herbs;
      return score(b.s) - score(a.s);
    });
    const unique = new Map<string, typeof states[number]>();
    for (const row of next) {
      const q = row.s.qiJourney;
      const key = JSON.stringify([q.node, q.duel, q.vigor, row.s.herbs, row.s.workshop.ward]);
      if (!unique.has(key)) unique.set(key, row);
      if (unique.size === 80) break;
    }
    states = [...unique.values()];
  }
  return { main, route, passage, won: false };
}
if (process.argv.includes("--run")) {
  const rows = (["spring", "blade", "breath"] as const).flatMap(main =>
    (["medicine", "sword", "array"] as const).flatMap(route =>
      (["ward", "relic", "sense"] as const).map(passage => qiInvestmentSample(main, route, passage))));
  console.log(JSON.stringify({ kind: "controlled fixtures; bounded search, not player rates", rows }, null, 2));
  if (["spring", "blade", "breath"].some(main => new Set(rows.filter(r => r.main === main && r.won).map(r => r.passage)).size < 2)) process.exitCode = 1;
}
