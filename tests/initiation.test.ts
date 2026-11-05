import { describe, expect, it } from 'vitest';
import { createGame, dispatch, migrateSave, validState, type State, type Intent } from '../src/core';
import { arrivalActive, initiationError, joinError, hasCultivationKit } from '../src/initiation/rules';
import { SAVE_VERSION } from '../src/save-version';
let serial=0;
function send(s:State,c:Intent) {
  const before=structuredClone(s), command={...c,id:`initiation-test-${++serial}`};
  const n=dispatch(s,command);
  expect(s).toEqual(before);expect(validState(n)).toBe(true);
  expect(dispatch(s,command)).toEqual(n);expect(dispatch(n,command)).toBe(n);
  expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
  return n;
}
export function seekingCheckpoint(supplies=false){
  let s=createGame('问道','wood',42,'insightful','male');
  for(const action of ['entry:unload','entry:steady','origin:kin'] as const)s=send(s,{type:'qiJourney',action});
  for(const action of ['inspect','depart','medicine','prepare','depart','trail','challenge',supplies?'takeHerbs':'return'] as const)s=send(s,{type:'adventure',action});
  return send(s,{type:'qiJourney',action:'entry:seek'});
}
describe('药乡入道与听松引荐',()=>{
  it('starts with no currency, bag or formal manuals; breathing and a personal motive award no stats',()=>{
    let s=createGame('问道','wood',42);
    expect(arrivalActive(s)).toBe(true);expect(s.stones).toBe(0);expect(s.journey.known).toEqual([]);expect(hasCultivationKit(s)).toBe(false);
    for(const intent of [{type:'advance',activity:'work',months:1},{type:'learn',technique:'spring'},{type:'learning',choice:'spring'},{type:'join',branch:'dan'}] as const)expect(send(s,intent)).toBe(s);
    expect(send(s,{type:'qiJourney',action:'entry:steady'})).toBe(s);
    const baseline={month:s.month,qi:s.qi,stones:s.stones,seed:s.seed};
    s=send(s,{type:'qiJourney',action:'entry:unload'});
    s=send(s,{type:'qiJourney',action:'entry:force'});
    expect(s.qiJourney.narrative.initiation.arrival).toBe('unloaded');
    s=send(s,{type:'qiJourney',action:'entry:steady'});
    s=send(s,{type:'qiJourney',action:'origin:kin'});
    expect(arrivalActive(s)).toBe(false);expect(s).toMatchObject(baseline);
  });
  it.each(['dan','jian'] as const)('requires rescue, successful practice and informed consent before joining %s',branch=>{
    let s=seekingCheckpoint(true);
    expect(s.stones).toBe(0);expect(s.herbs).toBe(0);expect(s.journey.learning.book).toBe(false);
    expect(joinError(s)).not.toBe('');expect(send(s,{type:'join',branch})).toBe(s);
    expect(send(s,{type:'qiJourney',action:'entry:review'})).toBe(s);
    expect(send(s,{type:'qiJourney',action:'entry:terms'})).toBe(s);
    s=send(s,{type:'qiJourney',action:'entry:rush'});
    expect(s.qiJourney.narrative.initiation.practice).toBe('retry');
    s=send(s,{type:'qiJourney',action:'entry:careful'});
    s=send(s,{type:'qiJourney',action:'entry:review'});
    expect(s.qiJourney.narrative.initiation.witness).toBe('rescue');
    expect(send(s,{type:'join',branch})).toBe(s);
    s=send(s,{type:'qiJourney',action:'entry:terms'});
    const before=s;
    s=send(s,{type:'join',branch});
    expect(s.journey.branch).toBe(branch);expect(s.qiJourney.narrative.initiation.kit).toBe('sect');
    expect(s.month).toBe(before.month);expect(s.stones).toBe(24);expect(s.herbs).toBe(4);
    expect(send(s,{type:'join',branch})).toBe(s);
    s=send(s,{type:'learning',choice:'spring',equip:true});
    expect(s.journey.main).toBe('spring');expect(s.journey.learning.book).toBe(true);
  });
  it('earns an independent kit through a contract and does not claim it again by later joining',()=>{
    let s=seekingCheckpoint();
    s=send(s,{type:'qiJourney',action:'entry:defer'});
    expect(send(s,{type:'qiJourney',action:'entry:contract'})).toBe(s);
    s=send(s,{type:'qiJourney',action:'entry:seek'});
    s=send(s,{type:'qiJourney',action:'entry:careful'});
    s=send(s,{type:'qiJourney',action:'entry:defer'});
    s=send(s,{type:'qiJourney',action:'entry:contract'});
    expect(s.journey.branch).toBe('none');expect(s.stones).toBe(24);expect(s.qiJourney.narrative.initiation.kit).toBe('independent');
    expect(send(s,{type:'qiJourney',action:'entry:contract'})).toBe(s);
    s=send(s,{type:'learning',choice:'breath',equip:true});
    for(const action of ['entry:seek','entry:review','entry:terms'] as const)s=send(s,{type:'qiJourney',action});
    const before=s;s=send(s,{type:'join',branch:'dan'});
    expect(s.journey.branch).toBe('dan');expect(s.stones).toBe(before.stones);expect(s.journey.main).toBe('breath');
  });
  it('keeps acquisition atomic when capacity prevents the initial payment',()=>{
    let s=seekingCheckpoint();
    for(const action of ['entry:careful','entry:review','entry:terms'] as const)s=send(s,{type:'qiJourney',action});
    s.stones=1e9;
    expect(joinError(s)).not.toBe('');expect(dispatch(s,{id:'overflow',type:'join',branch:'dan'})).toBe(s);
    expect(s.journey.branch).toBe('none');expect(s.qiJourney.narrative.initiation.kit).toBe('none');
  });
  it('migrates v42 conservatively and rejects missing fields and future versions',()=>{
    for(const branch of ['none','dan','jian'] as const){
      const s=createGame('旧游','wood',5);s.journey.branch=branch;
      const old=JSON.parse(JSON.stringify(s));old.version=42;delete old.qiJourney.narrative.initiation;
      const frozen=structuredClone(old), n=migrateSave(old);
      expect(old).toEqual(frozen);expect(n.version).toBe(SAVE_VERSION);expect(n.journey).toEqual(s.journey);
      expect(n.qiJourney.narrative.initiation).toEqual({arrival:'legacy',admission:'none',witness:'none',practice:'none',kit:'legacy',last:''});
      expect(validState({...old,version:SAVE_VERSION})).toBe(false);expect(()=>migrateSave({...n,version:SAVE_VERSION+1})).toThrow();
    }
  });
  it('rejects malformed progression, freezes dead choices and blocks busy admission',()=>{
    const s=createGame('验存','wood',42);
    for(const initiation of [null,{}, {...s.qiJourney.narrative.initiation,admission:'pledged'}, {...s.qiJourney.narrative.initiation,kit:'invented'}]) {
      const bad=structuredClone(s);bad.qiJourney.narrative.initiation=initiation as never;
      expect(validState(bad)).toBe(false);expect(()=>migrateSave(bad)).toThrow();
    }
    const dead={...s,status:'dead' as const};expect(dispatch(dead,{id:'dead',type:'qiJourney',action:'entry:unload'})).toBe(dead);
    const busy=seekingCheckpoint();busy.wayfaring.passage={} as never;
    expect(initiationError(busy,'entry:careful')).not.toBe('');
  });
});
