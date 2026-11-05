<script setup lang="ts">
import {foundationSpeakerFoot} from "../scene2d/actor-anchors";
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { State } from '../world';
import { challenges } from './content';
import WalkingActor from '../scene2d/WalkingActor.vue';
import { useSceneApproach } from '../scene2d/use-scene-approach';
import { foundationArrivalPoint } from './scene-approach';
import type { Point } from '../scene2d/navigation';
import { heroArt, itemArt } from '../presentation/art';
import { foundationSiteState, foundationCompanionPresent, foundationSceneSnapshot, foundationSceneTransition, foundationPerformanceFrames, type FoundationPerformance } from './scene-performance';
const props=defineProps<{game:State;mode:string}>();
const emit=defineEmits<{start:[]}>();
const walkReady=ref(false);
const approach=useSceneApproach({animated:()=>walkReady.value && props.game.social.gender==='male',initial:foundationArrivalPoint('home',props.game.foundationJourney.location)});
const {position,moving,frame:walkFrame,facing}=approach;
function approachObject(point:Point,arrived:()=>void){skip();approach.walkTo(point,arrived);}
function cancelMovement(){approach.cancel();}
watch(()=>props.game,()=>approach.cancel());
watch([()=>props.game.foundationJourney.location,()=>props.mode],([next],[previous])=>approach.reset(next!==previous ? foundationArrivalPoint(previous,next) : {x:24,y:88}));
const root=ref<HTMLElement>();
const sequence=ref<FoundationPerformance>();
const index=ref(0);
let timer:ReturnType<typeof setTimeout>|undefined;
let media:MediaQueryList|undefined;
let revision=0;
const frame=computed(()=>sequence.value ? foundationPerformanceFrames[sequence.value][index.value] : undefined);
const arrayBattle=computed(()=>{const id=props.game.foundationJourney.duel?.id;return id && ['estate','snow','application','culmination'].includes(id) ? challenges[id].foe : '';});
const site=computed(()=>foundationSiteState(props.game,props.mode));
const companion=computed(()=>foundationCompanionPresent(props.game,props.mode));
const companionPose=computed(()=>frame.value?.companion || (props.game.foundationJourney.heroine.map==='none' ? 'work':'travel'));
const propArt=computed(()=> {
  const key=frame.value?.prop;
  return key ? itemArt(key==='manual' ? props.game.foundationJourney.inheritance : key) : undefined;
});
function skip(){revision++;if(timer!==undefined)clearTimeout(timer);timer=undefined;sequence.value=undefined;index.value=0;}
function play(kind:FoundationPerformance){
  skip();approach.cancel();
  if(media?.matches || document.hidden)return;
  sequence.value=kind;emit('start');
  const token=revision;
  function step(){timer=setTimeout(()=>{if(token!==revision)return;index.value++;if(index.value>=foundationPerformanceFrames[kind].length)skip();else step();},850);}
  step();
}
let saved=foundationSceneSnapshot(props.game);
watch(()=>foundationSceneSnapshot(props.game), next=>{
  const kind=foundationSceneTransition(saved,next);saved=next;
  if(next.duel){skip();return;}
  if(kind && props.mode==='journey')play(kind);else skip();
});
watch(()=>props.mode,skip);
function keyboard(e:KeyboardEvent){if(e.key==='Escape' && sequence.value && root.value?.getClientRects().length){skip();e.preventDefault();}}
function visibility(){if(document.hidden)skip();}
function reduce(){if(media?.matches)skip();}
onMounted(()=>{media=window.matchMedia?.('(prefers-reduced-motion: reduce)');media?.addEventListener('change',reduce);window.addEventListener('keydown',keyboard,true);document.addEventListener('visibilitychange',visibility);});
onBeforeUnmount(()=>{skip();media?.removeEventListener('change',reduce);window.removeEventListener('keydown',keyboard,true);document.removeEventListener('visibilitychange',visibility);});
defineExpose({skip,approachObject,cancelMovement});
</script>
<template>
  <div ref="root" class="foundation-world" :data-performance="sequence" :data-phase="index">
    <div v-if="game.secretPact.site === 'away' && site.estate" class="estate-channel site-result" role="img" aria-label="老根下已露出的育苗细渠与木签"><i></i><i></i><i></i><b></b><b></b></div>
    <div v-if="game.secretPact.site === 'away' && site.snow" class="snow-guide site-result" role="img" aria-label="已经试通的西门绳槽留引"><i></i><i></i><i></i><span></span></div>
    <div v-if="game.secretPact.site === 'away' && site.well" class="well-opening site-result" role="img" aria-label="石偶身后亮起的传承室入口"><span></span></div>
    <div v-if="game.secretPact.site === 'away' && site.circulation" class="settled-circulation site-result" role="img" aria-label="归于平稳的古道周天灵流"><i></i><i></i><i></i></div>
    <div v-if="arrayBattle" class="battle-array" role="img" :aria-label="arrayBattle+'的阵纹'"><i></i><i></i><i></i><span></span></div>
    <template v-if="!game.foundationJourney.duel">
    <WalkingActor class="foundation-player" :character="heroArt(game.social.gender,game.realm)" :pose="frame?.pose || 'idle'" :label="game.name" :position="position" :moving="moving" :frame="walkFrame" :facing="facing" sheet="/art/scene2d/foundation-walk/hero-male-v1.png" @ready="walkReady=$event" />
    <img v-if="companion" class="foundation-companion" :style="{left:foundationSpeakerFoot.x+'%',bottom:(100-foundationSpeakerFoot.y)+'%'}" :src="`/art/companionship/shentinglan-${companionPose}.webp`" :alt="game.foundationJourney.heroine.meeting==='none' ? '青嶂勘路人正在测路' : '苏婉宁在现场'" />
    <div v-if="sequence && frame?.prop" class="performance-prop" :style="{left:(position.x+8)+'%'}" :class="[`prop-${frame?.prop}`,`phase-${index}`]" aria-hidden="true">
      <span class="prop-halo"></span><img v-if="propArt" :src="propArt" alt="" />
    </div>
    <div v-if="sequence==='supply' || (mode==='journey' && game.foundationJourney.location==='frontier' && game.foundationJourney.heroine.supplied && game.foundationJourney.rescue<4)" class="rescue-line" aria-label="已送达补给的归绳"><span></span></div>
    <div v-if="moving" class="performance-caption" role="status"><span>正走向选定的位置</span><button @click="approach.skip">直接抵达</button><button @click="approach.cancel">停步</button></div>
    <div v-if="frame" class="performance-caption" role="status"><span>{{frame.label}}</span><button @click="skip">跳过演出</button></div>
    </template>
  </div>
