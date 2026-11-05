// @vitest-environment happy-dom
import {afterEach,expect,it} from 'vitest';
import {createApp,h,nextTick,shallowRef,type App} from 'vue';
import {dispatch,migrateSave,type Intent} from '../src/core';
import {conclaveCheckpoint} from '../tools/conclave-checkpoint';
import {clickPractice} from './helpers/practice-scene';
import {teachingSolution} from '../src/golden-story/teaching';
import GoldenStoryScene from '../src/golden-story/GoldenStoryScene.vue';
let app:App;afterEach(()=>{app?.unmount();document.body.innerHTML='';});
for(const topic of ['method','pill','ground'] as const)it(`${topic}现场操作显示真实状态，读档接续并在两轮后收起试具`,async()=>{
 const game=shallowRef(dispatch(conclaveCheckpoint(),{type:'goldenStory',action:{kind:'ask',topic,source:'public'},id:`ui-${topic}`}));let serial=0;
 app=createApp({render:()=>h(GoldenStoryScene,{game:game.value,busy:false,place:'sea',onAct:(i:Intent)=>{game.value=dispatch(game.value,{...i,id:`ui-${topic}-${++serial}`});}})});
 app.mount(document.body.appendChild(document.createElement('div')));
 const solution=teachingSolution(topic);
 for(const [index,move] of solution.entries()){
  await clickPractice(topic,move);
  if(index===0){
   const panel=document.querySelector('[aria-label="石案试法状态"]')!;
   expect(panel.querySelector('svg')).not.toBeNull();
   expect(game.value.goldenStory.practice?.material).toMatchObject({topic,schema:2});
   game.value=migrateSave(JSON.parse(JSON.stringify(game.value)));await nextTick();
  }
 }
 expect(game.value.goldenStory.teachings).toContain(topic);
 expect(document.querySelector('[aria-label="石案试法状态"]')).toBeNull();
});
