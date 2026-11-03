// @vitest-environment happy-dom
import { createApp, h, nextTick, ref } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useSceneApproach } from '../src/scene2d/use-scene-approach';
let app:ReturnType<typeof createApp>;
afterEach(()=>{app?.unmount();vi.unstubAllGlobals();vi.restoreAllMocks();});
function harness(animated=true,reduced=false){
 const callbacks=new Map<number,FrameRequestCallback>();let serial=0;
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callbacks.set(++serial,cb);return serial;});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>callbacks.delete(id));
 vi.spyOn(performance,'now').mockReturnValue(0);
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:reduced,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList);
 let api!:ReturnType<typeof useSceneApproach>;const enabled=ref(animated);
 app=createApp({setup(){api=useSceneApproach({animated:()=>enabled.value,initial:{x:20,y:85}});return()=>h('div');}});app.mount(document.createElement('div'));
 const tick=(time:number)=>{const tasks=[...callbacks.values()];callbacks.clear();tasks.forEach(cb=>cb(time));};
 return {api,tick,callbacks,enabled};
}
it('真实步态前进，抵达才打开；连续选择只执行最后的到达回调',()=>{
 const {api,tick}=harness();const first=vi.fn(),last=vi.fn();
 api.walkTo({x:60,y:85},first);tick(400);
 expect(api.position.value.x).toBeGreaterThan(20);expect(api.frame.value).toBe(4);expect(first).not.toHaveBeenCalled();
 api.walkTo({x:30,y:85},last);tick(1800);
 expect(first).not.toHaveBeenCalled();expect(last).toHaveBeenCalledOnce();expect(api.position.value).toEqual({x:30,y:85});expect(api.moving.value).toBe(false);
});
it('略过直接到达且回调一次，取消不会执行延后的命令',()=>{
 const {api,tick,callbacks}=harness();const done=vi.fn();
 api.walkTo({x:80,y:85},done);api.skip();api.skip();tick(2000);
 expect(done).toHaveBeenCalledOnce();expect(callbacks.size).toBe(0);
 api.walkTo({x:20,y:85},done);api.cancel();tick(2000);expect(done).toHaveBeenCalledOnce();
});
it('无适用步态和减少动态效果直接到达，不让静态人物滑行',()=>{
 const {api,callbacks}=harness(false,true);const done=vi.fn();api.walkTo({x:70,y:85},done);
 expect(api.position.value.x).toBe(70);expect(done).toHaveBeenCalledOnce();expect(callbacks.size).toBe(0);
});
it('后台、Escape、卸载取消队列，不回调不重播',()=>{
 const {api,tick,callbacks}=harness();const done=vi.fn();api.walkTo({x:70,y:85},done);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));tick(2000);expect(done).not.toHaveBeenCalled();
 api.walkTo({x:70,y:85},done);vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));tick(2000);
 expect(done).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
 vi.restoreAllMocks();api.walkTo({x:70,y:85},done);app.unmount();tick(2000);expect(done).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
});
it('步态资源失效直接到达，不继续滑动降级立绘',async()=>{
 const {api,enabled,callbacks}=harness();const done=vi.fn();api.walkTo({x:70,y:85},done);enabled.value=false;await nextTick();
 expect(api.moving.value).toBe(false);expect(callbacks.size).toBe(0);expect(done).toHaveBeenCalledOnce();
});

it('旧环境matchMedia缺少监听方法仍可挂载、减少动态与卸载',()=>{
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:true} as MediaQueryList);
 let api!:ReturnType<typeof useSceneApproach>;
 app=createApp({setup(){api=useSceneApproach({animated:()=>true});return()=>h('div');}});app.mount(document.createElement('div'));
 const done=vi.fn();expect(()=>api.walkTo({x:40,y:85},done)).not.toThrow();expect(done).toHaveBeenCalledOnce();expect(()=>app.unmount()).not.toThrow();
});
