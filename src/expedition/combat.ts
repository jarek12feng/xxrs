import type { State } from "../world";
import { encounters, type Move } from "./content";
export function readiness(s: State) {
  return {
    hp: Math.max(16, 36 + s.foundation - s.injury * 5),
    damage:
      5 +
      Math.floor((s.sense + s.study * 2 + s.mastery + s.foundation) / 4) +
      (s.journey.equipped === "sword" ? s.journey.relics.sword * 2 : 0),
    armor:
      (s.journey.support === "guard" ? 2 : 0) +
      (s.journey.equipped === "vial" ? s.journey.relics.vial : 0),
  };
}
export function combatStyle(s: State) {
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
// One calculation drives settlement and tests; no UI, time or random side effects.
export function exchangePreview(s: State, move: Move) {
  const q = s.expedition,
    d = q.duel;
  if (!d || !["guard", "strike", "discern"].includes(move)) return null;
  const e = encounters[q.cleared]!,
    power = readiness(s);
  const correct = move === e.pattern[d.turn % e.pattern.length];
  let damage = power.damage + (correct ? 6 : 0),
    incoming = Math.max(1, e.attack + (correct ? -5 : 3) - power.armor),
    note = "";
  if (s.journey.main === "blade" && move === "strike") {
    damage += 8;
    incoming += 2;
    note = "剑经抢攻，伤害 +8，未击倒时承伤 +2。";
  }
  if (s.journey.main === "spring" && move === "guard" && s.herbs > 0) {
    damage = Math.max(1, damage - 2);
    note = "长春守势收敛攻势，伤害 −2。";
  }
  if (s.journey.main === "breath" && move === "discern") {
    damage += q.cleared === 2 ? 7 : 2;
    incoming -= 2;
    note =
      q.cleared === 2
        ? "归元息照见阵核，伤害 +7、承伤 −2。"
        : "归元息辨清身形，伤害 +2、承伤 −2。";
  }
  incoming = d.enemy <= damage ? 0 : Math.max(1, incoming);
  const remaining = d.hp - incoming;
  const healing =
    s.journey.main === "spring" &&
    move === "guard" &&
    s.herbs > 0 &&
    incoming > 0 &&
    remaining > 0
      ? Math.max(0, Math.min(7, power.hp - remaining))
      : 0;
  return {
    correct,
    damage,
    incoming,
    healing,
    herbs: healing > 0 ? 1 : 0,
    note,
  };
}

export function moveHint(s: State, move: Move) {
  if (s.journey.main === "blade" && move === "strike")
    return "抢攻：伤害 +8；未击倒时承伤 +2";
  if (s.journey.main === "spring" && move === "guard")
    return s.herbs > 0
      ? "回春：收势伤害 −2；存活时耗灵草 1、恢复最多 7 气势"
      : "灵草不足，本次使用普通守势，不扣材料";
  if (s.journey.main === "breath" && move === "discern")
    return s.expedition.cleared === 2
      ? "破核：伤害 +7，承伤 −2"
      : "辨影：伤害 +2，承伤 −2";
  return "";
}
