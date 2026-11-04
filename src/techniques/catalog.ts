export const techniques = {
  spring: {
    name: "长春诀",
    slot: "main",
    hint: "学会后可采药；炼气吐纳基础收益 +3（受寿元影响）；回合交锋守势可耗灵草恢复气势",
  },
  blade: {
    name: "听松剑经",
    slot: "main",
    hint: "学会后可历练剑意；炼气历练每月额外 +4 修为；回合交锋反击伤害 +8、承伤 +2",
  },
  breath: {
    name: "归元息",
    slot: "main",
    hint: "炼气劳作每月额外 +4 修为；回合交锋辨影减伤，擅破傀儡阵核",
  },
  herb: {
    name: "辨草录",
    slot: "support",
    hint: "学会后可采药；装配后采药每月额外 +1 灵草",
  },
  guard: {
    name: "护身诀",
    slot: "support",
    hint: "历练不新增伤势；回合交锋护体 +2，每阶研修再 +1",
  },
  lantern: {
    name: "照夜篇",
    slot: "support",
    hint: "雾海识阵把握 +8，每阶研修再 +2；交锋辨影伤害 +3；凝神同时得心得 1（上限 4）",
  },
} as const;
export type Technique = keyof typeof techniques;

export const techniqueIds = Object.keys(techniques) as Technique[];
