import type { State } from "../world";
export function combatStyle(s: State) {
  if (s.conclave?.method === "still")
    return {
      name: "抱元守神法",
      description: "护体 +6，原主修招式与澄息攻守加成暂停；可在安全处改回。",
    };
  if (s.outerSea?.method === "clear")
    return {
      name: "澄息篇 · 守中",
      description:
        "护体 +4，原主修招式暂不触发；既有功法与研修保留，可在安全处改回。",
    };
  if (s.journey.main === "blade")
    return {
      name: "听松剑经 · 抢攻",
      description:
        "反击额外伤害 +8；若敌人未倒，本回合承伤 +2。可冒险抢攻，但无法替代所有防御。",
    };
  if (s.journey.main === "spring")
    return {
      name: "长春诀 · 守中回春",
      description:
        "守势伤害 −2；受击后仍存活时，消耗灵草 1 恢复最多 7 气势。无草则正常守势；击倒敌人不耗草，不可起死回生。",
    };
  if (s.journey.main === "breath")
    return {
      name: "归元息 · 辨影破核",
      description:
        "辨影伤害 +2、承伤 −2；对蚀阵傀儡的阵核额外伤害改为 +7。仍需权衡重击与破绽。",
    };
  return {
    name: "基础应对",
    description:
      "正确应对增加伤害并减少受击。可在功法面板装配听松剑经、长春诀或归元息，改变打法；交锋中不能换功法。",
  };
}
