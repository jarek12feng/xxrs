import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {createApp,h,nextTick,shallowRef} from 'vue';
import {afterEach,expect,it,vi} from 'vitest';

import RoadPanel from '../src/RoadPanel.vue';
import RoadWorld from '../src/scene2d/RoadWorld.vue';
let app:ReturnType<typeof createApp>;
afterEach(()=>{app?.unmount();vi.restoreAllMocks();vi.unstubAllGlobals();});
const flush=async()=>{await nextTick();await nextTick();};
function fixture(realm:0|1|2=0){
 const s=createGame('青嶂行路','wood',42,'insightful','male');s.realm=realm;s.adventure.step='done';s.adventure.road.stage='market';s.adventure.road.thanked=true;s.adventure.road.map=true;
 return s;
}
function harness(realm:0|1|2=0){
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const game=shallowRef(fixture(realm)),busy=shallowRef(false),act=vi.fn(),host=document.createElement('div');
 app=createApp({render:()=>h(RoadPanel,{game:game.value,busy:busy.value,onAct:act})});app.mount(host);
 return {game,busy,act,host};
}
it('炼气与筑基使用各自步态，走近前不打开操作、不改年月资源',async()=>{
 const {game,host,act}=harness(1);
 expect(host.querySelector('.walk-crop img')?.getAttribute('src')).toContain('foundation-walk/hero-male');
 host.querySelector('.walk-crop img')!.dispatchEvent(new Event('load'));await flush();
 const before=JSON.stringify(game.value);
 host.querySelector<HTMLButtonElement>('[data-hotspot=person]')!.click();await flush();
 expect(host.querySelector('.narrative-inspector')).toBeNull();expect(host.textContent).toContain('略过走近');
 host.querySelector<HTMLButtonElement>('.road-cue button')!.click();await flush();
 expect(host.querySelector('.narrative-inspector')).not.toBeNull();expect(act).not.toHaveBeenCalled();expect(JSON.stringify(game.value)).toBe(before);
 const settled=structuredClone(game.value);settled.stones+=1;game.value=settled;await flush();
 expect(host.querySelector<HTMLElement>('.walking-actor')!.style.left).toBe('35%');
 const qi=structuredClone(game.value);qi.realm=0;game.value=qi;await flush();
 expect(host.querySelector('.walk-crop img')?.getAttribute('src')).toContain('hero-qi-walk');
});
it('道路在出口才发一次命令，未保存不提前切场，锁定清除待执行动作',async()=>{
 const {host,act,game,busy}=harness();host.querySelector('.walk-crop img')!.dispatchEvent(new Event('load'));await flush();
 host.querySelector<HTMLButtonElement>('[data-hotspot=road]')!.click();await flush();host.querySelector<HTMLButtonElement>('.road-cue button')!.click();await flush();
 [...host.querySelectorAll('button')].find(b=>b.textContent?.includes('循图前往青嶂关'))!.click();await flush();
 expect(act).not.toHaveBeenCalled();expect(host.querySelector('.narrative-inspector')).toBeNull();
 host.querySelector<HTMLButtonElement>('.road-cue button')!.click();await flush();expect(act).toHaveBeenCalledExactlyOnceWith({type:'road',action:'pass'});expect(game.value.adventure.road.stage).toBe('market');
 host.querySelector<HTMLButtonElement>('[data-hotspot=person]')!.click();await flush();busy.value=true;await flush();expect(host.textContent).not.toContain('略过走近');expect(host.querySelector('.narrative-inspector')).toBeNull();
});
it('关口脚点在石阶、云外脚点在保留的前景石阶，不沿空中热点直线穿越',async()=>{
 const state=fixture(),game=shallowRef(state),host=document.createElement('div');state.adventure.road.stage='pass';
 app=createApp({render:()=>h(RoadWorld,{game:game.value})});app.mount(host);
 const actor=()=>host.querySelector<HTMLElement>('.walking-actor')!;
 expect(actor().style.left).toBe('57%');expect(actor().style.top).toBe('91%');
 const next=structuredClone(state);next.adventure.road.stage='beyond';game.value=next;await flush();
 expect(actor().style.left).toBe('48%');expect(actor().style.top).toBe('90%');
});
it('无适用步态直接可操作；Escape与后台取消走近，不补发到达动作',async()=>{
 const {host}=harness();host.querySelector<HTMLButtonElement>('[data-hotspot=person]')!.click();await flush();
 expect(host.querySelector('.narrative-inspector')).not.toBeNull();
 host.querySelector('.walk-crop img')!.dispatchEvent(new Event('load'));await flush();
 host.querySelector<HTMLButtonElement>('[data-hotspot=road]')!.click();await flush();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await flush();
 expect(host.textContent).not.toContain('略过走近');expect(host.querySelector('.narrative-inspector')).toBeNull();
 host.querySelector<HTMLButtonElement>('[data-hotspot=objects]')!.click();await flush();vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));await flush();
 expect(host.textContent).not.toContain('略过走近');expect(host.querySelector('.narrative-inspector')).toBeNull();
});
