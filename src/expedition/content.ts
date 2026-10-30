export const moves = {
  guard: "守势化劲",
  strike: "破绽反击",
  discern: "凝神辨影",
} as const;
export type Move = keyof typeof moves;
export const encounters = [
  {
    realm: 0,
    stage: 0,
    name: "山道护送",
    foe: "劫药客",
    hp: 34,
    attack: 8,
    cost: 2,
    reward: 4,
    pattern: ["guard", "strike", "discern"] as Move[],
    tells: [
      "长刀高举，重击将落——守势化劲。",
      "挥刀落空，胸前门户大开——破绽反击。",
      "脚步分作两道残影——凝神辨影。",
    ],
    story:
      "郁青扶住倾斜的药箱。蒙面人却越过灵石，直取箱底那页旧账。你挡在车前，听见他低声说：“名单不能进山。”",
  },
  {
    realm: 0,
    stage: 0,
    name: "古阵寻踪",
    foe: "逆流阵眼",
    hp: 0,
    attack: 0,
    cost: 2,
    reward: 6,
    pattern: [] as Move[],
    tells: [],
    story:
      "阵眼下压着一枚旧药签，笔迹与账册中的失踪者相同。郁青握紧了图夹：“这是我姐姐的字。她失踪前，让我别再跟着药队。”他终于说出了执意同行的理由。",
  },
  {
    realm: 1,
    stage: 0,
    name: "守阵交锋",
    foe: "蚀阵傀儡",
    hp: 64,
    attack: 12,
    cost: 4,
    reward: 12,
    pattern: ["discern", "guard", "strike", "guard"] as Move[],
    tells: [
      "假身先动，真身藏在阵纹里。",
      "双臂聚起石屑，准备重砸。",
      "阵核露出，灵光暂熄。",
      "地面震动，第二记重砸将至。",
    ],
    story:
      "青嶂没有拦你。他指向吞噬草根的石偶：“有人把守路之物改成了杀人之物。”郁青护住药签退到阵外，等你斩断傀儡与旧阵的联系。",
  },
] as const;
