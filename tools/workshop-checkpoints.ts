import { createGame, dispatch, validState, type Intent } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
export function workshopCheckpoint(kind: "qi" | "foundation" | "passage") {
  let s = createGame("炉房验收", "wood", 2718),
    serial = 0;
  const send = (c: Intent) => {
    s = dispatch(s, { ...c, id: `workshop-preview-${++serial}` });
    if (!validState(s))
      throw Error(`Invalid checkpoint after ${JSON.stringify(c)}`);
    if (serial > 700) throw Error("Checkpoint did not converge");
  };
  for (;;) {
    const c = foundationStep(s);
    if (
      kind === "foundation"
        ? s.realm && s.story.stage === "resolved" && !s.pending
        : c.type === "qiJourney" && c.action.startsWith("enter:")
    )
      break;
    send(c);
  }
  while (s.stones < 200 || s.herbs < 24 || s.pending)
    send(
      s.pending
        ? foundationStep(s)
        : {
            type: "advance",
            activity: s.stones < 200 ? "work" : "gather",
            months: 1,
          },
    );
  if (kind === "foundation") {
    if (!s.journey.relics.vial)
      send({ type: "workshop", order: { product: "vial", method: "buy" } });
    send({ type: "equipRelic", relic: "vial" });
    for (let i = 0; i < 3; i++)
      send({ type: "workshop", order: { product: "iron", method: "buy" } });
  }
  if (kind === "passage") {
    send({ type: "workshop", order: { product: "ward", method: "buy" } });
    while (s.qiJourney.node !== 2) send(foundationStep(s));
  }
  return s;
}
