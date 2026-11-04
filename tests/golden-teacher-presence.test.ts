// @vitest-environment happy-dom
import {createApp,h,shallowRef,nextTick} from 'vue';
import {beforeAll,it,expect} from 'vitest';
import Scene from '../src/golden-story/GoldenStoryScene.vue';
import {dispatch,validState,type Intent} from '../src/core';
import {teachingCheckpoints} from '../docs/golden-completion/review-fixes/shen-scene/checkpoints';
let states:ReturnType<typeof teachingCheckpoints>;
beforeAll(()=>{states=teachingCheckpoints();},30000);
for(const name of ['present','record'] as const)it(`${name}合法问法身份与人物一致且保留两步亲习`,async()=>{
 const game=shallowRef(structuredClone(states[name]));let serial=0;
 expect(validState(game.value)).toBe(true);expect(game.value.month<2400).toBe(name==='present');
 const host=document.body.appendChild(document.createElement('div'));
 const app=createApp({render:()=>h(Scene,{game:game.value,busy:false,place:'conclave',onAct:(a:Intent)=>{game.value=dispatch(game.value,{...a,id:`teacher-test-${++serial}`});}})});app.mount(host);
 try {
  expect(host.querySelectorAll('.teaching-elder')).toHaveLength(name==='present'?1:0);
  (host.querySelector('[data-hotspot="teaching"]') as HTMLButtonElement).click();await nextTick();
  const click=async(label:string)=>{const b=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes(label))!;expect(b.disabled).toBe(false);b.click();await nextTick();};
  await click('演示旧法滞涩');expect(game.value.goldenStory.practice?.step).toBe(0);
  expect(host.querySelectorAll('.teaching-elder.demonstrating')).toHaveLength(name==='present'?1:0);
  await click('缓下旧脉');expect(game.value.goldenStory.practice?.step).toBe(1);
  await click('候新流回转');expect(game.value.goldenStory.teachings).toContain('method');expect(validState(game.value)).toBe(true);
 }finally{app.unmount();host.remove();}
});
