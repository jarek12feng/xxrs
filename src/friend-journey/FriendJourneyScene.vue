<script setup lang="ts">
import { computed, ref, watch, useId } from 'vue';
import type { State, Intent } from '../world';
import NarrativeStage from '../scene2d/NarrativeStage.vue';
import { characterArt, heroArt } from '../presentation/art';
import { friendPresence } from './presence';
import { friendSiteText } from './visit';
import { useSceneApproach } from '../scene2d/use-scene-approach';
import { useVisitPerformance } from './use-visit-performance';
import { visitPose, visitPoseAtlas, visitPoseFrames } from './visit-poses';
import { correspondenceQuote } from '../correspondence/rules';
const props=defineProps<{game:State;busy:boolean}>();
const emit=defineEmits<{act:[intent:Intent];close:[]}>();
const selected=ref('');
const present=computed(()=>friendPresence(props.game)==='resting');
const approach=useSceneApproach({animated:()=>true,initial:{x:28,y:82}});
const performance=useVisitPerformance(()=>props.game.friendJourney.visitedAt,()=>present.value);
const phase=performance.phase;
const moving=approach.moving;
const pose=computed(()=>visitPose(phase.value,props.game.friendJourney.visitedAt!==null,props.game.friendJourney.suppliedAt!==null));
const frame=computed(()=>visitPoseFrames[pose.value]);
const atlasReady=ref(false);
const atlasFailed=ref(false);
const poseClipId=useId();
const heroPosition=computed(()=>({left:`${approach.position.value.x}%`,top:`${approach.position.value.y}%`}));
const caption=computed(()=>moving.value?'你沿石台走近，停在她身旁。':phase.value==='unfold'?'她将卷起的测记展开。':phase.value==='trace'?(props.game.friendJourney.suppliedAt!==null?'她指给你看：这几处潮纹都保住了。':'她指向浸损的空白，未核实的水路暂不落笔。'):phase.value==='acknowledge'?'你点头记下，她将测记收拢。':'');
function select(id:string){
 if(id==='exit'){approach.cancel();performance.skip();emit('close');return;}
 if(id!=='friend')return;
 if(!present.value){selected.value=id;return;}
 approach.walkTo({x:43,y:82},()=>{selected.value='friend';});
}
function skipPerformance(){approach.skip();performance.skip();}
watch(present,()=>{approach.cancel();performance.skip();});
const quote=computed(()=>correspondenceQuote(props.game,{kind:'visitFriend'}));
</script>
<template>
 <NarrativeStage class="friend-journey-scene" image="/art/world-story/golden/tide-dike-council.webp" title="古渡侧堤 · 勘潮归处" stage-key="friend-journey" :goal="present?'她已返渡，可到石台旁问候。':'沿旧记号查看去向，信路仍通。'" :active="selected" :hotspots="[{id:'friend',kind:present?'person':undefined,label:present?'苏婉宁 · 返渡休养':'石台与旧信路',speech:present?'你来了。测记就在石台上，坐下说吧。':undefined,x:57,y:78},{id:'exit',label:'回古渡',x:85,y:82}]" @select="select" @close="selected='';approach.cancel();performance.skip()">
  <template #world>
   <div class="friend-actors" :data-phase="phase" :class="{'visit-saved':game.friendJourney.visitedAt!==null,'has-loss':game.friendJourney.suppliedAt===null}">
    <div class="visit-hero" :class="{approaching:moving,acknowledging:phase==='acknowledge'}" :style="heroPosition">
     <img :src="characterArt(heroArt(game.social.gender,game.realm))" alt="你站在古渡侧堤" />
    </div>
    <div v-if="present" class="visit-partner" :data-pose="pose">
     <img v-if="!atlasReady || atlasFailed" class="pose-fallback" src="/art/companionship/shentinglan-work.webp" alt="苏婉宁在石台旁整理测记" />
     <svg v-show="atlasReady && !atlasFailed" class="pose-frame" :viewBox="`${frame.x} 0 440 724`" preserveAspectRatio="xMidYMax meet" role="img" :aria-label="frame.label">
      <defs><clipPath :id="poseClipId"><rect :x="frame.x" y="0" width="440" height="724" /></clipPath></defs>
      <image :href="visitPoseAtlas" width="2172" height="724" :clip-path="`url(#${poseClipId})`" @load="atlasReady=true" @error="atlasFailed=true" />
     </svg>
    </div>
   </div>
   <div v-if="caption" class="visit-caption" role="status">{{caption}} <button @click="skipPerformance">略过动作</button></div>
  </template>
  <template v-if="selected==='friend'">
   <p role="status">{{friendSiteText(game)}}</p>
   <button v-if="present" :disabled="busy || !!quote" @click="emit('act',{type:'correspondence',action:{kind:'visitFriend'}})">走近问候，听她亲述勘潮经过</button>
   <button v-if="present && game.friendJourney.visitedAt!==null" :disabled="busy || phase!=='idle' || moving" @click="performance.replay()">再看测记</button>
   <p v-if="present && quote">{{quote}}</p>

  </template>
 </NarrativeStage>
</template>
<style scoped>
.friend-actors{position:absolute;inset:0;pointer-events:none}
.visit-hero,.visit-partner{position:absolute;width:20%;height:56%;transform:translate(-50%,-100%);filter:drop-shadow(0 10px 8px #0008)}
.visit-partner{left:57%;top:82%}
.visit-hero img,.visit-partner img{width:100%;height:100%;object-fit:contain;object-position:bottom;transform-origin:50% 90%}
.pose-frame{width:100%;height:100%;overflow:hidden}
.visit-hero.acknowledging img{animation:visit-nod .85s ease-in-out}
.visit-caption{position:absolute;bottom:18px;left:20%;max-width:58%;padding:8px 16px;background:#102720ec;border:1px solid #baa77d;border-radius:8px;color:#f3e7cc;z-index:9}
.visit-caption button{margin:0 0 0 12px}
@keyframes visit-nod{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg) translateY(3px)}}
@media(prefers-reduced-motion:reduce){.friend-actors *{animation:none!important}}
.friend-journey-scene :deep(.narrative-inspector:not(.narrative-notes)){left:auto;right:24px;top:84px;bottom:auto;width:min(360px,30%);max-height:calc(100% - 110px);transform:none}
.friend-journey-scene :deep(.speech-content){max-height:min(370px,calc(100dvh - 290px))}
.friend-journey-scene :deep(.speech-bubble::after){display:none}
@media(max-width:900px){.friend-journey-scene :deep(.narrative-inspector:not(.narrative-notes)){left:16px;right:16px;top:auto;bottom:16px;width:auto;max-height:45%}}
p{line-height:1.8}button{padding:10px;margin:10px 0}small{display:block}
</style>
