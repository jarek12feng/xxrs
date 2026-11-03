import { createApp,h,shallowRef,ref } from 'vue';
import StoryScenes from '../src/scene2d/StoryScenes.vue';
import { createGame, dispatch, validState, type Intent } from '../src/core';
import { mistCheckpoint } from './mist-checkpoint';
import { journeyCheckpoint } from './foundation-journey-checkpoint';
import { outerSeaCheckpoint } from './outer-sea-checkpoint';
import { conclaveCheckpoint } from './conclave-checkpoint';
import '../src/style.css';import '../src/scene.css';import '../src/immersive.css';import '../src/readability.css';
function roadCheckpoint(){let s=createGame('场景检查','wood',42);let i=0;for(const action of ['inspect','depart','medicine','prepare','depart','trail','challenge','return'] as const)s=dispatch(s,{type:'adventure',action,id:`scene-preview-${++i}`});return dispatch(s,{type:'learning',choice:'blade',equip:true,id:'scene-preview-book'});}
const factories={青嶂:roadCheckpoint,青嶂关:()=>mistCheckpoint(42,'wood','male',true),雾海:mistCheckpoint,筑基:journeyCheckpoint,外海:outerSeaCheckpoint,诸宗会:conclaveCheckpoint};
const game=shallowRef(roadCheckpoint());const version=ref(0);const showRoad=ref(true);const status=ref('开发检查点 · 不读取或写入玩家存档');let serial=0;
createApp({setup:()=>()=>h('main',{style:{padding:'12px',maxWidth:'none',margin:'0'}},[
 h('nav',{'aria-label':'检查点'},Object.entries(factories).map(([name,factory])=>h('button',{onClick:()=>{game.value=factory();version.value++;status.value='已载入公开命令检查点 · 不读写玩家存档';}},name))),
 h('small',{role:'status'},status.value),
 h(StoryScenes,{key:version.value,game:game.value,busy:false,showRoad:showRoad.value,onAct:(intent:Intent)=>{const next=dispatch(game.value,{...intent,id:`scene-preview-action-${++serial}`});if(!validState(next))throw Error('Invalid preview state');game.value=next;status.value=`第 ${next.month} 月 · 检查点内命令已结算（无磁盘存档）`;},onMist:()=>{game.value=dispatch(game.value,{type:'mist',action:'receive',id:`scene-preview-mist-${++serial}`});showRoad.value=false;},onRoad:()=>showRoad.value=true})
])}).mount('#app');
