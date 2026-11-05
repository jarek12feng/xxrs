import { expect, it } from 'vitest';
import { createCultivator } from '../tools/cultivator-fixture';
import { guidanceNotes } from '../src/player-guidance';
import { nextGoal } from '../src/core';
import { qiGoal } from '../src/qi-journey/rules';
it('成长目标不遮掉已知约期；失约切换恢复去向，不修改状态', () => {
 const s=createCultivator('引导','wood');s.adventure.step='done';s.qi=172;s.month=30;s.story.stage='waiting';
 const before=structuredClone(s);
 expect(nextGoal(s)).toContain('尚余6月');expect(nextGoal(s)).toContain('修为180');expect(s).toEqual(before);
 s.month=37;s.story.choice='missed';s.story.stage='resolved';
 expect(guidanceNotes(s).join('')).not.toContain('尚余');expect(guidanceNotes(s).join('')).toContain('洞府丹炉');
 s.story.choice='self';expect(guidanceNotes(s).join('')).not.toContain('独自重返');
});
it('淬脉后即知道必要药窟，不要求先到240或清完准备路线',()=>{
 const s=createCultivator('药窟','wood');s.qi=172;s.qiJourney.gates=1;
 expect(qiGoal(s)).toContain('石涧药窟');
 s.qiJourney.narrative.phase='applied';s.qi=240;s.qiJourney.preparations[1]!.medicine=3;s.story.choice='missed';
 expect(qiGoal(s)).toContain('洞府丹炉');expect(qiGoal(s)).not.toContain('之约');
});
