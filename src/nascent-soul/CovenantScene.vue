<script setup lang="ts">
import {computed,ref} from 'vue';
import type {State,Intent} from '../world';
import NarrativeStage from '../scene2d/NarrativeStage.vue';
import {characterArt,heroArt} from '../presentation/art';
import {nascentQuote,type NascentAction} from './rules';
import {companionContact} from './contact';
import {partnerName,covenantMemory,covenantReady} from './covenant';
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent];close:[]}>();
const selected=ref('companion');
const n=computed(()=>props.game.nascentSoul);
const c=computed(()=>n.value.covenant);
const partner=computed(()=>partnerName(props.game));
const present=computed(()=>companionContact(props.game).reliable && (companionContact(props.game).present || (n.value.contactedAt!==null && props.game.month-n.value.contactedAt<=120)));
const lover=computed(()=>props.game.social.bonded||props.game.foundationJourney.bond==='promised'||props.game.foundationJourney.bond==='covenant');
const phase=computed(()=>n.value.ceremony==='witnessed'?'礼成 · 灯下共餐':n.value.ceremony==='married'||n.value.ceremony==='renewed'?'旧约新灯':n.value.ceremony==='discussed'?'同心之约 · 筹备':'古渡小院 · 重逢');
const hotspots=computed(()=>[
 {id:'companion',label:present.value?partner.value:'约见与来信',x:52,y:50},
 ...(present.value&&lover.value?[{id:'table',label:n.value.ceremony==='witnessed'?'灯下饭桌':'信物与约书',x:46,y:73},{id:'lantern',label:'院中灯火',x:25,y:40}]:[]),
 {id:'exit',label:'回古渡静室',x:86,y:84},
]);
const rows=computed(()=>{
 const rows:{label:string;action:NascentAction}[]=[];
 const add=(label:string,action:NascentAction)=>rows.push({label,action});
 const stage=n.value.ceremony;
 if(!present.value) add('沿信路约见，等候回音',{kind:'contact'});
 if(present.value&&lover.value){
 if(['none','deferred','solitary'].includes(stage)){
  if(props.game.foundationJourney.bond==='covenant') add('取出旧信物，重温当年的约定',{kind:'ceremony',choice:'renew'});
  else {
   add('说起我们曾一起走过的险路',{kind:'covenant',topic:'meeting',choice:'remember'});
   add('先问你，这些年过得如何',{kind:'covenant',topic:'meeting',choice:'listen'});
   if(c.value.meeting!=='none') add(stage==='deferred'?'再点院中灯，续议结契':'把心意说清，一同商议结契',{kind:'ceremony',choice:'discuss'});
  }
 }
 if(stage==='discussed'){
  if(selected.value==='lantern'){
   add('只留两盏灯，在院中行简礼',{kind:'covenant',topic:'form',choice:'quiet'});
   add('请能赴约的旧友来喝一盏茶',{kind:'covenant',topic:'form',choice:'friends'});
  }else if(selected.value==='table'){
   add('从旧图上描出两份归路',{kind:'covenant',topic:'token',choice:'map'});
   add('取两截素绳，一人系一结',{kind:'covenant',topic:'token',choice:'cord'});
  }else{
   add('约定长关出关后，先报平安，再回来吃饭',{kind:'covenant',topic:'promise',choice:'return'});
   add('约定各自远行时，留下新的信路',{kind:'covenant',topic:'promise',choice:'letters'});
  }
  if(covenantReady(c.value))add('点灯行礼，互换信物',{kind:'ceremony',choice:'witness'});
 }
 if(stage==='witnessed')add('收好约书，与对方坐下来吃饭',{kind:'ceremony',choice:'meal'});
 }
 if(['none','discussed'].includes(stage))add('这一回先不行礼',{kind:'ceremony',choice:lover.value?'defer':'solitary'});
 return rows.map(r=>({...r,quote:nascentQuote(props.game,r.action)}));
});
const goal=computed(()=>!present.value?'先沿旧信路递个口信，等回音到了，再约在院中相见。':n.value.ceremony==='discussed'?'看一看院中的灯，选好信物，再把往后的约定说给彼此听。':n.value.ceremony==='witnessed'?'礼已成，饭还温着。坐下来，与对方说几句家常。':n.value.ceremony==='married'?'约书已收好，往后的长关与远行，都有一条可以报平安的信路。':'潮声在墙外，今夜先不急着告别。');
</script>
<template>
 <NarrativeStage class="covenant-scene" image="/art/important-scenes/covenant-courtyard.webp" :title="phase" stage-key="covenant" :goal="goal" :body="n.last" :hotspots="hotspots" :active="selected" @select="$event==='exit'?emit('close'):selected=$event" @close="selected=''">
  <template #world>
   <img class="covenant-hero" :src="characterArt(heroArt(game.social.gender,game.realm))" alt="你站在院中" />
   <img v-if="present" class="covenant-partner" :class="{'vow-complete':['witnessed','married','renewed'].includes(n.ceremony)}" :src="`/art/companionship/${game.social.gender==='male'?'shentinglan':'yinzhaochuan'}-${n.ceremony==='discussed'?'work':'travel'}.webp`" :alt="partner" />
   <div class="vow-lights" :class="{'lit':['witnessed','married','renewed'].includes(n.ceremony)}" aria-hidden="true"><i></i><i></i></div>
   <div v-if="c.token!=='none'" class="covenant-keepsake" :class="{'exchanged':['witnessed','married'].includes(n.ceremony)}" aria-hidden="true"><img src="/art/important-scenes/covenant-keepsakes.webp" alt="" /></div>
   <div v-if="n.ceremony==='witnessed'&&c.witnesses.length" class="covenant-witnesses">{{c.witnesses.join(' · ')}}<small>在院中见证</small></div>
  </template>
  <template #status><p v-if="n.ceremony==='discussed'">{{c.form==='none'?'行礼未定':c.form==='quiet'?'两人简礼':'邀友相见'}} · {{c.token==='none'?'信物未选':c.token==='map'?'两份归路图':'一对素绳'}} · {{c.promise==='none'?'旧约待续':c.promise==='return'?'出关报平安':'远行留信路'}}</p></template>
  <p v-if="present&&lover&&['none','deferred','solitary'].includes(n.ceremony)&&c.meeting==='none'" class="covenant-prologue">{{covenantMemory(game)}} {{partner}}把茶推近了些：“坐一会儿吧，这回不赶路。”</p>
  <p v-if="n.last && (c.meeting!=='none' || n.ceremony!=='none')" role="status" class="covenant-dialogue">{{n.last}}</p>
  <div class="covenant-actions"><button v-for="r in rows" :key="JSON.stringify(r.action)" :disabled="busy||!!r.quote.error" @click="emit('act',{type:'nascentSoul',action:r.action})">{{r.label}}<small v-if="r.quote.months">{{r.quote.months}}月 · 灵石{{r.quote.stones}}</small><small v-if="r.quote.error">{{r.quote.error}}</small></button></div>
  <p v-if="n.ceremony==='married'" class="covenant-receipt">信物已交换，约书已落名。{{partner}}仍会继续自己的修行。</p>
  <template #notes><p>{{covenantMemory(game)}}</p><p v-if="c.witnesses.length">这一夜到场的旧识：{{c.witnesses.join('、')}}。</p><p v-if="c.promise!=='none'">{{c.promise==='return'?'你们约定，长关后先寄平安，再赴家常饭。':'你们约定，远行前互留新的信路。'}}</p></template>
 </NarrativeStage>
