// @vitest-environment happy-dom
import {createApp,h,nextTick,shallowRef} from 'vue';
import {afterEach,expect,it,vi} from 'vitest';
import FoundationPanel from '../src/foundation-journey/FoundationPanel.vue';
import {foundationMapCheckpoint} from '../tools/foundation-sites-checkpoint';
import {type Intent,dispatch,validState} from '../src/core';
let close=()=>{};
afterEach(()=>{close();vi.unstubAllGlobals();vi.restoreAllMocks();});
function mount(){
 const callbacks=new Map<number,FrameRequestCallback>();let id=0;
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callbacks.set(++id,cb);return id;});vi.stubGlobal('cancelAnimationFrame',(key:number)=>callbacks.delete(key));
 vi.spyOn(performance,'now').mockReturnValue(0);vi.spyOn(window,'matchMedia').mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList);
 const busy=shallowRef(false);
 const state=shallowRef(foundationMapCheckpoint()),commands:Intent[]=[],host=document.createElement('div');document.body.append(host);
 const app=createApp({render:()=>h(FoundationPanel,{game:state.value,busy:busy.value,onAct:(i:Intent)=>commands.push(i)})});app.mount(host);
 close=()=>{app.unmount();host.remove();};
 const tick=(time:number)=>{const list=[...callbacks.values()];callbacks.clear();list.forEach(cb=>cb(time));};
 const click=async(text:string)=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(button).toBeDefined();button!.click();await nextTick();};
 return {state,busy,commands,host,tick,click,callbacks};
}
it('matching foundation gait approaches before opening; exit arrival opens the map and only confirmed departure dispatches travel',async()=>{
 const v=mount(),before=structuredClone(v.state.value);expect(validState(before)).toBe(true);
 v.host.querySelector<HTMLImageElement>('.walk-crop img')!.dispatchEvent(new Event('load'));await nextTick();
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!.click();await nextTick();
 expect(v.host.querySelector('[aria-label="现场操作"]')).toBeNull();expect(v.host.querySelector('[data-moving="true"]')).not.toBeNull();
 await v.click('直接抵达');expect(v.host.querySelector('[aria-label="现场操作"]')).not.toBeNull();expect(v.commands).toEqual([]);expect(v.state.value).toEqual(before);
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.click();await nextTick();await v.click('直接抵达');
 await v.click('晴川药庄');expect(v.commands).toEqual([]);expect(v.host.textContent).toContain('正走向');
 await v.click('直接抵达');v.tick(3000);await nextTick();expect(v.commands).toEqual([]);expect(v.host.querySelector('.travel-map')).not.toBeNull();await v.click('动身前往');expect(v.commands).toEqual([{type:'foundationJourney',action:{kind:'travel',destination:'estate',mode:'land'}}]);expect(v.state.value).toEqual(before);
});
it('cancel and externally replaced state never deliver a queued travel command',async()=>{
 const v=mount();v.host.querySelector<HTMLImageElement>('.walk-crop img')!.dispatchEvent(new Event('load'));await nextTick();
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.click();await nextTick();await v.click('直接抵达');await v.click('晴川药庄');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));v.tick(3000);await nextTick();expect(v.commands).toEqual([]);
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.click();await nextTick();await v.click('晴川药庄');
 v.state.value=structuredClone(v.state.value);await nextTick();v.tick(3000);await nextTick();expect(v.commands).toEqual([]);expect(v.callbacks.size).toBe(0);
});
it('shared map choice is a public saved command; its result starts the staged handoff only after state arrives',async()=>{
 const v=mount();v.host.querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!.click();await nextTick();
 expect(v.host.querySelector('[data-performance]')).toBeNull();
 const next=dispatch(v.state.value,{type:'foundationJourney',action:{kind:'mapPlan',plan:'public'},id:'map-stage-check'});expect(validState(next)).toBe(true);expect(next.foundationJourney.heroine.map).toBe('public');
 v.state.value=next;await nextTick();expect(v.host.textContent).toContain('撤下旧刻样');expect(v.host.querySelector('.foundation-companion')?.getAttribute('src')).toContain('work');
 await v.click('跳过演出');expect(v.state.value).toBe(next);expect(v.host.querySelector('.foundation-companion')?.getAttribute('src')).toContain('travel');
});
it('foundation battle uses field commands and never depicts an array trial as a stone creature',async()=>{
 const v=mount();
 const {foundationSiteCheckpoint}=await import('../tools/foundation-sites-checkpoint');
 const before=foundationSiteCheckpoint('estate',false);
 const battle=dispatch(before,{type:'foundationJourney',action:{kind:'battle',battle:'estate'},id:'field-trial'});expect(validState(battle)).toBe(true);expect(battle.foundationJourney.duel?.id).toBe('estate');
 v.state.value=battle;await nextTick();
 expect(v.host.querySelector('.combat-enemy img')).toBeNull();expect(v.host.querySelector('.combat-enemy')?.textContent).toContain('失控护圃阵');
 expect(v.host.querySelector('[data-hotspot]')).toBeNull();expect(v.host.querySelector('.foundation-player')).toBeNull();expect(v.host.querySelector('[aria-label="失控护圃阵的阵纹"]')).not.toBeNull();expect(v.host.querySelector('.battle-array')?.textContent).toBe('');
 expect(v.host.querySelector('[aria-label="战场招式与来势"]')).not.toBeNull();expect(v.host.textContent).toContain('伤敌');expect(v.host.textContent).toContain('承伤');
 v.host.querySelector<HTMLButtonElement>('.combat-commands button')!.click();await nextTick();expect(v.commands).toHaveLength(1);expect(v.commands[0].type).toBe('foundationJourney');expect(v.state.value).toBe(battle);
});

