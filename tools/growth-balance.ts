import {
  createGame,
  dispatch,
  type State,
  type Stance,
  type Technique,
  type Relic,
} from "../src/core";

export function arenaFixture(
  main: "spring" | "blade" | "breath",
  seed = 42,
  gear: Relic = "sword",
  support: Technique = "herb",
  tier: "low" | "normal" | "full" | "dry" = "normal",
  opponent = 2,
) {
  const s = createGame("构筑对照", "wood", seed, "perceptive");
  Object.assign(s, {
    month: 48,
    age: 240,
    realm: 1,
    foundation: tier === "full" ? 24 : tier === "low" ? 0 : 12,
    sense: tier === "full" ? 12 : 8,
    study: tier === "low" ? 2 : 4,
    stones: 80,
    herbs: tier === "dry" ? 0 : 8,
  });
  Object.assign(s.story, {
    stage: "resolved",
    choice: "gift",
    luchi: "foundation",
  });
  s.memories.letter = s.memories.visit = true;
  s.journey.settled = true;
  s.journey.known = [main, support];
  s.journey.main = main;
  s.journey.support = support;
  s.growth.training[main] = tier === "full" ? 2 : tier === "low" ? 0 : 1;
  s.journey.equipped = gear;
  s.journey.relics[gear] = tier === "full" ? 2 : 1;
  s.social.arena.wins = opponent;
  return dispatch(dispatch(s, { id: "scout", type: "arenaScout" }), {
    id: "enter",
    type: "arenaStart",
  });
}
export function winningRoutes(start: State) {
  if (!start.social.arena.duel)
    throw new Error("Fixture failed to enter arena");
  const opponent = start.social.arena.wins;
  const wins: { moves: Stance[]; hp: number; herbs: number }[] = [];
  function visit(s: State, moves: Stance[]) {
    if (!s.social.arena.duel) {
      if (s.social.arena.wins > opponent) {
        const log = s.social.arena.last;
        wins.push({
          moves,
          herbs: start.herbs - s.herbs,
          hp:
            start.social.arena.duel!.hp -
            [...log.matchAll(/自身气势 −(\d+)/g)].reduce(
              (sum, m) => sum + Number(m[1]),
              0,
            ) +
            [...log.matchAll(/调息 \+(\d+)/g)].reduce(
              (sum, m) => sum + Number(m[1]),
              0,
            ),
        });
      }
      return;
    }
    if (moves.length >= 6) throw new Error("Duel did not settle");
    for (const stance of ["break", "endure", "discern"] as const)
      visit(
        dispatch(s, { id: `turn-${moves.length}`, type: "arenaTurn", stance }),
        [...moves, stance],
      );
  }
  visit(start, []);
  return wins;
}
export function growthBalance() {
  const rows = [];
  for (const seed of [1, 42, 9087])
    for (const gear of ["sword", "vial"] as const)
      for (const support of ["herb", "lantern"] as const)
        for (const tier of ["low", "normal", "full", "dry"] as const)
          for (const main of ["spring", "blade", "breath"] as const)
            for (const opponent of [0, 1, 2]) {
              const wins = winningRoutes(
                arenaFixture(main, seed, gear, support, tier, opponent),
              );
              const sorted = [...wins].sort(
                (a, b) =>
                  a.moves.length - b.moves.length ||
                  a.herbs - b.herbs ||
                  b.hp - a.hp,
              );
              rows.push({
                seed,
                gear,
                support,
                tier,
                main,
                opponent,
                wins: wins.length,
                fastest: sorted[0] ?? null,
                constantWins: (["break", "endure", "discern"] as const).filter(
                  (m) => wins.some((w) => w.moves.every((x) => x === m)),
                ),
              });
            }
  return rows;
}
if (process.argv.includes("--run"))
  console.log(JSON.stringify(growthBalance(), null, 2));
