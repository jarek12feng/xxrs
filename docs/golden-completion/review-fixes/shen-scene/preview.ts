import {createApp,h,shallowRef} from 'vue';
import {dispatch,validState,type Intent} from '../../../../src/core';
import Scene from '../../../../src/golden-story/GoldenStoryScene.vue';
import {teachingCheckpoints} from './checkpoints';
import '../../../../src/style.css';import '../../../../src/scene.css';import '../../../../src/immersive.css';import '../../../../src/readability.css';
const states=teachingCheckpoints(),game=shallowRef(states.present);let serial=0;
const pick=(name:'present'|'record')=>game.value=structuredClone(states[name]);
const act=(a:Intent)=>{const next=dispatch(game.value,{...a,id:`shen-review-${++serial}`});if(!validState(next))throw Error('Invalid state');game.value=next;};
(window as any).shenReview={pick,state:()=>JSON.parse(JSON.stringify(game.value))};
createApp({render:()=>h('div',{style:'height:100vh;display:flex;flex-direction:column;background:#12251f'},[
 h('div',{style:'display:flex;gap:12px;flex-shrink:0;color:white'},[h('span','公共命令检查点 · 非新档连续试玩'),h('button',{onClick:()=>pick('present')},'本人在场'),h('button',{onClick:()=>pick('record')},'晚年讲录')]),
 h(Scene,{key:game.value.month<2400?'present':'record',style:'flex:1;min-height:0',game:game.value,busy:false,place:'conclave',onAct:act})])}).mount('#app');
