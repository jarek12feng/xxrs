// File catalog only. No game state, random draws or eager audio loading.
export const foundationMusic = {
  foundation: "筑基出关",
  survey: "尺绳过雨",
  lamps: "两岸应灯",
  sunken: "沉井灵痕",
  frontier: "长风破禁",
  parting: "各赴青山",
  return: "归来有期",
} as const;
export const foundationEffects = [
  "route-mark",
  "lamp-align",
  "ward-learn",
  "ward-test",
  "handover",
  "array-open",
  "inheritance",
  "signal-send",
  "signal-reply",
  "rescue-clear",
  "vow",
  "farewell",
  "memorial",
  "boat-step",
] as const;
export const foundationAmbience = [
  "waterside",
  "rain-shelter",
  "wind-chimes",
  "snow-wind",
] as const;
export type FoundationEffect = (typeof foundationEffects)[number];
export type AmbientCue = (typeof foundationAmbience)[number];
const files = new Set<string>([
  ...Object.keys(foundationMusic),
  ...foundationEffects,
  ...foundationAmbience,
]);
export function audioUrl(cue: string) {
  return `${import.meta.env.BASE_URL}audio/${files.has(cue) ? "foundation-v2" : "original-v1"}/${cue}.wav`;
}
