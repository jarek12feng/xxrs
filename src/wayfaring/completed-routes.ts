import type { State } from "../world";
import { additionalStoryRoute } from "./additional-story";
import { storyRoute, type StoryRoute } from "./story-routes";

/** Project a saved return, never dispatch a second command. Ordinary quoted returns
 * stay with their chapter controller; only automatic or combat returns belong here. */
export function completedStoryRoute(
  next: State,
  old: State,
): StoryRoute | null {
  if (next === old || next.status !== "alive" || next.life !== old.life)
    return null;
  let route: StoryRoute | null = null;
  if (old.social.arena.duel && !next.social.arena.duel) {
    route = additionalStoryRoute(old, { type: "arenaWithdraw" });
  } else if (
    (old.goldenCore.duel ||
      (old.goldenCore.expedition === "won" &&
        next.goldenCore.gathered > old.goldenCore.gathered)) &&
    ["path", "won"].includes(old.goldenCore.expedition) &&
    next.goldenCore.expedition === "idle" &&
    !next.goldenCore.duel
  ) {
    route = storyRoute(
      { ...old, goldenCore: { ...old.goldenCore, duel: null } },
      { type: "goldenCore", action: { kind: "withdraw" } },
    );
  } else if (
    old.outerSea.duel &&
    old.outerSea.location === "ruins" &&
    !next.outerSea.duel &&
    next.outerSea.location === "ferry"
  ) {
    route = storyRoute(
      { ...old, outerSea: { ...old.outerSea, duel: null } },
      { type: "outerSea", action: { kind: "return" } },
    );
  } else if (
    old.conclave.duel &&
    old.conclave.location === "vault" &&
    !next.conclave.duel &&
    next.conclave.location === "court"
  ) {
    route = storyRoute(
      { ...old, conclave: { ...old.conclave, duel: null } },
      { type: "conclave", action: { kind: "withdraw" } },
    );
  }
  // Geometry/mode reuse the chapter itinerary; its quoted future cost is irrelevant
  // to a completed result. No chapter state or saved reward is changed here.
  return route
    ? {
        ...route,
        months: 0,
        stones: 0,
        herbs: 0,
        error: "",
        startProgress: 0,
        note: "归途已随本次结果保存，不另扣年月或补给。",
      }
    : null;
}
