import { createApp, h, shallowRef } from 'vue';
import Sea from '../src/outer-sea/OuterSeaPanel.vue';
import Conclave from '../src/conclave/ConclavePanel.vue';
import { conclavePlayer } from './conclave-checkpoint';
import { dispatch, validState, type Intent } from '../src/core';
import '../src/style.css';
const player = conclavePlayer();
player.arrive();
if (!new URLSearchParams(location.search).has('failure')) {
player.work(50); player.herbs(20);
player.act({kind:'training',style:'ward'});
player.battle('contest');
player.battle('contest');
}
const state = shallowRef(player.state);
const atSea = shallowRef(false);
let serial = 0;
createApp({render:()=>h('main',{style:{padding:0,margin:0,maxWidth:'none'}},[
  h('small',{style:{position:'fixed',bottom:'4px',left:'12px',zIndex:10,color:'#fff'}},'开发检查点 · 公开命令生成 · 不读写玩家存档'),
  h(atSea.value ? Sea : Conclave,{style:{height:'100dvh',minHeight:0},game:state.value,busy:false,onShore:()=>{atSea.value=true},onMeeting:()=>{atSea.value=false},onAct:(intent:Intent)=>{
    const next=dispatch(state.value,{...intent,id:`court-preview-${++serial}`});
    if(!validState(next))throw Error('Invalid preview state');
    state.value=next;
  }})
])}).mount('#app');
