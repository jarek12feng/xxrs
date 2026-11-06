<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { State } from '../core';
import CombatField from '../scene2d/combat/CombatField.vue';
import WalkingActor from '../scene2d/WalkingActor.vue';
import { useSceneApproach } from '../scene2d/use-scene-approach';
import type { Point } from '../scene2d/navigation';
import { heroArt, heroBattlePose } from '../presentation/art';
import { qiEnemy } from './rules';
import { qiSceneSnapshot, qiSceneTransition, qiActionBeats, type QiSceneCue } from './scene-performance';
const props=defineProps<{game:State}>();
const emit=defineEmits<{performed:[]}>();
const cue=ref<QiSceneCue>();
const walkReady=ref(false), beatIndex=ref(0), actionFailed=ref(false);
const walk=useSceneApproach({animated:()=>props.game.realm===0 && props.game.social.gender==='male' && walkReady.value,initial:{x:30,y:87}});
const beat=computed(()=>cue.value ? qiActionBeats(cue.value)[beatIndex.value] : undefined);
const actionFrame=computed(()=>props.game.social.gender==='male' && props.game.realm===0 && !actionFailed.value ? beat.value?.frame : undefined);
const actionStyle=computed(()=>({backgroundPosition:`${((actionFrame.value??0)%4)*100/3}% ${Math.floor((actionFrame.value??0)/4)*100}%`}));
const approach=(point:Point,arrived?:()=>void)=>{stop();walk.walkTo(point,arrived);};
const hidden=ref(false);
const enemy=computed(()=>qiEnemy(props.game));
const q=computed(()=>props.game.qiJourney);
const pose=computed(()=>beat.value?.pose ?? (q.value.duel ? heroBattlePose(q.value.duel.effect) : 'idle'));
const combat=computed(()=>q.value.duel && enemy.value ? {id:`qi-${q.value.gates}-${q.value.node}-${enemy.value.identity}`,turn:q.value.duel.turn,player:q.value.duel.hp,enemy:q.value.duel.enemy,enemyName:enemy.value.name,enemyImage:q.value.trial?enemy.value.image:`/art/scene2d/${enemy.value.identity}-v1.png`,effect:q.value.duel.effect} : null);
const material=computed(()=>`/art/qi-progression/${(cue.value?.kind==='refine' ? q.value.gates-1 : q.value.gates) ? 'condensed-essence' : 'dew-herb'}.webp`);
let timer:ReturnType<typeof setTimeout>|undefined;
let preference:MediaQueryList|undefined;
function stop(){if(timer!==undefined)clearTimeout(timer);timer=undefined;cue.value=undefined;beatIndex.value=0;}
function nextBeat(){if(!cue.value)return; if(beatIndex.value+1<qiActionBeats(cue.value).length){beatIndex.value++;timer=setTimeout(nextBeat,700);}else stop();}
function visibility(){hidden.value=document.hidden;if(hidden.value)stop();}
function reduced(){if(preference?.matches)stop();}
function keyboard(e:KeyboardEvent){if(e.key==='Escape')stop();}
watch(()=>qiSceneSnapshot(props.game),(next,previous)=>{
  const transition=qiSceneTransition(previous,next);
  stop();
  if(!transition || transition.kind==='exchange' || document.hidden || preference?.matches)return;
  walk.cancel();cue.value=transition;beatIndex.value=0;
  if(['material','refine','retreat','victory'].includes(transition.kind))emit('performed');
  timer=setTimeout(nextBeat,qiActionBeats(transition).length>1?700:1800);
});
onMounted(()=>{
  visibility();
  preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  preference?.addEventListener?.('change',reduced);
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('keydown',keyboard);
});
onBeforeUnmount(()=>{stop();preference?.removeEventListener?.('change',reduced);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',keyboard);});
defineExpose({stop,approach,cancel:walk.cancel,skip:walk.skip,reset:walk.reset});
</script>
<template>
  <div class="qi-field" :class="{'is-fighting':q.duel, 'has-current':q.node===2,'qi-paused':hidden}" :data-cue="cue?.kind || ''" :data-beat="beatIndex">
    <div v-if="cue?.kind==='refine'" class="refine-current" :style="{left:walk.position.value.x+'%',top:walk.position.value.y+'%'}" aria-hidden="true"><i></i><i></i><i></i></div>
    <div v-if="q.node===2" class="spirit-current" aria-hidden="true"><i></i><i></i><i></i></div>
    <WalkingActor v-if="!q.duel && actionFrame===undefined" :character="heroArt(game.social.gender,game.realm)" :label="game.name" :position="walk.position.value" :moving="walk.moving.value" :frame="walk.frame.value" :facing="walk.facing.value" :pose="pose" @ready="walkReady=$event" />
    <div v-if="!q.duel && actionFrame!==undefined" class="qi-action-actor" :style="{left:walk.position.value.x+'%',top:walk.position.value.y+'%',...actionStyle}" role="img" :aria-label="beat?.label"><img src="/art/scene2d/hero-actions-v1.png" alt="" @error="actionFailed=true" /></div>
    <CombatField :snapshot="combat" :hero="heroArt(game.social.gender,game.realm)" :hero-name="game.name" />
    <div v-if="q.essence || (cue?.kind==='refine' && beat?.material)" class="field-material" :class="{'material-arrives':cue?.kind==='material'}">
      <img :src="material" :alt="material.includes('condensed') ? '凝元晶髓' : '凝露草'" />
      <span>{{material.includes('condensed') ? '凝元晶髓' : '凝露草'}} · {{cue?.kind==='refine' ? '化入灵息' : '待炼化'}}</span>
    </div>
    <div v-if="walk.moving.value" class="field-caption" role="status"><span>沿山道走近</span><button @click.stop="walk.skip">略过走近</button></div>
    <div v-if="cue" class="field-caption" role="status"><span>{{beat?.label}}</span><button v-if="cue.kind!=='exchange'" @click.stop="stop">跳过演出</button></div>
  </div>
</template>
<style scoped>
.refine-current{position:absolute;width:150px;height:220px;transform:translate(-50%,-100%)}.refine-current i{position:absolute;inset:30% -10% 0;border:1px solid #a7cbb280;border-radius:50%;animation:qi-breathe 1.4s ease-out both}.refine-current i:nth-child(2){inset:10% 8% 8%;animation-delay:.2s}.refine-current i:nth-child(3){inset:0 20% 20%;animation-delay:.4s}
.qi-action-actor{position:absolute;width:195px;height:260px;transform:translate(-50%,-100%);background-image:url(/art/scene2d/hero-actions-v1.png);background-size:400% 200%;filter:drop-shadow(0 10px 8px #0008)}.qi-action-actor img{width:1px;height:1px;opacity:0}
.qi-field{position:absolute;inset:0;pointer-events:none;--qi-glow:#9ee6cb}
.field-material span{white-space:nowrap;background:#102b24db;color:#fff0c7;padding:5px 12px;border-bottom:1px solid #c2a974;font-size:14px}
.field-material{position:absolute;left:49%;bottom:24%;display:flex;flex-direction:column;align-items:center;gap:8px}
.field-material img{width:100px;height:100px;object-fit:contain;filter:drop-shadow(0 0 16px #acdabd88)}
.material-arrives{animation:qi-material 1.2s ease-out}
.field-caption{position:absolute;bottom:7%;left:38%;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:10px 16px;background:#102b24ee;border:1px solid #bca26b99;color:#f4ead3;white-space:nowrap}
.field-caption button{pointer-events:auto;background:transparent;color:inherit;border:1px solid #bca26b;padding:7px 12px;cursor:pointer}
.spirit-current{position:absolute;left:42%;top:35%;width:23%;height:39%;transform:rotate(-15deg)}
.spirit-current i{position:absolute;inset:0;border:2px solid #b6e9d477;border-radius:50%;box-shadow:0 0 20px #9ee6cb22;animation:qi-current 3s ease-in-out infinite}.spirit-current i:nth-child(2){inset:12%;animation-delay:-1s}.spirit-current i:nth-child(3){inset:24%;animation-delay:-2s}
@keyframes qi-breathe{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes qi-material{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes qi-current{50%{opacity:.35;transform:scale(.9)}}
.qi-paused *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.qi-field *{animation:none!important}}
@media(max-width:900px){.qi-action-actor{width:143px;height:190px}.field-material{bottom:48%}.field-caption{bottom:46%;left:45%;max-width:85%;white-space:normal}}
</style>
