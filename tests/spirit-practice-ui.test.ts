// @vitest-environment happy-dom
import {afterEach,expect,it} from 'vitest';
import {createApp,h,nextTick,shallowRef,type App} from 'vue';
import {dispatch,migrateSave,type Intent} from '../src/core';
import {conclaveCheckpoint} from '../tools/conclave-checkpoint';
import GoldenStoryScene from '../src/golden-story/GoldenStoryScene.vue';
let app:App;afterEach(()=>{app?.unmount();document.body.innerHTML='';});
it('现场线索、识压随操作变化，失败后刷新可换法并完成横潮实测',async()=>{
 const initial=dispatch(conclaveCheckpoint(),{type:'goldenStory',action:{kind:'ask',topic:'spirit',source:'public'},id:'ui-spirit-start'});
 const game=shallowRef(initial);let serial=0;
 app=createApp({render:()=>h(GoldenStoryScene,{game:game.value,busy:false,place:'sea',onAct:(i:Intent)=>{game.value=dispatch(game.value,{...i,id:`spirit-ui-${++serial}`});}})});
 app.mount(document.body.appendChild(document.createElement('div')));
 const click=async(label:string)=>{const b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent?.includes(label))!;expect(b?.disabled).toBe(false);b.click();await nextTick();};
 await click('放开试阵');
 expect(document.body.textContent).toContain('识压 2/2');
 expect(document.body.textContent).toContain('余下进度仍可接续');
 game.value=migrateSave(JSON.parse(JSON.stringify(game.value)));await nextTick();
 await click('运分念诀');await click('守住本念');
 expect(document.body.textContent).toContain('已辨 2/2');
 await click('放开试阵');expect(document.body.textContent).toContain('横潮实测');
 await click('运分念诀');await click('灵草护神');await click('放开试阵');
 expect(game.value.goldenStory.teachings).toContain('spirit');
 expect(document.querySelector('[aria-label="听潮试阵状态"]')).toBeNull();
});
