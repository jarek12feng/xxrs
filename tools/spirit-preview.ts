import {createApp,h,shallowRef} from 'vue';
import {dispatch,migrateSave,validState,type Intent} from '../src/core';
import Panel from '../src/foundation-journey/FoundationPanel.vue';
import {journeyCheckpoint,journeyPlayer} from './foundation-journey-checkpoint';
import '../src/style.css';
import '../src/immersive.css';
const key='xxrs-spirit-isolated-review';
const saved=localStorage.getItem(key);
const p=journeyPlayer(journeyCheckpoint());
if(!saved){p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique:'spring'});while(p.state.sense<12)p.send({type:'advance',activity:'meditate',months:1});while(p.state.injury)p.send({type:'advance',activity:'rest',months:1});}
const game=shallowRef(saved?migrateSave(JSON.parse(saved)):p.state);
let serial=0;
createApp({render:()=>h('main',{style:'height:100vh'},[
 h('p',{style:'margin:0;padding:8px;background:#183529;color:#fff'},'隔离验收：公开命令生成沉井检查点；不是正常新档全程试玩。操作后保存，刷新可继续。'),
 h(Panel,{game:game.value,busy:false,onAct:(i:Intent)=>{let id:string;do{id=`spirit-browser-${++serial}`;}while(game.value.seen.includes(id));const n=dispatch(game.value,{...i,id});if(!validState(n))throw Error('invalid spirit state');game.value=n;localStorage.setItem(key,JSON.stringify(n));}})
])}).mount('#app');
