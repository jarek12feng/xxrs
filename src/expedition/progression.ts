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
    return "筑基已成：重返青嶂关，与药队会合，挑战蚀阵傀儡并取出转运册。功法通达与灵器精炼已开放，可按交锋需要准备，不是入阵条件。";
  const preparation =
    s.qi >= 360
      ? "修为已满，可以查看突破把握，再决定现在叩关还是继续准备。"
      : `还差 ${360 - s.qi} 修为。回洞府选择吐纳，可用自动行动积累；遇剧情或修为满会暂停。`;
  return `青嶂已封住旧阵，待你筑基承受阵核反噬，再回来取出转运册。${preparation}炼丹、固本是提高把握的选择，不必把所有属性练满。线索与小关进度保留。`;
}
export function expeditionIntermission(s: State): string | null {
  if (!s.expedition.accepted || s.expedition.cleared !== 2 || s.expedition.duel)
    return null;
  return s.realm === 0
    ? "药车和伤者已经送回坊市。青嶂封住阵口，暂止灵息外泄；郁青带药签下山核对旧账。你们约定：待你筑基能承受阵核反噬，再以药队传信重返此地。这段休整里，各自修行、查证，救援线索不会遗失。"
    : "你筑基后的消息已由药队送到坊市。郁青携药签与你重新会合，青嶂准备解开封阵；这一次，可以一起取出旧阵里的转运册。";
}

export function familyQuestGoal(s: State): string {
  if (s.journey.maps.sea === 3)
    return "道友寻亲已完成：父亲仍在守灯，亲笔信已送回家中。可回看人物档案。";
  if (s.journey.maps.peak < 3)
    return s.journey.maps.valley < 3
      ? "道友寻亲：在回春谷查旧营地与刻痕，找父亲近况的线索。"
      : "道友寻亲：在雾岭查航图与守灯人的去向；需筑基，并有外门资格或神识 8、心得 2。";
  return "道友寻亲：到雾海孤灯核实父亲近况，将亲笔信送回家中。";
}
