import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {createApp,nextTick,type App as VueApp} from 'vue';
import {createPinia} from 'pinia';
import {afterEach,expect,it,vi} from 'vitest';
import App from '../src/App.vue';
import {dispatch,validState} from "../src/core";
import {foundationStep} from '../tools/foundation-playthrough';
import {moves} from '../src/expedition/content';
import {qiEnemy,qiPreview} from '../src/qi-journey/rules';
import {load,save} from '../src/save';
import {foundationCombatFixture} from '../tools/foundation-combat-fixture';
vi.mock('../src/save',()=>({load:vi.fn(),save:vi.fn()}));
let app:VueApp;
it('closing a foundation field victory keeps the player at the scene instead of opening the map',async()=>{
 vi.useFakeTimers();vi.mocked(save).mockResolvedValue();
 const state=foundationCombatFixture('well','spring','vial');
 state.foundationJourney.location='ferry';
 state.foundationJourney.duel!.enemy=1;
 vi.mocked(load).mockResolvedValue({state,recovered:false});
 app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();
 [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('继续游戏'))!.click();await flush();
 document.querySelector<HTMLButtonElement>('.combat-commands button')!.click();await flush();
 expect(vi.mocked(save).mock.calls.at(-1)![0].foundationJourney.won).toContain('well');
 [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('知晓结果'))!.click();await flush();
 expect(document.querySelector('[role="dialog"]')).toBeNull();
 expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('foundation');
});
async function flush(){for(let i=0;i<12;i++)await nextTick();}
afterEach(()=>{app?.unmount();document.body.innerHTML='';vi.useRealTimers();});
it('real App keeps battle commands clear, preserves receipt details and restores navigation after retreat',async()=>{
 vi.useFakeTimers();vi.mocked(save).mockResolvedValue();
 let state=createGame('战场布局','wood',42);
 for(let i=0;i<400&&!state.qiJourney.duel;i++)state=dispatch(state,{...foundationStep(state),id:`layout-${i}`});
 expect(state.qiJourney.duel).not.toBeNull();expect(validState(state)).toBe(true);
 vi.mocked(load).mockResolvedValue({state,recovered:false});
 app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();
 [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('继续游戏'))!.click();await flush();
 expect(document.querySelector('.scene-combat')).not.toBeNull();
 expect(document.querySelector('.quick-dock')).toBeNull();
 expect(document.querySelector('.journey > nav')).toBeNull();
 expect(document.querySelector('[aria-label="系统菜单 Esc"]')).not.toBeNull();
 const move=document.querySelector<HTMLButtonElement>('.combat-commands button:not([disabled])')!;
 expect(move).not.toBeNull();move.click();await flush();
 expect(save).toHaveBeenCalled();expect(document.querySelector('.combat-bar')).not.toBeNull();
 expect(document.querySelector('.receipt-dock')).toBeNull();
 const receipt=document.querySelector<HTMLButtonElement>('.combat-receipt-entry button');expect(receipt).not.toBeNull();
 receipt!.click();await flush();expect(document.querySelector('.feedback-layer')).not.toBeNull();
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await flush();
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await flush();
 expect(document.querySelector('.feedback-layer')).toBeNull();
 document.querySelector<HTMLButtonElement>('.combat-retreat')!.click();await flush();
 expect(document.querySelector('.scene-combat')).toBeNull();expect(document.querySelector('.quick-dock')).not.toBeNull();
});

it('real App retains the qi scene after a medicine preparation victory from public commands',async()=>{
 vi.useFakeTimers();vi.mocked(save).mockResolvedValue();
 let state=createGame('护药胜归','wood',42);
 for(let i=0;i<400&&!state.qiJourney.duel;i++)state=dispatch(state,{...foundationStep(state,true,'medicine'),id:`medicine-${i}`});
 expect(state.qiJourney.duel).not.toBeNull();expect(validState(state)).toBe(true);
 vi.mocked(load).mockResolvedValue({state,recovered:false});
 app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();
 [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('继续游戏'))!.click();await flush();
 for(let i=0;i<20&&state.qiJourney.duel;i++){
  const enemy=qiEnemy(state)!;
  const action=(['strike','guard','discern'] as const).find(m=>qiPreview(state,m)!.damage>=state.qiJourney.duel!.enemy) ?? enemy.pattern[state.qiJourney.duel.turn%enemy.pattern.length]!;
  const labels=moves;
  const controls=[...document.querySelectorAll<HTMLButtonElement>('.combat-commands button')];
  const command=controls.find(b=>b.textContent?.includes(labels[action]));
  expect(command,action).toBeDefined();command!.click();await flush();
  state=vi.mocked(save).mock.calls.at(-1)![0];
  expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('qi');
 }
 expect(state.qiJourney.duel).toBeNull();
 expect(state.qiJourney.preparations[0]?.medicine).toBe(3);
 expect(document.querySelector('.story-scenes')?.getAttribute('data-chapter')).toBe('qi');
});
