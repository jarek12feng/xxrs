// @vitest-environment happy-dom
import {createApp,h,shallowRef,nextTick} from 'vue';
import {afterEach,it,expect,vi} from 'vitest';
import PathTraveler from '../src/presentation/movement/PathTraveler.vue';
let cleanup=()=>{};
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
function mount(){
 const callbacks=new Map<number,FrameRequestCallback>();let serial=0,now=0;
 vi.spyOn(performance,'now').mockImplementation(()=>now);
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{callbacks.set(++serial,callback);return serial;});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>callbacks.delete(id));
 const events=new EventTarget(),media={matches:false,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events)};
 vi.spyOn(window,'matchMedia').mockReturnValue(media as MediaQueryList);
 const progress=shallowRef(0),count=shallowRef(0),finished=vi.fn(()=>{count.value++;}),host=document.createElement('div');
 let actor:any;
 const app=createApp({render:()=>h('svg',{'data-finishes':count.value},[h(PathTraveler,{ref:(value:unknown)=>{actor=value;},points:[{x:0,y:0},{x:100,y:0}],image:'/hero.png',mode:'walk',playing:true,progress:progress.value,duration:1000,onFinished:finished})])});
 app.mount(host);cleanup=()=>app.unmount();
 const tick=async(time:number)=>{now=time;const list=[...callbacks.values()];callbacks.clear();list.forEach(cb=>cb(time));await nextTick();};
 return {host,progress,finished,callbacks,media,events,tick,get actor(){return actor;}};
}
it('旅行暂停/后台保留脚点且不补跑离线时间，换路线撤销迟到帧，完成只通知一次',async()=>{
 const s=mount();await s.tick(200);expect(s.host.querySelector('g')?.getAttribute('transform')).toBe('translate(20 0)');
 s.actor.pause();await s.tick(800);expect(s.finished).not.toHaveBeenCalled();
 s.actor.pause();await s.tick(1000);expect(s.host.querySelector('g')?.getAttribute('transform')).toBe('translate(40 0)');
 const late=[...s.callbacks.values()][0]!;
 s.progress.value=.1;await nextTick();late(3000);await nextTick();expect(s.host.querySelector('g')?.getAttribute('transform')).toBe('translate(10 0)');
 vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));await s.tick(4000);expect(s.finished).not.toHaveBeenCalled();
 vi.spyOn(document,'hidden','get').mockReturnValue(false);document.dispatchEvent(new Event('visibilitychange'));await s.tick(4200);expect(s.host.querySelector('g')?.getAttribute('transform')).toBe('translate(30.000000000000004 0)');
 s.actor.finish();await nextTick();s.actor.finish();await s.tick(8000);expect(s.finished).toHaveBeenCalledOnce();expect(s.callbacks.size).toBe(0);
});
it('减少动态直接显示终点，卸载不回调',async()=>{
 const s=mount();s.media.matches=true;s.events.dispatchEvent(new Event('change'));await nextTick();expect(s.finished).toHaveBeenCalledOnce();expect(s.callbacks.size).toBe(0);
 s.media.matches=false;s.events.dispatchEvent(new Event('change'));s.progress.value=.2;await nextTick();const late=[...s.callbacks.values()][0]!;
 cleanup();cleanup=()=>{};late(1000);expect(s.finished).toHaveBeenCalledOnce();expect(s.callbacks.size).toBe(0);
});
