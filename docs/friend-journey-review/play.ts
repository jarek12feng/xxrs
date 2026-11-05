import {createApp,h,shallowRef} from 'vue';
import {dispatch,validState,migrateSave,type Intent} from '../../src/core';
import {goldenLateCheckpoint} from '../../tools/golden-completion-checkpoint';
import CorrespondencePanel from '../../src/correspondence/CorrespondencePanel.vue';
import OuterSeaPanel from '../../src/outer-sea/OuterSeaPanel.vue';
import '../../src/style.css';
const key='xxrs-isolated-friend-play-v1'+(new URLSearchParams(location.search).get('run')==='motion'?'-motion':'');
function checkpoint(){
 let s=goldenLateCheckpoint();
 for(const action of [{kind:'invite'},{kind:'meet'},{kind:'plan',approach:'ward'},{kind:'anchor'},{kind:'cross'},{kind:'share',sharing:'public'},{kind:'depart'}] as const){s=dispatch(s,{type:'goldenStory',action:{kind:'reunion',action},id:`fixture-${action.kind}`});}
 if(!validState(s))throw new Error('Invalid isolated checkpoint');return s;
}
const saved=localStorage.getItem(key);
const state=shallowRef(saved?migrateSave(JSON.parse(saved)):checkpoint());
const view=shallowRef('mail'),notice=shallowRef('');
function act(intent:Intent){
 const next=dispatch(state.value,{...intent,id:`play-${state.value.month}-${state.value.seen.length}-${crypto.randomUUID()}`});
 if(!validState(next))throw new Error('Invalid result');
 const changed=next!==state.value;localStorage.setItem(key,JSON.stringify(next));state.value=next;
 notice.value=changed?'操作已结算并保存至隔离档':'当前条件不允许此操作';
}
createApp({render:()=>h('div',[
 h('header',[h('strong','独立剧情试玩：古渡告别之后'),h('p','不读取或覆盖玩家存档；本页仅使用独立键保存。下方场景与传讯复用正式组件。'),
 h('p',`第${state.value.month}月 · 灵草${state.value.herbs} · ${state.value.outerSea.location} · ${validState(state.value)?'存档校验通过':'校验失败'}`),
 h('button',{onClick:()=>view.value='mail'},'传讯与旧信'),h('button',{onClick:()=>view.value='world'},'返回行旅现场'),
 h('button',{onClick:()=>act({type:'advance',activity:'work',months:1})},'料理杂务一月'),
 h('button',{onClick:()=>{state.value=migrateSave(JSON.parse(localStorage.getItem(key)!));notice.value='隔离存档已重新读取';}},'重读隔离存档'),h('span',notice.value)]),
 view.value==='mail'?h('div',{class:'mail'},[h(CorrespondencePanel,{game:state.value,busy:false,onAct:act,onNavigate:()=>{view.value='world';}})]):h(OuterSeaPanel,{game:state.value,busy:false,onAct:act,onShore:()=>{},onMeeting:()=>{view.value='mail';}}),
])}).mount('#app');
