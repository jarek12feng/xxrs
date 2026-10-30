import type { State } from "../world";
import type { Move } from "../expedition/content";
import { challenges } from "./content";

// Shared by cues and settlement. Existing v17 battles finish with their original rules.
export function expectedMove(s: State): Move {
  const d = s.foundationJourney.duel!;
  const e = challenges[d.id];
  if (d.ruleset === 2 && d.id === "culmination")
    return d.enemy > (e.hp * 2) / 3
      ? "guard"
      : d.enemy > e.hp / 3
        ? "discern"
        : "strike";
  if (d.ruleset === 2 && d.id === "rank5" && d.enemy <= e.hp / 2)
    return (["strike", "guard", "discern"] as const)[d.turn % 3]!;
  return e.pattern[d.turn % e.pattern.length]!;
}
export function tacticalCue(s: State): string {
  const d = s.foundationJourney.duel;
  if (!d || d.ruleset !== 2) return "";
  switch (d.id) {
    case "exit":
      return "先辨清执卫换位，再反击，可打散前后接应。";
    case "rank2":
      return d.effect === "strike"
        ? "她已贴住你的剑路，再追同一剑会迎上回锋。"
        : "她用回锋诱你追剑；看清后再出手，能截住回身。";
    case "rank4":
      return expectedMove(s) === "strike"
        ? "这一息已尽，换气时正可截断长息。"
        : "长息不断，连守会被压住；留意她换气的一刻。";
    case "estate":
      return "引水阵会沿你上合的灵流回卷，换一种运功可避开旧渠。";
    case "snow":
      return "风雪逐合压重；先守住落脚处，下合便能借力击开门轴。";
    case "frontier":
      return "辨出岩壁支点后，下合反击可截断石偶的借力。";
    case "rescue":
      return d.effect === "guard"
        ? "归绳已经稳住，内侧亮起回讯，辨清灯讯便能同时拆掉支点。"
        : "先稳住归绳，再辨清内侧灯讯，双方才好同时发力。";
    case "rank5":
      return d.enemy <= challenges.rank5.hp / 2
        ? "邱星罗翻转阵盘，后半场阵步已变；连续沿旧招走，会被他封住。"
        : "他记着你的上一招，同招连用会被阵盘截住。";
    case "culmination":
      return d.enemy > (challenges.culmination.hp * 2) / 3
        ? "第一重：乱流压脉，先稳住自己，再借换招贯通周天。"
        : d.enemy > challenges.culmination.hp / 3
          ? "第二重：两股灵流交错，须辨清去向；换招贯流仍然有效。"
          : "最后一重：归流已通，放出所蓄之力，结束这一周天。";
    default:
      return "";
  }
}
export function tacticalAdjustment(s: State, move: Move) {
  const d = s.foundationJourney.duel!;
  let damage = 0,
    incoming = 0,
    note = "";
  if (d.ruleset !== 2) return { damage, incoming, note };
  if (move === "guard") {
    damage -= 3;
    incoming -= 5;
    note += "收势护脉：伤害 −3、承伤 −5。";
  }
  const same = d.effect === move;
  switch (d.id) {
    case "exit":
      if (d.effect === "discern" && move === "strike") {
        damage += 12;
        incoming -= 4;
        note += "看穿换位，截断接应，伤害 +12、承伤 −4。";
      }
      break;
    case "rank2":
      if (same && move === "strike") {
        incoming += 7;
        note += "追剑撞上回锋，承伤 +7。";
      }
      if (d.effect === "discern" && move === "strike") {
        damage += 8;
        note += "看清回身后截剑，伤害 +8。";
      }
      break;
    case "rank4":
      if (same && move === "guard") {
        damage -= 6;
        incoming += 3;
        note += "连守被长息压住，伤害 −6、承伤 +3。";
      }
      if (expectedMove(s) === "strike" && move === "strike") {
        damage += 12;
        incoming -= 6;
        note += "截住换气，伤害 +12、承伤 −6。";
      }
      break;
    case "estate":
      if (same) {
        damage -= 5;
        incoming += 2;
        note += "旧渠回卷，伤害 −5、承伤 +2。";
      }
      break;
    case "snow":
      incoming += Math.floor(d.turn / 3) * 2;
      if (d.turn >= 3)
        note += `积雪压重，承伤 +${Math.floor(d.turn / 3) * 2}。`;
      if (d.effect === "guard" && move === "strike") {
        damage += 6;
        note += "借稳住的落脚处破门，伤害 +6。";
      }
      break;
    case "frontier":
      if (d.effect === "discern" && move === "strike") {
        damage += 8;
        note += "截断岩壁借力，伤害 +8。";
      }
      break;
    case "rescue":
      if (d.effect === "guard" && move === "discern") {
        damage += 12;
        incoming -= 4;
        note += "归绳稳住，内外应讯，伤害 +12、承伤 −4。";
      }
      break;
    case "rank5":
    case "culmination":
      if (same) {
        damage -= 6;
        incoming += 3;
        note += "灵流截住旧招，伤害 −6、承伤 +3。";
      }
      break;
  }
  if (s.foundationJourney.condensation && d.effect !== "none" && !same) {
    damage += 5;
    incoming -= 2;
    note += "周天贯流：换招伤害 +5、承伤 −2。";
  }
  // Optional earlier choices provide finite, situational help, never a mainline key.
  const q = s.foundationJourney;
  if (q.aftermath.snow && d.id === "rescue" && d.turn === 0) {
    if (q.sides.snow.outcome === "protect") {
      incoming -= 3;
      note += "备用引绳稳住外缘，首合承伤 −3。";
    }
  }
  if (q.aftermath.snow && d.id === "rescue") {
    if (q.sides.snow.outcome === "public" && d.turn < 2 && move === "discern") {
      damage += 3;
      note += "辨痕应援，伤害 +3。";
    }
    if (
      q.sides.snow.outcome === "repair" &&
      d.effect === "guard" &&
      move === "strike"
    ) {
      damage += 3;
      note += "稳守破障，伤害 +3。";
    }
  }
  return { damage, incoming, note };
}
