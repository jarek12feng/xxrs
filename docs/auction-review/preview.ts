import {createApp,h,ref,shallowRef} from 'vue';
import {dispatch,validState,migrateSave,type Intent} from '../../src/core';
import TravelMap from '../../src/wayfaring/TravelMap.vue';
import RoadPanel from '../../src/RoadPanel.vue';
import FoundationPanel from '../../src/foundation-journey/FoundationPanel.vue';
import {auctionFixture,auctionTravelFixture} from '../../tools/auction-checkpoint';
import '../../src/style.css';import '../../src/scene.css';import '../../src/immersive.css';import '../../src/readability.css';
const traveling=ref(false);
function trip(){state.value=auctionTravelFixture();venue.value='foundation';traveling.value=true;}
const venue=ref<'market'|'foundation'>('market'),state=shallowRef(auctionFixture());let serial=0;
function pick(v:'market'|'foundation'){traveling.value=false;venue.value=v;state.value=auctionFixture(v,v==='market'?12:60);}
function act(i:Intent){const next=dispatch(state.value,{...i,id:`preview-${++serial}`});if(!validState(next))throw Error('Invalid auction preview state');state.value=next;}
createApp({setup:()=>()=>h('div',{style:'height:100vh;display:flex;flex-direction:column;overflow:hidden'},[
 h('nav',{style:'padding:8px;display:flex;gap:12px;background:#10291f'},[h('span','隔离检查点 · 不读写玩家存档'),h('button',{onClick:trip},'赴晴川检查点'),h('button',{onClick:()=>pick('market')},'坊市场景'),h('button',{onClick:()=>pick('foundation')},'晴川场景'),h('button',{onClick:()=>state.value=migrateSave(JSON.parse(JSON.stringify(state.value)))},'模拟读档')]),
 h('main',{style:'flex:1;min-height:0'},traveling.value?h(TravelMap,{game:state.value,busy:false,destination:'estate',onAct:act,onClose:()=>traveling.value=false}):venue.value==='market'?h(RoadPanel,{key:venue.value,style:'height:100%',game:state.value,busy:false,onAct:act}):h(FoundationPanel,{key:venue.value,style:'height:100%',game:state.value,busy:false,onAct:act})),
])}).mount('#app');
