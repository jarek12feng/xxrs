// @vitest-environment happy-dom
import { createApp,h,nextTick,shallowRef } from 'vue';
import { afterEach,expect,it,vi } from 'vitest';
import { createGame } from '../src/core';
import QiJourneyPanel from '../src/qi-journey/QiJourneyPanel.vue';
import QiWorld from '../src/qi-journey/QiWorld.vue';
import { qiActionBeats } from '../src/qi-journey/scene-performance';
let app:ReturnType<typeof createApp>;
afterEach(()=>{app?.unmount();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const flush=async()=>{await nextTick();await nextTick();};
it('热点先走近再打开，略过不发命令或改年月，锁定取消到达操作',async()=>{
 const game=shallowRef(createGame('药谷','wood'));game.value.social.gender='male';game.value.qi=120;
 const busy=shallowRef(false),act=vi.fn(),host=document.createElement('div');
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 app=createApp({render:()=>h(QiJourneyPanel,{game:game.value,busy:busy.value,onAct:act})});app.mount(host);
 host.querySelector('.walk-crop img')!.dispatchEvent(new Event('load'));await flush();
 const before=JSON.stringify(game.value);
 host.querySelector<HTMLButtonElement>('[data-hotspot=people]')!.click();await flush();
 expect(host.querySelector('.narrative-inspector')).toBeNull();expect(host.textContent).toContain('略过走近');
 host.querySelector<HTMLButtonElement>('.field-caption button')!.click();await flush();
 expect(host.querySelector('.narrative-inspector')).not.toBeNull();expect(act).not.toHaveBeenCalled();expect(JSON.stringify(game.value)).toBe(before);
 host.querySelector<HTMLButtonElement>('[data-hotspot=journey]')!.click();await flush();busy.value=true;await flush();
 expect(host.textContent).not.toContain('略过走近');expect(host.querySelector('.narrative-inspector')).toBeNull();
});
it('取材按护材封存收妥播放；炼化使用原材料，跳过只结束表现',async()=>{
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
 const s=createGame('取材','wood');s.social.gender='male';
 const game=shallowRef(s),host=document.createElement('div');app=createApp({render:()=>h(QiWorld,{game:game.value})});app.mount(host);
 const gained=structuredClone(s);gained.qiJourney.essence=true;game.value=gained;await flush();
 expect(host.querySelector('.qi-action-actor')).not.toBeNull();expect(host.textContent).toContain('收拢灵材');
 vi.advanceTimersByTime(700);await flush();expect(host.textContent).toContain('封入随身药囊');
 vi.advanceTimersByTime(700);await flush();expect(host.textContent).toContain('凝露草已收妥');
 vi.advanceTimersByTime(700);await flush();expect(host.querySelector('.field-caption')).toBeNull();
 const refined=structuredClone(gained);refined.qiJourney.essence=false;refined.qiJourney.gates=1;game.value=refined;await flush();
 expect(host.querySelector('.field-material img')?.getAttribute('src')).toContain('dew-herb');
 const saved=JSON.stringify(game.value);host.querySelector<HTMLButtonElement>('.field-caption button')!.click();await flush();expect(JSON.stringify(game.value)).toBe(saved);expect(host.querySelector('.field-material')).toBeNull();
});
it('关键动作末段明确对应保存结果，无新动作结算接口',()=>{
 expect(qiActionBeats({kind:'material',label:'凝露草已收妥',pose:'idle'}).map(x=>x.frame)).toEqual([0,2,3]);
 expect(qiActionBeats({kind:'refine',label:'晶髓凝入气海',pose:'meditate'}).at(-1)?.label).toBe('晶髓凝入气海');
});
it('撤离先到出口再提交一次，保存未返回时不提前换场',async()=>{
 const s=createGame('撤离','wood');s.social.gender='male';s.qi=120;s.qiJourney.node=2;s.qiJourney.vigor=30;
 const host=document.createElement('div'),act=vi.fn();
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 app=createApp({render:()=>h(QiJourneyPanel,{game:s,busy:false,onAct:act})});app.mount(host);
 host.querySelector('.walk-crop img')!.dispatchEvent(new Event('load'));await flush();
 host.querySelector<HTMLButtonElement>('[data-hotspot=journey]')!.click();await flush();
 host.querySelector<HTMLButtonElement>('.field-caption button')!.click();await flush();
 [...host.querySelectorAll('button')].find(b=>b.textContent?.includes('撤回山下'))!.click();await flush();
 expect(act).not.toHaveBeenCalled();expect(host.querySelector('.narrative-inspector')).toBeNull();
 host.querySelector<HTMLButtonElement>('.field-caption button')!.click();await flush();
 expect(act).toHaveBeenCalledExactlyOnceWith({type:'qiJourney',action:'withdraw'});
 expect(host.querySelector('.narrative-stage')?.getAttribute('data-stage')).toContain('-2-');
 expect(s.qiJourney.node).toBe(2);
});

it('同场炼化保存保留走近后的脚点，不因gates变化跳回入口',async()=>{
 const s=createGame('淬脉','wood');s.social.gender='male';s.qi=239;s.qiJourney.essence=true;
 const game=shallowRef(s),host=document.createElement('div');app=createApp({render:()=>h(QiJourneyPanel,{game:game.value,busy:false})});app.mount(host);
 host.querySelector<HTMLButtonElement>('[data-hotspot=journey]')!.click();await flush();
 const position=host.querySelector<HTMLElement>('.walking-actor')!.style.left;expect(position).toBe('53%');
 const next=structuredClone(s);next.qiJourney.essence=false;next.qiJourney.gates=1;game.value=next;await flush();
 expect(host.querySelector<HTMLElement>('.walking-actor')!.style.left).toBe(position);
});
