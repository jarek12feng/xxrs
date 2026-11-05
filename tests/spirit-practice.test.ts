import {expect,it} from 'vitest';
import {dispatch,migrateSave,validState,type State} from '../src/core';
import {conclaveCheckpoint} from '../tools/conclave-checkpoint';
import {freshSpiritPractice,spiritPracticeQuote} from '../src/golden-story/spirit-practice';
import {teachingSolution,type TeachingMove} from '../src/golden-story/teaching';
let id=0;
const move=(s:State,m:TeachingMove)=>dispatch(s,{id:`spirit-practice-${++id}`,type:'goldenStory',action:{kind:'practice',move:m}});
function start(){return dispatch(conclaveCheckpoint(),{id:`ask-spirit-${++id}`,type:'goldenStory',action:{kind:'ask',topic:'spirit',source:'public'}});}
it('普通听辨与已学分念都能独立完成，两轮实测后才记领悟',()=>{
 const base=start();base.spirit.manual='none';
 let slow=base;
 for(const m of teachingSolution('spirit'))slow=move(slow,m);
 expect(slow.goldenStory.teachings).toContain('spirit');
 expect(slow.goldenStory.practice).toBeNull();
 expect(slow.herbs).toBe(base.herbs);expect(slow.month).toBe(base.month);
 let fast=start();const month=fast.month;
 fast=move(fast,'split');expect(fast.goldenStory.practice!.spirit).toEqual({anchored:false,echoes:2,pressure:1});
 fast=move(fast,'anchor');fast=move(fast,'confirm');
 expect(fast.goldenStory.teachings).not.toContain('spirit');
 expect(fast.goldenStory.practice).toMatchObject({step:1,spirit:{pressure:2,echoes:0}});
 fast=move(fast,'split');fast=move(fast,'anchor');fast=move(fast,'confirm');
 expect(fast.goldenStory.teachings).toContain('spirit');
 expect(fast.month).toBe(month);expect(validState(fast)).toBe(true);
 expect(move(fast,'confirm')).toBe(fast);
});
it('失手保留余下线索，缓压与灵草可以换法恢复；报价不改状态',()=>{
 let s=start();s=move(s,'anchor');s=move(s,'listen');
 const before=structuredClone(s),quote=spiritPracticeQuote(s,'confirm');
 expect(s).toEqual(before);expect(quote.failed).toBe(true);
 s=move(s,'confirm');expect(s.goldenStory.practice!.errors).toBe(1);
 expect(s.goldenStory.practice!.spirit!.pressure).toBe(2);
 s=move(s,'split');s=move(s,'listen');
 expect(s.goldenStory.practice!.spirit!.echoes).toBe(1);
 const herbs=s.herbs;s=move(s,'herb');
 expect(s.herbs).toBe(herbs-2);expect(s.goldenStory.practice!.spirit).toEqual({anchored:true,echoes:1,pressure:0});
 s=migrateSave(JSON.parse(JSON.stringify(s)));s=move(s,'listen');s=move(s,'confirm');
 expect(s.goldenStory.practice!.step).toBe(1);
 s.herbs=0;expect(move(s,'herb')).toBe(s);
 s.spirit.manual='none';expect(move(s,'split')).toBe(s);
});
it('全部局部状态均有无物资恢复路线，不会因试错锁死',()=>{
 const base=start();base.herbs=0;
 for(const step of [0,1] as const)for(const anchored of [false,true])for(const echoes of [0,1,2] as const)for(const pressure of [0,1,2] as const){
  let s=structuredClone(base);s.goldenStory.practice!.step=step;s.goldenStory.practice!.spirit={anchored,echoes,pressure};
  for(let phase=step;phase<2;phase++)for(const m of ['anchor','ease','listen','ease','listen','ease','confirm'] as const)s=move(s,m);
  expect(s.goldenStory.practice).toBeNull();expect(s.goldenStory.teachings).toContain('spirit');
 }
});
it('v54保留已学与进行中的阶段，新版拒绝缺失或非法试阵数据',()=>{
 const base=start();
 for(const version of [53,54])for(const step of [0,1] as const){
  const old=structuredClone(base) as any;old.version=version;if(version===53)delete old.nascentSoul.crossing;old.goldenStory.practice.step=step;delete old.goldenStory.practice.spirit;
  const before=JSON.stringify(old),up=migrateSave(old);
  expect(up.goldenStory.practice!.step).toBe(step);expect(up.goldenStory.practice!.spirit).toEqual(freshSpiritPractice(step));
  expect(JSON.stringify(old)).toBe(before);expect(validState(up)).toBe(true);
 }
 const bad=structuredClone(base) as any;delete bad.goldenStory.practice.spirit;
 expect(validState(bad)).toBe(false);expect(()=>migrateSave(bad)).toThrow();
 bad.goldenStory.practice.spirit={anchored:true,echoes:3,pressure:0};expect(validState(bad)).toBe(false);
 let done=base;for(const m of teachingSolution('spirit'))done=move(done,m);
 const old=structuredClone(done) as any;old.version=54;
 const up=migrateSave(old);expect(up.goldenStory.practice).toBeNull();expect(up.goldenStory.teachings).toEqual(done.goldenStory.teachings);
 expect(up.goldenStory.teachingPracticeResults).toEqual(done.goldenStory.teachingPracticeResults);
 expect(()=>migrateSave({...done,version:done.version+1})).toThrow();
});
