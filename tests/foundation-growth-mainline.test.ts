import { finishPactTrial } from './foundation-pact-policy';
import { expect, it } from 'vitest';
import { dispatch, validState, migrateSave, createGame } from '../src/core';
import { freshSocial } from '../src/social';
import { applyHeroine, freshHeroine } from '../src/foundation-journey/heroine';
import { foundationCap } from '../src/foundation-journey/growth-state';
import { journeyCheckpoint, journeyPlayer } from '../tools/foundation-journey-checkpoint';
import { growthQuote, routeInfo } from '../src/foundation-journey/growth';
import { journeyActionError } from '../src/foundation-journey/progression';
import { foundationGoal } from '../src/foundation-journey/progression';
import { journeyOptions } from '../src/foundation-journey/view';
import type { ResourceRoute } from '../src/foundation-journey/growth-state';
it.each([true,false])('meeting text respects whether guard was already learned: %s',known=>{
 const s=createGame('行旅','wood',42);s.herbs=5;
 s.journey.known=known?['guard']:[];
 applyHeroine(s,{kind:'meetHeroine',method:'supplies'});
 expect(s.journey.known.filter(x=>x==='guard')).toHaveLength(1);
 expect(s.foundationJourney.last.includes('习得护身诀')).toBe(!known);
 expect(s.herbs).toBe(1);
});
it('updates the reunion goal when the agreed three months have elapsed', () => {
 const s=journeyCheckpoint('male',false);
 const q=s.foundationJourney;
 q.heroine.purpose='longevity';q.heroine.map='public';q.contact='letters';q.reunion=false;q.whereabouts='away';q.departedAt=s.month;
 expect(foundationGoal(s)).toContain('还需 3 个月');
 s.month+=2;
 expect(foundationGoal(s)).toContain('还需 1 个月');
 expect(journeyActionError(s,{kind:'reunion'})).not.toBe('');
 s.month++;
 expect(journeyActionError(s,{kind:'reunion'})).toBe('');
 expect(foundationGoal(s)).toContain('约定的重逢之期已到');
 expect(foundationGoal(s)).not.toContain('三个月后');
});
function play(route: ResourceRoute, technique: 'spring'|'blade'|'breath') {
 const p=journeyPlayer(journeyCheckpoint('male',false,technique==='blade'?'sword':'wood',technique));
 const fund=()=>{while(p.state.stones<90)p.send({type:'advance',activity:'work',months:12});while(p.state.herbs<15)p.send({type:'supplies'});};
 p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique});p.fight('application');
 expect(foundationCap(p.state)).toBe(399);
 p.cultivate(200);p.fight('exit');p.act({kind:'ferryOutcome',outcome:'escort'});
 p.act({kind:'travel',destination:route});fund();
 p.act({kind:'routePrepare',route,method:'service'});p.act({kind:'routeChoose',route,choice:'careful'});
 if(route==='estate'){p.act({kind:'sideInvestigate',side:'estate'});p.fight('estate');}
 p.fight(routeInfo[route].foe);
 expect(p.state.foundationJourney.heroine.supplied).toBe(false);
 fund();p.act({kind:'routeProcess',route,method:'self'});
 expect(foundationCap(p.state)).toBe(399);
 finishPactTrial(p);
 expect(foundationCap(p.state)).toBe(599);
 expect(p.state.foundationJourney.heroine.route).toBe(route);
 p.act({kind:'travel',destination:'home'});p.act({kind:'mapPlan',plan:'detour'});
 p.act({kind:'contact',contact:'letters'});p.act({kind:'depart'});p.cultivate(400);p.act({kind:'reunion'});
 expect(p.state.foundationJourney.reunion).toBe(true);expect(p.state.social.bonded).toBe(false);
 p.act({kind:'expeditionPlan'});p.act({kind:'travel',destination:'frontier'});p.act({kind:'report'});p.act({kind:'signal'});
 if(route==='frontier'){
  const old=p.state.foundationJourney.won.length;p.act({kind:'supply'});expect(p.state.foundationJourney.won).toHaveLength(old);
 }else p.fight('frontier');
 expect(p.state.foundationJourney.heroine.supplied).toBe(true);
 p.act({kind:'mentor'});p.fight('rescue');p.cultivate(500);p.act({kind:'finish'});p.fight('culmination');p.cultivate(600);p.act({kind:'travel',destination:'home'});p.act({kind:'epilogue'});
 return p.state;
}
it.each(['estate','snow','frontier'] as const)('male %s route completes heroine rescue without romance, sect or rank',route=>{
 for(const main of ['spring','blade','breath'] as const){
  const s=play(route,main);
  expect(validState(s)).toBe(true);expect(s.foundationJourney.epilogue).toBe(true);expect(s.foundationJourney.target).toBe('companion');
  expect(s.foundationJourney.whereabouts).toBe('rescued');expect(s.social.bonded).toBe(false);expect(s.foundationJourney.bond).toBe('none');
  expect(s.foundationJourney.last).toContain('苏婉宁');expect(s.foundationJourney.board.wins).toEqual([]);
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  expect(Math.min(s.stones,s.herbs)).toBeGreaterThanOrEqual(0);
 }
});
it('replays the same actions deterministically',()=>expect(play('snow','blade')).toEqual(play('snow','blade')));
it('can meet through shared work as a minor, but cannot confess or skip the heroine',()=>{
 const s=journeyCheckpoint();s.social=freshSocial('male');s.foundationJourney.heroine=freshHeroine();s.age=200;s.month=8;
 const skip=dispatch(s,{id:'skip',type:'foundationJourney',action:{kind:'travel',destination:'ferry'}});expect(skip).toBe(s);
 const n=dispatch(s,{id:'meet',type:'foundationJourney',action:{kind:'meetHeroine',method:'insight'}});
 expect(n.social.met).toBe(true);expect(n.social.answers.meet).toBe('bridge');expect(n.social.bonded).toBe(false);expect(validState(n)).toBe(true);
 expect(dispatch(n,{id:'love',type:'confess'})).toBe(n);
 expect(dispatch(n,{id:'again',type:'foundationJourney',action:{kind:'meetHeroine',method:'insight'}})).toBe(n);
});
it('blocks meditation at each earned cap and never charges extra months at the first bottleneck',()=>{
 const s=journeyCheckpoint();s.foundationJourney.cultivation=199;
 const n=dispatch(s,{id:'cap',type:'advance',activity:'cultivate',months:12});expect(n).toBe(s);
 expect(foundationGoal(s)).toContain('无名渡');
 const p=journeyPlayer(journeyCheckpoint('female',true));p.cultivate(599);const cap=p.state;
 expect(dispatch(cap,{id:'full',type:'advance',activity:'cultivate',months:12})).toBe(cap);
 p.fight('culmination');expect(foundationCap(p.state)).toBe(600);
});
it('interrupts multi-month preparation on death without spending materials or granting the result',()=>{
 const s=journeyCheckpoint('male',true);s.foundationJourney.growth.steady='none';s.foundationJourney.rescue=2;s.foundationJourney.won=s.foundationJourney.won.filter(x=>x!=='rescue');s.foundationJourney.whereabouts='shelter';s.foundationJourney.condensation=false;
 s.age=s.limit-1;
 const n=dispatch(s,{id:'last',type:'foundationJourney',action:{kind:'steadyStudy',method:'practice'}});
 expect(n.status).toBe('dead');expect(n.stones).toBe(s.stones);expect(n.foundationJourney.growth.steadyStudy).toBe('none');
});
it('allows explicit adult romance after shared journey, without generic memory farming',()=>{
 const p=journeyPlayer(journeyCheckpoint('male',true));p.act({kind:'travel',destination:'home'});
 p.send({type:'confess'});expect(p.state.social.scene?.kind).toBe('pledge');
 p.send({type:'choose',instanceId:p.state.social.scene!.id,option:'yes'});
 p.act({kind:'propose'});p.act({kind:'covenant'});
 expect(p.state.foundationJourney.bond).toBe('covenant');expect(validState(p.state)).toBe(true);
});
it('rejects corrupt earned milestones and does not silently import old foundation runs',()=>{
 const s=journeyCheckpoint();const old={...s,version:21};expect(()=>migrateSave(old)).toThrow();expect(old.version).toBe(21);
 for(const update of [(n:typeof s)=>n.foundationJourney.growth.refined=true,(n:typeof s)=>n.foundationJourney.heroine.supplied=true,(n:typeof s)=>n.foundationJourney.cultivation=200]){
  const n=structuredClone(s);update(n);expect(validState(n)).toBe(false);
 }
 const qi=createGame('存档','wood');const legacy={...qi,version:21};expect(migrateSave(legacy).version).toBe(qi.version);
});

