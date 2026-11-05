import {createApp,h,shallowRef} from 'vue';
import {dispatch,validState,type Intent} from '../../src/core';
import {journeyCheckpoint,journeyPlayer} from '../../tools/foundation-journey-checkpoint';
import FoundationPanel from '../../src/foundation-journey/FoundationPanel.vue';
import '../../src/style.css';import '../../src/scene.css';import '../../src/immersive.css';import '../../src/readability.css';
const p=journeyPlayer(journeyCheckpoint('male',true));p.act({kind:'battle',battle:'culmination'});
if(!p.state.foundationJourney.duel)throw Error('Missing trial');
const game=shallowRef(p.state);let serial=0;
function act(i:Intent){const next=dispatch(game.value,{...i,id:`guidance-preview-${++serial}`});if(!validState(next))throw Error('Invalid preview');game.value=next;}
createApp({render:()=>h('div',{style:'height:100vh;display:flex;flex-direction:column'},[
 h('nav',{style:'padding:6px'},`引导隔离验收 · 不读写正式存档 · 第${game.value.month}月`),
 h(FoundationPanel,{style:'flex:1;min-height:0',game:game.value,busy:false,onAct:act})
])}).mount('#app');
