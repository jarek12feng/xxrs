// Isolated production-component verification. Fixed presentation snapshots, no saves or commands.
import {createApp,h,ref,shallowRef} from 'vue';
import TribulationWorld from '../../src/scene2d/tribulation/TribulationWorld.vue';
import PathTraveler from '../../src/presentation/movement/PathTraveler.vue';
import ActionFeedback from '../../src/ActionFeedback.vue';
import type {TribulationPresentation} from '../../src/scene2d/tribulation/presentation';
import type {ActionReceipt} from '../../src/action-feedback';
const receipt:ActionReceipt={title:'隔离回执 · 炼化已结算',ritual:'refine',tone:'success',months:1,changes:[],notes:['这是固定演示回执；跳过演出不会再结算奖励。'],cost:'演示',next:'确认结果继续'};
createApp({setup(){
 const mode=ref('thunder'),serial=ref(0),closed=ref(false),playing=ref(false),arrivals=ref(0);
 const traveler=ref<InstanceType<typeof PathTraveler>>();
 const scene=shallowRef<TribulationPresentation>({hero:'/art/characters/hero-male.webp',cleared:false,victoryTitle:'雷云散去',victoryText:'隔离演示',assets:{strike:'/art/nascent-tribulation/lightning-strike-v1.webp',impact:'/art/nascent-tribulation/lightning-impact-v1.webp',ward:'/art/nascent-tribulation/tribulation-ward-v1.webp'},phase:{title:'隔离演出',turn:2,signal:'雷光将落',tell:'固定演示投影，不扣资源',hp:80,maxHp:100,pressure:40,maxPressure:100,color:'#abd'},result:null});
 const button=(label:string,onClick:()=>void)=>h('button',{onClick},label);
 return()=>h('main',[
  h('p','隔离验收 · 正式组件 / 固定投影 / 不读写玩家存档'),
  button('播放雷劫战报',()=>{mode.value='thunder';scene.value={...scene.value,result:{serial:++serial.value,label:'护势接雷',damage:20,incoming:5,ward:true,hero:'/art/hero-male/foundation-guard.webp',color:'#aef'}};}),
  button('展开行动回执',()=>{mode.value='receipt';serial.value++;closed.value=false;}),
  button('播放旅行',()=>{mode.value='travel';serial.value++;}),
  button('暂停或继续旅行',()=>traveler.value?.pause()),button('直接抵达',()=>traveler.value?.finish()),
  h('p',`演出状态：${playing.value?'播放中':'静止'} · 旅行抵达通知 ${arrivals.value} 次 · 回执${closed.value?'已确认':'未确认'}`),
  h('section',mode.value==='thunder'?[h(TribulationWorld,{scene:scene.value,onPerforming:(value:boolean)=>{playing.value=value;}})]:mode.value==='travel'?[h('svg',{viewBox:'0 0 900 400',style:'width:100%;height:100%'},[h('path',{d:'M100 300 L450 260 L800 300',stroke:'#ecc',fill:'none'}),h(PathTraveler,{ref:traveler,key:serial.value,points:[{x:100,y:300},{x:450,y:260},{x:800,y:300}],image:'/art/characters/hero-male.webp',mode:'walk',walkSheet:'/art/scene2d/foundation-walk/hero-male-v1.png',playing:true,duration:12000,onFinished:()=>{arrivals.value++;}})])]:!closed.value?[h(ActionFeedback,{key:serial.value,receipt,expanded:true,onClose:()=>{closed.value=true;}})]:[h('p','演示回执已确认。')])
 ]);
}}).mount('#app');
