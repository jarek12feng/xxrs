import { outerSeaCheckpoint, seaPlayer } from "./outer-sea-checkpoint";
import { seaFoe, type SeaAction } from "../src/outer-sea/rules";
import {
  conclaveExchange,
  type ConclaveAction,
} from "../src/conclave/rules";
export function conclaveCheckpoint(
  main: "spring" | "blade" | "breath" = "spring",
) {
  const p = seaPlayer(outerSeaCheckpoint(main));
  const sea = (action: SeaAction) => p.send({ type: "outerSea", action });
  p.work(40);
  p.herbs(16);
  sea({ kind: "sail" });
  sea({ kind: "meet" });
  sea({ kind: "pact", pact: "share" });
  for (let i = 0; i < 2; i++) {
    if (i) {
      while (p.state.outerSea.cultivation < 60)
        p.send({ type: "advance", activity: "cultivate", months: 12 });
      p.work(12);
      p.herbs(6);
    }
    sea({ kind: "prepare" });
    sea({ kind: "enter" });
    sea({ kind: "fight" });
    while (p.state.outerSea.duel) {
      const d = p.state.outerSea.duel;
      sea({ kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! });
    }
    if (p.state.outerSea.cleared !== i + 1) throw Error(`Sea lost ${main}`);
    if (!i) {
      sea({ kind: "reward", reward: "seal" });
      sea({ kind: "report" });
      p.work(8);
      sea({ kind: "attune" });
      while (p.state.sense < 18) p.send({ type: "advance", activity: "meditate", months: 1 });
      p.send({ type: "treasure", action: { kind: "deploy", item: "tideSeal" } });
    }
  }
  sea({ kind: "method", method: "continue" });
  while (p.state.outerSea.cultivation < 299)
    p.send({ type: "advance", activity: "cultivate", months: 120 });
  p.work(18);
  p.send({ type: "conclave", action: { kind: "mid" } });
  return p.state;
}
export function conclavePlayer(main: "spring" | "blade" | "breath" = "spring") {
  const p = seaPlayer(conclaveCheckpoint(main));
  const act = (action: ConclaveAction) => p.send({ type: "conclave", action });
  const battle = (kind: "contest" | "fight") => {
    act({ kind });
    const old = p.state.conclave.wins + p.state.conclave.depth;
    let turns = 0;
    while (p.state.conclave.duel) {
      if (++turns > 18) throw Error("battle stuck");
      const move = chooseConclaveMove(p.state);
      if (!conclaveExchange(p.state, move)) throw Error("preview missing");
      act({ kind: "move", move });
    }
    if (p.state.conclave.wins + p.state.conclave.depth === old)
      throw Error(
        `Lost ${main}/${kind}/${p.state.conclave.route}/${p.state.conclave.preparation}/depth${p.state.conclave.depth}: ${JSON.stringify(p.state.log.slice(0, 12))}`,
      );
  };
  const arrive = () => {
    while (!p.state.outerSea.reminded)
      p.send({ type: "advance", activity: "cultivate", months: 120 });
    act({ kind: "visit" });
    act({ kind: "meet" });
  };
  return {
    ...p,
    get state() {
      return p.state;
    },
    act,
    battle,
    arrive,
  };
}

// Test journey policy follows current quotes, not the old three-turn pattern.
export function chooseConclaveMove(s:import('../src/core').State) {
 const d=s.conclave.duel!;
 const ranked=(['guard','strike','discern'] as const).map(move=>{const q=conclaveExchange(s,move)!;return {move,score:q.damage>=d.enemy?10000:q.incoming>=d.hp?-10000:q.damage+q.healing-q.incoming*1.8};});
 return ranked.sort((a,b)=>b.score-a.score)[0]!.move;
}
