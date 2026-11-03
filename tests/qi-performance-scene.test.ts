// @vitest-environment happy-dom
import { createApp,h,nextTick,shallowRef } from 'vue';
import { expect,it,vi } from 'vitest';
import { createGame,dispatch } from '../src/core';
import { qiSceneSnapshot,qiSceneTransition } from '../src/qi-journey/scene-performance';
import QiWorld from '../src/qi-journey/QiWorld.vue';
import QiJourneyPanel from '../src/qi-journey/QiJourneyPanel.vue';

it('accepted material and refinement changes are distinct; unchanged snapshots and realm changes never replay',()=>{
  const s=createGame('取材','wood');
  const initial=qiSceneSnapshot(s);
  expect(qiSceneTransition(initial,qiSceneSnapshot(s))).toBeUndefined();
  s.qiJourney.essence=true;
  expect(qiSceneTransition(initial,qiSceneSnapshot(s))?.kind).toBe('material');
  const material=qiSceneSnapshot(s);s.qiJourney.essence=false;s.qiJourney.gates=1;
  expect(qiSceneTransition(material,qiSceneSnapshot(s))).toMatchObject({kind:'refine',pose:'meditate'});
  s.realm=1;expect(qiSceneTransition(initial,qiSceneSnapshot(s))).toBeUndefined();
});
it('combat responds to settled turns, not repeated snapshots; snapshot copies nested progress',()=>{
  const s=createGame('交锋','wood');s.qiJourney.node=1;
  s.qiJourney.duel={hp:70,enemy:76,turn:0,effect:'none'};
  const before=qiSceneSnapshot(s);
  s.qiJourney.duel.turn=1;s.qiJourney.duel.effect='strike';
  const after=qiSceneSnapshot(s);
  expect(qiSceneTransition(before,after)).toMatchObject({kind:'exchange',pose:'attack'});
  expect(qiSceneTransition(after,qiSceneSnapshot(s))).toBeUndefined();
  s.qiJourney.preparations[0]!.wander=1;
  expect(before.preparations[0]!.wander).toBe(0);
});
it('load completed material quietly; skip, replacement and unmount leave no timer or game mutations',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
  const s=createGame('收获','wood');s.qiJourney.essence=true;
  const game=shallowRef(s),host=document.createElement('div'),performed=vi.fn();
  const app=createApp({render:()=>h(QiWorld,{game:game.value,onPerformed:performed})});
  app.mount(host);
  try {
    expect(host.querySelector('.field-material')).not.toBeNull();
    expect(host.querySelector('.field-caption')).toBeNull();
    await nextTick();
    const baselineTimers=vi.getTimerCount();
    const next=structuredClone(s);next.qiJourney.essence=false;next.qiJourney.gates=1;
    const serialized=JSON.stringify(next);game.value=next;await nextTick();
    expect(host.querySelector('[data-pose="meditate"]')).not.toBeNull();
    expect(performed).toHaveBeenCalledOnce();
    host.querySelector<HTMLButtonElement>('.field-caption button')!.click();await nextTick();
    expect(host.querySelector('.field-caption')).toBeNull();
    expect(vi.getTimerCount()).toBe(baselineTimers);expect(JSON.stringify(game.value)).toBe(serialized);
    game.value={...next};await nextTick();expect(performed).toHaveBeenCalledOnce();
  } finally {app.unmount();vi.useRealTimers();}
});
it('a rejected command cannot animate; a persisted combat turn displays figures in the world with commands still available',async()=>{
  const s=createGame('交锋','wood');s.qi=120;s.qiJourney.route='medicine';s.qiJourney.node=1;s.qiJourney.vigor=70;
  s.qiJourney.duel={hp:70,enemy:76,turn:0,effect:'none'};
  const game=shallowRef(s),act=vi.fn(),host=document.createElement('div');
  const app=createApp({render:()=>h(QiJourneyPanel,{game:game.value,busy:false,onAct:act})});app.mount(host);
  try {
    expect(host.querySelector('.world-figures .combat-enemy img')).not.toBeNull();
    const strike=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('破绽反击'))!;
    strike.click();await nextTick();expect(act).toHaveBeenCalledOnce();
    expect(host.querySelector('.field-caption')).toBeNull();
    game.value=dispatch(s,{type:'qiJourney',action:'strike',id:'settled-ui-strike'});await nextTick();
    expect(host.querySelector('.combat-field')?.getAttribute('data-phase')).toBe('approach');
    expect(host.textContent).toContain('撤回山下');
  } finally {app.unmount();}
});

it('a completed preparation trial takes priority over the return to town',()=>{
 const s=createGame('历练','wood');s.qiJourney.node=1;s.qiJourney.preparations[0]!.wander=2;
 const before=qiSceneSnapshot(s);s.qiJourney.node=0;s.qiJourney.preparations[0]!.wander=3;
 expect(qiSceneTransition(before,qiSceneSnapshot(s))).toMatchObject({kind:'prepare',label:'历练已成，准备入境'});
});
it('reduced motion shows the final material without a performance',async()=>{
 const original=window.matchMedia;
 window.matchMedia=vi.fn().mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()});
 const game=shallowRef(createGame('静态','wood')),host=document.createElement('div'),performed=vi.fn();
 const app=createApp({render:()=>h(QiWorld,{game:game.value,onPerformed:performed})});app.mount(host);
 try {const next=structuredClone(game.value);next.qiJourney.essence=true;game.value=next;await nextTick();expect(host.querySelector('.field-material')).not.toBeNull();expect(host.querySelector('.field-caption')).toBeNull();expect(performed).not.toHaveBeenCalled();}
 finally {app.unmount();window.matchMedia=original;}
});

it('首战真实胜利节点显示结果，不根据消失的决斗推测最后伤害',()=>{
 const s=createGame('初胜','wood');s.qiJourney.node=1;s.qiJourney.duel={hp:30,enemy:3,turn:2,effect:'guard'};
 const before=qiSceneSnapshot(s);s.qiJourney.node=2;s.qiJourney.duel=null;
 expect(qiSceneTransition(before,qiSceneSnapshot(s))).toMatchObject({kind:'victory',pose:'idle'});
 const loaded=qiSceneSnapshot(s);expect(qiSceneTransition(loaded,loaded)).toBeUndefined();
 s.qiJourney.node=0;expect(qiSceneTransition(before,qiSceneSnapshot(s))?.kind).not.toBe('victory');
});
