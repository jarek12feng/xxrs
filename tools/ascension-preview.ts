import {createApp,h,shallowRef} from 'vue';
import {createGame,dispatch,validState,migrateSave,type State,type Intent} from '../src/core';
import {foundationStep} from './foundation-playthrough';
import {condensationCheckpoint} from './golden-core-checkpoint';
import {seaPlayer} from './outer-sea-checkpoint';
import {goldenExchange} from '../src/golden-core/rules';
import Ascension from '../src/ascension/AscensionPanel.vue';
import Golden from '../src/golden-core/GoldenCorePanel.vue';
import {actionReceipt} from '../src/action-feedback';
import '../src/style.css';
function ready():State {
 if(new URLSearchParams(location.search).get('realm')==='golden') {
  const p=seaPlayer(condensationCheckpoint());p.work(80);p.herbs(30);
  for(const action of [{kind:'prepare'},{kind:'route',route:'share'},{kind:'fight'}] as const)p.send({type:'goldenCore',action});
  while(p.state.goldenCore.duel){
   const d=p.state.goldenCore.duel;
   const options=(['guard','discern','strike'] as const).map(move=>({move,p:goldenExchange(p.state,move)!})).sort((a,b)=>(b.p.damage>=d.enemy?1000:0)+b.p.damage-b.p.incoming+b.p.healing-((a.p.damage>=d.enemy?1000:0)+a.p.damage-a.p.incoming+a.p.healing));
   p.send({type:'goldenCore',action:{kind:'move',move:options[0]!.move}});
  }
  for(const action of [{kind:'take'},{kind:'brew',method:'self'},{kind:'site',site:'rented'}] as const)p.send({type:'goldenCore',action});
  return p.state;
 }
 let s=createGame('行功验收','wood',847293);
 for(let n=0;n<600;n++){const i=foundationStep(s,true,'medicine');if(i.type==='break')return s;s=dispatch(s,{...i,id:`setup-${n}`});}
 throw Error('setup stalled');
}
const game=shallowRef(ready()),receipt=shallowRef<ReturnType<typeof actionReceipt>>(null);let serial=0;
const act=(intent:Intent)=>{const n=dispatch(game.value,{...intent,id:`preview-${++serial}`});if(!validState(n))throw Error('Invalid state');receipt.value=actionReceipt(game.value,n,intent);game.value=migrateSave(JSON.parse(JSON.stringify(n)));};
createApp({render:()=>h('main',[
 h('h1','行功与突破 · 独立验收页'),h('p','公开命令准备检查点；每步序列化后恢复，不读写玩家存档。'),
 h('p',`境界 ${game.value.realm} · 月份 ${game.value.month} · 灵草 ${game.value.herbs} · 丹药 ${game.value.realm?game.value.goldenCore.pills:game.value.pills}`),
 h('button',{onClick:()=>act({type:'ascension',action:'start'})},'开始三段行功'),
 game.value.realm>=1?h(Golden,{game:game.value,busy:false,onAct:act}):null,
 receipt.value?h('section',[h('h2',receipt.value.title),...receipt.value.notes.map(x=>h('p',x)),...(receipt.value.payoff??[]).map(x=>h('p',x))]):null,
 h(Ascension,{game:game.value,busy:false,onAct:act})
])}).mount('#app');
