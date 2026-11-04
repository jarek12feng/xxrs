import { expect, it } from 'vitest';
import { createGame, dispatch, type State, type Intent } from '../src/core';
import { storyRoute, storyLocation } from '../src/wayfaring/story-routes';
import { journeyCheckpoint } from '../tools/foundation-journey-checkpoint';
function travel(s:State,intent:Intent) {
  const before=structuredClone(s), route=storyRoute(s,intent)!;
  expect(route).not.toBeNull();
  expect(route.error).toBe('');
  expect(s).toEqual(before);
  const next=dispatch(s,{...intent,id:`route-${s.seen.length}`});
  expect(next.month-s.month).toBe(route.months);
  expect(storyLocation(next,route.domain)).toBe(route.to);
  return next;
}
it.each(['medicine','sect','wander'] as const)('maps %s trial and retreat without charging twice', route=>{
  let s=createGame('行程测试','wood');
  s.adventure.step='done';s.qi=150;s.journey.known=['spring'];s.journey.main='spring';
  s.qiJourney.preparations[0]![route]=2;
  s=travel(s,{type:'qiJourney',action:`prep:${route}:trial`});
  expect(s.qiJourney.trial).toBe(route);
  s=travel(s,{type:'qiJourney',action:'withdraw'});
  expect(s.qiJourney.preparations[0]![route]).toBe(2);
});
it('maps travel to the required estate; local entry and division do not create a second journey',()=>{
  let s=journeyCheckpoint();
  s.foundationJourney.location='frontier';s.foundationJourney.cultivation=200;
  s.foundationJourney.ferry=4;s.foundationJourney.won.push('frontier');s.secretPact.stage='promised';
  s=travel(s,{type:'wayfaring',action:{kind:'visit',site:'zhaoxuan'}});
  expect(s.secretPact.site).toBe('zhaoxuan');
  expect(storyRoute(s,{type:'secretPact',action:'enterLight'})).toBeNull();
  expect(storyRoute(s,{type:'secretPact',action:'leave'})).toBeNull();
});
it('forfeiting remaining contest matches is not leaving the venue',()=>{
  let s=journeyCheckpoint();s.journey.branch='dan';s.sectContest.stage='invited';s.sectContest.starts=s.month;
  s=travel(s,{type:'sectContest',action:{kind:'enter'}});
  expect(storyRoute(s,{type:'sectContest',action:{kind:'leave'}})).toBeNull();
  s=dispatch(s,{id:'forfeit',type:'sectContest',action:{kind:'leave'}});
  s=travel(s,{type:'sectContest',action:{kind:'leave'}});
  expect(s.sectContest.stage).toBe('deferred');
});
it('escort departure enters the actual encounter; withdrawal retains earned progress',()=>{
  let s=createGame('护送','wood');s.adventure.step='done';s.adventure.road.map=true;
  s.adventure.road.stage='camp';s.expedition.accepted=true;s.stones=10;
  s=travel(s,{type:'expedition',action:'enter'});
  expect(s.stones).toBe(8);
  s=travel(s,{type:'expedition',action:'withdraw'});
  expect(s.stones).toBe(8);
});
it('optional exploration maps only departure, not the local rescue decision',()=>{
  let s=createGame('探访','wood');s.story.stage='waiting';
  s=travel(s,{type:'explore',place:'valley'});
  expect(storyRoute(s,{type:'explore',place:'valley',approach:'rescue'})).toBeNull();
});
it('invalid departures keep the domain error and cannot announce arrival',()=>{
  const s=createGame('不可出发','wood');
  const intent:Intent={type:'wayfaring',action:{kind:'visit',site:'zhaoxuan'}};
  const route=storyRoute(s,intent)!;
  expect(route.error).not.toBe('');
  const next=dispatch(s,{...intent,id:'blocked'});
  expect(storyLocation(next,route.domain)).not.toBe(route.to);
  expect(next).toEqual(s);
});
it('reading the lamp record includes the authored return from the archive',()=>{
  const s=createGame('归途','wood');s.adventure.mist.stage='archive';
  expect(storyRoute(s,{type:'mist',action:'read'})).toMatchObject({from:'archive',to:'home',months:0});
});
