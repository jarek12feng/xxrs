import type { State } from "../world";

// One read-only objective for the cave, route and expedition. Existing checkpoints
// encode the intermission; no additional persisted flag or fabricated elapsed time.
export function expeditionGoal(s: State): string | null {
  const q = s.expedition;
  if (!q.accepted || q.cleared >= 3) return null;
  if (q.duel) return "留意来招，选择守势、反击或辨影；也可主动撤回准备。";
  if (q.cleared === 0) return "护送药车通过山道；准备好补给后开始交锋。";
  if (q.cleared === 1) return "调查古阵：凝神研读辨阵，或备齐灵草 4 温养草根。";
  if (s.realm === 1)
    return "筑基已成：重返青嶂关，与药队会合，挑战蚀阵傀儡并取出转运册。";
  const preparation =
    s.qi >= 360
      ? "修为已满，检查伤势、丹药与突破把握，再叩关。"
      : `回洞府吐纳积累修为（${s.qi}/360），按需炼丹、固本；陆迟的旧约照常赴约。`;
  return `药队已撤回坊市，青嶂封住旧阵。${preparation}筑基后回青嶂关会合，线索与小关进度保留。`;
}
export function expeditionIntermission(s: State): string | null {
  if (!s.expedition.accepted || s.expedition.cleared !== 2 || s.expedition.duel)
    return null;
  return s.realm === 0
    ? "药车和伤者已经送回坊市。青嶂封住阵口，暂止灵息外泄；郁青带药签下山核对旧账。你们约定：待你筑基能承受阵核反噬，再以药队传信重返此地。这段休整里，各自修行、查证，救援线索不会遗失。"
    : "你筑基后的消息已由药队送到坊市。郁青携药签与你重新会合，青嶂准备解开封阵；这一次，可以一起取出旧阵里的转运册。";
}
