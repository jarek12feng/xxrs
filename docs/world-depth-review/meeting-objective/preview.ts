import {createApp,h,shallowRef} from 'vue';
import {dispatch,migrateSave,validState,type Intent} from '../../../src/core';
import {conclaveCheckpoint} from '../../../tools/conclave-checkpoint';
import CultivationOutlook from '../../../src/CultivationOutlook.vue';
import ConclavePanel from '../../../src/conclave/ConclavePanel.vue';
import '../../../src/style.css';
import '../../../src/scene.css';
import '../../../src/immersive.css';
import '../../../src/readability.css';
const key='xxrs-meeting-objective-isolated';
const saved=sessionStorage.getItem(key),payload=saved?JSON.parse(saved):null;
// Dedicated long-gap fixture: preserves public-command growth, only moves the known appointment.
let initial=conclaveCheckpoint();
initial.outerSea.notice=initial.month-450;initial.outerSea.reminded=false;
initial=dispatch(initial,{type:'correspondence',action:{kind:'collect'},id:'meeting-preview-collect'});
const game=shallowRef(payload?migrateSave(payload.state):initial);
let serial=payload?.serial??0;
function act(intent:Intent){
 const next=dispatch(game.value,{...intent,id:`meeting-preview-${++serial}`});
 if(!validState(next))throw Error('Invalid meeting preview state');
 game.value=next;sessionStorage.setItem(key,JSON.stringify({state:next,serial}));
}
createApp({render:()=>h('main',{style:'max-width:1100px;margin:auto;padding:16px'},[
 h('p',`隔离验收 · 第${game.value.month}月 · 修为${game.value.outerSea.cultivation} · 仅标签页保存`),
 game.value.conclave.location==='court'?h(ConclavePanel,{game:game.value,busy:false,onAct:act}):h(CultivationOutlook,{game:game.value,automatic:true,compact:true,onAct:act})
])}).mount('#app');
