/** Public-command earned first-seal checkpoint; isolated verification, not human pacing evidence. */
import {
  outerSeaCheckpoint,
  seaPlayer,
  observeTide,
} from "./outer-sea-checkpoint";
import { seaFoe } from "../src/outer-sea/rules";
export function sealPreparationCheckpoint() {
  const p = seaPlayer(outerSeaCheckpoint());
  p.work(40);
  p.herbs(16);
  p.send({ type: "outerSea", action: { kind: "sail" } });
  p.send({ type: "outerSea", action: { kind: "meet" } });
  observeTide(p.send);
  p.send({ type: "outerSea", action: { kind: "pact", pact: "share" } });
  p.send({ type: "outerSea", action: { kind: "prepare" } });
  p.send({ type: "outerSea", action: { kind: "enter" } });
  p.send({ type: "outerSea", action: { kind: "fight" } });
  for (let n = 0; p.state.outerSea.duel; n++) {
    if (n > 18) throw Error("Seal route battle stalled");
    const d = p.state.outerSea.duel;
    p.send({
      type: "outerSea",
      action: { kind: "move", move: seaFoe(d.depth).pattern[d.turn % 3]! },
    });
  }
  if (p.state.outerSea.cleared !== 1) throw Error("Outer hall not won");
  p.send({ type: "outerSea", action: { kind: "reward", reward: "seal" } });
  p.work(32);
  return p.state;
}
