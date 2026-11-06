import { beforeAll, expect, it } from 'vitest';
import { dispatch, migrateSave, validState, type State } from '../src/core';
import { condensationCheckpoint } from '../tools/golden-core-checkpoint';
import { goldenLateCheckpoint } from '../tools/golden-completion-checkpoint';
import { monthlyGatherIncome, monthlyWorkIncome } from '../src/preparation-rates';
import { workshopQuote } from '../src/workshop/rules';
import { preparationPlan } from '../src/workshop/preparation';
let foundation: State, golden: State;
beforeAll(()=>{foundation=condensationCheckpoint();golden=goldenLateCheckpoint();},30000);
function prepared(base=golden){const s=structuredClone(base);s.stones=100;s.herbs=20;s.study=4;return s;}
it('gathering competes with work-and-purchase, and trained herb expertise retains a surplus',()=>{
 for(const base of [foundation,golden]){
  const s=prepared(base);s.journey.support=null;
  expect(monthlyGatherIncome(s)*2).toBe(monthlyWorkIncome(s));
  const n=dispatch(s,{type:'advance',activity:'gather',months:2,id:'gather'});
  expect(n.herbs-s.herbs).toBe(monthlyGatherIncome(s)*2);
  expect(n.month-s.month).toBe(2);expect(validState(n)).toBe(true);
  s.journey.known=[...new Set([...s.journey.known,'herb' as const])];s.journey.support='herb';s.growth.training.herb=2;
  const expert=dispatch(s,{type:'advance',activity:'gather',months:2,id:'expert'});
  expect(expert.herbs-s.herbs).toBe(monthlyGatherIncome(s)*2);
  expect(monthlyGatherIncome(s)*2).toBeGreaterThan(monthlyWorkIncome(s));
  expect(migrateSave(expert)).toEqual(expert);
 }
});
it('gathering preparation forecasts match the actual month command, including expertise',()=>{
 const s=prepared();s.herbs=0;
 const plan=preparationPlan(s,{product:'spirit',method:'craft'});
 const step=plan.steps.find(x=>x.label==='采药备灵草')!;
 const n=dispatch(s,{...step.intent,id:'forecast'});
 expect(n.herbs).toBe(step.gain);expect(n.month-s.month).toBe(step.months);
});
it.each(['healing','clarity'] as const)('ordinary %s uses one batch cost, quotes full output, and is replay-safe',product=>{
 for(const base of [foundation,golden]){
  const s=prepared(base),order={product,method:'craft'} as const;
  const q=workshopQuote(s,order), command={type:'workshop',order,id:'batch'} as const;
  expect(q.error).toBe('');expect(q.quantity).toBe(s.realm+1);
  expect(q.stones+q.herbs*2+q.months*monthlyWorkIncome(s)).toBeLessThan(q.quantity*12);
  const n=dispatch(s,command);
  expect(n.growth.medicines[product]-s.growth.medicines[product]).toBe(q.quantity);
  expect(n.stones).toBe(s.stones-q.stones);expect(n.herbs).toBe(s.herbs-q.herbs);
  expect(n.month-s.month).toBe(1);expect(n.seed).toBe(s.seed);expect(validState(n)).toBe(true);
  expect(migrateSave(n)).toEqual(n);expect(dispatch(n,command)).toBe(n);
  expect(dispatch(s,command)).toEqual(n);
  for(const method of ['buy','commission'] as const)expect(workshopQuote(s,{product,method}).quantity).toBe(1);
 }
});
it('batch capacity is checked in full, without silently clipping output or spending materials',()=>{
 const s=prepared(),order={product:'healing',method:'craft'} as const;
 s.growth.medicines.healing=1e9-2;
 const snapshot=structuredClone(s);
 expect(workshopQuote(s,order).error).toBe('资源超过可保存上限');
 expect(dispatch(s,{type:'workshop',order,id:'overflow'})).toBe(s);expect(s).toEqual(snapshot);
 s.growth.medicines.healing--;
 expect(dispatch(s,{type:'workshop',order,id:'fits'}).growth.medicines.healing).toBe(1e9);
});
it('death precedes gathering and batch settlement, while scarce medicines remain single-output',()=>{
 const s=prepared();s.age=s.limit-1;
 const gathered=dispatch(s,{type:'advance',activity:'gather',months:1,id:'last-herbs'});
 expect(gathered.status).toBe('dead');expect(gathered.herbs).toBe(s.herbs);
 const brewed=dispatch(s,{type:'workshop',order:{product:'clarity',method:'craft'},id:'last-batch'});
 expect(brewed.status).toBe('dead');expect(brewed.stones).toBe(s.stones);expect(brewed.herbs).toBe(s.herbs);
 expect(brewed.growth.medicines).toEqual(s.growth.medicines);
 for(const product of ['foundation','ward','spirit'] as const)expect(workshopQuote(prepared(),{product,method:'craft'}).quantity).toBe(1);
});
