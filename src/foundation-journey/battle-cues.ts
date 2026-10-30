import type { State } from "../world";
import { moves, type Move } from "../expedition/content";
import { challenges } from "./content";
import { expectedMove, tacticalCue } from "./tactics";
import type { BattleId } from "./state";
// Match the same turn/pattern as combat. Descriptions never select a move or consume RNG.
const cues: Record<BattleId, Record<Move, string>> = {
  culmination: {
    guard: "三股乱流压向经脉，护阵旗已收起。",
    discern: "经脉渐稳，交错的灵光各有去向。",
    strike: "灵流贯通，阵心已向你敞开。",
  },
  well: {
    guard: "石偶双臂合拢，石梁般的重击正面压来。",
    strike: "石偶收回双臂，胸前阵核短暂露出。",
    discern: "石偶身上的三道阵纹轮流亮起，落点尚未定下。",
  },
  exit: {
    guard: "执卫并步压近，长兵封住两侧退路。",
    strike: "执卫换手收兵，护住胸前的架势露出空隙。",
    discern: "前排执卫只作虚刺，后排的脚步正在换位。",
  },
  estate: {
    guard: "水渠两侧阵石同时抬起，灵流迎面挤来。",
    strike: "阵石回落，连接渠口的阵枢露出水面。",
    discern: "三条水渠的灵光交替闪动，回流藏在其中。",
  },
  snow: {
    guard: "山门残阵卷起整片积雪，正向你压下。",
    strike: "积雪散开，门轴下的阵枢短暂显露。",
    discern: "雪雾遮住门影，地面阵纹却先后亮了两次。",
  },
  frontier: {
    guard: "石偶踏住裂谷两壁，双掌合推乱流。",
    strike: "石偶转身收掌，腰侧支点离开了岩壁。",
    discern: "岩壁回声交错，石偶脚下的阵纹先于拳势亮起。",
  },
  rescue: {
    guard: "内层禁制向外鼓起，一整圈乱流迎面压来。",
    strike: "乱流回缩，牵住石室的支点短暂显露。",
    discern: "两股回流先后穿过石室，远处的灯讯藏在间隙中。",
  },
  rank1: {
    guard: "罗砺沉肩提刀，厚重刀势迎面压下。",
    strike: "罗砺收刀转腕，刀背尚未护回身前。",
    discern: "罗砺刀尖虚晃，脚步却向另一侧移去。",
  },
  rank2: {
    guard: "周雁回贴地回身，剑势横封你的去路。",
    strike: "周雁回收剑换步，前一剑的余势尚未接续。",
    discern: "周雁回留下半道剑影，真正的剑尖隐在袖后。",
  },
  rank3: {
    guard: "孟照野落下阵石，三面石影向中央合拢。",
    strike: "孟照野抬手移石，阵盘一角暂时失了遮护。",
    discern: "孟照野指间两点灵光交错，脚下阵纹有明有暗。",
  },
  rank4: {
    guard: "江问荷长息不断，掌势一层接一层推近。",
    strike: "江问荷吐尽一口长息，双掌回收，正要换气。",
    discern: "江问荷掌影忽快忽慢，呼吸的节拍却未改变。",
  },
  rank5: {
    guard: "邱星罗踏定阵步，四方灵流同时向你收紧。",
    strike: "邱星罗移盘换位，前后两道阵势之间露出窄隙。",
    discern: "邱星罗拨转阵盘，明处的阵纹熄灭，脚下另有微光游走。",
  },
};
export function foundationBattleCue(s: State) {
  const d = s.foundationJourney.duel;
  if (!d) return "";
  const move = expectedMove(s);
  const teaching = d.id === "well" || d.id === "rank1";
  return (
    cues[d.id][move] +
    tacticalCue(s) +
    (d.ruleset === 2 && d.id === "culmination"
      ? "同招连用会被灵流截住，伤害 −6、承伤 +3。"
      : "") +
    (teaching
      ? `初试提示：${moves[move]}可顺势应对；也可比较下方伤害与消耗。`
      : "")
  );
}

// Prospective effects are visible before committing a move; no extra settlement or prediction.
export function foundationMoveSetup(s: State, move: Move): string {
  const d = s.foundationJourney.duel;
  if (!d) return "";
  const hints: string[] = [];
  if (challenges[d.id].array) {
    if (move === "guard") hints.push("蓄势：下合反击伤害 +10");
    if (move === "discern") hints.push("探阵：下合伤害 +6、承伤 −2");
  }
  if (d.ruleset === 2) {
    if (s.journey.main === "blade" && (move === "guard" || move === "discern"))
      hints.push("剑经循隙：下合反击另增伤 2、减伤 5");
    if (s.journey.main === "spring" && move === "guard" && d.effect !== "guard")
      hints.push("长春固护：转入守势另减伤 4，无草也生效");
    if (d.id === "exit" && move === "discern")
      hints.push("下合反击另增伤 12、减伤 4");
    if (d.id === "frontier" && move === "discern")
      hints.push("下合反击另增伤 8");
    if (d.id === "rescue" && move === "guard")
      hints.push("下合辨影另增伤 12、减伤 4");
    if (d.id === "snow" && move === "guard") hints.push("下合反击另增伤 6");
    if (d.id === "rank2" && move === "discern") hints.push("下合反击伤害 +8");
    if (s.foundationJourney.condensation)
      hints.push("下合换招可贯流：伤害 +5、承伤 −2");
  }
  return hints.join("；");
}
