import type { State } from './world';

/** Known commitments and routes, independent of the currently selected growth task. */
export function guidanceNotes(s: State): string[] {
  if (s.realm || s.status !== 'alive' || s.pending || s.adventure.step !== 'done') return [];
  const notes: string[] = [];
  if (s.story.stage === 'waiting' && s.month < s.story.deadline)
    notes.push(`青石遗府之约：第${s.story.deadline}月，尚余${s.story.deadline - s.month}月；入府需修为180与一种破阵手段。当前修为${s.qi}。`);
  if (s.story.choice === 'missed' && !s.crafted)
    notes.push('旧约已过，仍可在洞府丹炉处独自重返青石遗府。');
  if (s.journey.learning.book && !s.adventure.road.map)
    notes.push(s.adventure.road.thanked
      ? '山外行路：缺角航图可在坊市向郁青打听；可与修行穿插进行。'
      : '山外行路：药工平安归来后还有旧航图的消息，可回访药工与温蘅；可与修行穿插进行。');
  return notes;
}

export const movePurpose: Record<string, string> = {
  guard: '收势护身，为下一合反击蓄势。',
  strike: '抢攻破绽，护身较弱。',
  discern: '辨认虚实，为后续应对探路。',
};
