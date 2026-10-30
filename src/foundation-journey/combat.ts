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
  q.last = `击败${e.foe}。首胜灵石 +${e.prize}，筑基修行 +${gain}（上限600），已实际入袋。`;
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
    q.last = `听松试剑榜 · 筑基组：${old} → ${rank}。${e.foe}认下这一场，记名执事当面更换榜签。${d.turn} 合获胜，首胜灵石 +${e.prize + q.board.wins.length * 4}、筑基修行 +${gain}（上限600），均已结算。`;
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
      "守卫停下，外府传承室已打开。请选择一条修行传承，寻亲不是领取条件。";
  }
  if (d.id === "exit") {
    q.ferry = 3;
    q.last +=
      "渡口执卫退开，名籍支路不再阻止出渡。传承已用于实战，如何交接由你决定。";
  }
  if (d.id === "estate" || d.id === "snow") q.sides[d.id].step = 2;
  if (d.id === "frontier")
    q.last +=
      "你救出外缘同行者，把药队备好的补给送进避险处。程砚留守落脚点，现在可以向他学习稳脉，再打开内层。";
  if (d.id === "rescue") {
    q.rescue = 4;
    if (q.target === "companion") q.whereabouts = "rescued";
    q.last +=
      (q.target === "companion"
        ? s.social.gender === "male"
          ? "沈听澜在内侧将路标连成安全带，你从外侧断开支点。她先带同行者过绳桥，再和你一起撤出。"
          : "尹照川在内侧轮换备用节点，你按节奏截断外部回流。内部同伴依次退出，他收起最后一块阵盘，与你会合。"
        : "闻岑在内侧牵绳，你从外侧断开支点；探索队按陶泊安排的船次全部撤回。") +
      "程砚把落脚点交回药队，伤者在恢复处休养。你们向援手道谢，重新核对远行约定；救人不换取支配别人生活的权利。";
  }
  q.duel = null;
}
