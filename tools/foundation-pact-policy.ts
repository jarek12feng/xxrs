import type { State, Intent } from "../src/core";
import type { JourneyAction } from "../src/foundation-journey/state";
/** Test/development player policy: all milestones are earned by public commands. */
export function finishPactTrial(
  p: {
    readonly state: State;
    send: (intent: Intent) => State;
    act: (action: JourneyAction) => State;
  },
  returnToOrigin = false,
) {
  const complete = () => p.state.secretPact.trial === "complete";
  const site = () => p.state.secretPact.site;
  if (complete()) return;
  const origin = p.state.foundationJourney.location;
  const pact = (action: Extract<Intent, { type: "secretPact" }>["action"]) =>
    p.send({ type: "secretPact", action });
  if (["none", "declined"].includes(p.state.secretPact.stage)) pact("promise");
  if (site() !== "zhaoxuan")
    p.send({ type: "wayfaring", action: { kind: "visit", site: "zhaoxuan" } });
  if (site() !== "zhaoxuan") throw new Error("Pact policy could not arrive");
  if (p.state.secretPact.stage === "promised") pact("enterLight");
  for (let guard = 0; guard < 16 && !complete(); guard++) {
    const pstate = p.state.secretPact;
    if (pstate.hazard)
      pact(
        (["guardFlow", "readFlow", "breakFlow"] as const)[
          pstate.hazard.progress
        ]!,
      );
    else if (pstate.trial === "division")
      pact(pstate.stage === "betrayed" ? "leave" : "yield");
    else if (["crossing", "escape", "stabilize"].includes(pstate.trial))
      pact("retryFlow");
    else throw new Error("Pact policy has no pending trial action");
  }
  if (!complete()) throw new Error("Pact policy failed to complete");
  if (returnToOrigin) {
    p.act({ kind: "travel", destination: origin });
    if (site() !== "away") throw new Error("Pact policy could not return");
  }
}
