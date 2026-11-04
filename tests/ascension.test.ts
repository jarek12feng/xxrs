import { describe,it,expect } from 'vitest';
import { createGame, dispatch, validState, migrateSave, type State, type Intent } from '../src/core';
import { foundationStep } from '../tools/foundation-playthrough';
import { ascensionOptions } from '../src/ascension/rules';
import { breakthroughDetails, goldenChance } from '../src/progression';
import { outerSeaCheckpoint } from '../tools/outer-sea-checkpoint';
function foundationReady() {
 let s=createGame('行功验收','wood',847293);
 for(let i=0;i<600;i++) {
  const next=foundationStep(s,true,'medicine');
  if(next.type==='break') return s;
  s=dispatch(s,{...next,id:`prepare-${i}`});
 }
 throw Error('preparation stalled');
}
let serial=0;
function send(s:State,i:Intent) { const c={...i,id:`ascend-${++serial}`};const next=dispatch(s,c);expect(next).not.toBe(s);expect(validState(next)).toBe(true);expect(dispatch(s,c)).toEqual(next);return next; }
describe('三段行功',()=>{
 it('正常准备经三段行功稳定筑基，重载、锁定与重复结算',()=>{
  let s=foundationReady(); const seed=s.seed,pills=s.pills;
  s=send(s,{type:'ascension',action:'start'});
  expect(dispatch(s,{type:'advance',activity:'work',months:1,id:'locked'})).toBe(s);
  expect(dispatch(s,{type:'break',pill:true,id:'skip'})).toBe(s);
  for(let n=0;n<3;n++) {
   const o=ascensionOptions(s).find(o=>!o.error && o.id!=='press');expect(o).toBeTruthy();
   s=send(s,{type:'ascension',action:o!.id});
   s=migrateSave(JSON.parse(JSON.stringify(s)));
  }
  expect(s.seed).toBe(seed);expect(s.pills).toBe(pills);
  expect(breakthroughDetails(s,true).chance).toBe(100);
  s=send(s,{type:'ascension',action:'commit'});
  expect(s.realm).toBe(1);expect(s.pills).toBe(pills-1);expect(s.ascension).toBeNull();
  expect(dispatch(s,{type:'ascension',action:'commit',id:'repeat'})).toBe(s);
 });
 it('强推风险公开，收势保留丹药与此前成果',()=>{
  let s=send(foundationReady(),{type:'ascension',action:'start'});
  const pills=s.pills,month=s.month,gates=s.qiJourney.gates;
  for(let n=0;n<3;n++)s=send(s,{type:'ascension',action:'press'});
  expect(breakthroughDetails(s,true).chance).toBe(10);
  s=send(s,{type:'ascension',action:'withdraw'});
  expect(s.month).toBe(month+1);expect(s.pills).toBe(pills);expect(s.qiJourney.gates).toBe(gates);expect(s.ascension).toBeNull();
 });
 it('行功遇寿尽不先发突破，缺草不扣资源',()=>{
  let s=foundationReady();s.herbs=0;
  s=send(s,{type:'ascension',action:'start'});
  expect(dispatch(s,{type:'ascension',action:'medicine',id:'no-herbs'})).toBe(s);
  for(let n=0;n<3;n++)s=send(s,{type:'ascension',action:'press'});
  s.age=s.limit-1;
  const pills=s.pills;
  const n=dispatch(s,{type:'ascension',action:'commit',id:'last-month'});
  expect(n.status).toBe('dead');expect(n.realm).toBe(0);expect(n.pills).toBe(pills);expect(n.ascension).toBeNull();expect(validState(n)).toBe(true);
 });
 it('旧35档保留装备并初始化行功，损坏与未来档拒绝',()=>{
  const s=outerSeaCheckpoint(),old={...s,version:35};
  const n=migrateSave(old);expect(n.version).toBe(37);expect(n.treasures).toEqual(s.treasures);expect(n.ascension).toBeNull();
  expect(()=>migrateSave({...s,version:38})).toThrow();
  expect(validState({...s,ascension:{realm:1,step:3,strain:-1,history:[]}})).toBe(false);
 });
 it('凝丹行功的稳定结果独立于旧随机把握',()=>{
  const s=outerSeaCheckpoint();
  expect(goldenChance({...s,ascension:{realm:1,step:3,strain:0,history:['引气','稳脉','凝聚']}})).toBe(100);
 });
});
