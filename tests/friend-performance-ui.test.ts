// @vitest-environment happy-dom
import {createApp,h,shallowRef,nextTick} from 'vue';
import {it,expect,vi,afterEach} from 'vitest';
import {useVisitPerformance} from '../src/friend-journey/use-visit-performance';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('只在已保存探望变化后展开、指图、回应；略过与卸载清理计时，不重放读档',async()=>{
 vi.useFakeTimers();
 const saved=shallowRef<number|null>(null),present=shallowRef(true);
 let performance!:ReturnType<typeof useVisitPerformance>;
 const host=document.createElement('div');
 const app=createApp({setup(){performance=useVisitPerformance(()=>saved.value,()=>present.value);return()=>h('span',performance.phase.value);}});
 app.mount(host);expect(host.textContent).toBe('idle');
 saved.value=10;await nextTick();expect(host.textContent).toBe('unfold');
 await vi.advanceTimersByTimeAsync(850);expect(host.textContent).toBe('trace');
 await vi.advanceTimersByTimeAsync(1300);expect(host.textContent).toBe('acknowledge');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await nextTick();expect(host.textContent).toBe('idle');expect(saved.value).toBe(10);await vi.advanceTimersByTimeAsync(10000);expect(host.textContent).toBe('idle');
 performance.replay();await nextTick();expect(host.textContent).toBe('unfold');expect(saved.value).toBe(10);app.unmount();await vi.advanceTimersByTimeAsync(10000);expect(performance.phase.value).toBe('idle');
 const reload=createApp({setup(){const p=useVisitPerformance(()=>saved.value,()=>true);return()=>h('span',p.phase.value);}});
 reload.mount(host);expect(host.textContent).toBe('idle');reload.unmount();await vi.advanceTimersByTimeAsync(10000);expect(performance.phase.value).toBe('idle');
});
it('人物离场与组件卸载取消演出，减少动态直接保留结果',async()=>{
 vi.useFakeTimers();const saved=shallowRef<number|null>(null),present=shallowRef(true);
 let p!:ReturnType<typeof useVisitPerformance>;
 const app=createApp({setup(){p=useVisitPerformance(()=>saved.value,()=>present.value);return()=>h('span',p.phase.value);}});
 app.mount(document.createElement('div'));saved.value=1;await nextTick();expect(p.phase.value).toBe('unfold');present.value=false;await nextTick();expect(p.phase.value).toBe('idle');expect(vi.getTimerCount()).toBe(0);app.unmount();
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:true,addEventListener(){},removeEventListener(){}} as unknown as MediaQueryList);
 saved.value=null;const reduced=createApp({setup(){p=useVisitPerformance(()=>saved.value,()=>true);return()=>h('span');}});reduced.mount(document.createElement('div'));saved.value=2;await nextTick();expect(p.phase.value).toBe('idle');reduced.unmount();expect(vi.getTimerCount()).toBe(0);
});
