import type { GoldenAction } from "../golden-core/rules";
import type { SeaAction } from "../outer-sea/rules";
import type { ConclaveAction } from "../conclave/rules";
/** Presentation-only exhaustive routing. New domain actions must choose a scene object. */
const golden: Record<GoldenAction["kind"], string> = {
  prepare: "path",
  route: "path",
  fight: "path",
  take: "path",
  farShore: "path",
  brew: "furnace",
  champion: "elder",
  guard: "elder",
  withdraw: "exit",
  site: "chamber",
  break: "chamber",
  move: "path",
};
const sea: Record<SeaAction["kind"], string> = {
  meet: "friends",
  pact: "friends",
  report: "friends",
  reward: "treasure",
  attune: "treasure",
  method: "treasure",
  prepare: "path",
  enter: "path",
  fight: "path",
  sail: "path",
  move: "path",
  home: "exit",
  return: "exit",
  withdraw: "exit",
};
const conclave: Record<ConclaveAction["kind"], string> = {
  meet: "friends",
  route: "friends",
  training: "friends",
  contest: "arena",
  fight: "arena",
  move: "arena",
  prepare: "path",
  enter: "path",
  attune: "treasure",
  method: "treasure",
  leave: "exit",
  withdraw: "exit",
  visit: "letter",
  wait: "chamber",
  mid: "chamber",
  late: "chamber",
};
export const goldenObject = (kind: GoldenAction["kind"]) => golden[kind];
export const seaObject = (kind: SeaAction["kind"]) => sea[kind];
export const conclaveObject = (kind: ConclaveAction["kind"]) => conclave[kind];
