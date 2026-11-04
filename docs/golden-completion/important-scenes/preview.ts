import {createApp,h,ref,shallowRef} from 'vue';
import {dispatch,validState,type Intent} from '../../../src/core';
import GoldenStoryScene from '../../../src/golden-story/GoldenStoryScene.vue';
import CovenantScene from '../../../src/nascent-soul/CovenantScene.vue';
import {finishGoldenCompletion,goldenLateCheckpoint} from '../../../tools/golden-completion-checkpoint';
import {conclaveCheckpoint} from '../../../tools/conclave-checkpoint';
import '../../../src/style.css';import '../../../src/scene.css';import '../../../src/immersive.css';import '../../../src/readability.css';
const wedding=finishGoldenCompletion(goldenLateCheckpoint(),'self','marry');
const lesson=conclaveCheckpoint();
const mode=ref('问法'),state=shallowRef(lesson);let serial=0;
function pick(name:string){mode.value=name;state.value=structuredClone(name==='问法'?lesson:wedding.checkpoints[name==='结契筹备'?'covenant-discussed':name==='行礼现场'?'covenant-prepared':'covenant-witnessed']!);}
const act=(i:Intent)=>{const next=dispatch(state.value,{...i,id:`important-preview-${++serial}`});if(!validState(next))throw Error('Invalid preview state');state.value=next;};
createApp({setup:()=>()=>h('div',{style:'height:100vh;display:flex;flex-direction:column;overflow:hidden'},[
 h('div',{style:'padding:8px;display:flex;gap:8px'},[h('span','独立公共命令检查点 · 不写玩家存档'),...['问法','结契筹备','行礼现场','礼后相谈'].map(name=>h('button',{onClick:()=>pick(name)},name))]),
 h('div',{style:'flex:1;min-height:0'},mode.value==='问法'?h(GoldenStoryScene,{style:'height:100%',game:state.value,busy:false,place:'sea',onAct:act}):h(CovenantScene,{style:'height:100%',game:state.value,busy:false,onAct:act})),
])}).mount('#app');
