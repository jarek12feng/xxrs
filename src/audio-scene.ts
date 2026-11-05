import { roadScenes } from "./road";
import { mistScenes } from "./mist";
import { combatOwner } from "./scene-activity";
import type { StoryChapter } from "./scene2d/story-routing";
import { deathView } from "./mortality";
import type { State } from "./core";
import { sceneMusic, type MusicCue } from "./local-music";
import type { AmbientCue } from "./foundation-audio";
// Reflect the visible panel; a stored expedition location must not color every screen.
export function foundationAudioScene(
  s: State | null | undefined,
  panel: string,
): { music: MusicCue; ambient: AmbientCue } | null {
  if (!s || s.realm !== 1) return null;
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
  chapter?: StoryChapter,
): { music: MusicCue; ambient: AmbientCue | null } {
  if (s?.status === "dead") return { music: deathView(s).music, ambient: null };
  if (s?.status === "alive") {
    const owner = combatOwner(s);
    if (owner === "foundation" && s.foundationJourney.duel)
      return (
        foundationAudioScene(s, panel) ?? { music: "trial", ambient: null }
      );
    if (owner) return { music: "trial", ambient: null };
    if (s.ascension) return { music: "mystery", ambient: null };
    // The chapter is reported by the rendered scene, including local tab changes.
    if (chapter) {
      if (s.wayfaring.trip || s.wayfaring.passage)
        return { music: "journey", ambient: null };
      const auction = s.treasures.auction;
      if (auction?.entered && !auction.closed)
        return {
          music: "journey",
          ambient: "wind-chimes",
        };
      if (chapter === "sea") {
        if (s.outerSea.location === "home")
          return {
            music: "vista",
            ambient: "wind-chimes",
          };
        if (s.outerSea.location === "ruins")
          return {
            music: "sunken",
            ambient: "waterside",
          };
        const reunion = s.goldenStory.reunion.stage;
        const music: MusicCue = [
          "met",
          "planned",
          "anchored",
          "resolved",
          "shared",
        ].includes(reunion)
          ? "survey"
          : s.goldenStory.practice
            ? "lamps"
            : "journey";
        return { music, ambient: "waterside" };
      }
      if (chapter === "conclave")
        return {
          music: s.conclave.location === "vault" ? "sunken" : "journey",
          ambient: "waterside",
        };
      if (chapter === "lizhao")
        return {
          music: ["outer", "inner", "bay"].includes(s.lizhao.location)
            ? "mystery"
            : s.lizhao.location === "chamber"
              ? "lamps"
              : "journey",
          ambient: "waterside",
        };
      if (chapter === "nascent")
        return {
          music:
            s.realm === 3
              ? "vista"
              : s.nascentSoul.ceremony === "witnessed" ||
                  s.nascentSoul.ceremony === "married"
                ? "return"
                : "lamps",
          ambient: "wind-chimes",
        };
      if (chapter === "golden")
        return {
          music: s.goldenCore.expedition === "path" ? "mystery" : "vista",
          ambient: "wind-chimes",
        };
      if (chapter === "contest")
        return {
          music: "journey",
          ambient: "wind-chimes",
        };
      if (chapter === "foundation")
        return (
          foundationAudioScene(s, "world") ?? {
            music: "vista",
            ambient: "wind-chimes",
          }
        );
      if (chapter === "qi")
        return {
          music: s.qiJourney.node ? "mystery" : "journey",
          ambient: null,
        };
      if (chapter === "road")
        return {
          music: sceneMusic(roadScenes[s.adventure.road.stage].name),
          ambient: null,
        };
      if (chapter === "mist")
        return {
          music: sceneMusic(
            mistScenes[s.adventure.mist.stage].title,
            s.adventure.mist.revisited,
          ),
          ambient: null,
        };
      if (["admission", "practice", "rewards"].includes(chapter))
        return {
          music: "home",
          ambient: "wind-chimes",
        };
      // Revisiting a qi chapter must not inherit the player's higher-realm score.
      return {
        music: sceneMusic(name, s.adventure.mist.revisited),
        ambient: null,
      };
    }
    const foundation = foundationAudioScene(s, panel);
    if (foundation) return foundation;
    if (s.realm >= 2)
      return {
        music: "vista",
        ambient: "wind-chimes",
      };
    if (s.qiJourney.node > 0) return { music: "mystery", ambient: null };
  }
  return {
    music: sceneMusic(name, s?.adventure.mist.revisited ?? false),
    ambient: null,
  };
}
