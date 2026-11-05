import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {createApp,h,nextTick,shallowRef} from 'vue';
import {afterEach,expect,it} from 'vitest';
import {dispatch,type State,type Intent} from "../src/core";
import { teachingSolution } from '../src/golden-story/teaching';
import { clickPractice } from './helpers/practice-scene';
import StoryScene from '../src/golden-story/GoldenStoryScene.vue';
import CovenantScene from '../src/nascent-soul/CovenantScene.vue';
import {finishGoldenCompletion,goldenLateCheckpoint} from '../tools/golden-completion-checkpoint';
let clean=()=>{};afterEach(()=>clean());
async function click(label:string){
 const button=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(label));
 expect(button,label).toBeTruthy();expect(button!.disabled,label).toBe(false);button!.click();await nextTick();await nextTick();
}
function mount(s:State,scene:'conclave'|'sea'|'covenant'){
 const game=shallowRef(s);let serial=0;
 const onAct=(intent:Intent)=>{game.value=dispatch(game.value,{...intent,id:`narrative-ui-${++serial}`});};
 const app=createApp({render:()=>scene==='covenant'?h(CovenantScene,{game:game.value,busy:false,onAct}):h(StoryScene,{game:game.value,place:scene,busy:false,onAct})});
 const host=document.body.appendChild(document.createElement('div'));app.mount(host);clean=()=>{app.unmount();host.remove();};return game;
}
it('晚年会谷热点和实际问法同为当值传讲人，亲习照常完成',async()=>{
 const s=goldenLateCheckpoint();
 expect(s.month).toBeGreaterThanOrEqual(2400);
 s.conclave.location='court';s.conclave.introduced=true;
 s.goldenStory.teachings=[];s.goldenStory.teachingSources=[];s.goldenStory.teachingPracticeResults=[];

 const game=mount(s,'conclave');expect(document.querySelector('[data-hotspot="teaching"]')?.textContent).toContain('当值传讲人');
 await click('当值传讲人');await click('演示旧法滞涩');
 expect(game.value.goldenStory.practice?.feedback).toContain('当值传讲人展开沈观微留下的论法实录');
 for (const move of teachingSolution('method')) await clickPractice('method', move);expect(game.value.goldenStory.teachings).toContain('method');
});
it('潮堤显示两位实际相识同道全身图',()=>{
 const s=createGame('潮堤','wood');s.realm=2;s.outerSea.met=true;s.outerSea.location='ferry';
 mount(s,'sea');const figures=document.querySelectorAll('.tide-person');expect(figures).toHaveLength(2);
 expect(figures[0]?.getAttribute('src')).toBe('/art/conclave/gu-cangyao-v1.webp');
 expect(figures[1]?.getAttribute('src')).toBe('/art/conclave/ye-wenling-v1.webp');
});
it('已商定的结契暂缓后可以从庭院续议，信物和礼式保留',async()=>{
 let s=finishGoldenCompletion(goldenLateCheckpoint(),'self','marry').checkpoints['covenant-prepared']!;
 const plan=structuredClone(s.nascentSoul.covenant);
 s=dispatch(s,{type:'nascentSoul',action:{kind:'ceremony',choice:'defer'},id:'review-defer'});
 expect(s.nascentSoul.ceremony).toBe('deferred');
 const game=mount(s,'covenant');await click('再点院中灯，续议结契');
 expect(game.value.nascentSoul.ceremony).toBe('discussed');expect(game.value.nascentSoul.covenant).toEqual(plan);
 await click('点灯行礼');expect(game.value.nascentSoul.ceremony).toBe('witnessed');
},30000);

it('曾选择独行而后来定情，庭院重新提供相谈和商议入口',async()=>{
 const s=finishGoldenCompletion(goldenLateCheckpoint(),'self','marry').checkpoints['covenant-prepared']!;
 // Isolated relationship-transition fixture; it does not claim a normal new-save playthrough.
 s.nascentSoul.ceremony='solitary';s.nascentSoul.covenant.meeting='none';
 const game=mount(s,'covenant');await click('先问你，这些年过得如何');
 await click('把心意说清，一同商议结契');expect(game.value.nascentSoul.ceremony).toBe('discussed');
},30000);
