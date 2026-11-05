/** Public-command route from the existing journey checkpoint through late Golden. Not browser evidence. */
import {
  outerSeaCheckpoint,
  seaPlayer,
  observeTide,
} from "./outer-sea-checkpoint";
import { chooseConclaveMove } from "./conclave-checkpoint";
import { seaFoe, seaQuote, type SeaAction } from "../src/outer-sea/rules";
import { conclaveQuote, type ConclaveAction } from "../src/conclave/rules";
import type { State } from "../src/core";
export function lizhaoCheckpoint(
  main: "spring" | "blade" | "breath" = "spring",
  stopAt: "late" | "inner-sea" = "late",
): State {
  const p = seaPlayer(outerSeaCheckpoint(main));
  const sea = (action: SeaAction) => p.send({ type: "outerSea", action });
  const act = (action: ConclaveAction) => p.send({ type: "conclave", action });
  const battle = (kind: "contest" | "fight") => {
    act({ kind });
    let rounds = 0;
    while (p.state.conclave.duel) {
      if (++rounds > 18) throw Error("stuck");
      act({ kind: "move", move: chooseConclaveMove(p.state) });
    }
  };
  p.herbs(20);
  p.work(40);
  sea({ kind: "sail" });
  sea({ kind: "meet" });
  observeTide(p.send);
  sea({ kind: "pact", pact: "share" });
  for (let i = 0; i < 2; i++) {
    if (i)
      while (p.state.outerSea.cultivation < 60)
        p.send({ type: "advance", activity: "cultivate", months: 12 });
    p.herbs(10);
    p.work(seaQuote(p.state, { kind: "prepare" }).stones);
    sea({ kind: "prepare" });
    sea({ kind: "enter" });
    sea({ kind: "fight" });
    while (p.state.outerSea.duel) {
      const d = p.state.outerSea.duel;
      sea({ kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! });
    }
    if (p.state.outerSea.cleared !== i + 1)
      throw Error("Outer-sea route failed");
    if (!i) {
      sea({ kind: "reward", reward: "seal" });
      sea({ kind: "report" });
      p.work(8);
      sea({ kind: "attune" });
      while (p.state.sense < 18)
        p.send({ type: "advance", activity: "meditate", months: 1 });
      p.send({
        type: "treasure",
        action: { kind: "deploy", item: "tideSeal" },
      });
    }
  }
  if (stopAt === "inner-sea") { p.work(24); p.herbs(4); return p.state; }
  sea({ kind: "method", method: "continue" });
  while (p.state.outerSea.cultivation < 299)
    p.send({ type: "advance", activity: "cultivate", months: 120 });
  p.work(18);
  act({ kind: "mid" });
  while (!p.state.outerSea.reminded)
    p.send({ type: "advance", activity: "cultivate", months: 120 });
  act({ kind: "visit" });
  act({ kind: "meet" });
  p.herbs(30);
  p.work(conclaveQuote(p.state, { kind: "training", style: "ward" }).stones);
  act({ kind: "training", style: "ward" });
  battle("contest");
  battle("contest");
  act({ kind: "route", route: "current" });
  p.work(conclaveQuote(p.state, { kind: "prepare" }).stones);
  act({ kind: "prepare" });
  act({ kind: "enter" });
  battle("fight");
  while (p.state.sense < 36)
    p.send({ type: "advance", activity: "meditate", months: 1 });
  p.work(30);
  act({ kind: "attune" });
  p.send({ type: "treasure", action: { kind: "deploy", item: "spiritPearl" } });
  p.herbs(20);
  p.work(conclaveQuote(p.state, { kind: "prepare" }).stones);
  act({ kind: "prepare" });
  act({ kind: "enter" });
  battle("fight");
  act({ kind: "method", method: "inherit" });
  while (p.state.outerSea.cultivation < 599)
    p.send({ type: "advance", activity: "cultivate", months: 120 });
  p.work(60);
  act({ kind: "late" });
  act({ kind: "leave" });
  p.herbs(40);
  p.work(180);
  return p.state;
}
