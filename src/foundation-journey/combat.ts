import { sideTrialResult } from "./narrative";
import type { State } from "../world";
import { readiness, tacticalExchange } from "../expedition/combat";
import type { Move } from "../expedition/content";
import { challenges, rankIds } from "./content";
export function foundationPower(s: State) {
  const base = readiness(s),
    tier = Math.floor(s.foundationJourney.cultivation / 100);
  return {
    hp: base.hp + tier * 4,
    damage: base.damage + tier,
    armor:
      base.armor +
      Math.floor(tier / 2) +
      (s.foundationJourney.rescue >= 3 ? 2 : 0) +
      (s.foundationJourney.duel?.aid ? 2 : 0),
  };
}
export function foundationExchange(s: State, move: Move) {
  const q = s.foundationJourney,
    d = q.duel;
  if (!d) return null;
  const p = tacticalExchange(
    s,
    move,
    challenges[d.id],
    d,
    d.effect,
    challenges[d.id].array,
    foundationPower(s),
  );
  if (!p) return null;
  const trained =
    q.inheritance !== "none" &&
    s.journey.main === q.inheritance &&
    move ===
      { spring: "guard", blade: "strike", breath: "discern" }[q.inheritance];
  if (trained) {
    p.damage += 4;
    p.incoming = d.enemy <= p.damage ? 0 : Math.max(0, p.incoming - 2);
    p.note += "沉井传承生效：伤害 +4、承伤 −2。";
    p.healing =
      s.journey.main === "spring" &&
      move === "guard" &&
      s.herbs > 0 &&
      p.incoming > 0 &&
      d.hp > p.incoming
        ? Math.max(0, Math.min(7, foundationPower(s).hp - (d.hp - p.incoming)))
        : 0;
    p.herbs = p.healing ? 1 : 0;
  }
  return p;
}
export function completeChallenge(s: State) {
  const q = s.foundationJourney,
    d = q.duel!,
    e = challenges[d.id];
  q.won.push(d.id);
  s.stones += e.prize;
  const gain = Math.min(40, 600 - q.cultivation);
  q.cultivation += gain;
  q.last = `击败${e.foe}。首胜灵石 +${e.prize}，筑基修行 +${gain}（上限600）。`;
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
    q.last = `听松试剑榜 · 筑基组：${old} → ${rank}。${e.foe}认下这一场，记名执事当面更换榜签。${d.turn} 合获胜，首胜灵石 +${e.prize + q.board.wins.length * 4}、筑基修行 +${gain}（上限600）。`;
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
      "石偶垂下手臂，身后的传承室亮了起来。你跨过曾被它封住的石阶，壁上运功痕迹触手可及。";
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
  if (d.id === "frontier")
    q.last +=
      "外缘石偶倒下时，一名同行者从岩缝里爬出，将另一端归绳交到你手中。你们把补给逐包送进石室，内侧敲了两下石壁，示意收到了。你松手才发现，掌心已被绳勒白；程砚叫你过来，先把那股冲进腕脉的逆流化开。";
  if (d.id === "rescue") {
    q.rescue = 4;
    if (q.target === "companion") q.whereabouts = "rescued";
    q.last +=
      (q.target === "companion"
        ? s.social.gender === "male"
          ? "沈听澜在内侧将路标连成安全带，你从外侧断开支点。最后一人踏上绳桥时，一块路标石被回流掀走。她没有追，转身沿先前留下的第二道标记绕回。你守住桥头，直到她将手搭在你腕上：“图还能重画。先走。”"
          : "尹照川在内侧轮换备用节点，你按节奏截断外部回流。最后一人退出后，旧阵盘卡进了裂缝。他伸手去取，你手中的归绳猛地一紧。他看了你一眼，松开阵盘，踏上绳桥：“记下接法就够了。”"
        : "闻岑在内侧牵绳，你从外侧断开支点；一名队员在断阶前迟疑，闻岑折回接住他的手，将自己的行囊留在石上。你稳住外侧，直到陶泊的船把最后两人接走。") +
      "程砚把落脚点交回药队。伤者安顿下来后，他请你再留片刻：“接人出来靠的是大家。接下来，该看看你自己的周天了。”";
  }
  q.duel = null;
}
