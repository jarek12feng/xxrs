import type { State } from "../world";
import { encounters, type Move } from "./content";
import { tacticalPreview } from "../combat/game";
export function exchangePreview(s: State, move: Move) {
  const q = s.expedition;
  if (!q.duel) return null;
  return tacticalPreview(s, {
    move: move,
    encounter: encounters[q.cleared]!,
    battle: q.duel,
    effect: q.effect,
    arrayCore: q.cleared === 2,
  });
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
  if (
    s.conclave?.method !== "still" &&
    s.outerSea?.method !== "clear" &&
    s.journey.main === "blade" &&
    move === "strike"
  )
    return "抢攻：伤害 +8；未击倒时承伤 +2";
  if (
    s.conclave?.method !== "still" &&
    s.outerSea?.method !== "clear" &&
    s.journey.main === "spring" &&
    move === "guard"
  )
    return s.herbs > 0
      ? "回春：收势伤害 −2；存活时耗灵草 1、恢复最多 7 气势"
      : "灵草不足，本次使用普通守势，不扣材料";
  if (
    s.conclave?.method !== "still" &&
    s.outerSea?.method !== "clear" &&
    s.journey.main === "breath" &&
    move === "discern"
  )
    return s.expedition.cleared === 2
      ? "破核：伤害 +7，承伤 −2"
      : "辨影：伤害 +2，承伤 −2";
  return "";
}
