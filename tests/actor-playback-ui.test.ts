// @vitest-environment happy-dom
import {createApp,h,nextTick} from 'vue';
import {afterEach,expect,it,vi} from 'vitest';
import {useActorPlayback} from '../src/presentation/actor-action/use-actor-playback';
let dispose=()=>{};
afterEach(()=>{dispose();vi.useRealTimers();vi.restoreAllMocks();});
function mount(reduced=false){
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
 const change=new EventTarget();
 const media={matches:reduced,addEventListener:change.addEventListener.bind(change),removeEventListener:change.removeEventListener.bind(change)};
 vi.spyOn(window,'matchMedia').mockReturnValue(media as MediaQueryList);
 let player!:ReturnType<typeof useActorPlayback<string>>;
 const end=vi.fn();
 const app=createApp({setup(){player=useActorPlayback<string>({onEnd:end});return()=>h('span',player.frame.value ?? '');}});
 app.mount(document.createElement('div'));dispose=()=>app.unmount();
 return {player,media,change,end};
}
it('替换序列、Esc、后台和卸载均撤销旧帧，不让迟到结果重现',async()=>{
 const {player,end}=mount();
 const scheduled=vi.spyOn(globalThis,"setTimeout"), cancelled=vi.spyOn(globalThis,"clearTimeout");

 player.play([{value:'旧动作',durationMs:100},{value:'旧结果',durationMs:100}]);
 player.play([{value:'新动作',durationMs:300}]);
 const active=scheduled.mock.results.at(-1)!.value;
 await vi.advanceTimersByTimeAsync(200);expect(player.frame.value).toBe('新动作');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
 expect(player.frame.value).toBeNull();expect(cancelled).toHaveBeenCalledWith(active);
 player.play([{value:'后台前',durationMs:100}]);
 vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));
 expect(player.hidden.value).toBe(true);expect(player.frame.value).toBeNull();
 vi.spyOn(document,'hidden','get').mockReturnValue(false);document.dispatchEvent(new Event('visibilitychange'));
 expect(player.frame.value).toBeNull();
 player.play([{value:'卸载前',durationMs:100}]);
 const last=scheduled.mock.results.at(-1)!.value;dispose();dispose=()=>{};
 expect(cancelled).toHaveBeenCalledWith(last);
 const calls=end.mock.calls.length;await vi.advanceTimersByTimeAsync(500);await nextTick();
 expect(end).toHaveBeenCalledTimes(calls);expect(player.frame.value).toBeNull();
});
it('减少动态可显示静态回执，偏好变化中止动作；正常结束不留计时',async()=>{
 const {player,media,change}=mount(true);
 player.play([{value:'动态',durationMs:100}]);expect(player.frame.value).toBeNull();
 player.play([{value:'动态',durationMs:100}],[{value:'静态结果',durationMs:200}]);
 expect(player.frame.value).toBe('静态结果');await vi.advanceTimersByTimeAsync(200);expect(player.frame.value).toBeNull();
 media.matches=false;change.dispatchEvent(new Event('change'));
 player.play([{value:'动作',durationMs:100}]);expect(player.frame.value).toBe('动作');
 media.matches=true;change.dispatchEvent(new Event('change'));
 expect(player.reduced.value).toBe(true);expect(player.frame.value).toBeNull();
});
