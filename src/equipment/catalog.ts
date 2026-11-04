export type Relic = "vial" | "sword";
export const relics = {
  vial: {
    name: "归元灵瓶",
    hint: "回合交锋一阶减伤 1、二阶减伤 3；二阶器物辅助筑基吐纳；雾海回声阵每阶 +6、风阵 +3 把握；道友寻亲应对妖修额外 +8%，失败少受 1 层伤势",
  },
  sword: {
    name: "听松灵剑",
    hint: "回合交锋一阶伤害 +2、二阶伤害 +5；二阶器物辅助筑基吐纳；雾海风阵每阶 +6、回声阵 +3 把握；道友寻亲应对邪修额外 +8%",
  },
};
export const treasures = {
  bell: {
    name: "镇岳钟",
    realm: 0,
    price: 28,
    hint: "守势承伤 −2；反击伤害 −1。精炼后守势承伤 −3。",
    quality: "中品灵器",
  },
  cord: {
    name: "缚风索",
    realm: 0,
    price: 28,
    hint: "反击承伤 −2、伤害 −1。精炼后反击承伤 −3。",
    quality: "中品灵器",
  },
  mirror: {
    name: "照隙镜",
    realm: 1,
    price: 42,
    hint: "正确辨影伤害 +2；精炼后 +3。辨错不生效。",
    quality: "上品灵器",
  },
} as const;
export type Treasure = keyof typeof treasures;
export const treasureIds = Object.keys(treasures) as Treasure[];
export const tempers = {
  sword: {
    plain: { name: "原纹", hint: "保留原有攻守，无额外修正。" },
    keen: { name: "锐锋纹", hint: "反击伤害 +3、承伤 +1；其他招式不变。" },
    array: { name: "照隙纹", hint: "正确辨影伤害 +4；反击伤害 −1。" },
  },
  vial: {
    plain: { name: "原纹", hint: "保留原有攻守，无额外修正。" },
    shell: { name: "镇守纹", hint: "守势承伤 −3、伤害 −1；其他招式不变。" },
    flow: { name: "流转纹", hint: "正确辨影承伤 −2、伤害 +1；反击承伤 +1。" },
  },
} as const;
export type Temper = "plain" | "keen" | "array" | "shell" | "flow";

export const equipmentCatalog = {
  sword: {
    ...relics.sword,
    shape: "sword",
    categories: ["attack"],
    tier: "spirit",
    slot: "primary",
    maxRank: 2,
    realm: 0,
    qi: 0,
    damage: [0, 2, 5],
    armor: [0, 0, 0],
  },
  vial: {
    ...relics.vial,
    shape: "vial",
    categories: ["defense"],
    tier: "spirit",
    slot: "primary",
    maxRank: 2,
    realm: 0,
    qi: 0,
    damage: [0, 0, 0],
    armor: [0, 1, 3],
  },
  bell: {
    ...treasures.bell,
    shape: "bell",
    categories: ["defense"],
    tier: "spirit",
    slot: "auxiliary",
    maxRank: 2,
    qi: 120,
  },
  cord: {
    ...treasures.cord,
    shape: "cord",
    categories: ["defense"],
    tier: "spirit",
    slot: "auxiliary",
    maxRank: 2,
    qi: 120,
  },
  mirror: {
    ...treasures.mirror,
    shape: "mirror",
    categories: ["attack"],
    tier: "spirit",
    slot: "auxiliary",
    maxRank: 2,
    qi: 120,
  },
  tideSeal: {
    name: "镇潮印",
    shape: "seal",
    categories: ["attack", "defense"],
    tier: "artifact",
    slot: "attuned",
    damage: 4,
    armor: 3,
  },
  spiritPearl: {
    name: "定神珠",
    shape: "pearl",
    categories: ["defense"],
    tier: "artifact",
    slot: "attuned",
    damage: 0,
    armor: 5,
  },
} as const;
export type EquipmentId = keyof typeof equipmentCatalog;
export type EquipableId = Relic | Treasure;
export const getEquipment = <T extends EquipmentId>(id: T) => equipmentCatalog[id];

export interface TurnRule {
  move: "strike" | "guard" | "discern";
  correct?: boolean;
  damage?: readonly number[];
  incoming?: readonly number[];
}
export const temperRules: Record<Temper, readonly TurnRule[]> = {
  plain: [],
  keen: [{ move: "strike", damage: [0, 3, 3], incoming: [0, 1, 1] }],
  array: [
    { move: "discern", correct: true, damage: [0, 4, 4] },
    { move: "strike", damage: [0, -1, -1] },
  ],
  shell: [{ move: "guard", damage: [0, -1, -1], incoming: [0, -3, -3] }],
  flow: [
    {
      move: "discern",
      correct: true,
      damage: [0, 1, 1],
      incoming: [0, -2, -2],
    },
    { move: "strike", incoming: [0, 1, 1] },
  ],
};
export const auxiliaryRules: Record<Treasure, readonly TurnRule[]> = {
  bell: [
    { move: "guard", incoming: [0, -2, -3] },
    { move: "strike", damage: [0, -1, -1] },
  ],
  cord: [{ move: "strike", damage: [0, -1, -1], incoming: [0, -2, -3] }],
  mirror: [{ move: "discern", correct: true, damage: [0, 2, 3] }],
};

export const equipmentCategories = {
  attack: "攻击",
  defense: "防御",
  speed: "速度",
} as const;
export type EquipmentCategory = keyof typeof equipmentCategories;
export function listEquipment(category?: EquipmentCategory): EquipmentId[] {
  return (Object.keys(equipmentCatalog) as EquipmentId[]).filter(
    (id) =>
      !category ||
      (
        equipmentCatalog[id].categories as readonly EquipmentCategory[]
      ).includes(category),
  );
}
export function equipmentCategoryLabel(id: EquipmentId) {
  return equipmentCatalog[id].categories
    .map((category) => equipmentCategories[category])
    .join(" / ");
}
