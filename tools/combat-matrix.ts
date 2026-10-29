import { createGame, dispatch, type State, type Stance } from "../src/core";
export function arenaMatrix() {
  const rows = [];
  for (const tier of ["low", "normal", "full", "no-grass"] as const)
    for (const main of ["spring", "blade", "breath"] as const)
      for (let opponent = 0; opponent < 3; opponent++) {
        const s = createGame("matrix", "wood", 42, "perceptive");
        Object.assign(s, {
          month: 48,
          age: 240,
          realm: 1,
          foundation: tier === "full" ? 24 : tier === "low" ? 0 : 12,
          sense: tier === "full" ? 12 : 8,
          study: tier === "low" ? 2 : 4,
          stones: 80,
          herbs: tier === "no-grass" ? 0 : 8,
        });
        Object.assign(s.story, {
          stage: "resolved",
          choice: "gift",
          luchi: "foundation",
        });
        s.memories.letter = s.memories.visit = true;
        s.journey.settled = true;
        s.journey.known = [main, "herb"];
        s.journey.main = main;
        s.journey.support = "herb";
        s.growth.training[main] = tier === "full" ? 2 : tier === "low" ? 0 : 1;
        const gear = main === "blade" ? "sword" : "vial";
        s.journey.relics[gear] = tier === "full" ? 2 : 1;
        s.journey.equipped = gear;
        s.social.arena.wins = opponent;
        let start = dispatch(s, { id: "scout", type: "arenaScout" });
        start = dispatch(start, { id: "start", type: "arenaStart" });
        const wins: {
          sequence: Stance[];
          grass: number;
          rounds: number;
          remainingHp: number;
        }[] = [];
        function walk(state: State, seq: Stance[]) {
          if (!state.social.arena.duel) {
            if (state.social.arena.wins > opponent)
              wins.push({
                sequence: seq,
                grass: start.herbs - state.herbs,
                rounds: seq.length,
                remainingHp:
                  start.social.arena.duel!.hp -
                  [
                    ...state.social.arena.last.matchAll(/自身气势 −(\d+)/g),
                  ].reduce((n, m) => n + Number(m[1]), 0) +
                  [...state.social.arena.last.matchAll(/调息 \+(\d+)/g)].reduce(
                    (n, m) => n + Number(m[1]),
                    0,
                  ),
              });
            return;
          }
          for (const stance of ["break", "endure", "discern"] as Stance[])
            walk(
              dispatch(state, {
                id: `turn-${seq.length}`,
                type: "arenaTurn",
                stance,
              }),
              [...seq, stance],
            );
        }
        walk(start, []);
        const examples = [...wins].sort(
          (a, b) => a.rounds - b.rounds || a.grass - b.grass,
        );
        rows.push({
          tier,
          main,
          opponent,
          winningSequences: wins.length,
          fastest: examples[0] ?? null,
          leastGrass:
            [...wins].sort(
              (a, b) => a.grass - b.grass || a.rounds - b.rounds,
            )[0] ?? null,
          safest:
            [...wins].sort(
              (a, b) => b.remainingHp - a.remainingHp || a.grass - b.grass,
            )[0] ?? null,
          constantWins: (["break", "endure", "discern"] as Stance[]).filter(
            (a) => wins.some((w) => w.sequence.every((b) => a === b)),
          ),
        });
      }
  return rows;
}
if (process.argv.includes("--run"))
  console.log(JSON.stringify(arenaMatrix(), null, 2));
