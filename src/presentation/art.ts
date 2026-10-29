// Presentation-only IDs. Never persist URLs or derive game rules from artwork.
export type CharacterId =
  | "hero-male"
  | "hero-female"
  | "luchi"
  | "yuqing"
  | "qingzhang"
  | "raider"
  | "golem"
  | "gongyan"
  | "peizhufeng"
  | "qiuxingluo";
export type Pose = "idle" | "meditate" | "attack" | "hurt";
const poses: Record<CharacterId, readonly Pose[]> = {
  "hero-male": ["idle", "meditate", "attack"],
  "hero-female": ["idle", "meditate", "attack"],
  gongyan: ["idle"],
  peizhufeng: ["idle"],
  qiuxingluo: ["idle"],
  luchi: ["idle"],
  yuqing: ["idle"],
  qingzhang: ["idle"],
  raider: ["idle", "attack", "hurt"],
  golem: ["idle", "attack", "hurt"],
};
export function heroArt(gender?: string | null): CharacterId {
  return gender === "female" ? "hero-female" : "hero-male";
}
export function characterArt(id: CharacterId, pose: Pose = "idle") {
  const supported = poses[id].includes(pose) ? pose : "idle";
  return `/art/characters/${id}${supported === "idle" ? "" : `-${supported}`}.webp`;
}
export const rivalArt: Readonly<Record<string, CharacterId>> = {
  巩砚: "gongyan",
  裴逐风: "peizhufeng",
  邱星罗: "qiuxingluo",
};
export const speakerArt: Readonly<Record<string, CharacterId>> = {
  陆迟: "luchi",
  郁青: "yuqing",
  青嶂: "qingzhang",
};
const items: Readonly<Record<string, string>> = {
  stones: "spirit-stone",
  herbs: "herbs",
  pills: "foundation-pill",
  healing: "healing-powder",
  clarity: "clarity-pill",
  sword: "sword",
  vial: "vial",
  spring: "manual-spring",
  blade: "manual-blade",
  breath: "manual-breath",
  herb: "manual-herb",
  guard: "manual-guard",
  lantern: "manual-lantern",
  map: "route-map",
  tag: "medicine-tag",
  letter: "family-letter",
  lamp: "spirit-lantern",
};
export function itemArt(id: string, tier = 0): string | undefined {
  const file = items[id];
  if (!file) return undefined;
  const refined = (id === "sword" || id === "vial") && tier === 2;
  return `/art/items/${file}${refined ? "-refined" : ""}.webp`;
}
export const rewardArt: Readonly<Record<string, string>> = {
  灵石: "stones",
  灵草: "herbs",
  筑基丹: "pills",
  回春散: "healing",
  清心丹: "clarity",
};
