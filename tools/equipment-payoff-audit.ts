import { foundationCombatFixture } from "./foundation-combat-fixture";
import { findCombatRoute, simulateMove } from "./foundation-tactics-audit";
import { foundationExchange } from "../src/foundation-journey/combat";
import type { State } from "../src/core";
import type { Move } from "../src/combat";

export function payoffFixture(
  id: "application" | "exit" | "snow" | "rank3" | "rank5",
  main: "spring" | "blade" | "breath",
) {
  const gear = main === "blade" ? "sword" : "vial";
  const s: State = foundationCombatFixture(id, main, gear);
  s.sense = 18;
  s.journey.relics[gear] = 2;
  if (main === "blade") s.workshop.temper.sword = "keen";
  else s.workshop.temper.vial = main === "spring" ? "shell" : "flow";
  const auxiliary = main === "breath" ? "mirror" : "bell";
  s.treasures.owned[auxiliary] = 1;
  s.treasures.equipped = [auxiliary];
  return s;
}
export function replayPayoff(initial: State, moves: readonly Move[]) {
  let state = initial,
    damage = 0,
    incoming = 0,
    grass = 0;
  const rounds = [];
  for (const move of moves) {
    const d = state.foundationJourney.duel!;
    if (!d.enemy || d.turn >= 12) break;
    const p = foundationExchange(state, move)!;
    rounds.push({
      move,
      damage: p.damage,
      incoming: p.incoming,
      healing: p.healing,
      herbs: p.herbs,
    });
    damage += Math.min(d.enemy, p.damage);
    incoming += p.incoming;
    grass += p.herbs;
    const next = simulateMove(state, move);
    if (!next) return { won: false, hp: 0, damage, incoming, grass, rounds };
    state = next;
  }
  return {
    won: state.foundationJourney.duel!.enemy === 0,
    hp: state.foundationJourney.duel!.hp,
    damage,
    incoming,
    grass,
    rounds,
  };
}
/** Controlled fixtures, not the player's save or a new-player win-rate survey.
 * Search only the unreforged route, then replay identical choices after reforging.
 * Different builds are illustrative, not equal-purchase-cost or globally optimal.
 */
export function equipmentPayoffAudit() {
  const rows = [];
  for (const id of ["application", "exit", "snow", "rank3", "rank5"] as const)
    for (const main of ["spring", "blade", "breath"] as const) {
      const before = payoffFixture(id, main);
      const route = findCombatRoute(before);
      if (!route) throw new Error(`No supplied route: ${id}/${main}`);
      const after = structuredClone(before);
      after.itemGrowth.reforged[after.journey.equipped!] = true;
      rows.push({
        id,
        main,
        moves: route.moves,
        before: replayPayoff(before, route.moves),
        after: replayPayoff(after, route.moves),
      });
    }
  return rows;
}
