import type { State, Intent } from "./world";
/** A conclusion is projected only after a durable command removed a live battle. */
export function battleConclusion(before: State, after: State, intent: Intent) {
  if (before === after) return null;
  const entries = (s: State) => [
    {
      id: "thunder",
      duel: s.nascentSoul.thunder.battle,
      last:
        s.nascentSoul.thunder.last?.outcome === "loss"
          ? "雷关失守，请整备后再试。"
          : s.nascentSoul.thunder.last?.outcome === "win"
            ? "雷关已过，亲历已经记录。"
            : "雷关交锋已结束。",
    },
    { id: "golden", duel: s.goldenCore.duel, last: s.goldenCore.last },
    {
      id: "item-golden",
      duel: s.itemGrowth.golden.duel,
      last: s.itemGrowth.golden.last,
    },
    { id: "qi", duel: s.qiJourney.duel, last: s.qiJourney.last },
    {
      id: "cave",
      duel: s.qiJourney.narrative.duel,
      last: s.qiJourney.narrative.last,
    },
    { id: "road", duel: s.expedition.duel, last: s.expedition.last },
    { id: "arena", duel: s.social.arena.duel, last: s.social.arena.last },
    {
      id: "foundation",
      duel: s.foundationJourney.duel,
      last: s.foundationJourney.last,
    },
    { id: "contest", duel: s.sectContest.duel, last: s.sectContest.last },
    { id: "sea", duel: s.outerSea.duel, last: s.outerSea.last },
    { id: "conclave", duel: s.conclave.duel, last: s.conclave.last },
    { id: "lizhao", duel: s.lizhao.duel, last: s.lizhao.last },
  ];
  const previous = entries(before).find((x) => x.duel);
  if (!previous) return null;
  const current = entries(after).find((x) => x.id === previous.id)!;
  if (current.duel) return null;
  const action =
    "action" in intent
      ? typeof intent.action === "string"
        ? intent.action
        : "kind" in intent.action
          ? intent.action.kind
          : ""
      : intent.type;
  const withdrew = ["withdraw", "retreat", "arenaWithdraw", "return"].includes(action);
  const lost =
    after.status === "dead" ||
    after.injury > before.injury ||
    /败退|本场落败|败北|失守|气势耗尽|交锋未过|伤势\s*\+|伤退/.test(
      current.last,
    ) ||
    after.social.arena.losses > before.social.arena.losses ||
    (previous.id === 'contest' && after.sectContest.results.at(-1) === 'loss') ||
    (previous.id === 'thunder' && after.nascentSoul.thunder.last?.outcome === 'loss') ||
    (previous.id === 'foundation' && after.foundationJourney.board.losses > before.foundationJourney.board.losses);
  return {
    title:
      after.status === "dead"
        ? "身陨 · 此战终结"
        : withdrew
          ? "主动撤离 · 已退出交锋"
          : lost
            ? "战败 · 暂退整备"
            : "战斗胜利",
    tone: lost
      ? ("warning" as const)
      : withdrew
        ? ("neutral" as const)
        : ("success" as const),
    body: current.last,
    next: after.status === 'dead'
      ? "此段旅程已结束。可读取此前存档，或另起一段独立旅程。"
      : lost
      ? "已有历练成果保留。养伤、研修或补给后，再决定是否重试。"
      : withdrew
        ? "本次消耗与保留的进度见上方经过；调整准备后再决定是否重返。"
        : "查看本场所得与前路，确认后继续。",
  };
}
