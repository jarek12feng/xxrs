// @vitest-environment happy-dom
import {createApp,h,nextTick,shallowRef} from 'vue';
import {expect,it,vi} from 'vitest';
import BattleStage from '../src/expedition/BattleStage.vue';
import {freshExpedition,type Expedition} from '../src/expedition/rules';
it('旧战报只呈现状态，新一招及终局才播放，Esc不修改战果',async()=>{
 vi.useFakeTimers();
 const quest=shallowRef<Expedition>({...freshExpedition(),attempts:1,effect:'strike' as const,duel:{hp:30,enemy:40,turn:2}});
 const host=document.createElement('div');
 const app=createApp({render:()=>h(BattleStage,{quest:quest.value,gender:'male',realm:0,foe:'蚀阵傀儡'})});app.mount(host);
 try{
  expect(host.querySelector('.battle-stage')?.classList.contains('strike')).toBe(false);
  quest.value={...quest.value,duel:{hp:28,enemy:32,turn:3}};await nextTick();
  expect(host.querySelector('.battle-stage')?.classList.contains('strike')).toBe(true);
  const saved=JSON.stringify(quest.value);window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await nextTick();
  expect(JSON.stringify(quest.value)).toBe(saved);expect(host.querySelector('.battle-stage')?.classList.contains('strike')).toBe(false);
  await vi.advanceTimersByTimeAsync(2000);expect(host.querySelector('.battle-stage')?.classList.contains('strike')).toBe(false);
  quest.value={...quest.value,duel:null,effect:'win',cleared:1};await nextTick();
  expect(host.querySelector('.battle-stage')?.classList.contains('win')).toBe(true);
  await vi.advanceTimersByTimeAsync(1000);expect(host.querySelector('.battle-stage')?.classList.contains('win')).toBe(false);
  expect(host.textContent).toContain('关卡完成');
 }finally{app.unmount();vi.useRealTimers();}
});
