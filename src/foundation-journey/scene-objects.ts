import type { JourneyAction } from "./state";

/** Read-only UI routing: selecting an object never dispatches a game command. */
export function foundationActionObject(
  action: JourneyAction,
): "encounter" | "prepare" | "road" {
  if (action.kind === "travel" || action.kind === "depart") return "road";
  if (
    [
      "routePrepare",
      "routeProcess",
      "prepareTogether",
      "rankGift",
      "steadyStudy",
    ].includes(action.kind)
  )
    return "prepare";
  return "encounter";
}
