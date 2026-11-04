// @vitest-environment happy-dom
import { afterEach, it, expect } from 'vitest';
import { createApp,h,shallowRef,nextTick,type App } from 'vue';
import { dispatch,validState,type Intent } from '../src/core';
import { journeyPlayer, journeyCheckpoint } from '../tools/foundation-journey-checkpoint';
import Panel from '../src/foundation-journey/FoundationPanel.vue';
let app:App;
afterEach(()=>{app?.unmount();document.body.innerHTML='';});
it('沉井现场热点取法、研修与重新装载中的阵势均可操作',async()=>{
 const p=journeyPlayer(journeyCheckpoint());p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique:'spring'});
 while(p.state.sense<12)p.send({type:'advance',activity:'meditate',months:1});
 while(p.state.injury)p.send({type:'advance',activity:'rest',months:1});
 const game=shallowRef(p.state);let id=0;
 const mount=()=>{app=createApp({render:()=>h(Panel,{game:game.value,busy:false,onAct:(intent:Intent)=>{game.value=dispatch(game.value,{...intent,id:`ui-spirit-${id++}`});expect(validState(game.value)).toBe(true);}})});app.mount(document.body.appendChild(document.createElement('div')));};
 const click=async(text:string)=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(button,text).toBeTruthy();expect(button!.disabled,text).toBe(false);button!.click();await nextTick();await nextTick();};
 mount();await click('沉井回声');await click('回声石壁');await click('自行护神入阵');
 expect(game.value.spirit.trial).not.toBeNull();
 // Re-mount with the saved state, without restoring UI selection.
 app.unmount();document.body.innerHTML='';mount();await nextTick();
 expect(document.body.textContent).toContain('第1 / 4轮');
 for(const label of ['辨读回声','收念守神','深入取纹','辨读回声'])await click(label);
 expect(game.value.spirit.manual).toBe('found');
 await click('调息石台');await click('研修分念诀');expect(game.value.spirit.manual).toBe('learned');expect(document.body.textContent).toContain('永久上限+6');
 await click('返回现场');expect(document.body.textContent).toContain('沉井');
});
