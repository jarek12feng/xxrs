import type { State } from "../world";
import { resolvePactBattle } from "../secret-pact/rules";
import { foundationCap } from "./growth-state";
import { sideTrialResult } from "./narrative";
import { victoryCultivation, challenges, rankIds } from "./content";

// Chapter consequences stay outside the reusable battle engine.
export function completeChallenge(s: State) {
  const q = s.foundationJourney,
    d = q.duel!,
    e = challenges[d.id];
  q.won.push(d.id);
  if (d.id === "pactRival") {
    q.last = "贺崇收剑退开。";
    resolvePactBattle(s, true);
    q.duel = null;
    return;
  }
  s.stones += e.prize;
  if (d.id === "steady")
    q.growth.steady =
      q.growth.steadyStudy === "medicine" ? "medicine" : "practice";
  const gain = Math.max(
    0,
    Math.min(
      d.id === "application" || d.id === "steady" ? 0 : victoryCultivation,
      foundationCap(s) - q.cultivation,
    ),
  );
  q.cultivation += gain;
  q.last = `击败${e.foe}。首胜灵石 +${e.prize}，筑基修行 +${gain}（当前上限 ${foundationCap(s)}）。`;
  if (rankIds.includes(d.id)) {
    const old = ["未入榜", "第三十", "第十五", "第八", "第三"][
      q.board.wins.length
    ];
    q.board.wins.push(d.id);
    q.board.best[d.id] = d.turn;
    const rank = ["第三十", "第十五", "第八", "第三", "魁首"][
      q.board.wins.length - 1
    ];
    s.stones += q.board.wins.length * 4;
    q.last = `听松试剑榜 · 筑基组：${old} → ${rank}。${e.foe}认下这一场，记名执事当面更换榜签。${d.turn} 合获胜，首胜灵石 +${e.prize + q.board.wins.length * 4}、筑基修行 +${gain}（当前上限 ${foundationCap(s)}）。`;
    if (q.board.wins.length === 3) {
      s.growth.medicines.healing += 2;
      q.last += "入围前八：回春散 2 瓶已入储物袋。";
    }
    if (q.board.wins.length === 5) {
      s.growth.medicines.clarity += 2;
      q.last +=
        "邱星罗收起阵盘：“这次，你赢的是完整阵步。”本届筑基魁首记入履历，清心丹 2 瓶已入袋。金丹组仍未开放。";
    }
  }
  if (rankIds.includes(d.id)) q.board.last = q.last;
  if (d.id === "well") {
    q.ferry = 2;
    q.last +=
      "筑基灵元托住了井底寒压，你第一次独力稳住整段阵路。石偶垂下手臂，身后的传承室亮了起来。你跨过曾被它封住的石阶，壁上运功痕迹触手可及。";
  }
  if (d.id === "exit") {
    q.ferry = 3;
    q.last +=
      "你将井中所学运过最后一处滞涩，执卫的枪尖被灵流荡开。祝庭伸手去按渡牌，牌上的禁光却熄了。他看向你，终于收回那张空名籍。船上的人还在等谁先迈出一步。";
  }
  if (d.id === "estate" || d.id === "snow") {
    q.sides[d.id].step = 2;
    q.last += sideTrialResult[d.id];
  }
  if (d.id === "frontier" && q.rescue === 2) {
    q.heroine.supplied = true;
    q.last +=
      "外缘石偶倒下时，一名同行者从岩缝里爬出，将另一端归绳交到你手中。你们把补给逐包送进石室，内侧敲了两下石壁，示意收到了。你松手才发现，掌心已被绳勒白；程砚叫你过来，先把那股冲进腕脉的逆流化开。";
  }
  if (d.id === "frontier" && q.rescue === 0)
    q.last += "外缘石偶停下，归元阵髓已可取用。阵路渐次亮起，通向古道深处。";
  if (d.id === "application")
    q.last += "沉井新法已能自行运转，修行上限开放至 399；积累到 200 才称中期。";
  if (d.id === "steady")
    q.last += "逆流归于平稳。稳脉已成，后续筑基交锋减伤 2、吐纳基础收益 +1。";
  if (d.id === "salamander")
    q.last +=
      "玄鳞螈沿水道退去，你采得一份养元药心；回去处理药性后才能凝练灵元。";
  if (d.id === "deer")
    q.last += "霜角鹿退上雪脊，你取出一份寒髓晶，需先消去寒性再用于灵元凝练。";
  if (d.id === "rescue") {
    q.rescue = 4;
    if (q.target === "companion") q.whereabouts = "rescued";
    q.last +=
      (q.target === "companion"
        ? s.social.gender === "male"
          ? "苏婉宁在内侧将路标连成安全带，你从外侧断开支点。最后一人踏上绳桥时，一块路标石被回流掀走。她没有追，转身沿先前留下的第二道标记绕回。你守住桥头，脚下却被回流掀动。她将备用线扣紧，拉住你的退路，才将手搭在你腕上：“图还能重画。先走。”"
          : "尹照川在内侧轮换备用节点，你按节奏截断外部回流。最后一人退出后，旧阵盘卡进了裂缝。他伸手去取，你手中的归绳猛地一紧。他看了你一眼，松开阵盘，踏上绳桥：“记下接法就够了。”"
        : "闻岑在内侧牵绳，你从外侧断开支点；一名队员在断阶前迟疑，闻岑折回接住他的手，将自己的行囊留在石上。你稳住外侧，直到陶泊的船把最后两人接走。") +
      "程砚把落脚点交回药队。伤者安顿下来后，他请你再留片刻：“接人出来靠的是大家。接下来，该看看你自己的周天了。”";
  }
  if (d.id === "culmination")
    q.last +=
      "三股乱流归于一息，长风归流已成。程砚收起护阵旗：“气息稳了，回山吧。”待修至圆满，便可回听松行前居歇脚。";
  q.duel = null;
}
