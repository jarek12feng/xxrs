import {expect,it} from 'vitest';
import {createGame,type State} from '../src/core';
import {companionChronology,companionNews,companionLetterArchive} from '../src/golden-story/companion';
import {goldenStoryQuote,runGoldenStory,teachingSolution} from '../src/golden-story/rules';
import {teachingSpeaker,teachingIntroduction} from '../src/golden-story/teaching';
import {covenantMemory,covenantCeremonyText} from '../src/nascent-soul/covenant';
import {validGoldenStory} from '../src/golden-story/state';
function history(){
 const s=createGame('独立年月','wood',42,'insightful');
 s.realm=2;s.limit=6000;s.month=3700;s.age=3892;s.social.met=true;s.social.metMonth=100;s.social.gender='male';
 Object.assign(s.foundationJourney,{departedAt:500,epilogue:true,rescue:4,won:['rescue'],inheritance:'spring'});
 Object.assign(s.foundationJourney.heroine,{map:'public',expedition:true,supplied:true});
 s.goldenCore.formedAt=1300;s.outerSea.location='ferry';s.outerSea.met=true;s.conclave.depth=2;
 return s;
}
const tick=(s:State)=>({...s,month:s.month+1,age:s.age+1});
it('同一伙伴经历不因玩家晚凝丹而推迟或取消她的凝丹',()=>{
 const s=history();const expected=companionChronology(s)?.goldenAt;
 for(const formedAt of [null,1300,2400,3500]){
  s.goldenCore.formedAt=formedAt;
  expect(companionChronology(s)?.goldenAt).toBe(expected);
  expect(companionNews(s)?.id).toBe(4);
 }
 expect(expected).toBe(1100);
});
it('自留拓本用于药理问法，省去核验月但不跳过两步亲习',()=>{
 const s=history();const action={kind:'ask',topic:'pill',source:'public'} as const;
 expect(goldenStoryQuote(s,action).months).toBe(1);
 const held=runGoldenStory(s,{kind:'rubbing',recipient:'retain'},'retain',tick);
 expect(held.goldenStory.last).toContain('灵纹');
 expect(goldenStoryQuote(held,action).months).toBe(0);
 let n=runGoldenStory(held,action,'ask',tick);
 expect(n.goldenStory.teachings).toEqual([]);expect(n.goldenStory.practice?.step).toBe(0);
 for(const move of teachingSolution('pill'))n=runGoldenStory(n,{kind:'practice',move},move,tick);
 expect(n.goldenStory.teachings).toEqual(['pill']);expect(n.month).toBe(s.month);
 expect(n.conclave).toEqual(s.conclave);expect(validGoldenStory(n)).toBe(true);
});
it('历史已确认的凝丹来信保留原落款，既不重发也不失效',()=>{
 const s=history();s.goldenStory.companionGoldenAt=1660;s.goldenStory.companionConfirmedAt=3700;s.goldenStory.companionLetters=[4];
 expect(validGoldenStory(s)).toBe(true);
 expect(companionChronology(s)?.goldenAt).toBe(1660);
 expect(companionNews(s)?.goldenAt).toBe(1660);
});
it('自留药息用途只减药理核验，不扩大三方合作也不重复领收益',()=>{
 const s=history();const retained=runGoldenStory(s,{kind:'rubbing',recipient:'retain'},'held',tick);
 for(const topic of ['method','spirit','ground'] as const)expect(goldenStoryQuote(retained,{kind:'ask',topic,source:'public'}).months).toBe(1);
 expect(runGoldenStory(retained,{kind:'rubbing',recipient:'retain'},'repeat',tick)).toBe(retained);
});

it('迟收来信可回看三封带落款旧笺，未收信不提前确认或展示',()=>{
 const s=history();expect(companionLetterArchive(s)).toEqual([]);
 const n=runGoldenStory(s,{kind:'companion'},'news',tick);
 const before=JSON.stringify(n);expect(companionLetterArchive(n).map(x=>x.month)).toEqual([860,980,1100]);
 expect(companionLetterArchive(JSON.parse(before))).toEqual(companionLetterArchive(n));
 expect(JSON.stringify(n)).toBe(before);
});
it('晚年与公开席使用同一讲者投影，不冒充沈观微在场',()=>{
 const s=history();s.month=2399;expect(teachingSpeaker(s,'seat').name).toBe('沈观微');
 expect(teachingSpeaker(s,'public').name).toBe('当值传讲人');
 s.month=2400;expect(teachingSpeaker(s,'seat').name).toBe('当值传讲人');
 expect(teachingIntroduction(s,'method','seat')).toContain('当值传讲人展开沈观微留下的论法实录');
});
it('救陌生队伍不能被结契回忆写成苏婉宁救过自己',()=>{
 const s=history();s.foundationJourney.target='party';
 expect(covenantMemory(s)).not.toContain('她拉住了你');
 s.foundationJourney.target='companion';expect(covenantMemory(s)).toContain('她拉住了你');
});

it('出关后再议结契承接已完成的长关，不再预告这次长关',()=>{
 const s=history();expect(covenantCeremonyText(s,'discuss')).toContain('你这次长关');
 s.realm=3;s.nascentSoul.emerged=true;
 expect(covenantCeremonyText(s,'discuss')).toContain('如今平安出关');
 expect(covenantCeremonyText(s,'discuss')).not.toContain('你这次长关');
});
