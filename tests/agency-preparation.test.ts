import {materialSolution} from '../src/golden-story/material-practice';
import { beforeAll, expect, it } from 'vitest';
import { dispatch, validState, migrateSave, type State, type Intent } from '../src/core';
import { goldenLateCheckpoint } from '../tools/golden-completion-checkpoint';
import { lizhaoDepthCheckpoint } from '../tools/lizhao-depth-checkpoint';
import { lizhaoQuote, runLizhao } from '../src/lizhao/rules';
import { goldenStoryQuote, runGoldenStory } from '../src/golden-story/rules';
import { reunionCapability, reunionQuote, type ReunionAction } from '../src/golden-reunion';
import { lizhaoOptions } from '../src/lizhao/view';
let late: State, chamber: State;
beforeAll(() => { late = goldenLateCheckpoint(); chamber = lizhaoDepthCheckpoint(); }, 30000);
let serial = 0;
function act(s: State, intent: Intent) {
 const cmd = {...intent, id: `agency:${++serial}`};
 const n = dispatch(s, cmd);
 expect(n).not.toBe(s);
 expect(dispatch(s, cmd)).toEqual(n);
 expect(dispatch(n, cmd)).toBe(n);
 expect(validState(n)).toBe(true);
 expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
 return n;
}
function reunion(s: State, action: ReunionAction) { return act(s, {type:'goldenStory',action:{kind:'reunion',action}}); }
function planned(approach: 'ward'|'survey'|'edge') {
 return reunion(reunion(reunion(late,{kind:'invite'}),{kind:'meet'}),{kind:'plan',approach});
}
it('离照：缓炼与辅助分念均取得可用于炼丹的药理，成本各自结算', () => {
 const ready = act(chamber,{type:'lizhao',action:{kind:'verify'}});
 const before = structuredClone(ready);
 const normal = act(act(ready,{type:'lizhao',action:{kind:'assay',move:'drain'}}),{type:'lizhao',action:{kind:'assay',move:'bind'}});
 const filtered = act(act(act(ready,{type:'lizhao',action:{kind:'assay',move:'herbFilter'}}),{type:'lizhao',action:{kind:'assay',move:'divide'}}),{type:'lizhao',action:{kind:'assay',move:'bind'}});
 // Public equipment command; possession without deployment is tested separately.
 const equipped = ready.treasures.artifacts.includes('tideSeal') ? ready : act(ready,{type:'treasure',action:{kind:'deploy',item:'tideSeal'}});
 const sealed = act(act(act(equipped,{type:'lizhao',action:{kind:'assay',move:'sealFlow'}}),{type:'lizhao',action:{kind:'assay',move:'divide'}}),{type:'lizhao',action:{kind:'assay',move:'bind'}});
 expect(normal.month-ready.month).toBe(3); expect(normal.herbs).toBe(ready.herbs);
 expect(filtered.month-ready.month).toBe(3); expect(filtered.herbs).toBe(ready.herbs-4);
 expect(sealed.month-equipped.month).toBe(3); expect(sealed.herbs).toBe(equipped.herbs);
 for (const s of [normal,filtered,sealed]) {
  expect(s.lizhao.recipeVerified).toBe(true);
  expect(s.lizhao.assay.phase).toBe('stable');
  expect(s.lizhao.reagent).toBe(ready.lizhao.reagent);
  expect(lizhaoQuote(s,{kind:'allocate',allocation:'share'}).error).toBe('');
  expect(lizhaoQuote(s,{kind:'assay',move:'herbFilter'}).error).not.toBe('');
 }
 expect(ready).toEqual(before);
});
it('添药不足、法宝未装备和清液阶段不能偷走新捷径；报价不修改状态', () => {
 const ready = act(chamber,{type:'lizhao',action:{kind:'verify'}});
 const poor = {...ready, herbs:3};
 expect(dispatch(poor,{type:'lizhao',action:{kind:'assay',move:'herbFilter'},id:'poor'})).toBe(poor);
 const noSeal = {...ready,treasures:{...ready.treasures,artifacts:[]}};
 expect(lizhaoQuote(noSeal,{kind:'assay',move:'sealFlow'}).error).toContain('装配');
 const snap = structuredClone(noSeal);
 expect(lizhaoOptions(noSeal).find(x=>x.action.kind==='assay' && x.action.move==='sealFlow')?.error).toBeTruthy();
 expect(noSeal).toEqual(snap);
 const clear = act(ready,{type:'lizhao',action:{kind:'assay',move:'drain'}});
 expect(lizhaoQuote(clear,{kind:'assay',move:'herbFilter'}).error).toContain('清液已分');
});
it('离照添药遇时间中断不扣草、不授药理，不改稀缺辅药', () => {
 const ready = act(chamber,{type:'lizhao',action:{kind:'verify'}});
 const n = runLizhao(ready,{kind:'assay',move:'herbFilter'},'stop',s=>({...s,status:'dead'}));
 expect(n.herbs).toBe(ready.herbs); expect(n.lizhao.assay).toEqual(ready.lizhao.assay); expect(n.lizhao.recipeVerified).toBe(false); expect(n.lizhao.reagent).toBe(ready.lizhao.reagent);
});
it.each(['ward','survey'] as const)('古渡%s：已练本领可耗草直接实测，也可不耗草先布锚；成果继续承接问法', approach => {
 const ready = planned(approach);
 expect(reunionCapability(ready,approach)).not.toBeNull();
 const quote = reunionQuote(ready,{kind:'useAbility'});
 expect(quote.error).toBe(''); expect(quote.herbs).toBe(2); expect(quote.months).toBe(1);
 const direct = reunion(ready,{kind:'useAbility'});
 const rope = reunion(reunion(ready,{kind:'anchor'}),{kind:'cross'});
 expect(direct.month-ready.month).toBe(1); expect(direct.herbs).toBe(ready.herbs-2);
 expect(rope.month-ready.month).toBe(2); expect(rope.herbs).toBe(ready.herbs);
 expect(direct.goldenStory.reunion.stage).toBe('resolved');
 expect(direct.goldenStory.reunion.last).toContain(reunionCapability(ready,approach)!.name);
 expect(direct.social).toEqual(ready.social);
 const study = structuredClone(direct);
 study.goldenStory.teachings=[];study.goldenStory.teachingSources=[];study.goldenStory.teachingPracticeResults=[];study.goldenStory.rubbings=[];
 expect(goldenStoryQuote(study,{kind:'ask',source:'public',topic:approach==='ward'?'ground':'spirit'}).months).toBe(0);
 const topic = approach === 'ward' ? 'ground' : 'spirit';
 const taught = act(study,{type:'goldenStory',action:{kind:'ask',source:'public',topic}});
 expect(taught.goldenStory.practice?.step).toBe(1);
 expect(taught.goldenStory.teachings).toEqual([]);
 let finished = taught;
 for(const move of (approach === 'ward' ? materialSolution('ground',1) : ['anchor','listen','ease','listen','confirm']) as import('../src/golden-story/teaching').TeachingMove[]) finished=act(finished,{type:'goldenStory',action:{kind:'practice',move}});
 expect(finished.goldenStory.teachings).toEqual([topic]);
 expect(reunionQuote(direct,{kind:'useAbility'}).error).toBeTruthy();
});
it('没有潮纹剑仍可用绳尺完成切桩分工；不得拿别的本领冒充，资源不足也不能施法', () => {
 const ready = planned('edge');
 expect(reunionCapability(ready,'edge')).toBeNull();
 expect(reunionQuote(ready,{kind:'useAbility'}).error).toContain('尚无');
 const rope = reunion(reunion(ready,{kind:'anchor'}),{kind:'cross'});
 expect(rope.month-ready.month).toBe(3);expect(rope.goldenStory.reunion.stage).toBe('resolved');
 const poor = {...planned('survey'),herbs:1};
 expect(reunionQuote(poor,{kind:'useAbility'}).error).toBeTruthy();
 expect(dispatch(poor,{type:'goldenStory',action:{kind:'reunion',action:{kind:'useAbility'}},id:'poor-reunion'})).toBe(poor);
});
it('古渡连续行功遇中断，保留分工且不扣草、不补发成果', () => {
 const ready=planned('survey');
 const n=runGoldenStory(ready,{kind:'reunion',action:{kind:'useAbility'}},'stop-reunion',s=>({...s,status:'dead'}));
 expect(n.herbs).toBe(ready.herbs);expect(n.goldenStory.reunion).toEqual(ready.goldenStory.reunion);
});
