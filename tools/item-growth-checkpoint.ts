import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
import { validState } from "../src/core";
/** Isolated UI checkpoint, built with existing public-command journey policies.
 * Loading this fixture is not evidence of a normal new-player continuous playthrough.
 */
export function itemGrowthCheckpoint() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  if (!validState(p.state)) throw new Error("Invalid item growth checkpoint");
  return p.state;
}

/** Follow the earned ring/material route to a safe forge, without editing state fields. */
export function itemGrowthForgeCheckpoint() {
  const p = journeyPlayer(itemGrowthCheckpoint());
  p.send({ type: "itemGrowth", action: { kind: "inspect" } });
  p.send({
    type: "itemGrowth",
    action: { kind: "enter", preparation: "sense" },
  });
  for (const move of ["observe", "brace", "reach"] as const)
    p.send({ type: "itemGrowth", action: { kind: "move", move } });
  p.send({ type: "itemGrowth", action: { kind: "collect", method: "carry" } });
  p.fight("exit");
  p.act({ kind: "travel", destination: "home" });
  while (p.state.stones < 60)
    p.send({ type: "advance", activity: "work", months: 3 });
  if (p.state.journey.relics.vial === 1)
    p.send({
      type: "workshop",
      order: { product: "vial", method: "commission" },
    });
  p.send({ type: "workshop", order: { product: "iron", method: "buy" } });
  if (
    p.state.itemGrowth.ring !== 1 ||
    p.state.itemGrowth.ore !== 1 ||
    p.state.journey.relics.vial !== 2
  )
    throw new Error("Forge preparation did not complete");
  return p.state;
}
