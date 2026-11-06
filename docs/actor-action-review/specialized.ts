// Isolated UI fixture; domain commands run in memory only, never write saves.
import {createApp,h,shallowRef,ref} from 'vue';
import ReunionScene from '../../src/golden-reunion/ReunionScene.vue';
import CovenantScene from '../../src/nascent-soul/CovenantScene.vue';
import LizhaoPanel from '../../src/lizhao/LizhaoPanel.vue';
import {goldenLateCheckpoint,finishGoldenCompletion} from '../../tools/golden-completion-checkpoint';
import {lizhaoFixture,lizhaoTick} from '../../tools/lizhao-fixture';
import {runLizhao} from '../../src/lizhao/rules';
import {dispatch,type Intent} from '../../src/core';
const golden=goldenLateCheckpoint();
const covenant=finishGoldenCompletion(golden,'self','marry').checkpoints['covenant-discussed']!;
createApp({setup(){
 const mode=ref('reunion'), game=shallowRef(golden);let serial=0;
 const select=(value:string)=>{mode.value=value;game.value=structuredClone(value==='covenant'?covenant:value==='lizhao'?runLizhao(lizhaoFixture(),{kind:'visit'},'visit',lizhaoTick):golden);};
 return()=>h('main',[
  h('nav',['隔离场景 · 不读写玩家存档',...['reunion','covenant','lizhao'].map((value,i)=>h('button',{onClick:()=>select(value)},['重逢','结契','离照'][i]))]),
  h('div',{id:'scene'},[h(mode.value==='reunion'?ReunionScene:mode.value==='covenant'?CovenantScene:LizhaoPanel,{key:mode.value,game:game.value,busy:false,onAct:(intent:Intent)=>{game.value=dispatch(game.value,{...intent,id:`isolated-${++serial}`});}})])
 ]);
}}).mount('#app');
