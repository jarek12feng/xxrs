// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { createGame } from '../src/core';
import FoundationWorld from '../src/foundation-journey/FoundationWorld.vue';
import { foundationCompanionPresent, foundationSceneSnapshot, foundationSceneTransition } from '../src/foundation-journey/scene-performance';
afterEach(()=>vi.useRealTimers());
function initial(){const s=createGame('行者','wood',42);s.realm=1;s.social.gender='male';return s;}
it('presence follows location and whereabouts, never a missing or inside-well companion',()=>{
 const s=initial();expect(foundationCompanionPresent(s,'journey')).toBe(true);
 s.foundationJourney.whereabouts='missing';expect(foundationCompanionPresent(s,'journey')).toBe(false);
 s.foundationJourney.whereabouts='home';s.foundationJourney.location='ferry';s.foundationJourney.heroine.meeting='strength';
 expect(foundationCompanionPresent(s,'journey')).toBe(true);s.foundationJourney.ferry=2;expect(foundationCompanionPresent(s,'journey')).toBe(false);
 s.foundationJourney.location='frontier';s.foundationJourney.rescue=4;s.foundationJourney.whereabouts='rescued';expect(foundationCompanionPresent(s,'journey')).toBe(true);
 expect(foundationCompanionPresent(s,'board')).toBe(false);
});
it('only persisted milestone edges in the same location produce performance',()=>{
 const s=initial(),a=foundationSceneSnapshot(s);s.foundationJourney.heroine.meeting='strength';const b=foundationSceneSnapshot(s);
 expect(foundationSceneTransition(a,b)).toBe('meeting');expect(foundationSceneTransition(b,b)).toBeUndefined();
 expect(foundationSceneTransition(a,{...b,location:'ferry'})).toBeUndefined();
 expect(foundationSceneTransition(a,{...b,duel:true})).toBeUndefined();
 expect(foundationSceneTransition({...a,rescued:false},{...b,rescued:true})).toBe('rescue');
});
function mount(s=initial()){
 const state=shallowRef(s),host=document.createElement('div');document.body.append(host);
 const app=createApp({render:()=>h(FoundationWorld,{game:state.value,mode:'journey'})});app.mount(host);
 return {state,host,close(){app.unmount();host.remove();}};
}
it('initial saves do not replay; saved changes change poses and skip leaves state intact',async()=>{
 vi.useFakeTimers();const s=initial();s.foundationJourney.heroine.meeting='strength';const view=mount(s);
 try {expect(view.host.querySelector('[role=status]')).toBeNull();
 const next=structuredClone(s);next.foundationJourney.heroine.map='public';const before=structuredClone(next);view.state.value=next;await nextTick();
 expect(view.host.textContent).toContain('撤下旧刻样');expect(view.host.querySelector('.performance-prop img')).not.toBeNull();
 vi.advanceTimersByTime(850);await nextTick();expect(view.host.textContent).toContain('重订路图');
 vi.advanceTimersByTime(850);await nextTick();expect(view.host.textContent).toContain('收好副图');
 view.host.querySelector<HTMLButtonElement>('button')!.click();await nextTick();expect(view.host.querySelector('[role=status]')).toBeNull();
 vi.runAllTimers();await nextTick();expect(view.state.value).toEqual(before);expect(vi.getTimerCount()).toBe(0);
 }finally{view.close();}
});
it('unmount and location change cancel playback timers',async()=>{
 vi.useFakeTimers();const view=mount();const next=structuredClone(view.state.value);next.foundationJourney.heroine.meeting='strength';view.state.value=next;await nextTick();expect(vi.getTimerCount()).toBe(1);
 const moved=structuredClone(next);moved.foundationJourney.location='ferry';view.state.value=moved;await nextTick();expect(vi.getTimerCount()).toBe(0);
 moved.foundationJourney.inheritance='blade';view.state.value=structuredClone(moved);await nextTick();expect(vi.getTimerCount()).toBe(1);view.close();expect(vi.getTimerCount()).toBe(0);
});
it('reduced motion displays saved final scene without a timer',async()=>{
 vi.useFakeTimers();const previous=window.matchMedia;window.matchMedia=vi.fn().mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()});
 const view=mount();try{const next=structuredClone(view.state.value);next.foundationJourney.heroine.map='public';view.state.value=next;await nextTick();expect(view.host.querySelector('[role=status]')).toBeNull();expect(vi.getTimerCount()).toBe(0);expect(view.host.querySelector('.foundation-companion')?.getAttribute('src')).toContain('-travel');}finally{view.close();window.matchMedia=previous;}
});
it('all supported milestones map to their own effects without replaying unrelated changes',()=>{
 const a=foundationSceneSnapshot(initial());
 expect(foundationSceneTransition(a,{...a,map:'public'})).toBe('map');
 expect(foundationSceneTransition(a,{...a,inheritance:'spring'})).toBe('inherit');
 expect(foundationSceneTransition(a,{...a,refined:true})).toBe('refine');
 expect(foundationSceneTransition(a,{...a,supplied:true})).toBe('supply');
 expect(foundationSceneTransition(a,{...a})).toBeUndefined();
});
it('leaving the page cancels the timeline and returning does not replay it',async()=>{
 vi.useFakeTimers();const view=mount();const visibility=Object.getOwnPropertyDescriptor(document,'hidden');
 try {const next=structuredClone(view.state.value);next.foundationJourney.heroine.meeting='strength';view.state.value=next;await nextTick();
 Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));await nextTick();expect(vi.getTimerCount()).toBe(0);expect(view.host.querySelector('[role=status]')).toBeNull();
 Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));await nextTick();expect(view.host.querySelector('[role=status]')).toBeNull();
 }finally{view.close();if(visibility)Object.defineProperty(document,'hidden',visibility);else delete (document as unknown as {hidden?:boolean}).hidden;}
});
it.each([
 ['estate','estateFlow','.estate-channel','老根下的细渠露出'],
 ['snow','snowLine','.snow-guide','绳槽接起西门留引'],
 ['ferry','wellOpen','.well-opening','石偶垂下手臂'],
 ['frontier','circulation','.settled-circulation','三股乱流归于一息'],
] as const)('saved %s victory leaves persistent scenery after skipping and reloading',async(location,kind,selector,label)=>{
 vi.useFakeTimers();const s=initial();s.foundationJourney.location=location;
 const view=mount(s);
 const completed=structuredClone(s);
 if(location==='estate'||location==='snow')completed.foundationJourney.sides[location].step=2;
 if(location==='ferry')completed.foundationJourney.ferry=2;
 if(location==='frontier')completed.foundationJourney.won.push('culmination');
 try {
 expect(view.host.querySelector(selector)).toBeNull();
 expect(foundationSceneTransition(foundationSceneSnapshot(s),foundationSceneSnapshot(completed))).toBe(kind);
 view.state.value=completed;await nextTick();expect(view.host.textContent).toContain(label);expect(view.host.querySelector(selector)).not.toBeNull();
 view.host.querySelector<HTMLButtonElement>('button')!.click();await nextTick();expect(vi.getTimerCount()).toBe(0);expect(view.host.querySelector(selector)).not.toBeNull();
 const moved=structuredClone(completed);moved.foundationJourney.location='home';view.state.value=moved;await nextTick();expect(view.host.querySelector(selector)).toBeNull();
 view.state.value=completed;await nextTick();expect(view.host.querySelector(selector)).not.toBeNull();expect(view.host.querySelector('[role=status]')).toBeNull();
 }finally{view.close();}
 const loaded=mount(completed);try{expect(loaded.host.querySelector(selector)).not.toBeNull();expect(loaded.host.querySelector('[role=status]')).toBeNull();expect(vi.getTimerCount()).toBe(0);}finally{loaded.close();}
});
it('unwon battle exit cannot open a site; completed well does not follow the player back to the ferry',async()=>{
 const s=initial();s.foundationJourney.location='ferry';s.foundationJourney.ferry=1;
 const before=foundationSceneSnapshot(s);
 expect(foundationSceneTransition({...before,duel:true},before)).toBeUndefined();
 s.foundationJourney.ferry=3;const view=mount(s);try{expect(view.host.querySelector('.well-opening')).toBeNull();}finally{view.close();}
});
