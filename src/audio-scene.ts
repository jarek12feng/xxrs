import type { State } from "./core";
import type { MusicCue } from "./local-music";
import type { AmbientCue } from "./foundation-audio";
// Reflect the visible panel; a stored expedition location must not color every screen.
export function foundationAudioScene(
  s: State | null | undefined,
  panel: string,
): { music: MusicCue; ambient: AmbientCue } | null {
  if (!s || s.realm < 1) return null;
  const q = s.foundationJourney;
  if (q.duel)
    return {
      music: "frontier",
      ambient: q.location === "snow" ? "snow-wind" : "wind-chimes",
    };
  if (panel === "relationship") {
    if (q.whereabouts === "away")
      return { music: "parting", ambient: "wind-chimes" };
    if (q.whereabouts === "returned" || q.whereabouts === "rescued")
      return { music: "return", ambient: "wind-chimes" };
    if (
      s.companionship.stage !== "unstarted" &&
      s.companionship.stage !== "done"
    )
      return s.social.gender === "male"
        ? { music: "survey", ambient: "rain-shelter" }
        : { music: "lamps", ambient: "waterside" };
  }
  if (panel === "world") {
    if (q.location === "ferry")
      return { music: "sunken", ambient: "waterside" };
    if (q.location === "snow")
      return { music: "frontier", ambient: "snow-wind" };
    if (q.location === "frontier")
      return { music: "frontier", ambient: "wind-chimes" };
    if (q.location === "inn")
      return { music: "return", ambient: "rain-shelter" };
  }
  return { music: "foundation", ambient: "wind-chimes" };
}
