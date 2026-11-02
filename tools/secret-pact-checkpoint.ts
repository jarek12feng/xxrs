import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
/** Developer-only public-command fixture. No player storage or fabricated history. */
export function secretPactCheckpoint(inside = true) {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.send({ type: "secretPact", action: "promise" });
  if (!inside) return p.state;
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.fight("application");
  p.cultivate(200);
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.act({ kind: "travel", destination: "frontier" });
  while (p.state.stones < 100)
    p.send({ type: "advance", activity: "work", months: 12 });
  while (p.state.herbs < 30) p.send({ type: "supplies" });
  p.act({ kind: "routePrepare", route: "frontier", method: "service" });
  p.act({ kind: "routeChoose", route: "frontier", choice: "careful" });
  p.fight("frontier");
  p.send({ type: "secretPact", action: "enterAnchor" });
  return p.state;
}