</template>
<style scoped>
.covenant-hero,.covenant-partner{position:absolute;bottom:10%;height:57%;width:23%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 14px 10px #09191985);transition:transform .8s ease}
.covenant-hero{left:25%}.covenant-partner{left:44%}.covenant-partner.vow-complete{transform:translateX(-8%)}
.vow-lights{position:absolute;inset:0;opacity:0;transition:opacity 1s}.vow-lights.lit{opacity:1}.vow-lights i{position:absolute;width:180px;height:180px;background:radial-gradient(ellipse,#ffd28844,transparent 65%);border-radius:50%;left:10%;top:12%}.vow-lights i+i{left:81%;top:14%}
.covenant-keepsake{position:absolute;left:43%;bottom:24%;font-size:28px;color:#dec99b;text-shadow:0 2px 5px #000;transition:transform .7s}.covenant-keepsake img{width:90px;height:90px;object-fit:contain}.covenant-keepsake.exchanged{transform:translateY(-65px) scale(1.2)}
.covenant-witnesses{position:absolute;left:18%;bottom:5%;padding:8px 16px;background:#142727d9;color:#eadbbe;font-size:14px}.covenant-witnesses small{display:block}
.covenant-dialogue,.covenant-prologue{line-height:1.9;white-space:pre-line}.covenant-actions{display:grid;gap:9px}.covenant-actions button{text-align:left;line-height:1.6}.covenant-actions small{display:block}.covenant-receipt{color:#e8cc8a}
@media(prefers-reduced-motion:reduce){.covenant-hero,.covenant-partner,.covenant-keepsake,.vow-lights i{transition:none}}
@media(max-width:900px){.covenant-hero{left:18%;height:45%;width:28%}.covenant-partner{left:43%;height:45%;width:28%}}
</style>
