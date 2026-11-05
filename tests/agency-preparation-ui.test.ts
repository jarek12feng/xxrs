// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createApp, h, shallowRef, nextTick, type App } from 'vue';
import { dispatch, migrateSave, type Intent, type State } from '../src/core';
import { goldenLateCheckpoint } from '../tools/golden-completion-checkpoint';
import { lizhaoDepthCheckpoint } from '../tools/lizhao-depth-checkpoint';
import ReunionScene from '../src/golden-reunion/ReunionScene.vue';
import LizhaoPanel from '../src/lizhao/LizhaoPanel.vue';
let app: App;
afterEach(()=>{app?.unmount();document.body.innerHTML='';});
async function click(text:string){
 const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes(text));
 expect(b,text).toBeTruthy();expect(b!.disabled,text).toBe(false);b!.click();await nextTick();await nextTick();
}
function mount(component:typeof ReunionScene|typeof LizhaoPanel,initial:State){
 const state=shallowRef(initial);let id=0;
 app=createApp({render:()=>h(component,{game:state.value,busy:false,onAct:(intent:Intent)=>{state.value=dispatch(state.value,{...intent,id:`agency-ui-${++id}`});}})});
 app.mount(document.body.appendChild(document.createElement('div')));return state;
}
it('古渡展示本领路线耗草，点击后立即生成实测与可保存的下一程成果',async()=>{
 const game=mount(ReunionScene,goldenLateCheckpoint());
 await click('绳尺与古渡信路');await click('托驿使回信');await click('循新记号相见');await click('辨清双影');await click('侧堤归绳');
 expect(document.body.textContent).toContain('灵草 2');
 const herbs=game.value.herbs,month=game.value.month;
 await click('分神照见双影');
 expect(game.value.herbs).toBe(herbs-2);expect(game.value.month).toBe(month+1);
 expect(game.value.goldenStory.reunion.stage).toBe('resolved');
 expect(document.body.textContent).toContain('药船');
 expect(migrateSave(JSON.parse(JSON.stringify(game.value)))).toEqual(game.value);
});
it('旧丹室添药只退潮，随后分念收药完成，试炉图随保存状态改变',async()=>{
 const game=mount(LizhaoPanel,lizhaoDepthCheckpoint());
 // The scene opens the furnace through its ordinary object button.
 await click('旧丹炉');
 await click('备普通灵草试炉');
 const herbs=game.value.herbs;
 expect(document.querySelector('[data-phase="cloudy"]')).toBeTruthy();
 await click('灵草滤潮');
 expect(game.value.lizhao.recipeVerified).toBe(false);
 await click('分念辨性');
 await click('合槽收药');
 expect(game.value.herbs).toBe(herbs-4);expect(game.value.lizhao.recipeVerified).toBe(true);
 expect(document.querySelector('[data-phase="stable"]')).toBeTruthy();
 expect(migrateSave(JSON.parse(JSON.stringify(game.value)))).toEqual(game.value);
});
