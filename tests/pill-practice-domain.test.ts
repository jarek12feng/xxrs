import { describe, expect, it } from 'vitest';
import type { State } from '../src/world';
import { choices, fresh, quote, solution, upgrade, valid, type PracticeState } from '../src/golden-story/practices/pill';
// Narrow host fixture: shared dispatch and migration belong to the integration owner.
function game(step: 0|1, material=fresh(step), learned=false, herbs=0): State {
 return {goldenStory:{practice:{topic:'pill',step,material}},spirit:{manual:learned?'learned':'none'},herbs} as unknown as State;
}
function run(s: State, moves: string[]) {
 let last=quote(s,'invalid');
 for(const move of moves){last=quote(s,move);expect(last.error).toBe('');s={...s,herbs:s.herbs-last.herbs,goldenStory:{...s.goldenStory,practice:{...s.goldenStory.practice!,material:last.next as never}}};}
 return {s,last};
}
describe('分药试具纯域',()=>{
 it('普通手法完成示范和双息实测，无物资、无计时或随机变化',()=>{
  for(const step of [0,1] as const){const s=game(step);const before=JSON.stringify(s);const {last}=run(s,solution(step));expect(last.passed).toBe(true);expect(last.next.collected).toBe(true);expect(JSON.stringify(s)).toBe(before);}
 });
 it('旁盏隔流和分念双护有不同的器物结果，都能完成',()=>{
  const side=run(game(1),solution(1));
  const dual=run(game(1,fresh(1),true),['pillWarm','pillSplit','pillVent','pillCollect']);
  expect(side.last.next.breath).toBe('sidecup');expect(dual.last.next.breath).toBe('dual');expect(dual.last.passed).toBe(true);
  expect(quote(game(1),'pillSplit').error).toContain('研修');
 });
 it('未护双息即开孔会混流，免费重调可恢复；温盏不需重复',()=>{
  let {s,last}=run(game(1),['pillWarm','pillVent']);expect(last.failed).toBe(true);expect(last.next.muddled).toBe(true);
  expect(run(s,['pillReset',...solution(1)]).last.passed).toBe(true);
  s=run(game(1),['pillWarm']).s;expect(quote(s,'pillWarm').error).toContain('无须');
 });
 it('灵草只补救混流并保留旁盏，零效果和余额不足均拒绝且零扣费',()=>{
  const failed=run(game(1,fresh(1),false,2),['pillHold','pillVent']).s;
  const {s,last}=run(failed,['pillHerb']);expect(last.herbs).toBe(2);expect(last.next.breath).toBe('sidecup');expect(s.herbs).toBe(0);
  expect(run(s,['pillWarm','pillVent','pillCollect']).last.passed).toBe(true);
  for(const target of [game(1),s,run(game(0),['pillWarm','pillVent']).s]){const q=quote(target,'pillHerb');expect(q.error).not.toBe('');expect(q.herbs).toBe(0);}
  const poor={...failed,herbs:1};expect(quote(poor,'pillHerb')).toMatchObject({herbs:0,error:expect.stringContaining('需灵草')});
 });
 it('所有可接受的未收取局部组合均可零物资恢复，重复收取拒绝',()=>{
  for(const step of [0,1] as const) for(const warm of [false,true])for(const haze of ['mixed','floating','clear'] as const)for(const breath of ['joined','sidecup','dual'] as const)for(const muddled of [false,true]){
   const v:PracticeState={...fresh(step),warm,haze,breath,muddled};expect(valid(v)).toBe(true);
   const {s,last}=run(game(step,v),['pillReset',...solution(step)]);expect(last.passed).toBe(true);expect(quote(s,'pillCollect').error).not.toBe('');
  }
 });
 it('保存与升级保留分离成果，但不伪造收取和领悟',()=>{
  const v=run(game(1),['pillHold','pillWarm']).last.next;
  expect(upgrade(JSON.parse(JSON.stringify(v)),1)).toEqual(v);
  expect(upgrade({topic:'pill',layers:1,clear:0},0)).toMatchObject({warm:true,haze:'floating',collected:false});
  expect(upgrade({topic:'pill',layers:0,clear:1},1)).toMatchObject({breath:'sidecup',haze:'mixed',collected:false});
  expect(upgrade({topic:'pill',layers:0,clear:2},1)).toMatchObject({haze:'clear',collected:false});
  expect(valid({...v,schema:3})).toBe(false);expect(()=>upgrade({...v,schema:3},1)).toThrow();expect(valid({...v,topic:'ground'})).toBe(false);expect(valid({...fresh(0),collected:true})).toBe(false);
 });
 it('非法动作和状态报价拒绝，输入从不改变',()=>{
  for(const move of choices.map(c=>c.move).concat('bogus')){const s=game(1);const original=JSON.stringify(s);quote(s,move);expect(JSON.stringify(s)).toBe(original);}
  const s=game(1,{} as PracticeState);expect(quote(s,'pillWarm').error).not.toBe('');
 });
});
