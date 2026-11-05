import {describe,expect,it} from 'vitest';
import type {State} from '../src/world';
import {choices,fresh,quote,solution,upgrade,valid,type PracticeState} from '../src/golden-story/practices/ground';
function game(material:PracticeState,step:0|1=1,learned=false):State {
 return {goldenStory:{practice:{topic:'ground',step,material}},spirit:{manual:learned?'learned':'none'},herbs:0} as unknown as State;
}
function run(moves:string[],step:0|1=1,initial=fresh(step),learned=false){
 let material=initial;let result=quote(game(material,step,learned),'bad');
 for(const move of moves){result=quote(game(material,step,learned),move);expect(result.error).toBe('');expect(result.herbs).toBe(0);expect(valid(result.next)).toBe(true);material=result.next;}
 return result;
}
describe('护阵实物处理',()=>{
 it('短示范与转移续试均为零物资，且不改变输入',()=>{
  for(const step of [0,1] as const){const s=game(fresh(step),step);const before=JSON.stringify(s);quote(s,solution(step)[0]!);expect(JSON.stringify(s)).toBe(before);expect(run(solution(step),step).passed).toBe(true);}
 });
 it('内圈与封闭回流口能就地保药，与导流转移产生不同结果',()=>{
  const a=run(['ground-inner','ground-gather','ground-test']);
  const b=run(solution(1));
  expect(a.next).toMatchObject({outlet:false,rack:'inner',outcome:'sheltered'});
  expect(b.next).toMatchObject({outlet:true,rack:'high',outcome:'transferred'});
 });
 it('分念可同时护架护路，闭口仍可转移；无本领不能冒用',()=>{
  const moves=['ground-divide','ground-clear','ground-transfer','ground-test'];
  expect(run(moves,1,fresh(1),true).next).toMatchObject({outlet:false,outcome:'transferred'});
  expect(quote(game(fresh(1)),moves[0]!).error).toContain('尚未研修');
  expect(quote(game({...fresh(1),guard:'outer',debris:false}),'ground-transfer').error).toContain('回潮');
 });
 it('失手后晾干不撤销布置，读档继续完成',()=>{
  const failed=run(['ground-outer','ground-test']);expect(failed.failed).toBe(true);
  const restored=JSON.parse(JSON.stringify(failed.next));
  expect(run(['ground-dry','ground-open','ground-clear','ground-transfer','ground-test'],1,restored).passed).toBe(true);
 });
 it('所有合法进行中局部组合都能零物资恢复',()=>{
  for(const guard of ['none','inner','outer','divided'] as const)for(const outlet of [false,true])for(const rack of ['edge','inner','high'] as const)for(const debris of [false,true])for(const soaked of [false,true]){
   const s:PracticeState={...fresh(1),guard,outlet,rack,debris,soaked};
   const moves=[...(soaked?['ground-dry']:[]),...(rack!=='inner'?['ground-gather']:[]),...(guard!=='inner'?['ground-inner']:[]),'ground-test'];
   expect(run(moves,1,s).passed).toBe(true);
  }
 });
 it('无效及重复操作拒绝，不扣物资；结果不可重结',()=>{
  expect(quote(game(fresh(1)),'ground-dry')).toMatchObject({herbs:0,failed:false,passed:false,next:fresh(1)});
  expect(quote(game(fresh(1)),'herb').error).not.toBe('');
  const done=run(solution(1)).next;
  for(const c of choices)expect(quote(game(done),c.move).error).not.toBe('');
 });
 it('升级保留回流与护持准备，旧供灵充分转为清开的通道，不推断通关',()=>{
  expect(upgrade({topic:'ground',outlet:true,guard:'outer',supply:2},1)).toMatchObject({outlet:true,guard:'outer',debris:false,outcome:'pending'});
  const v=run(['ground-inner','ground-gather']).next;expect(upgrade(v,1)).toEqual(v);
  expect(valid({...fresh(1),schema:3})).toBe(false);expect(valid({...fresh(1),outcome:'sheltered'})).toBe(false);
 });
});
