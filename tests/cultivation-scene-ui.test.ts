import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {createApp,nextTick,type App as VueApp} from 'vue';
import {createPinia} from 'pinia';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import App from '../src/App.vue';
import {dispatch,validState} from "../src/core";
import {load,save} from '../src/save';
import {outerSeaCheckpoint} from '../tools/outer-sea-checkpoint';
vi.mock('../src/save',()=>({load:vi.fn(),save:vi.fn()}));
let app:VueApp;
async function flush(){for(let i=0;i<8;i++)await nextTick();}
function button(label:string){const b=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(label));if(!b)throw new Error(label);return b;}
async function click(label:string){button(label).click();await flush();}
beforeEach(async()=>{
 vi.useFakeTimers();vi.mocked(save).mockReset().mockResolvedValue();
 let s=createGame('山居客','wood',42);
 for(const action of ['inspect','depart','medicine','prepare','depart','trail','challenge','return'] as const) s=dispatch(s,{type:'adventure',action,id:`home-${action}-${s.seen.length}`});
 s=dispatch(s,{type:'learning',choice:'spring',equip:true,id:'home-book'});
 expect(validState(s)).toBe(true);
 vi.mocked(load).mockResolvedValue({state:s,recovered:false});app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();await click('继续游戏');await click('洞府修行');
});
afterEach(()=>{app?.unmount();document.body.innerHTML='';vi.useRealTimers();});
it('keeps the outer sea location when opening practice without travelling home',async()=>{
 app.unmount();document.body.innerHTML='';
 const s=dispatch(outerSeaCheckpoint(),{type:'outerSea',action:{kind:'sail'},id:'practice-sea'});
 expect(s.outerSea.location).toBe('ferry');
 vi.mocked(load).mockResolvedValue({state:s,recovered:false});
 app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));
 await flush();await click('继续游戏');await click('洞府修行');
 const room=document.querySelector('.cultivation-room')!;
 expect(room.textContent).toContain('外海古渡');
 expect(room.textContent).not.toContain('听松山居');
 expect(room.querySelector('.practice-caption')?.textContent).toContain('外海古渡');
 expect(save).not.toHaveBeenCalled();
});
it('starts in one home scene; only selected local controls expand and Escape restores the scene',async()=>{
 const panel=document.querySelector<HTMLElement>('.cultivation-panel')!;
 expect(panel.style.display).toBe('none');expect(document.querySelector('[aria-label="洞府当前目标"]')).not.toBeNull();
 expect(document.querySelector('.narrative-stage')).toBeNull();
 await click('蒲团 · 打坐修行');expect(panel.style.display).not.toBe('none');
 expect(document.querySelector<HTMLElement>('.activity-grid')?.style.display).toBe('none');
 expect(panel.textContent).toContain('出关年龄');expect(panel.textContent).toContain('已度过的年月不能撤回');
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await flush();expect(panel.style.display).toBe('none');expect(document.querySelector('[role=dialog]')).toBeNull();
 await click('丹炉 · 突破筹备');expect(document.querySelector<HTMLElement>('[aria-label="突破与固本准备"]')?.style.display).not.toBe('none');expect(panel.textContent).toContain('炼筑基丹 · 六月温养');
 await click('收起 ×');expect(panel.style.display).toBe('none');expect(save).not.toHaveBeenCalled();
});
it('exit opens the qi journey rather than the default road chapter',async()=>{
 await click('山门 · 炼气历练');expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('qi');expect(document.querySelector('.cultivation-room')).toBeNull();expect(save).not.toHaveBeenCalled();
});
it('chores keep the original one-month command and a permanent pause while automatic work runs',async()=>{
 await click('案几 · 修行与杂务');expect(document.querySelector<HTMLElement>('.activity-grid')?.style.display).not.toBe('none');
 const work=[...document.querySelectorAll<HTMLButtonElement>('.activity-grid button')].find(b=>b.textContent?.includes('劳作'))!;work.click();await flush();
 await click('行动一月');expect(save).toHaveBeenCalledTimes(1);await click('自动行动');
 expect(document.querySelector('.cultivation-pause')).not.toBeNull();await click('收起 ×');expect(document.querySelector('.cultivation-pause')).not.toBeNull();await click('暂停当前修行');expect(document.querySelector('.cultivation-pause')).toBeNull();
});

it('repeated real App and StoryScenes exits retain explicit qi entry after returning from another chapter',async()=>{
 for(let i=0;i<3;i++){
  await click('山门 · 炼气历练');
  expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('qi');
  const route=document.querySelector<HTMLButtonElement>('[data-hotspot="prepare"]');
  expect(route?.textContent).toContain('山道与历练');
  route!.click();await flush();
  expect(document.querySelector('[aria-label="现场操作"]')).not.toBeNull();
  await click('当前行旅');
  expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('road');
  await click('洞府修行');
 }
 expect(save).not.toHaveBeenCalled();
});
