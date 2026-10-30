import type { State } from "../src/core";
import { foundationExchange } from "../src/foundation-journey/combat";
import { challenges } from "../src/foundation-journey/content";
import type { Move } from "../src/expedition/content";
export interface CombatRoute {
  state: State;
  moves: Move[];
  grass: number;
}
export function simulateMove(s: State, move: Move): State | null {
  const d = s.foundationJourney.duel!,
    p = foundationExchange(s, move)!;
  const enemy = Math.max(0, d.enemy - p.damage);
  const hp = enemy === 0 ? d.hp : Math.max(0, d.hp - p.incoming) + p.healing;
  if (!hp) return null;
  return {
    ...s,
    herbs: s.herbs - p.herbs,
    foundationJourney: {
      ...s.foundationJourney,
      duel: { ...d, hp, enemy, turn: d.turn + 1, effect: move },
    },
  };
}
// Bounded planning over exact public previews, not a claim of a globally optimal player policy.
export function findCombatRoute(
  initial: State,
  beam = 160,
): CombatRoute | null {
  let states: CombatRoute[] = [{ state: initial, moves: [], grass: 0 }];
  for (let i = initial.foundationJourney.duel!.turn; i < 12; i++) {
    const next: CombatRoute[] = [];
    for (const route of states)
      for (const move of ["guard", "strike", "discern"] as const) {
        const state = simulateMove(route.state, move);
        if (!state) continue;
        next.push({
          state,
          moves: [...route.moves, move],
          grass: initial.herbs - state.herbs,
        });
      }
    const winners = next.filter(
      (r) => r.state.foundationJourney.duel!.enemy === 0,
    );
    if (winners.length)
      return winners.sort(
        (a, b) =>
          b.state.foundationJourney.duel!.hp -
            a.state.foundationJourney.duel!.hp || a.grass - b.grass,
      )[0]!;
    const unique = new Map<string, CombatRoute>();
    next.sort((a, b) => {
      const score = (r: CombatRoute) =>
        r.state.foundationJourney.duel!.hp -
        r.state.foundationJourney.duel!.enemy * 0.55 +
        Math.min(r.state.herbs, 4);
      return score(b) - score(a);
    });
    for (const r of next) {
      const d = r.state.foundationJourney.duel!;
      const key = [d.hp, d.enemy, d.effect, r.state.herbs].join(":");
      if (!unique.has(key)) unique.set(key, r);
      if (unique.size >= beam) break;
    }
    states = [...unique.values()];
  }
  return null;
}
export function fixedCombatRoute(initial: State, policy: Move | "read") {
  let state: State | null = initial;
  const sequence: Move[] = [];
  while (
    state &&
    state.foundationJourney.duel!.turn < 12 &&
    state.foundationJourney.duel!.enemy
  ) {
    const d = state.foundationJourney.duel!,
      e = challenges[d.id];
    // Read uses the correct flag exposed by the same exchange function as the UI.
    const move =
      policy === "read"
        ? ((["guard", "strike", "discern"] as const).find(
            (m) => foundationExchange(state!, m)!.correct,
          ) ?? e.pattern[d.turn % e.pattern.length]!)
        : policy;
    sequence.push(move);
    state = simulateMove(state, move);
  }
  return {
    won: !!state && state.foundationJourney.duel!.enemy === 0,
    hp: state?.foundationJourney.duel!.hp ?? 0,
    grass: state ? initial.herbs - state.herbs : null,
    moves: sequence,
  };
}