it('busy interruption cancels exit and female actors never animate the male sheet',async()=>{
 const v=mount();v.host.querySelector<HTMLImageElement>('.walk-crop img')!.dispatchEvent(new Event('load'));await nextTick();
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.click();await nextTick();await v.click('直接抵达');await v.click('晴川药庄');
 v.busy.value=true;await nextTick();v.tick(3000);await nextTick();expect(v.commands).toEqual([]);expect(v.callbacks.size).toBe(0);
 const female=structuredClone(v.state.value);female.social.gender='female';v.state.value=female;v.busy.value=false;await nextTick();
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!.click();await nextTick();expect(v.host.querySelector('[data-moving="true"]')).toBeNull();expect(v.host.querySelector('[aria-label="现场操作"]')).not.toBeNull();expect(v.commands).toEqual([]);
});
it('locked battle disables withdrawal and does not emit a move',async()=>{
 const v=mount();const {foundationSiteCheckpoint}=await import('../tools/foundation-sites-checkpoint');
 const before=foundationSiteCheckpoint('estate',false);
 const battle=dispatch(before,{type:'foundationJourney',action:{kind:'battle',battle:'estate'},id:'field-locked'});
 battle.pending={id:'lock-event',kind:'crossing'};v.state.value=battle;await nextTick();
 const retreat=v.host.querySelector<HTMLButtonElement>('.combat-retreat')!;expect(retreat.disabled).toBe(true);retreat.click();
 v.host.querySelector<HTMLButtonElement>('.combat-commands button')!.click();await nextTick();expect(v.commands).toEqual([]);
});

it('same-place successful save keeps the approached feet; only changing place resets them',async()=>{
 const v=mount();v.host.querySelector<HTMLImageElement>('.walk-crop img')!.dispatchEvent(new Event('load'));await nextTick();
 v.host.querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!.click();await nextTick();await v.click('直接抵达');
 const actor=()=>v.host.querySelector<HTMLElement>('.foundation-player')!;
 expect(actor().style.left).toBe('38%');expect(actor().style.top).toBe('88%');
 const next=dispatch(v.state.value,{type:'foundationJourney',action:{kind:'mapPlan',plan:'detour'},id:'position-save'});expect(next.foundationJourney.heroine.map).toBe('detour');
 v.state.value=next;await nextTick();expect(actor().style.left).toBe('38%');expect(v.host.textContent).toContain('撤下旧刻样');
 expect(v.host.querySelector('.narrative-goal')?.textContent).not.toContain('我没写名字');
 await v.click('跳过演出');expect(actor().style.left).toBe('38%');
 v.state.value=structuredClone(next);await nextTick();expect(actor().style.left).toBe('38%');
 const moved=dispatch(next,{type:'foundationJourney',action:{kind:'travel',destination:'estate'},id:'position-travel'});expect(moved.foundationJourney.location).toBe('estate');v.state.value=moved;await nextTick();expect(actor().style.left).toBe('18%');expect(actor().style.top).toBe('86%');
});

it('array projection and exploration hotspots follow the actual saved duel',async()=>{
 const v=mount();const {foundationSiteCheckpoint}=await import('../tools/foundation-sites-checkpoint');
 const initial=foundationSiteCheckpoint('estate',false);
 const battle=dispatch(initial,{type:'foundationJourney',action:{kind:'battle',battle:'estate'},id:'array-start'});v.state.value=battle;await nextTick();
 expect(v.host.querySelector('.battle-array')).not.toBeNull();expect(v.host.querySelector('[data-hotspot]')).toBeNull();
 const withdrawn=dispatch(battle,{type:'foundationJourney',action:{kind:'withdraw'},id:'array-leave'});v.state.value=withdrawn;await nextTick();
 expect(v.host.querySelector('.battle-array')).toBeNull();expect(v.host.querySelector('[data-hotspot]')).not.toBeNull();expect(v.host.querySelector('.foundation-player')).not.toBeNull();
});