</template>
<style scoped>
.foundation-world {position:absolute;inset:0;pointer-events:none;--field-actor-height:clamp(260px,32vh,380px);}
.site-result {position:absolute;pointer-events:none;}
.estate-channel {left:61%;bottom:12%;width:14%;height:5%;transform:rotate(9deg);background:radial-gradient(ellipse,#bbd7cc28,transparent 70%);}
.estate-channel i {position:absolute;left:10%;top:50%;width:30%;height:2px;background:linear-gradient(90deg,transparent,#d1e4d348,transparent);border-radius:50%;}
.estate-channel i:nth-child(2){left:40%;top:64%;width:32%;}.estate-channel i:nth-child(3){left:55%;top:34%;width:20%;}
.estate-channel b {position:absolute;left:-12%;bottom:90%;width:5px;height:12px;background:linear-gradient(90deg,#685a3e,#a9966e,#706044);transform:rotate(-14deg);box-shadow:1px 2px 2px #161f1999;}
.estate-channel b:last-child {left:-3%;bottom:110%;height:9px;transform:rotate(8deg);}
.snow-guide {left:35%;bottom:20%;width:8%;height:3%;transform:rotate(-12deg);filter:drop-shadow(0 2px 1px #17201b99);}
.snow-guide span {position:absolute;left:3%;right:2%;bottom:30%;height:2px;background:linear-gradient(90deg,#8b7960,#b3a184,#8c7b62);border-radius:50%;transform:rotate(2deg);}
.snow-guide i {position:absolute;bottom:0;left:0;width:4px;height:12px;background:linear-gradient(90deg,#665b4c,#9e9076,#645a4b);transform:rotate(-9deg);}
.snow-guide i:nth-child(2){left:50%;height:9px;}.snow-guide i:nth-child(3){left:100%;height:11px;}
.well-opening {left:56%;bottom:22%;width:13%;height:31%;border:10px ridge #7d827b;border-bottom:0;border-radius:45% 45% 0 0;background:radial-gradient(ellipse at bottom,#e8d9a7bb,#52665d99 48%,#11211cf0 85%);box-shadow:0 0 36px #bce9bd35,inset 0 0 22px #000a;}
.well-opening span {position:absolute;left:-20%;right:-20%;bottom:-20%;height:20%;background:repeating-linear-gradient(#8d978b 0 4px,#363d34 5px 10px);transform:perspective(80px) rotateX(35deg);}
.settled-circulation {left:42%;bottom:18%;width:31%;height:16%;}
.settled-circulation i {position:absolute;inset:0;border:2px solid #c4d7b08c;border-radius:50%;box-shadow:0 0 12px #afc9ac33;}
.settled-circulation i:nth-child(2){inset:18%;}.settled-circulation i:nth-child(3){inset:36%;}
.battle-array {position:absolute;left:58%;top:47%;width:20%;height:17%;filter:drop-shadow(0 0 10px #bdddc33b);pointer-events:none;}
.battle-array i {position:absolute;inset:0;border:2px solid #c1d5acb8;border-radius:50%;background:radial-gradient(ellipse,#b1d2b51a,transparent 70%);}
.battle-array i:nth-child(2){inset:18%;border-style:dashed;transform:rotate(-8deg);}
.battle-array i:nth-child(3){inset:34%;border-color:#d8d9b9a8;}
.battle-array span {position:absolute;left:34%;top:29%;width:32%;height:42%;border:1px solid #d5e0bb99;transform:rotate(12deg);}
.battle-array b {position:absolute;left:50%;top:-24%;transform:translateX(-50%);white-space:nowrap;font-weight:400;font-size:14px;color:#f0e5c7;text-shadow:0 2px 4px #07150d;background:#12281cbb;padding:3px 9px;border-bottom:1px solid #baaa7e88;}
.foundation-player {z-index:2;width:calc(var(--field-actor-height) * .75);height:var(--field-actor-height);}
.foundation-companion {position:absolute;transform:translateX(-50%);left:38%;bottom:12%;width:calc(var(--field-actor-height) * .75);height:var(--field-actor-height);object-fit:contain;object-position:bottom;filter:drop-shadow(0 14px 12px #0009);}
.performance-prop {position:absolute;left:29%;bottom:24%;width:90px;height:90px;display:grid;place-items:center;}
.performance-prop img {position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 6px #000a);}
.prop-halo {position:absolute;inset:-15px;border:1px solid #dfd5a3aa;border-radius:50%;background:radial-gradient(ellipse,#d7d6a02e,transparent 70%);animation:light-breathe 850ms ease-in-out alternate infinite;}
.prop-map {bottom:32%;width:100px;height:100px;transition:transform 350ms ease,opacity 350ms ease;}
.prop-map.phase-0 {transform:rotate(-12deg) scale(.85);}
.prop-map.phase-1 {transform:rotate(0) scale(1.05);}
.prop-map.phase-2 {transform:translateY(16px) rotate(8deg) scale(.7);opacity:.75;}
.rescue-line {position:absolute;left:32%;right:22%;bottom:19%;height:30px;border-bottom:3px solid #af9160;transform:rotate(-7deg);filter:drop-shadow(0 3px 2px #000);}
.rescue-line span {display:block;width:20px;height:20px;background:#e5d3a6;border:3px double #5c452a;transform:rotate(45deg);margin:15px 0 0 65%;}
.performance-caption {position:absolute;left:25%;bottom:4%;display:flex;align-items:center;gap:24px;padding:10px 18px;background:#0b231eee;border:1px solid #bfa673;color:#f4e7ca;pointer-events:auto;z-index:4;}
.performance-caption button {background:transparent;color:inherit;border:1px solid #a99770;padding:8px 12px;min-height:40px;cursor:pointer;}
@keyframes light-breathe {from {opacity:.35;transform:scale(.9);}to {opacity:1;transform:scale(1.1);}}
@media(prefers-reduced-motion:reduce){.prop-halo {animation:none;}.prop-map {transition:none;}}
@media(max-width:900px){.foundation-world {--field-actor-height:190px;}}
</style>
