<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../core";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import SpiritSummary from "./SpiritSummary.vue";
import { spiritSite, spiritQuote, spiritTrialPreview, spiritPressure, type SpiritAction } from "./rules";
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent];close:[]}>();
const selected=ref('');
const trial=computed(()=>props.game.spirit.trial);
const source=computed(()=>trial.value?.source??spiritSite(props.game));
const goal=computed(()=>{
 if(trial.value)return '四轮内取纹至少6，保住心神；念力不足时强探会回震。';
 const p=props.game.spirit;
 if(source.value==='well')return p.manual==='learned'?'分念诀已通。回到沉井主法，试运新法时亲自运用护神所得。':p.manual==='found'?'分念诀残篇已取得。到调息石台研修三月，将法门化为自身神识。':'残篇被回声阵封住。先取法、再研修，接续沉井主法的试运。';
 return p.jade==='refined'?'澄神玉髓已融入识海。带着护神所得，继续圆满与凝婴的准备。':p.jade==='found'?'澄神玉髓已收入玉匣。到调息石台炼化半年，永久拓展识海。':'归潮拓本指向潮隙中的灵物。此行自愿，取出后还须亲自炼化。';
});
watch(()=>props.game.spirit.trial,(now,before)=>{if(before&&!now)selected.value='rest';});
const rows=computed(()=>{
 const list:{label:string;action:SpiritAction}[]=[];
 if(trial.value){
  for(const [move,label] of [['discern','辨读回声'],['guard','收念守神'],['reach','深入取纹']] as const){
   const p=spiritTrialPreview(props.game,move)!;
   list.push({label:`${label} · 念力−${p.cost}/+${p.recovery}，心神−${p.loss}，纹路+${p.progress}${p.shortage?' · 念力不足，强探回震':''}`,action:{kind:'move',move}});
  }
  list.push({label:'收念撤回 · 不新增创伤',action:{kind:'withdraw'}});
 }else if(source.value && (source.value==='well'?props.game.spirit.manual:props.game.spirit.jade)==='none'){
  list.push({label:`自行护神入阵 · 需神识${source.value==='well'?12:24}`,action:{kind:'enter',source:source.value,preparation:'self'}}, {label:'以灵草4护神入阵 · 无神识门槛',action:{kind:'enter',source:source.value,preparation:'herbs'}});
 }
 return list.map(row=>({...row,quote:spiritQuote(props.game,row.action)}));
});
</script>
<template>
 <NarrativeStage :image="source==='well'?'/art/foundation-journey/inheritance-room.webp':'/art/foundation-growth/meridian-retreat.webp'" :title="source==='well'?'沉井内室 · 回声取法':'古渡潮隙 · 澄神玉髓'" :stage-key="`spirit-${source}`" :goal="goal" :hotspots="trial?[]:[{id:'array',label:source==='well'?'回声石壁':'拓本与潮隙',x:55,y:49},{id:'rest',label:'调息石台',x:30,y:70},{id:'exit',label:'返回现场',x:82,y:66}]" :active="selected" :battle="!!trial" activity-title="识海探阵" @select="id=>id==='exit'?emit('close'):selected=id" @close="selected=''">
 <template #status><span>神识 {{game.sense}} · 识海创伤 {{game.spirit.trauma}} / 3</span></template>
 <template #world><div v-if="trial" class="array-status" role="status">第{{trial.turn+1}} / 4轮 · {{spiritPressure[trial.turn]}}<br>心神 {{trial.stability}} · 念力 {{trial.energy}} · 纹路 {{trial.progress}} / 6</div></template>
 <template v-if="trial || selected==='array'">
  <p v-if="!trial">{{source==='well'?'旧主人的神念沿石壁分成三股，彼此照应。残篇就在回声尽处，蛮力触碰只会将杂音引入识海。':'拓本上的断纹与潮隙暗流逐一吻合。玉髓伏在乱流深处，须护住自己的神念才能取出。'}}</p>
  <p>阵势依次为回声叠影、逆潮冲识、阵隙暂开、逆潮冲识。辨读回声擅长开局，守神能回念，阵隙暂开时深入较稳。失败增识海创伤1，免费调息可恢复。</p>
  <button v-for="row in rows" :key="JSON.stringify(row.action)" :disabled="busy||!!row.quote.error" @click="emit('act',{type:'spirit',action:row.action})">{{row.label}}<small v-if="row.quote.months">准备{{row.quote.months}}月</small><small>{{row.quote.error}}</small></button>
 </template>
 <SpiritSummary v-if="!trial&&(selected==='rest'||selected==='array')" :game="game" :busy="busy" @act="emit('act',$event)"/>
 <template #notes><p>{{game.spirit.last}}</p><p>取法、研修和永久破限随存档保留。失败不扣永久神识；装备不会被卸下。</p></template>
 </NarrativeStage>
</template>
<style scoped>
button {display:block;width:100%;text-align:left;margin:10px 0;} small {display:block;} .array-status {position:absolute;left:30%;top:42%;padding:22px;background:#112b26ee;color:#f4e7c9;border:1px solid #c9b581;font-size:20px;line-height:1.8;} @media(max-width:700px){.array-status{left:8%;font-size:14px;}}
</style>
