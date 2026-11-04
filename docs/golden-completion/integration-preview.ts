import {createApp,h,ref,shallowRef} from 'vue';
import StoryScenes from '../../src/scene2d/StoryScenes.vue';
import WorldAtlas from '../../src/WorldAtlas.vue';
import {dispatch,validState,type Intent} from '../../src/core';
import {finishGoldenCompletion,goldenLateCheckpoint} from '../../tools/golden-completion-checkpoint';
import '../../src/style.css';
import '../../src/scene.css';
import '../../src/immersive.css';
import '../../src/readability.css';
const run=finishGoldenCompletion(goldenLateCheckpoint('spring'));
const state=shallowRef(run.checkpoints.late!),map=ref(false);let id=0;
const pick=(name:string)=>{state.value=structuredClone(run.checkpoints[name]!);map.value=false;};
const act=(i:Intent)=>{const next=dispatch(state.value,{...i,id:`browser-integration-${++id}`});if(!validState(next))throw Error('Invalid integration preview state');state.value=next;};
createApp({setup:()=>()=>h('div',{style:'height:100vh;width:100%;display:flex;flex-direction:column;color:#f0dfb9;overflow:hidden'},[
 h('div',{style:'padding:8px;display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0'},[h('span','公共命令检查点 · 非连续新档试玩'),...Object.keys(run.checkpoints).map(name=>h('button',{onClick:()=>pick(name)},name)),h('button',{onClick:()=>map.value=!map.value},'世界地图')]),
 h('div',{style:'flex:1;min-height:0;overflow:auto'},map.value?h(WorldAtlas,{game:state.value,selected:'valley',story:true}):h(StoryScenes,{style:'height:100%',game:state.value,busy:false,showRoad:true,entryChapter:state.value.realm===3?'nascent':state.value.lizhao.location==='away'&&state.value.lizhao.cleared?'nascent':'lizhao',onAct:act})),
])}).mount('#app');
