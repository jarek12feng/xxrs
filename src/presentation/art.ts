// Presentation-only IDs. Never persist URLs or derive game rules from artwork.
export type CharacterId =
  | "hero-male"
  | "hero-male-qi"
  | "hero-female"
  | "luchi"
  | "yuqing"
  | "qingzhang"
  | "raider"
  | "golem"
  | "gongyan"
  | "peizhufeng"
  | "qiuxingluo";
export type Pose = "idle" | "meditate" | "attack" | "guard" | "hurt";
const poses: Record<CharacterId, readonly Pose[]> = {
  "hero-male": ["idle", "meditate", "attack", "guard", "hurt"],
  "hero-male-qi": ["idle", "meditate", "attack", "guard", "hurt"],
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
export function heroArt(gender?: string | null, realm = 0): CharacterId {
  return gender === "female"
    ? "hero-female"
    : realm >= 1
      ? "hero-male"
      : "hero-male-qi";
}
// Read only settled combat effects; never infer a hit from an enemy telegraph.
export function heroBattlePose(effect?: string | null): Pose {
  if (effect === "strike") return "attack";
  if (effect === "guard" || effect === "discern") return "guard";
  if (effect === "hurt" || effect === "loss") return "hurt";
  return "idle";
}
export function characterArt(id: CharacterId, pose: Pose = "idle") {
  const supported = poses[id].includes(pose) ? pose : "idle";
  if (id === "hero-male-qi") return `/art/hero-male/qi-${supported}.webp`;
  if (id === "hero-male" && (supported === "guard" || supported === "hurt"))
    return `/art/hero-male/foundation-${supported}.webp`;
  return `/art/characters/${id}${supported === "idle" ? "" : `-${supported}`}.webp`;
}
/** Reviewed source directions: standing/guard look left, qi strike/hurt look right.
 * Mirror the image only, so labels and combat motion retain their own coordinates. */
export function characterFlip(id: CharacterId, pose: Pose = "idle", facing?: number): number {
  if (facing === undefined || (id !== "hero-male" && id !== "hero-male-qi")) return 1;
  if (pose === "meditate") return 1;
  const native = pose === "attack" || (id === "hero-male-qi" && pose === "hurt") ? 1 : -1;
  return (facing < 0 ? -1 : 1) * native;
}
/** Shared visual projection for DOM and Phaser; never mirror the actor's labels. */
export function actorAppearance(id: CharacterId, pose: Pose, facing?: number, walking = false) {
  return { src: characterArt(id, pose), flipX: walking ? (facing ?? 1) < 0 : characterFlip(id, pose, facing) < 0 };
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
/** Reviewed scene cutouts only. Portraits and illustrated cards must stay in portrait frames. */
export const sceneSpeakerArt: Readonly<Record<string,string>> = {
  岑霁: "/art/scene-people/cen-ji-standing-v1.webp",
  卢雁回: "/art/scene-people/lu-yanhui-standing-v1.webp",
  温蘅: '/art/characters/wenheng.webp',
  陆迟: characterArt('luchi'), 郁青: characterArt('yuqing'), 青嶂: characterArt('qingzhang'),
  阙明棠: '/art/foundation-journey/qu-heir.webp', 郁晚舟: '/art/foundation-journey/healer-sister.webp',
  程砚: '/art/foundation-journey/frontier-mentor.webp', 陶泊: '/art/foundation-journey/frontier-boatman.webp',
  苏婉宁: '/art/companionship/shentinglan-travel.webp',
  尹照川: '/art/companionship/yinzhaochuan-travel.webp',
  许照岚: '/art/scene-people/xu-zhaolan-standing-v1.webp', 裴铸: '/art/scene-people/pei-zhu-standing-v1.webp',
  顾沧遥: '/art/conclave/gu-cangyao-v1.webp', 叶问苓: '/art/conclave/ye-wenling-v1.webp',
  沈观微: '/art/review-fixes/shen-guanwei-teaching-v1.webp',
  韩砺舟: '/art/review-fixes/han-lizhou.webp', 拍卖管事: '/art/characters/market-steward.webp',
};
const items: Readonly<Record<string, string>> = {
  stones: "spirit-stone",
  herbs: "herbs",
  pills: "foundation-pill",
  healing: "healing-powder",
  clarity: "clarity-pill",
  spirit: "clarity-pill",
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
  if (id === "tideSeal") return "/art/outer-sea/seal.webp";
  if(id==="tideBlade"||id==="tide-embryo")return `/art/golden-artifact/${id==="tideBlade"?"tide-blade":"tide-embryo"}.webp`;
  if (["relic-ring", "reforged-sword", "reforged-vial"].includes(id)) return `/art/item-growth/${id}.webp`;
  if (["bell", "mirror", "cord", "seal"].includes(id)) return `/art/treasures/${id}.webp`;
  if (id === "ward" || id === "iron")
    return `/art/workshop/${id === "ward" ? "meridian-pill" : "spirit-iron"}.webp`;
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
  养神丹: "spirit",
};
