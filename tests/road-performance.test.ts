import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {expect,it,vi} from 'vitest';
import {createApp,h,nextTick,shallowRef} from 'vue';
import {dispatch,passSolutions} from "../src/core";
import {mistCheckpoint} from '../tools/mist-checkpoint';
import {roadSceneSnapshot,roadSceneTransition,roadWorldState} from '../src/scene2d/road-performance';
import RoadWorld from '../src/scene2d/RoadWorld.vue';

it.each(['medicine','sword','array'] as const)('accepted %s outcome survives the pass-to-beyond transition and does not replay',key=>{
 const s=createGame('归路','wood');s.adventure.road.stage='pass';
 const before=roadSceneSnapshot(s);Object.assign(s.adventure.road,{stage:'beyond',passed:true,solution:key});
 const after=roadSceneSnapshot(s);
 expect(roadSceneTransition(before,after)).toBeDefined();
 expect(roadSceneTransition(after,roadSceneSnapshot(s))).toBeUndefined();
 expect(roadWorldState(s).route).toBe(key);
 s.adventure.road.stage='camp';expect(roadWorldState(s).route).toBe('none');
});
it('observation and rejected success do not change the field; public command creates the saved route',()=>{
 let s=mistCheckpoint(42,'wood','male',true);
 const initial=roadSceneSnapshot(s);
 s=dispatch(s,{type:'road',action:passSolutions.medicine.prepare,id:'scene-observe'});
 expect(roadSceneTransition(initial,roadSceneSnapshot(s))).toBeUndefined();
 const rejected=dispatch({...s,herbs:0},{type:'road',action:passSolutions.medicine.finish,id:'scene-failed'});
 expect(rejected.adventure.road.passed).toBe(false);
 const next=dispatch(s,{type:'road',action:passSolutions.medicine.finish,id:'scene-completed'});
 expect(next.adventure.road.passed).toBe(true);
 expect(roadSceneTransition(roadSceneSnapshot(s),roadSceneSnapshot(next))?.label).toContain('镇风草');
});
it('loading a completed route is quiet, skip preserves it, unmount cancels its timer',async()=>{
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
 const s=createGame('归路','wood');Object.assign(s.adventure.road,{stage:'pass',passed:true,solution:'array'});
 const game=shallowRef(s),host=document.createElement('div');
 const app=createApp({render:()=>h(RoadWorld,{game:game.value})});app.mount(host);await nextTick();
 const timers=vi.getTimerCount();
 try {
  expect(host.querySelector('.restored-array')).not.toBeNull();expect(host.querySelector('.road-cue')).toBeNull();
  const next=structuredClone(s);next.adventure.road.stage='lookout';game.value=next;await nextTick();
  const recorded=structuredClone(next);recorded.adventure.road.surveyed=true;game.value=recorded;await nextTick();
  expect(host.querySelector('.road-cue')).not.toBeNull();
  host.querySelector<HTMLButtonElement>('.road-cue button')!.click();await nextTick();
  expect(host.querySelector('.restored-array')).not.toBeNull();expect(host.querySelector('.road-cue')).toBeNull();
  expect(vi.getTimerCount()).toBe(timers);
 } finally {app.unmount();vi.useRealTimers();}
});
