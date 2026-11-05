import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from 'vue';
import { expect, it } from 'vitest';
import { dispatch, type Intent } from "../src/core";
import { useStoryTravel } from '../src/wayfaring/useStoryTravel';
it('only published arrival starts playback; unchanged saves and interrupted commands stay at origin',async()=>{
  const s=createGame('抵达验证','wood');s.adventure.step='done';s.adventure.road.map=true;
  s.adventure.road.stage='camp';s.expedition.accepted=true;s.stones=10;
  const game=shallowRef(s);let sent:Intent|undefined;
  let travel!:ReturnType<typeof useStoryTravel>;
  const el=document.createElement('div');
  const app=createApp({setup(){travel=useStoryTravel(()=>game.value,()=>false,i=>{sent=i;});return()=>h('div');}});
  app.mount(el);
  try {
    travel.act({type:'expedition',action:'enter'});
    expect(sent).toBeUndefined();
    travel.depart();
    expect(sent).toEqual({type:'expedition',action:'enter'});
    expect(travel.arrived.value).toBe(false);
    game.value=structuredClone(s);await nextTick();
    expect(travel.arrived.value).toBe(false);
    game.value=dispatch(s,{...sent!,id:'depart'});await nextTick();
    expect(travel.arrived.value).toBe(true);
    const saved=game.value;
    travel.close();await nextTick();
    expect(game.value).toBe(saved);
  } finally {app.unmount();}
});
it('global travel owns event routes and plays an already-settled arena return without dispatch',async()=>{
  const {journeyCheckpoint}=await import('../tools/foundation-journey-checkpoint');
  const initial=journeyCheckpoint();initial.injury=0;initial.social.arena.scouted=[0];initial.stones=30;
  const game=shallowRef(initial);const sent:Intent[]=[];
  let travel!:ReturnType<typeof useStoryTravel>;
  const app=createApp({setup(){travel=useStoryTravel(()=>game.value,()=>false,i=>{sent.push(i);},true);return()=>h('div');}});
  app.mount(document.createElement('div'));
  try {
    travel.act({type:'arenaStart'});expect(sent).toHaveLength(0);
    travel.depart();expect(sent).toHaveLength(1);
    game.value=dispatch(game.value,{type:'arenaStart',id:'start'});await nextTick();
    expect(travel.arrived.value).toBe(true);travel.close();
    game.value=dispatch(game.value,{type:'arenaWithdraw',id:'end'});await nextTick();
    expect(travel.route.value?.path).toEqual(['site','home']);
    expect(travel.arrived.value).toBe(true);expect(sent).toHaveLength(1);
  } finally {app.unmount();}
});
it('a saved sea retreat is owned once by the global map and cannot dispatch a second departure',async()=>{
  const {outerSeaCheckpoint}=await import('../tools/outer-sea-checkpoint');
  const initial=outerSeaCheckpoint();initial.outerSea.location='ruins';
  initial.outerSea.duel={depth:1,hp:90,enemy:90,turn:0,effect:'none'};
  const game=shallowRef(initial), sent:Intent[]=[];
  let global!:ReturnType<typeof useStoryTravel>,chapter!:ReturnType<typeof useStoryTravel>;
  const app=createApp({setup(){
    global=useStoryTravel(()=>game.value,()=>false,i=>{sent.push(i);},true);
    chapter=useStoryTravel(()=>game.value,()=>false,i=>{sent.push(i);});
    return()=>h('div');
  }});
  app.mount(document.createElement('div'));
  try {
    const settled=dispatch(initial,{type:'outerSea',action:{kind:'withdraw'},id:'sea-return'});
    expect(global.route.value).toBeNull();
    game.value=settled;await nextTick();
    expect(global.route.value?.path).toEqual(['ruins','ferry']);expect(global.arrived.value).toBe(true);
    expect(chapter.route.value).toBeNull();
    global.depart();expect(sent).toHaveLength(0);
    global.close();await nextTick();expect(game.value).toBe(settled);
    expect(global.route.value).toBeNull();expect(sent).toHaveLength(0);
  }finally{app.unmount();}
});
