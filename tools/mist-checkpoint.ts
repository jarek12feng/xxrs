// Pure public-command checkpoint shared by tests and the local browser preview.
import {
  createGame,
  dispatch,
  validState,
  type Intent,
  type RoadAction,
  type AdventureAction,
  type Gender,
  type Path,
} from "../src/core";
export function mistCheckpoint(
  seed = 42,
  path: Path = "wood",
  gender: Gender = "male",
) {
  let s = createGame("雾海行者", path, seed, "insightful", gender),
    id = 0;
  const send = (intent: Intent) => {
    if (++id > 500) throw new Error("Checkpoint did not converge");
    s = dispatch(s, { ...intent, id: `checkpoint-${id}` });
    if (!validState(s))
      throw new Error(`Invalid checkpoint after ${JSON.stringify(intent)}`);
  };
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as AdventureAction[])
    send({ type: "adventure", action });
  for (const action of ["thanks", "market", "talk", "accept"] as RoadAction[])
    send({ type: "road", action });
  send({ type: "supplies" });
  for (const action of [
    "deliver",
    "invite",
    "pass",
    "inspect",
    "camp",
    "friend",
  ] as RoadAction[])
    send({ type: "road", action });
  while (!s.journey.settled) {
    if (s.pending)
      send({
        type: "choose",
        instanceId: s.pending.id,
        option: {
          meeting: "promise",
          letter: "listen",
          visit: "herbs",
          departure: "go",
          crossing: "detour",
          relic: "gift",
        }[s.pending.kind],
      });
    else if (s.injury) send({ type: "advance", activity: "rest", months: 3 });
    else if (s.qi >= 360) send({ type: "break", pill: s.pills > 0 });
    else
      send({
        type: "advance",
        activity: s.realm ? "work" : "cultivate",
        months: 12,
      });
  }
  while (s.injury) send({ type: "advance", activity: "rest", months: 3 });
  while (s.sense < 12)
    send({ type: "advance", activity: "meditate", months: 3 });
  while (s.study < 4) send({ type: "advance", activity: "study", months: 2 });
  while (s.stones < 100)
    send({ type: "advance", activity: "work", months: 12 });
  while (s.foundation < 24) send({ type: "prepare", kind: "retreat" });
  for (const action of [
    "pass",
    "challenge",
    "lookout",
    "survey",
  ] as RoadAction[])
    send({ type: "road", action });
  send({ type: "visit" });
  if (!s.social.scene) throw new Error("Companion meeting missing");
  send({ type: "choose", instanceId: s.social.scene.id, option: "listen" });
  if (!s.adventure.road.surveyed) throw new Error("Road not completed");
  return s;
}
