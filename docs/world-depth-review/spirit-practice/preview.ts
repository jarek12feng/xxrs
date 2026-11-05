import {createApp,h,shallowRef} from 'vue';
import {dispatch,migrateSave,validState,type Intent} from '../../../src/core';
import {conclaveCheckpoint} from '../../../tools/conclave-checkpoint';
import GoldenStoryScene from '../../../src/golden-story/GoldenStoryScene.vue';
import '../../../src/style.css';import '../../../src/scene.css';import '../../../src/immersive.css';import '../../../src/readability.css';
const key='xxrs-spirit-practice-isolated';
const saved=sessionStorage.getItem(key),payload=saved?JSON.parse(saved):null;
const game=shallowRef(payload?migrateSave(payload.state):conclaveCheckpoint());let serial=payload?.serial??0;
function act(i:Intent){const next=dispatch(game.value,{...i,id:`spirit-preview-${++serial}`});if(!validState(next))throw Error('Invalid spirit preview');game.value=next;sessionStorage.setItem(key,JSON.stringify({state:next,serial}));}
createApp({render:()=>h('div',{style:'height:100vh;display:flex;flex-direction:column'},[
 h('nav',{style:'padding:8px'},`隔离验收 · 第${game.value.month}月 · 灵草${game.value.herbs} · 仅标签页保存`),
 h(GoldenStoryScene,{style:'flex:1;min-height:0',game:game.value,busy:false,place:'sea',onAct:act})
])}).mount('#app');