it('does not grant a preparation result when death interrupts its final month', () => {
 const s=journeyCheckpoint('male',true);
 const q=s.foundationJourney;
 q.growth.steady='none';q.rescue=2;q.won=q.won.filter(x=>x!=='rescue');q.whereabouts='shelter';q.condensation=false;
 const action={kind:'steadyStudy',method:'practice'} as const;
 const quote=growthQuote(s,action);
 expect(quote.error).toBe('');
 expect(quote.months).toBeGreaterThan(1);
 s.age=s.limit-quote.months;
 const snapshot=structuredClone(s);
 const n=dispatch(s,{id:'final-preparation-month',type:'foundationJourney',action});
 expect(n.month-s.month).toBe(quote.months);
 expect(n.status).toBe('dead');
 expect(n.foundationJourney.growth.steadyStudy).toBe('none');
 expect(n.stones).toBe(s.stones);
 expect(n.herbs).toBe(s.herbs);
 expect(s).toEqual(snapshot);
 expect(dispatch(structuredClone(s),{id:'final-preparation-month',type:'foundationJourney',action})).toEqual(n);
});

it.each(['medicine', 'supplies'] as const)('does not consume the one-time rank gift when %s storage is full', reward => {
 const s=journeyCheckpoint('female',true);
 s.foundationJourney.board.wins=['rank1','rank2','rank3'];
 s.foundationJourney.growth.rankGift=false;
 if(reward==='medicine')s.workshop.ward=1e9-1;
 else s.herbs=1e9-3;
 const action={kind:'rankGift',reward} as const;
 expect(journeyOptions(s,'journey').find(x=>x.action.kind==='rankGift' && x.action.reward===reward)?.error).toBe('资源超过可保存上限');
 const snapshot=structuredClone(s);
 expect(dispatch(s,{type:'foundationJourney',action,id:'rank-capacity'})).toBe(s);
 expect(s).toEqual(snapshot);
 if(reward==='medicine')s.workshop.ward--;
 else s.herbs--;
 const n=dispatch(s,{type:'foundationJourney',action,id:'rank-capacity'});
 expect(n.foundationJourney.growth.rankGift).toBe(true);
 expect(reward==='medicine'?n.workshop.ward:n.herbs).toBe(1e9);
 expect(dispatch(n,{type:'foundationJourney',action,id:'other-rank-gift'})).toBe(n);
});
