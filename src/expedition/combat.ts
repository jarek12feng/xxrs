import { mainTraining, supportTraining } from "../growth";
import type { State } from "../world";
import { encounters, type Move } from "./content";
export function readiness(s: State) {
  return {
    hp: Math.max(16, 36 + s.foundation - s.injury * 5),
    damage:
      5 +
      (s.realm === 1 ? 2 : 0) +
      mainTraining(s) * 2 +
      Math.floor((s.sense + s.study * 2 + s.mastery + s.foundation) / 4) +
      (s.journey.equipped === "sword" ? s.journey.relics.sword * 2 : 0),
    armor:
      (s.realm === 1 ? 2 : 0) +
      (s.journey.support === "guard" ? 2 : 0) +
      supportTraining(s) +
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
export interface CombatEncounter {
  hp: number;
  attack: number;
  pattern: readonly Move[];
}
export function exchangePreview(s: State, move: Move) {
  const q = s.expedition;
  if (!q.duel) return null;
  return tacticalExchange(
    s,
    move,
    encounters[q.cleared]!,
    q.duel,
    q.effect,
    q.cleared === 2,
  );
}
export function tacticalExchange(
  s: State,
  move: Move,
  e: CombatEncounter,
  d: { hp: number; enemy: number; turn: number },
  effect: string,
  arrayCore = false,
  power = readiness(s),
) {
  if (!["guard", "strike", "discern"].includes(move)) return null;
  const correct = move === e.pattern[d.turn % e.pattern.length];
  let damage =
      power.damage +
      (correct ? 6 : 0) +
      (s.journey.support === "lantern" && move === "discern" ? 3 : 0),
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
    damage += arrayCore ? 7 : 2;
    incoming -= 2;
    note = arrayCore
      ? "归元息照见阵核，伤害 +7、承伤 −2。"
      : "归元息辨清身形，伤害 +2、承伤 −2。";
  }
  if (arrayCore) {
    // A closed core resists blind attacks; scouting or the exposed turn opens it.
    if (
      move === "strike" &&
      d.turn % e.pattern.length !== 2 &&
      effect !== "discern" &&
      effect !== "guard"
    ) {
      damage = Math.max(1, damage - 8);
      incoming += 4;
      note += "阵核闭合，抢攻伤害 −8、反震 +4；先辨影或等阵核露出。";
    }

    if (d.enemy <= e.hp / 2) {
      incoming += 2;
      note += "阵核暴露，阵势转急，承伤 +2。";
    }
    if (effect === "guard" && move === "strike") {
      damage += 10;
      note += "借上合稳守蓄势，反击伤害 +10。";
    }
    if (effect === "discern") {
      damage += 6;
      incoming -= 2;
      note += "沿上合辨出的阵路，伤害 +6、承伤 −2。";
    }
    if (move === "guard") {
      damage = Math.max(1, damage - 4);
      incoming -= 4;
      note += "稳守：伤害 −4、承伤 −4；下合反击 +10。";
    }
    if (move === "discern") {
      damage = Math.max(1, damage - 3);
      note += "探阵：本合伤害 −3；下合伤害 +6、承伤 −2。";
    }
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
  if (s.expedition.duel) {
    const p = exchangePreview(s, move)!;
    return (
      `伤敌 ${p.damage} / 承伤 ${p.incoming}${p.healing ? ` / 耗草 ${p.herbs} 回 ${p.healing}` : ""}；` +
      (s.expedition.cleared === 2
        ? move === "guard"
          ? "蓄势，下合反击 +10"
          : move === "discern"
            ? "探阵，下合增伤减伤"
            : "立即抢攻"
        : p.note || (p.correct ? "看准来招，应对得当" : "未破来招，权衡攻守"))
    );
  }
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
