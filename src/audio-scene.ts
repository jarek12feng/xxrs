import { deathView } from "./mortality";
import type { State } from "./core";
import { sceneMusic, type MusicCue } from "./local-music";
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
      ambient:
        q.location === "snow"
          ? "snow-wind"
          : q.location === "ferry"
            ? "waterside"
            : "wind-chimes",
    };
  if (
    panel === "relationship" ||
    (panel === "world" && q.location === "home")
  ) {
    if (q.whereabouts === "missing" || q.whereabouts === "shelter")
      return { music: "mystery", ambient: "wind-chimes" };
    if (q.whereabouts === "away")
      return { music: "parting", ambient: "wind-chimes" };
    if (q.whereabouts === "returned" || q.whereabouts === "rescued")
      return { music: "return", ambient: "wind-chimes" };
    if (
      panel === "relationship" &&
      s.companionship.stage !== "unstarted" &&
      s.companionship.stage !== "done"
    )
      return s.social.gender === "male"
        ? { music: "survey", ambient: "rain-shelter" }
        : { music: "lamps", ambient: "waterside" };
  }
  if (panel === "world") {
    if (q.location === "estate")
      return { music: "journey", ambient: "wind-chimes" };
    if (
      q.location === "home" &&
      q.heroine.meeting !== "none" &&
      q.heroine.map === "none"
    )
      return { music: "survey", ambient: "wind-chimes" };
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

// One priority order for every battle system. Passing null represents the title screen.
export function gameAudioScene(
  s: State | null | undefined,
  panel: string,
  name: string,
) {
  if (s?.status === "dead") return { music: deathView(s).music, ambient: null };
  if (s?.status === "alive") {
    if (s.social.arena.duel || s.expedition.duel || s.qiJourney.duel)
      return { music: "trial" as MusicCue, ambient: null };
    const foundation = foundationAudioScene(s, panel);
    if (foundation) return foundation;
    if (s.qiJourney.node > 0)
      return { music: "mystery" as MusicCue, ambient: null };
  }
  return {
    music: sceneMusic(name, s?.adventure.mist.revisited ?? false),
    ambient: null,
  };
}
